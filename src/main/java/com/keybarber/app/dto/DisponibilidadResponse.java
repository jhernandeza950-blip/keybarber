package com.keybarber.app.dto;

import java.time.LocalDate;
import java.util.List;

public class DisponibilidadResponse {

    private LocalDate fecha;
    private String barberoId;
    private String barberoNombre;
    private int duracionServiciosMinutos;
    private List<String> horariosDisponibles; // Lista de "09:00", "09:30", etc.

    public DisponibilidadResponse() {}

    public DisponibilidadResponse(LocalDate fecha, String barberoId, String barberoNombre, int duracionServiciosMinutos, List<String> horariosDisponibles) {
        this.fecha = fecha;
        this.barberoId = barberoId;
        this.barberoNombre = barberoNombre;
        this.duracionServiciosMinutos = duracionServiciosMinutos;
        this.horariosDisponibles = horariosDisponibles;
    }

    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }

    public String getBarberoId() { return barberoId; }
    public void setBarberoId(String barberoId) { this.barberoId = barberoId; }

    public String getBarberoNombre() { return barberoNombre; }
    public void setBarberoNombre(String barberoNombre) { this.barberoNombre = barberoNombre; }

    public int getDuracionServiciosMinutos() { return duracionServiciosMinutos; }
    public void setDuracionServiciosMinutos(int duracionServiciosMinutos) { this.duracionServiciosMinutos = duracionServiciosMinutos; }

    public List<String> getHorariosDisponibles() { return horariosDisponibles; }
    public void setHorariosDisponibles(List<String> horariosDisponibles) { this.horariosDisponibles = horariosDisponibles; }
}

