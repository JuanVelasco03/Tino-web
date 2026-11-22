/**
 * Montos tecleados con formato colombiano: pesos sin decimales (`1.284.300`) y
 * dólares con coma decimal (`7.750,00`). La API los recibe como string entero
 * en unidades menores (`"1284300"`, `"775000"`). Todo con strings y `bigint`:
 * nunca pasa por `number` (REGLAS §6).
 */
import { formatearDinero, type Moneda } from "./formato";

/** Máximo de dígitos que admite la API (`^\d{1,19}$`). */
const MAX_DIGITOS = 19;

function sinCerosIzquierda(digitos: string): string {
  return digitos.replace(/^0+(?=\d)/, "");
}

function agruparMiles(digitos: string): string {
  return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Formatea lo tecleado: `"1284300"` → `"1.284.300"`. Descarta lo que no es dígito; `""` sigue vacío. */
export function formatearEntradaPesos(texto: string): string {
  const digitos = texto.replace(/\D/g, "");
  if (digitos === "") return "";
  return agruparMiles(sinCerosIzquierda(digitos));
}

/**
 * Lo tecleado como string entero para la API: `"1.284.300"` → `"1284300"`.
 * Solo admite dígitos y puntos de miles. `""`, decimales, signos o más de
 * 19 dígitos → `null`.
 */
export function aDigitos(texto: string): string | null {
  const sinPuntos = texto.trim().replace(/\./g, "");
  if (!/^\d+$/.test(sinPuntos)) return null;
  const digitos = sinCerosIzquierda(sinPuntos);
  return digitos.length > MAX_DIGITOS ? null : digitos;
}

/** Monto para precargar un campo: `1284300n` → `"1.284.300"`. */
export function desdeMonto(monto: bigint): string {
  return formatearDinero({ monto, moneda: "COP" }, { omitirCOP: true });
}

/* ── Dólares ──────────────────────────────────────────────────────────── */

/** Decimales de una moneda: los centavos del dólar; el peso no tiene. */
const MAX_DECIMALES_USD = 2;

/** Lo tecleado en dólares, partido: enteros, si hay coma y decimales (solo dígitos). */
function partirDolares(texto: string): { enteros: string; coma: boolean; decimales: string } {
  const limpio = texto.replace(/[^\d,]/g, "");
  const indice = limpio.indexOf(",");
  if (indice === -1) return { enteros: limpio, coma: false, decimales: "" };
  return { enteros: limpio.slice(0, indice), coma: true, decimales: limpio.slice(indice + 1).replace(/,/g, "") };
}

function unirDolares(enteros: string, coma: boolean, decimales: string): string {
  const parteEntera = enteros === "" ? (coma ? "0" : "") : agruparMiles(sinCerosIzquierda(enteros));
  return coma ? `${parteEntera},${decimales.slice(0, MAX_DECIMALES_USD)}` : parteEntera;
}

/**
 * Formatea lo tecleado en su moneda. COP: como `formatearEntradaPesos`. USD:
 * `"1234,5"` → `"1.234,5"`; hasta dos decimales; una «,» inicial → `"0,"`.
 * Los puntos se toman como separador de miles y se rehacen.
 */
export function formatearEntrada(texto: string, moneda: Moneda): string {
  if (moneda === "COP") return formatearEntradaPesos(texto);
  const { enteros, coma, decimales } = partirDolares(texto);
  return unirDolares(enteros, coma, decimales);
}

/**
 * Lo tecleado como string entero en unidades menores para la API. COP:
 * `aDigitos`. USD: `"562,40"` → `"56240"`, `"562"` → `"56200"`,
 * `"562,4"` → `"56240"`. Tres decimales, signos, letras o vacío → `null`.
 */
export function aMenores(texto: string, moneda: Moneda): string | null {
  if (moneda === "COP") return aDigitos(texto);
  const sinPuntos = texto.trim().replace(/\./g, "");
  const coincidencia = /^(\d*)(?:,(\d{0,2}))?$/.exec(sinPuntos);
  if (!coincidencia || !/\d/.test(sinPuntos)) return null;
  const [, enteros, decimales = ""] = coincidencia;
  const digitos = sinCerosIzquierda(`${enteros}${decimales.padEnd(MAX_DECIMALES_USD, "0")}`);
  return digitos.length > MAX_DIGITOS ? null : digitos;
}

/** Monto para precargar un campo en su moneda: `56240n` USD → `"562,40"`; `1284300n` COP → `"1.284.300"`. */
export function desdeMenores(monto: bigint, moneda: Moneda): string {
  if (moneda === "COP") return desdeMonto(monto);
  return formatearDinero({ monto, moneda: "USD" }).replace("US$ ", "");
}

/** Tecla del teclado numérico propio (móvil). `,` solo existe en USD. */
export type TeclaNumerica = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "000" | "," | "borrar";

/** USD: la coma se agrega una sola vez; dos decimales como máximo; 17 enteros (19 dígitos con los centavos). */
function teclaDolares(valor: string, tecla: TeclaNumerica): string {
  const { enteros, coma, decimales } = partirDolares(valor);
  const enterosLimpios = sinCerosIzquierda(enteros).replace(/^0+$/, coma ? "0" : "");

  if (tecla === "borrar") {
    if (decimales !== "") return unirDolares(enterosLimpios, true, decimales.slice(0, -1));
    if (coma) return unirDolares(enterosLimpios === "0" ? "" : enterosLimpios, false, "");
    return unirDolares(enterosLimpios.slice(0, -1), false, "");
  }
  if (tecla === ",") return coma ? valor : unirDolares(enterosLimpios, true, "");
  if (coma) {
    const siguientes = `${decimales}${tecla}`;
    return siguientes.length > MAX_DECIMALES_USD ? valor : unirDolares(enterosLimpios, true, siguientes);
  }
  const siguiente = sinCerosIzquierda(`${enterosLimpios}${tecla}`).replace(/^0+$/, "");
  if (siguiente.length > MAX_DIGITOS - MAX_DECIMALES_USD) return valor;
  return unirDolares(siguiente, false, "");
}

/**
 * Aplica una tecla a lo tecleado (`"1.500"`) y devuelve el nuevo valor
 * formateado. Ignora los ceros a la izquierda (`0` o `000` sobre vacío no
 * escriben nada) y no pasa de 19 dígitos. `borrar` quita el último carácter.
 * En USD, `,` agrega la coma decimal una sola vez; en COP se ignora.
 */
export function aplicarTecla(valor: string, tecla: TeclaNumerica, moneda: Moneda = "COP"): string {
  if (moneda === "USD") return teclaDolares(valor, tecla);
  if (tecla === ",") return valor;
  const digitos = valor.replace(/\D/g, "");
  if (tecla === "borrar") return formatearEntradaPesos(digitos.slice(0, -1));

  const siguiente = sinCerosIzquierda(`${digitos}${tecla}`).replace(/^0+$/, "");
  if (siguiente.length > MAX_DIGITOS) return valor;
  return formatearEntradaPesos(siguiente);
}

/**
 * Lo tecleado al cambiar de moneda: se conserva la parte entera y se
 * reformatea. `"1.234,56"` → COP `"1.234"`; `"1.234"` → USD `"1.234"`.
 */
export function cambiarMonedaEntrada(texto: string, moneda: Moneda): string {
  const enteros = texto.split(",")[0];
  return formatearEntrada(enteros, moneda);
}
