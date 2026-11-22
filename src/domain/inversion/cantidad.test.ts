import { describe, expect, it } from "vitest";
import {
  aCantidad,
  cantidadEscalada,
  cantidadMayor,
  formatearCantidad,
  formatearCantidadCorta,
  precioPorUnidad,
  valorPosicion,
} from "./cantidad";

describe("formatearCantidad", () => {
  it.each<[string, string]>([
    ["6.25", "6,2500"],
    ["0.0125", "0,0125"],
    ["0.01234567", "0,01234567"],
    ["1", "1,0000"],
    ["1250.5", "1.250,5000"],
    ["100", "100,0000"],
  ])("%j → %j", (cantidad, esperado) => {
    expect(formatearCantidad(cantidad)).toBe(esperado);
  });
});

describe("formatearCantidadCorta", () => {
  it.each<[string, string]>([
    ["6.25", "6,25"],
    ["1", "1"],
    ["0.0125", "0,0125"],
    ["1250.5", "1.250,5"],
  ])("%j → %j", (cantidad, esperado) => {
    expect(formatearCantidadCorta(cantidad)).toBe(esperado);
  });
});

describe("aCantidad", () => {
  it.each<[string, string]>([
    ["6,25", "6.25"],
    ["1.250,5", "1250.5"],
    ["6,2500", "6.25"],
    ["100", "100"],
    [",5", "0.5"],
    ["0,01234567", "0.01234567"],
    ["007", "7"],
  ])("%j → %j", (texto, esperado) => {
    expect(aCantidad(texto)).toBe(esperado);
  });

  it("9 decimales, cero, vacío o signo → null", () => {
    expect(aCantidad("1,123456789")).toBeNull();
    expect(aCantidad("0")).toBeNull();
    expect(aCantidad("0,000")).toBeNull();
    expect(aCantidad("")).toBeNull();
    expect(aCantidad("-1")).toBeNull();
    expect(aCantidad("abc")).toBeNull();
  });
});

describe("valorPosicion", () => {
  it("6,25 × 562,40 → 3.515,00", () => {
    expect(valorPosicion("6.25", 56_240n)).toBe(351_500n);
  });

  it("0,0125 × 71.400,00 → 892,50", () => {
    expect(valorPosicion("0.0125", 7_140_000n)).toBe(89_250n);
  });

  it("redondea la mitad lejos de cero: 3,1 × 441,15 → 1.367,57", () => {
    expect(valorPosicion("3.1", 44_115n)).toBe(136_757n);
  });
});

describe("precioPorUnidad", () => {
  it("3.117,00 ÷ 6,25 → 498,72", () => {
    expect(precioPorUnidad(311_700n, "6.25")).toBe(49_872n);
  });

  it("redondea: 100,00 ÷ 3 → 33,33; 200,00 ÷ 3 → 66,67", () => {
    expect(precioPorUnidad(10_000n, "3")).toBe(3_333n);
    expect(precioPorUnidad(20_000n, "3")).toBe(6_667n);
  });
});

describe("cantidadEscalada y cantidadMayor", () => {
  it("escala × 10⁸ y compara exacto", () => {
    expect(cantidadEscalada("6.25")).toBe(625_000_000n);
    expect(cantidadMayor("6.25", "6.2499")).toBe(true);
    expect(cantidadMayor("6.25", "6.25")).toBe(false);
  });
});
