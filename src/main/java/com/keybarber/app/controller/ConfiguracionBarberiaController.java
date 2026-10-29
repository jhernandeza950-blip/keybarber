package com.keybarber.app.controller;

import com.keybarber.app.model.ConfiguracionBarberia;
import com.keybarber.app.repository.ConfiguracionBarberiaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/configuracion")
public class ConfiguracionBarberiaController {

    private final ConfiguracionBarberiaRepository repository;

    public ConfiguracionBarberiaController(ConfiguracionBarberiaRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<ConfiguracionBarberia> obtener() {
        return ResponseEntity.ok(repository.findById("GLOBAL")
                .orElseGet(ConfiguracionBarberia::new));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ConfiguracionBarberia> actualizar(@RequestBody ConfiguracionBarberia nueva) {
        nueva.setId("GLOBAL");
        return ResponseEntity.ok(repository.save(nueva));
    }
}

