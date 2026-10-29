package com.keybarber.app.repository;

import com.keybarber.app.model.ConfiguracionBarberia;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConfiguracionBarberiaRepository extends MongoRepository<ConfiguracionBarberia, String> {
}

