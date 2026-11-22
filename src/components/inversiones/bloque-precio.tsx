"use client";

import { useRef, useState, useSyncExternalStore, useTransition, type ChangeEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { desdeMenores, formatearEntrada } from "@/domain/dinero/entrada";
import { formatearFechaSinAnio } from "@/domain/fecha/formato";
import { cuerpoPrecio } from "@/domain/inversion/formulario";
import { enMoneda, equivalente, vistaPreviaPrecio } from "@/domain/inversion/presentacion";
import type { Cotizacion, InversionDetalle, Posicion, PrecioCuerpo } from "@/domain/inversion/tipos";
import { Boton } from "../boton";
import { MensajeError } from "../mensaje-error";
import { PanelLateral, type ControlPanel } from "../panel-lateral";
import { rutaInversion } from "./rutas";

type Resultado = { ok: true } | { ok: false; codigo: string; mensaje: string };

/** Server actions; llegan por prop desde la página. */
export type AccionesPrecio = {
  guardar: (id: string, activoId: string, cuerpo: PrecioCuerpo) => Promise<Resultado>;
  cambiarCotizacion: (id: string, activoId: string, cotizacion: Cotizacion) => Promise<Resultado>;
};

type Props = {
  detalle: Pick<InversionDetalle, "id" | "nombre" | "moneda" | "trm" | "fechaHoy">;
  posicion: Posicion;
  acciones: AccionesPrecio;
  /** Fuerza el formato (en `/estilos`). Sin él: en línea desde 1280 px, hoja inferior por debajo. */
  formato?: "linea" | "hoja";
  /** Tras cerrar. Por defecto quita `&precio=` de la URL (en `/estilos`, cierra la muestra). */
  alCerrar?: () => void;
};

const ANCHO = "(min-width: 1280px)";

function suscribir(avisar: () => void) {
  const consulta = window.matchMedia(ANCHO);
  consulta.addEventListener("change", avisar);
  return () => consulta.removeEventListener("change", avisar);
}

/** ¿Cabe la tabla de posiciones? Es el mismo corte (`xl`) que la tabla en línea. */
function useAncho(): boolean {
  return useSyncExternalStore(
    suscribir,
    () => window.matchMedia(ANCHO).matches,
    () => true,
  );
}

/**
 * Precio de una posición (N-26 a N-29, N-35, N-36, N-53), abierto por URL
 * (`&precio=<activoId>`). Manual: precio por unidad con vista previa del valor
 * (la calcula el cliente por contrato), «Guardar precio» y, en USD, «Intentar
 * precio automático». Automático: «Pasar a cotización manual». En escritorio
 * ancho va en línea bajo su fila; por debajo, en hoja inferior. Al guardar o
 * cambiar el modo, se cierra y la página se refresca.
 */
export function BloquePrecio({ detalle, posicion: p, acciones, formato, alCerrar }: Props) {
  const router = useRouter();
  const panel = useRef<ControlPanel>(null);
  const ancho = useAncho();
  const enLinea = (formato ?? (ancho ? "linea" : "hoja")) === "linea";
  const { moneda } = detalle;
  const manual = p.cotizacion === "manual";

  const [texto, setTexto] = useState(() => desdeMenores(p.precio, moneda));
  const [error, setError] = useState<string | null>(null);
  const [accion, setAccion] = useState<"guardar" | "automatica" | "manual" | null>(null);
  const [pendiente, iniciar] = useTransition();

  const cuerpo = cuerpoPrecio(texto, moneda);
  const vista = cuerpo ? vistaPreviaPrecio(p.cantidad, BigInt(cuerpo.precio), detalle.trm, moneda) : null;

  async function cerrar() {
    if (!enLinea) await panel.current?.cerrar();
    if (alCerrar) alCerrar();
    else router.replace(rutaInversion(detalle.id), { scroll: false });
  }

  function ejecutar(tipo: "guardar" | "automatica" | "manual", llamada: () => Promise<Resultado>) {
    if (pendiente) return;
    setError(null);
    setAccion(tipo);
    iniciar(async () => {
      const resultado = await llamada();
      if (resultado.ok) await cerrar();
      else setError(resultado.mensaje);
      setAccion(null);
    });
  }

  function guardar() {
    if (!cuerpo) return;
    ejecutar("guardar", () => acciones.guardar(detalle.id, p.activoId, cuerpo));
  }

  function cambiarModo(cotizacion: Cotizacion) {
    ejecutar(cotizacion, () => acciones.cambiarCotizacion(detalle.id, p.activoId, cotizacion));
  }

  function alEscribir(evento: ChangeEvent<HTMLInputElement>) {
    setTexto(formatearEntrada(evento.target.value, moneda));
    setError(null);
  }

  const explicacionManual = `El proveedor de precios no cubre este activo. El valor queda fijo hasta que lo actualices; toma el precio del extracto o de la app de ${detalle.nombre}.`;
  const explicacionAutomatica =
    "Tino trae este precio solo: el cierre de la última sesión en acciones y ETF, y el último precio del día en cripto.";

  const historial = (
    <dl className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3 text-etiqueta font-normal text-secundario">
        <dt>Precio actual · {formatearFechaSinAnio(p.precioFecha)}</dt>
        <dd className="font-mono text-cifra-xs tabular-nums">{enMoneda(p.precio, moneda)}</dd>
      </div>
      {p.precioAnterior && (
        <div className="flex items-baseline justify-between gap-3 text-etiqueta font-normal text-terciario">
          <dt>Antes · {formatearFechaSinAnio(p.precioAnterior.fecha)}</dt>
          <dd className="font-mono text-cifra-xs tabular-nums">{enMoneda(p.precioAnterior.precio, moneda)}</dd>
        </div>
      )}
    </dl>
  );

  const campo = (
    <div className="flex flex-col gap-2">
      <label htmlFor={`precio-${p.activoId}`} className="text-etiqueta font-normal text-secundario">
        {enLinea ? "Precio por unidad" : "Precio por unidad hoy"}
      </label>
      <div className="flex items-baseline gap-2 border-b border-raya pb-2 has-[:focus]:border-marca">
        {moneda === "USD" && <span className="text-etiqueta text-secundario">US$</span>}
        <input
          id={`precio-${p.activoId}`}
          value={texto}
          onChange={alEscribir}
          inputMode={moneda === "USD" ? "decimal" : "numeric"}
          autoComplete="off"
          placeholder="0"
          disabled={pendiente}
          aria-invalid={error ? true : undefined}
          className="min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-cifra-l tabular-nums text-texto caret-marca outline-none! placeholder:text-terciario"
        />
        {moneda === "COP" && <span className="text-etiqueta text-secundario">COP</span>}
      </div>
      <p className="min-h-5 text-etiqueta font-normal text-secundario">
        {vista && (
          <>
            Valor de la posición: <span className="font-mono tabular-nums">{enMoneda(vista.valor, moneda)}</span>
            {moneda === "USD" && vista.valorCop !== null && (
              <span className="font-mono tabular-nums"> {equivalente(vista.valorCop)}</span>
            )}
          </>
        )}
      </p>
    </div>
  );

  const intentarAutomatico = moneda === "USD" && (
    <Boton variante="texto" onClick={() => cambiarModo("automatica")} disabled={pendiente} className="self-start">
      {accion === "automatica" ? "Consultando…" : "Intentar precio automático"}
    </Boton>
  );

  const errorBloque = error && <MensajeError mensaje={error} />;

  /* ── En línea (escritorio ancho) ─────────────────────────────────── */
  if (enLinea) {
    return (
      <div role="region" aria-label={`Precio de ${p.simbolo}`} className="border-b border-raya bg-superficie px-4 py-6">
        {manual ? (
          <div className="grid grid-cols-[minmax(0,1fr)_260px_260px] gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-cuerpo font-semibold">Cotización manual de {p.simbolo}</p>
                <p className="text-etiqueta font-normal text-secundario">{explicacionManual}</p>
              </div>
              {historial}
            </div>
            {campo}
            <div className="flex flex-col gap-3">
              <p className="text-etiqueta font-normal text-secundario">Fecha de la cotización: hoy, {formatearFechaSinAnio(detalle.fechaHoy)}</p>
              <div className="flex flex-wrap gap-3">
                <Boton onClick={guardar} disabled={!cuerpo || pendiente}>
                  {accion === "guardar" ? "Guardando…" : "Guardar precio"}
                </Boton>
                <Boton variante="secundario" onClick={() => void cerrar()} disabled={pendiente}>
                  Cancelar
                </Boton>
              </div>
              {intentarAutomatico}
              {errorBloque}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)_260px] gap-8">
            <div className="flex flex-col gap-1">
              <p className="text-cuerpo font-semibold">Precio automático de {p.simbolo}</p>
              <p className="text-etiqueta font-normal text-secundario">{explicacionAutomatica}</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-3">
                <Boton variante="secundario" onClick={() => cambiarModo("manual")} disabled={pendiente}>
                  {accion === "manual" ? "Cambiando…" : "Pasar a cotización manual"}
                </Boton>
                <Boton variante="texto" onClick={() => void cerrar()} disabled={pendiente}>
                  Cerrar
                </Boton>
              </div>
              {errorBloque}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Hoja inferior (móvil y escritorio angosto) ───────────────────── */
  let contenido: ReactNode;
  if (manual) {
    contenido = (
      <div className="flex flex-col gap-6">
        <p className="text-etiqueta font-normal text-secundario">{explicacionManual}</p>
        {historial}
        {campo}
        <div className="flex flex-col gap-2">
          <Boton onClick={guardar} disabled={!cuerpo || pendiente} className="w-full justify-center">
            {accion === "guardar" ? "Guardando…" : "Guardar precio"}
          </Boton>
          {intentarAutomatico}
          {errorBloque}
        </div>
      </div>
    );
  } else {
    contenido = (
      <div className="flex flex-col gap-6">
        <p className="text-etiqueta font-normal text-secundario">{explicacionAutomatica}</p>
        <div className="flex flex-col gap-2">
          <Boton variante="secundario" onClick={() => cambiarModo("manual")} disabled={pendiente} className="w-full justify-center">
            {accion === "manual" ? "Cambiando…" : "Pasar a cotización manual"}
          </Boton>
          {errorBloque}
        </div>
      </div>
    );
  }

  // La tabla en línea está oculta en este ancho: la hoja va al `body` para que su `<dialog>` se pinte.
  return createPortal(
    <PanelLateral
      ref={panel}
      titulo={manual ? `Precio manual · ${p.simbolo}` : `Precio automático · ${p.simbolo}`}
      rotuloCerrar={manual ? "Cancelar" : "Cerrar"}
      alSolicitarCierre={() => {
        if (!pendiente) void cerrar();
      }}
    >
      {contenido}
    </PanelLateral>,
    document.body,
  );
}
