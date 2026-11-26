import { Plus } from "lucide-react";

/**
 * `/deudas` mientras llegan los préstamos: cabecera, consolidado, lista y
 * (desde md) el detalle, con la forma exacta de cada uno. Rótulos reales donde
 * se conocen y bloques `linea` (radio `muestra`, pulso solo con `motion-safe`)
 * donde van nombres y cifras; nunca cifras inventadas. Cada bloque va en una
 * caja con el `leading` del texto que reemplaza, para que al llegar los datos
 * ningún renglón cambie de alto. Al llegar, la página entra con «Asentar».
 */

function Bloque({ className }: { className: string }) {
  return <span aria-hidden className={`inline-block max-w-full rounded-muestra bg-linea align-middle motion-safe:animate-pulse ${className}`} />;
}

/* ── Consolidado ── */

const ROTULOS_CONSOLIDADO = ["Te deben", "Debes"] as const;

function ConsolidadoEsqueleto() {
  return (
    <section aria-hidden>
      {/* Escritorio: las tres columnas bajo una raya. */}
      <div className="hidden grid-cols-3 border-t border-raya lg:grid">
        {ROTULOS_CONSOLIDADO.map((rotulo, i) => (
          <div key={rotulo} className={`flex min-w-0 flex-col gap-2 pt-6 pr-6 ${i > 0 ? "border-l border-linea pl-6" : ""}`}>
            <span className="text-rotulo uppercase">{rotulo}</span>
            <span className="text-cifra-l">
              <Bloque className="h-7 w-40" />
            </span>
            <span className="text-etiqueta">
              <Bloque className="h-3 w-48" />
            </span>
          </div>
        ))}
        <div className="flex min-w-0 flex-col items-start gap-2 border-l border-linea pt-6 pl-6">
          <span className="text-rotulo uppercase">Posición neta</span>
          <span className="doble-renglon pb-1 text-cifra-l">
            <Bloque className="h-7 w-40" />
          </span>
          <span className="text-etiqueta">
            <Bloque className="h-3 w-44" />
          </span>
        </div>
      </div>

      {/* Móvil: filas, la posición sobre doble renglón y la leyenda. */}
      <div className="lg:hidden">
        {ROTULOS_CONSOLIDADO.map((rotulo) => (
          <div key={rotulo} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-linea py-3">
            <span className="text-cuerpo">{rotulo}</span>
            <span className="text-cifra-m">
              <Bloque className="h-5 w-24" />
            </span>
            <span className="col-span-2 text-etiqueta">
              <Bloque className="h-3 w-52" />
            </span>
          </div>
        ))}
        <div className="doble-renglon flex items-baseline justify-between gap-3 py-3">
          <span className="text-cuerpo font-semibold">Posición neta</span>
          <span className="text-cifra-m">
            <Bloque className="h-5 w-24" />
          </span>
        </div>
        <p className="pt-2 text-etiqueta">
          <Bloque className="h-3 w-52" />
        </p>
      </div>
    </section>
  );
}

/* ── Lista ── */

function FilaEsqueleto({ nombre }: { nombre: string }) {
  return (
    <li className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-start gap-3 border-b border-linea px-2 py-3">
      <span className="flex h-[22px] items-center">
        <Bloque className="size-5" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-cuerpo">
          <Bloque className={`h-4 ${nombre}`} />
        </span>
        <span className="text-etiqueta">
          <Bloque className="h-3 w-36" />
        </span>
      </span>
      <span className="flex flex-col items-end">
        <span className="text-cifra-s">
          <Bloque className="h-4 w-20" />
        </span>
        <span className="text-cifra-xs">
          <Bloque className="h-3 w-12" />
        </span>
      </span>
    </li>
  );
}

function ListaEsqueleto() {
  return (
    <section aria-hidden>
      <div className="flex items-baseline justify-between gap-3 border-b border-raya px-2 pb-2">
        <span className="text-rotulo">
          <Bloque className="h-3 w-16" />
        </span>
        <span className="text-cifra-s">
          <Bloque className="h-4 w-20" />
        </span>
      </div>
      <ul>
        <FilaEsqueleto nombre="w-24" />
        <FilaEsqueleto nombre="w-16" />
        <FilaEsqueleto nombre="w-28" />
      </ul>
    </section>
  );
}

/* ── Detalle ── */

const FILA = "flex items-baseline justify-between gap-3 border-b border-linea py-2";

function FilaDato({ rotulo, cifra }: { rotulo: string; cifra: string }) {
  return (
    <div className={FILA}>
      <span className="text-cuerpo">
        <Bloque className={`h-4 ${rotulo}`} />
      </span>
      <span className="text-cifra-s">
        <Bloque className={`h-4 ${cifra}`} />
      </span>
    </div>
  );
}

const COLUMNAS_HISTORIAL = "grid-cols-[minmax(0,1fr)_84px_84px] @2xl:grid-cols-[64px_minmax(0,1fr)_130px_110px_140px]";

function FilaHistorialEsqueleto() {
  return (
    <li className={`grid ${COLUMNAS_HISTORIAL} items-baseline gap-3 border-b border-linea px-2 py-3`}>
      <span className="hidden text-cifra-xs @2xl:block">
        <Bloque className="h-3 w-12" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-cuerpo">
          <Bloque className="h-4 w-40" />
        </span>
        <span className="text-cifra-xs @2xl:hidden">
          <Bloque className="h-3 w-12" />
        </span>
      </span>
      <span className="text-right text-cifra-s">
        <Bloque className="h-4 w-16" />
      </span>
      <span className="hidden text-right text-cifra-s @2xl:block">
        <Bloque className="h-4 w-12" />
      </span>
      <span className="text-right text-cifra-s">
        <Bloque className="h-4 w-16" />
      </span>
    </li>
  );
}

function DetalleEsqueleto() {
  return (
    <div aria-hidden className="@container flex flex-col gap-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6 border-b border-raya pb-4">
        <div className="flex min-w-0 flex-col">
          <span className="text-etiqueta">
            <Bloque className="h-3 w-40" />
          </span>
          <span className="text-titulo-2">
            <Bloque className="h-5 w-32" />
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-rotulo">
            <Bloque className="h-3 w-14" />
          </span>
          <span className="text-cifra-l">
            <Bloque className="h-7 w-36" />
          </span>
        </div>
      </div>

      <div className="grid gap-8 @lg:grid-cols-2">
        <div>
          <FilaDato rotulo="w-24" cifra="w-20" />
          <FilaDato rotulo="w-28" cifra="w-20" />
          <div className="doble-renglon flex items-baseline justify-between gap-3 py-2">
            <span className="text-cuerpo font-semibold">Capital pendiente</span>
            <span className="text-cifra-s">
              <Bloque className="h-4 w-20" />
            </span>
          </div>
        </div>
        <div>
          {/* Con tasa son cuatro condiciones (sin ella, dos): se reserva el caso más alto. */}
          <FilaDato rotulo="w-16" cifra="w-32" />
          <FilaDato rotulo="w-24" cifra="w-16" />
          <FilaDato rotulo="w-28" cifra="w-16" />
          <FilaDato rotulo="w-24" cifra="w-12" />
        </div>
      </div>

      {/* Fila de acciones (48 px), antes del historial como en el detalle: su caja, sin rótulos de botón. */}
      <div className="flex flex-col gap-3 @lg:flex-row @lg:items-center">
        <span className="h-12 rounded-campo bg-linea motion-safe:animate-pulse @lg:w-40" />
        <span className="h-12 rounded-campo border border-linea @lg:w-52" />
      </div>

      <section>
        <div className={`grid ${COLUMNAS_HISTORIAL} items-baseline gap-3 border-b border-raya px-2 pb-2 text-rotulo uppercase`}>
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
          <FilaHistorialEsqueleto />
          <FilaHistorialEsqueleto />
        </ul>
      </section>
    </div>
  );
}

/** Cabecera, consolidado, lista y detalle de `/deudas`, sin datos. */
export function EsqueletoDeudas() {
  return (
    <div aria-busy="true" className="flex flex-col gap-8">
      <span role="status" className="sr-only">
        Cargando tus deudas…
      </span>
      <header className="flex items-end justify-between gap-6">
        <h1 className="text-titulo-1">Deudas y préstamos</h1>
        {/* Móvil: la caja de «+ Nuevo» (44 px). */}
        <span aria-hidden className="h-11 w-16 shrink-0 md:hidden" />
        {/* El botón real llega con la página; aquí solo su caja, para que nada salte. */}
        <span aria-hidden className="hidden h-12 items-center gap-3 rounded-campo border border-linea bg-superficie px-6 text-cuerpo font-medium text-terciario md:inline-flex">
          <Plus size={18} strokeWidth={1.5} />
          Nuevo préstamo o deuda
        </span>
      </header>

      <ConsolidadoEsqueleto />

      <div className="flex flex-col gap-8 xl:grid xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start xl:gap-12">
        <ListaEsqueleto />
        <div className="hidden min-w-0 md:block">
          <DetalleEsqueleto />
        </div>
      </div>
    </div>
  );
}
