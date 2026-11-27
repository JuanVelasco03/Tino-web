/**
 * `/recurrentes` mientras llegan las plantillas: cabecera, bandeja, comprometido
 * y plantillas con la forma exacta de cada uno (mismas rejillas, consultas de
 * contenedor y altos que los componentes reales). Rótulos reales donde se
 * conocen y bloques `linea` donde van nombres y cifras; nunca cifras
 * inventadas. Cada bloque va en una caja con el `leading` del texto que
 * reemplaza. Al llegar, la página entra con «Asentar».
 */

function Bloque({ className }: { className: string }) {
  return <span aria-hidden className={`inline-block max-w-full rounded-muestra bg-linea align-middle motion-safe:animate-pulse ${className}`} />;
}

/** Caja de un botón de 48 px, sin texto: la acción aún no se puede usar. */
function CajaBoton({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`block h-12 rounded-campo border border-linea ${className}`} />;
}

/* ── Bandeja ── */

function FilaBandejaEsqueleto({ concepto }: { concepto: string }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 py-3 punteada @xl:min-h-16 @xl:grid-cols-[96px_minmax(0,1fr)_150px] @xl:items-center @xl:gap-x-4 @4xl:grid-cols-[96px_minmax(0,1fr)_150px_auto]">
      <div className="hidden flex-col @xl:flex">
        <span className="text-cifra-xs">
          <Bloque className="h-3 w-12" />
        </span>
        <span className="text-etiqueta">
          <Bloque className="h-3 w-16" />
        </span>
      </div>
      <div className="min-w-0">
        <div className="text-cuerpo">
          <Bloque className={`h-4 ${concepto}`} />
        </div>
        <div className="text-etiqueta">
          <Bloque className="h-3 w-40" />
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-cifra-s">
          <Bloque className="h-4 w-20" />
        </span>
        <span className="text-cifra-xs">
          <Bloque className="h-3 w-10" />
        </span>
      </div>
      <div className="col-span-2 grid grid-cols-[1fr_1fr_auto] gap-2 @xl:col-span-2 @xl:col-start-2 @xl:flex @xl:justify-end @4xl:col-span-1 @4xl:col-start-auto">
        <CajaBoton className="@xl:w-28" />
        <CajaBoton className="@xl:w-24" />
        <span aria-hidden className="block h-12 w-16" />
      </div>
    </li>
  );
}

function BandejaEsqueleto() {
  return (
    <section aria-hidden className="@container">
      <div className="flex items-baseline justify-between gap-3 border-b border-raya pb-2">
        <span className="text-rotulo uppercase">Por confirmar</span>
        <span className="text-etiqueta font-normal text-secundario">
          <span className="@xl:hidden">No tocan los saldos</span>
          <span className="hidden @xl:inline">Aún no tocan los saldos</span>
        </span>
      </div>
      <ul>
        <FilaBandejaEsqueleto concepto="w-24" />
        <FilaBandejaEsqueleto concepto="w-36" />
        <FilaBandejaEsqueleto concepto="w-28" />
      </ul>
    </section>
  );
}

/* ── Comprometido ── */

const GRUPOS = ["Pagado", "Por confirmar", "Programado"] as const;

function ComprometidoEsqueleto() {
  return (
    <section aria-hidden>
      <div className="flex items-baseline justify-between border-b border-raya pb-2">
        <span className="text-rotulo uppercase">
          Comprometido en <Bloque className="h-3 w-20" />
        </span>
      </div>
      <div className="flex flex-col gap-3 pt-4 pb-3">
        <span className="text-cifra-l">
          <Bloque className="h-7 w-44" />
        </span>
        <div className="h-2 rounded-muestra bg-linea" />
      </div>
      <ul>
        {GRUPOS.map((rotulo) => (
          <li key={rotulo} className="grid grid-cols-[12px_minmax(0,1fr)_auto] items-center gap-3 border-b border-linea py-2">
            <span className="h-2 w-3 rounded-muestra bg-linea" />
            <span className="text-cuerpo">{rotulo}</span>
            <span className="text-cifra-s">
              <Bloque className="h-4 w-16" />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── Plantillas ── */

const REJILLA = "@5xl:grid-cols-[minmax(0,1.3fr)_110px_100px_minmax(0,1.2fr)_150px_140px_170px] @5xl:gap-4";
const COLUMNAS = ["Concepto", "Cada", "Vence", "Cuenta", "Categoría"] as const;

function FilaPlantillaEsqueleto({ concepto }: { concepto: string }) {
  return (
    <li className={`grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 border-b border-linea py-3 ${REJILLA}`}>
      <span className="min-w-0">
        <span className="block text-cuerpo">
          <Bloque className={`h-4 ${concepto}`} />
        </span>
        <span className="block text-etiqueta @5xl:hidden">
          <Bloque className="h-3 w-44" />
        </span>
      </span>
      {["w-14", "w-12", "w-24", "w-20"].map((ancho, i) => (
        <span key={i} className="hidden text-etiqueta @5xl:block">
          <Bloque className={`h-3 ${ancho}`} />
        </span>
      ))}
      <span className="text-right text-cifra-s">
        <Bloque className="h-4 w-20" />
      </span>
      <span className="hidden text-etiqueta @5xl:block">
        <Bloque className="h-3 w-24" />
      </span>
    </li>
  );
}

function PlantillasEsqueleto() {
  return (
    <section aria-hidden className="@container">
      <div className="border-b border-raya pb-2">
        <span className="text-rotulo uppercase">Plantillas</span>
      </div>
      <div className={`hidden border-b border-linea pt-3 pb-2 text-rotulo uppercase text-secundario @5xl:grid ${REJILLA}`}>
        {COLUMNAS.map((c) => (
          <span key={c}>{c}</span>
        ))}
        <span className="text-right">Importe</span>
        <span>
          <Bloque className="h-3 w-16" />
        </span>
      </div>
      <ul>
        <FilaPlantillaEsqueleto concepto="w-28" />
        <FilaPlantillaEsqueleto concepto="w-20" />
        <FilaPlantillaEsqueleto concepto="w-32" />
        <FilaPlantillaEsqueleto concepto="w-24" />
      </ul>
    </section>
  );
}

/** Esqueleto de `/recurrentes` con el mismo orden y las mismas columnas que la página. */
export function EsqueletoRecurrentes() {
  return (
    <div aria-busy="true" className="flex flex-col gap-8 md:gap-12">
      <p role="status" className="sr-only">
        Cargando tus recurrentes…
      </p>
      <header className="flex items-end justify-between gap-6">
        <h1 className="text-titulo-1">Recurrentes</h1>
        <CajaBoton className="hidden w-44 md:block" />
      </header>
      <div className="flex flex-col gap-8 xl:grid xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start xl:gap-12">
        <BandejaEsqueleto />
        <ComprometidoEsqueleto />
      </div>
      <PlantillasEsqueleto />
    </div>
  );
}
