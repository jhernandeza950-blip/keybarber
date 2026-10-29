// KEY BARBER - Lógica del Portal del Cliente & Wizard de Agendamiento Visual

let serviciosData = [];
let barberosData = [];
let configuracionData = {};
let agendaConfiguracion = {
  diasLaborales: [1, 2, 3, 4, 5, 6],
  horarios: []
};

let reservaActual = {
  serviciosSeleccionados: [],
  barberoId: 'CUALQUIERA',
  barberoNombre: 'Cualquiera disponible',
  fecha: '',
  hora: '',
  duracionTotal: 0,
  precioTotal: 0
};

// Variables para el calendario visual interactivo
let calAnoActual = new Date().getFullYear();
let calMesActual = new Date().getMonth(); // 0 = Enero .. 11 = Diciembre

const NOMBRES_MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

document.addEventListener('DOMContentLoaded', () => {
  cargarConfiguracion();
  cargarServicios();
  cargarBarberos();
});

// Cargar configuración de la barbería
async function cargarConfiguracion() {
  try {
    const res = await fetch('/api/configuracion');
    if (res.ok) {
      configuracionData = await res.json();
      if (configuracionData.nombre) document.getElementById('brandName').textContent = configuracionData.nombre;
      if (configuracionData.slogan) document.getElementById('brandSlogan').textContent = configuracionData.slogan;
      if (configuracionData.direccion) {
        document.getElementById('footerInfo').textContent = `${configuracionData.direccion} | Tel: ${configuracionData.telefono || ''}`;
      }
    }
    const resAgenda = await fetch('/api/agenda');
    if (resAgenda.ok) {
      agendaConfiguracion = await resAgenda.json();
    }
  } catch (e) {
    console.error('Error al cargar config:', e);
  }
}

// Cargar servicios en el catálogo
async function cargarServicios() {
  try {
    const res = await fetch('/api/servicios');
    if (res.ok) {
      serviciosData = await res.json();
      renderizarServicios('TODOS');
    }
  } catch (e) {
    console.error('Error al cargar servicios:', e);
  }
}

function filtrarCategoria(cat, btn) {
  document.querySelectorAll('.categories-tabs .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderizarServicios(cat);
}

function renderizarServicios(cat) {
  const container = document.getElementById('serviciosGrid');
  const filtrados = (cat === 'TODOS') 
    ? serviciosData 
    : serviciosData.filter(s => s.categoria && s.categoria.toLowerCase() === cat.toLowerCase());

  if (filtrados.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">No hay servicios en esta categoría.</p>`;
    return;
  }

  container.innerHTML = filtrados.map(s => `
    <div class="service-card">
      <div class="service-img-wrap">
        <img src="${s.imagenUrl || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80'}" class="service-img" alt="${s.nombre}">
        <span class="service-duration-badge"><i class="fa-regular fa-clock mr-1"></i> ${s.duracionMinutos} min</span>
      </div>
      <div class="service-body">
        <div class="service-meta">
          <span class="service-category">${s.categoria || 'Servicio'}</span>
        </div>
        <h3 class="service-title">${s.nombre}</h3>
        <p class="service-desc">${s.descripcion || 'Servicio profesional con acabados de alta calidad.'}</p>
        <div class="service-footer">
          <span class="service-price">$${formatearPrecio(s.precio)}</span>
          <button onclick="iniciarReservaConServicio('${s.id}')" class="btn btn-gold" style="padding: 0.55rem 1.15rem; font-size: 0.88rem;">
            <i class="fa-solid fa-calendar-plus mr-1"></i> Reservar
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Cargar barberos en el equipo
async function cargarBarberos() {
  try {
    const res = await fetch('/api/barberos');
    if (res.ok) {
      barberosData = await res.json();
      const container = document.getElementById('barberosGrid');
      container.innerHTML = barberosData.map(b => `
        <div class="barber-card">
          <img src="${b.fotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80'}" class="barber-avatar" alt="${b.nombre}">
          <h3 class="barber-name">${b.nombre}</h3>
          <p class="barber-spec">${b.especialidad || 'Master Barber'}</p>
          <p class="barber-bio">${b.bio || ''}</p>
          <button onclick="iniciarReservaConBarbero('${b.id}')" class="btn btn-outline" style="margin-top: 1.25rem; width: 100%; font-size: 0.88rem;">
            <i class="fa-solid fa-calendar-check mr-1"></i> Agendar con ${b.alias || b.nombre.split(' ')[0]}
          </button>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error('Error al cargar barberos:', e);
  }
}

// ==================== WIZARD DE RESERVA MODAL ====================

function abrirModalReserva() {
  const hoy = new Date();
  calAnoActual = hoy.getFullYear();
  calMesActual = hoy.getMonth();

  reservaActual = {
    serviciosSeleccionados: [],
    barberoId: 'CUALQUIERA',
    barberoNombre: 'Cualquiera disponible',
    fecha: formatearFechaISO(hoy),
    hora: '',
    duracionTotal: 0,
    precioTotal: 0
  };
  document.getElementById('modalReserva').classList.add('active');
  mostrarPasoServicios();
}

function cerrarModalReserva() {
  document.getElementById('modalReserva').classList.remove('active');
}

function iniciarReservaConServicio(servicioId) {
  abrirModalReserva();
  reservaActual.serviciosSeleccionados = [servicioId];
  actualizarTotalesServicios();
  mostrarPasoBarbero();
}

function iniciarReservaConBarbero(barberoId) {
  abrirModalReserva();
  const barbero = barberosData.find(b => b.id === barberoId);
  if (barbero) {
    reservaActual.barberoId = barbero.id;
    reservaActual.barberoNombre = barbero.nombre;
  }
  mostrarPasoServicios();
}

// PASO 1: Servicios
function mostrarPasoServicios() {
  document.getElementById('wizardTitulo').innerHTML = '<i class="fa-solid fa-scissors"></i> <span>1. Selecciona tus Servicios</span>';
  const body = document.getElementById('wizardBody');

  body.innerHTML = `
    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.25rem;">
      Elige los servicios que deseas incluir en tu cita. El tiempo y precio se calculan en vivo:
    </p>
    <div style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 380px; overflow-y: auto; padding-right: 0.35rem;">
      ${serviciosData.map(s => {
        const checked = reservaActual.serviciosSeleccionados.includes(s.id) ? 'checked' : '';
        return `
          <label style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: var(--bg-card); border: 1px solid ${checked ? 'var(--gold)' : 'var(--border-color)'}; border-radius: var(--radius-sm); cursor: pointer; transition: var(--transition);">
            <div style="display: flex; align-items: center; gap: 0.85rem;">
              <input type="checkbox" value="${s.id}" ${checked} onchange="toggleServicio('${s.id}')" style="accent-color: var(--gold); width: 19px; height: 19px; cursor: pointer;">
              <div>
                <strong style="color: var(--text-main); font-size: 0.95rem;">${s.nombre}</strong>
                <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.4rem; margin-top: 0.15rem;">
                  <i class="fa-regular fa-clock text-[10px]"></i> ${s.duracionMinutos} min · <span style="color: var(--gold);">${s.categoria || 'Servicio'}</span>
                </div>
              </div>
            </div>
            <span style="font-weight: 800; color: var(--gold); font-size: 1.05rem;">$${formatearPrecio(s.precio)}</span>
          </label>
        `;
      }).join('')}
    </div>

    <div style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Total a pagar:</div>
        <div style="font-size: 1.35rem; font-weight: 900; color: var(--gold);" id="wizardTotalServicios">
          $${formatearPrecio(reservaActual.precioTotal)} <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">(${reservaActual.duracionTotal} min)</span>
        </div>
      </div>
      <button onclick="validarYPasarABarbero()" class="btn btn-gold" style="padding: 0.75rem 1.6rem;">
        Continuar <i class="fa-solid fa-arrow-right ml-1"></i>
      </button>
    </div>
  `;
}

function toggleServicio(id) {
  const index = reservaActual.serviciosSeleccionados.indexOf(id);
  if (index > -1) {
    reservaActual.serviciosSeleccionados.splice(index, 1);
  } else {
    reservaActual.serviciosSeleccionados.push(id);
  }
  actualizarTotalesServicios();
  mostrarPasoServicios(); // Re-render para actualizar bordes y checkbox
}

function actualizarTotalesServicios() {
  const seleccionados = serviciosData.filter(s => reservaActual.serviciosSeleccionados.includes(s.id));
  reservaActual.duracionTotal = seleccionados.reduce((acc, s) => acc + s.duracionMinutos, 0);
  reservaActual.precioTotal = seleccionados.reduce((acc, s) => acc + Number(s.precio), 0);
}

function validarYPasarABarbero() {
  if (reservaActual.serviciosSeleccionados.length === 0) {
    alert('Por favor selecciona al menos un servicio para continuar.');
    return;
  }
  mostrarPasoBarbero();
}

// PASO 2: Elegir Barbero
function mostrarPasoBarbero() {
  document.getElementById('wizardTitulo').innerHTML = '<i class="fa-solid fa-user-tie"></i> <span>2. Elige tu Profesional</span>';
  const body = document.getElementById('wizardBody');

  body.innerHTML = `
    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.25rem;">
      ¿Con quién deseas atenderte? Elige un barbero o la opción rápida para mayor disponibilidad de horas:
    </p>
    <div style="display: flex; flex-direction: column; gap: 0.85rem; max-height: 380px; overflow-y: auto;">
      
      <!-- Opción cualquiera disponible -->
      <div onclick="seleccionarBarbero('CUALQUIERA')" 
           style="display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; background: var(--bg-card); border: 2px solid ${reservaActual.barberoId === 'CUALQUIERA' ? 'var(--gold)' : 'var(--border-color)'}; border-radius: var(--radius-md); cursor: pointer; transition: var(--transition);">
        <div class="logo-icon" style="width: 46px; height: 46px; font-size: 1.2rem; flex-shrink: 0;"><i class="fa-solid fa-bolt"></i></div>
        <div style="flex: 1;">
          <strong style="color: var(--text-main); font-size: 1rem;">Cualquiera disponible</strong>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.15rem;">Te asignaremos al primer profesional libre para máxima cantidad de horarios.</p>
        </div>
        ${reservaActual.barberoId === 'CUALQUIERA' ? '<i class="fa-solid fa-circle-check text-gold text-lg"></i>' : ''}
      </div>

      <!-- Barberos activos -->
      ${barberosData.map(b => {
        const isSelected = reservaActual.barberoId === b.id;
        return `
          <div onclick="seleccionarBarbero('${b.id}')" 
               style="display: flex; align-items: center; gap: 1rem; padding: 0.9rem 1.25rem; background: var(--bg-card); border: 2px solid ${isSelected ? 'var(--gold)' : 'var(--border-color)'}; border-radius: var(--radius-md); cursor: pointer; transition: var(--transition);">
            <img src="${b.fotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80'}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid var(--gold); flex-shrink: 0;">
            <div style="flex: 1;">
              <strong style="color: var(--text-main); font-size: 0.98rem;">${b.nombre}</strong>
              <p style="font-size: 0.82rem; color: var(--gold); margin-top: 0.15rem;">${b.especialidad || 'Barbero Oficial'}</p>
            </div>
            ${isSelected ? '<i class="fa-solid fa-circle-check text-gold text-lg"></i>' : ''}
          </div>
        `;
      }).join('')}
    </div>

    <div style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between;">
      <button onclick="mostrarPasoServicios()" class="btn btn-outline">
        <i class="fa-solid fa-arrow-left mr-1"></i> Volver
      </button>
      <button onclick="mostrarPasoFechaHora()" class="btn btn-gold">
        Elegir Fecha &amp; Hora <i class="fa-solid fa-arrow-right ml-1"></i>
      </button>
    </div>
  `;
}

function seleccionarBarbero(id) {
  if (id === 'CUALQUIERA') {
    reservaActual.barberoId = 'CUALQUIERA';
    reservaActual.barberoNombre = 'Cualquiera disponible';
  } else {
    const b = (barberosData || []).find(x => x.id === id);
    reservaActual.barberoId = id;
    reservaActual.barberoNombre = b ? b.nombre : 'Barbero Profesional';
  }
  mostrarPasoBarbero();
}

// ==================== PASO 3: CALENDARIO VISUAL INTERACTIVO (ESTILO ISIVI) ====================
function mostrarPasoFechaHora() {
  document.getElementById('wizardTitulo').innerHTML = '<i class="fa-solid fa-calendar-days"></i> <span>3. Selecciona Fecha y Hora</span>';
  const body = document.getElementById('wizardBody');

  // Buscar el primer día laboral a partir de hoy
  let fechaInicialISO = formatearFechaISO(new Date());
  for (let offset = 0; offset < 7; offset++) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const dow = d.getDay();
    const esLab = (agendaConfiguracion.diasLaborales || []).includes(dow) || (dow === 0 && (agendaConfiguracion.diasLaborales || []).includes(7));
    if (esLab) {
      fechaInicialISO = formatearFechaISO(d);
      break;
    }
  }

  const hoyISO = formatearFechaISO(new Date());
  if (!reservaActual.fecha || reservaActual.fecha < hoyISO) {
    reservaActual.fecha = fechaInicialISO;
  }

  body.innerHTML = `
    <!-- Bloque 1: Calendario Visual Mensual -->
    <div class="isivi-calendar-card">
      <div class="isivi-calendar-header">
        <button type="button" onclick="cambiarMesCalendario(-1)" class="isivi-calendar-nav-btn" title="Mes anterior">
          <i class="fa-solid fa-chevron-left text-xs"></i>
        </button>
        <h4 id="calMesAnoLabel">${NOMBRES_MESES[calMesActual]} ${calAnoActual}</h4>
        <button type="button" onclick="cambiarMesCalendario(1)" class="isivi-calendar-nav-btn" title="Mes siguiente">
          <i class="fa-solid fa-chevron-right text-xs"></i>
        </button>
      </div>
      <div class="isivi-days-header">
        <span>Dom</span><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span>
      </div>
      <div id="calDiasGrid" class="isivi-calendar-days-grid">
        <!-- Generado por renderizarDiasCalendario() -->
      </div>
      <p style="text-align: center; color: var(--text-muted); font-size: 0.78rem; margin-top: 0.75rem;">
        <i class="fa-solid fa-hand-pointer mr-1"></i> Haz clic en un día disponible para desplegar sus horarios de atención.
      </p>
    </div>

    <!-- Bloque 2: Slots de Horarios Disponibles -->
    <div class="slots-container-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
        <span style="font-size: 0.88rem; font-weight: 700; color: var(--text-main);">
          <i class="fa-regular fa-clock mr-1 text-gold"></i> Horarios disponibles para <span id="fechaSeleccionadaTexto" style="color: var(--gold);">${formatearFechaLegible(reservaActual.fecha)}</span>
        </span>
        <span style="font-size: 0.75rem; background: rgba(212, 175, 55, 0.15); border: 1px solid var(--border-gold); color: var(--gold); padding: 0.2rem 0.55rem; border-radius: var(--radius-full); font-weight: 700;">
          ⏱️ ${reservaActual.duracionTotal} min
        </span>
      </div>
      <div id="slotsHorariosContainer">
        <p style="text-align: center; color: var(--text-muted); padding: 1.25rem; font-size: 0.85rem;">
          <i class="fa-solid fa-spinner fa-spin mr-1"></i> Consultando turnos libres en vivo...
        </p>
      </div>
    </div>

    <!-- Botones de Navegación -->
    <div style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
      <button onclick="mostrarPasoBarbero()" class="btn btn-outline">
        <i class="fa-solid fa-arrow-left mr-1"></i> Volver
      </button>
      <button onclick="validarYPasarADatos()" class="btn btn-gold" id="btnIrDatos" ${reservaActual.hora ? '' : 'disabled'}>
        Continuar a Mis Datos <i class="fa-solid fa-arrow-right ml-1"></i>
      </button>
    </div>
  `;

  renderizarDiasCalendario();
  cargarHorariosDisponibles();
}

function cambiarMesCalendario(delta) {
  calMesActual += delta;
  if (calMesActual < 0) {
    calMesActual = 11;
    calAnoActual--;
  } else if (calMesActual > 11) {
    calMesActual = 0;
    calAnoActual++;
  }
  document.getElementById('calMesAnoLabel').textContent = `${NOMBRES_MESES[calMesActual]} ${calAnoActual}`;
  renderizarDiasCalendario();
}

function renderizarDiasCalendario() {
  const grid = document.getElementById('calDiasGrid');
  if (!grid) return;

  const primerDiaMes = new Date(calAnoActual, calMesActual, 1).getDay(); // 0 = Domingo
  const diasEnMes = new Date(calAnoActual, calMesActual + 1, 0).getDate();
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let html = '';

  // Espacios vacíos antes del primer día del mes
  for (let i = 0; i < primerDiaMes; i++) {
    html += '<div class="cal-day-cell disabled"></div>';
  }

  // Días del mes
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fechaIter = new Date(calAnoActual, calMesActual, dia);
    const fechaISO = formatearFechaISO(fechaIter);
    const dayOfWeek = fechaIter.getDay(); // 0 = Domingo, 1 = Lunes .. 6 = Sábado
    const esLaboral = (agendaConfiguracion.diasLaborales || []).includes(dayOfWeek) || (dayOfWeek === 0 && (agendaConfiguracion.diasLaborales || []).includes(7));
    const esPasado = fechaIter < hoy;
    const noDisponible = esPasado || !esLaboral;
    const esHoy = fechaIter.getTime() === hoy.getTime();
    const esSeleccionado = (fechaISO === reservaActual.fecha);

    let clases = 'cal-day-cell';
    if (noDisponible) clases += ' disabled';
    if (esHoy) clases += ' today';
    if (esSeleccionado && !noDisponible) clases += ' selected';

    const onclick = noDisponible ? '' : `onclick="seleccionarFechaCalendario('${fechaISO}')"`;
    const titleAttr = !esLaboral ? 'title="Día no laboral / Cerrado"' : '';
    html += `<div class="${clases}" ${onclick} ${titleAttr}>${dia}</div>`;
  }

  grid.innerHTML = html;
}

function seleccionarFechaCalendario(fechaISO) {
  reservaActual.fecha = fechaISO;
  reservaActual.hora = '';
  document.getElementById('fechaSeleccionadaTexto').textContent = formatearFechaLegible(fechaISO);
  const btn = document.getElementById('btnIrDatos');
  if (btn) btn.disabled = true;

  renderizarDiasCalendario();
  cargarHorariosDisponibles();
}

async function cargarHorariosDisponibles() {
  const container = document.getElementById('slotsHorariosContainer');
  if (!container) return;

  container.innerHTML = `
    <p style="text-align: center; color: var(--text-muted); padding: 1.5rem; font-size: 0.88rem;">
      <i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Verificando agenda para ${reservaActual.barberoNombre}...
    </p>
  `;

  try {
    const url = `/api/agenda/disponibilidad?fecha=${reservaActual.fecha}&barberoId=${reservaActual.barberoId}&duracionMinutos=${reservaActual.duracionTotal}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al consultar agenda');

    const data = await res.json();
    const horas = data.horariosDisponibles || [];

    if (horas.length === 0) {
      container.innerHTML = `
        <div style="background: var(--bg-secondary); border: 1px dashed var(--border-color); padding: 1.5rem; border-radius: var(--radius-sm); text-align: center;">
          <p style="color: #fca5a5; font-size: 0.92rem; font-weight: 700; margin-bottom: 0.35rem;">
            <i class="fa-solid fa-calendar-xmark mr-1"></i> Sin turnos disponibles para esta fecha
          </p>
          <p style="color: var(--text-muted); font-size: 0.82rem;">Prueba eligiendo otro día o la opción "Cualquiera disponible".</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="slots-grid">
        ${horas.map(h => `
          <div class="slot-item ${reservaActual.hora === h ? 'selected' : ''}" onclick="seleccionarHoraSlot('${h}', this)">
            <i class="fa-regular fa-clock text-[10px] mr-1"></i>${formatearHora12(h)}
          </div>
        `).join('')}
      </div>
    `;
  } catch (e) {
    container.innerHTML = `<p style="color: var(--danger); font-size: 0.85rem; text-align: center;">Error al cargar disponibilidad.</p>`;
  }
}

function seleccionarHoraSlot(hora, el) {
  reservaActual.hora = hora;
  document.querySelectorAll('.slot-item').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  const btn = document.getElementById('btnIrDatos');
  if (btn) btn.disabled = false;
}

function validarYPasarADatos() {
  if (!reservaActual.hora) {
    alert('Por favor selecciona una hora disponible para tu cita.');
    return;
  }
  mostrarPasoDatosCliente();
}

// PASO 4: Datos del Cliente
function mostrarPasoDatosCliente() {
  document.getElementById('wizardTitulo').innerHTML = '<i class="fa-solid fa-id-card"></i> <span>4. Confirma tus Datos</span>';
  const body = document.getElementById('wizardBody');

  const seleccionados = serviciosData.filter(s => reservaActual.serviciosSeleccionados.includes(s.id));
  const nombresServicios = seleccionados.map(s => s.nombre).join(', ');

  body.innerHTML = `
    <!-- Tarjeta Resumen Prémium -->
    <div style="background: var(--bg-card); border: 1px solid var(--gold); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem; box-shadow: 0 4px 15px var(--gold-glow);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <span style="color: var(--text-muted); font-size: 0.85rem;">Fecha y Turno:</span>
        <strong style="color: var(--text-main); font-size: 0.95rem;"><i class="fa-solid fa-calendar-check text-gold mr-1"></i> ${formatearFechaLegible(reservaActual.fecha)} - ${formatearHora12(reservaActual.hora)}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <span style="color: var(--text-muted); font-size: 0.85rem;">Profesional Asignado:</span>
        <strong style="color: var(--gold); font-size: 0.95rem;"><i class="fa-solid fa-user-tie mr-1"></i> ${reservaActual.barberoNombre}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <span style="color: var(--text-muted); font-size: 0.85rem;">Servicios:</span>
        <strong style="color: var(--text-main); font-size: 0.9rem; text-align: right; max-width: 65%;">${nombresServicios}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.75rem; margin-top: 0.75rem;">
        <span style="color: var(--text-muted); font-size: 0.9rem; font-weight: 700;">Total en Caja:</span>
        <strong style="color: var(--gold); font-size: 1.3rem; font-weight: 900;">$${formatearPrecio(reservaActual.precioTotal)}</strong>
      </div>
    </div>

    <!-- Formulario -->
    <form id="formFinalReserva" onsubmit="confirmarReservaFinal(event)">
      <div class="form-group">
        <label>Nombre y Apellido *</label>
        <input type="text" id="cliNombre" class="form-control" placeholder="Ej: Camilo Andrés Martínez" required>
      </div>
      <div class="form-group">
        <label>Teléfono Celular / WhatsApp *</label>
        <input type="tel" id="cliTelefono" class="form-control" placeholder="Ej: 3109876543" required>
      </div>
      <div class="form-group">
        <label>Correo Electrónico (opcional para confirmación)</label>
        <input type="email" id="cliEmail" class="form-control" placeholder="ejemplo@gmail.com">
      </div>
      <div class="form-group">
        <label>Notas adicionales (opcional)</label>
        <textarea id="cliNotas" class="form-control" rows="2" placeholder="Indicaciones para el corte, barba o tratamiento..."></textarea>
      </div>

      <div style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
        <button type="button" onclick="mostrarPasoFechaHora()" class="btn btn-outline">
          <i class="fa-solid fa-arrow-left mr-1"></i> Volver
        </button>
        <button type="submit" class="btn btn-gold" id="btnConfirmarReserva" style="padding: 0.8rem 1.8rem;">
          <i class="fa-solid fa-scissors mr-1"></i> Confirmar Turno
        </button>
      </div>
    </form>
  `;
}

async function confirmarReservaFinal(e) {
  e.preventDefault();
  const btn = document.getElementById('btnConfirmarReserva');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Confirmando...';

  const hora24 = horaA24(reservaActual.hora);
  const fechaHoraInicio = `${reservaActual.fecha}T${hora24}:00`;

  const payload = {
    clienteNombre: document.getElementById('cliNombre').value,
    clienteTelefono: document.getElementById('cliTelefono').value,
    clienteEmail: document.getElementById('cliEmail').value,
    barberoId: reservaActual.barberoId,
    servicioIds: reservaActual.serviciosSeleccionados,
    fechaHoraInicio: fechaHoraInicio,
    notas: document.getElementById('cliNotas').value
  };

  try {
    const res = await fetch('/api/citas/publica', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.mensaje || 'Error al procesar la reserva');
    }

    const citaCreada = await res.json();
    mostrarPantallaExito(citaCreada);
  } catch (err) {
    alert(err.message);
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-scissors mr-1"></i> Confirmar Turno';
  }
}

function mostrarPantallaExito(cita) {
  document.getElementById('wizardTitulo').innerHTML = '<i class="fa-solid fa-circle-check text-success"></i> <span>¡Cita Confirmada con Éxito!</span>';
  const body = document.getElementById('wizardBody');

  const partesFecha = cita.fechaHoraInicio.split('T');
  const horaExito = partesFecha.length > 1 ? formatearHora12(partesFecha[1].substring(0, 5)) : '';
  const fechaFormateada = `${formatearFechaLegible(partesFecha[0])} a las ${horaExito}`;
  const whatsappMsg = encodeURIComponent(
    `¡Hola Key Barber! Acabo de agendar mi cita con código *${cita.codigo}* para el ${fechaFormateada} con ${cita.barberoNombre}.`
  );
  const whatsappUrl = `https://wa.me/${configuracionData.whatsapp || '573109876543'}?text=${whatsappMsg}`;

  body.innerHTML = `
    <div style="text-align: center; padding: 1.5rem 0;">
      <div style="width: 64px; height: 64px; background: rgba(16, 185, 129, 0.2); border: 2px solid var(--success); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem auto; color: var(--success); font-size: 2rem;">
        <i class="fa-solid fa-check"></i>
      </div>
      <h3 style="color: var(--gold); font-size: 1.6rem; font-weight: 800; margin-bottom: 0.35rem;">
        ¡Te esperamos, ${cita.clienteNombre}!
      </h3>
      <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem;">Tu cita ha quedado registrada en el sistema de la barbería.</p>

      <div style="background: var(--bg-card); border: 2px dashed var(--gold); border-radius: var(--radius-md); padding: 1.5rem 2rem; display: inline-block; margin-bottom: 1.75rem;">
        <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Código de Reserva</span>
        <div style="font-size: 2.4rem; font-weight: 900; letter-spacing: 3px; color: var(--text-main); margin-top: 0.25rem;">
          ${cita.codigo}
        </div>
      </div>

      <div style="background: var(--bg-card); border-radius: var(--radius-sm); border: 1px solid var(--border-color); padding: 1.25rem; text-align: left; max-width: 480px; margin: 0 auto 1.5rem auto; font-size: 0.9rem;">
        <p style="margin-bottom: 0.35rem;"><i class="fa-solid fa-user-tie text-gold mr-1"></i> <strong>Barbero:</strong> ${cita.barberoNombre}</p>
        <p style="margin-bottom: 0.35rem;"><i class="fa-regular fa-calendar-check text-gold mr-1"></i> <strong>Horario:</strong> ${fechaFormateada}</p>
        <p style="margin-bottom: 0.35rem;"><i class="fa-solid fa-scissors text-gold mr-1"></i> <strong>Servicios:</strong> ${cita.serviciosNombres.join(', ')}</p>
        <p><i class="fa-solid fa-receipt text-gold mr-1"></i> <strong>Total a Pagar en Caja:</strong> $${formatearPrecio(cita.precioTotal)}</p>
      </div>

      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <a href="${whatsappUrl}" target="_blank" class="btn btn-success" style="padding: 0.75rem 1.6rem;">
          <i class="fa-brands fa-whatsapp text-lg mr-1"></i> Compartir a WhatsApp
        </a>
        <button onclick="cerrarModalReserva()" class="btn btn-outline" style="padding: 0.75rem 1.6rem;">
          Finalizar
        </button>
      </div>
    </div>
  `;
}

// ==================== CONSULTAR CITA ====================

async function consultarCita() {
  const query = document.getElementById('inputConsulta').value.trim();
  const resDiv = document.getElementById('resultadoConsulta');
  if (!query) {
    alert('Ingresa tu código KB-XXXX o número de teléfono');
    return;
  }

  resDiv.style.display = 'block';
  resDiv.innerHTML = '<p style="color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Buscando reserva...</p>';

  try {
    let citas = [];
    if (query.toUpperCase().startsWith('KB-')) {
      const res = await fetch(`/api/citas/consultar/${encodeURIComponent(query)}`);
      if (res.ok) {
        const c = await res.json();
        citas = [c];
      }
    } else {
      const res = await fetch(`/api/citas/telefono/${encodeURIComponent(query)}`);
      if (res.ok) {
        citas = await res.json();
      }
    }

    if (citas.length === 0) {
      resDiv.innerHTML = `<p style="color: #fca5a5; font-size: 0.9rem;"><i class="fa-solid fa-circle-exclamation mr-1"></i> No se encontraron citas activas asociadas a "${query}".</p>`;
      return;
    }

    resDiv.innerHTML = citas.map(c => {
      const partesC = c.fechaHoraInicio.split('T');
      const horaC = partesC.length > 1 ? formatearHora12(partesC[1].substring(0, 5)) : '';
      const fechaC = formatearFechaLegible(partesC[0]);
      return `
      <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 1.15rem; margin-top: 0.65rem; text-align: left; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <strong style="color: var(--gold); font-size: 1.15rem;">${c.codigo}</strong>
            <span class="badge badge-${c.estado}">${c.estado}</span>
          </div>
          <div style="font-size: 0.88rem; color: var(--text-main); margin-top: 0.35rem;">
            <i class="fa-solid fa-user-tie text-gold mr-1"></i> ${c.barberoNombre} · <i class="fa-regular fa-clock text-gold mr-1"></i> ${fechaC} a las ${horaC}
          </div>
          <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.15rem;">
            <i class="fa-solid fa-scissors mr-1"></i> ${c.serviciosNombres.join(', ')} ($${formatearPrecio(c.precioTotal)})
          </div>
        </div>
      </div>
    `;
    }).join('');

  } catch (e) {
    resDiv.innerHTML = `<p style="color: var(--danger); font-size: 0.85rem;">Error al buscar cita.</p>`;
  }
}

// Helpers
function formatearPrecio(val) {
  if (!val) return '0';
  return Number(val).toLocaleString('es-CO');
}

function formatearFechaISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatearFechaLegible(fechaISO) {
  if (!fechaISO) return '';
  const partes = fechaISO.split('-');
  const fecha = new Date(partes[0], partes[1] - 1, partes[2]);
  const opciones = { weekday: 'long', day: 'numeric', month: 'long' };
  return fecha.toLocaleDateString('es-CO', opciones);
}

function formatearHora12(horaStr) {
  if (!horaStr || typeof horaStr !== 'string') return '';
  const clean = horaStr.trim().toUpperCase();
  if (clean.includes('AM') || clean.includes('PM')) {
    return clean;
  }
  const parts = clean.split(':');
  if (parts.length < 2) return horaStr;
  let h = parseInt(parts[0], 10);
  const m = parts[1].substring(0, 2);
  if (isNaN(h)) return horaStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const hStr = h < 10 ? '0' + h : '' + h;
  return `${hStr}:${m} ${ampm}`;
}

function horaA24(horaStr) {
  if (!horaStr || typeof horaStr !== 'string') return '09:00';
  const clean = horaStr.trim().toUpperCase();
  if (clean.includes('AM') || clean.includes('PM')) {
    const parts = clean.split(/\s+/);
    const hm = parts[0].split(':');
    let h = parseInt(hm[0], 10);
    const m = hm[1];
    const period = parts[1];
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  }
  return clean.substring(0, 5);
}
