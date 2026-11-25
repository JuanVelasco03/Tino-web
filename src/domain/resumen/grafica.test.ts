import { describe, expect, it } from "vitest";
import { casillasPuntoDePartida, CASILLAS, geometriaSerie, MARGEN, xDeCasilla } from "./grafica";

const ESCRITORIO = { ancho: 690, alto: 240 };
const MOVIL = { ancho: 358, alto: 180 };
const M = "−";

/** Serie del diseño (dic 2025 – hoy), con el último punto = hoy. */
const DOCE = [
  ["2025-12-31", 27_412_380n],
  ["2026-01-31", 27_958_110n],
  ["2026-02-28", 28_301_645n],
  ["2026-03-31", 28_077_920n],
  ["2026-04-30", 29_115_430n],
  ["2026-05-31", 29_884_210n],
  ["2026-06-30", 30_402_775n],
  ["2026-07-31", 31_268_940n],
  ["2026-08-31", 31_050_315n],
  ["2026-09-30", 32_106_940n],
  ["2026-10-31", 33_784_215n],
  ["2026-11-21", 34_121_072n],
].map(([fecha, patrimonio]) => ({ fecha: fecha as string, patrimonio: patrimonio as bigint }));

/** Ejemplo de docs/api/resumen.md. */
const DOS = [
  { fecha: "2026-10-31", patrimonio: 2_580_000n },
  { fecha: "2026-11-21", patrimonio: 2_280_000n },
];

function dentroDelLienzo(puntos: { x: number; y: number }[], lienzo: { ancho: number; alto: number }) {
  for (const p of puntos) {
    expect(Number.isInteger(p.x)).toBe(true);
    expect(Number.isInteger(p.y)).toBe(true);
    expect(p.x).toBeGreaterThanOrEqual(0);
    expect(p.x).toBeLessThanOrEqual(lienzo.ancho);
    expect(p.y).toBeGreaterThanOrEqual(MARGEN.arriba);
    expect(p.y).toBeLessThanOrEqual(lienzo.alto - MARGEN.abajo);
  }
}

describe("geometriaSerie", () => {
  it("12 puntos: uno por casilla, de dic a hoy", () => {
    const { puntos, rejilla } = geometriaSerie(DOCE, ESCRITORIO);
    expect(puntos).toHaveLength(12);
    expect(puntos.map((p) => p.etiqueta)).toEqual(["dic", "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "hoy"]);
    expect(puntos.map((p) => p.x)).toEqual(Array.from({ length: CASILLAS }, (_, i) => xDeCasilla(i, ESCRITORIO.ancho)));
    expect(puntos[0].x).toBe(MARGEN.izquierda);
    expect(puntos[11].x).toBe(ESCRITORIO.ancho - MARGEN.derecha);
    expect(rejilla.map((l) => l.etiqueta)).toEqual(["25 M", "30 M", "35 M"]);
    dentroDelLienzo(puntos, ESCRITORIO);
  });

  it("el más alto queda arriba y el más bajo abajo", () => {
    const { puntos } = geometriaSerie(DOCE, ESCRITORIO);
    const ys = puntos.map((p) => p.y);
    expect(Math.min(...ys)).toBe(puntos[11].y); // hoy es el mayor
    expect(Math.max(...ys)).toBe(puntos[0].y); // dic es el menor
  });

  it("la rejilla va de abajo hacia arriba con paso redondo", () => {
    const { rejilla } = geometriaSerie(DOCE, ESCRITORIO);
    expect(rejilla).toHaveLength(3);
    expect(rejilla[0].y).toBe(ESCRITORIO.alto - MARGEN.abajo);
    expect(rejilla[2].y).toBe(MARGEN.arriba);
    expect(rejilla[1].y).toBe((rejilla[0].y + rejilla[2].y) / 2);
  });

  it("2 puntos: ocupan las dos últimas casillas, con «oct» y «hoy»", () => {
    const { puntos, rejilla } = geometriaSerie(DOS, ESCRITORIO);
    expect(puntos.map((p) => p.x)).toEqual([xDeCasilla(10, ESCRITORIO.ancho), xDeCasilla(11, ESCRITORIO.ancho)]);
    expect(puntos.map((p) => p.etiqueta)).toEqual(["oct", "hoy"]);
    expect(rejilla.map((l) => l.etiqueta)).toEqual(["2,2 M", "2,4 M", "2,6 M"]);
    expect(puntos[0].y).toBeLessThan(puntos[1].y); // bajó
    dentroDelLienzo(puntos, ESCRITORIO);
  });

  it("1 punto: hoy en la última casilla, dentro del rango", () => {
    const { puntos, rejilla } = geometriaSerie([{ fecha: "2026-11-21", patrimonio: 975_372n }], MOVIL);
    expect(puntos).toEqual([{ x: MOVIL.ancho - MARGEN.derecha, y: expect.any(Number), etiqueta: "hoy" }]);
    expect(rejilla).toHaveLength(3);
    dentroDelLienzo(puntos, MOVIL);
  });

  it("serie plana: el rango se abre alrededor del valor, sin dividir por cero", () => {
    const plana = DOS.map((p) => ({ ...p, patrimonio: 2_000_000n }));
    const { puntos, rejilla } = geometriaSerie(plana, MOVIL);
    expect(rejilla.map((l) => l.etiqueta)).toEqual(["1,8 M", "2 M", "2,2 M"]);
    expect(puntos[0].y).toBe(rejilla[1].y);
    expect(puntos[1].y).toBe(rejilla[1].y);
    dentroDelLienzo(puntos, MOVIL);
  });

  it("serie plana en cero", () => {
    const { puntos, rejilla } = geometriaSerie([{ fecha: "2026-11-21", patrimonio: 0n }], MOVIL);
    expect(rejilla.map((l) => l.etiqueta)).toEqual([`${M}1 mil`, "0", "1 mil"]);
    expect(puntos[0].y).toBe(rejilla[1].y);
  });

  it("patrimonio negativo: rejilla con −, puntos en el lienzo", () => {
    const negativa = [
      { fecha: "2026-09-30", patrimonio: -1_200_000n },
      { fecha: "2026-10-31", patrimonio: -400_000n },
      { fecha: "2026-11-21", patrimonio: 300_000n },
    ];
    const { puntos, rejilla } = geometriaSerie(negativa, ESCRITORIO);
    expect(rejilla.map((l) => l.etiqueta)).toEqual([`${M}2 M`, "0", "2 M"]);
    dentroDelLienzo(puntos, ESCRITORIO);
  });

  it("todo negativo", () => {
    const { puntos, rejilla } = geometriaSerie(
      [
        { fecha: "2026-10-31", patrimonio: -2_580_000n },
        { fecha: "2026-11-21", patrimonio: -2_280_000n },
      ],
      MOVIL,
    );
    expect(rejilla.map((l) => l.etiqueta)).toEqual([`${M}2,6 M`, `${M}2,4 M`, `${M}2,2 M`]);
    dentroDelLienzo(puntos, MOVIL);
  });

  it("serie vacía (sin cuentas): nada que dibujar", () => {
    expect(geometriaSerie([], ESCRITORIO)).toEqual({ puntos: [], rejilla: [], vacias: [] });
  });

  it("más de 12 puntos es un error del contrato", () => {
    expect(() => geometriaSerie([...DOCE, DOCE[0]], ESCRITORIO)).toThrow();
  });
});

describe("casillasPuntoDePartida", () => {
  it("hoy a la izquierda y los 11 meses siguientes", () => {
    const casillas = casillasPuntoDePartida("2026-11-11", 480);
    expect(casillas.map((c) => c.etiqueta)).toEqual(["hoy", "dic", "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct"]);
    expect(casillas[0].x).toBe(MARGEN.izquierda);
    expect(casillas[11].x).toBe(480 - MARGEN.izquierda);
  });
});

describe("geometriaSerie · casillas vacías", () => {
  it("rotula los meses anteriores al inicio, sin punto", () => {
    const serie = [
      { fecha: "2026-09-30", patrimonio: 1_000_000n },
      { fecha: "2026-10-31", patrimonio: 1_200_000n },
      { fecha: "2026-11-24", patrimonio: 1_100_000n },
    ];
    const { vacias, puntos } = geometriaSerie(serie, { ancho: 690, alto: 240 });
    expect(vacias.map((v) => v.etiqueta)).toEqual(["dic", "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago"]);
    expect(vacias[0].x).toBe(xDeCasilla(0, 690));
    expect(puntos[0].x).toBe(xDeCasilla(9, 690));
  });

  it("con 12 puntos no hay casillas vacías", () => {
    const serie = Array.from({ length: CASILLAS }, (_, i) => ({ fecha: `2026-${String(i + 1).padStart(2, "0")}-28`, patrimonio: BigInt(i) * 1000n }));
    expect(geometriaSerie(serie, { ancho: 690, alto: 240 }).vacias).toEqual([]);
  });
});
