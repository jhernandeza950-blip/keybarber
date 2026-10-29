package com.keybarber.app.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "configuracion_agenda")
public class ConfiguracionAgenda {

    @Id
    private String id = "principal";

    // 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado, 0=Domingo
    private List<Integer> diasLaborales = new ArrayList<>(List.of(1, 2, 3, 4, 5, 6));

    // Turnos disponibles por defecto (ej: 09:00 AM, 09:30 AM...)
    private List<String> horarios = new ArrayList<>(List.of(
            "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
            "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
            "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
            "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM",
            "08:00 PM"
    ));

    public ConfiguracionAgenda() {}

    public ConfiguracionAgenda(String id, List<Integer> diasLaborales, List<String> horarios) {
        this.id = id;
        this.diasLaborales = diasLaborales;
        this.horarios = horarios;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public List<Integer> getDiasLaborales() {
        return diasLaborales;
    }

    public void setDiasLaborales(List<Integer> diasLaborales) {
        this.diasLaborales = diasLaborales;
    }

    public List<String> getHorarios() {
        return horarios;
    }

    public void setHorarios(List<String> horarios) {
        this.horarios = horarios;
    }
}

