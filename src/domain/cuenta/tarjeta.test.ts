import { describe, expect, it } from "vitest";
import {
  categoriaAbono,
  categoriaConsumo,
  conceptoCiclo,
  detalleCargo,
  etiquetaAbono,
  posicionHoy,
  textoCompra,
  textoConsumos,
  textoDia,
  textoDiasHasta,
  textoLineaCiclo,
  textoTasa,
  type FilaCiclo,
} from "./tarjeta";

// Tarjeta del diseño (`referencias/export-tarjeta/`), hoy 11 nov 2026.
const HOY = "2026-11-11";
const CICLO = {
  inicio: "2026-10-16",
  corte: "2026-11-15",
  pagoLimite: "2026-11-30",
  diasHastaCorte: 4,
  diasHastaPago: 19,
  saldoAnteriorPendiente: 597_980n,
};
const BANCOLOMBIA = { id: "b1", nombre: "Bancolombia" };

const CONSUMO: FilaCiclo = {
  tipo: "gasto",
  descripcion: "Rappi · restaurante",
  monto: 46_900n,
  categoria: { id: "s", nombre: "Salidas" },
  partes: [],
  contraparte: null,
};

describe("textoTasa y textoDia", () => {
  it("tasa mensual y efectiva anual", () => {
    expect(textoTasa(198, 2652)).toBe("1,98 % M.V. · 26,52 % E.A.");
    expect(textoTasa(200, 2682)).toBe("2,00 % M.V. · 26,82 % E.A.");
    expect(textoTasa(null, null)).toBe("Sin definir");
  });

  it("día de cada mes", () => {
    expect(textoDia(15)).toBe("15 de cada mes");
    expect(textoDia(30)).toBe("30 de cada mes");
    expect(textoDia(null)).toBe("Sin definir");
  });
});

describe("línea del ciclo", () => {
  it("textoDiasHasta", () => {
    expect(textoDiasHasta(0)).toBe("hoy");
    expect(textoDiasHasta(1)).toBe("mañana");
    expect(textoDiasHasta(4)).toBe("en 4 días");
    expect(textoDiasHasta(19)).toBe("en 19 días");
  });

  it("textoLineaCiclo", () => {
    expect(textoLineaCiclo(CICLO, HOY)).toBe("16 oct – 15 nov · pago hasta 30 nov");
  });

  it("posicionHoy: días transcurridos sobre la duración", () => {
    // 26 de 30 días.
    expect(posicionHoy(CICLO, HOY)).toBe(87);
    expect(posicionHoy(CICLO, "2026-10-16")).toBe(0);
    expect(posicionHoy(CICLO, "2026-11-15")).toBe(100);
    expect(posicionHoy(CICLO, "2026-12-01")).toBe(100);
  });
});

describe("filas del ciclo", () => {
  it("cargos: «Cargo fijo» y «Sobre 597.980»", () => {
    expect(detalleCargo({ clase: "cuota_manejo" }, CICLO)).toBe("Cargo fijo");
    expect(detalleCargo({ clase: "intereses" }, CICLO)).toBe("Sobre 597.980");
  });

  it("abono: un pago desde una cuenta; otro, su descripción", () => {
    const pago: FilaCiclo = { ...CONSUMO, tipo: "transferencia", descripcion: null, categoria: null, contraparte: BANCOLOMBIA };
    expect(etiquetaAbono(pago)).toBe("Pago desde Bancolombia");
    expect(categoriaAbono(pago)).toBe("Transferencia");
    const devolucion: FilaCiclo = { ...CONSUMO, tipo: "ingreso", descripcion: "Devolución Falabella", categoria: { id: "o", nombre: "Otros" } };
    expect(etiquetaAbono(devolucion)).toBe("Devolución Falabella");
    expect(categoriaAbono(devolucion)).toBe("Otros");
  });

  it("consumo: categoría, dividido y avance", () => {
    expect(categoriaConsumo(CONSUMO)).toBe("Salidas");
    expect(categoriaConsumo({ ...CONSUMO, categoria: null, partes: [{}] })).toBe("Dividido");
    expect(categoriaConsumo({ ...CONSUMO, tipo: "transferencia", categoria: null, contraparte: BANCOLOMBIA })).toBe("Avance hacia Bancolombia");
    expect(conceptoCiclo({ ...CONSUMO, descripcion: null })).toBe("Salidas");
  });

  it("textoConsumos", () => {
    expect(textoConsumos(11)).toBe("11 consumos");
    expect(textoConsumos(1)).toBe("1 consumo");
  });
});

describe("textoCompra", () => {
  it("sin valor: la invitación", () => {
    expect(textoCompra(null, CICLO, 2_715_700n, HOY)).toEqual({
      titulo: "Escribe el valor y te digo si cabe.",
      detalle: "Se compara con el cupo disponible de hoy.",
    });
  });

  it("cabe, con ciclo", () => {
    const compra = { monto: 450_000n, cabe: true, disponibleTras: 2_265_700n, porcentajeTras: 43, falta: null };
    expect(textoCompra(compra, CICLO, 2_715_700n, HOY)).toEqual({
      titulo: "Sí, cabe en el cupo.",
      detalle: "Te quedarían 2.265.700 disponibles (uso 43 %). Entra al corte del 15 nov y se paga hasta el 30 nov.",
    });
  });

  it("cabe, sin ciclo", () => {
    const compra = { monto: 450_000n, cabe: true, disponibleTras: 2_265_700n, porcentajeTras: 43, falta: null };
    expect(textoCompra(compra, null, 2_715_700n, HOY).detalle).toBe("Te quedarían 2.265.700 disponibles (uso 43 %).");
  });

  it("no cabe", () => {
    const compra = { monto: 3_000_000n, cabe: false, disponibleTras: null, porcentajeTras: null, falta: 284_300n };
    expect(textoCompra(compra, CICLO, 2_715_700n, HOY)).toEqual({
      titulo: "No cabe en el cupo.",
      detalle: "Faltan 284.300. Hoy tienes 2.715.700 disponibles.",
    });
  });
});
