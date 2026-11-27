"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Recuerda qué tenía el foco al abrir un panel o bloque por URL (el enlace que
 * lo abrió) y lo devuelve al cerrar. Sin esto, al quitar el `<dialog>` el foco
 * cae en `body` y el teclado o el lector de pantalla vuelven al inicio.
 *
 * `devolver()` se llama al cerrar, antes de cambiar la URL. Con `PanelLateral`
 * el diálogo sigue modal hasta desmontarse (la página está inerte), así que el
 * foco se devuelve al desmontar; en un bloque en línea, en el acto. Si se
 * abrió desde la URL directa (nada enfocado), no hace nada.
 */
export function useFocoDeRegreso(): () => void {
  const [origen] = useState<HTMLElement | null>(() => {
    if (typeof document === "undefined") return null;
    const activo = document.activeElement;
    return activo instanceof HTMLElement && activo !== document.body ? activo : null;
  });
  const pedido = useRef(false);

  useEffect(
    () => () => {
      // Tras el desmontaje: el `<dialog>` ya se cerró y el enlace vuelve a ser enfocable.
      if (pedido.current && origen) setTimeout(() => origen.isConnected && origen.focus({ preventScroll: true }), 0);
    },
    [origen],
  );

  return () => {
    pedido.current = true;
    if (origen?.isConnected) origen.focus({ preventScroll: true });
  };
}
