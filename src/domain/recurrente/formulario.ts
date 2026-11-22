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
