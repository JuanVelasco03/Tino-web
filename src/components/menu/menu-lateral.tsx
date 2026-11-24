"use client";

import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Moon, Plus, Sun } from "lucide-react";
import { alternarTema } from "../boton-tema";
import { useContextoCaptura } from "../captura/proveedor-captura";
import { IconoNavegacion } from "../iconos";
import { ENTRADAS, estaActiva, REGISTRAR, TITULO_PROXIMAMENTE } from "./entradas";

type Props = {
  /** Server action de cierre de sesión; llega por prop desde el layout. */
  salir: () => Promise<void>;
  /** «TRM de referencia» (N-01), leída en el servidor por el layout; nada si `GET /trm` falló. */
  trm?: ReactNode;
  /** Número de avisos sin leer (N-02), del layout; va a la derecha de «Avisos». Nada con 0. */
  avisos?: ReactNode;
};

const FILA = "flex h-10 items-center gap-3 rounded-campo px-2 text-cuerpo";

/**
 * Menú de escritorio (md+): barra lateral de 232 px. Con `cacheComponents`,
 * `usePathname` se suspende bajo una ruta con parámetro dinámico
 * (`/cuentas/[id]`): solo la lectura de la ruta va en `<Suspense>`; mientras
 * tanto, el mismo menú sin entrada activa.
 */
export function MenuLateral(props: Props) {
  return (
    <Suspense fallback={<VistaMenuLateral {...props} ruta="" />}>
      <MenuLateralConRuta {...props} />
    </Suspense>
  );
}

function MenuLateralConRuta(props: Props) {
  return <VistaMenuLateral {...props} ruta={usePathname()} />;
}

function VistaMenuLateral({ salir, trm, avisos, ruta }: Props & { ruta: string }) {
  const { abrir } = useContextoCaptura();

  return (
    <aside className="sticky top-0 flex h-dvh flex-col gap-8 overflow-y-auto border-r border-linea px-4 py-8">
      <div className="px-2 text-titulo-2 font-bold tracking-[0.16em]">TINO</div>

      <button
        type="button"
        onClick={() => abrir()}
        aria-keyshortcuts="N"
        className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-campo bg-texto text-cuerpo font-semibold text-fondo"
      >
        <Plus size={18} strokeWidth={1.5} aria-hidden />
        {REGISTRAR.rotulo}
        <kbd className="rounded-muestra border border-secundario px-1 font-mono text-cifra-xs text-terciario">N</kbd>
      </button>

      <nav aria-label="Secciones" className="flex flex-col gap-1">
        {ENTRADAS.map((entrada) => {
          const contenido = (
            <>
              <span className="flex">
                <IconoNavegacion destino={entrada.destino} />
              </span>
              <span className="flex-1 truncate">{entrada.rotulo}</span>
              {entrada.destino === "avisos" && avisos}
            </>
          );

          if (!entrada.habilitado || !entrada.href) {
            return (
              <span
                key={entrada.destino}
                aria-disabled="true"
                title={TITULO_PROXIMAMENTE}
                className={`${FILA} cursor-not-allowed text-secundario`}
              >
                {contenido}
              </span>
            );
          }

          const activa = estaActiva(entrada, ruta);
          return (
            <Link
              key={entrada.destino}
              href={entrada.href}
              aria-current={activa ? "page" : undefined}
              className={`${FILA} ${activa ? "bg-hundido font-semibold text-texto" : "text-secundario hover:text-texto"}`}
            >
              {contenido}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        {trm}
        <button
          type="button"
          onClick={alternarTema}
          className={`${FILA} text-left text-secundario hover:text-texto`}
        >
          <Moon size={20} strokeWidth={1.5} aria-hidden className="block [[data-theme=dark]_&]:hidden" />
          <Sun size={20} strokeWidth={1.5} aria-hidden className="hidden [[data-theme=dark]_&]:block" />
          Cambiar tema
        </button>
        <form action={salir}>
          <button type="submit" className={`${FILA} w-full text-left text-secundario hover:text-texto`}>
            <LogOut size={20} strokeWidth={1.5} aria-hidden />
            Salir
          </button>
        </form>
      </div>
    </aside>
  );
}
