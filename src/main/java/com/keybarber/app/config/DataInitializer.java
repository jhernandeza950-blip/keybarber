package com.keybarber.app.config;

import com.keybarber.app.model.*;
import com.keybarber.app.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final BarberoRepository barberoRepository;
    private final ServicioRepository servicioRepository;
    private final ConfiguracionBarberiaRepository configuracionRepository;
    private final ConfiguracionAgendaRepository configuracionAgendaRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${keybarber.admin.initial-username:admin@keybarber.com}")
    private String adminUsername;

    @Value("${keybarber.admin.initial-password:Admin123456!}")
    private String adminPassword;

    public DataInitializer(
            UsuarioRepository usuarioRepository,
            BarberoRepository barberoRepository,
            ServicioRepository servicioRepository,
            ConfiguracionBarberiaRepository configuracionRepository,
            ConfiguracionAgendaRepository configuracionAgendaRepository,
            PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.barberoRepository = barberoRepository;
        this.servicioRepository = servicioRepository;
        this.configuracionRepository = configuracionRepository;
        this.configuracionAgendaRepository = configuracionAgendaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        inicializarConfiguracion();
        inicializarConfiguracionAgenda();
        inicializarAdmin();
        inicializarBarberos();
        inicializarServicios();
    }

    private void inicializarConfiguracion() {
        if (!configuracionRepository.existsById("GLOBAL")) {
            ConfiguracionBarberia config = new ConfiguracionBarberia();
            config.setId("GLOBAL");
            config.setNombre("KEY BARBER");
            config.setSlogan("Precisión, Estilo y Maestría Masculina");
            config.setDireccion("Calle 72 # 11-45, Zona Rosa");
            config.setTelefono("+57 310 987 6543");
            config.setWhatsapp("573109876543");
            config.setInstagram("@keybarber_col");
            config.setHoraAperturaSemana("09:00");
            config.setHoraCierreSemana("20:00");
            config.setHoraAperturaSabado("09:00");
            config.setHoraCierreSabado("21:00");
            config.setHoraAperturaDomingo("10:00");
            config.setHoraCierreDomingo("17:00");
            config.setIntervaloMinutos(30);
            config.setAnticipacionDias(15);
            configuracionRepository.save(config);
        }
    }

    private void inicializarConfiguracionAgenda() {
        if (!configuracionAgendaRepository.existsById("principal")) {
            ConfiguracionAgenda configAgenda = new ConfiguracionAgenda();
            configAgenda.setId("principal");
            configAgenda.setDiasLaborales(List.of(1, 2, 3, 4, 5, 6)); // Lunes a Sábado
            configAgenda.setHorarios(List.of(
                    "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
                    "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
                    "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
                    "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM",
                    "08:00 PM"
            ));
            configuracionAgendaRepository.save(configAgenda);
        }
    }

    private void inicializarAdmin() {
        if (!usuarioRepository.existsByEmailIgnoreCase(adminUsername)) {
            Usuario admin = new Usuario(
                    adminUsername,
                    passwordEncoder.encode(adminPassword),
                    "Administrador Key Barber",
                    "ROLE_ADMIN"
            );
            usuarioRepository.save(admin);
        }
    }

    private void inicializarBarberos() {
        if (barberoRepository.count() == 0) {
            Barbero b1 = new Barbero("Mateo 'Master' Silva", "Mateo", "Especialista en Skin Fade & Freestyle", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80");
            b1.setTelefono("3101112233");
            b1.setBio("Más de 8 años de experiencia en cortes urbanos de alta precisión.");
            b1.setOrden(1);

            Barbero b2 = new Barbero("Carlos 'El Barbas' Mendoza", "Carlos", "Experto en Ritual de Barba & Toalla Caliente", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80");
            b2.setTelefono("3102223344");
            b2.setBio("Técnicas tradicionales italianas para el perfilado y cuidado de la barba.");
            b2.setOrden(2);

            Barbero b3 = new Barbero("Alejandro 'Jano' Ruiz", "Jano", "Cortes Clásicos, Peinados & Tijera", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80");
            b3.setTelefono("3103334455");
            b3.setBio("Especialista en corte formal y asesoría de imagen personalizada.");
            b3.setOrden(3);

            barberoRepository.saveAll(List.of(b1, b2, b3));
        }
    }

    private void inicializarServicios() {
        if (servicioRepository.count() == 0) {
            Servicio s1 = new Servicio("Corte Key Master Fade", "Cortes", "Degradado perfecto (Low/Mid/High), lavado relajante y peinado final.", new BigDecimal("35000"), 45, "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80");
            s1.setOrden(1);

            Servicio s2 = new Servicio("Ritual Barba Tradicional", "Barba", "Vaporizador de ozono, toalla caliente perfumada, aceites esenciales y perfilado con navaja.", new BigDecimal("25000"), 30, "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80");
            s2.setOrden(2);

            Servicio s3 = new Servicio("Combo VIP (Corte + Barba)", "Combos", "El servicio insignia: Fade completo, ritual de barba, exfoliación y bebida de cortesía.", new BigDecimal("55000"), 60, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80");
            s3.setOrden(3);

            Servicio s4 = new Servicio("Corte Clásico a Tijera", "Cortes", "Corte tradicional a tijera para caballeros exigentes, terminado mate.", new BigDecimal("30000"), 40, "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=600&q=80");
            s4.setOrden(4);

            Servicio s5 = new Servicio("Limpieza Facial Express", "Tratamientos", "Mascarilla negra purificante de puntos negros, hidratación y tónico refrescante.", new BigDecimal("20000"), 25, "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80");
            s5.setOrden(5);

            Servicio s6 = new Servicio("Camuflaje de Canas / Color", "Color", "Pigmentación sutil para barba o cabello de aspecto 100% natural.", new BigDecimal("40000"), 45, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80");
            s6.setOrden(6);

            servicioRepository.saveAll(List.of(s1, s2, s3, s4, s5, s6));
        }
    }
}
