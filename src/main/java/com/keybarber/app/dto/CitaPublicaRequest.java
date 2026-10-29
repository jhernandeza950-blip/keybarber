package com.keybarber.app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

public class CitaPublicaRequest {

    @NotBlank(message = "El nombre del cliente es obligatorio")
    private String clienteNombre;

    @NotBlank(message = "El teléfono/WhatsApp es obligatorio")
    private String clienteTelefono;

    private String clienteEmail;

    // Puede ser el ID del barbero específico o "CUALQUIERA"
    @NotBlank(message = "Debes seleccionar un barbero o la opción 'Cualquiera disponible'")
    private String barberoId;

    @NotEmpty(message = "Debes seleccionar al menos un servicio")
    private List<String> servicioIds;

    @NotNull(message = "La fecha y hora de inicio es obligatoria")
    private LocalDateTime fechaHoraInicio;

    private String notas;

    public CitaPublicaRequest() {}

    public String getClienteNombre() { return clienteNombre; }
    public void setClienteNombre(String clienteNombre) { this.clienteNombre = clienteNombre; }

    public String getClienteTelefono() { return clienteTelefono; }
    public void setClienteTelefono(String clienteTelefono) { this.clienteTelefono = clienteTelefono; }

    public String getClienteEmail() { return clienteEmail; }
    public void setClienteEmail(String clienteEmail) { this.clienteEmail = clienteEmail; }

    public String getBarberoId() { return barberoId; }
    public void setBarberoId(String barberoId) { this.barberoId = barberoId; }

    public List<String> getServicioIds() { return servicioIds; }
    public void setServicioIds(List<String> servicioIds) { this.servicioIds = servicioIds; }

    public LocalDateTime getFechaHoraInicio() { return fechaHoraInicio; }
    public void setFechaHoraInicio(LocalDateTime fechaHoraInicio) { this.fechaHoraInicio = fechaHoraInicio; }

    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }
}

