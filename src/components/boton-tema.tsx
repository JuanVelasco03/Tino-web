"use client";

import { Moon, Sun } from "lucide-react";
import { CLAVE_TEMA } from "@/lib/tema";

/**
 * Alterna claro/oscuro. La fuente de verdad es `data-theme` en <html>, que el
 * script del layout fija antes del primer pintado; aquí se cambia y se guarda.
 */
export function alternarTema() {
  const raiz = document.documentElement;
  const siguiente = raiz.dataset.theme === "dark" ? "light" : "dark";
  raiz.dataset.theme = siguiente;
  try {
    localStorage.setItem(CLAVE_TEMA, siguiente);
  } catch {
    // Almacenamiento bloqueado: el cambio vale solo para esta sesión.
  }
}

/**
 * Botón fijo de cambio de tema (acceso y /estilos). No guarda estado en React.
 * El icono se elige por CSS, así que no hay desajuste de hidratación.
 */
export function BotonTema() {
  return (
    <button
      type="button"
      onClick={alternarTema}
      aria-label="Cambiar tema"
      className="fixed top-4 right-4 z-50 flex size-11 items-center justify-center rounded-campo border border-linea bg-superficie text-texto"
    >
      <Moon size={20} strokeWidth={1.5} aria-hidden="true" className="block [[data-theme=dark]_&]:hidden" />
      <Sun size={20} strokeWidth={1.5} aria-hidden="true" className="hidden [[data-theme=dark]_&]:block" />
    </button>
  );
}
