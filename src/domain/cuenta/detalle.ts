/**
 * Presentación del detalle de una cuenta de efectivo o banco (web SPEC 13,
 * Tino-API SPEC 14). Funciones puras: arman frases y rangos con lo que llega
 * de la API. Saldo corrido, conciliado, entradas, salidas y saldo al inicio
 * del rango vienen calculados; la web solo suma los `efecto` de la selección
 * (N-23) y resta `saldoReal − saldoHoy` para la vista previa del ajuste
 * (N-28), como manda el contrato. Todo texto relativo usa `fechaHoy` de la
 * respuesta, nunca el reloj del navegador.
 */
import { aDigitos } from "../dinero/entrada";
import { formatearDinero } from "../dinero/formato";
import { formatearFecha, formatearFechaSinAnio, formatearRango, sumarDias, sumarMeses } from "../fecha/formato";

type Ref = { id: string; nombre: string };

/** Lo que estas funciones leen de una fila del historial. `FilaHistorial` del repositorio lo cumple. */
export type FilaHistorial = {
  movimientoId: string;
  tipo: "gasto" | "ingreso" | "transferencia" | "ajuste";
  fecha: string;
  descripcion: string | null;
  efecto: bigint;
  saldo: bigint;
  conciliado: boolean;
  categoria: Ref | null;
  partes: readonly { categoria: Ref; monto: bigint }[];
  contraparte: (Ref & { sentido: "desde" | "hacia" }) | null;
};

export type Conciliacion = { saldo: bigint | null; al: string | null; pendientes: number };

/** Lo que estas funciones leen del historial. */
export type Historial = { fechaHoy: string; desde: string; hasta: string | null; conciliacion: Conciliacion };

export type Atajo = "30d" | "mes" | "anterior";

export const MENSAJE_RANGO = "La fecha final no puede ser anterior a la inicial.";
export const MENSAJE_SALDO_REAL = "Escribe un valor en pesos, sin decimales.";

/** `"2026-11-11"` → `"2026-11-01"`. */
function primerDia(fecha: string): string {
  return `${fecha.slice(0, 7)}-01`;
}

/**
 * Consulta de cada atajo (Tino-API SPEC 14): «Últimos 30 días» sin `desde` ni
 * `hasta` (la API pone hoy − 30); el mes en curso con `desde` el día 1 y sin
 * `hasta` (entran los programados, N-39); el mes anterior con los dos.
 */
export function rangoDeAtajo(atajo: Atajo, fechaHoy: string): { desde?: string; hasta?: string } {
  switch (atajo) {
    case "30d":
      return {};
    case "mes":
      return { desde: primerDia(fechaHoy) };
    case "anterior": {
      const desde = `${sumarMeses(fechaHoy.slice(0, 7), -1)}-01`;
      return { desde, hasta: sumarDias(primerDia(fechaHoy), -1) };
    }
  }
}

/** El atajo que corresponde a los parámetros de la URL, o `null` si es un rango libre. */
export function atajoActivo(desde: string | undefined, hasta: string | undefined, fechaHoy: string): Atajo | null {
  for (const atajo of ["30d", "mes", "anterior"] as const) {
    const r = rangoDeAtajo(atajo, fechaHoy);
    if (r.desde === desde && r.hasta === hasta) return atajo;
  }
  return null;
}

/** Fecha sin año si es del año de `fechaHoy`; con año si no. */
export function fechaCorta(fecha: string, fechaHoy: string): string {
  return fecha.slice(0, 4) === fechaHoy.slice(0, 4) ? formatearFechaSinAnio(fecha) : formatearFecha(fecha);
}

/** `"12 oct – 11 nov 2026"`: del `desde` al `hasta` (sin él, hasta hoy), siempre con el año. */
export function textoRango(h: Pick<Historial, "desde" | "hasta" | "fechaHoy">): string {
  const hasta = h.hasta ?? h.fechaHoy;
  const rango = formatearRango(h.desde, hasta);
  // `formatearRango` ya lleva el año cuando cruza de año.
  return h.desde.slice(0, 4) === hasta.slice(0, 4) ? `${rango} ${hasta.slice(0, 4)}` : rango;
}

/** «Saldo al {desde − 1 día}»: `saldoInicioRango` es el saldo antes de `desde`. */
export function textoSaldoInicio(desde: string, fechaHoy: string = desde): string {
  return `Saldo al ${fechaCorta(sumarDias(desde, -1), fechaHoy)}`;
}

/** «9 sin conciliar» · «1 sin conciliar». */
function sinConciliar(pendientes: number): string {
  return `${pendientes} sin conciliar`;
}

/**
 * Estado de la conciliación. Largo (escritorio, bajo la cifra): «al 31 oct ·
 * 9 sin conciliar», «al 31 oct · todo conciliado» o, nunca conciliada, «16 sin
 * conciliar». Corto (móvil): con «Conciliado {cifra} · » delante. Sin
 * movimientos (sin saldo conciliado y sin pendientes): «Sin movimientos».
 */
export function textoConciliado(c: Conciliacion, formato: "largo" | "corto", fechaHoy: string): string {
  if (c.saldo === null && c.pendientes === 0) return "Sin movimientos";
  const partes: string[] = [];
  if (formato === "corto") partes.push(`Conciliado ${c.saldo === null ? "—" : montoConSigno(c.saldo, false)}`);
  if (c.saldo !== null && c.al !== null) partes.push(`al ${fechaCorta(c.al, fechaHoy)}`);
  partes.push(c.pendientes === 0 ? "todo conciliado" : sinConciliar(c.pendientes));
  return partes.join(" · ");
}

/**
 * Columna «Categoría» de una fila: la categoría, «Dividido», «Sin
 * clasificar», «Desde/Hacia {cuenta}» en una transferencia o «Ajuste».
 */
export function etiquetaFila(f: FilaHistorial): string {
  if (f.tipo === "ajuste") return "Ajuste";
  if (f.tipo === "transferencia") {
    if (!f.contraparte) return "Transferencia";
    return `${f.contraparte.sentido === "desde" ? "Desde" : "Hacia"} ${f.contraparte.nombre}`;
  }
  if (f.partes.length > 0) return "Dividido";
  return f.categoria?.nombre ?? "Sin clasificar";
}

/** Concepto de la fila: la descripción o, sin ella, la etiqueta. */
export function conceptoFila(f: FilaHistorial): string {
  return f.descripcion ?? etiquetaFila(f);
}

/** `"+100.000"` · `"−15.000"` · `"0"`. Sin `signoMas`, solo el «−» de un negativo. */
export function montoConSigno(n: bigint, signoMas = true): string {
  return formatearDinero({ monto: n, moneda: "COP" }, { omitirCOP: true, signoMas });
}

/** ¿Fecha posterior a hoy? Una fila programada (N-39). */
export function esProgramada(fecha: string, fechaHoy: string): boolean {
  return fecha > fechaHoy;
}

/** Σ `efecto` de las filas elegidas (N-23). Única suma que el contrato deja al cliente. */
export function sumaSeleccion(filas: readonly FilaHistorial[], ids: ReadonlySet<string>): bigint {
  let suma = 0n;
  for (const f of filas) if (ids.has(f.movimientoId)) suma += f.efecto;
  return suma;
}

/** Ids de las filas pendientes del rango visible, en su orden. */
export function pendientesDelRango(filas: readonly FilaHistorial[]): string[] {
  return filas.filter((f) => !f.conciliado).map((f) => f.movimientoId);
}

/** Vista previa del ajuste (N-28). La API fija la diferencia al registrar. */
export function diferenciaPrevia(saldoReal: bigint, saldoHoy: bigint): bigint {
  return saldoReal - saldoHoy;
}

/** «3 seleccionados» · «1 seleccionado». */
export function textoSeleccionados(n: number): string {
  return `${n} ${n === 1 ? "seleccionado" : "seleccionados"}`;
}

/** `hasta` anterior a `desde` → mensaje; si no, `null`. Fechas `"YYYY-MM-DD"` comparables como texto. */
export function validarRango(desde: string, hasta: string): string | null {
  return hasta !== "" && desde !== "" && hasta < desde ? MENSAJE_RANGO : null;
}

/** Saldo contado: entero ≥ 0 en pesos, sin decimales (N-27). */
export function validarSaldoReal(texto: string): { valor: bigint } | { error: string } {
  const digitos = aDigitos(texto);
  return digitos === null ? { error: MENSAJE_SALDO_REAL } : { valor: BigInt(digitos) };
}

/** Ids en lotes del tope de la API (500), en su orden. */
export function enLotes<T>(ids: readonly T[], tamano = 500): T[][] {
  const lotes: T[][] = [];
  for (let i = 0; i < ids.length; i += tamano) lotes.push(ids.slice(i, i + tamano));
  return lotes;
}
