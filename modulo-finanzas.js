/* ==========================================================================
   MODULO-FINANZAS.JS - CONTROL FINANCIERO, CUENTAS Y FLUJOS V8
   ========================================================================== */

if (!window.AppState) window.AppState = {};
if (!window.AppState.finanzas) {
  window.AppState.finanzas = JSON.parse(localStorage.getItem('agenda_finanzas')) || {
    cuentas: [
      { id: 'c1', nombre: 'Efectivo', saldo: 150000, color: '#2d6a4f' },
      { id: 'c2', nombre: 'Bancolombia', saldo: 2450000, color: '#1d3557' }
    ],
    transacciones: [],
    presupuestos: [
      { id: 'b1', categoriaNombre: '🧱 Materiales Obra', limite: 1500000, consumido: 0 },
      { id: 'b2', categoriaNombre: '💊 Logística Médica', limite: 400000, consumido: 0 }
    ]
  };
}

document.addEventListener('DOMContentLoaded', () => {
  renderFinanzasCompleto();
});

// Función puente que llaman los otros módulos (como obras o citas) para restar o sumar dinero
function registrarGastoDesdeModulo(monto, descripcion, nombreCuenta) {
  let cuenta = window.AppState.finanzas.cuentas.find(c => c.nombre.toLowerCase() === nombreCuenta.toLowerCase());
  
  // Si la cuenta no existe en la billetera, la creamos con saldo 0 para no perder el rastro
  if (!cuenta) {
    cuenta = { id: 'c_' + Date.now(), nombre: nombreCuenta, saldo: 0, color: '#b45309' };
    window.AppState.finanzas.cuentas.push(cuenta);
  }

  cuenta.saldo -= monto; // Restar el egreso

  const nuevaTx = {
    id: 'tx_' + Date.now(),
    tipo: 'egreso',
    monto,
    desc: descripcion,
    cuentaId: cuenta.id,
    fecha: new Date().toISOString().split('T')[0]
  };

  window.AppState.finanzas.transacciones.push(nuevaTx);
  
  // Actualizar consumos de los presupuestos si coincide la palabra clave
  actualizarPresupuestosInternos(descripcion, monto);
  
  guardarFinanzasEnStorage();
  renderFinanzasCompleto();
}

function renderFinanzasCompleto() {
  renderTarjetasCuentas();
  renderBarrasPresupuesto();
  renderHistorialFinanzas();
}

// ── RENDER DE CUENTAS (Bordes de Color Estilo V8) ──
function renderTarjetasCuentas() {
  const container = document.getElementById('finanzas-cuentas');
  if (!container) return;

  container.innerHTML = window.AppState.finanzas.cuentas.map(c => `
    <div class="cuenta-card" style="--cuenta-color: ${c.color}">
      <div style="font-size: 12px; color: var(--text2); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">
        ${c.nombre}
      </div>
      <div class="cuenta-saldo">
        $${c.saldo.toLocaleString()}
      </div>
    </div>
  `).join('');
}

// ── RENDER DE PRESUPUESTOS (Barras Progresivas Inteligentes) ──
function renderBarrasPresupuesto() {
  const container = document.getElementById('presupuestos-progress-container');
  if (!container) return;

  container.innerHTML = window.AppState.finanzas.presupuestos.map(b => {
    const porcentaje = Math.min(100, Math.round((b.consumido / b.limite) * 100));
    
    // Cambiar color de la barra según gravedad del gasto
    let colorFillClass = '';
    if (porcentaje >= 100) colorFillClass = 'danger'; // Alerta Roja en CSS
    else if (porcentaje >= 80) colorFillClass = 'warning'; // Alerta Naranja en CSS

    return `
      <div class="progress-wrap" style="margin-bottom: 15px;">
        <div class="progress-labels">
          <span style="font-weight:600;">${b.categoriaNombre}</span>
          <span style="color:var(--text2); font-size:12px;">$${b.consumido.toLocaleString()} / $${b.limite.toLocaleString()} (${porcentaje}%)</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${colorFillClass}" style="width: ${porcentaje}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ── RENDER DEL HISTORIAL DE CAJA INTEGRAL ──
function renderHistorialFinanzas() {
  const container = document.getElementById('tx-history-container');
  if (!container) return;

  if (window.AppState.finanzas.transacciones.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text3); font-size:13px; padding:15px;">No hay registros de caja este mes.</div>`;
    return;
  }

  // Agrupar por fechas e imprimir las filas elegantes estilo v8
  const sortedTxs = [...window.AppState.finanzas.transacciones].sort((a,b) => b.id.localeCompare(a.id));

  container.innerHTML = `
    <div style="font-weight:700; font-family:'Fraunces',serif; font-size:16px; margin-bottom:10px;">Últimos Movimientos de Caja</div>
    ` + sortedTxs.slice(0, 10).map(tx => {
      const cName = window.AppState.finanzas.cuentas.find(c => c.id === tx.cuentaId)?.nombre || 'Efectivo';
      const esIngreso = tx.tipo === 'ingreso';
      return `
        <div class="tx-row">
          <div style="font-size:18px;">${esIngreso ? '💰' : '📉'}</div>
          <div class="tx-info">
            <div class="tx-desc">${tx.desc}</div>
            <div style="font-size:11px; color:var(--text3)">Billetera: ${cName} | ${tx.fecha}</div>
          </div>
          <div class="tx-monto ${tx.tipo}">
            ${esIngreso ? '+' : '-'}$${tx.monto.toLocaleString()}
          </div>
        </div>
      `;
    }).join('');
}

function actualizarPresupuestosInternos(desc, monto) {
  if (desc.toLowerCase().includes('obra') || desc.toLowerCase().includes('material')) {
    window.AppState.finanzas.presupuestos[0].consumido += monto;
  } else if (desc.toLowerCase().includes('médica') || desc.toLowerCase().includes('cita') || desc.toLowerCase().includes('copago')) {
    window.AppState.finanzas.presupuestos[1].consumido += monto;
  }
}

// Vinculación segura de los botones del modal del index.html
window.ejecutarGastoFinanzas = function() {
  const tipo = document.getElementById('tx-tipo').value;
  const monto = parseFloat(document.getElementById('tx-monto').value) || 0;
  const desc = document.getElementById('tx-desc').value.trim();
  const cNombre = document.getElementById('tx-cuenta').value || 'Efectivo';

  if (monto <= 0 || !desc) { alert('Por favor llena los campos obligatorios.'); return; }

  let cuenta = window.AppState.finanzas.cuentas.find(c => c.nombre.toLowerCase() === cNombre.toLowerCase());
  if (!cuenta) {
    cuenta = { id: 'c_' + Date.now(), nombre: cNombre, saldo: 0, color: '#1d3557' };
    window.AppState.finanzas.cuentas.push(cuenta);
  }

  if (tipo === 'ingreso') cuenta.saldo += monto;
  else {
    cuenta.saldo -= monto;
    actualizarPresupuestosInternos(desc, monto);
  }

  window.AppState.finanzas.transacciones.push({
    id: 'tx_' + Date.now(),
    tipo,
    monto,
    desc,
    cuentaId: cuenta.id,
    fecha: new Date().toISOString().split('T')[0]
  });

  guardarFinanzasEnStorage();
  renderFinanzasCompleto();
  closeModal('modal-nueva-tx');
  if (typeof showToast === 'function') showToast('Movimiento financiero registrado.');
};

function guardarFinanzasEnStorage() {
  localStorage.setItem('agenda_finanzas', JSON.stringify(window.AppState.finanzas));
}

window.registrarGastoDesdeModulo = registrarGastoDesdeModulo;
