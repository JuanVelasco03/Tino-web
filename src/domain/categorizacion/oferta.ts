/**
 * RN-11 en la interfaz: la categorización propone, el usuario dispone. Tras
 * registrar, si el usuario eligió a mano o corrigió la propuesta, se le
 * ofrece crear o ajustar la regla. Nunca se hace sola.
 */
import type { Categoria, DecisionCategoria, Propuesta, TipoCaptura as TipoMovimiento } from "../movimiento/cuerpo";

/** Largo máximo de una palabra clave en la API (`PALABRA_CLAVE_LARGA`). */
const MAX_PALABRA_CLAVE = 60;

export type EntradaOferta = {
  tipo: TipoMovimiento;
  descripcion: string;
  categoria: DecisionCategoria;
  /** La propuesta vigente al registrar (`GET /sugerencias` de esa descripción). */
  propuesta: Propuesta | null;
  /** Categorías del tipo, para resolver la elegida por su id. */
  categorias: readonly Categoria[];
  /** Edición: la categoría que tenía el movimiento. Si no cambió, no hay oferta. */
  categoriaAnterior?: string | null;
  /** Con partes no hay una categoría que convertir en regla. */
  dividido: boolean;
};

export type Oferta =
  | { tipo: "crear"; palabraClave: string; categoria: Categoria }
  | { tipo: "ajustar"; reglaId: string; palabraClave: string; categoria: Categoria };

/**
 * - crear: sin propuesta, categoría elegida a mano y descripción no vacía de
 *   hasta 60 caracteres (será la palabra clave).
 * - ajustar: con propuesta y una categoría elegida distinta de la propuesta.
 * - `null` en cualquier otro caso, siempre en transferencia y con partes; en
 *   la edición, también si la categoría es la que ya tenía (no se tocó).
 */
export function ofertaDeRegla(entrada: EntradaOferta): Oferta | null {
  const { tipo, descripcion, categoria, propuesta, categorias, categoriaAnterior, dividido } = entrada;
  if (tipo === "transferencia" || dividido || categoria.modo !== "elegida") return null;
  if (categoriaAnterior !== undefined && categoria.id === categoriaAnterior) return null;

  const elegida = categorias.find((c) => c.id === categoria.id && c.tipo === tipo);
  if (!elegida) return null;

  if (propuesta) {
    if (propuesta.categoria.id === elegida.id) return null;
    return { tipo: "ajustar", reglaId: propuesta.regla.id, palabraClave: propuesta.regla.palabraClave, categoria: elegida };
  }

  const palabraClave = descripcion.trim();
  if (palabraClave === "" || palabraClave.length > MAX_PALABRA_CLAVE) return null;
  return { tipo: "crear", palabraClave, categoria: elegida };
}
