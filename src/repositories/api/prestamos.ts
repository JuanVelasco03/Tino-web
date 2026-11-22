import { enviar, ErrorApi, obtener } from "./cliente";
import { aMovimiento, type Movimiento, type MovimientoDto } from "./movimientos";

/*
 * Contrato de Tino API (docs/api/prestamos.md, Tino-API SPEC 08). Se copia,
 * no se redefine. Montos como string con un entero en unidades menores.
 * `tasaMensual` sigue como string: es un porcentaje, no un monto.
 */
export type Ref = { id: string; nombre: string };
export type TipoPrestamo = "prestamo_otorgado" | "deuda_contraida";
export type EstadoPrestamo = "te_debe" | "le_debes" | "saldado";

export type PrestamoResumenDto = {
  id: string;
  nombre: string;
  tipo: TipoPrestamo;
  estado: EstadoPrestamo;
  /** `"0"` si saldado; positivo también en `le_debes`. */
  capitalPendiente: string;
  desde: string | null;
  fechaAcordada: string | null;
  vencido: boolean;
  cierre: { fecha: string; forma: "pago" | "condonacion" } | null;
  interesesCausados: string;
};

export type PrestamosDto = {
  fechaHoy: string;
  teDeben: { total: string; personas: number; interesesCausados: string };
  debes: { total: string; personas: number; interesesCausados: string; conIntereses: boolean };
  posicionNeta: string;
  prestamos: PrestamoResumenDto[];
};

export type MovimientoPrestamoDto = {
  fecha: string;
  clase: "desembolso" | "abono" | "condonacion" | "interes";
  cuenta: Ref | null;
  categoria: Ref | null;
  /** Con signo: + desembolso, − abono y condonación; `"0"` en interés. */
  capital: string;
  interes: string;
  saldoCapital: string;
  movimientoId: string | null;
  movimientoInteresId: string | null;
};

export type PrestamoDetalleDto = PrestamoResumenDto & {
  fechaHoy: string;
  tasaMensual: string;
  totalPrestado: string;
  totalAbonado: string;
  totalCondonado: string;
  interesesCobrados: string;
  ultimoAbono: string | null;
  historial: MovimientoPrestamoDto[];
  creadoEn: string;
};

export type PrestamoCuerpo = {
  tipo: TipoPrestamo;
  nombre: string;
  monto: string;
  cuentaId: string;
  fecha?: string;
  tasaMensual?: string;
  fechaAcordada?: string | null;
};

export type DesembolsoCuerpo = { monto: string; cuentaId: string; fecha?: string };

export type PrestamoCambio = { nombre?: string; fechaAcordada?: string | null };

export type PropuestaAbonoDto = {
  fecha: string;
  monto: string;
  capital: string;
  interes: string;
  interesesCausados: string;
  capitalPendiente: string;
};

export type AbonoCuerpo = {
  cuentaId: string;
  fecha: string;
  capital: string;
  interes: string;
  categoriaInteresId?: string | null;
};

export type CondonacionCuerpo = { monto: string; categoriaId: string };

/* Modelo de la web. Montos en `bigint` (REGLAS §6). */
export type Prestamo = {
  id: string;
  nombre: string;
  tipo: TipoPrestamo;
  estado: EstadoPrestamo;
  capitalPendiente: bigint;
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
  posicionNeta: bigint;
  /** En el orden de la API: el cliente agrupa por `estado` sin reordenar. */
  prestamos: Prestamo[];
};

export type MovimientoPrestamo = {
  fecha: string;
  clase: "desembolso" | "abono" | "condonacion" | "interes";
  cuenta: Ref | null;
  categoria: Ref | null;
  /** Con signo. */
  capital: bigint;
  interes: bigint;
  saldoCapital: bigint;
  movimientoId: string | null;
  movimientoInteresId: string | null;
};

export type PrestamoDetalle = Prestamo & {
  fechaHoy: string;
  tasaMensual: string;
  totalPrestado: bigint;
  totalAbonado: bigint;
  totalCondonado: bigint;
  interesesCobrados: bigint;
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

/** String entero de la API → `bigint`. Sin pasar nunca por `number`. */
export function aPrestamo(dto: PrestamoResumenDto): Prestamo {
  return {
    id: dto.id,
    nombre: dto.nombre,
    tipo: dto.tipo,
    estado: dto.estado,
    capitalPendiente: BigInt(dto.capitalPendiente),
    desde: dto.desde,
    fechaAcordada: dto.fechaAcordada,
    vencido: dto.vencido,
    cierre: dto.cierre,
    interesesCausados: BigInt(dto.interesesCausados),
  };
}

export function aPrestamos(dto: PrestamosDto): Prestamos {
  return {
    fechaHoy: dto.fechaHoy,
    teDeben: {
      total: BigInt(dto.teDeben.total),
      personas: dto.teDeben.personas,
      interesesCausados: BigInt(dto.teDeben.interesesCausados),
    },
    debes: {
      total: BigInt(dto.debes.total),
      personas: dto.debes.personas,
      interesesCausados: BigInt(dto.debes.interesesCausados),
      conIntereses: dto.debes.conIntereses,
    },
    posicionNeta: BigInt(dto.posicionNeta),
    prestamos: dto.prestamos.map(aPrestamo),
  };
}

export function aMovimientoPrestamo(dto: MovimientoPrestamoDto): MovimientoPrestamo {
  return {
    fecha: dto.fecha,
    clase: dto.clase,
    cuenta: dto.cuenta,
    categoria: dto.categoria,
    capital: BigInt(dto.capital),
    interes: BigInt(dto.interes),
    saldoCapital: BigInt(dto.saldoCapital),
    movimientoId: dto.movimientoId,
    movimientoInteresId: dto.movimientoInteresId,
  };
}

export function aPrestamoDetalle(dto: PrestamoDetalleDto): PrestamoDetalle {
  return {
    ...aPrestamo(dto),
    fechaHoy: dto.fechaHoy,
    tasaMensual: dto.tasaMensual,
    totalPrestado: BigInt(dto.totalPrestado),
    totalAbonado: BigInt(dto.totalAbonado),
    totalCondonado: BigInt(dto.totalCondonado),
    interesesCobrados: BigInt(dto.interesesCobrados),
    ultimoAbono: dto.ultimoAbono,
    historial: dto.historial.map(aMovimientoPrestamo),
    creadoEn: dto.creadoEn,
  };
}

export function aPropuestaAbono(dto: PropuestaAbonoDto): PropuestaAbono {
  return {
    fecha: dto.fecha,
    monto: BigInt(dto.monto),
    capital: BigInt(dto.capital),
    interes: BigInt(dto.interes),
    interesesCausados: BigInt(dto.interesesCausados),
    capitalPendiente: BigInt(dto.capitalPendiente),
  };
}

/** Ruta de un préstamo. `id` ya validado por quien llama; se codifica igual. */
function ruta(id: string, sufijo = ""): string {
  return `/prestamos/${encodeURIComponent(id)}${sufijo}`;
}

/** `404 PRESTAMO_NO_ENCONTRADO` en una lectura: `obtener` lo devuelve como `null`. */
function noEncontrado(): ErrorApi {
  return new ErrorApi(404, "PRESTAMO_NO_ENCONTRADO", "El préstamo no existe.");
}

function detalleDe(dto: PrestamoDetalleDto | null, donde: string): PrestamoDetalle {
  if (!dto) throw new ErrorApi(500, "ERROR_INTERNO", `Tino API no devolvió el préstamo en ${donde}.`);
  return aPrestamoDetalle(dto);
}

/** `GET /prestamos`: consolidado y lista, saldados incluidos. */
export async function listarPrestamos(): Promise<Prestamos> {
  const dto = await obtener<PrestamosDto>("/prestamos");
  if (!dto) throw new ErrorApi(404, "ERROR_INTERNO", "Tino API no encontró /prestamos.");
  return aPrestamos(dto);
}

/** `GET /prestamos/:id`. `null` si no existe o es de otro usuario. */
export async function leerPrestamo(id: string): Promise<PrestamoDetalle | null> {
  const dto = await obtener<PrestamoDetalleDto>(ruta(id));
  return dto && aPrestamoDetalle(dto);
}

/** `POST /prestamos`: préstamo nuevo con su primer desembolso. */
export async function crearPrestamo(cuerpo: PrestamoCuerpo): Promise<PrestamoDetalle> {
  return detalleDe(await enviar<PrestamoDetalleDto>("POST", "/prestamos", cuerpo), "/prestamos");
}

/** `POST /prestamos/:id/desembolsos`: suma al existente; reabre uno saldado. */
export async function desembolsar(id: string, cuerpo: DesembolsoCuerpo): Promise<PrestamoDetalle> {
  const donde = ruta(id, "/desembolsos");
  return detalleDe(await enviar<PrestamoDetalleDto>("POST", donde, cuerpo), donde);
}

/** `PATCH /prestamos/:id`: nombre o fecha acordada. */
export async function cambiarPrestamo(id: string, cambio: PrestamoCambio): Promise<PrestamoDetalle> {
  const donde = ruta(id);
  return detalleDe(await enviar<PrestamoDetalleDto>("PATCH", donde, cambio), donde);
}

/** `GET /prestamos/:id/propuesta-abono?fecha=&monto=`: reparto entre interés y capital. */
export async function proponerAbono(id: string, fecha: string, monto: string): Promise<PropuestaAbono> {
  const consulta = new URLSearchParams({ fecha, monto });
  const dto = await obtener<PropuestaAbonoDto>(ruta(id, `/propuesta-abono?${consulta.toString()}`));
  if (!dto) throw noEncontrado();
  return aPropuestaAbono(dto);
}

/** `POST /prestamos/:id/abonos`: capital como transferencia e interés como ingreso o gasto. */
export async function abonar(id: string, cuerpo: AbonoCuerpo): Promise<PrestamoDetalle> {
  const donde = ruta(id, "/abonos");
  return detalleDe(await enviar<PrestamoDetalleDto>("POST", donde, cuerpo), donde);
}

/** `POST /prestamos/:id/condonaciones` → el gasto creado. Deshacer es `DELETE /movimientos/:id`. */
export async function condonar(id: string, cuerpo: CondonacionCuerpo): Promise<Movimiento> {
  const dto = await enviar<MovimientoDto>("POST", ruta(id, "/condonaciones"), cuerpo);
  if (!dto) throw new ErrorApi(500, "ERROR_INTERNO", "Tino API no devolvió el movimiento.");
  return aMovimiento(dto);
}
