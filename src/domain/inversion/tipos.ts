/**
 * Tipos de inversiones con la forma del modelo de la web (contrato de Tino API,
 * docs/api/inversiones.md y trm.md, Tino-API SPEC 09, 10 y 11). El dominio no
 * importa `repositories/`: los modelos del repositorio cumplen estos.
 *
 * Montos en `bigint` (unidades menores de la moneda de la cuenta). Cantidades
 * como texto decimal. Porcentajes como `number` entero en centésimas, tal
 * cual. Tasas en centésimas de peso por dólar (`bigint`).
 */
import type { Moneda } from "../dinero/formato";

export type { Moneda };

/** TRM: `valor` en centésimas de peso por US$ (`"4120.00"` → `412000n`). */
export type Trm = { valor: bigint; vigenteDesde: string; vigenteHasta: string; fuente: string };

export type TrmVigente = { fechaHoy: string; trm: Trm | null; desactualizada: boolean };

export type InversionResumen = {
  id: string;
  nombre: string;
  moneda: Moneda;
  valorMercado: bigint;
  valorMercadoCop: bigint | null;
  rendimiento: bigint;
  rendimientoPorcentaje: number | null;
};

export type Inversiones = {
  fechaHoy: string;
  trm: Trm | null;
  trmDesactualizada: boolean;
  /** En el orden de Cuentas. `[]` → día uno. */
  inversiones: InversionResumen[];
};

export type ClaseActivo = "accion" | "etf" | "cripto";
export type OrigenPrecio = "manual" | "cierre" | "intradia";
export type Cotizacion = "automatica" | "manual";

export type Posicion = {
  activoId: string;
  simbolo: string;
  nombre: string;
  /** `"6.25"`. */
  cantidad: string;
  costo: bigint;
  costoPromedio: bigint;
  precio: bigint;
  precioFecha: string;
  precioOrigen: OrigenPrecio;
  /** ISO 8601 UTC. */
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
  /** Solo abiertas, en el orden de la API. */
  posiciones: Posicion[];
  archivadaEn: string | null;
};

export type ClaseOperacion = "inicial" | "compra" | "venta";

export type Operacion = {
  id: string;
  activo: { id: string; simbolo: string; nombre: string };
  clase: ClaseOperacion;
  cantidad: string;
  /** Total, comisión incluida. */
  monto: bigint;
  precioUnitario: bigint;
  fecha: string;
  /** Solo en venta; puede ser negativa. */
  gananciaRealizada: bigint | null;
  creadoEn: string;
  actualizadoEn: string;
};

export type BusquedaActivo = {
  simbolo: string;
  cubierto: boolean;
  nombre: string | null;
  clase: ClaseActivo | null;
  proveedorDisponible: boolean;
};

/* Cuerpos del contrato (montos como string entero, cantidades como texto decimal). */

export type PosicionInicialCuerpo = { simbolo: string; nombre?: string; cantidad: string; costo: string; fecha?: string };

export type InversionCuerpo = {
  nombre: string;
  moneda: Moneda;
  efectivoInicial?: string;
  posiciones?: PosicionInicialCuerpo[];
};

export type OperacionCuerpo = {
  clase: ClaseOperacion;
  simbolo: string;
  nombre?: string;
  cantidad: string;
  monto: string;
  fecha?: string;
};

/** Al menos uno. */
export type OperacionCambio = { cantidad?: string; monto?: string; fecha?: string };

export type PrecioCuerpo = { precio: string };

export type CotizacionCambio = { cotizacion: Cotizacion };
