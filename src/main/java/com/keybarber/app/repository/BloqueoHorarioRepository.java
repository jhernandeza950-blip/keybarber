package com.keybarber.app.repository;

import com.keybarber.app.model.BloqueoHorario;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BloqueoHorarioRepository extends MongoRepository<BloqueoHorario, String> {
    List<BloqueoHorario> findByFecha(LocalDate fecha);
    List<BloqueoHorario> findByBarberoIdAndFecha(String barberoId, LocalDate fecha);
    List<BloqueoHorario> findByFechaBetweenOrderByFechaAscHoraInicioAsc(LocalDate start, LocalDate end);
}

