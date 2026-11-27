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
import { EnlaceTexto } from "../enlace-texto";
import { BOTON_ENLACE } from "../boton";
import { RUTA_DEUDAS, rutaPrestamo } from "./rutas";

type Props = {
  detalle: PrestamoDetalle;
  /**
   * Fila de acciones con condonar (`CondonarPrestamo`), solo para un otorgado
   * con capital. Sin ella, las acciones simples. Una saldada no tiene acciones.
   */
  condonar?: ReactNode;
};

/** El tipo sobre el nombre; «te debe» / «le debes» ya lo dice el rótulo del capital. */
function tipoTexto(d: PrestamoDetalle): string {
  const tipo = d.tipo === "prestamo_otorgado" ? "Préstamo otorgado" : "Deuda contraída";
  return d.estado === "saldado" ? `${tipo} · saldado` : tipo;
}
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
        <span className="text-cuerpo font-semibold text-pretty text-marca-texto">{textoVencido(d.fechaAcordada, d.fechaHoy)}.</span>
        <span className="text-etiqueta font-normal text-pretty text-secundario">{ayudaVencido(d)}</span>
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
        <Condicion rotulo={otorgado ? "Intereses sin cobrar" : "Intereses sin pagar"}>
          <span className="font-mono text-cifra-s tabular-nums">{pesos(d.interesesCausados)}</span>
        </Condicion>
      )}
      <Condicion rotulo="Fecha acordada">
        <span className="font-mono text-cifra-s tabular-nums">{d.fechaAcordada ? formatearFechaSinAnio(d.fechaAcordada) : "—"}</span>
      </Condicion>
    </dl>
  );
}

/** Interés de una fila: `+` en verde (te debe) o `−` en terracota (le debes); sin interés, «—» en secundario (dice algo: no `terciario`). */
function Interes({ interes, otorgado, className = "" }: { interes: bigint; otorgado: boolean; className?: string }) {
  if (interes === 0n) return <span className={`text-secundario ${className}`}>—</span>;
  return (
    <span className={`${otorgado ? "text-entrada-texto" : "text-salida-texto"} ${className}`}>
      {otorgado ? `+${pesos(interes)}` : pesos(-interes)}
    </span>
  );
}

/**
 * Ancha (contenedor ≥ 672 px): las cinco columnas del diseño. Angosta: descripción, capital y saldo.
 * Las de cifras tienen ancho mínimo y crecen con la cifra más larga; cada fila hereda las columnas
 * de la tabla (`subgrid`), así que todas crecen juntas y siguen alineadas dígito con dígito.
 */
const COLUMNAS =
  "grid-cols-[minmax(0,1fr)_minmax(84px,auto)_minmax(84px,auto)] @2xl:grid-cols-[64px_minmax(0,1fr)_minmax(130px,auto)_minmax(110px,auto)_minmax(140px,auto)]";
const FILA_TABLA = "col-span-full grid grid-cols-subgrid";

/**
 * Desde 12 caracteres («1.234.567.890»), dos columnas de cifras ya no dejan a la descripción
 * un ancho legible en un teléfono (390 px). Entonces, en la tabla angosta, la descripción toma
 * su renglón entero y capital y saldo bajan al siguiente, alineados a la derecha.
 */
const LARGO_CIFRA_APILADA = 12;

function cifrasLargas(d: PrestamoDetalle): boolean {
  return d.historial.some((f) => pesos(f.capital).length >= LARGO_CIFRA_APILADA || pesos(f.saldoCapital).length >= LARGO_CIFRA_APILADA);
}

function FilaHistorial({ fila, d, apilada }: { fila: MovimientoPrestamo; d: PrestamoDetalle; apilada: boolean }) {
  const otorgado = d.tipo === "prestamo_otorgado";
  const id = fila.movimientoId ?? fila.movimientoInteresId;
  const contenido = (
    <>
      <span className="hidden font-mono text-cifra-xs tabular-nums text-secundario @2xl:block">{formatearFechaSinAnio(fila.fecha)}</span>
      <span className={`flex min-w-0 flex-col ${apilada ? "col-span-full @2xl:col-span-1" : ""}`}>
        <span className="text-cuerpo break-words">{descripcionHistorial(d.tipo, fila)}</span>
        <span className="font-mono text-cifra-xs tabular-nums text-secundario @2xl:hidden">
          {formatearFechaSinAnio(fila.fecha)}
          {fila.interes !== 0n && (
            <>
              {" · "}
              {/* «interés +12.000» no se parte: si no cabe, baja entero. */}
              <span className="whitespace-nowrap">
                interés <Interes interes={fila.interes} otorgado={otorgado} />
              </span>
            </>
          )}
        </span>
      </span>
      <span className={`text-right font-mono text-cifra-s tabular-nums ${apilada ? "col-start-2 @2xl:col-start-auto" : ""}`}>{pesos(fila.capital)}</span>
      <Interes interes={fila.interes} otorgado={otorgado} className="hidden text-right font-mono text-cifra-s tabular-nums @2xl:block" />
      <span className="text-right font-mono text-cifra-s font-medium tabular-nums">{pesos(fila.saldoCapital)}</span>
    </>
  );
  const clase = `${FILA_TABLA} items-baseline border-b border-linea px-2 py-3 ${apilada ? "gap-y-1 @2xl:gap-y-0" : ""}`;
  return (
    <li className={FILA_TABLA}>
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
  const apilada = cifrasLargas(d);
  return (
    <section aria-label="Historial" className={`grid ${COLUMNAS} gap-x-3`}>
      <div className={`${FILA_TABLA} items-baseline border-b border-raya px-2 pb-2 text-rotulo uppercase`}>
        <span className="hidden @2xl:block">Fecha</span>
        <span>Historial</span>
        <span className="text-right">Capital</span>
        <span className="hidden text-right @2xl:block">Interés</span>
        <span className="text-right">
          <span className="@2xl:hidden">Saldo</span>
          <span className="hidden @2xl:inline">Saldo capital</span>
        </span>
      </div>
      <ul className={FILA_TABLA}>
        {d.historial.map((fila, i) => (
          <FilaHistorial key={`${fila.movimientoId ?? fila.movimientoInteresId ?? "fila"}-${i}`} fila={fila} d={d} apilada={apilada} />
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
    <article aria-label={d.nombre} className="@container asentar flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        {/* Como «‹ Cuentas»: volver es una acción de navegación, en latón. */}
        <EnlaceTexto href={RUTA_DEUDAS} className="-ml-1 gap-1 self-start md:hidden">
          <ChevronLeft size={20} strokeWidth={1.5} aria-hidden />
          Deudas
        </EnlaceTexto>
        <header className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-6 md:border-b md:border-raya md:pb-4">
          <div className="flex min-w-0 flex-col">
            <span className="text-etiqueta font-normal text-secundario">{tipoTexto(d)}</span>
            <h2 className="text-titulo-2 break-words">{d.nombre}</h2>
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

      {/* Antes del historial: abonar es lo diario y no debe quedar al fondo de una tabla larga (en un teléfono, tras todo el historial). */}
      {d.estado !== "saldado" && (condonar ?? <AccionesPrestamo id={d.id} />)}

      <Historial d={d} />
    </article>
  );
}
