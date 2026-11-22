import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Check, Clock } from "lucide-react";
import { formatearFechaSinAnio } from "@/domain/fecha/formato";
import { diasDesde, pesos, textoCierre } from "@/domain/prestamo/presentacion";
import type { EstadoPrestamo, Prestamo } from "@/domain/prestamo/tipos";
import { rutaPrestamo } from "./rutas";

type Props = {
  /** En el orden de la API: se agrupan por `estado` sin reordenar (N-15). */
  prestamos: Prestamo[];
  /** Hoy según la API: «89 días» nunca usa el reloj del navegador. */
  fechaHoy: string;
  /** Totales de grupo, de la API (`teDeben.total`, `debes.total`). */
  totales: { teDeben: bigint; debes: bigint };
  /** La persona cuyo detalle se ve: fila resaltada. */
  elegido: string | null;
};

const GRUPOS: readonly { estado: EstadoPrestamo; rotulo: string }[] = [
  { estado: "te_debe", rotulo: "Te deben" },
  { estado: "le_debes", rotulo: "Debes" },
  { estado: "saldado", rotulo: "Saldadas" },
];

const ETIQUETA: Record<EstadoPrestamo, string> = { te_debe: "te debe", le_debes: "le debes", saldado: "saldada" };

function Icono({ p }: { p: Prestamo }) {
  const Componente = p.estado === "saldado" ? Check : p.tipo === "prestamo_otorgado" ? ArrowUpRight : ArrowDownLeft;
  return <Componente size={20} strokeWidth={1.5} aria-hidden />;
}

/** Capital como se lee: te debe en tinta; le debes con `−` en terracota; saldada «0» en secundario. */
function Capital({ p }: { p: Prestamo }) {
  if (p.estado === "saldado") return <span className="font-mono text-cifra-s tabular-nums text-secundario">0</span>;
  if (p.estado === "le_debes") {
    return <span className="font-mono text-cifra-s tabular-nums text-salida-texto">{pesos(-p.capitalPendiente)}</span>;
  }
  return <span className="font-mono text-cifra-s tabular-nums">{pesos(p.capitalPendiente)}</span>;
}

/** Una persona: enlace a su detalle (`?prestamo=<id>`) sin mover la página. */
export function FilaPrestamo({ p, fechaHoy, elegida }: { p: Prestamo; fechaHoy: string; elegida: boolean }) {
  const saldada = p.estado === "saldado";
  return (
    <li>
      <Link
        href={rutaPrestamo(p.id)}
        scroll={false}
        aria-current={elegida ? "true" : undefined}
        className={`grid grid-cols-[20px_minmax(0,1fr)_auto] items-start gap-3 border-b border-linea px-2 py-3 hover:bg-hundido ${
          elegida ? "bg-hundido" : ""
        }`}
      >
        <span className="flex h-[22px] items-center text-secundario">
          <Icono p={p} />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className={`truncate text-cuerpo font-semibold ${saldada ? "text-secundario" : ""}`}>{p.nombre}</span>
          <span className="text-etiqueta font-normal text-secundario">
            {p.cierre ? (
              textoCierre(p.tipo, p.cierre)
            ) : p.desde ? (
              <>
                Desde el {formatearFechaSinAnio(p.desde)} · <span className="font-mono tabular-nums">{diasDesde(p.desde, fechaHoy)}</span> días
              </>
            ) : null}
          </span>
          {p.vencido && p.fechaAcordada && (
            <span className="flex items-center gap-1 text-etiqueta font-normal text-marca-texto">
              <Clock size={16} strokeWidth={1.5} aria-hidden />
              Fecha acordada: {formatearFechaSinAnio(p.fechaAcordada)}
            </span>
          )}
        </span>
        <span className="flex flex-col items-end">
          <Capital p={p} />
          <span className="font-mono text-cifra-xs text-secundario">{ETIQUETA[p.estado]}</span>
        </span>
      </Link>
    </li>
  );
}

/**
 * Lista de personas en «Te deben», «Debes» y «Saldadas» (los grupos vacíos no
 * salen). Rótulo y total sobre una raya; «Saldadas» en secundario y sin total.
 */
export function ListaPrestamos({ prestamos, fechaHoy, totales, elegido }: Props) {
  return (
    <div className="flex flex-col gap-8">
      {GRUPOS.map(({ estado, rotulo }) => {
        const del = prestamos.filter((p) => p.estado === estado);
        if (del.length === 0) return null;
        const total = estado === "te_debe" ? totales.teDeben : estado === "le_debes" ? totales.debes : null;
        return (
          <section key={estado} aria-label={rotulo}>
            <div className="flex items-baseline justify-between gap-3 border-b border-raya px-2 pb-2">
              <h2 className={`text-rotulo uppercase ${estado === "saldado" ? "text-secundario" : ""}`}>{rotulo}</h2>
              {total !== null && (
                <span className={`font-mono text-cifra-s tabular-nums ${estado === "le_debes" ? "text-salida-texto" : ""}`}>
                  {pesos(estado === "le_debes" ? -total : total)}
                </span>
              )}
            </div>
            <ul>
              {del.map((p) => (
                <FilaPrestamo key={p.id} p={p} fechaHoy={fechaHoy} elegida={p.id === elegido} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
