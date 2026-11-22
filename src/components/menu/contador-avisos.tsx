/**
 * Contador de avisos sin leer en el menú (N-02). Lo arma el layout con el
 * número de `GET /avisos/conteo` y lo pasa como nodo, como la TRM: los
 * componentes del menú no leen el dato. Con 0 no hay número ni punto.
 */

/** El número junto a «Avisos» (menú lateral y hoja «Más»): cifra-xs en `marca-texto`. */
export function NumeroAvisos({ noLeidos }: { noLeidos: number }) {
  if (noLeidos <= 0) return null;
  return (
    <span className="font-mono text-cifra-xs tabular-nums text-marca-texto">
      {noLeidos}
      <span className="sr-only"> sin leer</span>
    </span>
  );
}

/**
 * El punto de 8 px en `marca` arriba a la derecha del icono de «Más», con
 * «{3} avisos sin leer» para lectores de pantalla. El radio de campo (4 px)
 * sobre 8 px lo vuelve círculo sin salir de los radios del sistema.
 */
export function PuntoAvisos({ noLeidos }: { noLeidos: number }) {
  if (noLeidos <= 0) return null;
  return (
    <span className="absolute top-0 right-0 size-2 rounded-campo bg-marca">
      <span className="sr-only">{noLeidos === 1 ? "1 aviso sin leer" : `${noLeidos} avisos sin leer`}</span>
    </span>
  );
}
