import { Check, Minus } from "lucide-react";
import { montoConSigno, textoSeleccionados } from "@/domain/cuenta/detalle";
import { Boton } from "../boton";
import { ALTO_PESTANAS } from "../menu/barra-pestanas";

type Props = {
  cantidad: number;
  /** Σ efectos de lo elegido (N-23). */
  suma: bigint;
  alMarcar: () => void;
  alCancelar: () => void;
  pendiente?: boolean;
  /** Móvil: fija abajo, sobre las pestañas. Escritorio: sobre la tabla. */
  formato?: "escritorio" | "movil";
};

/**
 * Barra de selección del historial (SPEC 13), solo con selección. Escritorio:
 * fondo hundido, casilla «−» que limpia, «{3} seleccionados · {−29.000}»,
 * «Marcar como conciliados» (primario con ✓) y «Cancelar». Móvil: fija sobre
 * las pestañas, con la cuenta y el botón.
 */
export function BarraSeleccion({ cantidad, suma, alMarcar, alCancelar, pendiente = false, formato = "escritorio" }: Props) {
  const texto = (
    <span className="min-w-0 text-cuerpo">
      {textoSeleccionados(cantidad)} · <span className="font-mono text-cifra-s tabular-nums">{montoConSigno(suma)}</span>
    </span>
  );

  if (formato === "movil") {
    return (
      <div
        role="region"
        aria-label="Selección"
        className="fixed inset-x-0 z-10 flex items-center justify-between gap-3 border-t border-raya bg-hundido px-4 py-2 md:hidden"
        style={{ bottom: ALTO_PESTANAS }}
      >
        {texto}
        <Boton onClick={alMarcar} disabled={pendiente} className="shrink-0">
          Marcar como conciliados
        </Boton>
      </div>
    );
  }

  return (
    <div role="region" aria-label="Selección" className="flex items-center gap-3 rounded-campo bg-hundido px-3 py-1">
      <button
        type="button"
        onClick={alCancelar}
        aria-label="Quitar la selección"
        className="flex size-11 items-center justify-center"
      >
        <span aria-hidden className="flex size-[18px] items-center justify-center rounded-muestra border border-texto bg-texto text-fondo">
          <Minus size={14} strokeWidth={2} />
        </span>
      </button>
      {texto}
      <div className="ml-auto flex items-center gap-3">
        <Boton onClick={alMarcar} disabled={pendiente}>
          <Check size={18} strokeWidth={1.5} aria-hidden />
          Marcar como conciliados
        </Boton>
        <Boton variante="texto" onClick={alCancelar} disabled={pendiente}>
          Cancelar
        </Boton>
      </div>
    </div>
  );
}
