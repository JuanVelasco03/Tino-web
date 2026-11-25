import { NavegacionMes } from "@/components/movimientos/navegacion-mes";

type Props = {
  /** `"YYYY-MM"` del mes que se está cargando; sin él (el actual aún no se sabe), el título es un bloque. */
  mes?: string;
};

/** Bloque en renglón (`linea`) sin cifra: ocupa el lugar de un dato que aún no llega. */
function Bloque({ className }: { className: string }) {
  return <span aria-hidden className={`block rounded-muestra bg-linea motion-safe:animate-pulse ${className}`} />;
}

const CIFRAS = ["Ingresos", "Gastos", "Resultado neto"];

/**
 * Esqueleto de `/resumen` mientras llega la API (al entrar y al cambiar de
 * mes): la misma estructura que la página, con bloques `linea` donde van las
 * cifras. Nunca cifras inventadas. Con `mes`, el título ya es el mes destino y
 * las flechas quedan deshabilitadas hasta conocer los límites.
 */
export function EsqueletoResumen({ mes }: Props) {
  return (
    <div className="flex max-w-[1440px] flex-col gap-8 md:gap-12">
      <span role="status" className="sr-only">
        Cargando resumen…
      </span>

      <header className="flex flex-col gap-1 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-rotulo uppercase text-secundario">Resumen del mes</p>
          {mes ? (
            <NavegacionMes mes={mes} actual={mes} ruta="/resumen" hayAnterior={false} haySiguiente={false} variante="titulo" />
          ) : (
            <div className="flex min-h-11 items-center md:min-h-10">
              <Bloque className="h-7 w-48" />
            </div>
          )}
        </div>
        <Bloque className="h-4 w-64 lg:mb-3" />
      </header>

      {/* Cifras: escritorio en tres columnas, móvil en filas. */}
      <section aria-hidden>
        <div className="hidden grid-cols-3 border-t border-raya xl:grid">
          {CIFRAS.map((rotulo, i) => (
            <div key={rotulo} className={`flex min-w-0 flex-col gap-3 pt-6 ${i > 0 ? "border-l border-linea pl-6" : ""} ${i < 2 ? "pr-6" : ""}`}>
              <h2 className="text-rotulo uppercase">{rotulo}</h2>
              <Bloque className="h-9 w-3/5" />
              <div className="flex flex-col">
                <div className="flex items-center justify-between gap-3 border-t border-linea py-2">
                  <Bloque className="h-4 w-20" />
                  <Bloque className="h-4 w-24" />
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-linea py-2">
                  <span className="text-etiqueta font-normal text-secundario">Variación</span>
                  <Bloque className="h-4 w-28" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="xl:hidden">
          {CIFRAS.map((rotulo, i) => {
            const esResultado = i === CIFRAS.length - 1;
            return (
              <div
                key={rotulo}
                className={`flex items-center justify-between gap-3 py-3 ${esResultado ? "doble-raya border-t border-raya" : "border-b border-linea"}`}
              >
                <span className={`text-cuerpo ${esResultado ? "font-semibold" : ""}`}>{rotulo}</span>
                <div className="flex flex-col items-end gap-1">
                  <Bloque className={esResultado ? "h-9 w-32" : "h-6 w-28"} />
                  <Bloque className="h-4 w-20" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Gasto por categoría */}
      <section aria-hidden className="flex flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-raya pb-2">
          <h2 className="text-rotulo uppercase">Gasto por categoría</h2>
        </div>
        {[92, 56, 24, 18, 14].map((ancho) => (
          <div key={ancho} className="flex min-h-11 items-center gap-4 border-b border-linea py-3">
            <Bloque className="h-4 w-24 shrink-0" />
            {/* Largos decrecientes, como la lista ordenada; no representan montos. */}
            <div className="hidden min-w-0 flex-1 lg:block">
              <div style={{ width: `${ancho}%` }}>
                <Bloque className="h-1.5" />
              </div>
            </div>
            <Bloque className="ml-auto h-4 w-20 shrink-0" />
            <span className="hidden lg:contents">
              <Bloque className="h-4 w-12 shrink-0" />
              <Bloque className="h-4 w-20 shrink-0" />
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
