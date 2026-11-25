"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
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
  /** `‹` activa. Si no, se ve deshabilitada en `terciario`, sin enlace. */
  hayAnterior?: boolean;
  /** `›` activa. Si no, se ve deshabilitada en `terciario`, sin enlace. */
  haySiguiente?: boolean;
  /**
   * `"linea"` (por defecto): el mes en cuerpo 600, «Este mes» a la derecha.
   * `"titulo"`: el mes es el `h1` de la página. Escritorio `‹ Mes ›` (40 px);
   * móvil, el mes a la izquierda y `‹ ›` (44 px) a la derecha.
   */
  variante?: "linea" | "titulo";
};

type Direccion = "anterior" | "siguiente";

/**
 * Flecha que se acaba de pulsar. Cambiar de mes desmonta la navegación (el
 * resumen va en un `<Suspense key={mes}>`), así que el foco caería al inicio
 * de la página: la navegación nueva lo devuelve a la misma flecha (o a la
 * otra, si en el mes nuevo esa ya no está activa). Vive en el módulo porque
 * sobrevive a la navegación en el cliente; el esqueleto, sin flechas activas,
 * la deja pendiente para la página que llega.
 */
let focoPendiente: Direccion | null = null;

/** Al pasar el cursor, el chevrón se corre 2 px hacia el mes al que lleva. Sin desplazamiento con movimiento reducido. */
const EMPUJE: Record<Direccion, string> = {
  anterior: "group-hover:-translate-x-0.5",
  siguiente: "group-hover:translate-x-0.5",
};

/** `tamano`: medida del objetivo. `color`: el de la flecha activa (con su hover); deshabilitada, siempre `terciario`. */
type Aspecto = { tamano: string; color: string };

function Flecha({ direccion, destino, ruta, activa, aspecto }: { direccion: Direccion; destino: string; ruta: string; activa: boolean; aspecto: Aspecto }) {
  const Icono = direccion === "anterior" ? ChevronLeft : ChevronRight;
  const rotulo = direccion === "anterior" ? "Mes anterior" : "Mes siguiente";
  const movimiento = activa ? `transition-transform duration-150 ease-llegada motion-reduce:transform-none ${EMPUJE[direccion]}` : "";
  const icono = <Icono size={18} strokeWidth={1.5} aria-hidden className={movimiento} />;
  const base = `flex shrink-0 items-center justify-center ${aspecto.tamano}`;
  if (!activa) {
    return (
      <span role="link" aria-disabled="true" aria-label={rotulo} className={`${base} text-terciario`}>
        {icono}
      </span>
    );
  }
  return (
    <Link
      href={`${ruta}?mes=${destino}`}
      aria-label={`${rotulo}: ${formatearMes(destino)}`}
      data-flecha={direccion}
      onClick={() => (focoPendiente = direccion)}
      className={`group transition-colors duration-150 ease-llegada ${base} ${aspecto.color}`}
    >
      {icono}
    </Link>
  );
}

/**
 * Navegación de meses: `‹` y `›` junto al nombre del mes. Cada mes es una URL
 * (`?mes=`), así que se puede recargar o compartir. Los límites
 * (`hayAnterior`, `haySiguiente`) los decide quien la usa: en `/movimientos`
 * no hay (la captura admite fechas futuras); en `/resumen`, los da la API.
 * En un límite la flecha queda visible pero deshabilitada.
 */
export function NavegacionMes({ mes, actual, ruta = "/movimientos", hayAnterior = true, haySiguiente = true, variante = "linea" }: Props) {
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const pedida = focoPendiente;
    if (!pedida || !nav.current) return;
    const flecha =
      nav.current.querySelector<HTMLElement>(`a[data-flecha="${pedida}"]`) ?? nav.current.querySelector<HTMLElement>("a[data-flecha]");
    if (!flecha) return; // El esqueleto: sin flechas activas, espera a la página.
    focoPendiente = null;
    flecha.focus();
  }, [mes]);

  if (variante === "titulo") {
    const aspecto: Aspecto = { tamano: "size-11 md:size-10", color: "text-texto hover:text-secundario" };
    return (
      <nav ref={nav} aria-label="Mes" className="flex min-h-11 items-center max-md:-mr-3 md:-ml-2.5 md:min-h-10 md:gap-1">
        <Flecha direccion="anterior" destino={sumarMeses(mes, -1)} ruta={ruta} activa={hayAnterior} aspecto={aspecto} />
        {/* En móvil el mes pasa delante y empuja las flechas a la derecha. */}
        <h1 className="text-titulo-1 max-md:order-first max-md:flex-1">{formatearMes(mes)}</h1>
        <Flecha direccion="siguiente" destino={sumarMeses(mes, 1)} ruta={ruta} activa={haySiguiente} aspecto={aspecto} />
      </nav>
    );
  }

  const aspecto: Aspecto = { tamano: "size-11", color: "text-secundario hover:text-texto" };
  return (
    <nav ref={nav} aria-label="Mes" className="flex min-h-11 items-center justify-between gap-3">
      <div className="-ml-3 flex items-center">
        <Flecha direccion="anterior" destino={sumarMeses(mes, -1)} ruta={ruta} activa={hayAnterior} aspecto={aspecto} />
        <span className="text-cuerpo font-semibold">{formatearMes(mes)}</span>
        <Flecha direccion="siguiente" destino={sumarMeses(mes, 1)} ruta={ruta} activa={haySiguiente} aspecto={aspecto} />
      </div>
      {mes !== actual && <EnlaceTexto href={ruta}>Este mes</EnlaceTexto>}
    </nav>
  );
}
