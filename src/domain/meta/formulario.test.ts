import { describe, expect, it } from "vitest";
import {
  cambioDesde,
  cuentasAdmitidas,
  cuentasOrigen,
  fechaMetaDesde,
  precisionDe,
  validarAporte,
  validarMeta,
  valoresAlta,
  valoresEdicion,
  type Precision,
  type ValoresAporte,
  type ValoresMeta,
} from "./formulario";
import type { Meta, MetaDetalle } from "./tipos";

type Cuenta = { id: string; nombre: string; tipo: string; moneda: "COP" | "USD" };

const NUBANK: Cuenta = { id: "nubank", nombre: "Nubank", tipo: "banco", moneda: "COP" };
const BANCOLOMBIA: Cuenta = { id: "banco", nombre: "Bancolombia", tipo: "banco", moneda: "COP" };
const NEQUI: Cuenta = { id: "nequi", nombre: "Nequi", tipo: "efectivo", moneda: "COP" };
const ETORO: Cuenta = { id: "etoro", nombre: "eToro", tipo: "inversion", moneda: "USD" };
const XTB: Cuenta = { id: "xtb", nombre: "XTB", tipo: "inversion", moneda: "COP" };
const VISA: Cuenta = { id: "visa", nombre: "Visa", tipo: "tarjeta_credito", moneda: "COP" };
const CUENTAS = [NUBANK, BANCOLOMBIA, NEQUI, ETORO, XTB, VISA];

function meta(id: string, modo: Meta["modo"], cuenta: Cuenta): Pick<Meta, "id" | "modo" | "cuenta"> {
  return { id, modo, cuenta: { id: cuenta.id, nombre: cuenta.nombre, tipo: cuenta.tipo as "banco", moneda: cuenta.moneda } };
}

const METAS = [meta("viaje", "apartado", NUBANK), meta("fondo", "apartado", NUBANK), meta("cuota", "cuenta", ETORO), meta("moto", "apartado", BANCOLOMBIA)];

const FONDO: MetaDetalle = {
  id: "fondo",
  nombre: "Fondo de emergencia",
  modo: "apartado",
  cuenta: { id: "nubank", nombre: "Nubank", tipo: "banco", moneda: "COP" },
  objetivo: 7_500_000n,
  avance: 1_900_000n,
  falta: 5_600_000n,
  porcentaje: 2533,
  fechaMeta: "2026-12-15",
  cumplidaEl: null,
  uso: null,
  ritmo: null,
  creadaEl: "2026-06-15",
  archivadaEn: null,
  historial: [],
  apartados: null,
  inversion: null,
};

const ids = (cuentas: readonly Cuenta[]) => cuentas.map((c) => c.id);

describe("precisionDe y fechaMetaDesde", () => {
  it.each<[string | null, Precision]>([
    [null, "ninguna"],
    ["2027-12", "mes"],
    ["2026-12-15", "dia"],
  ])("%s ↔ %s", (fechaMeta, precision) => {
    expect(precisionDe(fechaMeta)).toBe(precision);
    expect(fechaMetaDesde(precision, fechaMeta ?? "")).toBe(fechaMeta);
  });

  it("«Sin fecha» descarta el valor; un valor vacío es null", () => {
    expect(fechaMetaDesde("ninguna", "2026-12-15")).toBeNull();
    expect(fechaMetaDesde("dia", "")).toBeNull();
  });
});

describe("cuentasAdmitidas", () => {
  it("apartado: efectivo y banco, sin tarjeta ni inversión", () => {
    expect(ids(cuentasAdmitidas("apartado", CUENTAS, []))).toEqual(["nubank", "banco", "nequi"]);
  });

  it("cuenta: también inversión, sin tarjeta", () => {
    expect(ids(cuentasAdmitidas("cuenta", CUENTAS, []))).toEqual(["nubank", "banco", "nequi", "etoro", "xtb"]);
  });

  it("una meta de toda la cuenta excluye su cuenta en los dos modos", () => {
    const metas = [meta("todo", "cuenta", NEQUI)];
    expect(ids(cuentasAdmitidas("apartado", CUENTAS, metas))).toEqual(["nubank", "banco"]);
    expect(ids(cuentasAdmitidas("cuenta", CUENTAS, metas))).toEqual(["nubank", "banco", "etoro", "xtb"]);
  });

  it("los datos del diseño", () => {
    expect(ids(cuentasAdmitidas("apartado", CUENTAS, METAS))).toEqual(["nubank", "banco", "nequi"]);
    expect(ids(cuentasAdmitidas("cuenta", CUENTAS, METAS))).toEqual(["nequi", "xtb"]);
  });

  it("en la edición, la propia no excluye", () => {
    expect(ids(cuentasAdmitidas("cuenta", CUENTAS, METAS, "cuota"))).toEqual(["nequi", "etoro", "xtb"]);
    const sola = [meta("fondo", "apartado", NUBANK)];
    expect(ids(cuentasAdmitidas("cuenta", CUENTAS, sola, "fondo"))).toContain("nubank");
  });
});

describe("cuentasOrigen", () => {
  it("COP y distintas de la de la meta", () => {
    expect(ids(cuentasOrigen(CUENTAS, "nubank"))).toEqual(["banco", "nequi", "xtb", "visa"]);
  });
});

function valoresMeta(parcial: Partial<ValoresMeta> = {}): ValoresMeta {
  return { ...valoresAlta(), nombre: "Celular", cuentaId: "nubank", objetivo: "1.000.000", ...parcial };
}

describe("validarMeta", () => {
  it("cada mensaje", () => {
    expect(validarMeta(valoresMeta({ nombre: "  ", cuentaId: null, objetivo: "", precision: "dia" }), true)).toEqual({
      errores: {
        nombre: "Escribe un nombre de 1 a 60 caracteres.",
        cuentaId: "Elige la cuenta.",
        objetivo: "Escribe un valor en pesos, sin decimales.",
        fechaMeta: "Elige la fecha meta.",
      },
    });
    expect(validarMeta(valoresMeta({ nombre: "x".repeat(61) }), true)).toEqual({ errores: { nombre: "Escribe un nombre de 1 a 60 caracteres." } });
    expect(validarMeta(valoresMeta({ objetivo: "0" }), true)).toEqual({ errores: { objetivo: "Escribe un valor en pesos, sin decimales." } });
    expect(validarMeta(valoresMeta({ aporteInicial: "0" }), true)).toEqual({ errores: { aporteInicial: "Escribe un valor en pesos, sin decimales." } });
  });

  it("alta sin apartado inicial", () => {
    expect(validarMeta(valoresMeta({ nombre: " Celular ", precision: "mes", fecha: "2026-12" }), true)).toEqual({
      cuerpo: { nombre: "Celular", cuentaId: "nubank", modo: "apartado", objetivo: "1000000", fechaMeta: "2026-12" },
    });
  });

  it("alta con apartado inicial ya en la cuenta y con origen", () => {
    expect(validarMeta(valoresMeta({ aporteInicial: "300.000" }), true)).toEqual({
      cuerpo: {
        nombre: "Celular",
        cuentaId: "nubank",
        modo: "apartado",
        objetivo: "1000000",
        fechaMeta: null,
        aporteInicial: { monto: "300000", cuentaOrigenId: null },
      },
    });
    const conOrigen = validarMeta(valoresMeta({ aporteInicial: "300.000", origenId: "banco" }), true);
    expect("cuerpo" in conOrigen && conOrigen.cuerpo.aporteInicial).toEqual({ monto: "300000", cuentaOrigenId: "banco" });
  });

  it("el apartado inicial no va en toda la cuenta ni en la edición", () => {
    const cuenta = validarMeta(valoresMeta({ modo: "cuenta", aporteInicial: "300.000" }), true);
    expect("cuerpo" in cuenta && cuenta.cuerpo.aporteInicial).toBeUndefined();
    const edicion = validarMeta(valoresMeta({ aporteInicial: "300.000" }), false);
    expect("cuerpo" in edicion && edicion.cuerpo.aporteInicial).toBeUndefined();
  });
});

describe("cambioDesde", () => {
  it("sin cambios", () => {
    expect(cambioDesde(FONDO, valoresEdicion(FONDO))).toBeNull();
    expect(cambioDesde(FONDO, { ...valoresEdicion(FONDO), nombre: " Fondo de emergencia " })).toBeNull();
  });

  it("quitar la fecha", () => {
    expect(cambioDesde(FONDO, { ...valoresEdicion(FONDO), precision: "ninguna" })).toEqual({ fechaMeta: null });
  });

  it("cambiar cuenta y objetivo", () => {
    expect(cambioDesde(FONDO, { ...valoresEdicion(FONDO), cuentaId: "banco", objetivo: "8.000.000" })).toEqual({
      cuentaId: "banco",
      objetivo: "8000000",
    });
  });

  it("pasar de día a mes", () => {
    expect(cambioDesde(FONDO, { ...valoresEdicion(FONDO), precision: "mes", fecha: "2027-01" })).toEqual({ fechaMeta: "2027-01" });
  });
});

function valoresAporte(parcial: Partial<ValoresAporte> = {}): ValoresAporte {
  return { modo: "apartado", tipo: "aporte", monto: "350.000", fecha: "2026-11-11", origenId: null, motivo: "", ...parcial };
}

describe("validarAporte", () => {
  it("cada mensaje", () => {
    expect(validarAporte(valoresAporte({ monto: "", fecha: "", motivo: "x".repeat(81) }))).toEqual({
      errores: {
        monto: "Escribe un valor en pesos, sin decimales.",
        fecha: "Elige la fecha.",
        motivo: "El motivo tiene de 1 a 80 caracteres.",
      },
    });
  });

  it("origen obligatorio en toda la cuenta", () => {
    expect(validarAporte(valoresAporte({ modo: "cuenta" }))).toEqual({ errores: { cuentaOrigenId: "Elige la cuenta de origen." } });
    expect(validarAporte(valoresAporte({ modo: "cuenta", origenId: "banco" }))).toEqual({
      cuerpo: { tipo: "aporte", monto: "350000", fecha: "2026-11-11", motivo: null, cuentaOrigenId: "banco" },
    });
  });

  it("aporte ya en la cuenta: sin origen", () => {
    expect(validarAporte(valoresAporte())).toEqual({ cuerpo: { tipo: "aporte", monto: "350000", fecha: "2026-11-11", motivo: null } });
  });

  it("retiro con motivo: sin origen aunque haya uno elegido", () => {
    expect(validarAporte(valoresAporte({ tipo: "retiro", monto: "100.000", origenId: "banco", motivo: " arreglo de la nevera " }))).toEqual({
      cuerpo: { tipo: "retiro", monto: "100000", fecha: "2026-11-11", motivo: "arreglo de la nevera" },
    });
  });
});
