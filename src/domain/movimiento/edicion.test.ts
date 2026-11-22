import { describe, expect, it } from "vitest";
import type { ValoresCaptura } from "./cuerpo";
import { cuentaArchivada, cuentaDePrestamo, hayCambios, valoresDesdeMovimiento, type Movimiento } from "./edicion";

const NEQUI = { id: "c-nequi", nombre: "Nequi" };
const VISA = { id: "c-visa", nombre: "Visa Oro" };
const BANCO = { id: "c-banco", nombre: "Bancolombia" };
const COMIDA = { id: "k-comida", nombre: "Comida" };
const MERCADO = { id: "k-mercado", nombre: "Mercado" };

const GASTO: Movimiento = {
  tipo: "gasto",
  monto: 15_000n,
  fecha: "2026-11-19",
  descripcion: "Almuerzo",
  nota: "con Ana",
  cuentaOrigen: NEQUI,
  cuentaDestino: null,
  categoria: COMIDA,
  partes: [],
};

describe("valoresDesdeMovimiento", () => {
  it("gasto con nota y fecha", () => {
    expect(valoresDesdeMovimiento(GASTO)).toEqual<ValoresCaptura>({
      tipo: "gasto",
      monto: "15.000",
      montoDestino: "",
      descripcion: "Almuerzo",
      categoria: { modo: "elegida", id: COMIDA.id },
      cuentaId: NEQUI.id,
      destinoId: null,
      fecha: "2026-11-19",
      nota: "con Ana",
      partes: null,
    });
  });

  it("dividido: partes formateadas", () => {
    const valores = valoresDesdeMovimiento({
      ...GASTO,
      monto: 30_000n,
      categoria: null,
      partes: [
        { categoria: COMIDA, monto: 20_000n },
        { categoria: MERCADO, monto: 10_000n },
      ],
    });
    expect(valores.partes).toEqual([
      { categoriaId: COMIDA.id, monto: "20.000" },
      { categoriaId: MERCADO.id, monto: "10.000" },
    ]);
  });

  it("sin descripción, nota ni categoría", () => {
    const valores = valoresDesdeMovimiento({ ...GASTO, descripcion: null, nota: null, categoria: null });
    expect(valores.descripcion).toBe("");
    expect(valores.nota).toBe("");
    expect(valores.categoria).toEqual({ modo: "quitada" });
  });

  it("ingreso: la cuenta es el destino", () => {
    const valores = valoresDesdeMovimiento({ ...GASTO, tipo: "ingreso", cuentaOrigen: null, cuentaDestino: BANCO });
    expect(valores.cuentaId).toBe(BANCO.id);
    expect(valores.destinoId).toBeNull();
  });

  it("transferencia: origen y destino, sin categoría ni partes", () => {
    const valores = valoresDesdeMovimiento({ ...GASTO, tipo: "transferencia", cuentaDestino: VISA, categoria: null });
    expect(valores.cuentaId).toBe(NEQUI.id);
    expect(valores.destinoId).toBe(VISA.id);
    expect(valores.partes).toBeNull();
  });
});

describe("hayCambios", () => {
  const original = valoresDesdeMovimiento(GASTO);

  it("sin cambios", () => {
    expect(hayCambios(original, { ...original })).toBe(false);
  });

  it("ignora espacios alrededor", () => {
    expect(hayCambios(original, { ...original, descripcion: " Almuerzo  ", nota: "con Ana " })).toBe(false);
  });

  it.each<[string, Partial<ValoresCaptura>]>([
    ["monto", { monto: "18.000" }],
    ["descripción", { descripcion: "Almuerzo largo" }],
    ["nota", { nota: "" }],
    ["tipo", { tipo: "ingreso" }],
    ["categoría", { categoria: { modo: "elegida", id: "otra" } }],
    ["cuenta", { cuentaId: "otra" }],
    ["fecha", { fecha: "2026-10-31" }],
    ["partes", { partes: [{ categoriaId: null, monto: "" }, { categoriaId: null, monto: "" }] }],
  ])("detecta el cambio de %s", (_campo, cambio) => {
    expect(hayCambios(original, { ...original, ...cambio })).toBe(true);
  });
});

describe("cuentaArchivada", () => {
  const activas = [NEQUI, VISA];

  it("gasto con su cuenta activa → null", () => {
    expect(cuentaArchivada(GASTO, activas)).toBeNull();
  });

  it("gasto con la cuenta archivada", () => {
    expect(cuentaArchivada(GASTO, [VISA])).toEqual(NEQUI);
  });

  it("ingreso con el destino archivado", () => {
    expect(cuentaArchivada({ cuentaOrigen: null, cuentaDestino: BANCO }, activas)).toEqual(BANCO);
  });

  it("transferencia: cualquiera de las dos, la primera que no esté", () => {
    expect(cuentaArchivada({ cuentaOrigen: NEQUI, cuentaDestino: VISA }, activas)).toBeNull();
    expect(cuentaArchivada({ cuentaOrigen: NEQUI, cuentaDestino: BANCO }, activas)).toEqual(BANCO);
    expect(cuentaArchivada({ cuentaOrigen: BANCO, cuentaDestino: VISA }, [NEQUI])).toEqual(BANCO);
  });
});

describe("cuentaArchivada con préstamos", () => {
  const CAMILA = { id: "p-camila", nombre: "Camila Ortiz", tipo: "prestamo_otorgado" as const };

  it("la cuenta del préstamo no cuenta como archivada", () => {
    expect(cuentaArchivada({ cuentaOrigen: NEQUI, cuentaDestino: CAMILA }, [NEQUI], [CAMILA])).toBeNull();
  });

  it("sin la lista de préstamos, sí (comportamiento anterior)", () => {
    expect(cuentaArchivada({ cuentaOrigen: NEQUI, cuentaDestino: CAMILA }, [NEQUI])).toEqual(CAMILA);
  });

  it("la cuenta propia archivada se sigue detectando", () => {
    expect(cuentaArchivada({ cuentaOrigen: BANCO, cuentaDestino: CAMILA }, [NEQUI], [CAMILA])).toEqual(BANCO);
  });
});

describe("cuentaDePrestamo", () => {
  const CAMILA = { id: "p-camila", nombre: "Camila Ortiz", tipo: "prestamo_otorgado" as const };
  const MAMA = { id: "p-mama", nombre: "Mamá", tipo: "deuda_contraida" as const };
  const PRESTAMOS = [CAMILA, MAMA];

  it("desembolso otorgado: la cuenta del préstamo es el destino", () => {
    expect(cuentaDePrestamo({ tipo: "transferencia", cuentaOrigen: NEQUI, cuentaDestino: CAMILA }, PRESTAMOS)).toEqual({
      ...CAMILA,
      rol: "destino",
    });
  });

  it("desembolso contraído: la cuenta del préstamo es el origen", () => {
    expect(cuentaDePrestamo({ tipo: "transferencia", cuentaOrigen: MAMA, cuentaDestino: BANCO }, PRESTAMOS)).toEqual({
      ...MAMA,
      rol: "cuenta",
    });
  });

  it("condonación: gasto con origen en el préstamo", () => {
    expect(cuentaDePrestamo({ tipo: "gasto", cuentaOrigen: CAMILA, cuentaDestino: null }, PRESTAMOS)?.rol).toBe("cuenta");
  });

  it("un interés (cuentas propias) o un gasto normal → null", () => {
    expect(cuentaDePrestamo({ tipo: "ingreso", cuentaOrigen: null, cuentaDestino: NEQUI }, PRESTAMOS)).toBeNull();
    expect(cuentaDePrestamo(GASTO, PRESTAMOS)).toBeNull();
  });
});

describe("valoresDesdeMovimiento entre monedas", () => {
  it("precarga «Llegó» en la moneda del destino", () => {
    const fondeo: Movimiento = {
      ...GASTO,
      tipo: "transferencia",
      monto: 8_240_000n,
      moneda: "COP",
      montoDestino: 200_000n,
      cuentaDestino: BANCO,
      categoria: null,
    };
    expect(valoresDesdeMovimiento(fondeo)).toMatchObject({ monto: "8.240.000", montoDestino: "2.000,00" });
    expect(valoresDesdeMovimiento({ ...fondeo, moneda: "USD", monto: 200_000n, montoDestino: 8_240_000n })).toMatchObject({
      monto: "2.000,00",
      montoDestino: "8.240.000",
    });
  });

  it("cambiar «Llegó» cuenta como cambio", () => {
    const fondeo: Movimiento = { ...GASTO, tipo: "transferencia", moneda: "COP", montoDestino: 200_000n, cuentaDestino: BANCO, categoria: null };
    const antes = valoresDesdeMovimiento(fondeo);
    expect(hayCambios(antes, { ...antes, montoDestino: "2.100,00" })).toBe(true);
  });
});
