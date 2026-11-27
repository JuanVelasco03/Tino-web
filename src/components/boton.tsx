import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** `primario`: tinta llena. `secundario`: hoja con línea. `texto`: sin caja, en latón. */
  variante?: "primario" | "secundario" | "texto";
  /** Cifra que acompaña a la acción («Registrar gasto 18.500»). Va en mono. */
  monto?: string;
  /**
   * 44 px en vez de 48: botón de texto dentro de una fila o un aviso, que
   * conserva el objetivo táctil sin agrandar el renglón. Es una prop y no un
   * `h-11` en `className`, que perdía contra el `h-12` de la base.
   */
  compacto?: boolean;
};

const BASE =
  "presion inline-flex items-center gap-3 rounded-campo text-cuerpo disabled:cursor-not-allowed";

const VARIANTES = {
  primario: "bg-texto px-6 font-semibold text-fondo enabled:hover:bg-texto/85 disabled:bg-hundido disabled:text-terciario",
  secundario: "border border-linea bg-superficie px-6 font-medium hover:border-secundario disabled:text-terciario disabled:hover:border-linea",
  texto: "px-1 font-semibold text-marca-texto underline decoration-transparent decoration-1 underline-offset-4 enabled:hover:decoration-current disabled:text-terciario",
} as const;

/** C6 · Botones. Sin sombra; el relieve lo da el color y la línea. */
export function Boton({ variante = "primario", monto, compacto = false, children, className = "", ...resto }: Props) {
  return (
    <button type="button" className={`${BASE} ${compacto ? "h-11" : "h-12"} ${VARIANTES[variante]} ${className}`} {...resto}>
      {children}
      {monto !== undefined && <span className="font-mono font-medium tabular-nums">{monto}</span>}
    </button>
  );
}

/** Enlace con aspecto de botón (C6): primario en tinta, secundario en hoja con línea. 48 px. Cede al pulsar (`presion`) como `Boton`. */
export const BOTON_ENLACE = {
  primario: "presion inline-flex h-12 items-center justify-center gap-3 rounded-campo bg-texto px-6 text-cuerpo font-semibold text-fondo hover:bg-texto/85",
  secundario: "presion inline-flex h-12 items-center justify-center gap-3 rounded-campo border border-linea bg-superficie px-6 text-cuerpo font-medium hover:border-secundario",
} as const;
