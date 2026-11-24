import { describe, expect, it } from "vitest";
import type { ValoresCaptura } from "./cuerpo";
import { esIniciales, valoresDesdeIniciales, type InicialesCaptura } from "./iniciales";

const BORRADOR: ValoresCaptura = {
  tipo: "gasto",
  monto: "18.000",
  montoDestino: "",
  descripcion: "Almuerzo",
  categoria: { modo: "elegida", id: "c1" },
  cuentaId: "nequi",
  destinoId: null,
  fecha: "2026-11-10",
  nota: "con Ana",
  partes: [{ categoriaId: "c1", monto: "9.000" }, { categoriaId: null, monto: "" }],
};

const PAGO: InicialesCaptura = { tipo: "transferencia", cuentaOrigenId: "banco", cuentaDestinoId: "visa", monto: 597_980n };
const CUENTAS = [{ id: "nequi" }, { id: "banco" }, { id: "visa" }];

describe("valoresDesdeIniciales", () => {
  it("transferencia de la cuenta de pago a la tarjeta por el pago sugerido; fecha la pone la carga", () => {
    expect(valoresDesdeIniciales(BORRADOR, PAGO, CUENTAS)).toEqual({
      tipo: "transferencia",
      monto: "597.980",
      montoDestino: "",
      descripcion: "",
      categoria: { modo: "propuesta" },
      cuentaId: "banco",
      destinoId: "visa",
      fecha: "",
      nota: "",
      partes: null,
    });
  });

  it("sin monto o en cero: el monto queda vacío", () => {
    expect(valoresDesdeIniciales(BORRADOR, { ...PAGO, monto: null }, CUENTAS).monto).toBe("");
    expect(valoresDesdeIniciales(BORRADOR, { ...PAGO, monto: 0n }, CUENTAS).monto).toBe("");
  });

  it("una cuenta que no está en la captura se ignora", () => {
    const v = valoresDesdeIniciales(BORRADOR, { ...PAGO, cuentaOrigenId: "archivada", cuentaDestinoId: "otra" }, CUENTAS);
    expect(v.cuentaId).toBe("nequi");
    expect(v.destinoId).toBeNull();
  });

  it("sin cuenta de pago: conserva la elegida", () => {
    expect(valoresDesdeIniciales(BORRADOR, { ...PAGO, cuentaOrigenId: null }, CUENTAS).cuentaId).toBe("nequi");
  });

  it("antes de cargar las cuentas, las pone tal cual (la carga las valida)", () => {
    const v = valoresDesdeIniciales(BORRADOR, PAGO, null);
    expect(v.cuentaId).toBe("banco");
    expect(v.destinoId).toBe("visa");
  });
});

describe("esIniciales", () => {
  it("reconoce las iniciales y descarta un evento de clic", () => {
    expect(esIniciales(PAGO)).toBe(true);
    expect(esIniciales({ ...PAGO, monto: null, cuentaOrigenId: null })).toBe(true);
    expect(esIniciales({ type: "click", target: {} })).toBe(false);
    expect(esIniciales(undefined)).toBe(false);
  });
});
