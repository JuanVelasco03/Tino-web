/**
 * Tipos de recurrentes con la forma del contrato de Tino API
 * (docs/api/recurrentes.md, Tino-API SPEC 07). El dominio no importa
 * `repositories/`: `Recurrente` y `Ocurrencia` del repositorio cumplen estos.
 */
import type { TipoMovimiento } from "../movimiento/cuerpo";

export type { TipoMovimiento };

export type Ref = { id: string; nombre: string };

export type EstadoOcurrencia = "pagada" | "omitida" | "vencida" | "por_confirmar" | "programada";

export type Periodicidad = "semanal" | "quincenal" | "mensual" | "bimestral" | "trimestral" | "anual";

export const PERIODICIDADES: readonly Periodicidad[] = ["semanal", "quincenal", "mensual", "bimestral", "trimestral", "anual"];

export type Ocurrencia = {
  recurrenteId: string;
  /** `"YYYY-MM-DD"`. */
  vencimiento: string;
  estado: EstadoOcurrencia;
  /** Pagada: el del movimiento; si no, fijo o estimado. Siempre positivo. */
  monto: bigint;
  /** Variable y no pagada. */
  estimado: boolean;
  /** Solo en pagada. */
  movimientoId: string | null;
};

export type Recurrente = {
  id: string;
  tipo: TipoMovimiento;
  concepto: string;
  /** El de la plantilla. */
  monto: bigint;
  variable: boolean;
  periodicidad: Periodicidad;
  primerVencimiento: string;
  ultimoDia: boolean;
  cuentaOrigen: Ref | null;
  cuentaDestino: Ref | null;
  categoria: Ref | null;
  pausada: boolean;
  pausadaDesde: string | null;
  ultimoConfirmado: { monto: bigint; vencimiento: string } | null;
  /** Del mes actual, por vencimiento. */
  ocurrenciasDelMes: Ocurrencia[];
  proximoVencimiento: string | null;
};

/** `RecurrenteCuerpo` del contrato (POST y PUT). */
export type RecurrenteCuerpo = {
  tipo: TipoMovimiento;
  concepto: string;
  /** `^\d{1,19}$`, > 0. */
  monto: string;
  variable: boolean;
  periodicidad: Periodicidad;
  primerVencimiento: string;
  ultimoDia?: boolean;
  cuentaOrigenId?: string | null;
  cuentaDestinoId?: string | null;
  categoriaId?: string | null;
};
