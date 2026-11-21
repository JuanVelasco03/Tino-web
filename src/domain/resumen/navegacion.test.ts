import { describe, expect, it } from "vitest";
import { limitesMes } from "./navegacion";

const HOY = "2026-11-21";

describe("limitesMes", () => {
  it("mes actual: anterior sí, siguiente no", () => {
    expect(limitesMes({ mes: "2026-11", desde: "2026-11-01", inicio: "2026-10-01", fechaHoy: HOY })).toEqual({
      actual: "2026-11",
      hayAnterior: true,
      haySiguiente: false,
    });
  });

  it("mes de inicio (desde = inicio): sin anterior, con siguiente", () => {
    expect(limitesMes({ mes: "2026-10", desde: "2026-10-01", inicio: "2026-10-01", fechaHoy: HOY })).toEqual({
      actual: "2026-11",
      hayAnterior: false,
      haySiguiente: true,
    });
  });

  it("inicio a mitad de mes: ese mes aún tiene anterior", () => {
    expect(limitesMes({ mes: "2026-10", desde: "2026-10-01", inicio: "2026-10-15", fechaHoy: HOY }).hayAnterior).toBe(false);
    expect(limitesMes({ mes: "2026-11", desde: "2026-11-01", inicio: "2026-10-15", fechaHoy: HOY }).hayAnterior).toBe(true);
  });

  it("mes anterior a inicio: sin anterior", () => {
    expect(limitesMes({ mes: "2026-08", desde: "2026-08-01", inicio: "2026-10-01", fechaHoy: HOY })).toEqual({
      actual: "2026-11",
      hayAnterior: false,
      haySiguiente: true,
    });
  });

  it("inicio nulo (sin cuentas): sin anterior", () => {
    expect(limitesMes({ mes: "2026-11", desde: "2026-11-01", inicio: null, fechaHoy: HOY }).hayAnterior).toBe(false);
  });

  it("cambio de año", () => {
    expect(limitesMes({ mes: "2025-12", desde: "2025-12-01", inicio: "2025-01-01", fechaHoy: "2026-01-02" })).toEqual({
      actual: "2026-01",
      hayAnterior: true,
      haySiguiente: true,
    });
  });
});
