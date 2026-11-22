import { enviar, ErrorApi, obtener } from "./cliente";
import { aMovimiento, type Movimiento, type MovimientoDto, type TipoMovimiento } from "./movimientos";

/*
 * Contrato de Tino API (docs/api/recurrentes.md, Tino-API SPEC 07). Se copia,
 * no se redefine. Montos como string con un entero en unidades menores.
 */
export type Ref = { id: string; nombre: string };

export type EstadoOcurrencia = "pagada" | "omitida" | "vencida" | "por_confirmar" | "programada";

export type Periodicidad = "semanal" | "quincenal" | "mensual" | "bimestral" | "trimestral" | "anual";

export type OcurrenciaDto = {
  recurrenteId: string;
  /** `"YYYY-MM-DD"`. */
  vencimiento: string;
  estado: EstadoOcurrencia;
  /** Pagada: el del movimiento; si no, fijo o estimado. */
  monto: string;
  /** Variable y no pagada. */
  estimado: boolean;
  /** Solo en pagada. */
  movimientoId: string | null;
};

export type RecurrenteDto = {
  id: string;
  tipo: TipoMovimiento;
  concepto: string;
  /** El de la plantilla. */
  monto: string;
  variable: boolean;
  periodicidad: Periodicidad;
  primerVencimiento: string;
  ultimoDia: boolean;
  /** Gasto y transferencia. */
  cuentaOrigen: Ref | null;
  /** Ingreso y transferencia. */
  cuentaDestino: Ref | null;
  /** `null` en transferencia o sin clasificar. */
  categoria: Ref | null;
  pausada: boolean;
  pausadaDesde: string | null;
  ultimoConfirmado: { monto: string; vencimiento: string } | null;
  /** Del mes actual, por vencimiento. */
  ocurrenciasDelMes: OcurrenciaDto[];
  /** Primera sin cerrar desde hoy; `null` si no hay. */
  proximoVencimiento: string | null;
  creadoEn: string;
  actualizadoEn: string;
};

export type GrupoDto = { monto: string; cantidad: number };

export type RecurrentesDto = {
  /** Hoy en la zona del usuario. */
  fechaHoy: string;
  /** `"YYYY-MM"`, mes actual. */
  mes: string;
  ventanaDias: number;
  /** Vencida y por confirmar, por vencimiento y concepto. */
  bandeja: OcurrenciaDto[];
  comprometido: {
    total: string;
    pagado: GrupoDto;
    porConfirmar: GrupoDto;
    programado: GrupoDto;
  };
  ingresosEsperados: OcurrenciaDto[];
  recurrentes: RecurrenteDto[];
};

/** Cuerpo de `POST` y `PUT /recurrentes`. */
export type RecurrenteCuerpo = {
  tipo: TipoMovimiento;
  /** 1 a 80 caracteres tras recortar espacios. */
  concepto: string;
  /** `^\d{1,19}$`, > 0. */
  monto: string;
  variable: boolean;
  periodicidad: Periodicidad;
  /** `"YYYY-MM-DD"`, no anterior a hoy (salvo en un `PUT` que no cambia el calendario). */
  primerVencimiento: string;
  /** Por defecto `false`. Solo en periodicidades de un mes o más. */
  ultimoDia?: boolean;
  cuentaOrigenId?: string | null;
  cuentaDestinoId?: string | null;
  categoriaId?: string | null;
};

/* Modelo de la web. Montos en `bigint` (REGLAS §6). */
export type Ocurrencia = {
  recurrenteId: string;
  vencimiento: string;
  estado: EstadoOcurrencia;
  /** Siempre positivo. */
  monto: bigint;
  estimado: boolean;
  movimientoId: string | null;
};

export type Recurrente = {
  id: string;
  tipo: TipoMovimiento;
  concepto: string;
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
  ocurrenciasDelMes: Ocurrencia[];
  proximoVencimiento: string | null;
};

export type Grupo = { monto: bigint; cantidad: number };

export type Recurrentes = {
  fechaHoy: string;
  mes: string;
  ventanaDias: number;
  bandeja: Ocurrencia[];
  comprometido: { total: bigint; pagado: Grupo; porConfirmar: Grupo; programado: Grupo };
  ingresosEsperados: Ocurrencia[];
  /** En el orden de la API. */
  recurrentes: Recurrente[];
};

/** String entero de la API → `bigint`. Sin pasar nunca por `number`. */
export function aOcurrencia(dto: OcurrenciaDto): Ocurrencia {
  return {
    recurrenteId: dto.recurrenteId,
    vencimiento: dto.vencimiento,
    estado: dto.estado,
    monto: BigInt(dto.monto),
    estimado: dto.estimado,
    movimientoId: dto.movimientoId,
  };
}

export function aRecurrente(dto: RecurrenteDto): Recurrente {
  return {
    id: dto.id,
    tipo: dto.tipo,
    concepto: dto.concepto,
    monto: BigInt(dto.monto),
    variable: dto.variable,
    periodicidad: dto.periodicidad,
    primerVencimiento: dto.primerVencimiento,
    ultimoDia: dto.ultimoDia,
    cuentaOrigen: dto.cuentaOrigen,
    cuentaDestino: dto.cuentaDestino,
    categoria: dto.categoria,
    pausada: dto.pausada,
    pausadaDesde: dto.pausadaDesde,
    ultimoConfirmado: dto.ultimoConfirmado && {
      monto: BigInt(dto.ultimoConfirmado.monto),
      vencimiento: dto.ultimoConfirmado.vencimiento,
    },
    ocurrenciasDelMes: dto.ocurrenciasDelMes.map(aOcurrencia),
    proximoVencimiento: dto.proximoVencimiento,
  };
}

function aGrupo(dto: GrupoDto): Grupo {
  return { monto: BigInt(dto.monto), cantidad: dto.cantidad };
}

export function aRecurrentes(dto: RecurrentesDto): Recurrentes {
  return {
    fechaHoy: dto.fechaHoy,
    mes: dto.mes,
    ventanaDias: dto.ventanaDias,
    bandeja: dto.bandeja.map(aOcurrencia),
    comprometido: {
      total: BigInt(dto.comprometido.total),
      pagado: aGrupo(dto.comprometido.pagado),
      porConfirmar: aGrupo(dto.comprometido.porConfirmar),
      programado: aGrupo(dto.comprometido.programado),
    },
    ingresosEsperados: dto.ingresosEsperados.map(aOcurrencia),
    recurrentes: dto.recurrentes.map(aRecurrente),
  };
}

/** Ruta de una plantilla. `id` ya validado por quien llama; se codifica igual. */
function ruta(id: string, sufijo = ""): string {
  return `/recurrentes/${encodeURIComponent(id)}${sufijo}`;
}

function recurrenteDe(dto: RecurrenteDto | null, donde: string): Recurrente {
  if (!dto) throw new ErrorApi(500, "ERROR_INTERNO", `Tino API no devolvió la plantilla en ${donde}.`);
  return aRecurrente(dto);
}

/** `GET /recurrentes`: toda la pantalla en una llamada. */
export async function obtenerRecurrentes(): Promise<Recurrentes> {
  const dto = await obtener<RecurrentesDto>("/recurrentes");
  if (!dto) throw new ErrorApi(404, "ERROR_INTERNO", "Tino API no encontró /recurrentes.");
  return aRecurrentes(dto);
}

/** `POST /recurrentes` → `201 RecurrenteDto`. */
export async function crearRecurrente(cuerpo: RecurrenteCuerpo): Promise<Recurrente> {
  return recurrenteDe(await enviar<RecurrenteDto>("POST", "/recurrentes", cuerpo), "/recurrentes");
}

/** `PUT /recurrentes/:id`: reemplazo completo. No cambia la pausa. */
export async function reemplazarRecurrente(id: string, cuerpo: RecurrenteCuerpo): Promise<Recurrente> {
  const donde = ruta(id);
  return recurrenteDe(await enviar<RecurrenteDto>("PUT", donde, cuerpo), donde);
}

/** `PATCH /recurrentes/:id { pausada }`: pausa o reanuda. */
export async function pausarRecurrente(id: string, pausada: boolean): Promise<Recurrente> {
  const donde = ruta(id);
  return recurrenteDe(await enviar<RecurrenteDto>("PATCH", donde, { pausada }), donde);
}

/** `DELETE /recurrentes/:id`: borra la plantilla; los movimientos confirmados se quedan. */
export async function eliminarRecurrente(id: string): Promise<void> {
  await enviar<null>("DELETE", ruta(id));
}

/** `POST /recurrentes/:id/confirmar`. Sin `monto`, el importe mostrado. Su `id` sirve para deshacer. */
export async function confirmarOcurrencia(id: string, vencimiento: string, monto?: string): Promise<Movimiento> {
  const cuerpo = monto === undefined ? { vencimiento } : { vencimiento, monto };
  const dto = await enviar<MovimientoDto>("POST", ruta(id, "/confirmar"), cuerpo);
  if (!dto) throw new ErrorApi(500, "ERROR_INTERNO", "Tino API no devolvió el movimiento.");
  return aMovimiento(dto);
}

/** `POST /recurrentes/:id/omitir` → `204`. */
export async function omitirOcurrencia(id: string, vencimiento: string): Promise<void> {
  await enviar<null>("POST", ruta(id, "/omitir"), { vencimiento });
}

/** `DELETE /recurrentes/:id/omisiones/:vencimiento` → `204`: deshace una omisión. */
export async function deshacerOmision(id: string, vencimiento: string): Promise<void> {
  await enviar<null>("DELETE", ruta(id, `/omisiones/${encodeURIComponent(vencimiento)}`));
}
