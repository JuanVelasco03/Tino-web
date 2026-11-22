import { beforeEach, describe, expect, it, vi } from "vitest";

// La conversión es pura: el cliente HTTP (cookies, entorno) no participa.
vi.mock("./cliente", () => ({
  obtener: vi.fn(),
  enviar: vi.fn(),
  ErrorApi: class extends Error {},
}));

import {
  aAvisos,
  configurarAvisos,
  contarAvisos,
  leerTodosLosAvisos,
  marcarAviso,
  obtenerAvisos,
  type AvisoDto,
  type AvisosDto,
} from "./avisos";
import { enviar, obtener } from "./cliente";

const CONFIG: AvisosDto["config"] = [
  { tipo: "recurrente", activo: true, dias: 3, opciones: [1, 3, 5, 7] },
  { tipo: "cobro", activo: true, dias: 30, opciones: [0, 14, 30] },
  { tipo: "deuda", activo: true, dias: 7, opciones: [1, 3, 7] },
  { tipo: "precio_manual", activo: false, dias: 7, opciones: [3, 7, 14] },
];

// Ejemplo JSON de `GET /avisos` en Tino-API docs/api/avisos.md.
const EJEMPLO: AvisosDto = {
  fechaHoy: "2026-11-22",
  zonaHoraria: "America/Bogota",
  horaAvisos: "08:00",
  noLeidos: 1,
  avisos: [
    {
      clave: "recurrente:9b1c…:2026-11-25",
      tipo: "recurrente",
      instante: "2026-11-22T13:00:00.000Z",
      leido: false,
      resuelto: false,
      recurrente: { id: "9b1c…", concepto: "Gas Vanti", tipo: "gasto", variable: true },
      vencimiento: "2026-11-25",
      cuenta: { id: "…", nombre: "Nequi" },
      monto: "32400",
      estimado: true,
      resolucion: null,
    },
  ],
  config: CONFIG,
};

const COBRO: AvisoDto = {
  clave: "cobro:c01:2026-10-15",
  tipo: "cobro",
  instante: "2026-10-15T13:00:00.000Z",
  leido: true,
  resuelto: true,
  prestamo: { id: "c01", nombre: "Camila" },
  fechaAcordada: "2026-10-15",
  recordatorio: "2026-10-15",
  monto: "100000",
  capitalPendiente: "9007199254740993",
  proximoRecordatorio: null,
  resolucion: { forma: "abono", fecha: "2026-11-06", monto: "100000", cuenta: { id: "n01", nombre: "Nequi" } },
};

const DEUDA: AvisoDto = {
  clave: "deuda:m01:2026-11-06",
  tipo: "deuda",
  instante: "2026-11-03T13:00:00.000Z",
  leido: false,
  resuelto: false,
  prestamo: { id: "m01", nombre: "Mamá" },
  fechaAcordada: "2026-11-06",
  monto: "500000",
  capitalPendiente: "500000",
  resolucion: null,
};

const PRECIO: AvisoDto = {
  clave: "precio_manual:a01:2026-11-03",
  tipo: "precio_manual",
  instante: "2026-11-10T13:00:00.000Z",
  leido: false,
  resuelto: false,
  activo: { id: "a01", simbolo: "VOO", nombre: "Vanguard S&P 500" },
  inversion: { id: "i01", nombre: "XTB" },
  precioFecha: "2026-11-03",
  resolucion: null,
};

beforeEach(() => {
  vi.mocked(obtener).mockReset();
  vi.mocked(enviar).mockReset();
});

describe("aAvisos", () => {
  it("convierte el ejemplo del contrato con montos en bigint", () => {
    expect(aAvisos(EJEMPLO)).toEqual({
      fechaHoy: "2026-11-22",
      zonaHoraria: "America/Bogota",
      horaAvisos: "08:00",
      noLeidos: 1,
      avisos: [
        {
          clave: "recurrente:9b1c…:2026-11-25",
          tipo: "recurrente",
          instante: "2026-11-22T13:00:00.000Z",
          leido: false,
          resuelto: false,
          recurrente: { id: "9b1c…", concepto: "Gas Vanti", tipo: "gasto", variable: true },
          vencimiento: "2026-11-25",
          cuenta: { id: "…", nombre: "Nequi" },
          monto: 32_400n,
          estimado: true,
          resolucion: null,
        },
      ],
      config: CONFIG,
    });
  });

  it("convierte los cuatro tipos sin perder precisión", () => {
    const { avisos } = aAvisos({ ...EJEMPLO, avisos: [...EJEMPLO.avisos, COBRO, DEUDA, PRECIO] });
    expect(avisos.map((a) => a.tipo)).toEqual(["recurrente", "cobro", "deuda", "precio_manual"]);
    expect(avisos[1]).toMatchObject({
      monto: 100_000n,
      capitalPendiente: 9_007_199_254_740_993n,
      resolucion: { forma: "abono", fecha: "2026-11-06", monto: 100_000n, cuenta: { id: "n01", nombre: "Nequi" } },
    });
    expect(avisos[2]).toMatchObject({ monto: 500_000n, capitalPendiente: 500_000n, resolucion: null });
    expect(avisos[3]).toEqual({
      clave: "precio_manual:a01:2026-11-03",
      tipo: "precio_manual",
      instante: "2026-11-10T13:00:00.000Z",
      leido: false,
      resuelto: false,
      activo: { id: "a01", simbolo: "VOO", nombre: "Vanguard S&P 500" },
      inversion: { id: "i01", nombre: "XTB" },
      precioFecha: "2026-11-03",
      resolucion: null,
    });
  });
});

describe("llamadas", () => {
  it("GET /avisos", async () => {
    vi.mocked(obtener).mockResolvedValue(EJEMPLO);
    const avisos = await obtenerAvisos();
    expect(obtener).toHaveBeenCalledWith("/avisos");
    expect(avisos.avisos[0].tipo).toBe("recurrente");
  });

  it("GET /avisos/conteo", async () => {
    vi.mocked(obtener).mockResolvedValue({ noLeidos: 3 });
    expect(await contarAvisos()).toBe(3);
    expect(obtener).toHaveBeenCalledWith("/avisos/conteo");
  });

  it("PATCH /avisos/:clave con la clave codificada", async () => {
    vi.mocked(enviar).mockResolvedValue(null);
    await marcarAviso("recurrente:9b1c-uuid:2026-11-25", false);
    expect(enviar).toHaveBeenCalledWith("PATCH", "/avisos/recurrente%3A9b1c-uuid%3A2026-11-25", { leido: false });
  });

  it("POST /avisos/leer-todos sin cuerpo", async () => {
    vi.mocked(enviar).mockResolvedValue(null);
    await leerTodosLosAvisos();
    expect(enviar).toHaveBeenCalledWith("POST", "/avisos/leer-todos");
  });

  it("PATCH /avisos/config/:tipo devuelve la configuración nueva", async () => {
    vi.mocked(enviar).mockResolvedValue({ tipo: "precio_manual", activo: true, dias: 14, opciones: [3, 7, 14] });
    const config = await configurarAvisos("precio_manual", { dias: 14 });
    expect(enviar).toHaveBeenCalledWith("PATCH", "/avisos/config/precio_manual", { dias: 14 });
    expect(config).toEqual({ tipo: "precio_manual", activo: true, dias: 14, opciones: [3, 7, 14] });
  });
});
