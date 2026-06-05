/**
 * Módulo de Citas y Gestión de Expedientes (V9)
 * Gestión: Médica, PQRS y Judicial.
 */

// 1. Lógica de Navegación de Modales
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

// 2. Lógica del Formulario Médico (con validación de trazabilidad)
function guardarRegistroMedico() {
    const paciente = document.getElementById('med-paciente').value;
    const fecha = document.getElementById('med-fecha').value;
    const hh = document.getElementById('med-hora-hh').value;
    const mm = document.getElementById('med-hora-mm').value;
    const institucion = document.getElementById('med-institucion').value;

    // Validación estricta
    if (!paciente || !fecha || !hh || !mm || !institucion) {
        alert("Error: Paciente, Fecha, Hora e Institución son obligatorios.");
        return;
    }

    const nuevaCita = {
        id: Date.now(),
        paciente: paciente,
        tipo: 'medica',
        subtipo: 'HC', // Por defecto; puedes hacerlo dinámico en el HTML
        estado: 'por-tomar',
        fecha: fecha,
        hora: `${hh}:${mm}`,
        institucion: institucion,
        pasoActual: 'Orden Médica',
        historialRadicados: [{ paso: 'Orden Médica', fecha: new Date().toISOString() }]
    };

    window.AgendaData.citas.push(nuevaCita);
    cerrarModal('medico');
    actualizarVista(); // Función maestra que renderiza la agenda
}

// 3. Funciones de Apoyo
function actualizarVista() {
    // Aquí invocas el renderizado semanal
    renderPantallaHoyCompleta(); 
    actualizarTotalesKPI();
}

// 4. Inicialización de Selectores de Hora (Intervalos 15 min)
function inicializarSelectoresHora() {
    const selectHH = document.getElementById('med-hora-hh');
    for (let i = 0; i < 24; i++) {
        let h = i.toString().padStart(2, '0');
        selectHH.innerHTML += `<option value="${h}">${h}</option>`;
    }
}

// Ejecutar al cargar
document.addEventListener('DOMContentLoaded', inicializarSelectoresHora);
