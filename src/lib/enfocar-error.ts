/**
 * Tras un envío con errores, lleva el foco al primer campo marcado
 * (`aria-invalid="true"`) del formulario: el error se anuncia y se corrige ahí,
 * sin buscarlo. Espera un cuadro para que React pinte los errores.
 */
export function enfocarPrimerError(idFormulario: string) {
  requestAnimationFrame(() => {
    document.getElementById(idFormulario)?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  });
}
