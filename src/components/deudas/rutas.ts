import type { TipoPrestamo } from "@/domain/prestamo/tipos";

/** Rutas de `/deudas`. El detalle, los paneles y el alta van por parámetro (sin ruta dinámica). */
export const RUTA_DEUDAS = "/deudas";

/** `?prestamo=<id>`; con `panel`, además `&abono=1` o `&editar=1`. */
export function rutaPrestamo(id: string, panel?: "abono" | "editar"): string {
  const base = `${RUTA_DEUDAS}?prestamo=${encodeURIComponent(id)}`;
  return panel ? `${base}&${panel}=1` : base;
}

/** `?nuevo=<tipo>`, conservando la persona abierta para volver a ella al cerrar. */
export function rutaNuevo(tipo: TipoPrestamo, prestamo?: string | null): string {
  return prestamo ? `${rutaPrestamo(prestamo)}&nuevo=${tipo}` : `${RUTA_DEUDAS}?nuevo=${tipo}`;
}

