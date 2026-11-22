"use client";

import {
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type MouseEvent,
  type ReactNode,
  type Ref,
  type SyntheticEvent,
} from "react";

/** Control imperativo del panel: anima la salida antes de que quien lo usa lo desmonte. */
export type ControlPanel = {
  /** Retira la hoja y resuelve al terminar. Llamarla dos veces devuelve la misma salida. */
  cerrar: () => Promise<void>;
};

type Props = {
  /** Rótulo de la cabecera («Nueva cuenta»); se muestra en mayúsculas. */
  titulo: string;
  /**
   * Escape, «Cerrar» o clic en el velo. El panel no se cierra solo: quien lo
   * usa decide (por ejemplo, preguntar antes de descartar cambios).
   */
  alSolicitarCierre: () => void;
  children: ReactNode;
  /**
   * `normal`: 400 px (C22). `amplio`: 480 px, para formularios en dos
   * columnas (la captura rápida). Solo cambia el ancho en escritorio.
   */
  ancho?: "normal" | "amplio";
  /** Pie fijo bajo el contenido desplazable, sobre una división (la acción principal). */
  pie?: ReactNode;
  /** Rótulo del botón de la cabecera: «Cerrar» o, si cierra sin guardar, «Cancelar». */
  rotuloCerrar?: string;
  ref?: Ref<ControlPanel>;
};

/*
 * Movimiento: la hoja llega desde el borde en que se ancla (derecha en
 * escritorio, abajo en móvil) y el velo oscurece el libro a la vez. Entra con
 * desaceleración; sale más rápido. Con movimiento reducido, solo opacidad.
 */
/** Curva de `globals.css` (`--llegada`, `--retirada`): WAAPI no acepta `var()`. */
function curva(nombre: "llegada" | "retirada"): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${nombre}`).trim() || "ease-out";
}

type Recorrido = { hoja: Keyframe[]; entrada: number; salida: number };

function recorrido(): Recorrido {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return { hoja: [{ opacity: 0 }, { opacity: 1 }], entrada: 150, salida: 120 };
  }
  if (window.matchMedia("(min-width: 768px)").matches) {
    return { hoja: [{ transform: "translateX(100%)" }, { transform: "none" }], entrada: 320, salida: 180 };
  }
  return { hoja: [{ transform: "translateY(100%)" }, { transform: "none" }], entrada: 380, salida: 200 };
}

const ANCHOS = { normal: "md:w-[400px]", amplio: "md:w-[480px]" } as const;

const VELO: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];

/** `::backdrop` con WAAPI no existe en todos los navegadores: sin él, el velo aparece sin fundido. */
function animarVelo(el: HTMLElement, opciones: KeyframeAnimationOptions): Animation | null {
  try {
    return el.animate(VELO, { ...opciones, pseudoElement: "::backdrop" });
  } catch {
    return null;
  }
}

/**
 * C22 · Panel lateral. `<dialog>` modal (foco atrapado, fondo inerte, capa
 * superior). Escritorio (md+): hoja de 400 px (480 en `amplio`) a la derecha, alto completo,
 * raya a la izquierda. Móvil: hoja inferior de ancho completo. Sin sombra.
 */
export function PanelLateral({ titulo, alSolicitarCierre, children, ancho = "normal", pie, rotuloCerrar = "Cerrar", ref }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const salida = useRef<Promise<void> | null>(null);
  const idTitulo = useId();

  useEffect(() => {
    const el = dialogo.current;
    if (!el) return;
    if (!el.open) el.showModal();

    const { hoja, entrada } = recorrido();
    const animaciones = [
      el.animate(hoja, { duration: entrada, easing: curva("llegada") }),
      animarVelo(el, { duration: entrada, easing: curva("llegada") }),
    ];
    return () => {
      for (const a of animaciones) a?.cancel();
      el.close();
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      cerrar() {
        if (salida.current) return salida.current;
        const el = dialogo.current;
        if (!el) return Promise.resolve();

        // Durante la salida no se puede volver a pulsar nada dentro.
        el.inert = true;
        const { hoja, salida: duracion } = recorrido();
        const opciones: KeyframeAnimationOptions = {
          duration: duracion,
          easing: curva("retirada"),
          direction: "reverse",
          fill: "forwards",
        };
        const animaciones = [el.animate(hoja, opciones), animarVelo(el, opciones)].filter((a) => a !== null);
        // `finished` rechaza si se cancela (desmontaje): igual se da por cerrado.
        salida.current = Promise.all(animaciones.map((a) => a.finished)).then(
          () => undefined,
          () => undefined,
        );
        return salida.current;
      },
    }),
    [],
  );

  function alCancelar(evento: SyntheticEvent<HTMLDialogElement>) {
    // Escape: el navegador cerraría el diálogo sin preguntar ni animar.
    evento.preventDefault();
    if (!salida.current) alSolicitarCierre();
  }

  function alPulsar(evento: MouseEvent<HTMLDialogElement>) {
    // El contenido ocupa todo el diálogo: un clic sobre el propio <dialog> es el velo.
    if (evento.target === evento.currentTarget && !salida.current) alSolicitarCierre();
  }

  return (
    <dialog
      ref={dialogo}
      aria-labelledby={idTitulo}
      onCancel={alCancelar}
      onClick={alPulsar}
      className={`fixed inset-x-0 top-auto bottom-0 m-0 max-h-[90dvh] w-full max-w-none overflow-hidden rounded-t-hoja border-0 border-t border-raya bg-superficie p-0 text-texto backdrop:bg-fondo/60 md:inset-y-0 md:right-0 md:left-auto md:h-dvh md:max-h-none md:rounded-none md:border-t-0 md:border-l ${ANCHOS[ancho]}`}
    >
      <div className="flex max-h-[90dvh] flex-col md:h-dvh md:max-h-none">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-raya px-4 md:px-6">
          <h2 id={idTitulo} className="text-rotulo uppercase text-secundario">
            {titulo}
          </h2>
          <button type="button" onClick={alSolicitarCierre} className="-mr-1 h-11 px-1 text-cuerpo text-secundario">
            {rotuloCerrar}
          </button>
        </div>
        <div
          className={`min-h-0 flex-1 overflow-y-auto px-4 pt-6 md:px-6 ${pie ? "pb-6" : "pb-[max(24px,env(safe-area-inset-bottom))]"}`}
        >
          {children}
        </div>
        {pie && (
          <div className="shrink-0 border-t border-linea px-4 pt-4 pb-[max(24px,env(safe-area-inset-bottom))] md:px-6">
            {pie}
          </div>
        )}
      </div>
    </dialog>
  );
}
