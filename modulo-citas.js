/* ==========================================================================
   MODULO-CITAS.JS - ECO-SISTEMA DE CITAS MÉDICAS AVANZADAS V8.1
   ========================================================================== */

if (!window.AppState) window.AppState = {};
if (!window.AppState.citas) window.AppState.citas = JSON.parse(localStorage.getItem('agenda_citas')) || [];

// Listas maestras iniciales autogestionables
let especialidadesMaestras = JSON.parse(localStorage.getItem('maestro_especialidades')) || ['Cardiología', 'Neurología', 'Psicología', 'Medicina General'];
let institucionesMaestras = JSON.parse(localStorage.getItem('maestro_instituciones')) || ['IPS SURA', 'Oportunidad de Vida', 'Neurólogos de Occidente'];

document.addEventListener('DOMContentLoaded', () => {
  inicializarSelectoresCitas();
  renderCitas();
  actualizarResumenSemanalCitas();
});

function inicializarSelectoresCitas() {
  // Configurar las 12 horas
  const hh = document.getElementById('cita-hora-hh');
  if(hh) {
    hh.innerHTML = Array.from({length: 12}, (_, i) => `<option value="${i+1}">${String(i+1).padStart(2,'0')}</option>`).join('');
  }
  // Configurar minutos de 15 en 15 para simplificar
  const mm = document.getElementById('cita-hora-mm');
  if(mm) {
    mm.innerHTML = ['00', '15', '30', '45'].map(m => `<option value="${m}">${m}</option>`).join('');
  }
  actualizarSelectsMedicos();
}

function actualizarSelectsMedicos() {
  const selEsp = document.getElementById('cita-especialidad');
  const selIns = document.getElementById('cita-institucion');
  
  if(selEsp) {
    selEsp.innerHTML = especialidadesMaestras.map(e => `<option value="${e}">${e}</option>`).join('') + `<option value="NUEVO">➕ Crear nueva...</option>`;
  }
  if(selIns) {
    selIns.innerHTML = institucionesMaestras.map(i => `<option value="${i}">${i}</option>`).join('') + `<option value="NUEVO">➕ Crear nueva...</option>`;
  }
}

// Interceptor de creación sobre la marcha
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
        if (typeof actualizarSelectsEnDocumentos === 'function') actualizarSelectsEnDocumentos();
      }
    };
  }
}

function abrirModalCita() {
  document.getElementById('form-cita').reset();
  inicializarSelectoresCitas();
  openModal('modal-nueva-cita');
}

function ejecutarCrearCitaReal() {
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

  if(!fecha || especialidad === 'NUEVO' || institucion === 'NUEVO') {
    alert('Por favor ingresa todos los parámetros obligatorios.');
    return;
  }

  const nuevaCita = {
    id: 'cita_' + Date.now(),
    paciente, especialidad, institucion, fecha, hora: horaConstruida, lugar, copago, transporte, estado: 'portomar'
  };

  window.AppState.citas.push(nuevaCita);
  localStorage.setItem('agenda_citas', JSON.stringify(window.AppState.citas));

  // Descuento automático cruzado en finanzas
  const totalLogistica = copago + transporte;
  if(totalLogistica > 0 && typeof registrarGastoDesdeModulo === 'function') {
    registrarGastoDesdeModulo(totalLogistica, `Gastos Médicos: ${especialidad} - ${paciente}`, 'Efectivo', '💊 Logística Médica');
  }

  document.getElementById('form-cita').reset(); // Limpieza absoluta contra duplicaciones
  closeModal('modal-nueva-cita');
  renderCitas();
  actualizarResumenSemanalCitas();
  if (typeof actualizarSelectsEnDocumentos === 'function') actualizarSelectsEnDocumentos();
  showToast('Cita guardada y procesada contablemente.');
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
    <div class="card card-highlight" style="border-left-color: ${c.paciente==='Paco'?'#0055ff':c.paciente==='Padre'?'#00aa00':'#ffcc00'}">
      <div style="display:flex; justify-content:space-between; align-items:start;">
        <div>
          <span style="font-family:'Fraunces',serif; font-size:16px; font-weight:700;">${c.especialidad}</span> · <b>${c.paciente}</b>
          <div style="font-size:12px; color:var(--text2); margin-top:4px;">🏥 ${c.institucion} | 📍 ${c.lugar}</div>
          <div style="font-size:13px; font-weight:600; color:var(--accent); margin-top:4px;">📅 ${c.fecha} ⏰ ${c.hora}</div>
        </div>
        <span class="chip ${c.estado==='tomada'?'chip-done':'chip-portomar'}">${c.estado==='tomada'?'Asistió':'Pendiente'}</span>
      </div>
      <div class="card-actions" style="margin-top:10px; justify-content:flex-end;">
        ${c.estado!=='tomada'?`<button class="btn btn-outline btn-sm" onclick="cambiarEstadoCitaReal('${c.id}','tomada')">✓ Completada</button>`:''}
        <button class="btn btn-danger btn-sm" onclick="eliminarCitaReal('${c.id}')">🗑️</button>
      </div>
    </div>
  `).join('');
}

function cambiarEstadoCitaReal(id, est) {
  const c = window.AppState.citas.find(x => x.id === id);
  if(c) { c.estado = est; localStorage.setItem('agenda_citas', JSON.stringify(window.AppState.citas)); renderCitas(); }
}

function eliminarCitaReal(id) {
  window.AppState.citas = window.AppState.citas.filter(x => x.id !== id);
  localStorage.setItem('agenda_citas', JSON.stringify(window.AppState.citas));
  renderCitas();
  actualizarResumenSemanalCitas();
  if (typeof actualizarSelectsEnDocumentos === 'function') actualizarSelectsEnDocumentos();
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
