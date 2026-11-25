"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { aMenores } from "@/domain/dinero/entrada";
import { aCantidad, formatearCantidadCorta, precioPorUnidad } from "@/domain/inversion/cantidad";
import {
  activoEnCuenta,
  cambioOperacion,
  cuerpoOperacion,
  MAX_NOMBRE_ACTIVO,
  MAX_SIMBOLO,
  MENSAJE_CANTIDAD,
  mensajeMonto,
  normalizarSimbolo,
  simboloValido,
  VALORES_OPERACION,
  valoresEdicion,
  type CampoOperacion,
  type ValoresEdicionOperacion,
  type ValoresOperacion,
} from "@/domain/inversion/formulario";
import { enMoneda } from "@/domain/inversion/presentacion";
import type {
  BusquedaActivo,
  ClaseOperacion,
  InversionDetalle,
  Moneda,
  Operacion,
  OperacionCambio,
  OperacionCuerpo,
} from "@/domain/inversion/tipos";
import { BloqueEliminar, PedirEliminar } from "../bloque-eliminar";
import { Boton } from "../boton";
import { CampoMonto } from "../campo-monto";
import { CampoSubrayado } from "../campo-subrayado";
import { ConfirmarDescarte } from "../captura/panel-captura";
import { ChipCategoria } from "../chip-categoria";
import { MensajeError } from "../mensaje-error";
import { OpcionUnica } from "../opcion-unica";
import { PanelLateral, type ControlPanel } from "../panel-lateral";
import { ROTULO_CLASE } from "./lista-operaciones";
import { rutaInversion } from "./rutas";
import { CampoFecha } from "../campo-fecha";

type Fallo<C extends string = never> = { ok: false; codigo: string; mensaje: string; campo?: C };

/** Server actions; llegan por prop desde la página (los componentes no importan `app/`). */
export type AccionesOperacion = {
  buscar: (id: string, simbolo: string) => Promise<{ ok: true; busqueda: BusquedaActivo } | Fallo>;
  registrar: (id: string, cuerpo: OperacionCuerpo) => Promise<{ ok: true } | Fallo<CampoOperacion>>;
  editar: (id: string, operacionId: string, cambio: OperacionCambio) => Promise<{ ok: true } | Fallo<CampoOperacion>>;
  eliminar: (id: string, operacionId: string) => Promise<{ ok: true } | Fallo>;
};

type Props = {
  detalle: Pick<InversionDetalle, "id" | "nombre" | "moneda" | "efectivo" | "posiciones" | "fechaHoy">;
  /** Todas las de la cuenta: las cerradas cuentan para saber si un símbolo ya está. */
  operaciones: readonly Operacion[];
  /** `null`: alta (`&operacion=nueva`). Con operación: edición. */
  operacion: Operacion | null;
  acciones: AccionesOperacion;
  /** Tras la salida de la hoja. Por defecto vuelve a `?inversion=<id>` (en `/estilos`, cierra la muestra). */
  alCerrar?: () => void;
};

type Errores = Partial<Record<CampoOperacion, string>>;

/** Sin campo útil en el formulario: van al pie aunque la API mande `campo` (`CANTIDAD_INSUFICIENTE` trae `cantidad`). */
const AL_PIE = new Set(["EFECTIVO_INSUFICIENTE", "CANTIDAD_INSUFICIENTE"]);

const OPCIONES_CLASE = [
  { valor: "compra", rotulo: "Compra · sale del efectivo" },
  { valor: "venta", rotulo: "Venta · entra al efectivo" },
  { valor: "inicial", rotulo: "Ya lo tenía · no mueve efectivo" },
] as const satisfies readonly { valor: ClaseOperacion; rotulo: string }[];

const ROTULO_TOTAL: Record<ClaseOperacion, string> = { compra: "Total pagado", venta: "Total recibido", inicial: "Costo total" };
const VERBO: Record<ClaseOperacion, string> = { compra: "Registrar compra", venta: "Registrar venta", inicial: "Registrar posición" };

/** «US$ 498,72 por unidad · comisión incluida», con cantidad y total válidos; si no, `null`. */
function textoPorUnidad(cantidad: string, total: string, moneda: Moneda): string | null {
  const c = aCantidad(cantidad);
  const t = aMenores(total, moneda);
  if (c === null || t === null || t === "0") return null;
  return `${enMoneda(precioPorUnidad(BigInt(t), c), moneda)} por unidad · comisión incluida`;
}

/** Errores locales antes de enviar: cantidad y total. */
function validar(cantidad: string, total: string, moneda: Moneda): Errores {
  const errores: Errores = {};
  if (aCantidad(cantidad) === null) errores.cantidad = MENSAJE_CANTIDAD;
  const t = aMenores(total, moneda);
  if (t === null || t === "0") errores.total = mensajeMonto(moneda);
  return errores;
}

/**
 * Panel de operación (N-43, N-48, N-49, N-56 a N-59, N-64, N-65), abierto por
 * URL. Alta: Compra, Venta o Ya lo tenía, con el símbolo (en venta, solo los
 * de posiciones abiertas), la búsqueda al salir del campo (una vez por
 * símbolo, nunca si ya está en la cuenta ni en COP), el precio por unidad
 * derivado y la fecha. Edición: cantidad, total y fecha, y «Eliminar
 * operación». Los errores de línea de tiempo van al pie.
 */
export function PanelOperacion({ detalle, operaciones, operacion, acciones, alCerrar }: Props) {
  const router = useRouter();
  const panel = useRef<ControlPanel>(null);
  const { moneda } = detalle;
  const esEdicion = operacion !== null;

  const [alta, setAlta] = useState<ValoresOperacion>(() => VALORES_OPERACION(detalle.fechaHoy));
  const [inicialesEdicion] = useState<ValoresEdicionOperacion | null>(() => (operacion ? valoresEdicion(operacion, moneda) : null));
  const [edicion, setEdicion] = useState<ValoresEdicionOperacion | null>(inicialesEdicion);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [errorBorrado, setErrorBorrado] = useState<string | null>(null);
  const [accion, setAccion] = useState<"guardar" | "eliminar" | null>(null);
  const [pendiente, iniciar] = useTransition();

  /** Búsquedas hechas, por símbolo normalizado: cada una gasta un crédito del proveedor. */
  const [busquedas, setBusquedas] = useState<Record<string, BusquedaActivo | "buscando" | "error">>({});
  /** El nombre lo puso la búsqueda: si cambia el símbolo, se quita. */
  const nombreAutomatico = useRef(false);

  const simbolo = normalizarSimbolo(alta.simbolo);
  const enCuenta = activoEnCuenta(simbolo, detalle.posiciones, operaciones);
  const abiertas = detalle.posiciones;
  const posicionVendida = alta.clase === "venta" ? abiertas.find((p) => p.simbolo === simbolo) ?? null : null;
  const busqueda = busquedas[simbolo];

  const conCambios = esEdicion
    ? inicialesEdicion !== null && edicion !== null && cambioOperacion(inicialesEdicion, edicion, moneda) !== null
    : alta.simbolo !== "" || alta.nombre !== "" || alta.cantidad !== "" || alta.total !== "" || alta.fecha !== detalle.fechaHoy || alta.clase !== "compra";

  async function cerrar() {
    await panel.current?.cerrar();
    if (alCerrar) alCerrar();
    else router.replace(rutaInversion(detalle.id), { scroll: false });
  }

  function solicitarCierre() {
    if (pendiente) return;
    if (conCambios) setConfirmandoDescarte(true);
    else void cerrar();
  }

  function limpiar(campo: CampoOperacion) {
    setErrores((actual) => (actual[campo] ? { ...actual, [campo]: undefined } : actual));
    setErrorGeneral(null);
  }

  function cambiarAlta<C extends keyof ValoresOperacion>(campo: C, valor: ValoresOperacion[C]) {
    setAlta((actual) => {
      const nuevos = { ...actual, [campo]: valor };
      if (campo === "simbolo" && nombreAutomatico.current && normalizarSimbolo(String(valor)) !== normalizarSimbolo(actual.simbolo)) {
        nuevos.nombre = "";
        nombreAutomatico.current = false;
      }
      // En venta el símbolo sale de los chips: uno que no está abierto se descarta.
      if (campo === "clase" && valor === "venta" && !abiertas.some((p) => p.simbolo === normalizarSimbolo(actual.simbolo))) {
        nuevos.simbolo = "";
      }
      return nuevos;
    });
    if (campo === "nombre") nombreAutomatico.current = false;
    limpiar(campo);
  }

  function cambiarEdicion<C extends keyof ValoresEdicionOperacion>(campo: C, valor: ValoresEdicionOperacion[C]) {
    setEdicion((actual) => (actual ? { ...actual, [campo]: valor } : actual));
    limpiar(campo);
  }

  /** Al salir del campo: busca el símbolo si es válido, nuevo en la cuenta, en USD y aún no buscado. */
  async function alSalirDelSimbolo(valor = alta.simbolo) {
    const buscado = normalizarSimbolo(valor);
    if (buscado !== valor) setAlta((actual) => ({ ...actual, simbolo: buscado }));
    if (moneda !== "USD" || !simboloValido(buscado) || busquedas[buscado] !== undefined) return;
    if (activoEnCuenta(buscado, detalle.posiciones, operaciones)) return;

    setBusquedas((actual) => ({ ...actual, [buscado]: "buscando" }));
    const resultado = await acciones.buscar(detalle.id, buscado);
    setBusquedas((actual) => ({ ...actual, [buscado]: resultado.ok ? resultado.busqueda : "error" }));
    if (resultado.ok && resultado.busqueda.cubierto && resultado.busqueda.nombre) {
      const nombre = resultado.busqueda.nombre;
      setAlta((actual) => {
        if (normalizarSimbolo(actual.simbolo) !== buscado || actual.nombre.trim() !== "") return actual;
        nombreAutomatico.current = true;
        return { ...actual, nombre };
      });
    }
  }

  function elegirChip(simboloChip: string) {
    cambiarAlta("simbolo", simboloChip);
    void alSalirDelSimbolo(simboloChip);
  }

  function mostrarFallo(resultado: Fallo<CampoOperacion>) {
    if (resultado.campo && !AL_PIE.has(resultado.codigo)) setErrores({ [resultado.campo]: resultado.mensaje });
    else setErrorGeneral(resultado.mensaje);
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente) return;
    setErrorGeneral(null);
    setConfirmandoDescarte(false);

    if (esEdicion) {
      if (!edicion || !inicialesEdicion || !operacion) return;
      const operacionId = operacion.id;
      const locales = validar(edicion.cantidad, edicion.total, moneda);
      if (edicion.fecha === "") locales.fecha = "Elige una fecha.";
      const cambio = cambioOperacion(inicialesEdicion, edicion, moneda);
      if (Object.keys(locales).length > 0 || cambio === "invalido") {
        setErrores(locales);
        return;
      }
      if (cambio === null) return;
      setErrores({});
      setAccion("guardar");
      iniciar(async () => {
        const resultado = await acciones.editar(detalle.id, operacionId, cambio);
        if (resultado.ok) await cerrar();
        else mostrarFallo(resultado);
        setAccion(null);
      });
      return;
    }

    const locales = validar(alta.cantidad, alta.total, moneda);
    const cuerpo = cuerpoOperacion(alta, moneda, enCuenta !== null);
    if (Object.keys(locales).length > 0 || cuerpo === null) {
      setErrores(locales);
      return;
    }
    setErrores({});
    setAccion("guardar");
    iniciar(async () => {
      const resultado = await acciones.registrar(detalle.id, cuerpo);
      if (resultado.ok) await cerrar();
      else mostrarFallo(resultado);
      setAccion(null);
    });
  }

  function eliminar() {
    if (!operacion || pendiente) return;
    setErrorBorrado(null);
    setAccion("eliminar");
    iniciar(async () => {
      const resultado = await acciones.eliminar(detalle.id, operacion.id);
      if (resultado.ok) await cerrar();
      else setErrorBorrado(resultado.mensaje);
      setAccion(null);
    });
  }

  /* ── Nota del símbolo ─────────────────────────────────────────────── */

  let notaSimbolo: string | null = null;
  if (enCuenta) notaSimbolo = `${enCuenta.nombre} · ya está en la cuenta`;
  else if (simbolo !== "" && simboloValido(simbolo)) {
    if (moneda === "COP") notaSimbolo = "El precio será manual. Escribe el nombre.";
    else if (busqueda === "buscando") notaSimbolo = "Buscando…";
    else if (busqueda === "error" || (busqueda && !busqueda.proveedorDisponible))
      notaSimbolo = "Sin proveedor de precios: el precio será manual. Escribe el nombre.";
    else if (busqueda && busqueda.cubierto) notaSimbolo = `${busqueda.nombre ?? simbolo} · precio automático`;
    else if (busqueda) notaSimbolo = "No lo encontramos: el precio será manual. Escribe el nombre.";
  }
  const pideNombre = !enCuenta && simbolo !== "";

  /* ── Pie ──────────────────────────────────────────────────────────── */

  const sinCambios = esEdicion && !conCambios;
  const etiquetaEnviar =
    accion === "guardar" ? (esEdicion ? "Guardando…" : "Registrando…") : esEdicion ? "Guardar cambios" : VERBO[alta.clase];

  const pie = (
    <div className="flex flex-col gap-3">
      {confirmandoDescarte ? (
        <ConfirmarDescarte alDescartar={() => void cerrar()} alSeguir={() => setConfirmandoDescarte(false)} />
      ) : (
        <Boton type="submit" form="formulario-operacion" disabled={pendiente || sinCambios} className="w-full justify-center">
          {etiquetaEnviar}
        </Boton>
      )}
      {errorGeneral && <MensajeError mensaje={errorGeneral} />}
      {esEdicion && !confirmandoDescarte && (
        <div className="mt-2 border-t border-linea pt-4">
          {confirmandoBorrado ? (
            <BloqueEliminar
              nombre="operación"
              detalle="La posición y el efectivo quedan como si no hubiera existido. No se puede deshacer."
              alConfirmar={eliminar}
              alCancelar={() => {
                setConfirmandoBorrado(false);
                setErrorBorrado(null);
              }}
              pendiente={accion === "eliminar"}
              error={errorBorrado}
            />
          ) : (
            <PedirEliminar onClick={() => setConfirmandoBorrado(true)} disabled={pendiente}>
              Eliminar operación…
            </PedirEliminar>
          )}
        </div>
      )}
    </div>
  );

  const valoresCifras = esEdicion && edicion ? edicion : alta;
  const porUnidad = textoPorUnidad(valoresCifras.cantidad, valoresCifras.total, moneda);
  const clase: ClaseOperacion = operacion?.clase ?? alta.clase;

  return (
    <PanelLateral
      ref={panel}
      titulo={esEdicion ? "Editar operación" : `Registrar operación · ${detalle.nombre}`}
      ancho="amplio"
      alSolicitarCierre={solicitarCierre}
      pie={pie}
    >
      <form id="formulario-operacion" onSubmit={enviar} noValidate className="flex flex-col gap-6">
        {operacion ? (
          <p className="text-etiqueta font-normal text-secundario">
            {ROTULO_CLASE[operacion.clase]} · {operacion.activo.simbolo} · {operacion.activo.nombre}
          </p>
        ) : (
          <>
            <OpcionUnica
              nombre="clase"
              etiqueta="Operación"
              opciones={OPCIONES_CLASE}
              valor={alta.clase}
              alCambiar={(c) => cambiarAlta("clase", c)}
              error={errores.clase}
            />

            <div className="flex flex-col gap-2">
              {alta.clase === "venta" ? (
                <span className="text-etiqueta font-normal text-secundario">Símbolo</span>
              ) : (
                <CampoSubrayado
                  etiqueta="Símbolo"
                  name="simbolo"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={MAX_SIMBOLO}
                  value={alta.simbolo}
                  onChange={(e) => cambiarAlta("simbolo", e.target.value.toUpperCase())}
                  onBlur={() => void alSalirDelSimbolo()}
                  error={errores.simbolo}
                  className="font-mono uppercase"
                  placeholder="VOO"
                />
              )}
              {abiertas.length > 0 && (
                <div role="group" aria-label="Posiciones abiertas" className="flex flex-wrap gap-2">
                  {abiertas.map((p) => (
                    <ChipCategoria key={p.activoId} etiqueta={p.simbolo} seleccionada={p.simbolo === simbolo} onClick={() => elegirChip(p.simbolo)} />
                  ))}
                </div>
              )}
              {alta.clase === "venta" && abiertas.length === 0 && (
                <p className="text-etiqueta font-normal text-secundario">No hay posiciones abiertas para vender.</p>
              )}
              {alta.clase === "venta" && errores.simbolo && <MensajeError mensaje={errores.simbolo} />}
              {notaSimbolo && <p className="text-etiqueta font-normal text-secundario">{notaSimbolo}</p>}
            </div>

            {pideNombre && (
              <CampoSubrayado
                etiqueta="Nombre"
                name="nombre"
                autoComplete="off"
                maxLength={MAX_NOMBRE_ACTIVO}
                value={alta.nombre}
                onChange={(e) => cambiarAlta("nombre", e.target.value)}
                error={errores.nombre}
                placeholder="Microsoft Corporation"
              />
            )}
          </>
        )}

        <CampoSubrayado
          etiqueta="Cantidad"
          name="cantidad"
          autoComplete="off"
          inputMode="decimal"
          value={valoresCifras.cantidad}
          onChange={(e) => (esEdicion ? cambiarEdicion("cantidad", e.target.value) : cambiarAlta("cantidad", e.target.value))}
          error={errores.cantidad}
          className="font-mono tabular-nums"
          placeholder="0"
          extra={
            posicionVendida && (
              <span className="font-mono tabular-nums">Tienes {formatearCantidadCorta(posicionVendida.cantidad)}</span>
            )
          }
        />

        <CampoMonto
          valor={valoresCifras.total}
          moneda={moneda}
          etiqueta={ROTULO_TOTAL[clase]}
          editable={{
            nombre: "operacion-total",
            alCambiar: (v) => (esEdicion ? cambiarEdicion("total", v) : cambiarAlta("total", v)),
            error: errores.total,
            nota: porUnidad ?? undefined,
          }}
        />

        <CampoFecha
          etiqueta="Fecha"
          hoy={detalle.fechaHoy}
          max={detalle.fechaHoy}
          valor={valoresCifras.fecha}
          alCambiar={(fecha) => {
            if (esEdicion) cambiarEdicion("fecha", fecha);
            else cambiarAlta("fecha", fecha);
          }}
          error={errores.fecha}
        />

        {!esEdicion && alta.clase === "compra" && (
          <p className="text-etiqueta font-normal text-secundario">
            Efectivo disponible <span className="font-mono tabular-nums">{enMoneda(detalle.efectivo, moneda)}</span>
          </p>
        )}
      </form>
    </PanelLateral>
  );
}
