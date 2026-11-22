/**
 * Tipos de préstamos con la forma del contrato de Tino API
 * (docs/api/prestamos.md, Tino-API SPEC 08). El dominio no importa
 * `repositories/`: los modelos del repositorio cumplen estos.
 */

export type Ref = { id: string; nombre: string };

export type TipoPrestamo = "prestamo_otorgado" | "deuda_contraida";

export type EstadoPrestamo = "te_debe" | "le_debes" | "saldado";

export type ClaseMovimientoPrestamo = "desembolso" | "abono" | "condonacion" | "interes";

export type Prestamo = {
  id: string;
  /** La persona. */
  nombre: string;
  tipo: TipoPrestamo;
  estado: EstadoPrestamo;
  /** `0n` si saldado; positivo también en `le_debes`. */
  capitalPendiente: bigint;
  /** `"YYYY-MM-DD"`; `null` si saldado. */
  desde: string | null;
  fechaAcordada: string | null;
  vencido: boolean;
  cierre: { fecha: string; forma: "pago" | "condonacion" } | null;
  interesesCausados: bigint;
};

export type Prestamos = {
  fechaHoy: string;
  teDeben: { total: bigint; personas: number; interesesCausados: bigint };
  debes: { total: bigint; personas: number; interesesCausados: bigint; conIntereses: boolean };
  /** Puede ser negativa. */
  posicionNeta: bigint;
  /** En el orden de la API: te deben, debes, saldadas. */
  prestamos: Prestamo[];
};

export type MovimientoPrestamo = {
  fecha: string;
  clase: ClaseMovimientoPrestamo;
  /** La cuenta propia; `null` en condonación. */
  cuenta: Ref | null;
  /** Condonación: la categoría del gasto. */
  categoria: Ref | null;
  /** Con signo: + desembolso, − abono y condonación; `0n` en interés. */
  capital: bigint;
  interes: bigint;
  saldoCapital: bigint;
  /** El de capital; `null` en clase interés. */
  movimientoId: string | null;
  movimientoInteresId: string | null;
};

export type PrestamoDetalle = Prestamo & {
  fechaHoy: string;
  /** Porcentaje mensual como texto decimal: `"0"`, `"1"`, `"1.5"`. Nunca se convierte a número. */
  tasaMensual: string;
  totalPrestado: bigint;
  /** Abonos a capital y condonaciones. */
  totalAbonado: bigint;
  totalCondonado: bigint;
  /** Pagados, en una contraída. */
  interesesCobrados: bigint;
  /** Último abono o interés. */
  ultimoAbono: string | null;
  historial: MovimientoPrestamo[];
  creadoEn: string;
};

export type PropuestaAbono = {
  fecha: string;
  monto: bigint;
  capital: bigint;
  interes: bigint;
  interesesCausados: bigint;
  capitalPendiente: bigint;
};

/** `PrestamoCuerpo` del contrato (`POST /prestamos`). */
export type PrestamoCuerpo = {
  tipo: TipoPrestamo;
  nombre: string;
  /** `^\d{1,19}$`, > 0. */
  monto: string;
  cuentaId: string;
  fecha?: string;
  tasaMensual?: string;
  fechaAcordada?: string | null;
};

/** `DesembolsoCuerpo` del contrato (`POST /prestamos/:id/desembolsos`). */
export type DesembolsoCuerpo = { monto: string; cuentaId: string; fecha?: string };

/** `PrestamoCambio` del contrato (`PATCH /prestamos/:id`): solo lo que cambia. */
export type PrestamoCambio = { nombre?: string; fechaAcordada?: string | null };

/** `AbonoCuerpo` del contrato (`POST /prestamos/:id/abonos`). */
export type AbonoCuerpo = {
  cuentaId: string;
  fecha: string;
  capital: string;
  interes: string;
  categoriaInteresId?: string | null;
};

/** `CondonacionCuerpo` del contrato (`POST /prestamos/:id/condonaciones`). */
export type CondonacionCuerpo = { monto: string; categoriaId: string };
