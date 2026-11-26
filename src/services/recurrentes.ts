import { redirect } from "next/navigation";
import type { CampoPlantilla, ValoresPlantilla } from "@/domain/recurrente/formulario";
import { ErrorApi } from "@/repositories/api/cliente";
import type { Movimiento } from "@/repositories/api/movimientos";
import * as api from "@/repositories/api/recurrentes";
import type {
  EstadoOcurrencia,
  Grupo,
  Ocurrencia,
  Periodicidad,
  Recurrente,
  RecurrenteCuerpo,
  Recurrentes,
  Ref,
} from "@/repositories/api/recurrentes";
import { MENSAJE_SIN_API } from "@/lib/sin-conexion";

export type {
  CampoPlantilla,
  EstadoOcurrencia,
  Grupo,
  Movimiento,
  Ocurrencia,
  Periodicidad,
  Recurrente,
  RecurrenteCuerpo,
  Recurrentes,
  Ref,
  ValoresPlantilla,
};
export { ErrorApi };

/** Resultado de una acción de la bandeja o del panel. Nunca lanza al cliente. */
export type ResultadoRecurrente = { ok: true } | { ok: false; codigo: string; mensaje: string; campo?: CampoPlantilla };

/** Resultado de confirmar: el `id` del movimiento sirve para deshacer. */
export type ResultadoConfirmacion = { ok: true; movimiento: Movimiento } | { ok: false; codigo: string; mensaje: string };

/** Resultado de pausar o reanudar: el panel sigue abierto con el estado nuevo. */
export type ResultadoPausa = { ok: true; recurrente: Recurrente } | { ok: false; codigo: string; mensaje: string };


/** Campo de la API → campo del formulario de plantilla. */
const CAMPO_FORMULARIO: Record<string, CampoPlantilla> = {
  tipo: "tipo",
  concepto: "concepto",
  monto: "monto",
  periodicidad: "periodicidad",
  primerVencimiento: "primerVencimiento",
  ultimoDia: "ultimoDia",
  cuentaOrigenId: "cuentaOrigen",
  cuentaDestinoId: "cuentaDestino",
  categoriaId: "categoria",
};

/**
 * Traduce un error al fallo de una acción: el `mensaje` de la API (bajo su
 * campo, si trae uno del formulario). Sin conexión o error desconocido, texto
 * local. Las redirecciones de Next no llegan aquí: se relanzan antes.
 */
export function falloDeError(error: unknown): { ok: false; codigo: string; mensaje: string; campo?: CampoPlantilla } {
  if (!(error instanceof ErrorApi) || error.codigo === "SIN_CONEXION") {
    return { ok: false, codigo: error instanceof ErrorApi ? error.codigo : "ERROR_INTERNO", mensaje: MENSAJE_SIN_API };
  }
  const campo = error.campo === undefined ? undefined : CAMPO_FORMULARIO[error.campo];
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

/** `GET /recurrentes`: bandeja, comprometido, ingresos esperados y plantillas. */
export async function obtenerRecurrentes(): Promise<Recurrentes> {
  return conSesion(() => api.obtenerRecurrentes());
}

export async function crear(cuerpo: RecurrenteCuerpo): Promise<Recurrente> {
  return conSesion(() => api.crearRecurrente(cuerpo));
}

export async function editar(id: string, cuerpo: RecurrenteCuerpo): Promise<Recurrente> {
  return conSesion(() => api.reemplazarRecurrente(id, cuerpo));
}

export async function pausar(id: string, pausada: boolean): Promise<Recurrente> {
  return conSesion(() => api.pausarRecurrente(id, pausada));
}

export async function eliminar(id: string): Promise<void> {
  return conSesion(() => api.eliminarRecurrente(id));
}

export async function confirmar(id: string, vencimiento: string, monto?: string): Promise<Movimiento> {
  return conSesion(() => api.confirmarOcurrencia(id, vencimiento, monto));
}

export async function omitir(id: string, vencimiento: string): Promise<void> {
  return conSesion(() => api.omitirOcurrencia(id, vencimiento));
}

export async function deshacerOmision(id: string, vencimiento: string): Promise<void> {
  return conSesion(() => api.deshacerOmision(id, vencimiento));
}
