import { Check } from "lucide-react";

type Props = {
  /** `id` del input; enlaza la descripción. */
  nombre: string;
  rotulo: string;
  descripcion?: string;
  marcada: boolean;
  alCambiar: (marcada: boolean) => void;
  deshabilitado?: boolean;
  /** Sin rótulo visible (casilla de selección de una fila): el rótulo queda para el lector de pantalla. */
  rotuloOculto?: boolean;
};

/**
 * Casilla de verificación: un `<input type="checkbox">` real, dibujado como
 * cuadro de 18 px (borde `secundario`: un control pide 3:1 y `terciario` da 2,8; marcada, tinta llena con la marca en
 * `fondo`). Toda la fila es el control: rótulo en cuerpo 600 (secundario si
 * no está marcada) y descripción en `etiqueta` secundaria. A diferencia de
 * `OpcionUnica`, no es una elección exclusiva.
 */
export function Casilla({ nombre, rotulo, descripcion, marcada, alCambiar, deshabilitado = false, rotuloOculto = false }: Props) {
  const idDescripcion = `${nombre}-descripcion`;
  if (rotuloOculto) {
    return (
      <label
        className={`flex size-11 items-center justify-center has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-marca ${
          deshabilitado ? "cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <input
          id={nombre}
          type="checkbox"
          checked={marcada}
          disabled={deshabilitado}
          onChange={(e) => alCambiar(e.currentTarget.checked)}
          aria-label={rotulo}
          className="sr-only"
        />
        <span
          aria-hidden
          className={`flex size-[18px] items-center justify-center rounded-muestra border ${
            marcada ? "border-texto bg-texto text-fondo" : "border-secundario"
          }`}
        >
          {marcada && <Check size={14} strokeWidth={2} />}
        </span>
      </label>
    );
  }
  return (
    <label
      className={`grid min-h-11 grid-cols-[18px_minmax(0,1fr)] items-start gap-x-3 py-1 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-marca ${
        deshabilitado ? "cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <input
        id={nombre}
        type="checkbox"
        checked={marcada}
        disabled={deshabilitado}
        onChange={(e) => alCambiar(e.currentTarget.checked)}
        aria-describedby={descripcion ? idDescripcion : undefined}
        className="sr-only"
      />
      <span
        aria-hidden
        className={`mt-0.5 flex size-[18px] items-center justify-center rounded-muestra border ${
          marcada ? "border-texto bg-texto text-fondo" : "border-secundario"
        }`}
      >
        {marcada && <Check size={14} strokeWidth={2} />}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={`text-cuerpo font-semibold ${marcada ? "text-texto" : "text-secundario"}`}>{rotulo}</span>
        {descripcion && (
          <span id={idDescripcion} className="text-etiqueta font-normal text-secundario">
            {descripcion}
          </span>
        )}
      </span>
    </label>
  );
}
