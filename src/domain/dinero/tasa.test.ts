import { describe, expect, it } from "vitest";
import { aPesos, dividirRedondeando, tasaEnCentesimas, tasaImplicita } from "./tasa";

describe("tasaEnCentesimas", () => {
  it.each<[string, bigint]>([
    ["4120.00", 412_000n],
    ["4166.666667", 416_667n],
    ["1", 100n],
    ["4120.005", 412_001n],
    ["4120.004999", 412_000n],
    ["3461.92", 346_192n],
    ["4120.5", 412_050n],
  ])("%j → %s", (texto, esperado) => {
    expect(tasaEnCentesimas(texto)).toBe(esperado);
  });

  it("rechaza lo que no es un decimal positivo", () => {
    expect(() => tasaEnCentesimas("")).toThrow();
    expect(() => tasaEnCentesimas("-1")).toThrow();
    expect(() => tasaEnCentesimas("4.120,00")).toThrow();
  });
});

describe("tasaImplicita", () => {
  it("8.240.000 pesos por US$ 2.000,00 → 4.120,00", () => {
    expect(tasaImplicita(8_240_000n, 200_000n)).toBe(412_000n);
  });

  it("1.000.000 pesos por US$ 240,00 → 4.166,67 (half-up)", () => {
    expect(tasaImplicita(1_000_000n, 24_000n)).toBe(416_667n);
  });
});

describe("aPesos", () => {
  it("positivo", () => {
    expect(aPesos(775_000n, 412_000n)).toBe(31_930_000n);
  });

  it("negativo, simétrico", () => {
    expect(aPesos(-85_822n, 412_000n)).toBe(-3_535_866n);
  });

  it("medio peso: la mitad lejos de cero", () => {
    // 1 centavo × 5.000,00 = 50 pesos; 1 centavo × 0,50 → 0,5 peso → 1.
    expect(aPesos(1n, 50n)).toBe(0n);
    expect(aPesos(100n, 50n)).toBe(1n);
    expect(aPesos(-100n, 50n)).toBe(-1n);
  });
});

describe("dividirRedondeando", () => {
  it("redondea la mitad lejos de cero", () => {
    expect(dividirRedondeando(5n, 2n)).toBe(3n);
    expect(dividirRedondeando(-5n, 2n)).toBe(-3n);
    expect(dividirRedondeando(4n, 3n)).toBe(1n);
  });
});
