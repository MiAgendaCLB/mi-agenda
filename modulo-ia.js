let microfonoEscuchando = false;
function toggleMicrofonoEscucha() {
    microfonoEscuchando = !microfonoEscuchando;
    const btn = document.getElementById('btn-toggle-mic');
    btn.innerText = microfonoEscuchando ? '🍏 Escuchando...' : '🔴 Apagado';
    btn.className = microfonoEscuchando ? 'btn-mic-activo' : 'btn-mic-inactiva';
}
function cargarYTranscribirAudio(e) { alert('Audio cargado para procesamiento cognitivo en la nube.'); }
let ultimaPropuestaIA = null;
function enviarMensajeAlChat() {
    const input = document.getElementById('input-chat');
    const cuerpo = document.getElementById('cuerpo-chat');
    if(!input.value.trim()) return;
    cuerpo.innerHTML += '<p style="align-self:flex-end; background:#e1ffd4; padding:8px;"><b>Tú:</b> ' + input.value + '</p>';
    const txt = input.value.toLowerCase(); input.value = '';
    if(txt.includes('cita')) {
        ultimaPropuestaIA = {tipo:'cita', p:'yo', e:'Neurología', i:'Clínica Occidente', f:'2026-06-09', h:'15:00', l:'Consultorio 401', c:'4500'};
        cuerpo.innerHTML += '<p style="background:#fff; border-left:4px solid #0055ff; padding:8px;">🤖 Detecté cita de Neurología. Copago: $4.500. ¿Deseas guardarla?</p>';
    } else {
        cuerpo.innerHTML += '<p style="background:#fff; border-left:4px solid #555; padding:8px;">🤖 Entendido Paco. Procesando comando libre.</p>';
    }
}
function presidentialBotonVoz() { document.getElementById('input-chat').value = 'Tengo cita con el neurólogo para mí el próximo martes'; enviarMensajeAlChat(); }