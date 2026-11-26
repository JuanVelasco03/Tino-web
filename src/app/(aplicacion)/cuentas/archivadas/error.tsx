"use client";

import { Boton } from "@/components/boton";
import { CabeceraArchivadas } from "@/components/cuentas/lista-archivadas";

/**
 * Error al cargar /cuentas/archivadas. `retry` vuelve a pedir los datos al
 * servidor y re-renderiza el segmento (Next 16.3+).
 */
export default function ErrorArchivadas({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <CabeceraArchivadas />
      <div role="alert" className="flex flex-col items-start gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-cuerpo font-semibold">No pudimos cargar tus cuentas archivadas.</p>
          <p className="text-etiqueta font-normal text-secundario">Tus datos siguen guardados. Intenta de nuevo en un momento.</p>
        </div>
        <Boton variante="secundario" onClick={() => retry()}>
          Reintentar
        </Boton>
      </div>
    </div>
  );
}
