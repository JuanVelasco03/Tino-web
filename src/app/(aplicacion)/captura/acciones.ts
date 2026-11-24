"use server";

import * as captura from "@/services/captura";
import type { ResultadoCarga, ResultadoSugerencias } from "@/services/captura";
import * as movimientos from "@/services/movimientos";
import type { MovimientoCuerpo, ResultadoRegistro, ResultadoSimple, TipoCaptura } from "@/services/movimientos";
import * as perfil from "@/services/perfil";
import { cuerpoValido, ENTRADA_INVALIDA, esId, esTipo, fallo, revalidarAfectadas } from "./entrada";

const MENSAJE_CARGA = "No pudimos cargar el formulario.";

/** `GET /captura` y `GET /cuentas` al abrir el formulario. */
export async function cargarCaptura(): Promise<ResultadoCarga> {
  try {
    return { ok: true, ...(await captura.cargar()) };
  } catch (error) {
    const { codigo } = fallo(error);
    return { ok: false, codigo, mensaje: MENSAJE_CARGA };
  }
}

/** `GET /sugerencias` mientras se escribe la descripción. */
export async function sugerir(tipo: TipoCaptura, texto: string): Promise<ResultadoSugerencias> {
  if (!esTipo(tipo) || typeof texto !== "string") return ENTRADA_INVALIDA;
  try {
    return { ok: true, sugerencias: await captura.sugerir(tipo, texto) };
  } catch (error) {
    const { codigo, mensaje } = fallo(error, tipo);
    return { ok: false, codigo, mensaje };
  }
}

/** `POST /movimientos`. Revalida la lista del mes y los saldos. */
export async function registrarMovimiento(entrada: MovimientoCuerpo): Promise<ResultadoRegistro> {
  const cuerpo = cuerpoValido(entrada);
  if (!cuerpo) return ENTRADA_INVALIDA;

  let movimiento: movimientos.Movimiento;
  try {
    movimiento = await movimientos.registrar(cuerpo);
  } catch (error) {
    return fallo(error, cuerpo.tipo);
  }
  revalidarAfectadas();
  return { ok: true, movimiento };
}

/** «Deshacer»: `DELETE /movimientos/:id`, registrado en la API (RN-13). */
export async function deshacerRegistro(id: string): Promise<ResultadoSimple> {
  if (!esId(id)) return ENTRADA_INVALIDA;
  try {
    await movimientos.eliminar(id);
  } catch (error) {
    const { codigo, mensaje } = fallo(error);
    return { ok: false, codigo, mensaje };
  }
  revalidarAfectadas();
  return { ok: true };
}

/** `POST /reglas`: el usuario aceptó la oferta de crear la regla (RN-11). */
export async function crearRegla(palabraClave: string, categoriaId: string): Promise<ResultadoSimple> {
  if (typeof palabraClave !== "string" || !esId(categoriaId)) return ENTRADA_INVALIDA;
  try {
    await captura.crearRegla(palabraClave, categoriaId);
  } catch (error) {
    const { codigo, mensaje } = fallo(error);
    return { ok: false, codigo, mensaje };
  }
  return { ok: true };
}

/** `PATCH /reglas/:id`: el usuario aceptó cambiar la regla que propuso. */
export async function ajustarRegla(id: string, categoriaId: string): Promise<ResultadoSimple> {
  if (!esId(id) || !esId(categoriaId)) return ENTRADA_INVALIDA;
  try {
    await captura.ajustarRegla(id, categoriaId);
  } catch (error) {
    const { codigo, mensaje } = fallo(error);
    return { ok: false, codigo, mensaje };
  }
  return { ok: true };
}

/** «Usar {cuenta} siempre»: `PATCH /perfil` → `cuentaPredeterminadaId` (N-34). */
export async function elegirPredeterminada(cuentaId: string): Promise<ResultadoSimple> {
  if (!esId(cuentaId)) return ENTRADA_INVALIDA;
  try {
    await perfil.elegirPredeterminada(cuentaId);
  } catch (error) {
    const { codigo, mensaje } = fallo(error);
    return { ok: false, codigo, mensaje };
  }
  return { ok: true };
}
