import type { TipoCaptura as TipoMovimiento } from "@/domain/movimiento/cuerpo";

type Props = {
  valor: TipoMovimiento;
  alCambiar: (tipo: TipoMovimiento) => void;
  /**
   * `segmentado` (escritorio): tres tramos en una caja, el activo en tinta.
   * `pestanas` (móvil): texto con raya bajo el activo; la transferencia se llama «Transferir».
   */
  variante?: "segmentado" | "pestanas";
};

const TIPOS: readonly TipoMovimiento[] = ["gasto", "ingreso", "transferencia"];

const ROTULOS: Record<"segmentado" | "pestanas", Record<TipoMovimiento, string>> = {
  segmentado: { gasto: "Gasto", ingreso: "Ingreso", transferencia: "Transferencia" },
  pestanas: { gasto: "Gasto", ingreso: "Ingreso", transferencia: "Transferir" },
};

/** Selector del tipo de movimiento. Cada opción es un interruptor (`aria-pressed`). */
export function SelectorTipo({ valor, alCambiar, variante = "segmentado" }: Props) {
  if (variante === "pestanas") {
    return (
      <div role="group" aria-label="Tipo" className="flex min-w-0 gap-4">
        {TIPOS.map((tipo) => {
          const activo = tipo === valor;
          return (
            <button
              key={tipo}
              type="button"
              aria-pressed={activo}
              onClick={() => alCambiar(tipo)}
              className={`h-11 shrink-0 border-b text-cuerpo ${
                activo ? "border-raya font-semibold text-texto" : "border-transparent text-secundario"
              }`}
            >
              {ROTULOS.pestanas[tipo]}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div role="group" aria-label="Tipo" className="grid grid-cols-3 overflow-hidden rounded-campo border border-linea">
      {TIPOS.map((tipo, i) => {
        const activo = tipo === valor;
        return (
          <button
            key={tipo}
            type="button"
            aria-pressed={activo}
            onClick={() => alCambiar(tipo)}
            className={`h-10 text-cuerpo ${i > 0 ? "border-l border-linea" : ""} ${
              activo ? "bg-texto font-semibold text-fondo" : "bg-superficie text-secundario hover:text-texto"
            }`}
          >
            {ROTULOS.segmentado[tipo]}
          </button>
        );
      })}
    </div>
  );
}
