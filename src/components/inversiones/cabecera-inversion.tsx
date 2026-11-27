import Link from "next/link";
import { Plus } from "lucide-react";
import { subtituloInversion } from "@/domain/inversion/presentacion";
import type { InversionDetalle } from "@/domain/inversion/tipos";
import { BOTON_ENLACE } from "../boton";
import { LineaTrm } from "../linea-trm";
import { rutaNueva } from "./rutas";

type Props = {
  detalle: Pick<InversionDetalle, "id" | "nombre" | "moneda" | "archivadaEn" | "trm" | "trmDesactualizada">;
};

/**
 * Cabecera del detalle (N-05 a N-07): «Inversiones», el subtítulo y, a la
 * derecha, «+ Nueva inversión» (escritorio). Bajo el título, la TRM aplicada
 * con fecha y fuente, solo en USD. En móvil, el subtítulo sin «· activo» y la
 * TRM va bajo las cifras (la pone la página).
 */
export function CabeceraInversion({ detalle }: Props) {
  const archivada = detalle.archivadaEn !== null;
  return (
    <header className="flex flex-col gap-1">
      <div className="flex items-end justify-between gap-6">
        <h1 className="text-titulo-1">Inversiones</h1>
        {!archivada && (
          <div className="hidden md:block">
            <Link href={rutaNueva(detalle.id)} scroll={false} className={BOTON_ENLACE.secundario}>
              <Plus size={18} strokeWidth={1.5} aria-hidden />
              Nueva inversión
            </Link>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between md:gap-6">
        <p className="text-etiqueta font-normal text-secundario">
          <span className="hidden md:inline">{subtituloInversion(detalle)}</span>
          <span className="md:hidden">{subtituloInversion(detalle, true)}</span>
        </p>
        {detalle.moneda === "USD" && (
          <LineaTrm trm={detalle.trm} desactualizada={detalle.trmDesactualizada} className="hidden md:flex md:text-right" />
        )}
      </div>
    </header>
  );
}
