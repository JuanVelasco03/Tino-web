import { describe, expect, it, vi } from "vitest";

// La conversión es pura: el cliente HTTP (cookies, entorno) no participa.
vi.mock("./cliente", () => ({
  obtener: vi.fn(),
  enviar: vi.fn(),
  ErrorApi: class extends Error {},
}));

import { aCuenta, aListaCuentas, type CuentaDto, type ListaCuentasDto } from "./cuentas";

// Ejemplos JSON de `GET /cuentas` en Tino-API docs/api/cuentas.md.
const CON_CUENTAS: ListaCuentasDto = {
  fechaSaldos: "2026-11-18",
  activos: {
    total: "20321",
    cuentas: [
      {
        id: "0f9c6c1e-3a52-4c51-9a7e-2b1f0d6f5a11",
        nombre: "Nequi",
        tipo: "banco",
        moneda: "COP",
        naturaleza: "activo",
        detalle: null,
        saldo: "20321",
        saldoInicial: "20321",
        tarjeta: null,
        inversion: null,
        archivadaEn: null,
      },
    ],
  },
  pasivos: {
    total: "1284300",
    cuentas: [
      {
        id: "7d2b8e40-91c3-4f0e-8b6a-5c4d3e2f1a09",
        nombre: "Tarjeta",
        tipo: "tarjeta_credito",
        moneda: "COP",
        naturaleza: "pasivo",
        detalle: "Visa ·· 1234",
        saldo: "1284300",
        saldoInicial: "1284300",
        tarjeta: { cupo: "4000000", disponible: "2715700", porcentajeUsado: 32 },
        inversion: null,
        archivadaEn: null,
      },
    ],
  },
  patrimonioNeto: "-1263979",
  trm: { valor: "4120.00", vigenteDesde: "2026-11-18", vigenteHasta: "2026-11-18", fuente: "Superintendencia Financiera de Colombia" },
  trmDesactualizada: false,
};

const VACIA: ListaCuentasDto = {
  fechaSaldos: "2026-11-18",
  activos: { total: "0", cuentas: [] },
  pasivos: { total: "0", cuentas: [] },
  patrimonioNeto: "0",
  trm: null,
  trmDesactualizada: false,
};

describe("aListaCuentas", () => {
  it("convierte el ejemplo con cuentas a bigint, sin recalcular", () => {
    expect(aListaCuentas(CON_CUENTAS)).toEqual({
      fechaSaldos: "2026-11-18",
      activos: {
        total: 20321n,
        cuentas: [
          {
            id: "0f9c6c1e-3a52-4c51-9a7e-2b1f0d6f5a11",
            nombre: "Nequi",
            tipo: "banco",
            moneda: "COP",
            naturaleza: "activo",
            detalle: null,
            saldo: 20321n,
            saldoInicial: 20321n,
            tarjeta: null,
            inversion: null,
            archivadaEn: null,
          },
        ],
      },
      pasivos: {
        total: 1284300n,
        cuentas: [
          {
            id: "7d2b8e40-91c3-4f0e-8b6a-5c4d3e2f1a09",
            nombre: "Tarjeta",
            tipo: "tarjeta_credito",
            moneda: "COP",
            naturaleza: "pasivo",
            detalle: "Visa ·· 1234",
            saldo: 1284300n,
            saldoInicial: 1284300n,
            tarjeta: { cupo: 4000000n, disponible: 2715700n, porcentajeUsado: 32 },
            inversion: null,
            archivadaEn: null,
          },
        ],
      },
      patrimonioNeto: -1263979n,
      trm: { valor: 412_000n, vigenteDesde: "2026-11-18", vigenteHasta: "2026-11-18", fuente: "Superintendencia Financiera de Colombia" },
      trmDesactualizada: false,
    });
  });

  it("conserva el signo negativo del patrimonio", () => {
    expect(aListaCuentas(CON_CUENTAS).patrimonioNeto).toBe(-1263979n);
  });

  it("convierte la lista vacía", () => {
    expect(aListaCuentas(VACIA)).toEqual({
      fechaSaldos: "2026-11-18",
      activos: { total: 0n, cuentas: [] },
      pasivos: { total: 0n, cuentas: [] },
      patrimonioNeto: 0n,
      trm: null,
      trmDesactualizada: false,
    });
  });

  it("conserva el orden del arreglo de la API", () => {
    const dto: ListaCuentasDto = {
      ...CON_CUENTAS,
      activos: {
        total: "3",
        cuentas: ["c", "a", "b"].map((id) => ({ ...CON_CUENTAS.activos.cuentas[0], id, nombre: id, saldo: "1" })),
      },
    };
    expect(aListaCuentas(dto).activos.cuentas.map((c) => c.id)).toEqual(["c", "a", "b"]);
  });

  it("montos que exceden 2^53 no pierden precisión", () => {
    const dto: ListaCuentasDto = { ...VACIA, patrimonioNeto: "9007199254740993" };
    expect(aListaCuentas(dto).patrimonioNeto).toBe(9007199254740993n);
  });
});

describe("aCuenta", () => {
  const ARCHIVADA: CuentaDto = {
    ...CON_CUENTAS.activos.cuentas[0],
    saldo: "0",
    saldoInicial: "20321",
    archivadaEn: "2026-11-18T15:04:05.000Z",
  };

  it("convierte saldoInicial a bigint, aparte del saldo", () => {
    const cuenta = aCuenta(ARCHIVADA);
    expect(cuenta.saldo).toBe(0n);
    expect(cuenta.saldoInicial).toBe(20321n);
  });

  it("conserva archivadaEn tal cual llega", () => {
    expect(aCuenta(ARCHIVADA).archivadaEn).toBe("2026-11-18T15:04:05.000Z");
    expect(aCuenta(CON_CUENTAS.activos.cuentas[0]).archivadaEn).toBeNull();
  });

  it("saldoInicial que excede 2^53 no pierde precisión", () => {
    expect(aCuenta({ ...ARCHIVADA, saldoInicial: "9007199254740993" }).saldoInicial).toBe(9007199254740993n);
  });
});

describe("inversión en la lista (SPEC 10)", () => {
  const ETORO: CuentaDto = {
    id: "e70e",
    nombre: "eToro",
    tipo: "inversion",
    moneda: "USD",
    naturaleza: "activo",
    detalle: null,
    saldo: "31930000",
    saldoInicial: "51361",
    tarjeta: null,
    inversion: { efectivo: "51361", valorMercado: "775000", tasa: "4120.00" },
    archivadaEn: null,
  };

  it("convierte moneda, efectivo, valor de mercado y la tasa a centésimas", () => {
    expect(aCuenta(ETORO)).toMatchObject({
      tipo: "inversion",
      moneda: "USD",
      saldo: 31_930_000n,
      saldoInicial: 51_361n,
      inversion: { efectivo: 51_361n, valorMercado: 775_000n, tasa: 412_000n },
    });
  });

  it("USD sin TRM: tasa null", () => {
    expect(aCuenta({ ...ETORO, saldo: "0", inversion: { efectivo: "51361", valorMercado: "775000", tasa: null } }).inversion?.tasa).toBeNull();
  });
});
