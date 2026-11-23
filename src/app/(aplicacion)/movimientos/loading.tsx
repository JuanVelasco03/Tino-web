/** Carga de /movimientos: cabecera y renglones vacíos, sin cifras inventadas. */
export default function CargandoMovimientos() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-4 md:gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-titulo-1">Movimientos</h1>
        <p className="text-etiqueta font-normal text-secundario">Cargando movimientos…</p>
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
