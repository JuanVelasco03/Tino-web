import { describe, expect, it } from "vitest";
import { diasDelMes, mismoDiaEnMes, nombreDia, semanasDelMes } from "./calendario";

describe("diasDelMes", () => {
  it("cuenta febrero bisiesto y no bisiesto", () => {
    expect(diasDelMes("2026-02")).toBe(28);
    expect(diasDelMes("2028-02")).toBe(29);
    expect(diasDelMes("2026-11")).toBe(30);
    expect(diasDelMes("2026-12")).toBe(31);
  });

  it("rechaza un mes mal formado", () => {
    expect(() => diasDelMes("2026-13")).toThrow();
  });
});

describe("semanasDelMes", () => {
  it("arranca la semana en lunes: noviembre de 2026 empieza en domingo", () => {
    const semanas = semanasDelMes("2026-11");
    expect(semanas[0]).toEqual([null, null, null, null, null, null, "2026-11-01"]);
    expect(semanas[1][0]).toBe("2026-11-02");
    expect(semanas.at(-1)).toEqual(["2026-11-30", null, null, null, null, null, null]);
    expect(semanas).toHaveLength(6);
  });

  it("un mes que empieza en lunes no tiene casillas vacías al inicio", () => {
    const semanas = semanasDelMes("2026-06");
    expect(semanas[0][0]).toBe("2026-06-01");
    expect(semanas.flat().filter(Boolean)).toHaveLength(30);
  });

  it("todas las semanas tienen siete casillas", () => {
    for (const semana of semanasDelMes("2027-02")) expect(semana).toHaveLength(7);
  });
});

describe("nombreDia", () => {
  it("nombra el día completo, sin depender de la zona", () => {
    expect(nombreDia("2026-11-24")).toBe("martes 24 de noviembre de 2026");
    expect(nombreDia("2026-11-01")).toBe("domingo 1 de noviembre de 2026");
  });
});

describe("mismoDiaEnMes", () => {
  it("pasa de mes conservando el día", () => {
    expect(mismoDiaEnMes("2026-11-24", 1)).toBe("2026-12-24");
    expect(mismoDiaEnMes("2026-12-24", 1)).toBe("2027-01-24");
    expect(mismoDiaEnMes("2026-01-10", -1)).toBe("2025-12-10");
  });

  it("recorta al último día cuando el mes destino es más corto", () => {
    expect(mismoDiaEnMes("2026-01-31", 1)).toBe("2026-02-28");
    expect(mismoDiaEnMes("2026-03-31", -1)).toBe("2026-02-28");
  });
});
