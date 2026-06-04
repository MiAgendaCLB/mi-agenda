/* ==========================================================================
   MODULO-CITAS.JS - ENGINE DE INTEGRACIÓN, FILTROS Y NAVEGACIÓN SEMANAL V8.6
   ========================================================================== */

if (!window.AppState) window.AppState = {};
if (!window.AppState.citas) window.AppState.citas = JSON.parse(localStorage.getItem('agenda_citas')) || [];
if (!window.AppState.filtroHome) window.AppState.filtroHome = 'todos'; // Filtro activo por defecto
if (!window.AppState.fechaBaseSemana) window.AppState.fechaBaseSemana = new Date();

// Mock de trámites para la proactividad del sistema
if (!window.AppState.tramites) {
  window.AppState.tramites = [
    { id: 'tr_1', nombre: 'Supersalud', diasActivo: 30, estado: 'pendiente' }
  ];
}

let especialidadesMaestras = JSON.parse(localStorage.getItem('maestro_especialidades')) || ['Cardiología', 'Neurología', 'Psicología', 'Medicina General'];
let institucionesMaestras = JSON.parse(localStorage.getItem('maestro_instituciones')) || ['IPS SURA', 'Oportunidad de Vida', 'Neurólogos de Occidente'];

document.addEventListener('DOMContentLoaded', () => {
  inicializarSelectoresCitas();
  renderCitas();
  actualizarResumenSemanalCitas();
  renderPantallaHoyCompleta();
});

function inicializarSelectoresCitas() {
  const hh = document.getElementById('cita-hora-hh');
  if(hh) hh.innerHTML = Array.from({length: 12}, (_, i) => `<option value="${i+1}">${String(i+1).padStart(2,'0')}</option>`).join('');
  
  const mm = document.getElementById('cita-hora-mm');
  if(mm) mm.innerHTML = ['00', '15', '30', '45'].map(m => `<option value="${m}">${m}</option>`).join('');
  
  actualizarSelectsMedicos();
}

function actualizarSelectsMedicos() {
  const selEsp = document.getElementById('cita-especialidad');
  const selIns = document.getElementById('cita-institucion');
  // Se usa un estilo limpio y compacto para la opción de añadir
  if(selEsp) selEsp.innerHTML = especialidadesMaestras.map(e => `<option value="${e}">${e}</option>`).join('') + `<option value="NUEVO" style="font-weight:bold; color:var(--accent);">➕ Crear nueva...</option>`;
  if(selIns) selIns.innerHTML = institucionesMaestras.map(i => `<option value="${i}">${i}</option>`).join('') + `<option value="NUEVO" style="font-weight:bold; color:var(--accent);">➕ Crear nueva...</option>`;
}

function verificarNuevoDatoMedico(selectElement, tipo) {
  if (selectElement.value === 'NUEVO') {
    const popup = document.getElementById('popup-auxiliar');
    const titulo = document.getElementById('aux-titulo');
    const input = document.getElementById('aux-input');
    const btn = document.getElementById('aux-btn-confirmar');
    
    titulo.textContent = tipo === 'especialidad' ? 'Nueva Especialidad' : 'Nueva IPS';
    input.value = '';
    
    // Aplicar tamaño adecuado y compacto al input y contenedor auxiliar
    input.style.fontSize = "14px";
    input.style.padding = "6px 10px";
    
    popup.classList.add('open');
    
    btn.onclick = () => {
      const valor = input.value.trim();
      if(valor) {
        if(tipo === 'especialidad') {
          especialidadesMaestras.push(valor);
          localStorage.setItem('maestro_especialidades', JSON.stringify(especialidadesMaestras));
        } else {
          institucionesMaestras.push(valor);
          localStorage.setItem('maestro_instituciones', JSON.stringify(institucionesMaestras));
        }
        actualizarSelectsMedicos();
        selectElement.value = valor;
        popup.classList.remove('open');
        showToast(`${tipo === 'especialidad' ? 'Especialidad' : 'IPS'} añadida.`);
      }
    };
  }
}

// ════ MODAL: ABRIR EN MODO CREACIÓN O EDICIÓN COMPLETA ════
function abrirModalCita(idCita = null) {
  const form = document.getElementById('form-cita');
  if(!form) return;
  form.reset();
  inicializarSelectoresCitas();

  const titleEl = document.getElementById('cita-modal-title');
  const btnGuardar = document.getElementById('btn-guardar-cita-modal');
  const btnEliminar = document.getElementById('btn-eliminar-cita-modal');
  const idInput = document.getElementById('cita-id-edicion');

  if (idCita) {
    const cita = window.AppState.citas.find(c => c.id === idCita);
    if (!cita) return;

    idInput.value = cita.id;
    if(titleEl) titleEl.textContent = "Modificar Cita Médica";
    if(btnGuardar) btnGuardar.textContent = "Guardar Cambios";
    if(btnEliminar) btnEliminar.style.display = "block";

    document.getElementById('cita-persona').value = cita.paciente;
    document.getElementById('cita-especialidad').value = cita.especialidad;
    document.getElementById('cita-institucion').value = cita.institucion;
    document.getElementById('cita-fecha').value = cita.fecha;
    document.getElementById('cita-lugar').value = cita.lugar;
    document.getElementById('cita-copago').value = cita.copago;
    document.getElementById('cita-transporte').value = cita.transporte;

    const parts = cita.hora.split(' ');
    if(parts[0]) {
      const timeParts = parts[0].split(':');
      document.getElementById('cita-hora-hh').value = parseInt(timeParts[0]);
      document.getElementById('cita-hora-mm').value = timeParts[1];
    }
    if(parts[1]) document.getElementById('cita-hora-ampm').value = parts[1];

  } else {
    idInput.value = "";
    if(titleEl) titleEl.textContent = "Agendar Nueva Cita Médica";
    if(btnGuardar) btnGuardar.textContent = "Agendar e Indexar Caja";
    if(btnEliminar) btnEliminar.style.display = "none";
  }

  openModal('modal-nueva-cita');
}

function ejecutarCrearCitaReal() {
  const idEdicion = document.getElementById('cita-id-edicion').value;
  const paciente = document.getElementById('cita-persona').value;
  const chocolateEsp = document.getElementById('cita-especialidad').value;
  const chocolateIns = document.getElementById('cita-institucion').value;
  const fecha = document.getElementById('cita-fecha').value;
  
  const hh = document.getElementById('cita-hora-hh').value;
  const mm = document.getElementById('cita-hora-mm').value;
  const ampm = document.getElementById('cita-hora-ampm').value;
  const horaConstruida = `${hh}:${mm} ${ampm}`;

  const lugar = document.getElementById('cita-lugar').value.trim() || 'No especificado';
  const copago = parseFloat(document.getElementById('cita-copago').value) || 0;
  const transporte = parseFloat(document.getElementById('cita-transporte').value) || 0;

  if(!fecha) { alert('La fecha es obligatoria.'); return; }

  if (idEdicion) {
    const citaIndex = window.AppState.citas.findIndex(c => c.id === idEdicion);
    if (citaIndex !== -1) {
      window.AppState.citas[citaIndex] = {
        ...window.AppState.citas[citaIndex],
        paciente, especialidad: chocolateEsp, institucion: chocolateIns, fecha, hora: horaConstruida, lugar, copago, transporte
      };
      showToast('Cita modificada con éxito.');
    }
  } else {
    const nuevaCita = {
      id: 'cita_' + Date.now(),
      paciente, especialidad: chocolateEsp, institucion: chocolateIns, fecha, hora: horaConstruida, lugar, copago, transporte, estado: 'portomar'
    };
    window.AppState.citas.push(nuevaCita);
    showToast('Cita guardada correctamente.');
  }

  localStorage.setItem('agenda_citas', JSON.stringify(window.AppState.citas));
  closeModal('modal-nueva-cita');
  renderCitas();
  actualizarResumenSemanalCitas();
  renderPantallaHoyCompleta();
}

function ejecutarEliminacionDesdeModal() {
  const idEdicion = document.getElementById('cita-id-edicion').value;
  if(idEdicion && confirm('¿Deseas eliminar esta cita de forma permanente?')) {
    window.AppState.citas = window.AppState.citas.filter(x => x.id !== idEdicion);
    localStorage.setItem('agenda_citas', JSON.stringify(window.AppState.citas));
    closeModal('modal-nueva-cita');
    renderCitas();
    actualizarResumenSemanalCitas();
    renderPantallaHoyCompleta();
    showToast('Cita eliminada.');
  }
}

// ════ INTERMITENCIA DE FILTROS DESDE LOS TOTALES / KPIS ════
function setHomeFiltro(tipoFiltro) {
  // Si das clic al filtro que ya está activo, se limpia y regresa a "todos"
  if (window.AppState.filtroHome === tipoFiltro) {
    window.AppState.filtroHome = 'todos';
  } else {
    window.AppState.filtroHome = tipoFiltro;
  }
  renderPantallaHoyCompleta();
  showToast(`Filtrando vista por: ${window.AppState.filtroHome.toUpperCase()}`);
}

/* ==========================================================================
   ENGINE: RENDERIZADO DE LA PANTALLA HOY (PANTALLA CON MEMORIA DE UBICACIÓN)
   ========================================================================== */
function navegarSemana(direccion) {
  const fecha = new Date(window.AppState.fechaBaseSemana);
  fecha.setDate(fecha.getDate() + (direccion * 7));
  window.AppState.fechaBaseSemana = fecha;
  renderPantallaHoyCompleta();
}

function obtenerLimitesSemanales(fechaBase) {
  const copia = new Date(fechaBase);
  const diaSemana = copia.getDay();
  const diferenciaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  
  const lunes = new Date(copia);
  lunes.setDate(copia.getDate() + diferenciaLunes);
  lunes.setHours(0,0,0,0);
  
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  domingo.setHours(23,59,59,999);
  
  return { lunes, domingo };
}

function renderPantallaHoyCompleta() {
  const hoyString = new Date().toISOString().split('T')[0];
  const base = window.AppState.fechaBaseSemana || new Date();
  const { lunes, domingo } = obtenerLimitesSemanales(base);

  // 1. Calcular en qué semana estamos parados con precisión real
  const { lunes: lunesActualReal, domingo: domingoActualReal } = obtenerLimitesSemanales(new Date());
  
  let stringUbicacion = "Semana Actual";
  if (lunes.getTime() > domingoActualReal.getTime()) {
    const semanasAdelante = Math.round((lunes - lunesActualReal) / (7 * 24 * 60 * 60 * 1000));
    stringUbicacion = semanasAdelante === 1 ? "Próxima Semana" : `En +${semanasAdelante} semanas`;
  } else if (domingo.getTime() < lunesActualReal.getTime()) {
    const semanasAtras = Math.round((lunesActualReal - lunes) / (7 * 24 * 60 * 60 * 1000));
    stringUbicacion = semanasAtras === 1 ? "Semana Anterior" : `Hace ${semanasAtras} semanas`;
  }

  const labelRango = document.getElementById('weekly-range-label');
  if(labelRango) {
    labelRango.innerHTML = `<span style="background:var(--blue-light); color:var(--blue); padding:3px 8px; border-radius:4px; font-size:11px; font-weight:bold; margin-right:6px;">${stringUbicacion}</span> ` +
                           `${lunes.toLocaleDateString('es-ES', {day:'numeric', month:'short'})} - ${domingo.toLocaleDateString('es-ES', {day:'numeric', month:'short'})}`;
  }

  // 2. Banner Proactivo Dinámico Inteligente
  const bannerContainer = document.getElementById('home-proactive-banner');
  if(bannerContainer) {
    const tramiteCritico = window.AppState.tramites.find(t => t.nombre === 'Supersalud' && t.diasActivo >= 30);
    const citasHoyCount = window.AppState.citas.filter(c => c.fecha === hoyString).length;

    if (tramiteCritico) {
      bannerContainer.innerHTML = `
        <div class="card error-banner" style="background: #fff3cd; border-left: 5px solid #ffc107; padding: 14px; margin-bottom: 20px; border-radius: 6px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="color:#856404; font-size:14px;">⚠️ El sistema proactivo informa:</strong>
            <div style="color:#664d03; font-size:13px; margin-top:2px;">El trámite con <b>Supersalud</b> lleva ${tramiteCritico.diasActivo} días. ¿Quieres registrar seguimiento?</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="switchSection('documentos')" style="background:#b45309; border:none; font-size:12px; padding:6px 12px;">Registrar Seguimiento</button>
        </div>`;
    } else if (citasHoyCount === 0) {
      const futuras = window.AppState.citas.filter(c => c.fecha >= hoyString).sort((a,b)=>a.fecha.localeCompare(b.fecha));
      let msgProx = "Todo está en orden. No registras eventos pendientes.";
      if(futuras.length > 0) {
        const opciones = { weekday: 'long', day: 'numeric', month: 'short' };
        const fObj = new Date(futuras[0].fecha + 'T00:00:00');
        msgProx = `Todo está en orden. La próxima cita es el ${fObj.toLocaleDateString('es-ES', opciones)}.`;
      }
      bannerContainer.innerHTML = `
        <div class="card success-banner" style="background: #e8f5e9; border-left: 5px solid #2d6a4f; padding: 12px; margin-bottom: 20px; border-radius: 6px; display:flex; align-items:center; gap:10px;">
          <span style="font-size:18px;">🌿</span>
          <div style="color:#1b5e20; font-size:13.5px; font-weight:500;">${msgProx}</div>
        </div>`;
    } else {
      bannerContainer.innerHTML = "";
    }
  }

  // 3. Totales / Tarjetas de KPI Interactivos con sombras dinámicas de Selección
  const totalCitasPorTomar = window.AppState.citas.filter(c => c.estado === 'portomar').length;
  const totalTramitesActivos = window.AppState.tramites.filter(t => t.estado === 'pendiente').length;
  const totalCitasHoy = window.AppState.citas.filter(c => c.fecha === hoyString).length;
  
  let totalSaldoBancos = 0;
  if(window.AppState.finanzas && window.AppState.finanzas.cuentas) {
    window.AppState.finanzas.cuentas.forEach(cu => totalSaldoBancos += cu.saldo);
  }
  let egresosMes = 0;
  if(window.AppState.finanzas && window.AppState.finanzas.transacciones) {
    const mAct = new Date().toISOString().substring(0, 7);
    window.AppState.finanzas.transacciones.forEach(tx => { if(tx.tipo==='egreso' && tx.fecha && tx.fecha.startsWith(mAct)) egresosMes += tx.monto; });
  }

  // Actualizar e inyectar interactividad con cursor pointer y sombreado si el filtro está seleccionado
  const f = window.AppState.filtroHome;
  const renderBox = (id, val, label, filterKey, color) => {
    const box = document.getElementById(id);
    if(box) {
      box.textContent = val;
      const parent = box.parentElement;
      parent.style.cursor = 'pointer';
      parent.onclick = () => setHomeFiltro(filterKey);
      // Efecto sombreado / Active border para denotar que está filtrando
      if (f === filterKey) {
        parent.style.background = 'var(--accent-xlight)';
        parent.style.border = `2px solid ${color}`;
      } else {
        parent.style.background = 'var(--surface)';
        parent.style.border = '1px solid var(--border)';
      }
    }
  };

  renderBox('stat-citas-por-tomar', totalCitasPorTomar, 'Citas por tomar', 'por-tomar', '#2d6a4f');
  renderBox('stat-tramites-activos', totalTramitesActivos, 'Trámites activos', 'tramites', '#1d3557');
  renderBox('stat-saldo-cuentas', '$' + totalSaldoBancos.toLocaleString(), 'Saldo en cuentas', 'saldo', '#b45309');
  renderBox('stat-citas-hoy', totalCitasHoy, 'Citas hoy', 'citas-hoy', '#0055ff');
  renderBox('stat-egresos-mes', '$' + egresosMes.toLocaleString(), 'Egresos del mes', 'egresos', '#c44536');

  // 4. Renderizar Filas de Días aplicando el Criterio de Búsqueda/Filtro Activo
  const contenedorAgenda = document.getElementById('home-weekly-agenda');
  if(!contenedorAgenda) return;

  let htmlSemanal = "";
  const diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  for (let i = 0; i < 7; i++) {
    const diaIterado = new Date(lunes);
    diaIterado.setDate(lunes.getDate() + i);
    const diaIso = diaIterado.toISOString().split('T')[0];

    // Obtener citas originales de este día
    let citasDelDia = window.AppState.citas.filter(c => c.fecha === diaIso);

    // FILTRADO DINÁMICO SEGÚN LA SELECCIÓN DEL USUARIO
    if (f === 'por-tomar') {
      citasDelDia = citasDelDia.filter(c => c.estado === 'portomar');
    } else if (f === 'citas-hoy') {
      citasDelDia = citasDelDia.filter(c => c.fecha === hoyString);
    } else if (f === 'tramites') {
      // Si el filtro es trámites, no mostramos citas ordinarias a menos que correspondan a una gestión especial
      citasDelDia = citasDelDia.filter(c => c.especialidad.toLowerCase().includes('trámite') || c.institucion.toLowerCase().includes('supersalud'));
    } else if (f === 'saldo' || f === 'egresos') {
      // Filtro ilustrativo contable: resalta citas que generaron copagos/costos
      citasDelDia = citasDelDia.filter(c => (c.copago + c.transporte) > 0);
    }

    const esHoyReal = diaIso === hoyString;
    const estiloFondo = esHoyReal ? 'background: #f8fafc; border-left: 4px solid var(--accent); box-shadow: inset 0 0 4px rgba(0,0,0,0.02);' : 'background: var(--surface);';

    // Ocultar filas de días vacíos sólo si hay un filtro de tarjeta riguroso corriendo
    if (citasDelDia.length === 0 && f !== 'todos') {
      continue; // Salta el día para compactar la búsqueda de lo que habla esa tarjeta
    }

    htmlSemanal += `
      <div class="card day-row" style="padding: 12px; margin-bottom: 4px; ${estiloFondo}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
          <strong style="font-size: 12.5px; text-transform: uppercase; color: var(--text2); font-weight:600;">${diasNombres[i]} (${diaIterado.getDate()})</strong>
          ${esHoyReal ? `<span style="font-size: 9px; background: var(--accent); color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;">HOY</span>` : ''}
        </div>
        <div class="day-events-container" style="display:flex; flex-direction:column; gap:6px;">
          ${citasDelDia.map(ci => `
            <div style="background: var(--surface2); padding: 8px; border-radius: 6px; border-left: 3px solid ${ci.paciente==='Paco'?'#0055ff':ci.paciente==='Padre'?'#00aa00':'#ffcc00'}; cursor:pointer; transition: transform 0.1s;" 
                 onclick="abrirModalCita('${ci.id}')" 
                 onmouseover="this.style.transform='scale(1.01)'" 
                 onmouseout="this.style.transform='scale(1)'">
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px;">
                <span>⏰ <b>${ci.hora}</b> - ${ci.especialidad} (<b style="color:var(--text);">${ci.paciente}</b>)</span>
                <span style="font-size:11px; color:var(--text3); background:var(--border); padding:2px 6px; border-radius:4px;">${ci.institucion}</span>
              </div>
              ${(ci.copago + ci.transporte) > 0 ? `<div style="font-size:11px; color:var(--amber); margin-top:2px;">💰 Costos asignados: $${(ci.copago + ci.transporte).toLocaleString()}</div>` : ''}
            </div>
          `).join('') || `<div style="font-size:12px; color:var(--text3); font-style:italic; padding-left:4px;">No hay compromisos.</div>`}
        </div>
      </div>
    `;
  }

  if(htmlSemanal === "") {
    htmlSemanal = `<div style="text-align:center; padding:30px; color:var(--text3); font-style:italic; background:var(--surface); border-radius:6px;">Ninguna cita coincide con el filtro de esta tarjeta durante esta semana.</div>`;
  }

  contenedorAgenda.innerHTML = htmlSemanal;
}

function renderCitas() {
  const container = document.getElementById('citas-list');
  if (!container) return;
  if (window.AppState.citas.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text3);">No hay citas registradas.</div>`;
    return;
  }
  const sorted = [...window.AppState.citas].sort((a,b) => a.fecha.localeCompare(b.fecha));
  container.innerHTML = sorted.map(c => `
    <div class="card card-highlight" style="cursor:pointer; border-left-color: ${c.paciente==='Paco'?'#0055ff':c.paciente==='Padre'?'#00aa00':'#ffcc00'}" onclick="abrirModalCita('${c.id}')">
      <div style="display:flex; justify-content:space-between; align-items:start;">
        <div>
          <span style="font-family:'Fraunces',serif; font-size:16px; font-weight:700;">${c.specialidad || c.especialidad}</span> · <b>${c.paciente}</b>
          <div style="font-size:12px; color:var(--text2); margin-top:4px;">🏥 ${c.institucion} | 📍 ${c.lugar}</div>
          <div style="font-size:13px; font-weight:600; color:var(--accent); margin-top:4px;">📅 ${c.fecha} ⏰ ${c.hora}</div>
        </div>
        <span class="chip ${c.estado==='tomada'?'chip-done':'chip-portomar'}">${c.estado==='tomada'?'Asistió':'Pendiente'}</span>
      </div>
    </div>
  `).join('');
}

function actualizarResumenSemanalCitas() {
  ['Paco', 'Padre', 'Esposa'].forEach(p => {
    const el = document.getElementById('citas-' + p.toLowerCase());
    if(el) {
      const prox = window.AppState.citas.filter(c => c.paciente === p && c.estado === 'portomar').sort((a,b)=>a.fecha.localeCompare(b.fecha))[0];
      el.textContent = prox ? `${prox.fecha} - ${prox.especialidad}` : 'Sin citas pendientes';
    }
  });
}

// Vinculación global de funciones al objeto window
window.navegarSemana = navegarSemana;
window.renderPantallaHoyCompleta = renderPantallaHoyCompleta;
window.abrirModalCita = abrirModalCita;
window.ejecutarEliminacionDesdeModal = ejecutarEliminacionDesdeModal;
window.setHomeFiltro = setHomeFiltro;
