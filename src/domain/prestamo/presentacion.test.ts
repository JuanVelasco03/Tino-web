import { describe, expect, it } from "vitest";
import {
  ayudaVencido,
  descripcionHistorial,
  diasDesde,
  formatearTasa,
  leyendaNeta,
  primerNombre,
  subtituloDebes,
  subtituloTeDeben,
  textoCierre,
  textoVencido,
  tieneTasa,
} from "./presentacion";
import type { MovimientoPrestamo } from "./tipos";

const HOY = "2026-11-11";

describe("diasDesde", () => {
  it("cuenta días de calendario", () => {
    expect(diasDesde("2026-08-14", HOY)).toBe(89);
    expect(diasDesde(HOY, HOY)).toBe(0);
    expect(diasDesde("2026-11-10", HOY)).toBe(1);
  });

  it("cruza años y bisiestos", () => {
    expect(diasDesde("2027-12-31", "2028-03-01")).toBe(61);
  });
});

describe("textoVencido", () => {
  it.each([
    ["2026-11-10", "Pasó la fecha acordada ayer"],
    ["2026-10-15", "Pasó la fecha acordada hace 27 días"],
    ["2026-10-13", "Pasó la fecha acordada hace 29 días"],
    ["2026-10-11", "Pasó la fecha acordada hace 1 mes"],
    ["2026-09-12", "Pasó la fecha acordada hace 1 mes"],
    ["2026-09-11", "Pasó la fecha acordada hace 2 meses"],
    ["2026-06-30", "Pasó la fecha acordada hace 4 meses"],
  ])("%s → %s", (fechaAcordada, esperado) => {
    expect(textoVencido(fechaAcordada, HOY)).toBe(esperado);
  });

  it("fin de mes: el 31 cuenta como el último día de un mes más corto", () => {
    expect(textoVencido("2027-01-31", "2027-03-02")).toBe("Pasó la fecha acordada hace 1 mes");
    expect(textoVencido("2027-01-31", "2027-03-31")).toBe("Pasó la fecha acordada hace 2 meses");
  });

  it("30 días o más nunca dicen «0 meses»", () => {
    expect(textoVencido("2027-01-01", "2027-01-31")).toBe("Pasó la fecha acordada hace 1 mes");
  });
});

describe("ayudaVencido", () => {
  it("sin abono posterior a la fecha acordada, invita a moverla", () => {
    expect(ayudaVencido({ fechaAcordada: "2026-10-15", ultimoAbono: "2026-10-02" })).toBe(
      "Acordaron el 15 oct. Si cambió el plan, puedes mover la fecha.",
    );
    expect(ayudaVencido({ fechaAcordada: "2026-10-15", ultimoAbono: null })).toBe(
      "Acordaron el 15 oct. Si cambió el plan, puedes mover la fecha.",
    );
  });

  it("con abono posterior, cita el último", () => {
    expect(ayudaVencido({ fechaAcordada: "2026-06-30", ultimoAbono: "2026-11-06" })).toBe(
      "Acordaron el 30 jun. Vas abonando: el último fue el 6 nov.",
    );
  });
});

describe("formatearTasa", () => {
  it.each([
    ["0", "Sin intereses"],
    ["1", "1 % mensual sobre saldo"],
    ["1.5", "1,5 % mensual sobre saldo"],
    ["0.25", "0,25 % mensual sobre saldo"],
    ["2.50", "2,5 % mensual sobre saldo"],
  ])("%s → %s", (tasa, esperado) => {
    expect(formatearTasa(tasa)).toBe(esperado);
  });

  it("tieneTasa compara texto", () => {
    expect(tieneTasa("0")).toBe(false);
    expect(tieneTasa("0.00")).toBe(false);
    expect(tieneTasa("0.25")).toBe(true);
  });
});

describe("textoCierre", () => {
  it("pago según el sentido", () => {
    expect(textoCierre("prestamo_otorgado", { fecha: "2026-09-20", forma: "pago" })).toBe("Pagó todo el 20 sep");
    expect(textoCierre("deuda_contraida", { fecha: "2026-09-20", forma: "pago" })).toBe("Pagaste todo el 20 sep");
  });

  it("condonación", () => {
    expect(textoCierre("prestamo_otorgado", { fecha: "2026-11-11", forma: "condonacion" })).toBe("Condonado el 11 nov");
  });
});

describe("descripcionHistorial", () => {
  const nequi = { id: "n", nombre: "Nequi" };
  const fila = (f: Partial<MovimientoPrestamo>): MovimientoPrestamo => ({
    fecha: "2026-10-02",
    clase: "abono",
    cuenta: nequi,
    categoria: null,
    capital: -100000n,
    interes: 12000n,
    saldoCapital: 500000n,
    movimientoId: "m",
    movimientoInteresId: "i",
    ...f,
  });

  it.each([
    ["prestamo_otorgado", fila({ clase: "desembolso", capital: 600000n }), "Le prestaste · desde Nequi"],
    ["deuda_contraida", fila({ clase: "desembolso", capital: 600000n }), "Te prestó · a Nequi"],
    ["prestamo_otorgado", fila({}), "Abonó · a Nequi"],
    ["prestamo_otorgado", fila({ saldoCapital: 0n }), "Pagó todo · a Nequi"],
    ["deuda_contraida", fila({}), "Abonaste · desde Nequi"],
    ["deuda_contraida", fila({ saldoCapital: 0n }), "Pagaste todo · desde Nequi"],
    ["prestamo_otorgado", fila({ clase: "interes", capital: 0n }), "Intereses · a Nequi"],
    ["deuda_contraida", fila({ clase: "interes", capital: 0n }), "Intereses · desde Nequi"],
    [
      "prestamo_otorgado",
      fila({ clase: "condonacion", cuenta: null, categoria: { id: "o", nombre: "Otros" }, saldoCapital: 0n }),
      "Condonaste · gasto en Otros",
    ],
  ] as const)("%s, %o", (tipo, f, esperado) => {
    expect(descripcionHistorial(tipo, f)).toBe(esperado);
  });
});

describe("subtítulos del consolidado", () => {
  it("te deben", () => {
    expect(subtituloTeDeben({ total: 0n, personas: 0, interesesCausados: 0n })).toBe("Nadie te debe");
    expect(subtituloTeDeben({ total: 500000n, personas: 1, interesesCausados: 6667n })).toBe(
      "1 persona · +6.667 de intereses sin cobrar",
    );
    expect(subtituloTeDeben({ total: 800000n, personas: 2, interesesCausados: 0n })).toBe("2 personas");
  });

  it("debes", () => {
    expect(subtituloDebes({ total: 0n, personas: 0, interesesCausados: 0n, conIntereses: false })).toBe("No le debes a nadie");
    expect(subtituloDebes({ total: 500000n, personas: 1, interesesCausados: 0n, conIntereses: false })).toBe(
      "A 1 persona · sin intereses",
    );
    expect(subtituloDebes({ total: 500000n, personas: 1, interesesCausados: 4000n, conIntereses: true })).toBe(
      "A 1 persona · +4.000 de intereses por pagar",
    );
  });
});

describe("leyendaNeta", () => {
  const cero = { total: 0n, personas: 0, interesesCausados: 0n };
  const debesCero = { ...cero, conIntereses: false };

  it("positiva", () => {
    expect(leyendaNeta({ teDeben: { ...cero, total: 5n }, debes: debesCero, posicionNeta: 5n })).toBe("Te deben más de lo que debes.");
  });

  it("negativa", () => {
    expect(leyendaNeta({ teDeben: cero, debes: { ...debesCero, total: 5n }, posicionNeta: -5n })).toBe(
      "Debes más de lo que te deben.",
    );
  });

  it("cero con saldos", () => {
    expect(leyendaNeta({ teDeben: { ...cero, total: 5n }, debes: { ...debesCero, total: 5n }, posicionNeta: 0n })).toBe(
      "Lo que te deben cubre exactamente lo que debes.",
    );
  });

  it("todo en cero → sin leyenda", () => {
    expect(leyendaNeta({ teDeben: cero, debes: debesCero, posicionNeta: 0n })).toBeNull();
  });
});

describe("primerNombre", () => {
  it("la primera palabra", () => {
    expect(primerNombre("Camila Ortiz")).toBe("Camila");
    expect(primerNombre("  Mamá ")).toBe("Mamá");
  });
});
