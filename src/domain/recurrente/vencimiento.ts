/**
 * Presentación del calendario de un recurrente: texto relativo, periodicidad
 * y vencimiento. Todo desde `fechaHoy` de la API, nunca desde el reloj del
 * navegador. Las fechas `"YYYY-MM-DD"` se tratan como calendario, sin zona.
 */
import { formatearFechaSinAnio } from "../fecha/formato";
import type { Ocurrencia, Periodicidad, Recurrente } from "./tipos";

const FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_DIA = 86_400_000;

/** Día del calendario como medianoche UTC. Solo para restar días y leer el día de la semana. */
function marca(fecha: string): number {
  const partes = FECHA.exec(fecha);
  if (!partes) throw new Error(`Fecha mal formada: "${fecha}". Se espera "YYYY-MM-DD".`);
  return Date.UTC(Number.parseInt(partes[1], 10), Number.parseInt(partes[2], 10) - 1, Number.parseInt(partes[3], 10));
}

/** Días de `desde` a `hasta` (negativo si `hasta` es anterior). */
function diasEntre(desde: string, hasta: string): number {
  return Math.round((marca(hasta) - marca(desde)) / MS_DIA);
}

/** «hoy», «mañana», «en 3 días», «vencido ayer», «vencido hace 3 días». */
export function textoRelativo(vencimiento: string, fechaHoy: string): string {
  const dias = diasEntre(fechaHoy, vencimiento);
  if (dias === 0) return "hoy";
  if (dias === 1) return "mañana";
  if (dias > 1) return `en ${dias} días`;
  if (dias === -1) return "vencido ayer";
  return `vencido hace ${-dias} días`;
}

/** Para el color de la fila; el estado lo da la API. */
export function estaVencida(vencimiento: string, fechaHoy: string): boolean {
  return diasEntre(fechaHoy, vencimiento) < 0;
}

const CADA: Record<Periodicidad, string> = {
  semanal: "Semanal",
  quincenal: "Quincenal",
  mensual: "Mensual",
  bimestral: "Bimestral",
  trimestral: "Trimestral",
  anual: "Anual",
};

export function formatearCada(p: Periodicidad): string {
  return CADA[p];
}

const DIAS_SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"] as const;

/** `"2026-11-12"` → `"jueves"`. */
function diaSemana(fecha: string): string {
  return DIAS_SEMANA[new Date(marca(fecha)).getUTCDay()];
}

/** `"2026-11-12"` → `12`. */
function diaDelMes(fecha: string): number {
  return new Date(marca(fecha)).getUTCDate();
}

/** Último día del mes de `fecha`: `"2026-02-10"` → `"2026-02-28"`. */
function ultimoDelMes(fecha: string): string {
  const d = new Date(marca(fecha));
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

type Calendario = Pick<Recurrente, "periodicidad" | "primerVencimiento" | "ultimoDia">;

/** Fecha anual mostrada: con `ultimoDia`, el último día del mes del primer vencimiento. */
function fechaAnual(r: Calendario): string {
  return formatearFechaSinAnio(r.ultimoDia ? ultimoDelMes(r.primerVencimiento) : r.primerVencimiento);
}

/**
 * Columna «Vence»: mensual, bimestral y trimestral «Día 18» o «Último día»;
 * anual «18 nov»; semanal «Jueves»; quincenal «15 y último».
 */
export function formatearVence(r: Calendario): string {
  switch (r.periodicidad) {
    case "semanal":
      return capitalizar(diaSemana(r.primerVencimiento));
    case "quincenal":
      return "15 y último";
    case "anual":
      return fechaAnual(r);
    default:
      return r.ultimoDia ? "Último día" : `Día ${diaDelMes(r.primerVencimiento)}`;
  }
}

const CADA_MESES: Partial<Record<Periodicidad, string>> = { bimestral: "cada 2 meses", trimestral: "cada 3 meses" };

/** Nota del formulario: «Vence el día 12 de cada mes.», «Vence cada jueves.», … */
export function notaVencimiento(r: Calendario): string {
  switch (r.periodicidad) {
    case "semanal":
      return `Vence cada ${diaSemana(r.primerVencimiento)}.`;
    case "quincenal":
      return "Vence el 15 y el último día de cada mes.";
    case "anual":
      return `Vence cada año el ${fechaAnual(r)}.`;
    default: {
      const dia = r.ultimoDia ? "el último día" : `el día ${diaDelMes(r.primerVencimiento)}`;
      return `Vence ${dia} ${CADA_MESES[r.periodicidad] ?? "de cada mes"}.`;
    }
  }
}

/** Día del primer vencimiento para la opción «Día 12 de cada mes». */
export function diaDeVencimiento(primerVencimiento: string): number {
  return diaDelMes(primerVencimiento);
}

const ULTIMO: Record<Periodicidad, string> = {
  semanal: "Última semana",
  quincenal: "Última quincena",
  mensual: "Último mes",
  bimestral: "Último bimestre",
  trimestral: "Último trimestre",
  anual: "Último año",
};

/** Rótulo del último confirmado al ajustar: «Último mes: 31.870». */
export function etiquetaUltimo(p: Periodicidad): string {
  return ULTIMO[p];
}

function cerrada(o: Ocurrencia): boolean {
  return o.estado === "pagada" || o.estado === "omitida";
}

/**
 * La ocurrencia que representa a la plantilla en el mes: la primera sin
 * cerrar; si todas están cerradas, la última; `null` sin ocurrencias.
 */
export function ocurrenciaDelMes(r: Pick<Recurrente, "ocurrenciasDelMes">): Ocurrencia | null {
  const lista = r.ocurrenciasDelMes;
  if (lista.length === 0) return null;
  return lista.find((o) => !cerrada(o)) ?? lista[lista.length - 1];
}
