/**
 * Porcentajes del resumen: la API los entrega como **enteros en décimas**
 * (`274` = 27,4 %; excepción del módulo, `docs/api/resumen.md`). Aquí solo se
 * formatean, con aritmética entera: nunca se recalculan ni pasan por coma
 * flotante.
 */
import { SIGNO_MENOS } from "../dinero/formato";

/** Sin base (`null`): la API no pudo calcularlo. */
export const SIN_PORCENTAJE = "—";

function agruparMiles(digitos: string): string {
  return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * `274` → `"27,4 %"`; `-1190` → `"−119,0 %"`; `0` → `"0,0 %"`; `null` → `"—"`.
 * Con `signo`, los positivos llevan `+` (`15` → `"+1,5 %"`); el cero nunca.
 */
export function formatearPorcentaje(decimas: number | null, opciones: { signo?: boolean } = {}): string {
  if (decimas === null) return SIN_PORCENTAJE;
  if (!Number.isInteger(decimas)) throw new Error(`Porcentaje no entero en décimas: ${decimas}.`);
  const absoluto = Math.abs(decimas);
  const decima = absoluto % 10;
  const enteros = (absoluto - decima) / 10;
  const signo = decimas < 0 ? SIGNO_MENOS : decimas > 0 && opciones.signo ? "+" : "";
  return `${signo}${agruparMiles(String(enteros))},${decima} %`;
}

/** El mayor porcentaje de la lista, o `null` si no hay ninguno. Base de `anchoBarra`. */
export function mayorPorcentaje(porcentajes: readonly (number | null)[]): number | null {
  let mayor: number | null = null;
  for (const p of porcentajes) if (p !== null && (mayor === null || p > mayor)) mayor = p;
  return mayor;
}

/**
 * Ancho de la barra de una categoría, de 0 a 100: su `porcentaje` (de la API)
 * sobre el mayor de la lista. Nunca usa montos. Sin base (`null` o `0`), 0.
 */
export function anchoBarra(porcentaje: number | null, maximo: number | null): number {
  if (porcentaje === null || maximo === null || maximo <= 0 || porcentaje <= 0) return 0;
  return Math.min(100, Math.round((porcentaje * 100) / maximo));
}
