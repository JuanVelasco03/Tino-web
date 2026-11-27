/**
 * Formulario de plantilla: valores tecleados y cuerpo de `POST/PUT
 * /recurrentes`. Funciones puras, sin `number` para los montos (REGLAS §6).
 */
import { desdeMonto } from "../dinero/entrada";
import { montoValido } from "../movimiento/cuerpo";
import type { Periodicidad, Recurrente, RecurrenteCuerpo, TipoMovimiento } from "./tipos";

/** Valores del formulario de plantilla (texto, como el de cuentas y la captura). */
export type ValoresPlantilla = {
  tipo: TipoMovimiento;
  concepto: string;
  /** Lo tecleado ya formateado: `"89.900"`. */
  monto: string;
  variable: boolean;
  periodicidad: Periodicidad;
  /** `"YYYY-MM-DD"`. */
  primerVencimiento: string;
  ultimoDia: boolean;
  cuentaOrigenId: string | null;
  cuentaDestinoId: string | null;
  categoriaId: string | null;
};

export type CampoPlantilla =
  | "tipo"
  | "concepto"
  | "monto"
  | "periodicidad"
  | "primerVencimiento"
  | "ultimoDia"
  | "cuentaOrigen"
  | "cuentaDestino"
  | "categoria";

/** Alta: gasto mensual fijo que vence hoy. La cuenta predeterminada la pone quien abre el formulario. */
export function VALORES_ALTA(fechaHoy: string): ValoresPlantilla {
  return {
    tipo: "gasto",
    concepto: "",
    monto: "",
    variable: false,
    periodicidad: "mensual",
    primerVencimiento: fechaHoy,
    ultimoDia: false,
    cuentaOrigenId: null,
    cuentaDestinoId: null,
    categoriaId: null,
  };
}

export function valoresDesdePlantilla(r: Recurrente): ValoresPlantilla {
  return {
    tipo: r.tipo,
    concepto: r.concepto,
    monto: desdeMonto(r.monto),
    variable: r.variable,
    periodicidad: r.periodicidad,
    primerVencimiento: r.primerVencimiento,
    ultimoDia: r.ultimoDia,
    cuentaOrigenId: r.cuentaOrigen?.id ?? null,
    cuentaDestinoId: r.cuentaDestino?.id ?? null,
    categoriaId: r.categoria?.id ?? null,
  };
}

/** «Último día» solo en periodicidades de un mes o más. */
export function permiteUltimoDia(p: Periodicidad): boolean {
  return p !== "semanal" && p !== "quincenal";
}

/**
 * Cuerpo de `POST`/`PUT /recurrentes`, o `null` si el monto no se puede
 * enviar (vacío, cero o mal escrito). Solo lleva lo que aplica al tipo:
 * gasto, cuenta de origen y categoría; ingreso, cuenta de destino y
 * categoría; transferencia, ambas cuentas y nunca categoría (RN-05).
 * `ultimoDia` se descarta en semanal y quincenal.
 */
export function cuerpoDesdeValores(v: ValoresPlantilla): RecurrenteCuerpo | null {
  const monto = montoValido(v.monto);
  if (monto === null) return null;

  const cuerpo: RecurrenteCuerpo = {
    tipo: v.tipo,
    concepto: v.concepto,
    monto,
    variable: v.variable,
    periodicidad: v.periodicidad,
    primerVencimiento: v.primerVencimiento,
    ultimoDia: permiteUltimoDia(v.periodicidad) && v.ultimoDia,
  };

  switch (v.tipo) {
    case "gasto":
      cuerpo.cuentaOrigenId = v.cuentaOrigenId;
      cuerpo.categoriaId = v.categoriaId;
      break;
    case "ingreso":
      cuerpo.cuentaDestinoId = v.cuentaDestinoId;
      cuerpo.categoriaId = v.categoriaId;
      break;
    case "transferencia":
      cuerpo.cuentaOrigenId = v.cuentaOrigenId;
      cuerpo.cuentaDestinoId = v.cuentaDestinoId;
      break;
  }
  return cuerpo;
}

/** Mensajes de la validación previa al envío; la API valida igual (REGLAS §5). */
export const MENSAJES_PLANTILLA = {
  concepto: "Escribe un concepto.",
  monto: "Escribe un valor en pesos, sin decimales.",
  cuenta: "Elige la cuenta.",
  cuentaOrigen: "Elige la cuenta de origen.",
  cuentaDestino: "Elige la cuenta de destino.",
  cuentasIguales: "Elige dos cuentas distintas.",
} as const;

/**
 * Lo que falta antes de enviar, por campo, para marcarlo todo de una vez y no
 * esperar a la API campo por campo. Vacío: se puede enviar. Solo presenta: la
 * API sigue siendo quien decide (RN-03 incluida).
 */
export function validarPlantilla(v: ValoresPlantilla): Partial<Record<CampoPlantilla, string>> {
  const errores: Partial<Record<CampoPlantilla, string>> = {};
  if (v.concepto.trim() === "") errores.concepto = MENSAJES_PLANTILLA.concepto;
  if (montoValido(v.monto) === null) errores.monto = MENSAJES_PLANTILLA.monto;
  if (v.tipo === "gasto" && v.cuentaOrigenId === null) errores.cuentaOrigen = MENSAJES_PLANTILLA.cuenta;
  if (v.tipo === "ingreso" && v.cuentaDestinoId === null) errores.cuentaDestino = MENSAJES_PLANTILLA.cuenta;
  if (v.tipo === "transferencia") {
    if (v.cuentaOrigenId === null) errores.cuentaOrigen = MENSAJES_PLANTILLA.cuentaOrigen;
    if (v.cuentaDestinoId === null) errores.cuentaDestino = MENSAJES_PLANTILLA.cuentaDestino;
    else if (v.cuentaDestinoId === v.cuentaOrigenId) errores.cuentaDestino = MENSAJES_PLANTILLA.cuentasIguales;
  }
  return errores;
}

/** El «último día» efectivo: en semanal y quincenal no cuenta. */
function ultimoDiaEfectivo(v: ValoresPlantilla): boolean {
  return permiteUltimoDia(v.periodicidad) && v.ultimoDia;
}

/** Periodicidad, primer vencimiento o último día distintos: reinicia el calendario (aviso). */
export function cambiaCalendario(antes: ValoresPlantilla, despues: ValoresPlantilla): boolean {
  return (
    antes.periodicidad !== despues.periodicidad ||
    antes.primerVencimiento !== despues.primerVencimiento ||
    ultimoDiaEfectivo(antes) !== ultimoDiaEfectivo(despues)
  );
}

export function hayCambios(antes: ValoresPlantilla, despues: ValoresPlantilla): boolean {
  return (Object.keys(antes) as (keyof ValoresPlantilla)[]).some((campo) => antes[campo] !== despues[campo]);
}
