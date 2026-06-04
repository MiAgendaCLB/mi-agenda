const CLIENT_ID = 'TU_CLIENT_ID_DE_GOOGLE.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';
let tokenDeAccesoGoogle = null;
function conectarCuentaGoogle() {
 google.accounts.oauth2.initTokenClient({ client_id: CLIENT_ID, scope: SCOPES, callback: (resp) => { tokenDeAccesoGoogle = resp.access_token; alert('¡Conectado exitosamente con Google Workspace!'); } }).requestAccessToken({ prompt: 'consent' });
}
function estaConectadoAGoogle() { return tokenDeAccesoGoogle !== null; }