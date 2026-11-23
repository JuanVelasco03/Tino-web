import { redirect } from "next/navigation";
import type { CampoAporte, CampoMeta, ValoresAporte, ValoresMeta } from "@/domain/meta/formulario";
import { ErrorApi } from "@/repositories/api/cliente";
import * as api from "@/repositories/api/metas";
import type {
  AporteCambio,
  AporteCuerpo,
  FilaAporte,
  FilaValor,
  Meta,
  MetaCambio,
  MetaCuerpo,
  MetaDetalle,
  Metas,
  ModoMeta,
} from "@/domain/meta/tipos";

export type {
  AporteCambio,
  AporteCuerpo,
  CampoAporte,
  CampoMeta,
  FilaAporte,
  FilaValor,
  Meta,
  MetaCambio,
  MetaCuerpo,
  MetaDetalle,
  Metas,
  ModoMeta,
  ValoresAporte,
  ValoresMeta,
};
export { ErrorApi };

type Fallo<C extends string = never> = { ok: false; codigo: string; mensaje: string; campo?: C };

/** Alta o edición: el `id` de la meta para abrir su detalle. Nunca lanza al cliente. */
export type ResultadoMeta = { ok: true; id: string } | Fallo<CampoMeta>;
export type ResultadoAporte = { ok: true } | Fallo<CampoAporte>;
export type ResultadoSimple = { ok: true } | Fallo;

export const MENSAJE_SIN_CONEXION = "No pudimos conectar. Intenta de nuevo.";

/* Campo de la API → campo del formulario. Lo que no está aquí va al pie. */
export const CAMPOS_ALTA: Record<string, CampoMeta> = {
  nombre: "nombre",
  modo: "modo",
  cuentaId: "cuentaId",
  objetivo: "objetivo",
  fechaMeta: "fechaMeta",
  aporteInicial: "aporteInicial",
  "aporteInicial.monto": "aporteInicial",
  // `SALDO_LIBRE_INSUFICIENTE` del apartado inicial sin origen.
  monto: "aporteInicial",
  cuentaOrigenId: "cuentaOrigenId",
  "aporteInicial.cuentaOrigenId": "cuentaOrigenId",
};
/** En la edición, `SALDO_LIBRE_INSUFICIENTE` (`monto`) es lo apartado que no cabe en la nueva cuenta: bajo «Cuenta». */
export const CAMPOS_EDICION: Record<string, CampoMeta> = {
  nombre: "nombre",
  modo: "modo",
  cuentaId: "cuentaId",
  objetivo: "objetivo",
  fechaMeta: "fechaMeta",
  monto: "cuentaId",
};
export const CAMPOS_APORTE: Record<string, CampoAporte> = {
  tipo: "tipo",
  monto: "monto",
  fecha: "fecha",
  cuentaOrigenId: "cuentaOrigenId",
  motivo: "motivo",
};

/**
 * Traduce un error al fallo de una acción: el `mensaje` de la API, bajo su
 * campo si el formulario lo tiene. Sin conexión o error desconocido, texto
 * local. Las redirecciones de Next no llegan aquí: se relanzan antes.
 */
export function falloDeError<C extends string = never>(error: unknown, campos: Record<string, C> = {}): Fallo<C> {
  if (!(error instanceof ErrorApi) || error.codigo === "SIN_CONEXION") {
    return { ok: false, codigo: error instanceof ErrorApi ? error.codigo : "ERROR_INTERNO", mensaje: MENSAJE_SIN_CONEXION };
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

/** `GET /metas`: activas, cumplidas, totales y la fecha de hoy. */
export async function obtenerMetas(): Promise<Metas> {
  return conSesion(() => api.listarMetas());
}

/** `GET /metas/archivadas`. */
export async function obtenerArchivadas(): Promise<Meta[]> {
  return conSesion(() => api.listarArchivadas());
}

/** `GET /metas/:id`. `null` si no existe (la página vuelve a la lista). */
export async function obtenerMeta(id: string): Promise<MetaDetalle | null> {
  return conSesion(() => api.leerMeta(id));
}

export async function crear(cuerpo: MetaCuerpo): Promise<MetaDetalle> {
  return conSesion(() => api.crearMeta(cuerpo));
}

export async function editar(id: string, cambio: MetaCambio): Promise<MetaDetalle> {
  return conSesion(() => api.cambiarMeta(id, cambio));
}

export async function eliminar(id: string): Promise<void> {
  return conSesion(() => api.eliminarMeta(id));
}

export async function archivar(id: string): Promise<Meta> {
  return conSesion(() => api.archivarMeta(id));
}

export async function restaurar(id: string): Promise<MetaDetalle> {
  return conSesion(() => api.restaurarMeta(id));
}

export async function registrarAporte(id: string, cuerpo: AporteCuerpo): Promise<MetaDetalle> {
  return conSesion(() => api.registrarAporte(id, cuerpo));
}

export async function editarAporte(id: string, aporteId: string, cambio: AporteCambio): Promise<MetaDetalle> {
  return conSesion(() => api.editarAporte(id, aporteId, cambio));
}

export async function eliminarAporte(id: string, aporteId: string): Promise<void> {
  return conSesion(() => api.eliminarAporte(id, aporteId));
}
