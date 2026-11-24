"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { admiteGastoIngreso } from "@/domain/cuenta/naturaleza";
import { formatearDinero, formatearTasa } from "@/domain/dinero/formato";
import type { CuentaDePrestamo } from "@/domain/movimiento/edicion";
import { importeEnPatrimonio } from "@/domain/movimiento/vista-previa";
import type { Cuenta } from "@/services/captura";
import type { TipoMovimiento } from "@/services/movimientos";
import { BloqueEliminar } from "../bloque-eliminar";
import { Boton } from "../boton";
import { CampoMonto } from "../campo-monto";
import { ChipCategoria } from "../chip-categoria";
import { EnlaceTexto } from "../enlace-texto";
import { IconoCuenta, ROTULO_TIPO_CUENTA } from "../iconos";
import { MensajeError } from "../mensaje-error";
import type { EstadoEdicion } from "../movimientos/usar-edicion";
import { PanelLateral, type ControlPanel } from "../panel-lateral";
import { AvisoRegistro } from "./aviso-registro";
import { EditorPartes } from "./editor-partes";
import { FichaCuenta } from "./ficha-cuenta";
import { SelectorFecha } from "./selector-fecha";
import { SelectorTipo } from "./selector-tipo";
import { datosAviso, datosOferta, type EstadoCaptura } from "./usar-captura";
import { MAX_DESCRIPCION, MAX_NOTA, normalizar, type RolCuenta } from "./usar-formulario";

/** El formulario de movimiento en cualquiera de sus modos: registro (captura) o edición. */
export type EstadoFormulario = EstadoCaptura | EstadoEdicion;

export const ID_MONTO = "captura-monto";
const ID_FORMULARIO = "captura-formulario";

const ROTULO_TIPO: Record<TipoMovimiento, string> = { gasto: "Gasto", ingreso: "Ingreso", transferencia: "Transferencia", ajuste: "Ajuste" };

const VERBO: Record<Exclude<TipoMovimiento, "ajuste">, string> = {
  gasto: "Registrar gasto",
  ingreso: "Registrar ingreso",
  transferencia: "Registrar transferencia",
};

/** «Registrar gasto» / «Registrando…» en la captura; «Guardar cambios» / «Guardando…» en la edición. */
export function etiquetaEnviar(c: EstadoFormulario): string {
  if (c.modo === "edicion") return c.enviando ? "Guardando…" : "Guardar cambios";
  return c.enviando ? "Registrando…" : VERBO[c.valores.tipo];
}

/** `{concepto}` de los textos: la descripción o, sin ella, el tipo («Gasto»). */
export function conceptoDe(movimiento: { tipo: TipoMovimiento; descripcion: string | null }): string {
  return movimiento.descripcion ?? ROTULO_TIPO[movimiento.tipo];
}

/** Frase del bloque de borrado de un movimiento: «El saldo de Nequi vuelve a como estaba. No se puede deshacer.». */
export function detalleEliminar(c: EstadoEdicion): string {
  const { cuentaOrigen, cuentaDestino } = c.movimiento;
  const cuentas = [cuentaOrigen, cuentaDestino].filter((cu) => cu !== null).map((cu) => cu.nombre);
  return `El saldo de ${cuentas.join(" y ")} vuelve a como estaba. No se puede deshacer.`;
}

/** Pesos sin «COP»: todo el formulario está en pesos. */
function pesos(monto: bigint): string {
  return formatearDinero({ monto, moneda: "COP" }, { omitirCOP: true });
}

/** Monto del botón con su signo: «−15.000», «+15.000» o «15.000» en transferencia («US$ 2.000,00» desde una inversión en dólares). */
export function montoConSigno(c: EstadoFormulario): string | undefined {
  if (c.montoNumero === null) return undefined;
  const efecto = importeEnPatrimonio(c.valores.tipo, c.montoNumero);
  return formatearDinero({ monto: efecto ?? c.montoNumero, moneda: c.monedaMonto }, { omitirCOP: true, signoMas: efecto !== null });
}

/**
 * Bajo «Llegó», con los dos montos válidos: «Tasa 4.120,00 COP por US$ · TRM
 * de hoy 4.120,00» (sin TRM, solo la tasa). Vista previa para detectar un
 * monto mal digitado; la tasa que vale la congela la API (RN-04).
 */
export function textoTasa(c: EstadoFormulario): string | null {
  if (c.tasaVistaPrevia === null) return null;
  const tasa = `Tasa ${formatearTasa(c.tasaVistaPrevia)} COP por US$`;
  return c.trm ? `${tasa} · TRM de hoy ${formatearTasa(c.trm.valor)}` : tasa;
}

/** «Nequi quedará en 5.321»; en un pasivo, «Visa Oro quedará en debe 1.299.300». */
function textoVistaPrevia(c: EstadoFormulario): { cuenta: string; saldo: string } | null {
  const cuenta = c.cuentaElegida;
  if (!cuenta) return null;
  const resultante = c.vistaPrevia(cuenta, "cuenta");
  if (resultante === null) return null;
  return { cuenta: cuenta.nombre, saldo: cuenta.naturaleza === "pasivo" ? `debe ${pesos(resultante)}` : pesos(resultante) };
}

/** Sin cuentas activas: no hay dónde registrar. «+ Nueva cuenta» cierra la captura y abre el alta. */
export function SinCuentas({ alIr }: { alIr: () => void }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <p className="text-cuerpo font-semibold">Para registrar necesitas una cuenta.</p>
      <EnlaceTexto href="/cuentas?cuenta=nueva" scroll={false} onClick={alIr}>
        + Nueva cuenta
      </EnlaceTexto>
    </div>
  );
}

/** `GET /captura` o `GET /cuentas` fallaron al abrir. */
export function ErrorCarga({ alReintentar }: { alReintentar: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-4">
      <p className="text-cuerpo font-semibold">No pudimos cargar el formulario.</p>
      <Boton variante="secundario" onClick={alReintentar}>
        Reintentar
      </Boton>
    </div>
  );
}

/** Edición de un movimiento con una cuenta archivada (N-36): solo lectura. */
export function AvisoSoloLectura({ cuenta }: { cuenta: string }) {
  return (
    <div role="status" className="flex flex-col items-start gap-1 border-b border-linea pb-4">
      <p className="text-cuerpo">La cuenta {cuenta} está archivada. Restáurala para modificar este movimiento.</p>
      <EnlaceTexto href="/cuentas/archivadas">Ver archivadas</EnlaceTexto>
    </div>
  );
}

/** «¿Descartar los cambios?» en lugar del botón, al cerrar la edición con cambios. */
export function ConfirmarDescarte({ alDescartar, alSeguir }: { alDescartar: () => void; alSeguir: () => void }) {
  return (
    <div role="group" aria-label="Descartar los cambios" className="flex flex-col gap-3">
      <p className="text-cuerpo font-semibold">¿Descartar los cambios?</p>
      <div className="flex flex-wrap items-center gap-3">
        <Boton onClick={alDescartar}>Descartar</Boton>
        <Boton variante="texto" onClick={alSeguir}>
          Seguir editando
        </Boton>
      </div>
    </div>
  );
}

/**
 * La cuenta de un préstamo en la edición de un movimiento de préstamo: fija,
 * con el aspecto de una ficha elegida pero sin poder cambiarse.
 */
export function FichaCuentaFija({ cuenta }: { cuenta: CuentaDePrestamo }) {
  return (
    <div className="grid min-h-12 grid-cols-[20px_minmax(0,1fr)] items-center gap-2 rounded-campo border border-texto bg-superficie px-3 py-2">
      <span className="flex text-secundario">
        <IconoCuenta tipo={cuenta.tipo} />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-cuerpo font-semibold">{cuenta.nombre}</span>
        <span className="truncate text-etiqueta font-normal text-secundario">{ROTULO_TIPO_CUENTA[cuenta.tipo]}</span>
      </span>
    </div>
  );
}

/**
 * Cuentas que se ofrecen: en un gasto o un ingreso, sin las inversiones (solo
 * admiten transferencias, `CUENTA_DE_INVERSION`); en una transferencia, todas.
 */
export function cuentasOfrecidas(c: EstadoFormulario): Cuenta[] {
  return c.valores.tipo === "transferencia" ? c.cuentas : c.cuentas.filter((cuenta) => admiteGastoIngreso(cuenta.tipo));
}

/** «Usar {cuenta} siempre» (solo en la captura): la elegida pasa a ser la predeterminada (N-34). Nunca una inversión. */
export function usarSiempre(c: EstadoFormulario): { cuenta: Cuenta; alPulsar: () => void; pendiente: boolean } | null {
  if (c.modo !== "registro" || c.valores.tipo === "transferencia") return null;
  const elegida = c.cuentaElegida;
  if (!elegida || elegida.id === c.predeterminada?.id || !admiteGastoIngreso(elegida.tipo)) return null;
  return { cuenta: elegida, alPulsar: () => void c.elegirPredeterminada(elegida.id), pendiente: c.predeterminadaPendiente };
}

/** Renglones vacíos mientras llegan categorías y cuentas: sin datos inventados. */
function Cargando({ etiqueta }: { etiqueta: string }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-2">
      <span className="text-etiqueta text-secundario">{etiqueta}</span>
      <div aria-hidden className="h-12 rounded-campo border border-linea" />
    </div>
  );
}

function Descripcion({ c }: { c: EstadoFormulario }) {
  const { descripcion } = c.valores;
  const error = c.errores.descripcion;
  const primero = c.conceptos[0];
  // La lista sobra si su único concepto ya es lo escrito.
  const mostrarLista =
    c.conceptos.length > 0 && !(c.conceptos.length === 1 && normalizar(primero.descripcion) === normalizar(descripcion));

  function alTeclear(evento: KeyboardEvent<HTMLInputElement>) {
    // Tab acepta el primer concepto; si no hay nada que completar, Tab avanza como siempre.
    if (evento.key === "Tab" && !evento.shiftKey && primero && primero.descripcion !== descripcion) {
      evento.preventDefault();
      c.aceptarConcepto(primero.descripcion);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="captura-descripcion" className="text-etiqueta text-secundario">
        Descripción
      </label>
      <div className={`relative h-11 border-b ${error ? "border-salida" : "border-linea focus-within:border-raya"}`}>
        {/* Texto fantasma: lo escrito, invisible, y en tenue lo que completaría Tab. */}
        <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre text-cuerpo">
          <span className="invisible">{descripcion}</span>
          <span className="text-terciario">{c.fantasma}</span>
        </span>
        <input
          id="captura-descripcion"
          value={descripcion}
          onChange={(e) => c.cambiarDescripcion(e.target.value)}
          onKeyDown={alTeclear}
          maxLength={MAX_DESCRIPCION}
          autoComplete="off"
          placeholder="Almuerzo, taxi, recarga…"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "captura-descripcion-error" : undefined}
          className="absolute inset-0 h-11 w-full border-0 bg-transparent p-0 text-cuerpo text-texto placeholder:text-terciario"
        />
      </div>
      {mostrarLista && (
        <ul aria-label="Sugerencias" className="flex flex-col rounded-b-campo border border-t-0 border-linea">
          {c.conceptos.map((concepto, i) => (
            <li key={concepto.descripcion} className={i > 0 ? "border-t border-linea" : ""}>
              <button
                type="button"
                onClick={() => c.aceptarConcepto(concepto.descripcion)}
                className={`grid min-h-10 w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-3 text-left ${
                  i === 0 ? "bg-hundido" : "hover:bg-hundido"
                }`}
              >
                <span className="truncate text-cuerpo">{concepto.descripcion}</span>
                <span className="text-etiqueta text-secundario">{concepto.categoria?.nombre}</span>
                <kbd
                  className={`rounded-muestra border px-1 font-mono text-cifra-xs text-secundario ${
                    i === 0 ? "border-linea" : "invisible border-transparent"
                  }`}
                >
                  Tab
                </kbd>
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <MensajeError id="captura-descripcion-error" mensaje={error} />}
    </div>
  );
}

function Categorias({ c }: { c: EstadoFormulario }) {
  const { categoria } = c.valores;
  const propuestaActiva = categoria.modo === "propuesta" ? c.propuesta : null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between gap-3 text-etiqueta text-secundario">
        <span>Categoría</span>
        {propuestaActiva && <span className="text-marca-texto">Sugerida por «{propuestaActiva.regla.palabraClave}»</span>}
      </div>
      <div role="group" aria-label="Categoría" className="flex flex-wrap gap-2">
        {c.categorias.map((cat) => (
          <ChipCategoria
            key={cat.id}
            etiqueta={cat.nombre}
            estado={propuestaActiva?.categoria.id === cat.id ? "sugerida" : "normal"}
            seleccionada={categoria.modo === "elegida" && categoria.id === cat.id}
            onClick={() => c.tocarCategoria(cat.id)}
          />
        ))}
      </div>
      {c.errores.categoria && <MensajeError mensaje={c.errores.categoria} />}
    </div>
  );
}

function GrupoFichas({ c, rol, etiqueta }: { c: EstadoFormulario; rol: RolCuenta; etiqueta: string }) {
  const fija = c.modo === "edicion" && c.cuentaFija?.rol === rol ? c.cuentaFija : null;
  if (fija) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-etiqueta text-secundario">{etiqueta}</span>
        <div className="grid grid-cols-2 gap-2">
          <FichaCuentaFija cuenta={fija} />
        </div>
      </div>
    );
  }
  const elegida = rol === "cuenta" ? c.valores.cuentaId : c.valores.destinoId;
  const error = rol === "cuenta" ? c.errores.cuenta : c.errores.destino;
  const elegir = (cuenta: Cuenta) => c.cambiar(rol === "cuenta" ? "cuentaId" : "destinoId", cuenta.id);
  const usar = rol === "cuenta" ? usarSiempre(c) : null;
  const errorPredeterminada = rol === "cuenta" && c.modo === "registro" ? c.errorPredeterminada : null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-6 items-center justify-between gap-3">
        <span className="text-etiqueta text-secundario">{etiqueta}</span>
        {usar && (
          <Boton variante="texto" onClick={usar.alPulsar} disabled={usar.pendiente} className="h-11 shrink-0">
            Usar {usar.cuenta.nombre} siempre
          </Boton>
        )}
      </div>
      <div role="group" aria-label={etiqueta} className="grid grid-cols-2 gap-2">
        {cuentasOfrecidas(c).map((cuenta) => (
          <FichaCuenta
            key={cuenta.id}
            cuenta={cuenta}
            elegida={cuenta.id === elegida}
            resultante={c.vistaPrevia(cuenta, rol)}
            alPulsar={() => elegir(cuenta)}
          />
        ))}
      </div>
      {error && <MensajeError mensaje={error} />}
      {errorPredeterminada && <MensajeError mensaje={errorPredeterminada} />}
    </div>
  );
}

/** Pie de la edición: guardar (o descartar), y debajo el borrado C26. En solo lectura no hay pie. */
function PieEdicion({ c, alCerrarYa }: { c: EstadoEdicion; alCerrarYa: () => Promise<void> }) {
  const concepto = conceptoDe(c.movimiento);
  return (
    <div className="flex flex-col gap-2">
      {c.confirmandoDescarte ? (
        <ConfirmarDescarte alDescartar={() => void alCerrarYa()} alSeguir={c.seguirEditando} />
      ) : (
        <Boton type="submit" form={ID_FORMULARIO} disabled={!c.puedeEnviar} className="w-full justify-center">
          {etiquetaEnviar(c)}
        </Boton>
      )}
      {c.errorGeneral && <MensajeError mensaje={c.errorGeneral} />}
      <div className="mt-2 border-t border-linea pt-4">
        {c.confirmandoBorrado ? (
          <BloqueEliminar
            nombre={concepto}
            detalle={detalleEliminar(c)}
            alConfirmar={() => void c.eliminar().then((ok) => (ok ? alCerrarYa() : undefined))}
            alCancelar={c.cancelarBorrado}
            pendiente={c.eliminando}
            error={c.errorBorrado}
          />
        ) : (
          <button
            type="button"
            onClick={c.pedirBorrado}
            disabled={c.enviando}
            className="py-2 text-etiqueta font-normal text-secundario hover:text-texto disabled:cursor-not-allowed"
          >
            Eliminar movimiento…
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Formulario de movimiento en escritorio (≥ 768 px): panel lateral de 480 px.
 * Registro (captura): sobre la página actual, sin cambiar la URL; Enter
 * registra desde cualquier campo salvo la nota; Escape cierra y conserva el
 * borrador. Edición: abierta por URL desde `/movimientos`; Enter guarda;
 * cerrar con cambios pregunta.
 */
export function PanelCaptura({ c }: { c: EstadoFormulario }) {
  const panel = useRef<ControlPanel>(null);
  const [masOpciones, setMasOpciones] = useState(() => c.valores.nota !== "" || c.valores.partes !== null);
  const { valores } = c;
  const esTransferencia = valores.tipo === "transferencia";
  const edicion = c.modo === "edicion" ? c : null;
  const soloLectura = edicion?.soloLectura ?? null;

  // Al abrir y tras cada registro, el foco vuelve al monto.
  useEffect(() => {
    if (!soloLectura) document.getElementById(ID_MONTO)?.focus();
  }, [c.envios, soloLectura]);

  /** Retira la hoja y avisa (la captura se oculta; la edición quita `?movimiento=`). */
  async function cerrarYa() {
    await panel.current?.cerrar();
    c.cerrar();
  }

  function solicitarCierre() {
    if (c.solicitarCierre()) void cerrarYa();
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (await c.enviar()) await cerrarYa();
  }

  const listo = c.estadoCarga === "lista" && c.captura !== null;
  const errorCarga = c.estadoCarga === "error" && c.captura === null;
  const vista = textoVistaPrevia(c);
  const rotuloCuenta = c.predeterminada ? `Cuenta · ${c.predeterminada.nombre} es la predeterminada` : "Cuenta";

  let pie;
  if (edicion) {
    pie = soloLectura ? undefined : <PieEdicion c={edicion} alCerrarYa={cerrarYa} />;
  } else if (!errorCarga && !c.sinCuentas) {
    pie = (
      <div className="flex flex-col gap-2">
        {c.errorGeneral && <MensajeError mensaje={c.errorGeneral} />}
        <Boton type="submit" form={ID_FORMULARIO} disabled={!c.puedeEnviar} monto={montoConSigno(c)} className="w-full justify-center">
          {etiquetaEnviar(c)}
        </Boton>
        <p className="text-etiqueta font-normal text-secundario">
          <kbd className="rounded-muestra border border-linea px-1 font-mono text-cifra-xs">↵</kbd> registra y deja el panel listo para otro
        </p>
        {vista && (
          <p className="text-right text-etiqueta font-normal text-secundario">
            {vista.cuenta} quedará en <span className="font-mono tabular-nums">{vista.saldo}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <PanelLateral
      ref={panel}
      titulo={edicion ? "Editar movimiento" : "Registrar"}
      ancho="amplio"
      alSolicitarCierre={solicitarCierre}
      pie={pie}
    >
      <form id={ID_FORMULARIO} onSubmit={(e) => void enviar(e)} noValidate className="flex flex-col gap-6">
        {c.modo === "registro" && <AvisoRegistro aviso={datosAviso(c)} oferta={datosOferta(c)} />}
        {soloLectura && <AvisoSoloLectura cuenta={soloLectura.nombre} />}

        {errorCarga ? (
          <ErrorCarga alReintentar={c.reintentar} />
        ) : c.sinCuentas ? (
          <SinCuentas alIr={c.cerrar} />
        ) : (
          <fieldset disabled={soloLectura !== null} className="m-0 flex min-w-0 flex-col gap-6 border-0 p-0">
            {/* Un movimiento de préstamo no cambia de tipo. */}
            <fieldset disabled={edicion?.cuentaFija != null} className="m-0 min-w-0 border-0 p-0">
              <SelectorTipo valor={valores.tipo} alCambiar={c.cambiarTipo} />
            </fieldset>
            {c.errores.tipo && <MensajeError mensaje={c.errores.tipo} />}

            <CampoMonto
              valor={valores.monto}
              moneda={c.monedaMonto}
              signo={valores.tipo === "gasto" ? "salida" : valores.tipo === "ingreso" ? "entrada" : undefined}
              editable={{ nombre: ID_MONTO, alCambiar: (v) => c.cambiar("monto", v), error: c.errores.monto }}
            />

            <Descripcion c={c} />

            {/* Con partes, los chips de categoría se ocultan: la categoría va en cada parte. */}
            {!esTransferencia && valores.partes === null && (listo ? <Categorias c={c} /> : <Cargando etiqueta="Categoría" />)}

            {listo ? (
              esTransferencia ? (
                <>
                  <GrupoFichas c={c} rol="cuenta" etiqueta="Desde" />
                  <GrupoFichas c={c} rol="destino" etiqueta="Hacia" />
                  {/* Entre monedas: lo que llegó, en la moneda del destino (SPEC 10). */}
                  {c.conMontoDestino && c.monedaDestino && (
                    <CampoMonto
                      valor={valores.montoDestino}
                      moneda={c.monedaDestino}
                      etiqueta="Llegó"
                      editable={{
                        nombre: "captura-monto-destino",
                        alCambiar: (v) => c.cambiar("montoDestino", v),
                        error: c.errores.montoDestino,
                        nota: textoTasa(c) ?? undefined,
                      }}
                    />
                  )}
                </>
              ) : (
                <GrupoFichas c={c} rol="cuenta" etiqueta={rotuloCuenta} />
              )
            ) : (
              <Cargando etiqueta="Cuenta" />
            )}

            <SelectorFecha
              fechaHoy={c.captura?.fechaHoy ?? null}
              valor={valores.fecha}
              alCambiar={(fecha) => c.cambiar("fecha", fecha)}
              error={c.errores.fecha}
            />

            <div className="flex flex-col">
              <button
                type="button"
                aria-expanded={masOpciones}
                onClick={() => setMasOpciones((m) => !m)}
                className="flex min-h-11 items-center justify-between border-b border-linea text-left text-cuerpo"
              >
                <span>
                  Más opciones <span className="text-secundario">· nota, dividir</span>
                </span>
                <span className="flex text-secundario">
                  {masOpciones ? (
                    <ChevronUp size={18} strokeWidth={1.5} aria-hidden />
                  ) : (
                    <ChevronDown size={18} strokeWidth={1.5} aria-hidden />
                  )}
                </span>
              </button>
              {masOpciones && (
                <div className="flex flex-col gap-4 pt-4">
                  <label className="flex flex-col gap-1">
                    <span className="text-etiqueta text-secundario">Nota</span>
                    <textarea
                      value={valores.nota}
                      onChange={(e) => c.cambiar("nota", e.target.value)}
                      maxLength={MAX_NOTA}
                      rows={3}
                      aria-invalid={c.errores.nota ? true : undefined}
                      className={`resize-none rounded-none border-0 border-b bg-transparent p-0 py-2 text-cuerpo text-texto ${
                        c.errores.nota ? "border-salida" : "border-linea focus:border-raya"
                      }`}
                    />
                    {c.errores.nota && <MensajeError mensaje={c.errores.nota} />}
                  </label>
                  {!esTransferencia && listo && (
                    <EditorPartes
                      idBase="panel"
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
                  )}
                </div>
              )}
            </div>
          </fieldset>
        )}
      </form>
    </PanelLateral>
  );
}
