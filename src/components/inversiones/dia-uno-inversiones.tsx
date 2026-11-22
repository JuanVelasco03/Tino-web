import Link from "next/link";
import type { Trm } from "@/domain/inversion/tipos";
import { BOTON_ENLACE } from "../deudas/rutas";
import { LineaTrm } from "../linea-trm";
import { rutaNueva } from "./rutas";

type Props = { trm: Trm | null; trmDesactualizada: boolean };

/**
 * Inversiones sin ninguna cuenta (N-37 a N-39): el mensaje, el esqueleto de
 * la tabla (tres renglones vacíos de 52 px, el último en doble raya), la TRM
 * de hoy y «Agregar cuenta de inversión». Sin cifras inventadas.
 */
export function DiaUnoInversiones({ trm, trmDesactualizada }: Props) {
  return (
    <section aria-label="Sin inversiones" className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <p className="text-cuerpo font-semibold">Aún no tienes una cuenta de inversión.</p>
        <p className="text-cuerpo text-secundario">
          Registra tus posiciones con cantidad y costo. Tino trae el precio cuando lo encuentra y lo muestra en USD y en pesos.
        </p>
      </div>

      <div aria-hidden>
        <div className="grid grid-cols-[minmax(0,1fr)_96px_120px] gap-3 border-b border-raya pb-2 text-rotulo uppercase text-secundario">
          <span>Posición</span>
          <span className="text-right">Cantidad</span>
          <span className="text-right">Valor</span>
        </div>
        <div className="h-13 border-b border-linea" />
        <div className="h-13 border-b border-linea" />
        <div className="doble-raya h-13" />
      </div>

      <LineaTrm trm={trm} desactualizada={trmDesactualizada} prefijo="hoy" />

      <Link href={rutaNueva()} scroll={false} className={`${BOTON_ENLACE.primario} w-full md:w-[400px]`}>
        Agregar cuenta de inversión
      </Link>
    </section>
  );
}
