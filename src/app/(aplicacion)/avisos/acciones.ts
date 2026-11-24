"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import * as avisos from "@/services/avisos";
import type { ConfigCuerpo, ResultadoAviso, ResultadoConfig, TipoAviso } from "@/services/avisos";
import * as recurrentes from "@/services/recurrentes";
import { esId, RUTA_DETALLE_CUENTA, RUTAS_AFECTADAS } from "../captura/entrada";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const MONTO = /^\d{1,19}$/;
/** `<tipo>:<id de la fuente>:<YYYY-MM-DD>`. La API valida que sea de un aviso visible. */
const CLAVE = /^(recurrente|cobro|deuda|precio_manual):[A-Za-z0-9-]{1,64}:\d{4}-\d{2}-\d{2}$/;
const TIPOS: readonly TipoAviso[] = ["recurrente", "cobro", "deuda", "precio_manual"];

const ENTRADA_INVALIDA = {
  ok: false,
  codigo: "ENTRADA_INVALIDA",
  mensaje: "No pudimos procesar los datos. Intenta de nuevo.",
} as const;

/** Marcas y antelación solo cambian la pantalla de avisos (y el contador del layout, que viaja con ella). */
const SOLO_AVISOS = ["/avisos"] as const;

/** Confirmar crea un movimiento: cambia también el libro, los saldos, el resumen, los recurrentes y los avisos. */
const CON_MOVIMIENTO = RUTAS_AFECTADAS;

/** Lo que refresca `/cuentas` refresca también el detalle de cada cuenta (SPEC 13). */
function revalidar(rutas: readonly string[]) {
  for (const ruta of rutas) revalidatePath(ruta);
  if (rutas.includes("/cuentas")) revalidatePath(RUTA_DETALLE_CUENTA, "page");
}

function esTipo(valor: unknown): valor is TipoAviso {
  return typeof valor === "string" && (TIPOS as readonly string[]).includes(valor);
}

/** Valida la forma del cambio (viene del navegador) y copia solo los campos conocidos. Las opciones las valida la API. */
function cambioValido(entrada: unknown): ConfigCuerpo | null {
  if (!entrada || typeof entrada !== "object") return null;
  const { activo, dias } = entrada as Record<string, unknown>;
  if (activo !== undefined && typeof activo !== "boolean") return null;
  if (dias !== undefined && (typeof dias !== "number" || !Number.isInteger(dias) || dias < 0)) return null;
  if (activo === undefined && dias === undefined) return null;
  const cambio: ConfigCuerpo = {};
  if (activo !== undefined) cambio.activo = activo;
  if (dias !== undefined) cambio.dias = dias;
  return cambio;
}

/** `PATCH /avisos/:clave { leido }`: el valor final de la fila, no «alternar». */
export async function marcar(clave: string, leido: boolean): Promise<ResultadoAviso> {
  if (typeof clave !== "string" || !CLAVE.test(clave) || typeof leido !== "boolean") return ENTRADA_INVALIDA;
  const resultado = await avisos.marcar(clave, leido);
  if (resultado.ok) revalidar(SOLO_AVISOS);
  return resultado;
}

/** `POST /avisos/leer-todos`. */
export async function leerTodos(): Promise<ResultadoAviso> {
  const resultado = await avisos.leerTodos();
  if (resultado.ok) revalidar(SOLO_AVISOS);
  return resultado;
}

/** `PATCH /avisos/config/:tipo` con `{ activo }` (casilla) o `{ dias }` (opción). */
export async function configurar(tipo: TipoAviso, entrada: ConfigCuerpo): Promise<ResultadoConfig> {
  const cambio = cambioValido(entrada);
  if (!esTipo(tipo) || !cambio) return ENTRADA_INVALIDA;
  const resultado = await avisos.configurar(tipo, cambio);
  if (resultado.ok) revalidar(SOLO_AVISOS);
  return resultado;
}

/**
 * «Confirmar» o «Ajustar» desde un aviso: `POST /recurrentes/:id/confirmar`
 * con `{ vencimiento }` o `{ vencimiento, monto }`. Sin «Deshacer»: el
 * movimiento se corrige en /movimientos.
 */
export async function confirmar(recurrenteId: string, vencimiento: string, monto?: string): Promise<ResultadoAviso> {
  if (!esId(recurrenteId) || typeof vencimiento !== "string" || !FECHA.test(vencimiento)) return ENTRADA_INVALIDA;
  if (monto !== undefined && (typeof monto !== "string" || !MONTO.test(monto))) return ENTRADA_INVALIDA;
  try {
    await recurrentes.confirmar(recurrenteId, vencimiento, monto);
  } catch (error) {
    // La sesión vencida redirige; cualquier otro error vuelve como fallo.
    unstable_rethrow(error);
    const { codigo, mensaje } = recurrentes.falloDeError(error);
    return { ok: false, codigo, mensaje };
  }
  revalidar(CON_MOVIMIENTO);
  return { ok: true };
}
