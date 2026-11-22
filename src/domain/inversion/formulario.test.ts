import { describe, expect, it } from "vitest";
import {
  activoEnCuenta,
  cambioOperacion,
  cuerpoInversion,
  cuerpoOperacion,
  cuerpoPrecio,
  normalizarSimbolo,
  simboloValido,
  VALORES_OPERACION,
  valoresEdicion,
  type ValoresOperacion,
} from "./formulario";

describe("cuerpoInversion", () => {
  it("recorta el nombre; efectivo vacío → ausente", () => {
    expect(cuerpoInversion({ nombre: "  eToro ", moneda: "USD", efectivoInicial: "" })).toEqual({ nombre: "eToro", moneda: "USD" });
  });

  it("efectivo en su moneda", () => {
    expect(cuerpoInversion({ nombre: "eToro", moneda: "USD", efectivoInicial: "513,61" })).toEqual({
      nombre: "eToro",
      moneda: "USD",
      efectivoInicial: "51361",
    });
    expect(cuerpoInversion({ nombre: "Acciones COP", moneda: "COP", efectivoInicial: "1.000.000" })).toEqual({
      nombre: "Acciones COP",
      moneda: "COP",
      efectivoInicial: "1000000",
    });
  });

  it("monto mal escrito → null", () => {
    expect(cuerpoInversion({ nombre: "eToro", moneda: "USD", efectivoInicial: "1,234" })).toBeNull();
    expect(cuerpoInversion({ nombre: "x", moneda: "COP", efectivoInicial: "10,5" })).toBeNull();
  });
});

describe("normalizarSimbolo y simboloValido", () => {
  it("recorta y pasa a mayúsculas", () => {
    expect(normalizarSimbolo("  voo ")).toBe("VOO");
  });

  it("valida A-Z 0-9 . - hasta 12", () => {
    expect(simboloValido("BRK.B")).toBe(true);
    expect(simboloValido("ECOPETROL")).toBe(true);
    expect(simboloValido("VO O")).toBe(false);
    expect(simboloValido("ABCDEFGHIJKLM")).toBe(false);
    expect(simboloValido("")).toBe(false);
  });
});

describe("activoEnCuenta", () => {
  const posiciones = [{ activoId: "a1", simbolo: "VOO", nombre: "Vanguard S&P 500 ETF" }];
  const operaciones = [
    { activo: { id: "a1", simbolo: "VOO", nombre: "Vanguard S&P 500 ETF" } },
    { activo: { id: "a9", simbolo: "QQQ", nombre: "Invesco QQQ Trust" } },
  ];

  it("posición abierta", () => {
    expect(activoEnCuenta("voo", posiciones, operaciones)).toEqual({ id: "a1", nombre: "Vanguard S&P 500 ETF" });
  });

  it("posición cerrada: sale de las operaciones", () => {
    expect(activoEnCuenta("QQQ", posiciones, operaciones)).toEqual({ id: "a9", nombre: "Invesco QQQ Trust" });
  });

  it("ausente", () => {
    expect(activoEnCuenta("MSFT", posiciones, operaciones)).toBeNull();
    expect(activoEnCuenta("", posiciones, operaciones)).toBeNull();
  });
});

describe("cuerpoOperacion", () => {
  const base: ValoresOperacion = { ...VALORES_OPERACION("2026-11-11"), simbolo: " msft", nombre: "Microsoft", cantidad: "2", total: "800,00" };

  it("activo nuevo: con nombre, cantidad y total en USD", () => {
    expect(cuerpoOperacion(base, "USD", false)).toEqual({
      clase: "compra",
      simbolo: "MSFT",
      nombre: "Microsoft",
      cantidad: "2",
      monto: "80000",
      fecha: "2026-11-11",
    });
  });

  it("activo en la cuenta: sin nombre", () => {
    expect(cuerpoOperacion(base, "USD", true)).not.toHaveProperty("nombre");
  });

  it("nombre vacío: ausente", () => {
    expect(cuerpoOperacion({ ...base, nombre: "  " }, "USD", false)).not.toHaveProperty("nombre");
  });

  it("total en COP y fecha vacía → ausente", () => {
    const cop = { ...base, clase: "inicial" as const, simbolo: "ECOPETROL", cantidad: "100", total: "250.000", fecha: "" };
    expect(cuerpoOperacion(cop, "COP", false)).toEqual({
      clase: "inicial",
      simbolo: "ECOPETROL",
      nombre: "Microsoft",
      cantidad: "100",
      monto: "250000",
    });
  });

  it("cantidad o total inválidos → null", () => {
    expect(cuerpoOperacion({ ...base, cantidad: "1,123456789" }, "USD", false)).toBeNull();
    expect(cuerpoOperacion({ ...base, cantidad: "0" }, "USD", false)).toBeNull();
    expect(cuerpoOperacion({ ...base, total: "800,001" }, "USD", false)).toBeNull();
    expect(cuerpoOperacion({ ...base, total: "0" }, "USD", false)).toBeNull();
    expect(cuerpoOperacion({ ...base, total: "250,5" }, "COP", false)).toBeNull();
  });
});

describe("valoresEdicion y cambioOperacion", () => {
  const operacion = { cantidad: "6.25", monto: 311_700n, fecha: "2026-10-02" };
  const antes = valoresEdicion(operacion, "USD");

  it("precarga", () => {
    expect(antes).toEqual({ cantidad: "6,25", total: "3.117,00", fecha: "2026-10-02" });
  });

  it("sin cambios → null (también con otro formato)", () => {
    expect(cambioOperacion(antes, antes, "USD")).toBeNull();
    expect(cambioOperacion(antes, { ...antes, cantidad: "6,2500", total: "3117" }, "USD")).toBeNull();
  });

  it("solo fecha", () => {
    expect(cambioOperacion(antes, { ...antes, fecha: "2026-10-03" }, "USD")).toEqual({ fecha: "2026-10-03" });
  });

  it("cantidad y total", () => {
    expect(cambioOperacion(antes, { ...antes, cantidad: "7", total: "3.500" }, "USD")).toEqual({ cantidad: "7", monto: "350000" });
  });

  it("inválido", () => {
    expect(cambioOperacion(antes, { ...antes, cantidad: "" }, "USD")).toBe("invalido");
    expect(cambioOperacion(antes, { ...antes, total: "1,234" }, "USD")).toBe("invalido");
    expect(cambioOperacion(antes, { ...antes, fecha: "" }, "USD")).toBe("invalido");
  });
});

describe("cuerpoPrecio", () => {
  it("en su moneda", () => {
    expect(cuerpoPrecio("411,06", "USD")).toEqual({ precio: "41106" });
    expect(cuerpoPrecio("2.500", "COP")).toEqual({ precio: "2500" });
  });

  it("vacío, cero o tres decimales → null", () => {
    expect(cuerpoPrecio("", "USD")).toBeNull();
    expect(cuerpoPrecio("0", "USD")).toBeNull();
    expect(cuerpoPrecio("411,061", "USD")).toBeNull();
  });
});
