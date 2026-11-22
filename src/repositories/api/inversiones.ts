import { enviar, ErrorApi, obtener } from "./cliente";
import { aTrm, type Trm, type TrmDto } from "./trm";

/*
 * Contrato de Tino API (docs/api/inversiones.md, Tino-API SPEC 10 y 11). Se
 * copia, no se redefine. Montos como string entero en unidades menores de la
 * moneda de la cuenta; cantidades como string decimal (nunca pasan a
 * `number`); porcentajes como `number` entero en centésimas, tal cual.
 */
export type Moneda = "COP" | "USD";
export type ClaseActivo = "accion" | "etf" | "cripto";
export type OrigenPrecio = "manual" | "cierre" | "intradia";
export type Cotizacion = "automatica" | "manual";
export type ClaseOperacion = "inicial" | "compra" | "venta";

export type InversionResumenDto = {
  id: string;
  nombre: string;
  moneda: Moneda;
  valorMercado: string;
  valorMercadoCop: string | null;
  rendimiento: string;
  rendimientoPorcentaje: number | null;
};

export type InversionesDto = {
  fechaHoy: string;
  trm: TrmDto | null;
  trmDesactualizada: boolean;
  inversiones: InversionResumenDto[];
};

export type PosicionInicialCuerpo = { simbolo: string; nombre?: string; cantidad: string; costo: string; fecha?: string };

export type InversionCuerpo = {
  nombre: string;
  moneda: Moneda;
  efectivoInicial?: string;
  posiciones?: PosicionInicialCuerpo[];
};

export type PosicionDto = {
  activoId: string;
  simbolo: string;
  nombre: string;
  cantidad: string;
  costo: string;
  costoPromedio: string;
  precio: string;
  precioFecha: string;
  precioOrigen: OrigenPrecio;
  precioCotizadoEn: string;
  precioVencido: boolean;
  precioAnterior: { precio: string; fecha: string } | null;
  cotizacion: Cotizacion;
  clase: ClaseActivo | null;
  valor: string;
  valorCop: string | null;
  rendimiento: string;
  rendimientoCop: string | null;
  rendimientoPorcentaje: number | null;
};

export type InversionDetalleDto = {
  id: string;
  nombre: string;
  moneda: Moneda;
  naturaleza: "activo";
  fechaHoy: string;
  trm: TrmDto | null;
  trmDesactualizada: boolean;
  valorMercado: string;
  valorMercadoCop: string | null;
  costo: string;
  costoCop: string | null;
  rendimiento: string;
  rendimientoCop: string | null;
  rendimientoPorcentaje: number | null;
  efectivo: string;
  efectivoCop: string | null;
  posiciones: PosicionDto[];
  archivadaEn: string | null;
};

export type OperacionDto = {
  id: string;
  activo: { id: string; simbolo: string; nombre: string };
  clase: ClaseOperacion;
  cantidad: string;
  monto: string;
  precioUnitario: string;
  fecha: string;
  gananciaRealizada: string | null;
  creadoEn: string;
  actualizadoEn: string;
};

export type OperacionCuerpo = {
  clase: ClaseOperacion;
  simbolo: string;
  nombre?: string;
  cantidad: string;
  monto: string;
  fecha?: string;
};

export type OperacionCambio = { cantidad?: string; monto?: string; fecha?: string };

export type PrecioCuerpo = { precio: string };

export type BusquedaActivoDto = {
  simbolo: string;
  cubierto: boolean;
  nombre: string | null;
  clase: ClaseActivo | null;
  proveedorDisponible: boolean;
};

export type CotizacionCambio = { cotizacion: Cotizacion };

/* Modelo de la web. Montos en `bigint` (REGLAS §6); cantidades y porcentajes tal como llegan. */
export type { Trm };

export type InversionResumen = {
  id: string;
  nombre: string;
  moneda: Moneda;
  valorMercado: bigint;
  valorMercadoCop: bigint | null;
  rendimiento: bigint;
  rendimientoPorcentaje: number | null;
};

export type Inversiones = { fechaHoy: string; trm: Trm | null; trmDesactualizada: boolean; inversiones: InversionResumen[] };

export type Posicion = {
  activoId: string;
  simbolo: string;
  nombre: string;
  cantidad: string;
  costo: bigint;
  costoPromedio: bigint;
  precio: bigint;
  precioFecha: string;
  precioOrigen: OrigenPrecio;
  precioCotizadoEn: string;
  precioVencido: boolean;
  precioAnterior: { precio: bigint; fecha: string } | null;
  cotizacion: Cotizacion;
  clase: ClaseActivo | null;
  valor: bigint;
  valorCop: bigint | null;
  rendimiento: bigint;
  rendimientoCop: bigint | null;
  rendimientoPorcentaje: number | null;
};

export type InversionDetalle = {
  id: string;
  nombre: string;
  moneda: Moneda;
  fechaHoy: string;
  trm: Trm | null;
  trmDesactualizada: boolean;
  valorMercado: bigint;
  valorMercadoCop: bigint | null;
  costo: bigint;
  costoCop: bigint | null;
  rendimiento: bigint;
  rendimientoCop: bigint | null;
  rendimientoPorcentaje: number | null;
  efectivo: bigint;
  efectivoCop: bigint | null;
  posiciones: Posicion[];
  archivadaEn: string | null;
};

export type Operacion = {
  id: string;
  activo: { id: string; simbolo: string; nombre: string };
  clase: ClaseOperacion;
  cantidad: string;
  monto: bigint;
  precioUnitario: bigint;
  fecha: string;
  gananciaRealizada: bigint | null;
  creadoEn: string;
  actualizadoEn: string;
};

export type BusquedaActivo = BusquedaActivoDto;

/** String entero de la API → `bigint`; `null` se conserva. Sin pasar nunca por `number`. */
function aMontoONulo(valor: string | null): bigint | null {
  return valor === null ? null : BigInt(valor);
}

export function aInversiones(dto: InversionesDto): Inversiones {
  return {
    fechaHoy: dto.fechaHoy,
    trm: dto.trm && aTrm(dto.trm),
    trmDesactualizada: dto.trmDesactualizada,
    inversiones: dto.inversiones.map((i) => ({
      id: i.id,
      nombre: i.nombre,
      moneda: i.moneda,
      valorMercado: BigInt(i.valorMercado),
      valorMercadoCop: aMontoONulo(i.valorMercadoCop),
      rendimiento: BigInt(i.rendimiento),
      rendimientoPorcentaje: i.rendimientoPorcentaje,
    })),
  };
}

export function aPosicion(dto: PosicionDto): Posicion {
  return {
    activoId: dto.activoId,
    simbolo: dto.simbolo,
    nombre: dto.nombre,
    cantidad: dto.cantidad,
    costo: BigInt(dto.costo),
    costoPromedio: BigInt(dto.costoPromedio),
    precio: BigInt(dto.precio),
    precioFecha: dto.precioFecha,
    precioOrigen: dto.precioOrigen,
    precioCotizadoEn: dto.precioCotizadoEn,
    precioVencido: dto.precioVencido,
    precioAnterior: dto.precioAnterior && { precio: BigInt(dto.precioAnterior.precio), fecha: dto.precioAnterior.fecha },
    cotizacion: dto.cotizacion,
    clase: dto.clase,
    valor: BigInt(dto.valor),
    valorCop: aMontoONulo(dto.valorCop),
    rendimiento: BigInt(dto.rendimiento),
    rendimientoCop: aMontoONulo(dto.rendimientoCop),
    rendimientoPorcentaje: dto.rendimientoPorcentaje,
  };
}

export function aInversionDetalle(dto: InversionDetalleDto): InversionDetalle {
  return {
    id: dto.id,
    nombre: dto.nombre,
    moneda: dto.moneda,
    fechaHoy: dto.fechaHoy,
    trm: dto.trm && aTrm(dto.trm),
    trmDesactualizada: dto.trmDesactualizada,
    valorMercado: BigInt(dto.valorMercado),
    valorMercadoCop: aMontoONulo(dto.valorMercadoCop),
    costo: BigInt(dto.costo),
    costoCop: aMontoONulo(dto.costoCop),
    rendimiento: BigInt(dto.rendimiento),
    rendimientoCop: aMontoONulo(dto.rendimientoCop),
    rendimientoPorcentaje: dto.rendimientoPorcentaje,
    efectivo: BigInt(dto.efectivo),
    efectivoCop: aMontoONulo(dto.efectivoCop),
    // El orden es el de la API (N-34): no se reordena.
    posiciones: dto.posiciones.map(aPosicion),
    archivadaEn: dto.archivadaEn,
  };
}

export function aOperacion(dto: OperacionDto): Operacion {
  return {
    id: dto.id,
    activo: dto.activo,
    clase: dto.clase,
    cantidad: dto.cantidad,
    monto: BigInt(dto.monto),
    precioUnitario: BigInt(dto.precioUnitario),
    fecha: dto.fecha,
    gananciaRealizada: aMontoONulo(dto.gananciaRealizada),
    creadoEn: dto.creadoEn,
    actualizadoEn: dto.actualizadoEn,
  };
}

/** Ruta de una inversión. Los ids ya validados por quien llama; se codifican igual. */
function ruta(id: string, sufijo = ""): string {
  return `/inversiones/${encodeURIComponent(id)}${sufijo}`;
}

function rutaOperacion(id: string, operacionId: string): string {
  return ruta(id, `/operaciones/${encodeURIComponent(operacionId)}`);
}

function rutaActivo(id: string, activoId: string, sufijo = ""): string {
  return ruta(id, `/activos/${encodeURIComponent(activoId)}${sufijo}`);
}

/** `404 INVERSION_NO_ENCONTRADA` en una lectura: `obtener` lo devuelve como `null`. */
function noEncontrada(): ErrorApi {
  return new ErrorApi(404, "INVERSION_NO_ENCONTRADA", "La inversión no existe.");
}

function detalleDe(dto: InversionDetalleDto | null, donde: string): InversionDetalle {
  if (!dto) throw new ErrorApi(500, "ERROR_INTERNO", `Tino API no devolvió la inversión en ${donde}.`);
  return aInversionDetalle(dto);
}

/** `GET /inversiones`: no archivadas, en el orden de Cuentas, con la TRM de hoy. */
export async function listarInversiones(): Promise<Inversiones> {
  const dto = await obtener<InversionesDto>("/inversiones");
  if (!dto) throw new ErrorApi(404, "ERROR_INTERNO", "Tino API no encontró /inversiones.");
  return aInversiones(dto);
}

/** `POST /inversiones`: la cuenta con su efectivo inicial. */
export async function crearInversion(cuerpo: InversionCuerpo): Promise<InversionDetalle> {
  return detalleDe(await enviar<InversionDetalleDto>("POST", "/inversiones", cuerpo), "/inversiones");
}

/** `GET /inversiones/:id`. También responde con una archivada. `null` si no existe o es ajena. */
export async function leerInversion(id: string): Promise<InversionDetalle | null> {
  const dto = await obtener<InversionDetalleDto>(ruta(id));
  return dto && aInversionDetalle(dto);
}

/** `GET /inversiones/:id/operaciones`: por fecha desc y luego registro desc. */
export async function listarOperaciones(id: string, activoId?: string): Promise<Operacion[]> {
  const consulta = activoId === undefined ? "" : `?${new URLSearchParams({ activoId }).toString()}`;
  const dto = await obtener<{ operaciones: OperacionDto[] }>(ruta(id, `/operaciones${consulta}`));
  if (!dto) throw noEncontrada();
  return dto.operaciones.map(aOperacion);
}

/** `POST /inversiones/:id/operaciones`. */
export async function registrarOperacion(id: string, cuerpo: OperacionCuerpo): Promise<InversionDetalle> {
  const donde = ruta(id, "/operaciones");
  return detalleDe(await enviar<InversionDetalleDto>("POST", donde, cuerpo), donde);
}

/** `PUT /inversiones/:id/operaciones/:operacionId`: cantidad, monto o fecha. */
export async function editarOperacion(id: string, operacionId: string, cambio: OperacionCambio): Promise<InversionDetalle> {
  const donde = rutaOperacion(id, operacionId);
  return detalleDe(await enviar<InversionDetalleDto>("PUT", donde, cambio), donde);
}

/** `DELETE /inversiones/:id/operaciones/:operacionId` → 204. */
export async function eliminarOperacion(id: string, operacionId: string): Promise<void> {
  await enviar<null>("DELETE", rutaOperacion(id, operacionId));
}

/** `POST /inversiones/:id/activos/:activoId/precios`: precio manual con fecha de hoy. */
export async function registrarPrecio(id: string, activoId: string, cuerpo: PrecioCuerpo): Promise<InversionDetalle> {
  const donde = rutaActivo(id, activoId, "/precios");
  return detalleDe(await enviar<InversionDetalleDto>("POST", donde, cuerpo), donde);
}

/** `GET /inversiones/:id/activos/buscar?simbolo=`. Gasta un crédito del proveedor. */
export async function buscarActivo(id: string, simbolo: string): Promise<BusquedaActivo> {
  const dto = await obtener<BusquedaActivoDto>(ruta(id, `/activos/buscar?${new URLSearchParams({ simbolo }).toString()}`));
  if (!dto) throw noEncontrada();
  return dto;
}

/** `PATCH /inversiones/:id/activos/:activoId`: automática o manual. */
export async function cambiarCotizacion(id: string, activoId: string, cambio: CotizacionCambio): Promise<InversionDetalle> {
  const donde = rutaActivo(id, activoId);
  return detalleDe(await enviar<InversionDetalleDto>("PATCH", donde, cambio), donde);
}
