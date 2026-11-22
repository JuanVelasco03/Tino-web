/**
 * Cantidades de un activo: no son dinero. Viajan como texto decimal con punto
 * y hasta 8 decimales (`"0.0125"`, `"6.25"`, `"1"`) y nunca pasan por
 * `number`. Para operar se escalan a `bigint` × 10⁸, como la API.
 */
import { dividirRedondeando } from "../dinero/tasa";

/** 10⁸: la escala de las cantidades en la API (`UNIDAD`). */
const UNIDAD = 100_000_000n;
const DECIMALES = 8;
const MIN_DECIMALES = 4;

const CANTIDAD = /^(\d+)(?:\.(\d{1,8}))?$/;

function agruparMiles(digitos: string): string {
  return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function partir(cantidad: string): { enteros: string; decimales: string } {
  const coincidencia = CANTIDAD.exec(cantidad);
  if (!coincidencia) throw new Error(`Cantidad mal formada: "${cantidad}".`);
  return { enteros: coincidencia[1].replace(/^0+(?=\d)/, ""), decimales: (coincidencia[2] ?? "").replace(/0+$/, "") };
}

/** `"6.25"` → `625_000_000n` (× 10⁸). */
export function cantidadEscalada(cantidad: string): bigint {
  const { enteros, decimales } = partir(cantidad);
  return BigInt(enteros) * UNIDAD + BigInt(decimales.padEnd(DECIMALES, "0"));
}

/**
 * Con mínimo 4 decimales y hasta 8, miles con punto: `"6.25"` → `"6,2500"`,
 * `"0.0125"` → `"0,0125"`, `"0.01234567"` → `"0,01234567"`, `"1"` → `"1,0000"`,
 * `"1250.5"` → `"1.250,5000"`.
 */
export function formatearCantidad(cantidad: string): string {
  const { enteros, decimales } = partir(cantidad);
  return `${agruparMiles(enteros)},${decimales.padEnd(MIN_DECIMALES, "0")}`;
}

/** Sin ceros finales (móvil): `"6.25"` → `"6,25"`, `"1"` → `"1"`, `"1250.5"` → `"1.250,5"`. */
export function formatearCantidadCorta(cantidad: string): string {
  const { enteros, decimales } = partir(cantidad);
  return decimales === "" ? agruparMiles(enteros) : `${agruparMiles(enteros)},${decimales}`;
}

/**
 * Lo tecleado (coma decimal, puntos de miles ignorados) → cantidad del
 * contrato: `"6,25"` → `"6.25"`, `"1.250,5"` → `"1250.5"`, `"6,2500"` →
 * `"6.25"`. Cero, vacío, signo o más de 8 decimales → `null`.
 */
export function aCantidad(texto: string): string | null {
  const sinPuntos = texto.trim().replace(/\./g, "");
  const coincidencia = /^(\d*)(?:,(\d*))?$/.exec(sinPuntos);
  if (!coincidencia || !/\d/.test(sinPuntos)) return null;
  const enteros = (coincidencia[1] || "0").replace(/^0+(?=\d)/, "");
  const decimales = (coincidencia[2] ?? "").replace(/0+$/, "");
  if (decimales.length > DECIMALES) return null;
  if (/^0+$/.test(enteros) && decimales === "") return null;
  return decimales === "" ? enteros : `${enteros}.${decimales}`;
}

/** Valor de una posición: `redondear(cantidad × 10⁸ × precio ÷ 10⁸)`, como la API. Vista previa. */
export function valorPosicion(cantidad: string, precio: bigint): bigint {
  return dividirRedondeando(cantidadEscalada(cantidad) * precio, UNIDAD);
}

/** Precio por unidad de una operación: `redondear(monto × 10⁸ ÷ (cantidad × 10⁸))`, como la API. */
export function precioPorUnidad(monto: bigint, cantidad: string): bigint {
  const escalada = cantidadEscalada(cantidad);
  if (escalada === 0n) throw new Error("Cantidad cero.");
  return dividirRedondeando(monto * UNIDAD, escalada);
}

/** ¿`a` es mayor que `b`? Comparación exacta de dos cantidades del contrato. */
export function cantidadMayor(a: string, b: string): boolean {
  return cantidadEscalada(a) > cantidadEscalada(b);
}
