/**
 * Formularios de metas: alta y edición de la meta, aporte y retiro. Valores
 * tecleados (texto) → cuerpos del contrato. Montos como string entero, nunca
 * `number` (REGLAS §6). Filtrar cuentas aquí es presentación: la API valida
 * igual (`CUENTA_NO_ADMITIDA`, `CUENTA_CON_META_EXCLUSIVA`).
 */
import { aDigitos, desdeMonto } from "../dinero/entrada";
import type { Moneda } from "../dinero/formato";
import { montoValido } from "../movimiento/cuerpo";
import type { AporteCuerpo, Meta, MetaCambio, MetaCuerpo, MetaDetalle, ModoMeta } from "./tipos";

export type Precision = "ninguna" | "dia" | "mes";

/** Lo que el formulario necesita de una cuenta de `GET /cuentas`. */
type CuentaFiltrable = { id: string; tipo: string; moneda: Moneda };

export type ValoresMeta = {
  nombre: string;
  modo: ModoMeta;
  cuentaId: string | null;
  /** Lo tecleado ya formateado: `"7.500.000"`. */
  objetivo: string;
  precision: Precision;
  /** El valor del input: `"YYYY-MM-DD"` (día) o `"YYYY-MM"` (mes); `""` sin elegir. */
  fecha: string;
  /** Solo en el alta por apartado. `""` = sin apartado inicial. */
  aporteInicial: string;
  /** Origen del apartado inicial; `null` = «Ya está en {cuenta}» (sin transferencia). */
  origenId: string | null;
};

export type CampoMeta = "nombre" | "modo" | "cuentaId" | "objetivo" | "fechaMeta" | "aporteInicial" | "cuentaOrigenId";

export type ValoresAporte = {
  /** El modo de la meta: en `cuenta`, el origen es obligatorio. */
  modo: ModoMeta;
  tipo: "aporte" | "retiro";
  monto: string;
  fecha: string;
  /** `null` = «Ya está en {cuenta}» (solo en `apartado`). */
  origenId: string | null;
  motivo: string;
};

export type CampoAporte = "tipo" | "monto" | "fecha" | "cuentaOrigenId" | "motivo";

export const MENSAJES = {
  nombre: "Escribe un nombre de 1 a 60 caracteres.",
  cuenta: "Elige la cuenta.",
  monto: "Escribe un valor en pesos, sin decimales.",
  fechaMeta: "Elige la fecha meta.",
  fecha: "Elige la fecha.",
  origen: "Elige la cuenta de origen.",
  motivo: "El motivo tiene de 1 a 80 caracteres.",
} as const;

/** `null` → «ninguna» · `"YYYY-MM"` → «mes» · `"YYYY-MM-DD"` → «dia». */
export function precisionDe(fechaMeta: string | null): Precision {
  if (fechaMeta === null) return "ninguna";
  return fechaMeta.length === 7 ? "mes" : "dia";
}

/** «ninguna» → `null`; si no, el valor del input tal cual (`""` también es `null`). */
export function fechaMetaDesde(precision: Precision, valor: string): string | null {
  if (precision === "ninguna" || valor === "") return null;
  return valor;
}

const TIPOS_POR_MODO: Record<ModoMeta, readonly string[]> = {
  apartado: ["efectivo", "banco"],
  cuenta: ["efectivo", "banco", "inversion"],
};

/**
 * Cuentas que el modo admite (apartado: efectivo y banco; cuenta: también
 * inversión), sin las que una meta sin archivar (otra que la propia) excluye:
 * en apartado, las que tienen una meta de toda la cuenta; en cuenta, las que
 * tienen cualquier meta.
 */
export function cuentasAdmitidas<C extends CuentaFiltrable>(
  modo: ModoMeta,
  cuentas: readonly C[],
  metas: readonly Pick<Meta, "id" | "modo" | "cuenta">[],
  metaId?: string,
): C[] {
  const otras = metas.filter((m) => m.id !== metaId);
  return cuentas.filter((c) => {
    if (!TIPOS_POR_MODO[modo].includes(c.tipo)) return false;
    const deLaCuenta = otras.filter((m) => m.cuenta.id === c.id);
    return modo === "apartado" ? !deLaCuenta.some((m) => m.modo === "cuenta") : deLaCuenta.length === 0;
  });
}

/** Orígenes posibles de un aporte: en COP y distintos de la cuenta de la meta. */
export function cuentasOrigen<C extends CuentaFiltrable>(cuentas: readonly C[], cuentaMetaId: string): C[] {
  return cuentas.filter((c) => c.moneda === "COP" && c.id !== cuentaMetaId);
}

/** Valores de una meta nueva: apartado, sin cuenta ni fecha. */
export function valoresAlta(): ValoresMeta {
  return { nombre: "", modo: "apartado", cuentaId: null, objetivo: "", precision: "ninguna", fecha: "", aporteInicial: "", origenId: null };
}

/** Valores de la edición, con los de la meta. */
export function valoresEdicion(m: Pick<Meta, "nombre" | "modo" | "cuenta" | "objetivo" | "fechaMeta">): ValoresMeta {
  return {
    nombre: m.nombre,
    modo: m.modo,
    cuentaId: m.cuenta.id,
    objetivo: desdeMonto(m.objetivo),
    precision: precisionDe(m.fechaMeta),
    fecha: m.fechaMeta ?? "",
    aporteInicial: "",
    origenId: null,
  };
}

/**
 * Validación previa del alta y la edición. En el alta por apartado, con
 * apartado inicial, lo agrega con su origen (`null` = ya está en la cuenta).
 */
export function validarMeta(v: ValoresMeta, alta: boolean): { cuerpo: MetaCuerpo } | { errores: Partial<Record<CampoMeta, string>> } {
  const errores: Partial<Record<CampoMeta, string>> = {};
  const nombre = v.nombre.trim();
  if (nombre.length < 1 || nombre.length > 60) errores.nombre = MENSAJES.nombre;
  if (v.cuentaId === null) errores.cuentaId = MENSAJES.cuenta;
  const objetivo = montoValido(v.objetivo);
  if (objetivo === null) errores.objetivo = MENSAJES.monto;
  if (v.precision !== "ninguna" && v.fecha === "") errores.fechaMeta = MENSAJES.fechaMeta;

  const conInicial = alta && v.modo === "apartado" && v.aporteInicial.trim() !== "";
  const inicial = conInicial ? montoValido(v.aporteInicial) : null;
  if (conInicial && inicial === null) errores.aporteInicial = MENSAJES.monto;

  if (Object.keys(errores).length > 0 || v.cuentaId === null || objetivo === null) return { errores };

  const cuerpo: MetaCuerpo = { nombre, cuentaId: v.cuentaId, modo: v.modo, objetivo, fechaMeta: fechaMetaDesde(v.precision, v.fecha) };
  if (inicial !== null) cuerpo.aporteInicial = { monto: inicial, cuentaOrigenId: v.origenId };
  return { cuerpo };
}

/**
 * `PATCH /metas/:id` con solo lo que cambió; `null` sin cambios (no se envía).
 * Un objetivo mal escrito cuenta como cambio: la validación previa lo detiene.
 */
export function cambioDesde(original: MetaDetalle, v: ValoresMeta): MetaCambio | null {
  const cambio: MetaCambio = {};
  const nombre = v.nombre.trim();
  if (nombre !== original.nombre) cambio.nombre = nombre;
  if (v.modo !== original.modo) cambio.modo = v.modo;
  if (v.cuentaId !== null && v.cuentaId !== original.cuenta.id) cambio.cuentaId = v.cuentaId;
  const objetivo = aDigitos(v.objetivo);
  if (objetivo !== original.objetivo.toString()) cambio.objetivo = objetivo ?? v.objetivo;
  const fechaMeta = fechaMetaDesde(v.precision, v.fecha);
  if (fechaMeta !== original.fechaMeta) cambio.fechaMeta = fechaMeta;
  return Object.keys(cambio).length === 0 ? null : cambio;
}

/**
 * Validación previa de un aporte o retiro. El retiro no lleva origen; en una
 * meta de toda la cuenta, el aporte lo exige. Sin motivo, `null`.
 */
export function validarAporte(v: ValoresAporte): { cuerpo: AporteCuerpo } | { errores: Partial<Record<CampoAporte, string>> } {
  const errores: Partial<Record<CampoAporte, string>> = {};
  const monto = montoValido(v.monto);
  if (monto === null) errores.monto = MENSAJES.monto;
  if (v.fecha === "") errores.fecha = MENSAJES.fecha;
  if (v.tipo === "aporte" && v.modo === "cuenta" && v.origenId === null) errores.cuentaOrigenId = MENSAJES.origen;
  const motivo = v.motivo.trim();
  if (motivo.length > 80) errores.motivo = MENSAJES.motivo;

  if (Object.keys(errores).length > 0 || monto === null) return { errores };

  const cuerpo: AporteCuerpo = { tipo: v.tipo, monto, fecha: v.fecha, motivo: motivo === "" ? null : motivo };
  if (v.tipo === "aporte" && v.origenId !== null) cuerpo.cuentaOrigenId = v.origenId;
  return { cuerpo };
}
