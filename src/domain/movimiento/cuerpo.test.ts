import { describe, expect, it } from "vitest";
import { cuerpoDesdeValores, type Propuesta, type ValoresCaptura, ladoCop, requiereMontoDestino } from "./cuerpo";

const NEQUI = "0f9c6c1e-3a52-4c51-9a7e-2b1f0d6f5a11";
const VISA = "7d2b8e40-91c3-4f0e-8b6a-5c4d3e2f1a09";
const COMIDA = { id: "bb9f0000-0000-4000-8000-000000000001", nombre: "Comida", tipo: "gasto" as const };
const OCIO = "bb9f0000-0000-4000-8000-000000000002";
const SALARIO = { id: "a7e30000-0000-4000-8000-000000000003", nombre: "Salario", tipo: "ingreso" as const };

const PROPUESTA: Propuesta = { categoria: COMIDA, regla: { id: "e4c10000-0000-4000-8000-000000000004", palabraClave: "almuerzo" } };

const BASE: ValoresCaptura = {
  tipo: "gasto",
  monto: "15.000",
  montoDestino: "",
  descripcion: "Almuerzo",
  categoria: { modo: "propuesta" },
  cuentaId: NEQUI,
  destinoId: null,
  fecha: "2026-11-19",
  nota: "",
  partes: null,
};

const MERCADO = "bb9f0000-0000-4000-8000-000000000005";

describe("cuerpoDesdeValores · forma por tipo", () => {
  it("gasto: cuenta de origen y categoría propuesta", () => {
    expect(cuerpoDesdeValores(BASE, PROPUESTA)).toEqual({
      tipo: "gasto",
      monto: "15000",
      fecha: "2026-11-19",
      descripcion: "Almuerzo",
      nota: null,
      cuentaOrigenId: NEQUI,
      categoriaId: COMIDA.id,
    });
  });

  it("ingreso: la cuenta es el destino", () => {
    const cuerpo = cuerpoDesdeValores({ ...BASE, tipo: "ingreso", categoria: { modo: "elegida", id: SALARIO.id } }, null);
    expect(cuerpo).toEqual({
      tipo: "ingreso",
      monto: "15000",
      fecha: "2026-11-19",
      descripcion: "Almuerzo",
      nota: null,
      cuentaDestinoId: NEQUI,
      categoriaId: SALARIO.id,
    });
  });

  it("transferencia: origen y destino, nunca categoría", () => {
    const cuerpo = cuerpoDesdeValores(
      { ...BASE, tipo: "transferencia", destinoId: VISA, categoria: { modo: "elegida", id: OCIO } },
      PROPUESTA,
    );
    expect(cuerpo).toEqual({
      tipo: "transferencia",
      monto: "15000",
      fecha: "2026-11-19",
      descripcion: "Almuerzo",
      nota: null,
      cuentaOrigenId: NEQUI,
      cuentaDestinoId: VISA,
    });
    expect(cuerpo).not.toHaveProperty("categoriaId");
  });

  it("sin fecha aún (la captura no ha cargado): no la envía", () => {
    expect(cuerpoDesdeValores({ ...BASE, fecha: "" }, null)).not.toHaveProperty("fecha");
  });
});

describe("cuerpoDesdeValores · categoría", () => {
  it("la elegida gana a la propuesta", () => {
    expect(cuerpoDesdeValores({ ...BASE, categoria: { modo: "elegida", id: OCIO } }, PROPUESTA)?.categoriaId).toBe(OCIO);
  });

  it("quitada: sin categoría aunque haya propuesta", () => {
    expect(cuerpoDesdeValores({ ...BASE, categoria: { modo: "quitada" } }, PROPUESTA)?.categoriaId).toBeNull();
  });

  it("sin propuesta ni elección: sin categoría", () => {
    expect(cuerpoDesdeValores(BASE, null)?.categoriaId).toBeNull();
  });

  it("una propuesta de otro tipo no vale", () => {
    expect(cuerpoDesdeValores({ ...BASE, tipo: "ingreso" }, PROPUESTA)?.categoriaId).toBeNull();
  });
});

describe("cuerpoDesdeValores · monto", () => {
  it.each(["", "0", "000", "0.000", "1,5", "-100", "abc", "12345678901234567890"])("%j → null", (monto) => {
    expect(cuerpoDesdeValores({ ...BASE, monto }, null)).toBeNull();
  });

  it("quita los puntos de miles y no pasa por number", () => {
    expect(cuerpoDesdeValores({ ...BASE, monto: "9.007.199.254.740.993" }, null)?.monto).toBe("9007199254740993");
  });
});

describe("cuerpoDesdeValores · partes", () => {
  const DIVIDIDO: ValoresCaptura = {
    ...BASE,
    monto: "30.000",
    nota: "con Ana",
    categoria: { modo: "elegida", id: OCIO },
    partes: [
      { categoriaId: COMIDA.id, monto: "20.000" },
      { categoriaId: MERCADO, monto: "10.000" },
    ],
  };

  it("con partes envía `partes` y nunca `categoriaId`, aunque haya una elegida o propuesta", () => {
    const cuerpo = cuerpoDesdeValores(DIVIDIDO, PROPUESTA);
    expect(cuerpo).toEqual({
      tipo: "gasto",
      monto: "30000",
      fecha: "2026-11-19",
      descripcion: "Almuerzo",
      nota: "con Ana",
      cuentaOrigenId: NEQUI,
      partes: [
        { categoriaId: COMIDA.id, monto: "20000" },
        { categoriaId: MERCADO, monto: "10000" },
      ],
    });
    expect(cuerpo).not.toHaveProperty("categoriaId");
  });

  it("ingreso dividido: la cuenta es el destino", () => {
    const cuerpo = cuerpoDesdeValores({ ...DIVIDIDO, tipo: "ingreso" }, null);
    expect(cuerpo?.cuentaDestinoId).toBe(NEQUI);
    expect(cuerpo?.partes).toHaveLength(2);
  });

  it("transferencia: nunca partes", () => {
    const cuerpo = cuerpoDesdeValores({ ...DIVIDIDO, tipo: "transferencia", destinoId: VISA }, null);
    expect(cuerpo).not.toHaveProperty("partes");
    expect(cuerpo).not.toHaveProperty("categoriaId");
  });

  it.each<[string, ValoresCaptura["partes"]]>([
    ["no suman", [{ categoriaId: COMIDA.id, monto: "20.000" }, { categoriaId: MERCADO, monto: "5.000" }]],
    ["una sola", [{ categoriaId: COMIDA.id, monto: "30.000" }]],
    ["sin categoría", [{ categoriaId: COMIDA.id, monto: "20.000" }, { categoriaId: null, monto: "10.000" }]],
    ["repetidas", [{ categoriaId: COMIDA.id, monto: "20.000" }, { categoriaId: COMIDA.id, monto: "10.000" }]],
    ["monto vacío", [{ categoriaId: COMIDA.id, monto: "30.000" }, { categoriaId: MERCADO, monto: "" }]],
  ])("partes inválidas (%s) → null", (_caso, partes) => {
    expect(cuerpoDesdeValores({ ...DIVIDIDO, partes }, null)).toBeNull();
  });

  it("sin dividir: no envía `partes`", () => {
    expect(cuerpoDesdeValores(BASE, null)).not.toHaveProperty("partes");
  });
});

describe("cuerpoDesdeValores · textos", () => {
  it("descripción y nota vacías → null", () => {
    const cuerpo = cuerpoDesdeValores({ ...BASE, descripcion: "   ", nota: "" }, null);
    expect(cuerpo?.descripcion).toBeNull();
    expect(cuerpo?.nota).toBeNull();
  });

  it("recorta espacios y conserva la nota", () => {
    const cuerpo = cuerpoDesdeValores({ ...BASE, descripcion: "  Almuerzo ", nota: " con Ana " }, null);
    expect(cuerpo?.descripcion).toBe("Almuerzo");
    expect(cuerpo?.nota).toBe("con Ana");
  });
});

describe("requiereMontoDestino", () => {
  it("solo entre monedas distintas", () => {
    expect(requiereMontoDestino("COP", "USD")).toBe(true);
    expect(requiereMontoDestino("USD", "COP")).toBe(true);
    expect(requiereMontoDestino("COP", "COP")).toBe(false);
    expect(requiereMontoDestino("USD", "USD")).toBe(false);
    expect(requiereMontoDestino("COP", null)).toBe(false);
  });
});

describe("ladoCop", () => {
  it("origen COP: el monto; origen USD: lo que llegó; sin montoDestino: null", () => {
    expect(ladoCop({ moneda: "COP", monto: 8_240_000n, montoDestino: 200_000n })).toBe(8_240_000n);
    expect(ladoCop({ moneda: "USD", monto: 200_000n, montoDestino: 8_240_000n })).toBe(8_240_000n);
    expect(ladoCop({ moneda: "COP", monto: 30_000n, montoDestino: null })).toBeNull();
  });
});

describe("cuerpoDesdeValores · transferencia entre monedas", () => {
  const ETORO = "e70e0000-0000-4000-8000-000000000009";
  const FONDEO: ValoresCaptura = { ...BASE, tipo: "transferencia", monto: "8.240.000", montoDestino: "2.000,00", destinoId: ETORO };

  it("COP → USD: monto en pesos y montoDestino en centavos", () => {
    expect(cuerpoDesdeValores(FONDEO, null, { origen: "COP", destino: "USD" })).toMatchObject({
      tipo: "transferencia",
      monto: "8240000",
      montoDestino: "200000",
      cuentaOrigenId: NEQUI,
      cuentaDestinoId: ETORO,
    });
  });

  it("USD → COP: monto en centavos", () => {
    const retiro = { ...FONDEO, monto: "2.000,00", montoDestino: "8.240.000" };
    expect(cuerpoDesdeValores(retiro, null, { origen: "USD", destino: "COP" })).toMatchObject({ monto: "200000", montoDestino: "8240000" });
  });

  it("sin «Llegó» válido → null", () => {
    expect(cuerpoDesdeValores({ ...FONDEO, montoDestino: "" }, null, { origen: "COP", destino: "USD" })).toBeNull();
    expect(cuerpoDesdeValores({ ...FONDEO, montoDestino: "1,234" }, null, { origen: "COP", destino: "USD" })).toBeNull();
  });

  it("misma moneda: nunca envía montoDestino", () => {
    expect(cuerpoDesdeValores(FONDEO, null, { origen: "COP", destino: "COP" })).not.toHaveProperty("montoDestino");
  });

  it("gasto: el monto siempre en pesos", () => {
    expect(cuerpoDesdeValores({ ...BASE, monto: "15.000" }, null, { origen: "USD", destino: null })).toMatchObject({ monto: "15000" });
  });
});
