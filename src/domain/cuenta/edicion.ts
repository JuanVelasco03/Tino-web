/**
 * Formulario de alta y edición de cuentas: valores tecleados y cálculo de lo
 * que cambió. Funciones puras, sin `number` para los montos.
 */
import { aDigitos, aMenores, desdeMonto } from "../dinero/entrada";
import type { Moneda } from "../dinero/formato";

/** Tipos que la API acepta hoy en el alta y la edición. */
export type TipoEditable = "efectivo" | "banco" | "tarjeta_credito";

/** Tipos que el formulario muestra: una inversión se edita aquí, pero su tipo es fijo (`TIPO_DE_INVERSION_FIJO`). */
export type TipoFormulario = TipoEditable | "inversion";

/** Valores del formulario, controlados en el cliente. Los montos son lo tecleado, ya formateado. */
export type ValoresCuenta = {
  nombre: string;
  tipo: TipoFormulario;
  detalle: string;
  /** `"1.284.300"`; en una inversión USD, `"513,61"` (efectivo inicial). */
  saldo: string;
  /** `""` si no es tarjeta. */
  cupo: string;
};

/** Campos de las condiciones de la tarjeta (SPEC 13). `tarjeta`: el bloque entero (`CONDICIONES_REQUERIDAS`). */
export type CampoTarjeta = "diaCorte" | "diaPago" | "tasaMensual" | "cuotaManejo" | "cuentaPagoId";

export type CampoCuenta = "nombre" | "tipo" | "detalle" | "saldo" | "cupo" | CampoTarjeta | "tarjeta";

/** Lo que `cambiosEdicion` lee de una cuenta. `Cuenta` de la web lo cumple. */
export type CuentaEditable = {
  nombre: string;
  tipo: TipoFormulario;
  /** La del saldo inicial; COP si no se indica. */
  moneda?: Moneda;
  detalle: string | null;
  saldoInicial: bigint;
  tarjeta: { cupo: bigint } | null;
};

/**
 * Cambios para `PATCH /cuentas/:id`, con la forma de `EdicionCuenta` del
 * contrato (montos como string entero).
 */
export type CambiosCuenta = {
  nombre?: string;
  tipo?: TipoEditable;
  detalle?: string | null;
  saldoInicial?: string;
  cupo?: string;
};

/**
 * Monto tecleado frente al guardado, en su moneda. Un campo vacío vale 0 (C4
 * lo muestra como «0»). Si no es un monto válido, se devuelve tal cual: la
 * server action lo rechaza bajo su campo.
 */
function montoCambiado(tecleado: string, guardado: bigint, moneda: Moneda = "COP"): string | null {
  const digitos = tecleado.trim() === "" ? "0" : aMenores(tecleado, moneda);
  if (digitos === null) return tecleado;
  return digitos === guardado.toString() ? null : digitos;
}

/**
 * Solo los campos que cambiaron respecto a `cuenta`; `null` si nada cambió.
 * Nombre y detalle se comparan recortados; un detalle vacío equivale a `null`.
 * `cupo` solo cuenta si la cuenta es tarjeta. En una inversión el tipo nunca
 * se envía y el saldo inicial (efectivo inicial) va en unidades menores de su
 * moneda.
 */
export function cambiosEdicion(cuenta: CuentaEditable, valores: ValoresCuenta): CambiosCuenta | null {
  const cambios: CambiosCuenta = {};

  const nombre = valores.nombre.trim();
  if (nombre !== cuenta.nombre) cambios.nombre = nombre;

  if (cuenta.tipo !== "inversion" && valores.tipo !== "inversion" && valores.tipo !== cuenta.tipo) cambios.tipo = valores.tipo;

  const detalle = valores.detalle.trim() === "" ? null : valores.detalle.trim();
  if (detalle !== cuenta.detalle) cambios.detalle = detalle;

  const saldoInicial = montoCambiado(valores.saldo, cuenta.saldoInicial, cuenta.moneda);
  if (saldoInicial !== null) cambios.saldoInicial = saldoInicial;

  if (cuenta.tarjeta) {
    const cupo = montoCambiado(valores.cupo, cuenta.tarjeta.cupo);
    if (cupo !== null) cambios.cupo = cupo;
  }

  return Object.keys(cambios).length === 0 ? null : cambios;
}

/* ── Condiciones de la tarjeta (SPEC 13) ──────────────────────────────── */

/** `CondicionesTarjeta` del contrato (Tino-API SPEC 14). `null` en un opcional lo borra. */
export type CondicionesTarjeta = {
  diaCorte?: number;
  diaPago?: number;
  tasaMensual?: number | null;
  cuotaManejo?: string | null;
  cuentaPagoId?: string | null;
};

/** Lo que el formulario lee de las condiciones guardadas. `Tarjeta` de la web lo cumple. */
export type TarjetaEditable = {
  diaCorte: number | null;
  diaPago: number | null;
  /** Centésimas de punto: 198 = 1,98 %. */
  tasaMensual: number | null;
  cuotaManejo: bigint | null;
  cuentaPago: { id: string } | null;
};

/** Valores tecleados de las condiciones. */
export type ValoresTarjeta = {
  diaCorte: string;
  diaPago: string;
  /** En %, con coma: `"1,98"`. */
  tasa: string;
  /** Pesos formateados: `"26.990"`. */
  cuotaManejo: string;
  cuentaPagoId: string | null;
};

export const MENSAJE_DIA = "Elige un día entre 1 y 31.";
export const MENSAJE_TASA = "Escribe una tasa entre 0 % y 100 %, con hasta dos decimales.";
export const MENSAJE_PESOS = "Escribe un valor en pesos, sin decimales.";

/** Centésimas → texto con coma: 198 → `"1,98"`, 200 → `"2"`, 5 → `"0,05"`, 150 → `"1,5"`. */
function textoTasa(centesimas: number): string {
  const enteros = Math.trunc(centesimas / 100);
  const resto = centesimas % 100;
  if (resto === 0) return String(enteros);
  return `${enteros},${String(resto).padStart(2, "0").replace(/0$/, "")}`;
}

export function valoresTarjetaDesde(t: TarjetaEditable | null): ValoresTarjeta {
  return {
    diaCorte: t?.diaCorte == null ? "" : String(t.diaCorte),
    diaPago: t?.diaPago == null ? "" : String(t.diaPago),
    tasa: t?.tasaMensual == null ? "" : textoTasa(t.tasaMensual),
    cuotaManejo: t?.cuotaManejo == null ? "" : desdeMonto(t.cuotaManejo),
    cuentaPagoId: t?.cuentaPago?.id ?? null,
  };
}

/**
 * Tasa en % (coma o punto decimal) → centésimas de punto: `"1,98"` → 198,
 * `"2"` → 200, `""` → `null`. Más de dos decimales, más de 100 o mal escrita
 * → `undefined`. Entero exacto, sin coma flotante.
 */
export function tasaACentesimas(texto: string): number | null | undefined {
  const limpio = texto.trim();
  if (limpio === "") return null;
  const coincidencia = /^(\d{1,3})(?:[.,](\d{1,2}))?$/.exec(limpio);
  if (!coincidencia) return undefined;
  const centesimas = Number.parseInt(coincidencia[1], 10) * 100 + Number.parseInt((coincidencia[2] ?? "").padEnd(2, "0"), 10);
  return centesimas > 10_000 ? undefined : centesimas;
}

/** Día del mes tecleado → 1 a 31, o `null` si no lo es. */
function dia(texto: string): number | null {
  const limpio = texto.trim();
  if (!/^\d{1,2}$/.test(limpio)) return null;
  const n = Number.parseInt(limpio, 10);
  return n >= 1 && n <= 31 ? n : null;
}

/**
 * Validación previa de las condiciones. Días enteros 1–31 (obligatorios si
 * `requerida`; si no, vacíos se omiten); tasa vacía o de 0 a 100 con hasta 2
 * decimales; cuota vacía o entero ≥ 0. Devuelve las condiciones completas
 * (opcionales vacíos como `null`) o los errores por campo.
 */
export function validarTarjeta(
  v: ValoresTarjeta,
  requerida: boolean,
): { condiciones: CondicionesTarjeta } | { errores: Partial<Record<CampoTarjeta, string>> } {
  const errores: Partial<Record<CampoTarjeta, string>> = {};
  const condiciones: CondicionesTarjeta = {};

  for (const campo of ["diaCorte", "diaPago"] as const) {
    const texto = v[campo];
    if (texto.trim() === "") {
      if (requerida) errores[campo] = MENSAJE_DIA;
      continue;
    }
    const n = dia(texto);
    if (n === null) errores[campo] = MENSAJE_DIA;
    else condiciones[campo] = n;
  }

  const tasa = tasaACentesimas(v.tasa);
  if (tasa === undefined) errores.tasaMensual = MENSAJE_TASA;
  else condiciones.tasaMensual = tasa;

  if (v.cuotaManejo.trim() === "") condiciones.cuotaManejo = null;
  else {
    const digitos = aDigitos(v.cuotaManejo);
    if (digitos === null) errores.cuotaManejo = MENSAJE_PESOS;
    else condiciones.cuotaManejo = digitos;
  }

  condiciones.cuentaPagoId = v.cuentaPagoId;
  return Object.keys(errores).length > 0 ? { errores } : { condiciones };
}

/** Forma comparable de los valores: textos recortados, cuota como dígitos y tasa en centésimas. */
function comparableTarjeta(v: ValoresTarjeta): string {
  const tasa = tasaACentesimas(v.tasa);
  return JSON.stringify([
    v.diaCorte.trim().replace(/^0+(?=\d)/, ""),
    v.diaPago.trim().replace(/^0+(?=\d)/, ""),
    tasa === undefined ? v.tasa.trim() : tasa,
    v.cuotaManejo.trim() === "" ? null : (aDigitos(v.cuotaManejo) ?? v.cuotaManejo.trim()),
    v.cuentaPagoId,
  ]);
}

/** ¿Se tocó alguna condición? Ignora el formato (`"01"` = `"1"`, `"2,00"` = `"2"`). */
export function hayCambiosTarjeta(original: TarjetaEditable | null, v: ValoresTarjeta): boolean {
  return comparableTarjeta(valoresTarjetaDesde(original)) !== comparableTarjeta(v);
}

/**
 * Solo las condiciones que cambiaron, para `PATCH /cuentas/:id`; `null` si
 * ninguna. Un opcional vaciado va como `null`. Se llama con valores ya
 * validados (`validarTarjeta`): lo mal escrito se omite.
 */
export function cambiosTarjeta(original: TarjetaEditable | null, v: ValoresTarjeta): CondicionesTarjeta | null {
  const cambios: CondicionesTarjeta = {};

  const corte = dia(v.diaCorte);
  if (corte !== null && corte !== (original?.diaCorte ?? null)) cambios.diaCorte = corte;
  const pago = dia(v.diaPago);
  if (pago !== null && pago !== (original?.diaPago ?? null)) cambios.diaPago = pago;

  const tasa = tasaACentesimas(v.tasa);
  if (tasa !== undefined && tasa !== (original?.tasaMensual ?? null)) cambios.tasaMensual = tasa;

  const cuota = v.cuotaManejo.trim() === "" ? null : aDigitos(v.cuotaManejo);
  const cuotaOriginal = original?.cuotaManejo == null ? null : original.cuotaManejo.toString();
  if ((v.cuotaManejo.trim() === "" || cuota !== null) && cuota !== cuotaOriginal) cambios.cuotaManejo = cuota;

  if (v.cuentaPagoId !== (original?.cuentaPago?.id ?? null)) cambios.cuentaPagoId = v.cuentaPagoId;

  return Object.keys(cambios).length === 0 ? null : cambios;
}
