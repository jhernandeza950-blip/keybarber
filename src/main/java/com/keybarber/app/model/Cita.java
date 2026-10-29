package com.keybarber.app.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "citas")
public class Cita {

    @Id
    private String id;

    @Indexed(unique = true)
    private String codigo; // Ej: "KB-7489"

    // Datos del cliente
    private String clienteNombre;
    private String clienteTelefono;
    private String clienteEmail;

    // Profesional
    private String barberoId;
    private String barberoNombre;

    // Servicios contratados
    private List<String> servicioIds = new ArrayList<>();
    private List<String> serviciosNombres = new ArrayList<>();

    // Tiempos
    private LocalDateTime fechaHoraInicio;
    private LocalDateTime fechaHoraFin;
    private int duracionTotalMinutos;

    // Facturación / Precios
    private BigDecimal precioTotal;

    // Estados: PENDIENTE, CONFIRMADA, EN_PROCESO, COMPLETADA, CANCELADA, NO_ASISTIO
    private String estado = "CONFIRMADA";

    private String notas;
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    public Cita() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }

    public String getClienteNombre() { return clienteNombre; }
    public void setClienteNombre(String clienteNombre) { this.clienteNombre = clienteNombre; }

    public String getClienteTelefono() { return clienteTelefono; }
    public void setClienteTelefono(String clienteTelefono) { this.clienteTelefono = clienteTelefono; }

    public String getClienteEmail() { return clienteEmail; }
    public void setClienteEmail(String clienteEmail) { this.clienteEmail = clienteEmail; }

    public String getBarberoId() { return barberoId; }
    public void setBarberoId(String barberoId) { this.barberoId = barberoId; }

    public String getBarberoNombre() { return barberoNombre; }
    public void setBarberoNombre(String barberoNombre) { this.barberoNombre = barberoNombre; }

    public List<String> getServicioIds() { return servicioIds; }
    public void setServicioIds(List<String> servicioIds) { this.servicioIds = servicioIds; }

    public List<String> getServiciosNombres() { return serviciosNombres; }
    public void setServiciosNombres(List<String> serviciosNombres) { this.serviciosNombres = serviciosNombres; }

    public LocalDateTime getFechaHoraInicio() { return fechaHoraInicio; }
    public void setFechaHoraInicio(LocalDateTime fechaHoraInicio) { this.fechaHoraInicio = fechaHoraInicio; }

    public LocalDateTime getFechaHoraFin() { return fechaHoraFin; }
    public void setFechaHoraFin(LocalDateTime fechaHoraFin) { this.fechaHoraFin = fechaHoraFin; }

    public int getDuracionTotalMinutos() { return duracionTotalMinutos; }
    public void setDuracionTotalMinutos(int duracionTotalMinutos) { this.duracionTotalMinutos = duracionTotalMinutos; }

    public BigDecimal getPrecioTotal() { return precioTotal; }
    public void setPrecioTotal(BigDecimal precioTotal) { this.precioTotal = precioTotal; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
}

