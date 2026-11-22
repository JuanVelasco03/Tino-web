import { beforeEach, describe, expect, it, vi } from "vitest";

// La conversión es pura: el cliente HTTP (cookies, entorno) no participa.
vi.mock("./cliente", () => ({
  obtener: vi.fn(),
  enviar: vi.fn(),
  ErrorApi: class extends Error {},
}));

import { enviar, obtener } from "./cliente";
import {
  aInversionDetalle,
  aInversiones,
  aOperacion,
  buscarActivo,
  cambiarCotizacion,
  crearInversion,
  editarOperacion,
  eliminarOperacion,
  leerInversion,
  listarInversiones,
  listarOperaciones,
  registrarOperacion,
  registrarPrecio,
  type InversionDetalleDto,
  type InversionesDto,
  type OperacionDto,
} from "./inversiones";
import { aTrmVigente, leerTrm } from "./trm";

const TRM = { valor: "4120.00", vigenteDesde: "2026-11-11", vigenteHasta: "2026-11-11", fuente: "Superintendencia Financiera de Colombia" };

/** Forma de `GET /inversiones` (docs/api/inversiones.md) con los datos del diseño. */
const LISTA: InversionesDto = {
  fechaHoy: "2026-11-11",
  trm: TRM,
  trmDesactualizada: false,
  inversiones: [
    {
      id: "e70e",
      nombre: "eToro",
      moneda: "USD",
      valorMercado: "775000",
      valorMercadoCop: "31930000",
      rendimiento: "85822",
      rendimientoPorcentaje: 1346,
    },
    {
      id: "c0b1",
      nombre: "Acciones COP",
      moneda: "COP",
      valorMercado: "1000000",
      valorMercadoCop: null,
      rendimiento: "0",
      rendimientoPorcentaje: null,
    },
  ],
};

/** Forma de `GET /inversiones/:id`: eToro con VOO (cierre) y RENEW (manual con anterior). */
const DETALLE: InversionDetalleDto = {
  id: "e70e",
  nombre: "eToro",
  moneda: "USD",
  naturaleza: "activo",
  fechaHoy: "2026-11-11",
  trm: TRM,
  trmDesactualizada: false,
  valorMercado: "775000",
  valorMercadoCop: "31930000",
  costo: "637817",
  costoCop: "26278060",
  rendimiento: "85822",
  rendimientoCop: "3535866",
  rendimientoPorcentaje: 1346,
  efectivo: "51361",
  efectivoCop: "2116073",
  posiciones: [
    {
      activoId: "a1",
      simbolo: "VOO",
      nombre: "Vanguard S&P 500 ETF",
      cantidad: "6.25",
      costo: "311700",
      costoPromedio: "49872",
      precio: "56240",
      precioFecha: "2026-11-10",
      precioOrigen: "cierre",
      precioCotizadoEn: "2026-11-11T13:00:00.000Z",
      precioVencido: false,
      precioAnterior: null,
      cotizacion: "automatica",
      clase: "etf",
      valor: "351500",
      valorCop: "14481800",
      rendimiento: "39800",
      rendimientoCop: "1639760",
      rendimientoPorcentaje: 1277,
    },
    {
      activoId: "a5",
      simbolo: "RENEW",
      nombre: "Smart Portfolio · energías renovables",
      cantidad: "1",
      costo: "40000",
      costoPromedio: "40000",
      precio: "40542",
      precioFecha: "2026-11-07",
      precioOrigen: "manual",
      precioCotizadoEn: "2026-11-07T15:00:00.000Z",
      precioVencido: false,
      precioAnterior: { precio: "40000", fecha: "2026-11-01" },
      cotizacion: "manual",
      clase: null,
      valor: "40542",
      valorCop: "1670330",
      rendimiento: "542",
      rendimientoCop: "22330",
      rendimientoPorcentaje: 136,
    },
  ],
  archivadaEn: null,
};

const VENTA: OperacionDto = {
  id: "op1",
  activo: { id: "a2", simbolo: "QQQ", nombre: "Invesco QQQ Trust" },
  clase: "venta",
  cantidad: "1",
  monto: "48690",
  precioUnitario: "48690",
  fecha: "2026-11-09",
  gananciaRealizada: "4475",
  creadoEn: "2026-11-09T15:00:00.000Z",
  actualizadoEn: "2026-11-09T15:00:00.000Z",
};

beforeEach(() => {
  vi.mocked(obtener).mockReset();
  vi.mocked(enviar).mockReset();
});

describe("conversión", () => {
  it("aInversiones: montos a bigint, TRM a centésimas, nulos y porcentajes tal cual", () => {
    const lista = aInversiones(LISTA);
    expect(lista.trm).toEqual({ ...TRM, valor: 412_000n });
    expect(lista.inversiones[0]).toEqual({
      id: "e70e",
      nombre: "eToro",
      moneda: "USD",
      valorMercado: 775_000n,
      valorMercadoCop: 31_930_000n,
      rendimiento: 85_822n,
      rendimientoPorcentaje: 1346,
    });
    expect(lista.inversiones[1]).toMatchObject({ valorMercadoCop: null, rendimientoPorcentaje: null });
  });

  it("aInversiones sin TRM ni inversiones", () => {
    expect(aInversiones({ ...LISTA, trm: null, inversiones: [] })).toEqual({
      fechaHoy: "2026-11-11",
      trm: null,
      trmDesactualizada: false,
      inversiones: [],
    });
  });

  it("aInversionDetalle: cifras, posiciones en su orden, cantidades como texto", () => {
    const d = aInversionDetalle(DETALLE);
    expect(d).toMatchObject({
      valorMercado: 775_000n,
      costo: 637_817n,
      rendimientoCop: 3_535_866n,
      efectivo: 51_361n,
      efectivoCop: 2_116_073n,
      archivadaEn: null,
    });
    expect(d.posiciones.map((p) => p.simbolo)).toEqual(["VOO", "RENEW"]);
    expect(d.posiciones[0]).toMatchObject({ cantidad: "6.25", costoPromedio: 49_872n, precio: 56_240n, precioAnterior: null });
    expect(d.posiciones[1].precioAnterior).toEqual({ precio: 40_000n, fecha: "2026-11-01" });
    expect(d).not.toHaveProperty("naturaleza");
  });

  it("aOperacion: ganancia realizada con signo; nula fuera de la venta", () => {
    expect(aOperacion(VENTA)).toMatchObject({ monto: 48_690n, precioUnitario: 48_690n, gananciaRealizada: 4_475n, cantidad: "1" });
    expect(aOperacion({ ...VENTA, gananciaRealizada: "-1200" }).gananciaRealizada).toBe(-1_200n);
    expect(aOperacion({ ...VENTA, clase: "compra", gananciaRealizada: null }).gananciaRealizada).toBeNull();
  });

  it("aTrmVigente", () => {
    expect(aTrmVigente({ fechaHoy: "2026-11-11", trm: TRM, desactualizada: true })).toEqual({
      fechaHoy: "2026-11-11",
      trm: { ...TRM, valor: 412_000n },
      desactualizada: true,
    });
  });
});

describe("las diez llamadas", () => {
  it("GET /inversiones", async () => {
    vi.mocked(obtener).mockResolvedValue(LISTA);
    await listarInversiones();
    expect(obtener).toHaveBeenCalledWith("/inversiones");
  });

  it("POST /inversiones", async () => {
    vi.mocked(enviar).mockResolvedValue(DETALLE);
    const cuerpo = { nombre: "eToro", moneda: "USD" as const, efectivoInicial: "51361" };
    expect((await crearInversion(cuerpo)).id).toBe("e70e");
    expect(enviar).toHaveBeenCalledWith("POST", "/inversiones", cuerpo);
  });

  it("GET /inversiones/:id, null si no existe", async () => {
    vi.mocked(obtener).mockResolvedValue(null);
    expect(await leerInversion("e70e")).toBeNull();
    expect(obtener).toHaveBeenCalledWith("/inversiones/e70e");
  });

  it("GET /inversiones/:id/operaciones, con y sin activo", async () => {
    vi.mocked(obtener).mockResolvedValue({ operaciones: [VENTA] });
    expect((await listarOperaciones("e70e"))[0].id).toBe("op1");
    expect(obtener).toHaveBeenLastCalledWith("/inversiones/e70e/operaciones");
    await listarOperaciones("e70e", "a2");
    expect(obtener).toHaveBeenLastCalledWith("/inversiones/e70e/operaciones?activoId=a2");
  });

  it("POST, PUT y DELETE de operaciones", async () => {
    vi.mocked(enviar).mockResolvedValue(DETALLE);
    const cuerpo = { clase: "compra" as const, simbolo: "MSFT", cantidad: "2", monto: "80000" };
    await registrarOperacion("e70e", cuerpo);
    expect(enviar).toHaveBeenLastCalledWith("POST", "/inversiones/e70e/operaciones", cuerpo);
    await editarOperacion("e70e", "op1", { fecha: "2026-11-08" });
    expect(enviar).toHaveBeenLastCalledWith("PUT", "/inversiones/e70e/operaciones/op1", { fecha: "2026-11-08" });
    vi.mocked(enviar).mockResolvedValue(null);
    await eliminarOperacion("e70e", "op1");
    expect(enviar).toHaveBeenLastCalledWith("DELETE", "/inversiones/e70e/operaciones/op1");
  });

  it("POST …/activos/:activoId/precios y PATCH …/activos/:activoId", async () => {
    vi.mocked(enviar).mockResolvedValue(DETALLE);
    await registrarPrecio("e70e", "a5", { precio: "41106" });
    expect(enviar).toHaveBeenLastCalledWith("POST", "/inversiones/e70e/activos/a5/precios", { precio: "41106" });
    await cambiarCotizacion("e70e", "a1", { cotizacion: "manual" });
    expect(enviar).toHaveBeenLastCalledWith("PATCH", "/inversiones/e70e/activos/a1", { cotizacion: "manual" });
  });

  it("GET …/activos/buscar?simbolo=", async () => {
    const busqueda = { simbolo: "MSFT", cubierto: true, nombre: "Microsoft Corporation", clase: "accion" as const, proveedorDisponible: true };
    vi.mocked(obtener).mockResolvedValue(busqueda);
    expect(await buscarActivo("e70e", "MSFT")).toEqual(busqueda);
    expect(obtener).toHaveBeenCalledWith("/inversiones/e70e/activos/buscar?simbolo=MSFT");
  });

  it("codifica los ids", async () => {
    vi.mocked(obtener).mockResolvedValue(null);
    await leerInversion("a/b");
    expect(obtener).toHaveBeenCalledWith("/inversiones/a%2Fb");
  });

  it("GET /trm", async () => {
    vi.mocked(obtener).mockResolvedValue({ fechaHoy: "2026-11-11", trm: null, desactualizada: false });
    expect(await leerTrm()).toEqual({ fechaHoy: "2026-11-11", trm: null, desactualizada: false });
    expect(obtener).toHaveBeenCalledWith("/trm");
  });
});
