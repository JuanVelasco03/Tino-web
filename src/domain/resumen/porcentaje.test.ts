import { describe, expect, it } from "vitest";
import { anchoBarra, formatearPorcentaje, mayorPorcentaje } from "./porcentaje";

const M = "−";

describe("formatearPorcentaje — décimas de la API", () => {
  it.each<[number | null, string]>([
    [274, "27,4 %"],
    [-1190, `${M}119,0 %`],
    [0, "0,0 %"],
    [1000, "100,0 %"],
    [-5, `${M}0,5 %`],
    [5, "0,5 %"],
    [33, "3,3 %"],
    [12345, "1.234,5 %"],
    [null, "—"],
  ])("%s → %s", (decimas, esperado) => {
    expect(formatearPorcentaje(decimas)).toBe(esperado);
  });

  it.each<[number | null, string]>([
    [15, "+1,5 %"],
    [274, "+27,4 %"],
    [-286, `${M}28,6 %`],
    [0, "0,0 %"],
    [1000, "+100,0 %"],
    [-5, `${M}0,5 %`],
    [null, "—"],
  ])("con signo: %s → %s", (decimas, esperado) => {
    expect(formatearPorcentaje(decimas, { signo: true })).toBe(esperado);
  });

  it("nunca emite el guion como signo", () => {
    expect(formatearPorcentaje(-1190)).not.toContain("-");
  });

  it("rechaza un valor que no es entero", () => {
    expect(() => formatearPorcentaje(27.4)).toThrow();
  });
});

describe("mayorPorcentaje", () => {
  it("toma el mayor e ignora los null", () => {
    expect(mayorPorcentaje([867, 100, 0, null, 33])).toBe(867);
  });

  it("null si no hay ninguno", () => {
    expect(mayorPorcentaje([])).toBeNull();
    expect(mayorPorcentaje([null, null])).toBeNull();
  });
});

describe("anchoBarra", () => {
  it("el mayor mide 100 y los demás en proporción", () => {
    expect(anchoBarra(867, 867)).toBe(100);
    expect(anchoBarra(100, 867)).toBe(12);
    expect(anchoBarra(33, 867)).toBe(4);
  });

  it("cero no se ve", () => {
    expect(anchoBarra(0, 867)).toBe(0);
  });

  it("sin base: máximo null o 0, o porcentaje null", () => {
    expect(anchoBarra(100, null)).toBe(0);
    expect(anchoBarra(0, 0)).toBe(0);
    expect(anchoBarra(null, 867)).toBe(0);
  });

  it("nunca pasa de 100", () => {
    expect(anchoBarra(900, 867)).toBe(100);
  });
});
