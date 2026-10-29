package com.keybarber.app.service;

import com.keybarber.app.dto.AuthRequest;
import com.keybarber.app.dto.AuthResponse;
import com.keybarber.app.exception.BadRequestException;
import com.keybarber.app.model.Usuario;
import com.keybarber.app.repository.UsuarioRepository;
import com.keybarber.app.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(UsuarioRepository usuarioRepository, JwtService jwtService, AuthenticationManager authenticationManager) {
        this.usuarioRepository = usuarioRepository;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    public AuthResponse login(AuthRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (AuthenticationException ex) {
            throw new BadRequestException("Credenciales inválidas. Verifica tu email y contraseña.");
        }

        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Usuario no encontrado"));

        if (!usuario.isActivo()) {
            throw new BadRequestException("Esta cuenta de usuario se encuentra inactiva.");
        }

        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("rol", usuario.getRol());
        extraClaims.put("nombre", usuario.getNombre());
        if (usuario.getBarberoId() != null) {
            extraClaims.put("barberoId", usuario.getBarberoId());
        }

        User springUser = new User(
                usuario.getEmail(),
                usuario.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority(usuario.getRol()))
        );

        String token = jwtService.generateToken(springUser, extraClaims);

        return new AuthResponse(
                token,
                usuario.getEmail(),
                usuario.getNombre(),
                usuario.getRol(),
                usuario.getBarberoId()
        );
    }
}

