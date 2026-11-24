"use client";

import { createContext, use, useEffect, useEffectEvent, useSyncExternalStore, type ReactNode } from "react";
import { HojaCaptura } from "./hoja-captura";
import { PanelCaptura } from "./panel-captura";
import type { InicialesCaptura } from "@/domain/movimiento/iniciales";
import { useCaptura, type AccionesCaptura } from "./usar-captura";

export type { InicialesCaptura };

type ContextoCaptura = {
  /**
   * Abre la captura sobre la página actual, sin cambiar la URL. Con
   * `iniciales`, prellenada (una transferencia: «Registrar pago»).
   */
  abrir: (iniciales?: InicialesCaptura) => void;
  /** Id del recién registrado mientras dura su aviso (resaltado en `/movimientos`). */
  resaltadoId: string | null;
};

const Contexto = createContext<ContextoCaptura | null>(null);

/** Captura rápida desde cualquier componente de la aplicación. */
export function useContextoCaptura(): ContextoCaptura {
  const contexto = use(Contexto);
  if (!contexto) throw new Error("useContextoCaptura necesita <ProveedorCaptura>.");
  return contexto;
}

const ESCRITORIO = "(min-width: 768px)";

function suscribir(avisar: () => void): () => void {
  const consulta = window.matchMedia(ESCRITORIO);
  consulta.addEventListener("change", avisar);
  return () => consulta.removeEventListener("change", avisar);
}

/** Escritorio (md) o móvil. Solo importa con la captura abierta, que nunca se pinta en el servidor. */
export function useEscritorio(): boolean {
  return useSyncExternalStore(
    suscribir,
    () => window.matchMedia(ESCRITORIO).matches,
    () => true,
  );
}

/** Se está escribiendo o hay otro diálogo abierto: la tecla N no abre nada. */
function teclaOcupada(evento: KeyboardEvent): boolean {
  const destino = evento.target instanceof HTMLElement ? evento.target : null;
  if (destino && (destino.isContentEditable || destino.closest("input, textarea, select, [contenteditable]"))) return true;
  return document.querySelector("dialog[open], [aria-modal='true']") !== null;
}

/**
 * Captura rápida global. Vive en el layout de la aplicación, no en una ruta:
 * «Registrar» del menú, la pestaña central y la tecla N la abren sobre la
 * página actual. Elige panel (escritorio) u hoja (móvil). Solo el proveedor
 * es cliente: las páginas siguen siendo de servidor como `children`.
 */
export function ProveedorCaptura({ acciones, children }: { acciones: AccionesCaptura; children: ReactNode }) {
  const captura = useCaptura(acciones);
  const escritorio = useEscritorio();

  // N sin modificadores, fuera de campos de texto y sin otro diálogo abierto.
  const alPulsarTecla = useEffectEvent((evento: KeyboardEvent) => {
    if (evento.key !== "n" && evento.key !== "N") return;
    if (evento.ctrlKey || evento.metaKey || evento.altKey || evento.shiftKey || evento.repeat || evento.isComposing) return;
    if (captura.abierto || teclaOcupada(evento)) return;
    evento.preventDefault();
    captura.abrir();
  });

  useEffect(() => {
    const oyente = (evento: KeyboardEvent) => alPulsarTecla(evento);
    document.addEventListener("keydown", oyente);
    return () => document.removeEventListener("keydown", oyente);
  }, []);

  return (
    <Contexto value={{ abrir: captura.abrir, resaltadoId: captura.resaltadoId }}>
      {children}
      {captura.abierto && (escritorio ? <PanelCaptura c={captura} /> : <HojaCaptura c={captura} />)}
    </Contexto>
  );
}
