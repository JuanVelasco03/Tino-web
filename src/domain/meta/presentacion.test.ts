import { describe, expect, it } from "vitest";
import {
  accionesMeta,
  anchoBarra,
  avisoExcedido,
  etiquetaAporte,
  etiquetaValor,
  mesesPromedio,
  montoFila,
  notaApartado,
  notaInversion,
  textoCuenta,
  textoFalta,
  textoFechaCondicion,
  textoFechaLista,
  textoPorcentaje,
  textoRitmo,
  textoTotales,
} from "./presentacion";
import type { Apartados, FilaAporte, FilaValor, Meta, MetaDetalle, Ritmo } from "./tipos";

const HOY = "2026-11-11";
const TRM = { valor: 412_000n, vigenteDesde: HOY, vigenteHasta: HOY, fuente: "Superintendencia Financiera de Colombia" };
const NUBANK = { id: "nubank", nombre: "Nubank", tipo: "banco", moneda: "COP" } as const;
const ETORO = { id: "etoro", nombre: "eToro", tipo: "inversion", moneda: "USD" } as const;

const VIAJE: Meta = {
  id: "viaje",
  nombre: "Viaje a Cartagena",
  modo: "apartado",
  cuenta: NUBANK,
  objetivo: 1_800_000n,
  avance: 600_000n,
  falta: 1_200_000n,
  porcentaje: 3333,
  fechaMeta: "2026-12-15",
  cumplidaEl: null,
  uso: null,
  ritmo: { tipo: "dias", falta: 1_200_000n, dias: 34, vencida: false },
  creadaEl: "2026-09-20",
  archivadaEn: null,
};

const FONDO: Meta = {
  ...VIAJE,
  id: "fondo",
  nombre: "Fondo de emergencia",
  objetivo: 7_500_000n,
  avance: 1_900_000n,
  falta: 5_600_000n,
  porcentaje: 2533,
  fechaMeta: null,
  ritmo: { tipo: "promedio", promedioMensual: 316_667n, mesEstimado: "2028-05" },
  creadaEl: "2026-06-15",
};

const CUOTA: Meta = {
  ...VIAJE,
  id: "cuota",
  nombre: "Cuota inicial apartamento",
  modo: "cuenta",
  cuenta: ETORO,
  objetivo: 45_000_000n,
  avance: 31_930_000n,
  falta: 13_070_000n,
  porcentaje: 7095,
  fechaMeta: "2027-12",
  ritmo: { tipo: "meses", falta: 13_070_000n, meses: 13, cuotaMensual: 1_005_385n, vencida: false },
  creadaEl: "2026-07-31",
};

const MOTO: Meta = {
  ...VIAJE,
  id: "moto",
  nombre: "Arreglo de la moto",
  cuenta: { id: "banco", nombre: "Bancolombia", tipo: "banco", moneda: "COP" },
  objetivo: 850_000n,
  avance: 850_000n,
  falta: 0n,
  porcentaje: 10_000,
  fechaMeta: null,
  cumplidaEl: "2026-09-12",
  uso: { fecha: "2026-09-14", motivo: "taller" },
  ritmo: null,
  creadaEl: "2026-07-01",
};

function apartados(parcial: Partial<Apartados> = {}): Apartados {
  return {
    saldoCuenta: 2_500_000n,
    apartadoAqui: 1_900_000n,
    otras: [{ metaId: "viaje", nombre: "Viaje a Cartagena", apartado: 600_000n }],
    libre: 0n,
    excedido: false,
    ...parcial,
  };
}

function detalleApartado(meta: Meta, a: Apartados | null = apartados()): MetaDetalle {
  return { ...meta, modo: "apartado", historial: [], apartados: a, inversion: null };
}

function detalleCuenta(meta: Meta, inversion: MetaDetalle["inversion"] = null): MetaDetalle {
  return { ...meta, modo: "cuenta", historial: [], apartados: null, inversion };
}

function conRitmo(meta: Meta, ritmo: Ritmo): Meta {
  return { ...meta, ritmo };
}

describe("textoPorcentaje", () => {
  it.each([
    [2533, "25,3 %"],
    [3333, "33,3 %"],
    [7095, "70,9 %"],
    [10_000, "100 %"],
    [12_000, "120 %"],
    [0, "0 %"],
    [null, "—"],
  ])("%s → %s", (porcentaje, esperado) => {
    expect(textoPorcentaje(porcentaje)).toBe(esperado);
  });
});

describe("anchoBarra", () => {
  it("topa en 100, negativo o null en 0", () => {
    expect(anchoBarra(2533)).toBeCloseTo(25.33);
    expect(anchoBarra(12_000)).toBe(100);
    expect(anchoBarra(-50)).toBe(0);
    expect(anchoBarra(null)).toBe(0);
  });
});

describe("fechas", () => {
  it("día del año de hoy, sin año", () => {
    expect(textoFechaLista(VIAJE, HOY)).toBe("Para el 15 dic");
    expect(textoFechaCondicion(VIAJE)).toBe("15 dic 2026");
  });

  it("día de otro año, con año", () => {
    const otro = { ...VIAJE, fechaMeta: "2027-03-01" };
    expect(textoFechaLista(otro, HOY)).toBe("Para el 1 mar 2027");
    expect(textoFechaCondicion(otro)).toBe("1 mar 2027");
  });

  it("mes", () => {
    expect(textoFechaLista(CUOTA, HOY)).toBe("Para dic 2027");
    expect(textoFechaCondicion(CUOTA)).toBe("Dic 2027");
  });

  it("sin fecha", () => {
    expect(textoFechaLista(FONDO, HOY)).toBe("Sin fecha");
    expect(textoFechaCondicion(FONDO)).toBe("Sin fecha");
  });

  it("cumplida", () => {
    expect(textoFechaLista(MOTO, HOY)).toBe("Cumplida el 12 sep");
    expect(textoFechaCondicion(MOTO)).toBe("Cumplida · 12 sep");
  });

  it("archivada (sin fechaHoy): con año", () => {
    expect(textoFechaLista(MOTO, null)).toBe("Cumplida el 12 sep 2026");
  });
});

describe("textoCuenta y textoFalta", () => {
  it("los dos modos", () => {
    expect(textoCuenta(FONDO)).toBe("Nubank · apartado para esta meta");
    expect(textoCuenta(CUOTA)).toBe("eToro · toda la cuenta");
  });

  it("falta, cumplida y sin avance", () => {
    expect(textoFalta(VIAJE)).toBe("Faltan 1.200.000");
    expect(textoFalta(MOTO)).toBe("Cumplida el 12 sep");
    expect(textoFalta({ ...CUOTA, avance: null, falta: null, porcentaje: null, ritmo: null })).toBe("—");
  });
});

describe("mesesPromedio", () => {
  it("de la creación a hoy, inclusive, topado en 6", () => {
    expect(mesesPromedio("2026-11-02", HOY)).toBe(1);
    expect(mesesPromedio("2026-06-15", HOY)).toBe(6);
    expect(mesesPromedio("2025-01-10", HOY)).toBe(6);
    expect(mesesPromedio("2026-09-20", HOY)).toBe(3);
  });
});

describe("textoRitmo", () => {
  it("días que quedan", () => {
    expect(textoRitmo(VIAJE, HOY, "largo")).toBe("Para llegar el 15 dic faltan 1.200.000 en 34 días.");
    expect(textoRitmo(VIAJE, HOY, "corto")).toBe("Faltan 1.200.000 en 34 días.");
    const uno = conRitmo(VIAJE, { tipo: "dias", falta: 1_200_000n, dias: 1, vencida: false });
    expect(textoRitmo(uno, HOY, "largo")).toBe("Para llegar el 15 dic faltan 1.200.000 en 1 día.");
    expect(textoRitmo(uno, HOY, "corto")).toBe("Faltan 1.200.000 en 1 día.");
  });

  it("días: hoy y vencida", () => {
    const hoy = conRitmo(VIAJE, { tipo: "dias", falta: 1_200_000n, dias: 0, vencida: false });
    expect(textoRitmo(hoy, HOY, "largo")).toBe("Para llegar hoy faltan 1.200.000.");
    expect(textoRitmo(hoy, HOY, "corto")).toBe("Faltan 1.200.000 para hoy.");
    const vencida = conRitmo(VIAJE, { tipo: "dias", falta: 1_200_000n, dias: 0, vencida: true });
    expect(textoRitmo(vencida, HOY, "largo")).toBe("La fecha meta fue el 15 dic. Faltan 1.200.000.");
    expect(textoRitmo(vencida, HOY, "corto")).toBe("Venció el 15 dic · faltan 1.200.000.");
  });

  it("meses que quedan", () => {
    expect(textoRitmo(CUOTA, HOY, "largo")).toBe("Para dic 2027 faltan 13.070.000: unos 1.005.385 al mes durante 13 meses.");
    expect(textoRitmo(CUOTA, HOY, "corto")).toBe("Faltan 13.070.000 · unos 1.005.385 al mes.");
    const uno = conRitmo(CUOTA, { tipo: "meses", falta: 13_070_000n, meses: 1, cuotaMensual: 13_070_000n, vencida: false });
    expect(textoRitmo(uno, HOY, "largo")).toBe("Para dic 2027 faltan 13.070.000: unos 13.070.000 al mes durante 1 mes.");
  });

  it("meses: este mes y vencida", () => {
    const este = { ...conRitmo(CUOTA, { tipo: "meses", falta: 13_070_000n, meses: 0, cuotaMensual: 13_070_000n, vencida: false }), fechaMeta: "2026-11" };
    expect(textoRitmo(este, HOY, "largo")).toBe("Para nov 2026 faltan 13.070.000, todo este mes.");
    expect(textoRitmo(este, HOY, "corto")).toBe("Faltan 13.070.000 este mes.");
    const vencida = conRitmo(CUOTA, { tipo: "meses", falta: 13_070_000n, meses: 0, cuotaMensual: 13_070_000n, vencida: true });
    expect(textoRitmo(vencida, HOY, "largo")).toBe("La fecha meta era dic 2027. Faltan 13.070.000.");
    expect(textoRitmo(vencida, HOY, "corto")).toBe("Venció en dic 2027 · faltan 13.070.000.");
  });

  it("promedio con valores, apartado y cuenta", () => {
    expect(textoRitmo(FONDO, HOY, "largo")).toBe(
      "En los últimos 6 meses aportaste en promedio 316.667 al mes. A ese ritmo llegarías alrededor de mayo de 2028.",
    );
    expect(textoRitmo(FONDO, HOY, "corto")).toBe("A tu ritmo actual, alrededor de mayo de 2028.");
    const cuenta = { ...FONDO, modo: "cuenta" as const };
    expect(textoRitmo(cuenta, HOY, "largo")).toBe(
      "En los últimos 6 meses el avance creció en promedio 316.667 al mes. A ese ritmo llegarías alrededor de mayo de 2028.",
    );
    expect(textoRitmo(cuenta, HOY, "corto")).toBe("A tu ritmo actual, alrededor de mayo de 2028.");
  });

  it("promedio en el primer mes", () => {
    const nueva = { ...FONDO, creadaEl: "2026-11-01" };
    expect(textoRitmo(nueva, HOY, "largo")).toBe("En este mes aportaste 316.667. A ese ritmo llegarías alrededor de mayo de 2028.");
    expect(textoRitmo({ ...nueva, modo: "cuenta" }, HOY, "largo")).toBe(
      "En este mes el avance creció 316.667. A ese ritmo llegarías alrededor de mayo de 2028.",
    );
  });

  it("promedio sin ritmo", () => {
    const quieta = conRitmo(FONDO, { tipo: "promedio", promedioMensual: null, mesEstimado: null });
    expect(textoRitmo(quieta, HOY, "largo")).toBe(
      "En los últimos 6 meses el avance no creció: todavía no hay ritmo para estimar cuándo llegarías.",
    );
    expect(textoRitmo(quieta, HOY, "corto")).toBe("Sin ritmo para estimar.");
  });

  it("cumplida, con uso y motivo", () => {
    expect(textoRitmo(MOTO, HOY, "largo")).toBe("Llegaste al objetivo el 12 sep. El dinero se usó el 14 sep · taller.");
    expect(textoRitmo({ ...MOTO, uso: { fecha: "2026-09-14", motivo: null } }, HOY, "largo")).toBe(
      "Llegaste al objetivo el 12 sep. El dinero se usó el 14 sep.",
    );
    expect(textoRitmo({ ...MOTO, uso: null }, HOY, "largo")).toBe("Llegaste al objetivo el 12 sep.");
    expect(textoRitmo(MOTO, HOY, "corto")).toBeNull();
  });

  it("sin TRM", () => {
    const sinTrm = { ...CUOTA, avance: null, falta: null, porcentaje: null, ritmo: null };
    expect(textoRitmo(sinTrm, HOY, "largo")).toBe("Sin TRM de hoy: el avance de eToro no se puede calcular.");
    expect(textoRitmo(sinTrm, HOY, "corto")).toBe("Sin TRM de hoy.");
  });
});

describe("notaApartado", () => {
  it("una otra", () => {
    expect(notaApartado(detalleApartado(FONDO))).toBe("Nubank tiene 2.500.000: 1.900.000 apartados aquí y 600.000 para Viaje a Cartagena.");
  });

  it("varias otras", () => {
    const otras = [
      { metaId: "viaje", nombre: "Viaje a Cartagena", apartado: 600_000n },
      { metaId: "cel", nombre: "Celular", apartado: 300_000n },
    ];
    expect(notaApartado(detalleApartado(FONDO, apartados({ saldoCuenta: 2_800_000n, otras })))).toBe(
      "Nubank tiene 2.800.000: 1.900.000 apartados aquí, 600.000 para Viaje a Cartagena y 300.000 para Celular.",
    );
  });

  it("con libres", () => {
    expect(notaApartado(detalleApartado(FONDO, apartados({ saldoCuenta: 2_800_000n, libre: 300_000n })))).toBe(
      "Nubank tiene 2.800.000: 1.900.000 apartados aquí, 600.000 para Viaje a Cartagena y 300.000 libres.",
    );
  });

  it("sin otras", () => {
    expect(notaApartado(detalleApartado(FONDO, apartados({ saldoCuenta: 1_900_000n, otras: [] })))).toBe(
      "Nubank tiene 1.900.000, todo apartado aquí.",
    );
    expect(notaApartado(detalleApartado(FONDO, apartados({ otras: [], libre: 600_000n })))).toBe(
      "Nubank tiene 2.500.000: 1.900.000 apartados aquí y 600.000 libres.",
    );
  });

  it("excedido: sin libres", () => {
    expect(notaApartado(detalleApartado(FONDO, apartados({ saldoCuenta: 2_300_000n, libre: -200_000n, excedido: true })))).toBe(
      "Nubank tiene 2.300.000: 1.900.000 apartados aquí y 600.000 para Viaje a Cartagena.",
    );
  });

  it("fuera de apartado", () => {
    expect(notaApartado(detalleCuenta(CUOTA))).toBeNull();
  });
});

describe("avisoExcedido", () => {
  it("con el negativo de libre", () => {
    expect(avisoExcedido(detalleApartado(FONDO, apartados({ libre: -200_000n, excedido: true })))).toBe(
      "Lo apartado en Nubank supera su saldo en 200.000. Registra un retiro en alguna de sus metas.",
    );
    expect(avisoExcedido(detalleApartado(FONDO))).toBeNull();
  });
});

describe("notaInversion", () => {
  it("USD con TRM", () => {
    expect(notaInversion(detalleCuenta(CUOTA, { valorMercado: 775_000n, moneda: "USD", trm: TRM }))).toBe(
      "El avance sigue el valor de mercado de eToro: US$ 7.750,00 a TRM 4.120,00. Sube y baja con el mercado y con el dólar.",
    );
  });

  it("COP", () => {
    const xtb = { ...CUOTA, cuenta: { ...ETORO, nombre: "XTB", moneda: "COP" as const } };
    expect(notaInversion(detalleCuenta(xtb, { valorMercado: 31_930_000n, moneda: "COP", trm: null }))).toBe(
      "El avance sigue el valor de mercado de XTB: 31.930.000. Sube y baja con el mercado.",
    );
  });

  it("USD sin TRM", () => {
    expect(notaInversion(detalleCuenta(CUOTA, { valorMercado: 775_000n, moneda: "USD", trm: null }))).toBe(
      "El avance sigue el valor de mercado de eToro: US$ 7.750,00. Sin TRM de hoy no se puede pasar a pesos.",
    );
  });

  it("fuera de inversión", () => {
    expect(notaInversion(detalleApartado(FONDO))).toBeNull();
  });
});

describe("historial", () => {
  const fila = (parcial: Partial<FilaAporte>): FilaAporte => ({
    id: "a",
    tipo: "aporte",
    fecha: "2026-11-10",
    monto: 150_000n,
    acumulado: 1_900_000n,
    inicial: false,
    motivo: null,
    cuentaOrigen: null,
    movimientoId: null,
    ...parcial,
  });
  const BANCOLOMBIA = { id: "banco", nombre: "Bancolombia" };

  it.each([
    [fila({ inicial: true }), "Apartado inicial"],
    [fila({ inicial: true, cuentaOrigen: BANCOLOMBIA }), "Apartado inicial desde Bancolombia"],
    [fila({}), "Aporte"],
    [fila({ cuentaOrigen: BANCOLOMBIA }), "Aporte desde Bancolombia"],
    [fila({ tipo: "retiro" }), "Retiro"],
    [fila({ tipo: "retiro", motivo: "arreglo de la nevera" }), "Retiro · arreglo de la nevera"],
    [fila({ cuentaOrigen: BANCOLOMBIA, motivo: "prima" }), "Aporte desde Bancolombia · prima"],
  ])("aporte %#", (f, esperado) => {
    expect(etiquetaAporte(f)).toBe(esperado);
  });

  const valor = (parcial: Partial<FilaValor>): FilaValor => ({
    tipo: "cierre",
    fecha: "2026-08-31",
    valor: 30_000_000n,
    variacion: 500_000n,
    trm: null,
    ...parcial,
  });

  it("valores", () => {
    expect(etiquetaValor(valor({ fecha: "2026-07-31", variacion: null }), "2026-07-31")).toBe("Valor al crear la meta");
    expect(etiquetaValor(valor({}), "2026-07-31")).toBe("Valor al cierre");
    expect(etiquetaValor(valor({ tipo: "hoy", fecha: HOY }), "2026-07-31")).toBe("Valor hoy");
    expect(etiquetaValor(valor({ tipo: "hoy", fecha: HOY, trm: TRM }), "2026-07-31")).toBe("Valor hoy · TRM 4.120,00");
  });

  it("montoFila", () => {
    expect(montoFila(150_000n, "aporte")).toBe("+150.000");
    expect(montoFila(100_000n, "retiro")).toBe("−100.000");
    expect(montoFila(500_000n, "variacion")).toBe("+500.000");
    expect(montoFila(-200_000n, "variacion")).toBe("−200.000");
    expect(montoFila(0n, "variacion")).toBe("0");
    expect(montoFila(null, "variacion")).toBe("—");
  });
});

describe("textoTotales", () => {
  const totales = { avance: 34_430_000n, objetivo: 54_300_000n, incompleto: false };

  it("completo", () => {
    expect(textoTotales(totales, [VIAJE, CUOTA, FONDO], "largo")).toBe("En metas activas: 34.430.000 de 54.300.000");
    expect(textoTotales(totales, [VIAJE, CUOTA, FONDO], "corto")).toBe("En metas activas 34.430.000 de 54.300.000");
  });

  it("incompleto", () => {
    const sinTrm = { ...CUOTA, avance: null };
    expect(textoTotales({ avance: 2_500_000n, objetivo: 54_300_000n, incompleto: true }, [VIAJE, sinTrm, FONDO], "largo")).toBe(
      "En metas activas: 2.500.000 de 54.300.000 · sin 1 meta sin TRM",
    );
    expect(textoTotales({ avance: 0n, objetivo: 1n, incompleto: true }, [sinTrm, { ...sinTrm, id: "otra" }], "corto")).toBe(
      "En metas activas 0 de 1 · sin 2 metas sin TRM",
    );
  });

  it("sin activas", () => {
    expect(textoTotales({ avance: 0n, objetivo: 0n, incompleto: false }, [], "largo")).toBe("Sin metas activas.");
  });
});

describe("accionesMeta", () => {
  it("activa por apartado", () => {
    expect(accionesMeta(detalleApartado(FONDO))).toEqual(["registrar_aporte", "editar", "eliminar"]);
  });

  it("activa de toda la cuenta en banco", () => {
    expect(accionesMeta(detalleCuenta({ ...CUOTA, cuenta: NUBANK }))).toEqual(["registrar_aporte", "editar", "eliminar"]);
  });

  it("activa de toda la cuenta en inversión, también sin TRM", () => {
    expect(accionesMeta(detalleCuenta(CUOTA))).toEqual(["ver_inversiones", "editar", "eliminar"]);
    expect(accionesMeta(detalleCuenta({ ...CUOTA, avance: null }))).toEqual(["ver_inversiones", "editar", "eliminar"]);
  });

  it("cumplida por apartado con y sin lo apartado", () => {
    expect(accionesMeta(detalleApartado(MOTO, apartados({ apartadoAqui: 850_000n })))).toEqual(["registrar_retiro", "eliminar"]);
    expect(accionesMeta(detalleApartado(MOTO, apartados({ apartadoAqui: 0n })))).toEqual(["archivar", "eliminar"]);
  });

  it("cumplida de toda la cuenta", () => {
    expect(accionesMeta(detalleCuenta({ ...MOTO, modo: "cuenta" }))).toEqual(["archivar", "eliminar"]);
  });

  it("archivada", () => {
    expect(accionesMeta(detalleApartado({ ...MOTO, archivadaEn: "2026-10-01T12:00:00.000Z" }, apartados({ apartadoAqui: 0n })))).toEqual([
      "restaurar",
      "eliminar",
    ]);
  });
});
