/**
 * Cuadrícula de un mes para el calendario de la interfaz. Fechas calendario
 * (`"YYYY-MM-DD"`) y meses (`"YYYY-MM"`) como texto; los cálculos usan
 * `Date.UTC` solo como calendario, nunca la zona del navegador.
 */

const DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"] as const;

const MESES_LARGOS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

/** Encabezado de la cuadrícula, de lunes a domingo: inicial y nombre completo (para el lector de pantalla). */
export const DIAS_CUADRICULA = [
  { inicial: "L", nombre: "lunes" },
  { inicial: "M", nombre: "martes" },
  { inicial: "M", nombre: "miércoles" },
  { inicial: "J", nombre: "jueves" },
  { inicial: "V", nombre: "viernes" },
  { inicial: "S", nombre: "sábado" },
  { inicial: "D", nombre: "domingo" },
] as const;

function partesMes(mes: string): { anio: number; mes: number } {
  const coincidencia = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(mes);
  if (!coincidencia) throw new Error(`Mes mal formado: "${mes}". Se espera "YYYY-MM".`);
  return { anio: Number.parseInt(coincidencia[1], 10), mes: Number.parseInt(coincidencia[2], 10) };
}

const dos = (n: number) => String(n).padStart(2, "0");

/** Días del mes: `"2026-02"` → 28, `"2028-02"` → 29. */
export function diasDelMes(mes: string): number {
  const { anio, mes: m } = partesMes(mes);
  return new Date(Date.UTC(anio, m, 0)).getUTCDate();
}

/**
 * Semanas del mes de lunes a domingo. Cada casilla es la fecha del día o
 * `null` si cae en otro mes: `"2026-11"` empieza en domingo, así que su
 * primera semana es seis `null` y `"2026-11-01"`.
 */
export function semanasDelMes(mes: string): (string | null)[][] {
  const { anio, mes: m } = partesMes(mes);
  // getUTCDay: 0 = domingo. Desplazamiento desde el lunes: lunes 0 … domingo 6.
  const desplazamiento = (new Date(Date.UTC(anio, m - 1, 1)).getUTCDay() + 6) % 7;
  const total = diasDelMes(mes);
  const casillas: (string | null)[] = [
    ...Array.from({ length: desplazamiento }, () => null),
    ...Array.from({ length: total }, (_, i) => `${anio}-${dos(m)}-${dos(i + 1)}`),
  ];
  while (casillas.length % 7 !== 0) casillas.push(null);
  return Array.from({ length: casillas.length / 7 }, (_, i) => casillas.slice(i * 7, i * 7 + 7));
}

/** `"2026-11-24"` → `"martes 24 de noviembre de 2026"`: el nombre accesible de una casilla. */
export function nombreDia(fecha: string): string {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!coincidencia) throw new Error(`Fecha mal formada: "${fecha}". Se espera "YYYY-MM-DD".`);
  const [anio, mes, dia] = [1, 2, 3].map((i) => Number.parseInt(coincidencia[i], 10));
  const diaSemana = DIAS_LARGOS[new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay()];
  return `${diaSemana} ${dia} de ${MESES_LARGOS[mes - 1]} de ${anio}`;
}

/**
 * La misma posición en otro mes, para pasar de mes con el teclado:
 * `"2026-01-31"`, `+1` → `"2026-02-28"` (se recorta al último día).
 */
export function mismoDiaEnMes(fecha: string, meses: number): string {
  const [anio, mes, dia] = fecha.split("-").map((parte) => Number.parseInt(parte, 10));
  const destino = new Date(Date.UTC(anio, mes - 1 + meses, 1));
  const mesDestino = `${destino.getUTCFullYear()}-${dos(destino.getUTCMonth() + 1)}`;
  return `${mesDestino}-${dos(Math.min(dia, diasDelMes(mesDestino)))}`;
}
