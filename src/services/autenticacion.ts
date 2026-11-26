/**
 * Casos de uso de acceso: orquestan dominio (validación) y repositorio, y
 * traducen los códigos de error de Supabase a mensajes para el usuario.
 */
import {
  validarCredenciales,
  validarRegistro,
  type ErrorCredenciales,
} from "@/domain/autenticacion/credenciales";
import { MENSAJE_SIN_API } from "@/lib/sin-conexion";
import * as repositorio from "@/repositories/supabase/autenticacion";
import type { TipoEnlace } from "@/repositories/supabase/autenticacion";

export const MENSAJES = {
  credenciales: "Correo o contraseña incorrectos.",
  sinConfirmar: "Confirma tu correo antes de entrar.",
  correoInvalido: "Escribe un correo válido.",
  contrasenaCorta: "La contraseña debe tener al menos 8 caracteres.",
  contrasenasDistintas: "Las contraseñas no coinciden.",
  generico: MENSAJE_SIN_API,
  enlaceInvalido: "El enlace de confirmación no es válido o venció.",
} as const;

export type ResultadoError = { tipo: "error"; mensaje: string; correo: string };
export type ResultadoEntrar = { tipo: "exito" } | ResultadoError;
export type ResultadoRegistro = { tipo: "revisa_correo"; correo: string } | ResultadoError;

const MENSAJE_POR_ERROR: Record<ErrorCredenciales, string> = {
  correo_invalido: MENSAJES.correoInvalido,
  contrasena_corta: MENSAJES.contrasenaCorta,
  contrasenas_distintas: MENSAJES.contrasenasDistintas,
};

// Prioridad al mostrar un solo mensaje: el primero de la lista de errores.
function mensajeDeValidacion(errores: ErrorCredenciales[]): string {
  return MENSAJE_POR_ERROR[errores[0]];
}

function mensajeDeSupabase(codigo: string): string {
  switch (codigo) {
    case "invalid_credentials":
      return MENSAJES.credenciales;
    case "email_not_confirmed":
      return MENSAJES.sinConfirmar;
    default:
      return MENSAJES.generico;
  }
}

export async function entrar(correo: string, contrasena: string): Promise<ResultadoEntrar> {
  const validacion = validarCredenciales(correo, contrasena);
  if (!validacion.ok) {
    return { tipo: "error", mensaje: mensajeDeValidacion(validacion.errores), correo };
  }

  const { error } = await repositorio.iniciarSesion(validacion.correo, contrasena);
  if (error) {
    return { tipo: "error", mensaje: mensajeDeSupabase(error.codigo), correo };
  }
  return { tipo: "exito" };
}

export async function registrar(
  correo: string,
  contrasena: string,
  confirmacion: string,
  urlConfirmacion: string,
): Promise<ResultadoRegistro> {
  const validacion = validarRegistro(correo, contrasena, confirmacion);
  if (!validacion.ok) {
    return { tipo: "error", mensaje: mensajeDeValidacion(validacion.errores), correo };
  }

  const { error } = await repositorio.registrar(validacion.correo, contrasena, urlConfirmacion);
  // Un correo ya registrado responde igual que uno nuevo: no revela qué correos existen.
  if (error && error.codigo !== "user_already_exists") {
    return { tipo: "error", mensaje: mensajeDeSupabase(error.codigo), correo };
  }
  return { tipo: "revisa_correo", correo: validacion.correo };
}

/**
 * `true` si el enlace verificó y la sesión quedó iniciada.
 *
 * El token es de un solo uso: si el enlace se abre otra vez (doble clic,
 * recarga, precarga del navegador) y ya hay sesión, no se vuelve a consumir
 * y se da por bueno en lugar de mostrar un error falso.
 */
export async function confirmarEnlace(tokenHash: string, tipo: TipoEnlace): Promise<boolean> {
  if (await repositorio.haySesion()) return true;

  const { error } = await repositorio.verificarEnlace(tokenHash, tipo);
  return error === null;
}

export async function salir(): Promise<void> {
  await repositorio.cerrarSesion();
}
