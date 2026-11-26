"use client";

import { ChevronDown, X } from "lucide-react";
import { formatearDinero } from "@/domain/dinero/formato";
import { restante, type ValorParte } from "@/domain/movimiento/partes";
import { Boton } from "../boton";
import { MensajeError } from "../mensaje-error";

type Props = {
  /** Total del movimiento; `null` sin monto (cuenta como 0). */
  total: bigint | null;
  /** `null` = sin dividir: solo se ofrece «Dividir entre categorías». */
  partes: ValorParte[] | null;
  /** Categorías del tipo del movimiento. */
  categorias: readonly { id: string; nombre: string }[];
  alActivar: () => void;
  alDesactivar: () => void;
  alCambiar: (indice: number, cambios: Partial<ValorParte>) => void;
  alAgregar: () => void;
  alQuitar: (indice: number) => void;
  /** «El resto»: completa la última parte con lo que falta. */
  alCompletar: () => void;
  /** Error local (`errorPartes`) o de la API. */
  error?: string | null;
  /** Prefijo de los ids (dos editores en la misma página, p. ej. `/estilos`). */
  idBase: string;
};

function pesos(monto: bigint): string {
  return formatearDinero({ monto, moneda: "COP" }, { omitirCOP: true });
}

/** «Falta asignar 5.000» · «Sobran 2.000» (terracota) · «Las partes suman el total.». */
function Restante({ resto }: { resto: bigint }) {
  if (resto === 0n) return <span className="text-etiqueta font-normal text-secundario">Las partes suman el total.</span>;
  if (resto > 0n)
    return (
      <span className="text-etiqueta font-normal text-secundario">
        Falta asignar <span className="font-mono tabular-nums">{pesos(resto)}</span>
      </span>
    );
  return (
    <span className="text-etiqueta font-normal text-salida-texto">
      Sobran <span className="font-mono tabular-nums">{pesos(-resto)}</span>
    </span>
  );
}

/**
 * Dividir un movimiento entre categorías (N-41): dos o más partes con
 * categoría distinta y monto > 0 que suman el total. Manda el total: el
 * restante se lee en vivo y «El resto» completa la última parte. Cada
 * categoría es un `<select>` nativo con la línea de `CampoSubrayado`; los
 * montos usan el teclado del sistema (el teclado propio es del total).
 */
export function EditorPartes({
  total,
  partes,
  categorias,
  alActivar,
  alDesactivar,
  alCambiar,
  alAgregar,
  alQuitar,
  alCompletar,
  error,
  idBase,
}: Props) {
  if (partes === null) {
    return (
      <Boton compacto variante="texto" onClick={alActivar} className="self-start">
        Dividir entre categorías
      </Boton>
    );
  }

  const resto = restante(total ?? 0n, partes);
  // «El resto» solo si deja la última parte por encima de cero.
  const ultima = partes[partes.length - 1];
  const puedeCompletar = resto !== 0n && ultima !== undefined && restante(total ?? 0n, partes.slice(0, -1)) > 0n;
  const quitables = partes.length > 2;

  return (
    <div role="group" aria-label="Dividir entre categorías" className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-etiqueta text-secundario">Dividir entre categorías</span>
        <Boton compacto variante="texto" onClick={alDesactivar}>
          No dividir
        </Boton>
      </div>

      <ul className="flex flex-col">
        {partes.map((parte, i) => {
          // Cada parte ofrece las categorías que no usa otra.
          const usadas = new Set(partes.filter((_, j) => j !== i).map((p) => p.categoriaId));
          const disponibles = categorias.filter((c) => !usadas.has(c.id));
          const idCategoria = `${idBase}-parte-${i}-categoria`;
          const idMonto = `${idBase}-parte-${i}-monto`;
          return (
            <li key={i} className="grid grid-cols-[minmax(0,1fr)_112px_44px] items-center gap-3">
              <label htmlFor={idCategoria} className="sr-only">
                Categoría de la parte {i + 1}
              </label>
              <span className="relative flex">
                <select
                  id={idCategoria}
                  value={parte.categoriaId ?? ""}
                  onChange={(e) => alCambiar(i, { categoriaId: e.target.value === "" ? null : e.target.value })}
                  className={`h-11 w-full appearance-none truncate rounded-none border-0 border-b border-linea bg-transparent p-0 pr-6 text-cuerpo focus:border-raya ${
                    parte.categoriaId === null ? "text-terciario" : "text-texto"
                  }`}
                >
                  <option value="" disabled>
                    Categoría
                  </option>
                  {disponibles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} strokeWidth={1.5} aria-hidden className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-secundario" />
              </span>
              <label htmlFor={idMonto} className="sr-only">
                Monto de la parte {i + 1}
              </label>
              <input
                id={idMonto}
                value={parte.monto}
                onChange={(e) => alCambiar(i, { monto: e.target.value })}
                inputMode="numeric"
                autoComplete="off"
                placeholder="0"
                className="h-11 w-full rounded-none border-0 border-b border-linea bg-transparent p-0 text-right font-mono text-cifra-s tabular-nums text-texto placeholder:text-terciario focus:border-raya"
              />
              {quitables ? (
                <button
                  type="button"
                  aria-label="Quitar parte"
                  onClick={() => alQuitar(i)}
                  className="flex size-11 items-center justify-center text-secundario hover:text-texto"
                >
                  <X size={18} strokeWidth={1.5} aria-hidden />
                </button>
              ) : (
                <span aria-hidden />
              )}
            </li>
          );
        })}
      </ul>

      {partes.length < categorias.length && (
        <Boton compacto variante="texto" onClick={alAgregar} className="self-start">
          + Agregar parte
        </Boton>
      )}

      <div className="flex min-h-11 items-center justify-between gap-3">
        <Restante resto={resto} />
        {puedeCompletar && (
          <Boton compacto variante="texto" onClick={alCompletar}>
            El resto
          </Boton>
        )}
      </div>

      {error && <MensajeError mensaje={error} />}
    </div>
  );
}
