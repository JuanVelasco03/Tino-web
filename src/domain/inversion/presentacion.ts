/**
 * Presentación de inversiones: porcentajes, textos relativos, notas de precio,
 * subtítulo y TRM. Funciones puras con `fechaHoy` de la respuesta, nunca con
 * el reloj del navegador. La única cifra que se calcula aquí es la vista
 * previa del precio manual, asignada al cliente por el contrato.
 */
import { formatearDinero, formatearTasa, SIGNO_MENOS } from "../dinero/formato";
import { aPesos } from "../dinero/tasa";
import { formatearFecha, formatearFechaSinAnio } from "../fecha/formato";
import { diasDesde } from "../prestamo/presentacion";
import { valorPosicion } from "./cantidad";
import type { InversionDetalle, Moneda, Posicion, Trm } from "./tipos";

export const SIN_PORCENTAJE = "—";

function agruparMiles(digitos: string): string {
  return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Centésimas de punto, sin dividir: `1248` → `"+12,48 %"`, `-305` →
 * `"−3,05 %"`, `0` → `"0,00 %"`, `null` → `"—"`.
 */
export function formatearPorcentaje(centesimas: number | null): string {
  if (centesimas === null) return SIN_PORCENTAJE;
  if (!Number.isInteger(centesimas)) throw new Error(`Porcentaje no entero en centésimas: ${centesimas}.`);
  const digitos = String(Math.abs(centesimas)).padStart(3, "0");
  const signo = centesimas < 0 ? SIGNO_MENOS : centesimas > 0 ? "+" : "";
  return `${signo}${agruparMiles(digitos.slice(0, -2))},${digitos.slice(-2)} %`;
}

/** Meses completos de `desde` a `hasta`: el día del mes cuenta. */
function mesesCompletos(desde: string, hasta: string): number {
  const [a1, m1, d1] = desde.split("-").map((p) => Number.parseInt(p, 10));
  const [a2, m2, d2] = hasta.split("-").map((p) => Number.parseInt(p, 10));
  return (a2 - a1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0);
}

/** «hoy» · «ayer» · «hace 4 días» (menos de 30) · «hace 1 mes» · «hace 3 meses» (meses completos). */
export function antiguedad(fecha: string, fechaHoy: string): string {
  const dias = diasDesde(fecha, fechaHoy);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 30) return `hace ${dias} días`;
  const meses = Math.max(1, mesesCompletos(fecha, fechaHoy));
  return meses === 1 ? "hace 1 mes" : `hace ${meses} meses`;
}

/** `"09:30"`: hora de un instante ISO en la zona del perfil (IANA), 24 h. */
export function horaEnZona(instante: string, zona: string): string {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: zona,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(instante));
  const hora = partes.find((p) => p.type === "hour")?.value ?? "00";
  const minuto = partes.find((p) => p.type === "minute")?.value ?? "00";
  return `${hora}:${minuto}`;
}

/**
 * Nota de la cotización de una posición. Cierre: «Cierre 10 nov». Intradía:
 * «11 nov · 09:30» (hora en la zona del perfil). Manual: «7 nov · hace 4 días».
 * Con `precioVencido`, « · sin actualizar».
 */
export function notaCotizacion(
  p: Pick<Posicion, "precioOrigen" | "precioFecha" | "precioCotizadoEn" | "precioVencido">,
  fechaHoy: string,
  zona: string,
): string {
  const fecha = formatearFechaSinAnio(p.precioFecha);
  let nota: string;
  if (p.precioOrigen === "cierre") nota = `Cierre ${fecha}`;
  else if (p.precioOrigen === "intradia") nota = `${fecha} · ${horaEnZona(p.precioCotizadoEn, zona)}`;
  else nota = `${fecha} · ${antiguedad(p.precioFecha, fechaHoy)}`;
  return p.precioVencido ? `${nota} · sin actualizar` : nota;
}

const FRASE_TRM =
  "Todos los equivalentes en COP usan la TRM de hoy. El rendimiento en COP no incluye lo que cambió el dólar desde cada compra.";

/**
 * Nota al pie de la tabla, en orden: la de los equivalentes (solo USD con
 * TRM) y la de los precios automáticos (cierre e intradía). En COP sin
 * automáticas, `[]`.
 */
export function notaPrecios(d: Pick<InversionDetalle, "moneda" | "trm" | "posiciones">, zona: string): string[] {
  const frases: string[] = [];
  if (d.moneda === "USD" && d.trm !== null) frases.push(FRASE_TRM);

  const cierres = d.posiciones.filter((p) => p.precioOrigen === "cierre");
  const intradia = d.posiciones.filter((p) => p.precioOrigen === "intradia");

  let deCierre: string | null = null;
  if (cierres.length > 0) {
    const fechas = new Set(cierres.map((p) => p.precioFecha));
    deCierre =
      fechas.size === 1
        ? `Las acciones y los ETF tienen precio de cierre del ${formatearFechaSinAnio(cierres[0].precioFecha)}`
        : "Las acciones y los ETF tienen precio de cierre de su última sesión";
  }

  const uno = intradia.length === 1 ? intradia[0] : null;
  const cuando = uno ? `del ${formatearFechaSinAnio(uno.precioFecha)} a las ${horaEnZona(uno.precioCotizadoEn, zona)}` : null;

  if (deCierre && intradia.length > 0) {
    const resto = uno ? `el ${uno.simbolo}, ${cuando}` : "las cripto, de su último precio del día";
    frases.push(`${deCierre} y ${resto}.`);
  } else if (deCierre) {
    frases.push(`${deCierre}.`);
  } else if (uno) {
    frases.push(`El ${uno.simbolo} tiene precio ${cuando}.`);
  } else if (intradia.length > 1) {
    frases.push("Las cripto tienen su último precio del día.");
  }
  return frases;
}

/**
 * «eToro · cuenta en USD · activo» · «… · cuenta en COP · activo» ·
 * archivada: «… · archivada». Con `corto` (móvil), sin «· activo».
 */
export function subtituloInversion(d: Pick<InversionDetalle, "nombre" | "moneda" | "archivadaEn">, corto = false): string {
  const base = `${d.nombre} · cuenta en ${d.moneda}`;
  if (d.archivadaEn !== null) return `${base} · archivada`;
  return corto ? base : `${base} · activo`;
}

/** Texto de la TRM, partido para dibujar la cifra en mono: `antes` + `cifra` + `despues` = `texto`. */
export type TextoTrm = { texto: string; antes: string; cifra: string | null; despues: string; aviso: boolean };

/**
 * «TRM aplicada 4.120,00 · 11 nov 2026 · {fuente}» (aviso `false`);
 * desactualizada: «TRM del 8 nov 2026 · sin actualizar · {fuente}» (aviso
 * `true`); sin TRM: «Sin TRM: no hay equivalente en pesos.» (aviso `true`).
 * `prefijo: "hoy"` (día uno): «TRM de hoy 4.120,00 · …».
 */
export function textoTrm(trm: Trm | null, desactualizada: boolean, prefijo: "aplicada" | "hoy" = "aplicada"): TextoTrm {
  if (trm === null) {
    const texto = "Sin TRM: no hay equivalente en pesos.";
    return { texto, antes: texto, cifra: null, despues: "", aviso: true };
  }
  const fecha = formatearFecha(trm.vigenteDesde);
  if (desactualizada) {
    const texto = `TRM del ${fecha} · sin actualizar · ${trm.fuente}`;
    return { texto, antes: texto, cifra: null, despues: "", aviso: true };
  }
  const antes = prefijo === "hoy" ? "TRM de hoy " : "TRM aplicada ";
  const cifra = formatearTasa(trm.valor);
  const despues = ` · ${fecha} · ${trm.fuente}`;
  return { texto: `${antes}${cifra}${despues}`, antes, cifra, despues, aviso: false };
}

/**
 * Vista previa de un precio manual: valor de la posición con ese precio y, en
 * USD con TRM, su equivalente en pesos. La calcula el cliente por contrato.
 */
export function vistaPreviaPrecio(
  cantidad: string,
  precio: bigint,
  trm: Trm | null,
  moneda: Moneda,
): { valor: bigint; valorCop: bigint | null } {
  const valor = valorPosicion(cantidad, precio);
  return { valor, valorCop: moneda === "USD" && trm !== null ? aPesos(valor, trm.valor) : null };
}

/* ── Formato de cifras de la pantalla ─────────────────────────────────── */

/** Cifra en su moneda, sin «COP»: `US$ 7.750,00` o `1.000.000`. Con `signo`, `+` en positivos. */
export function enMoneda(monto: bigint, moneda: Moneda, signo = false): string {
  return formatearDinero({ monto, moneda }, { omitirCOP: true, signoMas: signo });
}

/** Cifra de una columna ya rotulada con su moneda («Valor · USD»): `3.515,00` o `1.000.000`, sin «US$». */
export function cifraColumna(monto: bigint, moneda: Moneda, signo = false): string {
  return enMoneda(monto, moneda, signo).replace("US$ ", "");
}

/** «≈ 31.930.000 COP» (o «≈ +3.535.866 COP» con signo); sin equivalente, «≈ —». */
export function equivalente(cop: bigint | null, opciones: { signo?: boolean; conCOP?: boolean } = {}): string {
  if (cop === null) return "≈ —";
  const cifra = formatearDinero({ monto: cop, moneda: "COP" }, { omitirCOP: !(opciones.conCOP ?? true), signoMas: opciones.signo });
  return `≈ ${cifra}`;
}

/** Color de una cifra con signo (rendimiento, %, ganancia realizada): + verde, − terracota, 0 secundario. */
export function tonoSigno(valor: bigint | number | null): "entrada" | "salida" | "neutro" {
  if (valor === null) return "neutro";
  if (valor > 0) return "entrada";
  if (valor < 0) return "salida";
  return "neutro";
}
