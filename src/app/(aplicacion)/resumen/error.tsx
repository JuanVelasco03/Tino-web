"use client";

import { Boton } from "@/components/boton";

/**
 * Error al cargar /resumen (API caída, 500…). `retry` vuelve a pedir los
 * datos al servidor y re-renderiza el segmento (Next 16.3+).
 */
export default function ErrorResumen({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <p className="text-rotulo uppercase text-secundario">Resumen del mes</p>
      <div role="alert" className="flex flex-col items-start gap-4">
        <p className="text-cuerpo font-semibold">No pudimos cargar el resumen.</p>
        <Boton variante="secundario" onClick={() => retry()}>
          Reintentar
        </Boton>
      </div>
    </div>
  );
}
