package com.keybarber.app.repository;

import com.keybarber.app.model.ConfiguracionAgenda;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConfiguracionAgendaRepository extends MongoRepository<ConfiguracionAgenda, String> {
}

