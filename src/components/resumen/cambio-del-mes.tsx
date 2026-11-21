import { useId } from "react";
import { formatearDinero } from "@/domain/dinero/formato";
import { formatearFechaSinAnio, formatearNombreMes } from "@/domain/fecha/formato";
import type { Resumen } from "@/services/resumen";

type Props = {
  cambio: Resumen["cambioDelMes"];
  /** `"YYYY-MM"` del mes consultado. */
  mes: string;
  /** En el mes actual el cierre se rotula «Patrimonio a hoy». */
  esActual: boolean;
};

function pesos(monto: bigint, signo = false): string {
  return formatearDinero({ monto, moneda: "COP" }, { omitirCOP: true, signoMas: signo });
}

const FILA = "flex items-baseline justify-between gap-3";

/**
 * Puente del patrimonio del mes (N-43, N-44, N-46, N-47): anterior +
 * resultado + otros cambios = cierre. Las cuatro cifras llegan de la API; la
 * web no suma. Todo en tinta, negativo con `−`.
 */
export function CambioDelMes({ cambio, mes, esActual }: Props) {
  const filas = [
    { rotulo: `Patrimonio al ${formatearFechaSinAnio(cambio.fechaAnterior)}`, cifra: pesos(cambio.patrimonioAnterior), tenue: true },
    { rotulo: "Resultado del mes", cifra: pesos(cambio.resultado, true), tenue: false },
    { rotulo: "Otros cambios", cifra: pesos(cambio.otrosCambios, true), tenue: false },
  ];
  const titulo = useId();
  const cierre = esActual ? "Patrimonio a hoy" : `Patrimonio al ${formatearFechaSinAnio(cambio.fechaCierre)}`;

  return (
    <section aria-labelledby={titulo}>
      <h2 id={titulo} className="border-b border-raya pb-2 text-rotulo uppercase">
        Cambio en {formatearNombreMes(mes)}
      </h2>
      <dl>
        {filas.map((f) => (
          <div key={f.rotulo} className={`${FILA} border-b border-linea py-3`}>
            <dt className={`text-cuerpo ${f.tenue ? "text-secundario" : ""}`}>{f.rotulo}</dt>
            <dd className="font-mono text-cifra-s tabular-nums">{f.cifra}</dd>
          </div>
        ))}
        <div className={`${FILA} doble-raya pt-3 pb-2`}>
          <dt className="text-cuerpo font-semibold">{cierre}</dt>
          <dd className="font-mono text-cifra-s font-semibold tabular-nums">{pesos(cambio.patrimonioCierre)}</dd>
        </div>
      </dl>
    </section>
  );
}
