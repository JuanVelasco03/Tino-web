/**
 * Dinero: `bigint` en unidades menores (COP = pesos; USD = centavos).
 * Nunca `number` con decimales (REGLAS §6). Aquí tampoco se usa `Intl`:
 * formatea con aritmética entera para no pasar nunca por coma flotante.
 */
export type Moneda = "COP" | "USD";

export type Dinero = {
  monto: bigint;
  moneda: Moneda;
};

export type OpcionesFormato = {
  /** Omite «COP» cuando toda la columna está en pesos. No afecta a USD. */
  omitirCOP?: boolean;
  /** Antepone «+» a los importes positivos (entradas en lista general). */
  signoMas?: boolean;
};

/** Signo menos tipográfico (U+2212). Nunca el guion. */
export const SIGNO_MENOS = "−";

/** Punto de miles: 1234567 → "1.234.567". */
function agruparMiles(digitos: string): string {
  return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function signoDe(monto: bigint, signoMas: boolean): string {
  if (monto < 0n) return SIGNO_MENOS;
  if (monto > 0n && signoMas) return "+";
  return "";
}

/** Formato colombiano: `1.234.567 COP`, `US$ 7.750,00`, negativo con U+2212. */
export function formatearDinero(dinero: Dinero, opciones: OpcionesFormato = {}): string {
  const { monto, moneda } = dinero;
  const signo = signoDe(monto, opciones.signoMas ?? false);
  const absoluto = monto < 0n ? -monto : monto;

  if (moneda === "COP") {
    const cifra = `${signo}${agruparMiles(absoluto.toString())}`;
    return opciones.omitirCOP ? cifra : `${cifra} COP`;
  }

  const enteros = absoluto / 100n;
  const centavos = (absoluto % 100n).toString().padStart(2, "0");
  return `${signo}US$ ${agruparMiles(enteros.toString())},${centavos}`;
}

/**
 * Tasa de cambio en centésimas de peso por dólar: `410_000n` = 4.100,00.
 * Se usa solo para mostrar; la conversión y el congelado de la tasa
 * pertenecen a RN-04 y no están aquí.
 */
export function formatearTasa(tasa: bigint): string {
  const enteros = tasa / 100n;
  const centesimas = (tasa % 100n).toString().padStart(2, "0");
  return `${agruparMiles(enteros.toString())},${centesimas}`;
}

/** Equivalencia en pesos con su tasa: `≈ 31.775.000 COP · TRM 4.100,00`. */
export function formatearEquivalencia(equivalenteCOP: bigint, tasa: bigint): string {
  return `≈ ${formatearDinero({ monto: equivalenteCOP, moneda: "COP" })} · TRM ${formatearTasa(tasa)}`;
}

/** Parte fraccionaria exacta sin ceros a la derecha: `500_000n` de `1_000_000n` → `",5"`. */
function fraccion(resto: bigint, unidad: bigint): string {
  if (resto === 0n) return "";
  const digitos = unidad.toString().length - 1;
  return `,${resto.toString().padStart(digitos, "0").replace(/0+$/, "")}`;
}

/**
 * Cifra compacta para ejes de gráfica, sin moneda: `28_000_000n` → `"28 M"`,
 * `2_400_000n` → `"2,4 M"`, `950_000n` → `"950 mil"`, `0n` → `"0"`,
 * negativo con U+2212. Exacta: nunca redondea (los ejes usan pasos redondos).
 */
export function formatearCompacto(monto: bigint): string {
  const signo = monto < 0n ? SIGNO_MENOS : "";
  const absoluto = monto < 0n ? -monto : monto;
  for (const [unidad, sufijo] of [
    [1_000_000n, "M"],
    [1_000n, "mil"],
  ] as const) {
    if (absoluto >= unidad) {
      const enteros = agruparMiles((absoluto / unidad).toString());
      return `${signo}${enteros}${fraccion(absoluto % unidad, unidad)} ${sufijo}`;
    }
  }
  return `${signo}${absoluto.toString()}`;
}
