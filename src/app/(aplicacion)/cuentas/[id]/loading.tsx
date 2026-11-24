/** Carga del detalle de una cuenta. Renglones vacíos, sin cifras inventadas. */
export default function CargandoCuenta() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-6 md:gap-8">
      <header className="flex flex-col gap-1 md:border-b md:border-raya md:pb-4">
        <div aria-hidden className="h-11" />
        <p className="text-etiqueta font-normal text-secundario">Cargando la cuenta…</p>
      </header>
      <div aria-hidden className="hidden h-24 grid-cols-[minmax(0,1fr)_240px] md:grid">
        <div />
        <div className="border-l border-linea" />
      </div>
      <div aria-hidden>
        <div className="h-8 border-b border-raya" />
        <div className="h-12 border-b border-linea" />
        <div className="h-12 border-b border-linea" />
        <div className="h-12 border-b border-linea" />
        <div className="h-12 border-b border-linea" />
      </div>
    </div>
  );
}
