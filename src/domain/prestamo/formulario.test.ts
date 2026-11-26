import { describe, expect, it } from "vitest";
import {
  aplicarPropuesta,
  cambioDesde,
  cuerpoAbono,
  cuerpoAlta,
  cuerpoDesembolso,
  personaExistente,
  totalAbono,
  totalPendiente,
  VALORES_ABONO,
  VALORES_ALTA,
  type ValoresAbono,
  type ValoresAlta,
} from "./formulario";
import type { Prestamo } from "./tipos";

const HOY = "2026-11-11";

function prestamo(p: Partial<Prestamo>): Prestamo {
  return {
    id: "p",
    nombre: "Camila Ortiz",
    tipo: "prestamo_otorgado",
    estado: "te_debe",
    capitalPendiente: 500000n,
    desde: "2026-08-14",
    fechaAcordada: null,
    vencido: false,
    cierre: null,
    interesesCausados: 0n,
    ...p,
  };
}

const CAMILA = prestamo({ id: "camila" });
const ANDRES = prestamo({ id: "andres", nombre: "Andrés Gil", estado: "saldado", capitalPendiente: 0n, desde: null });
const MAMA = prestamo({ id: "mama", nombre: "Mamá", tipo: "deuda_contraida", estado: "le_debes" });
const LISTA = [CAMILA, MAMA, ANDRES];

describe("valores por defecto", () => {
  it("alta", () => {
    expect(VALORES_ALTA("deuda_contraida", HOY, "nequi")).toEqual({
      tipo: "deuda_contraida",
      nombre: "",
      monto: "",
      cuentaId: "nequi",
      fecha: HOY,
      tasaMensual: "",
      fechaAcordada: "",
    });
  });

  it("abono", () => {
    expect(VALORES_ABONO(HOY, null)).toEqual({ cuentaId: null, fecha: HOY, total: "", capital: "", interes: "" });
  });
});

describe("personaExistente", () => {
  it("sin mayúsculas ni espacios alrededor", () => {
    expect(personaExistente("  camila ortiz ", LISTA, "prestamo_otorgado")).toBe(CAMILA);
    expect(personaExistente("ANDRÉS GIL", LISTA, "prestamo_otorgado")).toBe(ANDRES);
  });

  it("solo en el mismo sentido", () => {
    expect(personaExistente("Mamá", LISTA, "prestamo_otorgado")).toBeNull();
    expect(personaExistente("mamá", LISTA, "deuda_contraida")).toBe(MAMA);
  });

  it("incluye saldados; vacío no coincide", () => {
    expect(personaExistente("andrés gil", LISTA, "prestamo_otorgado")?.estado).toBe("saldado");
    expect(personaExistente("   ", LISTA, "prestamo_otorgado")).toBeNull();
  });
});

describe("cuerpoAlta", () => {
  const base: ValoresAlta = {
    tipo: "prestamo_otorgado",
    nombre: " Laura ",
    monto: "200.000",
    cuentaId: "nequi",
    fecha: HOY,
    tasaMensual: "1,5",
    fechaAcordada: "2026-12-15",
  };

  it("tasa con coma → punto", () => {
    expect(cuerpoAlta(base)).toEqual({
      tipo: "prestamo_otorgado",
      nombre: "Laura",
      monto: "200000",
      cuentaId: "nequi",
      fecha: HOY,
      tasaMensual: "1.5",
      fechaAcordada: "2026-12-15",
    });
  });

  it("tasa vacía → «0»; sin fecha acordada → null", () => {
    const cuerpo = cuerpoAlta({ ...base, tasaMensual: " ", fechaAcordada: "" });
    expect(cuerpo?.tasaMensual).toBe("0");
    expect(cuerpo?.fechaAcordada).toBeNull();
  });

  it("la tasa no se valida aquí: la API decide", () => {
    expect(cuerpoAlta({ ...base, tasaMensual: "1,234" })?.tasaMensual).toBe("1.234");
  });

  it("monto inválido → null", () => {
    expect(cuerpoAlta({ ...base, monto: "" })).toBeNull();
    expect(cuerpoAlta({ ...base, monto: "0" })).toBeNull();
    expect(cuerpoAlta({ ...base, monto: "1,5" })).toBeNull();
  });
});

describe("cuerpoDesembolso", () => {
  it("monto, cuenta y fecha", () => {
    const v = { ...VALORES_ALTA("prestamo_otorgado", HOY, "nequi"), monto: "100.000", tasaMensual: "3" };
    expect(cuerpoDesembolso(v)).toEqual({ monto: "100000", cuentaId: "nequi", fecha: HOY });
  });

  it("monto inválido → null", () => {
    expect(cuerpoDesembolso(VALORES_ALTA("prestamo_otorgado", HOY, "nequi"))).toBeNull();
  });
});

describe("abono", () => {
  const v: ValoresAbono = { cuentaId: "nequi", fecha: HOY, total: "112.000", capital: "", interes: "" };
  const propuesta = {
    fecha: HOY,
    monto: 112000n,
    capital: 105333n,
    interes: 6667n,
    interesesCausados: 6667n,
    capitalPendiente: 500000n,
  };

  it("aplicarPropuesta llena capital e interés", () => {
    expect(aplicarPropuesta(v, propuesta)).toEqual({ ...v, capital: "105.333", interes: "6.667" });
  });

  it("totalAbono suma lo escrito", () => {
    expect(totalAbono({ ...v, capital: "105.333", interes: "6.667" })).toBe(112000n);
    expect(totalAbono({ ...v, capital: "105.333", interes: "0" })).toBe(105333n);
    expect(totalAbono({ ...v, capital: "105.333", interes: "" })).toBeNull();
    expect(totalAbono({ ...v, capital: "1,5", interes: "0" })).toBeNull();
  });

  it("totalPendiente sugiere capital más causados, ya formateado", () => {
    expect(totalPendiente(343956n, 6191n)).toBe("350.147");
    expect(totalPendiente(120000n, 0n)).toBe("120.000");
  });

  it("cuerpoAbono con interés", () => {
    expect(cuerpoAbono({ ...v, capital: "105.333", interes: "6.667" }, true)).toEqual({
      cuentaId: "nequi",
      fecha: HOY,
      capital: "105333",
      interes: "6667",
    });
    expect(cuerpoAbono({ ...v, capital: "105.333", interes: "x" }, true)).toBeNull();
  });

  it("cuerpoAbono sin interés: el total a capital", () => {
    expect(cuerpoAbono({ ...v, total: "500.000", capital: "9", interes: "9" }, false)).toEqual({
      cuentaId: "nequi",
      fecha: HOY,
      capital: "500000",
      interes: "0",
    });
    expect(cuerpoAbono({ ...v, total: "" }, false)).toBeNull();
  });
});

describe("cambioDesde", () => {
  const antes = { nombre: "Camila Ortiz", fechaAcordada: "2026-10-15" };

  it("solo el nombre", () => {
    expect(cambioDesde(antes, { ...antes, nombre: " Camila O. " })).toEqual({ nombre: "Camila O." });
  });

  it("quitar la fecha → null", () => {
    expect(cambioDesde(antes, { ...antes, fechaAcordada: "" })).toEqual({ fechaAcordada: null });
  });

  it("sin cambios (o solo espacios) → null", () => {
    expect(cambioDesde(antes, antes)).toBeNull();
    expect(cambioDesde(antes, { ...antes, nombre: "Camila Ortiz  " })).toBeNull();
  });
});
