/**
 * Entrada compartida por las server actions de movimientos (captura y
 * edición). Sin "use server": son utilidades, no acciones.
 */
import { unstable_rethrow } from "next/navigation";
import { ErrorApi, type CampoCaptura, type MovimientoCuerpo, type TipoMovimiento } from "@/services/movimientos";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MONTO = /^\d{1,19}$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const TIPOS: readonly TipoMovimiento[] = ["gasto", "ingreso", "transferencia"];

export const MENSAJE_SIN_CONEXION = "No pudimos conectar. Intenta de nuevo.";
const MENSAJE_ENTRADA = "No pudimos procesar los datos. Intenta de nuevo.";

/**
 * Lo que registrar, editar y eliminar cambian: la lista del mes, los saldos
 * (N-20), el resumen y los recurrentes (borrar o editar un confirmado cambia
 * la bandeja y el estimado).
 */
export const RUTAS_AFECTADAS = ["/movimientos", "/cuentas", "/resumen", "/recurrentes"] as const;

export type Fallo = { ok: false; codigo: string; mensaje: string; campo?: CampoCaptura };

export const ENTRADA_INVALIDA: Fallo = { ok: false, codigo: "ENTRADA_INVALIDA", mensaje: MENSAJE_ENTRADA };

/** Campo de la API → campo del formulario. `cuentaDestinoId` depende del tipo; `partes.N.monto` va a `partes`. */
function campoFormulario(campo: string | undefined, tipo: TipoMovimiento | null): CampoCaptura | undefined {
  if (campo !== undefined && /^partes(\.\d+\.\w+)?$/.test(campo)) return "partes";
  switch (campo) {
    case "tipo":
    case "monto":
    case "fecha":
    case "descripcion":
    case "nota":
      return campo;
    case "categoriaId":
      return "categoria";
    case "cuentaOrigenId":
      return "cuenta";
    case "cuentaDestinoId":
      return tipo === "transferencia" ? "destino" : "cuenta";
    default:
      return undefined;
  }
}

/**
 * Traduce un error a un fallo: el `mensaje` de la API bajo su campo, o
 * general si no trae campo. Sin conexión o error desconocido, texto local.
 * Las redirecciones de Next (sesión vencida) se relanzan.
 */
export function fallo(error: unknown, tipo: TipoMovimiento | null = null, sinConexion = MENSAJE_SIN_CONEXION): Fallo {
  unstable_rethrow(error);
  if (!(error instanceof ErrorApi) || error.codigo === "SIN_CONEXION") {
    return { ok: false, codigo: error instanceof ErrorApi ? error.codigo : "ERROR_INTERNO", mensaje: sinConexion };
  }
  const campo = campoFormulario(error.campo, tipo);
  return campo
    ? { ok: false, codigo: error.codigo, mensaje: error.message, campo }
    : { ok: false, codigo: error.codigo, mensaje: error.message };
}

export function esTipo(valor: unknown): valor is TipoMovimiento {
  return typeof valor === "string" && (TIPOS as readonly string[]).includes(valor);
}

export function esId(valor: unknown): valor is string {
  return typeof valor === "string" && UUID.test(valor);
}

function esTextoOpcional(valor: unknown): valor is string | null | undefined {
  return valor === undefined || valor === null || typeof valor === "string";
}

function esIdOpcional(valor: unknown): valor is string | null | undefined {
  return valor === undefined || valor === null || esId(valor);
}

/** `partes`: ausente, `null` o lista de `{ categoriaId: uuid, monto: entero }`. Se copian solo esos campos. */
function partesValidas(valor: unknown): { categoriaId: string; monto: string }[] | null | undefined | false {
  if (valor === undefined || valor === null) return valor;
  if (!Array.isArray(valor)) return false;
  const partes: { categoriaId: string; monto: string }[] = [];
  for (const parte of valor as unknown[]) {
    if (!parte || typeof parte !== "object") return false;
    const { categoriaId, monto } = parte as Record<string, unknown>;
    if (!esId(categoriaId) || typeof monto !== "string" || !MONTO.test(monto)) return false;
    partes.push({ categoriaId, monto });
  }
  return partes;
}

/** Valida la forma del cuerpo (viene del navegador). El contenido lo valida la API. */
export function cuerpoValido(entrada: unknown): MovimientoCuerpo | null {
  if (!entrada || typeof entrada !== "object") return null;
  const { tipo, monto, fecha, descripcion, nota, cuentaOrigenId, cuentaDestinoId, categoriaId, partes } = entrada as Record<string, unknown>;
  if (!esTipo(tipo) || typeof monto !== "string" || !MONTO.test(monto)) return null;
  if (fecha !== undefined && (typeof fecha !== "string" || !FECHA.test(fecha))) return null;
  if (!esTextoOpcional(descripcion) || !esTextoOpcional(nota)) return null;
  if (!esIdOpcional(cuentaOrigenId) || !esIdOpcional(cuentaDestinoId) || !esIdOpcional(categoriaId)) return null;
  const partesCopiadas = partesValidas(partes);
  if (partesCopiadas === false) return null;

  // Se copian solo los campos conocidos.
  const cuerpo: MovimientoCuerpo = { tipo, monto, descripcion, nota };
  if (fecha !== undefined) cuerpo.fecha = fecha;
  if (cuentaOrigenId !== undefined) cuerpo.cuentaOrigenId = cuentaOrigenId;
  if (cuentaDestinoId !== undefined) cuerpo.cuentaDestinoId = cuentaDestinoId;
  if (categoriaId !== undefined) cuerpo.categoriaId = categoriaId;
  if (partesCopiadas !== undefined) cuerpo.partes = partesCopiadas;
  return cuerpo;
}
