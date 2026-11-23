import type { ReactNode } from "react";
import { MensajeError } from "./mensaje-error";

export type Opcion<T extends string> = {
  valor: T;
  rotulo: string;
  /** Ícono opcional entre el círculo y el rótulo (Lucide, 20 px). */
  icono?: ReactNode;
  /** Explicación bajo el rótulo, en `etiqueta` secundaria. */
  detalle?: string;
  /** Solo esta opción no se puede elegir (el grupo sigue activo). */
  deshabilitada?: boolean;
};

type Props<T extends string> = {
  /** `name` de los radios: agrupa el teclado nativo (flechas). */
  nombre: string;
  /** Rótulo del grupo, visible arriba (11 px, mayúsculas). */
  etiqueta: string;
  opciones: readonly Opcion<T>[];
  valor: T;
  alCambiar: (valor: T) => void;
  deshabilitado?: boolean;
  /** Mensaje de error bajo el grupo. */
  error?: string;
};

/**
 * C34 · Opción única. Filas de 44 px con un `<input type="radio">` real,
 * dibujado como círculo de 18 px. Teclado y lector de pantalla nativos.
 */
export function OpcionUnica<T extends string>({
  nombre,
  etiqueta,
  opciones,
  valor,
  alCambiar,
  deshabilitado = false,
  error,
}: Props<T>) {
  const idEtiqueta = `${nombre}-etiqueta`;
  const idError = `${nombre}-error`;

  return (
    <div className="flex flex-col gap-1">
      <span id={idEtiqueta} className="text-rotulo uppercase text-secundario">
        {etiqueta}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={idEtiqueta}
        aria-describedby={error ? idError : undefined}
        aria-invalid={error ? true : undefined}
        className="divide-y divide-linea"
      >
        {opciones.map((opcion) => {
          const elegida = opcion.valor === valor;
          const inactiva = deshabilitado || opcion.deshabilitada === true;
          return (
            <label
              key={opcion.valor}
              className={`flex min-h-11 items-center gap-3 text-cuerpo has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-marca ${
                opcion.detalle ? "py-2" : ""
              } ${inactiva ? "cursor-not-allowed text-terciario" : "cursor-pointer"}`}
            >
              <input
                type="radio"
                name={nombre}
                value={opcion.valor}
                checked={elegida}
                disabled={inactiva}
                onChange={() => alCambiar(opcion.valor)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={`flex size-[18px] shrink-0 items-center justify-center rounded-full border ${
                  elegida ? "border-texto" : "border-terciario"
                }`}
              >
                {elegida && <span className="size-2.5 rounded-full bg-texto" />}
              </span>
              {opcion.icono && <span className="flex text-secundario">{opcion.icono}</span>}
              {opcion.detalle ? (
                <span className="flex flex-col">
                  <span className={elegida ? "font-semibold" : ""}>{opcion.rotulo}</span>
                  <span className={`text-etiqueta font-normal ${inactiva ? "" : "text-secundario"}`}>{opcion.detalle}</span>
                </span>
              ) : (
                <span className={elegida ? "font-semibold" : ""}>{opcion.rotulo}</span>
              )}
            </label>
          );
        })}
      </div>
      {error && <MensajeError id={idError} mensaje={error} />}
    </div>
  );
}
