package com.keybarber.app.controller;

import com.keybarber.app.dto.CitaPublicaRequest;
import com.keybarber.app.model.Cita;
import com.keybarber.app.service.CitaService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/citas")
public class CitaController {

    private final CitaService citaService;

    public CitaController(CitaService citaService) {
        this.citaService = citaService;
    }

    // Endpoint público para que los clientes agenden su cita
    @PostMapping("/publica")
    public ResponseEntity<Cita> agendarCita(@Valid @RequestBody CitaPublicaRequest request) {
        return ResponseEntity.ok(citaService.crearCitaPublica(request));
    }

    // Endpoint público para consultar estado de cita por código
    @GetMapping("/consultar/{codigo}")
    public ResponseEntity<Cita> consultarPorCodigo(@PathVariable String codigo) {
        return ResponseEntity.ok(citaService.obtenerPorCodigo(codigo));
    }

    // Consultar historial de citas por teléfono
    @GetMapping("/telefono/{telefono}")
    public ResponseEntity<List<Cita>> consultarPorTelefono(@PathVariable String telefono) {
        return ResponseEntity.ok(citaService.buscarPorTelefono(telefono));
    }

    // Endpoints protegidos para Admin y Barberos
    @GetMapping("/rango")
    @PreAuthorize("hasAnyRole('ADMIN', 'BARBERO')")
    public ResponseEntity<List<Cita>> listarPorRango(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin,
            @RequestParam(required = false) String barberoId) {
        return ResponseEntity.ok(citaService.listarCitasPorRango(inicio, fin, barberoId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BARBERO')")
    public ResponseEntity<Cita> obtenerPorId(@PathVariable String id) {
        return ResponseEntity.ok(citaService.obtenerPorId(id));
    }

    @GetMapping("/historial")
    @PreAuthorize("hasAnyRole('ADMIN', 'BARBERO')")
    public ResponseEntity<List<Cita>> listarHistorial(
            @RequestParam(required = false, defaultValue = "COMPLETADA") String estado) {
        return ResponseEntity.ok(citaService.listarHistorial(estado));
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('ADMIN', 'BARBERO')")
    public ResponseEntity<Cita> cambiarEstado(@PathVariable String id, @RequestBody Map<String, String> body) {
        String nuevoEstado = body.get("estado");
        return ResponseEntity.ok(citaService.cambiarEstado(id, nuevoEstado));
    }

    @PostMapping("/{id}/cancelar")
    @PreAuthorize("hasAnyRole('ADMIN', 'BARBERO')")
    public ResponseEntity<Void> cancelarCita(@PathVariable String id, @RequestBody(required = false) Map<String, String> body) {
        String motivo = body != null ? body.get("motivo") : null;
        citaService.cancelarCita(id, motivo);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminarCita(@PathVariable String id) {
        citaService.eliminarCita(id);
        return ResponseEntity.noContent().build();
    }
}

