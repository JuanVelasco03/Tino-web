import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, Clock } from "lucide-react";
import { formatearFechaSinAnio, mesDeFecha } from "@/domain/fecha/formato";
import {
  ayudaVencido,
  descripcionHistorial,
  formatearTasa,
  pesos,
  textoVencido,
  tieneTasa,
} from "@/domain/prestamo/presentacion";
import type { MovimientoPrestamo, PrestamoDetalle } from "@/domain/prestamo/tipos";
import { BOTON_ENLACE, RUTA_DEUDAS, rutaPrestamo } from "./rutas";

type Props = {
  detalle: PrestamoDetalle;
  /**
   * Fila de acciones con condonar (`CondonarPrestamo`), solo para un otorgado
   * con capital. Sin ella, las acciones simples. Una saldada no tiene acciones.
   */
  condonar?: ReactNode;
};

const TIPO_TEXTO = { te_debe: "Préstamo otorgado · te debe", le_debes: "Deuda contraída · le debes", saldado: "Saldada" } as const;
const ROTULO_CAPITAL = { te_debe: "Te debe", le_debes: "Le debes", saldado: "Saldo" } as const;

/** Capital del detalle en cifra-l: te debe en tinta, le debes con `−` en terracota base, saldada «0» en secundario. */
function CapitalGrande({ d }: { d: PrestamoDetalle }) {
  if (d.estado === "saldado") return <span className="font-mono text-cifra-l tabular-nums text-secundario">0</span>;
  if (d.estado === "le_debes") return <span className="font-mono text-cifra-l tabular-nums text-salida">{pesos(-d.capitalPendiente)}</span>;
  return <span className="font-mono text-cifra-l tabular-nums">{pesos(d.capitalPendiente)}</span>;
}

/** Aviso de fecha vencida: reloj y texto en latón, ayuda en secundario. */
export function AvisoVencido({ d, className = "" }: { d: PrestamoDetalle; className?: string }) {
  if (!d.vencido || !d.fechaAcordada) return null;
  return (
    <div role="status" className={`grid grid-cols-[16px_minmax(0,1fr)] gap-2 ${className}`}>
      <span className="flex h-[22px] items-center text-marca-texto">
        <Clock size={16} strokeWidth={1.5} aria-hidden />
      </span>
      <p className="flex flex-col">
        <span className="text-cuerpo font-semibold text-marca-texto">{textoVencido(d.fechaAcordada, d.fechaHoy)}.</span>
        <span className="text-etiqueta font-normal text-secundario">{ayudaVencido(d)}</span>
      </p>
    </div>
  );
}

const FILA = "flex items-baseline justify-between gap-3 border-b border-linea py-2";

function Resumen({ d }: { d: PrestamoDetalle }) {
  const otorgado = d.tipo === "prestamo_otorgado";
  return (
    <dl aria-label="Resumen">
      <div className={FILA}>
        <dt className="text-cuerpo text-secundario">{otorgado ? "Le prestaste" : "Te prestó"}</dt>
        <dd className="font-mono text-cifra-s tabular-nums">{pesos(d.totalPrestado)}</dd>
      </div>
      <div className={FILA}>
        <dt className="text-cuerpo text-secundario">{d.totalCondonado > 0n ? "Abonos y condonación" : "Abonos a capital"}</dt>
        <dd className="font-mono text-cifra-s tabular-nums">{pesos(-d.totalAbonado)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-3 py-2 doble-raya">
        <dt className="text-cuerpo font-semibold">Capital pendiente</dt>
        <dd className="font-mono text-cifra-s font-semibold tabular-nums">{pesos(d.capitalPendiente)}</dd>
      </div>
    </dl>
  );
}

function Condicion({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className={FILA}>
      <dt className="text-etiqueta font-normal text-secundario">{rotulo}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function Condiciones({ d }: { d: PrestamoDetalle }) {
  const otorgado = d.tipo === "prestamo_otorgado";
  const conTasa = tieneTasa(d.tasaMensual);
  return (
    <dl aria-label="Condiciones">
      <Condicion rotulo="Intereses">
        <span className="text-cuerpo">{formatearTasa(d.tasaMensual)}</span>
      </Condicion>
      {conTasa && (
        <Condicion rotulo={otorgado ? "Intereses cobrados" : "Intereses pagados"}>
          <span className="font-mono text-cifra-s tabular-nums">{pesos(d.interesesCobrados)}</span>
        </Condicion>
      )}
      {conTasa && d.estado !== "saldado" && (
        <Condicion rotulo={otorgado ? "Causados sin cobrar" : "Causados sin pagar"}>
          <span className="font-mono text-cifra-s tabular-nums">{pesos(d.interesesCausados)}</span>
        </Condicion>
      )}
      <Condicion rotulo="Fecha acordada">
        <span className="font-mono text-cifra-s tabular-nums">{d.fechaAcordada ? formatearFechaSinAnio(d.fechaAcordada) : "—"}</span>
      </Condicion>
    </dl>
  );
}

/** Interés de una fila: `+` en verde (te debe) o `−` en terracota (le debes); sin interés, «—» en terciario. */
function Interes({ interes, otorgado, className = "" }: { interes: bigint; otorgado: boolean; className?: string }) {
  if (interes === 0n) return <span className={`text-terciario ${className}`}>—</span>;
  return (
    <span className={`${otorgado ? "text-entrada-texto" : "text-salida-texto"} ${className}`}>
      {otorgado ? `+${pesos(interes)}` : pesos(-interes)}
    </span>
  );
}

/** Ancha (contenedor ≥ 672 px): las cinco columnas del diseño. Angosta: descripción, capital y saldo. */
const COLUMNAS = "grid-cols-[minmax(0,1fr)_84px_84px] @2xl:grid-cols-[64px_minmax(0,1fr)_130px_110px_140px]";

function FilaHistorial({ fila, d }: { fila: MovimientoPrestamo; d: PrestamoDetalle }) {
  const otorgado = d.tipo === "prestamo_otorgado";
  const id = fila.movimientoId ?? fila.movimientoInteresId;
  const contenido = (
    <>
      <span className="hidden font-mono text-cifra-xs tabular-nums text-secundario @2xl:block">{formatearFechaSinAnio(fila.fecha)}</span>
      <span className="flex min-w-0 flex-col">
        <span className="text-cuerpo">{descripcionHistorial(d.tipo, fila)}</span>
        <span className="font-mono text-cifra-xs tabular-nums text-secundario @2xl:hidden">
          {formatearFechaSinAnio(fila.fecha)}
          {fila.interes !== 0n && (
            <>
              {" · interés "}
              <Interes interes={fila.interes} otorgado={otorgado} />
            </>
          )}
        </span>
      </span>
      <span className="text-right font-mono text-cifra-s tabular-nums">{pesos(fila.capital)}</span>
      <Interes interes={fila.interes} otorgado={otorgado} className="hidden text-right font-mono text-cifra-s tabular-nums @2xl:block" />
      <span className="text-right font-mono text-cifra-s font-medium tabular-nums">{pesos(fila.saldoCapital)}</span>
    </>
  );
  const clase = `grid ${COLUMNAS} items-baseline gap-3 border-b border-linea px-2 py-3`;
  return (
    <li>
      {id ? (
        <Link href={`/movimientos?mes=${mesDeFecha(fila.fecha)}&movimiento=${encodeURIComponent(id)}`} className={`${clase} hover:bg-hundido`}>
          {contenido}
        </Link>
      ) : (
        <div className={clase}>{contenido}</div>
      )}
    </li>
  );
}

function Historial({ d }: { d: PrestamoDetalle }) {
  return (
    <section aria-label="Historial">
      <div className={`grid ${COLUMNAS} items-baseline gap-3 border-b border-raya px-2 pb-2 text-rotulo uppercase`}>
        <span className="hidden @2xl:block">Fecha</span>
        <span>Historial</span>
        <span className="text-right">Capital</span>
        <span className="hidden text-right @2xl:block">Interés</span>
        <span className="text-right">
          <span className="@2xl:hidden">Saldo</span>
          <span className="hidden @2xl:inline">Saldo capital</span>
        </span>
      </div>
      <ul>
        {d.historial.map((fila, i) => (
          <FilaHistorial key={`${fila.movimientoId ?? fila.movimientoInteresId ?? "fila"}-${i}`} fila={fila} d={d} />
        ))}
      </ul>
    </section>
  );
}

/**
 * «Registrar abono», «Cambiar fecha acordada» y, a la derecha (debajo en
 * móvil), `extra` («Condonar lo pendiente…»). Escritorio en fila; móvil a todo
 * el ancho.
 */
export function AccionesPrestamo({ id, extra }: { id: string; extra?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 @lg:flex-row @lg:flex-wrap @lg:items-center">
      <Link href={rutaPrestamo(id, "abono")} scroll={false} className={BOTON_ENLACE.primario}>
        Registrar abono
      </Link>
      <Link href={rutaPrestamo(id, "editar")} scroll={false} className={BOTON_ENLACE.secundario}>
        Cambiar fecha acordada
      </Link>
      {extra && <div className="flex justify-center @lg:ml-auto">{extra}</div>}
    </div>
  );
}

/**
 * Detalle de una persona (N-25 a N-42): cabecera, resumen, condiciones,
 * aviso de fecha vencida, historial y acciones. Todo llega calculado de la
 * API; aquí solo se formatea.
 */
export function DetallePrestamo({ detalle: d, condonar }: Props) {
  return (
    <article aria-label={d.nombre} className="@container flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link href={RUTA_DEUDAS} className="-ml-1 inline-flex h-11 items-center gap-1 self-start text-cuerpo text-secundario md:hidden">
          <ChevronLeft size={20} strokeWidth={1.5} aria-hidden />
          Deudas
        </Link>
        <header className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-6 md:border-b md:border-raya md:pb-4">
          <div className="flex min-w-0 flex-col">
            <span className="text-etiqueta font-normal text-secundario">{TIPO_TEXTO[d.estado]}</span>
            <h2 className="text-titulo-2">{d.nombre}</h2>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-t border-raya pt-3 md:flex-col md:items-end md:gap-1 md:border-0 md:pt-0">
            <span className="text-rotulo uppercase text-secundario">{ROTULO_CAPITAL[d.estado]}</span>
            <CapitalGrande d={d} />
          </div>
        </header>
        <AvisoVencido d={d} className="@lg:hidden" />
      </div>

      <div className="grid gap-8 @lg:grid-cols-2">
        <Resumen d={d} />
        <div className="flex flex-col gap-4">
          <Condiciones d={d} />
          <AvisoVencido d={d} className="hidden @lg:grid" />
        </div>
      </div>

      <Historial d={d} />

      {d.estado !== "saldado" && (condonar ?? <AccionesPrestamo id={d.id} />)}
    </article>
  );
}
