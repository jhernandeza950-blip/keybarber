package com.keybarber.app.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "barberos")
public class Barbero {

    @Id
    private String id;
    private String nombre;
    private String alias;
    private String telefono;
    private String email;
    private String especialidad; // ej: "Especialista en Fades & Barbas Clásicas"
    private String bio;
    private String fotoUrl;
    private boolean activo = true;
    private int orden = 0;

    // Configuración de disponibilidad
    // Días que labora: [1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado, 7=Domingo]
    private List<Integer> diasLaborales = new ArrayList<>(List.of(1, 2, 3, 4, 5, 6));
    private String horaInicio = "09:00";
    private String horaFin = "20:00";
    private String pausaInicio = "13:00"; // Hora de almuerzo
    private String pausaFin = "14:00";

    public Barbero() {}

    public Barbero(String nombre, String alias, String especialidad, String fotoUrl) {
        this.nombre = nombre;
        this.alias = alias;
        this.especialidad = especialidad;
        this.fotoUrl = fotoUrl;
        this.activo = true;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getAlias() { return alias; }
    public void setAlias(String alias) { this.alias = alias; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getEspecialidad() { return especialidad; }
    public void setEspecialidad(String especialidad) { this.especialidad = especialidad; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getFotoUrl() { return fotoUrl; }
    public void setFotoUrl(String fotoUrl) { this.fotoUrl = fotoUrl; }

    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }

    public int getOrden() { return orden; }
    public void setOrden(int orden) { this.orden = orden; }

    public List<Integer> getDiasLaborales() { return diasLaborales; }
    public void setDiasLaborales(List<Integer> diasLaborales) { this.diasLaborales = diasLaborales; }

    public String getHoraInicio() { return horaInicio; }
    public void setHoraInicio(String horaInicio) { this.horaInicio = horaInicio; }

    public String getHoraFin() { return horaFin; }
    public void setHoraFin(String horaFin) { this.horaFin = horaFin; }

    public String getPausaInicio() { return pausaInicio; }
    public void setPausaInicio(String pausaInicio) { this.pausaInicio = pausaInicio; }

    public String getPausaFin() { return pausaFin; }
    public void setPausaFin(String pausaFin) { this.pausaFin = pausaFin; }
}

