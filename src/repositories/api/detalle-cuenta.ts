import { enviar, ErrorApi, obtener } from "./cliente";
import { aMovimiento, type Movimiento, type MovimientoDto } from "./movimientos";

/*
 * Detalle de una cuenta y ciclo de la tarjeta: contrato de Tino API
 * (Tino-API SPEC 14 «Contrato HTTP», docs/api/cuentas.md). Se copia, no se
 * redefine. Montos como string entero de pesos; `efecto`, `saldo` de una fila
 * y `saldoAnteriorPendiente` pueden llevar «-».
 */
export type Ref = { id: string; nombre: string };

export type FilaHistorialDto = {
  movimientoId: string;
  tipo: "gasto" | "ingreso" | "transferencia" | "ajuste";
  fecha: string;
  descripcion: string | null;
  /** Con signo: + entra, − sale. */
  efecto: string;
  /** Saldo corrido tras la fila. */
  saldo: string;
  /** En esta cuenta. */
  conciliado: boolean;
  /** En un ajuste, «Ajuste». */
  categoria: Ref | null;
  partes: { categoria: Ref; monto: string }[];
  /** Solo transferencias. */
  contraparte: (Ref & { sentido: "desde" | "hacia" }) | null;
};

export type HistorialDto = {
  fechaHoy: string;
  desde: string;
  hasta: string | null;
  /** Actual, con futuros (SPEC 03). */
  saldo: string;
  /** El del panel de ajuste: sin futuros. */
  saldoHoy: string;
  conciliacion: { saldo: string | null; al: string | null; pendientes: number };
  entradas: string;
  /** Positivo; el «−» lo pone el cliente. */
  salidas: string;
  saldoInicioRango: string;
  /** La más reciente primero. */
  filas: FilaHistorialDto[];
};

export type FilaCicloDto = {
  movimientoId: string;
  tipo: "gasto" | "ingreso" | "transferencia";
  fecha: string;
  descripcion: string | null;
  monto: string;
  categoria: Ref | null;
  partes: { categoria: Ref; monto: string }[];
  /** La otra cuenta de una transferencia. */
  contraparte: Ref | null;
};

export type CicloDto = {
  fechaHoy: string;
  /** `null`: tarjeta sin condiciones. */
  ciclo: {
    inicio: string;
    corte: string;
    pagoLimite: string;
    diasHastaCorte: number;
    diasHastaPago: number;
    corteAnterior: { fecha: string; saldo: string };
    abonos: FilaCicloDto[];
    saldoAnteriorPendiente: string;
    pagoSugerido: string;
    consumos: FilaCicloDto[];
    totalConsumos: string;
    cargos: (FilaCicloDto & { clase: "intereses" | "cuota_manejo" })[];
    totalCargos: string;
    deudaAlCorte: string;
  } | null;
  /** Solo con `?compra=`. */
  compra: {
    monto: string;
    cabe: boolean;
    disponibleTras: string | null;
    porcentajeTras: number | null;
    falta: string | null;
  } | null;
};

/** Cuerpo de `PUT /cuentas/:id/conciliacion`: de 1 a 500 ids sin repetir. */
export type CuerpoConciliacion = { movimientoIds: string[]; conciliado: boolean };

/** Cuerpo de `POST /cuentas/:id/ajustes`. */
export type CuerpoAjuste = { saldoReal: string; conciliarHastaHoy?: boolean };

/* ── Modelo de la web: montos en `bigint` (REGLAS §6) ───────────────────── */

export type Parte = { categoria: Ref; monto: bigint };

export type FilaHistorial = {
  movimientoId: string;
  tipo: FilaHistorialDto["tipo"];
  fecha: string;
  descripcion: string | null;
  efecto: bigint;
  saldo: bigint;
  conciliado: boolean;
  categoria: Ref | null;
  partes: Parte[];
  contraparte: (Ref & { sentido: "desde" | "hacia" }) | null;
};

export type Historial = {
  fechaHoy: string;
  desde: string;
  hasta: string | null;
  saldo: bigint;
  saldoHoy: bigint;
  conciliacion: { saldo: bigint | null; al: string | null; pendientes: number };
  entradas: bigint;
  salidas: bigint;
  saldoInicioRango: bigint;
  filas: FilaHistorial[];
};

export type FilaCiclo = {
  movimientoId: string;
  tipo: FilaCicloDto["tipo"];
  fecha: string;
  descripcion: string | null;
  monto: bigint;
  categoria: Ref | null;
  partes: Parte[];
  contraparte: Ref | null;
};

export type Ciclo = {
  inicio: string;
  corte: string;
  pagoLimite: string;
  diasHastaCorte: number;
  diasHastaPago: number;
  corteAnterior: { fecha: string; saldo: bigint };
  abonos: FilaCiclo[];
  saldoAnteriorPendiente: bigint;
  pagoSugerido: bigint;
  consumos: FilaCiclo[];
  totalConsumos: bigint;
  cargos: (FilaCiclo & { clase: "intereses" | "cuota_manejo" })[];
  totalCargos: bigint;
  deudaAlCorte: bigint;
};

export type Compra = {
  monto: bigint;
  cabe: boolean;
  disponibleTras: bigint | null;
  porcentajeTras: number | null;
  falta: bigint | null;
};

export type CicloTarjeta = { fechaHoy: string; ciclo: Ciclo | null; compra: Compra | null };

/** String entero de la API (con signo si aplica) → `bigint`. Sin pasar por `number`. */
function aMonto(valor: string): bigint {
  return BigInt(valor);
}

function aMontoONulo(valor: string | null): bigint | null {
  return valor === null ? null : aMonto(valor);
}

function aPartes(partes: { categoria: Ref; monto: string }[]): Parte[] {
  return partes.map((p) => ({ categoria: p.categoria, monto: aMonto(p.monto) }));
}

export function aFilaHistorial(dto: FilaHistorialDto): FilaHistorial {
  return {
    movimientoId: dto.movimientoId,
    tipo: dto.tipo,
    fecha: dto.fecha,
    descripcion: dto.descripcion,
    efecto: aMonto(dto.efecto),
    saldo: aMonto(dto.saldo),
    conciliado: dto.conciliado,
    categoria: dto.categoria,
    partes: aPartes(dto.partes),
    contraparte: dto.contraparte,
  };
}

export function aHistorial(dto: HistorialDto): Historial {
  return {
    fechaHoy: dto.fechaHoy,
    desde: dto.desde,
    hasta: dto.hasta,
    saldo: aMonto(dto.saldo),
    saldoHoy: aMonto(dto.saldoHoy),
    conciliacion: {
      saldo: aMontoONulo(dto.conciliacion.saldo),
      al: dto.conciliacion.al,
      pendientes: dto.conciliacion.pendientes,
    },
    entradas: aMonto(dto.entradas),
    salidas: aMonto(dto.salidas),
    saldoInicioRango: aMonto(dto.saldoInicioRango),
    // El orden es el de la API: la más reciente primero.
    filas: dto.filas.map(aFilaHistorial),
  };
}

function aFilaCiclo(dto: FilaCicloDto): FilaCiclo {
  return {
    movimientoId: dto.movimientoId,
    tipo: dto.tipo,
    fecha: dto.fecha,
    descripcion: dto.descripcion,
    monto: aMonto(dto.monto),
    categoria: dto.categoria,
    partes: aPartes(dto.partes),
    contraparte: dto.contraparte,
  };
}

export function aCicloTarjeta(dto: CicloDto): CicloTarjeta {
  const c = dto.ciclo;
  return {
    fechaHoy: dto.fechaHoy,
    ciclo: c && {
      inicio: c.inicio,
      corte: c.corte,
      pagoLimite: c.pagoLimite,
      diasHastaCorte: c.diasHastaCorte,
      diasHastaPago: c.diasHastaPago,
      corteAnterior: { fecha: c.corteAnterior.fecha, saldo: aMonto(c.corteAnterior.saldo) },
      abonos: c.abonos.map(aFilaCiclo),
      saldoAnteriorPendiente: aMonto(c.saldoAnteriorPendiente),
      pagoSugerido: aMonto(c.pagoSugerido),
      consumos: c.consumos.map(aFilaCiclo),
      totalConsumos: aMonto(c.totalConsumos),
      cargos: c.cargos.map((f) => ({ ...aFilaCiclo(f), clase: f.clase })),
      totalCargos: aMonto(c.totalCargos),
      deudaAlCorte: aMonto(c.deudaAlCorte),
    },
    compra: dto.compra && {
      monto: aMonto(dto.compra.monto),
      cabe: dto.compra.cabe,
      disponibleTras: aMontoONulo(dto.compra.disponibleTras),
      porcentajeTras: dto.compra.porcentajeTras,
      falta: aMontoONulo(dto.compra.falta),
    },
  };
}

function ruta(id: string, sufijo: string): string {
  return `/cuentas/${encodeURIComponent(id)}${sufijo}`;
}

function obligatorio<T>(dto: T | null, rutaPedida: string): T {
  if (!dto) throw new ErrorApi(404, "CUENTA_NO_ENCONTRADA", `Tino API no encontró ${rutaPedida}.`);
  return dto;
}

/** `GET /cuentas/:id/historial?desde=&hasta=`. Sin `desde`: los últimos 30 días (API). */
export async function obtenerHistorial(id: string, rango: { desde?: string; hasta?: string } = {}): Promise<Historial> {
  const consulta = new URLSearchParams();
  if (rango.desde !== undefined) consulta.set("desde", rango.desde);
  if (rango.hasta !== undefined) consulta.set("hasta", rango.hasta);
  const texto = consulta.toString();
  const r = ruta(id, `/historial${texto ? `?${texto}` : ""}`);
  return aHistorial(obligatorio(await obtener<HistorialDto>(r), r));
}

/** `PUT /cuentas/:id/conciliacion` → `204`. */
export async function conciliar(id: string, cuerpo: CuerpoConciliacion): Promise<void> {
  await enviar<null>("PUT", ruta(id, "/conciliacion"), cuerpo);
}

/** `POST /cuentas/:id/ajustes` → `201 MovimientoDto`. */
export async function registrarAjuste(id: string, cuerpo: CuerpoAjuste): Promise<Movimiento> {
  const r = ruta(id, "/ajustes");
  const dto = await enviar<MovimientoDto>("POST", r, cuerpo);
  if (!dto) throw new ErrorApi(500, "ERROR_INTERNO", `Tino API no devolvió el ajuste en ${r}.`);
  return aMovimiento(dto);
}

/** `GET /cuentas/:id/ciclo`, con `?compra=` si se simula una compra. */
export async function obtenerCiclo(id: string, compra?: string): Promise<CicloTarjeta> {
  const r = ruta(id, compra === undefined ? "/ciclo" : `/ciclo?compra=${encodeURIComponent(compra)}`);
  return aCicloTarjeta(obligatorio(await obtener<CicloDto>(r), r));
}
