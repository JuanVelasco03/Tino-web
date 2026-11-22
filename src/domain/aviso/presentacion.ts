/**
 * Presentación de los avisos (docs/api/avisos.md, Tino-API SPEC 12). La API
 * deriva los avisos y manda campos, no frases: aquí se arman título, detalle,
 * monto con su sentido, acción, plazo, grupo y momento. La web no calcula
 * leído, resuelto, montos ni capital: salen de la API.
 *
 * Todo texto relativo usa `fechaHoy` y `zonaHoraria` de la respuesta, nunca
 * el reloj del navegador.
 */
import { formatearDinero, SIGNO_MENOS } from "../dinero/formato";
import { formatearDiaSemana, formatearFechaSinAnio } from "../fecha/formato";
import { horaEnZona } from "../inversion/presentacion";
import { diasDesde } from "../prestamo/presentacion";

/* ── Modelo de la web ─────────────────────────────────────────────────── */

export type Ref = { id: string; nombre: string };

export type TipoAviso = "recurrente" | "cobro" | "deuda" | "precio_manual";

export type AvisoBase = {
  /** `<tipo>:<id de la fuente>:<YYYY-MM-DD>`. */
  clave: string;
  tipo: TipoAviso;
  /** ISO UTC: 08:00 locales del día del aviso, o la creación de la fuente. */
  instante: string;
  leido: boolean;
  /** `true` → sin acción. */
  resuelto: boolean;
};

export type AvisoRecurrente = AvisoBase & {
  tipo: "recurrente";
  recurrente: { id: string; concepto: string; tipo: "gasto" | "ingreso" | "transferencia"; variable: boolean };
  vencimiento: string;
  /** Origen, o destino en un ingreso. */
  cuenta: Ref | null;
  monto: bigint;
  /** Variable y no confirmada → «≈». */
  estimado: boolean;
  resolucion: { forma: "confirmada" | "omitida"; fecha: string } | null;
};

export type ResolucionPrestamo = { forma: "abono" | "condonacion"; fecha: string; monto: bigint; cuenta: Ref | null };

export type AvisoCobro = AvisoBase & {
  tipo: "cobro";
  /** La persona. */
  prestamo: Ref;
  fechaAcordada: string;
  /** `= fechaAcordada` en el primero. */
  recordatorio: string;
  /** Resuelto: el de la resolución; si no, el capital pendiente de hoy. */
  monto: bigint;
  /** Hoy. */
  capitalPendiente: bigint;
  proximoRecordatorio: string | null;
  resolucion: ResolucionPrestamo | null;
};

export type AvisoDeuda = AvisoBase & {
  tipo: "deuda";
  prestamo: Ref;
  fechaAcordada: string;
  monto: bigint;
  capitalPendiente: bigint;
  resolucion: ResolucionPrestamo | null;
};

export type AvisoPrecio = AvisoBase & {
  tipo: "precio_manual";
  activo: { id: string; simbolo: string; nombre: string };
  inversion: Ref;
  precioFecha: string;
  resolucion: { fecha: string } | null;
};

export type Aviso = AvisoRecurrente | AvisoCobro | AvisoDeuda | AvisoPrecio;

export type AvisoConfig = { tipo: TipoAviso; activo: boolean; dias: number; opciones: number[] };

/** Cuerpo de `PATCH /avisos/config/:tipo`. `dias` sin `activo` enciende el tipo. */
export type ConfigCuerpo = { activo?: boolean; dias?: number };

export type Avisos = {
  /** Hoy en la zona del perfil. */
  fechaHoy: string;
  /** IANA, la del perfil. */
  zonaHoraria: string;
  horaAvisos: string;
  noLeidos: number;
  /** Visibles, en el orden de la API. */
  avisos: Aviso[];
  /** Los cuatro tipos, en el orden de la API. */
  config: AvisoConfig[];
};

/* ── Fechas ───────────────────────────────────────────────────────────── */

/** ISO UTC → `"YYYY-MM-DD"` en la zona (IANA). `"2026-11-12T03:00:00Z"`, Bogotá → `"2026-11-11"`. */
export function fechaLocal(instante: string, zona: string): string {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(
    new Date(instante),
  );
  const anio = partes.find((p) => p.type === "year")?.value;
  const mes = partes.find((p) => p.type === "month")?.value;
  const dia = partes.find((p) => p.type === "day")?.value;
  if (!anio || !mes || !dia) throw new Error(`No se pudo leer la fecha de "${instante}" en "${zona}".`);
  return `${anio}-${mes}-${dia}`;
}

/** ISO UTC → `"08:00"` en la zona, 24 h. */
export function horaLocal(instante: string, zona: string): string {
  return horaEnZona(instante, zona);
}

/** Días de calendario de `desde` a `hasta`, con signo. */
export function diasEntre(desde: string, hasta: string): number {
  return diasDesde(desde, hasta);
}

/* ── Grupos y momento ─────────────────────────────────────────────────── */

export type Grupo = "Hoy" | "Ayer" | "Esta semana" | "Antes";

const GRUPOS: readonly Grupo[] = ["Hoy", "Ayer", "Esta semana", "Antes"];

/** 0 días Hoy · 1 Ayer · 2 a 6 Esta semana · 7 o más Antes. Un día futuro (no debería llegar) cuenta como Hoy. */
export function grupoDe(fechaAviso: string, fechaHoy: string): Grupo {
  const dias = diasEntre(fechaAviso, fechaHoy);
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias <= 6) return "Esta semana";
  return "Antes";
}

/** Los avisos por grupo, en el orden de `Grupo`, sin reordenar dentro y sin grupos vacíos. */
export function agrupar(avisos: readonly Aviso[], fechaHoy: string, zona: string): { grupo: Grupo; avisos: Aviso[] }[] {
  const porGrupo = new Map<Grupo, Aviso[]>(GRUPOS.map((g) => [g, []]));
  for (const aviso of avisos) porGrupo.get(grupoDe(fechaLocal(aviso.instante, zona), fechaHoy))?.push(aviso);
  return GRUPOS.flatMap((grupo) => {
    const lista = porGrupo.get(grupo) ?? [];
    return lista.length > 0 ? [{ grupo, avisos: lista }] : [];
  });
}

/** Hoy «08:00» · Ayer «mar 10 nov · 08:00» · más antiguo «lun 9 nov». */
export function momento(a: Aviso, fechaHoy: string, zona: string): string {
  const fecha = fechaLocal(a.instante, zona);
  const dias = diasEntre(fecha, fechaHoy);
  if (dias <= 0) return horaLocal(a.instante, zona);
  if (dias === 1) return `${formatearDiaSemana(fecha)} · ${horaLocal(a.instante, zona)}`;
  return formatearDiaSemana(fecha);
}

/* ── Títulos ──────────────────────────────────────────────────────────── */

/** «hoy» · «mañana» · «en 3 días». Un plazo negativo (no debería llegar) cuenta como 0. */
function enPlazo(dias: number): string {
  const plazo = Math.max(0, dias);
  if (plazo === 0) return "hoy";
  if (plazo === 1) return "mañana";
  return `en ${plazo} días`;
}

/** Título del aviso. El plazo se mide desde el día local de `instante`, como manda el contrato. */
export function tituloAviso(a: Aviso, zona: string): string {
  const dia = fechaLocal(a.instante, zona);
  switch (a.tipo) {
    case "recurrente": {
      const verbo = a.recurrente.tipo === "ingreso" ? "llega" : "vence";
      return `${a.recurrente.concepto} ${verbo} ${enPlazo(diasEntre(dia, a.vencimiento))}`;
    }
    case "deuda":
      return `Abono a ${a.prestamo.nombre} ${enPlazo(diasEntre(dia, a.fechaAcordada))}`;
    case "cobro": {
      if (a.recordatorio === a.fechaAcordada) return `${a.prestamo.nombre}: hoy es la fecha acordada`;
      return `${a.prestamo.nombre}: van ${Math.max(0, diasEntre(a.fechaAcordada, a.recordatorio))} días de la fecha acordada`;
    }
    case "precio_manual":
      return `${a.activo.simbolo} lleva ${Math.max(0, diasEntre(a.precioFecha, dia))} días sin precio`;
  }
}

/* ── Detalles ─────────────────────────────────────────────────────────── */

/** Pesos sin «COP»: todos los montos de avisos son COP. */
function pesos(monto: bigint): string {
  return formatearDinero({ monto, moneda: "COP" }, { omitirCOP: true });
}

const fecha = formatearFechaSinAnio;

/** « desde Nequi» / « a Nequi»; sin cuenta, nada. */
function tramoCuenta(preposicion: "desde" | "a", cuenta: Ref | null, separador = " "): string {
  return cuenta ? `${separador}${preposicion} ${cuenta.nombre}` : "";
}

function detalleRecurrente(a: AvisoRecurrente, formato: "largo" | "corto"): string {
  const ingreso = a.recurrente.tipo === "ingreso";
  const preposicion = ingreso ? "a" : "desde";
  const largo = formato === "largo";

  if (a.resolucion?.forma === "confirmada") {
    const f = fecha(a.resolucion.fecha);
    return largo ? `Se confirmó el ${f}${tramoCuenta(preposicion, a.cuenta)}.` : `Confirmado el ${f}.`;
  }
  if (a.resolucion?.forma === "omitida") {
    const f = fecha(a.resolucion.fecha);
    return largo ? `Se omitió el ${f}.` : `Omitido el ${f}.`;
  }

  const cuando = `${ingreso ? "Llega" : "Vence"} el ${fecha(a.vencimiento)}`;
  if (a.recurrente.variable) {
    return largo
      ? `${cuando}${tramoCuenta(preposicion, a.cuenta, ", ")}. Importe estimado: ajústalo cuando llegue el recibo.`
      : "Estimado · ajústalo cuando llegue el recibo.";
  }
  return largo ? `${cuando}${tramoCuenta(preposicion, a.cuenta, ", ")}. Sigue por confirmar.` : `${cuando} · por confirmar.`;
}

function detalleCobro(a: AvisoCobro, formato: "largo" | "corto"): string {
  const largo = formato === "largo";
  const saldado = a.capitalPendiente === 0n;
  const quedan = pesos(a.capitalPendiente);
  const r = a.resolucion;

  if (!r) {
    const debe = `Te debe ${quedan}`;
    if (!a.proximoRecordatorio) return `${debe}.`;
    const proximo = fecha(a.proximoRecordatorio);
    return largo ? `${debe}. El próximo recordatorio es el ${proximo}.` : `${debe} · próximo recordatorio ${proximo}.`;
  }

  const f = fecha(r.fecha);
  if (r.forma === "abono") {
    if (!largo) return `Abonó el ${f} · ${saldado ? "saldado" : `quedan ${quedan}`}.`;
    return `Abonó ${pesos(r.monto)} el ${f}${tramoCuenta("a", r.cuenta)}. ${saldado ? "Ya no te debe nada." : `Quedan ${quedan}.`}`;
  }
  if (!largo) return `Condonado el ${f} · ${saldado ? "saldado" : `quedan ${quedan}`}.`;
  return `Condonaste ${pesos(r.monto)} el ${f}. ${saldado ? "Ya no te debe nada." : `Quedan ${quedan}.`}`;
}

function detalleDeuda(a: AvisoDeuda, formato: "largo" | "corto"): string {
  const largo = formato === "largo";
  const saldada = a.capitalPendiente === 0n;
  const quedan = pesos(a.capitalPendiente);
  const r = a.resolucion;

  if (!r) {
    const acordada = fecha(a.fechaAcordada);
    return largo ? `Acordaron el ${acordada}. Le debes ${quedan}.` : `Fecha acordada ${acordada} · le debes ${quedan}.`;
  }

  const f = fecha(r.fecha);
  const cierre = saldada ? "Ya no le debes nada." : `Quedan ${quedan}.`;
  if (r.forma === "abono") {
    if (!largo) return `Abonaste el ${f} · ${saldada ? "saldada" : `quedan ${quedan}`}.`;
    return `Abonaste ${pesos(r.monto)} el ${f}${tramoCuenta("desde", r.cuenta)}. ${cierre}`;
  }
  if (!largo) return `Condonado el ${f} · ${saldada ? "saldada" : `quedan ${quedan}`}.`;
  return `Te condonó ${pesos(r.monto)} el ${f}. ${cierre}`;
}

function detallePrecio(a: AvisoPrecio, formato: "largo" | "corto"): string {
  if (a.resolucion) {
    const f = fecha(a.resolucion.fecha);
    return formato === "largo" ? `Registraste un precio nuevo el ${f}.` : `Precio nuevo el ${f}.`;
  }
  const f = fecha(a.precioFecha);
  return formato === "largo"
    ? `${a.activo.nombre} en ${a.inversion.nombre}: el último precio es del ${f}. Regístralo para valorar la inversión a mercado.`
    : `Último precio ${f} · ${a.inversion.nombre}.`;
}

/** Detalle largo (escritorio) o corto (móvil). «Quedan» usa `capitalPendiente` (hoy); el monto de la resolución, `resolucion.monto`. */
export function detalleAviso(a: Aviso, formato: "largo" | "corto"): string {
  switch (a.tipo) {
    case "recurrente":
      return detalleRecurrente(a, formato);
    case "cobro":
      return detalleCobro(a, formato);
    case "deuda":
      return detalleDeuda(a, formato);
    case "precio_manual":
      return detallePrecio(a, formato);
  }
}

/* ── Monto ────────────────────────────────────────────────────────────── */

export type MontoAviso = { texto: string; sentido: "entrada" | "salida" };

/**
 * Monto con su sentido. Recurrente: gasto y transferencia salen, ingreso
 * entra; «≈ » delante si es estimado. Cobro entra; deuda sale. Precio, sin
 * monto. Salida con «−»; entrada sin signo.
 */
export function montoAviso(a: Aviso): MontoAviso | null {
  if (a.tipo === "precio_manual") return null;
  const sentido = a.tipo === "cobro" || (a.tipo === "recurrente" && a.recurrente.tipo === "ingreso") ? "entrada" : "salida";
  const cifra = `${sentido === "salida" && a.monto > 0n ? SIGNO_MENOS : ""}${pesos(a.monto)}`;
  const estimado = a.tipo === "recurrente" && a.estimado;
  return { texto: `${estimado ? "≈ " : ""}${cifra}`, sentido };
}

/* ── Acción ───────────────────────────────────────────────────────────── */

export type AccionAviso =
  | { clase: "confirmar"; rotulo: "Confirmar" }
  | { clase: "ajustar"; rotulo: "Ajustar" }
  | { clase: "enlace"; rotulo: "Registrar abono" | "Registrar precio"; href: string };

/** Acción del aviso; `null` si está resuelto o si es una deuda (se abona desde Deudas). */
export function accionAviso(a: Aviso): AccionAviso | null {
  if (a.resuelto) return null;
  switch (a.tipo) {
    case "recurrente":
      return a.recurrente.variable ? { clase: "ajustar", rotulo: "Ajustar" } : { clase: "confirmar", rotulo: "Confirmar" };
    case "cobro":
      return { clase: "enlace", rotulo: "Registrar abono", href: `/deudas?prestamo=${encodeURIComponent(a.prestamo.id)}&abono=1` };
    case "precio_manual":
      return {
        clase: "enlace",
        rotulo: "Registrar precio",
        href: `/inversiones?inversion=${encodeURIComponent(a.inversion.id)}&precio=${encodeURIComponent(a.activo.id)}`,
      };
    case "deuda":
      return null;
  }
}

/* ── Leído ────────────────────────────────────────────────────────────── */

/** 0 «Todo leído» · «1 sin leer» · «3 sin leer». */
export function textoNoLeidos(n: number): string {
  return n === 0 ? "Todo leído" : `${n} sin leer`;
}

/** Estado optimista de «Marcar todo»: todos leídos. */
export function marcarTodos(avisos: readonly Aviso[]): Aviso[] {
  return avisos.map((a) => (a.leido ? a : { ...a, leido: true }));
}

/** Estado optimista de la fila: alterna leído en el aviso de `clave`. */
export function alternar(avisos: readonly Aviso[], clave: string): Aviso[] {
  return avisos.map((a) => (a.clave === clave ? { ...a, leido: !a.leido } : a));
}

/** Sin leer de la lista optimista, solo para la cabecera. El número real lo da la API. */
export function contarNoLeidos(avisos: readonly Aviso[]): number {
  return avisos.filter((a) => !a.leido).length;
}
