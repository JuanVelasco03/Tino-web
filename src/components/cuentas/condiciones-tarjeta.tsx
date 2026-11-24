import { montoConSigno } from "@/domain/cuenta/detalle";
import { textoDia, textoTasa } from "@/domain/cuenta/tarjeta";

type Props = {
  tarjeta: {
    cupo: bigint;
    diaCorte: number | null;
    diaPago: number | null;
    tasaMensual: number | null;
    tasaEfectivaAnual: number | null;
    cuotaManejo: bigint | null;
    cuentaPago: { nombre: string } | null;
  };
};

/**
 * Condiciones de la tarjeta (SPEC 13): cupo, tasa (M.V. y E.A. de la API),
 * cuota de manejo, días de corte y de pago y la cuenta desde la que se paga.
 * Rótulo en `etiqueta` secundaria, valor a la derecha (cifras en mono),
 * renglón entre filas. Lo que falta: «Sin definir».
 */
export function CondicionesTarjeta({ tarjeta }: Props) {
  const filas: { rotulo: string; valor: string; mono: boolean }[] = [
    { rotulo: "Cupo", valor: montoConSigno(tarjeta.cupo, false), mono: true },
    { rotulo: "Tasa de interés", valor: textoTasa(tarjeta.tasaMensual, tarjeta.tasaEfectivaAnual), mono: tarjeta.tasaMensual !== null },
    {
      rotulo: "Cuota de manejo",
      valor: tarjeta.cuotaManejo === null ? "Sin definir" : `${montoConSigno(tarjeta.cuotaManejo, false)} al mes`,
      mono: tarjeta.cuotaManejo !== null,
    },
    { rotulo: "Día de corte", valor: textoDia(tarjeta.diaCorte), mono: false },
    { rotulo: "Día límite de pago", valor: textoDia(tarjeta.diaPago), mono: false },
    { rotulo: "Se paga desde", valor: tarjeta.cuentaPago?.nombre ?? "Sin definir", mono: false },
  ];

  return (
    <section aria-label="Condiciones">
      <h2 className="border-b border-raya pb-2 text-rotulo uppercase">Condiciones</h2>
      <dl>
        {filas.map((f) => (
          <div key={f.rotulo} className="flex items-baseline justify-between gap-4 border-b border-linea py-3">
            <dt className="text-etiqueta font-normal text-secundario">{f.rotulo}</dt>
            <dd className={`text-right ${f.mono ? "font-mono text-cifra-s tabular-nums" : "text-cuerpo"}`}>{f.valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
