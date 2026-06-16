// Esqueleto de cliente Socket.io — se implementa en Fase 2
// DECISION: exportamos un objeto stub para que las islas React que lo importen en Fase 1 no rompan.

export const socket = {
  on: () => {},
  off: () => {},
  emit: () => {},
  connected: false,
};

export default socket;
