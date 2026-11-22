"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import * as inversiones from "@/services/inversiones";
import {
  CAMPOS_INVERSION,
  CAMPOS_OPERACION,
  CAMPOS_PRECIO,
  type Cotizacion,
  type InversionCuerpo,
  type OperacionCambio,
  type OperacionCuerpo,
  type PrecioCuerpo,
  type ResultadoBusqueda,
  type ResultadoInversion,
  type ResultadoOperacion,
  type ResultadoPrecio,
  type ResultadoSimple,
} from "@/services/inversiones";
import { esId } from "../captura/entrada";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const MONTO = /^\d{1,19}$/;
const CANTIDAD = /^\d{1,19}(\.\d{1,8})?$/;
const CLASES = ["inicial", "compra", "venta"] as const;

const ENTRADA_INVALIDA = {
  ok: false,
  codigo: "ENTRADA_INVALIDA",
  mensaje: "No pudimos procesar los datos. Intenta de nuevo.",
} as const;

/**
 * Toda acción de Inversiones cambia el detalle y la lista, el saldo de la
 * cuenta en Cuentas (valor de mercado) y el patrimonio del resumen.
 */
const RUTAS_INVERSIONES = ["/inversiones", "/cuentas", "/resumen"] as const;

function revalidar() {
  for (const ruta of RUTAS_INVERSIONES) revalidatePath(ruta);
}

/** Traduce el error de la API con el mapa de campos del formulario. Las redirecciones de Next se relanzan. */
function fallo<C extends string = never>(error: unknown, campos?: Record<string, C>) {
  unstable_rethrow(error);
  return inversiones.falloDeError<C>(error, campos);
}

function esTexto(valor: unknown, maximo: number): valor is string {
  return typeof valor === "string" && valor.length <= maximo;
}

function esFecha(valor: unknown): valor is string {
  return typeof valor === "string" && FECHA.test(valor);
}

function esMonto(valor: unknown): valor is string {
  return typeof valor === "string" && MONTO.test(valor);
}

function esCantidad(valor: unknown): valor is string {
  return typeof valor === "string" && CANTIDAD.test(valor);
}

/* Validan la forma del cuerpo (viene del navegador) y copian solo los campos conocidos. El contenido lo valida la API. */

function cuerpoInversion(entrada: unknown): InversionCuerpo | null {
  if (!entrada || typeof entrada !== "object") return null;
  const e = entrada as Record<string, unknown>;
  if (!esTexto(e.nombre, 200) || (e.moneda !== "COP" && e.moneda !== "USD")) return null;
  if (e.efectivoInicial !== undefined && !esMonto(e.efectivoInicial)) return null;
  // Sin `posiciones`: lo que ya se tenía se registra después con «Ya lo tenía».
  const cuerpo: InversionCuerpo = { nombre: e.nombre, moneda: e.moneda };
  if (e.efectivoInicial !== undefined) cuerpo.efectivoInicial = e.efectivoInicial;
  return cuerpo;
}

function cuerpoOperacion(entrada: unknown): OperacionCuerpo | null {
  if (!entrada || typeof entrada !== "object") return null;
  const e = entrada as Record<string, unknown>;
  if (typeof e.clase !== "string" || !(CLASES as readonly string[]).includes(e.clase)) return null;
  if (!esTexto(e.simbolo, 40) || !esCantidad(e.cantidad) || !esMonto(e.monto)) return null;
  if (e.nombre !== undefined && !esTexto(e.nombre, 200)) return null;
  if (e.fecha !== undefined && !esFecha(e.fecha)) return null;
  const cuerpo: OperacionCuerpo = { clase: e.clase as OperacionCuerpo["clase"], simbolo: e.simbolo, cantidad: e.cantidad, monto: e.monto };
  if (e.nombre !== undefined) cuerpo.nombre = e.nombre;
  if (e.fecha !== undefined) cuerpo.fecha = e.fecha;
  return cuerpo;
}

function cambioOperacion(entrada: unknown): OperacionCambio | null {
  if (!entrada || typeof entrada !== "object") return null;
  const e = entrada as Record<string, unknown>;
  const cambio: OperacionCambio = {};
  if (e.cantidad !== undefined) {
    if (!esCantidad(e.cantidad)) return null;
    cambio.cantidad = e.cantidad;
  }
  if (e.monto !== undefined) {
    if (!esMonto(e.monto)) return null;
    cambio.monto = e.monto;
  }
  if (e.fecha !== undefined) {
    if (!esFecha(e.fecha)) return null;
    cambio.fecha = e.fecha;
  }
  return Object.keys(cambio).length === 0 ? null : cambio;
}

function cuerpoPrecio(entrada: unknown): PrecioCuerpo | null {
  if (!entrada || typeof entrada !== "object") return null;
  const { precio } = entrada as Record<string, unknown>;
  return esMonto(precio) ? { precio } : null;
}

/* ── Alta ─────────────────────────────────────────────────────────────── */

/** `POST /inversiones` sin posiciones. Devuelve su `id` para abrir el detalle. */
export async function crearInversion(entrada: InversionCuerpo): Promise<ResultadoInversion> {
  const cuerpo = cuerpoInversion(entrada);
  if (!cuerpo) return ENTRADA_INVALIDA;
  let id: string;
  try {
    id = (await inversiones.crear(cuerpo)).id;
  } catch (error) {
    return fallo(error, CAMPOS_INVERSION);
  }
  revalidar();
  return { ok: true, id };
}

/* ── Operaciones ──────────────────────────────────────────────────────── */

/** `GET …/activos/buscar`: gasta un crédito del proveedor; el panel la llama una vez por símbolo. */
export async function buscarActivo(id: string, simbolo: string): Promise<ResultadoBusqueda> {
  if (!esId(id) || !esTexto(simbolo, 40)) return ENTRADA_INVALIDA;
  try {
    return { ok: true, busqueda: await inversiones.buscarActivo(id, simbolo) };
  } catch (error) {
    return fallo(error);
  }
}

/** `POST /inversiones/:id/operaciones`: compra, venta o «Ya lo tenía». */
export async function registrarOperacion(id: string, entrada: OperacionCuerpo): Promise<ResultadoOperacion> {
  const cuerpo = cuerpoOperacion(entrada);
  if (!esId(id) || !cuerpo) return ENTRADA_INVALIDA;
  try {
    await inversiones.registrarOperacion(id, cuerpo);
  } catch (error) {
    return fallo(error, CAMPOS_OPERACION);
  }
  revalidar();
  return { ok: true };
}

/** `PUT …/operaciones/:operacionId` con solo lo que cambió. */
export async function editarOperacion(id: string, operacionId: string, entrada: OperacionCambio): Promise<ResultadoOperacion> {
  const cambio = cambioOperacion(entrada);
  if (!esId(id) || !esId(operacionId) || !cambio) return ENTRADA_INVALIDA;
  try {
    await inversiones.editarOperacion(id, operacionId, cambio);
  } catch (error) {
    return fallo(error, CAMPOS_OPERACION);
  }
  revalidar();
  return { ok: true };
}

/** `DELETE …/operaciones/:operacionId`. La confirmación la pidió el panel. */
export async function eliminarOperacion(id: string, operacionId: string): Promise<ResultadoSimple> {
  if (!esId(id) || !esId(operacionId)) return ENTRADA_INVALIDA;
  try {
    await inversiones.eliminarOperacion(id, operacionId);
  } catch (error) {
    return fallo(error);
  }
  revalidar();
  return { ok: true };
}

/* ── Precio y cotización ──────────────────────────────────────────────── */

/** `POST …/activos/:activoId/precios`: precio manual con la fecha de hoy. */
export async function guardarPrecio(id: string, activoId: string, entrada: PrecioCuerpo): Promise<ResultadoPrecio> {
  const cuerpo = cuerpoPrecio(entrada);
  if (!esId(id) || !esId(activoId) || !cuerpo) return ENTRADA_INVALIDA;
  try {
    await inversiones.guardarPrecio(id, activoId, cuerpo);
  } catch (error) {
    return fallo(error, CAMPOS_PRECIO);
  }
  revalidar();
  return { ok: true };
}

/** `PATCH …/activos/:activoId`: pasar a cotización automática o manual. */
export async function cambiarCotizacion(id: string, activoId: string, cotizacion: Cotizacion): Promise<ResultadoSimple> {
  if (!esId(id) || !esId(activoId) || (cotizacion !== "automatica" && cotizacion !== "manual")) return ENTRADA_INVALIDA;
  try {
    await inversiones.cambiarCotizacion(id, activoId, cotizacion);
  } catch (error) {
    return fallo(error);
  }
  revalidar();
  return { ok: true };
}
