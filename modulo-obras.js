function registrarGastoObra(proyecto, tipoGasto, detalle, monto, cuentaOrigen) {
 const f = new Date().toISOString().split('T')[0];
 if(registrarTransaccion('egreso', monto, cuentaOrigen, 'Obra / ' + tipoGasto, f)) {
 sincronizarConSheets('Obras', [Date.now(), f, proyecto, tipoGasto, detalle, monto, cuentaOrigen]);
 }
}