import { describe, expect, it } from "vitest";
import { cambiosEdicion, type CuentaEditable, type ValoresCuenta } from "./edicion";

const BANCO: CuentaEditable = {
  nombre: "Nequi",
  tipo: "banco",
  detalle: null,
  saldoInicial: 20_321n,
  tarjeta: null,
};

const TARJETA: CuentaEditable = {
  nombre: "Visa",
  tipo: "tarjeta_credito",
  detalle: "Visa ·· 1234",
  saldoInicial: 1_284_300n,
  tarjeta: { cupo: 4_000_000n },
};

const SIN_CAMBIOS_BANCO: ValoresCuenta = { nombre: "Nequi", tipo: "banco", detalle: "", saldo: "20.321", cupo: "" };
const SIN_CAMBIOS_TARJETA: ValoresCuenta = {
  nombre: "Visa",
  tipo: "tarjeta_credito",
  detalle: "Visa ·· 1234",
  saldo: "1.284.300",
  cupo: "4.000.000",
};

describe("cambiosEdicion", () => {
  it("nada cambió → null", () => {
    expect(cambiosEdicion(BANCO, SIN_CAMBIOS_BANCO)).toBeNull();
    expect(cambiosEdicion(TARJETA, SIN_CAMBIOS_TARJETA)).toBeNull();
  });

  it("nombre con espacios alrededor → sin cambio", () => {
    expect(cambiosEdicion(BANCO, { ...SIN_CAMBIOS_BANCO, nombre: "  Nequi " })).toBeNull();
  });

  it("solo el nombre → { nombre } recortado", () => {
    expect(cambiosEdicion(BANCO, { ...SIN_CAMBIOS_BANCO, nombre: " Nequi ahorros " })).toEqual({ nombre: "Nequi ahorros" });
  });

  it("detalle vacío sobre null → sin cambio", () => {
    expect(cambiosEdicion(BANCO, { ...SIN_CAMBIOS_BANCO, detalle: "   " })).toBeNull();
  });

  it("detalle borrado → detalle: null", () => {
    expect(cambiosEdicion(TARJETA, { ...SIN_CAMBIOS_TARJETA, detalle: "" })).toEqual({ detalle: null });
  });

  it("detalle nuevo → recortado", () => {
    expect(cambiosEdicion(BANCO, { ...SIN_CAMBIOS_BANCO, detalle: " Celular ·· 3108 " })).toEqual({
      detalle: "Celular ·· 3108",
    });
  });

  it("saldo «20.321» sobre 20321n → sin cambio", () => {
    expect(cambiosEdicion(BANCO, { ...SIN_CAMBIOS_BANCO, saldo: "20.321" })).toBeNull();
  });

  it("saldo distinto → saldoInicial como string entero", () => {
    expect(cambiosEdicion(BANCO, { ...SIN_CAMBIOS_BANCO, saldo: "1.000.000" })).toEqual({ saldoInicial: "1000000" });
  });

  it("saldo vacío vale 0", () => {
    expect(cambiosEdicion(BANCO, { ...SIN_CAMBIOS_BANCO, saldo: "" })).toEqual({ saldoInicial: "0" });
    expect(cambiosEdicion({ ...BANCO, saldoInicial: 0n }, { ...SIN_CAMBIOS_BANCO, saldo: "" })).toBeNull();
  });

  it("banco → efectivo → { tipo }", () => {
    expect(cambiosEdicion(BANCO, { ...SIN_CAMBIOS_BANCO, tipo: "efectivo" })).toEqual({ tipo: "efectivo" });
  });

  it("cupo solo cuenta en una tarjeta", () => {
    expect(cambiosEdicion(TARJETA, { ...SIN_CAMBIOS_TARJETA, cupo: "5.000.000" })).toEqual({ cupo: "5000000" });
    expect(cambiosEdicion(BANCO, { ...SIN_CAMBIOS_BANCO, cupo: "5.000.000" })).toBeNull();
  });

  it("varios cambios a la vez", () => {
    expect(
      cambiosEdicion(TARJETA, { ...SIN_CAMBIOS_TARJETA, nombre: "Visa Oro", saldo: "0", cupo: "6.000.000" }),
    ).toEqual({ nombre: "Visa Oro", saldoInicial: "0", cupo: "6000000" });
  });
});

describe("cambiosEdicion de una inversión", () => {
  const ETORO: CuentaEditable = { nombre: "eToro", tipo: "inversion", moneda: "USD", detalle: null, saldoInicial: 51_361n, tarjeta: null };
  const SIN_CAMBIOS: ValoresCuenta = { nombre: "eToro", tipo: "inversion", detalle: "", saldo: "513,61", cupo: "" };

  it("efectivo inicial en dólares sin cambios → null", () => {
    expect(cambiosEdicion(ETORO, SIN_CAMBIOS)).toBeNull();
  });

  it("efectivo inicial en centavos", () => {
    expect(cambiosEdicion(ETORO, { ...SIN_CAMBIOS, saldo: "1.000,50" })).toEqual({ saldoInicial: "100050" });
  });

  it("el tipo nunca se envía", () => {
    expect(cambiosEdicion(ETORO, { ...SIN_CAMBIOS, nombre: "eToro USD" })).toEqual({ nombre: "eToro USD" });
  });

  it("efectivo mal escrito se devuelve tal cual (la acción lo rechaza)", () => {
    expect(cambiosEdicion(ETORO, { ...SIN_CAMBIOS, saldo: "1,234" })).toEqual({ saldoInicial: "1,234" });
  });
});
