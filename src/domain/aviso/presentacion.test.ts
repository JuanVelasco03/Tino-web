import { describe, expect, it } from "vitest";
import {
  accionAviso,
  agrupar,
  alternar,
  contarNoLeidos,
  detalleAviso,
  diasEntre,
  fechaLocal,
  grupoDe,
  horaLocal,
  marcarTodos,
  momento,
  montoAviso,
  textoNoLeidos,
  tituloAviso,
  type Aviso,
  type AvisoCobro,
  type AvisoDeuda,
  type AvisoPrecio,
  type AvisoRecurrente,
} from "./presentacion";

const ZONA = "America/Bogota";
const HOY = "2026-11-11";

/** 08:00 en Bogotá (UTC−5) del día dado. */
function ocho(dia: string): string {
  return `${dia}T13:00:00.000Z`;
}

const NEQUI = { id: "n01", nombre: "Nequi" };
const BANCOLOMBIA = { id: "b01", nombre: "Bancolombia" };

type Parcial = Partial<Omit<AvisoRecurrente, "recurrente">> & { recurrente?: Partial<AvisoRecurrente["recurrente"]> };

function recurrente(parcial: Parcial = {}): AvisoRecurrente {
  const { recurrente: r, ...resto } = parcial;
  return {
    clave: "recurrente:gas:2026-11-14",
    tipo: "recurrente",
    instante: ocho("2026-11-11"),
    leido: false,
    resuelto: false,
    recurrente: { id: "gas", concepto: "Gas Vanti", tipo: "gasto", variable: true, ...r },
    vencimiento: "2026-11-14",
    cuenta: NEQUI,
    monto: 32_400n,
    estimado: true,
    resolucion: null,
    ...resto,
  };
}

// Los avisos del diseño (Avisos.dc.html) sin los de tarjeta, con hoy mié 11 nov.
const GAS = recurrente();
const INTERNET = recurrente({
  clave: "recurrente:internet:2026-11-12",
  instante: ocho("2026-11-09"),
  recurrente: { id: "internet", concepto: "Internet Claro hogar", variable: false },
  vencimiento: "2026-11-12",
  cuenta: BANCOLOMBIA,
  monto: 89_900n,
  estimado: false,
});
const GIMNASIO = recurrente({
  clave: "recurrente:gimnasio:2026-11-08",
  instante: ocho("2026-11-05"),
  leido: true,
  resuelto: true,
  recurrente: { id: "gimnasio", concepto: "Gimnasio", variable: false },
  vencimiento: "2026-11-08",
  cuenta: BANCOLOMBIA,
  monto: 95_000n,
  estimado: false,
  resolucion: { forma: "confirmada", fecha: "2026-11-08" },
});
const MAMA: AvisoDeuda = {
  clave: "deuda:mama:2026-11-06",
  tipo: "deuda",
  instante: ocho("2026-11-03"),
  leido: true,
  resuelto: true,
  prestamo: { id: "mama", nombre: "Mamá" },
  fechaAcordada: "2026-11-06",
  monto: 100_000n,
  capitalPendiente: 500_000n,
  resolucion: { forma: "abono", fecha: "2026-11-06", monto: 100_000n, cuenta: NEQUI },
};
const CAMILA: AvisoCobro = {
  clave: "cobro:camila:2026-10-15",
  tipo: "cobro",
  instante: ocho("2026-10-15"),
  leido: true,
  resuelto: false,
  prestamo: { id: "camila", nombre: "Camila" },
  fechaAcordada: "2026-10-15",
  recordatorio: "2026-10-15",
  monto: 500_000n,
  capitalPendiente: 500_000n,
  proximoRecordatorio: "2026-11-14",
  resolucion: null,
};
const VOO: AvisoPrecio = {
  clave: "precio_manual:voo:2026-11-03",
  tipo: "precio_manual",
  instante: ocho("2026-11-10"),
  leido: false,
  resuelto: false,
  activo: { id: "voo", simbolo: "VOO", nombre: "Vanguard S&P 500" },
  inversion: { id: "xtb", nombre: "XTB" },
  precioFecha: "2026-11-03",
  resolucion: null,
};

const DISENO: Aviso[] = [GAS, INTERNET, GIMNASIO, MAMA, CAMILA];

describe("fechaLocal y horaLocal", () => {
  it("leen el día y la hora en la zona del perfil", () => {
    expect(fechaLocal(ocho("2026-11-11"), ZONA)).toBe("2026-11-11");
    expect(horaLocal(ocho("2026-11-11"), ZONA)).toBe("08:00");
  });

  it("antes de medianoche en Bogotá sigue siendo el día anterior aunque en UTC ya sea el siguiente", () => {
    expect(fechaLocal("2026-11-12T03:30:00.000Z", ZONA)).toBe("2026-11-11");
    expect(horaLocal("2026-11-12T03:30:00.000Z", ZONA)).toBe("22:30");
    expect(fechaLocal("2026-11-12T05:00:00.000Z", ZONA)).toBe("2026-11-12");
    expect(horaLocal("2026-11-12T05:00:00.000Z", ZONA)).toBe("00:00");
  });
});

describe("diasEntre", () => {
  it("cuenta días de calendario con signo", () => {
    expect(diasEntre("2026-11-11", "2026-11-14")).toBe(3);
    expect(diasEntre("2026-11-14", "2026-11-11")).toBe(-3);
    expect(diasEntre("2026-10-15", "2026-11-14")).toBe(30);
    expect(diasEntre("2026-11-11", "2026-11-11")).toBe(0);
  });
});

describe("grupoDe", () => {
  it.each([
    ["2026-11-11", "Hoy"],
    ["2026-11-10", "Ayer"],
    ["2026-11-09", "Esta semana"],
    ["2026-11-05", "Esta semana"],
    ["2026-11-04", "Antes"],
  ] as const)("%s con hoy 11 nov → %s", (dia, grupo) => {
    expect(grupoDe(dia, HOY)).toBe(grupo);
  });

  it("un día futuro cuenta como Hoy", () => {
    expect(grupoDe("2026-11-12", HOY)).toBe("Hoy");
  });
});

describe("agrupar", () => {
  it("deja Hoy, Esta semana y Antes en ese orden, sin Ayer ni reordenar dentro", () => {
    const grupos = agrupar(DISENO, HOY, ZONA);
    expect(grupos.map((g) => g.grupo)).toEqual(["Hoy", "Esta semana", "Antes"]);
    expect(grupos[0].avisos).toEqual([GAS]);
    expect(grupos[1].avisos).toEqual([INTERNET, GIMNASIO]);
    expect(grupos[2].avisos).toEqual([MAMA, CAMILA]);
  });

  it("sin avisos no hay grupos", () => {
    expect(agrupar([], HOY, ZONA)).toEqual([]);
  });
});

describe("momento", () => {
  it("hoy, la hora; ayer, día y hora; antes, solo el día", () => {
    expect(momento(GAS, HOY, ZONA)).toBe("08:00");
    expect(momento(VOO, HOY, ZONA)).toBe("mar 10 nov · 08:00");
    expect(momento(INTERNET, HOY, ZONA)).toBe("lun 9 nov");
    expect(momento(CAMILA, HOY, ZONA)).toBe("jue 15 oct");
  });
});

describe("tituloAviso", () => {
  it("recurrente de gasto: hoy, mañana y en n días", () => {
    expect(tituloAviso(GAS, ZONA)).toBe("Gas Vanti vence en 3 días");
    expect(tituloAviso(recurrente({ vencimiento: "2026-11-12" }), ZONA)).toBe("Gas Vanti vence mañana");
    expect(tituloAviso(recurrente({ vencimiento: "2026-11-11" }), ZONA)).toBe("Gas Vanti vence hoy");
  });

  it("recurrente de transferencia vence; de ingreso, llega", () => {
    expect(tituloAviso(recurrente({ recurrente: { tipo: "transferencia" } }), ZONA)).toBe("Gas Vanti vence en 3 días");
    const salario = recurrente({ recurrente: { concepto: "Salario", tipo: "ingreso" } });
    expect(tituloAviso(salario, ZONA)).toBe("Salario llega en 3 días");
    expect(tituloAviso({ ...salario, vencimiento: "2026-11-12" }, ZONA)).toBe("Salario llega mañana");
    expect(tituloAviso({ ...salario, vencimiento: "2026-11-11" }, ZONA)).toBe("Salario llega hoy");
  });

  it("un plazo negativo cuenta como hoy", () => {
    expect(tituloAviso(recurrente({ vencimiento: "2026-11-09" }), ZONA)).toBe("Gas Vanti vence hoy");
  });

  it("deuda: hoy, mañana y en n días desde el día del aviso", () => {
    expect(tituloAviso(MAMA, ZONA)).toBe("Abono a Mamá en 3 días");
    expect(tituloAviso({ ...MAMA, fechaAcordada: "2026-11-04" }, ZONA)).toBe("Abono a Mamá mañana");
    expect(tituloAviso({ ...MAMA, fechaAcordada: "2026-11-03" }, ZONA)).toBe("Abono a Mamá hoy");
  });

  it("cobro: el primero es la fecha acordada; los siguientes cuentan días", () => {
    expect(tituloAviso(CAMILA, ZONA)).toBe("Camila: hoy es la fecha acordada");
    const repetido = { ...CAMILA, recordatorio: "2026-11-14", instante: ocho("2026-11-14") };
    expect(tituloAviso(repetido, ZONA)).toBe("Camila: van 30 días de la fecha acordada");
  });

  it("precio manual: días desde el último precio hasta el día del aviso", () => {
    expect(tituloAviso(VOO, ZONA)).toBe("VOO lleva 7 días sin precio");
  });
});

describe("detalleAviso", () => {
  it("recurrente fijo pendiente", () => {
    expect(detalleAviso(INTERNET, "largo")).toBe("Vence el 12 nov, desde Bancolombia. Sigue por confirmar.");
    expect(detalleAviso(INTERNET, "corto")).toBe("Vence el 12 nov · por confirmar.");
  });

  it("recurrente fijo de ingreso pendiente", () => {
    const salario = recurrente({ recurrente: { concepto: "Salario", tipo: "ingreso", variable: false }, vencimiento: "2026-11-12", estimado: false });
    expect(detalleAviso(salario, "largo")).toBe("Llega el 12 nov, a Nequi. Sigue por confirmar.");
    expect(detalleAviso(salario, "corto")).toBe("Llega el 12 nov · por confirmar.");
  });

  it("recurrente variable pendiente", () => {
    expect(detalleAviso(GAS, "largo")).toBe("Vence el 14 nov, desde Nequi. Importe estimado: ajústalo cuando llegue el recibo.");
    expect(detalleAviso(GAS, "corto")).toBe("Estimado · ajústalo cuando llegue el recibo.");
  });

  it("recurrente sin cuenta omite el tramo", () => {
    expect(detalleAviso(recurrente({ cuenta: null }), "largo")).toBe("Vence el 14 nov. Importe estimado: ajústalo cuando llegue el recibo.");
    expect(detalleAviso({ ...INTERNET, cuenta: null }, "largo")).toBe("Vence el 12 nov. Sigue por confirmar.");
    expect(detalleAviso({ ...GIMNASIO, cuenta: null }, "largo")).toBe("Se confirmó el 8 nov.");
  });

  it("recurrente confirmado y omitido", () => {
    expect(detalleAviso(GIMNASIO, "largo")).toBe("Se confirmó el 8 nov desde Bancolombia.");
    expect(detalleAviso(GIMNASIO, "corto")).toBe("Confirmado el 8 nov.");
    const salario = recurrente({ recurrente: { tipo: "ingreso" }, resuelto: true, resolucion: { forma: "confirmada", fecha: "2026-11-08" } });
    expect(detalleAviso(salario, "largo")).toBe("Se confirmó el 8 nov a Nequi.");
    const omitido = recurrente({ resuelto: true, resolucion: { forma: "omitida", fecha: "2026-11-08" } });
    expect(detalleAviso(omitido, "largo")).toBe("Se omitió el 8 nov.");
    expect(detalleAviso(omitido, "corto")).toBe("Omitido el 8 nov.");
  });

  it("cobro pendiente, con y sin próximo recordatorio", () => {
    expect(detalleAviso(CAMILA, "largo")).toBe("Te debe 500.000. El próximo recordatorio es el 14 nov.");
    expect(detalleAviso(CAMILA, "corto")).toBe("Te debe 500.000 · próximo recordatorio 14 nov.");
    const sinProximo = { ...CAMILA, proximoRecordatorio: null };
    expect(detalleAviso(sinProximo, "largo")).toBe("Te debe 500.000.");
    expect(detalleAviso(sinProximo, "corto")).toBe("Te debe 500.000.");
  });

  it("cobro con abono, con capital y saldado", () => {
    const abono: AvisoCobro = {
      ...CAMILA,
      resuelto: true,
      monto: 100_000n,
      resolucion: { forma: "abono", fecha: "2026-11-06", monto: 100_000n, cuenta: NEQUI },
    };
    expect(detalleAviso(abono, "largo")).toBe("Abonó 100.000 el 6 nov a Nequi. Quedan 500.000.");
    expect(detalleAviso(abono, "corto")).toBe("Abonó el 6 nov · quedan 500.000.");
    const saldado = { ...abono, capitalPendiente: 0n };
    expect(detalleAviso(saldado, "largo")).toBe("Abonó 100.000 el 6 nov a Nequi. Ya no te debe nada.");
    expect(detalleAviso(saldado, "corto")).toBe("Abonó el 6 nov · saldado.");
    expect(detalleAviso({ ...abono, resolucion: { ...abono.resolucion!, cuenta: null } }, "largo")).toBe(
      "Abonó 100.000 el 6 nov. Quedan 500.000.",
    );
  });

  it("cobro con condonación, con capital y saldado", () => {
    const condonado: AvisoCobro = {
      ...CAMILA,
      resuelto: true,
      monto: 100_000n,
      capitalPendiente: 400_000n,
      resolucion: { forma: "condonacion", fecha: "2026-11-06", monto: 100_000n, cuenta: null },
    };
    expect(detalleAviso(condonado, "largo")).toBe("Condonaste 100.000 el 6 nov. Quedan 400.000.");
    expect(detalleAviso(condonado, "corto")).toBe("Condonado el 6 nov · quedan 400.000.");
    const saldado = { ...condonado, capitalPendiente: 0n };
    expect(detalleAviso(saldado, "largo")).toBe("Condonaste 100.000 el 6 nov. Ya no te debe nada.");
    expect(detalleAviso(saldado, "corto")).toBe("Condonado el 6 nov · saldado.");
  });

  it("deuda pendiente", () => {
    const pendiente: AvisoDeuda = { ...MAMA, resuelto: false, leido: false, monto: 500_000n, resolucion: null, fechaAcordada: "2026-11-15" };
    expect(detalleAviso(pendiente, "largo")).toBe("Acordaron el 15 nov. Le debes 500.000.");
    expect(detalleAviso(pendiente, "corto")).toBe("Fecha acordada 15 nov · le debes 500.000.");
  });

  it("deuda con abono, con capital y saldada", () => {
    expect(detalleAviso(MAMA, "largo")).toBe("Abonaste 100.000 el 6 nov desde Nequi. Quedan 500.000.");
    expect(detalleAviso(MAMA, "corto")).toBe("Abonaste el 6 nov · quedan 500.000.");
    const saldada = { ...MAMA, capitalPendiente: 0n };
    expect(detalleAviso(saldada, "largo")).toBe("Abonaste 100.000 el 6 nov desde Nequi. Ya no le debes nada.");
    expect(detalleAviso(saldada, "corto")).toBe("Abonaste el 6 nov · saldada.");
  });

  it("deuda condonada", () => {
    const condonada: AvisoDeuda = {
      ...MAMA,
      capitalPendiente: 400_000n,
      resolucion: { forma: "condonacion", fecha: "2026-11-06", monto: 100_000n, cuenta: null },
    };
    expect(detalleAviso(condonada, "largo")).toBe("Te condonó 100.000 el 6 nov. Quedan 400.000.");
    expect(detalleAviso(condonada, "corto")).toBe("Condonado el 6 nov · quedan 400.000.");
    expect(detalleAviso({ ...condonada, capitalPendiente: 0n }, "corto")).toBe("Condonado el 6 nov · saldada.");
  });

  it("precio manual pendiente y resuelto", () => {
    expect(detalleAviso(VOO, "largo")).toBe(
      "Vanguard S&P 500 en XTB: el último precio es del 3 nov. Regístralo para valorar la inversión a mercado.",
    );
    expect(detalleAviso(VOO, "corto")).toBe("Último precio 3 nov · XTB.");
    const resuelto: AvisoPrecio = { ...VOO, resuelto: true, resolucion: { fecha: "2026-11-12" } };
    expect(detalleAviso(resuelto, "largo")).toBe("Registraste un precio nuevo el 12 nov.");
    expect(detalleAviso(resuelto, "corto")).toBe("Precio nuevo el 12 nov.");
  });
});

describe("montoAviso", () => {
  it("gasto estimado sale con «≈» y «−»", () => {
    expect(montoAviso(GAS)).toEqual({ texto: "≈ −32.400", sentido: "salida" });
  });

  it("gasto fijo y transferencia salen; ingreso entra sin signo", () => {
    expect(montoAviso(INTERNET)).toEqual({ texto: "−89.900", sentido: "salida" });
    expect(montoAviso(recurrente({ recurrente: { tipo: "transferencia" }, estimado: false }))).toEqual({ texto: "−32.400", sentido: "salida" });
    expect(montoAviso(recurrente({ recurrente: { tipo: "ingreso" }, estimado: false, monto: 4_200_000n }))).toEqual({
      texto: "4.200.000",
      sentido: "entrada",
    });
  });

  it("cobro entra; deuda sale; precio sin monto", () => {
    expect(montoAviso(CAMILA)).toEqual({ texto: "500.000", sentido: "entrada" });
    expect(montoAviso(MAMA)).toEqual({ texto: "−100.000", sentido: "salida" });
    expect(montoAviso(VOO)).toBeNull();
  });
});

describe("accionAviso", () => {
  it("fijo confirma; variable ajusta", () => {
    expect(accionAviso(INTERNET)).toEqual({ clase: "confirmar", rotulo: "Confirmar" });
    expect(accionAviso(GAS)).toEqual({ clase: "ajustar", rotulo: "Ajustar" });
  });

  it("cobro y precio llevan a los paneles que ya existen", () => {
    expect(accionAviso(CAMILA)).toEqual({ clase: "enlace", rotulo: "Registrar abono", href: "/deudas?prestamo=camila&abono=1" });
    expect(accionAviso(VOO)).toEqual({ clase: "enlace", rotulo: "Registrar precio", href: "/inversiones?inversion=xtb&precio=voo" });
  });

  it("deuda y resueltos no llevan acción", () => {
    expect(accionAviso({ ...MAMA, resuelto: false })).toBeNull();
    expect(accionAviso(GIMNASIO)).toBeNull();
    expect(accionAviso({ ...CAMILA, resuelto: true })).toBeNull();
  });
});

describe("leído", () => {
  it("textoNoLeidos", () => {
    expect(textoNoLeidos(0)).toBe("Todo leído");
    expect(textoNoLeidos(1)).toBe("1 sin leer");
    expect(textoNoLeidos(3)).toBe("3 sin leer");
  });

  it("alternar cambia solo el aviso de la clave", () => {
    const tras = alternar(DISENO, GAS.clave);
    expect(tras[0].leido).toBe(true);
    expect(tras.slice(1)).toEqual(DISENO.slice(1));
    expect(alternar(tras, GAS.clave)[0].leido).toBe(false);
    expect(alternar(DISENO, GIMNASIO.clave)[2].leido).toBe(false);
  });

  it("marcarTodos deja todos leídos y contarNoLeidos los cuenta", () => {
    expect(contarNoLeidos(DISENO)).toBe(2);
    const todos = marcarTodos(DISENO);
    expect(todos.every((a) => a.leido)).toBe(true);
    expect(contarNoLeidos(todos)).toBe(0);
    expect(contarNoLeidos(alternar(DISENO, GAS.clave))).toBe(1);
  });
});
