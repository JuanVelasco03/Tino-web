"use client";

import { Boton } from "@/components/boton";
import { EnlaceTexto } from "@/components/enlace-texto";

/**
 * Error al cargar el detalle de una cuenta (API caída, 500…). `retry` vuelve
 * a pedir los datos al servidor y re-renderiza el segmento (Next 16.3+).
 */
export default function ErrorCuenta({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <EnlaceTexto href="/cuentas" className="self-start">
        ‹ Cuentas
      </EnlaceTexto>
      <div role="alert" className="flex flex-col items-start gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-cuerpo font-semibold">No pudimos cargar esta cuenta.</p>
          <p className="text-etiqueta font-normal text-secundario">Tus datos siguen guardados. Intenta de nuevo en un momento.</p>
        </div>
        <Boton variante="secundario" onClick={() => retry()}>
          Reintentar
        </Boton>
      </div>
    </div>
  );
}
