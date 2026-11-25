import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** `primario`: tinta llena. `secundario`: hoja con línea. `texto`: sin caja, en latón. */
  variante?: "primario" | "secundario" | "texto";
  /** Cifra que acompaña a la acción («Registrar gasto 18.500»). Va en mono. */
  monto?: string;
};

const BASE =
  "presion inline-flex h-12 items-center gap-3 rounded-campo text-cuerpo disabled:cursor-not-allowed";

const VARIANTES = {
  primario: "bg-texto px-6 font-semibold text-fondo disabled:bg-hundido disabled:text-terciario",
  secundario: "border border-linea bg-superficie px-6 font-medium hover:border-secundario disabled:text-terciario disabled:hover:border-linea",
  texto: "px-1 font-semibold text-marca-texto disabled:text-terciario",
} as const;

/** C6 · Botones. Sin sombra; el relieve lo da el color y la línea. */
export function Boton({ variante = "primario", monto, children, className = "", ...resto }: Props) {
  return (
    <button type="button" className={`${BASE} ${VARIANTES[variante]} ${className}`} {...resto}>
      {children}
      {monto !== undefined && <span className="font-mono font-medium tabular-nums">{monto}</span>}
    </button>
  );
}
