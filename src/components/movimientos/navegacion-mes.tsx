import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatearMes, sumarMeses } from "@/domain/fecha/formato";
import { EnlaceTexto } from "../enlace-texto";

type Props = {
  /** `"YYYY-MM"` del mes listado. */
  mes: string;
  /** `"YYYY-MM"` del mes actual en la zona del usuario. */
  actual: string;
  /** Ruta base (`/movimientos`); cada mes va en `?mes=YYYY-MM`. */
  ruta?: string;
  /** `‹` visible. Oculta, la flecha conserva su hueco de 44 px. */
  hayAnterior?: boolean;
  /** `›` visible. Oculta, la flecha conserva su hueco de 44 px. */
  haySiguiente?: boolean;
  /**
   * `"linea"` (por defecto): el mes en cuerpo 600, «Este mes» a la derecha.
   * `"titulo"`: el mes es el `h1` de la página. Escritorio `‹ Mes ›  Este mes`;
   * móvil, el mes a la izquierda, `‹ ›` a la derecha y «Este mes» debajo.
   */
  variante?: "linea" | "titulo";
};

const FLECHA = "flex size-11 shrink-0 items-center justify-center text-secundario hover:text-texto";

function Flecha({ direccion, destino, ruta, visible }: { direccion: "anterior" | "siguiente"; destino: string; ruta: string; visible: boolean }) {
  if (!visible) return <span aria-hidden className="size-11 shrink-0" />;
  const Icono = direccion === "anterior" ? ChevronLeft : ChevronRight;
  const rotulo = direccion === "anterior" ? "Mes anterior" : "Mes siguiente";
  return (
    <Link href={`${ruta}?mes=${destino}`} aria-label={`${rotulo}: ${formatearMes(destino)}`} className={FLECHA}>
      <Icono size={18} strokeWidth={1.5} aria-hidden />
    </Link>
  );
}

/**
 * Navegación de meses: `‹` y `›` (44 px) junto al nombre del mes y «Este mes»
 * fuera del actual. Cada mes es una URL (`?mes=`), así que se puede recargar o
 * compartir. Los límites (`hayAnterior`, `haySiguiente`) los decide quien la
 * usa: en `/movimientos` no hay (la captura admite fechas futuras); en
 * `/resumen`, los da la API.
 */
export function NavegacionMes({ mes, actual, ruta = "/movimientos", hayAnterior = true, haySiguiente = true, variante = "linea" }: Props) {
  const anterior = <Flecha direccion="anterior" destino={sumarMeses(mes, -1)} ruta={ruta} visible={hayAnterior} />;
  const siguiente = <Flecha direccion="siguiente" destino={sumarMeses(mes, 1)} ruta={ruta} visible={haySiguiente} />;
  const esteMes = mes !== actual && <EnlaceTexto href={ruta}>Este mes</EnlaceTexto>;

  if (variante === "titulo") {
    // Sin ninguna flecha (el único mes con datos es el actual) no hay nada que
    // estabilizar: sin huecos, el título queda alineado con el rótulo de arriba.
    const sinFlechas = !hayAnterior && !haySiguiente;
    return (
      <nav aria-label="Mes" className="flex flex-col md:flex-row md:items-center md:gap-3">
        <div className={`flex min-h-11 items-center ${sinFlechas ? "" : "max-md:-mr-3 md:-ml-3"}`}>
          {!sinFlechas && anterior}
          {/* En móvil el mes pasa delante y empuja las flechas a la derecha. */}
          <h1 className="text-titulo-1 max-md:order-first max-md:flex-1">{formatearMes(mes)}</h1>
          {!sinFlechas && siguiente}
        </div>
        {esteMes && <div>{esteMes}</div>}
      </nav>
    );
  }

  return (
    <nav aria-label="Mes" className="flex min-h-11 items-center justify-between gap-3">
      <div className="-ml-3 flex items-center">
        {anterior}
        <span className="text-cuerpo font-semibold">{formatearMes(mes)}</span>
        {siguiente}
      </div>
      {esteMes}
    </nav>
  );
}
