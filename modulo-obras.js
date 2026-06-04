/* ==========================================================================
   MODULO-OBRAS.JS - CONTROL DE INFRAESTRUCTURA Y GESTIÓN TÉCNICA V8.1
   ========================================================================== */

if (!window.AppState) window.AppState = {};
if (!window.AppState.obrasProyectos) window.AppState.obrasProyectos = JSON.parse(localStorage.getItem('agenda_obras_proyectos')) || [];
if (!window.AppState.cotizaciones) window.AppState.cotizaciones = JSON.parse(localStorage.getItem('agenda_cotizaciones')) || [];

document.addEventListener('DOMContentLoaded', () => {
  actualizarSelectCotizacionesEnObra();
  renderObras();
});

function actualizarSelectCotizacionesEnObra() {
  const el = document.getElementById('obra-cotizacion-vinculo');
  if(el) {
    el.innerHTML = `<option value="NINGUNA">Sin cotización (Gasto directo)</option>` + 
    window.AppState.cotizaciones.map(c => `<option value="${c.id}">${c.proyecto} [${c.proveedor}] ($${c.total.toLocaleString()})</option>`).join('');
  }
}

function ejecutarCrearCotizacion() {
  const proj = document.getElementById('cot-proyecto').value.trim();
  const prov = document.getElementById('cot-proveedor').value.trim();
  const tot = parseFloat(document.getElementById('cot-total').value) || 0;

  if(!proj || !prov || tot <= 0) return;

  window.AppState.cotizaciones.push({ id: 'cot_'+Date.now(), proyecto: proj, proveedor: prov, total: tot });
  localStorage.setItem('agenda_cotizaciones', JSON.stringify(window.AppState.cotizaciones));
  
  document.getElementById('form-cotizacion').reset();
  closeModal('modal-nueva-cotizacion');
  actualizarSelectCotizacionesEnObra();
  showToast('Cotización indexada al libro de presupuestos.');
  renderObras();
}

function ejecutarGastoObraReal() {
  const proyNombre = document.getElementById('obra-proyecto').value.trim();
  const responsable = document.getElementById('obra-responsable').value.trim();
  const cotId = document.getElementById('obra-cotizacion-vinculo').value;
  const monto = parseFloat(document.getElementById('obra-monto').value) || 0;
  const cuentaPago = document.getElementById('obra-cuenta-pago').value;
  const detalle = document.getElementById('obra-detalle').value.trim();

  if(!proyNombre || !responsable || monto <= 0 || !detalle) {
    alert('Llena los datos del frente de obra.'); return;
  }

  let pObj = window.AppState.obrasProyectos.find(p => p.nombre.toLowerCase() === proyNombre.toLowerCase());
  if(!pObj) {
    pObj = { id: 'proy_'+Date.now(), nombre: proyNombre, tareas: [] };
    window.AppState.obrasProyectos.push(pObj);
  }

  const itemTarea = {
    id: 'tar_'+Date.now(), responsable, cotizacionId: cotId, costo: monto, detalle, estado: 'completada'
  };
  pObj.tareas.push(itemTarea);
  localStorage.setItem('agenda_obras_proyectos', JSON.stringify(window.AppState.obrasProyectos));

  // Comunicación puente cruzada automática a finanzas
  if(typeof registrarGastoDesdeModulo === 'function') {
    registrarGastoDesdeModulo(monto, `Materiales Obra [Ref: ${itemTarea.id}]: ${detalle} (Por: ${responsable})`, cuentaPago, '🧱 Materiales Obra');
  }

  document.getElementById('form-obra').reset();
  closeModal('modal-nueva-obra');
  renderObras();
  showToast('Gasto inyectado a la obra y descontado de caja bancaria.');
}

function renderObras() {
  const container = document.getElementById('obras-container');
  if(!container) return;

  if (window.AppState.obrasProyectos.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text3);">No hay proyectos de construcción en ejecución.</div>`;
    return;
  }

  container.innerHTML = window.AppState.obrasProyectos.map(p => {
    // Presupuesto dinámico sumando cotizaciones vinculadas
    const cotizacionesDelProyecto = window.AppState.cotizaciones.filter(c => c.proyecto.toLowerCase() === p.nombre.toLowerCase());
    const presupuestoCalculado = cotizacionesDelProyecto.reduce((acc, current) => acc + current.total, 0) || 1000000; // Valor de contingencia si no hay cotizaciones
    
    const totalInvertido = p.tareas.reduce((acc, curr) => acc + curr.costo, 0);
    const pctGasto = Math.min(100, Math.round((totalInvertido / presupuestoCalculado) * 100));

    return `
      <div class="card card-highlight" style="border-left-color: var(--amber);">
        <div style="font-family:'Fraunces',serif; font-size:18px; font-weight:700;">🏗️ Frente: ${p.nombre}</div>
        
        <div class="progress-wrap" style="margin-top:8px;">
          <div class="progress-labels">
            <span>Ejecución del Presupuesto de Cotizaciones</span>
            <strong>${pctGasto}%</strong>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width: ${pctGasto}%; background-color:var(--amber);"></div></div>
        </div>

        <div style="font-size:12px; margin-top:8px; color:var(--text2);">
          💰 Invertido Real: <b>$${totalInvertido.toLocaleString()}</b> de un presupuesto cotizado de $${presupuestoCalculado.toLocaleString()}
        </div>

        <div style="margin-top:10px; background:var(--surface2); padding:8px; border-radius:6px;">
          <div style="font-size:11px; font-weight:700; margin-bottom:5px; text-transform:uppercase; color:var(--text2);">Desglose de Ítems y Responsables:</div>
          ${p.tareas.map(t => `
            <div style="font-size:12px; display:flex; justify-content:space-between; border-bottom:1px dashed var(--border); padding:3px 0;">
              <span>🛠️ <b>${t.responsable}</b>: ${t.detalle} <small style="color:var(--text3)">[ID: ${t.id}]</small></span>
              <strong style="color:var(--red);">$${t.costo.toLocaleString()}</strong>
            </div>
          `).join('') || '<div style="font-size:11px; color:var(--text3);">Sin registros materiales asignados.</div>'}
        </div>
        <div class="card-actions" style="justify-content:flex-end; margin-top:10px;">
          <button class="btn btn-danger btn-sm" onclick="eliminarFrenteObra('${p.id}')">🗑️ Archivar Frente</button>
        </div>
      </div>
    `;
  }).join('');
}

function eliminarFrenteObra(id) {
  window.AppState.obrasProyectos = window.AppState.obrasProyectos.filter(p => p.id !== id);
  localStorage.setItem('agenda_obras_proyectos', JSON.stringify(window.AppState.obrasProyectos));
  renderObras();
}
