"use client";

import { useEffect, useRef, useState } from "react";
import { ofertaDeRegla, type Oferta } from "@/domain/categorizacion/oferta";
import type { Sentido } from "@/domain/cuenta/naturaleza";
import { cuerpoDesdeValores, type Categoria } from "@/domain/movimiento/cuerpo";
import { esIniciales, valoresDesdeIniciales, type InicialesCaptura } from "@/domain/movimiento/iniciales";
import { saldoResultante } from "@/domain/movimiento/vista-previa";
import type { Cuenta, DatosCaptura, ResultadoCarga, ResultadoSugerencias } from "@/services/captura";
import type {
  Movimiento,
  MovimientoCuerpo,
  ResultadoRegistro,
  ResultadoSimple,
  ValoresCaptura,
} from "@/services/movimientos";
import type { TipoCaptura as TipoMovimiento } from "@/domain/movimiento/cuerpo";
import type { DatosAviso, DatosOferta } from "./aviso-registro";
import { useFormulario, type RolCuenta } from "./usar-formulario";

export { MAX_DESCRIPCION, MAX_NOTA, normalizar, type RolCuenta } from "./usar-formulario";

/** Server actions; llegan por prop desde el layout (los componentes no importan `app/`). */
export type AccionesCaptura = {
  cargar: () => Promise<ResultadoCarga>;
  sugerir: (tipo: TipoMovimiento, texto: string) => Promise<ResultadoSugerencias>;
  registrar: (cuerpo: MovimientoCuerpo) => Promise<ResultadoRegistro>;
  deshacer: (id: string) => Promise<ResultadoSimple>;
  crearRegla: (palabraClave: string, categoriaId: string) => Promise<ResultadoSimple>;
  ajustarRegla: (id: string, categoriaId: string) => Promise<ResultadoSimple>;
  elegirPredeterminada: (cuentaId: string) => Promise<ResultadoSimple>;
};

type EstadoCarga = "inactiva" | "cargando" | "error" | "lista";

export type Aviso = { movimiento: Movimiento; deshaciendo: boolean; error: string | null };
export type EstadoOferta = { oferta: Oferta; pendiente: boolean; error: string | null };

/** Plazo para deshacer un registro (y del resaltado en la lista). */
export const PLAZO_AVISO_MS = 5000;

const VALORES_INICIALES: ValoresCaptura = {
  tipo: "gasto",
  monto: "",
  montoDestino: "",
  descripcion: "",
  categoria: { modo: "propuesta" },
  cuentaId: null,
  destinoId: null,
  fecha: "",
  nota: "",
  partes: null,
};

function sentidoDe(tipo: TipoMovimiento, rol: RolCuenta): Sentido {
  if (rol === "destino") return "entrada";
  return tipo === "ingreso" ? "entrada" : "salida";
}

/**
 * La captura rápida (modo registro), una sola lógica para sus dos
 * presentaciones (panel en escritorio, hoja en móvil). Vive en el proveedor
 * del layout: cerrar conserva el borrador; registrar lo limpia.
 */
export function useCaptura(acciones: AccionesCaptura) {
  const [abierto, setAbierto] = useState(false);
  const [estadoCarga, setEstadoCarga] = useState<EstadoCarga>("inactiva");
  const [datos, setDatos] = useState<DatosCaptura | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [oferta, setOferta] = useState<EstadoOferta | null>(null);
  const [predeterminada, setPredeterminada] = useState<{ pendiente: boolean; error: string | null }>({ pendiente: false, error: null });
  /** Sube con cada registro: la presentación devuelve el foco al monto. */
  const [envios, setEnvios] = useState(0);

  const f = useFormulario({
    sugerir: acciones.sugerir,
    iniciales: VALORES_INICIALES,
    categoriasPorTipo: datos?.captura.categorias ?? null,
    cuentas: datos?.cuentas,
  });
  const { valores, setValores } = f;

  const secuenciaCarga = useRef(0);
  const plazoAviso = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Bloqueo síncrono: dos Enter seguidos no registran dos veces. */
  const enCurso = useRef(false);

  useEffect(
    () => () => {
      if (plazoAviso.current) clearTimeout(plazoAviso.current);
    },
    [],
  );

  /* ── Carga ─────────────────────────────────────────────────────────── */

  /**
   * `GET /captura` y `GET /cuentas`. La primera vez muestra la carga; después
   * refresca en segundo plano y, si falla, conserva lo que había.
   */
  async function cargar() {
    const secuencia = ++secuenciaCarga.current;
    setEstadoCarga((actual) => (actual === "lista" ? actual : "cargando"));
    const resultado = await acciones.cargar();
    if (secuencia !== secuenciaCarga.current) return;

    if (!resultado.ok) {
      setEstadoCarga((actual) => (actual === "lista" ? actual : "error"));
      return;
    }
    const { captura, cuentas, trm } = resultado;
    setDatos({ captura, cuentas, trm });
    setEstadoCarga("lista");
    setValores((actual) => {
      const existe = (id: string | null) => id !== null && cuentas.some((c) => c.id === id);
      return {
        ...actual,
        cuentaId: existe(actual.cuentaId) ? actual.cuentaId : captura.cuentaPredeterminadaId,
        destinoId: existe(actual.destinoId) ? actual.destinoId : null,
        fecha: actual.fecha === "" ? captura.fechaHoy : actual.fecha,
      };
    });
  }

  /**
   * Abre la captura. Con `iniciales` (SPEC 13, «Registrar pago»), prellenada:
   * tipo «Transferencia», las cuentas y el monto puestos; la fecha, hoy. Una
   * cuenta que no está entre las de la captura se ignora. Llega también como
   * manejador de clic: un evento no son iniciales.
   */
  function abrir(iniciales?: InicialesCaptura) {
    if (esIniciales(iniciales)) {
      setValores((actual) => valoresDesdeIniciales(actual, iniciales, datos?.cuentas ?? null));
      f.olvidarSugerencias();
      f.limpiarErrores();
    }
    setAbierto(true);
    void cargar();
  }

  /** La presentación lo llama cuando terminó de retirar la hoja. */
  function cerrar() {
    setAbierto(false);
  }

  /* ── Registro ──────────────────────────────────────────────────────── */

  function mostrarAviso(movimiento: Movimiento) {
    if (plazoAviso.current) clearTimeout(plazoAviso.current);
    setAviso({ movimiento, deshaciendo: false, error: null });
    plazoAviso.current = setTimeout(() => {
      plazoAviso.current = null;
      // Si se está deshaciendo, el aviso espera la respuesta.
      setAviso((a) => (a?.deshaciendo ? a : null));
    }, PLAZO_AVISO_MS);
  }

  const sinCuentas = datos !== null && datos.cuentas.length === 0;
  const puedeEnviar =
    f.montosValidos && f.errorDePartes === null && datos !== null && !sinCuentas && !enviando;

  /** Registra. Devuelve `false`: la captura queda abierta, lista para otro. */
  async function enviar(): Promise<boolean> {
    if (enCurso.current || !puedeEnviar || !datos) return false;
    enCurso.current = true;
    setEnviando(true);
    f.limpiarErrores();

    const enviados = valores;
    const propuestaUsada = await f.propuestaPara(enviados, false);
    const cuerpo = cuerpoDesdeValores(enviados, propuestaUsada, f.monedas);
    const resultado = cuerpo ? await acciones.registrar(cuerpo) : null;
    enCurso.current = false;
    setEnviando(false);
    if (!resultado) return false;

    if (!resultado.ok) {
      f.mostrarFallo(resultado);
      return false;
    }

    const categorias: readonly Categoria[] = enviados.tipo === "transferencia" ? [] : datos.captura.categorias[enviados.tipo];
    const nueva = ofertaDeRegla({
      tipo: enviados.tipo,
      descripcion: enviados.descripcion,
      categoria: enviados.categoria,
      propuesta: propuestaUsada,
      categorias,
      dividido: enviados.partes !== null,
    });
    setOferta(nueva ? { oferta: nueva, pendiente: false, error: null } : null);
    mostrarAviso(resultado.movimiento);

    // Listo para otro: tipo, cuentas y fecha se mantienen.
    setValores((actual) => ({ ...actual, monto: "", montoDestino: "", descripcion: "", categoria: { modo: "propuesta" }, nota: "", partes: null }));
    f.olvidarSugerencias();
    setEnvios((n) => n + 1);
    void cargar(); // saldos, gastos de hoy y frecuentes, en segundo plano
    return false;
  }

  async function deshacer() {
    if (!aviso || aviso.deshaciendo) return;
    const { id } = aviso.movimiento;
    setAviso({ ...aviso, deshaciendo: true, error: null });
    const resultado = await acciones.deshacer(id);
    if (resultado.ok) {
      if (plazoAviso.current) clearTimeout(plazoAviso.current);
      plazoAviso.current = null;
      setAviso(null);
      setOferta(null); // el movimiento ya no existe
      void cargar();
      return;
    }
    // Error (p. ej. `CUENTA_ARCHIVADA`): el aviso lo muestra otros cinco segundos.
    setAviso((a) => (a ? { ...a, deshaciendo: false, error: resultado.mensaje } : a));
    if (plazoAviso.current) clearTimeout(plazoAviso.current);
    plazoAviso.current = setTimeout(() => {
      plazoAviso.current = null;
      setAviso((a) => (a?.deshaciendo ? a : null));
    }, PLAZO_AVISO_MS);
  }

  /** «Crear regla» / «Cambiar regla» o «No» (sin petición). RN-11: nunca sin respuesta del usuario. */
  async function responderOferta(acepta: boolean) {
    if (!oferta || oferta.pendiente) return;
    if (!acepta) {
      setOferta(null);
      return;
    }
    const { oferta: o } = oferta;
    setOferta({ ...oferta, pendiente: true, error: null });
    const resultado =
      o.tipo === "crear" ? await acciones.crearRegla(o.palabraClave, o.categoria.id) : await acciones.ajustarRegla(o.reglaId, o.categoria.id);
    if (resultado.ok) setOferta((actual) => (actual?.oferta === o ? null : actual));
    else setOferta((actual) => (actual?.oferta === o ? { ...actual, pendiente: false, error: resultado.mensaje } : actual));
  }

  /** «Usar {cuenta} siempre»: `PATCH /perfil`. Éxito → recarga la captura (el rótulo cambia). */
  async function elegirPredeterminada(cuentaId: string) {
    if (predeterminada.pendiente) return;
    setPredeterminada({ pendiente: true, error: null });
    const resultado = await acciones.elegirPredeterminada(cuentaId);
    if (!resultado.ok) {
      setPredeterminada({ pendiente: false, error: resultado.mensaje });
      return;
    }
    await cargar();
    setPredeterminada({ pendiente: false, error: null });
  }

  /* ── Derivados para presentar ──────────────────────────────────────── */

  const cuentas: Cuenta[] = datos?.cuentas ?? [];
  const captura = datos?.captura ?? null;

  /**
   * Saldo estimado de la cuenta elegida en ese rol tras el movimiento (solo
   * presentación, RN-02). Una inversión no: su saldo es el valor de mercado en
   * COP y el movimiento solo toca su efectivo. Entre monedas, el destino usa
   * «Llegó».
   */
  function vistaPrevia(cuenta: Cuenta, rol: RolCuenta): bigint | null {
    const elegida = rol === "cuenta" ? valores.cuentaId : valores.destinoId;
    if (cuenta.id !== elegida || cuenta.tipo === "inversion") return null;
    if (rol === "destino" && valores.tipo !== "transferencia") return null;
    const monto = rol === "destino" && f.conMontoDestino ? f.montoDestinoNumero : f.montoNumero;
    if (monto === null) return null;
    return saldoResultante(cuenta, sentidoDe(valores.tipo, rol), monto);
  }

  return {
    ...f,
    modo: "registro" as const,
    abierto,
    abrir,
    cerrar,
    /** En la captura, cerrar nunca pregunta: el borrador se conserva. */
    solicitarCierre: () => true,
    reintentar: () => void cargar(),
    estadoCarga,
    captura,
    cuentas,
    trm: datos?.trm ?? null,
    sinCuentas,
    cuentaElegida: cuentas.find((c) => c.id === valores.cuentaId) ?? null,
    predeterminada: cuentas.find((c) => c.id === captura?.cuentaPredeterminadaId) ?? null,
    nombreCuenta: (id: string | null) => cuentas.find((c) => c.id === id)?.nombre ?? null,
    vistaPrevia,
    puedeEnviar,
    enviando,
    enviar,
    envios,
    aviso,
    deshacer,
    resaltadoId: aviso?.movimiento.id ?? null,
    oferta,
    responderOferta,
    elegirPredeterminada,
    predeterminadaPendiente: predeterminada.pendiente,
    errorPredeterminada: predeterminada.error,
  };
}

export type EstadoCaptura = ReturnType<typeof useCaptura>;

/* ── Aviso y oferta, iguales en panel, hoja y libro ────────────────────── */

/** Cuenta del movimiento como se lee en el aviso: «Nequi» o «Nequi → Visa Oro». */
export function cuentaDe(movimiento: Pick<Movimiento, "tipo" | "cuentaOrigen" | "cuentaDestino">): string {
  const origen = movimiento.cuentaOrigen?.nombre ?? "";
  const destino = movimiento.cuentaDestino?.nombre ?? "";
  if (movimiento.tipo === "transferencia") return `${origen} → ${destino}`;
  // Un ajuste trae una sola cuenta, en el lado en que movió el saldo.
  if (movimiento.tipo === "ajuste") return origen || destino;
  return movimiento.tipo === "gasto" ? origen : destino;
}

export function datosAviso(c: EstadoCaptura): DatosAviso | null {
  if (!c.aviso) return null;
  const { movimiento, deshaciendo, error } = c.aviso;
  return {
    tipo: movimiento.tipo,
    monto: movimiento.monto,
    moneda: movimiento.moneda,
    descripcion: movimiento.descripcion,
    cuenta: cuentaDe(movimiento),
    alDeshacer: () => void c.deshacer(),
    deshaciendo,
    error,
  };
}

/** Pregunta y acción de la oferta de regla (RN-11). */
export function datosDeOferta(
  estado: EstadoOferta | null,
  responder: (acepta: boolean) => void,
): DatosOferta | null {
  if (!estado) return null;
  const { oferta, pendiente, error } = estado;
  const crear = oferta.tipo === "crear";
  return {
    pregunta: crear
      ? `¿Siempre «${oferta.palabraClave}» → ${oferta.categoria.nombre}?`
      : `¿Cambiar la regla «${oferta.palabraClave}» a ${oferta.categoria.nombre}?`,
    accion: crear ? "Crear regla" : "Cambiar regla",
    alAceptar: () => responder(true),
    alRechazar: () => responder(false),
    pendiente,
    error,
  };
}

export function datosOferta(c: EstadoCaptura): DatosOferta | null {
  return datosDeOferta(c.oferta, (acepta) => void c.responderOferta(acepta));
}
