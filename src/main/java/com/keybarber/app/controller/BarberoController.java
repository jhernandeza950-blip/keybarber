package com.keybarber.app.controller;

import com.keybarber.app.model.Barbero;
import com.keybarber.app.service.BarberoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/barberos")
public class BarberoController {

    private final BarberoService barberoService;

    public BarberoController(BarberoService barberoService) {
        this.barberoService = barberoService;
    }

    @GetMapping
    public ResponseEntity<List<Barbero>> listarActivos() {
        return ResponseEntity.ok(barberoService.listarActivos());
    }

    @GetMapping("/todos")
    public ResponseEntity<List<Barbero>> listarTodos() {
        return ResponseEntity.ok(barberoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Barbero> obtenerPorId(@PathVariable String id) {
        return ResponseEntity.ok(barberoService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<Barbero> crear(@RequestBody Barbero barbero) {
        return ResponseEntity.ok(barberoService.guardar(barbero));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Barbero> actualizar(@PathVariable String id, @RequestBody Barbero barbero) {
        return ResponseEntity.ok(barberoService.actualizar(id, barbero));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        barberoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}

