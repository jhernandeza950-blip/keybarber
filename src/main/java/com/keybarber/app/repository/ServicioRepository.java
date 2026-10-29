package com.keybarber.app.repository;

import com.keybarber.app.model.Servicio;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServicioRepository extends MongoRepository<Servicio, String> {
    List<Servicio> findByActivoTrueOrderByOrdenAsc();
    List<Servicio> findByCategoriaAndActivoTrueOrderByOrdenAsc(String categoria);
    List<Servicio> findAllByOrderByOrdenAsc();
}

