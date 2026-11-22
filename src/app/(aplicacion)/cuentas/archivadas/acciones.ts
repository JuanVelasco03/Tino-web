"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import * as cuentas from "@/services/cuentas";
import type { ResultadoCuenta } from "@/services/cuentas";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ENTRADA_INVALIDA: ResultadoCuenta = {
  ok: false,
  codigo: "ENTRADA_INVALIDA",
  mensaje: "No pudimos procesar los datos. Intenta de nuevo.",
};

/** Llama a la API, traduce el error y revalida las dos listas, el resumen y los recurrentes en éxito. */
async function ejecutar(llamada: () => Promise<unknown>): Promise<ResultadoCuenta> {
  try {
    await llamada();
  } catch (error) {
    unstable_rethrow(error);
    return cuentas.resultadoDeError(error);
  }
  revalidatePath("/cuentas");
  revalidatePath("/cuentas/archivadas");
  revalidatePath("/resumen");
  revalidatePath("/recurrentes");
  return { ok: true };
}

/**
 * `POST /cuentas/:id/restaurar`. Sin `nombre`, sin cuerpo; si la API responde
 * `NOMBRE_DUPLICADO`, la fila pide otro y se reintenta con él.
 */
export async function restaurarCuenta(id: string, nombre?: string): Promise<ResultadoCuenta> {
  if (typeof id !== "string" || !UUID.test(id)) return ENTRADA_INVALIDA;
  if (nombre !== undefined && typeof nombre !== "string") return ENTRADA_INVALIDA;
  return ejecutar(() => cuentas.restaurarCuenta(id, nombre));
}

/** `DELETE /cuentas/:id` sobre una archivada. La confirmación ya la pidió la fila. */
export async function eliminarArchivada(id: string): Promise<ResultadoCuenta> {
  if (typeof id !== "string" || !UUID.test(id)) return ENTRADA_INVALIDA;
  return ejecutar(() => cuentas.eliminarCuenta(id));
}
