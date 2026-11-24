import { Check, Circle } from "lucide-react";
import {
  conceptoFila,
  esProgramada,
  etiquetaFila,
  fechaCorta,
  montoConSigno,
  textoSaldoInicio,
  type FilaHistorial,
} from "@/domain/cuenta/detalle";
import { Casilla } from "../casilla";
import { SubRenglones } from "../fila-movimiento";

type Props = {
  filas: readonly FilaHistorial[];
  fechaHoy: string;
  desde: string;
  saldoInicioRango: bigint;
  /** Ids elegidos para conciliar en lote. */
  seleccion: ReadonlySet<string>;
  /** Móvil: la casilla reemplaza al estado. En escritorio la casilla siempre está. */
  modoSeleccion: boolean;
  /** Sin ellas (archivada): sin casillas y el estado es un ícono fijo. */
  alElegir?: (id: string, elegida: boolean) => void;
  alConciliar?: (fila: FilaHistorial) => void;
};

/** Escritorio: casilla · fecha · concepto · categoría · movimiento · saldo · estado. */
const COLUMNAS = "grid-cols-[44px_64px_minmax(0,1fr)_170px_130px_130px_64px]";
/** Escritorio de una archivada: sin casillas. */
const COLUMNAS_LECTURA = "grid-cols-[64px_minmax(0,1fr)_170px_130px_130px_64px]";
/** Móvil: estado o casilla · concepto · movimiento · saldo. */
const COLUMNAS_MOVIL = "grid-cols-[24px_minmax(0,1fr)_76px_76px]";

function colorEfecto(n: bigint): string {
  return n > 0n ? "text-entrada-texto" : n < 0n ? "text-salida-texto" : "";
}

function partesDe(f: FilaHistorial) {
  return f.partes.map((p) => ({ categoria: p.categoria.nombre, monto: p.monto }));
}

/** Botón de estado de 44 px: ✓ conciliado (verde) u ○ pendiente; en una archivada, ícono fijo. */
function Estado({ fila, alConciliar, className = "" }: { fila: FilaHistorial; alConciliar?: (f: FilaHistorial) => void; className?: string }) {
  const icono = fila.conciliado ? (
    <Check size={18} strokeWidth={1.5} aria-hidden className="text-entrada-texto" />
  ) : (
    <Circle size={18} strokeWidth={1.5} aria-hidden className="text-terciario" />
  );
  if (!alConciliar) {
    return (
      <span className={`flex size-11 items-center justify-center ${className}`}>
        {icono}
        <span className="sr-only">{fila.conciliado ? "Conciliado" : "Pendiente"}</span>
      </span>
    );
  }
  const etiqueta = fila.conciliado ? "Conciliado. Tocar para desmarcar" : "Pendiente. Tocar para conciliar";
  return (
    <button
      type="button"
      onClick={() => alConciliar(fila)}
      aria-label={etiqueta}
      title={etiqueta}
      className={`flex size-11 items-center justify-center rounded-campo hover:bg-hundido ${className}`}
    >
      {icono}
    </button>
  );
}

/** Fecha en cifra-xs; una programada en latón con «Programado» debajo (N-39). */
function Fecha({ fila, fechaHoy }: { fila: FilaHistorial; fechaHoy: string }) {
  const programada = esProgramada(fila.fecha, fechaHoy);
  return (
    <span className="flex flex-col">
      <span className={`font-mono text-cifra-xs tabular-nums ${programada ? "text-marca-texto" : "text-secundario"}`}>
        {fechaCorta(fila.fecha, fechaHoy)}
      </span>
      {programada && <span className="text-rotulo uppercase text-marca-texto">Programado</span>}
    </span>
  );
}

/**
 * Historial con saldo corrido (SPEC 13), la más reciente primero, tal como
 * llega de la API. Cada fila: casilla de selección, fecha, concepto (con sus
 * partes), categoría, efecto con signo y color, saldo tras la fila y el
 * estado de conciliación. Pie: el saldo antes del rango. Rango vacío: «Sin
 * movimientos en este rango.» y el pie sigue.
 */
export function TablaHistorial({ filas, fechaHoy, desde, saldoInicioRango, seleccion, modoSeleccion, alElegir, alConciliar }: Props) {
  const lectura = !alElegir;
  const columnas = lectura ? COLUMNAS_LECTURA : COLUMNAS;
  const pie = (
    <div className="flex items-baseline justify-end gap-6 py-3">
      <span className="text-etiqueta font-normal text-secundario">{textoSaldoInicio(desde, fechaHoy)}</span>
      <span className="font-mono text-cifra-s tabular-nums">{montoConSigno(saldoInicioRango, false)}</span>
    </div>
  );
  const vacio = filas.length === 0 && (
    <p className="border-b border-linea py-6 text-etiqueta font-normal text-secundario">Sin movimientos en este rango.</p>
  );

  return (
    <section aria-label="Historial">
      {/* Escritorio */}
      <div role="table" className="hidden md:block">
        <div role="row" className={`grid ${columnas} items-end gap-x-3 border-b border-raya py-2 text-rotulo uppercase text-secundario`}>
          {!lectura && (
            <span role="columnheader">
              <span className="sr-only">Seleccionar</span>
            </span>
          )}
          <span role="columnheader">Fecha</span>
          <span role="columnheader">Concepto</span>
          <span role="columnheader">Categoría</span>
          <span role="columnheader" className="text-right">
            Movimiento
          </span>
          <span role="columnheader" className="text-right">
            Saldo
          </span>
          <span role="columnheader" className="text-center">
            Conc.
          </span>
        </div>
        {vacio}
        {filas.map((f) => {
          const elegida = seleccion.has(f.movimientoId);
          const concepto = conceptoFila(f);
          return (
            <div
              key={f.movimientoId}
              role="row"
              className={`grid ${columnas} items-center gap-x-3 border-b border-linea py-1 ${elegida ? "bg-hundido" : ""}`}
            >
              {alElegir && (
                <span role="cell">
                  <Casilla
                    nombre={`elegir-${f.movimientoId}`}
                    rotulo={`Seleccionar ${concepto}`}
                    rotuloOculto
                    marcada={elegida}
                    alCambiar={(marcada) => alElegir(f.movimientoId, marcada)}
                  />
                </span>
              )}
              <span role="cell">
                <Fecha fila={f} fechaHoy={fechaHoy} />
              </span>
              <span role="cell" className="flex min-w-0 flex-col py-2">
                <span className="truncate text-cuerpo">{concepto}</span>
                {f.partes.length > 0 && <SubRenglones partes={partesDe(f)} className="pt-1" />}
              </span>
              <span role="cell" className="truncate text-etiqueta font-normal text-secundario">
                {etiquetaFila(f)}
              </span>
              <span role="cell" className={`text-right font-mono text-cifra-s tabular-nums ${colorEfecto(f.efecto)}`}>
                {montoConSigno(f.efecto)}
              </span>
              <span role="cell" className="text-right font-mono text-cifra-s tabular-nums">
                {montoConSigno(f.saldo, false)}
              </span>
              <span role="cell" className="flex justify-center">
                <Estado fila={f} alConciliar={alConciliar} />
              </span>
            </div>
          );
        })}
        {pie}
      </div>

      {/* Móvil */}
      <div className="md:hidden">
        <div className={`grid ${COLUMNAS_MOVIL} gap-x-3 border-b border-raya py-2 text-rotulo uppercase text-secundario`}>
          <span>
            <span className="sr-only">{modoSeleccion ? "Seleccionar" : "Estado"}</span>
          </span>
          <span>Concepto</span>
          <span className="text-right">Mov.</span>
          <span className="text-right">Saldo</span>
        </div>
        {vacio}
        <ul>
          {filas.map((f) => {
            const elegida = seleccion.has(f.movimientoId);
            const concepto = conceptoFila(f);
            const programada = esProgramada(f.fecha, fechaHoy);
            return (
              <li
                key={f.movimientoId}
                className={`grid ${COLUMNAS_MOVIL} items-center gap-x-3 border-b border-linea py-1 ${elegida ? "bg-hundido" : ""}`}
              >
                {modoSeleccion && alElegir ? (
                  <span className="-ml-3">
                    <Casilla
                      nombre={`elegir-movil-${f.movimientoId}`}
                      rotulo={`Seleccionar ${concepto}`}
                      rotuloOculto
                      marcada={elegida}
                      alCambiar={(marcada) => alElegir(f.movimientoId, marcada)}
                    />
                  </span>
                ) : (
                  <Estado fila={f} alConciliar={alConciliar} className="-ml-3" />
                )}
                <span className="flex min-w-0 flex-col py-2">
                  <span className="truncate text-cuerpo">{concepto}</span>
                  <span className="truncate text-etiqueta font-normal text-secundario">
                    <span className={programada ? "text-marca-texto" : ""}>{fechaCorta(f.fecha, fechaHoy)}</span>
                    {programada && <span className="text-marca-texto"> · Programado</span>} · {etiquetaFila(f)}
                  </span>
                  {f.partes.length > 0 && <SubRenglones partes={partesDe(f)} className="pt-1" />}
                </span>
                <span className={`text-right font-mono text-cifra-s tabular-nums ${colorEfecto(f.efecto)}`}>{montoConSigno(f.efecto)}</span>
                <span className="text-right font-mono text-cifra-s tabular-nums">{montoConSigno(f.saldo, false)}</span>
              </li>
            );
          })}
        </ul>
        {pie}
      </div>
    </section>
  );
}
