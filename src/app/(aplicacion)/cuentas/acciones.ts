"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { aDigitos } from "@/domain/dinero/entrada";
import * as cuentas from "@/services/cuentas";
import type {
  AltaCuenta,
  CambioOrden,
  CampoCuenta,
  EdicionCuenta,
  ResultadoCuenta,
  ResultadoOrden,
  TipoCuenta,
  ValoresCuenta,
} from "@/services/cuentas";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TIPOS: readonly TipoCuenta[] = ["efectivo", "banco", "tarjeta_credito"];

const MENSAJE_FALLO = "No pudimos guardar el orden. Intenta de nuevo.";
const MENSAJE_MONTO = "Escribe un valor en pesos, sin decimales.";
const MENSAJE_ENTRADA = "No pudimos procesar los datos. Intenta de nuevo.";

/** Valida la forma de la entrada (viene del navegador). El contenido lo valida la API. */
function esCambiosValidos(entrada: unknown): entrada is CambioOrden[] {
  if (!Array.isArray(entrada) || entrada.length < 1 || entrada.length > 2) return false;

  const vistas = new Set<string>();
  for (const cambio of entrada as unknown[]) {
    if (!cambio || typeof cambio !== "object") return false;
    const { naturaleza, ids } = cambio as Record<string, unknown>;
    if (naturaleza !== "activo" && naturaleza !== "pasivo") return false;
    if (vistas.has(naturaleza)) return false;
    vistas.add(naturaleza);
    if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string" && UUID.test(id))) return false;
  }
  return true;
}

/**
 * Guarda el orden de uno o dos grupos (`PUT /cuentas/orden` por grupo).
 * Nunca lanza al cliente: devuelve `ResultadoOrden`.
 */
export async function guardarOrden(cambios: CambioOrden[]): Promise<ResultadoOrden> {
  if (!esCambiosValidos(cambios)) {
    return { ok: false, codigo: "ENTRADA_INVALIDA", mensaje: MENSAJE_FALLO };
  }

  try {
    await cuentas.guardarOrden(cambios.map(({ naturaleza, ids }) => ({ naturaleza, ids: [...ids] })));
  } catch (error) {
    if (error instanceof cuentas.ErrorApi && error.codigo !== "SIN_CONEXION") {
      return { ok: false, codigo: error.codigo, mensaje: error.message };
    }
    return {
      ok: false,
      codigo: error instanceof cuentas.ErrorApi ? error.codigo : "ERROR_INTERNO",
      mensaje: MENSAJE_FALLO,
    };
  }

  revalidatePath("/cuentas");
  return { ok: true };
}

/* ── Alta, edición, archivo y borrado ─────────────────────────────────── */

const ENTRADA_INVALIDA: ResultadoCuenta = { ok: false, codigo: "ENTRADA_INVALIDA", mensaje: MENSAJE_ENTRADA };

function montoInvalido(campo: Extract<CampoCuenta, "saldo" | "cupo">): ResultadoCuenta {
  return { ok: false, codigo: "MONTO_INVALIDO", mensaje: MENSAJE_MONTO, campo };
}

function esTipo(valor: unknown): valor is TipoCuenta {
  return typeof valor === "string" && (TIPOS as readonly string[]).includes(valor);
}

function esId(id: unknown): id is string {
  return typeof id === "string" && UUID.test(id);
}

/** Llama a la API y traduce el resultado. Redirecciones de Next (sesión vencida) se relanzan. */
async function ejecutar(llamada: () => Promise<unknown>, rutas: readonly string[]): Promise<ResultadoCuenta> {
  try {
    await llamada();
  } catch (error) {
    unstable_rethrow(error);
    return cuentas.resultadoDeError(error);
  }
  for (const ruta of rutas) revalidatePath(ruta);
  return { ok: true };
}

/** `POST /cuentas` desde los valores del formulario. Un saldo vacío vale 0 (C4 lo muestra como «0»). */
export async function crearCuenta(valores: ValoresCuenta): Promise<ResultadoCuenta> {
  if (!valores || typeof valores !== "object") return ENTRADA_INVALIDA;
  const { nombre, tipo, detalle, saldo, cupo } = valores as Record<string, unknown>;
  if (typeof nombre !== "string" || typeof detalle !== "string") return ENTRADA_INVALIDA;
  if (typeof saldo !== "string" || typeof cupo !== "string" || !esTipo(tipo)) return ENTRADA_INVALIDA;

  const saldoInicial = saldo.trim() === "" ? "0" : aDigitos(saldo);
  if (saldoInicial === null) return montoInvalido("saldo");

  const alta: AltaCuenta = { nombre, tipo, saldoInicial };
  if (detalle.trim() !== "") alta.detalle = detalle;

  if (tipo === "tarjeta_credito" && cupo.trim() !== "") {
    // Sin cupo, la API responde `CUPO_REQUERIDO` bajo «Cupo total».
    const digitosCupo = aDigitos(cupo);
    if (digitosCupo === null) return montoInvalido("cupo");
    alta.cupo = digitosCupo;
  }

  return ejecutar(() => cuentas.crearCuenta(alta), ["/cuentas", "/resumen"]);
}

/** `PATCH /cuentas/:id` con solo los campos que cambian. */
export async function editarCuenta(id: string, cambios: EdicionCuenta): Promise<ResultadoCuenta> {
  if (!esId(id) || !cambios || typeof cambios !== "object") return ENTRADA_INVALIDA;
  const entrada = cambios as Record<string, unknown>;
  const edicion: EdicionCuenta = {};

  if ("nombre" in entrada) {
    if (typeof entrada.nombre !== "string") return ENTRADA_INVALIDA;
    edicion.nombre = entrada.nombre;
  }
  if ("tipo" in entrada) {
    if (!esTipo(entrada.tipo)) return ENTRADA_INVALIDA;
    edicion.tipo = entrada.tipo;
  }
  if ("detalle" in entrada) {
    if (entrada.detalle !== null && typeof entrada.detalle !== "string") return ENTRADA_INVALIDA;
    edicion.detalle = entrada.detalle;
  }
  if ("saldoInicial" in entrada) {
    const digitos = typeof entrada.saldoInicial === "string" ? aDigitos(entrada.saldoInicial) : null;
    if (digitos === null) return montoInvalido("saldo");
    edicion.saldoInicial = digitos;
  }
  if ("cupo" in entrada) {
    const digitos = typeof entrada.cupo === "string" ? aDigitos(entrada.cupo) : null;
    if (digitos === null) return montoInvalido("cupo");
    edicion.cupo = digitos;
  }

  return ejecutar(() => cuentas.editarCuenta(id, edicion), ["/cuentas", "/resumen", "/recurrentes"]);
}

/** `POST /cuentas/:id/archivar`. Sale de la lista y aparece en archivadas. */
export async function archivarCuenta(id: string): Promise<ResultadoCuenta> {
  if (!esId(id)) return ENTRADA_INVALIDA;
  return ejecutar(() => cuentas.archivarCuenta(id), ["/cuentas", "/cuentas/archivadas", "/resumen", "/recurrentes"]);
}

/** `DELETE /cuentas/:id`. La confirmación ya la pidió el panel. */
export async function eliminarCuenta(id: string): Promise<ResultadoCuenta> {
  if (!esId(id)) return ENTRADA_INVALIDA;
  return ejecutar(() => cuentas.eliminarCuenta(id), ["/cuentas", "/resumen", "/recurrentes"]);
}
