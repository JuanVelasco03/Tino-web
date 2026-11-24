/** Rutas del detalle de una cuenta (SPEC 13). */

/** `/cuentas/<id>` con su consulta (solo los valores definidos). */
export function rutaCuenta(id: string, consulta: Record<string, string | undefined> = {}): string {
  const parametros = new URLSearchParams();
  for (const [clave, valor] of Object.entries(consulta)) if (valor !== undefined && valor !== "") parametros.set(clave, valor);
  const texto = parametros.toString();
  return `/cuentas/${encodeURIComponent(id)}${texto ? `?${texto}` : ""}`;
}

/** Enlace de una fila de cuenta: la inversión a `/inversiones`; las demás a su detalle. */
export function enlaceCuenta(cuenta: { id: string; tipo: string }): string {
  return cuenta.tipo === "inversion" ? `/inversiones?inversion=${encodeURIComponent(cuenta.id)}` : rutaCuenta(cuenta.id);
}
