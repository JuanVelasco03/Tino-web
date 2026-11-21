import { describe, expect, it } from "vitest";
import { esSinClasificar } from "./sin-clasificar";

const COMIDA = { id: "c1", nombre: "Comida" };
const MERCADO = { id: "c2", nombre: "Mercado" };

describe("esSinClasificar", () => {
  it("gasto sin categoría ni partes: sí", () => {
    expect(esSinClasificar({ tipo: "gasto", categoria: null, partes: [] })).toBe(true);
  });

  it("gasto con categoría: no", () => {
    expect(esSinClasificar({ tipo: "gasto", categoria: COMIDA, partes: [] })).toBe(false);
  });

  it("gasto dividido (partes, sin categoría): no", () => {
    expect(
      esSinClasificar({
        tipo: "gasto",
        categoria: null,
        partes: [
          { categoria: COMIDA, monto: 20_000n },
          { categoria: MERCADO, monto: 10_000n },
        ],
      }),
    ).toBe(false);
  });

  it("ingreso sin categoría: no (solo cuentan gastos)", () => {
    expect(esSinClasificar({ tipo: "ingreso", categoria: null, partes: [] })).toBe(false);
  });

  it("transferencia: no (nunca lleva categoría)", () => {
    expect(esSinClasificar({ tipo: "transferencia", categoria: null, partes: [] })).toBe(false);
  });
});
