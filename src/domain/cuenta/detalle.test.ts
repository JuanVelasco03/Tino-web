import { describe, expect, it } from "vitest";
import {
  atajoActivo,
  conceptoFila,
  diferenciaPrevia,
  enLotes,
  esProgramada,
  etiquetaFila,
  fechaCorta,
  MENSAJE_RANGO,
  MENSAJE_SALDO_REAL,
  montoConSigno,
  pendientesDelRango,
  rangoDeAtajo,
  sumaSeleccion,
  textoConciliado,
  textoRango,
  textoSaldoInicio,
  textoSeleccionados,
  validarRango,
  validarSaldoReal,
  type FilaHistorial,
} from "./detalle";

/*
 * Efectivo del diseño (`referencias/export-detalle-cuenta/`): saldo antes del
 * rango 122.200, 16 movimientos del 22 oct al 11 nov, conciliados los de
 * octubre. La API entrega la más reciente primero, con el saldo corrido.
 */
const BASE: [string, string, string, number][] = [
  ["2026-10-22", "Almuerzo", "Comida", -15000],
  ["2026-10-24", "Pago taxi", "Transporte", -30000],
  ["2026-10-27", "Desayuno", "Comida", -8000],
  ["2026-10-28", "Retiro cajero", "Desde Bancolombia", 100000],
  ["2026-10-29", "Agua", "Comida", -1100],
  ["2026-10-30", "Almuerzo", "Comida", -15000],
  ["2026-10-31", "Pan", "Comida", -5000],
  ["2026-11-03", "Recarga datos", "Servicios", -4000],
  ["2026-11-04", "Almuerzo", "Comida", -15000],
  ["2026-11-05", "Recarga tarjeta SITP", "Transporte", -10000],
  ["2026-11-06", "Almuerzo", "Comida", -15000],
  ["2026-11-07", "Pago taxi", "Transporte", -30000],
  ["2026-11-10", "Desayuno", "Comida", -8000],
  ["2026-11-10", "Pan", "Comida", -5000],
  ["2026-11-11", "Agua", "Comida", -1100],
  ["2026-11-11", "Almuerzo", "Comida", -15000],
];

const BANCOLOMBIA = { id: "b1", nombre: "Bancolombia" };

function filasDelDiseno(): FilaHistorial[] {
  let saldo = 122_200n;
  const filas = BASE.map(([fecha, descripcion, cat, monto], i): FilaHistorial => {
    saldo += BigInt(monto);
    const transferencia = cat.startsWith("Desde");
    return {
      movimientoId: `m${i}`,
      tipo: transferencia ? "transferencia" : "gasto",
      fecha,
      descripcion,
      efecto: BigInt(monto),
      saldo,
      conciliado: fecha < "2026-11-01",
      categoria: transferencia ? null : { id: cat, nombre: cat },
      partes: [],
      contraparte: transferencia ? { ...BANCOLOMBIA, sentido: "desde" } : null,
    };
  });
  return filas.reverse();
}

const FILAS = filasDelDiseno();
const HOY = "2026-11-11";

describe("datos del diseño", () => {
  it("saldo actual 45.000 en la fila más reciente", () => {
    expect(FILAS[0].saldo).toBe(45_000n);
    expect(montoConSigno(FILAS[0].saldo, false)).toBe("45.000");
  });
});

describe("rangoDeAtajo y atajoActivo", () => {
  it("«Últimos 30 días» sin parámetros; mes en curso desde el día 1; mes anterior con los dos", () => {
    expect(rangoDeAtajo("30d", HOY)).toEqual({});
    expect(rangoDeAtajo("mes", HOY)).toEqual({ desde: "2026-11-01" });
    expect(rangoDeAtajo("anterior", HOY)).toEqual({ desde: "2026-10-01", hasta: "2026-10-31" });
  });

  it("enero: el anterior es diciembre del año pasado", () => {
    expect(rangoDeAtajo("anterior", "2027-01-05")).toEqual({ desde: "2026-12-01", hasta: "2026-12-31" });
  });

  it("marzo: el anterior termina el 28 de febrero", () => {
    expect(rangoDeAtajo("anterior", "2027-03-10")).toEqual({ desde: "2027-02-01", hasta: "2027-02-28" });
  });

  it("reconoce el atajo de la URL; un rango libre no es atajo", () => {
    expect(atajoActivo(undefined, undefined, HOY)).toBe("30d");
    expect(atajoActivo("2026-11-01", undefined, HOY)).toBe("mes");
    expect(atajoActivo("2026-10-01", "2026-10-31", HOY)).toBe("anterior");
    expect(atajoActivo("2026-10-12", undefined, HOY)).toBeNull();
    expect(atajoActivo("2026-11-01", "2026-11-11", HOY)).toBeNull();
  });
});

describe("textos de fecha y rango", () => {
  it("textoRango con el año, sin hasta: hasta hoy", () => {
    expect(textoRango({ desde: "2026-10-12", hasta: null, fechaHoy: HOY })).toBe("12 oct – 11 nov 2026");
    expect(textoRango({ desde: "2026-10-01", hasta: "2026-10-31", fechaHoy: HOY })).toBe("1 – 31 oct 2026");
    expect(textoRango({ desde: "2025-12-20", hasta: null, fechaHoy: "2026-01-05" })).toBe("20 dic 2025 – 5 ene 2026");
  });

  it("textoSaldoInicio: el día anterior a desde", () => {
    expect(textoSaldoInicio("2026-10-12", HOY)).toBe("Saldo al 11 oct");
    expect(textoSaldoInicio("2026-11-01", HOY)).toBe("Saldo al 31 oct");
    expect(textoSaldoInicio("2026-01-01", HOY)).toBe("Saldo al 31 dic 2025");
  });

  it("fechaCorta: sin año en el año de hoy", () => {
    expect(fechaCorta("2026-10-31", HOY)).toBe("31 oct");
    expect(fechaCorta("2025-10-31", HOY)).toBe("31 oct 2025");
  });
});

describe("textoConciliado", () => {
  const CON = { saldo: 148_100n, al: "2026-10-31", pendientes: 9 };

  it("con saldo y pendientes", () => {
    expect(textoConciliado(CON, "largo", HOY)).toBe("al 31 oct · 9 sin conciliar");
    expect(textoConciliado(CON, "corto", HOY)).toBe("Conciliado 148.100 · al 31 oct · 9 sin conciliar");
  });

  it("con saldo, sin pendientes", () => {
    expect(textoConciliado({ ...CON, pendientes: 0 }, "largo", HOY)).toBe("al 31 oct · todo conciliado");
    expect(textoConciliado({ ...CON, pendientes: 0 }, "corto", HOY)).toBe("Conciliado 148.100 · al 31 oct · todo conciliado");
  });

  it("nunca conciliada y un solo pendiente", () => {
    expect(textoConciliado({ saldo: null, al: null, pendientes: 16 }, "largo", HOY)).toBe("16 sin conciliar");
    expect(textoConciliado({ saldo: null, al: null, pendientes: 16 }, "corto", HOY)).toBe("Conciliado — · 16 sin conciliar");
    expect(textoConciliado({ ...CON, pendientes: 1 }, "largo", HOY)).toBe("al 31 oct · 1 sin conciliar");
  });

  it("sin movimientos", () => {
    expect(textoConciliado({ saldo: null, al: null, pendientes: 0 }, "largo", HOY)).toBe("Sin movimientos");
    expect(textoConciliado({ saldo: null, al: null, pendientes: 0 }, "corto", HOY)).toBe("Sin movimientos");
  });
});

describe("etiquetaFila y conceptoFila", () => {
  const GASTO = FILAS[0];

  it("categoría, dividido y sin clasificar", () => {
    expect(etiquetaFila(GASTO)).toBe("Comida");
    expect(etiquetaFila({ ...GASTO, categoria: null, partes: [{ categoria: { id: "c", nombre: "Comida" }, monto: 1n }] })).toBe("Dividido");
    expect(etiquetaFila({ ...GASTO, categoria: null })).toBe("Sin clasificar");
  });

  it("transferencia desde y hacia; ajuste", () => {
    const retiro = FILAS.find((f) => f.descripcion === "Retiro cajero");
    expect(retiro && etiquetaFila(retiro)).toBe("Desde Bancolombia");
    expect(etiquetaFila({ ...GASTO, tipo: "transferencia", categoria: null, contraparte: { id: "p", nombre: "Préstamo Juan", sentido: "hacia" } })).toBe(
      "Hacia Préstamo Juan",
    );
    expect(etiquetaFila({ ...GASTO, tipo: "ajuste", categoria: { id: "a", nombre: "Ajuste" } })).toBe("Ajuste");
  });

  it("concepto: la descripción o, sin ella, la etiqueta", () => {
    expect(conceptoFila(GASTO)).toBe("Almuerzo");
    expect(conceptoFila({ ...GASTO, descripcion: null })).toBe("Comida");
  });
});

describe("montoConSigno", () => {
  it("+ en positivos, − tipográfico en negativos, 0 sin signo", () => {
    expect(montoConSigno(100_000n)).toBe("+100.000");
    expect(montoConSigno(-15_000n)).toBe("−15.000");
    expect(montoConSigno(0n)).toBe("0");
    expect(montoConSigno(-177_200n)).toBe("−177.200");
  });
});

describe("selección y conciliación", () => {
  it("pendientesDelRango: las 9 de noviembre", () => {
    const pendientes = pendientesDelRango(FILAS);
    expect(pendientes).toHaveLength(9);
    expect(pendientes.every((id) => FILAS.find((f) => f.movimientoId === id)?.fecha.startsWith("2026-11"))).toBe(true);
  });

  it("sumaSeleccion: Σ efectos de los elegidos", () => {
    // Recarga datos −4.000, Almuerzo −15.000, Recarga SITP −10.000.
    expect(sumaSeleccion(FILAS, new Set(["m7", "m8", "m9"]))).toBe(-29_000n);
    expect(sumaSeleccion(FILAS, new Set())).toBe(0n);
    expect(sumaSeleccion(FILAS, new Set(["m3"]))).toBe(100_000n);
  });

  it("textoSeleccionados en singular y plural", () => {
    expect(textoSeleccionados(1)).toBe("1 seleccionado");
    expect(textoSeleccionados(3)).toBe("3 seleccionados");
  });

  it("enLotes: tope de 500 en orden", () => {
    const ids = Array.from({ length: 1001 }, (_, i) => String(i));
    const lotes = enLotes(ids);
    expect(lotes.map((l) => l.length)).toEqual([500, 500, 1]);
    expect(lotes[1][0]).toBe("500");
    expect(enLotes([])).toEqual([]);
  });

  it("esProgramada: solo después de hoy", () => {
    expect(esProgramada("2026-11-12", HOY)).toBe(true);
    expect(esProgramada(HOY, HOY)).toBe(false);
  });
});

describe("ajuste y rango", () => {
  it("diferenciaPrevia: saldo real − saldo a hoy", () => {
    expect(diferenciaPrevia(41_500n, 45_000n)).toBe(-3_500n);
    expect(diferenciaPrevia(45_000n, 45_000n)).toBe(0n);
  });

  it("validarSaldoReal: entero ≥ 0 sin decimales", () => {
    expect(validarSaldoReal("41.500")).toEqual({ valor: 41_500n });
    expect(validarSaldoReal("0")).toEqual({ valor: 0n });
    expect(validarSaldoReal("41.500,5")).toEqual({ error: MENSAJE_SALDO_REAL });
    expect(validarSaldoReal("")).toEqual({ error: MENSAJE_SALDO_REAL });
    expect(validarSaldoReal("-3")).toEqual({ error: MENSAJE_SALDO_REAL });
  });

  it("validarRango: hasta anterior a desde", () => {
    expect(validarRango("2026-11-01", "2026-10-31")).toBe(MENSAJE_RANGO);
    expect(validarRango("2026-10-01", "2026-10-31")).toBeNull();
    expect(validarRango("2026-10-01", "")).toBeNull();
  });
});
