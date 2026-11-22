/**
 * Tasas de cambio en centésimas de peso por dólar (`412_000n` = 4.120,00).
 * Solo strings y `bigint`, nunca `number` (REGLAS §6). Lo que se calcula aquí
 * es presentación: la tasa que vale es la que congela la API (RN-04).
 */

const TASA = /^(\d+)(?:\.(\d+))?$/;

/** round(n / d) con la mitad lejos de cero, solo con enteros. Igual que `dividirRedondeando` de la API. */
export function dividirRedondeando(n: bigint, d: bigint): bigint {
  if (d === 0n) throw new Error("División por cero.");
  const negativo = n < 0n !== d < 0n;
  const a = n < 0n ? -n : n;
  const b = d < 0n ? -d : d;
  const cociente = (2n * a + b) / (2n * b);
  return negativo ? -cociente : cociente;
}

/**
 * Tasa decimal de la API → centésimas, half-up: `"4120.00"` → `412000n`,
 * `"4166.666667"` → `416667n`, `"1"` → `100n`, `"4120.005"` → `412001n`.
 */
export function tasaEnCentesimas(texto: string): bigint {
  const coincidencia = TASA.exec(texto.trim());
  if (!coincidencia) throw new Error(`Tasa mal formada: "${texto}".`);
  const [, enteros, decimales = ""] = coincidencia;
  const centesimas = BigInt(enteros) * 100n + BigInt(decimales.slice(0, 2).padEnd(2, "0"));
  // Half-up: basta la tercera cifra; lo que sigue no cambia si llega a la mitad.
  const tercera = decimales.charAt(2);
  return tercera !== "" && tercera >= "5" ? centesimas + 1n : centesimas;
}

/**
 * Tasa implícita de una transferencia entre monedas, en centésimas:
 * `redondear(pesos × 10⁴ ÷ centavos)`. 8.240.000 y US$ 2.000,00 → `412000n`.
 * Vista previa: la que vale la congela la API.
 */
export function tasaImplicita(pesos: bigint, centavos: bigint): bigint {
  return dividirRedondeando(pesos * 10_000n, centavos);
}

/** Centavos a pesos con una tasa en centésimas: `redondear(centavos × tasa ÷ 10⁴)`, como `aCop` de la API. */
export function aPesos(centavos: bigint, tasa: bigint): bigint {
  return dividirRedondeando(centavos * tasa, 10_000n);
}
