import { Plus } from "lucide-react";

/**
 * `/inversiones` mientras llega la cuenta (la API puede tardar: trae los
 * precios vencidos). La forma exacta de la pantalla: cabecera, selector,
 * cifras, tabla de posiciones (ocho columnas desde `xl`, lista por debajo) con
 * efectivo y total, acciones y operaciones (cinco columnas desde `lg`).
 * Rótulos reales donde se conocen y bloques `linea` (radio `muestra`, pulso
 * solo con `motion-safe`) donde van nombres y cifras; nunca cifras inventadas.
 * Cada bloque va en una caja con el `leading` del texto que reemplaza. El
 * total cierra con doble renglón: la doble raya prometería una cifra. Al
 * llegar, la página entra con «Asentar».
 */

function Bloque({ className }: { className: string }) {
  return <span aria-hidden className={`inline-block max-w-full rounded-muestra bg-linea align-middle motion-safe:animate-pulse ${className}`} />;
}

/** Las mismas rejillas que `TablaPosiciones` y `ListaOperaciones`. */
const COLUMNAS_POSICIONES = "grid-cols-[minmax(0,1fr)_96px_104px_104px_150px_130px_76px_140px]";
const COLUMNAS_OPERACIONES = "grid-cols-[64px_minmax(0,1fr)_120px_150px_150px]";
const CIFRA = "flex justify-end text-cifra-s";

function Cabecera() {
  return (
    <header className="flex flex-col gap-1">
      <div className="flex items-end justify-between gap-6">
        <h1 className="text-titulo-1">Inversiones</h1>
        <span className="hidden h-11 items-center gap-2 text-cuerpo font-semibold text-terciario md:inline-flex">
          <Plus size={16} strokeWidth={1.5} aria-hidden />
          Nueva inversión
        </span>
      </div>
      <p className="text-etiqueta">
        <Bloque className="h-3 w-44" />
      </p>
    </header>
  );
}

function Selector() {
  return (
    <div aria-hidden className="flex flex-wrap gap-2">
      {["w-36", "w-40"].map((ancho) => (
        <span key={ancho} className={`flex h-11 items-center rounded-campo border border-linea bg-superficie px-3 md:h-9 ${ancho}`}>
          <Bloque className="h-3 w-full" />
        </span>
      ))}
    </div>
  );
}

const ROTULOS_CIFRAS = [
  { rotulo: "Valor de mercado", tamano: "text-cifra-l", bloque: "h-7 w-48", tinta: true },
  { rotulo: "Costo de las posiciones", tamano: "text-cifra-m", bloque: "h-5 w-32", tinta: false },
  { rotulo: "Rendimiento", tamano: "text-cifra-m", bloque: "h-5 w-40", tinta: false },
] as const;

function Cifras() {
  return (
    <div aria-hidden>
      <div className="hidden grid-cols-[1.3fr_1fr_1.2fr] border-t border-raya lg:grid">
        {ROTULOS_CIFRAS.map((c, i) => (
          <div key={c.rotulo} className={`flex min-w-0 flex-col gap-2 pt-6 pr-6 ${i > 0 ? "border-l border-linea pl-6" : ""}`}>
            <span className={`text-rotulo uppercase ${c.tinta ? "" : "text-secundario"}`}>{c.rotulo}</span>
            <span className={c.tamano}>
              <Bloque className={c.bloque} />
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-col lg:hidden">
        {ROTULOS_CIFRAS.map((c, i) => (
          <div
            key={c.rotulo}
            className={`flex-col gap-1 py-3 ${i === 0 ? "border-t border-raya" : "border-t border-linea"} ${i === 1 ? "hidden md:flex" : "flex"}`}
          >
            <span className="text-rotulo uppercase text-secundario">{c.rotulo}</span>
            <span className={c.tamano}>
              <Bloque className={c.bloque} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Posiciones() {
  return (
    <div aria-hidden>
      {/* Escritorio ancho */}
      <div className="hidden xl:block">
        <div className={`grid ${COLUMNAS_POSICIONES} gap-x-3 border-b border-raya pb-2 text-rotulo uppercase text-secundario`}>
          <span>Activo</span>
          <span className="text-right">Cantidad</span>
          <span className="text-right">Costo prom.</span>
          <span className="text-right">Precio</span>
          <span className="text-right">Valor</span>
          <span className="text-right">Rend.</span>
          <span className="text-right">%</span>
          <span>Cotización</span>
        </div>
        {[0, 1, 2].map((fila) => (
          <div key={fila} className={`grid ${COLUMNAS_POSICIONES} items-baseline gap-x-3 border-b border-linea py-3`}>
            <span className="flex flex-col">
              <span className="text-cifra-s"><Bloque className="h-3 w-20" /></span>
              <span className="text-etiqueta"><Bloque className="h-3 w-36" /></span>
            </span>
            <span className={CIFRA}><Bloque className="h-3 w-16" /></span>
            <span className={CIFRA}><Bloque className="h-3 w-14" /></span>
            <span className={CIFRA}><Bloque className="h-3 w-14" /></span>
            <span className={CIFRA}><Bloque className="h-3 w-20" /></span>
            <span className={CIFRA}><Bloque className="h-3 w-16" /></span>
            <span className="flex justify-end text-cifra-xs"><Bloque className="h-3 w-10" /></span>
            <span className="flex flex-col gap-1">
              <span className="text-etiqueta"><Bloque className="h-3 w-28" /></span>
              <span className="text-cifra-xs"><Bloque className="h-3 w-12" /></span>
              <span className="text-etiqueta"><Bloque className="h-3 w-24" /></span>
            </span>
          </div>
        ))}
        <div className={`grid ${COLUMNAS_POSICIONES} items-baseline gap-x-3 border-b border-linea py-3`}>
          <span className="flex flex-col">
            <span className="text-cuerpo">Efectivo disponible</span>
            <span className="text-etiqueta font-normal text-secundario">Saldo sin invertir</span>
          </span>
          <span className="col-span-3" />
          <span className={CIFRA}><Bloque className="h-3 w-20" /></span>
        </div>
        <div className={`grid ${COLUMNAS_POSICIONES} doble-renglon items-baseline gap-x-3 py-3`}>
          <span className="text-cuerpo font-semibold">Total cuenta</span>
          <span className="col-span-3" />
          <span className={CIFRA}><Bloque className="h-3 w-24" /></span>
          <span className={CIFRA}><Bloque className="h-3 w-16" /></span>
          <span className="flex justify-end text-cifra-xs"><Bloque className="h-3 w-10" /></span>
        </div>
      </div>

      {/* Móvil y escritorio angosto */}
      <div className="xl:hidden">
        <div className="flex justify-between gap-3 border-b border-raya pb-2 text-rotulo uppercase text-secundario">
          <span>Posición</span>
          <span>Valor · rend.</span>
        </div>
        {[0, 1, 2].map((fila) => (
          <div key={fila} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-linea py-3">
            <span className="flex flex-col">
              <span className="text-cifra-s"><Bloque className="h-3 w-24" /></span>
              <span className="text-etiqueta"><Bloque className="h-3 w-36" /></span>
              <span className="text-cifra-xs"><Bloque className="h-3 w-44" /></span>
              <span className="text-etiqueta"><Bloque className="h-3 w-28" /></span>
            </span>
            <span className="flex flex-col items-end">
              <span className="text-cifra-s"><Bloque className="h-3 w-20" /></span>
              <span className="text-cifra-xs"><Bloque className="h-3 w-28" /></span>
            </span>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3 border-b border-linea py-3">
          <span className="text-cuerpo">Efectivo disponible</span>
          <span className="text-cifra-s"><Bloque className="h-3 w-20" /></span>
        </div>
        <div className="doble-renglon flex items-baseline justify-between gap-3 py-3">
          <span className="text-cuerpo font-semibold">Total</span>
          <span className="text-cifra-s"><Bloque className="h-3 w-24" /></span>
        </div>
      </div>
    </div>
  );
}

/** «Registrar operación» y «Editar cuenta»: cajas de botón de 48 px, sin acción. */
function Acciones() {
  return (
    <div aria-hidden className="flex flex-col gap-3 md:flex-row">
      <span className="flex h-12 items-center justify-center rounded-campo bg-hundido px-6 text-cuerpo font-semibold text-terciario">
        Registrar operación
      </span>
      <span className="flex h-12 items-center justify-center rounded-campo border border-linea px-6 text-cuerpo font-medium text-terciario">
        Editar cuenta
      </span>
    </div>
  );
}

function Operaciones() {
  return (
    <div aria-hidden className="flex flex-col">
      <span className="border-b border-raya pb-2 text-rotulo uppercase">Operaciones</span>
      <div className="hidden lg:block">
        <div className={`grid ${COLUMNAS_OPERACIONES} gap-x-3 border-b border-linea py-2 text-rotulo uppercase text-secundario`}>
          <span>Fecha</span>
          <span>Operación</span>
          <span className="text-right">Cantidad</span>
          <span className="text-right">Monto</span>
          <span className="text-right">Ganancia realizada</span>
        </div>
        {[0, 1, 2].map((fila) => (
          <div key={fila} className={`grid ${COLUMNAS_OPERACIONES} items-baseline gap-x-3 border-b border-linea py-3`}>
            <span className="text-cifra-xs"><Bloque className="h-3 w-10" /></span>
            <span className="flex flex-col">
              <span className="text-cuerpo"><Bloque className="h-3 w-36" /></span>
              <span className="text-etiqueta"><Bloque className="h-3 w-28" /></span>
            </span>
            <span className={CIFRA}><Bloque className="h-3 w-16" /></span>
            <span className={CIFRA}><Bloque className="h-3 w-20" /></span>
            <span className={CIFRA}><Bloque className="h-3 w-12" /></span>
          </div>
        ))}
      </div>
      <div className="lg:hidden">
        {[0, 1, 2].map((fila) => (
          <div key={fila} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 border-b border-linea py-3">
            <span className="flex flex-col">
              <span className="text-cuerpo"><Bloque className="h-3 w-36" /></span>
              <span className="text-cifra-xs"><Bloque className="h-3 w-32" /></span>
            </span>
            <span className="text-cifra-s"><Bloque className="h-3 w-20" /></span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EsqueletoInversiones() {
  return (
    <div className="flex flex-col gap-8">
      <p role="status" className="sr-only">
        Cargando tus inversiones…
      </p>
      <Cabecera />
      <Selector />
      <Cifras />
      <Posiciones />
      <Acciones />
      <Operaciones />
    </div>
  );
}
