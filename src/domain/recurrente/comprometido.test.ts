import { describe, expect, it } from "vitest";
import { anchosComprometido } from "./comprometido";

describe("anchosComprometido", () => {
  it("total cero → barra vacía", () => {
    expect(anchosComprometido({ total: 0n, pagado: 0n, porConfirmar: 0n })).toEqual({ pagado: 0, porConfirmar: 0 });
  });

  it("solo pagado → 100 y 0", () => {
    expect(anchosComprometido({ total: 500_000n, pagado: 500_000n, porConfirmar: 0n })).toEqual({ pagado: 100, porConfirmar: 0 });
  });

  it("los tres grupos del diseño (1.618.170 = 1.396.220 + 191.150 + 30.800)", () => {
    expect(anchosComprometido({ total: 1_618_170n, pagado: 1_396_220n, porConfirmar: 191_150n })).toEqual({
      pagado: 86,
      porConfirmar: 11,
    });
  });

  it("el redondeo por debajo no pasa de 100", () => {
    // 1/3 + 2/3: 33 + 66 = 99, el resto lo ocupa programado.
    const { pagado, porConfirmar } = anchosComprometido({ total: 3n, pagado: 1n, porConfirmar: 2n });
    expect(pagado + porConfirmar).toBeLessThanOrEqual(100);
    expect({ pagado, porConfirmar }).toEqual({ pagado: 33, porConfirmar: 66 });
  });

  it("montos enormes no pierden precisión", () => {
    const total = 9_000_000_000_000_000_000n;
    expect(anchosComprometido({ total, pagado: total / 2n, porConfirmar: total / 4n })).toEqual({ pagado: 50, porConfirmar: 25 });
  });
});
