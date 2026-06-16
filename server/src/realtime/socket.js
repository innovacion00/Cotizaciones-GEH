// Esqueleto de Socket.io — se implementa en Fase 2

let _io = null;

export function initSocket(_httpServer) {
  // DECISION: Socket.io se inicializa aquí en Fase 2.
  // En Fase 1 solo se exporta el helper emitTo para que los servicios puedan llamarlo sin errores.
  console.log('[Socket.io] Esqueleto inicializado (Fase 2 pendiente)');
  _io = null; // se asignará al inicializar socket.io real
  return _io;
}

export function emitTo(room, event, payload) {
  if (!_io) return; // no-op hasta Fase 2
  _io.to(room).emit(event, payload);
}
