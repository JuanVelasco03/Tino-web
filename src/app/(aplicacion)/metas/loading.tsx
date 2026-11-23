/** Carga de /metas: cabecera y renglones vacíos, sin cifras inventadas. */
export default function CargandoMetas() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-titulo-1">
          <span className="md:hidden">Metas</span>
          <span className="hidden md:inline">Metas de ahorro</span>
        </h1>
        <p className="text-etiqueta font-normal text-secundario">Cargando tus metas…</p>
      </header>
      <div aria-hidden className="flex flex-col gap-8 xl:grid xl:grid-cols-[400px_minmax(0,1fr)] xl:gap-12">
        <div>
          <div className="h-8 border-b border-raya" />
          <div className="h-20 border-b border-linea" />
          <div className="h-20 border-b border-linea" />
          <div className="h-20 border-b border-linea" />
        </div>
        <div className="hidden md:block">
          <div className="h-16 border-b border-raya" />
          <div className="h-20" />
          <div className="h-11 border-b border-raya" />
          <div className="h-11 border-b border-linea" />
          <div className="h-11 border-b border-linea" />
        </div>
      </div>
    </div>
  );
}
