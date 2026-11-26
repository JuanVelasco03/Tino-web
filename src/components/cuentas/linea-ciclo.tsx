import { fechaCorta } from "@/domain/cuenta/detalle";
import { posicionHoy, textoDiasHasta, textoLineaCiclo, type Ciclo } from "@/domain/cuenta/tarjeta";
import { formatearRango } from "@/domain/fecha/formato";

type Props = {
  ciclo: Pick<Ciclo, "inicio" | "corte" | "pagoLimite" | "diasHastaCorte" | "diasHastaPago">;
  fechaHoy: string;
};

/**
 * Un hito del ciclo en dos renglones: el rótulo en `etiqueta` secundaria y,
 * debajo, la fecha en mono tinta con «en 20 días» aparte, en secundario. En
 * una sola línea («Corte 15 dic · en 20 días») las tres piezas se pegaban.
 */
function Hito({ rotulo, fecha, faltan, alinear = "izquierda" }: { rotulo: string; fecha: string; faltan?: string; alinear?: "izquierda" | "derecha" }) {
  return (
    <div className={`flex flex-col gap-1 ${alinear === "derecha" ? "md:items-end" : ""}`}>
      <span className="text-etiqueta font-normal text-secundario">{rotulo}</span>
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-mono text-cifra-s tabular-nums text-texto">{fecha}</span>
        {faltan && <span className="text-etiqueta font-normal text-secundario">{faltan}</span>}
      </span>
    </div>
  );
}

/**
 * Línea del ciclo de facturación (SPEC 13). Escritorio: rótulo y «16 oct –
 * 15 nov · pago hasta 30 nov»; la línea con «Inicio» a la izquierda, «Corte»
 * y «Pago límite» con sus días a la derecha, y el punto «Hoy». Móvil: «Ciclo
 * {16 oct – 15 nov}» y corte y pago límite en dos columnas. Fechas y días de
 * la API; la posición del punto es solo dibujo.
 */
export function LineaCiclo({ ciclo, fechaHoy }: Props) {
  const posicion = posicionHoy(ciclo, fechaHoy);
  const inicio = <Hito rotulo="Inicio" fecha={fechaCorta(ciclo.inicio, fechaHoy)} />;
  const corte = <Hito rotulo="Corte" fecha={fechaCorta(ciclo.corte, fechaHoy)} faltan={textoDiasHasta(ciclo.diasHastaCorte)} alinear="derecha" />;
  const pago = <Hito rotulo="Pago límite" fecha={fechaCorta(ciclo.pagoLimite, fechaHoy)} faltan={textoDiasHasta(ciclo.diasHastaPago)} alinear="derecha" />;

  return (
    <section aria-label="Ciclo de facturación">
      {/* Escritorio */}
      <div className="hidden flex-col gap-4 md:flex">
        <div className="flex items-baseline gap-4">
          <h2 className="text-rotulo uppercase">Ciclo de facturación</h2>
          <span className="text-etiqueta font-normal text-secundario">{textoLineaCiclo(ciclo, fechaHoy)}</span>
        </div>
        <div className="flex items-end justify-between gap-6">
          {inicio}
          <div className="flex gap-12">
            {corte}
            {pago}
          </div>
        </div>
        <div className="relative pb-6">
          <div className="h-1 overflow-hidden rounded-muestra bg-linea">
            <div className="h-1 bg-secundario" style={{ width: `${posicion}%` }} />
          </div>
          <span aria-hidden className="absolute top-0 size-2 -translate-x-1/2 -translate-y-0.5 rounded-campo bg-texto" style={{ left: `${posicion}%` }} />
          <span
            className="absolute top-3 -translate-x-1/2 whitespace-nowrap font-mono text-cifra-xs tabular-nums text-secundario"
            style={{ left: `${Math.min(94, Math.max(6, posicion))}%` }}
          >
            Hoy {fechaCorta(fechaHoy, fechaHoy)}
          </span>
        </div>
      </div>

      {/* Móvil */}
      <div className="flex flex-col gap-2 md:hidden">
        <h2 className="text-rotulo uppercase">
          Ciclo <span className="font-mono normal-case tracking-normal tabular-nums">{formatearRango(ciclo.inicio, ciclo.corte)}</span>
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Hito rotulo="Corte" fecha={fechaCorta(ciclo.corte, fechaHoy)} faltan={textoDiasHasta(ciclo.diasHastaCorte)} />
          <Hito rotulo="Pago límite" fecha={fechaCorta(ciclo.pagoLimite, fechaHoy)} faltan={textoDiasHasta(ciclo.diasHastaPago)} />
        </div>
      </div>
    </section>
  );
}
