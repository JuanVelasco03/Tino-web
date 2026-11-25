"use client";

import { CalendarDays } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { formatearDiaSemana, formatearMes } from "@/domain/fecha/formato";
import { Calendario, CalendarioMeses } from "./calendario";
import { MensajeError } from "./mensaje-error";

type Props = {
  etiqueta: string;
  /** Contenido a la derecha de la etiqueta («Opcional»). */
  extra?: ReactNode;
  /** `"YYYY-MM-DD"` (o `"YYYY-MM"` con `modo="mes"`); `""` sin elegir. */
  valor: string;
  alCambiar: (valor: string) => void;
  /** `fechaHoy` de la API: marca hoy en el calendario. Nunca el reloj del navegador. */
  hoy: string | null;
  /** Límites, en el formato del modo. */
  min?: string;
  max?: string;
  error?: string;
  deshabilitado?: boolean;
  /** Texto del campo vacío («Sin fecha»). */
  vacio?: string;
  /** `dia` (por defecto) o `mes`: la cuadrícula de meses de la fecha meta. */
  modo?: "dia" | "mes";
  /** Línea en terracota sin mensaje propio: el error lo muestra el grupo que lo contiene. */
  invalido?: boolean;
  /** El calendario se abre en el flujo, bajo el campo, en vez de flotar (dentro de un contenedor que recorta). */
  enLinea?: boolean;
};

/** «mar 24 nov 2026» o «Noviembre 2026». */
function mostrada(valor: string, modo: "dia" | "mes"): string {
  if (modo === "mes") return formatearMes(valor);
  return `${formatearDiaSemana(valor)} ${valor.slice(0, 4)}`;
}

/**
 * Campo de fecha del libro, en lugar del `<input type="date">` nativo (azul,
 * fuera de paleta). Como `CampoSubrayado`: etiqueta arriba y el valor sobre
 * un renglón `linea` (raya con el foco, terracota con error), con un
 * calendario de 18 px a la derecha. Al pulsarlo, el `Calendario` se abre
 * debajo en una hoja `superficie` con borde `raya`, entrando con «Asentar».
 * Elegir cierra la hoja y devuelve el foco al campo; Escape y un clic fuera
 * también la cierran (Escape no llega a cerrar el panel que lo contiene).
 */
export function CampoFecha({
  etiqueta,
  extra,
  valor,
  alCambiar,
  hoy,
  min,
  max,
  error,
  deshabilitado = false,
  vacio = "Elegir fecha",
  modo = "dia",
  invalido = false,
  enLinea = false,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const hoja = useRef<HTMLDivElement>(null);
  const id = useId();
  const idEtiqueta = `${id}-etiqueta`;
  const idError = `${id}-error`;

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("pointerdown", fuera);
    // Cerca del pie fijo de un panel, la hoja quedaría tapada: el contenedor se desplaza hasta mostrarla entera.
    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    hoja.current?.scrollIntoView({ block: "nearest", behavior: suave ? "smooth" : "auto" });
    return () => document.removeEventListener("pointerdown", fuera);
  }, [abierto]);

  function cerrar() {
    setAbierto(false);
    boton.current?.focus();
  }

  function alTeclear(evento: KeyboardEvent<HTMLDivElement>) {
    if (evento.key !== "Escape") return;
    // Sin esto, Escape cancelaría el `<dialog>` del panel y pediría cerrarlo.
    evento.preventDefault();
    evento.stopPropagation();
    cerrar();
  }

  function elegir(nuevo: string) {
    alCambiar(nuevo);
    cerrar();
  }

  const linea = error || invalido ? "border-salida" : abierto ? "border-raya" : "border-linea focus-visible:border-raya";

  return (
    <div ref={raiz} className="relative flex flex-col gap-1" onKeyDown={alTeclear}>
      <span id={idEtiqueta} className="flex justify-between text-etiqueta font-normal text-secundario">
        <span>{etiqueta}</span>
        {extra}
      </span>
      <button
        ref={boton}
        type="button"
        onClick={() => setAbierto((a) => !a)}
        disabled={deshabilitado}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-labelledby={`${idEtiqueta} ${id}-valor`}
        aria-describedby={error ? idError : undefined}
        className={`flex h-11 w-full items-center justify-between gap-2 border-b bg-transparent text-left text-cuerpo disabled:text-terciario ${linea}`}
      >
        <span id={`${id}-valor`} className={`truncate ${valor === "" ? "text-secundario" : "text-texto"}`}>
          {valor === "" ? vacio : mostrada(valor, modo)}
        </span>
        <CalendarDays size={18} strokeWidth={1.5} aria-hidden className="shrink-0 text-secundario" />
      </button>
      {error && <MensajeError id={idError} mensaje={error} />}

      {abierto && (
        <div
          ref={hoja}
          role="dialog"
          aria-label={etiqueta}
          className={`asentar rounded-campo border border-raya bg-superficie px-3 pt-1 pb-3 ${
            enLinea ? "mt-1 w-full max-w-[400px]" : "absolute top-full left-0 z-20 mt-1 w-[320px] max-w-[calc(100vw-32px)]"
          }`}
        >
          {modo === "mes" ? (
            <CalendarioMeses etiqueta={etiqueta} valor={valor} hoy={hoy} min={min} max={max} alElegir={elegir} autoFoco />
          ) : (
            <Calendario etiqueta={etiqueta} valor={valor} hoy={hoy} min={min} max={max} alElegir={elegir} autoFoco />
          )}
        </div>
      )}
    </div>
  );
}
