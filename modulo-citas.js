window.AgendaData = { citas: [] };

function toggleSelectorEntrada() {
    const el = document.getElementById('selector-entrada');
    el.style.display = (el.style.display === 'block') ? 'none' : 'block';
}

function abrirModal(tipo) {
    document.getElementById('selector-entrada').style.display = 'none';
    document.getElementById(`modal-${tipo}`).style.display = 'block';
}

function cerrarModal(tipo) {
    document.getElementById(`modal-${tipo}`).style.display = 'none';
}

function guardarRegistro(tipo) {
    const data = {
        id: Date.now(),
        tipo: tipo,
        paciente: document.getElementById(`${tipo === 'medico' ? 'med' : tipo === 'pqrs' ? 'pqrs' : 'jud'}-paciente`).value,
        fecha: new Date().toISOString().split('T')[0],
        estado: 'por-tomar',
        historialRadicados: []
    };

    if(!data.paciente) return alert("Paciente obligatorio");
    
    window.AgendaData.citas.push(data);
    cerrarModal(tipo);
    renderPantallaHoyCompleta();
    actualizarTotalesKPI();
}

function renderPantallaHoyCompleta() {
    const container = document.getElementById('home-weekly-agenda');
    container.innerHTML = window.AgendaData.citas.map(c => `<div>${c.paciente} - ${c.tipo}</div>`).join('');
}

function actualizarTotalesKPI() {
    document.getElementById('stat-citas-por-tomar').innerText = window.AgendaData.citas.filter(c => c.tipo === 'medico').length;
    document.getElementById('stat-tramites-activos').innerText = window.AgendaData.citas.filter(c => c.tipo === 'pqrs').length;
    document.getElementById('stat-judicial-activos').innerText = window.AgendaData.citas.filter(c => c.tipo === 'judicial').length;
}

window.onload = () => {
    // Inicializar selectores de hora
    const selectHH = document.getElementById('med-hora-hh');
    for(let i=0; i<24; i++) selectHH.innerHTML += `<option value="${i}">${i}</option>`;
    actualizarTotalesKPI();
};
