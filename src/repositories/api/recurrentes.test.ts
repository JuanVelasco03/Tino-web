import { beforeEach, describe, expect, it, vi } from "vitest";

// La conversión es pura: el cliente HTTP (cookies, entorno) no participa.
vi.mock("./cliente", () => ({
  obtener: vi.fn(),
  enviar: vi.fn(),
  ErrorApi: class extends Error {},
}));

import { enviar, obtener } from "./cliente";
import type { MovimientoDto } from "./movimientos";
import {
  aRecurrentes,
  confirmarOcurrencia,
  crearRecurrente,
  deshacerOmision,
  eliminarRecurrente,
  obtenerRecurrentes,
  omitirOcurrencia,
  pausarRecurrente,
  reemplazarRecurrente,
  type RecurrenteCuerpo,
  type RecurrenteDto,
  type RecurrentesDto,
} from "./recurrentes";

const GAS: RecurrenteDto = {
  id: "a40",
  tipo: "gasto",
  concepto: "Gas Vanti",
  monto: "32400",
  variable: true,
  periodicidad: "mensual",
  primerVencimiento: "2026-01-14",
  ultimoDia: false,
  cuentaOrigen: { id: "b01", nombre: "Bancolombia" },
  cuentaDestino: null,
  categoria: { id: "c01", nombre: "Servicios" },
  pausada: false,
  pausadaDesde: null,
  ultimoConfirmado: { monto: "31870", vencimiento: "2026-10-14" },
  ocurrenciasDelMes: [
    { recurrenteId: "a40", vencimiento: "2026-11-14", estado: "por_confirmar", monto: "31870", estimado: true, movimientoId: null },
  ],
  proximoVencimiento: "2026-11-14",
  creadoEn: "2026-01-02T15:00:00.000Z",
  actualizadoEn: "2026-10-14T15:00:00.000Z",
};

// Ejemplo JSON de `GET /recurrentes` en Tino-API docs/api/recurrentes.md.
const EJEMPLO: RecurrentesDto = {
  fechaHoy: "2026-11-11",
  mes: "2026-11",
  ventanaDias: 7,
  bandeja: [
    { recurrenteId: "7c1…", vencimiento: "2026-11-12", estado: "por_confirmar", monto: "89900", estimado: false, movimientoId: null },
    { recurrenteId: "a40…", vencimiento: "2026-11-14", estado: "por_confirmar", monto: "31870", estimado: true, movimientoId: null },
  ],
  comprometido: {
    total: "1618170",
    pagado: { monto: "1396220", cantidad: 5 },
    porConfirmar: { monto: "191150", cantidad: 4 },
    programado: { monto: "30800", cantidad: 2 },
  },
  ingresosEsperados: [
    { recurrenteId: "f02…", vencimiento: "2026-11-30", estado: "programada", monto: "4200000", estimado: false, movimientoId: null },
  ],
  recurrentes: [GAS],
};

const MOVIMIENTO: MovimientoDto = {
  id: "m01",
  tipo: "gasto",
  monto: "35120",
  moneda: "COP",
  tasa: "1",
  fecha: "2026-11-14",
  descripcion: "Gas Vanti",
  nota: null,
  cuentaOrigen: { id: "b01", nombre: "Bancolombia" },
  cuentaDestino: null,
  categoria: { id: "c01", nombre: "Servicios" },
  partes: [],
  creadoEn: "2026-11-11T15:00:00.000Z",
  actualizadoEn: "2026-11-11T15:00:00.000Z",
};

const CUERPO: RecurrenteCuerpo = {
  tipo: "gasto",
  concepto: "Agua",
  monto: "40000",
  variable: false,
  periodicidad: "mensual",
  primerVencimiento: "2026-11-12",
  ultimoDia: false,
  cuentaOrigenId: "b01",
  categoriaId: "c01",
};

describe("aRecurrentes", () => {
  it("convierte montos string → bigint y conserva fechas, estados y orden", () => {
    const r = aRecurrentes(EJEMPLO);
    expect(r.fechaHoy).toBe("2026-11-11");
    expect(r.mes).toBe("2026-11");
    expect(r.ventanaDias).toBe(7);
    expect(r.bandeja.map((o) => [o.vencimiento, o.monto, o.estimado])).toEqual([
      ["2026-11-12", 89_900n, false],
      ["2026-11-14", 31_870n, true],
    ]);
    expect(r.comprometido).toEqual({
      total: 1_618_170n,
      pagado: { monto: 1_396_220n, cantidad: 5 },
      porConfirmar: { monto: 191_150n, cantidad: 4 },
      programado: { monto: 30_800n, cantidad: 2 },
    });
    expect(r.ingresosEsperados[0].monto).toBe(4_200_000n);
  });

  it("convierte la plantilla, su último confirmado y sus ocurrencias", () => {
    const [gas] = aRecurrentes(EJEMPLO).recurrentes;
    expect(gas.monto).toBe(32_400n);
    expect(gas.ultimoConfirmado).toEqual({ monto: 31_870n, vencimiento: "2026-10-14" });
    expect(gas.ocurrenciasDelMes[0]).toMatchObject({ estado: "por_confirmar", monto: 31_870n });
    expect(gas).not.toHaveProperty("creadoEn");
  });

  it("sin último confirmado → null", () => {
    const r = aRecurrentes({ ...EJEMPLO, recurrentes: [{ ...GAS, ultimoConfirmado: null }] });
    expect(r.recurrentes[0].ultimoConfirmado).toBeNull();
  });
});

describe("llamadas", () => {
  beforeEach(() => {
    vi.mocked(obtener).mockReset();
    vi.mocked(enviar).mockReset();
  });

  it("GET /recurrentes", async () => {
    vi.mocked(obtener).mockResolvedValue(EJEMPLO);
    const r = await obtenerRecurrentes();
    expect(obtener).toHaveBeenCalledWith("/recurrentes");
    expect(r.comprometido.total).toBe(1_618_170n);
  });

  it("POST /recurrentes", async () => {
    vi.mocked(enviar).mockResolvedValue(GAS);
    expect((await crearRecurrente(CUERPO)).monto).toBe(32_400n);
    expect(enviar).toHaveBeenCalledWith("POST", "/recurrentes", CUERPO);
  });

  it("PUT /recurrentes/:id", async () => {
    vi.mocked(enviar).mockResolvedValue(GAS);
    await reemplazarRecurrente("a40", CUERPO);
    expect(enviar).toHaveBeenCalledWith("PUT", "/recurrentes/a40", CUERPO);
  });

  it("PATCH /recurrentes/:id", async () => {
    vi.mocked(enviar).mockResolvedValue({ ...GAS, pausada: true, pausadaDesde: "2026-11-12" });
    const r = await pausarRecurrente("a40", true);
    expect(enviar).toHaveBeenCalledWith("PATCH", "/recurrentes/a40", { pausada: true });
    expect(r.pausadaDesde).toBe("2026-11-12");
  });

  it("DELETE /recurrentes/:id", async () => {
    vi.mocked(enviar).mockResolvedValue(null);
    await eliminarRecurrente("a40");
    expect(enviar).toHaveBeenCalledWith("DELETE", "/recurrentes/a40");
  });

  it("POST /recurrentes/:id/confirmar sin y con monto", async () => {
    vi.mocked(enviar).mockResolvedValue(MOVIMIENTO);
    await confirmarOcurrencia("a40", "2026-11-14");
    expect(enviar).toHaveBeenLastCalledWith("POST", "/recurrentes/a40/confirmar", { vencimiento: "2026-11-14" });

    const movimiento = await confirmarOcurrencia("a40", "2026-11-14", "35120");
    expect(enviar).toHaveBeenLastCalledWith("POST", "/recurrentes/a40/confirmar", { vencimiento: "2026-11-14", monto: "35120" });
    expect(movimiento).toMatchObject({ id: "m01", monto: 35_120n });
  });

  it("POST /recurrentes/:id/omitir", async () => {
    vi.mocked(enviar).mockResolvedValue(null);
    await omitirOcurrencia("a40", "2026-11-14");
    expect(enviar).toHaveBeenCalledWith("POST", "/recurrentes/a40/omitir", { vencimiento: "2026-11-14" });
  });

  it("DELETE /recurrentes/:id/omisiones/:vencimiento", async () => {
    vi.mocked(enviar).mockResolvedValue(null);
    await deshacerOmision("a40", "2026-11-14");
    expect(enviar).toHaveBeenCalledWith("DELETE", "/recurrentes/a40/omisiones/2026-11-14");
  });
});
