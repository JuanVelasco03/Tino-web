import { describe, expect, it } from "vitest";
import type { Ocurrencia, Recurrente } from "./tipos";
import {
  estaVencida,
  etiquetaUltimo,
  formatearCada,
  formatearVence,
  notaVencimiento,
  ocurrenciaDelMes,
  textoRelativo,
} from "./vencimiento";

const HOY = "2026-11-11";

describe("textoRelativo", () => {
  it.each([
    ["2026-11-11", "hoy"],
    ["2026-11-12", "mañana"],
    ["2026-11-14", "en 3 días"],
    ["2026-11-10", "vencido ayer"],
    ["2026-11-08", "vencido hace 3 días"],
  ])("%s → %s", (vencimiento, texto) => {
    expect(textoRelativo(vencimiento, HOY)).toBe(texto);
  });

  it("cruza el cambio de mes y de año", () => {
    expect(textoRelativo("2026-12-01", "2026-11-30")).toBe("mañana");
    expect(textoRelativo("2026-10-31", "2026-11-02")).toBe("vencido hace 2 días");
    expect(textoRelativo("2027-01-02", "2026-12-30")).toBe("en 3 días");
  });
});

describe("estaVencida", () => {
  it("solo antes de hoy", () => {
    expect(estaVencida("2026-11-10", HOY)).toBe(true);
    expect(estaVencida(HOY, HOY)).toBe(false);
    expect(estaVencida("2026-11-12", HOY)).toBe(false);
  });
});

describe("formatearCada", () => {
  it("nombra la periodicidad", () => {
    expect(formatearCada("semanal")).toBe("Semanal");
    expect(formatearCada("bimestral")).toBe("Bimestral");
    expect(formatearCada("anual")).toBe("Anual");
  });
});

describe("formatearVence", () => {
  const base = { primerVencimiento: "2026-11-18", ultimoDia: false };

  it("mensual, bimestral y trimestral: día o último día", () => {
    expect(formatearVence({ ...base, periodicidad: "mensual" })).toBe("Día 18");
    expect(formatearVence({ ...base, periodicidad: "bimestral" })).toBe("Día 18");
    expect(formatearVence({ ...base, periodicidad: "trimestral" })).toBe("Día 18");
    expect(formatearVence({ ...base, periodicidad: "mensual", ultimoDia: true })).toBe("Último día");
    expect(formatearVence({ periodicidad: "mensual", primerVencimiento: "2026-11-01", ultimoDia: false })).toBe("Día 1");
  });

  it("anual: la fecha; con último día, el último del mes", () => {
    expect(formatearVence({ ...base, periodicidad: "anual" })).toBe("18 nov");
    expect(formatearVence({ periodicidad: "anual", primerVencimiento: "2027-02-10", ultimoDia: true })).toBe("28 feb");
  });

  it("semanal: el día de la semana; quincenal: 15 y último", () => {
    expect(formatearVence({ periodicidad: "semanal", primerVencimiento: "2026-11-12", ultimoDia: false })).toBe("Jueves");
    expect(formatearVence({ ...base, periodicidad: "quincenal" })).toBe("15 y último");
  });
});

describe("notaVencimiento", () => {
  it("una frase por periodicidad", () => {
    const d = { primerVencimiento: "2026-11-12", ultimoDia: false };
    expect(notaVencimiento({ ...d, periodicidad: "mensual" })).toBe("Vence el día 12 de cada mes.");
    expect(notaVencimiento({ ...d, periodicidad: "mensual", ultimoDia: true })).toBe("Vence el último día de cada mes.");
    expect(notaVencimiento({ ...d, periodicidad: "bimestral" })).toBe("Vence el día 12 cada 2 meses.");
    expect(notaVencimiento({ ...d, periodicidad: "trimestral", ultimoDia: true })).toBe("Vence el último día cada 3 meses.");
    expect(notaVencimiento({ ...d, periodicidad: "anual" })).toBe("Vence cada año el 12 nov.");
    expect(notaVencimiento({ ...d, periodicidad: "semanal" })).toBe("Vence cada jueves.");
    expect(notaVencimiento({ ...d, periodicidad: "quincenal" })).toBe("Vence el 15 y el último día de cada mes.");
  });
});

describe("etiquetaUltimo", () => {
  it("nombra el periodo anterior", () => {
    expect(etiquetaUltimo("semanal")).toBe("Última semana");
    expect(etiquetaUltimo("quincenal")).toBe("Última quincena");
    expect(etiquetaUltimo("mensual")).toBe("Último mes");
    expect(etiquetaUltimo("bimestral")).toBe("Último bimestre");
    expect(etiquetaUltimo("trimestral")).toBe("Último trimestre");
    expect(etiquetaUltimo("anual")).toBe("Último año");
  });
});

describe("ocurrenciaDelMes", () => {
  function oc(vencimiento: string, estado: Ocurrencia["estado"]): Ocurrencia {
    return { recurrenteId: "r", vencimiento, estado, monto: 1000n, estimado: false, movimientoId: null };
  }
  const con = (ocurrenciasDelMes: Ocurrencia[]): Pick<Recurrente, "ocurrenciasDelMes"> => ({ ocurrenciasDelMes });

  it("sin ocurrencias → null", () => {
    expect(ocurrenciaDelMes(con([]))).toBeNull();
  });

  it("una abierta → esa", () => {
    const abierta = oc("2026-11-14", "por_confirmar");
    expect(ocurrenciaDelMes(con([abierta]))).toBe(abierta);
  });

  it("varias con cerradas → la primera sin cerrar", () => {
    const programada = oc("2026-11-19", "programada");
    expect(
      ocurrenciaDelMes(con([oc("2026-11-05", "pagada"), oc("2026-11-12", "omitida"), programada, oc("2026-11-26", "programada")])),
    ).toBe(programada);
  });

  it("todas cerradas → la última", () => {
    const ultima = oc("2026-11-12", "omitida");
    expect(ocurrenciaDelMes(con([oc("2026-11-05", "pagada"), ultima]))).toBe(ultima);
  });
});
