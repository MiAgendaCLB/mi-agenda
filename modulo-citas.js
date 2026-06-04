/* ==========================================================================
   MODULO-CITAS.JS - GESTIÓN DE CITAS MÉDICAS Y LOGÍSTICA V8
   ========================================================================== */

// Inicializar el estado local si no existe
if (!window.AppState) window.AppState = {};
if (!window.AppState.citas) {
  window.AppState.citas = JSON.parse(localStorage.getItem('agenda_citas')) || [];
}

// Cargar las citas al iniciar la aplicación
document.addEventListener('DOMContentLoaded', () => {
  renderCitas();
  actualizarResumenSemanalCitas();
});

// Función Principal: Crear una nueva cita médica
function crearCitaMedica(paciente, especialidad, institucion, fecha, hora, lugar, copago, transporte) {
  const nuevaCita = {
    id: 'cita_' + Date.now(),
    paciente,
    especialidad: especialidad || 'Consulta General',
    institucion: institucion || 'IPS',
    fecha: fecha || new Date().toISOString().split('T')[0],
    hora: hora || '00:00',
    lugar: lugar || 'No especificado',
    copago: parseFloat(copago) || 0,
    transporte: parseFloat(transporte) || 0,
    estado: 'portomar' // Estados: portomar, tomada, reprogramada, cancelada
  };

  window.AppState.citas.push(nuevaCita);
  guardarCitasEnStorage();
  
  // PUENTE AUTOMÁTICO: Si hay gastos asociados, los envía al módulo de finanzas de inmediato
  const gastoTotal = nuevaCita.copago + nuevaCita.transporte;
  if (gastoTotal > 0 && typeof registrarGastoDesdeModulo === 'function') {
    registrarGastoDesdeModulo(
      gastoTotal, 
      `Logística Médica: ${nuevaCita.especialidad} (${nuevaCita.paciente})`, 
      'Efectivo'
    );
  }

  renderCitas();
  actualizarResumenSemanalCitas();
  if (typeof renderModoHoy === 'function') renderModoHoy();
}

// Renderizar la lista de tarjetas de citas con diseño V8
function renderCitas() {
  const container = document.getElementById('citas-list');
  if (!container) return;

  if (window.AppState.citas.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:30px; color:var(--text2); font-size:14px;">
        📸 No tienes citas médicas programadas en el historial.
      </div>`;
    return;
  }

  // Ordenar citas por fecha de la más cercana a la más lejana
  const citasOrdenadas = [...window.AppState.citas].sort((a, b) => a.fecha.localeCompare(b.fecha));

  container.innerHTML = citasOrdenadas.map(cita => {
    // Determinar la clase de chip según el estado de la cita
    let chipClass = 'chip-portomar';
    let estadoTexto = 'Por Tomar';
    if (cita.estado === 'tomada') { chipClass = 'chip-done'; estadoTexto = 'Tomada / Asistió'; }
    if (cita.estado === 'reprogramada') { chipClass = 'chip-reprogramada'; estadoTexto = 'Reprogramada'; }
    if (cita.estado === 'cancelada') { chipClass = 'chip-cancelada'; estadoTexto = 'Cancelada'; }

    return `
      <div class="card card-highlight" style="border-left-color: ${obtenerColorPaciente(cita.paciente)};">
        <div style="display:flex; justify-content:between; align-items:start; gap:10px; flex-wrap:wrap;">
          <div style="flex:1;">
            <div style="font-family:'Fraunces',serif; font-size:18px; font-weight:700; color:var(--text)">
              ${cita.especialidad}
            </div>
            <div class="card-meta">
              <span>👤 <b>${cita.paciente}</b></span> · 
              <span>🏥 ${cita.institucion}</span> · 
              <span>📍 ${cita.lugar}</span>
            </div>
            <div class="card-meta" style="margin-top:4px; font-weight:500; color:var(--accent)">
              📅 ${formatearFechaTexto(cita.fecha)} a las ⏰ ${cita.hora}
            </div>
            <div style="margin-top:8px; font-size:12px; color:var(--text3)">
              Copago: $${cita.copago.toLocaleString()} | Transporte: $${cita.transporte.toLocaleString()}
            </div>
          </div>
          <div>
            <span class="chip ${chipClass}">${estadoTexto}</span>
          </div>
        </div>
        
        <div class="card-actions">
          <button class="btn btn-outline btn-sm" onclick="cambiarEstadoCita('${cita.id}', 'tomada')">✓ Completada</button>
          <button class="btn btn-ghost btn-sm" onclick="cambiarEstadoCita('${cita.id}', 'reprogramada')">🔄 Reprogramar</button>
          <button class="btn btn-danger btn-sm" onclick="eliminarCitaMedica('${cita.id}')">🗑️ Eliminar</button>
        </div>
      </div>
    `;
  }).join('');
}

// Actualizar los 3 paneles superiores fijos del HTML según el paciente
function actualizarResumenSemanalCitas() {
  const pacoBox = document.getElementById('citas-paco');
  const padreBox = document.getElementById('citas-padre');
  const esposaBox = document.getElementById('citas-esposa');

  if (pacoBox) pacoBox.textContent = obtenerProximaCitaTexto('Paco');
  if (padreBox) padreBox.textContent = obtenerProximaCitaTexto('Padre');
  if (esposaBox) esposaBox.textContent = obtenerProximaCitaTexto('Esposa');
}

// Helpers para el módulo de citas
function obtenerProximaCitaTexto(paciente) {
  const proximas = window.AppState.citas.filter(c => c.paciente === paciente && c.estado === 'portomar');
  if (!proximas.length) return 'Sin citas pendientes';
  const proxima = proximas.sort((a,b) => a.fecha.localeCompare(b.fecha))[0];
  return `${proxima.fecha} (${proxima.especialidad})`;
}

function obtenerColorPaciente(paciente) {
  if (paciente === 'Paco') return '#0055ff';
  if (paciente === 'Padre') return '#00aa00';
  return '#ffcc00'; // Esposa
}

function cambiarEstadoCita(id, nuevoEstado) {
  const cita = window.AppState.citas.find(c => c.id === id);
  if (cita) {
    cita.estado = nuevoEstado;
    guardarCitasEnStorage();
    renderCitas();
    actualizarResumenSemanalCitas();
  }
}

function eliminarCitaMedica(id) {
  window.AppState.citas = window.AppState.citas.filter(c => c.id !== id);
  guardarCitasEnStorage();
  renderCitas();
  actualizarResumenSemanalCitas();
}

function guardarCitasEnStorage() {
  localStorage.setItem('agenda_citas', JSON.stringify(window.AppState.citas));
}

function formatearFechaTexto(f) {
  if(!f) return '';
  const partes = f.split('-');
  if(partes.length !== 3) return f;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// Sobrescribir la función puente de ejecución del index.html para vincularla a este código real
window.crearCitaMedica = crearCitaMedica;
