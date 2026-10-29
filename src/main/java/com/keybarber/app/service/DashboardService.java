
package com.keybarber.app.service;

import com.keybarber.app.dto.DashboardMetricasDTO;
import com.keybarber.app.model.Cita;
import com.keybarber.app.repository.CitaRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final CitaRepository citaRepository;

    public DashboardService(CitaRepository citaRepository) {
        this.citaRepository = citaRepository;
    }

    public DashboardMetricasDTO obtenerMetricas() {
        LocalDate hoy = LocalDate.now();
        LocalDateTime inicioHoy = hoy.atStartOfDay();
        LocalDateTime finHoy = hoy.atTime(LocalTime.MAX);

        LocalDate lunes = hoy.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate domingo = hoy.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        LocalDateTime inicioSemana = lunes.atStartOfDay();
        LocalDateTime finSemana = domingo.atTime(LocalTime.MAX);

        List<Cita> citasHoy = citaRepository.findByFechaHoraInicioBetweenOrderByFechaHoraInicioAsc(inicioHoy, finHoy);
        List<Cita> citasSemana = citaRepository.findByFechaHoraInicioBetweenOrderByFechaHoraInicioAsc(inicioSemana,
                finSemana);

        DashboardMetricasDTO metricas = new DashboardMetricasDTO();
        metricas.setCitasHoy(citasHoy.size());

        long pendientesHoy = citasHoy.stream().filter(
                c -> "CONFIRMADA".equalsIgnoreCase(c.getEstado()) || "PENDIENTE".equalsIgnoreCase(c.getEstado()))
                .count();
        long completadasHoy = citasHoy.stream().filter(c -> "COMPLETADA".equalsIgnoreCase(c.getEstado())).count();
        metricas.setCitasPendientesHoy(pendientesHoy);
        metricas.setCitasCompletadasHoy(completadasHoy);

        BigDecimal ingresosHoy = citasHoy.stream()
                .filter(c -> "COMPLETADA".equalsIgnoreCase(c.getEstado()))
                .map(Cita::getPrecioTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        metricas.setIngresosHoy(ingresosHoy);

        metricas.setCitasSemana(citasSemana.size());
        BigDecimal ingresosSemana = citasSemana.stream()
                .filter(c -> "COMPLETADA".equalsIgnoreCase(c.getEstado()))
                .map(Cita::getPrecioTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        metricas.setIngresosSemana(ingresosSemana);

        Map<String, Long> citasPorEstado = new HashMap<>();
        Map<String, Long> citasPorBarbero = new HashMap<>();

        for (Cita c : citasSemana) {
            citasPorEstado.put(c.getEstado(), citasPorEstado.getOrDefault(c.getEstado(), 0L) + 1);
            String barbero = c.getBarberoNombre() != null ? c.getBarberoNombre() : "Sin asignar";
            citasPorBarbero.put(barbero, citasPorBarbero.getOrDefault(barbero, 0L) + 1);
        }

        metricas.setCitasPorEstado(citasPorEstado);
        metricas.setCitasPorBarbero(citasPorBarbero);

        return metricas;
    }
}
