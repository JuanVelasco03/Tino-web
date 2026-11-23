/**
 * Tipos de metas de ahorro con la forma del modelo de la web (contrato de Tino
 * API, docs/api/metas.md, Tino-API SPEC 13). El dominio no importa
 * `repositories/`: el repositorio convierte los DTO a estos tipos.
 *
 * Montos en `bigint` (pesos). `porcentaje` en centésimas, `dias` y `meses`
 * como `number`: son plazos y proporciones, no montos (REGLAS §6). TRM en
 * centésimas de peso por US$.
 */
import type { Moneda } from "../dinero/formato";

export type { Moneda };

/** TRM: `valor` en centésimas de peso por US$ (`"4120.00"` → `412000n`). */
export type Trm = { valor: bigint; vigenteDesde: string; vigenteHasta: string; fuente: string };

export type ModoMeta = "apartado" | "cuenta";

export type CuentaMeta = { id: string; nombre: string; tipo: "efectivo" | "banco" | "inversion"; moneda: Moneda };

export type Ritmo =
  | { tipo: "dias"; falta: bigint; dias: number; vencida: boolean }
  | { tipo: "meses"; falta: bigint; meses: number; cuotaMensual: bigint; vencida: boolean }
  /** `mesEstimado`: `"YYYY-MM"`. Sin avance neto positivo, los dos `null`. */
  | { tipo: "promedio"; promedioMensual: bigint | null; mesEstimado: string | null };

export type Meta = {
  id: string;
  nombre: string;
  modo: ModoMeta;
  cuenta: CuentaMeta;
  objetivo: bigint;
  /** `null`: inversión USD sin TRM. En una cumplida, el del cumplimiento. */
  avance: bigint | null;
  falta: bigint | null;
  /** Centésimas, truncado: `2533` = 25,33 %. Puede pasar de `10000`. */
  porcentaje: number | null;
  /** `"YYYY-MM-DD"` o `"YYYY-MM"`. */
  fechaMeta: string | null;
  cumplidaEl: string | null;
  /** Primer retiro desde el cumplimiento. */
  uso: { fecha: string; motivo: string | null } | null;
  /** `null` en cumplidas y con `avance: null`. */
  ritmo: Ritmo | null;
  /** `"YYYY-MM-DD"` en la zona del usuario. */
  creadaEl: string;
  /** ISO 8601 UTC. */
  archivadaEn: string | null;
};

export type TotalesMetas = { avance: bigint; objetivo: bigint; incompleto: boolean };

export type Metas = {
  fechaHoy: string;
  trm: Trm | null;
  totales: TotalesMetas;
  /** En el orden de la API. */
  activas: Meta[];
  cumplidas: Meta[];
};

export type FilaAporte = {
  id: string;
  tipo: "aporte" | "retiro";
  fecha: string;
  /** Positivo; el signo lo pone la web según `tipo`. */
  monto: bigint;
  /** Lo apartado tras esta fila. */
  acumulado: bigint;
  inicial: boolean;
  motivo: string | null;
  cuentaOrigen: { id: string; nombre: string } | null;
  movimientoId: string | null;
};

export type FilaValor = {
  tipo: "cierre" | "hoy";
  fecha: string;
  valor: bigint | null;
  /** `null` en la primera. */
  variacion: bigint | null;
  trm: Trm | null;
};

export type Apartados = {
  saldoCuenta: bigint;
  apartadoAqui: bigint;
  otras: { metaId: string; nombre: string; apartado: bigint }[];
  /** Puede ser negativo. */
  libre: bigint;
  excedido: boolean;
};

export type InversionMeta = { valorMercado: bigint; moneda: Moneda; trm: Trm | null };

type Extras = { apartados: Apartados | null; inversion: InversionMeta | null };

/** El historial se distingue por modo: aportes en `apartado`, valores en `cuenta`. */
export type MetaDetalle =
  | (Meta & { modo: "apartado"; historial: FilaAporte[] } & Extras)
  | (Meta & { modo: "cuenta"; historial: FilaValor[] } & Extras);

/* Cuerpos del contrato (montos como string entero en pesos). */

export type MetaCuerpo = {
  nombre: string;
  cuentaId: string;
  modo: ModoMeta;
  objetivo: string;
  fechaMeta?: string | null;
  aporteInicial?: { monto: string; cuentaOrigenId?: string | null } | null;
};

/** Ausente no toca el campo; `fechaMeta: null` la quita. */
export type MetaCambio = {
  nombre?: string;
  cuentaId?: string;
  modo?: ModoMeta;
  objetivo?: string;
  fechaMeta?: string | null;
};

export type AporteCuerpo = {
  tipo: "aporte" | "retiro";
  monto: string;
  fecha: string;
  cuentaOrigenId?: string | null;
  motivo?: string | null;
};

/** El `tipo` es fijo. `cuentaOrigenId` obligatorio si el aporte tiene origen; prohibido si no. */
export type AporteCambio = {
  monto: string;
  fecha: string;
  cuentaOrigenId?: string | null;
  motivo?: string | null;
};
