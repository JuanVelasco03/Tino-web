/**
 * Antelación por tipo de aviso: rótulos, descripciones, opciones y el estado
 * optimista de un cambio. Las opciones válidas y su orden los da la API
 * (`opciones` de cada tipo); aquí solo se nombran.
 */
import type { AvisoConfig, ConfigCuerpo, TipoAviso } from "./presentacion";

export type InfoTipo = { rotulo: string; descripcion: string; prefijo: string };

export const TIPOS: Record<TipoAviso, InfoTipo> = {
  recurrente: {
    rotulo: "Recurrentes por confirmar",
    descripcion: "Cuando aparecen en la bandeja, antes de vencer.",
    prefijo: "Avisar",
  },
  cobro: { rotulo: "Cobros pendientes", descripcion: "El día acordado con quien te debe.", prefijo: "Repetir después" },
  deuda: { rotulo: "Lo que debes", descripcion: "Antes de la fecha que acordaste con quien te prestó.", prefijo: "Avisar" },
  precio_manual: {
    rotulo: "Precio manual sin actualizar",
    descripcion: "Inversiones con cotización ingresada a mano.",
    prefijo: "Después de",
  },
};

const ROTULOS: Record<TipoAviso, Readonly<Record<number, string>>> = {
  recurrente: { 1: "1 día antes", 3: "3 días antes", 5: "5 días antes", 7: "1 semana antes" },
  cobro: { 0: "Nunca", 14: "Cada 2 semanas", 30: "Cada mes" },
  deuda: { 1: "1 día antes", 3: "3 días antes", 7: "1 semana antes" },
  precio_manual: { 3: "3 días", 7: "7 días", 14: "14 días" },
};

/** Rótulo de una opción. Un valor que no está en la tabla: «{n} días» (con «antes» si el prefijo es «Avisar»). */
export function rotuloOpcion(tipo: TipoAviso, dias: number): string {
  const conocido = ROTULOS[tipo][dias];
  if (conocido !== undefined) return conocido;
  const base = dias === 1 ? "1 día" : `${dias} días`;
  return TIPOS[tipo].prefijo === "Avisar" ? `${base} antes` : base;
}

/** Estado optimista de `PATCH /avisos/config/:tipo`: `dias` sin `activo` enciende el tipo, como la API. */
export function aplicarCambio(config: readonly AvisoConfig[], tipo: TipoAviso, cambio: ConfigCuerpo): AvisoConfig[] {
  return config.map((c) => {
    if (c.tipo !== tipo) return c;
    const siguiente = { ...c };
    if (cambio.dias !== undefined) {
      siguiente.dias = cambio.dias;
      siguiente.activo = cambio.activo ?? true;
    } else if (cambio.activo !== undefined) {
      siguiente.activo = cambio.activo;
    }
    return siguiente;
  });
}

/** Un día fijo: el nombre genérico de una zona no depende del reloj. */
const REFERENCIA = new Date(Date.UTC(2026, 0, 1));

/**
 * `"America/Bogota"` → «hora de Colombia». Si `Intl` no la nombra o la zona no
 * existe, la zona tal cual. Una zona sin horario de verano no tiene nombre
 * genérico en CLDR y `Intl` devuelve el estándar («hora estándar de
 * Colombia»): se quita «estándar», que es el nombre genérico que se pidió.
 */
export function zonaLegible(zona: string): string {
  try {
    const partes = new Intl.DateTimeFormat("es-CO", { timeZone: zona, timeZoneName: "longGeneric" }).formatToParts(REFERENCIA);
    const nombre = partes.find((p) => p.type === "timeZoneName")?.value;
    if (!nombre) return zona;
    const generico = nombre.replace(/^hora estándar de /i, "hora de ");
    return generico.charAt(0).toLowerCase() + generico.slice(1);
  } catch {
    return zona;
  }
}
