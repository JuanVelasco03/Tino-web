import type { TipoMovimiento } from "./cuerpo";

/**
 * Gasto sin clasificar: la misma definición que usa la API para
 * `sinCategoria.cantidad` (docs/api/resumen.md): tipo `gasto`, sin categoría
 * y sin partes. Un ingreso sin categoría o una transferencia no cuentan.
 */
export function esSinClasificar(m: { tipo: TipoMovimiento; categoria: unknown; partes: readonly unknown[] }): boolean {
  return m.tipo === "gasto" && m.categoria === null && m.partes.length === 0;
}
