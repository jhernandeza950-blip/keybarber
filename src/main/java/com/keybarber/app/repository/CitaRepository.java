package com.keybarber.app.repository;

import com.keybarber.app.model.Cita;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CitaRepository extends MongoRepository<Cita, String> {
    Optional<Cita> findByCodigoIgnoreCase(String codigo);
    List<Cita> findByClienteTelefonoOrderByFechaHoraInicioDesc(String clienteTelefono);
    
    // Consultas para agenda y traslape
    List<BarberoCitaProjection> findByBarberoIdAndFechaHoraInicioBetweenAndEstadoNot(
            String barberoId, LocalDateTime start, LocalDateTime end, String estadoExcluido);

    List<Cita> findByFechaHoraInicioBetweenOrderByFechaHoraInicioAsc(LocalDateTime start, LocalDateTime end);
    List<Cita> findByBarberoIdAndFechaHoraInicioBetweenOrderByFechaHoraInicioAsc(String barberoId, LocalDateTime start, LocalDateTime end);

    List<Cita> findAllByOrderByFechaHoraInicioDesc();
    List<Cita> findByEstadoOrderByFechaHoraInicioDesc(String estado);

    long countByFechaHoraInicioBetween(LocalDateTime start, LocalDateTime end);
    long countByFechaHoraInicioBetweenAndEstado(LocalDateTime start, LocalDateTime end, String estado);

    interface BarberoCitaProjection {
        String getId();
        String getBarberoId();
        LocalDateTime getFechaHoraInicio();
        LocalDateTime getFechaHoraFin();
        String getEstado();
    }
}

