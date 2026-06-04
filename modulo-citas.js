// ==========================================
// 1. ESTADO GLOBAL DE LA APLICACIÓN
// ==========================================
if (!window.AppState) {
  window.AppState = {
    theme: 'light',
    currentSection: 'home',
    fechaBaseSemana: new Date(),
    filtroHome: 'todos',
    filtroCitas: 'todos',
    filtroTramites: 'todos'
  };
}

// Estructura de Datos unificada con tu interfaz visual (Usa 'paciente')
window.AgendaData = {
  citas: JSON.parse(localStorage.getItem('agenda_citas')) || [
    { 
      id: 1, 
      paciente: 'Paco', 
      tipo: 'medica', 
      especialidad: 'Neurología', 
      institucion: 'Sura', 
      fecha: '2026-06-06', 
      hora: '2:30 PM', 
      lugar: 'No especificado', 
      copago: 0, 
      transporte: 0 
    }
  ],
  maestros: JSON.parse(localStorage.getItem('agenda_maestros')) || {
    especialidades: ['Neurología', 'Cardiología', 'Medicina General', 'Odontología'],
    instituciones: ['Sura', 'Sanitas', 'Supersalud']
  }
};

// ==========================================
// 2. INICIALIZACIÓN AUTOMÁTICA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  inyectarCamposDinamicosAlModal();
  configurarEventosTarjetas();
  renderPantallaHoyCompleta();
});

// ==========================================
// 3. NAVEGACIÓN DESDE LAS TARJETAS (KPI)
// ==========================================
function irAlModuloYFiltrar(modulo, criterioFiltro) {
  if (typeof switchSection === 'function') {
    switchSection(modulo);
  } else {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('sec-' + modulo);
    if(target) target.classList.add('active');
  }

  if (modulo === 'citas') {
    AppState.filtroCitas = criterioFiltro;
    const selectFiltro = document.getElementById('filtro-citas-select');
    if (selectFiltro) selectFiltro.value = criterioFiltro;
    if (typeof renderListadoCitas === 'function') renderListadoCitas();
  } 
  else if (modulo === 'documentos') {
    AppState.filtroTramites = criterioFiltro;
    const selectFiltro = document.getElementById('filtro-tramites-select');
    if (selectFiltro) selectFiltro.value = criterioFiltro;
    if (typeof renderListadoTramites === 'function') renderListadoTramites();
  }
}

function configurarEventosTarjetas() {
  const mapeo = [
    { id: 'kpi-box-por-tomar', mod: 'citas', filtro: 'por-tomar' },
    { id: 'kpi-box-tramites', mod: 'documentos', filtro: 'activos' },
    { id: 'kpi-box-hoy', mod: 'citas', filtro: 'hoy' }
  ];

  mapeo.forEach(item => {
    const tarjeta = document.getElementById(item.id);
    if (tarjeta) {
      tarjeta.style.cursor = 'pointer';
      tarjeta.onclick = () => irAlModuloYFiltrar(item.mod, item.filtro);
    }
  });
}

// ==========================================
// 4. FORMULARIO ADAPTATIVO (CITAS vs PQRS)
// ==========================================
function inyectarCamposDinamicosAlModal() {
  const form = document.getElementById('form-cita');
  if (!form) return;

  // Si tu formulario usa 'cita-persona', lo mapearemos internamente a 'paciente'
  const selectPersona = document.getElementById('cita-persona');
  if (selectPersona && !document.getElementById('cita-tipo')) {
    
    const divTipo = document.createElement('div');
    divTipo.className = 'form-group';
    divTipo.innerHTML = `
      <label>Tipo de Registro</label>
      <select id="cita-tipo" style="width:100%; padding:9px; border-radius:8px;">
        <option value="medica">🏥 Cita Médica</option>
        <option value="tramite">📄 Trámite / Requerimiento (PQRS)</option>
      </select>
    `;
    form.insertBefore(divTipo, form.firstChild);

    const divSubtipo = document.createElement('div');
    divSubtipo.className = 'form-group';
    divSubtipo.id = 'grupo-subtipo-tramite';
    divSubtipo.style.display = 'none';
    divSubtipo.innerHTML = `
      <label>Clasificación del Trámite (PQRS)</label>
      <select id="cita-subtipo-tramite" style="width:100%; padding:9px; border-radius:8px;">
        <option value="peticion">🙋‍♂️ Petición</option>
        <option value="queja">🤬 Queja</option>
        <option value="reclamo">⚠️ Reclamo</option>
        <option value="sugerencia">💡 Sugerencia</option>
      </select>
    `;
    form.insertBefore(divSubtipo, form.children[1]);

    document.getElementById('cita-tipo').addEventListener('change', (e) => {
      const esTramite = e.target.value === 'tramite';
      document.getElementById('grupo-subtipo-tramite').style.display = esTramite ? 'block' : 'none';
      
      const selectEspecialidad = document.getElementById('cita-especialidad');
      if (selectEspecialidad) {
        selectEspecialidad.closest('.form-group').style.display = esTramite ? 'none' : 'block';
      }
    });
  }
  actualizarSelectoresMaestros();
}

// ==========================================
// 5. RENDERIZADO DE LA AGENDA SEMANAL
// ==========================================
function navegarSemana(direccion) {
  AppState.fechaBaseSemana.setDate(AppState.fechaBaseSemana.getDate() + (direccion * 7));
  renderPantallaHoyCompleta();
}

function renderPantallaHoyCompleta() {
  actualizarTotalesKPI();
  
  const contenedorAgenda = document.getElementById('home-weekly-agenda');
  const etiquetaRango = document.getElementById('weekly-range-label');
  if (!contenedorAgenda) return;

  const fecha = new Date(AppState.fechaBaseSemana);
  const dema = fecha.getDay();
  const diff = fecha.getDate() - dema + (dema === 0 ? -6 : 1);
  const lunes = new Date(fecha.setDate(diff));
  lunes.setHours(0,0,0,0);

  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  domingo.setHours(23,59,59,999);

  if (etiquetaRango) {
    const opciones = { day: 'numeric', month: 'short' };
    etiquetaRango.textContent = `${lunes.toLocaleDateString('es-ES', opciones)} - ${domingo.toLocaleDateString('es-ES', opciones)}`;
  }

  const eventosSemana = AgendaData.citas.filter(item => {
    const f = new Date(item.fecha + 'T00:00:00');
    return f >= lunes && f <= domingo;
  });

  if (eventosSemana.length === 0) {
    contenedorAgenda.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text2); font-size:14px;">No hay citas ni trámites programados para esta semana.</div>`;
    return;
  }

  eventosSemana.sort((a,b) => new Date(a.fecha) - new Date(b.fecha));

  contenedorAgenda.innerHTML = eventosSemana.map(item => `
    <div class="card" style="border-left: 4px solid ${item.tipo === 'tramite' ? 'var(--blue)' : 'var(--accent)'}; margin-bottom: 8px; padding:16px; background:var(--surface); border-radius:12px;">
      <div style="display:flex; justify-content:space-between; align-items:start;">
        <div style="flex:1;">
          <span style="font-size:11px; font-weight:700; text-transform:uppercase; color:var(--text2);">
            ${item.tipo === 'tramite' ? `📄 TRÁMITE (${item.subtipo.toUpperCase()})` : '🏥 CITA MÉDICA'}
          </span>
          <h4 style="margin:2px 0; font-family:'Fraunces', serif; font-size:16px;">${item.tipo === 'tramite' ? item.institucion : item.especialidad}</h4>
          <p style="font-size:13px; color:var(--text2);">👤 Paciente: ${item.paciente || item.persona} | 📍 ${item.lugar}</p>
        </div>
          <div style="text-align:right;">
          <span style="background:var(--bg); padding:4px 8px; border-radius:6px; font-size:12px; font-weight:600; display:inline-block;">⏱️ ${item.hora}</span>
          <div style="font-size:11px; color:var(--text3); margin-top:6px;">${item.fecha}</div>
        </div>
      </div>
    </div>
  `).join('');
}

// ==========================================
// 6. CÁLCULO OBJETIVO DE TOTALES (KPI)
// ==========================================
function actualizarTotalesKPI() {
  // Fecha de hoy limpia en formato YYYY-MM-DD
  const hoy = new Date();
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  
  // Cuenta de forma estricta las citas médicas futuras o de hoy
  const porTomar = AgendaData.citas.filter(c => c.tipo === 'medica' && c.fecha >= hoyStr).length;
  
  // Cuenta las PQRS/Trámites activos en total
  const tramitesActivos = AgendaData.citas.filter(c => c.tipo === 'tramite').length; 
  
  // Eventos exactos del día de hoy
  const citasHoy = AgendaData.citas.filter(c => c.fecha === hoyStr).length;

  const boxPorTomar = document.getElementById('stat-citas-por-tomar');
  const boxTramites = document.getElementById('stat-tramites-activos');
  const boxHoy = document.getElementById('stat-citas-hoy');

  if(boxPorTomar) boxPorTomar.textContent = porTomar;
  if(boxTramites) boxTramites.textContent = tramitesActivos;
  if(boxHoy) boxHoy.textContent = citasHoy;
}

function actualizarSelectoresMaestros() {
  const selEsp = document.getElementById('cita-especialidad');
  const selIns = document.getElementById('cita-institucion');

  if(selEsp) {
    selEsp.innerHTML = AgendaData.maestros.especialidades.map(e => `<option value="${e}">${e}</option>`).join('') + '<option value="NUEVO">➕ Crear nueva...</option>';
  }
  if(selIns) {
    selIns.innerHTML = AgendaData.maestros.instituciones.map(i => `<option value="${i}">${i}</option>`).join('') + '<option value="NUEVO">➕ Crear nueva...</option>';
  }
}
