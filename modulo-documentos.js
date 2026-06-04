function registrarYRenombrarDocumento(tipoDoc, persona, especialidadEntidad, fechaEmision, archivoBinario) {
 const name = fechaEmision.replace(/-/g, '') + '_' + tipoDoc + '_' + especialidadEntidad.replace(/\s+/g, '') + '_' + persona + '.pdf';
 sincronizarConSheets('Documentos', [Date.now(), fechaEmision, tipoDoc, persona, especialidadEntidad, name]);
 subirArchivoAGoogleDrive(name, archivoBinario);
}