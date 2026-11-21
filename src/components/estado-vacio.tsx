import { Plus } from "lucide-react";
import { EnlaceTexto } from "./enlace-texto";

type Props = {
  /** Rótulo de la sección: «Movimientos · noviembre». */
  rotulo: string;
  titulo: string;
  detalle: string;
  /**
   * Enlace; botón (`alPulsar`) si la acción no navega, como abrir la captura;
   * o botón deshabilitado («Próximamente») mientras el destino no existe.
   * `scroll: false` conserva la posición (p. ej. al abrir un panel por URL).
   * `sinMas` quita el «+» cuando la acción no crea nada («Ver todos»).
   */
  accion:
    | { etiqueta: string; href: string; scroll?: boolean; sinMas?: boolean }
    | { etiqueta: string; alPulsar: () => void }
    | { etiqueta: string; deshabilitada: true };
};

/** Misma caja que `EnlaceTexto` (44 px), para que el estado deshabilitado no salte. */
const ACCION = "mt-1 inline-flex h-11 items-center gap-2 text-cuerpo font-semibold";
const ACCION_DESHABILITADA =
  "mt-1 inline-flex h-11 cursor-not-allowed items-center gap-2 text-cuerpo font-semibold text-terciario";

/** C7 · Estado vacío, primer día: la página en blanco, con renglones. */
export function EstadoVacio({ rotulo, titulo, detalle, accion }: Props) {
  return (
    <section>
      <div className="flex items-baseline justify-between border-b border-raya pb-2">
        <h2 className="text-rotulo uppercase">{rotulo}</h2>
        <span className="font-mono text-cifra-s text-terciario">0</span>
      </div>
      <div aria-hidden>
        <div className="h-11 border-b border-linea" />
        <div className="h-11 border-b border-linea" />
        <div className="h-11 border-b border-linea" />
      </div>
      <div className="flex flex-col items-start gap-1 pt-6">
        <p className="text-cuerpo font-semibold">{titulo}</p>
        <p className="text-etiqueta font-normal text-secundario">{detalle}</p>
        {"href" in accion ? (
          <EnlaceTexto href={accion.href} scroll={accion.scroll} className="mt-1">
            {!accion.sinMas && <Plus size={16} strokeWidth={1.5} aria-hidden />}
            {accion.etiqueta}
          </EnlaceTexto>
        ) : "alPulsar" in accion ? (
          // Mismo aspecto que `EnlaceTexto`, pero no navega.
          <button type="button" onClick={accion.alPulsar} className={`${ACCION} text-marca-texto`}>
            <Plus size={16} strokeWidth={1.5} aria-hidden />
            {accion.etiqueta}
          </button>
        ) : (
          <button
            type="button"
            aria-disabled="true"
            title="Próximamente"
            className={ACCION_DESHABILITADA}
          >
            <Plus size={16} strokeWidth={1.5} aria-hidden />
            {accion.etiqueta}
          </button>
        )}
      </div>
    </section>
  );
}
