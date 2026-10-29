// KEY BARBER - Lógica del Panel Administrativo & CRUD Completo con Selector de Archivos

let token = localStorage.getItem('kb_token') || null;
let usuarioActual = JSON.parse(localStorage.getItem('kb_user') || 'null');
let barberosAdmin = [];
let serviciosAdmin = [];
let citasAdminCargadas = [];

// Configuración de Agenda y Horario Semanal (Estilo ISIVI)
let agendaConfiguracion = {
  diasLaborales: [1, 2, 3, 4, 5, 6],
  horarios: [
    "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
    "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
    "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
    "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM",
    "08:00 PM"
  ]
};
let adminModalWorkingDays = [1, 2, 3, 4, 5, 6];
let adminModalAgendaSlots = [];

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

function normalizarFechaString(f) {
  if (!f) return '';
  if (Array.isArray(f) && f.length >= 3) {
    return `${f[0]}-${String(f[1]).padStart(2, '0')}-${String(f[2]).padStart(2, '0')}`;
  }
  if (typeof f === 'object' && f !== null && f.year && f.monthValue && f.dayOfMonth) {
    return `${f.year}-${String(f.monthValue).padStart(2, '0')}-${String(f.dayOfMonth).padStart(2, '0')}`;
  }
  return typeof f === 'string' ? f.substring(0, 10) : String(f);
}

function normalizarHoraString(h) {
  if (!h) return '00:00';
  if (Array.isArray(h) && h.length >= 2) {
    return `${String(h[0]).padStart(2, '0')}:${String(h[1]).padStart(2, '0')}`;
  }
  if (typeof h === 'object' && h !== null && h.hour !== undefined) {
    return `${String(h.hour).padStart(2, '0')}:${String(h.minute || 0).padStart(2, '0')}`;
  }
  if (typeof h === 'string') {
    if (h.includes('AM') || h.includes('PM')) return horaA24(h);
    return h.substring(0, 5);
  }
  return String(h).substring(0, 5);
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

function generarOpcionesHoras12(valorActual, incluirVacio = false) {
  let valorNormalizado = valorActual ? formatearHora12(valorActual) : '';

  const opciones = [];
  // Generar opciones de 06:00 AM a 11:30 PM en intervalos de 30 min
  for (let h = 6; h <= 23; h++) {
    for (let m = 0; m < 60; m += 30) {
      const ampm = h >= 12 ? 'PM' : 'AM';
      let h12 = h % 12;
      if (h12 === 0) h12 = 12;
      const hStr = h12 < 10 ? '0' + h12 : '' + h12;
      const mStr = m < 10 ? '0' + m : '' + m;
      opciones.push(`${hStr}:${mStr} ${ampm}`);
    }
  }

  if (valorNormalizado && !opciones.includes(valorNormalizado)) {
    opciones.push(valorNormalizado);
    opciones.sort((a, b) => agendaTimeInMinutes(a) - agendaTimeInMinutes(b));
  }

  let html = '';
  if (incluirVacio) {
    html += `<option value="" ${!valorNormalizado ? 'selected' : ''}>-- Sin pausa / No aplica --</option>`;
  }
  html += opciones.map(opt => `
    <option value="${opt}" ${opt === valorNormalizado ? 'selected' : ''}>${opt}</option>
  `).join('');
  return html;
}

function descomponerHora12(horaStr, defaultH = '09', defaultM = '00', defaultP = 'AM') {
  if (!horaStr || typeof horaStr !== 'string') {
    return { h: defaultH, m: defaultM, p: defaultP };
  }
  const clean = horaStr.trim().toUpperCase();
  if (clean.includes('AM') || clean.includes('PM')) {
    const parts = clean.split(/\s+/);
    const hm = parts[0].split(':');
    let h = parseInt(hm[0], 10);
    const m = hm[1] ? hm[1].substring(0, 2) : '00';
    const p = parts[1] || 'AM';
    if (isNaN(h)) h = parseInt(defaultH, 10);
    return {
      h: String(h).padStart(2, '0'),
      m: m,
      p: p
    };
  } else {
    const parts = clean.split(':');
    if (parts.length >= 2) {
      let h = parseInt(parts[0], 10);
      const m = parts[1].substring(0, 2);
      if (!isNaN(h)) {
        const p = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        return {
          h: String(h).padStart(2, '0'),
          m: m,
          p: p
        };
      }
    }
  }
  return { h: defaultH, m: defaultM, p: defaultP };
}

function renderSelectorHora12(idPrefix, valorInicial, label, defaultH = '09', defaultM = '00', defaultP = 'AM') {
  const { h, m, p } = descomponerHora12(valorInicial, defaultH, defaultM, defaultP);
  
  const horas = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const minutos = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
  
  const minutosLista = minutos.includes(m) ? minutos : [...minutos, m].sort();

  return `
    <div class="form-group" style="margin-bottom: 0.85rem;">
      <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.35rem; display: block;">${label}</label>
      <div style="display: flex; gap: 0.35rem; align-items: center;">
        <select id="${idPrefix}_h" class="form-control" style="flex: 1; min-width: 55px; padding: 0.45rem 0.25rem; text-align: center; font-weight: 700; font-size: 0.85rem;">
          ${horas.map(hora => `<option value="${hora}" ${hora === h ? 'selected' : ''}>${hora}</option>`).join('')}
        </select>
        <span style="font-weight: 800; color: var(--text-muted); font-size: 1rem; line-height: 1;">:</span>
        <select id="${idPrefix}_m" class="form-control" style="flex: 1; min-width: 55px; padding: 0.45rem 0.25rem; text-align: center; font-weight: 700; font-size: 0.85rem;">
          ${minutosLista.map(min => `<option value="${min}" ${min === m ? 'selected' : ''}>${min}</option>`).join('')}
        </select>
        <select id="${idPrefix}_p" class="form-control" style="width: auto; min-width: 65px; padding: 0.45rem 0.35rem; font-weight: 800; color: var(--gold); text-align: center; font-size: 0.85rem;">
          <option value="AM" ${p === 'AM' ? 'selected' : ''}>AM</option>
          <option value="PM" ${p === 'PM' ? 'selected' : ''}>PM</option>
        </select>
      </div>
    </div>
  `;
}

function leerSelectorHora12(idPrefix) {
  const h = document.getElementById(`${idPrefix}_h`)?.value || '09';
  const m = document.getElementById(`${idPrefix}_m`)?.value || '00';
  const p = document.getElementById(`${idPrefix}_p`)?.value || 'AM';
  return `${h}:${m} ${p}`;
}

function agendaTimeInMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const clean = timeStr.trim();
  if (!clean) return 0;

  const is12h = clean.toUpperCase().includes('AM') || clean.toUpperCase().includes('PM');
  if (is12h) {
    const parts = clean.split(/\s+/);
    const timePart = parts[0] || '';
    const period = (parts[1] || '').toUpperCase();
    const [hStr, mStr] = timePart.split(':');
    let h = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  } else {
    const [hStr, mStr] = clean.split(':');
    const h = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;
    return h * 60 + m;
  }
}

// Imagen en memoria para el servicio actual
let imagenServicioData = '';
let imagenBarberoData = '';

document.addEventListener('DOMContentLoaded', () => {
  if (token) {
    mostrarDashboard();
  } else {
    mostrarLogin();
  }
});

// ==================== AUTENTICACIÓN ====================

async function iniciarSesion(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');
  errorDiv.style.display = 'none';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.mensaje || 'Error de credenciales');
    }

    const data = await res.json();
    token = data.token;
    usuarioActual = data;
    localStorage.setItem('kb_token', token);
    localStorage.setItem('kb_user', JSON.stringify(usuarioActual));

    mostrarDashboard();
  } catch (err) {
    errorDiv.textContent = err.message;
    errorDiv.style.display = 'block';
  }
}

function cerrarSesion() {
  localStorage.removeItem('kb_token');
  localStorage.removeItem('kb_user');
  token = null;
  usuarioActual = null;
  mostrarLogin();
}

function mostrarLogin() {
  document.getElementById('loginView').style.display = 'flex';
  document.getElementById('dashboardView').style.display = 'none';
}

function mostrarDashboard() {
  document.getElementById('loginView').style.display = 'none';
  document.getElementById('dashboardView').style.display = 'flex';
  document.getElementById('userName').textContent = usuarioActual ? usuarioActual.email : 'Admin';
  document.getElementById('userRole').textContent = usuarioActual ? usuarioActual.rol.replace('ROLE_', '') : 'ADMIN';

  document.getElementById('filtroFechaCitas').value = obtenerFechaHoyISO();
  cargarBarberosParaFiltro();
  cargarHorarioSemanal();
  cargarAgendaVisual();
  cargarCitasAdmin();
  cargarMetricasAdmin();
}

async function fetchAuth(url, options = {}) {
  const headers = options.headers || {};
  headers['Authorization'] = `Bearer ${token}`;
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 || res.status === 403) {
    cerrarSesion();
    throw new Error('Sesión finalizada. Inicia sesión nuevamente.');
  }
  return res;
}

// ==================== TABS DE NAVEGACIÓN ====================

function cambiarTab(tabName, btn) {
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.admin-sidebar nav button').forEach(b => {
    b.classList.remove('btn-gold');
    b.classList.add('btn-outline');
  });
  if (btn) {
    btn.classList.add('btn-gold');
    btn.classList.remove('btn-outline');
  }

  if (tabName === 'citas' || tabName === 'agenda') {
    document.getElementById('tabCitas').style.display = 'block';
    cargarAgendaVisual();
    cargarCitasAdmin();
  } else if (tabName === 'historial') {
    document.getElementById('tabHistorial').style.display = 'block';
    cargarHistorialAdmin();
  } else if (tabName === 'metricas') {
    document.getElementById('tabMetricas').style.display = 'block';
    cargarMetricasAdmin();
  } else if (tabName === 'servicios') {
    document.getElementById('tabServicios').style.display = 'block';
    actualizarPreviewEnVivo();
    cargarServiciosAdmin();
  } else if (tabName === 'barberos') {
    document.getElementById('tabBarberos').style.display = 'block';
    cargarBarberosAdmin();
  } else if (tabName === 'bloqueos') {
    document.getElementById('tabBloqueos').style.display = 'block';
    cargarBloqueosAdmin();
  } else if (tabName === 'configuracion') {
    document.getElementById('tabConfiguracion').style.display = 'block';
    cargarConfiguracionAdmin();
  }
}

// ==================== TAB 1: AGENDA INTERACTIVA Y CITAS (ESTILO ISIVI) ====================

let modoAgendaVisual = 'SEMANAL'; // 'SEMANAL' o 'FECHA'
let agendaSemanaOffset = 0;
let fechaSeleccionadaAgenda = obtenerFechaHoyISO();
let citasVisualesCache = [];
let bloqueosVisualesCache = [];

function cambiarModoAgendaVisual(modo) {
  modoAgendaVisual = modo;
  const btnSem = document.getElementById('btnModoSemanal');
  const btnFec = document.getElementById('btnModoFecha');
  const tit = document.getElementById('tituloVistaAgenda');
  const sub = document.getElementById('subtituloVistaAgenda');

  if (modo === 'SEMANAL') {
    if (btnSem) {
      btnSem.style.background = '#C5A059';
      btnSem.style.color = '#000000';
    }
    if (btnFec) {
      btnFec.style.background = 'transparent';
      btnFec.style.color = '#94A3B8';
    }
    if (tit) tit.textContent = 'AGENDA SEMANAL';
    if (sub) sub.textContent = 'Visualiza la disponibilidad y las citas de toda la semana. Haz clic en un horario para gestionarlo.';
  } else {
    if (btnSem) {
      btnSem.style.background = 'transparent';
      btnSem.style.color = '#94A3B8';
    }
    if (btnFec) {
      btnFec.style.background = '#C5A059';
      btnFec.style.color = '#000000';
    }
    if (tit) tit.textContent = 'DISPONIBILIDAD Y BLOQUEOS POR FECHA';
    if (sub) sub.textContent = 'Gestiona los turnos, bloqueos y citas reservados para la fecha seleccionada.';
  }
  cargarAgendaVisual();
}

function navegarSemanaAgenda(diff) {
  agendaSemanaOffset += diff;
  cargarAgendaVisual();
}

function irASemanaActualAgenda() {
  agendaSemanaOffset = 0;
  cargarAgendaVisual();
}

function cambiarFechaVistaDiaria(nuevaFecha) {
  if (nuevaFecha) {
    fechaSeleccionadaAgenda = nuevaFecha;
    cargarAgendaVisual();
  }
}

function obtenerFechasSemana(offsetSemanas = 0) {
  const ref = new Date();
  ref.setDate(ref.getDate() + (offsetSemanas * 7));
  
  const diaSemana = ref.getDay(); // 0=Dom, 1=Lun ...
  const diffAlLunes = (diaSemana === 0 ? -6 : 1) - diaSemana;
  
  const lunes = new Date(ref);
  lunes.setDate(ref.getDate() + diffAlLunes);
  lunes.setHours(0, 0, 0, 0);

  const dias = [];
  const nombresCortos = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
  const diasIndiceISO = [1, 2, 3, 4, 5, 6, 7];

  for (let i = 0; i < 7; i++) {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const iso = `${yyyy}-${mm}-${dd}`;
    dias.push({
      fechaISO: iso,
      diaNombreCorto: nombresCortos[i],
      diaNumero: d.getDate(),
      diaSemanaIndice: diasIndiceISO[i],
      esHoy: iso === obtenerFechaHoyISO(),
      dateObj: d
    });
  }
  return dias;
}

async function cargarAgendaVisual() {
  const contenedor = document.getElementById('contenedorAgendaVisual');
  if (!contenedor) return;

  try {
    const res = await fetch('/api/agenda');
    if (res.ok) {
      agendaConfiguracion = await res.json();
    }
  } catch (e) {
    console.error('Error al cargar config agenda:', e);
  }

  if (modoAgendaVisual === 'SEMANAL') {
    await renderAgendaSemanalVisual();
  } else {
    await renderAgendaPorFechaVisual();
  }
}

function cargarHorarioSemanal() {
  cargarAgendaVisual();
}

async function renderAgendaSemanalVisual() {
  const contenedor = document.getElementById('contenedorAgendaVisual');
  if (!contenedor) return;

  const diasSemana = obtenerFechasSemana(agendaSemanaOffset);
  const fechaInicio = diasSemana[0].fechaISO;
  const fechaFin = diasSemana[6].fechaISO;

  contenedor.innerHTML = `
    <div style="text-align: center; color: #94A3B8; padding: 2.5rem;">
      <i class="fa-solid fa-spinner fa-spin text-gold mr-2 text-xl"></i> Cargando agenda semanal...
    </div>
  `;

  let citas = [];
  let bloqueos = [];
  try {
    const [resCitas, resBloq] = await Promise.all([
      fetchAuth(`/api/citas/rango?inicio=${fechaInicio}T00:00:00&fin=${fechaFin}T23:59:59&barberoId=TODOS`),
      fetchAuth(`/api/agenda/bloqueos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`)
    ]);
    citas = await resCitas.json();
    bloqueos = await resBloq.json();
    citasVisualesCache = citas;
    bloqueosVisualesCache = bloqueos;
  } catch (e) {
    console.warn('Error fetching visual week data:', e);
  }

  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const d1 = diasSemana[0].dateObj;
  const d2 = diasSemana[6].dateObj;
  const rangoTexto = d1.getMonth() === d2.getMonth()
    ? `${d1.getDate()} al ${d2.getDate()} de ${meses[d1.getMonth()]}`
    : `${d1.getDate()} de ${meses[d1.getMonth()]} — ${d2.getDate()} de ${meses[d2.getMonth()]}`;

  const sortedSlots = [...(agendaConfiguracion.horarios || [])].sort((a, b) => agendaTimeInMinutes(a) - agendaTimeInMinutes(b));

  let html = `
    <!-- Barra superior de navegación y leyenda estilo ISIVI -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
      <!-- Leyenda de colores -->
      <div style="display: flex; gap: 0.85rem; font-size: 0.76rem; font-weight: 700; color: #94A3B8; flex-wrap: wrap; align-items: center;">
        <span style="display: inline-flex; align-items: center; gap: 0.35rem;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: #94A3B8;"></span> Disponible
        </span>
        <span style="display: inline-flex; align-items: center; gap: 0.35rem;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: #F59E0B;"></span> Pendiente
        </span>
        <span style="display: inline-flex; align-items: center; gap: 0.35rem;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: #10B981;"></span> Confirmada
        </span>
        <span style="display: inline-flex; align-items: center; gap: 0.35rem;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: #EAB308;"></span> En Atención
        </span>
        <span style="display: inline-flex; align-items: center; gap: 0.35rem;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: #EF4444;"></span> Bloqueado
        </span>
      </div>

      <!-- Navegación de semana -->
      <div style="display: flex; align-items: center; gap: 0.45rem;">
        <button type="button" onclick="navegarSemanaAgenda(-1)" title="Semana anterior" class="btn-nav-semana">
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <span style="font-size: 0.88rem; font-weight: 800; color: #C5A059; padding: 0.35rem 0.75rem; background: #181C26; border-radius: 6px; border: 1px solid rgba(197, 160, 89, 0.25);">
          ${rangoTexto}
        </span>
        <button type="button" onclick="navegarSemanaAgenda(1)" title="Semana siguiente" class="btn-nav-semana">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
        <button type="button" onclick="irASemanaActualAgenda()" class="btn-nav-hoy">
          Hoy
        </button>
      </div>
    </div>

    <!-- Rejilla semanal de 7 columnas -->
    <div style="overflow-x: auto; padding-bottom: 0.5rem;">
      <div style="display: grid; grid-template-columns: repeat(7, minmax(115px, 1fr)); gap: 0.55rem; min-width: 800px;">
  `;

  diasSemana.forEach(d => {
    const esDiaLaboral = (agendaConfiguracion.diasLaborales || []).includes(d.diaSemanaIndice)
      || (d.diaSemanaIndice === 7 && (agendaConfiguracion.diasLaborales || []).includes(0));

    html += `
      <div style="display: flex; flex-direction: column;">
        <!-- Cabecera del día -->
        <div style="text-align: center; padding: 0.65rem 0.35rem; margin-bottom: 0.65rem; border-bottom: 2px solid ${d.esHoy ? '#C5A059' : 'rgba(255,255,255,0.06)'}; background: ${d.esHoy ? 'rgba(197, 160, 89, 0.12)' : '#141720'}; border-radius: 8px;">
          <span style="font-size: 0.75rem; font-weight: 800; color: ${d.esHoy ? '#C5A059' : '#94A3B8'}; text-transform: uppercase; display: block; letter-spacing: 0.5px;">${d.diaNombreCorto}</span>
          <span style="display: inline-block; width: 30px; height: 30px; line-height: 30px; border-radius: 50%; font-size: 0.95rem; font-weight: 800; margin-top: 0.25rem; ${d.esHoy ? 'background: #C5A059; color: #000000; box-shadow: 0 0 12px rgba(197,160,89,0.5);' : 'color: #FFFFFF;'}">
            ${d.diaNumero}
          </span>
        </div>

        <!-- Ranuras de turnos para este día -->
        <div style="display: flex; flex-direction: column; gap: 0.45rem;">
    `;

    if (!esDiaLaboral) {
      html += `
        <div style="background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.08); border-radius: 8px; padding: 1.5rem 0.5rem; text-align: center; color: #64748B; font-size: 0.75rem; font-weight: 700;">
          <i class="fa-solid fa-moon mr-1" style="display: block; font-size: 1.25rem; margin-bottom: 0.4rem; opacity: 0.4;"></i>
          No laboral
        </div>
      `;
    } else {
      sortedSlots.forEach(slot => {
        const slot24 = horaA24(slot);
        const slotDateTime = new Date(`${d.fechaISO}T${slot24}:00`);
        const ahora = new Date();
        const esPasado = slotDateTime < ahora;

        const cita = (citas || []).find(c => {
          if (c.estado === 'CANCELADA') return false;
          const [cFecha, cHora] = c.fechaHoraInicio.split('T');
          return cFecha === d.fechaISO && cHora.substring(0, 5) === slot24;
        });

        const bloqueo = (bloqueos || []).find(b => {
          if (normalizarFechaString(b.fecha) !== d.fechaISO) return false;
          const bIni = normalizarHoraString(b.horaInicio);
          let bFin = normalizarHoraString(b.horaFin);
          if (bFin <= bIni) {
            const [bh, bm] = bIni.split(':').map(Number);
            const finMin = bh * 60 + bm + 30;
            bFin = `${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}`;
          }
          return slot24 >= bIni && slot24 < bFin;
        });

        let estado = 'DISPONIBLE';
        let badge = '<span style="color: #94A3B8; font-size: 0.7rem; font-weight: 600;">● Disponible</span>';
        let cardBg = '#181C26';
        let borderColor = 'rgba(255, 255, 255, 0.08)';
        let extraInfo = '';

        if (cita) {
          estado = 'CITA';
          if (cita.estado === 'EN_PROCESO') {
            badge = '<span style="color: #EAB308; font-size: 0.72rem; font-weight: 800;"><i class="fa-solid fa-scissors mr-1"></i>En Atención</span>';
            cardBg = 'rgba(234, 179, 8, 0.15)';
            borderColor = '#EAB308';
          } else if (cita.estado === 'CONFIRMADA') {
            badge = '<span style="color: #10B981; font-size: 0.72rem; font-weight: 700;">● Confirmada</span>';
            cardBg = 'rgba(16, 185, 129, 0.12)';
            borderColor = 'rgba(16, 185, 129, 0.4)';
          } else if (cita.estado === 'PENDIENTE') {
            badge = '<span style="color: #F59E0B; font-size: 0.72rem; font-weight: 700;">● Pendiente</span>';
            cardBg = 'rgba(245, 158, 11, 0.12)';
            borderColor = 'rgba(245, 158, 11, 0.4)';
          } else {
            badge = '<span style="color: #A855F7; font-size: 0.72rem; font-weight: 700;">● Cobrada</span>';
            cardBg = 'rgba(168, 85, 247, 0.1)';
            borderColor = 'rgba(168, 85, 247, 0.3)';
          }
          const clientePrimerNombre = (cita.clienteNombre || 'Cliente').split(' ')[0];
          extraInfo = `<div style="font-size: 0.68rem; font-weight: 700; color: #FFFFFF; margin-top: 0.2rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${clientePrimerNombre}</div>`;
        } else if (bloqueo) {
          estado = 'BLOQUEADO';
          badge = '<span style="color: #EF4444; font-size: 0.72rem; font-weight: 700;">● Bloqueado</span>';
          cardBg = 'rgba(239, 68, 68, 0.12)';
          borderColor = 'rgba(239, 68, 68, 0.4)';
          extraInfo = `<div style="font-size: 0.68rem; color: #FCA5A5; margin-top: 0.15rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${bloqueo.motivo || 'Manual'}</div>`;
        } else if (esPasado) {
          estado = 'PASADO';
          badge = '<span style="color: #64748B; font-size: 0.7rem; font-weight: 600;"><i class="fa-solid fa-clock-rotate-left mr-1"></i>Pasado</span>';
          cardBg = '#13161E';
          borderColor = 'rgba(255, 255, 255, 0.04)';
        }

        html += `
          <div class="agenda-slot-card" onclick="gestionarSlotAgenda('${d.fechaISO}', '${slot}', '${estado}', '${cita ? cita.id : ''}', '${bloqueo ? bloqueo.id : ''}')"
            style="background: ${cardBg}; border: 1px solid ${borderColor}; border-radius: 8px; padding: 0.55rem 0.45rem; text-align: center; cursor: pointer; transition: all 0.2s ease;">
            <div style="font-size: 0.8rem; font-weight: 800; color: #FFFFFF; letter-spacing: 0.3px;">
              ${formatearHora12(slot)}
            </div>
            <div style="margin-top: 0.25rem;">
              ${badge}
            </div>
            ${extraInfo}
          </div>
        `;
      });
    }

    html += `
        </div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  contenedor.innerHTML = html;
}

async function renderAgendaPorFechaVisual() {
  const contenedor = document.getElementById('contenedorAgendaVisual');
  if (!contenedor) return;

  const fecha = fechaSeleccionadaAgenda || obtenerFechaHoyISO();

  contenedor.innerHTML = `
    <div style="text-align: center; color: #94A3B8; padding: 2.5rem;">
      <i class="fa-solid fa-spinner fa-spin text-gold mr-2 text-xl"></i> Consultando turnos para ${fecha}...
    </div>
  `;

  let citas = [];
  let bloqueos = [];
  try {
    const [resCitas, resBloq] = await Promise.all([
      fetchAuth(`/api/citas/rango?inicio=${fecha}T00:00:00&fin=${fecha}T23:59:59&barberoId=TODOS`),
      fetchAuth(`/api/agenda/bloqueos?fechaInicio=${fecha}&fechaFin=${fecha}`)
    ]);
    citas = await resCitas.json();
    bloqueos = await resBloq.json();
    citasVisualesCache = citas;
    bloqueosVisualesCache = bloqueos;
  } catch (e) {
    console.warn('Error fetching daily data:', e);
  }

  const sortedSlots = [...(agendaConfiguracion.horarios || [])].sort((a, b) => agendaTimeInMinutes(a) - agendaTimeInMinutes(b));

  let html = `
    <!-- Barra de control por fecha estilo Imagen 3 -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem; background: #141720; padding: 0.85rem 1rem; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.06);">
      <div style="font-size: 0.9rem; font-weight: 700; color: #E2E8F0;">
        <i class="fa-regular fa-calendar-check text-gold mr-1"></i> Gestionando la fecha: <strong style="color: #C5A059;">${fecha}</strong>
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <input type="date" value="${fecha}" onchange="cambiarFechaVistaDiaria(this.value)" class="form-control" style="width: auto; background: #181C26; color: #FFFFFF; border-color: rgba(197, 160, 89, 0.4); font-size: 0.85rem; padding: 0.45rem 0.75rem;">
        <button type="button" onclick="cambiarFechaVistaDiaria(obtenerFechaHoyISO())" class="btn-nav-hoy">Hoy</button>
      </div>
    </div>

    <!-- Rejilla de chips estilo Imagen 3 -->
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 0.65rem;">
  `;

  sortedSlots.forEach(slot => {
    const slot24 = horaA24(slot);
    const slotDateTime = new Date(`${fecha}T${slot24}:00`);
    const ahora = new Date();
    const esPasado = slotDateTime < ahora;

    const cita = (citas || []).find(c => {
      if (c.estado === 'CANCELADA') return false;
      const [cFecha, cHora] = c.fechaHoraInicio.split('T');
      return cFecha === fecha && cHora.substring(0, 5) === slot24;
    });

    const bloqueo = (bloqueos || []).find(b => {
      if (normalizarFechaString(b.fecha) !== fecha) return false;
      const bIni = normalizarHoraString(b.horaInicio);
      let bFin = normalizarHoraString(b.horaFin);
      if (bFin <= bIni) {
        const [bh, bm] = bIni.split(':').map(Number);
        const finMin = bh * 60 + bm + 30;
        bFin = `${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}`;
      }
      return slot24 >= bIni && slot24 < bFin;
    });

    let estado = 'DISPONIBLE';
    let badge = '<span style="color: #22C55E; font-weight: 700;">● Disponible</span>';
    let cardBg = '#181C26';
    let borderColor = 'rgba(255, 255, 255, 0.08)';

    if (cita) {
      estado = 'CITA';
      if (cita.estado === 'EN_PROCESO') {
        badge = '<span style="color: #EAB308; font-weight: 800;"><i class="fa-solid fa-scissors mr-1"></i>En Atención</span>';
        cardBg = 'rgba(234, 179, 8, 0.15)';
        borderColor = '#EAB308';
      } else {
        badge = '<span style="color: #F59E0B; font-weight: 700;">● Reservado cliente</span>';
        cardBg = 'rgba(245, 158, 11, 0.12)';
        borderColor = 'rgba(245, 158, 11, 0.4)';
      }
    } else if (bloqueo) {
      estado = 'BLOQUEADO';
      badge = '<span style="color: #EF4444; font-weight: 700;">● Bloqueado manual</span>';
      cardBg = 'rgba(239, 68, 68, 0.12)';
      borderColor = 'rgba(239, 68, 68, 0.4)';
    } else if (esPasado) {
      estado = 'PASADO';
      badge = '<span style="color: #64748B; font-weight: 600;"><i class="fa-solid fa-clock-rotate-left mr-1"></i>Pasado</span>';
      cardBg = '#13161E';
      borderColor = 'rgba(255, 255, 255, 0.04)';
    }

    html += `
      <div class="agenda-slot-card" onclick="gestionarSlotAgenda('${fecha}', '${slot}', '${estado}', '${cita ? cita.id : ''}', '${bloqueo ? bloqueo.id : ''}')"
        style="background: ${cardBg}; border: 1px solid ${borderColor}; border-radius: 10px; padding: 0.75rem 0.85rem; text-align: center; cursor: pointer; transition: all 0.2s ease;">
        <div style="font-size: 0.85rem; font-weight: 800; color: #FFFFFF;">
          <i class="fa-regular fa-clock text-gold mr-1" style="font-size: 0.75rem;"></i>${formatearHora12(slot)}
        </div>
        <div style="margin-top: 0.35rem; font-size: 0.72rem;">
          ${badge}
        </div>
        ${cita ? `<div style="font-size: 0.7rem; color: #E2E8F0; margin-top: 0.25rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${cita.clienteNombre}</div>` : ''}
      </div>
    `;
  });

  html += `
    </div>

    <!-- Leyenda idéntica a Imagen 3 -->
    <div style="display: flex; gap: 1.25rem; justify-content: center; margin-top: 1.5rem; font-size: 0.78rem; font-weight: 700; color: #94A3B8; flex-wrap: wrap;">
      <span style="color: #22C55E;">● Disponible</span>
      <span>·</span>
      <span style="color: #EF4444;">● Bloqueado / Ocupado manualmente</span>
      <span>·</span>
      <span style="color: #F59E0B;">● Reservado por cliente</span>
    </div>
  `;

  contenedor.innerHTML = html;
}

async function gestionarSlotAgenda(fecha, hora, estado, citaId, bloqueoId) {
  if (estado === 'CITA' && citaId) {
    const cita = (citasVisualesCache || []).find(c => c.id === citaId);
    if (!cita) return;

    document.getElementById('modalAdminTitulo').innerHTML = `<i class="fa-solid fa-scissors text-gold mr-1"></i> Detalle de Cita: ${cita.codigo}`;
    const body = document.getElementById('modalAdminBody');

    body.innerHTML = `
      <div style="padding: 0.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem; margin-bottom: 1rem;">
          <div>
            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Estado actual</span>
            <div style="margin-top: 0.15rem;"><span class="badge badge-${cita.estado}">${cita.estado}</span></div>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total a Cobrar</span>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--gold);">$${Number(cita.precioTotal).toLocaleString('es-CO')}</div>
          </div>
        </div>

        <div style="font-size: 0.9rem; line-height: 1.9; margin-bottom: 1.25rem; background: var(--bg-card); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          <div><strong><i class="fa-regular fa-clock mr-1 text-gold"></i> Horario:</strong> ${cita.fechaHoraInicio.split('T')[0]} a las ${formatearHora12(cita.fechaHoraInicio.split('T')[1].substring(0, 5))}</div>
          <div><strong><i class="fa-solid fa-user mr-1 text-gold"></i> Cliente:</strong> ${cita.clienteNombre}</div>
          <div><strong><i class="fa-solid fa-phone mr-1 text-gold"></i> Teléfono:</strong> <a href="tel:${cita.clienteTelefono}" style="color: var(--gold); text-decoration: none; font-weight: 700;">${cita.clienteTelefono}</a></div>
          <div><strong><i class="fa-solid fa-user-tie mr-1 text-gold"></i> Barbero:</strong> ${cita.barberoNombre}</div>
          <div><strong><i class="fa-solid fa-scissors mr-1 text-gold"></i> Servicios:</strong> ${cita.serviciosNombres.join(', ')}</div>
        </div>

        <div style="display: flex; gap: 0.5rem; justify-content: flex-end; flex-wrap: wrap;">
          ${cita.estado === 'CONFIRMADA' ? `
            <button onclick="accionCitaDesdeAgenda('${cita.id}', 'EN_PROCESO')" class="btn btn-gold" style="padding: 0.65rem 1.1rem;">
              <i class="fa-solid fa-scissors mr-1"></i> Iniciar Atención (En Proceso)
            </button>
          ` : ''}
          ${cita.estado === 'EN_PROCESO' ? `
            <button onclick="accionCitaDesdeAgenda('${cita.id}', 'COMPLETADA')" class="btn btn-success" style="padding: 0.65rem 1.1rem;">
              <i class="fa-solid fa-check mr-1"></i> Cobrar y Completar
            </button>
          ` : ''}
          ${cita.estado !== 'COMPLETADA' && cita.estado !== 'CANCELADA' ? `
            <button onclick="cancelarCitaAdmin('${cita.id}'); cerrarModalAdmin();" class="btn btn-danger" style="padding: 0.65rem 0.9rem;">
              <i class="fa-solid fa-xmark mr-1"></i> Cancelar Cita
            </button>
          ` : ''}
          <button onclick="cerrarModalAdmin()" class="btn btn-outline" style="padding: 0.65rem 0.9rem;">
            Cerrar
          </button>
        </div>
      </div>
    `;
    document.getElementById('modalAdmin').classList.add('active');
    return;
  }

  if (estado === 'BLOQUEADO') {
    const slot24 = horaA24(hora);
    let bloqueo = (bloqueosVisualesCache || []).find(b => {
      if (bloqueoId && b.id === bloqueoId) return true;
      if (normalizarFechaString(b.fecha) !== fecha) return false;
      const bIni = normalizarHoraString(b.horaInicio);
      let bFin = normalizarHoraString(b.horaFin);
      if (bFin <= bIni) {
        const [bh, bm] = bIni.split(':').map(Number);
        const finMin = bh * 60 + bm + 30;
        bFin = `${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}`;
      }
      return slot24 >= bIni && slot24 < bFin;
    });

    const targetId = bloqueo ? bloqueo.id : bloqueoId;
    const bIniStr = bloqueo ? formatearHora12(normalizarHoraString(bloqueo.horaInicio)) : formatearHora12(hora);
    const bFinStr = (bloqueo && bloqueo.horaFin) ? formatearHora12(normalizarHoraString(bloqueo.horaFin)) : '';
    const rangoTexto = bFinStr ? `${bIniStr} a ${bFinStr}` : bIniStr;
    const barberoNom = bloqueo && bloqueo.barberoId && bloqueo.barberoId !== 'TODOS'
      ? ((barberosAdmin || []).find(x => x.id === bloqueo.barberoId)?.nombre || 'Barbero asignado')
      : 'Toda la barbería (Cierre / Feriado)';
    const motivoTexto = bloqueo ? (bloqueo.motivo || 'Bloqueo manual') : 'Bloqueo manual';

    document.getElementById('modalAdminTitulo').innerHTML = `<i class="fa-solid fa-lock text-gold mr-1"></i> Turno Bloqueado`;
    const body = document.getElementById('modalAdminBody');

    body.innerHTML = `
      <div style="padding: 0.5rem; text-align: center;">
        <div style="font-size: 2.2rem; color: var(--danger); margin-bottom: 0.75rem;">
          <i class="fa-solid fa-lock"></i>
        </div>
        <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.35rem;">
          Horario Bloqueado
        </h4>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">
          Fecha: <strong>${fecha}</strong> &nbsp;|&nbsp; Turno: <strong style="color: var(--gold);">${formatearHora12(hora)}</strong>
        </p>

        <div style="background: var(--bg-card); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size: 0.85rem; text-align: left; margin-bottom: 1.25rem; line-height: 1.8;">
          <div><strong><i class="fa-regular fa-clock mr-1 text-gold"></i> Horario bloqueado:</strong> ${rangoTexto}</div>
          <div><strong><i class="fa-solid fa-user-tie mr-1 text-gold"></i> Aplica a:</strong> ${barberoNom}</div>
          <div><strong><i class="fa-solid fa-note-sticky mr-1 text-gold"></i> Motivo:</strong> ${motivoTexto}</div>
        </div>

        <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
          ${targetId ? `
            <button onclick="desbloquearHorarioDesdeAgenda('${targetId}')" class="btn btn-danger" style="padding: 0.65rem 1.25rem; font-weight: 800;">
              <i class="fa-solid fa-lock-open mr-1"></i> Desbloquear Horario
            </button>
          ` : `
            <p style="color: var(--danger); font-size: 0.8rem; width: 100%;">No se pudo identificar el código para eliminar este bloqueo.</p>
          `}
          <button onclick="cerrarModalAdmin()" class="btn btn-outline" style="padding: 0.65rem 1rem;">
            Cerrar
          </button>
        </div>
      </div>
    `;
    document.getElementById('modalAdmin').classList.add('active');
    return;
  }

  if (estado === 'DISPONIBLE') {
    const slot24 = horaA24(hora);
    const [hSlot, mSlot] = slot24.split(':').map(Number);
    const finSlotMin = hSlot * 60 + mSlot + 30;
    const hFinVal = Math.floor(finSlotMin / 60);
    const mFinVal = finSlotMin % 60;
    const horaFin24Default = `${String(hFinVal).padStart(2, '0')}:${String(mFinVal).padStart(2, '0')}`;
    const horaFin12Default = formatearHora12(horaFin24Default);

    const descompIni = descomponerHora12(hora, '09', '00', 'AM');
    const descompFin = descomponerHora12(horaFin12Default, '09', '30', 'AM');

    document.getElementById('modalAdminTitulo').innerHTML = `<i class="fa-solid fa-shield-halved text-gold mr-1"></i> Bloquear Horario`;
    const body = document.getElementById('modalAdminBody');

    body.innerHTML = `
      <div style="padding: 0.5rem;">
        <div style="margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
          <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); margin: 0 0 0.25rem 0;">
            Bloquear Horario de Agenda
          </h4>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0;">
            Fecha: <strong>${fecha}</strong> &nbsp;|&nbsp; Turno inicial: <strong style="color: var(--gold);">${formatearHora12(hora)}</strong>
          </p>
        </div>

        <!-- Opción Rápida: Solo este turno -->
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.85rem 1rem; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <div style="font-weight: 800; font-size: 0.88rem; color: var(--text-main);">
              <i class="fa-solid fa-bolt text-gold mr-1"></i> Bloqueo Rápido
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.15rem;">
              Bloquea solo este turno de 30 minutos (${formatearHora12(hora)})
            </div>
          </div>
          <button onclick="bloquearHorarioPuntual('${fecha}', '${hora}')" class="btn btn-outline" style="border-color: rgba(197, 160, 89, 0.4); color: var(--gold); padding: 0.45rem 0.95rem; font-size: 0.82rem; font-weight: 700;">
            <i class="fa-solid fa-lock mr-1"></i> Bloquear Solo Este Turno
          </button>
        </div>

        <!-- Opción a tu Gusto: Rango personalizado -->
        <form onsubmit="bloquearHorarioPersonalizado(event, '${fecha}')" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 1rem;">
          <div style="font-weight: 800; font-size: 0.9rem; color: var(--gold); margin-bottom: 0.85rem; display: flex; align-items: center; gap: 0.4rem;">
            <i class="fa-solid fa-sliders"></i> Bloqueo a tu Gusto (Rango, Barbero y Motivo)
          </div>

          <div class="form-group" style="margin-bottom: 0.85rem;">
            <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.3rem; display: block;">Aplica a *</label>
            <select id="bloqCustomBarbero" class="form-control" style="font-size: 0.85rem; padding: 0.5rem 0.75rem;">
              <option value="TODOS">Toda la barbería (Cierre general / Feriado / Pausa)</option>
              ${(barberosAdmin || []).map(b => `<option value="${b.id}">${b.nombre}</option>`).join('')}
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.85rem;">
            ${renderSelectorHora12('bloqCustomHoraIni', formatearHora12(hora), 'Hora Inicio *', descompIni.h, descompIni.m, descompIni.p)}
            ${renderSelectorHora12('bloqCustomHoraFin', horaFin12Default, 'Hora Fin *', descompFin.h, descompFin.m, descompFin.p)}
          </div>

          <div class="form-group" style="margin-bottom: 1.15rem;">
            <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.3rem; display: block;">Motivo del Bloqueo *</label>
            <input type="text" id="bloqCustomMotivo" class="form-control" placeholder="Ej: Descanso barbero, mantenimiento, almuerzo..." value="Bloqueo personalizado de agenda" required style="font-size: 0.85rem; padding: 0.5rem 0.75rem;">
          </div>

          <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
            <button type="submit" class="btn btn-gold" style="padding: 0.6rem 1.15rem; font-weight: 800; font-size: 0.85rem;">
              <i class="fa-solid fa-lock mr-1"></i> Confirmar Bloqueo Personalizado
            </button>
            <button type="button" onclick="cerrarModalAdmin()" class="btn btn-outline" style="padding: 0.6rem 0.9rem; font-size: 0.85rem;">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    `;
    document.getElementById('modalAdmin').classList.add('active');
    return;
  }

  if (estado === 'PASADO') {
    alert(`El turno de las ${formatearHora12(hora)} del ${fecha} ya pasó.`);
  }
}

async function accionCitaDesdeAgenda(id, nuevoEstado) {
  try {
    await cambiarEstadoCita(id, nuevoEstado);
    cerrarModalAdmin();
    cargarAgendaVisual();
    cargarCitasAdmin();
  } catch (e) {
    alert(e.message);
  }
}

async function desbloquearHorarioDesdeAgenda(bloqueoId) {
  if (!bloqueoId) {
    alert('No se encontró el identificador del bloqueo.');
    return;
  }
  if (!confirm('¿Deseas desbloquear este horario para que vuelva a estar disponible?')) return;
  try {
    const res = await fetchAuth(`/api/agenda/bloqueos/${bloqueoId}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || 'Error al eliminar el bloqueo');
    }
    cerrarModalAdmin();
    await cargarAgendaVisual();
    if (typeof cargarBloqueosAdmin === 'function') cargarBloqueosAdmin();
  } catch (e) {
    alert('Error al desbloquear: ' + e.message);
  }
}

async function bloquearHorarioPersonalizado(e, fecha) {
  if (e) e.preventDefault();
  const barberoId = document.getElementById('bloqCustomBarbero')?.value || 'TODOS';
  const horaIniStr = leerSelectorHora12('bloqCustomHoraIni');
  const horaFinStr = leerSelectorHora12('bloqCustomHoraFin');
  const motivo = document.getElementById('bloqCustomMotivo')?.value.trim() || 'Bloqueo personalizado de agenda';

  const hIni24 = horaA24(horaIniStr);
  const hFin24 = horaA24(horaFinStr);

  if (hFin24 <= hIni24) {
    alert('La hora de fin debe ser posterior a la hora de inicio.');
    return;
  }

  const payload = {
    fecha: fecha,
    barberoId: barberoId,
    horaInicio: hIni24,
    horaFin: hFin24,
    motivo: motivo
  };

  try {
    const res = await fetchAuth('/api/agenda/bloqueos', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || 'Error al guardar el bloqueo');
    }
    cerrarModalAdmin();
    await cargarAgendaVisual();
    if (typeof cargarBloqueosAdmin === 'function') cargarBloqueosAdmin();
  } catch (err) {
    alert('Error al guardar bloqueo: ' + err.message);
  }
}

async function bloquearHorarioPuntual(fecha, hora) {
  const h24 = horaA24(hora);
  const parts = h24.split(':');
  let h = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10) + 30;
  if (m >= 60) {
    h += 1;
    m -= 60;
  }
  const horaFin24 = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  const payload = {
    fecha: fecha,
    barberoId: 'TODOS',
    horaInicio: h24,
    horaFin: horaFin24,
    motivo: 'Bloqueo puntual de turno'
  };

  try {
    const res = await fetchAuth('/api/agenda/bloqueos', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || 'Error al guardar el bloqueo');
    }
    cerrarModalAdmin();
    await cargarAgendaVisual();
    if (typeof cargarBloqueosAdmin === 'function') cargarBloqueosAdmin();
  } catch (e) {
    alert('Error al guardar bloqueo: ' + e.message);
  }
}

// ==================== MODAL HORARIO SEMANAL (CONFIGURACIÓN) ====================

function abrirModalHorarioSemanal() {
  const modal = document.getElementById('modalHorarioSemanal');
  const errBox = document.getElementById('adminHorarioError');
  if (!modal) return;
  if (errBox) errBox.style.display = 'none';

  adminModalWorkingDays = [...(agendaConfiguracion.diasLaborales || [1, 2, 3, 4, 5, 6])];
  adminModalAgendaSlots = [...(agendaConfiguracion.horarios || [])].sort((a, b) => agendaTimeInMinutes(a) - agendaTimeInMinutes(b));

  renderAdminWeeklyModalDays();
  renderAdminWeeklyModalSlots();
  modal.classList.add('active');
}

function cerrarModalHorarioSemanal() {
  document.getElementById('modalHorarioSemanal')?.classList.remove('active');
}

function renderAdminWeeklyModalDays() {
  const container = document.getElementById('adminModalWorkingDays');
  if (!container) return;

  const daysInfo = [
    { index: 1, name: 'Lunes' },
    { index: 2, name: 'Martes' },
    { index: 3, name: 'Miércoles' },
    { index: 4, name: 'Jueves' },
    { index: 5, name: 'Viernes' },
    { index: 6, name: 'Sábado' },
    { index: 0, name: 'Domingo' }
  ];

  container.innerHTML = daysInfo.map(d => {
    const checked = adminModalWorkingDays.includes(d.index) || (d.index === 0 && adminModalWorkingDays.includes(7));
    return `
      <label style="cursor: pointer; display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 0.85rem; border-radius: var(--radius-sm); border: 2px solid ${checked ? 'var(--gold)' : 'var(--border-color)'}; background: ${checked ? 'rgba(185, 143, 74, 0.08)' : '#FFFFFF'}; transition: var(--transition);">
        <input type="checkbox" onchange="toggleWeeklyModalDay(${d.index}, this.checked)" ${checked ? 'checked' : ''} style="accent-color: var(--gold); width: 17px; height: 17px; cursor: pointer;">
        <span style="font-size: 0.82rem; font-weight: ${checked ? '800' : '600'}; color: ${checked ? 'var(--text-main)' : 'var(--text-muted)'};">${d.name}</span>
      </label>
    `;
  }).join('');
}

function toggleWeeklyModalDay(dayIndex, isChecked) {
  if (isChecked) {
    if (!adminModalWorkingDays.includes(dayIndex)) {
      adminModalWorkingDays.push(dayIndex);
      if (dayIndex === 0 && !adminModalWorkingDays.includes(7)) adminModalWorkingDays.push(7);
    }
  } else {
    adminModalWorkingDays = adminModalWorkingDays.filter(d => d !== dayIndex && !(dayIndex === 0 && d === 7));
  }
  renderAdminWeeklyModalDays();
}

function renderAdminWeeklyModalSlots() {
  const container = document.getElementById('adminModalAgendaHours');
  const countEl = document.getElementById('totalTurnosCount');
  if (!container) return;

  if (countEl) countEl.textContent = adminModalAgendaSlots.length;

  if (adminModalAgendaSlots.length === 0) {
    container.innerHTML = `<span style="font-size: 0.82rem; color: var(--text-muted); padding: 0.5rem;">No hay turnos configurados. Añade turnos o genera intervalos rápidos abajo.</span>`;
    return;
  }

  container.innerHTML = adminModalAgendaSlots.map(time => `
    <span style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.65rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: #FFFFFF; font-size: 0.78rem; font-weight: 700; color: var(--text-main); box-shadow: var(--shadow-sm);">
      <i class="fa-regular fa-clock text-gold" style="font-size: 0.7rem;"></i>
      ${time}
      <button type="button" onclick="removeModalAgendaTime('${time}')" style="background: none; border: none; cursor: pointer; color: #94a3b8; font-size: 0.85rem; padding: 0 0.15rem; line-height: 1; margin-left: 0.2rem;" title="Eliminar este turno">
        &times;
      </button>
    </span>
  `).join('');
}

function addModalAgendaTime() {
  const hour = document.getElementById('adminModalAgendaHour')?.value;
  const minutes = document.getElementById('adminModalAgendaMinutes')?.value;
  const period = document.getElementById('adminModalAgendaPeriod')?.value;
  if (!hour || !minutes || !period) return;

  const time = `${hour}:${minutes} ${period}`;
  if (adminModalAgendaSlots.includes(time)) {
    alert('Ese turno ya está configurado en la lista.');
    return;
  }
  adminModalAgendaSlots.push(time);
  adminModalAgendaSlots.sort((a, b) => agendaTimeInMinutes(a) - agendaTimeInMinutes(b));
  renderAdminWeeklyModalSlots();
}

function removeModalAgendaTime(time) {
  if (adminModalAgendaSlots.length <= 1) {
    alert('Debes mantener al menos un turno de atención.');
    return;
  }
  adminModalAgendaSlots = adminModalAgendaSlots.filter(t => t !== time);
  renderAdminWeeklyModalSlots();
}

function limpiarTodosTurnosModal() {
  if (!confirm('¿Deseas limpiar todos los turnos para volver a generarlos o configurarlos desde cero?')) return;
  adminModalAgendaSlots = [];
  renderAdminWeeklyModalSlots();
}

function generarTurnosIntervalo(intervaloMinutos = 30) {
  const startMinutes = 8 * 60; // 08:00 AM
  const endMinutes = 20 * 60;  // 08:00 PM
  const nuevos = [];

  for (let m = startMinutes; m <= endMinutes; m += intervaloMinutos) {
    let h = Math.floor(m / 60);
    const min = m % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    const timeStr = `${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${period}`;
    nuevos.push(timeStr);
  }

  adminModalAgendaSlots = nuevos;
  renderAdminWeeklyModalSlots();
}

function restaurarTurnosPorDefectoModal() {
  adminModalAgendaSlots = [
    "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
    "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
    "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
    "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM",
    "08:00 PM"
  ];
  renderAdminWeeklyModalSlots();
}

async function submitWeeklyScheduleModal() {
  const btn = document.getElementById('btnGuardarHorarioSemanal');
  const errBox = document.getElementById('adminHorarioError');
  if (errBox) errBox.style.display = 'none';

  if (adminModalWorkingDays.length === 0) {
    if (errBox) {
      errBox.querySelector('span').textContent = 'Selecciona al menos un día laboral habitual.';
      errBox.style.display = 'flex';
    }
    return;
  }

  if (adminModalAgendaSlots.length === 0) {
    if (errBox) {
      errBox.querySelector('span').textContent = 'Configura al menos un turno de atención.';
      errBox.style.display = 'flex';
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Guardando...';
  }

  try {
    const payload = {
      diasLaborales: [...adminModalWorkingDays].sort(),
      horarios: adminModalAgendaSlots
    };
    const res = await fetchAuth('/api/agenda', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    const updated = await res.json();
    agendaConfiguracion = updated;

    cerrarModalHorarioSemanal();
    cargarHorarioSemanal();
    alert('¡Horario semanal y turnos actualizados correctamente!');
  } catch (err) {
    console.error(err);
    if (errBox) {
      errBox.querySelector('span').textContent = err.message || 'No se pudo guardar el horario semanal.';
      errBox.style.display = 'flex';
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-floppy-disk mr-1"></i> Guardar Horario Semanal';
    }
  }
}

async function cargarBarberosParaFiltro() {
  try {
    const res = await fetch('/api/barberos/todos');
    if (res.ok) {
      barberosAdmin = await res.json();
      const select = document.getElementById('filtroBarberoCitas');
      select.innerHTML = '<option value="TODOS">Todos los barberos</option>' + 
        barberosAdmin.map(b => `<option value="${b.id}">${b.nombre}</option>`).join('');
    }
  } catch (e) {
    console.error('Error al cargar barberos:', e);
  }
}

async function cargarCitasAdmin() {
  const hoy = obtenerFechaHoyISO();
  const tbody = document.getElementById('tablaCitasBody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 2rem;"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Consultando clientes en silla...</td></tr>';
  }

  try {
    const inicio = `${hoy}T00:00:00`;
    const fin = `${hoy}T23:59:59`;
    const url = `/api/citas/rango?inicio=${inicio}&fin=${fin}&barberoId=TODOS`;
    const res = await fetchAuth(url);
    citasAdminCargadas = await res.json();
    renderMesaAtencionEnVivo();
  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--danger);">${err.message}</td></tr>`;
  }
}

function renderMesaAtencionEnVivo() {
  const tbody = document.getElementById('tablaCitasBody');
  const listaConfirmadas = document.getElementById('listaCitasConfirmadasHoy');
  const badgeEnProceso = document.getElementById('badgeContadorEnProceso');
  const badgeEspera = document.getElementById('contadorCitasConfirmadasHoy');

  const enProceso = (citasAdminCargadas || []).filter(c => c.estado === 'EN_PROCESO');
  const confirmadas = (citasAdminCargadas || []).filter(c => c.estado === 'CONFIRMADA' || c.estado === 'PENDIENTE');

  if (badgeEnProceso) {
    badgeEnProceso.textContent = `${enProceso.length} en atención`;
  }
  if (badgeEspera) {
    badgeEspera.textContent = `${confirmadas.length} en espera`;
  }

  // 1. Tabla de citas en atención
  if (tbody) {
    if (enProceso.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
            <i class="fa-solid fa-chair text-gold" style="font-size: 2rem; display: block; margin-bottom: 0.5rem; opacity: 0.35;"></i>
            No hay clientes en atención en este momento.<br>
            <span style="font-size: 0.8rem; color: var(--text-muted);">Inicia la atención de las citas que están esperando turno abajo o desde la pestaña de Agenda.</span>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = enProceso.map(c => {
        const horaRaw = c.fechaHoraInicio.split('T')[1].substring(0, 5);
        const hora = formatearHora12(horaRaw);
        return `
          <tr style="background: rgba(234, 179, 8, 0.04);">
            <td><strong style="color: var(--gold); font-size: 0.95rem;">${c.codigo}</strong></td>
            <td><strong style="color: var(--text-main);">${hora}</strong></td>
            <td><strong>${c.clienteNombre}</strong></td>
            <td><a href="tel:${c.clienteTelefono}" style="color: var(--gold); text-decoration: none; font-weight: 700;"><i class="fa-solid fa-phone text-xs mr-1"></i>${c.clienteTelefono}</a></td>
            <td><i class="fa-solid fa-user-tie text-xs text-gold mr-1"></i>${c.barberoNombre}</td>
            <td style="font-size: 0.85rem; max-width: 220px;">${c.serviciosNombres.join(', ')}</td>
            <td><strong style="color: #059669; font-size: 1rem;">$${Number(c.precioTotal).toLocaleString('es-CO')}</strong></td>
            <td><span class="badge badge-EN_PROCESO"><i class="fa-solid fa-scissors mr-1"></i>En Atención</span></td>
            <td style="text-align: right;">
              <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
                <button onclick="cobrarYFinalizarCita('${c.id}', '${c.codigo}', '${Number(c.precioTotal).toLocaleString('es-CO')}')" class="btn btn-success" style="padding: 0.45rem 0.85rem; font-size: 0.82rem; font-weight: 700;" title="Cobrar y mover al historial">
                  <i class="fa-solid fa-check-double mr-1"></i> Cobrar y Finalizar
                </button>
                <button onclick="cancelarCitaAdmin('${c.id}')" class="btn btn-danger" style="padding: 0.45rem 0.65rem; font-size: 0.8rem;" title="Cancelar cita">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // 2. Lista de citas confirmadas de hoy listas para atender
  if (listaConfirmadas) {
    if (confirmadas.length === 0) {
      listaConfirmadas.innerHTML = `<div style="color: var(--text-muted); font-size: 0.82rem; padding: 0.5rem;"><i class="fa-regular fa-clock mr-1 text-gold"></i>No hay más citas en espera programadas para hoy.</div>`;
    } else {
      listaConfirmadas.innerHTML = confirmadas.map(c => {
        const horaRaw = c.fechaHoraInicio.split('T')[1].substring(0, 5);
        const hora = formatearHora12(horaRaw);
        return `
          <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.85rem; display: flex; justify-content: space-between; align-items: center; gap: 0.75rem;">
            <div>
              <div style="font-size: 0.85rem; font-weight: 800; color: var(--text-main);">
                <i class="fa-regular fa-clock text-gold mr-1"></i>${hora} - ${c.clienteNombre}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
                ${c.barberoNombre} · <span style="color: var(--gold); font-weight: 700;">$${Number(c.precioTotal).toLocaleString('es-CO')}</span>
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">${c.serviciosNombres.join(', ')}</div>
            </div>
            <button onclick="cambiarEstadoCita('${c.id}', 'EN_PROCESO')" class="btn btn-gold" style="padding: 0.45rem 0.85rem; font-size: 0.8rem; font-weight: 700; white-space: nowrap;">
              <i class="fa-solid fa-scissors mr-1"></i> Iniciar Atención
            </button>
          </div>
        `;
      }).join('');
    }
  }
}

async function cobrarYFinalizarCita(id, codigo, totalStr) {
  if (!confirm(`¿Confirmas el cobro y finalización de la cita ${codigo} por $${totalStr}? Al completar, se trasladará al Historial de Citas.`)) return;
  try {
    await fetchAuth(`/api/citas/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'COMPLETADA' })
    });
    alert(`¡Cita ${codigo} cobrada exitosamente! Se guardó en el Historial.`);
    cargarCitasAdmin();
    cargarMetricasAdmin();
    if (document.getElementById('tabHistorial')?.style.display !== 'none') {
      cargarHistorialAdmin();
    }
  } catch (e) {
    alert(e.message);
  }
}

// ==================== TAB: HISTORIAL DE CITAS Y BORRADO DE REGISTROS ====================

let citasHistorialCargadas = [];

async function cargarHistorialAdmin() {
  const tbody = document.getElementById('tablaHistorialBody');
  const estadoFiltro = document.getElementById('filtroHistorialEstado')?.value || 'COMPLETADA';
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: var(--text-muted); padding: 2.5rem;"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Cargando historial de registros...</td></tr>';
  }

  try {
    const res = await fetchAuth(`/api/citas/historial?estado=${estadoFiltro}`);
    citasHistorialCargadas = await res.json();
    filtrarHistorialTabla();
  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--danger);">${err.message}</td></tr>`;
  }
}

function filtrarHistorialTabla() {
  const query = (document.getElementById('filtroHistorialTexto')?.value || '').toLowerCase().trim();
  const tbody = document.getElementById('tablaHistorialBody');
  const totalFacturadoEl = document.getElementById('historialTotalFacturado');
  const totalRegistrosEl = document.getElementById('historialTotalRegistros');

  const filtradas = (citasHistorialCargadas || []).filter(c => {
    return !query ||
      c.codigo.toLowerCase().includes(query) ||
      c.clienteNombre.toLowerCase().includes(query) ||
      c.clienteTelefono.toLowerCase().includes(query) ||
      (c.barberoNombre && c.barberoNombre.toLowerCase().includes(query)) ||
      (c.serviciosNombres && c.serviciosNombres.some(s => s.toLowerCase().includes(query)));
  });

  const totalDinero = filtradas
    .filter(c => c.estado === 'COMPLETADA')
    .reduce((acc, curr) => acc + (Number(curr.precioTotal) || 0), 0);

  if (totalFacturadoEl) totalFacturadoEl.textContent = `$${totalDinero.toLocaleString('es-CO')}`;
  if (totalRegistrosEl) totalRegistrosEl.textContent = filtradas.length;

  if (filtradas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: var(--text-muted); padding: 2.5rem;"><i class="fa-solid fa-receipt text-2xl mr-2 text-gold" style="display: block; margin-bottom: 0.5rem; opacity: 0.4;"></i>No hay registros en el historial para los filtros aplicados.</td></tr>';
    return;
  }

  tbody.innerHTML = filtradas.map(c => {
    const [fechaCita, horaCompleta] = c.fechaHoraInicio.split('T');
    const hora = formatearHora12(horaCompleta.substring(0, 5));
    return `
      <tr>
        <td><strong style="color: var(--gold); font-size: 0.95rem;">${c.codigo}</strong></td>
        <td><strong>${fechaCita}</strong></td>
        <td><strong>${hora}</strong></td>
        <td><strong>${c.clienteNombre}</strong></td>
        <td><a href="tel:${c.clienteTelefono}" style="color: var(--gold); text-decoration: none; font-weight: 700;"><i class="fa-solid fa-phone text-xs mr-1"></i>${c.clienteTelefono}</a></td>
        <td><i class="fa-solid fa-user-tie text-xs text-gold mr-1"></i>${c.barberoNombre}</td>
        <td style="font-size: 0.85rem; max-width: 200px;">${c.serviciosNombres.join(', ')}</td>
        <td><strong style="color: #059669; font-size: 0.95rem;">$${Number(c.precioTotal).toLocaleString('es-CO')}</strong></td>
        <td><span class="badge badge-${c.estado}">${c.estado}</span></td>
        <td style="text-align: right;">
          <button onclick="eliminarRegistroHistorial('${c.id}', '${c.codigo}')" class="btn btn-danger" style="padding: 0.35rem 0.65rem; font-size: 0.78rem;" title="Eliminar permanentemente este registro">
            <i class="fa-solid fa-trash-can mr-1"></i> Borrar
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function eliminarRegistroHistorial(id, codigo) {
  if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente el registro de la cita "${codigo}"? Esta acción borrará el registro de la base de datos de forma definitiva.`)) return;
  try {
    await fetchAuth(`/api/citas/${id}`, { method: 'DELETE' });
    alert(`Registro de la cita ${codigo} eliminado correctamente.`);
    cargarHistorialAdmin();
    cargarMetricasAdmin();
  } catch (e) {
    alert(e.message);
  }
}

async function cambiarEstadoCita(id, nuevoEstado) {
  try {
    await fetchAuth(`/api/citas/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: nuevoEstado })
    });
    cargarCitasAdmin();
    cargarMetricasAdmin();
    cargarAgendaVisual();
  } catch (e) {
    alert(e.message);
  }
}

async function cancelarCitaAdmin(id) {
  const motivo = prompt('Motivo de cancelación:');
  if (motivo === null) return;

  try {
    await fetchAuth(`/api/citas/${id}/cancelar`, {
      method: 'POST',
      body: JSON.stringify({ motivo: motivo || 'Cancelada en recepción' })
    });
    cargarCitasAdmin();
    cargarMetricasAdmin();
  } catch (e) {
    alert(e.message);
  }
}

// ==================== TAB 2: MÉTRICAS ====================

async function cargarMetricasAdmin() {
  try {
    const res = await fetchAuth('/api/dashboard/metricas');
    const m = await res.json();
    document.getElementById('metricaCitasHoy').textContent = m.citasHoy || 0;
    document.getElementById('metricaPendientesHoy').textContent = m.citasPendientesHoy || 0;
    document.getElementById('metricaCompletadasHoy').textContent = m.citasCompletadasHoy || 0;
    document.getElementById('metricaIngresosHoy').textContent = '$' + Number(m.ingresosHoy || 0).toLocaleString('es-CO');
    document.getElementById('metricaIngresosSemana').textContent = '$' + Number(m.ingresosSemana || 0).toLocaleString('es-CO');
  } catch (e) {
    console.error('Error métricas:', e);
  }
}

// ==================== TAB 3: SERVICIOS CON SELECTOR DE ARCHIVO Y LIVE PREVIEW ====================

function manejarSubidaArchivoServicio(event) {
  const file = event.target.files[0];
  if (!file) return;

  document.getElementById('servFileNameLabel').textContent = `Archivo seleccionado: ${file.name}`;

  // Leer inmediatamente para mostrar en la tarjeta de Live Preview
  const reader = new FileReader();
  reader.onload = function(e) {
    imagenServicioData = e.target.result;
    document.getElementById('liveServImgData').value = imagenServicioData;
    actualizarPreviewEnVivo();
  };
  reader.readAsDataURL(file);

  // Subir en segundo plano si el endpoint está disponible
  subirArchivoAlServidor(file).then(url => {
    if (url) {
      imagenServicioData = url;
      document.getElementById('liveServImgData').value = url;
      actualizarPreviewEnVivo();
    }
  }).catch(() => {
    // Si no hay Cloudinary, se conserva el base64 de alta calidad
  });
}

async function subirArchivoAlServidor(file) {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
  } catch (e) {
    console.warn('Subida en background falló, usando Base64 data URL.');
  }
  return null;
}

function actualizarPreviewEnVivo() {
  const nombre = document.getElementById('liveServNombre').value.trim() || 'Nombre del Servicio';
  const categoria = document.getElementById('liveServCategoria').value || 'Cortes';
  const precio = document.getElementById('liveServPrecio').value || '35000';
  const duracion = document.getElementById('liveServDuracion').value || '30';
  const desc = document.getElementById('liveServDesc').value.trim() || 'Detalla los procedimientos incluidos en este servicio...';

  const imgSrc = imagenServicioData || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80';

  const fitMode = document.getElementById('servFitMode').value || 'cover';
  const zoom = document.getElementById('servZoom').value || '1.0';
  const posX = document.getElementById('servPosX').value || '50';
  const posY = document.getElementById('servPosY').value || '50';

  document.getElementById('servZoomVal').textContent = `${parseFloat(zoom).toFixed(2)}x`;
  document.getElementById('servPosXVal').textContent = `${posX}%`;
  document.getElementById('servPosYVal').textContent = `${posY}%`;

  document.getElementById('previewCardTitle').textContent = nombre;
  document.getElementById('previewCardCategory').textContent = categoria;
  document.getElementById('previewCardPrice').textContent = '$' + Number(precio).toLocaleString('es-CO');
  document.getElementById('previewCardDuration').textContent = `⏱️ ${duracion} min`;
  document.getElementById('previewCardDesc').textContent = desc;

  const imgEl = document.getElementById('previewCardImg');
  imgEl.src = imgSrc;
  imgEl.style.objectFit = fitMode;
  imgEl.style.objectPosition = `${posX}% ${posY}%`;
  imgEl.style.transform = `scale(${zoom})`;
}

function setPresetServicio(preset) {
  if (preset === 'cover') {
    document.getElementById('servFitMode').value = 'cover';
    document.getElementById('servZoom').value = '1.0';
    document.getElementById('servPosX').value = '50';
    document.getElementById('servPosY').value = '35';
  } else if (preset === 'contain') {
    document.getElementById('servFitMode').value = 'contain';
    document.getElementById('servZoom').value = '1.0';
    document.getElementById('servPosX').value = '50';
    document.getElementById('servPosY').value = '50';
  }
  actualizarPreviewEnVivo();
}

function resetearSlidersServicio() {
  document.getElementById('servFitMode').value = 'cover';
  document.getElementById('servZoom').value = '1.0';
  document.getElementById('servPosX').value = '50';
  document.getElementById('servPosY').value = '50';
  actualizarPreviewEnVivo();
}

function resetearFormServicio() {
  document.getElementById('servEditId').value = '';
  document.getElementById('liveServImgData').value = '';
  imagenServicioData = '';
  document.getElementById('servFileNameLabel').textContent = 'Haz clic o arrastra una imagen aquí (JPG, PNG, WebP)';
  document.getElementById('formServicioTitulo').innerHTML = '<i class="fa-solid fa-scissors"></i> <span>Crear Nuevo Servicio de Barbería</span>';
  document.getElementById('btnCancelarEdicionServ').style.display = 'none';
  document.getElementById('btnGuardarServicio').innerHTML = '<i class="fa-solid fa-floppy-disk mr-1"></i> Guardar Servicio';
  document.getElementById('formEditorServicio').reset();
  resetearSlidersServicio();
}

async function guardarServicioConPreview(e) {
  e.preventDefault();
  const id = document.getElementById('servEditId').value;
  const payload = {
    nombre: document.getElementById('liveServNombre').value.trim(),
    categoria: document.getElementById('liveServCategoria').value,
    precio: document.getElementById('liveServPrecio').value,
    duracionMinutos: parseInt(document.getElementById('liveServDuracion').value),
    imagenUrl: imagenServicioData || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
    descripcion: document.getElementById('liveServDesc').value.trim(),
    activo: true
  };

  try {
    const url = id ? `/api/servicios/${id}` : '/api/servicios';
    const method = id ? 'PUT' : 'POST';
    await fetchAuth(url, { method, body: JSON.stringify(payload) });
    alert('¡Servicio guardado exitosamente!');
    resetearFormServicio();
    cargarServiciosAdmin();
  } catch (err) {
    alert(err.message);
  }
}

async function cargarServiciosAdmin() {
  const tbody = document.getElementById('tablaServiciosBody');
  try {
    const res = await fetchAuth('/api/servicios/todos');
    const servicios = await res.json();
    serviciosAdmin = servicios;
    tbody.innerHTML = servicios.map(s => `
      <tr>
        <td>
          <img src="${s.imagenUrl || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80'}" style="width: 44px; height: 44px; border-radius: var(--radius-sm); object-fit: cover; border: 1px solid var(--border-gold);">
        </td>
        <td><strong>${s.nombre}</strong></td>
        <td><span class="service-category">${s.categoria || 'General'}</span></td>
        <td style="color: var(--gold); font-weight: 800;">$${Number(s.precio).toLocaleString('es-CO')}</td>
        <td><i class="fa-regular fa-clock mr-1"></i> ${s.duracionMinutos} min</td>
        <td><span class="badge ${s.activo ? 'badge-CONFIRMADA' : 'badge-CANCELADA'}">${s.activo ? 'Activo' : 'Inactivo'}</span></td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
            <button onclick="editarServicioEnForm('${s.id}')" class="btn btn-outline" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" title="Editar">
              <i class="fa-solid fa-pen-to-square"></i> Editar
            </button>
            <button onclick="eliminarServicioAdmin('${s.id}')" class="btn btn-danger" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" title="Eliminar">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: var(--danger);">${e.message}</td></tr>`;
  }
}

async function editarServicioEnForm(id) {
  try {
    const res = await fetchAuth(`/api/servicios/${id}`);
    const s = await res.json();

    document.getElementById('servEditId').value = s.id;
    imagenServicioData = s.imagenUrl || '';
    document.getElementById('liveServImgData').value = imagenServicioData;
    document.getElementById('servFileNameLabel').textContent = s.imagenUrl ? 'Foto cargada previamente' : 'Haz clic para seleccionar nueva foto';

    document.getElementById('formServicioTitulo').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> <span>Editando: ${s.nombre}</span>`;
    document.getElementById('btnCancelarEdicionServ').style.display = 'inline-block';
    document.getElementById('btnGuardarServicio').innerHTML = '<i class="fa-solid fa-floppy-disk mr-1"></i> Actualizar Servicio';

    document.getElementById('liveServNombre').value = s.nombre || '';
    document.getElementById('liveServCategoria').value = s.categoria || 'Cortes';
    document.getElementById('liveServPrecio').value = s.precio || '';
    document.getElementById('liveServDuracion').value = s.duracionMinutos || 30;
    document.getElementById('liveServDesc').value = s.descripcion || '';

    actualizarPreviewEnVivo();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    alert(e.message);
  }
}

async function eliminarServicioAdmin(id) {
  const s = (serviciosAdmin || []).find(x => x.id === id);
  const nombre = s ? s.nombre : 'este servicio';
  if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente el servicio "${nombre}"?`)) return;

  try {
    await fetchAuth(`/api/servicios/${id}`, { method: 'DELETE' });
    alert('Servicio eliminado correctamente.');
    cargarServiciosAdmin();
  } catch (e) {
    alert(e.message);
  }
}

// ==================== TAB 4: BARBEROS CON CRUD COMPLETO Y SELECTOR DE ARCHIVOS ====================

async function cargarBarberosAdmin() {
  const tbody = document.getElementById('tablaBarberosBody');
  try {
    const res = await fetchAuth('/api/barberos/todos');
    const barberos = await res.json();
    barberosAdmin = barberos;
    tbody.innerHTML = barberos.map(b => `
      <tr>
        <td><img src="${b.fotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80'}" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid var(--gold);"></td>
        <td><strong>${b.nombre}</strong> <span style="color: var(--text-muted); font-size: 0.8rem;">(${b.alias || ''})</span></td>
        <td style="color: var(--gold); font-size: 0.85rem; font-weight: 700;">${b.especialidad || 'Master Barber'}</td>
        <td>${b.telefono || 'Sin teléfono'}</td>
        <td><i class="fa-regular fa-clock mr-1"></i> ${formatearHora12(b.horaInicio)} - ${formatearHora12(b.horaFin)}</td>
        <td><i class="fa-solid fa-utensils text-xs mr-1 text-gold"></i> ${formatearHora12(b.pausaInicio)} - ${formatearHora12(b.pausaFin)}</td>
        <td><span class="badge ${b.activo ? 'badge-CONFIRMADA' : 'badge-CANCELADA'}">${b.activo ? 'Activo' : 'Inactivo'}</span></td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
            <button onclick="editarBarberoModal('${b.id}')" class="btn btn-outline" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" title="Editar">
              <i class="fa-solid fa-pen-to-square"></i> Editar
            </button>
            <button onclick="eliminarBarberoAdmin('${b.id}')" class="btn btn-danger" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" title="Eliminar">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="8" style="color: var(--danger);">${e.message}</td></tr>`;
  }
}

function abrirModalBarbero(barbero = null) {
  document.getElementById('modalAdminTitulo').innerHTML = `<i class="fa-solid fa-user-tie text-gold mr-1"></i> ${barbero ? 'Editar Barbero' : 'Nuevo Barbero'}`;
  const body = document.getElementById('modalAdminBody');

  imagenBarberoData = barbero ? (barbero.fotoUrl || '') : '';

  body.innerHTML = `
    <form onsubmit="guardarBarberoForm(event, '${barbero ? barbero.id : ''}')">
      
      <!-- Selector de Foto de Perfil -->
      <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.25rem; padding: 1rem; background: var(--bg-card); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
        <img id="barberoAvatarPreview" src="${imagenBarberoData || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80'}" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid var(--gold);">
        <div style="flex: 1;">
          <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.35rem;">Foto de Perfil del Barbero</label>
          <input type="file" id="barbFileInput" accept="image/png,image/jpeg,image/webp" onchange="manejarSubidaArchivoBarbero(event)" class="form-control" style="padding: 0.4rem; font-size: 0.8rem;">
        </div>
      </div>

      <div class="form-group">
        <label>Nombre Completo *</label>
        <input type="text" id="barbNombre" class="form-control" value="${barbero ? barbero.nombre : ''}" required>
      </div>
      <div class="form-group">
        <label>Alias / Apodo</label>
        <input type="text" id="barbAlias" class="form-control" value="${barbero ? barbero.alias || '' : ''}" placeholder="Ej: Mateo">
      </div>
      <div class="form-group">
        <label>Especialidad</label>
        <input type="text" id="barbEspecialidad" class="form-control" value="${barbero ? barbero.especialidad || '' : ''}" placeholder="Ej: Skin Fade & Freestyle">
      </div>
      <div class="form-group">
        <label>Teléfono de Contacto</label>
        <input type="text" id="barbTelefono" class="form-control" value="${barbero ? barbero.telefono || '' : ''}" placeholder="Ej: 3101234567">
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        ${renderSelectorHora12('barbInicio', barbero ? barbero.horaInicio : '09:00 AM', 'Hora Inicio Turno', '09', '00', 'AM')}
        ${renderSelectorHora12('barbFin', barbero ? barbero.horaFin : '08:00 PM', 'Hora Fin Turno', '08', '00', 'PM')}
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        ${renderSelectorHora12('barbPausaIni', barbero ? barbero.pausaInicio : '01:00 PM', 'Pausa Almuerzo (Inicio)', '01', '00', 'PM')}
        ${renderSelectorHora12('barbPausaFin', barbero ? barbero.pausaFin : '02:00 PM', 'Pausa Almuerzo (Fin)', '02', '00', 'PM')}
      </div>
      <button type="submit" class="btn btn-gold" style="width: 100%; margin-top: 1rem; padding: 0.85rem;">
        <i class="fa-solid fa-floppy-disk mr-1"></i> Guardar Barbero
      </button>
    </form>
  `;
  document.getElementById('modalAdmin').classList.add('active');
}

function manejarSubidaArchivoBarbero(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    imagenBarberoData = e.target.result;
    document.getElementById('barberoAvatarPreview').src = imagenBarberoData;
  };
  reader.readAsDataURL(file);

  subirArchivoAlServidor(file).then(url => {
    if (url) {
      imagenBarberoData = url;
      document.getElementById('barberoAvatarPreview').src = url;
    }
  });
}

async function editarBarberoModal(id) {
  try {
    const res = await fetchAuth(`/api/barberos/${id}`);
    const b = await res.json();
    abrirModalBarbero(b);
  } catch (e) {
    alert(e.message);
  }
}

async function guardarBarberoForm(e, id) {
  e.preventDefault();
  const payload = {
    nombre: document.getElementById('barbNombre').value.trim(),
    alias: document.getElementById('barbAlias').value.trim(),
    especialidad: document.getElementById('barbEspecialidad').value.trim(),
    telefono: document.getElementById('barbTelefono').value.trim(),
    fotoUrl: imagenBarberoData || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
    horaInicio: leerSelectorHora12('barbInicio'),
    horaFin: leerSelectorHora12('barbFin'),
    pausaInicio: leerSelectorHora12('barbPausaIni'),
    pausaFin: leerSelectorHora12('barbPausaFin'),
    activo: true
  };

  try {
    const url = id ? `/api/barberos/${id}` : '/api/barberos';
    const method = id ? 'PUT' : 'POST';
    await fetchAuth(url, { method, body: JSON.stringify(payload) });
    alert(id ? 'Barbero actualizado correctamente.' : 'Barbero creado correctamente.');
    cerrarModalAdmin();
    cargarBarberosAdmin();
    cargarBarberosParaFiltro();
  } catch (err) {
    alert(err.message);
  }
}

async function eliminarBarberoAdmin(id) {
  const b = (barberosAdmin || []).find(x => x.id === id);
  const nombre = b ? b.nombre : 'este barbero';
  if (!confirm(`¿Estás seguro de que deseas eliminar al barbero "${nombre}"?`)) return;

  try {
    await fetchAuth(`/api/barberos/${id}`, { method: 'DELETE' });
    alert('Barbero eliminado correctamente.');
    cargarBarberosAdmin();
    cargarBarberosParaFiltro();
  } catch (e) {
    alert(e.message);
  }
}

// ==================== TAB 5: BLOQUEOS DE HORARIO ====================

async function cargarBloqueosAdmin() {
  const tbody = document.getElementById('tablaBloqueosBody');
  const hoy = obtenerFechaHoyISO();
  const fin = '2030-12-31';

  try {
    const res = await fetchAuth(`/api/agenda/bloqueos?fechaInicio=${hoy}&fechaFin=${fin}`);
    const bloqueos = await res.json();

    if (!bloqueos || bloqueos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay bloqueos activos de agenda registrados.</td></tr>';
      return;
    }

    tbody.innerHTML = bloqueos.map(b => {
      const fStr = normalizarFechaString(b.fecha);
      const hIni = normalizarHoraString(b.horaInicio);
      const hFin = normalizarHoraString(b.horaFin);
      const barberoNom = b.barberoId === 'TODOS'
        ? '<span class="badge badge-PENDIENTE">Toda la barbería</span>'
        : ((barberosAdmin || []).find(x => x.id === b.barberoId)?.nombre || b.barberoId);
      return `
        <tr>
          <td><strong>${fStr}</strong></td>
          <td><i class="fa-regular fa-clock mr-1 text-gold"></i> ${formatearHora12(hIni)} - ${formatearHora12(hFin)}</td>
          <td>${barberoNom}</td>
          <td>${b.motivo || 'Sin motivo'}</td>
          <td style="text-align: right;">
            <button onclick="eliminarBloqueoAdmin('${b.id}')" class="btn btn-danger" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;">
              <i class="fa-solid fa-trash-can mr-1"></i> Eliminar
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" style="color: var(--danger);">${e.message}</td></tr>`;
  }
}

function abrirModalBloqueo() {
  document.getElementById('modalAdminTitulo').innerHTML = '<i class="fa-solid fa-lock text-gold mr-1"></i> Nuevo Bloqueo de Horario';
  const body = document.getElementById('modalAdminBody');

  body.innerHTML = `
    <form onsubmit="guardarBloqueoForm(event)">
      <div class="form-group">
        <label>Fecha del Bloqueo *</label>
        <input type="date" id="bloqFecha" class="form-control" value="${obtenerFechaHoyISO()}" required>
      </div>
      <div class="form-group">
        <label>Aplica a *</label>
        <select id="bloqBarbero" class="form-control">
          <option value="TODOS">Toda la barbería (Cierre / Feriado)</option>
          ${(barberosAdmin || []).map(b => `<option value="${b.id}">${b.nombre}</option>`).join('')}
        </select>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        ${renderSelectorHora12('bloqHoraIni', '12:00 PM', 'Hora Inicio *', '12', '00', 'PM')}
        ${renderSelectorHora12('bloqHoraFin', '01:00 PM', 'Hora Fin *', '01', '00', 'PM')}
      </div>
      <div class="form-group">
        <label>Motivo del Bloqueo *</label>
        <input type="text" id="bloqMotivo" class="form-control" placeholder="Ej: Cita médica, almuerzo extendido, mantenimiento..." required>
      </div>
      <button type="submit" class="btn btn-gold" style="width: 100%; margin-top: 1rem; padding: 0.85rem;">
        <i class="fa-solid fa-lock mr-1"></i> Guardar Bloqueo
      </button>
    </form>
  `;
  document.getElementById('modalAdmin').classList.add('active');
}

async function guardarBloqueoForm(e) {
  e.preventDefault();
  const payload = {
    fecha: document.getElementById('bloqFecha').value,
    barberoId: document.getElementById('bloqBarbero').value,
    horaInicio: horaA24(leerSelectorHora12('bloqHoraIni')),
    horaFin: horaA24(leerSelectorHora12('bloqHoraFin')),
    motivo: document.getElementById('bloqMotivo').value.trim()
  };

  try {
    const res = await fetchAuth('/api/agenda/bloqueos', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || 'Error al guardar el bloqueo');
    }
    cerrarModalAdmin();
    cargarBloqueosAdmin();
    cargarAgendaVisual();
  } catch (err) {
    alert(err.message);
  }
}

async function eliminarBloqueoAdmin(id) {
  if (!confirm('¿Seguro que deseas eliminar este bloqueo de horario?')) return;
  try {
    const res = await fetchAuth(`/api/agenda/bloqueos/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || 'Error al eliminar el bloqueo');
    }
    cargarBloqueosAdmin();
    cargarAgendaVisual();
  } catch (e) {
    alert(e.message);
  }
}

// ==================== TAB 6: CONFIGURACIÓN ====================

async function cargarConfiguracionAdmin() {
  try {
    const res = await fetch('/api/configuracion');
    const c = await res.json();
    document.getElementById('cfgNombre').value = c.nombre || 'KEY BARBER';
    document.getElementById('cfgSlogan').value = c.slogan || '';
    document.getElementById('cfgDireccion').value = c.direccion || '';
    document.getElementById('cfgTelefono').value = c.telefono || '';
    document.getElementById('cfgWhatsapp').value = c.whatsapp || '';
    document.getElementById('cfgIntervalo').value = c.intervaloMinutos || 30;
    document.getElementById('cfgAnticipacion').value = c.anticipacionDias || 15;
  } catch (e) {
    console.error('Error al cargar config:', e);
  }
}

async function guardarConfiguracion(e) {
  e.preventDefault();
  const payload = {
    nombre: document.getElementById('cfgNombre').value.trim(),
    slogan: document.getElementById('cfgSlogan').value.trim(),
    direccion: document.getElementById('cfgDireccion').value.trim(),
    telefono: document.getElementById('cfgTelefono').value.trim(),
    whatsapp: document.getElementById('cfgWhatsapp').value.trim(),
    intervaloMinutos: parseInt(document.getElementById('cfgIntervalo').value),
    anticipacionDias: parseInt(document.getElementById('cfgAnticipacion').value)
  };

  try {
    await fetchAuth('/api/configuracion', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    alert('¡Configuración actualizada correctamente!');
    cargarHorarioSemanal();
  } catch (err) {
    alert(err.message);
  }
}

// Helpers
function cerrarModalAdmin() {
  document.getElementById('modalAdmin').classList.remove('active');
}

function obtenerFechaHoyISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
