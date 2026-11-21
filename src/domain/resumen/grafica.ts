/**
 * Geometría de la gráfica del patrimonio. La escala se calcula en `bigint`
 * (los montos nunca pasan por `number`, REGLAS §6); solo salen como `number`
 * las coordenadas en píxeles enteros del lienzo (el `viewBox` del SVG).
 */
import { formatearCompacto } from "../dinero/formato";
import { formatearMesCorto, mesDeFecha, sumarMeses } from "../fecha/formato";

export type Lienzo = { ancho: number; alto: number };

export type PuntoGrafica = { x: number; y: number; etiqueta: string };

export type LineaRejilla = { y: number; etiqueta: string };

/** Casillas fijas: 11 cierres de mes más hoy. La escala de tiempo no se estira. */
export const CASILLAS = 12;

/**
 * Márgenes del área de trazo dentro del lienzo: a la derecha van las
 * etiquetas de la rejilla; abajo, la base y los meses.
 */
export const MARGEN = { izquierda: 14, derecha: 44, arriba: 8, abajo: 28 } as const;

/** Paso mínimo de la rejilla: por debajo de mil pesos las etiquetas no dicen nada. */
const PASO_MINIMO = 1_000n;

/** División entera hacia −∞ (la de `bigint` trunca hacia cero). */
function dividirHaciaAbajo(a: bigint, b: bigint): bigint {
  const cociente = a / b;
  return (a % b !== 0n && (a < 0n) !== (b < 0n)) ? cociente - 1n : cociente;
}

/** El menor paso redondo (1, 2 o 5 × 10^k, desde `PASO_MINIMO`) mayor o igual que `minimo`. */
function pasoRedondo(minimo: bigint): bigint {
  for (let potencia = PASO_MINIMO; ; potencia *= 10n) {
    for (const factor of [1n, 2n, 5n]) if (factor * potencia >= minimo) return factor * potencia;
  }
}

/** El paso redondo siguiente a `paso`. */
function siguientePaso(paso: bigint): bigint {
  return pasoRedondo(paso + 1n);
}

/**
 * Tres líneas de rejilla `[base, base + paso, base + 2·paso]` que contienen
 * todos los valores. Rango cero: se abre alrededor del valor, que queda en la
 * línea del medio.
 */
function rejillaDe(menor: bigint, mayor: bigint): bigint[] {
  if (menor === mayor) {
    const absoluto = menor < 0n ? -menor : menor;
    const paso = pasoRedondo(absoluto / 10n);
    const centro = dividirHaciaAbajo(menor + paso / 2n, paso) * paso;
    return [centro - paso, centro, centro + paso];
  }
  let paso = pasoRedondo((mayor - menor + 1n) / 2n);
  for (;;) {
    const base = dividirHaciaAbajo(menor, paso) * paso;
    if (base + 2n * paso >= mayor) return [base, base + paso, base + 2n * paso];
    paso = siguientePaso(paso);
  }
}

/** X entera de la casilla `i` (0 a 11). */
export function xDeCasilla(i: number, ancho: number): number {
  const util = ancho - MARGEN.izquierda - MARGEN.derecha;
  return MARGEN.izquierda + Math.round((util * i) / (CASILLAS - 1));
}

/** Y entera de un monto entre `abajo` (base del área) y `arriba` (tope). Escala en `bigint`. */
function yDe(valor: bigint, inferior: bigint, superior: bigint, alto: number): number {
  const util = BigInt(alto - MARGEN.arriba - MARGEN.abajo);
  const rango = superior - inferior;
  // Redondeo al píxel más cercano: (2·util·distancia + rango) / (2·rango).
  const desdeArriba = (2n * util * (superior - valor) + rango) / (2n * rango);
  // Coordenada en píxeles, no un monto: es lo único que sale como number.
  return MARGEN.arriba + Number(desdeArriba);
}

/** Mes abreviado de una fecha: `"2026-10-31"` → `"oct"`. */
function mesAbreviado(fecha: string): string {
  return formatearMesCorto(mesDeFecha(fecha)).split(" ")[0];
}

/**
 * Puntos y rejilla de la serie del patrimonio (ascendente; el último es hoy).
 * Los n puntos ocupan las últimas n de 12 casillas, así que hoy queda siempre
 * a la derecha. Tres líneas de rejilla con paso redondo y etiqueta compacta.
 */
export function geometriaSerie(
  serie: readonly { fecha: string; patrimonio: bigint }[],
  lienzo: Lienzo,
): { puntos: PuntoGrafica[]; rejilla: LineaRejilla[] } {
  if (serie.length === 0) return { puntos: [], rejilla: [] };
  if (serie.length > CASILLAS) throw new Error(`La serie tiene ${serie.length} puntos; el máximo es ${CASILLAS}.`);

  let menor = serie[0].patrimonio;
  let mayor = serie[0].patrimonio;
  for (const { patrimonio } of serie) {
    if (patrimonio < menor) menor = patrimonio;
    if (patrimonio > mayor) mayor = patrimonio;
  }
  const lineas = rejillaDe(menor, mayor);
  const inferior = lineas[0];
  const superior = lineas[lineas.length - 1];

  const primera = CASILLAS - serie.length;
  const puntos = serie.map((p, i) => ({
    x: xDeCasilla(primera + i, lienzo.ancho),
    y: yDe(p.patrimonio, inferior, superior, lienzo.alto),
    etiqueta: i === serie.length - 1 ? "hoy" : mesAbreviado(p.fecha),
  }));
  const rejilla = lineas.map((valor) => ({ y: yDe(valor, inferior, superior, lienzo.alto), etiqueta: formatearCompacto(valor) }));
  return { puntos, rejilla };
}

/**
 * Día uno: hoy en la primera casilla y los 11 meses siguientes a su derecha,
 * por donde irá creciendo la línea. `"2026-11-11"` → `"hoy"`, `"dic"`, …, `"oct"`.
 */
export function casillasPuntoDePartida(fechaHoy: string, ancho: number): { x: number; etiqueta: string }[] {
  const mes = mesDeFecha(fechaHoy);
  return Array.from({ length: CASILLAS }, (_, i) => ({
    x: xDeCasilla(i, ancho),
    etiqueta: i === 0 ? "hoy" : formatearMesCorto(sumarMeses(mes, i)).split(" ")[0],
  }));
}
