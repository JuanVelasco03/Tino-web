import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { MensajeError } from "./mensaje-error";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string;
  /** Contenido a la derecha de la etiqueta (p. ej. «¿La olvidaste?»). */
  extra?: ReactNode;
  /** Mensaje bajo el campo: la línea pasa a terracota y el input queda marcado como inválido. */
  error?: string;
  /** Unidad tras el texto, sobre el mismo renglón («%»), en `etiqueta` secundaria. */
  sufijo?: string;
};

/** Campo de una sola línea: etiqueta arriba y texto sobre un renglón, que pasa a raya con el foco. */
export function CampoSubrayado({ etiqueta, extra, error, sufijo, id, className = "", ...resto }: Props) {
  const generado = useId();
  const idCampo = id ?? generado;
  const idError = `${idCampo}-error`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={idCampo} className="flex flex-col gap-1">
        <span className="flex justify-between text-etiqueta font-normal text-secundario">
          <span>{etiqueta}</span>
          {extra}
        </span>
        {sufijo === undefined ? (
          <input
            id={idCampo}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? idError : undefined}
            className={`h-11 rounded-none border-0 border-b bg-transparent p-0 text-[17px] text-texto placeholder:text-terciario ${
              error ? "border-salida" : "border-linea focus:border-raya"
            } ${className}`}
            {...resto}
          />
        ) : (
          // La línea va en la fila: el sufijo queda sobre el mismo renglón que el texto.
          <span className={`flex h-11 items-center gap-2 border-b ${error ? "border-salida" : "border-linea has-[:focus]:border-raya"}`}>
            <input
              id={idCampo}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? idError : undefined}
              className={`h-full min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-[17px] text-texto placeholder:text-terciario ${className}`}
              {...resto}
            />
            <span className="text-etiqueta text-secundario">{sufijo}</span>
          </span>
        )}
      </label>
      {error && <MensajeError id={idError} mensaje={error} />}
    </div>
  );
}
