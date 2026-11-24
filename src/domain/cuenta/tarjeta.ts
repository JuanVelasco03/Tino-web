/**
 * Presentación de la tarjeta de crédito con ciclo (web SPEC 13, Tino-API
 * SPEC 14). Funciones puras que arman frases: ciclo, corte, pago límite,
 * consumos, cargos, deuda, compra, uso y tasa E.A. llegan todos de la API
 * (REGLAS §5). Lo único que se calcula aquí es la posición de «Hoy» en la
 * línea del ciclo, solo para dibujar. Todo texto relativo usa `fechaHoy` de
 * la respuesta.
 */
import { formatearDinero } from "../dinero/formato";
import { formatearRango } from "../fecha/formato";
import { fechaCorta } from "./detalle";

type Ref = { id: string; nombre: string };

/** Lo que estas funciones leen de una fila del ciclo. `FilaCiclo` del repositorio lo cumple. */
export type FilaCiclo = {
  tipo: "gasto" | "ingreso" | "transferencia";
  descripcion: string | null;
  monto: bigint;
  categoria: Ref | null;
  partes: readonly unknown[];
  contraparte: Ref | null;
};

export type Ciclo = {
  inicio: string;
  corte: string;
  pagoLimite: string;
  diasHastaCorte: number;
  diasHastaPago: number;
  saldoAnteriorPendiente: bigint;
};

export type Compra = { monto: bigint; cabe: boolean; disponibleTras: bigint | null; porcentajeTras: number | null; falta: bigint | null };

function pesos(monto: bigint): string {
  return formatearDinero({ monto, moneda: "COP" }, { omitirCOP: true });
}

/** Centésimas de punto con dos decimales: 198 → `"1,98"`, 2652 → `"26,52"`. */
function porcentajeCentesimas(n: number): string {
  return `${Math.trunc(n / 100)},${String(n % 100).padStart(2, "0")}`;
}

/** `"1,98 % M.V. · 26,52 % E.A."`; sin tasa, «Sin definir». */
export function textoTasa(mensual: number | null, efectivaAnual: number | null): string {
  if (mensual === null) return "Sin definir";
  const mv = `${porcentajeCentesimas(mensual)} % M.V.`;
  return efectivaAnual === null ? mv : `${mv} · ${porcentajeCentesimas(efectivaAnual)} % E.A.`;
}

/** 15 → «15 de cada mes»; sin día, «Sin definir». */
export function textoDia(dia: number | null): string {
  return dia === null ? "Sin definir" : `${dia} de cada mes`;
}

/** 0 → «hoy» · 1 → «mañana» · 4 → «en 4 días». */
export function textoDiasHasta(dias: number): string {
  if (dias <= 0) return "hoy";
  if (dias === 1) return "mañana";
  return `en ${dias} días`;
}

/** «16 oct – 15 nov · pago hasta 30 nov». */
export function textoLineaCiclo(c: Pick<Ciclo, "inicio" | "corte" | "pagoLimite">, fechaHoy: string): string {
  return `${formatearRango(c.inicio, c.corte)} · pago hasta ${fechaCorta(c.pagoLimite, fechaHoy)}`;
}

/** Días de calendario entre dos fechas `"YYYY-MM-DD"` (sin zona horaria). */
function diasEntre(desde: string, hasta: string): number {
  const marca = (f: string) => {
    const [a, m, d] = f.split("-").map((p) => Number.parseInt(p, 10));
    return Date.UTC(a, m - 1, d);
  };
  return Math.round((marca(hasta) - marca(desde)) / 86_400_000);
}

/**
 * Posición del punto «Hoy» en la línea del ciclo, de 0 a 100: días
 * transcurridos desde el inicio sobre la duración del ciclo. Solo dibuja.
 */
export function posicionHoy(c: Pick<Ciclo, "inicio" | "corte">, fechaHoy: string): number {
  const total = diasEntre(c.inicio, c.corte);
  if (total <= 0) return 100;
  const pasados = diasEntre(c.inicio, fechaHoy);
  return Math.min(100, Math.max(0, Math.round((pasados * 100) / total)));
}

/** Columna de categoría de un cargo: cuota de manejo → «Cargo fijo»; intereses → «Sobre {597.980}». */
export function detalleCargo(f: { clase: "intereses" | "cuota_manejo" }, c: Pick<Ciclo, "saldoAnteriorPendiente">): string {
  return f.clase === "cuota_manejo" ? "Cargo fijo" : `Sobre ${pesos(c.saldoAnteriorPendiente)}`;
}

/** Concepto de un abono: un pago (transferencia) → «Pago desde {Bancolombia}»; otro, su descripción o categoría. */
export function etiquetaAbono(f: FilaCiclo): string {
  if (f.tipo === "transferencia" && f.contraparte) return `Pago desde ${f.contraparte.nombre}`;
  return f.descripcion ?? f.categoria?.nombre ?? "Abono";
}

/** Categoría de un abono: «Transferencia» o la suya. */
export function categoriaAbono(f: FilaCiclo): string {
  if (f.tipo === "transferencia") return "Transferencia";
  return f.categoria?.nombre ?? "Sin clasificar";
}

/** Categoría de un consumo: «Dividido», «Avance hacia {cuenta}» (transferencia), la suya o «Sin clasificar». */
export function categoriaConsumo(f: FilaCiclo): string {
  if (f.tipo === "transferencia") return f.contraparte ? `Avance hacia ${f.contraparte.nombre}` : "Avance";
  if (f.partes.length > 0) return "Dividido";
  return f.categoria?.nombre ?? "Sin clasificar";
}

/** Concepto de un consumo o cargo: la descripción o, sin ella, su categoría. */
export function conceptoCiclo(f: FilaCiclo): string {
  return f.descripcion ?? categoriaConsumo(f);
}

/** «11 consumos» · «1 consumo». */
export function textoConsumos(n: number): string {
  return `${n} ${n === 1 ? "consumo" : "consumos"}`;
}

/**
 * Respuesta de «¿Puedo comprar esto?». Sin valor, la invitación; si cabe, lo
 * que quedaría (y, con ciclo, en qué corte entra y cuándo se paga); si no,
 * cuánto falta y el disponible de hoy. Todas las cifras son de la API.
 */
export function textoCompra(c: Compra | null, ciclo: Pick<Ciclo, "corte" | "pagoLimite"> | null, disponibleHoy: bigint, fechaHoy = ""): { titulo: string; detalle: string } {
  if (c === null) return { titulo: "Escribe el valor y te digo si cabe.", detalle: "Se compara con el cupo disponible de hoy." };
  if (!c.cabe) {
    return { titulo: "No cabe en el cupo.", detalle: `Faltan ${pesos(c.falta ?? 0n)}. Hoy tienes ${pesos(disponibleHoy)} disponibles.` };
  }
  const queda = `Te quedarían ${pesos(c.disponibleTras ?? 0n)} disponibles (uso ${c.porcentajeTras ?? 0} %).`;
  if (!ciclo) return { titulo: "Sí, cabe en el cupo.", detalle: queda };
  const hoy = fechaHoy || ciclo.corte;
  return {
    titulo: "Sí, cabe en el cupo.",
    detalle: `${queda} Entra al corte del ${fechaCorta(ciclo.corte, hoy)} y se paga hasta el ${fechaCorta(ciclo.pagoLimite, hoy)}.`,
  };
}
