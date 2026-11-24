"use server";

import * as movimientos from "@/services/movimientos";
import type { MovimientoCuerpo, ResultadoGuardado, ResultadoSimple } from "@/services/movimientos";
import { cuerpoValido, ENTRADA_INVALIDA, esId, fallo, revalidarAfectadas } from "../captura/entrada";

/**
 * `PUT /movimientos/:id` con el cuerpo completo (`fecha` obligatoria).
 * Revalida la lista y los saldos. Admite `tipo: "ajuste"` (editar un ajuste, SPEC 13).
 */
export async function guardarMovimiento(id: string, entrada: MovimientoCuerpo): Promise<ResultadoGuardado> {
  const cuerpo = cuerpoValido(entrada, true);
  if (!esId(id) || !cuerpo || cuerpo.fecha === undefined) return ENTRADA_INVALIDA;

  let movimiento: movimientos.Movimiento;
  try {
    movimiento = await movimientos.editar(id, cuerpo);
  } catch (error) {
    return fallo(error, cuerpo.tipo);
  }
  revalidarAfectadas();
  return { ok: true, movimiento };
}

/** `DELETE /movimientos/:id` (N-18). La confirmación la pidió el cliente. */
export async function eliminarMovimiento(id: string): Promise<ResultadoSimple> {
  if (!esId(id)) return ENTRADA_INVALIDA;
  try {
    await movimientos.eliminar(id);
  } catch (error) {
    const { codigo, mensaje } = fallo(error);
    return { ok: false, codigo, mensaje };
  }
  revalidarAfectadas();
  return { ok: true };
}
