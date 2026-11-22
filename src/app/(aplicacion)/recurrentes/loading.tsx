/** Carga de /recurrentes: cabecera y renglones vacíos, sin cifras inventadas. */
export default function CargandoRecurrentes() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-8 md:gap-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-titulo-1">Recurrentes</h1>
        <p className="text-etiqueta font-normal text-secundario">Cargando recurrentes…</p>
      </header>
      <div aria-hidden className="flex flex-col gap-8 xl:grid xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-12">
        <div className="order-2 xl:order-1">
          <div className="h-8 border-b border-raya" />
          <div className="h-16 punteada" />
          <div className="h-16 punteada" />
        </div>
        <div className="order-1 xl:order-2">
          <div className="h-8 border-b border-raya" />
          <div className="h-16" />
          <div className="h-11 border-b border-linea" />
          <div className="h-11 border-b border-linea" />
          <div className="h-11 border-b border-linea" />
        </div>
      </div>
      <div aria-hidden>
        <div className="h-8 border-b border-raya" />
        <div className="h-12 border-b border-linea" />
        <div className="h-12 border-b border-linea" />
        <div className="h-12 border-b border-linea" />
      </div>
    </div>
  );
}
