import { redirect } from "next/navigation";
import type { CampoCuenta, ValoresCuenta } from "@/domain/cuenta/edicion";
import { ErrorApi } from "@/repositories/api/cliente";
import * as api from "@/repositories/api/cuentas";
import type {
  AltaCuenta,
  CondicionesTarjeta,
  Cuenta,
  EdicionCuenta,
  GrupoCuentas,
  ListaCuentas,
  Naturaleza,
  Tarjeta,
  TipoCuenta,
} from "@/repositories/api/cuentas";
import { MENSAJE_SIN_API } from "@/lib/sin-conexion";

export type {
  AltaCuenta,
  CampoCuenta,
  CondicionesTarjeta,
  Cuenta,
  EdicionCuenta,
  GrupoCuentas,
  ListaCuentas,
  Naturaleza,
  Tarjeta,
  TipoCuenta,
  ValoresCuenta,
};
export { ErrorApi };

/** Nuevo orden de un grupo. La server action recibe uno o dos, solo los que cambiaron. */
export type CambioOrden = { naturaleza: Naturaleza; ids: string[] };

export type ResultadoOrden = { ok: true } | { ok: false; codigo: string; mensaje: string };

/** Resultado de las server actions de cuentas. Nunca lanzan al cliente. */
export type ResultadoCuenta =
  | { ok: true }
  | { ok: false; codigo: string; mensaje: string; campo?: CampoCuenta };


/** Campo de la API → campo del formulario. `saldoInicial` se dibuja bajo `saldo`. */
const CAMPO_FORMULARIO: Record<string, CampoCuenta> = {
  nombre: "nombre",
  tipo: "tipo",
  detalle: "detalle",
  saldoInicial: "saldo",
  cupo: "cupo",
  // Condiciones de la tarjeta (SPEC 13): bajo su campo; `tarjeta`, bajo el rótulo del bloque.
  tarjeta: "tarjeta",
  "tarjeta.diaCorte": "diaCorte",
  "tarjeta.diaPago": "diaPago",
  "tarjeta.tasaMensual": "tasaMensual",
  "tarjeta.cuotaManejo": "cuotaManejo",
  "tarjeta.cuentaPagoId": "cuentaPagoId",
};

/**
 * Traduce un error a `ResultadoCuenta`: el `mensaje` de la API bajo su
 * campo, o general si no trae campo. Sin conexión, texto local.
 */
export function resultadoDeError(error: unknown): ResultadoCuenta & { ok: false } {
  if (!(error instanceof ErrorApi)) {
    return { ok: false, codigo: "ERROR_INTERNO", mensaje: MENSAJE_SIN_API };
  }
  if (error.codigo === "SIN_CONEXION") {
    return { ok: false, codigo: error.codigo, mensaje: MENSAJE_SIN_API };
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

/**
 * `GET /cuentas/:id`, también archivada. `null` si no existe, es de otro
 * usuario o es un préstamo (`404 CUENTA_NO_ENCONTRADA`).
 */
export async function obtenerCuenta(id: string): Promise<Cuenta | null> {
  return conSesion(() => api.obtenerCuenta(id));
}

/** Lista de cuentas no archivadas del usuario. */
export async function obtenerCuentas(): Promise<ListaCuentas> {
  return conSesion(() => api.listarCuentas());
}

/** Cuentas archivadas, la más reciente primero. */
export async function listarArchivadas(): Promise<Cuenta[]> {
  return conSesion(() => api.listarArchivadas());
}

export async function crearCuenta(alta: AltaCuenta): Promise<Cuenta> {
  return conSesion(() => api.crearCuenta(alta));
}

export async function editarCuenta(id: string, edicion: EdicionCuenta): Promise<Cuenta> {
  return conSesion(() => api.editarCuenta(id, edicion));
}

export async function archivarCuenta(id: string): Promise<Cuenta> {
  return conSesion(() => api.archivarCuenta(id));
}

export async function restaurarCuenta(id: string, nombre?: string): Promise<Cuenta> {
  return conSesion(() => api.restaurarCuenta(id, nombre));
}

export async function eliminarCuenta(id: string): Promise<void> {
  return conSesion(() => api.eliminarCuenta(id));
}

/**
 * Un `PUT /cuentas/orden` por cambio, en orden. Se detiene en el primer error
 * y lo relanza. Cada `PUT` es atómico e idempotente en la API: reintentar es seguro.
 */
export async function guardarOrden(cambios: readonly CambioOrden[]): Promise<void> {
  for (const { naturaleza, ids } of cambios) {
    await api.guardarOrdenGrupo(naturaleza, ids);
  }
}
