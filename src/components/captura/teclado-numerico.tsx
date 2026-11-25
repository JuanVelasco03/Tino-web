import { Delete } from "lucide-react";
import { aplicarTecla, type TeclaNumerica } from "@/domain/dinero/entrada";
import type { Moneda } from "@/domain/dinero/formato";

type Props = {
  /** Lo tecleado, ya formateado («15.000»). */
  valor: string;
  alCambiar: (valor: string) => void;
  /** En USD, «000» se cambia por «,» (dos decimales). */
  moneda?: Moneda;
  deshabilitado?: boolean;
};

const TECLAS: readonly TeclaNumerica[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "borrar"];
const TECLAS_USD: readonly TeclaNumerica[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "borrar"];

/**
 * Teclado numérico propio de la captura en móvil: no tapa los conceptos ni la
 * fila de categoría, cuenta y fecha como el del sistema. Radio 0, divisiones
 * de renglón entre teclas. Ignora los ceros a la izquierda; 19 dígitos máximo.
 */
export function TecladoNumerico({ valor, alCambiar, moneda = "COP", deshabilitado = false }: Props) {
  return (
    <div role="group" aria-label="Teclado numérico" className="grid grid-cols-3 gap-px border-y border-linea bg-linea">
      {(moneda === "USD" ? TECLAS_USD : TECLAS).map((tecla) => (
        <button
          key={tecla}
          type="button"
          disabled={deshabilitado}
          aria-label={tecla === "borrar" ? "Borrar" : tecla === "," ? "Coma decimal" : undefined}
          onClick={() => alCambiar(aplicarTecla(valor, tecla, moneda))}
          className="presion flex h-14 items-center justify-center rounded-fila bg-fondo font-mono text-cifra-m font-normal text-texto active:bg-hundido disabled:text-terciario"
        >
          {tecla === "borrar" ? <Delete size={20} strokeWidth={1.5} aria-hidden /> : tecla}
        </button>
      ))}
    </div>
  );
}
