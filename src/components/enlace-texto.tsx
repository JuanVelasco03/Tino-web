import type { ComponentProps } from "react";
import Link from "next/link";

type Props = ComponentProps<typeof Link>;

/**
 * Enlace de acción en latón, sin caja: el hermano de `Boton variante="texto"`
 * cuando la acción navega («+ Nueva cuenta», «Ver archivadas», «‹ Cuentas»).
 * 44 px de alto: objetivo táctil completo aunque el texto mida 22.
 */
export function EnlaceTexto({ className = "", ...resto }: Props) {
  return (
    <Link
      className={`inline-flex h-11 items-center gap-2 text-cuerpo font-semibold text-marca-texto underline decoration-transparent decoration-1 underline-offset-4 hover:decoration-current ${className}`}
      {...resto}
    />
  );
}
