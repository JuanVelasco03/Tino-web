import { montoConSigno } from "@/domain/cuenta/detalle";

type Props = {
  tarjeta: { cupo: bigint; disponible: bigint; porcentajeUsado: number };
  /** La deuda, positiva (`CuentaDto.saldo` de un pasivo). */
  saldo: bigint;
  /** Compra consultada que cabe: el tramo punteado y «Con esta compra: {43} %». */
  porcentajeTras?: number | null;
  formato?: "escritorio" | "movil";
};

/**
 * Cupo de la tarjeta (SPEC 13). Escritorio: «Cupo total», «Deuda actual»
 * (con «−», terracota) y «Disponible hoy» en cifra-m; barra de 8 px con el
 * uso en tinta y, con una compra que cabe, un tramo punteado hasta el uso
 * tras la compra. Móvil: «Disponible hoy» en cifra-l, barra de 4 px, «Usado
 * {32} % de {4.000.000}» y «Debes {−1.284.300}». Todo de la API.
 */
export function ResumenTarjeta({ tarjeta, saldo, porcentajeTras = null, formato = "escritorio" }: Props) {
  const usado = Math.min(100, tarjeta.porcentajeUsado);
  const tras = porcentajeTras === null ? null : Math.min(100, Math.max(usado, porcentajeTras));
  const barra = (alto: "h-2" | "h-1") => (
    <div
      role="meter"
      aria-label="Cupo usado"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={tarjeta.porcentajeUsado}
      className={`relative ${alto} overflow-hidden rounded-muestra bg-linea`}
    >
      <div className={`${alto} bg-texto`} style={{ width: `${usado}%` }} />
      {tras !== null && tras > usado && (
        <div
          aria-hidden
          className={`absolute top-0 ${alto} border border-dashed border-salida-texto`}
          style={{ left: `${usado}%`, width: `${tras - usado}%` }}
        />
      )}
    </div>
  );

  if (formato === "movil") {
    return (
      <section aria-label="Cupo" className="flex flex-col gap-2">
        <span className="text-rotulo uppercase text-secundario">Disponible hoy</span>
        <span className="font-mono text-cifra-l tabular-nums">{montoConSigno(tarjeta.disponible, false)}</span>
        {barra("h-1")}
        <div className="flex justify-between gap-3 text-etiqueta">
          <span>
            Usado <span className="font-mono tabular-nums">{tarjeta.porcentajeUsado} %</span> de{" "}
            <span className="font-mono tabular-nums">{montoConSigno(tarjeta.cupo, false)}</span>
          </span>
          <span>
            Debes <span className="font-mono tabular-nums text-salida-texto">{montoConSigno(-saldo)}</span>
          </span>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Cupo" className="flex flex-col gap-4">
      <dl className="flex flex-wrap gap-x-8 gap-y-4">
        <div className="flex flex-col gap-1">
          <dt className="text-rotulo uppercase text-secundario">Cupo total</dt>
          <dd className="font-mono text-cifra-m tabular-nums">{montoConSigno(tarjeta.cupo, false)}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-rotulo uppercase text-secundario">Deuda actual</dt>
          <dd className="font-mono text-cifra-m tabular-nums text-salida-texto">{montoConSigno(-saldo)}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-rotulo uppercase">Disponible hoy</dt>
          <dd className="font-mono text-cifra-m tabular-nums">{montoConSigno(tarjeta.disponible, false)}</dd>
        </div>
      </dl>
      {barra("h-2")}
      <div className="flex justify-between gap-3 font-mono text-cifra-xs tabular-nums text-secundario">
        <span>Usado {tarjeta.porcentajeUsado} %</span>
        <span>{tras !== null ? `Con esta compra: ${porcentajeTras} %` : `Disponible ${Math.max(0, 100 - tarjeta.porcentajeUsado)} %`}</span>
      </div>
    </section>
  );
}
