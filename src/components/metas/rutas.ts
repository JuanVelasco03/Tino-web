/** Rutas de `/metas`. El detalle y los paneles van por parámetro (sin ruta dinámica). */
export const RUTA_METAS = "/metas";
export const RUTA_ARCHIVADAS = "/metas/archivadas";

/** `?meta=<id>`; en archivadas, `/metas/archivadas?meta=<id>`. */
export function rutaMeta(id: string, archivada = false): string {
  return `${archivada ? RUTA_ARCHIVADAS : RUTA_METAS}?meta=${encodeURIComponent(id)}`;
}

/** `?nueva=1`, conservando la meta abierta para volver a ella al cerrar. */
export function rutaNueva(meta?: string | null): string {
  return meta ? `${rutaMeta(meta)}&nueva=1` : `${RUTA_METAS}?nueva=1`;
}

/** `?meta=<id>&editar=1`. */
export function rutaEditar(id: string): string {
  return `${rutaMeta(id)}&editar=1`;
}

/** `?meta=<id>&registrar=aporte|retiro`. */
export function rutaRegistrar(id: string, tipo: "aporte" | "retiro"): string {
  return `${rutaMeta(id)}&registrar=${tipo}`;
}

/** `?meta=<id>&aporte=<aporteId>`: editar o borrar un aporte o retiro. */
export function rutaAporte(id: string, aporteId: string): string {
  return `${rutaMeta(id)}&aporte=${encodeURIComponent(aporteId)}`;
}

/** Todas las rutas que una acción de metas revalida. */
export const RUTAS_METAS = [RUTA_METAS, RUTA_ARCHIVADAS] as const;
