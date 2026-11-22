/**
 * Formularios de inversiones: alta de la cuenta, operación (alta y edición) y
 * precio manual. Valores tecleados (texto) → cuerpos del contrato. Sin
 * `number` para montos ni cantidades (REGLAS §6).
 */
import { aMenores, desdeMenores } from "../dinero/entrada";
import { aCantidad, formatearCantidadCorta } from "./cantidad";
import type {
  ClaseOperacion,
  InversionCuerpo,
  Moneda,
  Operacion,
  OperacionCambio,
  OperacionCuerpo,
  Posicion,
  PrecioCuerpo,
} from "./tipos";

/** Valores de los formularios, en texto como los tecleó el usuario. */
export type ValoresInversion = { nombre: string; moneda: Moneda; efectivoInicial: string };
export type ValoresOperacion = { clase: ClaseOperacion; simbolo: string; nombre: string; cantidad: string; total: string; fecha: string };
export type ValoresEdicionOperacion = { cantidad: string; total: string; fecha: string };

export type CampoInversion = "nombre" | "moneda" | "efectivoInicial";
export type CampoOperacion = "clase" | "simbolo" | "nombre" | "cantidad" | "total" | "fecha";

export const MAX_NOMBRE_INVERSION = 60;
export const MAX_NOMBRE_ACTIVO = 80;
export const MAX_SIMBOLO = 12;

/** Símbolo válido para buscarlo: `A-Z`, `0-9`, `.` o `-`, hasta 12 (`SIMBOLO_INVALIDO`). */
const SIMBOLO = /^[A-Z0-9.-]{1,12}$/;

export const MENSAJE_CANTIDAD = "Escribe una cantidad mayor que cero, con hasta 8 decimales.";

/** «Escribe un valor en dólares, con hasta dos decimales.» o «… en pesos, sin decimales.». */
export function mensajeMonto(moneda: Moneda): string {
  return moneda === "USD" ? "Escribe un valor en dólares, con hasta dos decimales." : "Escribe un valor en pesos, sin decimales.";
}

export const VALORES_INVERSION: ValoresInversion = { nombre: "", moneda: "USD", efectivoInicial: "" };

/** Cuerpo de `POST /inversiones` sin posiciones. Recorta el nombre; efectivo vacío → ausente; mal escrito → `null`. */
export function cuerpoInversion(v: ValoresInversion): InversionCuerpo | null {
  const cuerpo: InversionCuerpo = { nombre: v.nombre.trim(), moneda: v.moneda };
  if (v.efectivoInicial.trim() === "") return cuerpo;
  const efectivo = aMenores(v.efectivoInicial, v.moneda);
  if (efectivo === null) return null;
  cuerpo.efectivoInicial = efectivo;
  return cuerpo;
}

export function VALORES_OPERACION(fechaHoy: string): ValoresOperacion {
  return { clase: "compra", simbolo: "", nombre: "", cantidad: "", total: "", fecha: fechaHoy };
}

/** Recorta y pasa a mayúsculas, como la API. */
export function normalizarSimbolo(texto: string): string {
  return texto.trim().toUpperCase();
}

/** ¿Se puede buscar? Mismo formato que valida la API. */
export function simboloValido(simbolo: string): boolean {
  return SIMBOLO.test(simbolo);
}

/**
 * El activo de ese símbolo si ya está en la cuenta: en una posición abierta
 * o en la historia de operaciones (posiciones cerradas incluidas). `null` si
 * es nuevo.
 */
export function activoEnCuenta(
  simbolo: string,
  posiciones: readonly Pick<Posicion, "activoId" | "simbolo" | "nombre">[],
  operaciones: readonly Pick<Operacion, "activo">[],
): { id: string; nombre: string } | null {
  const buscado = normalizarSimbolo(simbolo);
  if (buscado === "") return null;
  const abierta = posiciones.find((p) => p.simbolo === buscado);
  if (abierta) return { id: abierta.activoId, nombre: abierta.nombre };
  const historica = operaciones.find((o) => o.activo.simbolo === buscado);
  return historica ? { id: historica.activo.id, nombre: historica.activo.nombre } : null;
}

/** Total tecleado como string entero > 0 en su moneda, o `null`. */
function totalValido(texto: string, moneda: Moneda): string | null {
  const monto = aMenores(texto, moneda);
  return monto === null || monto === "0" ? null : monto;
}

/**
 * Cuerpo de `POST /inversiones/:id/operaciones`. `nombre` solo si el activo es
 * nuevo y no está vacío; cantidad con `aCantidad`; total con `aMenores`;
 * fecha vacía → ausente. Cantidad o total inválidos → `null`.
 */
export function cuerpoOperacion(v: ValoresOperacion, moneda: Moneda, enCuenta: boolean): OperacionCuerpo | null {
  const cantidad = aCantidad(v.cantidad);
  const monto = totalValido(v.total, moneda);
  if (cantidad === null || monto === null) return null;
  const cuerpo: OperacionCuerpo = { clase: v.clase, simbolo: normalizarSimbolo(v.simbolo), cantidad, monto };
  const nombre = v.nombre.trim();
  if (!enCuenta && nombre !== "") cuerpo.nombre = nombre;
  if (v.fecha !== "") cuerpo.fecha = v.fecha;
  return cuerpo;
}

/** Precarga de la edición de una operación. */
export function valoresEdicion(o: Pick<Operacion, "cantidad" | "monto" | "fecha">, moneda: Moneda): ValoresEdicionOperacion {
  return { cantidad: formatearCantidadCorta(o.cantidad), total: desdeMenores(o.monto, moneda), fecha: o.fecha };
}

/**
 * Cambios para `PUT …/operaciones/:id`: solo los campos que cambiaron. Sin
 * cambios → `null` (no se envía: evita `SIN_CAMBIOS`). Un campo cambiado que
 * no es válido → `"invalido"`.
 */
export function cambioOperacion(
  antes: ValoresEdicionOperacion,
  despues: ValoresEdicionOperacion,
  moneda: Moneda,
): OperacionCambio | null | "invalido" {
  const cambio: OperacionCambio = {};

  const cantidad = aCantidad(despues.cantidad);
  if (cantidad !== aCantidad(antes.cantidad)) {
    if (cantidad === null) return "invalido";
    cambio.cantidad = cantidad;
  }

  const monto = totalValido(despues.total, moneda);
  if (monto !== totalValido(antes.total, moneda)) {
    if (monto === null) return "invalido";
    cambio.monto = monto;
  }

  if (despues.fecha !== antes.fecha) {
    if (despues.fecha === "") return "invalido";
    cambio.fecha = despues.fecha;
  }

  return Object.keys(cambio).length === 0 ? null : cambio;
}

/** Cuerpo de `POST …/activos/:activoId/precios`: el precio por unidad, entero > 0. */
export function cuerpoPrecio(texto: string, moneda: Moneda): PrecioCuerpo | null {
  const precio = totalValido(texto, moneda);
  return precio === null ? null : { precio };
}
