import { ROTULO_DESTINO, type DestinoNavegacion } from "../iconos";

/**
 * Destinos del menú de la aplicación. Las secciones futuras se ven y están
 * deshabilitadas («Próximamente»): el menú no cambia de forma con cada spec.
 * Hoy navegan «Resumen», «Movimientos», «Cuentas», «Deudas y préstamos» y
 * «Recurrentes»; «Registrar»
 * abre la captura.
 */
export type EntradaMenu = {
  destino: DestinoNavegacion;
  rotulo: string;
  /** `null` mientras la sección no existe. */
  href: string | null;
  habilitado: boolean;
};

function entrada(destino: DestinoNavegacion, href: string | null = null, rotulo = ROTULO_DESTINO[destino]): EntradaMenu {
  return { destino, rotulo, href, habilitado: href !== null };
}

export const TITULO_PROXIMAMENTE = "Próximamente";

/** Las ocho secciones de la barra lateral, en el orden del diseño. */
export const ENTRADAS: readonly EntradaMenu[] = [
  entrada("resumen", "/resumen"),
  entrada("movimientos", "/movimientos"),
  entrada("cuentas", "/cuentas"),
  entrada("deudas", "/deudas", "Deudas y préstamos"),
  entrada("recurrentes", "/recurrentes"),
  entrada("inversiones"),
  entrada("metas"),
  entrada("avisos"),
];

/**
 * «Registrar» (captura rápida): botón aparte en la barra lateral y pestaña
 * central en móvil. No navega: abre la captura sobre la página actual.
 */
export const REGISTRAR: EntradaMenu = { ...entrada("registrar"), habilitado: true };

const EN_PESTANAS: readonly DestinoNavegacion[] = ["resumen", "movimientos", "cuentas"];

function buscar(destino: DestinoNavegacion): EntradaMenu {
  const encontrada = ENTRADAS.find((e) => e.destino === destino);
  if (!encontrada) throw new Error(`Destino sin entrada: ${destino}`);
  return encontrada;
}

/** Barra inferior en móvil: Resumen, Movimientos, Registrar, Cuentas (y «Más», aparte). */
export const PESTANAS: readonly EntradaMenu[] = [buscar("resumen"), buscar("movimientos"), REGISTRAR, buscar("cuentas")];

/** Lo que no cabe en la barra inferior: va en la hoja «Más». */
export const ENTRADAS_MAS: readonly EntradaMenu[] = ENTRADAS.filter((e) => !EN_PESTANAS.includes(e.destino));

/** La entrada está activa si la ruta es la suya o cuelga de ella. */
export function estaActiva(entrada: EntradaMenu, ruta: string): boolean {
  if (!entrada.href) return false;
  return ruta === entrada.href || ruta.startsWith(`${entrada.href}/`);
}
