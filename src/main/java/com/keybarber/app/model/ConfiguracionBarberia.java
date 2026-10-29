package com.keybarber.app.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "configuracion_barberia")
public class ConfiguracionBarberia {

    @Id
    private String id = "GLOBAL";
    private String nombre = "KEY BARBER";
    private String slogan = "Estilo, Precisión y Tradición Masculina";
    private String direccion = "Calle Principal #10-20, Zona Rosa";
    private String telefono = "+57 300 123 4567";
    private String whatsapp = "573001234567";
    private String instagram = "@keybarber.oficial";
    
    // Reglas de agenda
    private String horaAperturaSemana = "09:00";
    private String horaCierreSemana = "20:00";
    private String horaAperturaSabado = "09:00";
    private String horaCierreSabado = "21:00";
    private String horaAperturaDomingo = "10:00";
    private String horaCierreDomingo = "18:00";
    
    private int intervaloMinutos = 30; // Bloques de 30 mins para el picker
    private int anticipacionDias = 15; // Hasta cuántos días adelante pueden agendar

    public ConfiguracionBarberia() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getSlogan() { return slogan; }
    public void setSlogan(String slogan) { this.slogan = slogan; }

    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getWhatsapp() { return whatsapp; }
    public void setWhatsapp(String whatsapp) { this.whatsapp = whatsapp; }

    public String getInstagram() { return instagram; }
    public void setInstagram(String instagram) { this.instagram = instagram; }

    public String getHoraAperturaSemana() { return horaAperturaSemana; }
    public void setHoraAperturaSemana(String horaAperturaSemana) { this.horaAperturaSemana = horaAperturaSemana; }

    public String getHoraCierreSemana() { return horaCierreSemana; }
    public void setHoraCierreSemana(String horaCierreSemana) { this.horaCierreSemana = horaCierreSemana; }

    public String getHoraAperturaSabado() { return horaAperturaSabado; }
    public void setHoraAperturaSabado(String horaAperturaSabado) { this.horaAperturaSabado = horaAperturaSabado; }

    public String getHoraCierreSabado() { return horaCierreSabado; }
    public void setHoraCierreSabado(String horaCierreSabado) { this.horaCierreSabado = horaCierreSabado; }

    public String getHoraAperturaDomingo() { return horaAperturaDomingo; }
    public void setHoraAperturaDomingo(String horaAperturaDomingo) { this.horaAperturaDomingo = horaAperturaDomingo; }

    public String getHoraCierreDomingo() { return horaCierreDomingo; }
    public void setHoraCierreDomingo(String horaCierreDomingo) { this.horaCierreDomingo = horaCierreDomingo; }

    public int getIntervaloMinutos() { return intervaloMinutos; }
    public void setIntervaloMinutos(int intervaloMinutos) { this.intervaloMinutos = intervaloMinutos; }

    public int getAnticipacionDias() { return anticipacionDias; }
    public void setAnticipacionDias(int anticipacionDias) { this.anticipacionDias = anticipacionDias; }
}

