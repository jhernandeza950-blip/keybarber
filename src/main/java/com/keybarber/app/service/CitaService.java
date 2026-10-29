package com.keybarber.app.service;

import com.keybarber.app.dto.CitaPublicaRequest;
import com.keybarber.app.exception.BadRequestException;
import com.keybarber.app.exception.ResourceNotFoundException;
import com.keybarber.app.model.Barbero;
import com.keybarber.app.model.Cita;
import com.keybarber.app.model.Servicio;
import com.keybarber.app.repository.CitaRepository;
import com.keybarber.app.util.HorarioUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class CitaService {

    private final CitaRepository citaRepository;
    private final BarberoService barberoService;
    private final ServicioService servicioService;
    private final AgendaService agendaService;
    private final SecureRandom random = new SecureRandom();

    public CitaService(
            CitaRepository citaRepository,
            BarberoService barberoService,
            ServicioService servicioService,
            AgendaService agendaService) {
        this.citaRepository = citaRepository;
        this.barberoService = barberoService;
        this.servicioService = servicioService;
        this.agendaService = agendaService;
    }

    @Transactional
    public Cita crearCitaPublica(CitaPublicaRequest request) {
        if (request.getFechaHoraInicio().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("No puedes reservar en una fecha u hora pasada.");
        }

        // 1. Obtener y validar servicios
        List<Servicio> servicios = servicioService.obtenerVariosPorIds(request.getServicioIds());
        if (servicios.isEmpty()) {
            throw new BadRequestException("Debes seleccionar al menos un servicio válido.");
        }

        int duracionTotal = servicios.stream().mapToInt(Servicio::getDuracionMinutos).sum();
        BigDecimal precioTotal = servicios.stream()
                .map(Servicio::getPrecio)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        LocalDateTime inicio = request.getFechaHoraInicio();
        LocalDateTime fin = inicio.plusMinutes(duracionTotal);

        // 2. Determinar barbero (Específico o "CUALQUIERA")
        Barbero barbero;
        if ("CUALQUIERA".equalsIgnoreCase(request.getBarberoId())) {
            barbero = agendaService.encontrarBarberoDisponible(inicio.toLocalDate(), inicio.toLocalTime(), duracionTotal)
                    .orElseThrow(() -> new BadRequestException("No hay barberos disponibles en el horario seleccionado. Por favor elige otro horario."));
        } else {
            barbero = barberoService.obtenerPorId(request.getBarberoId());
            // Validar traslape
            List<CitaRepository.BarberoCitaProjection> existentes = citaRepository
                    .findByBarberoIdAndFechaHoraInicioBetweenAndEstadoNot(
                            barbero.getId(),
                            inicio.toLocalDate().atStartOfDay(),
                            inicio.toLocalDate().atTime(LocalTime.MAX),
                            "CANCELADA"
                    );

            for (CitaRepository.BarberoCitaProjection exist : existentes) {
                if (HorarioUtil.seTraslapan(inicio, fin, exist.getFechaHoraInicio(), exist.getFechaHoraFin())) {
                    throw new BadRequestException("El barbero seleccionado ya tiene una cita agendada en ese horario. Por favor elige otra hora.");
                }
            }
        }

        // 3. Crear cita
        Cita cita = new Cita();
        cita.setCodigo(generarCodigoUnico());
        cita.setClienteNombre(request.getClienteNombre().trim());
        cita.setClienteTelefono(request.getClienteTelefono().trim());
        cita.setClienteEmail(request.getClienteEmail() != null ? request.getClienteEmail().trim() : null);

        cita.setBarberoId(barbero.getId());
        cita.setBarberoNombre(barbero.getNombre());

        cita.setServicioIds(servicios.stream().map(Servicio::getId).toList());
        cita.setServiciosNombres(servicios.stream().map(Servicio::getNombre).toList());

        cita.setFechaHoraInicio(inicio);
        cita.setFechaHoraFin(fin);
        cita.setDuracionTotalMinutos(duracionTotal);
        cita.setPrecioTotal(precioTotal);

        cita.setEstado("CONFIRMADA");
        cita.setNotas(request.getNotas());

        return citaRepository.save(cita);
    }

    public Cita obtenerPorId(String id) {
        return citaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada con ID: " + id));
    }

    public Cita obtenerPorCodigo(String codigo) {
        return citaRepository.findByCodigoIgnoreCase(codigo)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró ninguna cita con el código: " + codigo));
    }

    public List<Cita> buscarPorTelefono(String telefono) {
        return citaRepository.findByClienteTelefonoOrderByFechaHoraInicioDesc(telefono);
    }

    public List<Cita> listarCitasPorRango(LocalDateTime start, LocalDateTime end, String barberoId) {
        if (barberoId != null && !barberoId.isBlank() && !"TODOS".equalsIgnoreCase(barberoId)) {
            return citaRepository.findByBarberoIdAndFechaHoraInicioBetweenOrderByFechaHoraInicioAsc(barberoId, start, end);
        }
        return citaRepository.findByFechaHoraInicioBetweenOrderByFechaHoraInicioAsc(start, end);
    }

    public List<Cita> listarHistorial(String estado) {
        if (estado != null && !estado.isBlank() && !"TODOS".equalsIgnoreCase(estado)) {
            return citaRepository.findByEstadoOrderByFechaHoraInicioDesc(estado.toUpperCase());
        }
        return citaRepository.findAllByOrderByFechaHoraInicioDesc();
    }

    public Cita cambiarEstado(String id, String nuevoEstado) {
        Cita cita = obtenerPorId(id);
        cita.setEstado(nuevoEstado.toUpperCase());
        return citaRepository.save(cita);
    }

    public void cancelarCita(String id, String motivo) {
        Cita cita = obtenerPorId(id);
        cita.setEstado("CANCELADA");
        if (motivo != null && !motivo.isBlank()) {
            cita.setNotas((cita.getNotas() != null ? cita.getNotas() + " | " : "") + "Cancelada: " + motivo);
        }
        citaRepository.save(cita);
    }

    public void eliminarCita(String id) {
        if (!citaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Cita no encontrada con ID: " + id);
        }
        citaRepository.deleteById(id);
    }

    private String generarCodigoUnico() {
        String codigo;
        do {
            int num = 1000 + random.nextInt(9000);
            codigo = "KB-" + num;
        } while (citaRepository.findByCodigoIgnoreCase(codigo).isPresent());
        return codigo;
    }
}

