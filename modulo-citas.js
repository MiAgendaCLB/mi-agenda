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

// Datos semilla en memoria (Si tienes localStorage, se cargarán de ahí)
window.AgendaData = {
  citas: JSON.parse(localStorage.getItem('agenda_citas')) || [
    { id: 1, persona: 'Paco', tipo: 'medica', especialidad: 'Cardiología', institucion: 'Sura', fecha: '2026-06-05', hora: '09:00 AM', lugar: 'Consultorio 402', copago: 15000, transporte: 8000 },
    { id: 2, persona: 'Padre', tipo: 'tramite', subtipo: 'reclamo', institucion: 'Supersalud', fecha: '2026-06-06', hora: '11:30 AM', lugar: 'Plataforma Virtual', copago: 0, transporte: 0, estado: 'activo' }
  ],
  maestros: JSON.parse(localStorage.getItem('agenda_maestros')) || {
    especialidades: ['Cardiología', 'Medicina General', 'Odontología'],
    instituciones: ['Sura', 'Sanitas', 'Supersalud', 'Clínica Valle del Lili']
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
// 3. CONTROL DE NAVEGACIÓN INTELEGENTE Y FILTROS
// ==========================================

// Modifica visualmente los selectores de los módulos y simula los clics del menú original
function irAlModuloYFiltrar(modulo, criterioFiltro) {
  // 1. Cambia de pantalla usando la función de tu index
  if (typeof switchSection === 'function') {
    switchSection(modulo);
  } else {
    // Alternativa si switchSection cambia de nombre
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('sec-' + modulo);
    if(target) target.classList.add('active');
  }

  // 2. Configurar el filtro específico según la tarjeta presionada
  if (modulo === 'citas') {
    AppState.filtroCitas = criterioFiltro;
    const selectFiltro = document.getElementById('filtro-citas-select');
    if (selectFiltro) selectFiltro.value = criterioFiltro;
    renderListadoCitas();
  } 
  else if (modulo === 'documentos') {
    AppState.filtroTramites = criterioFiltro;
    const selectFiltro = document.getElementById('filtro-tramites-select');
    if (selectFiltro) selectFiltro.value = criterioFiltro;
    renderListadoTramites();
  }
}

// Vincula las tarjetas de totales para que respondan al hacer clic
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
// 4. LOGICA DEL FORMULARIO DINÁMICO (CITAS vs PQRS)
// ==========================================

function inyectarCamposDinamicosAlModal() {
  const form = document.getElementById('form-cita');
  if (!form) return;

  // Insertar selector de tipo justo al inicio del formulario si no existe
  if (!document.getElementById('cita-tipo')) {
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

    // Insertar el grupo del subtipo PQRS justo debajo
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

    // Escuchar cambios para ocultar o mostrar campos correspondientes
    document.getElementById('cita-tipo').addEventListener('change', (e) => {
      const esTramite = e.target.value === 'tramite';
      document.getElementById('grupo-subtipo-tramite').style.display = esTramite ? 'block' : 'none';
      
      // Ocultar select de especialidad si es un trámite administrativo
      const selectEspecialidad = document.getElementById('cita-especialidad');
      if (selectEspecialidad) {
        selectEspecialidad.closest('.form-group').style.display = esTramite ? 'none' : 'block';
      }
    });
  }

  // Llenar selectores normales
  actualizarSelectoresMaestros();
}

// ==========================================
// 5. FILTRADO Y NAVEGADOR SEMANAL ESTRICTO
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

  // Calcular límites de la semana (Lunes a Domingo)
  const fecha = new Date(AppState.fechaBaseSemana);
  const dema = fecha.getDay();
  const diff = fecha.getDate() - dema + (dema === 0 ? -6 : 1);
  const lunes = new Date(fecha.setDate(diff));
  lunes.setHours(0,0,0,0);

  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  domingo.setHours(23,59,59,999);

  // Mostrar rango en interfaz
  if (etiquetaRango) {
    const opciones = { day: 'numeric', month: 'short' };
    etiquetaRango.textContent = `${lunes.toLocaleDateString('es-ES', opciones)} - ${domingo.toLocaleDateString('es-ES', opciones)}`;
  }

  // Filtrar estrictamente los datos de esta semana
  const eventosSemana = AgendaData.citas.filter(item => {
    const f = new Date(item.fecha + 'T00:00:00');
    return f >= lunes && f <= domingo;
  });

  // Renderizar bloques visuales de la semana
  if (eventosSemana.length === 0) {
    contenedorAgenda.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text2); font-size:14px;">No hay citas ni trámites programados para esta semana.</div>`;
    return;
  }

  // Ordenar cronológicamente
  eventosSemana.sort((a,b) => new Date(a.fecha) - new Date(b.fecha));

  contenedorAgenda.innerHTML = eventosSemana.map(item => `
    <div class="card" style="border-left: 4px solid ${item.tipo === 'tramite' ? 'var(--blue)' : 'var(--accent)'}; margin-bottom: 8px;">
      <div style="display:flex; justify-content:between; align-items:start;">
        <div style="flex:1;">
          <span style="font-size:11px; font-weight:700; text-transform:uppercase; color:var(--text2);">
            ${item.tipo === 'tramite' ? `📄 TRÁMITE (${item.subtipo.toUpperCase()})` : '🏥 CITA MÉDICA'}
          </span>
          <h4 style="margin:2px 0; font-family:'Fraunces', serif;">${item.tipo === 'tramite' ? item.institucion : item.especialidad}</h4>
          <p style="font-size:13px; color:var(--text2);">👤 Paciente: ${item.persona} | 📍 ${item.lugar}</p>
        </div>
        <div style="text-align:right;">
          <span style="background:var(--bg); padding:4px 8px; border-radius:6px; font-size:12px; font-weight:600;">⏱️ ${item.hora}</span>
          <div style="font-size:11px; color:var(--text3); margin-top:4px;">${item.fecha}</div>
        </div>
      </div>
    </div>
  `).join('');
}

// ==========================================
// 6. FUNCIONES AUXILIARES DE CÁLCULO
// ==========================================

function actualizarTotalesKPI() {
  const hoyStr = new Date().toISOString().split('T')[0];
  
  const porTomar = AgendaData.citas.filter(c => c.tipo === 'medica' && c.fecha >= hoyStr).length;
  const tramitesActivos = AgendaData.citas.filter(c => c.tipo === 'tramite').length; // Cuenta PQRS globales
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

// Funciones vacías por seguridad para evitar errores de carga en las pestañas secundarias
function renderListadoCitas() { console.log("Filtrando historial de citas a:", AppState.filtroCitas); }
function renderListadoTramites() { console.log("Filtrando trámites PQRS a:", AppState.filtroTramites); }
function abrirModalCita() { if(typeof openModal === 'function') openModal('modal-nueva-cita'); }
