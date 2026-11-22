/**
 * Escala de la barra del comprometido del mes. Es presentación, como la
 * escala de la gráfica del patrimonio: los montos se dividen en `bigint` y
 * solo los anchos (0–100) salen como `number`. Ninguna cifra mostrada sale
 * de aquí: total y grupos los da la API.
 */

/** Porcentaje entero de `parte` sobre `total`, por debajo (división entera), entre 0 y 100. */
function ancho(parte: bigint, total: bigint): number {
  if (parte <= 0n) return 0;
  const porcentaje = (parte * 100n) / total;
  return Number(porcentaje > 100n ? 100n : porcentaje);
}

/**
 * Anchos de pagado y por confirmar. Programado ocupa el resto de la barra, así
 * que el redondeo por debajo nunca pasa de 100. Total 0 → `{ 0, 0 }`.
 */
export function anchosComprometido(c: { total: bigint; pagado: bigint; porConfirmar: bigint }): {
  pagado: number;
  porConfirmar: number;
} {
  if (c.total <= 0n) return { pagado: 0, porConfirmar: 0 };
  const pagado = ancho(c.pagado, c.total);
  return { pagado, porConfirmar: Math.min(ancho(c.porConfirmar, c.total), 100 - pagado) };
}
