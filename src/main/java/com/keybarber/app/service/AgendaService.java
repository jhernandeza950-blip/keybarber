package com.keybarber.app.service;

import com.keybarber.app.dto.DisponibilidadResponse;
import com.keybarber.app.model.Barbero;
import com.keybarber.app.model.BloqueoHorario;
import com.keybarber.app.model.ConfiguracionAgenda;
import com.keybarber.app.repository.BloqueoHorarioRepository;
import com.keybarber.app.repository.CitaRepository;
import com.keybarber.app.repository.ConfiguracionAgendaRepository;
import com.keybarber.app.util.HorarioUtil;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class AgendaService {

    private final BarberoService barberoService;
    private final CitaRepository citaRepository;
    private final BloqueoHorarioRepository bloqueoRepository;
    private final ConfiguracionAgendaRepository configuracionAgendaRepository;

    public AgendaService(
            BarberoService barberoService,
            CitaRepository citaRepository,
            BloqueoHorarioRepository bloqueoRepository,
            ConfiguracionAgendaRepository configuracionAgendaRepository) {
        this.barberoService = barberoService;
        this.citaRepository = citaRepository;
        this.bloqueoRepository = bloqueoRepository;
        this.configuracionAgendaRepository = configuracionAgendaRepository;
    }

    public DisponibilidadResponse consultarDisponibilidad(LocalDate fecha, String barberoId, int duracionMinutos) {
        if (fecha.isBefore(LocalDate.now())) {
            return new DisponibilidadResponse(fecha, barberoId, "", duracionMinutos, Collections.emptyList());
        }

        ConfiguracionAgenda configAgenda = configuracionAgendaRepository.findById("principal")
                .orElseGet(ConfiguracionAgenda::new);

        // Verificar si la barbería abre este día de la semana (1=Lun .. 6=Sáb, 0=Dom o 7=Dom)
        int diaSemana = fecha.getDayOfWeek().getValue() == 7 ? 0 : fecha.getDayOfWeek().getValue();
        boolean diaLaboralBarberia = configAgenda.getDiasLaborales().contains(diaSemana)
                || configAgenda.getDiasLaborales().contains(fecha.getDayOfWeek().getValue());

        if (!diaLaboralBarberia) {
            return new DisponibilidadResponse(fecha, barberoId, "", duracionMinutos, Collections.emptyList());
        }

        // Si es "CUALQUIERA", unimos la disponibilidad de todos los barberos activos
        if ("CUALQUIERA".equalsIgnoreCase(barberoId)) {
            List<Barbero> barberos = barberoService.listarActivos();
            Set<String> todosHorarios = new LinkedHashSet<>();

            for (Barbero b : barberos) {
                List<String> horas = calcularHorasLibresBarbero(fecha, b, duracionMinutos, configAgenda);
                todosHorarios.addAll(horas);
            }

            // Ordenar por hora real del día
            List<String> listaOrdenada = new ArrayList<>(todosHorarios);
            listaOrdenada.sort(Comparator.comparing(HorarioUtil::parseLocalTime));

            return new DisponibilidadResponse(
                    fecha,
                    "CUALQUIERA",
                    "Cualquier Barbero Disponible",
                    duracionMinutos,
                    listaOrdenada
            );
        }

        // Barbero específico
        Barbero barbero = barberoService.obtenerPorId(barberoId);
        List<String> horasLibres = calcularHorasLibresBarbero(fecha, barbero, duracionMinutos, configAgenda);

        return new DisponibilidadResponse(
                fecha,
                barbero.getId(),
                barbero.getNombre(),
                duracionMinutos,
                horasLibres
        );
    }

    public List<String> calcularHorasLibresBarbero(LocalDate fecha, Barbero barbero, int duracionMinutos, ConfiguracionAgenda configAgenda) {
        // 1. Verificar si el barbero trabaja este día (1=Lun .. 6=Sáb, 0=Dom o 7=Dom)
        int diaSemana = fecha.getDayOfWeek().getValue() == 7 ? 0 : fecha.getDayOfWeek().getValue();
        boolean barberoTrabaja = barbero.getDiasLaborales().contains(diaSemana)
                || barbero.getDiasLaborales().contains(fecha.getDayOfWeek().getValue());

        if (!barberoTrabaja) {
            return Collections.emptyList();
        }

        // 2. Horario laboral del barbero
        LocalTime apertura = HorarioUtil.parseLocalTime(barbero.getHoraInicio());
        LocalTime cierre = HorarioUtil.parseLocalTime(barbero.getHoraFin());

        LocalTime pausaInicio = (barbero.getPausaInicio() != null && !barbero.getPausaInicio().isBlank())
                ? HorarioUtil.parseLocalTime(barbero.getPausaInicio()) : null;
        LocalTime pausaFin = (barbero.getPausaFin() != null && !barbero.getPausaFin().isBlank())
                ? HorarioUtil.parseLocalTime(barbero.getPausaFin()) : null;

        // 3. Citas ocupadas del barbero en esta fecha
        LocalDateTime inicioDia = fecha.atStartOfDay();
        LocalDateTime finDia = fecha.atTime(LocalTime.MAX);
        List<CitaRepository.BarberoCitaProjection> citas = citaRepository
                .findByBarberoIdAndFechaHoraInicioBetweenAndEstadoNot(barbero.getId(), inicioDia, finDia, "CANCELADA");

        // 4. Bloqueos manuales de agenda
        List<BloqueoHorario> bloqueos = bloqueoRepository.findByFecha(fecha);

        // 5. Tomar los turnos configurados por el administrador
        List<String> turnosBase = configAgenda.getHorarios();
        if (turnosBase == null || turnosBase.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> slotsValidos = new ArrayList<>();
        LocalTime ahora = LocalTime.now();
        boolean esHoy = fecha.isEqual(LocalDate.now());

        for (String slotStr : turnosBase) {
            LocalTime slotInicio = HorarioUtil.parseLocalTime(slotStr);
            LocalTime slotFin = slotInicio.plusMinutes(duracionMinutos);

            // Validar que el turno caiga dentro del turno del barbero
            if (slotInicio.isBefore(apertura) || slotFin.isAfter(cierre)) {
                continue;
            }

            // Si es hoy, excluir turnos pasados con margen de 10 minutos
            if (esHoy && slotInicio.isBefore(ahora.plusMinutes(10))) {
                continue;
            }

            // Validar si choca con la pausa de descanso / almuerzo
            if (pausaInicio != null && pausaFin != null) {
                if (HorarioUtil.seTraslapanHoras(slotInicio, slotFin, pausaInicio, pausaFin)) {
                    continue;
                }
            }

            // Validar bloqueos manuales
            boolean bloqueado = false;
            for (BloqueoHorario b : bloqueos) {
                if (b.getBarberoId() == null || b.getBarberoId().equals("TODOS") || b.getBarberoId().equals(barbero.getId())) {
                    if (HorarioUtil.seTraslapanHoras(slotInicio, slotFin, b.getHoraInicio(), b.getHoraFin())) {
                        bloqueado = true;
                        break;
                    }
                }
            }
            if (bloqueado) continue;

            // Validar colisión con citas agendadas
            LocalDateTime slotFechaHoraInicio = fecha.atTime(slotInicio);
            LocalDateTime slotFechaHoraFin = fecha.atTime(slotFin);
            boolean chocaConCita = false;

            for (CitaRepository.BarberoCitaProjection c : citas) {
                if (HorarioUtil.seTraslapan(slotFechaHoraInicio, slotFechaHoraFin, c.getFechaHoraInicio(), c.getFechaHoraFin())) {
                    chocaConCita = true;
                    break;
                }
            }

            if (!chocaConCita) {
                slotsValidos.add(slotStr);
            }
        }

        return slotsValidos;
    }

    public Optional<Barbero> encontrarBarberoDisponible(LocalDate fecha, LocalTime horaInicio, int duracionMinutos) {
        List<Barbero> barberos = barberoService.listarActivos();
        ConfiguracionAgenda configAgenda = configuracionAgendaRepository.findById("principal")
                .orElseGet(ConfiguracionAgenda::new);

        for (Barbero b : barberos) {
            List<String> disponibles = calcularHorasLibresBarbero(fecha, b, duracionMinutos, configAgenda);
            for (String dispStr : disponibles) {
                if (HorarioUtil.parseLocalTime(dispStr).equals(horaInicio)) {
                    return Optional.of(b);
                }
            }
        }
        return Optional.empty();
    }
}
