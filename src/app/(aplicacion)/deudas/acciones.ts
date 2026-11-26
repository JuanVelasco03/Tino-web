"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import * as prestamos from "@/services/prestamos";
import {
  CAMPOS_ABONO,
  CAMPOS_ALTA,
  CAMPOS_CONDONACION,
  CAMPOS_EDICION,
  CAMPOS_PROPUESTA,
  type AbonoCuerpo,
  type CondonacionCuerpo,
  type DesembolsoCuerpo,
  type PrestamoCambio,
  type PrestamoCuerpo,
  type ResultadoAbono,
  type ResultadoCondonacion,
  type ResultadoEdicionPrestamo,
  type ResultadoPrestamo,
  type ResultadoPropuesta,
  type ResultadoSimple,
  type TipoPrestamo,
} from "@/services/prestamos";
import { esId, RUTA_DETALLE_CUENTA } from "../captura/entrada";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const MONTO = /^\d{1,19}$/;
const TIPOS: readonly TipoPrestamo[] = ["prestamo_otorgado", "deuda_contraida"];

const ENTRADA_INVALIDA = {
  ok: false,
  codigo: "ENTRADA_INVALIDA",
  mensaje: "No pudimos procesar los datos. Intenta de nuevo.",
} as const;

/**
 * Toda acción de Deudas mueve dinero o nombres de cuenta: cambia la lista y el
 * detalle, el libro de movimientos, los saldos, el resumen (N-55) y los
 * avisos de cobros y deudas, y el avance de las metas sobre esas cuentas.
 */
const RUTAS_DEUDAS = ["/deudas", "/movimientos", "/cuentas", "/resumen", "/avisos", "/metas"] as const;

function revalidar() {
  for (const ruta of RUTAS_DEUDAS) revalidatePath(ruta);
  // Un desembolso o un abono mueve el historial de su cuenta (SPEC 13).
  revalidatePath(RUTA_DETALLE_CUENTA, "page");
}

/** Traduce el error de la API con el mapa de campos del formulario. Las redirecciones de Next se relanzan. */
function fallo<C extends string = never>(error: unknown, campos?: Record<string, C>) {
  unstable_rethrow(error);
  return prestamos.falloDeError<C>(error, campos);
}

function esFecha(valor: unknown): valor is string {
  return typeof valor === "string" && FECHA.test(valor);
}

function esMonto(valor: unknown): valor is string {
  return typeof valor === "string" && MONTO.test(valor);
}

/** Cuenta propia: un UUID, o `""` sin elegir (la API responde `CUENTA_INVALIDA` bajo el campo). */
function esCuenta(valor: unknown): valor is string {
  return valor === "" || esId(valor);
}

function esTextoCorto(valor: unknown, maximo: number): valor is string {
  return typeof valor === "string" && valor.length <= maximo;
}

/* Validan la forma del cuerpo (viene del navegador) y copian solo los campos conocidos. El contenido lo valida la API. */

function cuerpoAlta(entrada: unknown): PrestamoCuerpo | null {
  if (!entrada || typeof entrada !== "object") return null;
  const e = entrada as Record<string, unknown>;
  if (typeof e.tipo !== "string" || !(TIPOS as readonly string[]).includes(e.tipo)) return null;
  if (!esTextoCorto(e.nombre, 200) || !esMonto(e.monto) || !esCuenta(e.cuentaId)) return null;
  if (e.fecha !== undefined && !esFecha(e.fecha)) return null;
  if (e.tasaMensual !== undefined && !esTextoCorto(e.tasaMensual, 20)) return null;
  if (e.fechaAcordada !== undefined && e.fechaAcordada !== null && !esFecha(e.fechaAcordada)) return null;

  const cuerpo: PrestamoCuerpo = { tipo: e.tipo as TipoPrestamo, nombre: e.nombre, monto: e.monto, cuentaId: e.cuentaId };
  if (e.fecha !== undefined) cuerpo.fecha = e.fecha;
  if (e.tasaMensual !== undefined) cuerpo.tasaMensual = e.tasaMensual;
  if (e.fechaAcordada !== undefined) cuerpo.fechaAcordada = e.fechaAcordada;
  return cuerpo;
}

function cuerpoDesembolso(entrada: unknown): DesembolsoCuerpo | null {
  if (!entrada || typeof entrada !== "object") return null;
  const e = entrada as Record<string, unknown>;
  if (!esMonto(e.monto) || !esCuenta(e.cuentaId)) return null;
  if (e.fecha !== undefined && !esFecha(e.fecha)) return null;
  const cuerpo: DesembolsoCuerpo = { monto: e.monto, cuentaId: e.cuentaId };
  if (e.fecha !== undefined) cuerpo.fecha = e.fecha;
  return cuerpo;
}

function cuerpoAbono(entrada: unknown): AbonoCuerpo | null {
  if (!entrada || typeof entrada !== "object") return null;
  const e = entrada as Record<string, unknown>;
  if (!esCuenta(e.cuentaId) || !esFecha(e.fecha) || !esMonto(e.capital) || !esMonto(e.interes)) return null;
  // Sin `categoriaInteresId`: el interés va a «Intereses» del tipo (la web no lo elige).
  return { cuentaId: e.cuentaId, fecha: e.fecha, capital: e.capital, interes: e.interes };
}

function cambioValido(entrada: unknown): PrestamoCambio | null {
  if (!entrada || typeof entrada !== "object") return null;
  const e = entrada as Record<string, unknown>;
  const cambio: PrestamoCambio = {};
  if (e.nombre !== undefined) {
    if (!esTextoCorto(e.nombre, 200)) return null;
    cambio.nombre = e.nombre;
  }
  if (e.fechaAcordada !== undefined) {
    if (e.fechaAcordada !== null && !esFecha(e.fechaAcordada)) return null;
    cambio.fechaAcordada = e.fechaAcordada;
  }
  return Object.keys(cambio).length === 0 ? null : cambio;
}

function cuerpoCondonacion(entrada: unknown): CondonacionCuerpo | null {
  if (!entrada || typeof entrada !== "object") return null;
  const e = entrada as Record<string, unknown>;
  if (!esMonto(e.monto) || !esId(e.categoriaId)) return null;
  return { monto: e.monto, categoriaId: e.categoriaId };
}

/* ── Alta y desembolso ────────────────────────────────────────────────── */

/** `POST /prestamos`: préstamo nuevo con su primer desembolso. Devuelve su `id` para abrir el detalle. */
export async function crearPrestamo(entrada: PrestamoCuerpo): Promise<ResultadoPrestamo> {
  const cuerpo = cuerpoAlta(entrada);
  if (!cuerpo) return ENTRADA_INVALIDA;
  let id: string;
  try {
    id = (await prestamos.crear(cuerpo)).id;
  } catch (error) {
    return fallo(error, CAMPOS_ALTA);
  }
  revalidar();
  return { ok: true, id };
}

/** `POST /prestamos/:id/desembolsos`: suma al préstamo con esa persona; reabre uno saldado. */
export async function desembolsarPrestamo(id: string, entrada: DesembolsoCuerpo): Promise<ResultadoPrestamo> {
  const cuerpo = cuerpoDesembolso(entrada);
  if (!esId(id) || !cuerpo) return ENTRADA_INVALIDA;
  try {
    await prestamos.desembolsar(id, cuerpo);
  } catch (error) {
    return fallo(error, CAMPOS_ALTA);
  }
  revalidar();
  return { ok: true, id };
}

/* ── Abono ────────────────────────────────────────────────────────────── */

/** `GET /prestamos/:id/propuesta-abono`: reparto del total entre interés y capital. No escribe nada. */
export async function proponerAbono(id: string, fecha: string, monto: string): Promise<ResultadoPropuesta> {
  if (!esId(id) || !esFecha(fecha) || !esMonto(monto)) return ENTRADA_INVALIDA;
  try {
    return { ok: true, propuesta: await prestamos.proponerAbono(id, fecha, monto) };
  } catch (error) {
    return fallo(error, CAMPOS_PROPUESTA);
  }
}

/** `POST /prestamos/:id/abonos`: capital como transferencia e interés como ingreso o gasto. */
export async function abonarPrestamo(id: string, entrada: AbonoCuerpo): Promise<ResultadoAbono> {
  const cuerpo = cuerpoAbono(entrada);
  if (!esId(id) || !cuerpo) return ENTRADA_INVALIDA;
  try {
    await prestamos.abonar(id, cuerpo);
  } catch (error) {
    return fallo(error, CAMPOS_ABONO);
  }
  revalidar();
  return { ok: true };
}

/* ── Edición ──────────────────────────────────────────────────────────── */

/** `PATCH /prestamos/:id` con solo lo que cambió (nombre o fecha acordada). */
export async function editarPrestamo(id: string, entrada: PrestamoCambio): Promise<ResultadoEdicionPrestamo> {
  const cambio = cambioValido(entrada);
  if (!esId(id) || !cambio) return ENTRADA_INVALIDA;
  try {
    await prestamos.editar(id, cambio);
  } catch (error) {
    return fallo(error, CAMPOS_EDICION);
  }
  revalidar();
  return { ok: true };
}

/* ── Condonación ──────────────────────────────────────────────────────── */

/** `POST /prestamos/:id/condonaciones`: el gasto de hoy. Su `id` sirve para deshacer. */
export async function condonarPrestamo(id: string, entrada: CondonacionCuerpo): Promise<ResultadoCondonacion> {
  const cuerpo = cuerpoCondonacion(entrada);
  if (!esId(id) || !cuerpo) return ENTRADA_INVALIDA;
  let movimiento: prestamos.Movimiento;
  try {
    movimiento = await prestamos.condonar(id, cuerpo);
  } catch (error) {
    return fallo(error, CAMPOS_CONDONACION);
  }
  revalidar();
  return { ok: true, movimiento };
}

/** Categorías de gasto y patrimonio neto para el bloque de condonar, al abrirlo (`GET /captura`, `GET /cuentas`). */
export async function datosCondonacion(): Promise<
  { ok: true; datos: { categorias: { id: string; nombre: string }[]; patrimonioNeto: bigint } } | ReturnType<typeof fallo>
> {
  try {
    const { captura, patrimonioNeto } = await prestamos.cargarFormulario();
    return { ok: true, datos: { categorias: captura.categorias.gasto.map(({ id, nombre }) => ({ id, nombre })), patrimonioNeto } };
  } catch (error) {
    return fallo(error);
  }
}

/** «Deshacer» una condonación: `DELETE /movimientos/:id` con el `id` del gasto. */
export async function deshacerCondonacion(movimientoId: string): Promise<ResultadoSimple> {
  if (!esId(movimientoId)) return ENTRADA_INVALIDA;
  try {
    await prestamos.deshacerCondonacion(movimientoId);
  } catch (error) {
    return fallo(error);
  }
  revalidar();
  return { ok: true };
}
