import { redirect } from "next/navigation";
import * as api from "@/repositories/api/avisos";
import type { Aviso, AvisoConfig, Avisos, ConfigCuerpo, TipoAviso } from "@/repositories/api/avisos";
import { ErrorApi } from "@/repositories/api/cliente";

export type { Aviso, AvisoConfig, Avisos, ConfigCuerpo, TipoAviso };

export const MENSAJE_SIN_CONEXION = "No pudimos conectar. Intenta de nuevo.";

type Fallo = { ok: false; codigo: string; mensaje: string };

/** Resultado de marcar o de «Marcar todo». Nunca lanza al cliente. */
export type ResultadoAviso = { ok: true } | Fallo;

/** Resultado de cambiar la antelación: la configuración nueva del tipo. */
export type ResultadoConfig = { ok: true; config: AvisoConfig } | Fallo;

/** El `mensaje` de la API; sin conexión o error desconocido, texto local. */
export function falloDeError(error: unknown): Fallo {
  if (!(error instanceof ErrorApi) || error.codigo === "SIN_CONEXION") {
    return { ok: false, codigo: error instanceof ErrorApi ? error.codigo : "ERROR_INTERNO", mensaje: MENSAJE_SIN_CONEXION };
  }
  return { ok: false, codigo: error.codigo, mensaje: error.message };
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

/**
 * Escritura: token vencido → `/login` (la redirección de Next se propaga);
 * cualquier otro error se traduce a un fallo, nunca se lanza.
 */
async function escribir<T>(llamada: () => Promise<T>): Promise<{ ok: true; valor: T } | Fallo> {
  try {
    return { ok: true, valor: await llamada() };
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 401) redirect("/login");
    return falloDeError(error);
  }
}

/** `GET /avisos`: lista, conteo y configuración. */
export async function obtenerAvisos(): Promise<Avisos> {
  return conSesion(() => api.obtenerAvisos());
}

/** `GET /avisos/conteo` para el menú (N-02). */
export async function contarNoLeidos(): Promise<number> {
  return conSesion(() => api.contarAvisos());
}

/** `PATCH /avisos/:clave { leido }`. */
export async function marcar(clave: string, leido: boolean): Promise<ResultadoAviso> {
  const resultado = await escribir(() => api.marcarAviso(clave, leido));
  return resultado.ok ? { ok: true } : resultado;
}

/** `POST /avisos/leer-todos`. */
export async function leerTodos(): Promise<ResultadoAviso> {
  const resultado = await escribir(() => api.leerTodosLosAvisos());
  return resultado.ok ? { ok: true } : resultado;
}

/** `PATCH /avisos/config/:tipo`. */
export async function configurar(tipo: TipoAviso, cambio: ConfigCuerpo): Promise<ResultadoConfig> {
  const resultado = await escribir(() => api.configurarAvisos(tipo, cambio));
  return resultado.ok ? { ok: true, config: resultado.valor } : resultado;
}
