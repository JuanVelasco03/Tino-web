"use client";

import { useLinkStatus } from "next/link";

/**
 * Dentro de un enlace que abre el panel (`?plantilla=`): cambiar el parámetro
 * no vuelve a mostrar `loading.tsx`, así que mientras llega el panel deja una
 * marca que el enlace lee con `has-[[data-abriendo]]` para tomar fondo `hundido`.
 */
export function MarcaAbriendo() {
  const { pending } = useLinkStatus();
  // `hidden`: fuera de la rejilla de la fila; `:has()` la ve igual.
  return pending ? <span data-abriendo aria-hidden className="hidden" /> : null;
}
