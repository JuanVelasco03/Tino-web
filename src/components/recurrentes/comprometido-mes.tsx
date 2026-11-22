import { formatearFechaSinAnio, formatearNombreMes } from "@/domain/fecha/formato";
import { anchosComprometido } from "@/domain/recurrente/comprometido";
import type { Ocurrencia, Recurrente } from "@/domain/recurrente/tipos";
import { EncabezadoSeccion } from "../encabezado-seccion";
import { importeConSigno, pesos } from "./comun";

type Grupo = { monto: bigint; cantidad: number };

type Props = {
  /** `"YYYY-MM"`, mes actual según la API. */
  mes: string;
  comprometido: { total: bigint; pagado: Grupo; porConfirmar: Grupo; programado: Grupo };
  ingresosEsperados: Ocurrencia[];
  /** Para el concepto de cada ingreso esperado. */
  recurrentes: Recurrente[];
};

function pagos(cantidad: number): string {
  return cantidad === 1 ? "1 pago" : `${cantidad} pagos`;
}

const MUESTRAS = {
  pagado: "bg-texto",
  porConfirmar: "border border-dashed border-texto",
  programado: "bg-linea",
} as const;

const ROTULOS = { pagado: "Pagado", porConfirmar: "Por confirmar", programado: "Programado" } as const;

/**
 * Comprometido del mes: total, barra pagado / por confirmar / programado,
 * una fila por grupo e ingresos esperados. Todas las cifras llegan de la API;
 * la barra solo escala (`anchosComprometido`).
 */
export function ComprometidoMes({ mes, comprometido, ingresosEsperados, recurrentes }: Props) {
  const { total, pagado, porConfirmar, programado } = comprometido;
  const anchos = anchosComprometido({ total, pagado: pagado.monto, porConfirmar: porConfirmar.monto });
  const porId = new Map(recurrentes.map((r) => [r.id, r]));
  const grupos = [
    ["pagado", pagado],
    ["porConfirmar", porConfirmar],
    ["programado", programado],
  ] as const;

  return (
    <section aria-label={`Comprometido en ${formatearNombreMes(mes)}`}>
      <EncabezadoSeccion titulo={`Comprometido en ${formatearNombreMes(mes)}`} />
      <div className="flex flex-col gap-3 pt-4 pb-3">
        <span className={`font-mono text-cifra-l tabular-nums ${total > 0n ? "text-salida" : "text-texto"}`}>
          {total > 0n ? pesos(-total) : "0"}
        </span>
        <div aria-hidden className="flex h-2 gap-0.5">
          {anchos.pagado > 0 && <div className="rounded-l-muestra bg-texto" style={{ width: `${anchos.pagado}%` }} />}
          {anchos.porConfirmar > 0 && (
            <div className={`border border-dashed border-texto ${anchos.pagado === 0 ? "rounded-l-muestra" : ""}`} style={{ width: `${anchos.porConfirmar}%` }} />
          )}
          <div className={`flex-1 rounded-r-muestra bg-linea ${anchos.pagado + anchos.porConfirmar === 0 ? "rounded-l-muestra" : ""}`} />
        </div>
      </div>

      <ul>
        {grupos.map(([clave, grupo]) => (
          <li key={clave} className="grid grid-cols-[12px_minmax(0,1fr)_auto] items-center gap-3 border-b border-linea py-2">
            <span aria-hidden className={`h-2 w-3 rounded-muestra ${MUESTRAS[clave]}`} />
            <span className="text-cuerpo">
              {ROTULOS[clave]}
              <span className="hidden text-etiqueta font-normal text-secundario md:inline"> · {pagos(grupo.cantidad)}</span>
            </span>
            <span className="font-mono text-cifra-s tabular-nums">{pesos(grupo.monto)}</span>
          </li>
        ))}
      </ul>

      {ingresosEsperados.length > 0 && (
        <ul className="flex flex-col gap-1 pt-3">
          {ingresosEsperados.map((o) => (
            <li key={`${o.recurrenteId}|${o.vencimiento}`} className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 text-etiqueta font-normal text-secundario">
                Ingreso esperado · {porId.get(o.recurrenteId)?.concepto ?? "—"} {formatearFechaSinAnio(o.vencimiento)}
              </span>
              <span className="whitespace-nowrap font-mono text-cifra-s tabular-nums text-entrada-texto">
                {o.estimado && "≈ "}
                {importeConSigno("ingreso", o.monto)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
