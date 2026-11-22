import { describe, expect, it } from "vitest";
import {
  aDigitos,
  aMenores,
  aplicarTecla,
  cambiarMonedaEntrada,
  desdeMenores,
  desdeMonto,
  formatearEntrada,
  formatearEntradaPesos,
  type TeclaNumerica,
} from "./entrada";

describe("formatearEntradaPesos", () => {
  it.each<[string, string]>([
    ["1284300", "1.284.300"],
    ["999", "999"],
    ["1000", "1.000"],
    ["0", "0"],
    ["", ""],
  ])("%j → %j", (texto, esperado) => {
    expect(formatearEntradaPesos(texto)).toBe(esperado);
  });

  it("descarta letras, comas y signos", () => {
    expect(formatearEntradaPesos("-1.234,5")).toBe("12.345");
    expect(formatearEntradaPesos("abc")).toBe("");
    expect(formatearEntradaPesos("12a3")).toBe("123");
  });

  it("quita los ceros a la izquierda", () => {
    expect(formatearEntradaPesos("007")).toBe("7");
    expect(formatearEntradaPesos("000")).toBe("0");
  });

  it("reformatea lo que ya traía puntos", () => {
    expect(formatearEntradaPesos("15.284.300")).toBe("15.284.300");
    expect(formatearEntradaPesos("1.2843")).toBe("12.843");
  });
});

describe("aDigitos", () => {
  it.each<[string, string]>([
    ["1.284.300", "1284300"],
    ["1284300", "1284300"],
    ["0", "0"],
    ["007", "7"],
    ["9.999.999.999.999.999.999", "9999999999999999999"],
  ])("%j → %j", (texto, esperado) => {
    expect(aDigitos(texto)).toBe(esperado);
  });

  it("vacío → null", () => {
    expect(aDigitos("")).toBeNull();
    expect(aDigitos("   ")).toBeNull();
  });

  it("más de 19 dígitos → null", () => {
    expect(aDigitos("12345678901234567890")).toBeNull();
  });

  it("decimales, signos o letras → null", () => {
    expect(aDigitos("12,5")).toBeNull();
    expect(aDigitos("-1")).toBeNull();
    expect(aDigitos("1e3")).toBeNull();
  });
});

describe("desdeMonto", () => {
  it.each<[bigint, string]>([
    [1_284_300n, "1.284.300"],
    [20_321n, "20.321"],
    [0n, "0"],
    [9_007_199_254_740_993n, "9.007.199.254.740.993"],
  ])("%s → %j", (monto, esperado) => {
    expect(desdeMonto(monto)).toBe(esperado);
  });
});

describe("aplicarTecla", () => {
  function teclear(teclas: TeclaNumerica[], inicial = ""): string {
    return teclas.reduce((valor, tecla) => aplicarTecla(valor, tecla), inicial);
  }

  it("1, 5, 000 → 15.000", () => {
    expect(teclear(["1", "5", "000"])).toBe("15.000");
  });

  it("0 o 000 como primera tecla no escriben nada", () => {
    expect(teclear(["0"])).toBe("");
    expect(teclear(["000"])).toBe("");
    expect(teclear(["0", "0", "7"])).toBe("7");
  });

  it("los ceros después de otro dígito sí cuentan", () => {
    expect(teclear(["1", "0", "0"])).toBe("100");
  });

  it("borrar quita un dígito y reagrupa", () => {
    expect(aplicarTecla("15.000", "borrar")).toBe("1.500");
    expect(aplicarTecla("5", "borrar")).toBe("");
    expect(aplicarTecla("", "borrar")).toBe("");
  });

  it("no pasa de 19 dígitos", () => {
    const lleno = teclear(Array<TeclaNumerica>(19).fill("9"));
    expect(lleno.replace(/\./g, "")).toHaveLength(19);
    expect(aplicarTecla(lleno, "1")).toBe(lleno);
    expect(aplicarTecla(teclear(Array<TeclaNumerica>(17).fill("9")), "000").replace(/\./g, "")).toHaveLength(17);
  });
});

describe("formatearEntrada", () => {
  it("COP: como formatearEntradaPesos", () => {
    expect(formatearEntrada("1284300", "COP")).toBe("1.284.300");
    expect(formatearEntrada("12,5", "COP")).toBe("125");
  });

  it.each<[string, string]>([
    ["1234,5", "1.234,5"],
    ["1234", "1.234"],
    ["562,40", "562,40"],
    ["562,401", "562,40"],
    [",5", "0,5"],
    [",", "0,"],
    ["1.234,56", "1.234,56"],
    ["007,5", "7,5"],
    ["1,2,3", "1,23"],
    ["", ""],
    ["abc", ""],
  ])("USD %j → %j", (texto, esperado) => {
    expect(formatearEntrada(texto, "USD")).toBe(esperado);
  });
});

describe("aMenores", () => {
  it("COP: aDigitos", () => {
    expect(aMenores("1.284.300", "COP")).toBe("1284300");
    expect(aMenores("12,5", "COP")).toBeNull();
  });

  it.each<[string, string]>([
    ["562,40", "56240"],
    ["562", "56200"],
    ["562,4", "56240"],
    [",5", "50"],
    ["0,05", "5"],
    ["1.234,56", "123456"],
    ["0", "0"],
    ["562,", "56200"],
  ])("USD %j → %j", (texto, esperado) => {
    expect(aMenores(texto, "USD")).toBe(esperado);
  });

  it("USD: tres decimales, signos, letras o vacío → null", () => {
    expect(aMenores("562,401", "USD")).toBeNull();
    expect(aMenores("-1", "USD")).toBeNull();
    expect(aMenores("1e3", "USD")).toBeNull();
    expect(aMenores("", "USD")).toBeNull();
    expect(aMenores(",", "USD")).toBeNull();
  });
});

describe("desdeMenores", () => {
  it.each<[bigint, "COP" | "USD", string]>([
    [56_240n, "USD", "562,40"],
    [775_000n, "USD", "7.750,00"],
    [5n, "USD", "0,05"],
    [1_284_300n, "COP", "1.284.300"],
  ])("%s %s → %j", (monto, moneda, esperado) => {
    expect(desdeMenores(monto, moneda)).toBe(esperado);
  });
});

describe("aplicarTecla en USD", () => {
  function teclear(teclas: TeclaNumerica[], inicial = ""): string {
    return teclas.reduce((valor, tecla) => aplicarTecla(valor, tecla, "USD"), inicial);
  }

  it("2, 0, 0, 0, «,», 5 → 2.000,5", () => {
    expect(teclear(["2", "0", "0", "0", ",", "5"])).toBe("2.000,5");
  });

  it("la coma va una sola vez y sobre vacío escribe 0,", () => {
    expect(teclear([","])).toBe("0,");
    expect(teclear(["1", ",", ","])).toBe("1,");
  });

  it("dos decimales como máximo", () => {
    expect(teclear(["1", ",", "2", "3", "4"])).toBe("1,23");
  });

  it("borrar quita decimales, luego la coma y luego enteros", () => {
    expect(aplicarTecla("1,23", "borrar", "USD")).toBe("1,2");
    expect(aplicarTecla("1,", "borrar", "USD")).toBe("1");
    expect(aplicarTecla("0,", "borrar", "USD")).toBe("");
    expect(aplicarTecla("1.234", "borrar", "USD")).toBe("123");
  });

  it("0 sobre vacío no escribe nada", () => {
    expect(teclear(["0"])).toBe("");
  });

  it("en COP la coma se ignora", () => {
    expect(aplicarTecla("15", ",", "COP")).toBe("15");
    expect(aplicarTecla("15", ",")).toBe("15");
  });
});

describe("cambiarMonedaEntrada", () => {
  it("conserva la parte entera", () => {
    expect(cambiarMonedaEntrada("1.234,56", "COP")).toBe("1.234");
    expect(cambiarMonedaEntrada("8.240.000", "USD")).toBe("8.240.000");
    expect(cambiarMonedaEntrada("", "USD")).toBe("");
  });
});
