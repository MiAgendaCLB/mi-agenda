const SPREADSHEET_ID = 'TU_ID_DE_GOOGLE_SHEETS_AQUÍ';
function sincronizarConSheets(pestana, filaDatos) {
 if (!estaConectadoAGoogle()) { console.log('[Modo Local]: Guardado en navegador.'); return; }
 const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + SPREADSHEET_ID + '/values/' + pestana + '!A:Z:append?valueInputOption=USER_ENTERED';
 fetch(url, {
 method: 'POST',
 headers: { 'Authorization': 'Bearer ' + tokenDeAccesoGoogle, 'Content-Type': 'application/json' },
 body: JSON.stringify({ range: pestana + '!A:Z', majorDimension: 'ROWS', values: [filaDatos] })
 }).then(r => r.json()).then(d => console.log('Sheets sincronizado'));
}