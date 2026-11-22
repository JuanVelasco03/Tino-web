/** Rutas de `/inversiones`. El detalle, los paneles y el bloque de precio van por parámetro (sin ruta dinámica). */
export const RUTA_INVERSIONES = "/inversiones";

/** `?inversion=<id>`; con `precio`, `&precio=<activoId>`; con `operacion`, `&operacion=nueva|<id>`. */
export function rutaInversion(id: string, extra: { precio?: string; operacion?: string } = {}): string {
  let ruta = `${RUTA_INVERSIONES}?inversion=${encodeURIComponent(id)}`;
  if (extra.precio) ruta += `&precio=${encodeURIComponent(extra.precio)}`;
  if (extra.operacion) ruta += `&operacion=${encodeURIComponent(extra.operacion)}`;
  return ruta;
}

/** `?nueva=1`, conservando la inversión abierta para volver a ella al cerrar. */
export function rutaNueva(inversion?: string | null): string {
  return inversion ? `${rutaInversion(inversion)}&nueva=1` : `${RUTA_INVERSIONES}?nueva=1`;
}
