import { beforeEach, describe, expect, it, vi } from "vitest";

// La conversión es pura: el cliente HTTP (cookies, entorno) no participa.
vi.mock("./cliente", () => ({
  obtener: vi.fn(),
  ErrorApi: class extends Error {},
}));

import { obtener } from "./cliente";
import { aResumen, obtenerResumen, type ResumenDto } from "./resumen";

// Ejemplo JSON de `GET /resumen` en Tino-API docs/api/resumen.md.
const EJEMPLO: ResumenDto = {
  mes: "2026-11",
  mesAnterior: "2026-10",
  desde: "2026-11-01",
  hasta: "2026-11-30",
  fechaHoy: "2026-11-21",
  inicio: "2026-10-01",
  tieneMovimientos: true,
  cuentasActivas: 2,
  cantidadMovimientos: 3,
  ingresos: { actual: "0", anterior: "2000000", variacion: "-2000000", variacionPorcentaje: -1000 },
  gastos: { actual: "300000", anterior: "420000", variacion: "-120000", variacionPorcentaje: -286 },
  resultado: { actual: "-300000", anterior: "1580000", variacion: "-1880000", variacionPorcentaje: -1190 },
  categorias: [
    { categoria: { id: "bb9f…", nombre: "Comida" }, monto: "260000", anterior: "300000", variacion: "-40000", porcentaje: 867 },
    { categoria: { id: "bb4e…", nombre: "Mercado" }, monto: "30000", anterior: "0", variacion: "30000", porcentaje: 100 },
    { categoria: { id: "bb2c…", nombre: "Transporte" }, monto: "0", anterior: "20000", variacion: "-20000", porcentaje: 0 },
  ],
  sinCategoria: { monto: "10000", anterior: "100000", variacion: "-90000", porcentaje: 33, cantidad: 1 },
  patrimonio: {
    hoy: "2280000",
    serie: [
      { fecha: "2026-10-31", patrimonio: "2580000" },
      { fecha: "2026-11-21", patrimonio: "2280000" },
    ],
    variacionSerie: "-300000",
  },
  cambioDelMes: {
    fechaAnterior: "2026-10-31",
    fechaCierre: "2026-11-30",
    patrimonioAnterior: "2580000",
    resultado: "-300000",
    revaluacion: "0",
    otrosCambios: "0",
    patrimonioCierre: "2280000",
  },
};

describe("aResumen", () => {
  const r = aResumen(EJEMPLO);

  it("copia fechas, banderas y contadores tal cual", () => {
    expect(r).toMatchObject({
      mes: "2026-11",
      mesAnterior: "2026-10",
      desde: "2026-11-01",
      hasta: "2026-11-30",
      fechaHoy: "2026-11-21",
      inicio: "2026-10-01",
      tieneMovimientos: true,
      cuentasActivas: 2,
      cantidadMovimientos: 3,
    });
  });

  it("convierte los montos de las cifras a bigint, con signo", () => {
    expect(r.ingresos).toEqual({ actual: 0n, anterior: 2_000_000n, variacion: -2_000_000n, variacionPorcentaje: -1000 });
    expect(r.gastos).toEqual({ actual: 300_000n, anterior: 420_000n, variacion: -120_000n, variacionPorcentaje: -286 });
    expect(r.resultado).toEqual({ actual: -300_000n, anterior: 1_580_000n, variacion: -1_880_000n, variacionPorcentaje: -1190 });
  });

  it("categorías en el orden de la API, porcentajes intactos", () => {
    expect(r.categorias).toEqual([
      { categoria: { id: "bb9f…", nombre: "Comida" }, monto: 260_000n, anterior: 300_000n, variacion: -40_000n, porcentaje: 867 },
      { categoria: { id: "bb4e…", nombre: "Mercado" }, monto: 30_000n, anterior: 0n, variacion: 30_000n, porcentaje: 100 },
      { categoria: { id: "bb2c…", nombre: "Transporte" }, monto: 0n, anterior: 20_000n, variacion: -20_000n, porcentaje: 0 },
    ]);
    expect(r.sinCategoria).toEqual({ monto: 10_000n, anterior: 100_000n, variacion: -90_000n, porcentaje: 33, cantidad: 1 });
  });

  it("patrimonio y puente en bigint", () => {
    expect(r.patrimonio).toEqual({
      hoy: 2_280_000n,
      serie: [
        { fecha: "2026-10-31", patrimonio: 2_580_000n },
        { fecha: "2026-11-21", patrimonio: 2_280_000n },
      ],
      variacionSerie: -300_000n,
    });
    expect(r.cambioDelMes).toEqual({
      fechaAnterior: "2026-10-31",
      fechaCierre: "2026-11-30",
      patrimonioAnterior: 2_580_000n,
      resultado: -300_000n,
      revaluacion: 0n,
      otrosCambios: 0n,
      patrimonioCierre: 2_280_000n,
    });
  });

  it("porcentajes null se conservan (sin base)", () => {
    const sinBase = aResumen({
      ...EJEMPLO,
      ingresos: { actual: "0", anterior: "0", variacion: "0", variacionPorcentaje: null },
      sinCategoria: { ...EJEMPLO.sinCategoria, porcentaje: null },
    });
    expect(sinBase.ingresos.variacionPorcentaje).toBeNull();
    expect(sinBase.sinCategoria.porcentaje).toBeNull();
  });

  it("montos mayores que Number.MAX_SAFE_INTEGER no pierden precisión", () => {
    const grande = aResumen({ ...EJEMPLO, patrimonio: { ...EJEMPLO.patrimonio, hoy: "9007199254740993" } });
    expect(grande.patrimonio.hoy).toBe(9_007_199_254_740_993n);
  });
});

describe("obtenerResumen", () => {
  beforeEach(() => vi.mocked(obtener).mockReset());

  it("sin mes pide /resumen", async () => {
    vi.mocked(obtener).mockResolvedValue(EJEMPLO);
    await obtenerResumen();
    expect(obtener).toHaveBeenCalledWith("/resumen");
  });

  it("con mes pide /resumen?mes=", async () => {
    vi.mocked(obtener).mockResolvedValue(EJEMPLO);
    const r = await obtenerResumen("2026-10");
    expect(obtener).toHaveBeenCalledWith("/resumen?mes=2026-10");
    expect(r.mes).toBe("2026-11");
  });

  it("un 404 es un error", async () => {
    vi.mocked(obtener).mockResolvedValue(null);
    await expect(obtenerResumen()).rejects.toThrow();
  });
});
