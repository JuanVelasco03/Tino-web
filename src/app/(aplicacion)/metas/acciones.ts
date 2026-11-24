"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { RUTAS_METAS } from "@/components/metas/rutas";
import * as metas from "@/services/metas";
import {
  CAMPOS_ALTA,
  CAMPOS_APORTE,
  CAMPOS_EDICION,
  type AporteCambio,
  type AporteCuerpo,
  type MetaCambio,
  type MetaCuerpo,
  type ModoMeta,
  type ResultadoAporte,
  type ResultadoMeta,
  type ResultadoSimple,
} from "@/services/metas";
import { esId, revalidarAfectadas } from "../captura/entrada";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const FECHA_META = /^\d{4}-\d{2}(-\d{2})?$/;
const MONTO = /^\d{1,19}$/;
const MODOS: readonly ModoMeta[] = ["apartado", "cuenta"];

const ENTRADA_INVALIDA = {
  ok: false,
  codigo: "ENTRADA_INVALIDA",
  mensaje: "No pudimos procesar los datos. Intenta de nuevo.",
} as const;

/**
 * Editar, archivar, restaurar y eliminar una meta cambian la lista, el detalle
 * y las archivadas. Crear una meta (con apartado inicial desde otra cuenta) y
 * crear, editar o borrar un aporte pueden mover una transferencia: también
 * revalidan lo que cambia la captura (`RUTAS_AFECTADAS`).
 */
function revalidar(conMovimientos: boolean) {
  for (const ruta of RUTAS_METAS) revalidatePath(ruta);
  if (conMovimientos) revalidarAfectadas();
}

/** Traduce el error de la API con el mapa de campos del formulario. Las redirecciones de Next se relanzan. */
function fallo<C extends string = never>(error: unknown, campos?: Record<string, C>) {
  unstable_rethrow(error);
  return metas.falloDeError<C>(error, campos);
}

function esMonto(valor: unknown): valor is string {
  return typeof valor === "string" && MONTO.test(valor);
}

function esFecha(valor: unknown): valor is string {
  return typeof valor === "string" && FECHA.test(valor);
}

function esModo(valor: unknown): valor is ModoMeta {
  return typeof valor === "string" && (MODOS as readonly string[]).includes(valor);
}

function esTextoCorto(valor: unknown, maximo: number): valor is string {
  return typeof valor === "string" && valor.length <= maximo;
}

/** `null` (sin fecha) o `"YYYY-MM-DD"` / `"YYYY-MM"`. */
function esFechaMeta(valor: unknown): valor is string | null {
  return valor === null || (typeof valor === "string" && FECHA_META.test(valor));
}

/** Origen: un UUID o `null` (ya está en la cuenta). */
function esOrigen(valor: unknown): valor is string | null {
  return valor === null || esId(valor);
}

/* Validan la forma del cuerpo (viene del navegador) y copian solo los campos conocidos. El contenido lo valida la API. */

function cuerpoMeta(entrada: unknown): MetaCuerpo | null {
  if (!entrada || typeof entrada !== "object") return null;
  const e = entrada as Record<string, unknown>;
  if (!esTextoCorto(e.nombre, 200) || !esId(e.cuentaId) || !esModo(e.modo) || !esMonto(e.objetivo)) return null;
  const cuerpo: MetaCuerpo = { nombre: e.nombre, cuentaId: e.cuentaId, modo: e.modo, objetivo: e.objetivo };
  if (e.fechaMeta !== undefined) {
    if (!esFechaMeta(e.fechaMeta)) return null;
    cuerpo.fechaMeta = e.fechaMeta;
  }
  if (e.aporteInicial !== undefined && e.aporteInicial !== null) {
    if (typeof e.aporteInicial !== "object") return null;
    const a = e.aporteInicial as Record<string, unknown>;
    const origen = a.cuentaOrigenId ?? null;
    if (!esMonto(a.monto) || !esOrigen(origen)) return null;
    cuerpo.aporteInicial = { monto: a.monto, cuentaOrigenId: origen };
  }
  return cuerpo;
}

function cambioMeta(entrada: unknown): MetaCambio | null {
  if (!entrada || typeof entrada !== "object") return null;
  const e = entrada as Record<string, unknown>;
  const cambio: MetaCambio = {};
  if (e.nombre !== undefined) {
    if (!esTextoCorto(e.nombre, 200)) return null;
    cambio.nombre = e.nombre;
  }
  if (e.cuentaId !== undefined) {
    if (!esId(e.cuentaId)) return null;
    cambio.cuentaId = e.cuentaId;
  }
  if (e.modo !== undefined) {
    if (!esModo(e.modo)) return null;
    cambio.modo = e.modo;
  }
  if (e.objetivo !== undefined) {
    if (!esTextoCorto(e.objetivo, 40)) return null;
    // Un objetivo mal escrito lo rechaza la API (`MONTO_INVALIDO`) bajo su campo.
    cambio.objetivo = e.objetivo;
  }
  if (e.fechaMeta !== undefined) {
    if (!esFechaMeta(e.fechaMeta)) return null;
    cambio.fechaMeta = e.fechaMeta;
  }
  return Object.keys(cambio).length === 0 ? null : cambio;
}

function camposAporte(e: Record<string, unknown>): AporteCambio | null {
  if (!esMonto(e.monto) || !esFecha(e.fecha)) return null;
  const cambio: AporteCambio = { monto: e.monto, fecha: e.fecha };
  if (e.cuentaOrigenId !== undefined) {
    if (!esOrigen(e.cuentaOrigenId)) return null;
    cambio.cuentaOrigenId = e.cuentaOrigenId;
  }
  if (e.motivo !== undefined) {
    if (e.motivo !== null && !esTextoCorto(e.motivo, 200)) return null;
    cambio.motivo = e.motivo;
  }
  return cambio;
}

function cuerpoAporte(entrada: unknown): AporteCuerpo | null {
  if (!entrada || typeof entrada !== "object") return null;
  const e = entrada as Record<string, unknown>;
  if (e.tipo !== "aporte" && e.tipo !== "retiro") return null;
  const campos = camposAporte(e);
  return campos && { tipo: e.tipo, ...campos };
}

function cambioAporte(entrada: unknown): AporteCambio | null {
  if (!entrada || typeof entrada !== "object") return null;
  return camposAporte(entrada as Record<string, unknown>);
}

/* ── Meta ─────────────────────────────────────────────────────────────── */

/** `POST /metas`. Devuelve su `id` para abrir el detalle. */
export async function crearMeta(entrada: MetaCuerpo): Promise<ResultadoMeta> {
  const cuerpo = cuerpoMeta(entrada);
  if (!cuerpo) return ENTRADA_INVALIDA;
  let id: string;
  try {
    id = (await metas.crear(cuerpo)).id;
  } catch (error) {
    return fallo(error, CAMPOS_ALTA);
  }
  revalidar(true);
  return { ok: true, id };
}

/** `PATCH /metas/:id` con solo lo que cambió. */
export async function editarMeta(id: string, entrada: MetaCambio): Promise<ResultadoMeta> {
  const cambio = cambioMeta(entrada);
  if (!esId(id) || !cambio) return ENTRADA_INVALIDA;
  try {
    await metas.editar(id, cambio);
  } catch (error) {
    return fallo(error, CAMPOS_EDICION);
  }
  revalidar(false);
  return { ok: true, id };
}

/** `DELETE /metas/:id`. La confirmación ya la pidió el detalle. */
export async function eliminarMeta(id: string): Promise<ResultadoSimple> {
  if (!esId(id)) return ENTRADA_INVALIDA;
  try {
    await metas.eliminar(id);
  } catch (error) {
    return fallo(error);
  }
  revalidar(false);
  return { ok: true };
}

/** `POST /metas/:id/archivar`, sin confirmación: «Restaurar» lo deshace. */
export async function archivarMeta(id: string): Promise<ResultadoSimple> {
  if (!esId(id)) return ENTRADA_INVALIDA;
  try {
    await metas.archivar(id);
  } catch (error) {
    return fallo(error);
  }
  revalidar(false);
  return { ok: true };
}

/** `POST /metas/:id/restaurar`. */
export async function restaurarMeta(id: string): Promise<ResultadoSimple> {
  if (!esId(id)) return ENTRADA_INVALIDA;
  try {
    await metas.restaurar(id);
  } catch (error) {
    return fallo(error);
  }
  revalidar(false);
  return { ok: true };
}

/* ── Aportes y retiros ────────────────────────────────────────────────── */

/** `POST /metas/:id/aportes`: con origen, registra también la transferencia. */
export async function registrarAporte(id: string, entrada: AporteCuerpo): Promise<ResultadoAporte> {
  const cuerpo = cuerpoAporte(entrada);
  if (!esId(id) || !cuerpo) return ENTRADA_INVALIDA;
  try {
    await metas.registrarAporte(id, cuerpo);
  } catch (error) {
    return fallo(error, CAMPOS_APORTE);
  }
  revalidar(true);
  return { ok: true };
}

/** `PUT /metas/:id/aportes/:aporteId`: con origen, corrige su transferencia. */
export async function editarAporte(id: string, aporteId: string, entrada: AporteCambio): Promise<ResultadoAporte> {
  const cambio = cambioAporte(entrada);
  if (!esId(id) || !esId(aporteId) || !cambio) return ENTRADA_INVALIDA;
  try {
    await metas.editarAporte(id, aporteId, cambio);
  } catch (error) {
    return fallo(error, CAMPOS_APORTE);
  }
  revalidar(true);
  return { ok: true };
}

/** `DELETE /metas/:id/aportes/:aporteId`: con origen, borra también su transferencia. */
export async function eliminarAporte(id: string, aporteId: string): Promise<ResultadoSimple> {
  if (!esId(id) || !esId(aporteId)) return ENTRADA_INVALIDA;
  try {
    await metas.eliminarAporte(id, aporteId);
  } catch (error) {
    return fallo(error);
  }
  revalidar(true);
  return { ok: true };
}
