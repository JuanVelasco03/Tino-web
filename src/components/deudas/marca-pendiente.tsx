"use client";

import { useLinkStatus } from "next/link";

/**
 * Dentro del enlace de una persona: mientras llega su detalle (cambiar
 * `?prestamo=` no vuelve a mostrar `loading.tsx`), deja una marca que la página
 * lee con `group-has-*` para atenuar el detalle viejo.
 */
export function MarcaPendiente() {
  const { pending } = useLinkStatus();
  // `hidden`: fuera de la rejilla de la fila (no suma un renglón ni su `gap`); `:has()` la ve igual.
  return pending ? <span data-prestamo-pendiente aria-hidden className="hidden" /> : null;
}
