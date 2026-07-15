// Fuerza a que una carga se sienta intencional mostrando el spinner
// entre 1 y 1.5 segundos, incluso si la respuesta llega antes.
export async function withMinDelay(promise, min = 1000, max = 1500) {
  const target = min + Math.random() * (max - min);
  const start = Date.now();
  const result = await promise;
  const remaining = target - (Date.now() - start);
  if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
  return result;
}
