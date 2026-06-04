let cuentasFamiliares = { nequi: { nombre: 'Nequi', saldo: 150000 }, efectivo: { nombre: 'Efectivo', saldo: 200000 } };
let callbackPendienteFinanzas = null;
function registrarTransaccion(tipo, monto, cuentaOrigen, categoria, fechaCustom = null) {
 const cls = cuentaOrigen.toLowerCase().replace(/\s+/g, '');
 if (!cuentasFamiliares[cls]) {
 document.getElementById('nombre-cuenta-faltante').innerText = cuentaOrigen;
 document.getElementById('popup-cuenta').style.display = 'flex';
 callbackPendienteFinanzas = () => { registrarTransaccion(tipo, monto, cuentaOrigen, categoria, fechaCustom); };
 return false;
 }
 const f = fechaCustom || new Date().toISOString().split('T')[0];
 sincronizarConSheets('Finanzas', [Date.now(), f, tipo, monto, cuentaOrigen, categoria]);
 return true;
}
function confirmarCreacionDeCuenta() {
 const nombre = document.getElementById('nombre-cuenta-faltante').innerText;
 const saldo = document.getElementById('saldo-inicial-cuenta').value || 0;
 const cls = nombre.toLowerCase().replace(/\s+/g, '');
 cuentasFamiliares[cls] = { nombre: nombre, saldo: parseFloat(saldo) };
 document.getElementById('popup-cuenta').style.display = 'none';
 if (callbackPendienteFinanzas) { callbackPendienteFinanzas(); callbackPendienteFinanzas = null; }
}