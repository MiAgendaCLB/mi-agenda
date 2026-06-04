function crearCitaMedica(persona, especialidad, institucion, fecha, hora, lugar, valorCopago, valorTransporte = 30000) {
 if (!valorCopago) { alert('Copago obligatorio'); return null; }
 registrarTransaccion('egreso', valorTransporte, 'Efectivo', 'Transporte', fecha);
 registrarTransaccion('egreso', valorCopago, 'Efectivo', 'Salud', fecha);
 sincronizarConSheets('Citas', [Date.now(), persona, 'Médica', especialidad, institucion, fecha, hora, lugar, valorCopago, valorTransporte, 'Por tomar']);
}