import { anchoBarra, textoPorcentaje } from "@/domain/meta/presentacion";

type Props = {
  /** Centésimas de la API; `null` sin TRM (barra vacía). */
  porcentaje: number | null;
  /** 4 px en la lista, 8 px en el detalle. */
  alto: "lista" | "detalle";
  /** Cumplida: relleno en secundario. */
  cumplida?: boolean;
};

/**
 * Barra de avance de una meta: pista en `linea`, relleno en tinta (secundario
 * si está cumplida), radio de muestra. El ancho topa en 100 % aunque la meta lo
 * pase. Se lee como imagen: «25,3 % del objetivo».
 */
export function BarraAvance({ porcentaje, alto, cumplida = false }: Props) {
  return (
    <div
      role="img"
      aria-label={`${textoPorcentaje(porcentaje)} del objetivo`}
      className={`w-full overflow-hidden rounded-muestra bg-linea ${alto === "lista" ? "h-1" : "h-2"}`}
    >
      <div className={`h-full rounded-muestra ${cumplida ? "bg-secundario" : "bg-texto"}`} style={{ width: `${anchoBarra(porcentaje)}%` }} />
    </div>
  );
}
