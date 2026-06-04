/* ==========================================================================
   MODULO-FINANZAS.JS - CORE FINANCIERO INTEGRAL CON DRILL-DOWN V8.1
   ========================================================================== */

if (!window.AppState) window.AppState = {};
if (!window.AppState.finanzas) {
  window.AppState.finanzas = JSON.parse(localStorage.getItem('agenda_finanzas')) || {
    cuentas: [
      { id: 'c1', nombre: 'Efectivo', saldo: 500000, color: '#2d6a4f' },
      { id: 'c2', nombre: 'Bancolombia', saldo: 1200000, color: '#1d3557' }
    ],
    transacciones: []
  };
}

let filtroTipoActual = 'todos'; // Variable de control para el drill-down clínico

document.addEventListener('DOMContentLoaded', () => {
  renderFinanzasCompleto();
});

function abrirModalFinanzas() {
  document.getElementById('form-finanzas').reset();
  document.getElementById('tx-id-edicion').value = '';
  document.getElementById('btn-guardar-tx').textContent = 'Confirmar Registro Permanente';
  actualizarSelectCuentasContables();
  openModal('modal-nueva-tx');
}

function actualizarSelectCuentasContables() {
  const selects = ['tx-cuenta', 'obra-cuenta-pago'];
  selects.forEach(sId => {
    const el = document.getElementById(sId);
    if(el) {
      el.innerHTML = window.AppState.finanzas.cuentas.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('') + `<option value="NUEVO">➕ Crear nueva cuenta...</option>`;
    }
  });
}

function verificarNuevaCuentaBancaria(selectElement) {
  if(selectElement.value === 'NUEVO') {
    const popup = document.getElementById('popup-auxiliar');
    const input = document.getElementById('aux-input');
    document.getElementById('aux-titulo').textContent = 'Nueva Billetera / Cuenta';
    input.value = '';
    popup.classList.add('open');
    
    document.getElementById('aux-btn-confirmar').onclick = () => {
      const v = input.value.trim();
      if(v) {
        window.AppState.finanzas.cuentas.push({ id: 'c_'+Date.now(), nombre: v, saldo: 0, color: '#b45309' });
        localStorage.setItem('agenda_finanzas', JSON.stringify(window.AppState.finanzas));
        actualizarSelectCuentasContables();
        selectElement.value = v;
        popup.classList.remove('open');
        renderTarjetasCuentas();
      }
    };
  }
}

function registrarGastoDesdeModulo(monto, desc, nombreCuenta, categoria) {
  let cuenta = window.AppState.finanzas.cuentas.find(c => c.nombre.toLowerCase() === nombreCuenta.toLowerCase());
  if(!cuenta) {
    cuenta = { id: 'c_'+Date.now(), nombre: nombreCuenta, saldo: 0, color: '#7f8c8d' };
    window.AppState.finanzas.cuentas.push(cuenta);
  }
  cuenta.saldo -= monto;
  window.AppState.finanzas.transacciones.push({
    id: 'tx_'+Date.now(), tipo: 'egreso', monto, desc, cuentaId: cuenta.id, categoria: categoria || '🧱 Materiales Obra', fecha: new Date().toISOString().split('T')[0]
  });
  localStorage.setItem('agenda_finanzas', JSON.stringify(window.AppState.finanzas));
  renderFinanzasCompleto();
}

function ejecutarGastoFinanzasReal() {
  const idEdicion = document.getElementById('tx-id-edicion').value;
  const tipo = document.getElementById('tx-tipo').value;
  const monto = parseFloat(document.getElementById('tx-monto').value) || 0;
  const desc = document.getElementById('tx-desc').value.trim();
  const cuentaNombre = document.getElementById('tx-cuenta').value;
  const categoria = document.getElementById('tx-categoria').value;

  if(monto <= 0 || !desc || cuentaNombre === 'NUEVO') {
    alert('Completa los campos contables requeridos.'); return;
  }

  // Si estamos editando, revertimos primero el dinero del saldo anterior
  if (idEdicion) {
    revertirImpactoMonetario(idEdicion);
    window.AppState.finanzas.transacciones = window.AppState.finanzas.transacciones.filter(t => t.id !== idEdicion);
  }

  let cuenta = window.AppState.finanzas.cuentas.find(c => c.nombre === cuentaNombre);
  if(tipo === 'ingreso') cuenta.saldo += monto; else cuenta.saldo -= monto;

  window.AppState.finanzas.transacciones.push({
    id: idEdicion || 'tx_'+Date.now(), tipo, monto, desc, cuentaId: cuenta.id, categoria, fecha: new Date().toISOString().split('T')[0]
  });

  localStorage.setItem('agenda_finanzas', JSON.stringify(window.AppState.finanzas));
  document.getElementById('form-finanzas').reset(); // Reset absoluto anti-duplicados
  closeModal('modal-nueva-tx');
  renderFinanzasCompleto();
  showToast('Operación de caja ejecutada correctamente.');
}

function revertirImpactoMonetario(id) {
  const tx = window.AppState.finanzas.transacciones.find(t => t.id === id);
  if(tx) {
    const c = window.AppState.finanzas.cuentas.find(acc => acc.id === tx.cuentaId);
    if(c) { if(tx.tipo === 'ingreso') c.saldo -= tx.monto; else c.saldo += tx.monto; }
  }
}

function filtrarTransaccionesPorTipo(tipo) {
  filtroTipoActual = tipo;
  renderHistorialFinanzas();
  showToast(`Filtrando historial por: ${tipo.toUpperCase()}`);
}

function renderFinanzasCompleto() {
  // Calcular indicadores agregados
  let ing = 0, egr = 0;
  window.AppState.finanzas.transacciones.forEach(t => { if(t.tipo==='ingreso') ing+=t.monto; else egr+=t.monto; });
  
  document.getElementById('total-ingresos').textContent = '$' + ing.toLocaleString();
  document.getElementById('total-egresos').textContent = '$' + egr.toLocaleString();
  
  let netoCuentas = 0;
  window.AppState.finanzas.cuentas.forEach(c => netoCuentas += c.saldo);
  document.getElementById('total-neto').textContent = '$' + netoCuentas.toLocaleString();

  renderTarjetasCuentas();
  renderBarrasPresupuestoReales();
  renderHistorialFinanzas();
}

function renderTarjetasCuentas() {
  const container = document.getElementById('finanzas-cuentas');
  if(!container) return;
  container.innerHTML = window.AppState.finanzas.cuentas.map(c => `
    <div class="cuenta-card" style="--cuenta-color: ${c.color}">
      <div style="font-size:11px; font-weight:700; color:var(--text2); text-transform:uppercase;">${c.nombre}</div>
      <div class="cuenta-saldo">$${c.saldo.toLocaleString()}</div>
    </div>
  `).join('');
}

function renderBarrasPresupuestoReales() {
  const container = document.getElementById('presupuestos-progress-container');
  if(!container) return;

  // Presupuestos base calculados dinámicamente según gastos reales
  const limites = { '🧱 Materiales Obra': 2000000, '💊 Logística Médica': 500000, '🍔 Sustento Diario': 800000 };
  const consumos = { '🧱 Materiales Obra': 0, '💊 Logística Médica': 0, '🍔 Sustento Diario': 0 };

  window.AppState.finanzas.transacciones.forEach(t => {
    if(t.tipo === 'egreso' && consumos[t.categoria] !== undefined) consumos[t.categoria] += t.monto;
  });

  container.innerHTML = Object.keys(limites).map(cat => {
    const pct = Math.min(100, Math.round((consumos[cat] / limites[cat]) * 100));
    return `
      <div class="progress-wrap" style="margin-bottom:10px;">
        <div class="progress-labels">
          <span>${cat}</span>
          <small>$${consumos[cat].toLocaleString()} / $${limites[cat].toLocaleString()} (${pct}%)</small>
        </div>
        <div class="progress-bar"><div class="progress-fill ${pct>=90?'danger':pct>=75?'warning':''}" style="width:${pct}%"></div></div>
      </div>
    `;
  }).join('');
}

function renderHistorialFinanzas() {
  const container = document.getElementById('tx-history-container');
  if(!container) return;

  let filtradas = window.AppState.finanzas.transacciones;
  if(filtroTipoActual !== 'todos') filtradas = filtradas.filter(t => t.tipo === filtroTipoActual);

  const sorted = [...filtradas].sort((a,b) => b.id.localeCompare(a.id));

  container.innerHTML = `<div style="font-weight:700; font-family:'Fraunces',serif; margin-bottom:10px;">Historial Contable (${filtroTipoActual.toUpperCase()})</div>` + 
  sorted.map(t => {
    const cObj = window.AppState.finanzas.cuentas.find(acc => acc.id === t.cuentaId);
    return `
      <div class="tx-row" style="align-items:center;">
        <div style="font-size:16px;">${t.tipo==='ingreso'?'💰':'📉'}</div>
        <div class="tx-info" style="flex:1;">
          <div class="tx-desc" style="font-weight:600; font-size:13px;">${t.desc}</div>
          <small style="color:var(--text3); font-size:11px;">${cObj?cObj.nombre:'Efectivo'} · ${t.categoria}</small>
        </div>
        <div class="tx-monto ${t.tipo}" style="font-weight:700; margin-right:8px;">${t.tipo==='ingreso'?'+':'-'}$${t.monto.toLocaleString()}</div>
        <div style="display:flex; gap:4px;">
          <button class="btn btn-ghost btn-sm" style="padding:2px 6px;" onclick="iniciarEdicionTx('${t.id}')">✏️</button>
          <button class="btn btn-danger btn-sm" style="padding:2px 6px;" onclick="eliminarTxReal('${t.id}')">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

function iniciarEdicionTx(id) {
  const tx = window.AppState.finanzas.transacciones.find(t => t.id === id);
  if(!tx) return;
  abrirModalFinanzas();
  document.getElementById('tx-id-edicion').value = tx.id;
  document.getElementById('tx-tipo').value = tx.tipo;
  document.getElementById('tx-monto').value = tx.monto;
  document.getElementById('tx-desc').value = tx.desc;
  document.getElementById('tx-categoria').value = tx.categoria;
  
  const cObj = window.AppState.finanzas.cuentas.find(acc => acc.id === tx.cuentaId);
  if(cObj) document.getElementById('tx-cuenta').value = cObj.nombre;
  
  document.getElementById('btn-guardar-tx').textContent = '🔧 Guardar Modificación';
}

function eliminarTxReal(id) {
  revertirImpactoMonetario(id);
  window.AppState.finanzas.transacciones = window.AppState.finanzas.transacciones.filter(t => t.id !== id);
  localStorage.setItem('agenda_finanzas', JSON.stringify(window.AppState.finanzas));
  renderFinanzasCompleto();
  showToast('Transacción eliminada y caja balanceada.');
}
