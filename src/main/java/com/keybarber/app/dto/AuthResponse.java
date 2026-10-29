package com.keybarber.app.dto;

public class AuthResponse {

    private String token;
    private String email;
    private String nombre;
    private String rol;
    private String barberoId;

    public AuthResponse() {}

    public AuthResponse(String token, String email, String nombre, String rol, String barberoId) {
        this.token = token;
        this.email = email;
        this.nombre = nombre;
        this.rol = rol;
        this.barberoId = barberoId;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }

    public String getBarberoId() { return barberoId; }
    public void setBarberoId(String barberoId) { this.barberoId = barberoId; }
}

