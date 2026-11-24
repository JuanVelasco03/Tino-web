import type { ReactNode } from "react";
import Link from "next/link";
import type { Naturaleza, TipoCuenta } from "@/domain/cuenta/naturaleza";
import { EnlaceTexto } from "../enlace-texto";
import { IconoCuenta, ROTULO_TIPO_CUENTA } from "../iconos";

type Props = {
  cuenta: { nombre: string; tipo: TipoCuenta; naturaleza: Naturaleza; detalle: string | null; archivadaEn: string | null };
  /** La acción principal de la cuenta («Ajustar saldo», «Registrar pago»), a la derecha en escritorio. */
  accion?: ReactNode;
  /** `?editar=1` del detalle. Sin él (archivada), no hay «Editar cuenta». */
  hrefEditar?: string;
  /** A la derecha de «‹ Cuentas» en móvil («Seleccionar» / «Listo»). */
  extraMovil?: ReactNode;
};

/** «Efectivo · billetera · activo»; sin detalle, «Efectivo · activo». */
export function subtituloCuenta(cuenta: Props["cuenta"]): string {
  return [ROTULO_TIPO_CUENTA[cuenta.tipo], cuenta.detalle, cuenta.naturaleza].filter(Boolean).join(" · ");
}

/**
 * Cabecera del detalle de una cuenta (SPEC 13). Escritorio: miga «Cuentas ›
 * Activos» («Pasivos» en la tarjeta), icono de 22 px, nombre en titulo-1 y el
 * subtítulo; a la derecha, la acción principal y «Editar cuenta»; raya fuerte
 * abajo. Móvil: «‹ Cuentas» con su extra a la derecha y el nombre en
 * titulo-2. Una archivada lleva «Archivada» junto al nombre, vuelve a
 * Archivadas y no tiene acciones.
 */
export function CabeceraCuenta({ cuenta, accion, hrefEditar, extraMovil }: Props) {
  const archivada = cuenta.archivadaEn !== null;
  const volver = archivada ? { href: "/cuentas/archivadas", rotulo: "Archivadas" } : { href: "/cuentas", rotulo: "Cuentas" };
  const grupo = cuenta.naturaleza === "pasivo" ? "Pasivos" : "Activos";
  const rotuloArchivada = archivada && <span className="text-rotulo uppercase text-secundario">Archivada</span>;

  return (
    <header className="flex flex-col gap-2 md:gap-3 md:border-b md:border-raya md:pb-4">
      {/* Móvil */}
      <div className="flex items-center justify-between gap-3 md:hidden">
        <EnlaceTexto href={volver.href}>‹ {volver.rotulo}</EnlaceTexto>
        {extraMovil}
      </div>
      <div className="flex items-center gap-3 md:hidden">
        <span className="flex text-secundario">
          <IconoCuenta tipo={cuenta.tipo} tamano={22} />
        </span>
        <h1 className="min-w-0 truncate text-titulo-2">{cuenta.nombre}</h1>
        {rotuloArchivada}
      </div>

      {/* Escritorio */}
      <nav aria-label="Miga" className="hidden text-etiqueta text-secundario md:block">
        <Link href={volver.href} className="hover:text-texto">
          {volver.rotulo}
        </Link>
        <span aria-hidden> › </span>
        <span>{grupo}</span>
      </nav>
      <div className="hidden items-end justify-between gap-6 md:flex">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex text-secundario">
            <IconoCuenta tipo={cuenta.tipo} tamano={22} />
          </span>
          <div className="flex min-w-0 flex-col">
            <div className="flex items-baseline gap-3">
              <h1 className="truncate text-titulo-1">{cuenta.nombre}</h1>
              {rotuloArchivada}
            </div>
            <p className="text-etiqueta font-normal text-secundario">{subtituloCuenta(cuenta)}</p>
          </div>
        </div>
        {!archivada && (accion || hrefEditar) && (
          <div className="flex shrink-0 items-center gap-4">
            {accion}
            {hrefEditar && (
              <EnlaceTexto href={hrefEditar} scroll={false}>
                Editar cuenta
              </EnlaceTexto>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
