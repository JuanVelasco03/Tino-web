import { enMoneda } from "@/domain/inversion/presentacion";
import type { InversionResumen } from "@/domain/inversion/tipos";
import { ChipCategoria } from "../chip-categoria";
import { rutaInversion } from "./rutas";

type Props = {
  inversiones: readonly InversionResumen[];
  /** La abierta; una archivada no está en la lista y no marca ninguna. */
  elegida: string | null;
};

/**
 * Selector de inversiones (N-46): con dos o más, una fila de chips con nombre
 * y valor de mercado en su moneda, enlazados a `?inversion=<id>` sin mover la
 * página. Envuelven a varias filas. Con una sola, no hay selector.
 */
export function SelectorInversiones({ inversiones, elegida }: Props) {
  if (inversiones.length < 2) return null;
  return (
    <nav aria-label="Inversiones" className="flex flex-wrap gap-2">
      {inversiones.map((i) => (
        <ChipCategoria
          key={i.id}
          etiqueta={i.nombre}
          detalle={enMoneda(i.valorMercado, i.moneda)}
          href={rutaInversion(i.id)}
          seleccionada={i.id === elegida}
        />
      ))}
    </nav>
  );
}
