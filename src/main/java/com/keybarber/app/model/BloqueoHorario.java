package com.keybarber.app.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalTime;

@Document(collection = "bloqueos_horarios")
public class BloqueoHorario {

    @Id
    private String id;
    private String barberoId; // Si es null o "TODOS", aplica a toda la barbería

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate fecha;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm")
    private LocalTime horaInicio;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm")
    private LocalTime horaFin;

    private String motivo; // ej: "Mantenimiento sillón", "Cita médica", "Vacaciones"

    public BloqueoHorario() {}

    public BloqueoHorario(String barberoId, LocalDate fecha, LocalTime horaInicio, LocalTime horaFin, String motivo) {
        this.barberoId = barberoId;
        this.fecha = fecha;
        this.horaInicio = horaInicio;
        this.horaFin = horaFin;
        this.motivo = motivo;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getBarberoId() { return barberoId; }
    public void setBarberoId(String barberoId) { this.barberoId = barberoId; }

    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }

    public LocalTime getHoraInicio() { return horaInicio; }
    public void setHoraInicio(LocalTime horaInicio) { this.horaInicio = horaInicio; }

    public LocalTime getHoraFin() { return horaFin; }
    public void setHoraFin(LocalTime horaFin) { this.horaFin = horaFin; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
}

