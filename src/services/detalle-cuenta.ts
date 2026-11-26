import { redirect } from "next/navigation";
import { enLotes } from "@/domain/cuenta/detalle";
import { ErrorApi } from "@/repositories/api/cliente";
import * as api from "@/repositories/api/detalle-cuenta";
import type { Ciclo, CicloTarjeta, Compra, FilaCiclo, FilaHistorial, Historial } from "@/repositories/api/detalle-cuenta";
import { MENSAJE_SIN_API } from "@/lib/sin-conexion";

export type { Ciclo, CicloTarjeta, Compra, FilaCiclo, FilaHistorial, Historial };
export { ErrorApi };

/** Resultado de las server actions del detalle. Nunca lanzan al cliente. */
export type ResultadoSimple = { ok: true } | { ok: false; codigo: string; mensaje: string };
export type ResultadoAjuste = { ok: true } | { ok: false; codigo: string; mensaje: string; campo?: "saldoReal" };
export type ResultadoCompra = { ok: true; compra: Compra | null } | { ok: false; codigo: string; mensaje: string };


/** Ruta del detalle de una cuenta. */
export function rutaDetalle(id: string, consulta: Record<string, string | undefined> = {}): string {
  const parametros = new URLSearchParams();
  for (const [clave, valor] of Object.entries(consulta)) if (valor !== undefined) parametros.set(clave, valor);
  const texto = parametros.toString();
  return `/cuentas/${encodeURIComponent(id)}${texto ? `?${texto}` : ""}`;
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

/** Error → resultado con el `mensaje` de la API; sin conexión, texto local. */
export function falloDe(error: unknown, sinConexion = MENSAJE_SIN_API): { ok: false; codigo: string; mensaje: string; campo?: string } {
  if (!(error instanceof ErrorApi) || error.codigo === "SIN_CONEXION") {
    return { ok: false, codigo: error instanceof ErrorApi ? error.codigo : "ERROR_INTERNO", mensaje: sinConexion };
  }
  return error.campo === undefined
    ? { ok: false, codigo: error.codigo, mensaje: error.message }
    : { ok: false, codigo: error.codigo, mensaje: error.message, campo: error.campo };
}

/**
 * `GET /cuentas/:id/historial` con el rango de la URL, tal cual. Una fecha
 * mal formada o un rango al revés (`FECHA_INVALIDA`, `RANGO_INVALIDO`)
 * vuelven al detalle sin rango.
 */
export async function obtenerHistorial(id: string, rango: { desde?: string; hasta?: string }): Promise<Historial> {
  try {
    return await conSesion(() => api.obtenerHistorial(id, rango));
  } catch (error) {
    if (error instanceof ErrorApi && (error.codigo === "FECHA_INVALIDA" || error.codigo === "RANGO_INVALIDO")) redirect(rutaDetalle(id));
    throw error;
  }
}

/** `GET /cuentas/:id/ciclo`, con `?compra=` si se simula una compra. */
export async function obtenerCiclo(id: string, compra?: string): Promise<CicloTarjeta> {
  return conSesion(() => api.obtenerCiclo(id, compra));
}

/**
 * `PUT /cuentas/:id/conciliacion`. Más de 500 ids se parten en lotes de 500
 * en secuencia (el tope de la API); se detiene en el primer error y lo relanza.
 */
export async function conciliar(id: string, movimientoIds: readonly string[], conciliado: boolean): Promise<void> {
  for (const lote of enLotes(movimientoIds)) {
    await conSesion(() => api.conciliar(id, { movimientoIds: lote, conciliado }));
  }
}

/** `POST /cuentas/:id/ajustes`. La API fija la diferencia con su saldo a hoy. */
export async function registrarAjuste(id: string, saldoReal: string, conciliarHastaHoy: boolean): Promise<void> {
  await conSesion(() => api.registrarAjuste(id, { saldoReal, conciliarHastaHoy }));
}
