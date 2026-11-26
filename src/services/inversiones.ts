import { redirect } from "next/navigation";
import type {
  CampoInversion,
  CampoOperacion,
  ValoresEdicionOperacion,
  ValoresInversion,
  ValoresOperacion,
} from "@/domain/inversion/formulario";
import { ErrorApi } from "@/repositories/api/cliente";
import * as api from "@/repositories/api/inversiones";
import type {
  BusquedaActivo,
  Cotizacion,
  CotizacionCambio,
  InversionCuerpo,
  InversionDetalle,
  InversionResumen,
  Inversiones,
  Moneda,
  Operacion,
  OperacionCambio,
  OperacionCuerpo,
  Posicion,
  PrecioCuerpo,
  Trm,
} from "@/repositories/api/inversiones";
import { MENSAJE_SIN_API } from "@/lib/sin-conexion";

export type {
  BusquedaActivo,
  CampoInversion,
  CampoOperacion,
  Cotizacion,
  CotizacionCambio,
  InversionCuerpo,
  InversionDetalle,
  InversionResumen,
  Inversiones,
  Moneda,
  Operacion,
  OperacionCambio,
  OperacionCuerpo,
  Posicion,
  PrecioCuerpo,
  Trm,
  ValoresEdicionOperacion,
  ValoresInversion,
  ValoresOperacion,
};
export { ErrorApi };

/** Campo del bloque de precio donde va un error de la API (todos van dentro del bloque). */
export type CampoPrecio = "precio";

type Fallo<C extends string = never> = { ok: false; codigo: string; mensaje: string; campo?: C };

/** Alta: el `id` de la inversión para abrir su detalle. Nunca lanza al cliente. */
export type ResultadoInversion = { ok: true; id: string } | Fallo<CampoInversion>;
export type ResultadoOperacion = { ok: true } | Fallo<CampoOperacion>;
export type ResultadoPrecio = { ok: true } | Fallo<CampoPrecio>;
export type ResultadoBusqueda = { ok: true; busqueda: BusquedaActivo } | Fallo;
export type ResultadoSimple = { ok: true } | Fallo;


/* Campo de la API → campo del formulario. Lo que no está aquí va al pie. */
export const CAMPOS_INVERSION: Record<string, CampoInversion> = {
  nombre: "nombre",
  moneda: "moneda",
  efectivoInicial: "efectivoInicial",
};
/** `MONTO_*` con `campo` `monto` va bajo «Total». `CANTIDAD_INSUFICIENTE` también trae `cantidad`. */
export const CAMPOS_OPERACION: Record<string, CampoOperacion> = {
  clase: "clase",
  simbolo: "simbolo",
  nombre: "nombre",
  cantidad: "cantidad",
  monto: "total",
  fecha: "fecha",
};
export const CAMPOS_PRECIO: Record<string, CampoPrecio> = { precio: "precio" };

/**
 * Traduce un error al fallo de una acción: el `mensaje` de la API, bajo su
 * campo si el formulario lo tiene. Sin conexión o error desconocido, texto
 * local. Las redirecciones de Next no llegan aquí: se relanzan antes.
 */
export function falloDeError<C extends string = never>(error: unknown, campos: Record<string, C> = {}): Fallo<C> {
  if (!(error instanceof ErrorApi) || error.codigo === "SIN_CONEXION") {
    return { ok: false, codigo: error instanceof ErrorApi ? error.codigo : "ERROR_INTERNO", mensaje: MENSAJE_SIN_API };
  }
  const campo = error.campo === undefined ? undefined : campos[error.campo];
  return campo
    ? { ok: false, codigo: error.codigo, mensaje: error.message, campo }
    : { ok: false, codigo: error.codigo, mensaje: error.message };
}

/** Token vencido entre el proxy y la API → `/login`. Cualquier otro error se relanza. */
async function conSesion<T>(llamada: () => Promise<T>): Promise<T> {
  try {
    return await llamada();
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 401) redirect("/login");
    throw error;
  }
}

/** `GET /inversiones`: no archivadas, con la TRM de hoy. */
export async function obtenerInversiones(): Promise<Inversiones> {
  return conSesion(() => api.listarInversiones());
}

/** `GET /inversiones/:id`. `null` si no existe (la página vuelve a `/inversiones`). */
export async function obtenerInversion(id: string): Promise<InversionDetalle | null> {
  return conSesion(() => api.leerInversion(id));
}

/** `GET /inversiones/:id/operaciones`, todas las de la cuenta. */
export async function obtenerOperaciones(id: string): Promise<Operacion[]> {
  return conSesion(() => api.listarOperaciones(id));
}

export async function crear(cuerpo: InversionCuerpo): Promise<InversionDetalle> {
  return conSesion(() => api.crearInversion(cuerpo));
}

export async function registrarOperacion(id: string, cuerpo: OperacionCuerpo): Promise<InversionDetalle> {
  return conSesion(() => api.registrarOperacion(id, cuerpo));
}

export async function editarOperacion(id: string, operacionId: string, cambio: OperacionCambio): Promise<InversionDetalle> {
  return conSesion(() => api.editarOperacion(id, operacionId, cambio));
}

export async function eliminarOperacion(id: string, operacionId: string): Promise<void> {
  return conSesion(() => api.eliminarOperacion(id, operacionId));
}

export async function guardarPrecio(id: string, activoId: string, cuerpo: PrecioCuerpo): Promise<InversionDetalle> {
  return conSesion(() => api.registrarPrecio(id, activoId, cuerpo));
}

export async function buscarActivo(id: string, simbolo: string): Promise<BusquedaActivo> {
  return conSesion(() => api.buscarActivo(id, simbolo));
}

export async function cambiarCotizacion(id: string, activoId: string, cotizacion: Cotizacion): Promise<InversionDetalle> {
  return conSesion(() => api.cambiarCotizacion(id, activoId, { cotizacion }));
}
