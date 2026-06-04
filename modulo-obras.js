/* ==========================================================================
   MODULO-OBRAS.JS - CONTROL AVANZADO DE PROYECTOS Y REFORMAS V8
   ========================================================================== */

if (!window.AppState) window.AppState = {};
if (!window.AppState.obras) {
  window.AppState.obras = JSON.parse(localStorage.getItem('agenda_obras')) || [
    {
      id: 'obra_1',
      proyecto: 'Remodelación Baño Principal',
      presupuestoAsignado: 3500000,
      gastado: 1200000,
      etapasTotal: 4,
      etapasListas: 2
    }
  ];
}

document.addEventListener('DOMContentLoaded', () => {
  renderObras();
});

function renderObras() {
  const container = document.getElementById('obras-container');
  if (!container) return;

  if (window.AppState.obras.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text3);">No hay obras registradas.</div>`;
    return;
  }

  container.innerHTML = window.AppState.obras.map(obra => {
    // Calcular avance real combinado (Promedio entre presupuesto consumido y etapas físicas hechas)
    const porcentajeDinero = Math.min(100, Math.round((obra.gastado / obra.presupuestoAsignado) * 100));
    const porcentajeEtapas = Math.round((obra.etapasListas / obra.etapasTotal) * 100);
    const avanceRealCombinado = Math.round((porcentajeDinero + porcentajeEtapas) / 2);

    return `
      <div class="card card-highlight" style="border-left-color: var(--amber);">
        <div style="font-family:'Fraunces',serif; font-size:19px; font-weight:700; color:var(--text)">
          ${obra.proyecto}
        </div>
        
        <div class="progress-wrap">
          <div class="progress-labels">
            <span>Avance Constructivo Integral</span>
            <strong>${avanceRealCombinado}%</strong>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${avanceRealCombinado}%"></div>
          </div>
        </div>

        <div class="card-meta" style="margin-top:10px; font-size:13px; color:var(--text2)">
          <span>🧱 Gastado: <b>$${obra.gastado.toLocaleString()}</b> de $${obra.presupuestoAsignado.toLocaleString()}</span> · 
          <span>🛠️ Tareas: <b>${obra.etapasListas} de ${obra.etapasTotal} completadas</b></span>
        </div>

        <div class="card-actions" style="margin-top:14px;">
          <button class="btn btn-outline btn-sm" onclick="marcarEtapaLista('${obra.id}')">🔨 Avanzar Tarea Física</button>
          <button class="btn btn-danger btn-sm" onclick="eliminarProyectoObra('${obra.id}')">🗑️ Archivar</button>
        </div>
      </div>
    `;
  }).join('');
}

// Vinculación del formulario modal del index.html para registrar gastos directo
window.ejecutarGastoObra = function() {
  const proyNombre = document.getElementById('obra-proyecto').value.trim();
  const tipoGasto = document.getElementById('obra-tipo').value;
  const monto = parseFloat(document.getElementById('obra-monto').value) || 0;
  const detalle = document.getElementById('obra-detalle').value.trim();
  const cNombre = document.getElementById('obra-cuenta').value || 'Efectivo';

  if (!proyNombre || monto <= 0 || !detalle) { alert('Completa los campos de la obra.'); return; }

  // Buscar si el frente de obra ya existe o crear uno nuevo
  let obra = window.AppState.obras.find(o => o.proyecto.toLowerCase() === proyNombre.toLowerCase());
  if (!obra) {
    obra = {
      id: 'obra_' + Date.now(),
      proyecto: proyNombre,
      presupuestoAsignado: monto * 3, // Estimación inicial automática
      gastado: 0,
      etapasTotal: 5,
      etapasListas: 1
    };
    window.AppState.obras.push(obra);
  }

  obra.gastado += monto;

  // CONEXIÓN AL PUENTE CONTABLE: Manda el egreso de forma automatizada al módulo de finanzas
  if (typeof registrarGastoDesdeModulo === 'function') {
    registrarGastoDesdeModulo(monto, `Materiales Obra: ${detalle} (${proyNombre})`, cNombre);
  }

  guardarObrasEnStorage();
  renderObras();
  closeModal('modal-nueva-obra');
  if (typeof showToast === 'function') showToast('Gasto inyectado a la obra y descontado de caja.');
};

function marcarEtapaLista(id) {
  const obra = window.AppState.obras.find(o => o.id === id);
  if (obra && obra.etapasListas < obra.etapasTotal) {
    obra.etapasListas += 1;
    guardarObrasEnStorage();
    renderObras();
  }
}

function eliminarProyectoObra(id) {
  window.AppState.obras = window.AppState.obras.filter(o => o.id !== id);
  guardarObrasEnStorage();
  renderObras();
}

function guardarObrasEnStorage() {
  localStorage.setItem('agenda_obras', JSON.stringify(window.AppState.obras));
}
