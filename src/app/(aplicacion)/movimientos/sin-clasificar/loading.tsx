/** Carga de /movimientos/sin-clasificar: cabecera con la vuelta y renglones vacíos. */
export default function CargandoSinClasificar() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-4 md:gap-6">
      <header className="flex flex-col items-start gap-1">
        <span className="text-etiqueta text-secundario">← Movimientos</span>
        <h1 className="text-titulo-1">Gastos sin clasificar</h1>
        <p className="text-etiqueta font-normal text-secundario">Cargando gastos…</p>
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
