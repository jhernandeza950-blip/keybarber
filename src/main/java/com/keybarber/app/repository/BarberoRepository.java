package com.keybarber.app.repository;

import com.keybarber.app.model.Barbero;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BarberoRepository extends MongoRepository<Barbero, String> {
    List<Barbero> findByActivoTrueOrderByOrdenAsc();
    List<Barbero> findAllByOrderByOrdenAsc();
}

