import { fechaCorta } from "@/domain/cuenta/detalle";
import { posicionHoy, textoDiasHasta, textoLineaCiclo, type Ciclo } from "@/domain/cuenta/tarjeta";
import { formatearRango } from "@/domain/fecha/formato";

type Props = {
  ciclo: Pick<Ciclo, "inicio" | "corte" | "pagoLimite" | "diasHastaCorte" | "diasHastaPago">;
  fechaHoy: string;
};

/**
 * Línea del ciclo de facturación (SPEC 13). Escritorio: rótulo y «16 oct –
 * 15 nov · pago hasta 30 nov»; la línea con «Inicio» a la izquierda, «Corte»
 * y «Pago límite» con sus días a la derecha, y el punto «Hoy». Móvil: «Ciclo
 * {16 oct – 15 nov}» y corte y pago límite en dos columnas. Fechas y días de
 * la API; la posición del punto es solo dibujo.
 */
export function LineaCiclo({ ciclo, fechaHoy }: Props) {
  const posicion = posicionHoy(ciclo, fechaHoy);
  const corte = (
    <>
      Corte <span className="font-mono tabular-nums text-texto">{fechaCorta(ciclo.corte, fechaHoy)}</span> · {textoDiasHasta(ciclo.diasHastaCorte)}
    </>
  );
  const pago = (
    <>
      Pago límite <span className="font-mono tabular-nums text-texto">{fechaCorta(ciclo.pagoLimite, fechaHoy)}</span> ·{" "}
      {textoDiasHasta(ciclo.diasHastaPago)}
    </>
  );

  return (
    <section aria-label="Ciclo de facturación">
      {/* Escritorio */}
      <div className="hidden flex-col gap-4 md:flex">
        <div className="flex items-baseline gap-4">
          <h2 className="text-rotulo uppercase">Ciclo de facturación</h2>
          <span className="text-etiqueta font-normal text-secundario">{textoLineaCiclo(ciclo, fechaHoy)}</span>
        </div>
        <div className="flex items-baseline justify-between gap-6 text-etiqueta font-normal text-secundario">
          <span>
            Inicio <span className="font-mono tabular-nums text-texto">{fechaCorta(ciclo.inicio, fechaHoy)}</span>
          </span>
          <span className="flex gap-8">
            <span>{corte}</span>
            <span>{pago}</span>
          </span>
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
        <div className="grid grid-cols-2 gap-3 text-etiqueta font-normal text-secundario">
          <span>{corte}</span>
          <span>{pago}</span>
        </div>
      </div>
    </section>
  );
}
