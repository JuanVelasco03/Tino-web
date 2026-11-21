/**
 * Fechas calendario (`"YYYY-MM-DD"`) que la API ya entrega en la zona del
 * usuario. Se formatean partiendo el string, sin `Date`: `new Date("2026-11-18")`
 * se interpreta en UTC y en Colombia mostraría el día anterior.
 */

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] as const;

const FECHA_CALENDARIO = /^(\d{4})-(\d{2})-(\d{2})$/;

type Partes = { anio: string; mes: string; dia: string };

function partir(fecha: string): Partes {
  const coincidencia = FECHA_CALENDARIO.exec(fecha);
  if (!coincidencia) throw new Error(`Fecha mal formada: "${fecha}". Se espera "YYYY-MM-DD".`);

  const [, anio, mesTexto, diaTexto] = coincidencia;
  const mes = MESES[Number.parseInt(mesTexto, 10) - 1];
  const dia = Number.parseInt(diaTexto, 10);
  if (!mes || dia < 1 || dia > 31) throw new Error(`Fecha mal formada: "${fecha}".`);

  return { anio, mes, dia: String(dia) };
}

/** `"2026-11-18"` → `"18 nov 2026"`. */
export function formatearFecha(fecha: string): string {
  const { anio, mes, dia } = partir(fecha);
  return `${dia} ${mes} ${anio}`;
}

/** `"2026-11-18"` → `"18 nov"`. */
export function formatearFechaSinAnio(fecha: string): string {
  const { mes, dia } = partir(fecha);
  return `${dia} ${mes}`;
}

const DIAS_SEMANA = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"] as const;

const MESES_LARGOS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

/**
 * Milisegundos del día a medianoche UTC. Solo se usa como calendario: suma de
 * días y día de la semana en UTC, nunca en la zona del navegador.
 */
function aMarcaUtc(fecha: string): number {
  partir(fecha); // valida la forma
  const [anio, mes, dia] = fecha.split("-").map((parte) => Number.parseInt(parte, 10));
  const marca = Date.UTC(anio, mes - 1, dia);
  // `Date.UTC` desborda (31 de febrero → 3 de marzo): una fecha inexistente es un error.
  if (new Date(marca).getUTCDate() !== dia) throw new Error(`Fecha inexistente: "${fecha}".`);
  return marca;
}

const MS_DIA = 86_400_000;

/** `"2026-11-01"`, `-1` → `"2026-10-31"`. Aritmética de calendario, sin zona horaria. */
export function sumarDias(fecha: string, dias: number): string {
  return new Date(aMarcaUtc(fecha) + dias * MS_DIA).toISOString().slice(0, 10);
}

/** `"2026-11-19"` → `"jue 19 nov"`. */
export function formatearDiaSemana(fecha: string): string {
  const diaSemana = DIAS_SEMANA[new Date(aMarcaUtc(fecha)).getUTCDay()];
  return `${diaSemana} ${formatearFechaSinAnio(fecha)}`;
}

/** `"2026-11"` → `"Noviembre 2026"`. */
export function formatearMes(mes: string): string {
  const coincidencia = /^(\d{4})-(\d{2})$/.exec(mes);
  const nombre = coincidencia ? MESES_LARGOS[Number.parseInt(coincidencia[2], 10) - 1] : undefined;
  if (!coincidencia || !nombre) throw new Error(`Mes mal formado: "${mes}". Se espera "YYYY-MM".`);
  return `${nombre} ${coincidencia[1]}`;
}

const MES = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** `"2026-11"` es un mes válido; `"2026-13"`, `"hola"` o `"2026-11-19"`, no. */
export function esMes(texto: string): boolean {
  return MES.test(texto);
}

function partirMes(mes: string): { anio: number; mes: number } {
  const coincidencia = MES.exec(mes);
  if (!coincidencia) throw new Error(`Mes mal formado: "${mes}". Se espera "YYYY-MM".`);
  return { anio: Number.parseInt(coincidencia[1], 10), mes: Number.parseInt(coincidencia[2], 10) };
}

function aMes(anio: number, mes: number): string {
  return `${String(anio).padStart(4, "0")}-${String(mes).padStart(2, "0")}`;
}

/** `"2026-01"`, `-1` → `"2025-12"`. Aritmética de calendario, sin zona horaria. */
export function sumarMeses(mes: string, n: number): string {
  const partes = partirMes(mes);
  const total = partes.anio * 12 + (partes.mes - 1) + n;
  return aMes(Math.floor(total / 12), (((total % 12) + 12) % 12) + 1);
}

/** `"2026-11-19"` → `"2026-11"`. */
export function mesDeFecha(fecha: string): string {
  partir(fecha); // valida la forma
  return fecha.slice(0, 7);
}

/**
 * Mes actual en la zona del perfil (IANA): a medianoche UTC del 1 de
 * diciembre, en Bogotá todavía es noviembre. Presentación (REGLAS §6).
 */
export function mesEnZona(zona: string, ahora: Date): string {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit" }).formatToParts(ahora);
  const anio = partes.find((p) => p.type === "year")?.value;
  const mes = partes.find((p) => p.type === "month")?.value;
  if (!anio || !mes) throw new Error(`No se pudo calcular el mes en la zona "${zona}".`);
  return `${anio}-${mes}`;
}

/**
 * Rango de días de un mes: `"2026-10-01"`, `"2026-10-31"` → `"1 – 31 oct"`.
 * Si cruza de mes: `"28 sep – 3 oct"`; de año: `"28 dic 2025 – 3 ene 2026"`.
 */
export function formatearRango(desde: string, hasta: string): string {
  const inicio = partir(desde);
  const fin = partir(hasta);
  if (inicio.anio !== fin.anio) return `${formatearFecha(desde)} – ${formatearFecha(hasta)}`;
  if (inicio.mes !== fin.mes) return `${inicio.dia} ${inicio.mes} – ${fin.dia} ${fin.mes}`;
  return `${inicio.dia} – ${fin.dia} ${fin.mes}`;
}

/** `"2026-09"` → `"septiembre"`, para usar dentro de una frase. */
export function formatearNombreMes(mes: string): string {
  const partes = partirMes(mes);
  return MESES_LARGOS[partes.mes - 1].toLowerCase();
}

/** `"2025-12"` → `"dic 2025"`. */
export function formatearMesCorto(mes: string): string {
  const partes = partirMes(mes);
  return `${MESES[partes.mes - 1]} ${String(partes.anio).padStart(4, "0")}`;
}
