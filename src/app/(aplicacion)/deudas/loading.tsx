/** Carga de /deudas: cabecera y renglones vacíos, sin cifras inventadas. */
export default function CargandoDeudas() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-titulo-1">Deudas y préstamos</h1>
        <p className="text-etiqueta font-normal text-secundario">Cargando tus deudas…</p>
      </header>
      <div aria-hidden className="hidden h-28 grid-cols-3 border-t border-raya lg:grid">
        <div />
        <div className="border-l border-linea" />
        <div className="border-l border-linea" />
      </div>
      <div aria-hidden className="lg:hidden">
        <div className="h-14 border-b border-linea" />
        <div className="h-14 border-b border-linea" />
        <div className="h-12 doble-raya" />
      </div>
      <div aria-hidden className="flex flex-col gap-8 xl:grid xl:grid-cols-[400px_minmax(0,1fr)] xl:gap-12">
        <div>
          <div className="h-8 border-b border-raya" />
          <div className="h-16 border-b border-linea" />
          <div className="h-16 border-b border-linea" />
        </div>
        <div className="hidden md:block">
          <div className="h-16 border-b border-raya" />
          <div className="h-11 border-b border-linea" />
          <div className="h-11 border-b border-linea" />
          <div className="h-11 doble-raya" />
        </div>
      </div>
    </div>
  );
}
