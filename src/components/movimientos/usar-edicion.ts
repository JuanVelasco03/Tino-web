"use client";

import { useEffect, useRef, useState } from "react";
import { ofertaDeRegla, type Oferta } from "@/domain/categorizacion/oferta";
import { mesDeFecha } from "@/domain/fecha/formato";
import { cuerpoDesdeValores, type Categoria } from "@/domain/movimiento/cuerpo";
import { cuentaArchivada, cuentaDePrestamo, hayCambios, valoresDesdeMovimiento } from "@/domain/movimiento/edicion";
import type { DatosCaptura, ResultadoSugerencias } from "@/services/captura";
import type {
  Movimiento,
  MovimientoCuerpo,
  ResultadoGuardado,
  ResultadoSimple,
  TipoMovimiento,
} from "@/services/movimientos";
import { PLAZO_AVISO_MS, type EstadoOferta } from "../captura/usar-captura";
import { useFormulario } from "../captura/usar-formulario";

/** Server actions; llegan por prop desde la página (los componentes no importan `app/`). */
export type AccionesEdicion = {
  guardar: (id: string, cuerpo: MovimientoCuerpo) => Promise<ResultadoGuardado>;
  eliminar: (id: string) => Promise<ResultadoSimple>;
  sugerir: (tipo: TipoMovimiento, texto: string) => Promise<ResultadoSugerencias>;
  crearRegla: (palabraClave: string, categoriaId: string) => Promise<ResultadoSimple>;
  ajustarRegla: (id: string, categoriaId: string) => Promise<ResultadoSimple>;
};

/** Un préstamo como lo necesita la edición: su cuenta, su nombre y su sentido. */
export type PrestamoDeEdicion = { id: string; nombre: string; tipo: "prestamo_otorgado" | "deuda_contraida" };

/** Lo que pasó al cerrar la edición, para el aviso del libro. */
export type ResultadoEdicion =
  | {
      tipo: "guardado";
      movimiento: Movimiento;
      /** `"YYYY-MM"` si la nueva fecha lo sacó del mes listado. */
      mesNuevo: string | null;
      oferta: Oferta | null;
    }
  | { tipo: "eliminado"; movimiento: Movimiento };

type Opciones = {
  movimiento: Movimiento;
  /** `GET /captura` y `GET /cuentas`, cargados con la página. */
  datos: DatosCaptura;
  /** `"YYYY-MM"` del mes listado. */
  mes: string;
  /**
   * Los préstamos (`GET /prestamos`): sus cuentas no están entre las activas,
   * pero no están archivadas. La del movimiento queda fija y el tipo, bloqueado.
   */
  prestamos?: readonly PrestamoDeEdicion[];
  acciones: AccionesEdicion;
  /** Guardado o eliminado: el libro muestra el aviso mientras la hoja se retira. */
  alTerminar: (resultado: ResultadoEdicion) => void;
  /** Quita `?movimiento=` de la URL (la presentación ya retiró la hoja). */
  alCerrar: () => void;
};

/**
 * La edición de un movimiento (modo edición): una instancia propia del núcleo
 * del formulario, precargada con el movimiento entero. Guardar envía un `PUT`
 * con el cuerpo completo; cerrar con cambios pregunta antes de descartar; con
 * una cuenta archivada queda en solo lectura (N-36).
 */
export function useEdicion({ movimiento, datos, mes, prestamos = [], acciones, alTerminar, alCerrar }: Opciones) {
  const [iniciales] = useState(() => valoresDesdeMovimiento(movimiento));
  const f = useFormulario({ sugerir: acciones.sugerir, iniciales, categoriasPorTipo: datos.captura.categorias, cuentas: datos.cuentas });
  const { valores } = f;

  const [enviando, setEnviando] = useState(false);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errorBorrado, setErrorBorrado] = useState<string | null>(null);
  const enCurso = useRef(false);

  const soloLectura = cuentaArchivada(movimiento, datos.cuentas, prestamos);
  const [cuentaFija] = useState(() => cuentaDePrestamo(movimiento, prestamos));
  const cambios = hayCambios(iniciales, valores);
  const ocupado = enviando || eliminando;

  /** Escape, «Cerrar» o el velo. Con cambios pregunta; devuelve si se puede cerrar ya. */
  function solicitarCierre(): boolean {
    if (ocupado) return false;
    if (cambios && !soloLectura) {
      setConfirmandoDescarte(true);
      return false;
    }
    return true;
  }

  const puedeEnviar = soloLectura === null && f.montosValidos && f.errorDePartes === null && !ocupado;

  /** `PUT /movimientos/:id`. Devuelve `true` si se guardó (la presentación cierra). */
  async function enviar(): Promise<boolean> {
    if (enCurso.current || !puedeEnviar) return false;
    enCurso.current = true;
    setEnviando(true);
    setConfirmandoDescarte(false);
    f.limpiarErrores();

    const enviados = valores;
    // Siempre la propuesta de la descripción final: decide si se ofrece crear o ajustar la regla.
    const propuestaUsada = await f.propuestaPara(enviados, true);
    const cuerpo = cuerpoDesdeValores(enviados, propuestaUsada, f.monedas);
    const resultado = cuerpo ? await acciones.guardar(movimiento.id, cuerpo) : null;
    enCurso.current = false;
    setEnviando(false);
    if (!resultado) return false;

    if (!resultado.ok) {
      f.mostrarFallo(resultado);
      return false;
    }

    const categorias: readonly Categoria[] = enviados.tipo === "transferencia" ? [] : datos.captura.categorias[enviados.tipo];
    const oferta = ofertaDeRegla({
      tipo: enviados.tipo,
      descripcion: enviados.descripcion,
      categoria: enviados.categoria,
      propuesta: propuestaUsada,
      categorias,
      categoriaAnterior: movimiento.categoria?.id ?? null,
      dividido: enviados.partes !== null,
    });
    const mesGuardado = mesDeFecha(resultado.movimiento.fecha);
    alTerminar({ tipo: "guardado", movimiento: resultado.movimiento, mesNuevo: mesGuardado === mes ? null : mesGuardado, oferta });
    return true;
  }

  /** `DELETE /movimientos/:id` tras la confirmación C26. Devuelve `true` si se eliminó. */
  async function eliminar(): Promise<boolean> {
    if (enCurso.current || soloLectura || ocupado) return false;
    enCurso.current = true;
    setEliminando(true);
    setErrorBorrado(null);
    const resultado = await acciones.eliminar(movimiento.id);
    enCurso.current = false;
    setEliminando(false);
    if (!resultado.ok) {
      setErrorBorrado(resultado.mensaje);
      return false;
    }
    alTerminar({ tipo: "eliminado", movimiento });
    return true;
  }

  return {
    ...f,
    /** Un movimiento de préstamo no cambia de tipo (`MOVIMIENTO_DE_PRESTAMO`). */
    cambiarTipo: cuentaFija ? () => {} : f.cambiarTipo,
    modo: "edicion" as const,
    /** La cuenta del préstamo: se muestra fija en su rol, sin fichas para cambiarla. */
    cuentaFija,
    movimiento,
    cerrar: alCerrar,
    solicitarCierre,
    reintentar: () => {},
    estadoCarga: "lista" as const,
    captura: datos.captura,
    cuentas: datos.cuentas,
    trm: datos.trm ?? null,
    sinCuentas: false,
    cuentaElegida: datos.cuentas.find((c) => c.id === valores.cuentaId) ?? null,
    /** Sin «Usar siempre» en la edición: el rótulo de la cuenta no la menciona. */
    predeterminada: null,
    /** Una cuenta archivada no está entre las activas: su nombre sale del movimiento. */
    nombreCuenta: (id: string | null) =>
      datos.cuentas.find((c) => c.id === id)?.nombre ??
      [movimiento.cuentaOrigen, movimiento.cuentaDestino].find((c) => c !== null && c.id === id)?.nombre ??
      null,
    /** Sin vista previa: el saldo actual ya incluye el movimiento. */
    vistaPrevia: () => null,
    puedeEnviar,
    enviando,
    enviar,
    envios: 0,
    soloLectura,
    confirmandoDescarte,
    seguirEditando: () => setConfirmandoDescarte(false),
    confirmandoBorrado,
    pedirBorrado: () => {
      setConfirmandoDescarte(false);
      setConfirmandoBorrado(true);
    },
    cancelarBorrado: () => {
      setConfirmandoBorrado(false);
      setErrorBorrado(null);
    },
    eliminar,
    eliminando,
    errorBorrado,
  };
}

export type EstadoEdicion = ReturnType<typeof useEdicion>;

/**
 * Aviso «Guardado: …» / «Eliminado: …» sobre la lista durante 5 s, y la oferta
 * de regla tras guardar (sigue hasta que el usuario responde). Vive en el
 * libro: sobrevive al cierre de la edición.
 */
export function useAvisoEdicion(acciones: Pick<AccionesEdicion, "crearRegla" | "ajustarRegla">) {
  const [aviso, setAviso] = useState<ResultadoEdicion | null>(null);
  const [oferta, setOferta] = useState<EstadoOferta | null>(null);
  const plazo = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (plazo.current) clearTimeout(plazo.current);
    },
    [],
  );

  function mostrar(resultado: ResultadoEdicion) {
    if (plazo.current) clearTimeout(plazo.current);
    setAviso(resultado);
    setOferta(resultado.tipo === "guardado" && resultado.oferta ? { oferta: resultado.oferta, pendiente: false, error: null } : null);
    plazo.current = setTimeout(() => {
      plazo.current = null;
      setAviso(null);
    }, PLAZO_AVISO_MS);
  }

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

  return {
    aviso,
    oferta,
    mostrar,
    responderOferta,
    /** La fila recién guardada se resalta mientras dura el aviso. */
    resaltadoId: aviso?.tipo === "guardado" ? aviso.movimiento.id : null,
  };
}
