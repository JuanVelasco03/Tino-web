import { describe, expect, it } from "vitest";
import { cuerpoAjuste, hayCambiosAjuste, ladoAjuste, valoresAjusteDesde, type Ajuste } from "./ajuste";
import { importeEnPatrimonio } from "./vista-previa";

const EFECTIVO = { id: "e1", nombre: "Efectivo" };
const AJUSTE_CAT = { id: "aj", nombre: "Ajuste" };

const BAJA: Ajuste = {
  monto: 3_500n,
  fecha: "2026-11-11",
  descripcion: "Ajuste de saldo",
  nota: null,
  cuentaOrigen: EFECTIVO,
  cuentaDestino: null,
  categoria: AJUSTE_CAT,
};

const SUBE: Ajuste = { ...BAJA, cuentaOrigen: null, cuentaDestino: EFECTIVO };

describe("ladoAjuste e importe", () => {
  it("con cuentaDestino sube; con cuentaOrigen baja", () => {
    expect(ladoAjuste(SUBE)).toBe("destino");
    expect(ladoAjuste(BAJA)).toBe("origen");
  });

  it("el importe del libro lleva + si sube y − si baja", () => {
    expect(importeEnPatrimonio("ajuste", 3_500n, true)).toBe(3_500n);
    expect(importeEnPatrimonio("ajuste", 3_500n, false)).toBe(-3_500n);
  });
});

describe("valoresAjusteDesde", () => {
  it("precarga monto formateado, la cuenta de su lado y los textos", () => {
    expect(valoresAjusteDesde(BAJA)).toEqual({ monto: "3.500", fecha: "2026-11-11", cuentaId: "e1", descripcion: "Ajuste de saldo", nota: "" });
    expect(valoresAjusteDesde(SUBE).cuentaId).toBe("e1");
  });
});

describe("cuerpoAjuste", () => {
  it("conserva el lado, el tipo y la categoría que trae", () => {
    const v = { ...valoresAjusteDesde(BAJA), monto: "4.000", cuentaId: "b2" };
    expect(cuerpoAjuste(BAJA, v)).toEqual({
      tipo: "ajuste",
      monto: "4000",
      fecha: "2026-11-11",
      descripcion: "Ajuste de saldo",
      nota: null,
      cuentaOrigenId: "b2",
      cuentaDestinoId: null,
      categoriaId: "aj",
    });
    expect(cuerpoAjuste(SUBE, valoresAjusteDesde(SUBE))).toMatchObject({ cuentaOrigenId: null, cuentaDestinoId: "e1" });
  });

  it("descripción vacía → null; monto vacío, cero o con decimales → null", () => {
    const v = valoresAjusteDesde(BAJA);
    expect(cuerpoAjuste(BAJA, { ...v, descripcion: "  " })?.descripcion).toBeNull();
    expect(cuerpoAjuste(BAJA, { ...v, monto: "" })).toBeNull();
    expect(cuerpoAjuste(BAJA, { ...v, monto: "0" })).toBeNull();
    expect(cuerpoAjuste(BAJA, { ...v, monto: "3.500,5" })).toBeNull();
  });
});

describe("hayCambiosAjuste", () => {
  it("ignora el formato del monto y los espacios", () => {
    const v = valoresAjusteDesde(BAJA);
    expect(hayCambiosAjuste(v, { ...v, monto: "3500", descripcion: " Ajuste de saldo " })).toBe(false);
    expect(hayCambiosAjuste(v, { ...v, monto: "3.600" })).toBe(true);
  });
});
