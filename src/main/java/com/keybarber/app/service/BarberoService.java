package com.keybarber.app.service;

import com.keybarber.app.exception.ResourceNotFoundException;
import com.keybarber.app.model.Barbero;
import com.keybarber.app.repository.BarberoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BarberoService {

    private final BarberoRepository barberoRepository;

    public BarberoService(BarberoRepository barberoRepository) {
        this.barberoRepository = barberoRepository;
    }

    public List<Barbero> listarActivos() {
        return barberoRepository.findByActivoTrueOrderByOrdenAsc();
    }

    public List<Barbero> listarTodos() {
        return barberoRepository.findAllByOrderByOrdenAsc();
    }

    public Barbero obtenerPorId(String id) {
        return barberoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Barbero no encontrado con ID: " + id));
    }

    public Barbero guardar(Barbero barbero) {
        return barberoRepository.save(barbero);
    }

    public Barbero actualizar(String id, Barbero datos) {
        Barbero barbero = obtenerPorId(id);
        barbero.setNombre(datos.getNombre());
        barbero.setAlias(datos.getAlias());
        barbero.setTelefono(datos.getTelefono());
        barbero.setEmail(datos.getEmail());
        barbero.setEspecialidad(datos.getEspecialidad());
        barbero.setBio(datos.getBio());
        if (datos.getFotoUrl() != null && !datos.getFotoUrl().isBlank()) {
            barbero.setFotoUrl(datos.getFotoUrl());
        }
        barbero.setActivo(datos.isActivo());
        barbero.setDiasLaborales(datos.getDiasLaborales());
        barbero.setHoraInicio(datos.getHoraInicio());
        barbero.setHoraFin(datos.getHoraFin());
        barbero.setPausaInicio(datos.getPausaInicio());
        barbero.setPausaFin(datos.getPausaFin());
        barbero.setOrden(datos.getOrden());
        return barberoRepository.save(barbero);
    }

    public void eliminar(String id) {
        if (!barberoRepository.existsById(id)) {
            throw new ResourceNotFoundException("Barbero no encontrado con ID: " + id);
        }
        barberoRepository.deleteById(id);
    }
}
