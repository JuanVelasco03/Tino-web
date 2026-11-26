"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode, type SyntheticEvent } from "react";
import { Check, Lock, X } from "lucide-react";
import { formatearEntrada } from "@/domain/dinero/entrada";
import { formatearDinero, type Moneda } from "@/domain/dinero/formato";
import { formatearDiaSemana, formatearFechaSinAnio } from "@/domain/fecha/formato";
import type { Cuenta } from "@/services/captura";
import { BloqueEliminar, PedirEliminar } from "../bloque-eliminar";
import { Boton } from "../boton";
import { Calendario } from "../calendario";
import { ChipCategoria } from "../chip-categoria";
import { IconoCuenta, ROTULO_TIPO_CUENTA } from "../iconos";
import { MensajeError } from "../mensaje-error";
import { AvisoRegistro } from "./aviso-registro";
import { EditorPartes } from "./editor-partes";
import {
  AvisoSoloLectura,
  conceptoDe,
  ConfirmarDescarte,
  cuentasOfrecidas,
  detalleEliminar,
  ErrorCarga,
  etiquetaEnviar,
  SinCuentas,
  textoTasa,
  usarSiempre,
  type EstadoFormulario,
} from "./panel-captura";
import { opcionesFecha } from "./selector-fecha";
import { SelectorTipo } from "./selector-tipo";
import { TecladoNumerico } from "./teclado-numerico";
import { datosAviso, datosOferta } from "./usar-captura";
import { MAX_DESCRIPCION, MAX_NOTA, type RolCuenta } from "./usar-formulario";

type Hoja = "categoria" | "cuenta" | "destino" | "fecha" | "nota";

/** Pesos sin «COP». */
function pesos(monto: bigint): string {
  return formatearDinero({ monto, moneda: "COP" }, { omitirCOP: true });
}

/** En su moneda: pesos sin «COP», dólares con «US$». */
function enMoneda(monto: bigint, moneda: Moneda): string {
  return formatearDinero({ monto, moneda }, { omitirCOP: true });
}

/** Curva de `globals.css`: WAAPI no acepta `var()`. */
function curva(nombre: "llegada" | "retirada"): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${nombre}`).trim() || "ease-out";
}

/** Sube desde abajo (380 ms) y baja más rápido (200 ms). Con movimiento reducido, solo se funde. */
function recorrido(): { cuadros: Keyframe[]; entrada: number; salida: number } {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return { cuadros: [{ opacity: 0 }, { opacity: 1 }], entrada: 150, salida: 120 };
  }
  return { cuadros: [{ transform: "translateY(100%)" }, { transform: "none" }], entrada: 380, salida: 200 };
}

/** Hoja inferior dentro de la captura (categoría, cuenta, fecha), con velo y «Listo». */
function HojaInferior({
  titulo,
  alCerrar,
  enfocarListo = true,
  children,
}: {
  titulo: string;
  alCerrar: () => void;
  /** `false` cuando el contenido toma el foco (la nota abre con el cursor en el texto). */
  enfocarListo?: boolean;
  children: ReactNode;
}) {
  const listo = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (enfocarListo) listo.current?.focus();
  }, [enfocarListo]);

  return (
    <>
      <div aria-hidden className="absolute inset-0 z-10 bg-fondo opacity-60" onClick={alCerrar} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="absolute inset-x-0 bottom-0 z-10 flex max-h-[80dvh] flex-col rounded-t-hoja border-t border-raya bg-superficie px-4 pb-[max(24px,env(safe-area-inset-bottom))]"
      >
        <div className="flex h-14 shrink-0 items-center justify-between">
          <span className="text-cuerpo font-semibold">{titulo}</span>
          <button ref={listo} type="button" onClick={alCerrar} className="h-11 px-1 text-cuerpo font-semibold text-marca-texto">
            Listo
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </>
  );
}

/** Fila de lista en una hoja inferior: icono, nombre y detalle, cifra a la derecha y marca en la elegida. */
function FilaHoja({
  icono,
  nombre,
  detalle,
  previo,
  cifra,
  elegida,
  alPulsar,
}: {
  icono?: ReactNode;
  nombre: string;
  detalle?: string;
  previo?: string;
  cifra?: string;
  elegida: boolean;
  alPulsar: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={elegida}
      onClick={alPulsar}
      className="grid min-h-14 w-full grid-cols-[20px_minmax(0,1fr)_auto_20px] items-center gap-3 border-b border-linea px-1 text-left"
    >
      <span className="flex text-secundario">{icono}</span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-cuerpo font-medium">{nombre}</span>
        {detalle && <span className="truncate text-etiqueta text-secundario">{detalle}</span>}
      </span>
      <span className="flex flex-col items-end">
        {previo && <span className="text-rotulo uppercase text-secundario">{previo}</span>}
        {cifra && <span className="font-mono text-cifra-s tabular-nums">{cifra}</span>}
      </span>
      <span className="flex">{elegida && <Check size={18} strokeWidth={1.5} aria-hidden />}</span>
    </button>
  );
}

/** Celda de la fila Categoría │ Cuenta │ Fecha: rótulo arriba y valor; abre su hoja. */
function Celda({
  rotulo,
  valor,
  vacio = false,
  etiqueta,
  primera = false,
  fija = false,
  alPulsar,
}: {
  rotulo: string;
  valor: string;
  vacio?: boolean;
  etiqueta?: string;
  primera?: boolean;
  /** La cuenta de un préstamo en su edición: se ve, no se cambia. */
  fija?: boolean;
  alPulsar: () => void;
}) {
  return (
    <button
      type="button"
      onClick={alPulsar}
      disabled={fija}
      title={fija ? "La cuenta del préstamo no se cambia aquí" : undefined}
      className={`flex h-14 min-w-0 flex-col items-start justify-center pl-4 text-left disabled:cursor-not-allowed ${primera ? "" : "border-l border-linea"}`}
    >
      <span className="text-rotulo uppercase text-secundario">{rotulo}</span>
      <span className="flex max-w-full items-center gap-2 text-cuerpo font-medium">
        <span className={`truncate ${vacio ? "punteada text-secundario" : ""}`}>{valor}</span>
        {/* Fija: candado de 16 px en secundario, porque la celda no abre su hoja. */}
        {fija && <Lock size={16} strokeWidth={1.5} aria-hidden className="shrink-0 text-secundario" />}
        {etiqueta && <span className="font-mono text-rotulo font-normal text-marca-texto">{etiqueta}</span>}
      </span>
    </button>
  );
}

function rotuloFechaCorto(fecha: string, fechaHoy: string | null): string {
  if (!fechaHoy || fecha === "") return "Hoy";
  return opcionesFecha(fechaHoy).find((o) => o.fecha === fecha)?.rotulo ?? formatearFechaSinAnio(fecha);
}

/**
 * Formulario de movimiento en móvil (< 768 px): `<dialog>` a pantalla
 * completa, sobre la barra de pestañas, con teclado numérico propio. Misma
 * lógica que el panel de escritorio, en registro (captura) o en edición.
 */
export function HojaCaptura({ c }: { c: EstadoFormulario }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const saliendo = useRef<Promise<void> | null>(null);
  const [hoja, setHoja] = useState<Hoja | null>(null);
  const { valores } = c;
  const esTransferencia = valores.tipo === "transferencia";
  const registro = c.modo === "registro" ? c : null;
  const edicion = c.modo === "edicion" ? c : null;
  const soloLectura = edicion?.soloLectura ?? null;
  const cuentaFija = edicion?.cuentaFija ?? null;

  useEffect(() => {
    const el = dialogo.current;
    if (!el) return;
    if (!el.open) el.showModal();
    // Como `PanelLateral`: el foco va a la hoja, no a la ✕ con anillo. El monto
    // se escribe con el teclado propio, así que no hay campo al que llevarlo.
    el.focus({ preventScroll: true });
    const { cuadros, entrada } = recorrido();
    const animacion = el.animate(cuadros, { duration: entrada, easing: curva("llegada") });
    return () => {
      animacion.cancel();
      el.close();
    };
  }, []);

  /** Retira la hoja y avisa (la captura se oculta; la edición quita `?movimiento=`). */
  async function cerrarYa() {
    const el = dialogo.current;
    if (!el) return c.cerrar();
    if (!saliendo.current) {
      el.inert = true;
      const { cuadros, salida } = recorrido();
      const animacion = el.animate(cuadros, { duration: salida, easing: curva("retirada"), direction: "reverse", fill: "forwards" });
      saliendo.current = animacion.finished.then(
        () => undefined,
        () => undefined,
      );
    }
    await saliendo.current;
    c.cerrar();
  }

  function solicitarCierre() {
    if (c.solicitarCierre()) void cerrarYa();
  }

  function alCancelar(evento: SyntheticEvent<HTMLDialogElement>) {
    // Escape cierra primero la hoja inferior; después, el formulario.
    evento.preventDefault();
    if (hoja) setHoja(null);
    else solicitarCierre();
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (await c.enviar()) await cerrarYa();
  }

  const fechaHoy = c.captura?.fechaHoy ?? null;
  const gastosHoy = registro?.captura?.gastosHoy ?? 0n;
  const errorCarga = c.estadoCarga === "error" && c.captura === null;
  const listo = c.captura !== null;

  // Monto: «0» tenue vacío. Baja de tamaño para caber en 390 px sin cortar dígitos:
  // cifra-xl hasta 9 caracteres, cifra-campo hasta 11, cifra-l hasta 15 y cifra-m después (19 dígitos).
  const montoTexto = valores.monto === "" ? "0" : valores.monto;
  const largo = montoTexto.length;
  const tamano = largo > 15 ? "text-cifra-m" : largo > 11 ? "text-cifra-l" : largo > 9 ? "text-cifra-campo" : "text-cifra-xl";
  const signo = valores.monto === "" ? "" : valores.tipo === "gasto" ? "−" : valores.tipo === "ingreso" ? "+" : "";

  const propuestaActiva = valores.categoria.modo === "propuesta" ? c.propuesta : null;
  const categoriaElegida =
    valores.categoria.modo === "elegida"
      ? (c.categorias.find((cat) => valores.categoria.modo === "elegida" && cat.id === valores.categoria.id) ?? null)
      : (propuestaActiva?.categoria ?? null);
  const dividido = valores.partes !== null;

  // Sin texto: los frecuentes del tipo (solo en la captura). Al escribir: las sugerencias.
  const conTexto = valores.descripcion.trim() !== "";
  const chips = conTexto ? c.conceptos.map((co) => co.descripcion) : (registro?.captura?.conceptosFrecuentes[valores.tipo] ?? []);

  const erroresPie = [
    c.errores.tipo,
    c.errores.montoDestino,
    c.errores.categoria,
    c.errores.partes,
    c.errores.cuenta,
    c.errores.destino,
    c.errores.fecha,
    c.errorGeneral,
    registro?.errorPredeterminada,
  ].filter((e): e is string => Boolean(e));

  const usar = usarSiempre(c);

  function listaCuentas(rol: RolCuenta) {
    const elegida = rol === "cuenta" ? valores.cuentaId : valores.destinoId;
    const idPredeterminada = c.predeterminada?.id ?? null;
    return cuentasOfrecidas(c).map((cuenta: Cuenta) => {
      const tipo = cuenta.naturaleza === "pasivo" ? `${ROTULO_TIPO_CUENTA[cuenta.tipo]} · pasivo` : ROTULO_TIPO_CUENTA[cuenta.tipo];
      return (
        <FilaHoja
          key={cuenta.id}
          icono={<IconoCuenta tipo={cuenta.tipo} />}
          nombre={cuenta.nombre}
          detalle={cuenta.id === idPredeterminada ? `${tipo} · Predeterminada` : tipo}
          previo={cuenta.naturaleza === "pasivo" ? "Debes" : undefined}
          cifra={pesos(cuenta.saldo)}
          elegida={cuenta.id === elegida}
          alPulsar={() => {
            c.cambiar(rol === "cuenta" ? "cuentaId" : "destinoId", cuenta.id);
            setHoja(null);
          }}
        />
      );
    });
  }

  function pie() {
    if (soloLectura) return <AvisoSoloLectura cuenta={soloLectura.nombre} />;
    if (edicion?.confirmandoBorrado) {
      return (
        <BloqueEliminar
          nombre={conceptoDe(edicion.movimiento)}
          detalle={detalleEliminar(edicion)}
          alConfirmar={() => void edicion.eliminar().then((ok) => (ok ? cerrarYa() : undefined))}
          alCancelar={edicion.cancelarBorrado}
          pendiente={edicion.eliminando}
          error={edicion.errorBorrado}
        />
      );
    }
    return (
      <>
        {erroresPie.map((error) => (
          <MensajeError key={error} mensaje={error} className="pb-2" />
        ))}
        {edicion?.confirmandoDescarte ? (
          <ConfirmarDescarte alDescartar={() => void cerrarYa()} alSeguir={edicion.seguirEditando} />
        ) : (
          <Boton
            type="submit"
            disabled={!c.puedeEnviar}
            monto={registro && c.montoNumero !== null ? enMoneda(c.montoNumero, c.monedaMonto) : undefined}
            className="w-full justify-center"
          >
            {etiquetaEnviar(c)}
          </Boton>
        )}
        {edicion && !edicion.confirmandoDescarte && (
          <PedirEliminar onClick={edicion.pedirBorrado} disabled={edicion.enviando}>
            Eliminar movimiento…
          </PedirEliminar>
        )}
      </>
    );
  }

  return (
    <dialog
      ref={dialogo}
      aria-label={edicion ? "Editar movimiento" : "Registrar"}
      tabIndex={-1}
      onCancel={alCancelar}
      className="fixed inset-0 m-0 h-dvh max-h-none outline-none! w-full max-w-none overflow-hidden border-0 bg-fondo p-0 text-texto backdrop:bg-fondo"
    >
      <form onSubmit={(e) => void enviar(e)} noValidate className="relative flex h-dvh flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 pr-4 pl-1">
          <button type="button" aria-label="Cerrar" onClick={solicitarCierre} className="flex size-11 shrink-0 items-center justify-center">
            <X size={20} strokeWidth={1.5} aria-hidden />
          </button>
          <fieldset disabled={soloLectura !== null || cuentaFija !== null} className="m-0 flex min-w-0 border-0 p-0">
            <SelectorTipo variante="pestanas" valor={valores.tipo} alCambiar={c.cambiarTipo} />
          </fieldset>
          {/* En la edición, el título ocupa el lugar de «Hoy −X»: que no se confunda con registrar uno nuevo. */}
          {edicion && <span className="ml-auto shrink-0 text-rotulo uppercase text-secundario">Editar</span>}
          {gastosHoy > 0n && (
            <div className="ml-auto shrink-0 text-right">
              <div className="text-rotulo uppercase text-secundario">Hoy</div>
              <div className="font-mono text-cifra-xs tabular-nums">{pesos(-gastosHoy)}</div>
            </div>
          )}
        </header>

        {errorCarga || c.sinCuentas ? (
          <div className="flex flex-1 flex-col justify-center px-4">
            {errorCarga ? <ErrorCarga alReintentar={c.reintentar} /> : <SinCuentas alIr={c.cerrar} />}
          </div>
        ) : (
          <>
            <fieldset disabled={soloLectura !== null} className="m-0 flex min-h-0 flex-1 flex-col border-0 p-0">
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6">
                <div role="group" aria-label="Monto" className="flex max-w-full items-baseline gap-2">
                  {signo && (
                    <span aria-hidden className={`font-mono ${largo > 15 ? "text-cifra-m" : "text-cifra-l"} ${valores.tipo === "gasto" ? "text-salida" : "text-entrada"}`}>
                      {signo}
                    </span>
                  )}
                  <output aria-live="polite" className={`min-w-0 truncate font-mono tabular-nums ${tamano} ${valores.monto === "" ? "text-terciario" : ""}`}>
                    {montoTexto}
                  </output>
                  <span className="text-etiqueta text-secundario">{c.monedaMonto}</span>
                </div>
                {c.errores.monto && <MensajeError mensaje={c.errores.monto} />}
                <input
                  aria-label="Descripción"
                  value={valores.descripcion}
                  onChange={(e) => c.cambiarDescripcion(e.target.value)}
                  maxLength={MAX_DESCRIPCION}
                  autoComplete="off"
                  enterKeyHint="done"
                  placeholder="¿En qué? Escribe o elige abajo"
                  className={`h-11 w-full max-w-[280px] rounded-none border-0 border-b bg-transparent p-0 text-center text-cuerpo text-texto placeholder:text-terciario ${
                    c.errores.descripcion ? "border-salida" : "border-linea focus:border-raya"
                  }`}
                />
                <div className="flex min-h-4 items-center">
                  {c.errores.descripcion ? (
                    <MensajeError mensaje={c.errores.descripcion} />
                  ) : (
                    propuestaActiva &&
                    !dividido && (
                      <span className="font-mono text-cifra-xs text-marca-texto">
                        Regla «{propuestaActiva.regla.palabraClave}» → {propuestaActiva.categoria.nombre}
                      </span>
                    )
                  )}
                </div>
                {/* Nota: plegada en una línea (como «Más opciones» en escritorio); la hoja la escribe. */}
                <button
                  type="button"
                  onClick={() => setHoja("nota")}
                  className={`flex h-11 max-w-[280px] items-center gap-1 text-etiqueta ${
                    valores.nota.trim() === "" ? "font-semibold text-marca-texto disabled:hidden" : "font-normal text-secundario"
                  }`}
                >
                  {valores.nota.trim() === "" ? (
                    "+ Nota"
                  ) : (
                    <>
                      <span className="shrink-0">Nota ·</span>
                      <span className="truncate">{valores.nota}</span>
                    </>
                  )}
                </button>
                {c.errores.nota && <MensajeError mensaje={c.errores.nota} />}
              </div>

              <div className="flex h-14 shrink-0 items-start gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
                {chips.length > 0 ? (
                  chips.map((concepto) => (
                    <ChipCategoria
                      key={concepto}
                      etiqueta={concepto}
                      seleccionada={concepto === valores.descripcion}
                      onClick={() => c.aceptarConcepto(concepto === valores.descripcion ? "" : concepto)}
                    />
                  ))
                ) : registro && !conTexto && listo ? (
                  <p className="flex h-11 items-center text-etiqueta font-normal text-secundario">Tus conceptos frecuentes aparecerán aquí.</p>
                ) : null}
              </div>

              <div className="grid h-14 shrink-0 grid-cols-[1.25fr_1fr_0.9fr] border-t border-linea">
                {esTransferencia ? (
                  <>
                    <Celda
                      primera
                      rotulo="Desde"
                      valor={c.nombreCuenta(valores.cuentaId) ?? "Elegir"}
                      vacio={!valores.cuentaId}
                      fija={cuentaFija?.rol === "cuenta"}
                      alPulsar={() => setHoja("cuenta")}
                    />
                    <Celda
                      rotulo="Hacia"
                      valor={c.nombreCuenta(valores.destinoId) ?? "Elegir"}
                      vacio={!valores.destinoId}
                      fija={cuentaFija?.rol === "destino"}
                      alPulsar={() => setHoja("destino")}
                    />
                  </>
                ) : (
                  <>
                    <Celda
                      primera
                      rotulo="Categoría"
                      valor={dividido ? "Dividido" : (categoriaElegida?.nombre ?? "Sin categoría")}
                      vacio={!dividido && !categoriaElegida}
                      etiqueta={propuestaActiva && !dividido ? "auto" : undefined}
                      alPulsar={() => setHoja("categoria")}
                    />
                    <Celda
                      rotulo="Cuenta"
                      valor={c.nombreCuenta(valores.cuentaId) ?? "Elegir"}
                      vacio={!valores.cuentaId}
                      fija={cuentaFija?.rol === "cuenta"}
                      alPulsar={() => setHoja("cuenta")}
                    />
                  </>
                )}
                <Celda rotulo="Fecha" valor={rotuloFechaCorto(valores.fecha, fechaHoy)} alPulsar={() => setHoja("fecha")} />
              </div>

              {c.conMontoDestino && c.monedaDestino && (
                <div className="shrink-0 border-t border-linea px-4 py-2">
                  <label className="flex items-baseline gap-3">
                    <span className="text-rotulo uppercase text-secundario">Llegó</span>
                    <input
                      value={valores.montoDestino}
                      onChange={(e) => c.cambiar("montoDestino", formatearEntrada(e.target.value, c.monedaDestino ?? "COP"))}
                      inputMode={c.monedaDestino === "USD" ? "decimal" : "numeric"}
                      autoComplete="off"
                      placeholder="0"
                      aria-invalid={c.errores.montoDestino ? true : undefined}
                      className="h-11 min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-right font-mono text-cifra-m tabular-nums text-texto placeholder:text-terciario"
                    />
                    <span className="text-etiqueta text-secundario">{c.monedaDestino}</span>
                  </label>
                  {textoTasa(c) && <p className="text-etiqueta font-normal text-secundario">{textoTasa(c)}</p>}
                </div>
              )}

              <TecladoNumerico valor={valores.monto} moneda={c.monedaMonto} alCambiar={(v) => c.cambiar("monto", v)} />
            </fieldset>

            <div className="relative shrink-0 px-4 pt-3 pb-[max(24px,env(safe-area-inset-bottom))]">
              {registro && (
                <div className="absolute inset-x-4 bottom-full mb-2">
                  <AvisoRegistro formato="hoja" aviso={datosAviso(registro)} oferta={datosOferta(registro)} />
                </div>
              )}
              {pie()}
            </div>
          </>
        )}
      </form>

      {hoja === "categoria" && (
        <HojaInferior titulo="Categoría" alCerrar={() => setHoja(null)}>
          <div className="flex flex-col gap-4 pb-2">
            {/* Con partes, los chips de categoría se ocultan: la categoría va en cada parte. */}
            {!dividido && (
              <div className="flex flex-wrap gap-2">
                {c.categorias.map((cat) => (
                  <ChipCategoria
                    key={cat.id}
                    etiqueta={cat.nombre}
                    estado={propuestaActiva?.categoria.id === cat.id ? "sugerida" : "normal"}
                    seleccionada={valores.categoria.modo === "elegida" && valores.categoria.id === cat.id}
                    onClick={() => {
                      c.tocarCategoria(cat.id);
                      setHoja(null);
                    }}
                  />
                ))}
              </div>
            )}
            <div className={dividido ? "" : "border-t border-linea pt-2"}>
              <EditorPartes
                idBase="hoja"
                total={c.montoNumero}
                partes={valores.partes}
                categorias={c.categorias}
                alActivar={c.activarPartes}
                alDesactivar={c.desactivarPartes}
                alCambiar={c.cambiarParte}
                alAgregar={c.agregarParte}
                alQuitar={c.quitarParte}
                alCompletar={c.completarResto}
                error={c.errores.partes ?? c.errorDePartes}
              />
            </div>
          </div>
        </HojaInferior>
      )}

      {(hoja === "cuenta" || hoja === "destino") && (
        <HojaInferior titulo={hoja === "destino" ? "Hacia" : esTransferencia ? "Desde" : "Cuenta"} alCerrar={() => setHoja(null)}>
          <div className="border-t border-linea">{listaCuentas(hoja)}</div>
          {hoja === "cuenta" && usar && (
            <div className="flex flex-col items-start pt-2">
              <Boton compacto variante="texto" onClick={usar.alPulsar} disabled={usar.pendiente}>
                Usar {usar.cuenta.nombre} siempre
              </Boton>
              {registro?.errorPredeterminada && <MensajeError mensaje={registro.errorPredeterminada} />}
            </div>
          )}
        </HojaInferior>
      )}

      {hoja === "nota" && (
        <HojaInferior titulo="Nota" alCerrar={() => setHoja(null)} enfocarListo={false}>
          <label className="flex flex-col gap-1 border-t border-linea pt-4 pb-2">
            <span className="sr-only">Nota</span>
            <textarea
              autoFocus
              value={valores.nota}
              onChange={(e) => c.cambiar("nota", e.target.value)}
              maxLength={MAX_NOTA}
              rows={4}
              placeholder="Lo que quieras recordar de este movimiento"
              aria-invalid={c.errores.nota ? true : undefined}
              className={`resize-none rounded-none border-0 border-b bg-transparent p-0 py-2 text-cuerpo text-texto placeholder:text-terciario ${
                c.errores.nota ? "border-salida" : "border-linea focus:border-raya"
              }`}
            />
            {c.errores.nota && <MensajeError mensaje={c.errores.nota} />}
          </label>
        </HojaInferior>
      )}

      {hoja === "fecha" && fechaHoy && (
        <HojaInferior titulo="Fecha" alCerrar={() => setHoja(null)}>
          <div className="border-t border-linea">
            {opcionesFecha(fechaHoy).map((opcion) => (
              <FilaHoja
                key={opcion.rotulo}
                nombre={opcion.rotulo}
                detalle={formatearDiaSemana(opcion.fecha)}
                elegida={valores.fecha === opcion.fecha}
                alPulsar={() => {
                  c.cambiar("fecha", opcion.fecha);
                  setHoja(null);
                }}
              />
            ))}
            {/* Otra fecha: el calendario del libro, no el selector nativo. Elegir cierra la hoja. */}
            <div className="flex flex-col gap-2 border-b border-linea px-1 pt-4 pb-4">
              <span className="text-etiqueta text-secundario">Otra fecha</span>
              <Calendario
                etiqueta="Otra fecha"
                valor={valores.fecha}
                hoy={fechaHoy}
                alElegir={(fecha) => {
                  c.cambiar("fecha", fecha);
                  setHoja(null);
                }}
              />
            </div>
          </div>
        </HojaInferior>
      )}
    </dialog>
  );
}
