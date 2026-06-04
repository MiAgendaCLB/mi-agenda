function subirArchivoAGoogleDrive(nombreSeguro, archivoBinario) {
 if (!estaConectadoAGoogle()) return;
 const formData = new FormData();
 formData.append('metadata', new Blob([JSON.stringify({ name: nombreSeguro, mimeType: archivoBinario.type })], { type: 'application/json' }));
 formData.append('file', archivoBinario);
 fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', { method: 'POST', headers: { 'Authorization': 'Bearer ' + tokenDeAccesoGoogle }, body: formData });
}