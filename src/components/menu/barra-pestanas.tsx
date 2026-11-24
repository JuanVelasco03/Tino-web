"use client";

import { Suspense, useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Ellipsis, LogOut, Moon, Sun } from "lucide-react";
import { alternarTema } from "../boton-tema";
import { useContextoCaptura } from "../captura/proveedor-captura";
import { IconoNavegacion } from "../iconos";
import { ENTRADAS_MAS, estaActiva, PESTANAS, TITULO_PROXIMAMENTE, type EntradaMenu } from "./entradas";

type Props = {
  /** Server action de cierre de sesión; llega por prop desde el layout. */
  salir: () => Promise<void>;
  /** «TRM de referencia» (N-01), leída en el servidor por el layout; nada si `GET /trm` falló. */
  trm?: ReactNode;
  /** Número de avisos sin leer (N-02), del layout; va junto a «Avisos» en la hoja. Nada con 0. */
  avisos?: ReactNode;
  /** Punto de avisos sin leer sobre la pestaña «Más», del layout. Nada con 0. */
  puntoAvisos?: ReactNode;
};

/**
 * Alto de la barra: 56 px de pestañas más el margen inferior del dispositivo
 * (mínimo 28 px, como en el diseño). Son 84 px sin zona segura.
 */
export const ALTO_PESTANAS = "calc(56px + max(env(safe-area-inset-bottom), 28px))";

const PESTANA = "relative flex flex-col items-center justify-center gap-1 text-[11px] leading-[14px]";

/** Fila de la hoja «Más»: 52 px, icono de 20 px y rótulo en cuerpo. */
const FILA_HOJA = "grid min-h-13 items-center gap-3 text-cuerpo";

function Pestana({ entrada, ruta, hojaAbierta }: { entrada: EntradaMenu; ruta: string; hojaAbierta: boolean }) {
  const { abrir } = useContextoCaptura();
  const esRegistrar = entrada.destino === "registrar";
  const icono = esRegistrar ? (
    <span className="flex size-10 items-center justify-center rounded-campo bg-texto text-fondo">
      <IconoNavegacion destino="registrar" />
    </span>
  ) : (
    <span className="flex size-6 items-center justify-center">
      <IconoNavegacion destino={entrada.destino} />
    </span>
  );

  if (esRegistrar) {
    // No navega: abre la captura a pantalla completa sobre la página actual.
    return (
      <button type="button" onClick={() => abrir()} className={`${PESTANA} font-normal text-secundario`}>
        {icono}
        <span>{entrada.rotulo}</span>
      </button>
    );
  }

  if (!entrada.habilitado || !entrada.href) {
    return (
      <span
        aria-disabled="true"
        title={TITULO_PROXIMAMENTE}
        className={`${PESTANA} cursor-not-allowed font-normal text-secundario`}
      >
        {icono}
        <span>{entrada.rotulo}</span>
      </span>
    );
  }

  const activa = estaActiva(entrada, ruta) && !hojaAbierta;
  return (
    <Link
      href={entrada.href}
      aria-current={estaActiva(entrada, ruta) ? "page" : undefined}
      className={`${PESTANA} ${activa ? "font-semibold text-texto" : "font-normal text-secundario"}`}
    >
      {icono}
      <span>{entrada.rotulo}</span>
    </Link>
  );
}

/**
 * Menú móvil (< md): cinco pestañas fijas abajo y hoja «Más» con el resto.
 * Como `MenuLateral`: solo la lectura de la ruta va en `<Suspense>`
 * (`usePathname` se suspende bajo `/cuentas/[id]` con `cacheComponents`).
 */
export function BarraPestanas(props: Props) {
  return (
    <Suspense fallback={<VistaBarraPestanas {...props} ruta="" />}>
      <BarraPestanasConRuta {...props} />
    </Suspense>
  );
}

function BarraPestanasConRuta(props: Props) {
  return <VistaBarraPestanas {...props} ruta={usePathname()} />;
}

function VistaBarraPestanas({ salir, trm, avisos, puntoAvisos, ruta }: Props & { ruta: string }) {
  const [abierta, setAbierta] = useState(false);
  const idHoja = useId();
  const botonMas = useRef<HTMLButtonElement>(null);
  const botonCerrar = useRef<HTMLButtonElement>(null);

  const masActiva = abierta || ENTRADAS_MAS.some((e) => estaActiva(e, ruta));

  function cerrar() {
    setAbierta(false);
    botonMas.current?.focus();
  }

  useEffect(() => {
    if (!abierta) return;
    botonCerrar.current?.focus();

    function alPulsar(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setAbierta(false);
        botonMas.current?.focus();
      }
    }
    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [abierta]);

  return (
    <div className="md:hidden">
      {abierta && (
        <>
          <div aria-hidden className="fixed inset-0 z-30 bg-fondo opacity-60" onClick={cerrar} />
          <div
            id={idHoja}
            role="dialog"
            aria-modal="true"
            aria-label="Más secciones"
            className="fixed inset-x-0 z-30 rounded-t-hoja border-t border-raya bg-superficie px-4 pt-1 pb-3"
            style={{ bottom: ALTO_PESTANAS }}
          >
            <div className="flex h-12 items-center justify-between">
              <span className="text-rotulo uppercase text-secundario">Más secciones</span>
              <button
                ref={botonCerrar}
                type="button"
                onClick={cerrar}
                className="-mr-1 h-11 px-1 text-cuerpo text-secundario"
              >
                Cerrar
              </button>
            </div>

            <ul>
              {ENTRADAS_MAS.map((entrada) => (
                <li key={entrada.destino} className="border-t border-linea">
                  {entrada.habilitado && entrada.href ? (
                    // El chevron promete navegación: solo lo llevan los destinos que existen.
                    <Link
                      href={entrada.href}
                      onClick={() => setAbierta(false)}
                      aria-current={estaActiva(entrada, ruta) ? "page" : undefined}
                      className={`${FILA_HOJA} grid-cols-[20px_minmax(0,1fr)_16px] text-texto aria-[current=page]:font-semibold`}
                    >
                      <span className="flex text-secundario">
                        <IconoNavegacion destino={entrada.destino} />
                      </span>
                      <span className="flex min-w-0 items-baseline justify-between gap-3">
                        <span className="truncate">{entrada.rotulo}</span>
                        {entrada.destino === "avisos" && avisos}
                      </span>
                      <span className="flex text-terciario">
                        <ChevronRight size={16} strokeWidth={1.5} aria-hidden />
                      </span>
                    </Link>
                  ) : (
                    <span
                      aria-disabled="true"
                      title={TITULO_PROXIMAMENTE}
                      className={`${FILA_HOJA} cursor-not-allowed grid-cols-[20px_minmax(0,1fr)] text-secundario`}
                    >
                      <span className="flex">
                        <IconoNavegacion destino={entrada.destino} />
                      </span>
                      <span className="truncate">{entrada.rotulo}</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>

            {trm}

            <div className="border-t border-linea">
              <button
                type="button"
                onClick={alternarTema}
                className={`${FILA_HOJA} w-full grid-cols-[20px_minmax(0,1fr)] text-left`}
              >
                <span className="flex text-secundario">
                  <Moon size={20} strokeWidth={1.5} aria-hidden className="block [[data-theme=dark]_&]:hidden" />
                  <Sun size={20} strokeWidth={1.5} aria-hidden className="hidden [[data-theme=dark]_&]:block" />
                </span>
                Cambiar tema
              </button>
              <form action={salir} className="border-t border-linea">
                <button type="submit" className={`${FILA_HOJA} w-full grid-cols-[20px_minmax(0,1fr)] text-left`}>
                  <span className="flex text-secundario">
                    <LogOut size={20} strokeWidth={1.5} aria-hidden />
                  </span>
                  Salir
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      <nav
        aria-label="Secciones"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-linea bg-fondo"
        style={{ height: ALTO_PESTANAS, paddingBottom: "max(env(safe-area-inset-bottom), 28px)" }}
      >
        {PESTANAS.map((entrada) => (
          <Pestana key={entrada.destino} entrada={entrada} ruta={ruta} hojaAbierta={abierta} />
        ))}
        <button
          ref={botonMas}
          type="button"
          aria-expanded={abierta}
          aria-controls={abierta ? idHoja : undefined}
          onClick={() => setAbierta((a) => !a)}
          className={`${PESTANA} ${masActiva ? "font-semibold text-texto" : "font-normal text-secundario"}`}
        >
          <span className="relative flex size-6 items-center justify-center">
            <Ellipsis size={20} strokeWidth={1.5} aria-hidden />
            {puntoAvisos}
          </span>
          <span>Más</span>
        </button>
      </nav>
    </div>
  );
}
