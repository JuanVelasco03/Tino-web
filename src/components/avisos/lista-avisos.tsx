"use client";

import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { agrupar, alternar, contarNoLeidos, marcarTodos, textoNoLeidos, type Aviso } from "@/domain/aviso/presentacion";
import { Boton } from "../boton";
import { EstadoVacio } from "../estado-vacio";
import { MensajeError } from "../mensaje-error";
import { FilaAviso } from "./fila-aviso";

type Fallo = { ok: false; codigo: string; mensaje: string };
type Resultado = { ok: true } | Fallo;

/** Server actions; llegan por prop desde la página (los componentes no importan `app/`). */
export type AccionesAvisos = {
  marcar: (clave: string, leido: boolean) => Promise<Resultado>;
  leerTodos: () => Promise<Resultado>;
  confirmar: (recurrenteId: string, vencimiento: string, monto?: string) => Promise<Resultado>;
};

/** Ruta de la antelación por debajo de xl. */
export const RUTA_ANTELACION = "/avisos?antelacion=1";

/** El estado cambió en otro lado (otra pestaña, otro dispositivo): la lista está vieja. */
const REFRESCAN = new Set(["AVISO_NO_ENCONTRADO", "OCURRENCIA_CERRADA", "OCURRENCIA_INVALIDA"]);

type Props = {
  avisos: Aviso[];
  /** El de la API, mientras no haya un cambio optimista en curso. */
  noLeidos: number;
  /** `"YYYY-MM-DD"` de la API. */
  fechaHoy: string;
  /** IANA, la del perfil. */
  zona: string;
  /** La antelación por tipo: al lado de la lista desde xl (1280 px). */
  antelacion: ReactNode;
  /** Sin ellas, la lista solo presenta (muestras de /estilos). */
  acciones?: AccionesAvisos;
  className?: string;
};

type Optimista = { tipo: "alternar"; clave: string } | { tipo: "todos" };

/**
 * `/avisos`: cabecera a todo el ancho y, debajo, la lista agrupada (Hoy, Ayer,
 * Esta semana, Antes) y la antelación lado a lado desde xl; por debajo, solo
 * la lista con «Configurar». Alternar leído y «Marcar todo» cambian la
 * pantalla al instante (`useOptimistic`) y vuelven atrás si la API falla.
 */
export function ListaAvisos({ avisos, noLeidos, fechaHoy, zona, antelacion, acciones, className = "" }: Props) {
  const router = useRouter();
  const [optimistas, aplicar] = useOptimistic(avisos, (estado: Aviso[], cambio: Optimista) =>
    cambio.tipo === "todos" ? marcarTodos(estado) : alternar(estado, cambio.clave),
  );
  const [marcando, iniciarMarca] = useTransition();
  const [, iniciarConfirmacion] = useTransition();
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorTodos, setErrorTodos] = useState<string | null>(null);
  const [ajustando, setAjustando] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);

  const sinLeer = marcando ? contarNoLeidos(optimistas) : noLeidos;
  const grupos = agrupar(optimistas, fechaHoy, zona);

  function ponerError(clave: string, mensaje: string | null) {
    setErrores((actual) => {
      if (mensaje === null && !(clave in actual)) return actual;
      const siguiente = { ...actual };
      if (mensaje === null) delete siguiente[clave];
      else siguiente[clave] = mensaje;
      return siguiente;
    });
  }

  function falla(clave: string, fallo: Fallo) {
    ponerError(clave, fallo.mensaje);
    if (REFRESCAN.has(fallo.codigo)) router.refresh();
  }

  /** Envía el valor final de la fila, no «alternar»: dos toques cruzados terminan en el estado de la API. */
  function alternarLeido(aviso: Aviso) {
    if (!acciones) return;
    const leido = !aviso.leido;
    ponerError(aviso.clave, null);
    iniciarMarca(async () => {
      aplicar({ tipo: "alternar", clave: aviso.clave });
      const resultado = await acciones.marcar(aviso.clave, leido);
      if (!resultado.ok) falla(aviso.clave, resultado);
    });
  }

  function marcarTodo() {
    if (!acciones || sinLeer === 0) return;
    setErrorTodos(null);
    iniciarMarca(async () => {
      aplicar({ tipo: "todos" });
      const resultado = await acciones.leerTodos();
      if (!resultado.ok) setErrorTodos(resultado.mensaje);
    });
  }

  function confirmar(aviso: Aviso, monto?: string) {
    if (!acciones || aviso.tipo !== "recurrente" || confirmando) return;
    ponerError(aviso.clave, null);
    setConfirmando(aviso.clave);
    iniciarConfirmacion(async () => {
      const resultado = await acciones.confirmar(aviso.recurrente.id, aviso.vencimiento, monto);
      setConfirmando(null);
      if (!resultado.ok) {
        falla(aviso.clave, resultado);
        return;
      }
      setAjustando(null);
    });
  }

  const sinAvisos = avisos.length === 0;
  const deshabilitado = sinLeer === 0 || !acciones;

  return (
    <div className={`flex-col gap-8 ${className || "flex"}`}>
      <header className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-titulo-1">Avisos</h1>
            <p className="hidden text-etiqueta text-secundario md:block">{textoNoLeidos(sinLeer)}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={RUTA_ANTELACION}
              aria-label="Configurar"
              title="Configurar"
              className="inline-flex size-11 items-center justify-center rounded-campo text-secundario hover:text-texto xl:hidden"
            >
              <SlidersHorizontal size={20} strokeWidth={1.5} aria-hidden />
            </Link>
            <span className="hidden md:block">
              <Boton variante="secundario" onClick={marcarTodo} disabled={deshabilitado}>
                Marcar todo como leído
              </Boton>
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 md:hidden">
          <p className="text-etiqueta text-secundario">{textoNoLeidos(sinLeer)}</p>
          <button
            type="button"
            onClick={marcarTodo}
            disabled={deshabilitado}
            className="-mr-1 h-11 px-1 text-etiqueta font-semibold text-marca-texto disabled:cursor-not-allowed disabled:text-terciario"
          >
            Marcar todo leído
          </button>
        </div>
        {errorTodos && <MensajeError mensaje={errorTodos} />}
      </header>

      <div className="flex flex-col gap-8 xl:grid xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start xl:gap-14">
        <div className="min-w-0">
          {sinAvisos ? (
            <EstadoVacio
              rotulo="Avisos"
              titulo="Sin avisos."
              detalle="Aquí llegan los recurrentes por vencer, los cobros y lo que debes, según la antelación de cada tipo."
            />
          ) : (
            <div className="flex flex-col gap-8">
              {grupos.map(({ grupo, avisos: lista }) => (
                <section key={grupo} aria-labelledby={`grupo-${grupo}`}>
                  <h2 id={`grupo-${grupo}`} className="border-b border-raya pb-2 text-rotulo uppercase">
                    {grupo}
                  </h2>
                  <ul>
                    {lista.map((aviso) => (
                      <FilaAviso
                        key={aviso.clave}
                        aviso={aviso}
                        fechaHoy={fechaHoy}
                        zona={zona}
                        error={errores[aviso.clave] ?? null}
                        ajustando={ajustando === aviso.clave}
                        confirmando={confirmando === aviso.clave}
                        ocupado={confirmando !== null}
                        alAlternar={acciones ? () => alternarLeido(aviso) : undefined}
                        alConfirmar={acciones ? (monto) => confirmar(aviso, monto) : undefined}
                        alAbrirAjuste={() => {
                          ponerError(aviso.clave, null);
                          setAjustando(aviso.clave);
                        }}
                        alCerrarAjuste={() => setAjustando(null)}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
        <div className="hidden xl:block">{antelacion}</div>
      </div>
    </div>
  );
}
