import { describe, expect, it } from "vitest";
import { formatearCompacto, formatearDinero, formatearEquivalencia, formatearTasa } from "./formato";

// Signo menos tipográfico U+2212, nunca el guion.
const M = "−";

describe("formatearDinero — COP (sin decimales, punto de miles)", () => {
  it.each<[bigint, string]>([
    [1_234_567n, "1.234.567 COP"],
    [50_000n, "50.000 COP"],
    [999n, "999 COP"],
    [0n, "0 COP"],
    [-50_000n, `${M}50.000 COP`],
  ])("%s → %s", (monto, esperado) => {
    expect(formatearDinero({ monto, moneda: "COP" })).toBe(esperado);
  });

  it("omite COP cuando toda la columna está en pesos", () => {
    expect(formatearDinero({ monto: 1_234_567n, moneda: "COP" }, { omitirCOP: true })).toBe("1.234.567");
    expect(formatearDinero({ monto: -18_500n, moneda: "COP" }, { omitirCOP: true })).toBe(`${M}18.500`);
  });

  it("antepone + a las entradas cuando se pide", () => {
    expect(formatearDinero({ monto: 4_850_000n, moneda: "COP" }, { omitirCOP: true, signoMas: true })).toBe("+4.850.000");
  });

  it("no pone + al cero ni a los negativos", () => {
    expect(formatearDinero({ monto: 0n, moneda: "COP" }, { omitirCOP: true, signoMas: true })).toBe("0");
    expect(formatearDinero({ monto: -1n, moneda: "COP" }, { omitirCOP: true, signoMas: true })).toBe(`${M}1`);
  });

  it("nunca emite el guion como signo", () => {
    expect(formatearDinero({ monto: -50_000n, moneda: "COP" })).not.toContain("-");
  });
});

describe("formatearDinero — USD (coma decimal, dos cifras; monto en centavos)", () => {
  it.each<[bigint, string]>([
    [775_000n, "US$ 7.750,00"],
    [123_456_789n, "US$ 1.234.567,89"],
    [5n, "US$ 0,05"],
    [100n, "US$ 1,00"],
    [0n, "US$ 0,00"],
    [-125_050n, `${M}US$ 1.250,50`],
  ])("%s centavos → %s", (monto, esperado) => {
    expect(formatearDinero({ monto, moneda: "USD" })).toBe(esperado);
  });

  it("omitirCOP no afecta a USD: los dólares siempre llevan su moneda", () => {
    expect(formatearDinero({ monto: 775_000n, moneda: "USD" }, { omitirCOP: true })).toBe("US$ 7.750,00");
  });
});

describe("tasa y equivalencia", () => {
  it("formatea la TRM en centésimas", () => {
    expect(formatearTasa(410_000n)).toBe("4.100,00");
    expect(formatearTasa(392_550n)).toBe("3.925,50");
  });

  it("muestra la equivalencia en COP con la tasa", () => {
    expect(formatearEquivalencia(31_775_000n, 410_000n)).toBe("≈ 31.775.000 COP · TRM 4.100,00");
  });
});

describe("formatearCompacto — ejes de gráfica", () => {
  it.each<[bigint, string]>([
    [28_000_000n, "28 M"],
    [2_400_000n, "2,4 M"],
    [2_250_000n, "2,25 M"],
    [1_234_000_000n, "1.234 M"],
    [950_000n, "950 mil"],
    [1_500n, "1,5 mil"],
    [1_000n, "1 mil"],
    [999n, "999"],
    [0n, "0"],
    [-28_000_000n, `${M}28 M`],
    [-950_000n, `${M}950 mil`],
  ])("%s → %s", (monto, esperado) => {
    expect(formatearCompacto(monto)).toBe(esperado);
  });

  it("nunca emite el guion como signo", () => {
    expect(formatearCompacto(-5_000n)).not.toContain("-");
  });
});
