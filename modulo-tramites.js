function registrarEntradaTramite(entidad, tipoEntrada, numeroRadicado, descripcion) {
 sincronizarConSheets('Tramites', [Date.now(), new Date().toISOString().split('T')[0], entidad, tipoEntrada, numeroRadicado, descripcion, 'En curso']);
}