import type { ReactNode } from "react";
import { fechaCorta, montoConSigno } from "@/domain/cuenta/detalle";
import {
  categoriaAbono,
  categoriaConsumo,
  conceptoCiclo,
  detalleCargo,
  etiquetaAbono,
  textoConsumos,
  type FilaCiclo,
} from "@/domain/cuenta/tarjeta";

type Fila = FilaCiclo & { movimientoId: string; fecha: string };

type Props = {
  ciclo: {
    corteAnterior: { fecha: string; saldo: bigint };
    abonos: Fila[];
    saldoAnteriorPendiente: bigint;
    consumos: Fila[];
    totalConsumos: bigint;
    cargos: (Fila & { clase: "intereses" | "cuota_manejo" })[];
    totalCargos: bigint;
    deudaAlCorte: bigint;
  };
  fechaHoy: string;
};

/** Escritorio: fecha · concepto · categoría · cargo · abono. */
const COLUMNAS = "grid-cols-[64px_minmax(0,1fr)_150px_110px_110px]";
/** Móvil: fecha · concepto · monto. */
const COLUMNAS_MOVIL = "grid-cols-[48px_minmax(0,1fr)_96px]";

function pesos(n: bigint): string {
  return montoConSigno(n, false);
}

function FilaEscritorio({ fecha, concepto, categoria, cargo, abono, tenue = false }: { fecha?: string; concepto: string; categoria?: string; cargo?: string; abono?: string; tenue?: boolean }) {
  return (
    <div role="row" className={`grid ${COLUMNAS} items-baseline gap-x-3 border-b border-linea py-3`}>
      <span role="cell" className="font-mono text-cifra-xs tabular-nums text-secundario">
        {fecha}
      </span>
      <span role="cell" className="truncate text-cuerpo">
        {concepto}
      </span>
      <span role="cell" className="truncate text-etiqueta font-normal text-secundario">
        {categoria}
      </span>
      <span role="cell" className={`text-right font-mono text-cifra-s tabular-nums ${tenue ? "text-secundario" : ""}`}>
        {cargo}
      </span>
      <span role="cell" className="text-right font-mono text-cifra-s tabular-nums">
        {abono}
      </span>
    </div>
  );
}

/** Pie de un bloque: rótulo a la derecha y cifra en la columna del cargo. */
function PieEscritorio({ rotulo, cifra, fuerte = false }: { rotulo: string; cifra: string; fuerte?: boolean }) {
  return (
    <div role="row" className={`grid ${COLUMNAS} items-baseline gap-x-3 py-3`}>
      <span role="cell" className="col-span-3 text-right text-etiqueta font-normal text-secundario">
        {rotulo}
      </span>
      <span role="cell" className={`text-right font-mono text-cifra-s tabular-nums ${fuerte ? "font-semibold" : ""}`}>
        {cifra}
      </span>
      <span role="cell" />
    </div>
  );
}

function Subtitulo({ children }: { children: ReactNode }) {
  return <h3 className="border-b border-raya pt-6 pb-2 text-rotulo uppercase text-secundario">{children}</h3>;
}

function Vacio({ children }: { children: ReactNode }) {
  return <p className="border-b border-linea py-3 text-etiqueta font-normal text-secundario">{children}</p>;
}

/**
 * Ciclo en curso de la tarjeta (SPEC 13). Saldo al corte anterior y abonos
 * con el saldo anterior pendiente; consumos del período con su subtotal;
 * cargos del banco (no son consumos) con el suyo; y la deuda al corte sobre
 * una raya fuerte. Todas las cifras de la API. Móvil: sin abonos detallados,
 * consumos en tres columnas y cargos con su categoría.
 */
export function CicloTarjeta({ ciclo, fechaHoy }: Props) {
  const fecha = (f: string) => fechaCorta(f, fechaHoy);
  const pendiente = montoConSigno(ciclo.saldoAnteriorPendiente, false);

  return (
    <section aria-label="Ciclo en curso">
      <div className="flex items-baseline justify-between gap-3 border-b border-raya pb-2">
        <h2 className="text-rotulo uppercase">Ciclo en curso</h2>
        <span className="text-etiqueta font-normal text-secundario">{textoConsumos(ciclo.consumos.length)}</span>
      </div>

      {/* Escritorio */}
      <div role="table" className="hidden md:block">
        <div role="row" className={`grid ${COLUMNAS} gap-x-3 border-b border-linea py-2 text-rotulo uppercase text-secundario`}>
          <span role="columnheader">Fecha</span>
          <span role="columnheader">Concepto</span>
          <span role="columnheader">Categoría</span>
          <span role="columnheader" className="text-right">
            Cargo
          </span>
          <span role="columnheader" className="text-right">
            Abono
          </span>
        </div>
        <FilaEscritorio fecha={fecha(ciclo.corteAnterior.fecha)} concepto="Saldo al corte anterior" cargo={pesos(ciclo.corteAnterior.saldo)} tenue />
        {ciclo.abonos.map((f) => (
          <FilaEscritorio key={f.movimientoId} fecha={fecha(f.fecha)} concepto={etiquetaAbono(f)} categoria={categoriaAbono(f)} abono={pesos(f.monto)} />
        ))}
        <PieEscritorio rotulo="Saldo anterior pendiente" cifra={pendiente} fuerte />

        <Subtitulo>Consumos del período</Subtitulo>
        {ciclo.consumos.length === 0 && <Vacio>Sin consumos en este ciclo.</Vacio>}
        {ciclo.consumos.map((f) => (
          <FilaEscritorio key={f.movimientoId} fecha={fecha(f.fecha)} concepto={conceptoCiclo(f)} categoria={categoriaConsumo(f)} cargo={pesos(f.monto)} />
        ))}
        <PieEscritorio rotulo="Subtotal consumos" cifra={pesos(ciclo.totalConsumos)} />

        <Subtitulo>Cargos del banco · no son consumos</Subtitulo>
        {ciclo.cargos.length === 0 && <Vacio>Sin cargos en este ciclo.</Vacio>}
        {ciclo.cargos.map((f) => (
          <FilaEscritorio
            key={f.movimientoId}
            fecha={fecha(f.fecha)}
            concepto={f.descripcion ?? f.categoria?.nombre ?? "Cargo"}
            categoria={detalleCargo(f, ciclo)}
            cargo={pesos(f.monto)}
          />
        ))}
        <PieEscritorio rotulo="Subtotal cargos" cifra={pesos(ciclo.totalCargos)} />

        <div className="flex items-baseline justify-end gap-6 border-t border-raya pt-3">
          <span className="text-etiqueta font-normal text-secundario">Deuda actual</span>
          <span className="font-mono text-cifra-m tabular-nums">{pesos(ciclo.deudaAlCorte)}</span>
        </div>
      </div>

      {/* Móvil */}
      <div className="md:hidden">
        <div className="flex items-baseline justify-between gap-3 border-b border-linea py-3">
          <span className="text-cuerpo">Saldo anterior pendiente</span>
          <span className="font-mono text-cifra-s font-semibold tabular-nums">{pendiente}</span>
        </div>

        <Subtitulo>Consumos del período</Subtitulo>
        {ciclo.consumos.length === 0 && <Vacio>Sin consumos en este ciclo.</Vacio>}
        <ul>
          {ciclo.consumos.map((f) => (
            <li key={f.movimientoId} className={`grid ${COLUMNAS_MOVIL} items-baseline gap-x-3 border-b border-linea py-3`}>
              <span className="font-mono text-cifra-xs tabular-nums text-secundario">{fecha(f.fecha)}</span>
              <span className="truncate text-cuerpo">{conceptoCiclo(f)}</span>
              <span className="text-right font-mono text-cifra-s tabular-nums">{pesos(f.monto)}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-baseline justify-end gap-6 py-3">
          <span className="text-etiqueta font-normal text-secundario">Subtotal consumos</span>
          <span className="font-mono text-cifra-s tabular-nums">{pesos(ciclo.totalConsumos)}</span>
        </div>

        <Subtitulo>Cargos del banco</Subtitulo>
        {ciclo.cargos.length === 0 && <Vacio>Sin cargos en este ciclo.</Vacio>}
        <ul>
          {ciclo.cargos.map((f) => (
            <li key={f.movimientoId} className="flex items-baseline justify-between gap-3 border-b border-linea py-3">
              <span className="truncate text-cuerpo">{f.categoria?.nombre ?? f.descripcion ?? "Cargo"}</span>
              <span className="font-mono text-cifra-s tabular-nums">{pesos(f.monto)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex items-baseline justify-between gap-6 border-t border-raya pt-3">
          <span className="text-etiqueta font-normal text-secundario">Deuda actual</span>
          <span className="font-mono text-cifra-m tabular-nums">{pesos(ciclo.deudaAlCorte)}</span>
        </div>
      </div>
    </section>
  );
}
