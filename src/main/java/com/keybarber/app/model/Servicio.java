package com.keybarber.app.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;

@Document(collection = "servicios")
public class Servicio {

    @Id
    private String id;
    private String nombre;
    private String categoria; // "Cortes", "Barba", "Combos", "Tratamientos", "Color"
    private String descripcion;
    private BigDecimal precio;
    private int duracionMinutos = 30;
    private String imagenUrl;
    private boolean activo = true;
    private int orden = 0;

    public Servicio() {}

    public Servicio(String nombre, String categoria, String descripcion, BigDecimal precio, int duracionMinutos, String imagenUrl) {
        this.nombre = nombre;
        this.categoria = categoria;
        this.descripcion = descripcion;
        this.precio = precio;
        this.duracionMinutos = duracionMinutos;
        this.imagenUrl = imagenUrl;
        this.activo = true;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public BigDecimal getPrecio() { return precio; }
    public void setPrecio(BigDecimal precio) { this.precio = precio; }

    public int getDuracionMinutos() { return duracionMinutos; }
    public void setDuracionMinutos(int duracionMinutos) { this.duracionMinutos = duracionMinutos; }

    public String getImagenUrl() { return imagenUrl; }
    public void setImagenUrl(String imagenUrl) { this.imagenUrl = imagenUrl; }

    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }

    public int getOrden() { return orden; }
    public void setOrden(int orden) { this.orden = orden; }
}

