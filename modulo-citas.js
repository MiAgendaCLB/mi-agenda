/* ==========================================================================
   MODULO-CITAS.JS - CONTROL DE CITAS, MOTOR EDICIÓN & CONTROL SEMANAL V8.5
   ========================================================================== */

if (!window.AppState) window.AppState = {};
if (!window.AppState.citas) window.AppState.citas = JSON.parse(localStorage.getItem('agenda_citas')) || [];

// Mock Trámite Estancado para simular la proactividad del sistema ("El sistema habla primero")
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
  renderPantallaHoyCompleta(); // Renderiza la home estructurada de inmediato
});

function inicializarSelectoresCitas() {
  const hh = document.getElementById('cita-hora-hh');
  if(hh) {
    hh.innerHTML = Array.from({length: 12}, (_, i) => `<option value="${i+1}">${String(i+1).padStart(2,'0')}</option>`).join('');
  }
  const mm = document.getElementById('cita-hora-mm');
  if(mm) {
    mm.innerHTML = ['00', '15', '30', '45'].map(m => `<option value="${m}">${m}</option>`).join('');
  }
  actualizarSelectsMedicos();
}

function actualizarSelectsMedicos() {
  const selEsp = document.getElementById('cita-especialidad');
  const selIns = document.getElementById('cita-institucion');
  if(selEsp) selEsp.innerHTML = especialidadesMaestras.map(e => `<option value="${e}">${e}</option>`).join('') + `<option value="NUEVO">➕ Crear nueva...</option>`;
  if(selIns) selIns.innerHTML = institucionesMaestras.map(i => `<option value="${i}">${i}</option>`).join('') + `<option value="NUEVO">➕ Crear nueva...</option>`;
}

function verificarNuevoDatoMedico(selectElement, tipo) {
  if (selectElement.value === 'NUEVO') {
    const popup = document.getElementById('popup-auxiliar');
    const titulo = document.getElementById('aux-titulo');
    const input = document.getElementById('aux-input');
    const btn = document.getElementById('aux-btn-confirmar');
    
    titulo.textContent = tipo === 'especialidad' ? 'Nueva Especialidad' : 'Nueva IPS / Institución';
    input.value = '';
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
      }
    };
  }
}

// ════ MODO INTERACTIVO: ABRIR POPUP PARA CREAR O EDITAR ════
function abrirModalCita(idCita = null) {
  const form = document.getElementById('form-cita');
  form.reset();
  inicializarSelectoresCitas();

  const titleEl = document.getElementById('cita-modal-title');
  const btnGuardar = document.getElementById('btn-guardar-cita-modal');
  const btnEliminar = document.getElementById('btn-eliminar-cita-modal');
  const idInput = document.getElementById('cita-id-edicion');

  if (idCita) {
    // MODO EDICIÓN
    const cita = window.AppState.citas.find(c => c.id === idCita);
    if (!cita) return;

    idInput.value = cita.id;
    titleEl.textContent = "Modificar Cita Médica";
    btnGuardar.textContent = "Guardar Modificaciones";
    btnEliminar.style.display = "block";

    document.getElementById('cita-persona').value = cita.paciente;
    document.getElementById('cita-especialidad').value = cita.especialidad;
    document.getElementById('cita-institucion').value = cita.institucion;
    document.getElementById('cita-fecha').value = cita.fecha;
    document.getElementById('cita-lugar').value = cita.lugar;
    document.getElementById('cita-copago').value = cita.copago;
    document.getElementById('cita-transporte').value = cita.transporte;

    // Procesar hora am/pm
    const parts = cita.hora.split(' ');
    if(parts[0]) {
      const timeParts = parts[0].split(':');
      document.getElementById('cita-hora-hh').value = parseInt(timeParts[0]);
      document.getElementById('cita-hora-mm').value = timeParts[1];
    }
    if(parts[1]) document.getElementById('cita-hora-ampm').value = parts[1];

  } else {
    // MODO CREACIÓN
    idInput.value = "";
    titleEl.textContent = "Agendar Nueva Cita Médica";
    btnGuardar.textContent = "Agendar e Indexar Caja";
    btnEliminar.style.display = "none";
  }

  openModal('modal-nueva-cita');
}

function ejecutarCrearCitaReal() {
  const idEdicion = document.getElementById('cita-id-edicion').value;
  const paciente = document.getElementById('cita-persona').value;
  const especialidad = document.getElementById('cita-especialidad').value;
  const institucion = document.getElementById('cita-institucion').value;
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
    // Actualizar registro existente
    const citaIndex = window.AppState.citas.findIndex(c => c.id === idEdicion);
    if (citaIndex !== -1) {
      window.AppState.citas[citaIndex] = {
        ...window.AppState.citas[citaIndex],
        paciente, especialidad, institucion, fecha, hora: horaConstruida, lugar, copago, transporte
      };
      showToast('Cita modificada con éxito.');
    }
  } else {
    // Insertar nuevo
    const nuevaCita = {
      id: 'cita_' + Date.now(),
      paciente, especialidad, institucion, fecha, hora: horaConstruida, lugar, copago, transporte, estado: 'portomar'
    };
    window.AppState.citas.push(nuevaCita);

    // Vínculo financiero automático
    const totalLogistica = copago + transporte;
    if(totalLogistica > 0 && typeof registrarGastoDesdeModulo === 'function') {
      registrarGastoDesdeModulo(totalLogistica, `Gastos Médicos: ${especialidad} - ${paciente}`, 'Efectivo', '💊 Logística Médica');
    }
    showToast('Cita guardada y procesada contablemente.');
  }

  localStorage.setItem('agenda_citas', JSON.stringify(window.AppState.citas));
  closeModal('modal-nueva-cita');
  renderCitas();
  actualizarResumenSemanalCitas();
  renderPantallaHoyCompleta();
}

function ejecutarEliminacionDesdeModal() {
  const idEdicion = document.getElementById('cita-id-edicion').value;
  if(idEdicion && confirm('¿Estás seguro de que deseas eliminar esta cita de forma permanente?')) {
    window.AppState.citas = window.AppState.citas.filter(x => x.id !== idEdicion);
    localStorage.setItem('agenda_citas', JSON.stringify(window.AppState.citas));
    closeModal('modal-nueva-cita');
    renderCitas();
    actualizarResumenSemanalCitas();
    renderPantallaHoyCompleta();
    showToast('Cita eliminada correctamente.');
  }
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
          <span style="font-family:'Fraunces',serif; font-size:16px; font-weight:700;">${c.especialidad}</span> · <b>${c.paciente}</b>
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


/* ==========================================================================
   ENGINE: PANTALLA HOY & NAVEGACIÓN SEMANAL (ESTILO IMAGE_22A8E0.PNG)
   ========================================================================== */

function navegarSemana(direccion) {
  const d = window.AppState.fechaBaseSemana || new Date();
  d.setDate(d.getDate() + (direccion * 7));
  window.AppState.fechaBaseSemana = d;
  renderPantallaHoyCompleta();
}

function obtenerLimitesSemanales(fechaBase) {
  const copia = new Date(fechaBase);
  const diaSemana = copia.getDay();
  const diferenciaLunes = diaSemana === 0 ? -6 : 1 - diaSemana; // Ajustar domingo
  
  const lunes = new Date(copia);
  lunes.setDate(copia.getDate() + diferenciaLunes);
  
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  
  return { lunes, domingo };
}

function renderPantallaHoyCompleta() {
  // 1. Saludo según hora del día
  const hr = new Date().getHours();
  const greetingEl = document.getElementById('home-greeting');
  if(greetingEl) {
    greetingEl.innerHTML = hr < 12 ? "Buenos días ☀️" : hr < 18 ? "Buenas tardes 🌞" : "Buenas noches 🌙";
  }

  // 2. Proactividad del Sistema ("El sistema habla primero")
  const bannerContainer = document.getElementById('home-proactive-banner');
  if(bannerContainer) {
    const tramiteCritico = window.AppState.tramites.find(t => t.nombre === 'Supersalud' && t.diasActivo >= 30);
    
    // Contar citas urgentes de las próximas 24 horas
    const hoyStr = new Date().toISOString().split('T')[0];
    const citasHoyCount = window.AppState.citas.filter(c => c.fecha === hoyStr).length;

    if (tramiteCritico) {
      bannerContainer.innerHTML = `
        <div class="card error-banner" style="background: #fff3cd; border-left: 5px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 6px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
          <div>
            <strong style="color:#856404; font-size:15px;">⚠️ Alerta de Seguimiento</strong>
            <div style="color:#664d03; font-size:13px; margin-top:3px;">El trámite con <b>Supersalud</b> lleva ${tramiteCritico.diasActivo} días sin cambios. ¿Quieres registrar un seguimiento o actualizar el estado?</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="switchSection('documentos'); showToast('Abriendo gestor...');" style="background:#b45309; border:none; white-space:nowrap;">Registrar Seguimiento</button>
        </div>`;
    } else if (citasHoyCount === 0) {
      // Mensaje tranquilizador solicitado si todo marcha perfecto
      // Buscar cuál es la próxima cita absoluta para informar el día
      const futuras = window.AppState.citas.filter(c => c.fecha >= hoyStr).sort((a,b)=>a.fecha.localeCompare(b.fecha));
      let textoProxima = "No tienes citas agendadas.";
      if(futuras.length > 0) {
        const opciones = { weekday: 'long', day: 'numeric', month: 'short' };
        const fechaObj = new Date(futuras[0].fecha + 'T00:00:00');
        textoProxima = `La próxima cita es el ${fechaObj.toLocaleDateString('es-ES', opciones)}.`;
      }

      bannerContainer.innerHTML = `
        <div class="card success-banner" style="background: #e8f5e9; border-left: 5px solid #2d6a4f; padding: 15px; margin-bottom: 20px; border-radius: 6px; display:flex; align-items:center; gap:12px;">
          <div style="font-size:24px;">✅</div>
          <div>
            <strong style="color:#1b5e20; font-size:15px;">Todo está en orden hoy</strong>
            <div style="color:#2e7d32; font-size:13px; margin-top:2px;">${textoProxima}</div>
          </div>
        </div>`;
    } else {
      bannerContainer.innerHTML = "";
    }
  }

  // 3. Inyección de Métricas Dinámicas exactas de image_22a8e0.png
  const hoyString = new Date().toISOString().split('T')[0];
  const totalCitasPorTomar = window.AppState.citas.filter(c => c.estado === 'portomar').length;
  const totalTramitesActivos = window.AppState.tramites.filter(t => t.estado === 'pendiente').length;
  
  let totalSaldoBancos = 0;
  if(window.AppState.finanzas && window.AppState.finanzas.cuentas) {
    window.AppState.finanzas.cuentas.forEach(cu => totalSaldoBancos += cu.saldo);
  }

  const totalCitasHoy = window.AppState.citas.filter(c => c.fecha === hoyString).length;

  let egresosMes = 0;
  if(window.AppState.finanzas && window.AppState.finanzas.transacciones) {
    const mesActual = new Date().toISOString().substring(0, 7); // "2026-06"
    window.AppState.finanzas.transacciones.forEach(tx => {
      if(tx.tipo === 'egreso' && tx.fecha && tx.fecha.startsWith(mesActual)) {
        egresosMes += tx.monto;
      }
    });
  }

  if(document.getElementById('stat-citas-por-tomar')) document.getElementById('stat-citas-por-tomar').textContent = totalCitasPorTomar;
  if(document.getElementById('stat-tramites-activos')) document.getElementById('stat-tramites-activos').textContent = totalTramitesActivos;
  if(document.getElementById('stat-saldo-cuentas')) document.getElementById('stat-saldo-cuentas').textContent = '$' + totalSaldoBancos.toLocaleString();
  if(document.getElementById('stat-citas-hoy')) document.getElementById('stat-citas-hoy').textContent = totalCitasHoy;
  if(document.getElementById('stat-egresos-mes')) document.getElementById('stat-egresos-mes').textContent = '$' + egresosMes.toLocaleString();

  // 4. Lógica de Calendario por Semanas Navegables
  const base = window.AppState.fechaBaseSemana || new Date();
  const { lunes, domingo } = obtenerLimitesSemanales(base);

  const formatoOpciones = { day: 'numeric', month: 'short' };
  const labelRango = document.getElementById('weekly-range-label');
  if(labelRango) {
    labelRango.textContent = `Semana: ${lunes.toLocaleDateString('es-ES', formatoOpciones)} al ${domingo.toLocaleDateString('es-ES', formatoOpciones)}`;
  }

  // Generar los 7 días visuales de la semana seleccionada
  const contenedorAgenda = document.getElementById('home-weekly-agenda');
  if(!contenedorAgenda) return;

  let htmlSemanal = "";
  const diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  for (let i = 0; i < 7; i++) {
    const diaIterado = new Date(lunes);
    diaIterado.setDate(lunes.getDate() + i);
    const diaIso = diaIterado.toISOString().split('T')[0];

    // Filtrar citas de este día específico
    const citasDelDia = window.AppState.citas.filter(c => c.fecha === diaIso);

    // Resaltar el día actual real
    const esHoyReal = diaIso === new Date().toISOString().split('T')[0];
    const estiloFondo = esHoyReal ? 'background: #f1f5f9; border-left: 4px solid var(--accent);' : 'background: var(--surface);';

    htmlSemanal += `
      <div class="card day-row" style="padding: 12px; margin-bottom: 2px; ${estiloFondo}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 5px;">
          <strong style="font-size: 13px; text-transform: uppercase; color: var(--text2);">${diasNombres[i]} (${diaIterado.getDate()})</strong>
          ${esHoyReal ? `<span style="font-size: 10px; background: var(--accent); color: white; padding: 2px 6px; border-radius: 10px; font-weight: bold;">HOY</span>` : ''}
        </div>
        <div class="day-events-container" style="display:flex; flex-direction:column; gap:6px;">
          ${citasDelDia.map(ci => `
            <div style="background: var(--surface2); padding: 8px; border-radius: 6px; border-left: 3px solid ${ci.paciente==='Paco'?'#0055ff':ci.paciente==='Padre'?'#00aa00':'#ffcc00'}; cursor:pointer;" onclick="abrirModalCita('${ci.id}')">
              <div style="display:flex; justify-content:space-between; font-size:12.5px;">
                <span>⏰ <b>${ci.hora}</b> - ${ci.especialidad} (${ci.paciente})</span>
                <small style="color:var(--text3); font-style: italic;">${ci.institucion}</small>
              </div>
            </div>
          `).join('') || `<div style="font-size:12px; color:var(--text3); font-style:italic; padding-left:5px;">No hay compromisos agendados.</div>`}
        </div>
      </div>
    `;
  }

  contenedorAgenda.innerHTML = htmlSemanal;
}

window.navegarSemana = navegarSemana;
window.renderPantallaHoyCompleta = renderPantallaHoyCompleta;
window.abrirModalCita = abrirModalCita;
window.ejecutarEliminacionDesdeModal = ejecutarEliminacionDesdeModal;
