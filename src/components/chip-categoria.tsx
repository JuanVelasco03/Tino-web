import Link from "next/link";
import { Check } from "lucide-react";

type Props = {
  etiqueta: string;
  /**
   * `sugerida`: la puso una regla de texto (seleccionada, con «auto» en latón).
   * `normal`: una categoría cualquiera. `sin-clasificar`: borde punteado.
   */
  estado?: "sugerida" | "normal" | "sin-clasificar";
  /** Solo para `normal`: borde en tinta y marca de verificación. */
  seleccionada?: boolean;
  /** Sin ella, el chip solo presenta. */
  onClick?: () => void;
  deshabilitado?: boolean;
  /** Con él, el chip es un enlace (sin mover el scroll) y `seleccionada` marca la página actual. */
  href?: string;
  /** Cifra tras el rótulo, en mono cifra-xs secundaria («US$ 7.750,00»). */
  detalle?: string;
  /** Solo presenta, sin control: un `<span>` neutro y compacto (la categoría «Ajuste» en el libro). */
  estatico?: boolean;
};

const BASE = "presion inline-flex h-11 shrink-0 items-center rounded-campo border px-3 text-cuerpo whitespace-nowrap disabled:cursor-not-allowed md:h-9";

/**
 * C5 · Chip de categoría. En móvil crece a 44 px de alto. Con `onClick` es un
 * interruptor: `aria-pressed` dice si está marcado (elegido o sugerido).
 */
export function ChipCategoria({ etiqueta, estado = "normal", seleccionada = false, onClick, deshabilitado = false, href, detalle, estatico = false }: Props) {
  if (estatico) {
    // Al alto del renglón (20 + 2 de borde = 22 px, como el cuerpo): no engrosa la fila del libro.
    return (
      <span className="inline-flex shrink-0 items-center rounded-campo border border-linea bg-superficie px-2 text-etiqueta whitespace-nowrap">{etiqueta}</span>
    );
  }

  if (href) {
    return (
      <Link
        href={href}
        scroll={false}
        aria-current={seleccionada ? "page" : undefined}
        className={`${BASE} gap-2 bg-superficie ${seleccionada ? "border-texto font-medium" : "border-linea hover:border-secundario"}`}
      >
        {seleccionada && <Check size={16} strokeWidth={1.5} aria-hidden />}
        {etiqueta}
        {detalle && <span className="font-mono text-cifra-xs tabular-nums text-secundario">{detalle}</span>}
      </Link>
    );
  }

  if (estado === "sin-clasificar") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={deshabilitado}
        className={`${BASE} border-dashed border-terciario text-secundario`}
      >
        {etiqueta}
      </button>
    );
  }

  const marcada = estado === "sugerida" || seleccionada;

  return (
    <button
      type="button"
      aria-pressed={marcada}
      onClick={onClick}
      disabled={deshabilitado}
      className={`${BASE} gap-2 bg-superficie ${marcada ? "border-texto font-medium" : "border-linea hover:border-secundario disabled:hover:border-linea"}`}
    >
      {marcada && <Check size={16} strokeWidth={1.5} aria-hidden />}
      {etiqueta}
      {estado === "sugerida" && (
        <span className="font-mono text-rotulo font-normal text-marca-texto">auto</span>
      )}
    </button>
  );
}
