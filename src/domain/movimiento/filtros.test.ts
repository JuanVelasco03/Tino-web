import { describe, expect, it } from "vitest";
import { agruparPorDia, filtrar, hayFiltros, opcionesDe, personaDe, SIN_CATEGORIA, SIN_FILTROS, type MovimientoFiltrable } from "./filtros";

const NEQUI = { id: "a1", nombre: "Nequi" };
const EFECTIVO = { id: "a2", nombre: "Efectivo" };
const MAMA = { id: "p1", nombre: "Mamá" };
const COMIDA = { id: "c1", nombre: "Comida" };
const SERVICIOS = { id: "c2", nombre: "Servicios" };
const PERSONAS = new Map([[MAMA.id, MAMA.nombre]]);

function mov(p: Partial<MovimientoFiltrable>): MovimientoFiltrable {
  return { tipo: "gasto", fecha: "2026-11-11", descripcion: null, cuentaOrigen: NEQUI, cuentaDestino: null, categoria: null, partes: [], ...p };
}

const ALMUERZO = mov({ descripcion: "Almuerzo", categoria: COMIDA, cuentaOrigen: EFECTIVO });
const ENERGIA = mov({ descripcion: "Energía Enel", categoria: SERVICIOS, fecha: "2026-11-03" });
const PSE = mov({ descripcion: "PSE 88231", fecha: "2026-11-03" });
const ABONO = mov({ tipo: "transferencia", descripcion: "Préstamo a mamá", cuentaDestino: MAMA, fecha: "2026-11-02" });
const DIVIDIDO = mov({ descripcion: "Éxito", partes: [{ categoria: COMIDA }, { categoria: SERVICIOS }], fecha: "2026-11-02" });
const TODOS = [ALMUERZO, ENERGIA, PSE, ABONO, DIVIDIDO];

describe("filtrar", () => {
  it("sin filtros: todos", () => {
    expect(filtrar(TODOS, SIN_FILTROS, PERSONAS)).toEqual(TODOS);
    expect(hayFiltros(SIN_FILTROS)).toBe(false);
  });

  it("texto sin tildes ni mayúsculas, en concepto, categoría, cuenta y persona", () => {
    expect(filtrar(TODOS, { ...SIN_FILTROS, texto: "energia" }, PERSONAS)).toEqual([ENERGIA]);
    expect(filtrar(TODOS, { ...SIN_FILTROS, texto: "COMIDA" }, PERSONAS)).toEqual([ALMUERZO, DIVIDIDO]);
    expect(filtrar(TODOS, { ...SIN_FILTROS, texto: "efectivo" }, PERSONAS)).toEqual([ALMUERZO]);
    expect(filtrar(TODOS, { ...SIN_FILTROS, texto: "mama" }, PERSONAS)).toEqual([ABONO]);
  });

  it("cuenta: origen o destino", () => {
    expect(filtrar(TODOS, { ...SIN_FILTROS, cuentaId: NEQUI.id }, PERSONAS)).toEqual([ENERGIA, PSE, ABONO, DIVIDIDO]);
  });

  it("categoría: también en las partes; «Sin categoría» excluye transferencias", () => {
    expect(filtrar(TODOS, { ...SIN_FILTROS, categoriaId: SERVICIOS.id }, PERSONAS)).toEqual([ENERGIA, DIVIDIDO]);
    expect(filtrar(TODOS, { ...SIN_FILTROS, categoriaId: SIN_CATEGORIA }, PERSONAS)).toEqual([PSE]);
  });

  it("tipo y persona", () => {
    expect(filtrar(TODOS, { ...SIN_FILTROS, tipo: "transferencia" }, PERSONAS)).toEqual([ABONO]);
    expect(filtrar(TODOS, { ...SIN_FILTROS, persona: "Mamá" }, PERSONAS)).toEqual([ABONO]);
  });
});

describe("personaDe", () => {
  it("el nombre de la cuenta de préstamo en cualquier extremo", () => {
    expect(personaDe(ABONO, PERSONAS)).toBe("Mamá");
    expect(personaDe(mov({ tipo: "transferencia", cuentaOrigen: MAMA, cuentaDestino: NEQUI }), PERSONAS)).toBe("Mamá");
    expect(personaDe(ALMUERZO, PERSONAS)).toBeNull();
  });
});

describe("agruparPorDia", () => {
  it("junta los del mismo día sin reordenar", () => {
    expect(agruparPorDia(TODOS)).toEqual([
      { fecha: "2026-11-11", movimientos: [ALMUERZO] },
      { fecha: "2026-11-03", movimientos: [ENERGIA, PSE] },
      { fecha: "2026-11-02", movimientos: [ABONO, DIVIDIDO] },
    ]);
  });
});

describe("opcionesDe", () => {
  it("solo lo que aparece, alfabético; préstamos como persona y no como cuenta", () => {
    const o = opcionesDe(TODOS, PERSONAS);
    expect(o.cuentas.map((c) => c.etiqueta)).toEqual(["Efectivo", "Nequi"]);
    expect(o.categorias.map((c) => c.etiqueta)).toEqual(["Comida", "Servicios", "Sin categoría"]);
    expect(o.personas.map((c) => c.etiqueta)).toEqual(["Mamá"]);
  });
});
