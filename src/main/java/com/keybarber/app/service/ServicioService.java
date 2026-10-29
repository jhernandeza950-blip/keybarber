package com.keybarber.app.service;

import com.keybarber.app.exception.ResourceNotFoundException;
import com.keybarber.app.model.Servicio;
import com.keybarber.app.repository.ServicioRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ServicioService {

    private final ServicioRepository servicioRepository;

    public ServicioService(ServicioRepository servicioRepository) {
        this.servicioRepository = servicioRepository;
    }

    public List<Servicio> listarActivos() {
        return servicioRepository.findByActivoTrueOrderByOrdenAsc();
    }

    public List<Servicio> listarTodos() {
        return servicioRepository.findAllByOrderByOrdenAsc();
    }

    public List<Servicio> listarPorCategoria(String categoria) {
        return servicioRepository.findByCategoriaAndActivoTrueOrderByOrdenAsc(categoria);
    }

    public Servicio obtenerPorId(String id) {
        return servicioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Servicio no encontrado con ID: " + id));
    }

    public List<Servicio> obtenerVariosPorIds(List<String> ids) {
        return servicioRepository.findAllById(ids);
    }

    public Servicio guardar(Servicio servicio) {
        return servicioRepository.save(servicio);
    }

    public Servicio actualizar(String id, Servicio datos) {
        Servicio servicio = obtenerPorId(id);
        servicio.setNombre(datos.getNombre());
        servicio.setCategoria(datos.getCategoria());
        servicio.setDescripcion(datos.getDescripcion());
        servicio.setPrecio(datos.getPrecio());
        servicio.setDuracionMinutos(datos.getDuracionMinutos());
        if (datos.getImagenUrl() != null && !datos.getImagenUrl().isBlank()) {
            servicio.setImagenUrl(datos.getImagenUrl());
        }
        servicio.setActivo(datos.isActivo());
        servicio.setOrden(datos.getOrden());
        return servicioRepository.save(servicio);
    }

    public void eliminar(String id) {
        if (!servicioRepository.existsById(id)) {
            throw new ResourceNotFoundException("Servicio no encontrado con ID: " + id);
        }
        servicioRepository.deleteById(id);
    }
}
