"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { pendientesDelRango, sumaSeleccion, type FilaHistorial } from "@/domain/cuenta/detalle";
import type { Naturaleza, TipoCuenta } from "@/domain/cuenta/naturaleza";
import { BOTON_ENLACE } from "../deudas/rutas";
import { Boton } from "../boton";
import { EnlaceTexto } from "../enlace-texto";
import { MensajeError } from "../mensaje-error";
import { BarraSeleccion } from "./barra-seleccion";
import { CabeceraCuenta } from "./cabecera-cuenta";
import { CifrasCuenta } from "./cifras-cuenta";
import { RangoHistorial } from "./rango-historial";
import { TablaHistorial } from "./tabla-historial";
import { llamarAccion } from "@/lib/sin-conexion";

export type ResultadoConciliacion = { ok: true } | { ok: false; codigo: string; mensaje: string };

type Props = {
  cuenta: { id: string; nombre: string; tipo: TipoCuenta; naturaleza: Naturaleza; detalle: string | null; archivadaEn: string | null };
  historial: {
    fechaHoy: string;
    desde: string;
    hasta: string | null;
    saldo: bigint;
    conciliacion: { saldo: bigint | null; al: string | null; pendientes: number };
    entradas: bigint;
    salidas: bigint;
    saldoInicioRango: bigint;
    filas: FilaHistorial[];
  };
  /** Lo que pidió la URL, tal cual. */
  pedido: { desde?: string; hasta?: string };
  /** `?ajuste=1` y `?editar=1` conservando el rango. */
  rutas: { ajuste: string; editar: string };
  /** Server action (`PUT /cuentas/:id/conciliacion`, en lotes de 500). */
  conciliar: (id: string, movimientoIds: string[], conciliado: boolean) => Promise<ResultadoConciliacion>;
};

type Cambio = { ids: readonly string[]; conciliado: boolean };

/**
 * Detalle de una cuenta de efectivo o banco (SPEC 13): cabecera, cifras,
 * rango, selección y el historial. Conciliar es optimista solo en el ícono de
 * la fila (`useOptimistic`); saldo conciliado y pendientes salen de la API al
 * revalidar. Si falla, el ícono vuelve y el mensaje va sobre la tabla. La
 * selección es del rango visible: la página la monta con `key` por rango.
 */
export function HistorialCuenta({ cuenta, historial, pedido, rutas, conciliar }: Props) {
  const router = useRouter();
  const archivada = cuenta.archivadaEn !== null;
  const [seleccion, setSeleccion] = useState<ReadonlySet<string>>(new Set());
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  const [filas, aplicarOptimista] = useOptimistic(historial.filas, (actuales: FilaHistorial[], cambio: Cambio) =>
    actuales.map((f) => (cambio.ids.includes(f.movimientoId) ? { ...f, conciliado: cambio.conciliado } : f)),
  );

  const pendientes = pendientesDelRango(filas);

  function elegir(id: string, elegida: boolean) {
    setSeleccion((actual) => {
      const nueva = new Set(actual);
      if (elegida) nueva.add(id);
      else nueva.delete(id);
      return nueva;
    });
  }

  function limpiar() {
    setSeleccion(new Set());
    setModoSeleccion(false);
  }

  function enviar(ids: string[], conciliado: boolean, alFallar?: () => void) {
    setError(null);
    iniciar(async () => {
      aplicarOptimista({ ids, conciliado });
      const resultado = await llamarAccion(() => conciliar(cuenta.id, ids, conciliado));
      if (!resultado.ok) {
        setError(resultado.mensaje);
        alFallar?.();
        if (resultado.codigo === "CUENTA_ARCHIVADA") router.refresh();
      }
    });
  }

  function conciliarUno(fila: FilaHistorial) {
    enviar([fila.movimientoId], !fila.conciliado);
  }

  function conciliarLote() {
    const anterior = seleccion;
    const ids = filas.filter((f) => anterior.has(f.movimientoId)).map((f) => f.movimientoId);
    if (ids.length === 0) return;
    const modoAnterior = modoSeleccion;
    limpiar();
    enviar(ids, true, () => {
      setSeleccion(anterior);
      setModoSeleccion(modoAnterior);
    });
  }

  const hayFilas = filas.length > 0;
  const extraMovil =
    !archivada && hayFilas ? (
      <Boton compacto variante="texto" onClick={() => (modoSeleccion ? limpiar() : setModoSeleccion(true))}>
        {modoSeleccion ? "Listo" : "Seleccionar"}
      </Boton>
    ) : null;

  const suma = sumaSeleccion(filas, seleccion);

  return (
    <div className={`asentar flex flex-col gap-6 md:gap-8 ${seleccion.size > 0 ? "max-md:pb-16" : ""}`}>
      <CabeceraCuenta
        cuenta={cuenta}
        accion={
          archivada ? undefined : (
            <Link href={rutas.ajuste} scroll={false} className={BOTON_ENLACE.secundario}>
              Ajustar saldo
            </Link>
          )
        }
        hrefEditar={archivada ? undefined : rutas.editar}
        extraMovil={extraMovil}
      />

      <CifrasCuenta
        historial={historial}
        ajustarMovil={
          archivada ? undefined : (
            <Link
              href={rutas.ajuste}
              scroll={false}
              className="presion inline-flex h-11 items-center justify-center rounded-campo border border-linea bg-superficie px-4 text-cuerpo font-medium hover:border-secundario"
            >
              Ajustar
            </Link>
          )
        }
      />

      <div className="group/rango flex flex-col gap-4">
        <RangoHistorial
          cuentaId={cuenta.id}
          pedido={pedido}
          historial={historial}
          extra={
            !archivada && pendientes.length > 0 ? (
              <Boton compacto variante="texto" onClick={() => setSeleccion(new Set(pendientes))}>
                Seleccionar pendientes
              </Boton>
            ) : null
          }
        />

        {seleccion.size > 0 && (
          <div className="hidden md:block">
            <BarraSeleccion cantidad={seleccion.size} suma={suma} alMarcar={conciliarLote} alCancelar={limpiar} pendiente={pendiente} />
          </div>
        )}

        {error && <MensajeError mensaje={error} />}

        <TablaHistorial
          filas={filas}
          fechaHoy={historial.fechaHoy}
          desde={historial.desde}
          saldoInicioRango={historial.saldoInicioRango}
          seleccion={seleccion}
          modoSeleccion={modoSeleccion}
          alElegir={archivada ? undefined : elegir}
          alConciliar={archivada ? undefined : conciliarUno}
        />
      </div>

      {!archivada && (
        <EnlaceTexto href={rutas.editar} scroll={false} className="self-start md:hidden">
          Editar cuenta
        </EnlaceTexto>
      )}

      {seleccion.size > 0 && (
        <BarraSeleccion
          formato="movil"
          cantidad={seleccion.size}
          suma={suma}
          alMarcar={conciliarLote}
          alCancelar={limpiar}
          pendiente={pendiente}
        />
      )}
    </div>
  );
}
