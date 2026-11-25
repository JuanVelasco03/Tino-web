"use client";

import Link from "next/link";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Una opción de un filtro. Con `href`, elegirla navega (la fecha cambia de mes por URL). */
export type OpcionFiltro = { valor: string | null; etiqueta: string; href?: string };

export type DefinicionFiltro = {
  clave: string;
  /** «Cuenta». */
  rotulo: string;
  /** Elegido; `null` = «Todas». */
  valor: string | null;
  opciones: readonly OpcionFiltro[];
  /** Sin `href` en la opción, se llama al elegirla. */
  alElegir?: (valor: string | null) => void;
  /** Siempre muestra su valor y no cuenta como filtro activo (la fecha). */
  fijo?: boolean;
};

type Props = {
  texto: string;
  alCambiarTexto: (texto: string) => void;
  filtros: readonly DefinicionFiltro[];
  /** Hay algo que limpiar: muestra «Limpiar filtros». */
  activos: boolean;
  alLimpiar: () => void;
};

function etiquetaDe(f: DefinicionFiltro): string {
  return f.opciones.find((o) => o.valor === f.valor)?.etiqueta ?? f.opciones[0]?.etiqueta ?? "";
}

const activo = (f: DefinicionFiltro) => !f.fijo && f.valor !== null;

/** Lista de opciones. Escritorio: 36 px por opción, bajo su botón; móvil: 44 px, bajo la fila. */
function Panel({ filtro, id, alCerrar, className }: { filtro: DefinicionFiltro; id: string; alCerrar: () => void; className: string }) {
  return (
    <ul id={id} aria-label={filtro.rotulo} className={`asentar z-10 min-w-[200px] rounded-campo border border-raya bg-superficie py-1 ${className}`}>
      {filtro.opciones.map((o) => {
        const elegida = o.valor === filtro.valor;
        const clase = `flex h-11 w-full items-center justify-between gap-3 px-3 text-left text-cuerpo hover:bg-hundido md:h-9 ${
          elegida ? "font-semibold" : ""
        }`;
        const contenido = (
          <>
            <span className="truncate">{o.etiqueta}</span>
            {elegida && <Check size={16} strokeWidth={1.5} aria-hidden className="shrink-0" />}
          </>
        );
        return (
          <li key={o.valor ?? ""}>
            {o.href ? (
              <Link href={o.href} aria-current={elegida ? "true" : undefined} onClick={alCerrar} className={clase}>
                {contenido}
              </Link>
            ) : (
              <button
                type="button"
                aria-pressed={elegida}
                onClick={() => {
                  filtro.alElegir?.(o.valor);
                  alCerrar();
                }}
                className={clase}
              >
                {contenido}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Buscador y filtros del libro de movimientos. Cada filtro es un botón
 * «Rótulo Valor ⌄» que despliega sus opciones; activo, su borde pasa a tinta y
 * el valor a 600. En móvil la fila de botones se desplaza en horizontal, cada
 * botón muestra solo el valor (o el rótulo si está en «Todas») y las opciones
 * se abren a todo el ancho bajo la fila. Escape o un clic fuera cierran.
 */
export function FiltrosMovimientos({ texto, alCambiarTexto, filtros, activos, alLimpiar }: Props) {
  const [abierto, setAbierto] = useState<string | null>(null);
  const raiz = useRef<HTMLDivElement>(null);
  const filtroAbierto = filtros.find((f) => f.clave === abierto) ?? null;

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(null);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAbierto(null);
      raiz.current?.querySelector<HTMLButtonElement>(`[data-filtro="${abierto}"]`)?.focus();
    };
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  const cerrar = () => setAbierto(null);

  return (
    <div ref={raiz} className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
        {/* El contorno de foco rodea la caja entera, como en `CampoMonto`, no solo el texto. */}
        <label className="flex h-11 items-center gap-2 rounded-campo border border-linea bg-superficie pl-3 focus-within:border-raya has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-marca md:h-9 md:w-[300px]">
          <Search size={18} strokeWidth={1.5} aria-hidden className="shrink-0 text-secundario" />
          <span className="sr-only">Buscar</span>
          <input
            type="search"
            value={texto}
            onChange={(e) => alCambiarTexto(e.target.value)}
            placeholder="Buscar concepto, cuenta o categoría"
            className="min-w-0 flex-1 bg-transparent text-cuerpo outline-none! placeholder:text-secundario [&::-webkit-search-cancel-button]:appearance-none"
          />
          {/* La «×» nativa no sigue la paleta: esta borra la búsqueda en un objetivo de 44 px (36 en escritorio). */}
          {texto !== "" ? (
            <button
              type="button"
              aria-label="Borrar búsqueda"
              onClick={() => alCambiarTexto("")}
              className="flex h-full w-11 shrink-0 items-center justify-center text-secundario hover:text-texto md:w-9"
            >
              <X size={16} strokeWidth={1.5} aria-hidden />
            </button>
          ) : (
            <span aria-hidden className="w-3 shrink-0" />
          )}
        </label>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
          {filtros.map((f) => {
            const esActivo = activo(f);
            const valor = etiquetaDe(f);
            return (
              <div key={f.clave} className="shrink-0 md:relative">
                <button
                  type="button"
                  data-filtro={f.clave}
                  aria-expanded={abierto === f.clave}
                  aria-controls={`filtro-${f.clave}`}
                  onClick={() => setAbierto(abierto === f.clave ? null : f.clave)}
                  className={`presion flex h-11 items-center gap-2 rounded-campo border bg-superficie px-3 text-cuerpo md:h-9 md:text-etiqueta ${
                    esActivo ? "border-texto" : "border-linea hover:border-secundario"
                  }`}
                >
                  <span className="hidden font-normal text-secundario md:inline">{f.rotulo}</span>
                  <span className={`md:hidden ${esActivo ? "font-semibold" : ""}`}>{esActivo || f.fijo ? valor : f.rotulo}</span>
                  <span className={`hidden md:inline ${esActivo ? "font-semibold" : ""}`}>{valor}</span>
                  <ChevronDown
                    size={16}
                    strokeWidth={1.5}
                    aria-hidden
                    className={`text-secundario motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-llegada ${
                      abierto === f.clave ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {abierto === f.clave && (
                  <Panel filtro={f} id={`filtro-${f.clave}`} alCerrar={cerrar} className="absolute left-0 top-full mt-1 hidden md:block" />
                )}
              </div>
            );
          })}
          {activos && (
            <button type="button" onClick={alLimpiar} className="h-11 shrink-0 px-2 text-etiqueta font-semibold text-marca-texto md:h-9">
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {filtroAbierto && <Panel filtro={filtroAbierto} id={`filtro-${filtroAbierto.clave}-movil`} alCerrar={cerrar} className="md:hidden" />}
    </div>
  );
}
