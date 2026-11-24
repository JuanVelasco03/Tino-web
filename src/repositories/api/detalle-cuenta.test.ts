import { describe, expect, it, vi } from "vitest";

// La conversión es pura: el cliente HTTP (cookies, entorno) no participa.
vi.mock("./cliente", () => ({
  obtener: vi.fn(),
  enviar: vi.fn(),
  ErrorApi: class extends Error {},
}));

import { aCicloTarjeta, aHistorial, type CicloDto, type HistorialDto } from "./detalle-cuenta";

const BANCOLOMBIA = { id: "b1", nombre: "Bancolombia" };
const COMIDA = { id: "c1", nombre: "Comida" };

// Forma del ejemplo de `GET /cuentas/:id/historial` (Tino-API SPEC 14).
const HISTORIAL: HistorialDto = {
  fechaHoy: "2026-11-11",
  desde: "2026-10-12",
  hasta: null,
  saldo: "45000",
  saldoHoy: "45000",
  conciliacion: { saldo: "148100", al: "2026-10-31", pendientes: 9 },
  entradas: "100000",
  salidas: "177200",
  saldoInicioRango: "122200",
  filas: [
    {
      movimientoId: "m2",
      tipo: "gasto",
      fecha: "2026-11-11",
      descripcion: "Almuerzo",
      efecto: "-15000",
      saldo: "45000",
      conciliado: false,
      categoria: COMIDA,
      partes: [],
      contraparte: null,
    },
    {
      movimientoId: "m1",
      tipo: "transferencia",
      fecha: "2026-10-28",
      descripcion: "Retiro cajero",
      efecto: "100000",
      saldo: "194200",
      conciliado: true,
      categoria: null,
      partes: [],
      contraparte: { ...BANCOLOMBIA, sentido: "desde" },
    },
  ],
};

describe("aHistorial", () => {
  it("convierte montos a bigint, con signo, sin recalcular", () => {
    const h = aHistorial(HISTORIAL);
    expect(h).toMatchObject({
      fechaHoy: "2026-11-11",
      desde: "2026-10-12",
      hasta: null,
      saldo: 45000n,
      saldoHoy: 45000n,
      conciliacion: { saldo: 148100n, al: "2026-10-31", pendientes: 9 },
      entradas: 100000n,
      salidas: 177200n,
      saldoInicioRango: 122200n,
    });
    expect(h.filas[0]).toEqual({
      movimientoId: "m2",
      tipo: "gasto",
      fecha: "2026-11-11",
      descripcion: "Almuerzo",
      efecto: -15000n,
      saldo: 45000n,
      conciliado: false,
      categoria: COMIDA,
      partes: [],
      contraparte: null,
    });
    expect(h.filas[1].contraparte).toEqual({ ...BANCOLOMBIA, sentido: "desde" });
  });

  it("conserva el orden de la API (la más reciente primero)", () => {
    expect(aHistorial(HISTORIAL).filas.map((f) => f.movimientoId)).toEqual(["m2", "m1"]);
  });

  it("cuenta nunca conciliada: saldo y fecha null", () => {
    const h = aHistorial({ ...HISTORIAL, conciliacion: { saldo: null, al: null, pendientes: 16 } });
    expect(h.conciliacion).toEqual({ saldo: null, al: null, pendientes: 16 });
  });

  it("saldo corrido negativo y partes", () => {
    const h = aHistorial({
      ...HISTORIAL,
      filas: [{ ...HISTORIAL.filas[0], saldo: "-5000", partes: [{ categoria: COMIDA, monto: "15000" }], categoria: null }],
    });
    expect(h.filas[0].saldo).toBe(-5000n);
    expect(h.filas[0].partes).toEqual([{ categoria: COMIDA, monto: 15000n }]);
  });
});

const FILA = {
  movimientoId: "x",
  tipo: "gasto" as const,
  fecha: "2026-10-17",
  descripcion: "Rappi · restaurante",
  monto: "46900",
  categoria: { id: "s", nombre: "Salidas" },
  partes: [],
  contraparte: null,
};

const CICLO: CicloDto = {
  fechaHoy: "2026-11-11",
  ciclo: {
    inicio: "2026-10-16",
    corte: "2026-11-15",
    pagoLimite: "2026-11-30",
    diasHastaCorte: 4,
    diasHastaPago: 19,
    corteAnterior: { fecha: "2026-10-15", saldo: "1217980" },
    abonos: [{ ...FILA, movimientoId: "p", tipo: "transferencia", descripcion: null, monto: "620000", categoria: null, contraparte: BANCOLOMBIA }],
    saldoAnteriorPendiente: "597980",
    pagoSugerido: "597980",
    consumos: [FILA],
    totalConsumos: "651450",
    cargos: [{ ...FILA, movimientoId: "k", descripcion: "Cuota de manejo", monto: "26990", clase: "cuota_manejo" }],
    totalCargos: "34870",
    deudaAlCorte: "1284300",
  },
  compra: { monto: "450000", cabe: true, disponibleTras: "2265700", porcentajeTras: 43, falta: null },
};

describe("aCicloTarjeta", () => {
  it("convierte el ciclo y la compra a bigint", () => {
    const c = aCicloTarjeta(CICLO);
    expect(c.fechaHoy).toBe("2026-11-11");
    expect(c.ciclo).toMatchObject({
      inicio: "2026-10-16",
      corte: "2026-11-15",
      pagoLimite: "2026-11-30",
      diasHastaCorte: 4,
      diasHastaPago: 19,
      corteAnterior: { fecha: "2026-10-15", saldo: 1217980n },
      saldoAnteriorPendiente: 597980n,
      pagoSugerido: 597980n,
      totalConsumos: 651450n,
      totalCargos: 34870n,
      deudaAlCorte: 1284300n,
    });
    expect(c.ciclo?.abonos[0]).toMatchObject({ monto: 620000n, contraparte: BANCOLOMBIA });
    expect(c.ciclo?.cargos[0]).toMatchObject({ monto: 26990n, clase: "cuota_manejo" });
    expect(c.compra).toEqual({ monto: 450000n, cabe: true, disponibleTras: 2265700n, porcentajeTras: 43, falta: null });
  });

  it("saldo anterior pendiente negativo (se pagó de más)", () => {
    const dto: CicloDto = { ...CICLO, ciclo: CICLO.ciclo && { ...CICLO.ciclo, saldoAnteriorPendiente: "-2020", pagoSugerido: "0" } };
    expect(aCicloTarjeta(dto).ciclo?.saldoAnteriorPendiente).toBe(-2020n);
  });

  it("sin condiciones y sin compra: null", () => {
    expect(aCicloTarjeta({ fechaHoy: "2026-11-11", ciclo: null, compra: null })).toEqual({ fechaHoy: "2026-11-11", ciclo: null, compra: null });
  });

  it("compra que no cabe", () => {
    const c = aCicloTarjeta({ ...CICLO, compra: { monto: "3000000", cabe: false, disponibleTras: null, porcentajeTras: null, falta: "284300" } });
    expect(c.compra).toEqual({ monto: 3000000n, cabe: false, disponibleTras: null, porcentajeTras: null, falta: 284300n });
  });
});
