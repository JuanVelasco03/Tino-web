/** Carga de /resumen: cabecera y renglones vacíos, sin cifras inventadas. */
export default function CargandoResumen() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-8 md:gap-12">
      <header className="flex flex-col gap-1">
        <p className="text-rotulo uppercase text-secundario">Resumen del mes</p>
        <p className="text-etiqueta font-normal text-secundario">Cargando resumen…</p>
      </header>
      <div aria-hidden>
        <div className="h-8 border-b border-raya" />
        <div className="h-16 border-b border-linea" />
        <div className="h-16 border-b border-linea" />
        <div className="h-16 border-b border-linea" />
      </div>
    </div>
  );
}
