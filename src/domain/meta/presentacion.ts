/**
 * Presentación de metas de ahorro: frases, porcentajes, fechas y acciones.
 * Avance, falta, porcentaje, ritmo, cumplimiento, saldo libre y acumulados
 * llegan de la API: aquí solo se arman frases con ellos. Nada suma, resta ni
 * proyecta montos. Todo texto relativo usa `fechaHoy` de la respuesta, nunca
 * el reloj del navegador.
 */
import { formatearDinero, formatearTasa, SIGNO_MENOS } from "../dinero/formato";
import { formatearFecha, formatearFechaSinAnio, formatearMesCorto, formatearNombreMes } from "../fecha/formato";
import type { FilaAporte, FilaValor, Meta, MetaDetalle, TotalesMetas } from "./tipos";

/** Pesos sin «COP»: `1200000n` → `"1.200.000"`. */
export function pesos(monto: bigint): string {
  return formatearDinero({ monto, moneda: "COP" }, { omitirCOP: true });
}

/** `2533` → `"25,3 %"` (truncado a un decimal); `10000` → `"100 %"`; `null` → `"—"`. */
export function textoPorcentaje(porcentaje: number | null): string {
  if (porcentaje === null) return "—";
  if (!Number.isInteger(porcentaje)) throw new Error(`Porcentaje no entero en centésimas: ${porcentaje}.`);
  const decimas = Math.trunc(Math.max(0, porcentaje) / 10);
  const entero = Math.trunc(decimas / 10);
  const decimal = decimas % 10;
  return decimal === 0 ? `${entero} %` : `${entero},${decimal} %`;
}

/** Ancho de la barra de 0 a 100: topa en 100; negativo o `null` → 0. */
export function anchoBarra(porcentaje: number | null): number {
  if (porcentaje === null || porcentaje <= 0) return 0;
  return Math.min(100, porcentaje / 100);
}

function esCumplida(m: Meta): m is Meta & { cumplidaEl: string } {
  return m.cumplidaEl !== null;
}

/** Del año de `fechaHoy`, sin año («15 dic»); de otro año o sin `fechaHoy` (archivadas), con año. */
function fecha(valor: string, fechaHoy: string | null): string {
  return fechaHoy !== null && valor.slice(0, 4) === fechaHoy.slice(0, 4) ? formatearFechaSinAnio(valor) : formatearFecha(valor);
}

function esMesMeta(fechaMeta: string): boolean {
  return fechaMeta.length === 7;
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** «Para el 15 dic», «Para dic 2027», «Sin fecha» o «Cumplida el 12 sep». */
export function textoFechaLista(m: Meta, fechaHoy: string | null): string {
  if (esCumplida(m)) return `Cumplida el ${fecha(m.cumplidaEl, fechaHoy)}`;
  if (m.fechaMeta === null) return "Sin fecha";
  if (esMesMeta(m.fechaMeta)) return `Para ${formatearMesCorto(m.fechaMeta)}`;
  return `Para el ${fecha(m.fechaMeta, fechaHoy)}`;
}

/** Fila «Fecha meta» de las condiciones: «15 dic 2026», «Dic 2027», «Sin fecha» o «Cumplida · 12 sep». */
export function textoFechaCondicion(m: Meta): string {
  if (esCumplida(m)) return `Cumplida · ${formatearFechaSinAnio(m.cumplidaEl)}`;
  if (m.fechaMeta === null) return "Sin fecha";
  if (esMesMeta(m.fechaMeta)) return capitalizar(formatearMesCorto(m.fechaMeta));
  return formatearFecha(m.fechaMeta);
}

/** «Nubank · apartado para esta meta» · «eToro · toda la cuenta». */
export function textoCuenta(m: Pick<Meta, "modo" | "cuenta">): string {
  return `${m.cuenta.nombre} · ${m.modo === "apartado" ? "apartado para esta meta" : "toda la cuenta"}`;
}

/** «Faltan 1.200.000» · cumplida «Cumplida el 12 sep» · avance `null` «—». */
export function textoFalta(m: Meta): string {
  if (esCumplida(m)) return `Cumplida el ${formatearFechaSinAnio(m.cumplidaEl)}`;
  if (m.falta === null) return "—";
  return `Faltan ${pesos(m.falta)}`;
}

function mesIndice(fechaOMes: string): number {
  return Number.parseInt(fechaOMes.slice(0, 4), 10) * 12 + Number.parseInt(fechaOMes.slice(5, 7), 10) - 1;
}

/** Meses calendario de la creación a hoy, ambos incluidos, topado en 6: los del promedio del contrato. */
export function mesesPromedio(creadaEl: string, fechaHoy: string): number {
  return Math.min(6, Math.max(1, mesIndice(fechaHoy) - mesIndice(creadaEl) + 1));
}

function plural(n: number, singular: string, varios: string): string {
  return n === 1 ? `1 ${singular}` : `${n} ${varios}`;
}

/** `"2028-05"` → `"mayo de 2028"`. */
function mesEstimadoTexto(mes: string): string {
  return `${formatearNombreMes(mes)} de ${mes.slice(0, 4)}`;
}

function ritmoCumplida(m: Meta & { cumplidaEl: string }, fechaHoy: string | null): string {
  let texto = `Llegaste al objetivo el ${fecha(m.cumplidaEl, fechaHoy)}.`;
  if (m.uso) texto += ` El dinero se usó el ${fecha(m.uso.fecha, fechaHoy)}${m.uso.motivo ? ` · ${m.uso.motivo}` : ""}.`;
  return texto;
}

function ritmoPromedio(m: Meta, promedio: bigint | null, mes: string | null, fechaHoy: string, formato: "largo" | "corto"): string {
  if (promedio === null || mes === null) {
    if (formato === "corto") return "Sin ritmo para estimar.";
    const n = mesesPromedio(m.creadaEl, fechaHoy);
    const periodo = n === 1 ? "En este mes" : `En los últimos ${n} meses`;
    return `${periodo} el avance no creció: todavía no hay ritmo para estimar cuándo llegarías.`;
  }
  if (formato === "corto") return `A tu ritmo actual, alrededor de ${mesEstimadoTexto(mes)}.`;
  const n = mesesPromedio(m.creadaEl, fechaHoy);
  const cifra = pesos(promedio);
  const base =
    m.modo === "apartado"
      ? n === 1
        ? `En este mes aportaste ${cifra}.`
        : `En los últimos ${n} meses aportaste en promedio ${cifra} al mes.`
      : n === 1
        ? `En este mes el avance creció ${cifra}.`
        : `En los últimos ${n} meses el avance creció en promedio ${cifra} al mes.`;
  return `${base} A ese ritmo llegarías alrededor de ${mesEstimadoTexto(mes)}.`;
}

/**
 * Ritmo de la meta: largo en el detalle, corto en la lista móvil. Una cumplida
 * dice cuándo llegó (y el uso) en largo y nada en corto. `fechaHoy` `null`
 * (archivadas) solo sirve para las cumplidas.
 */
export function textoRitmo(m: Meta, fechaHoy: string | null, formato: "largo" | "corto"): string | null {
  if (esCumplida(m)) return formato === "largo" ? ritmoCumplida(m, fechaHoy) : null;
  if (m.avance === null) return formato === "largo" ? `Sin TRM de hoy: el avance de ${m.cuenta.nombre} no se puede calcular.` : "Sin TRM de hoy.";
  const r = m.ritmo;
  if (r === null || fechaHoy === null) return null;

  if (r.tipo === "promedio") return ritmoPromedio(m, r.promedioMensual, r.mesEstimado, fechaHoy, formato);

  const falta = pesos(r.falta);
  if (m.fechaMeta === null) return null;

  if (r.tipo === "dias") {
    const dia = fecha(m.fechaMeta, fechaHoy);
    if (r.vencida) return formato === "largo" ? `La fecha meta fue el ${dia}. Faltan ${falta}.` : `Venció el ${dia} · faltan ${falta}.`;
    if (r.dias === 0) return formato === "largo" ? `Para llegar hoy faltan ${falta}.` : `Faltan ${falta} para hoy.`;
    const plazo = plural(r.dias, "día", "días");
    return formato === "largo" ? `Para llegar el ${dia} faltan ${falta} en ${plazo}.` : `Faltan ${falta} en ${plazo}.`;
  }

  const mes = formatearMesCorto(m.fechaMeta);
  if (r.vencida) return formato === "largo" ? `La fecha meta era ${mes}. Faltan ${falta}.` : `Venció en ${mes} · faltan ${falta}.`;
  if (r.meses === 0) return formato === "largo" ? `Para ${mes} faltan ${falta}, todo este mes.` : `Faltan ${falta} este mes.`;
  const cuota = pesos(r.cuotaMensual);
  return formato === "largo"
    ? `Para ${mes} faltan ${falta}: unos ${cuota} al mes durante ${plural(r.meses, "mes", "meses")}.`
    : `Faltan ${falta} · unos ${cuota} al mes.`;
}

/** «a», «a y b», «a, b y c». */
function enumerar(partes: readonly string[]): string {
  if (partes.length <= 1) return partes.join("");
  return `${partes.slice(0, -1).join(", ")} y ${partes[partes.length - 1]}`;
}

/**
 * Nota de apartado compartido: «Nubank tiene 2.500.000: 1.900.000 apartados
 * aquí y 600.000 para Viaje a Cartagena.», con los libres al final si los hay
 * (excedido: sin libres, los reemplaza el aviso). `null` fuera de `apartado`.
 */
export function notaApartado(m: MetaDetalle): string | null {
  const a = m.modo === "apartado" ? m.apartados : null;
  if (a === null) return null;
  const nombre = m.cuenta.nombre;
  const libres = !a.excedido && a.libre > 0n;
  if (a.otras.length === 0 && !libres) return `${nombre} tiene ${pesos(a.saldoCuenta)}, todo apartado aquí.`;
  const partes = [`${pesos(a.apartadoAqui)} apartados aquí`, ...a.otras.map((o) => `${pesos(o.apartado)} para ${o.nombre}`)];
  if (libres) partes.push(`${pesos(a.libre)} libres`);
  return `${nombre} tiene ${pesos(a.saldoCuenta)}: ${enumerar(partes)}.`;
}

/** Lo apartado supera el saldo de la cuenta: cuánto (el negativo de `libre`). `null` si no. */
export function avisoExcedido(m: MetaDetalle): string | null {
  const a = m.apartados;
  if (a === null || !a.excedido) return null;
  return `Lo apartado en ${m.cuenta.nombre} supera su saldo en ${pesos(-a.libre)}. Registra un retiro en alguna de sus metas.`;
}

/** El avance de una meta sobre inversión sigue su valor de mercado. `null` fuera de inversión. */
export function notaInversion(m: MetaDetalle): string | null {
  const i = m.inversion;
  if (i === null) return null;
  const base = `El avance sigue el valor de mercado de ${m.cuenta.nombre}: ${formatearDinero({ monto: i.valorMercado, moneda: i.moneda }, { omitirCOP: true })}`;
  if (i.moneda === "COP") return `${base}. Sube y baja con el mercado.`;
  if (i.trm === null) return `${base}. Sin TRM de hoy no se puede pasar a pesos.`;
  return `${base} a TRM ${formatearTasa(i.trm.valor)}. Sube y baja con el mercado y con el dólar.`;
}

function conMotivo(texto: string, motivo: string | null): string {
  return motivo ? `${texto} · ${motivo}` : texto;
}

/** «Apartado inicial», «Aporte desde Bancolombia», «Retiro · arreglo de la nevera». */
export function etiquetaAporte(f: FilaAporte): string {
  const origen = f.cuentaOrigen ? ` desde ${f.cuentaOrigen.nombre}` : "";
  const base = f.tipo === "retiro" ? "Retiro" : f.inicial ? `Apartado inicial${origen}` : `Aporte${origen}`;
  return conMotivo(base, f.motivo);
}

/** «Valor al crear la meta», «Valor al cierre», «Valor hoy · TRM 4.120,00». */
export function etiquetaValor(f: FilaValor, creadaEl: string): string {
  if (f.tipo === "hoy") return f.trm ? `Valor hoy · TRM ${formatearTasa(f.trm.valor)}` : "Valor hoy";
  return f.fecha === creadaEl ? "Valor al crear la meta" : "Valor al cierre";
}

/** «+150.000» (aporte), «−100.000» (retiro), la variación con su signo; `null` → «—». */
export function montoFila(monto: bigint | null, tipo: "aporte" | "retiro" | "variacion"): string {
  if (monto === null) return "—";
  if (tipo === "aporte") return `+${pesos(monto)}`;
  if (tipo === "retiro") return `${SIGNO_MENOS}${pesos(monto)}`;
  return formatearDinero({ monto, moneda: "COP" }, { omitirCOP: true, signoMas: true });
}

export type PartesTotales = { avance: string; objetivo: string; sinTrm: string | null };

/** Piezas de la cabecera para dar estilo a cada cifra; `null` sin activas. */
export function partesTotales(t: TotalesMetas, activas: readonly Meta[]): PartesTotales | null {
  if (activas.length === 0) return null;
  const sinAvance = activas.filter((m) => m.avance === null).length;
  const sinTrm = t.incompleto ? `· sin ${plural(sinAvance, "meta", "metas")} sin TRM` : null;
  return { avance: pesos(t.avance), objetivo: pesos(t.objetivo), sinTrm };
}

/** «En metas activas: 34.430.000 de 54.300.000» (corto, sin los dos puntos); sin activas «Sin metas activas.». */
export function textoTotales(t: TotalesMetas, activas: readonly Meta[], formato: "largo" | "corto"): string {
  const p = partesTotales(t, activas);
  if (p === null) return "Sin metas activas.";
  const base = `En metas activas${formato === "largo" ? ":" : ""} ${p.avance} de ${p.objetivo}`;
  return p.sinTrm ? `${base} ${p.sinTrm}` : base;
}

export type AccionMeta = "registrar_aporte" | "ver_inversiones" | "editar" | "registrar_retiro" | "archivar" | "restaurar" | "eliminar";

/** Botones del detalle según estado y modo. `avance: null` no los cambia. */
export function accionesMeta(m: MetaDetalle): AccionMeta[] {
  if (m.archivadaEn !== null) return ["restaurar", "eliminar"];
  if (m.cumplidaEl !== null) {
    const apartado = m.modo === "apartado" ? (m.apartados?.apartadoAqui ?? 0n) : 0n;
    return apartado > 0n ? ["registrar_retiro", "eliminar"] : ["archivar", "eliminar"];
  }
  if (m.modo === "cuenta" && m.cuenta.tipo === "inversion") return ["ver_inversiones", "editar", "eliminar"];
  return ["registrar_aporte", "editar", "eliminar"];
}
