"use client";

import { Boton } from "@/components/boton";

/**
 * Error al cargar /inversiones (API caída, 500…). `retry` vuelve a pedir los
 * datos al servidor y re-renderiza el segmento (Next 16.3+); `reset` no re-pide.
 */
export default function ErrorInversiones({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <h1 className="text-titulo-1">Inversiones</h1>
      <div role="alert" className="flex flex-col items-start gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-cuerpo font-semibold">No pudimos cargar tus inversiones.</p>
          <p className="text-cuerpo text-secundario">Tus datos están a salvo. Intenta de nuevo en un momento.</p>
        </div>
        <Boton variante="secundario" onClick={() => retry()}>
          Reintentar
        </Boton>
      </div>
    </div>
  );
}
