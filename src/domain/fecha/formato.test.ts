import { describe, expect, it } from "vitest";
import {
  esMes,
  formatearDiaSemana,
  formatearFecha,
  formatearFechaSinAnio,
  formatearMes,
  formatearMesCorto,
  formatearNombreMes,
  formatearRango,
  mesDeFecha,
  mesEnZona,
  sumarDias,
  sumarMeses,
} from "./formato";

describe("sumarDias", () => {
  it.each<[string, number, string]>([
    ["2026-11-19", -1, "2026-11-18"],
    ["2026-11-19", -2, "2026-11-17"],
    ["2026-11-19", 0, "2026-11-19"],
    ["2026-11-01", -1, "2026-10-31"], // cambio de mes
    ["2026-10-31", 1, "2026-11-01"],
    ["2026-01-01", -1, "2025-12-31"], // cambio de año
    ["2025-12-31", 1, "2026-01-01"],
    ["2028-03-01", -1, "2028-02-29"], // bisiesto
    ["2028-02-28", 1, "2028-02-29"],
    ["2027-03-01", -1, "2027-02-28"], // no bisiesto
    ["2026-11-19", 45, "2027-01-03"],
  ])("%s %+d → %s", (fecha, dias, esperado) => {
    expect(sumarDias(fecha, dias)).toBe(esperado);
  });

  it.each(["2026-02-30", "2027-02-29", "2026-11", ""])("lanza error con fecha inválida: %j", (fecha) => {
    expect(() => sumarDias(fecha, 1)).toThrow();
  });
});

describe("formatearDiaSemana", () => {
  it.each<[string, string]>([
    ["2026-11-19", "jue 19 nov"],
    ["2026-11-18", "mié 18 nov"],
    ["2026-11-22", "dom 22 nov"],
    ["2026-11-21", "sáb 21 nov"],
    ["2028-02-29", "mar 29 feb"],
    ["2026-01-01", "jue 1 ene"],
  ])("%s → %s", (fecha, esperado) => {
    expect(formatearDiaSemana(fecha)).toBe(esperado);
  });
});

describe("formatearMes", () => {
  it.each<[string, string]>([
    ["2026-11", "Noviembre 2026"],
    ["2026-01", "Enero 2026"],
    ["2027-12", "Diciembre 2027"],
  ])("%s → %s", (mes, esperado) => {
    expect(formatearMes(mes)).toBe(esperado);
  });

  it.each(["2026-13", "2026-00", "2026-11-19", "nov 2026", ""])("lanza error con mes mal formado: %j", (mes) => {
    expect(() => formatearMes(mes)).toThrow();
  });
});

describe("formatearFecha", () => {
  it.each<[string, string]>([
    ["2026-01-15", "15 ene 2026"],
    ["2026-02-15", "15 feb 2026"],
    ["2026-03-15", "15 mar 2026"],
    ["2026-04-15", "15 abr 2026"],
    ["2026-05-15", "15 may 2026"],
    ["2026-06-15", "15 jun 2026"],
    ["2026-07-15", "15 jul 2026"],
    ["2026-08-15", "15 ago 2026"],
    ["2026-09-15", "15 sep 2026"],
    ["2026-10-15", "15 oct 2026"],
    ["2026-11-18", "18 nov 2026"],
    ["2026-12-15", "15 dic 2026"],
  ])("%s → %s", (entrada, esperado) => {
    expect(formatearFecha(entrada)).toBe(esperado);
  });

  it("quita el cero a la izquierda del día", () => {
    expect(formatearFecha("2026-01-05")).toBe("5 ene 2026");
  });

  it.each(["", "2026-11", "18/11/2026", "2026-13-01", "2026-00-10", "2026-11-00", "2026-11-18T00:00:00Z"])(
    "lanza error con entrada mal formada: %j",
    (entrada) => {
      expect(() => formatearFecha(entrada)).toThrow();
    },
  );
});

describe("formatearFechaSinAnio", () => {
  it("omite el año", () => {
    expect(formatearFechaSinAnio("2026-11-18")).toBe("18 nov");
    expect(formatearFechaSinAnio("2026-01-05")).toBe("5 ene");
  });

  it("lanza error con entrada mal formada", () => {
    expect(() => formatearFechaSinAnio("nov 18")).toThrow();
  });
});

describe("sumarMeses", () => {
  it.each<[string, number, string]>([
    ["2026-11", -1, "2026-10"],
    ["2026-11", 1, "2026-12"],
    ["2026-01", -1, "2025-12"], // cambio de año hacia atrás
    ["2026-12", 1, "2027-01"], // cambio de año hacia adelante
    ["2026-11", 0, "2026-11"],
    ["2026-11", -23, "2024-12"],
    ["2026-11", 14, "2028-01"],
  ])("%s %+d → %s", (mes, n, esperado) => {
    expect(sumarMeses(mes, n)).toBe(esperado);
  });

  it.each(["2026-13", "2026-00", "hola", ""])("lanza error con mes inválido: %j", (mes) => {
    expect(() => sumarMeses(mes, 1)).toThrow();
  });
});

describe("mesDeFecha", () => {
  it("toma año y mes", () => {
    expect(mesDeFecha("2026-11-19")).toBe("2026-11");
    expect(mesDeFecha("2027-01-01")).toBe("2027-01");
  });

  it("lanza error con fecha mal formada", () => {
    expect(() => mesDeFecha("2026-11")).toThrow();
  });
});

describe("mesEnZona", () => {
  it("a medianoche UTC del día 1, en Bogotá sigue el mes anterior", () => {
    expect(mesEnZona("America/Bogota", new Date("2026-12-01T00:00:00Z"))).toBe("2026-11");
    expect(mesEnZona("UTC", new Date("2026-12-01T00:00:00Z"))).toBe("2026-12");
  });

  it("a medianoche UTC del 1 de enero, en Bogotá sigue diciembre del año anterior", () => {
    expect(mesEnZona("America/Bogota", new Date("2027-01-01T00:00:00Z"))).toBe("2026-12");
  });

  it("a las 5:00 UTC del día 1 ya es el mes nuevo en Bogotá", () => {
    expect(mesEnZona("America/Bogota", new Date("2026-12-01T05:00:00Z"))).toBe("2026-12");
  });
});

describe("esMes", () => {
  it.each([["2026-11", true], ["2026-01", true], ["2026-13", false], ["2026-00", false], ["hola", false], ["2026-11-19", false], ["", false]] as const)(
    "%j → %s",
    (texto, esperado) => {
      expect(esMes(texto)).toBe(esperado);
    },
  );
});

describe("formatearRango", () => {
  it.each<[string, string, string]>([
    ["2026-10-01", "2026-10-31", "1 – 31 oct"],
    ["2026-11-01", "2026-11-30", "1 – 30 nov"],
    ["2028-02-01", "2028-02-29", "1 – 29 feb"], // bisiesto
    ["2027-02-01", "2027-02-28", "1 – 28 feb"],
    ["2026-09-28", "2026-10-03", "28 sep – 3 oct"],
    ["2025-12-28", "2026-01-03", "28 dic 2025 – 3 ene 2026"],
  ])("%s, %s → %s", (desde, hasta, esperado) => {
    expect(formatearRango(desde, hasta)).toBe(esperado);
  });
});

describe("formatearNombreMes", () => {
  it.each<[string, string]>([
    ["2026-09", "septiembre"],
    ["2026-01", "enero"],
    ["2026-12", "diciembre"],
  ])("%s → %s", (mes, esperado) => {
    expect(formatearNombreMes(mes)).toBe(esperado);
  });

  it.each(["2026-13", "hola", ""])("lanza error con mes mal formado: %j", (mes) => {
    expect(() => formatearNombreMes(mes)).toThrow();
  });
});

describe("formatearMesCorto", () => {
  it.each<[string, string]>([
    ["2025-12", "dic 2025"],
    ["2026-10", "oct 2026"],
    ["2026-01", "ene 2026"],
  ])("%s → %s", (mes, esperado) => {
    expect(formatearMesCorto(mes)).toBe(esperado);
  });
});
