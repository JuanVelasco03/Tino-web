import { describe, expect, it } from "vitest";
import {
  cambiaCalendario,
  cuerpoDesdeValores,
  hayCambios,
  permiteUltimoDia,
  VALORES_ALTA,
  valoresDesdePlantilla,
  type ValoresPlantilla,
} from "./formulario";
import type { Recurrente } from "./tipos";

const GAS: Recurrente = {
  id: "a40",
  tipo: "gasto",
  concepto: "Gas Vanti",
  monto: 32_400n,
  variable: true,
  periodicidad: "mensual",
  primerVencimiento: "2026-01-14",
  ultimoDia: false,
  cuentaOrigen: { id: "banco", nombre: "Bancolombia" },
  cuentaDestino: null,
  categoria: { id: "servicios", nombre: "Servicios" },
  pausada: false,
  pausadaDesde: null,
  ultimoConfirmado: { monto: 31_870n, vencimiento: "2026-10-14" },
  ocurrenciasDelMes: [],
  proximoVencimiento: "2026-11-14",
};

const COMPLETOS: ValoresPlantilla = {
  tipo: "gasto",
  concepto: "Agua",
  monto: "40.000",
  variable: false,
  periodicidad: "mensual",
  primerVencimiento: "2026-11-12",
  ultimoDia: true,
  cuentaOrigenId: "banco",
  cuentaDestinoId: "nequi",
  categoriaId: "servicios",
};

describe("VALORES_ALTA", () => {
  it("gasto mensual fijo que vence hoy, sin cuentas ni categoría", () => {
    expect(VALORES_ALTA("2026-11-11")).toEqual({
      tipo: "gasto",
      concepto: "",
      monto: "",
      variable: false,
      periodicidad: "mensual",
      primerVencimiento: "2026-11-11",
      ultimoDia: false,
      cuentaOrigenId: null,
      cuentaDestinoId: null,
      categoriaId: null,
    });
  });
});

describe("valoresDesdePlantilla", () => {
  it("precarga la plantilla con el monto formateado y los ids de sus referencias", () => {
    expect(valoresDesdePlantilla(GAS)).toEqual({
      tipo: "gasto",
      concepto: "Gas Vanti",
      monto: "32.400",
      variable: true,
      periodicidad: "mensual",
      primerVencimiento: "2026-01-14",
      ultimoDia: false,
      cuentaOrigenId: "banco",
      cuentaDestinoId: null,
      categoriaId: "servicios",
    });
  });
});

describe("cuerpoDesdeValores", () => {
  it("gasto: cuenta de origen y categoría, sin destino", () => {
    expect(cuerpoDesdeValores(COMPLETOS)).toEqual({
      tipo: "gasto",
      concepto: "Agua",
      monto: "40000",
      variable: false,
      periodicidad: "mensual",
      primerVencimiento: "2026-11-12",
      ultimoDia: true,
      cuentaOrigenId: "banco",
      categoriaId: "servicios",
    });
  });

  it("ingreso: cuenta de destino y categoría, sin origen", () => {
    const cuerpo = cuerpoDesdeValores({ ...COMPLETOS, tipo: "ingreso" });
    expect(cuerpo).toMatchObject({ tipo: "ingreso", cuentaDestinoId: "nequi", categoriaId: "servicios" });
    expect(cuerpo).not.toHaveProperty("cuentaOrigenId");
  });

  it("transferencia: ambas cuentas, nunca categoría", () => {
    const cuerpo = cuerpoDesdeValores({ ...COMPLETOS, tipo: "transferencia" });
    expect(cuerpo).toMatchObject({ cuentaOrigenId: "banco", cuentaDestinoId: "nequi" });
    expect(cuerpo).not.toHaveProperty("categoriaId");
  });

  it("sin categoría → categoriaId null", () => {
    expect(cuerpoDesdeValores({ ...COMPLETOS, categoriaId: null })?.categoriaId).toBeNull();
  });

  it("descarta ultimoDia en semanal y quincenal", () => {
    expect(cuerpoDesdeValores({ ...COMPLETOS, periodicidad: "semanal" })?.ultimoDia).toBe(false);
    expect(cuerpoDesdeValores({ ...COMPLETOS, periodicidad: "quincenal" })?.ultimoDia).toBe(false);
    expect(cuerpoDesdeValores({ ...COMPLETOS, periodicidad: "anual" })?.ultimoDia).toBe(true);
  });

  it.each(["", "0", "12,5", "-3", "abc"])("monto %j → null", (monto) => {
    expect(cuerpoDesdeValores({ ...COMPLETOS, monto })).toBeNull();
  });
});

describe("permiteUltimoDia", () => {
  it("mensual o más", () => {
    expect(permiteUltimoDia("semanal")).toBe(false);
    expect(permiteUltimoDia("quincenal")).toBe(false);
    expect(permiteUltimoDia("mensual")).toBe(true);
    expect(permiteUltimoDia("anual")).toBe(true);
  });
});

describe("cambiaCalendario", () => {
  it("periodicidad, primer vencimiento o último día", () => {
    expect(cambiaCalendario(COMPLETOS, { ...COMPLETOS, periodicidad: "bimestral" })).toBe(true);
    expect(cambiaCalendario(COMPLETOS, { ...COMPLETOS, primerVencimiento: "2026-11-13" })).toBe(true);
    expect(cambiaCalendario(COMPLETOS, { ...COMPLETOS, ultimoDia: false })).toBe(true);
  });

  it("monto, concepto o cuentas no lo cambian", () => {
    expect(cambiaCalendario(COMPLETOS, { ...COMPLETOS, monto: "50.000", concepto: "Agua EAAB", cuentaOrigenId: "nequi" })).toBe(false);
  });

  it("ultimoDia no cuenta en semanal", () => {
    const semanal = { ...COMPLETOS, periodicidad: "semanal" as const };
    expect(cambiaCalendario(semanal, { ...semanal, ultimoDia: false })).toBe(false);
  });
});

describe("hayCambios", () => {
  it("compara campo por campo", () => {
    expect(hayCambios(COMPLETOS, { ...COMPLETOS })).toBe(false);
    expect(hayCambios(COMPLETOS, { ...COMPLETOS, variable: true })).toBe(true);
  });
});
