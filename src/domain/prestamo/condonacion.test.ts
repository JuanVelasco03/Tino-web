import { describe, expect, it } from "vitest";
import { montoCondonacion, vistaPreviaCondonacion } from "./condonacion";

describe("montoCondonacion", () => {
  it("todo: el capital pendiente, ignore lo escrito", () => {
    expect(montoCondonacion("todo", "123", 500000n)).toEqual({ monto: 500000n });
  });

  it("parte válida", () => {
    expect(montoCondonacion("parte", "200.000", 500000n)).toEqual({ monto: 200000n });
    expect(montoCondonacion("parte", "500.000", 500000n)).toEqual({ monto: 500000n });
  });

  it("vacío, cero o con decimales", () => {
    const error = { error: "Escribe un valor en pesos, sin decimales." };
    expect(montoCondonacion("parte", "", 500000n)).toEqual(error);
    expect(montoCondonacion("parte", "0", 500000n)).toEqual(error);
    expect(montoCondonacion("parte", "1,5", 500000n)).toEqual(error);
  });

  it("mayor que el capital: error, sin recortar", () => {
    expect(montoCondonacion("parte", "600.000", 500000n)).toEqual({ error: "No puedes condonar más de lo pendiente." });
  });
});

describe("vistaPreviaCondonacion", () => {
  it("todo", () => {
    expect(vistaPreviaCondonacion(500000n, 500000n, 12000000n)).toEqual({
      gasto: 500000n,
      queda: 0n,
      patrimonioAntes: 12000000n,
      patrimonioDespues: 11500000n,
    });
  });

  it("una parte, con patrimonio negativo", () => {
    expect(vistaPreviaCondonacion(500000n, 200000n, -100000n)).toEqual({
      gasto: 200000n,
      queda: 300000n,
      patrimonioAntes: -100000n,
      patrimonioDespues: -300000n,
    });
  });
});
