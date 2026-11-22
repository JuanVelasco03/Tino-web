/**
 * Cliente HTTP de Tino API. ÚNICO punto de la web que habla con la API.
 *
 * Toma el token de la sesión de Supabase (cookies) y lo envía en
 * `Authorization: Bearer`. La API verifica el token y las políticas RLS
 * evalúan al usuario real (RN-12, RN-19). La web no toca tablas.
 */
import { io } from "next/cache";
import { urlApi } from "@/lib/env-servidor";
import { crearClienteServidor } from "../supabase/servidor";

/**
 * Error de la API con su `codigo` estable (el cliente decide con él, nunca con
 * el texto). `message` es el `mensaje` de la API, listo para mostrar.
 * `estado` 0 con `codigo` `"SIN_CONEXION"`: la petición no llegó a la API.
 */
export class ErrorApi extends Error {
  constructor(
    readonly estado: number,
    readonly codigo: string,
    mensaje: string,
    readonly campo?: string,
  ) {
    super(mensaje);
    this.name = "ErrorApi";
  }
}

export type MetodoEscritura = "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Token de la sesión actual, o `null` si no hay sesión. La API lo verifica; aquí solo se reenvía.
 *
 * `io()` saca la lectura de todo prerender (build y prefetch parcial): con
 * `cacheComponents`, el prefetch resuelve `cookies()` y `getSession` lee
 * `Date.now()` para revisar el vencimiento del token, que Next rechaza como
 * valor inestable. Datos financieros por usuario: siempre en la petición. En
 * una petición real y en server actions resuelve al instante.
 */
async function tokenDeSesion(): Promise<string | null> {
  await io();
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function tokenObligatorio(): Promise<string> {
  const token = await tokenDeSesion();
  if (!token) throw new ErrorApi(401, "NO_AUTENTICADO", "Sin sesión.");
  return token;
}

/** `fetch` que convierte un fallo de red en `ErrorApi(0, "SIN_CONEXION")`. */
async function pedir(ruta: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`${urlApi()}${ruta}`, {
      ...init,
      cache: "no-store", // datos financieros por usuario: nunca en caché compartida
    });
  } catch {
    throw new ErrorApi(0, "SIN_CONEXION", "No hay conexión con Tino API.");
  }
}

/** Lee el cuerpo de error común (`{ codigo, mensaje, campo }`). Si no es JSON, `ERROR_INTERNO`. */
async function leerError(respuesta: Response): Promise<ErrorApi> {
  const porDefecto = `Tino API respondió ${respuesta.status}.`;
  try {
    const cuerpo: unknown = await respuesta.json();
    if (cuerpo && typeof cuerpo === "object") {
      const { codigo, mensaje, campo } = cuerpo as Record<string, unknown>;
      return new ErrorApi(
        respuesta.status,
        typeof codigo === "string" ? codigo : "ERROR_INTERNO",
        typeof mensaje === "string" ? mensaje : porDefecto,
        typeof campo === "string" ? campo : undefined,
      );
    }
  } catch {
    // Cuerpo vacío o no JSON: cae al error genérico.
  }
  return new ErrorApi(respuesta.status, "ERROR_INTERNO", porDefecto);
}

/**
 * GET autenticado. Devuelve `null` si la API responde 404.
 * Lanza `ErrorApi` ante cualquier otro estado no exitoso.
 */
export async function obtener<T>(ruta: string): Promise<T | null> {
  const token = await tokenObligatorio();
  const respuesta = await pedir(ruta, { headers: { Authorization: `Bearer ${token}` } });

  if (respuesta.status === 404) return null;
  if (!respuesta.ok) throw await leerError(respuesta);
  return (await respuesta.json()) as T;
}

/**
 * Escritura autenticada. `204` devuelve `null`.
 * Lanza `ErrorApi` ante cualquier estado no exitoso (con `codigo` y `campo` de la API).
 */
export async function enviar<T>(metodo: MetodoEscritura, ruta: string, cuerpo?: unknown): Promise<T | null> {
  const token = await tokenObligatorio();
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (cuerpo !== undefined) headers["Content-Type"] = "application/json";

  const respuesta = await pedir(ruta, {
    method: metodo,
    headers,
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });

  if (!respuesta.ok) throw await leerError(respuesta);
  if (respuesta.status === 204) return null;
  return (await respuesta.json()) as T;
}
