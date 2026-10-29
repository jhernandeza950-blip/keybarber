package com.keybarber.app.controller;

import com.keybarber.app.exception.BadRequestException;
import com.keybarber.app.exception.ResourceNotFoundException;
import com.keybarber.app.model.Usuario;
import com.keybarber.app.repository.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/usuarios")
@PreAuthorize("hasRole('ADMIN')")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioController(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listarUsuarios() {
        List<Map<String, Object>> res = usuarioRepository.findAll().stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("email", u.getEmail());
            map.put("nombre", u.getNombre() != null ? u.getNombre() : u.getEmail());
            map.put("rol", u.getRol());
            map.put("activo", u.isActivo());
            map.put("fechaCreacion", u.getFechaCreacion());
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(res);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> crearUsuario(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");
        String nombre = payload.get("nombre");
        String rol = payload.getOrDefault("rol", "ROLE_ADMIN");

        if (email == null || email.trim().isEmpty()) {
            throw new BadRequestException("El usuario o email es obligatorio.");
        }
        if (password == null || password.trim().length() < 6) {
            throw new BadRequestException("La contraseña debe tener al menos 6 caracteres.");
        }

        email = email.trim().toLowerCase();
        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new BadRequestException("Ya existe un usuario registrado con el email: " + email);
        }

        if (nombre == null || nombre.trim().isEmpty()) {
            nombre = email.contains("@") ? email.split("@")[0] : email;
        }

        Usuario usuario = new Usuario();
        usuario.setEmail(email);
        usuario.setPassword(passwordEncoder.encode(password));
        usuario.setNombre(nombre.trim());
        usuario.setRol(rol.startsWith("ROLE_") ? rol : "ROLE_" + rol);
        usuario.setActivo(true);
        usuario.setFechaCreacion(LocalDateTime.now());

        Usuario guardado = usuarioRepository.save(usuario);

        Map<String, Object> res = new HashMap<>();
        res.put("id", guardado.getId());
        res.put("email", guardado.getEmail());
        res.put("nombre", guardado.getNombre());
        res.put("rol", guardado.getRol());
        res.put("activo", guardado.isActivo());
        res.put("fechaCreacion", guardado.getFechaCreacion());
        return ResponseEntity.ok(res);
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<Void> cambiarPassword(@PathVariable String id, @RequestBody Map<String, String> payload) {
        String nuevaPassword = payload.get("password");
        if (nuevaPassword == null || nuevaPassword.trim().length() < 6) {
            throw new BadRequestException("La nueva contraseña debe tener al menos 6 caracteres.");
        }

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con id: " + id));

        usuario.setPassword(passwordEncoder.encode(nuevaPassword));
        usuarioRepository.save(usuario);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<Void> toggleEstado(@PathVariable String id, @AuthenticationPrincipal UserDetails currentUser) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con id: " + id));

        if (currentUser != null && usuario.getEmail().equalsIgnoreCase(currentUser.getUsername())) {
            throw new BadRequestException("No puedes desactivar tu propio usuario en sesión activa.");
        }

        usuario.setActivo(!usuario.isActivo());
        usuarioRepository.save(usuario);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarUsuario(@PathVariable String id, @AuthenticationPrincipal UserDetails currentUser) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con id: " + id));

        if (currentUser != null && usuario.getEmail().equalsIgnoreCase(currentUser.getUsername())) {
            throw new BadRequestException("No puedes eliminar tu propio usuario en sesión activa.");
        }

        long adminCount = usuarioRepository.findAll().stream().filter(u -> "ROLE_ADMIN".equals(u.getRol())).count();
        if (adminCount <= 1 && "ROLE_ADMIN".equals(usuario.getRol())) {
            throw new BadRequestException("No se puede eliminar el único administrador del sistema.");
        }

        usuarioRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
