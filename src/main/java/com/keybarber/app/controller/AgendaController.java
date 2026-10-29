package com.keybarber.app.controller;

import com.keybarber.app.dto.DisponibilidadResponse;
import com.keybarber.app.model.BloqueoHorario;
import com.keybarber.app.model.ConfiguracionAgenda;
import com.keybarber.app.repository.BloqueoHorarioRepository;
import com.keybarber.app.repository.ConfiguracionAgendaRepository;
import com.keybarber.app.service.AgendaService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/agenda")
public class AgendaController {

    private final AgendaService agendaService;
    private final BloqueoHorarioRepository bloqueoRepository;
    private final ConfiguracionAgendaRepository configuracionAgendaRepository;

    public AgendaController(
            AgendaService agendaService,
            BloqueoHorarioRepository bloqueoRepository,
            ConfiguracionAgendaRepository configuracionAgendaRepository) {
        this.agendaService = agendaService;
        this.bloqueoRepository = bloqueoRepository;
        this.configuracionAgendaRepository = configuracionAgendaRepository;
    }

    @GetMapping
    public ResponseEntity<ConfiguracionAgenda> obtenerConfiguracionAgenda() {
        ConfiguracionAgenda config = configuracionAgendaRepository.findById("principal")
                .orElseGet(() -> configuracionAgendaRepository.save(new ConfiguracionAgenda()));
        return ResponseEntity.ok(config);
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> actualizarConfiguracionAgenda(@RequestBody ConfiguracionAgenda config) {
        if (config.getDiasLaborales() == null || config.getDiasLaborales().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", "Debes seleccionar al menos un día laboral habitual."));
        }
        if (config.getHorarios() == null || config.getHorarios().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", "Debes configurar al menos un turno de atención."));
        }

        config.setId("principal");
        config.setDiasLaborales(config.getDiasLaborales().stream().distinct().sorted().toList());
        config.setHorarios(config.getHorarios().stream().distinct().toList());
        ConfiguracionAgenda guardada = configuracionAgendaRepository.save(config);
        return ResponseEntity.ok(guardada);
    }

    @GetMapping("/disponibilidad")
    public ResponseEntity<DisponibilidadResponse> consultarDisponibilidad(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(defaultValue = "CUALQUIERA") String barberoId,
            @RequestParam(defaultValue = "30") int duracionMinutos) {
        return ResponseEntity.ok(agendaService.consultarDisponibilidad(fecha, barberoId, duracionMinutos));
    }

    @GetMapping("/bloqueos")
    @PreAuthorize("hasAnyRole('ADMIN', 'BARBERO')")
    public ResponseEntity<List<BloqueoHorario>> listarBloqueos(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        if (fechaInicio == null && fechaFin == null) {
            return ResponseEntity.ok(bloqueoRepository.findAll());
        }
        if (fechaInicio != null && (fechaFin == null || fechaInicio.equals(fechaFin))) {
            return ResponseEntity.ok(bloqueoRepository.findByFecha(fechaInicio));
        }
        LocalDate fin = fechaFin != null ? fechaFin : fechaInicio.plusDays(7);
        return ResponseEntity.ok(bloqueoRepository.findByFechaBetweenOrderByFechaAscHoraInicioAsc(fechaInicio.minusDays(1), fin.plusDays(1)));
    }

    @PostMapping("/bloqueos")
    @PreAuthorize("hasAnyRole('ADMIN', 'BARBERO')")
    public ResponseEntity<BloqueoHorario> crearBloqueo(@RequestBody BloqueoHorario bloqueo) {
        return ResponseEntity.ok(bloqueoRepository.save(bloqueo));
    }

    @DeleteMapping("/bloqueos/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BARBERO')")
    public ResponseEntity<Void> eliminarBloqueo(@PathVariable String id) {
        bloqueoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
