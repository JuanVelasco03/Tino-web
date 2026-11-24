"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import * as detalle from "@/services/detalle-cuenta";
import type { ResultadoAjuste, ResultadoCompra, ResultadoSimple } from "@/services/detalle-cuenta";
import { esId, revalidarAfectadas } from "../../captura/entrada";

const MONTO = /^\d{1,19}$/;
const ENTRADA_INVALIDA = { ok: false, codigo: "ENTRADA_INVALIDA", mensaje: "No pudimos procesar los datos. Intenta de nuevo." } as const;
const MENSAJE_CONSULTA = "No pudimos consultar. Intenta de nuevo.";

/** Detalle de una cuenta (`/cuentas/<id>`, SPEC 13). */
const RUTAS_CUENTA = (id: string) => [`/cuentas/${id}`];

/**
 * Concilia o desconcilia movimientos de la cuenta (uno o en lote). La
 * selección puede pasar del tope de la API: el servicio parte en lotes de
 * 500. Revalida el detalle: saldo conciliado y pendientes salen de la API.
 */
export async function conciliarMovimientos(id: string, movimientoIds: string[], conciliado: boolean): Promise<ResultadoSimple> {
  if (!esId(id) || typeof conciliado !== "boolean" || !Array.isArray(movimientoIds) || movimientoIds.length === 0) return ENTRADA_INVALIDA;
  if (!movimientoIds.every(esId) || new Set(movimientoIds).size !== movimientoIds.length) return ENTRADA_INVALIDA;
  try {
    await detalle.conciliar(id, movimientoIds, conciliado);
  } catch (error) {
    unstable_rethrow(error);
    const { codigo, mensaje } = detalle.falloDe(error);
    for (const ruta of RUTAS_CUENTA(id)) revalidatePath(ruta);
    return { ok: false, codigo, mensaje };
  }
  for (const ruta of RUTAS_CUENTA(id)) revalidatePath(ruta);
  return { ok: true };
}

/**
 * `POST /cuentas/:id/ajustes` con el saldo contado. Un ajuste cambia saldos,
 * el libro y el resumen: revalida el detalle, `/cuentas` y lo que cambia un
 * movimiento.
 */
export async function registrarAjuste(id: string, saldoReal: string, conciliarHastaHoy: boolean): Promise<ResultadoAjuste> {
  if (!esId(id) || typeof conciliarHastaHoy !== "boolean") return ENTRADA_INVALIDA;
  if (typeof saldoReal !== "string" || !MONTO.test(saldoReal)) {
    return { ok: false, codigo: "MONTO_INVALIDO", mensaje: "Escribe un valor en pesos, sin decimales.", campo: "saldoReal" };
  }
  try {
    await detalle.registrarAjuste(id, saldoReal, conciliarHastaHoy);
  } catch (error) {
    unstable_rethrow(error);
    const fallo = detalle.falloDe(error);
    return fallo.campo === "saldoReal"
      ? { ok: false, codigo: fallo.codigo, mensaje: fallo.mensaje, campo: "saldoReal" }
      : { ok: false, codigo: fallo.codigo, mensaje: fallo.mensaje };
  }
  for (const ruta of RUTAS_CUENTA(id)) revalidatePath(ruta);
  revalidarAfectadas();
  return { ok: true };
}

/**
 * «¿Puedo comprar esto?»: `GET /cuentas/:id/ciclo?compra=`. No cambia nada
 * ni revalida. El monto llega como string entero > 0.
 */
export async function consultarCompra(id: string, monto: string): Promise<ResultadoCompra> {
  if (!esId(id) || typeof monto !== "string" || !MONTO.test(monto) || /^0+$/.test(monto)) return ENTRADA_INVALIDA;
  try {
    const { compra } = await detalle.obtenerCiclo(id, monto);
    return { ok: true, compra };
  } catch (error) {
    unstable_rethrow(error);
    const { codigo, mensaje } = detalle.falloDe(error, MENSAJE_CONSULTA);
    return { ok: false, codigo, mensaje };
  }
}
