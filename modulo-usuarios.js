let usuariosDelSistema = [];
function registrarNuevoUsuario(nombre, cc, telefono, correo, relacion, emoji) {
 const u = { id: Date.now(), nombre, cc, telefono, correo, relacion, emoji };
 usuariosDelSistema.push(u);
 sincronizarConSheets('Usuarios', [u.id, nombre, cc, telefono, correo, relacion, emoji]);
 alert('Usuario guardado exitosamente');
 return u;
}