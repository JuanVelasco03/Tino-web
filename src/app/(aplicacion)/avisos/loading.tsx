/** Carga de /avisos: cabecera y renglones vacíos, sin avisos inventados. */
export default function CargandoAvisos() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-titulo-1">Avisos</h1>
        <p className="text-etiqueta font-normal text-secundario">Cargando avisos…</p>
      </header>
      <div aria-hidden className="flex flex-col gap-8 xl:grid xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-14">
        <div>
          <div className="h-8 border-b border-raya" />
          <div className="h-16 border-b border-linea" />
          <div className="h-16 border-b border-linea" />
          <div className="h-16 border-b border-linea" />
        </div>
        <div className="hidden xl:block">
          <div className="h-8 border-b border-raya" />
          <div className="h-24 border-b border-linea" />
          <div className="h-24 border-b border-linea" />
          <div className="h-24 border-b border-linea" />
          <div className="h-24 border-b border-linea" />
        </div>
      </div>
    </div>
  );
}
