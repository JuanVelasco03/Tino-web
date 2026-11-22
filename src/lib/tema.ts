/**
 * Clave del tema en localStorage. Vive fuera de `boton-tema.tsx` ("use client")
 * porque el layout raíz (componente de servidor) la interpola en su script:
 * importada desde un módulo de cliente sería una referencia de cliente, no el
 * texto, y el script del tema quedaría roto.
 */
export const CLAVE_TEMA = "tino-tema";
