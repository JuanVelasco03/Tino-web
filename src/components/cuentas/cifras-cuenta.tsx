import type { ReactNode } from "react";
import { montoConSigno, textoConciliado, type Conciliacion } from "@/domain/cuenta/detalle";

type Props = {
  historial: { fechaHoy: string; saldo: bigint; conciliacion: Conciliacion; entradas: bigint; salidas: bigint };
  /** Móvil: «Ajustar» a la derecha del saldo (sin él, archivada). */
  ajustarMovil?: ReactNode;
};

/**
 * Cifras del detalle de una cuenta (SPEC 13), todas de la API. Escritorio:
 * «Saldo actual» (cifra-l) y «Conciliado» (cifra-m, con su estado debajo) y,
 * tras un renglón vertical, «En el rango» con entradas y salidas. Móvil: el
 * saldo con «Ajustar» y el estado corto de la conciliación.
 */
export function CifrasCuenta({ historial, ajustarMovil }: Props) {
  const { conciliacion, fechaHoy } = historial;
  const saldo = montoConSigno(historial.saldo, false);
  const conciliado = conciliacion.saldo === null ? "—" : montoConSigno(conciliacion.saldo, false);

  return (
    <section aria-label="Cifras de la cuenta">
      {/* Escritorio */}
      <div className="hidden grid-cols-[minmax(0,1fr)_auto] md:grid">
        <dl className="flex flex-wrap items-start gap-x-12 gap-y-4 pr-8">
          <div className="flex flex-col gap-1">
            <dt className="text-rotulo uppercase">Saldo actual</dt>
            <dd className="font-mono text-cifra-l tabular-nums">{saldo}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-rotulo uppercase text-secundario">Conciliado</dt>
            <dd className={`font-mono text-cifra-m tabular-nums ${conciliacion.saldo === null ? "text-terciario" : ""}`}>{conciliado}</dd>
            <dd className="text-etiqueta font-normal text-secundario">{textoConciliado(conciliacion, "largo", fechaHoy)}</dd>
          </div>
        </dl>
        <div className="flex flex-col gap-2 border-l border-linea pl-8">
          <h2 className="text-rotulo uppercase text-secundario">En el rango</h2>
          <dl className="grid grid-cols-[auto_auto] items-baseline gap-x-6 gap-y-1">
            <dt className="text-etiqueta font-normal text-secundario">Entradas</dt>
            <dd className="text-right font-mono text-cifra-s tabular-nums text-entrada-texto">{montoConSigno(historial.entradas)}</dd>
            <dt className="text-etiqueta font-normal text-secundario">Salidas</dt>
            <dd className="text-right font-mono text-cifra-s tabular-nums text-salida-texto">{montoConSigno(-historial.salidas)}</dd>
          </dl>
        </div>
      </div>

      {/* Móvil */}
      <div className="flex flex-col gap-1 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-cifra-l tabular-nums">{saldo}</span>
          {ajustarMovil}
        </div>
        <p className="text-etiqueta font-normal text-secundario">{textoConciliado(conciliacion, "corto", fechaHoy)}</p>
      </div>
    </section>
  );
}
