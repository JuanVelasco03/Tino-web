import Link from "next/link";
import { useId } from "react";
import { formatearDinero } from "@/domain/dinero/formato";
import { formatearMes, formatearNombreMes } from "@/domain/fecha/formato";
import { anchoBarra, formatearPorcentaje, mayorPorcentaje, SIN_PORCENTAJE } from "@/domain/resumen/porcentaje";
import type { CategoriaResumen, Comparacion, Resumen } from "@/services/resumen";

type Props = {
  /** En el orden de la API (monto desc). Nunca incluye «sin categoría». */
  categorias: CategoriaResumen[];
  sinCategoria: Resumen["sinCategoria"];
  /** El total de la tabla: `gastos` de la API, sin sumar filas. */
  gastos: Comparacion;
  /** `"YYYY-MM"` del mes y del anterior. */
  mes: string;
  mesAnterior: string;
};

type Fila = {
  clave: string;
  nombre: string;
  monto: bigint;
  porcentaje: number | null;
  anterior: bigint;
  variacion: bigint;
  sinCategoria: boolean;
};

function pesos(monto: bigint, signo = false): string {
  return formatearDinero({ monto, moneda: "COP" }, { omitirCOP: true, signoMas: signo });
}

/**
 * Columnas de la tabla (desde lg): Categoría | barra | mes | % | anterior | Var.
 * En lg el contenido mide ~700 px: columnas más estrechas para que la barra no
 * quede en un punto. Desde xl, las medidas completas.
 */
const COLUMNAS =
  "grid-cols-[140px_minmax(0,1fr)_112px_64px_112px_96px] gap-3 xl:grid-cols-[160px_minmax(0,1fr)_120px_72px_120px_110px] xl:gap-4";

/** «Sin categoría» se separa con una punteada arriba: es lo pendiente (las cuatro líneas). */
const PUNTEADA_ARRIBA = "border-t border-t-terciario [border-top-style:dashed]";

function Barra({ ancho, sinCategoria, alto }: { ancho: number; sinCategoria: boolean; alto: "h-1.5" | "h-1" }) {
  if (ancho === 0) return <div aria-hidden className={alto} />;
  // «Sin categoría» es lo pendiente: la punteada de 1 px del sistema, al alto de la barra.
  // Un contorno punteado de 4–6 px de alto se volvía un borrón con porcentajes chicos.
  if (sinCategoria) {
    return (
      <div aria-hidden className={`flex items-center ${alto}`}>
        <div className="punteada" style={{ width: `${ancho}%` }} />
      </div>
    );
  }
  return (
    <div aria-hidden className={alto}>
      <div className={`${alto} rounded-muestra bg-texto`} style={{ width: `${ancho}%` }} />
    </div>
  );
}

function Nombre({ fila }: { fila: Fila }) {
  if (!fila.sinCategoria) return <span className="truncate text-cuerpo">{fila.nombre}</span>;
  return (
    <span className="truncate text-cuerpo text-secundario">
      <span className="punteada">{fila.nombre}</span>
    </span>
  );
}

/** Enlace al filtro de `/movimientos` (N-34): solo si hay gastos sin clasificar (N-32, N-33). */
function Indicador({ sinCategoria, mes, formato }: { sinCategoria: Resumen["sinCategoria"]; mes: string; formato: "escritorio" | "movil" }) {
  const href = `/movimientos?mes=${mes}&sinClasificar=1`;
  const porcentaje = <span className="punteada font-mono tabular-nums">{formatearPorcentaje(sinCategoria.porcentaje)}</span>;
  const n = sinCategoria.cantidad;
  if (formato === "escritorio") {
    return (
      <Link href={href} className="flex items-baseline gap-1 text-etiqueta font-normal text-secundario hover:text-texto">
        {porcentaje}
        <span>sin categoría ·</span>
        <span className="font-semibold text-marca-texto">Clasificar {n}</span>
      </Link>
    );
  }
  return (
    <Link href={href} className="flex min-h-11 flex-wrap items-center gap-x-1 pt-3 text-etiqueta font-normal text-secundario">
      {porcentaje}
      <span>
        sin categoría, en {n} {n === 1 ? "gasto" : "gastos"} ·
      </span>
      <span className="font-semibold text-marca-texto">Clasificar</span>
    </Link>
  );
}

/**
 * Gasto por categoría (N-23 a N-33): tabla en escritorio, lista en móvil.
 * Cifras y porcentajes de la API; la barra mide el porcentaje sobre el mayor.
 * «Sin categoría» va al final y solo si tiene monto este mes o el anterior.
 * El total es `gastos` de la API, rotulado «100 %» sin sumar filas.
 */
export function GastoCategorias({ categorias, sinCategoria, gastos, mes, mesAnterior }: Props) {
  const filas: Fila[] = categorias.map((c) => ({
    clave: c.categoria.id,
    nombre: c.categoria.nombre,
    monto: c.monto,
    porcentaje: c.porcentaje,
    anterior: c.anterior,
    variacion: c.variacion,
    sinCategoria: false,
  }));
  if (sinCategoria.monto !== 0n || sinCategoria.anterior !== 0n) {
    filas.push({ clave: "sin-categoria", nombre: "Sin categoría", ...sinCategoria, sinCategoria: true });
  }
  const maximo = mayorPorcentaje(filas.map((f) => f.porcentaje));
  const total = gastos.actual === 0n ? SIN_PORCENTAJE : "100 %";
  const nombreMes = formatearMes(mes).split(" ")[0];
  const nombreAnterior = formatearMes(mesAnterior).split(" ")[0];
  const conIndicador = sinCategoria.cantidad > 0;
  const titulo = useId();

  return (
    <section aria-labelledby={titulo}>
      <div className="flex items-baseline justify-between gap-3 border-b border-raya pb-2">
        <h2 id={titulo} className="text-rotulo uppercase">
          Gasto por categoría
        </h2>
        {filas.length > 0 && (
          <>
            <span className="hidden lg:block">{conIndicador && <Indicador sinCategoria={sinCategoria} mes={mes} formato="escritorio" />}</span>
            <span className="font-mono text-cifra-s tabular-nums lg:hidden">{pesos(gastos.actual)}</span>
          </>
        )}
      </div>

      {filas.length === 0 ? (
        <p className="pt-4 text-cuerpo text-secundario">No hubo gastos en {formatearNombreMes(mes)}.</p>
      ) : (
        <>
          {/* Escritorio */}
          <div role="table" aria-labelledby={titulo} className="hidden lg:block">
            <div role="row" className={`grid ${COLUMNAS} border-b border-linea pt-3 pb-2 text-rotulo uppercase text-secundario`}>
              <span role="columnheader">Categoría</span>
              <span role="columnheader" aria-label="Proporción" />
              <span role="columnheader" className="text-right">
                {nombreMes}
              </span>
              <span role="columnheader" className="text-right">
                %
              </span>
              <span role="columnheader" className="text-right">
                {nombreAnterior}
              </span>
              <span role="columnheader" className="text-right">
                Var.
              </span>
            </div>
            {filas.map((f) => (
              <div
                key={f.clave}
                role="row"
                className={`grid ${COLUMNAS} items-center border-b border-linea py-3 ${f.sinCategoria ? PUNTEADA_ARRIBA : ""}`}
              >
                <span role="cell" className="flex min-w-0">
                  <Nombre fila={f} />
                </span>
                <span role="cell">
                  <Barra ancho={anchoBarra(f.porcentaje, maximo)} sinCategoria={f.sinCategoria} alto="h-1.5" />
                </span>
                <span role="cell" className="text-right font-mono text-cifra-s tabular-nums">
                  {pesos(f.monto)}
                </span>
                <span role="cell" className="text-right font-mono text-cifra-xs tabular-nums text-secundario">
                  {formatearPorcentaje(f.porcentaje)}
                </span>
                <span role="cell" className="text-right font-mono text-cifra-xs tabular-nums text-secundario">
                  {pesos(f.anterior)}
                </span>
                <span role="cell" className="text-right font-mono text-cifra-xs tabular-nums">
                  {pesos(f.variacion, true)}
                </span>
              </div>
            ))}
            <div role="row" className={`grid ${COLUMNAS} doble-raya items-baseline pt-3 pb-2`}>
              <span role="cell" className="text-cuerpo font-semibold">
                Total gastos
              </span>
              <span role="cell" />
              <span role="cell" className="text-right font-mono text-cifra-s font-semibold tabular-nums">
                {pesos(gastos.actual)}
              </span>
              <span role="cell" className="text-right font-mono text-cifra-xs tabular-nums text-secundario">
                {total}
              </span>
              <span role="cell" className="text-right font-mono text-cifra-xs tabular-nums text-secundario">
                {pesos(gastos.anterior)}
              </span>
              <span role="cell" className="text-right font-mono text-cifra-xs tabular-nums">
                {pesos(gastos.variacion, true)}
              </span>
            </div>
          </div>

          {/* Móvil */}
          <ul className="lg:hidden">
            {filas.map((f) => (
              <li key={f.clave} className={`flex flex-col gap-2 border-b border-linea py-3 ${f.sinCategoria ? PUNTEADA_ARRIBA : ""}`}>
                <div className="grid grid-cols-[minmax(0,1fr)_auto_52px] items-baseline gap-3">
                  <Nombre fila={f} />
                  <span className="font-mono text-cifra-s tabular-nums">{pesos(f.monto)}</span>
                  <span className="text-right font-mono text-cifra-xs tabular-nums text-secundario">{formatearPorcentaje(f.porcentaje)}</span>
                </div>
                <div className="pr-16">
                  <Barra ancho={anchoBarra(f.porcentaje, maximo)} sinCategoria={f.sinCategoria} alto="h-1" />
                </div>
              </li>
            ))}
          </ul>
          {conIndicador && (
            <div className="lg:hidden">
              <Indicador sinCategoria={sinCategoria} mes={mes} formato="movil" />
            </div>
          )}
        </>
      )}
    </section>
  );
}
