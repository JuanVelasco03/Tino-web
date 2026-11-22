/**
 * Textos de la pantalla de deudas y préstamos. Funciones puras: todo lo
 * relativo («hace 27 días», «89 días») sale de `fechaHoy` de la API, nunca del
 * reloj del navegador. Los montos solo se formatean; no se calculan aquí.
 */
import { formatearDinero } from "../dinero/formato";
import { formatearFechaSinAnio } from "../fecha/formato";
import type { MovimientoPrestamo, Prestamo, PrestamoDetalle, Prestamos, TipoPrestamo } from "./tipos";

const FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_DIA = 86_400_000;

type Calendario = { anio: number; mes: number; dia: number };

function partir(fecha: string): Calendario {
  const c = FECHA.exec(fecha);
  if (!c) throw new Error(`Fecha mal formada: "${fecha}". Se espera "YYYY-MM-DD".`);
  return { anio: Number.parseInt(c[1], 10), mes: Number.parseInt(c[2], 10), dia: Number.parseInt(c[3], 10) };
}

function marca({ anio, mes, dia }: Calendario): number {
  return Date.UTC(anio, mes - 1, dia);
}

function diasDelMes(anio: number, mes: number): number {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

/** Suma meses a una fecha; el día se ajusta al último del mes si no existe (31 ene + 1 → 28 feb). */
function sumarMeses(c: Calendario, n: number): Calendario {
  const total = c.anio * 12 + (c.mes - 1) + n;
  const anio = Math.floor(total / 12);
  const mes = (total % 12) + 1;
  return { anio, mes, dia: Math.min(c.dia, diasDelMes(anio, mes)) };
}

/** Pesos sin «COP»: toda la pantalla está en pesos (préstamos en USD, fuera de alcance). */
export function pesos(monto: bigint): string {
  return formatearDinero({ monto, moneda: "COP" }, { omitirCOP: true });
}

/** Días de calendario de `desde` a `fechaHoy`: `"2026-08-14"`, `"2026-11-11"` → 89. */
export function diasDesde(desde: string, fechaHoy: string): number {
  return Math.round((marca(partir(fechaHoy)) - marca(partir(desde))) / MS_DIA);
}

/** Meses completos de `desde` a `hasta` (30 jun → 11 nov: 4). */
function mesesCompletos(desde: string, hasta: string): number {
  const inicio = partir(desde);
  const fin = marca(partir(hasta));
  let n = 0;
  while (marca(sumarMeses(inicio, n + 1)) <= fin) n++;
  return n;
}

/**
 * «Pasó la fecha acordada ayer» · «… hace 27 días» (menos de 30) · «… hace 1
 * mes» · «… hace 4 meses» (meses completos). Sin punto final.
 */
export function textoVencido(fechaAcordada: string, fechaHoy: string): string {
  const dias = diasDesde(fechaAcordada, fechaHoy);
  if (dias <= 1) return "Pasó la fecha acordada ayer";
  if (dias < 30) return `Pasó la fecha acordada hace ${dias} días`;
  const meses = Math.max(1, mesesCompletos(fechaAcordada, fechaHoy));
  return `Pasó la fecha acordada hace ${meses} ${meses === 1 ? "mes" : "meses"}`;
}

/**
 * Ayuda bajo el aviso de vencida. Con un abono posterior a la fecha acordada:
 * «Acordaron el 30 jun. Vas abonando: el último fue el 6 nov.». Si no:
 * «Acordaron el 15 oct. Si cambió el plan, puedes mover la fecha.».
 */
export function ayudaVencido(d: Pick<PrestamoDetalle, "fechaAcordada" | "ultimoAbono">): string {
  if (d.fechaAcordada === null) return "";
  const acordaron = `Acordaron el ${formatearFechaSinAnio(d.fechaAcordada)}.`;
  if (d.ultimoAbono !== null && d.ultimoAbono > d.fechaAcordada) {
    return `${acordaron} Vas abonando: el último fue el ${formatearFechaSinAnio(d.ultimoAbono)}.`;
  }
  return `${acordaron} Si cambió el plan, puedes mover la fecha.`;
}

/** `"0"`, `"0.00"` → sin intereses. Comparación de texto: la tasa nunca pasa por `number`. */
export function tieneTasa(tasa: string): boolean {
  return !/^0+(\.0*)?$/.test(tasa.trim());
}

/** `"0"` → «Sin intereses»; `"1.5"` → «1,5 % mensual sobre saldo». */
export function formatearTasa(tasa: string): string {
  if (!tieneTasa(tasa)) return "Sin intereses";
  const [enteros, decimales = ""] = tasa.trim().split(".");
  const fraccion = decimales.replace(/0+$/, "");
  return `${enteros}${fraccion ? `,${fraccion}` : ""} % mensual sobre saldo`;
}

/** «Pagó todo el 20 sep» (te debía) · «Pagaste todo el 20 sep» (le debías) · «Condonado el 11 nov». */
export function textoCierre(tipo: TipoPrestamo, cierre: NonNullable<Prestamo["cierre"]>): string {
  const fecha = formatearFechaSinAnio(cierre.fecha);
  if (cierre.forma === "condonacion") return `Condonado el ${fecha}`;
  return tipo === "prestamo_otorgado" ? `Pagó todo el ${fecha}` : `Pagaste todo el ${fecha}`;
}

/** Descripción de una fila del historial, según la clase y el sentido del préstamo. */
export function descripcionHistorial(tipo: TipoPrestamo, fila: MovimientoPrestamo): string {
  const cuenta = fila.cuenta?.nombre ?? "—";
  const otorgado = tipo === "prestamo_otorgado";
  switch (fila.clase) {
    case "desembolso":
      return otorgado ? `Le prestaste · desde ${cuenta}` : `Te prestó · a ${cuenta}`;
    case "abono": {
      const todo = fila.saldoCapital === 0n;
      if (otorgado) return `${todo ? "Pagó todo" : "Abonó"} · a ${cuenta}`;
      return `${todo ? "Pagaste todo" : "Abonaste"} · desde ${cuenta}`;
    }
    case "interes":
      return otorgado ? `Intereses · a ${cuenta}` : `Intereses · desde ${cuenta}`;
    case "condonacion":
      return fila.categoria ? `Condonaste · gasto en ${fila.categoria.nombre}` : "Condonaste · gasto sin categoría";
  }
}

function personas(n: number): string {
  return `${n} ${n === 1 ? "persona" : "personas"}`;
}

/** «Nadie te debe» · «1 persona · +6.667 de intereses sin cobrar» · «2 personas». */
export function subtituloTeDeben(t: Prestamos["teDeben"]): string {
  if (t.personas === 0) return "Nadie te debe";
  if (t.interesesCausados > 0n) return `${personas(t.personas)} · +${pesos(t.interesesCausados)} de intereses sin cobrar`;
  return personas(t.personas);
}

/** «No le debes a nadie» · «A 1 persona · sin intereses» · «A 1 persona · +4.000 de intereses por pagar». */
export function subtituloDebes(d: Prestamos["debes"]): string {
  if (d.personas === 0) return "No le debes a nadie";
  if (!d.conIntereses) return `A ${personas(d.personas)} · sin intereses`;
  return `A ${personas(d.personas)} · +${pesos(d.interesesCausados)} de intereses por pagar`;
}

/** Leyenda de la posición neta; `null` con todo en cero. */
export function leyendaNeta(c: Pick<Prestamos, "teDeben" | "debes" | "posicionNeta">): string | null {
  if (c.posicionNeta > 0n) return "Te deben más de lo que debes.";
  if (c.posicionNeta < 0n) return "Debes más de lo que te deben.";
  if (c.teDeben.total > 0n || c.debes.total > 0n) return "Lo que te deben cubre exactamente lo que debes.";
  return null;
}

/** Primer nombre para las frases de condonar: «Camila Ortiz» → «Camila». */
export function primerNombre(nombre: string): string {
  return nombre.trim().split(/\s+/)[0] ?? nombre;
}
