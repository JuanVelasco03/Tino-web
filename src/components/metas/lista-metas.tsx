import Link from "next/link";
import { partesTotales, pesos, textoFechaLista, textoPorcentaje, textoRitmo } from "@/domain/meta/presentacion";
import type { Meta, TotalesMetas } from "@/domain/meta/tipos";
import { IconoCuenta } from "../iconos";
import { BarraAvance } from "./barra-avance";
import { rutaMeta } from "./rutas";

type PropsFila = {
  m: Meta;
  /** Hoy según la API; `null` en archivadas (fechas con año, sin ritmo). */
  fechaHoy: string | null;
  elegida: boolean;
  /** La fila enlaza a `/metas/archivadas?meta=<id>`. */
  archivada?: boolean;
};

/**
 * Una meta: enlace a su detalle sin mover la página. Escritorio: nombre y
 * porcentaje, barra de 4 px, «600.000 de 1.800.000» y la fecha. Móvil: el
 * avance en cifra-m, la cuenta con su icono y, en las activas, el ritmo corto.
 */
export function FilaMeta({ m, fechaHoy, elegida, archivada = false }: PropsFila) {
  const cumplida = m.cumplidaEl !== null;
  const avance = m.avance === null ? "—" : pesos(m.avance);
  const ritmo = cumplida ? null : textoRitmo(m, fechaHoy, "corto");
  return (
    <li>
      <Link
        href={rutaMeta(m.id, archivada)}
        scroll={false}
        aria-current={elegida ? "true" : undefined}
        className={`flex flex-col gap-2 border-b border-linea px-2 py-3 hover:bg-hundido ${elegida ? "bg-hundido" : ""}`}
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className={`truncate text-cuerpo font-semibold ${cumplida ? "text-secundario" : ""}`}>{m.nombre}</span>
          <span className="shrink-0 font-mono text-cifra-xs tabular-nums text-secundario">{textoPorcentaje(m.porcentaje)}</span>
        </span>

        {/* Móvil: el avance grande antes de la barra. */}
        <span className="flex items-baseline justify-between gap-3 md:hidden">
          <span className="font-mono text-cifra-m font-medium tabular-nums">{avance}</span>
          <span className="text-etiqueta font-normal text-secundario">
            de <span className="font-mono tabular-nums">{pesos(m.objetivo)}</span>
          </span>
        </span>

        <BarraAvance porcentaje={m.porcentaje} alto="lista" cumplida={cumplida} />

        <span className="hidden items-baseline justify-between gap-3 md:flex">
          <span className="flex items-baseline gap-1">
            <span className="font-mono text-cifra-xs tabular-nums">{avance}</span>
            <span className="text-etiqueta font-normal text-secundario">de</span>
            <span className="font-mono text-cifra-xs tabular-nums text-secundario">{pesos(m.objetivo)}</span>
          </span>
          <span className="text-right text-etiqueta font-normal text-secundario">{textoFechaLista(m, fechaHoy)}</span>
        </span>

        <span className="flex items-center justify-between gap-3 text-etiqueta font-normal text-secundario md:hidden">
          <span className="flex min-w-0 items-center gap-1">
            <IconoCuenta tipo={m.cuenta.tipo} tamano={16} />
            <span className="truncate">{m.cuenta.nombre}</span>
          </span>
          <span className="shrink-0">{textoFechaLista(m, fechaHoy)}</span>
        </span>
        {ritmo && <span className="text-etiqueta font-normal md:hidden">{ritmo}</span>}
      </Link>
    </li>
  );
}

function Grupo({ rotulo, metas, fechaHoy, elegida, cumplidas }: { rotulo: string; metas: readonly Meta[]; fechaHoy: string; elegida: string | null; cumplidas?: boolean }) {
  if (metas.length === 0) return null;
  return (
    <section aria-label={rotulo}>
      <h2 className={`border-b border-raya px-2 pb-2 text-rotulo uppercase ${cumplidas ? "text-secundario" : ""}`}>{rotulo}</h2>
      <ul>
        {metas.map((m) => (
          <FilaMeta key={m.id} m={m} fechaHoy={fechaHoy} elegida={m.id === elegida} />
        ))}
      </ul>
    </section>
  );
}

type Props = {
  /** En el orden de la API: se muestran sin reordenar. */
  activas: readonly Meta[];
  cumplidas: readonly Meta[];
  fechaHoy: string;
  /** La meta cuyo detalle se ve: fila resaltada. */
  elegida: string | null;
};

/** Lista de metas en «Activas» y «Cumplidas» (los grupos vacíos no salen). */
export function ListaMetas({ activas, cumplidas, fechaHoy, elegida }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <Grupo rotulo="Activas" metas={activas} fechaHoy={fechaHoy} elegida={elegida} />
      <Grupo rotulo="Cumplidas" metas={cumplidas} fechaHoy={fechaHoy} elegida={elegida} cumplidas />
    </div>
  );
}

/** Archivadas: sin grupos, en el orden de la API, fechas con año. */
export function ListaMetasArchivadas({ metas, elegida }: { metas: readonly Meta[]; elegida: string | null }) {
  return (
    <ul aria-label="Metas archivadas" className="border-t border-raya">
      {metas.map((m) => (
        <FilaMeta key={m.id} m={m} fechaHoy={null} elegida={m.id === elegida} archivada />
      ))}
    </ul>
  );
}

/**
 * «En metas activas: 34.430.000 de 54.300.000» (móvil sin los dos puntos), en
 * `etiqueta` secundaria con el avance en mono tinta y el objetivo en mono
 * secundario. Sin TRM, « · sin 1 meta sin TRM» en `marca-texto`.
 */
export function TotalesCabecera({ totales, activas }: { totales: TotalesMetas; activas: readonly Meta[] }) {
  const p = partesTotales(totales, activas);
  if (p === null) return <p className="text-etiqueta font-normal text-secundario">Sin metas activas.</p>;
  return (
    <p className="text-etiqueta font-normal text-secundario">
      En metas activas<span className="hidden md:inline">:</span> <span className="font-mono text-texto tabular-nums">{p.avance}</span> de{" "}
      <span className="font-mono tabular-nums">{p.objetivo}</span>
      {p.sinTrm && <span className="text-marca-texto"> {p.sinTrm}</span>}
    </p>
  );
}
