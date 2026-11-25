type Props = {
  /** `/movimientos/sin-clasificar`: «← Movimientos» sobre «Gastos sin clasificar». */
  sinClasificar?: boolean;
};

/** Bloque en renglón (`linea`) sin dato: ocupa el lugar de un texto o una cifra que aún no llega. */
function Bloque({ className }: { className: string }) {
  return <span aria-hidden className={`block rounded-muestra bg-linea motion-safe:animate-pulse ${className}`} />;
}

/** Los mismos de `LibroMovimientos`: el esqueleto no salta al llegar los datos. */
const COLUMNAS =
  "grid-cols-[52px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_128px] lg:grid-cols-[52px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.7fr)_128px]";

const FILTROS = ["Fecha", "Cuenta", "Categoría", "Tipo", "Persona"];

/** Anchos variados para que los renglones no lean como una rejilla; nunca cifras inventadas. */
const FILAS = [
  { concepto: "w-3/5", categoria: "w-16", cuenta: "w-20", monto: "w-16", primera: true },
  { concepto: "w-2/5", categoria: "w-20", cuenta: "w-16", monto: "w-14" },
  { concepto: "w-1/2", categoria: "w-14", cuenta: "w-24", monto: "w-20" },
  { concepto: "w-1/3", categoria: "w-16", cuenta: "w-16", monto: "w-14", primera: true },
  { concepto: "w-3/5", categoria: "w-20", cuenta: "w-20", monto: "w-16" },
  { concepto: "w-2/5", categoria: "w-16", cuenta: "w-14", monto: "w-20", primera: true },
  { concepto: "w-1/2", categoria: "w-14", cuenta: "w-20", monto: "w-14" },
  { concepto: "w-1/3", categoria: "w-20", cuenta: "w-16", monto: "w-16" },
];

/** Móvil: dos días con filas C2 (concepto, categoría · cuenta y monto). */
const DIAS = [FILAS.slice(0, 3), FILAS.slice(3, 6)];

/**
 * Esqueleto del libro de movimientos: al entrar (`loading.tsx`) y al cambiar
 * de mes (`<Suspense key={mes}>`). Misma forma que la página —cabecera,
 * buscador y filtros, rótulos de la tabla y renglones del alto real— con
 * bloques `linea` donde van los datos. «Cargando movimientos…» va en un
 * `role="status"` oculto.
 */
export function EsqueletoMovimientos({ sinClasificar = false }: Props) {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <span role="status" className="sr-only">
        {sinClasificar ? "Cargando gastos sin clasificar…" : "Cargando movimientos…"}
      </span>

      <header className="flex items-end justify-between gap-6">
        {sinClasificar ? (
          <div className="flex flex-col items-start gap-1">
            <span className="flex h-11 items-center text-cuerpo font-semibold text-marca-texto">← Movimientos</span>
            <h1 className="text-titulo-1">Gastos sin clasificar</h1>
          </div>
        ) : (
          <h1 className="text-titulo-1">Movimientos</h1>
        )}
        <span className="flex h-5 items-center">
          <Bloque className="h-3 w-6 md:w-24" />
        </span>
      </header>

      {/* Buscador y filtros: mismas cajas, sin valores. */}
      <div aria-hidden className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
        <div className="flex h-11 items-center gap-2 rounded-campo border border-linea bg-superficie px-3 md:h-9 md:w-[300px]">
          <Bloque className="h-3 w-40" />
        </div>
        <div className="-mx-4 flex gap-2 overflow-hidden px-4 md:mx-0 md:flex-wrap md:px-0">
          {FILTROS.map((rotulo) => (
            <div
              key={rotulo}
              className="flex h-11 shrink-0 items-center gap-2 rounded-campo border border-linea bg-superficie px-3 text-cuerpo text-secundario md:h-9 md:text-etiqueta md:font-normal"
            >
              {rotulo}
              <Bloque className="hidden h-3 w-12 md:block" />
            </div>
          ))}
        </div>
      </div>

      {/* Escritorio: rótulos reales y renglones de 48 px, como los reales. */}
      <div aria-hidden className="hidden md:block">
        <div className={`grid ${COLUMNAS} gap-3 border-y border-raya py-2 text-rotulo uppercase text-secundario`}>
          <span>Fecha</span>
          <span>Concepto</span>
          <span>Categoría</span>
          <span>Cuenta</span>
          <span className="hidden lg:block">Persona</span>
          <span className="text-right">Monto</span>
        </div>
        {FILAS.map((f, i) => (
          <div
            key={i}
            className={`grid min-h-12 ${COLUMNAS} items-center gap-x-3 border-b border-linea py-3 ${f.primera && i > 0 ? "border-t border-t-terciario" : ""}`}
          >
            <span className="flex h-5.5 items-center">{f.primera && <Bloque className="h-3 w-10" />}</span>
            <span className="flex h-5.5 items-center">
              <Bloque className={`h-3 ${f.concepto}`} />
            </span>
            <span className="flex h-5.5 items-center">
              <Bloque className={`h-3 ${f.categoria}`} />
            </span>
            <span className="flex h-5.5 items-center">
              <Bloque className={`h-3 ${f.cuenta}`} />
            </span>
            <span className="hidden h-5.5 lg:block" />
            <span className="flex h-5.5 items-center justify-end">
              <Bloque className={`h-3 ${f.monto}`} />
            </span>
          </div>
        ))}
      </div>

      {/* Móvil: encabezado por día y filas C2 de 67 px (12 + 22 + 20 + 12 + división). */}
      <div aria-hidden className="md:hidden">
        {DIAS.map((filas, d) => (
          <section key={d} className="pt-6 first:pt-0">
            <div className="border-b border-raya pb-2">
              <span className="flex h-4 items-center">
                <Bloque className="h-2.5 w-20" />
              </span>
            </div>
            {filas.map((f, i) => (
              <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 border-b border-linea py-3">
                <div className="flex flex-col">
                  <span className="flex h-5.5 items-center">
                    <Bloque className={`h-3 ${f.concepto}`} />
                  </span>
                  <span className="flex h-5 items-center">
                    <Bloque className="h-2.5 w-28" />
                  </span>
                </div>
                <span className="flex h-5.5 items-center">
                  <Bloque className={`h-3 ${f.monto}`} />
                </span>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
