import Link from "next/link";
import { CalendarDays, Check, Plus } from "lucide-react";
import { formatearFechaSinAnio, formatearMes } from "@/domain/fecha/formato";
import type { Recurrente } from "@/domain/recurrente/tipos";
import { formatearCada, formatearVence, ocurrenciaDelMes } from "@/domain/recurrente/vencimiento";
import { EnlaceTexto } from "../enlace-texto";
import { categoriaTexto, cuentaTexto, Importe, RotuloContador } from "./comun";
import { MarcaAbriendo } from "./marca-abriendo";

type Props = {
  recurrentes: Recurrente[];
  /** `"YYYY-MM"`: rotula la columna del estado («Noviembre»). */
  mes: string;
};

export const RUTA_NUEVA_PLANTILLA = "/recurrentes?plantilla=nueva";

/** Rejilla de la tabla de escritorio, compartida por rótulos y filas. */
const REJILLA =
  "@5xl:grid-cols-[minmax(0,1.3fr)_110px_100px_minmax(0,1.2fr)_150px_140px_170px] @5xl:gap-4";

const SUBRAYADO_PUNTEADO = "border-b border-dashed border-terciario";

/** Estado de la plantilla en el mes. «Pausada» manda sobre lo demás. */
function EstadoMes({ r }: { r: Recurrente }) {
  if (r.pausada) {
    return <span className="text-terciario">Pausada desde {r.pausadaDesde ? formatearFechaSinAnio(r.pausadaDesde) : "—"}</span>;
  }

  const o = ocurrenciaDelMes(r);
  if (!o) {
    return (
      <span className="text-secundario">{r.proximoVencimiento ? `Próximo ${formatearFechaSinAnio(r.proximoVencimiento)}` : "—"}</span>
    );
  }

  const fecha = formatearFechaSinAnio(o.vencimiento);
  switch (o.estado) {
    case "pagada":
      return (
        <span className="inline-flex items-center gap-1 text-secundario">
          <Check size={14} strokeWidth={1.5} aria-hidden />
          Pagado {fecha}
        </span>
      );
    case "por_confirmar":
      return <span className={`whitespace-nowrap text-marca-texto ${SUBRAYADO_PUNTEADO}`}>Por confirmar · {fecha}</span>;
    case "vencida":
      return <span className={`whitespace-nowrap text-salida-texto ${SUBRAYADO_PUNTEADO}`}>Vencido · {fecha}</span>;
    case "programada":
      return (
        <span className="inline-flex items-center gap-1 text-secundario">
          <CalendarDays size={14} strokeWidth={1.5} aria-hidden />
          Programado {fecha}
        </span>
      );
    case "omitida":
      return <span className="text-secundario line-through">Omitido</span>;
  }
}

function FilaPlantilla({ r }: { r: Recurrente }) {
  const cada = formatearCada(r.periodicidad);
  const vence = formatearVence(r);
  return (
    <li>
      <Link
        href={`/recurrentes?plantilla=${encodeURIComponent(r.id)}`}
        scroll={false}
        className={`grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 border-b border-linea py-3 hover:bg-hundido focus-visible:-outline-offset-2 has-[[data-abriendo]]:bg-hundido ${REJILLA}`}
      >
        <span className="min-w-0">
          <span className={`block truncate text-cuerpo ${r.pausada ? "text-terciario" : ""}`}>{r.concepto}</span>
          {/* Móvil: «Mensual · Día 1 · estado». */}
          <span className="block text-etiqueta font-normal text-secundario @5xl:hidden">
            {cada} · {vence} · <EstadoMes r={r} />
          </span>
        </span>
        <span className="hidden text-etiqueta font-normal text-secundario @5xl:block">{cada}</span>
        <span className="hidden text-etiqueta font-normal text-secundario @5xl:block">{vence}</span>
        <span className="hidden truncate text-etiqueta font-normal text-secundario @5xl:block">{cuentaTexto(r)}</span>
        <span className="hidden truncate text-etiqueta font-normal text-secundario @5xl:block">{categoriaTexto(r)}</span>
        <Importe tipo={r.tipo} monto={r.monto} aproximado={r.variable} tenue={r.pausada} className="text-right" />
        <span className="hidden text-etiqueta font-normal @5xl:block">
          <EstadoMes r={r} />
        </span>
        <MarcaAbriendo />
      </Link>
    </li>
  );
}

/**
 * Plantillas en el orden de la API. Tabla de siete columnas cuando el
 * contenedor lo permite; si no, filas con concepto, «Mensual · Día 1 ·
 * estado» e importe. Cada fila abre su edición (`?plantilla=<id>`).
 */
export function ListaPlantillas({ recurrentes, mes }: Props) {
  const hayVariables = recurrentes.some((r) => r.variable);
  const nombreMes = formatearMes(mes).split(" ")[0];

  return (
    <section aria-label="Plantillas" className="@container">
      <div className="border-b border-raya pb-2">
        <RotuloContador titulo="Plantillas" cantidad={recurrentes.length} ancho="@5xl" />
      </div>
      <div
        aria-hidden
        className={`hidden border-b border-linea pt-3 pb-2 text-rotulo uppercase text-secundario @5xl:grid ${REJILLA}`}
      >
        <span>Concepto</span>
        <span>Cada</span>
        <span>Vence</span>
        <span>Cuenta</span>
        <span>Categoría</span>
        <span className="text-right">Importe</span>
        <span>{nombreMes}</span>
      </div>
      <ul>
        {recurrentes.map((r) => (
          <FilaPlantilla key={r.id} r={r} />
        ))}
      </ul>
      {hayVariables && (
        <p className="pt-3 text-etiqueta font-normal text-secundario">
          «≈» marca un importe variable: se estima con el último valor y se ajusta al confirmar.
        </p>
      )}
      <EnlaceTexto href={RUTA_NUEVA_PLANTILLA} scroll={false} className="mt-2 md:hidden">
        <Plus size={16} strokeWidth={1.5} aria-hidden />
        Nueva plantilla
      </EnlaceTexto>
    </section>
  );
}
