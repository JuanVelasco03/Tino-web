import { describe, expect, it } from "vitest";
import { efectoEnPatrimonio, type TipoCuenta } from "../cuenta/naturaleza";
import { importeEnPatrimonio, saldoResultante, importeMostrado } from "./vista-previa";

const NEQUI = { tipo: "banco" as const, saldo: 20_321n };
const VISA = { tipo: "tarjeta_credito" as const, saldo: 1_284_300n };

describe("saldoResultante (RN-02)", () => {
  it("activo con gasto: baja", () => {
    expect(saldoResultante(NEQUI, "salida", 15_000n)).toBe(5_321n);
  });

  it("activo con ingreso: sube", () => {
    expect(saldoResultante(NEQUI, "entrada", 15_000n)).toBe(35_321n);
  });

  it("activo que queda en negativo", () => {
    expect(saldoResultante(NEQUI, "salida", 30_000n)).toBe(-9_679n);
  });

  it("tarjeta con gasto: sube la deuda", () => {
    expect(saldoResultante(VISA, "salida", 15_000n)).toBe(1_299_300n);
  });

  it("tarjeta con ingreso: baja la deuda", () => {
    expect(saldoResultante(VISA, "entrada", 15_000n)).toBe(1_269_300n);
  });

  it("transferencia: el origen sale y el destino entra", () => {
    // Pago de tarjeta desde Nequi (RN-07): Nequi baja y la deuda baja.
    expect(saldoResultante(NEQUI, "salida", 20_000n)).toBe(321n);
    expect(saldoResultante(VISA, "entrada", 20_000n)).toBe(1_264_300n);
  });

  it("no pierde precisión por encima de 2^53", () => {
    expect(saldoResultante({ tipo: "efectivo", saldo: 9_007_199_254_740_993n }, "entrada", 2n)).toBe(9_007_199_254_740_995n);
  });
});

describe("importeEnPatrimonio", () => {
  it("gasto negativo, ingreso positivo, transferencia sin signo", () => {
    expect(importeEnPatrimonio("gasto", 15_000n)).toBe(-15_000n);
    expect(importeEnPatrimonio("ingreso", 15_000n)).toBe(15_000n);
    expect(importeEnPatrimonio("transferencia", 15_000n)).toBeNull();
  });

  it.each<TipoCuenta>(["efectivo", "banco", "tarjeta_credito"])("coincide con efectoEnPatrimonio en %s", (tipo) => {
    expect(importeEnPatrimonio("gasto", 500n)).toBe(efectoEnPatrimonio(tipo, "salida", 500n));
    expect(importeEnPatrimonio("ingreso", 500n)).toBe(efectoEnPatrimonio(tipo, "entrada", 500n));
  });
});

describe("importeMostrado", () => {
  it("entre monedas: el lado COP con «US$ … · TRM …» debajo", () => {
    expect(importeMostrado({ moneda: "COP", monto: 8_240_000n, montoDestino: 200_000n, tasa: 412_000n })).toEqual({
      dinero: { monto: 8_240_000n, moneda: "COP" },
      linea: "US$ 2.000,00 · TRM 4.120,00",
    });
    expect(importeMostrado({ moneda: "USD", monto: 200_000n, montoDestino: 8_240_000n, tasa: 412_000n }).dinero).toEqual({
      monto: 8_240_000n,
      moneda: "COP",
    });
  });

  it("misma moneda: su monto, sin línea (también entre dos cuentas USD)", () => {
    expect(importeMostrado({ moneda: "COP", monto: 30_000n, montoDestino: null, tasa: 100n })).toEqual({
      dinero: { monto: 30_000n, moneda: "COP" },
      linea: null,
    });
    expect(importeMostrado({ moneda: "USD", monto: 50_000n, montoDestino: null, tasa: 100n })).toEqual({
      dinero: { monto: 50_000n, moneda: "USD" },
      linea: null,
    });
  });
});
