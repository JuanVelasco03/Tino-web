"use client";

import { Boton } from "@/components/boton";

/**
 * Error al cargar /recurrentes (API caída, 500…). `retry` vuelve a pedir los
 * datos al servidor y re-renderiza el segmento (Next 16.3+); `reset` no re-pide.
 */
export default function ErrorRecurrentes({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <h1 className="text-titulo-1">Recurrentes</h1>
      <div role="alert" className="flex flex-col items-start gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-cuerpo font-semibold">No pudimos cargar tus recurrentes.</p>
          <p className="text-etiqueta font-normal text-secundario">Revisa tu conexión e inténtalo de nuevo.</p>
        </div>
        <Boton variante="secundario" onClick={() => retry()}>
          Reintentar
        </Boton>
      </div>
    </div>
  );
}
