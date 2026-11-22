import type { ReactNode } from "react";
import Link from "next/link";
import { formatearFechaSinAnio } from "@/domain/fecha/formato";
import { formatearCantidad, formatearCantidadCorta } from "@/domain/inversion/cantidad";
import { cifraColumna, equivalente, formatearPorcentaje, notaCotizacion } from "@/domain/inversion/presentacion";
import type { InversionDetalle, Moneda, Posicion } from "@/domain/inversion/tipos";
import { colorSigno } from "./cifras-inversion";
import { rutaInversion } from "./rutas";

type Props = {
  detalle: InversionDetalle;
  /** Zona del perfil (IANA): la hora del intradía. */
  zona: string;
  /** `&precio=<activoId>`: la fila con el bloque abierto. */
  abierto?: string | null;
  /** El bloque de precio en línea, bajo su fila (escritorio). */
  bloque?: ReactNode;
};

/** Rejilla de la tabla de escritorio: Activo, Cantidad, Costo prom., Precio, Valor, Rend., %, Cotización. */
const COLUMNAS = "grid-cols-[minmax(0,1fr)_96px_104px_104px_150px_130px_76px_140px]";

const CIFRA = "text-right font-mono tabular-nums";

/** «≈ 14.481.800» bajo una cifra, solo en USD. */
function Equivalente({ cop, signo = false, className = "" }: { cop: bigint | null; signo?: boolean; className?: string }) {
  return <span className={`block font-mono text-cifra-xs tabular-nums text-secundario ${className}`}>{equivalente(cop, { signo, conCOP: false })}</span>;
}

/** Precio por unidad; el manual va subrayado en discontinuo latón. */
function Precio({ p, moneda }: { p: Posicion; moneda: Moneda }) {
  const cifra = cifraColumna(p.precio, moneda);
  return p.cotizacion === "manual" ? <span className="border-b border-dashed border-marca">{cifra}</span> : <>{cifra}</>;
}

/** Nota de la cotización: pulsable (abre el bloque) salvo en una archivada. */
function Cotizacion({ p, detalle, zona, soloLectura }: { p: Posicion; detalle: InversionDetalle; zona: string; soloLectura: boolean }) {
  const nota = notaCotizacion(p, detalle.fechaHoy, zona);
  const tono = p.precioVencido ? "text-marca-texto" : "text-secundario";
  const ruta = rutaInversion(detalle.id, { precio: p.activoId });
  const manual = p.cotizacion === "manual";
  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <span className="flex flex-wrap items-baseline gap-x-2">
        {!manual && !soloLectura ? (
          <Link href={ruta} scroll={false} className={`text-left text-etiqueta font-normal hover:text-texto ${tono}`}>
            {nota}
          </Link>
        ) : (
          <span className={`text-etiqueta font-normal ${tono}`}>{nota}</span>
        )}
        {manual && <span className="font-mono text-cifra-xs text-marca-texto">manual</span>}
      </span>
      {manual && !soloLectura && (
        <Link href={ruta} scroll={false} className="text-etiqueta font-semibold text-marca-texto">
          Actualizar precio
        </Link>
      )}
    </div>
  );
}

/** Sin posiciones: invitación a registrar la primera operación (N-47). */
function CuentaVacia({ nombre }: { nombre: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-linea py-6">
      <p className="text-cuerpo font-semibold">Todavía no hay posiciones en {nombre}.</p>
      <p className="text-cuerpo text-secundario">Registra lo que ya tenías con «Ya lo tenía», o compra con el efectivo disponible.</p>
    </div>
  );
}

/**
 * Posiciones de una inversión (N-15 a N-34), en el orden de la API. Desde
 * `xl`, tabla de ocho columnas con el bloque de precio en línea bajo su fila;
 * por debajo, lista de dos columnas donde cada fila abre el precio. Cierran
 * «Efectivo disponible» y «Total cuenta» sobre doble raya. Toda cifra llega
 * de la API; en USD cada una lleva su «≈ COP».
 */
export function TablaPosiciones({ detalle, zona, abierto = null, bloque }: Props) {
  const { moneda, posiciones } = detalle;
  const usd = moneda === "USD";
  const soloLectura = detalle.archivadaEn !== null;
  const vacia = posiciones.length === 0;

  return (
    <section aria-label="Posiciones">
      {/* Escritorio ancho */}
      <div role="table" className="hidden xl:block">
        <div role="row" className={`grid ${COLUMNAS} gap-x-3 border-b border-raya pb-2 text-rotulo uppercase text-secundario`}>
          <span role="columnheader">Activo</span>
          <span role="columnheader" className="text-right">Cantidad</span>
          <span role="columnheader" className="text-right">Costo prom.</span>
          <span role="columnheader" className="text-right">Precio</span>
          <span role="columnheader" className="text-right">Valor · {moneda}</span>
          <span role="columnheader" className="text-right">Rend. · {moneda}</span>
          <span role="columnheader" className="text-right">%</span>
          <span role="columnheader">Cotización</span>
        </div>

        {vacia ? (
          <CuentaVacia nombre={detalle.nombre} />
        ) : (
          posiciones.map((p) => (
            <div key={p.activoId}>
              <div
                role="row"
                className={`grid ${COLUMNAS} items-baseline gap-x-3 border-b border-linea py-3 ${p.activoId === abierto ? "bg-hundido" : ""}`}
              >
                <span role="cell" className="flex min-w-0 flex-col">
                  <span className="font-mono text-cifra-s font-semibold">{p.simbolo}</span>
                  <span className="truncate text-etiqueta font-normal text-secundario" title={p.nombre}>
                    {p.nombre}
                  </span>
                </span>
                <span role="cell" className={`${CIFRA} text-cifra-s`}>{formatearCantidad(p.cantidad)}</span>
                <span role="cell" className={`${CIFRA} text-cifra-s text-secundario`}>{cifraColumna(p.costoPromedio, moneda)}</span>
                <span role="cell" className={`${CIFRA} text-cifra-s`}>
                  <Precio p={p} moneda={moneda} />
                </span>
                <span role="cell" className={CIFRA}>
                  <span className="block text-cifra-s">{cifraColumna(p.valor, moneda)}</span>
                  {usd && <Equivalente cop={p.valorCop} />}
                </span>
                <span role="cell" className={CIFRA}>
                  <span className={`block text-cifra-s ${colorSigno(p.rendimiento)}`}>{cifraColumna(p.rendimiento, moneda, true)}</span>
                  {usd && <Equivalente cop={p.rendimientoCop} signo />}
                </span>
                <span role="cell" className={`${CIFRA} text-cifra-xs ${colorSigno(p.rendimientoPorcentaje)}`}>
                  {formatearPorcentaje(p.rendimientoPorcentaje)}
                </span>
                <span role="cell">
                  <Cotizacion p={p} detalle={detalle} zona={zona} soloLectura={soloLectura} />
                </span>
              </div>
              {p.activoId === abierto && bloque}
            </div>
          ))
        )}

        <div role="row" className={`grid ${COLUMNAS} items-baseline gap-x-3 border-b border-linea py-3`}>
          <span role="cell" className="flex flex-col">
            <span className="text-cuerpo">Efectivo disponible</span>
            <span className="text-etiqueta font-normal text-secundario">Saldo sin invertir</span>
          </span>
          <span className="col-span-3" />
          <span role="cell" className={CIFRA}>
            <span className="block text-cifra-s">{cifraColumna(detalle.efectivo, moneda)}</span>
            {usd && <Equivalente cop={detalle.efectivoCop} />}
          </span>
          <span className="col-span-2" />
          <span role="cell" className="text-etiqueta font-normal text-secundario">Al {formatearFechaSinAnio(detalle.fechaHoy)}</span>
        </div>

        <div role="row" className={`grid ${COLUMNAS} doble-raya items-baseline gap-x-3 py-3`}>
          <span role="cell" className="text-cuerpo font-semibold">Total cuenta {detalle.nombre}</span>
          <span className="col-span-3" />
          <span role="cell" className={CIFRA}>
            <span className="block text-cifra-s font-semibold">{cifraColumna(detalle.valorMercado, moneda)}</span>
            {usd && <Equivalente cop={detalle.valorMercadoCop} />}
          </span>
          <span role="cell" className={CIFRA}>
            <span className={`block text-cifra-s font-semibold ${colorSigno(detalle.rendimiento)}`}>
              {cifraColumna(detalle.rendimiento, moneda, true)}
            </span>
            {usd && <Equivalente cop={detalle.rendimientoCop} signo />}
          </span>
          <span role="cell" className={`${CIFRA} text-cifra-xs font-semibold ${colorSigno(detalle.rendimientoPorcentaje)}`}>
            {formatearPorcentaje(detalle.rendimientoPorcentaje)}
          </span>
          <span />
        </div>
      </div>

      {/* Móvil y escritorio angosto */}
      <div className="xl:hidden">
        <div className="flex justify-between gap-3 border-b border-raya pb-2 text-rotulo uppercase text-secundario">
          <span>Posición</span>
          <span>Valor · rend.</span>
        </div>

        {vacia ? (
          <CuentaVacia nombre={detalle.nombre} />
        ) : (
          <ul>
            {posiciones.map((p) => {
              const contenido = (
                <>
                  <span className="flex min-w-0 flex-col">
                    <span className="flex items-baseline gap-2">
                      <span className="font-mono text-cifra-s font-semibold">{p.simbolo}</span>
                      {p.cotizacion === "manual" && <span className="font-mono text-cifra-xs text-marca-texto">manual</span>}
                    </span>
                    <span className="truncate text-etiqueta font-normal text-secundario">{p.nombre}</span>
                    <span className="font-mono text-cifra-xs tabular-nums text-secundario">
                      {formatearCantidadCorta(p.cantidad)} × <Precio p={p} moneda={moneda} /> · costo {cifraColumna(p.costoPromedio, moneda)}
                    </span>
                    <span className={`text-etiqueta font-normal ${p.precioVencido ? "text-marca-texto" : "text-secundario"}`}>
                      {notaCotizacion(p, detalle.fechaHoy, zona)}
                    </span>
                  </span>
                  <span className="flex flex-col items-end text-right">
                    <span className="font-mono text-cifra-s tabular-nums">{cifraColumna(p.valor, moneda)}</span>
                    {usd && <Equivalente cop={p.valorCop} />}
                    <span className={`whitespace-nowrap font-mono text-cifra-xs tabular-nums ${colorSigno(p.rendimiento)}`}>
                      {cifraColumna(p.rendimiento, moneda, true)} · {formatearPorcentaje(p.rendimientoPorcentaje)}
                    </span>
                  </span>
                </>
              );
              const fila = "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-linea py-3";
              return (
                <li key={p.activoId}>
                  {soloLectura ? (
                    <div className={fila}>{contenido}</div>
                  ) : (
                    <Link
                      href={rutaInversion(detalle.id, { precio: p.activoId })}
                      scroll={false}
                      className={`${fila} hover:bg-hundido ${p.activoId === abierto ? "bg-hundido" : ""}`}
                    >
                      {contenido}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex items-baseline justify-between gap-3 border-b border-linea py-3">
          <span className="text-cuerpo">Efectivo disponible</span>
          <span className="text-right">
            <span className="block font-mono text-cifra-s tabular-nums">{cifraColumna(detalle.efectivo, moneda)}</span>
            {usd && <Equivalente cop={detalle.efectivoCop} />}
          </span>
        </div>
        <div className="doble-raya flex items-baseline justify-between gap-3 py-3">
          <span className="text-cuerpo font-semibold">Total</span>
          <span className="text-right">
            <span className="block font-mono text-cifra-s font-semibold tabular-nums">{cifraColumna(detalle.valorMercado, moneda)}</span>
            {usd && <Equivalente cop={detalle.valorMercadoCop} />}
          </span>
        </div>
      </div>
    </section>
  );
}
