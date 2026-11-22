"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import * as movimientos from "@/services/movimientos";
import * as recurrentes from "@/services/recurrentes";
import type {
  Periodicidad,
  RecurrenteCuerpo,
  ResultadoConfirmacion,
  ResultadoPausa,
  ResultadoRecurrente,
} from "@/services/recurrentes";
import { esId, esTipo, RUTAS_AFECTADAS } from "../captura/entrada";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const MONTO = /^\d{1,19}$/;
const PERIODICIDADES: readonly Periodicidad[] = ["semanal", "quincenal", "mensual", "bimestral", "trimestral", "anual"];

const ENTRADA_INVALIDA = {
  ok: false,
  codigo: "ENTRADA_INVALIDA",
  mensaje: "No pudimos procesar los datos. Intenta de nuevo.",
} as const;

/** Las plantillas y sus ocurrencias solo se ven en /recurrentes. */
const SOLO_RECURRENTES = ["/recurrentes"] as const;

/** Confirmar o deshacer una confirmación crea o borra un movimiento: cambia también el libro, los saldos y el resumen. */
const CON_MOVIMIENTO = RUTAS_AFECTADAS;

function esFecha(valor: unknown): valor is string {
  return typeof valor === "string" && FECHA.test(valor);
}

function esIdOpcional(valor: unknown): valor is string | null | undefined {
  return valor === undefined || valor === null || esId(valor);
}

function revalidar(rutas: readonly string[]) {
  for (const ruta of rutas) revalidatePath(ruta);
}

/** Traduce el error de la API. Las redirecciones de Next (sesión vencida) se relanzan. */
function fallo(error: unknown) {
  unstable_rethrow(error);
  return recurrentes.falloDeError(error);
}

/** Valida la forma del cuerpo (viene del navegador) y copia solo los campos conocidos. El contenido lo valida la API. */
function cuerpoValido(entrada: unknown): RecurrenteCuerpo | null {
  if (!entrada || typeof entrada !== "object") return null;
  const e = entrada as Record<string, unknown>;
  if (!esTipo(e.tipo) || typeof e.concepto !== "string") return null;
  if (typeof e.monto !== "string" || !MONTO.test(e.monto) || typeof e.variable !== "boolean") return null;
  if (typeof e.periodicidad !== "string" || !(PERIODICIDADES as readonly string[]).includes(e.periodicidad)) return null;
  if (!esFecha(e.primerVencimiento)) return null;
  if (e.ultimoDia !== undefined && typeof e.ultimoDia !== "boolean") return null;
  if (!esIdOpcional(e.cuentaOrigenId) || !esIdOpcional(e.cuentaDestinoId) || !esIdOpcional(e.categoriaId)) return null;

  const cuerpo: RecurrenteCuerpo = {
    tipo: e.tipo,
    concepto: e.concepto,
    monto: e.monto,
    variable: e.variable,
    periodicidad: e.periodicidad as Periodicidad,
    primerVencimiento: e.primerVencimiento,
  };
  if (e.ultimoDia !== undefined) cuerpo.ultimoDia = e.ultimoDia;
  if (e.cuentaOrigenId !== undefined) cuerpo.cuentaOrigenId = e.cuentaOrigenId;
  if (e.cuentaDestinoId !== undefined) cuerpo.cuentaDestinoId = e.cuentaDestinoId;
  if (e.categoriaId !== undefined) cuerpo.categoriaId = e.categoriaId;
  return cuerpo;
}

/** Llama a la API y traduce el resultado; revalida `rutas` en éxito. */
async function ejecutar(llamada: () => Promise<unknown>, rutas: readonly string[]): Promise<ResultadoRecurrente> {
  try {
    await llamada();
  } catch (error) {
    return fallo(error);
  }
  revalidar(rutas);
  return { ok: true };
}

/* ── Bandeja ──────────────────────────────────────────────────────────── */

/** `POST /recurrentes/:id/confirmar`. Sin `monto`, el importe mostrado; con él, el ajustado. */
export async function confirmarOcurrencia(id: string, vencimiento: string, monto?: string): Promise<ResultadoConfirmacion> {
  if (!esId(id) || !esFecha(vencimiento)) return ENTRADA_INVALIDA;
  if (monto !== undefined && (typeof monto !== "string" || !MONTO.test(monto))) return ENTRADA_INVALIDA;

  let movimiento: recurrentes.Movimiento;
  try {
    movimiento = await recurrentes.confirmar(id, vencimiento, monto);
  } catch (error) {
    const { codigo, mensaje } = fallo(error);
    return { ok: false, codigo, mensaje };
  }
  revalidar(CON_MOVIMIENTO);
  return { ok: true, movimiento };
}

/** `POST /recurrentes/:id/omitir`. Sale de la bandeja y del comprometido. */
export async function omitirOcurrencia(id: string, vencimiento: string): Promise<ResultadoRecurrente> {
  if (!esId(id) || !esFecha(vencimiento)) return ENTRADA_INVALIDA;
  return ejecutar(() => recurrentes.omitir(id, vencimiento), SOLO_RECURRENTES);
}

/** «Deshacer» una confirmación: `DELETE /movimientos/:id` con el `id` que devolvió `confirmar`. */
export async function deshacerConfirmacion(movimientoId: string): Promise<ResultadoRecurrente> {
  if (!esId(movimientoId)) return ENTRADA_INVALIDA;
  return ejecutar(() => movimientos.eliminar(movimientoId), CON_MOVIMIENTO);
}

/** «Deshacer» una omisión: `DELETE /recurrentes/:id/omisiones/:vencimiento`. */
export async function deshacerOmision(id: string, vencimiento: string): Promise<ResultadoRecurrente> {
  if (!esId(id) || !esFecha(vencimiento)) return ENTRADA_INVALIDA;
  return ejecutar(() => recurrentes.deshacerOmision(id, vencimiento), SOLO_RECURRENTES);
}

/* ── Plantillas ───────────────────────────────────────────────────────── */

/** `POST /recurrentes` con el cuerpo que armó el dominio. */
export async function crearPlantilla(entrada: RecurrenteCuerpo): Promise<ResultadoRecurrente> {
  const cuerpo = cuerpoValido(entrada);
  if (!cuerpo) return ENTRADA_INVALIDA;
  return ejecutar(() => recurrentes.crear(cuerpo), SOLO_RECURRENTES);
}

/** `PUT /recurrentes/:id`: reemplazo completo. */
export async function editarPlantilla(id: string, entrada: RecurrenteCuerpo): Promise<ResultadoRecurrente> {
  const cuerpo = cuerpoValido(entrada);
  if (!esId(id) || !cuerpo) return ENTRADA_INVALIDA;
  return ejecutar(() => recurrentes.editar(id, cuerpo), SOLO_RECURRENTES);
}

/** `PATCH /recurrentes/:id { pausada }`. Devuelve la plantilla con su estado nuevo. */
export async function pausarPlantilla(id: string, pausada: boolean): Promise<ResultadoPausa> {
  if (!esId(id) || typeof pausada !== "boolean") return ENTRADA_INVALIDA;
  let recurrente: recurrentes.Recurrente;
  try {
    recurrente = await recurrentes.pausar(id, pausada);
  } catch (error) {
    const { codigo, mensaje } = fallo(error);
    return { ok: false, codigo, mensaje };
  }
  revalidar(SOLO_RECURRENTES);
  return { ok: true, recurrente };
}

/** `DELETE /recurrentes/:id`. La confirmación ya la pidió el panel. */
export async function eliminarPlantilla(id: string): Promise<ResultadoRecurrente> {
  if (!esId(id)) return ENTRADA_INVALIDA;
  return ejecutar(() => recurrentes.eliminar(id), SOLO_RECURRENTES);
}
