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
  abonar,
  aPrestamoDetalle,
  aPrestamos,
  cambiarPrestamo,
  condonar,
  crearPrestamo,
  desembolsar,
  leerPrestamo,
  listarPrestamos,
  proponerAbono,
  type PrestamoDetalleDto,
  type PrestamosDto,
} from "./prestamos";

/** El JSON de `docs/api/prestamos.md` (`GET /prestamos`). */
const LISTA: PrestamosDto = {
  fechaHoy: "2026-11-11",
  teDeben: { total: "500000", personas: 1, interesesCausados: "6667" },
  debes: { total: "500000", personas: 1, interesesCausados: "0", conIntereses: false },
  posicionNeta: "0",
  prestamos: [
    {
      id: "3b1d",
      nombre: "Camila Ortiz",
      tipo: "prestamo_otorgado",
      estado: "te_debe",
      capitalPendiente: "500000",
      desde: "2026-08-14",
      fechaAcordada: "2026-10-15",
      vencido: true,
      cierre: null,
      interesesCausados: "6667",
    },
    {
      id: "9a7c",
      nombre: "Andrés Gil",
      tipo: "prestamo_otorgado",
      estado: "saldado",
      capitalPendiente: "0",
      desde: null,
      fechaAcordada: null,
      vencido: false,
      cierre: { fecha: "2026-09-20", forma: "pago" },
      interesesCausados: "0",
    },
  ],
};

/** El JSON de `docs/api/prestamos.md` (`GET /prestamos/:id`). */
const DETALLE: PrestamoDetalleDto = {
  ...LISTA.prestamos[0],
  fechaHoy: "2026-11-11",
  tasaMensual: "1",
  totalPrestado: "600000",
  totalAbonado: "100000",
  totalCondonado: "0",
  interesesCobrados: "12000",
  ultimoAbono: "2026-10-02",
  historial: [
    {
      fecha: "2026-08-14",
      clase: "desembolso",
      cuenta: { id: "n", nombre: "Nequi" },
      categoria: null,
      capital: "600000",
      interes: "0",
      saldoCapital: "600000",
      movimientoId: "m1",
      movimientoInteresId: null,
    },
    {
      fecha: "2026-10-02",
      clase: "abono",
      cuenta: { id: "n", nombre: "Nequi" },
      categoria: null,
      capital: "-100000",
      interes: "12000",
      saldoCapital: "500000",
      movimientoId: "m2",
      movimientoInteresId: "m3",
    },
  ],
  creadoEn: "2026-08-14T17:03:11.402Z",
};

const GASTO: MovimientoDto = {
  id: "g1",
  tipo: "gasto",
  monto: "500000",
  moneda: "COP",
  montoDestino: null,
  tasa: "1",
  fecha: "2026-11-11",
  descripcion: "Condonación a Camila Ortiz",
  nota: null,
  cuentaOrigen: { id: "3b1d", nombre: "Camila Ortiz" },
  cuentaDestino: null,
  categoria: { id: "o", nombre: "Otros" },
  partes: [],
  creadoEn: "2026-11-11T12:00:00.000Z",
  actualizadoEn: "2026-11-11T12:00:00.000Z",
};

beforeEach(() => {
  vi.mocked(obtener).mockReset();
  vi.mocked(enviar).mockReset();
});

describe("conversión", () => {
  it("lista: montos string → bigint, orden intacto", () => {
    const lista = aPrestamos(LISTA);
    expect(lista.teDeben).toEqual({ total: 500000n, personas: 1, interesesCausados: 6667n });
    expect(lista.debes).toEqual({ total: 500000n, personas: 1, interesesCausados: 0n, conIntereses: false });
    expect(lista.posicionNeta).toBe(0n);
    expect(lista.prestamos.map((p) => p.id)).toEqual(["3b1d", "9a7c"]);
    expect(lista.prestamos[0].capitalPendiente).toBe(500000n);
    expect(lista.prestamos[1].cierre).toEqual({ fecha: "2026-09-20", forma: "pago" });
  });

  it("detalle: capital con signo, tasa como texto", () => {
    const detalle = aPrestamoDetalle(DETALLE);
    expect(detalle.tasaMensual).toBe("1");
    expect(detalle.totalPrestado).toBe(600000n);
    expect(detalle.interesesCobrados).toBe(12000n);
    expect(detalle.historial[1]).toEqual({
      fecha: "2026-10-02",
      clase: "abono",
      cuenta: { id: "n", nombre: "Nequi" },
      categoria: null,
      capital: -100000n,
      interes: 12000n,
      saldoCapital: 500000n,
      movimientoId: "m2",
      movimientoInteresId: "m3",
    });
  });

  it("posición neta negativa", () => {
    expect(aPrestamos({ ...LISTA, posicionNeta: "-250000" }).posicionNeta).toBe(-250000n);
  });
});

describe("rutas", () => {
  it("GET /prestamos", async () => {
    vi.mocked(obtener).mockResolvedValue(LISTA);
    await listarPrestamos();
    expect(obtener).toHaveBeenCalledWith("/prestamos");
  });

  it("GET /prestamos/:id; 404 → null", async () => {
    vi.mocked(obtener).mockResolvedValue(DETALLE);
    expect((await leerPrestamo("3b1d"))?.nombre).toBe("Camila Ortiz");
    expect(obtener).toHaveBeenCalledWith("/prestamos/3b1d");

    vi.mocked(obtener).mockResolvedValue(null);
    expect(await leerPrestamo("x")).toBeNull();
  });

  it("POST /prestamos", async () => {
    vi.mocked(enviar).mockResolvedValue(DETALLE);
    const cuerpo = { tipo: "prestamo_otorgado" as const, nombre: "Camila", monto: "600000", cuentaId: "n" };
    await crearPrestamo(cuerpo);
    expect(enviar).toHaveBeenCalledWith("POST", "/prestamos", cuerpo);
  });

  it("POST /prestamos/:id/desembolsos", async () => {
    vi.mocked(enviar).mockResolvedValue(DETALLE);
    await desembolsar("3b1d", { monto: "100000", cuentaId: "n", fecha: "2026-11-11" });
    expect(enviar).toHaveBeenCalledWith("POST", "/prestamos/3b1d/desembolsos", { monto: "100000", cuentaId: "n", fecha: "2026-11-11" });
  });

  it("PATCH /prestamos/:id", async () => {
    vi.mocked(enviar).mockResolvedValue(DETALLE);
    await cambiarPrestamo("3b1d", { fechaAcordada: null });
    expect(enviar).toHaveBeenCalledWith("PATCH", "/prestamos/3b1d", { fechaAcordada: null });
  });

  it("GET /prestamos/:id/propuesta-abono?fecha=&monto=", async () => {
    vi.mocked(obtener).mockResolvedValue({
      fecha: "2026-11-11",
      monto: "112000",
      capital: "105333",
      interes: "6667",
      interesesCausados: "6667",
      capitalPendiente: "500000",
    });
    const propuesta = await proponerAbono("3b1d", "2026-11-11", "112000");
    expect(obtener).toHaveBeenCalledWith("/prestamos/3b1d/propuesta-abono?fecha=2026-11-11&monto=112000");
    expect(propuesta).toEqual({
      fecha: "2026-11-11",
      monto: 112000n,
      capital: 105333n,
      interes: 6667n,
      interesesCausados: 6667n,
      capitalPendiente: 500000n,
    });
  });

  it("POST /prestamos/:id/abonos", async () => {
    vi.mocked(enviar).mockResolvedValue(DETALLE);
    const cuerpo = { cuentaId: "n", fecha: "2026-11-11", capital: "105333", interes: "6667" };
    await abonar("3b1d", cuerpo);
    expect(enviar).toHaveBeenCalledWith("POST", "/prestamos/3b1d/abonos", cuerpo);
  });

  it("POST /prestamos/:id/condonaciones → el gasto", async () => {
    vi.mocked(enviar).mockResolvedValue(GASTO);
    const movimiento = await condonar("3b1d", { monto: "500000", categoriaId: "o" });
    expect(enviar).toHaveBeenCalledWith("POST", "/prestamos/3b1d/condonaciones", { monto: "500000", categoriaId: "o" });
    expect(movimiento.id).toBe("g1");
    expect(movimiento.monto).toBe(500000n);
  });

  it("codifica el id", async () => {
    vi.mocked(obtener).mockResolvedValue(null);
    await leerPrestamo("a/b");
    expect(obtener).toHaveBeenCalledWith("/prestamos/a%2Fb");
  });
});
