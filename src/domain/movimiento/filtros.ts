import type { TipoMovimiento } from "./cuerpo";

/*
 * Filtros y agrupación del libro de movimientos. Solo presentación: eligen y
 * ordenan filas que ya llegaron de la API (`GET /movimientos?mes=`), como el
 * filtro de «sin clasificar» (Tino-API SPEC 06). No tocan montos.
 */

type Ref = { id: string; nombre: string };

/** Lo que el filtro necesita de un movimiento. */
export type MovimientoFiltrable = {
  tipo: TipoMovimiento;
  fecha: string;
  descripcion: string | null;
  cuentaOrigen: Ref | null;
  cuentaDestino: Ref | null;
  categoria: Ref | null;
  partes: readonly { categoria: Ref }[];
};

/** Valor del filtro de categoría para lo que no tiene categoría ni partes (transferencias aparte). */
export const SIN_CATEGORIA = "sin-categoria";

/** `null` en un campo = «Todas» / «Todos». */
export type Filtros = {
  texto: string;
  /** Id de cuenta: origen o destino. */
  cuentaId: string | null;
  /** Id de categoría (también en una parte) o `SIN_CATEGORIA`. */
  categoriaId: string | null;
  tipo: TipoMovimiento | null;
  /** Nombre de la persona (el nombre de la cuenta de préstamo). */
  persona: string | null;
};

export const SIN_FILTROS: Filtros = { texto: "", cuentaId: null, categoriaId: null, tipo: null, persona: null };

/** Préstamos por id de su cuenta → nombre de la persona (Tino-API SPEC 08: la persona es el nombre de la cuenta). */
export type Personas = ReadonlyMap<string, string>;

export function hayFiltros(f: Filtros): boolean {
  return f.texto.trim() !== "" || f.cuentaId !== null || f.categoriaId !== null || f.tipo !== null || f.persona !== null;
}

/** Minúsculas y sin tildes: «Energía» y «energia» coinciden. */
export function normalizar(texto: string): string {
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** La persona del movimiento: el nombre de la cuenta de préstamo en un extremo, o `null`. */
export function personaDe(m: MovimientoFiltrable, personas: Personas): string | null {
  for (const cuenta of [m.cuentaDestino, m.cuentaOrigen]) {
    const nombre = cuenta && personas.get(cuenta.id);
    if (nombre) return nombre;
  }
  return null;
}

function sinCategoria(m: MovimientoFiltrable): boolean {
  return m.tipo !== "transferencia" && m.categoria === null && m.partes.length === 0;
}

function categoriasDe(m: MovimientoFiltrable): Ref[] {
  return m.categoria ? [m.categoria] : m.partes.map((p) => p.categoria);
}

function cuentasDe(m: MovimientoFiltrable): Ref[] {
  return [m.cuentaOrigen, m.cuentaDestino].filter((c): c is Ref => c !== null);
}

export function coincide(m: MovimientoFiltrable, f: Filtros, personas: Personas): boolean {
  if (f.tipo !== null && m.tipo !== f.tipo) return false;
  if (f.cuentaId !== null && !cuentasDe(m).some((c) => c.id === f.cuentaId)) return false;
  if (f.categoriaId !== null) {
    if (f.categoriaId === SIN_CATEGORIA ? !sinCategoria(m) : !categoriasDe(m).some((c) => c.id === f.categoriaId)) return false;
  }
  const persona = personaDe(m, personas);
  if (f.persona !== null && persona !== f.persona) return false;
  const texto = normalizar(f.texto.trim());
  if (texto) {
    const pajar = [m.descripcion ?? "", ...categoriasDe(m).map((c) => c.nombre), ...cuentasDe(m).map((c) => c.nombre), persona ?? ""];
    if (!normalizar(pajar.join(" ")).includes(texto)) return false;
  }
  return true;
}

export function filtrar<M extends MovimientoFiltrable>(movimientos: readonly M[], f: Filtros, personas: Personas): M[] {
  return movimientos.filter((m) => coincide(m, f, personas));
}

/** Movimientos del mismo día juntos, en el orden en que llegan (la API ya ordena por fecha desc). */
export function agruparPorDia<M extends { fecha: string }>(movimientos: readonly M[]): { fecha: string; movimientos: M[] }[] {
  const grupos: { fecha: string; movimientos: M[] }[] = [];
  for (const m of movimientos) {
    const ultimo = grupos.at(-1);
    if (ultimo && ultimo.fecha === m.fecha) ultimo.movimientos.push(m);
    else grupos.push({ fecha: m.fecha, movimientos: [m] });
  }
  return grupos;
}

export type Opcion = { valor: string; etiqueta: string };

const porNombre = (a: Opcion, b: Opcion) => a.etiqueta.localeCompare(b.etiqueta, "es");

/**
 * Opciones de cada filtro a partir de los movimientos del mes: solo lo que
 * aparece, en orden alfabético. «Sin categoría» al final si hay alguno.
 */
export function opcionesDe(movimientos: readonly MovimientoFiltrable[], personas: Personas) {
  const cuentas = new Map<string, string>();
  const categorias = new Map<string, string>();
  const nombres = new Set<string>();
  let haySinCategoria = false;
  for (const m of movimientos) {
    for (const c of cuentasDe(m)) if (!personas.has(c.id)) cuentas.set(c.id, c.nombre);
    for (const c of categoriasDe(m)) categorias.set(c.id, c.nombre);
    if (sinCategoria(m)) haySinCategoria = true;
    const persona = personaDe(m, personas);
    if (persona) nombres.add(persona);
  }
  const lista = (mapa: Map<string, string>) => [...mapa].map(([valor, etiqueta]) => ({ valor, etiqueta })).sort(porNombre);
  return {
    cuentas: lista(cuentas),
    categorias: [...lista(categorias), ...(haySinCategoria ? [{ valor: SIN_CATEGORIA, etiqueta: "Sin categoría" }] : [])],
    personas: [...nombres].map((n) => ({ valor: n, etiqueta: n })).sort(porNombre),
  };
}
