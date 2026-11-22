import type {
  Aviso,
  AvisoConfig,
  AvisoCobro,
  AvisoDeuda,
  AvisoPrecio,
  AvisoRecurrente,
  Avisos,
  ConfigCuerpo,
  ResolucionPrestamo,
  TipoAviso,
} from "@/domain/aviso/presentacion";
import { enviar, ErrorApi, obtener } from "./cliente";

/*
 * Contrato de Tino API (docs/api/avisos.md, Tino-API SPEC 12). Se copia, no se
 * redefine. Montos como string con un entero en pesos (todos los avisos son
 * COP); `dias` y `opciones` son días, no montos: `number`.
 */
export type Ref = { id: string; nombre: string };
export type { TipoAviso };

export type AvisoBaseDto = {
  /** `"recurrente:<uuid>:2026-11-25"`. */
  clave: string;
  tipo: TipoAviso;
  /** ISO UTC: 08:00 locales del día del aviso, o la creación de la fuente. */
  instante: string;
  leido: boolean;
  /** `true` → sin acción (N-24). */
  resuelto: boolean;
};

export type AvisoRecurrenteDto = AvisoBaseDto & {
  tipo: "recurrente";
  recurrente: { id: string; concepto: string; tipo: "gasto" | "ingreso" | "transferencia"; variable: boolean };
  vencimiento: string;
  /** Origen, o destino en un ingreso. */
  cuenta: Ref | null;
  /** Confirmada: el del movimiento; si no, el importe mostrado. */
  monto: string;
  /** Variable y no confirmada → «≈». */
  estimado: boolean;
  resolucion: { forma: "confirmada" | "omitida"; fecha: string } | null;
};

export type ResolucionPrestamoDto = { forma: "abono" | "condonacion"; fecha: string; monto: string; cuenta: Ref | null };

export type AvisoCobroDto = AvisoBaseDto & {
  tipo: "cobro";
  /** La persona. */
  prestamo: Ref;
  fechaAcordada: string;
  /** `= fechaAcordada` en el primero. */
  recordatorio: string;
  /** Resuelto: el de la resolución; si no, el capital pendiente de hoy. */
  monto: string;
  /** Hoy. */
  capitalPendiente: string;
  proximoRecordatorio: string | null;
  resolucion: ResolucionPrestamoDto | null;
};

export type AvisoDeudaDto = AvisoBaseDto & {
  tipo: "deuda";
  prestamo: Ref;
  fechaAcordada: string;
  /** Resuelto: el de la resolución; si no, el capital pendiente de hoy. */
  monto: string;
  /** Hoy («Quedan 500.000»). */
  capitalPendiente: string;
  resolucion: ResolucionPrestamoDto | null;
};

export type AvisoPrecioDto = AvisoBaseDto & {
  tipo: "precio_manual";
  activo: { id: string; simbolo: string; nombre: string };
  inversion: Ref;
  precioFecha: string;
  resolucion: { fecha: string } | null;
};

export type AvisoDto = AvisoRecurrenteDto | AvisoCobroDto | AvisoDeudaDto | AvisoPrecioDto;

export type AvisoConfigDto = { tipo: TipoAviso; activo: boolean; dias: number; opciones: number[] };

export type AvisosDto = {
  /** Hoy en la zona del perfil. */
  fechaHoy: string;
  /** IANA, la del perfil. */
  zonaHoraria: string;
  horaAvisos: "08:00";
  noLeidos: number;
  /** Visibles, en orden. */
  avisos: AvisoDto[];
  /** Los cuatro tipos, en el orden de la tabla. */
  config: AvisoConfigDto[];
};

export type ConteoAvisosDto = { noLeidos: number };
export type MarcaCuerpo = { leido: boolean };
export type { ConfigCuerpo };

/* Modelo de la web (src/domain/aviso/presentacion.ts). Montos en `bigint` (REGLAS §6). */
export type { Aviso, AvisoCobro, AvisoConfig, AvisoDeuda, AvisoPrecio, AvisoRecurrente, Avisos, ResolucionPrestamo };

function aResolucionPrestamo(dto: ResolucionPrestamoDto | null): ResolucionPrestamo | null {
  return dto && { forma: dto.forma, fecha: dto.fecha, monto: BigInt(dto.monto), cuenta: dto.cuenta };
}

/** String entero de la API → `bigint`. Sin pasar nunca por `number`. */
export function aAviso(dto: AvisoDto): Aviso {
  const base = { clave: dto.clave, instante: dto.instante, leido: dto.leido, resuelto: dto.resuelto };
  switch (dto.tipo) {
    case "recurrente":
      return {
        ...base,
        tipo: "recurrente",
        recurrente: { ...dto.recurrente },
        vencimiento: dto.vencimiento,
        cuenta: dto.cuenta,
        monto: BigInt(dto.monto),
        estimado: dto.estimado,
        resolucion: dto.resolucion,
      };
    case "cobro":
      return {
        ...base,
        tipo: "cobro",
        prestamo: dto.prestamo,
        fechaAcordada: dto.fechaAcordada,
        recordatorio: dto.recordatorio,
        monto: BigInt(dto.monto),
        capitalPendiente: BigInt(dto.capitalPendiente),
        proximoRecordatorio: dto.proximoRecordatorio,
        resolucion: aResolucionPrestamo(dto.resolucion),
      };
    case "deuda":
      return {
        ...base,
        tipo: "deuda",
        prestamo: dto.prestamo,
        fechaAcordada: dto.fechaAcordada,
        monto: BigInt(dto.monto),
        capitalPendiente: BigInt(dto.capitalPendiente),
        resolucion: aResolucionPrestamo(dto.resolucion),
      };
    case "precio_manual":
      return {
        ...base,
        tipo: "precio_manual",
        activo: { ...dto.activo },
        inversion: dto.inversion,
        precioFecha: dto.precioFecha,
        resolucion: dto.resolucion,
      };
  }
}

export function aAvisoConfig(dto: AvisoConfigDto): AvisoConfig {
  return { tipo: dto.tipo, activo: dto.activo, dias: dto.dias, opciones: [...dto.opciones] };
}

export function aAvisos(dto: AvisosDto): Avisos {
  return {
    fechaHoy: dto.fechaHoy,
    zonaHoraria: dto.zonaHoraria,
    horaAvisos: dto.horaAvisos,
    noLeidos: dto.noLeidos,
    avisos: dto.avisos.map(aAviso),
    config: dto.config.map(aAvisoConfig),
  };
}

/** `GET /avisos`: lista, conteo y configuración en una lectura. */
export async function obtenerAvisos(): Promise<Avisos> {
  const dto = await obtener<AvisosDto>("/avisos");
  if (!dto) throw new ErrorApi(404, "ERROR_INTERNO", "Tino API no encontró /avisos.");
  return aAvisos(dto);
}

/** `GET /avisos/conteo`: solo el número de sin leer, para el menú. */
export async function contarAvisos(): Promise<number> {
  const dto = await obtener<ConteoAvisosDto>("/avisos/conteo");
  if (!dto) throw new ErrorApi(404, "ERROR_INTERNO", "Tino API no encontró /avisos/conteo.");
  return dto.noLeidos;
}

/**
 * `PATCH /avisos/:clave { leido }` → `204`. La clave lleva «:» y se codifica.
 * Una clave que no es de un aviso visible responde `404 AVISO_NO_ENCONTRADO`:
 * `enviar` lo lanza como `ErrorApi` (a diferencia de `obtener`, no lo vuelve `null`).
 */
export async function marcarAviso(clave: string, leido: boolean): Promise<void> {
  const cuerpo: MarcaCuerpo = { leido };
  await enviar<null>("PATCH", `/avisos/${encodeURIComponent(clave)}`, cuerpo);
}

/** `POST /avisos/leer-todos` → `204`. */
export async function leerTodosLosAvisos(): Promise<void> {
  await enviar<null>("POST", "/avisos/leer-todos");
}

/** `PATCH /avisos/config/:tipo` → `200 AvisoConfigDto`. `dias` sin `activo` enciende el tipo. */
export async function configurarAvisos(tipo: TipoAviso, cuerpo: ConfigCuerpo): Promise<AvisoConfig> {
  const dto = await enviar<AvisoConfigDto>("PATCH", `/avisos/config/${encodeURIComponent(tipo)}`, cuerpo);
  if (!dto) throw new ErrorApi(500, "ERROR_INTERNO", "Tino API no devolvió la configuración.");
  return aAvisoConfig(dto);
}
