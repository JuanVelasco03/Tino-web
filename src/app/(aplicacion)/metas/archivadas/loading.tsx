/** Carga de /metas/archivadas: cabecera y renglones vacíos, sin cifras inventadas. */
export default function CargandoMetasArchivadas() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-titulo-1">Metas archivadas</h1>
        <p className="text-etiqueta font-normal text-secundario">Cargando tus metas archivadas…</p>
      </header>
      <div aria-hidden className="flex flex-col gap-8 xl:grid xl:grid-cols-[360px_minmax(0,1fr)] xl:gap-12">
        <div className="border-t border-raya">
          <div className="h-20 border-b border-linea" />
          <div className="h-20 border-b border-linea" />
        </div>
        <div className="hidden md:block">
          <div className="h-16 border-b border-raya" />
          <div className="h-20" />
          <div className="h-11 border-b border-raya" />
          <div className="h-11 border-b border-linea" />
        </div>
      </div>
    </div>
  );
}
