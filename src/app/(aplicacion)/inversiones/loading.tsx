/** Carga de /inversiones (puede tardar: la API trae los precios vencidos). Renglones vacíos, sin cifras inventadas. */
export default function CargandoInversiones() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-titulo-1">Inversiones</h1>
        <p className="text-etiqueta font-normal text-secundario">Cargando tus inversiones…</p>
      </header>
      <div aria-hidden className="hidden h-28 grid-cols-[1.3fr_1fr_1.2fr] border-t border-raya md:grid">
        <div />
        <div className="border-l border-linea" />
        <div className="border-l border-linea" />
      </div>
      <div aria-hidden className="md:hidden">
        <div className="h-20 border-t border-raya" />
        <div className="h-16 border-t border-linea" />
      </div>
      <div aria-hidden>
        <div className="h-8 border-b border-raya" />
        <div className="h-16 border-b border-linea" />
        <div className="h-16 border-b border-linea" />
        <div className="h-16 border-b border-linea" />
        <div className="doble-raya h-14" />
      </div>
    </div>
  );
}
