import { describe, expect, it } from "vitest";
import {
  cambiosTarjeta,
  hayCambiosTarjeta,
  MENSAJE_DIA,
  MENSAJE_PESOS,
  MENSAJE_TASA,
  tasaACentesimas,
  validarTarjeta,
  valoresTarjetaDesde,
  type TarjetaEditable,
  type ValoresTarjeta,
} from "./edicion";

// Condiciones de la tarjeta del diseño (`referencias/export-tarjeta/`).
const VISA: TarjetaEditable = {
  diaCorte: 15,
  diaPago: 30,
  tasaMensual: 198,
  cuotaManejo: 26_990n,
  cuentaPago: { id: "b1" },
};

const SIN_CONDICIONES: TarjetaEditable = { diaCorte: null, diaPago: null, tasaMensual: null, cuotaManejo: null, cuentaPago: null };

const VACIOS: ValoresTarjeta = { diaCorte: "", diaPago: "", tasa: "", cuotaManejo: "", cuentaPagoId: null };

describe("tasaACentesimas", () => {
  it("coma o punto decimal, hasta dos decimales", () => {
    expect(tasaACentesimas("1,98")).toBe(198);
    expect(tasaACentesimas("1.98")).toBe(198);
    expect(tasaACentesimas("2")).toBe(200);
    expect(tasaACentesimas("1,5")).toBe(150);
    expect(tasaACentesimas("0,05")).toBe(5);
    expect(tasaACentesimas("100")).toBe(10_000);
    expect(tasaACentesimas(" 0 ")).toBe(0);
  });

  it("vacío → null", () => {
    expect(tasaACentesimas("")).toBeNull();
    expect(tasaACentesimas("  ")).toBeNull();
  });

  it("más de dos decimales, más de 100 o mal escrita → undefined", () => {
    expect(tasaACentesimas("1,985")).toBeUndefined();
    expect(tasaACentesimas("100,01")).toBeUndefined();
    expect(tasaACentesimas("101")).toBeUndefined();
    expect(tasaACentesimas("-1")).toBeUndefined();
    expect(tasaACentesimas("1,")).toBeUndefined();
    expect(tasaACentesimas("abc")).toBeUndefined();
  });
});

describe("valoresTarjetaDesde", () => {
  it("precarga días, tasa con coma, cuota formateada y cuenta de pago", () => {
    expect(valoresTarjetaDesde(VISA)).toEqual({ diaCorte: "15", diaPago: "30", tasa: "1,98", cuotaManejo: "26.990", cuentaPagoId: "b1" });
  });

  it("tasa entera sin decimales y con un decimal", () => {
    expect(valoresTarjetaDesde({ ...VISA, tasaMensual: 200 }).tasa).toBe("2");
    expect(valoresTarjetaDesde({ ...VISA, tasaMensual: 150 }).tasa).toBe("1,5");
    expect(valoresTarjetaDesde({ ...VISA, tasaMensual: 5 }).tasa).toBe("0,05");
  });

  it("sin condiciones o sin tarjeta: todo vacío", () => {
    expect(valoresTarjetaDesde(SIN_CONDICIONES)).toEqual(VACIOS);
    expect(valoresTarjetaDesde(null)).toEqual(VACIOS);
  });
});

describe("validarTarjeta", () => {
  it("alta: días obligatorios", () => {
    expect(validarTarjeta(VACIOS, true)).toEqual({ errores: { diaCorte: MENSAJE_DIA, diaPago: MENSAJE_DIA } });
  });

  it("alta completa: opcionales vacíos como null", () => {
    expect(validarTarjeta({ ...VACIOS, diaCorte: "15", diaPago: "30" }, true)).toEqual({
      condiciones: { diaCorte: 15, diaPago: 30, tasaMensual: null, cuotaManejo: null, cuentaPagoId: null },
    });
  });

  it("todo escrito", () => {
    expect(validarTarjeta(valoresTarjetaDesde(VISA), true)).toEqual({
      condiciones: { diaCorte: 15, diaPago: 30, tasaMensual: 198, cuotaManejo: "26990", cuentaPagoId: "b1" },
    });
  });

  it("días fuera de 1–31 o no enteros", () => {
    const r = validarTarjeta({ ...VACIOS, diaCorte: "0", diaPago: "32" }, true);
    expect(r).toEqual({ errores: { diaCorte: MENSAJE_DIA, diaPago: MENSAJE_DIA } });
    expect(validarTarjeta({ ...VACIOS, diaCorte: "1,5", diaPago: "31" }, true)).toEqual({ errores: { diaCorte: MENSAJE_DIA } });
  });

  it("no requerida: días vacíos se omiten", () => {
    expect(validarTarjeta({ ...VACIOS, tasa: "2" }, false)).toEqual({
      condiciones: { tasaMensual: 200, cuotaManejo: null, cuentaPagoId: null },
    });
  });

  it("tasa y cuota mal escritas", () => {
    expect(validarTarjeta({ ...VACIOS, diaCorte: "15", diaPago: "30", tasa: "1,985", cuotaManejo: "26.990,5" }, true)).toEqual({
      errores: { tasaMensual: MENSAJE_TASA, cuotaManejo: MENSAJE_PESOS },
    });
  });
});

describe("hayCambiosTarjeta y cambiosTarjeta", () => {
  it("sin tocar nada: sin cambios", () => {
    const v = valoresTarjetaDesde(VISA);
    expect(hayCambiosTarjeta(VISA, v)).toBe(false);
    expect(cambiosTarjeta(VISA, v)).toBeNull();
  });

  it("el formato no cuenta como cambio", () => {
    expect(hayCambiosTarjeta(VISA, { ...valoresTarjetaDesde(VISA), tasa: "1.98", cuotaManejo: "26990", diaCorte: "015" })).toBe(false);
  });

  it("editar solo la tasa envía solo tasaMensual", () => {
    const v = { ...valoresTarjetaDesde(VISA), tasa: "2,1" };
    expect(hayCambiosTarjeta(VISA, v)).toBe(true);
    expect(cambiosTarjeta(VISA, v)).toEqual({ tasaMensual: 210 });
  });

  it("vaciar la cuota envía cuotaManejo: null; quitar la cuenta de pago, null", () => {
    expect(cambiosTarjeta(VISA, { ...valoresTarjetaDesde(VISA), cuotaManejo: "" })).toEqual({ cuotaManejo: null });
    expect(cambiosTarjeta(VISA, { ...valoresTarjetaDesde(VISA), cuentaPagoId: null })).toEqual({ cuentaPagoId: null });
    expect(cambiosTarjeta(VISA, { ...valoresTarjetaDesde(VISA), tasa: "" })).toEqual({ tasaMensual: null });
  });

  it("tarjeta sin condiciones: la primera vez van los dos días", () => {
    const v = { ...VACIOS, diaCorte: "15", diaPago: "30" };
    expect(hayCambiosTarjeta(SIN_CONDICIONES, v)).toBe(true);
    expect(cambiosTarjeta(SIN_CONDICIONES, v)).toEqual({ diaCorte: 15, diaPago: 30 });
  });

  it("tarjeta sin condiciones sin tocar nada: nada que enviar", () => {
    expect(hayCambiosTarjeta(SIN_CONDICIONES, VACIOS)).toBe(false);
    expect(cambiosTarjeta(SIN_CONDICIONES, VACIOS)).toBeNull();
  });
});
