import { beforeEach, describe, expect, it, vi } from "vitest";

// La conversión es pura: el cliente HTTP (cookies, entorno) no participa.
vi.mock("./cliente", () => ({
  obtener: vi.fn(),
  enviar: vi.fn(),
  ErrorApi: class extends Error {},
}));

import { enviar, obtener } from "./cliente";
import {
  aMetaDetalle,
  aMetas,
  archivarMeta,
  cambiarMeta,
  crearMeta,
  editarAporte,
  eliminarAporte,
  eliminarMeta,
  leerMeta,
  listarArchivadas,
  listarMetas,
  registrarAporte,
  restaurarMeta,
  type MetaDetalleDto,
  type MetaDto,
  type MetasDto,
} from "./metas";

const TRM = { valor: "4120.00", vigenteDesde: "2026-11-11", vigenteHasta: "2026-11-11", fuente: "Superintendencia Financiera de Colombia" };
const NUBANK = { id: "a41e", nombre: "Nubank", tipo: "banco", moneda: "COP" } as const;

/** El JSON de `docs/api/metas.md` (`GET /metas`), con Fondo, Cuota y Moto del diseño. */
const VIAJE: MetaDto = {
  id: "8c1f",
  nombre: "Viaje a Cartagena",
  modo: "apartado",
  cuenta: NUBANK,
  objetivo: "1800000",
  avance: "600000",
  falta: "1200000",
  porcentaje: 3333,
  fechaMeta: "2026-12-15",
  cumplidaEl: null,
  uso: null,
  ritmo: { tipo: "dias", falta: "1200000", dias: 34, vencida: false },
  creadaEl: "2026-09-20",
  archivadaEn: null,
};

const CUOTA: MetaDto = {
  ...VIAJE,
  id: "c0a7",
  nombre: "Cuota inicial apartamento",
  modo: "cuenta",
  cuenta: { id: "e70r", nombre: "eToro", tipo: "inversion", moneda: "USD" },
  objetivo: "45000000",
  avance: "31930000",
  falta: "13070000",
  porcentaje: 7095,
  fechaMeta: "2027-12",
  ritmo: { tipo: "meses", falta: "13070000", meses: 13, cuotaMensual: "1005385", vencida: false },
  creadaEl: "2026-07-31",
};

const FONDO: MetaDto = {
  ...VIAJE,
  id: "f0d0",
  nombre: "Fondo de emergencia",
  objetivo: "7500000",
  avance: "1900000",
  falta: "5600000",
  porcentaje: 2533,
  fechaMeta: null,
  ritmo: { tipo: "promedio", promedioMensual: "316667", mesEstimado: "2028-05" },
  creadaEl: "2026-06-15",
};

const MOTO: MetaDto = {
  ...VIAJE,
  id: "m070",
  nombre: "Arreglo de la moto",
  cuenta: { id: "b4nc", nombre: "Bancolombia", tipo: "banco", moneda: "COP" },
  objetivo: "850000",
  avance: "850000",
  falta: "0",
  porcentaje: 10000,
  fechaMeta: null,
  cumplidaEl: "2026-09-12",
  uso: { fecha: "2026-09-14", motivo: "taller" },
  ritmo: null,
};

const LISTA: MetasDto = {
  fechaHoy: "2026-11-11",
  trm: TRM,
  totales: { avance: "34430000", objetivo: "54300000", incompleto: false },
  activas: [VIAJE, CUOTA, FONDO],
  cumplidas: [MOTO],
};

const DETALLE_FONDO: MetaDetalleDto = {
  ...FONDO,
  historial: [
    {
      id: "ap3",
      tipo: "aporte",
      fecha: "2026-11-10",
      monto: "350000",
      acumulado: "1900000",
      inicial: false,
      motivo: null,
      cuentaOrigen: { id: "b4nc", nombre: "Bancolombia" },
      movimientoId: "mv3",
    },
    {
      id: "ap2",
      tipo: "retiro",
      fecha: "2026-10-31",
      monto: "100000",
      acumulado: "1550000",
      inicial: false,
      motivo: "arreglo de la nevera",
      cuentaOrigen: null,
      movimientoId: null,
    },
  ],
  apartados: {
    saldoCuenta: "2500000",
    apartadoAqui: "1900000",
    otras: [{ metaId: "8c1f", nombre: "Viaje a Cartagena", apartado: "600000" }],
    libre: "0",
    excedido: false,
  },
  inversion: null,
};

const DETALLE_CUOTA: MetaDetalleDto = {
  ...CUOTA,
  historial: [
    { tipo: "cierre", fecha: "2026-07-31", valor: "30000000", variacion: null, trm: null },
    { tipo: "hoy", fecha: "2026-11-11", valor: "31930000", variacion: "1930000", trm: TRM },
  ],
  apartados: null,
  inversion: { valorMercado: "775000", moneda: "USD", trm: TRM },
};

beforeEach(() => {
  vi.mocked(obtener).mockReset();
  vi.mocked(enviar).mockReset();
});

describe("conversión", () => {
  it("lista: montos string → bigint, TRM y orden intactos", () => {
    const metas = aMetas(LISTA);
    expect(metas.fechaHoy).toBe("2026-11-11");
    expect(metas.trm?.valor).toBe(412000n);
    expect(metas.totales).toEqual({ avance: 34430000n, objetivo: 54300000n, incompleto: false });
    expect(metas.activas.map((m) => m.id)).toEqual(["8c1f", "c0a7", "f0d0"]);
    expect(metas.activas[0].objetivo).toBe(1800000n);
    expect(metas.activas[0].porcentaje).toBe(3333);
    expect(metas.cumplidas[0].uso).toEqual({ fecha: "2026-09-14", motivo: "taller" });
  });

  it("ritmo de los tres tipos", () => {
    const [viaje, cuota, fondo] = aMetas(LISTA).activas;
    expect(viaje.ritmo).toEqual({ tipo: "dias", falta: 1200000n, dias: 34, vencida: false });
    expect(cuota.ritmo).toEqual({ tipo: "meses", falta: 13070000n, meses: 13, cuotaMensual: 1005385n, vencida: false });
    expect(fondo.ritmo).toEqual({ tipo: "promedio", promedioMensual: 316667n, mesEstimado: "2028-05" });
    expect(aMetas({ ...LISTA, activas: [{ ...FONDO, ritmo: { tipo: "promedio", promedioMensual: null, mesEstimado: null } }] }).activas[0].ritmo).toEqual({
      tipo: "promedio",
      promedioMensual: null,
      mesEstimado: null,
    });
  });

  it("avance null (inversión USD sin TRM)", () => {
    const sinTrm = aMetas({ ...LISTA, trm: null, activas: [{ ...CUOTA, avance: null, falta: null, porcentaje: null, ritmo: null }] });
    expect(sinTrm.trm).toBeNull();
    expect(sinTrm.activas[0]).toMatchObject({ avance: null, falta: null, porcentaje: null, ritmo: null });
  });

  it("historial por apartado", () => {
    const d = aMetaDetalle(DETALLE_FONDO);
    expect(d.modo).toBe("apartado");
    if (d.modo !== "apartado") return;
    expect(d.historial[0]).toEqual({
      id: "ap3",
      tipo: "aporte",
      fecha: "2026-11-10",
      monto: 350000n,
      acumulado: 1900000n,
      inicial: false,
      motivo: null,
      cuentaOrigen: { id: "b4nc", nombre: "Bancolombia" },
      movimientoId: "mv3",
    });
    expect(d.apartados).toEqual({
      saldoCuenta: 2500000n,
      apartadoAqui: 1900000n,
      otras: [{ metaId: "8c1f", nombre: "Viaje a Cartagena", apartado: 600000n }],
      libre: 0n,
      excedido: false,
    });
    expect(d.inversion).toBeNull();
  });

  it("historial de toda la cuenta, con TRM", () => {
    const d = aMetaDetalle(DETALLE_CUOTA);
    expect(d.modo).toBe("cuenta");
    if (d.modo !== "cuenta") return;
    expect(d.historial[0]).toEqual({ tipo: "cierre", fecha: "2026-07-31", valor: 30000000n, variacion: null, trm: null });
    expect(d.historial[1].trm?.valor).toBe(412000n);
    expect(d.inversion).toEqual({ valorMercado: 775000n, moneda: "USD", trm: expect.objectContaining({ valor: 412000n }) });
  });
});

describe("llamadas", () => {
  it("GET /metas", async () => {
    vi.mocked(obtener).mockResolvedValue(LISTA);
    expect((await listarMetas()).activas).toHaveLength(3);
    expect(obtener).toHaveBeenCalledWith("/metas");
  });

  it("GET /metas/archivadas", async () => {
    vi.mocked(obtener).mockResolvedValue([{ ...MOTO, archivadaEn: "2026-11-01T12:00:00.000Z" }]);
    const archivadas = await listarArchivadas();
    expect(obtener).toHaveBeenCalledWith("/metas/archivadas");
    expect(archivadas[0].archivadaEn).toBe("2026-11-01T12:00:00.000Z");
  });

  it("GET /metas/:id: null si no existe", async () => {
    vi.mocked(obtener).mockResolvedValue(null);
    expect(await leerMeta("a/b")).toBeNull();
    expect(obtener).toHaveBeenCalledWith("/metas/a%2Fb");
  });

  it("POST /metas", async () => {
    vi.mocked(enviar).mockResolvedValue(DETALLE_FONDO);
    const cuerpo = { nombre: "Celular", cuentaId: "a41e", modo: "apartado" as const, objetivo: "1000000", fechaMeta: "2026-12", aporteInicial: { monto: "300000", cuentaOrigenId: "b4nc" } };
    expect((await crearMeta(cuerpo)).id).toBe("f0d0");
    expect(enviar).toHaveBeenCalledWith("POST", "/metas", cuerpo);
  });

  it("PATCH /metas/:id", async () => {
    vi.mocked(enviar).mockResolvedValue(DETALLE_FONDO);
    await cambiarMeta("f0d0", { fechaMeta: null });
    expect(enviar).toHaveBeenCalledWith("PATCH", "/metas/f0d0", { fechaMeta: null });
  });

  it("DELETE /metas/:id", async () => {
    vi.mocked(enviar).mockResolvedValue(null);
    await eliminarMeta("f0d0");
    expect(enviar).toHaveBeenCalledWith("DELETE", "/metas/f0d0");
  });

  it("POST /metas/:id/archivar → MetaDto", async () => {
    vi.mocked(enviar).mockResolvedValue({ ...MOTO, archivadaEn: "2026-11-11T12:00:00.000Z" });
    const meta = await archivarMeta("m070");
    expect(enviar).toHaveBeenCalledWith("POST", "/metas/m070/archivar");
    expect(meta.archivadaEn).toBe("2026-11-11T12:00:00.000Z");
  });

  it("POST /metas/:id/restaurar", async () => {
    vi.mocked(enviar).mockResolvedValue(DETALLE_FONDO);
    await restaurarMeta("m070");
    expect(enviar).toHaveBeenCalledWith("POST", "/metas/m070/restaurar");
  });

  it("POST /metas/:id/aportes", async () => {
    vi.mocked(enviar).mockResolvedValue(DETALLE_FONDO);
    const cuerpo = { tipo: "aporte" as const, monto: "100000", fecha: "2026-11-11", cuentaOrigenId: "b4nc", motivo: null };
    await registrarAporte("8c1f", cuerpo);
    expect(enviar).toHaveBeenCalledWith("POST", "/metas/8c1f/aportes", cuerpo);
  });

  it("PUT /metas/:id/aportes/:aporteId", async () => {
    vi.mocked(enviar).mockResolvedValue(DETALLE_FONDO);
    const cambio = { monto: "400000", fecha: "2026-11-10", cuentaOrigenId: "b4nc", motivo: null };
    await editarAporte("f0d0", "ap3", cambio);
    expect(enviar).toHaveBeenCalledWith("PUT", "/metas/f0d0/aportes/ap3", cambio);
  });

  it("DELETE /metas/:id/aportes/:aporteId", async () => {
    vi.mocked(enviar).mockResolvedValue(null);
    await eliminarAporte("f0d0", "ap3");
    expect(enviar).toHaveBeenCalledWith("DELETE", "/metas/f0d0/aportes/ap3");
  });
});
