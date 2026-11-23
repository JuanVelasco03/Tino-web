import type {
  AporteCambio,
  AporteCuerpo,
  CuentaMeta,
  FilaAporte,
  FilaValor,
  Meta,
  MetaCambio,
  MetaCuerpo,
  MetaDetalle,
  Metas,
  ModoMeta,
  Ritmo,
} from "@/domain/meta/tipos";
import { enviar, ErrorApi, obtener } from "./cliente";
import { aTrm, type TrmDto } from "./trm";

/*
 * Contrato de Tino API (docs/api/metas.md, Tino-API SPEC 13). Se copia, no se
 * redefine. Montos como string entero en pesos; `porcentaje` en centésimas,
 * `dias` y `meses` como `number` (plazos, no montos). El modelo de la web
 * vive en `src/domain/meta/tipos.ts`.
 */
export type { AporteCambio, AporteCuerpo, MetaCambio, MetaCuerpo, ModoMeta };

export type CuentaMetaDto = CuentaMeta;

export type RitmoDto =
  | { tipo: "dias"; falta: string; dias: number; vencida: boolean }
  | { tipo: "meses"; falta: string; meses: number; cuotaMensual: string; vencida: boolean }
  | { tipo: "promedio"; promedioMensual: string | null; mesEstimado: string | null };

export type MetaDto = {
  id: string;
  nombre: string;
  modo: ModoMeta;
  cuenta: CuentaMetaDto;
  objetivo: string;
  avance: string | null;
  falta: string | null;
  porcentaje: number | null;
  fechaMeta: string | null;
  cumplidaEl: string | null;
  uso: { fecha: string; motivo: string | null } | null;
  ritmo: RitmoDto | null;
  creadaEl: string;
  archivadaEn: string | null;
};

export type MetasDto = {
  fechaHoy: string;
  trm: TrmDto | null;
  totales: { avance: string; objetivo: string; incompleto: boolean };
  activas: MetaDto[];
  cumplidas: MetaDto[];
};

export type FilaAporteDto = {
  id: string;
  tipo: "aporte" | "retiro";
  fecha: string;
  monto: string;
  acumulado: string;
  inicial: boolean;
  motivo: string | null;
  cuentaOrigen: { id: string; nombre: string } | null;
  movimientoId: string | null;
};

export type FilaValorDto = {
  tipo: "cierre" | "hoy";
  fecha: string;
  valor: string | null;
  variacion: string | null;
  trm: TrmDto | null;
};

export type MetaDetalleDto = MetaDto & {
  historial: FilaAporteDto[] | FilaValorDto[];
  apartados: {
    saldoCuenta: string;
    apartadoAqui: string;
    otras: { metaId: string; nombre: string; apartado: string }[];
    libre: string;
    excedido: boolean;
  } | null;
  inversion: { valorMercado: string; moneda: "COP" | "USD"; trm: TrmDto | null } | null;
};

/** String entero de la API → `bigint`, o `null`. Sin pasar nunca por `number`. */
function monto(valor: string | null): bigint | null {
  return valor === null ? null : BigInt(valor);
}

function aRitmo(dto: RitmoDto): Ritmo {
  switch (dto.tipo) {
    case "dias":
      return { tipo: "dias", falta: BigInt(dto.falta), dias: dto.dias, vencida: dto.vencida };
    case "meses":
      return { tipo: "meses", falta: BigInt(dto.falta), meses: dto.meses, cuotaMensual: BigInt(dto.cuotaMensual), vencida: dto.vencida };
    case "promedio":
      return { tipo: "promedio", promedioMensual: monto(dto.promedioMensual), mesEstimado: dto.mesEstimado };
  }
}

export function aMeta(dto: MetaDto): Meta {
  return {
    id: dto.id,
    nombre: dto.nombre,
    modo: dto.modo,
    cuenta: { id: dto.cuenta.id, nombre: dto.cuenta.nombre, tipo: dto.cuenta.tipo, moneda: dto.cuenta.moneda },
    objetivo: BigInt(dto.objetivo),
    avance: monto(dto.avance),
    falta: monto(dto.falta),
    porcentaje: dto.porcentaje,
    fechaMeta: dto.fechaMeta,
    cumplidaEl: dto.cumplidaEl,
    uso: dto.uso,
    ritmo: dto.ritmo && aRitmo(dto.ritmo),
    creadaEl: dto.creadaEl,
    archivadaEn: dto.archivadaEn,
  };
}

export function aMetas(dto: MetasDto): Metas {
  return {
    fechaHoy: dto.fechaHoy,
    trm: dto.trm && aTrm(dto.trm),
    totales: { avance: BigInt(dto.totales.avance), objetivo: BigInt(dto.totales.objetivo), incompleto: dto.totales.incompleto },
    activas: dto.activas.map(aMeta),
    cumplidas: dto.cumplidas.map(aMeta),
  };
}

function aFilaAporte(dto: FilaAporteDto): FilaAporte {
  return {
    id: dto.id,
    tipo: dto.tipo,
    fecha: dto.fecha,
    monto: BigInt(dto.monto),
    acumulado: BigInt(dto.acumulado),
    inicial: dto.inicial,
    motivo: dto.motivo,
    cuentaOrigen: dto.cuentaOrigen,
    movimientoId: dto.movimientoId,
  };
}

function aFilaValor(dto: FilaValorDto): FilaValor {
  return { tipo: dto.tipo, fecha: dto.fecha, valor: monto(dto.valor), variacion: monto(dto.variacion), trm: dto.trm && aTrm(dto.trm) };
}

export function aMetaDetalle(dto: MetaDetalleDto): MetaDetalle {
  const extras = {
    apartados: dto.apartados && {
      saldoCuenta: BigInt(dto.apartados.saldoCuenta),
      apartadoAqui: BigInt(dto.apartados.apartadoAqui),
      otras: dto.apartados.otras.map((o) => ({ metaId: o.metaId, nombre: o.nombre, apartado: BigInt(o.apartado) })),
      libre: BigInt(dto.apartados.libre),
      excedido: dto.apartados.excedido,
    },
    inversion: dto.inversion && {
      valorMercado: BigInt(dto.inversion.valorMercado),
      moneda: dto.inversion.moneda,
      trm: dto.inversion.trm && aTrm(dto.inversion.trm),
    },
  };
  const base = aMeta(dto);
  // El historial se distingue por modo: aportes en `apartado`, valores en `cuenta`.
  return base.modo === "apartado"
    ? { ...base, modo: "apartado", historial: (dto.historial as FilaAporteDto[]).map(aFilaAporte), ...extras }
    : { ...base, modo: "cuenta", historial: (dto.historial as FilaValorDto[]).map(aFilaValor), ...extras };
}

/** Ruta de una meta. `id` ya validado por quien llama; se codifica igual. */
function ruta(id: string, sufijo = ""): string {
  return `/metas/${encodeURIComponent(id)}${sufijo}`;
}

function rutaAporte(id: string, aporteId: string): string {
  return ruta(id, `/aportes/${encodeURIComponent(aporteId)}`);
}

function detalleDe(dto: MetaDetalleDto | null, donde: string): MetaDetalle {
  if (!dto) throw new ErrorApi(500, "ERROR_INTERNO", `Tino API no devolvió la meta en ${donde}.`);
  return aMetaDetalle(dto);
}

/** `GET /metas`: no archivadas, en activas y cumplidas, con totales y la TRM de hoy. */
export async function listarMetas(): Promise<Metas> {
  const dto = await obtener<MetasDto>("/metas");
  if (!dto) throw new ErrorApi(404, "ERROR_INTERNO", "Tino API no encontró /metas.");
  return aMetas(dto);
}

/** `GET /metas/archivadas`: la archivada más recientemente primero. */
export async function listarArchivadas(): Promise<Meta[]> {
  const dto = await obtener<MetaDto[]>("/metas/archivadas");
  if (!dto) throw new ErrorApi(404, "ERROR_INTERNO", "Tino API no encontró /metas/archivadas.");
  return dto.map(aMeta);
}

/** `GET /metas/:id`, también de una archivada. `null` si no existe o es de otro usuario. */
export async function leerMeta(id: string): Promise<MetaDetalle | null> {
  const dto = await obtener<MetaDetalleDto>(ruta(id));
  return dto && aMetaDetalle(dto);
}

/** `POST /metas`, con el apartado inicial si lo hay. */
export async function crearMeta(cuerpo: MetaCuerpo): Promise<MetaDetalle> {
  return detalleDe(await enviar<MetaDetalleDto>("POST", "/metas", cuerpo), "/metas");
}

/** `PATCH /metas/:id` con solo lo que cambia. */
export async function cambiarMeta(id: string, cambio: MetaCambio): Promise<MetaDetalle> {
  const donde = ruta(id);
  return detalleDe(await enviar<MetaDetalleDto>("PATCH", donde, cambio), donde);
}

/** `DELETE /metas/:id`: con sus aportes; las transferencias siguen en Movimientos. */
export async function eliminarMeta(id: string): Promise<void> {
  await enviar<null>("DELETE", ruta(id));
}

/** `POST /metas/:id/archivar`: solo una cumplida, y por apartado con lo apartado en 0. */
export async function archivarMeta(id: string): Promise<Meta> {
  const donde = ruta(id, "/archivar");
  const dto = await enviar<MetaDto>("POST", donde);
  if (!dto) throw new ErrorApi(500, "ERROR_INTERNO", `Tino API no devolvió la meta en ${donde}.`);
  return aMeta(dto);
}

/** `POST /metas/:id/restaurar`. */
export async function restaurarMeta(id: string): Promise<MetaDetalle> {
  const donde = ruta(id, "/restaurar");
  return detalleDe(await enviar<MetaDetalleDto>("POST", donde), donde);
}

/** `POST /metas/:id/aportes`: aporte (con o sin origen) o retiro. */
export async function registrarAporte(id: string, cuerpo: AporteCuerpo): Promise<MetaDetalle> {
  const donde = ruta(id, "/aportes");
  return detalleDe(await enviar<MetaDetalleDto>("POST", donde, cuerpo), donde);
}

/** `PUT /metas/:id/aportes/:aporteId`: reemplaza; con origen, corrige su transferencia. */
export async function editarAporte(id: string, aporteId: string, cambio: AporteCambio): Promise<MetaDetalle> {
  const donde = rutaAporte(id, aporteId);
  return detalleDe(await enviar<MetaDetalleDto>("PUT", donde, cambio), donde);
}

/** `DELETE /metas/:id/aportes/:aporteId`: con origen, borra también su transferencia. */
export async function eliminarAporte(id: string, aporteId: string): Promise<void> {
  await enviar<null>("DELETE", rutaAporte(id, aporteId));
}
