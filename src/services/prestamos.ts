import { redirect } from "next/navigation";
import type { CampoAbono, CampoAlta, CampoEdicion, ValoresAbono, ValoresAlta, ValoresEdicion } from "@/domain/prestamo/formulario";
import { leerCaptura } from "@/repositories/api/captura";
import { ErrorApi } from "@/repositories/api/cliente";
import { listarCuentas } from "@/repositories/api/cuentas";
import { eliminarMovimiento, type Movimiento } from "@/repositories/api/movimientos";
import * as api from "@/repositories/api/prestamos";
import type {
  AbonoCuerpo,
  CondonacionCuerpo,
  DesembolsoCuerpo,
  EstadoPrestamo,
  MovimientoPrestamo,
  Prestamo,
  PrestamoCambio,
  PrestamoCuerpo,
  PrestamoDetalle,
  Prestamos,
  PropuestaAbono,
  Ref,
  TipoPrestamo,
} from "@/repositories/api/prestamos";
import type { DatosCaptura } from "./captura";
import { MENSAJE_SIN_API } from "@/lib/sin-conexion";

export type {
  AbonoCuerpo,
  CampoAbono,
  CampoAlta,
  CampoEdicion,
  CondonacionCuerpo,
  DesembolsoCuerpo,
  EstadoPrestamo,
  Movimiento,
  MovimientoPrestamo,
  Prestamo,
  PrestamoCambio,
  PrestamoCuerpo,
  PrestamoDetalle,
  Prestamos,
  PropuestaAbono,
  Ref,
  TipoPrestamo,
  ValoresAbono,
  ValoresAlta,
  ValoresEdicion,
};
export { ErrorApi };

/** Campo de la condonación donde va un error de la API. */
export type CampoCondonacion = "monto" | "categoria";

type Fallo<C extends string = never> = { ok: false; codigo: string; mensaje: string; campo?: C };

/** Alta o desembolso: el `id` del préstamo para abrir su detalle. Nunca lanza al cliente. */
export type ResultadoPrestamo = { ok: true; id: string } | Fallo<CampoAlta>;
export type ResultadoPropuesta = { ok: true; propuesta: PropuestaAbono } | Fallo<CampoAbono>;
export type ResultadoAbono = { ok: true } | Fallo<CampoAbono>;
export type ResultadoEdicionPrestamo = { ok: true } | Fallo<CampoEdicion>;
/** Condonar: el gasto creado; su `id` sirve para deshacer. */
export type ResultadoCondonacion = { ok: true; movimiento: Movimiento } | Fallo<CampoCondonacion>;
export type ResultadoSimple = { ok: true } | Fallo;

/** Cuentas activas y categorías del formulario, y el patrimonio para «Qué cambia» de la condonación. */
export type DatosFormularioPrestamo = DatosCaptura & { patrimonioNeto: bigint };


/* Campo de la API → campo del formulario. Lo que no está aquí va al pie. */
export const CAMPOS_ALTA: Record<string, CampoAlta> = {
  tipo: "tipo",
  nombre: "nombre",
  monto: "monto",
  cuentaId: "cuentaId",
  fecha: "fecha",
  tasaMensual: "tasaMensual",
  fechaAcordada: "fechaAcordada",
};
/** La propuesta reparte el total: sus errores de monto y capital van bajo «Total». */
export const CAMPOS_PROPUESTA: Record<string, CampoAbono> = { fecha: "fecha", monto: "total", capital: "total" };
export const CAMPOS_ABONO: Record<string, CampoAbono> = { cuentaId: "cuentaId", fecha: "fecha", capital: "capital", interes: "interes" };
export const CAMPOS_EDICION: Record<string, CampoEdicion> = { nombre: "nombre", fechaAcordada: "fechaAcordada" };
export const CAMPOS_CONDONACION: Record<string, CampoCondonacion> = { monto: "monto", categoriaId: "categoria" };

/**
 * Traduce un error al fallo de una acción: el `mensaje` de la API, bajo su
 * campo si el formulario lo tiene. Sin conexión o error desconocido, texto
 * local. Las redirecciones de Next no llegan aquí: se relanzan antes.
 */
export function falloDeError<C extends string = never>(error: unknown, campos: Record<string, C> = {}): Fallo<C> {
  if (!(error instanceof ErrorApi) || error.codigo === "SIN_CONEXION") {
    return { ok: false, codigo: error instanceof ErrorApi ? error.codigo : "ERROR_INTERNO", mensaje: MENSAJE_SIN_API };
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

/** `GET /prestamos`: consolidado y lista. */
export async function obtenerPrestamos(): Promise<Prestamos> {
  return conSesion(() => api.listarPrestamos());
}

/** `GET /prestamos/:id`. `null` si no existe (la página vuelve a `/deudas`). */
export async function obtenerPrestamo(id: string): Promise<PrestamoDetalle | null> {
  return conSesion(() => api.leerPrestamo(id));
}

/** `GET /captura` y `GET /cuentas` en paralelo: cuentas activas, categorías y patrimonio neto. */
export async function cargarFormulario(): Promise<DatosFormularioPrestamo> {
  return conSesion(async () => {
    const [captura, lista] = await Promise.all([leerCaptura(), listarCuentas()]);
    return { captura, cuentas: [...lista.activos.cuentas, ...lista.pasivos.cuentas], patrimonioNeto: lista.patrimonioNeto };
  });
}

export async function crear(cuerpo: PrestamoCuerpo): Promise<PrestamoDetalle> {
  return conSesion(() => api.crearPrestamo(cuerpo));
}

export async function desembolsar(id: string, cuerpo: DesembolsoCuerpo): Promise<PrestamoDetalle> {
  return conSesion(() => api.desembolsar(id, cuerpo));
}

export async function editar(id: string, cambio: PrestamoCambio): Promise<PrestamoDetalle> {
  return conSesion(() => api.cambiarPrestamo(id, cambio));
}

export async function proponerAbono(id: string, fecha: string, monto: string): Promise<PropuestaAbono> {
  return conSesion(() => api.proponerAbono(id, fecha, monto));
}

export async function abonar(id: string, cuerpo: AbonoCuerpo): Promise<PrestamoDetalle> {
  return conSesion(() => api.abonar(id, cuerpo));
}

export async function condonar(id: string, cuerpo: CondonacionCuerpo): Promise<Movimiento> {
  return conSesion(() => api.condonar(id, cuerpo));
}

/** Deshacer una condonación: `DELETE /movimientos/:id` con el `id` del gasto. */
export async function deshacerCondonacion(movimientoId: string): Promise<void> {
  return conSesion(() => eliminarMovimiento(movimientoId));
}
