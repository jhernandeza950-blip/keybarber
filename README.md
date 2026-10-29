# ✂️ KEY BARBER - Sistema Integral de Agendamiento y Gestión para Barberías

Key Barber es una solución completa para barberías modernas, desarrollada en **Spring Boot 3 (Java 17/21)** y **MongoDB**, con frontend responsivo integrado en arquitectura monolítica lista para producción y despliegue directo en **Render**.

---

## 🚀 Características Principales

### 💈 Portal de Clientes (Público)
* **Landing Page de Alta Conversión:** Diseño prémium masculino (Dark & Gold).
* **Catálogo de Servicios:** Cortes (Skin Fade, Clásico a tijera), Ritual de Barba, Combos VIP, Tratamientos y Coloración.
* **Equipo de Barberos:** Perfil de cada profesional con foto, bio y especialidad.
* **Asistente de Cita Interactivo (Wizard en 4 pasos):**
  1. Selección de uno o múltiples servicios con cálculo automático de duración y precio total.
  2. Elección del barbero de preferencia o la opción rápida *"Cualquiera disponible"*.
  3. Selector de día con **disponibilidad de horas en tiempo real** (evita traslapes con citas existentes, descansos de almuerzo y bloqueos de agenda).
  4. Confirmación instantánea con generación de código único (`KB-XXXX`) y botón para compartir por WhatsApp.
* **Consulta Rápida de Citas:** Permite al cliente buscar sus citas agendadas por código o número telefónico.

---

### ⚡ Panel de Control Administrativo (`/admin.html`)
* **Seguridad Robusta:** Autenticación por roles (`ROLE_ADMIN` y `ROLE_BARBERO`) mediante JWT (JSON Web Tokens).
* **Agenda y Citas en Tiempo Real:** 
  * Filtro por fecha y por barbero.
  * Cambio de estados en un clic: `CONFIRMADA` $\rightarrow$ `EN_PROCESO` $\rightarrow$ `COMPLETADA` o `CANCELADA`.
* **Métricas y Rendimiento:** Total de citas de hoy, pendientes, completadas, facturación diaria y semanal.
* **Gestión de Barberos:** Alta, edición, horarios de turno (inicio/fin) y pausas de almuerzo.
* **Gestión de Servicios:** Precios, duración en minutos, categorías e imágenes.
* **Bloqueos de Horario:** Inhabilitación de franjas por citas médicas, vacaciones o mantenimiento.
* **Ajustes de la Barbería:** Modificación de datos de contacto, horarios generales, intervalos de cita y anticipación máxima.

---

## 🛠️ Stack Tecnológico

* **Backend:** Java 17/21, Spring Boot 3.2.5
* **Base de Datos:** MongoDB (MongoDB Atlas o local)
* **Seguridad:** Spring Security 6, JJWT 0.12.5 (BCrypt password encoding)
* **Multimedia:** Cloudinary (opcional para imágenes)
* **Frontend:** HTML5 semántico, CSS3 Vanilla optimizado (Dark/Gold), JavaScript ES6+ asíncrono
* **Despliegue:** Dockerfile multi-stage optimizado para **Render**

---

## 🔑 Credenciales por Defecto

* **URL del Panel Admin:** `http://localhost:8080/admin.html`
* **Usuario:** `admin@keybarber.com`
* **Contraseña:** `Admin123456!`

*(Puedes cambiarlas en `application.properties` o mediante variables de entorno).*

---

## ⚙️ Variables de Entorno para Producción (Render)

| Variable | Descripción | Valor Ejemplo |
| :--- | :--- | :--- |
| `MONGODB_URI` | Cadena de conexión de MongoDB Atlas | `mongodb+srv://user:pass@cluster.mongodb.net/keybarber?retryWrites=true&w=majority` |
| `JWT_SECRET` | Clave secreta Base64 (mín. 256 bits) | `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970` |
| `ADMIN_INITIAL_USERNAME` | Email del administrador principal | `admin@keybarber.com` |
| `ADMIN_INITIAL_PASSWORD` | Contraseña inicial | `TuPasswordSeguro123!` |
| `PORT` | Puerto asignado por el servidor | `8080` |

---

## 📦 Ejecución Local

1. Asegúrate de tener **Java 17 o superior** instalado.
2. Inicia MongoDB (o configura tu cluster en `application-local.properties`).
3. Compila y ejecuta el proyecto:
   ```bash
   mvn clean spring-boot:run
   ```
4. Abre tu navegador en:
   * **Sitio Cliente:** `http://localhost:8080/`
   * **Panel Administrativo:** `http://localhost:8080/admin.html`

---

## ☁️ Despliegue en Render

1. Sube este proyecto a tu repositorio de GitHub.
2. En Render, crea un nuevo **Web Service**.
3. Selecciona tu repositorio.
4. Render detectará automáticamente el archivo `Dockerfile`.
5. En la sección **Environment Variables**, agrega `MONGODB_URI` y `JWT_SECRET`.
6. ¡Listo! Tu barbería estará online con HTTPS y dominio activo.

