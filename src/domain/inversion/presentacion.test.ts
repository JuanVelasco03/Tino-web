import { describe, expect, it } from "vitest";
import {
  antiguedad,
  equivalente,
  formatearPorcentaje,
  notaCotizacion,
  notaPrecios,
  subtituloInversion,
  textoTrm,
  vistaPreviaPrecio,
} from "./presentacion";
import type { Posicion, Trm } from "./tipos";

const ZONA = "America/Bogota";
const HOY = "2026-11-11";
const TRM: Trm = {
  valor: 412_000n,
  vigenteDesde: "2026-11-11",
  vigenteHasta: "2026-11-11",
  fuente: "Superintendencia Financiera de Colombia",
};

function posicion(cambios: Partial<Posicion>): Posicion {
  return {
    activoId: "a1",
    simbolo: "VOO",
    nombre: "Vanguard S&P 500 ETF",
    cantidad: "6.25",
    costo: 311_700n,
    costoPromedio: 49_872n,
    precio: 56_240n,
    precioFecha: "2026-11-10",
    precioOrigen: "cierre",
    precioCotizadoEn: "2026-11-11T13:00:00.000Z",
    precioVencido: false,
    precioAnterior: null,
    cotizacion: "automatica",
    clase: "etf",
    valor: 351_500n,
    valorCop: 14_481_800n,
    rendimiento: 39_800n,
    rendimientoCop: 1_639_760n,
    rendimientoPorcentaje: 1277,
    ...cambios,
  };
}

/** BTC con precio del 11 nov a las 09:30 en Bogotá (14:30 UTC). */
const BTC = posicion({
  activoId: "a4",
  simbolo: "BTC",
  nombre: "Bitcoin",
  cantidad: "0.0125",
  precioFecha: "2026-11-11",
  precioOrigen: "intradia",
  precioCotizadoEn: "2026-11-11T14:30:00.000Z",
  clase: "cripto",
});

const RENEW = posicion({
  activoId: "a5",
  simbolo: "RENEW",
  precioFecha: "2026-11-07",
  precioOrigen: "manual",
  cotizacion: "manual",
  clase: null,
});

describe("formatearPorcentaje", () => {
  it.each<[number | null, string]>([
    [1248, "+12,48 %"],
    [-305, "−3,05 %"],
    [0, "0,00 %"],
    [5, "+0,05 %"],
    [123456, "+1.234,56 %"],
    [null, "—"],
  ])("%s → %j", (centesimas, esperado) => {
    expect(formatearPorcentaje(centesimas)).toBe(esperado);
  });
});

describe("antiguedad", () => {
  it.each<[string, string]>([
    ["2026-11-11", "hoy"],
    ["2026-11-10", "ayer"],
    ["2026-11-07", "hace 4 días"],
    ["2026-10-13", "hace 29 días"],
    ["2026-10-11", "hace 1 mes"],
    ["2026-08-10", "hace 3 meses"],
    ["2026-08-12", "hace 2 meses"],
  ])("%s → %j", (fecha, esperado) => {
    expect(antiguedad(fecha, HOY)).toBe(esperado);
  });
});

describe("notaCotizacion", () => {
  it("cierre", () => {
    expect(notaCotizacion(posicion({}), HOY, ZONA)).toBe("Cierre 10 nov");
  });

  it("intradía, con la hora en la zona del perfil", () => {
    expect(notaCotizacion(BTC, HOY, ZONA)).toBe("11 nov · 09:30");
  });

  it("manual, con su antigüedad", () => {
    expect(notaCotizacion(RENEW, HOY, ZONA)).toBe("7 nov · hace 4 días");
  });

  it("manual guardado hoy", () => {
    expect(notaCotizacion({ ...RENEW, precioFecha: HOY }, HOY, ZONA)).toBe("11 nov · hoy");
  });

  it("vencido", () => {
    expect(notaCotizacion(posicion({ precioVencido: true }), HOY, ZONA)).toBe("Cierre 10 nov · sin actualizar");
  });
});

describe("notaPrecios", () => {
  const FRASE_1 =
    "Todos los equivalentes en COP usan la TRM de hoy. El rendimiento en COP no incluye lo que cambió el dólar desde cada compra.";

  it("una fecha de cierre y un intradía (el diseño)", () => {
    const qqq = posicion({ simbolo: "QQQ" });
    expect(notaPrecios({ moneda: "USD", trm: TRM, posiciones: [posicion({}), qqq, BTC, RENEW] }, ZONA)).toEqual([
      FRASE_1,
      "Las acciones y los ETF tienen precio de cierre del 10 nov y el BTC, del 11 nov a las 09:30.",
    ]);
  });

  it("varias fechas de cierre", () => {
    const viejo = posicion({ simbolo: "AAPL", precioFecha: "2026-11-07" });
    expect(notaPrecios({ moneda: "USD", trm: TRM, posiciones: [posicion({}), viejo] }, ZONA)).toEqual([
      FRASE_1,
      "Las acciones y los ETF tienen precio de cierre de su última sesión.",
    ]);
  });

  it("varios intradía con cierre", () => {
    const eth = { ...BTC, simbolo: "ETH" };
    expect(notaPrecios({ moneda: "USD", trm: TRM, posiciones: [posicion({}), BTC, eth] }, ZONA)[1]).toBe(
      "Las acciones y los ETF tienen precio de cierre del 10 nov y las cripto, de su último precio del día.",
    );
  });

  it("solo cripto", () => {
    expect(notaPrecios({ moneda: "USD", trm: TRM, posiciones: [BTC] }, ZONA)).toEqual([
      FRASE_1,
      "El BTC tiene precio del 11 nov a las 09:30.",
    ]);
  });

  it("sin automáticas: solo la frase 1", () => {
    expect(notaPrecios({ moneda: "USD", trm: TRM, posiciones: [RENEW] }, ZONA)).toEqual([FRASE_1]);
  });

  it("COP sin automáticas: sin nota", () => {
    expect(notaPrecios({ moneda: "COP", trm: TRM, posiciones: [RENEW] }, ZONA)).toEqual([]);
  });

  it("sin TRM: sin la frase 1", () => {
    expect(notaPrecios({ moneda: "USD", trm: null, posiciones: [posicion({})] }, ZONA)).toEqual([
      "Las acciones y los ETF tienen precio de cierre del 10 nov.",
    ]);
  });
});

describe("subtituloInversion", () => {
  it("USD, COP, archivada y corto", () => {
    expect(subtituloInversion({ nombre: "eToro", moneda: "USD", archivadaEn: null })).toBe("eToro · cuenta en USD · activo");
    expect(subtituloInversion({ nombre: "Bancolombia Acciones", moneda: "COP", archivadaEn: null })).toBe(
      "Bancolombia Acciones · cuenta en COP · activo",
    );
    expect(subtituloInversion({ nombre: "eToro", moneda: "USD", archivadaEn: "2026-11-01T00:00:00Z" })).toBe(
      "eToro · cuenta en USD · archivada",
    );
    expect(subtituloInversion({ nombre: "eToro", moneda: "USD", archivadaEn: null }, true)).toBe("eToro · cuenta en USD");
  });
});

describe("textoTrm", () => {
  it("normal", () => {
    const t = textoTrm(TRM, false);
    expect(t.texto).toBe("TRM aplicada 4.120,00 · 11 nov 2026 · Superintendencia Financiera de Colombia");
    expect(t.aviso).toBe(false);
    expect(`${t.antes}${t.cifra}${t.despues}`).toBe(t.texto);
  });

  it("de hoy (día uno)", () => {
    expect(textoTrm(TRM, false, "hoy").texto).toBe("TRM de hoy 4.120,00 · 11 nov 2026 · Superintendencia Financiera de Colombia");
  });

  it("desactualizada", () => {
    const t = textoTrm({ ...TRM, vigenteDesde: "2026-11-08" }, true);
    expect(t.texto).toBe("TRM del 8 nov 2026 · sin actualizar · Superintendencia Financiera de Colombia");
    expect(t.aviso).toBe(true);
  });

  it("nula", () => {
    expect(textoTrm(null, false)).toMatchObject({ texto: "Sin TRM: no hay equivalente en pesos.", aviso: true });
  });
});

describe("vistaPreviaPrecio", () => {
  it("USD con TRM: RENEW a 411,06", () => {
    expect(vistaPreviaPrecio("1", 41_106n, TRM, "USD")).toEqual({ valor: 41_106n, valorCop: 1_693_567n });
  });

  it("USD sin TRM", () => {
    expect(vistaPreviaPrecio("1", 41_106n, null, "USD")).toEqual({ valor: 41_106n, valorCop: null });
  });

  it("COP", () => {
    expect(vistaPreviaPrecio("100", 2_500n, TRM, "COP")).toEqual({ valor: 250_000n, valorCop: null });
  });
});

describe("equivalente", () => {
  it("con y sin cifra", () => {
    expect(equivalente(31_930_000n)).toBe("≈ 31.930.000 COP");
    expect(equivalente(3_535_866n, { signo: true })).toBe("≈ +3.535.866 COP");
    expect(equivalente(14_481_800n, { conCOP: false })).toBe("≈ 14.481.800");
    expect(equivalente(null)).toBe("≈ —");
  });
});
