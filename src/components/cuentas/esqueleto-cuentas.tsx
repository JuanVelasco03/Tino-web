import { EnlaceTexto } from "../enlace-texto";
import { CabeceraArchivadas } from "./lista-archivadas";

/**
 * Esqueletos de `/cuentas` (SPEC 13), con la misma forma que cada pantalla:
 * rótulos reales donde se conocen y bloques `linea` (radio `muestra`, pulso
 * solo con `motion-safe`) donde van nombres y cifras. Nunca cifras inventadas.
 * Cada bloque va dentro de una caja con el `leading` del texto que reemplaza,
 * para que al llegar los datos ningún renglón cambie de alto.
 */

/** Bloque sin dato: ocupa el lugar de un texto o una cifra que aún no llega. */
function Bloque({ className }: { className: string }) {
  return <span aria-hidden className={`inline-block max-w-full rounded-muestra bg-linea align-middle motion-safe:animate-pulse ${className}`} />;
}

/** Anuncio oculto de la carga (sin `aria-busy`, que silenciaba el anuncio). */
function Anuncio({ children }: { children: string }) {
  return (
    <span role="status" className="sr-only">
      {children}
    </span>
  );
}

/* ───────────── Lista (`/cuentas`) ───────────── */

/** Rejilla de `FilaCuenta` fuera de «Ordenar». */
const REJILLA_FILA =
  "-mx-4 grid min-h-16 items-center gap-3 px-4 py-3 md:-mx-6 md:px-6 grid-cols-[20px_minmax(0,1fr)_auto_44px] md:grid-cols-[28px_24px_minmax(0,1.1fr)_minmax(0,1.6fr)_200px_44px]";

/** Sangría de la lista (la de `GrupoCuentas`), repetida en pasivos y cierre. */
const SANGRIA = "border-x border-transparent px-4 md:px-6";

function FilaCuentaEsqueleto({ nombre, detalle }: { nombre: string; detalle: string }) {
  return (
    <li className={REJILLA_FILA}>
      <span className="hidden md:block" />
      <Bloque className="size-5" />
      <div className="flex min-w-0 flex-col">
        <span className="text-cuerpo">
          <Bloque className={`h-4 ${nombre}`} />
        </span>
        <span className="text-etiqueta">
          <Bloque className="h-3 w-16" />
        </span>
      </div>
      <span className="hidden text-etiqueta md:block">
        <Bloque className={`h-3 ${detalle}`} />
      </span>
      <span className="text-right text-cuerpo md:text-cifra-m">
        <Bloque className="h-4 w-20 md:h-5 md:w-28" />
      </span>
      <span className="size-11" />
    </li>
  );
}

function EncabezadoGrupo({ titulo, subtitulo }: { titulo: string; subtitulo: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-raya pt-4 pb-2 md:grid md:grid-cols-[28px_24px_minmax(0,1.1fr)_minmax(0,1.6fr)_200px]">
      <span className="hidden md:block" />
      <h2 className="flex min-w-0 items-baseline gap-2 md:col-span-2">
        <span className="text-rotulo uppercase">{titulo}</span>
        <span className="truncate text-etiqueta font-normal text-secundario">{subtitulo}</span>
      </h2>
      <span className="hidden text-rotulo uppercase text-secundario md:block">Detalle</span>
      <span className="text-right text-cifra-s md:text-cifra-m">
        <Bloque className="h-4 w-24 md:h-5 md:w-28" />
      </span>
    </div>
  );
}

const FILA_CIERRE = "flex items-baseline justify-between gap-3 py-3 md:grid md:grid-cols-[minmax(0,1fr)_200px]";

/** `/cuentas` mientras llega la lista: cabecera, Activos (hoja), Pasivos y el cierre. */
export function EsqueletoCuentas() {
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Anuncio>Cargando cuentas…</Anuncio>
      <header className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between md:gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex min-h-11 items-center md:min-h-0">
            <h1 className="text-titulo-1">Cuentas</h1>
          </div>
          <p className="text-etiqueta">
            <Bloque className="h-3 w-44" />
          </p>
        </div>
        {/* «Ordenar» y «Nueva cuenta», aún sin acción. */}
        <div aria-hidden className="hidden gap-3 md:flex">
          <span className="h-12 w-32 rounded-campo border border-linea bg-superficie" />
          <span className="h-12 w-44 rounded-campo bg-hundido" />
        </div>
      </header>

      <div aria-hidden className="flex flex-col gap-6 md:gap-8">
        <section className="rounded-hoja border border-linea bg-superficie px-4 pb-1 md:px-6">
          <EncabezadoGrupo titulo="Activos" subtitulo="Lo que tienes" />
          <ul className="divide-y divide-linea">
            <FilaCuentaEsqueleto nombre="w-24" detalle="w-20" />
            <FilaCuentaEsqueleto nombre="w-32" detalle="w-28" />
            <FilaCuentaEsqueleto nombre="w-20" detalle="w-24" />
          </ul>
        </section>
        <section className={`rounded-hoja pb-1 ${SANGRIA}`}>
          <EncabezadoGrupo titulo="Pasivos" subtitulo="Lo que debes" />
          <ul className="divide-y divide-linea">
            <FilaCuentaEsqueleto nombre="w-28" detalle="w-40" />
          </ul>
        </section>
      </div>

      <section aria-hidden className={SANGRIA}>
        {["Activos", "Pasivos"].map((rotulo) => (
          <div key={rotulo} className={`${FILA_CIERRE} border-b border-linea`}>
            <span className="text-cuerpo text-secundario">{rotulo}</span>
            <span className="text-right text-cifra-s">
              <Bloque className="h-4 w-24" />
            </span>
          </div>
        ))}
        <div className={`${FILA_CIERRE} doble-raya pt-4`}>
          <span className="text-cuerpo font-semibold md:text-titulo-2">Patrimonio neto</span>
          <span className="flex h-8 items-center justify-end md:h-9">
            <Bloque className="h-7 w-36 md:h-8 md:w-44" />
          </span>
        </div>
      </section>
    </div>
  );
}

/* ───────────── Detalle (`/cuentas/[id]`) ───────────── */

/**
 * `/cuentas/[id]` mientras llega la cuenta. La ruta aún no sabe si es una
 * cuenta o una tarjeta: la cabecera tiene la forma exacta de las dos; debajo,
 * la forma del detalle de efectivo y banco (el caso de todos los días): cifras,
 * rango e historial con renglones del alto real (53 px escritorio, 67 móvil, con su renglón).
 */
export function EsqueletoDetalleCuenta() {
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Anuncio>Cargando la cuenta…</Anuncio>

      <header className="flex flex-col gap-2 md:gap-3 md:border-b md:border-raya md:pb-4">
        {/* Móvil */}
        {/* La fila de «‹ Cuentas» mide lo que «Seleccionar» (44 px). */}
        <div className="flex min-h-11 items-center md:hidden">
          <EnlaceTexto href="/cuentas">‹ Cuentas</EnlaceTexto>
        </div>
        <div aria-hidden className="flex items-center gap-3 md:hidden">
          <Bloque className="size-[22px]" />
          <span className="text-titulo-2">
            <Bloque className="h-5 w-40" />
          </span>
        </div>

        {/* Escritorio */}
        <p aria-hidden className="hidden text-etiqueta md:block">
          <Bloque className="h-3 w-28" />
        </p>
        <div aria-hidden className="hidden items-end justify-between gap-6 md:flex">
          <div className="flex items-center gap-3">
            <Bloque className="size-[22px]" />
            <div className="flex flex-col">
              <span className="text-titulo-1">
                <Bloque className="h-6 w-56" />
              </span>
              <span className="text-etiqueta">
                <Bloque className="h-3 w-44" />
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="h-12 w-36 rounded-campo border border-linea bg-superficie" />
            <span className="flex h-11 items-center text-cuerpo">
              <Bloque className="h-4 w-24" />
            </span>
          </div>
        </div>
      </header>

      {/* Cifras: escritorio, saldo y conciliado, y «En el rango» tras un renglón; móvil, el saldo con «Ajustar». */}
      <section aria-hidden>
        <div className="hidden grid-cols-[minmax(0,1fr)_auto] md:grid">
          <div className="flex items-start gap-x-12 pr-8">
            <div className="flex flex-col gap-1">
              <span className="text-rotulo">
                <Bloque className="h-3 w-24" />
              </span>
              <span className="text-cifra-l">
                <Bloque className="h-8 w-40" />
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-rotulo">
                <Bloque className="h-3 w-20" />
              </span>
              <span className="text-cifra-m">
                <Bloque className="h-5 w-28" />
              </span>
              <span className="text-etiqueta">
                <Bloque className="h-3 w-40" />
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-l border-linea pl-8">
            <span className="text-rotulo">
              <Bloque className="h-3 w-24" />
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-cifra-s">
                <Bloque className="h-4 w-48" />
              </span>
              <span className="text-cifra-s">
                <Bloque className="h-4 w-48" />
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <span className="text-cifra-l">
              <Bloque className="h-8 w-40" />
            </span>
            <span className="h-11 w-24 rounded-campo border border-linea bg-superficie" />
          </div>
          <span className="text-etiqueta">
            <Bloque className="h-3 w-56" />
          </span>
        </div>
      </section>

      <div aria-hidden className="flex flex-col gap-4">
        {/* Rango: tres fichas y, en escritorio, el botón del rango. */}
        <div className="flex gap-2 overflow-hidden">
          {["w-36", "w-28", "w-24"].map((ancho) => (
            <span key={ancho} className={`h-11 shrink-0 rounded-campo border border-linea bg-superficie md:h-9 ${ancho}`} />
          ))}
          <span className="hidden h-9 w-52 rounded-campo border border-linea bg-superficie md:block" />
        </div>

        {/* Historial: rótulos sobre la raya y renglones del alto real. */}
        <div>
          <div className="border-b border-raya py-2 text-rotulo">&nbsp;</div>
          {/* Misma caja que la fila real: py-1 alrededor del estado de 44 px y del concepto (py-2). */}
          {["w-40", "w-28", "w-48", "w-32", "w-24", "w-36"].map((ancho) => (
            <div key={ancho} className="flex items-center gap-3 border-b border-linea py-1">
              <span className="hidden size-11 md:block" />
              <span className="hidden w-16 text-cifra-xs lg:block">
                <Bloque className="h-3 w-12" />
              </span>
              <div className="flex min-h-11 min-w-0 flex-1 flex-col justify-center py-2 pl-9 md:pl-0">
                <span className="text-cuerpo">
                  <Bloque className={`h-4 ${ancho}`} />
                </span>
                <span className="text-etiqueta lg:hidden">
                  <Bloque className="h-3 w-24" />
                </span>
              </div>
              <span className="text-cifra-s">
                <Bloque className="h-4 w-16 md:w-20" />
              </span>
              <span className="text-cifra-s">
                <Bloque className="h-4 w-16 md:w-20" />
              </span>
              <span className="hidden w-16 md:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────── Archivadas (`/cuentas/archivadas`) ───────────── */

/** `/cuentas/archivadas` mientras llega la lista: cabecera real y filas con su alto (68 px; 110 en móvil, con las acciones debajo). */
export function EsqueletoArchivadas() {
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Anuncio>Cargando cuentas archivadas…</Anuncio>
      <CabeceraArchivadas />
      <ul aria-hidden className="border-t border-raya">
        {["w-28", "w-36", "w-24"].map((ancho) => (
          <li
            key={ancho}
            className="grid grid-cols-[20px_minmax(0,1fr)] gap-x-3 border-b border-linea py-3 last:border-b-0 md:grid-cols-[24px_minmax(0,1fr)_auto]"
          >
            <span className="flex min-h-10 items-center">
              <Bloque className="size-5" />
            </span>
            <div className="flex min-h-10 flex-col justify-center">
              <span className="text-cuerpo">
                <Bloque className={`h-4 ${ancho}`} />
              </span>
              <span className="text-etiqueta">
                <Bloque className="h-3 w-20" />
              </span>
            </div>
            <div className="col-start-2 flex h-11 items-center gap-4 md:col-start-3 md:row-start-1">
              <span className="text-cuerpo">
                <Bloque className="h-4 w-20" />
              </span>
              <span className="text-cuerpo">
                <Bloque className="h-4 w-16" />
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
