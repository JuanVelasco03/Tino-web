import { redirect } from "next/navigation";
import type { CampoCaptura, CuerpoMovimiento, ValoresCaptura } from "@/domain/movimiento/cuerpo";
import { ErrorApi } from "@/repositories/api/cliente";
import * as api from "@/repositories/api/movimientos";
import type { ListaMovimientos, Movimiento, MovimientoCuerpo, Parte, Ref, TipoCaptura, TipoMovimiento } from "@/repositories/api/movimientos";

export type { CampoCaptura, CuerpoMovimiento, ListaMovimientos, Movimiento, MovimientoCuerpo, Parte, Ref, TipoCaptura, TipoMovimiento, ValoresCaptura };
export { ErrorApi };

/** Resultado de registrar. Nunca lanza al cliente. */
export type ResultadoRegistro =
  | { ok: true; movimiento: Movimiento }
  | { ok: false; codigo: string; mensaje: string; campo?: CampoCaptura };

/** Resultado de guardar una edición. Nunca lanza al cliente. */
export type ResultadoGuardado = ResultadoRegistro;

export type ResultadoSimple = { ok: true } | { ok: false; codigo: string; mensaje: string };

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
 * Movimientos de un mes (N-05). Sin `mes`, el actual en la zona del usuario
 * (N-04). Un mes que la API rechaza (`MES_INVALIDO`) vuelve a `/movimientos`.
 */
export async function listarDelMes(mes?: string): Promise<ListaMovimientos> {
  try {
    return await conSesion(() => api.listarMovimientos(mes));
  } catch (error) {
    if (error instanceof ErrorApi && error.codigo === "MES_INVALIDO") redirect("/movimientos");
    throw error;
  }
}

/** `PUT /movimientos/:id` con el cuerpo completo (N-16). */
export async function editar(id: string, cuerpo: MovimientoCuerpo): Promise<Movimiento> {
  return conSesion(() => api.reemplazarMovimiento(id, cuerpo));
}

/** `POST /movimientos`. El dominio arma el cuerpo con la forma del contrato. */
export async function registrar(cuerpo: MovimientoCuerpo): Promise<Movimiento> {
  return conSesion(() => api.crearMovimiento(cuerpo));
}

export async function eliminar(id: string): Promise<void> {
  return conSesion(() => api.eliminarMovimiento(id));
}
