import type { ReactNode } from "react";
import Link from "next/link";
import { formatearDinero } from "@/domain/dinero/formato";
import { formatearFechaSinAnio } from "@/domain/fecha/formato";
import { formatearCantidad, formatearCantidadCorta } from "@/domain/inversion/cantidad";
import { cifraColumna, enMoneda } from "@/domain/inversion/presentacion";
import type { ClaseOperacion, Moneda, Operacion } from "@/domain/inversion/tipos";
import { colorSigno } from "./cifras-inversion";

type Props = {
  operaciones: readonly Operacion[];
  moneda: Moneda;
  /** Enlace a la edición (`&operacion=<id>`); sin él (archivada), las filas no son enlaces. */
  enlace?: (operacion: Operacion) => string;
};

export const ROTULO_CLASE: Record<ClaseOperacion, string> = { compra: "Compra", venta: "Venta", inicial: "Ya lo tenía" };

const COLUMNAS = "grid-cols-[64px_minmax(0,1fr)_120px_150px_150px]";

/** Monto sobre el efectivo: compra `−`, venta `+`, en tinta; «Ya lo tenía» sin signo, en secundario. */
function Monto({ o, moneda }: { o: Operacion; moneda: Moneda }) {
  if (o.clase === "inicial") return <span className="text-secundario">{cifraColumna(o.monto, moneda)}</span>;
  return <>{cifraColumna(o.clase === "compra" ? -o.monto : o.monto, moneda, true)}</>;
}

/** Ganancia realizada con color, o «—» en terciario. */
function Ganancia({ o, moneda }: { o: Operacion; moneda: Moneda }) {
  if (o.gananciaRealizada === null) return <span className="text-terciario">—</span>;
  return <span className={colorSigno(o.gananciaRealizada)}>{cifraColumna(o.gananciaRealizada, moneda, true)}</span>;
}

/** `rol="row"` en la tabla de escritorio: sin él, las celdas quedan huérfanas para el lector de pantalla. */
function Fila({ href, className, children, rol }: { href?: string; className: string; children: ReactNode; rol?: "row" }) {
  return href ? (
    <Link href={href} scroll={false} role={rol} className={`${className} hover:bg-hundido`}>
      {children}
    </Link>
  ) : (
    <div role={rol} className={className}>
      {children}
    </div>
  );
}

/**
 * Todas las operaciones de la cuenta (N-60, N-63), en el orden de la API.
 * Desde `lg`, tabla de cinco columnas; por debajo, filas de dos. Cada fila
 * abre su edición. La ganancia realizada llega de la API.
 */
export function ListaOperaciones({ operaciones, moneda, enlace }: Props) {
  return (
    <section aria-labelledby="titulo-operaciones" className="flex flex-col">
      <h2 id="titulo-operaciones" className="border-b border-raya pb-2 text-rotulo uppercase">
        Operaciones
      </h2>
      {operaciones.length === 0 ? (
        <p className="py-4 text-cuerpo text-secundario">Sin operaciones todavía.</p>
      ) : (
        <>
          {/* Escritorio */}
          <div role="table" className="hidden lg:block">
            <div role="row" className={`grid ${COLUMNAS} gap-x-3 border-b border-linea py-2 text-rotulo uppercase text-secundario`}>
              <span role="columnheader">Fecha</span>
              <span role="columnheader">Operación</span>
              <span role="columnheader" className="text-right">Cantidad</span>
              <span role="columnheader" className="text-right">Monto</span>
              <span role="columnheader" className="text-right">Ganancia realizada</span>
            </div>
            {operaciones.map((o) => (
              <Fila key={o.id} rol="row" href={enlace?.(o)} className={`grid ${COLUMNAS} items-baseline gap-x-3 border-b border-linea py-3`}>
                <span role="cell" className="font-mono text-cifra-xs text-secundario">{formatearFechaSinAnio(o.fecha)}</span>
                <span role="cell" className="flex min-w-0 flex-col">
                  <span className="truncate text-cuerpo">
                    {ROTULO_CLASE[o.clase]} · {o.activo.simbolo}
                  </span>
                  <span className="text-etiqueta font-normal text-secundario">
                    <span className="font-mono tabular-nums">{formatearDinero({ monto: o.precioUnitario, moneda }, { omitirCOP: true })}</span> por
                    unidad
                  </span>
                </span>
                <span role="cell" className="text-right font-mono text-cifra-s tabular-nums">{formatearCantidad(o.cantidad)}</span>
                <span role="cell" className="text-right font-mono text-cifra-s tabular-nums">
                  <Monto o={o} moneda={moneda} />
                </span>
                <span role="cell" className="text-right font-mono text-cifra-s tabular-nums">
                  <Ganancia o={o} moneda={moneda} />
                </span>
              </Fila>
            ))}
          </div>

          {/* Móvil */}
          <ul className="lg:hidden">
            {operaciones.map((o) => (
              <li key={o.id}>
                <Fila href={enlace?.(o)} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 border-b border-linea py-3">
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-cuerpo">
                      {ROTULO_CLASE[o.clase]} · {o.activo.simbolo}
                    </span>
                    <span className="font-mono text-cifra-xs tabular-nums text-secundario">
                      <span className="whitespace-nowrap">{formatearFechaSinAnio(o.fecha)}</span> ·{" "}
                      <span className="whitespace-nowrap">
                        {formatearCantidadCorta(o.cantidad)} × {cifraColumna(o.precioUnitario, moneda)}
                      </span>
                    </span>
                  </span>
                  <span className="flex flex-col items-end font-mono tabular-nums">
                    <span className="text-cifra-s">
                      <Monto o={o} moneda={moneda} />
                    </span>
                    {o.gananciaRealizada !== null && (
                      <span className="text-cifra-xs">
                        <Ganancia o={o} moneda={moneda} />
                      </span>
                    )}
                  </span>
                </Fila>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/** «US$ 562,40 por unidad»: precio derivado de una operación, para el panel de edición. */
export function porUnidad(o: Pick<Operacion, "precioUnitario">, moneda: Moneda): string {
  return `${enMoneda(o.precioUnitario, moneda)} por unidad`;
}
