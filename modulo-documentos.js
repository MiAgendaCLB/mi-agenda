/* ==========================================================================
   MODULO-DOCUMENTOS.JS - MOTOR INTELIGENTE DE NOMENCLATURA REGULADA V8.1
   ========================================================================== */

if (!window.AppState) window.AppState = {};
if (!window.AppState.documentos) window.AppState.documentos = JSON.parse(localStorage.getItem('agenda_documentos')) || [];

document.addEventListener('DOMContentLoaded', () => {
  actualizarSelectCotizacionesEnObra(); // Alertas cruzadas
  actualizarSelectsEnDocumentos();
  renderDocumentos();
});

function abrirModalDocumento() {
  document.getElementById('form-documentos').reset();
  actualizarSelectsEnDocumentos();
  evaluarCamposIncapacidad();
  calcularNomenclaturaEstricta();
  openModal('modal-nuevo-doc');
}

function actualizarSelectsEnDocumentos() {
  const el = document.getElementById('doc-cita-vinculo');
  if(!el) return;
  
  if(!window.AppState.citas || window.AppState.citas.length === 0) {
    el.innerHTML = `<option value="NINGUNA">No hay citas en el sistema (Carga independiente)</option>`;
    return;
  }
  
  el.innerHTML = window.AppState.citas.map(c => `
    <option value="${c.id}" data-fecha="${c.fecha}" data-esp="${c.especialidad}" data-ins="${c.institucion}">
      ${c.fecha} - ${c.paciente} (${c.especialidad} en ${c.institucion})
    </option>
  `).join('');
}

function evaluarCamposIncapacidad() {
  const tipo = document.getElementById('doc-tipo').value;
  const bloque = document.getElementById('bloque-fechas-incapacidad');
  if(tipo === 'CI') bloque.style.display = 'block'; else bloque.style.display = 'none';
}

function limpiarCadenaNomenclatura(str) {
  if(!str) return 'SinEspecificar';
  // Quitar acentos, eñes y caracteres especiales, uniendo todo en formato CamelCase limpio
  return str.normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9]/g, "");
}

function calcularNomenclaturaEstricta() {
  const selectCita = document.getElementById('doc-cita-vinculo');
  const tipo = document.getElementById('doc-tipo').value;
  const divPrevisualizacion = document.getElementById('previsualizacion-nombre');

  if(!selectCita || selectCita.value === 'NINGUNA') {
    divPrevisualizacion.textContent = "POR_DEFINIR_DOCUMENTO.pdf";
    return;
  }

  const opcionSeleccionada = selectCita.options[selectCita.selectedIndex];
  const fechaCitaRaw = opcionSeleccionada.getAttribute('data-fecha') || ''; // Formato AAAA-MM-DD
  const fechaLimpia = fechaCitaRaw.replace(/-/g, ''); // Formato AAAAMMDD
  
  const especialidadLimpia = limpiarCadenaNomenclatura(opcionSeleccionada.getAttribute('data-esp'));
  const institucionLimpia = limpiarCadenaNomenclatura(opcionSeleccionada.getAttribute('data-ins'));

  let nombreFinal = '';

  if (tipo === 'CI') {
    // Regla estricta de Incapacidad: AAAAMMDD_CI_AAAAMMDD_a_AAAAMMDD_Institucion.pdf
    const fInicio = (document.getElementById('inc-fecha-inicio').value || fechaCitaRaw).replace(/-/g, '');
    const fFin = (document.getElementById('inc-fecha-fin').value || fechaCitaRaw).replace(/-/g, '');
    nombreFinal = `${fechaLimpia}_CI_${fInicio}_a_${fFin}_${institucionLimpia}.pdf`;
  } else {
    // Regla general para HC, OS, RS, FM, ML: AAAAMMDD_TIPO_Especialidad_Institucion.pdf
    nombreFinal = `${fechaLimpia}_${tipo}_${especialidadLimpia}_${institucionLimpia}.pdf`;
  }

  divPrevisualizacion.textContent = nombreFinal;
  return nombreFinal;
}

function ejecutarSubirDocumentoReal() {
  const nombreDefinitivo = calcularNomenclaturaEstricta();
  const fileInput = document.getElementById('doc-archivo');

  if(!fileInput.files[0]) {
    alert('Por favor selecciona un archivo PDF real.'); return;
  }

  const nuevoDoc = {
    id: 'doc_' + Date.now(),
    nombreArchivo: nombreDefinitivo,
    fechaCarga: new Date().toLocaleDateString(),
    tamano: (fileInput.files[0].size / 1024).toFixed(1) + ' KB'
  };

  window.AppState.documentos.push(nuevoDoc);
  localStorage.setItem('agenda_documentos', JSON.stringify(window.AppState.documentos));
  
  document.getElementById('form-documentos').reset();
  closeModal('modal-nuevo-doc');
  renderDocumentos();
  showToast(`Subido y renombrado estrictamente a: ${nombreDefinitivo}`);
}

function renderDocumentos() {
  const container = document.getElementById('documentos-container');
  if(!container) return;

  if (window.AppState.documentos.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text3);">No hay documentos digitalizados en el repositorio.</div>`;
    return;
  }

  container.innerHTML = `<div class="card">
    <div style="font-weight:700; margin-bottom:10px; font-family:'Fraunces',serif;">📂 Expedientes en Nube (Nomenclatura Estricta)</div>
    ${window.AppState.documentos.map(d => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border); font-size:12.5px;">
        <div>
          <span style="font-family:monospace; font-weight:700; color:var(--blue); word-break:break-all;">📄 ${d.nombreArchivo}</span>
          <div style="font-size:11px; color:var(--text3)">Cargado el: ${d.fechaCarga} · Peso: ${d.tamano}</div>
        </div>
        <button class="btn btn-ghost btn-sm" style="color:var(--red);" onclick="eliminarDocumentoReal('${d.id}')">🗑️</button>
      </div>
    `).join('')}
  </div>`;
}

function eliminarDocumentoReal(id) {
  window.AppState.documentos = window.AppState.documentos.filter(d => d.id !== id);
  localStorage.setItem('agenda_documentos', JSON.stringify(window.AppState.documentos));
  renderDocumentos();
}

// Publicar funciones al scope global para los selectores reactivos del HTML
window.abrirModalDocumento = abrirModalDocumento;
window.calcularNomenclaturaEstricta = calcularNomenclaturaEstricta;
window.evaluarCamposIncapacidad = evaluarCamposIncapacidad;
window.actualizarSelectsEnDocumentos = actualizarSelectsEnDocumentos;
