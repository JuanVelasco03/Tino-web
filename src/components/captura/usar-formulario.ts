"use client";

import { useEffect, useRef, useState } from "react";
import { admiteGastoIngreso, type TipoCuenta } from "@/domain/cuenta/naturaleza";
import { cambiarMonedaEntrada, desdeMonto, formatearEntradaPesos } from "@/domain/dinero/entrada";
import type { Moneda } from "@/domain/dinero/formato";
import { tasaImplicita } from "@/domain/dinero/tasa";
import {
  categoriaEfectiva,
  montoValido,
  requiereMontoDestino,
  type CampoCaptura,
  type Categoria,
  type DecisionCategoria,
  type Propuesta,
  type TipoCaptura as TipoMovimiento,
  type ValoresCaptura,
  type ValorParte,
} from "@/domain/movimiento/cuerpo";
import { errorPartes, restante } from "@/domain/movimiento/partes";
import type { ResultadoSugerencias, Sugerencias } from "@/services/captura";

/** Rol de una cuenta en el movimiento: de dónde sale o a dónde entra el dinero. */
export type RolCuenta = "cuenta" | "destino";

export type Errores = Partial<Record<CampoCaptura, string>>;

/** Respuesta de `/sugerencias` con lo que se pidió, para saber si sigue vigente. */
type SugerenciasPara = { tipo: TipoMovimiento; texto: string; datos: Sugerencias };

/** Espera tras la última tecla antes de pedir sugerencias. */
const ESPERA_SUGERENCIAS_MS = 150;
/** Largo máximo de `texto` en `GET /sugerencias` y de la descripción. */
export const MAX_DESCRIPCION = 80;
export const MAX_NOTA = 500;

/** Sin mayúsculas ni tildes, como compara la API («cafe» = «Café»). */
export function normalizar(texto: string): string {
  return texto.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

type Opciones = {
  sugerir: (tipo: TipoMovimiento, texto: string) => Promise<ResultadoSugerencias>;
  /** Valores con los que arranca (vacíos en la captura; los del movimiento en la edición). */
  iniciales: ValoresCaptura;
  /** Categorías por tipo (`GET /captura`), o `null` mientras carga. */
  categoriasPorTipo: { gasto: readonly Categoria[]; ingreso: readonly Categoria[] } | null;
  /** Cuentas del formulario: su tipo y su moneda deciden qué se ofrece y en qué moneda va cada monto. */
  cuentas?: readonly { id: string; tipo: TipoCuenta; moneda: Moneda }[];
};

/**
 * Núcleo del formulario de movimiento, común a la captura (registro) y a la
 * edición: valores, sugerencias y categoría propuesta (RN-11), partes y
 * errores. Cada modo monta su propia instancia: editar no toca el borrador
 * de la captura.
 */
export function useFormulario({ sugerir, iniciales, categoriasPorTipo, cuentas = [] }: Opciones) {
  const [valores, setValores] = useState<ValoresCaptura>(iniciales);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [sugerencias, setSugerencias] = useState<SugerenciasPara | null>(null);

  const secuenciaSugerencias = useRef(0);
  const esperaSugerencias = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (esperaSugerencias.current) clearTimeout(esperaSugerencias.current);
    },
    [],
  );

  /* ── Sugerencias ───────────────────────────────────────────────────── */

  function cancelarEspera() {
    if (esperaSugerencias.current) clearTimeout(esperaSugerencias.current);
    esperaSugerencias.current = null;
  }

  /** Pide sugerencias; solo se aplica la última respuesta (número de secuencia). */
  async function pedirSugerencias(tipo: TipoMovimiento, texto: string): Promise<Sugerencias | null> {
    const secuencia = ++secuenciaSugerencias.current;
    if (texto.trim() === "" || texto.length > MAX_DESCRIPCION) {
      setSugerencias(null);
      return null;
    }
    const resultado = await sugerir(tipo, texto);
    if (secuencia !== secuenciaSugerencias.current || !resultado.ok) return null;
    setSugerencias({ tipo, texto, datos: resultado.sugerencias });
    return resultado.sugerencias;
  }

  function programarSugerencias(tipo: TipoMovimiento, texto: string) {
    cancelarEspera();
    if (texto.trim() === "") {
      olvidarSugerencias();
      return;
    }
    esperaSugerencias.current = setTimeout(() => void pedirSugerencias(tipo, texto), ESPERA_SUGERENCIAS_MS);
  }

  /** Descarta las sugerencias y cualquier respuesta en camino. */
  function olvidarSugerencias() {
    secuenciaSugerencias.current++;
    setSugerencias(null);
  }

  /* ── Edición de valores ────────────────────────────────────────────── */

  function limpiarError(campo: CampoCaptura) {
    setErrores((actual) => (actual[campo] ? { ...actual, [campo]: undefined } : actual));
    setErrorGeneral(null);
  }

  function limpiarErrores() {
    setErrores({});
    setErrorGeneral(null);
  }

  /** El `mensaje` bajo su campo o, sin campo, al pie del formulario. Se conserva lo escrito. */
  function mostrarFallo(resultado: { mensaje: string; campo?: CampoCaptura }) {
    if (resultado.campo) setErrores({ [resultado.campo]: resultado.mensaje });
    else setErrorGeneral(resultado.mensaje);
  }

  /* ── Monedas (SPEC 10) ─────────────────────────────────────────────── */

  const monedaDe = (id: string | null): Moneda | null => cuentas.find((c) => c.id === id)?.moneda ?? null;

  /** Moneda del monto principal: la del origen en una transferencia; en un gasto o un ingreso, pesos. */
  function monedaMontoPara(v: Pick<ValoresCaptura, "tipo" | "cuentaId">): Moneda {
    return v.tipo === "transferencia" ? (monedaDe(v.cuentaId) ?? "COP") : "COP";
  }

  const monedaMonto = monedaMontoPara(valores);
  const monedaDestino = valores.tipo === "transferencia" ? monedaDe(valores.destinoId) : null;
  /** «Llegó»: transferencia entre monedas distintas. */
  const conMontoDestino = valores.tipo === "transferencia" && requiereMontoDestino(monedaMonto, monedaDestino);

  function cambiar<C extends "monto" | "montoDestino" | "cuentaId" | "destinoId" | "fecha" | "nota">(campo: C, valor: ValoresCaptura[C]) {
    setValores((actual) => {
      const nuevos = { ...actual, [campo]: valor };
      // Otra moneda en el origen o el destino: lo tecleado conserva su parte entera y se reformatea.
      if (campo === "cuentaId") {
        const antes = monedaMontoPara(actual);
        const despues = monedaMontoPara(nuevos);
        if (antes !== despues) nuevos.monto = cambiarMonedaEntrada(actual.monto, despues);
      }
      if (campo === "destinoId") {
        const antes = monedaDe(actual.destinoId);
        const despues = monedaDe(valor as string | null);
        if (despues !== null && antes !== despues) nuevos.montoDestino = cambiarMonedaEntrada(actual.montoDestino, despues);
      }
      return nuevos;
    });
    limpiarError(campo === "cuentaId" ? "cuenta" : campo === "destinoId" ? "destino" : campo);
  }

  function cambiarTipo(tipo: TipoMovimiento) {
    if (tipo === valores.tipo) return;
    // La categoría y las partes son del tipo: al cambiarlo, vuelve a valer la propuesta y las partes se descartan.
    // Un gasto o un ingreso no admite una inversión (`CUENTA_DE_INVERSION`) y va en pesos.
    setValores((actual) => {
      const cuenta = cuentas.find((c) => c.id === actual.cuentaId);
      const sinInversion = tipo !== "transferencia" && cuenta !== undefined && !admiteGastoIngreso(cuenta.tipo);
      const nuevos: ValoresCaptura = { ...actual, tipo, categoria: { modo: "propuesta" }, partes: null };
      if (sinInversion) nuevos.cuentaId = null;
      const antes = monedaMontoPara(actual);
      const despues = monedaMontoPara(nuevos);
      if (antes !== despues) nuevos.monto = cambiarMonedaEntrada(actual.monto, despues);
      return nuevos;
    });
    limpiarErrores();
    cancelarEspera();
    void pedirSugerencias(tipo, valores.descripcion);
  }

  function cambiarDescripcion(descripcion: string) {
    setValores((actual) => ({
      ...actual,
      descripcion,
      // Quitar la propuesta era sobre otro texto: con uno nuevo vuelve a proponer.
      categoria: actual.categoria.modo === "quitada" ? { modo: "propuesta" } : actual.categoria,
    }));
    limpiarError("descripcion");
    programarSugerencias(valores.tipo, descripcion);
  }

  /** Acepta un concepto (Tab, clic o chip): completa la descripción y propone su categoría. */
  function aceptarConcepto(descripcion: string) {
    cambiarDescripcion(descripcion);
    cancelarEspera();
    void pedirSugerencias(valores.tipo, descripcion);
  }

  /** Respuesta de sugerencias para el tipo actual; la última, aunque el texto siga cambiando. */
  const vigentes = sugerencias && sugerencias.tipo === valores.tipo && valores.descripcion.trim() !== "" ? sugerencias.datos : null;
  const propuesta: Propuesta | null = valores.tipo === "transferencia" ? null : (vigentes?.propuesta ?? null);
  const conceptos = vigentes?.conceptos ?? [];

  /** Texto fantasma: lo que falta del primer concepto si empieza por lo escrito. */
  const primero = conceptos[0];
  const fantasma =
    primero && normalizar(primero.descripcion).startsWith(normalizar(valores.descripcion))
      ? primero.descripcion.slice(valores.descripcion.length)
      : "";

  /** Toca un chip de categoría: elige, cambia o quita (la propuesta o la elegida). */
  function tocarCategoria(id: string) {
    const actual = valores.categoria;
    const esPropuesta = actual.modo === "propuesta" && propuesta?.categoria.id === id;
    const esElegida = actual.modo === "elegida" && actual.id === id;
    const siguiente: DecisionCategoria = esPropuesta || esElegida ? { modo: "quitada" } : { modo: "elegida", id };
    setValores((v) => ({ ...v, categoria: siguiente }));
    limpiarError("categoria");
  }

  /**
   * Propuesta con la que se envía: la de la descripción final, no la de una
   * tecla anterior. Con `forzar` la pide aunque la categoría no dependa de
   * ella (la edición la necesita para ofrecer ajustar la regla).
   */
  async function propuestaPara(enviados: ValoresCaptura, forzar: boolean): Promise<Propuesta | null> {
    const conTexto = enviados.descripcion.trim() !== "" && enviados.tipo !== "transferencia";
    if (!conTexto) return null;
    const alDia = sugerencias?.tipo === enviados.tipo && sugerencias.texto === enviados.descripcion;
    if (alDia || (!forzar && enviados.categoria.modo !== "propuesta")) return propuesta;
    cancelarEspera();
    return (await pedirSugerencias(enviados.tipo, enviados.descripcion))?.propuesta ?? null;
  }

  /* ── Monto ─────────────────────────────────────────────────────────── */

  const montoDigitos = montoValido(valores.monto, monedaMonto);
  const montoNumero = montoDigitos === null ? null : BigInt(montoDigitos);
  const destinoDigitos = conMontoDestino && monedaDestino ? montoValido(valores.montoDestino, monedaDestino) : null;
  const montoDestinoNumero = destinoDigitos === null ? null : BigInt(destinoDigitos);

  /** Tasa implícita de vista previa (centésimas): pesos ÷ dólares, con los dos montos válidos. La que vale la congela la API. */
  let tasaVistaPrevia: bigint | null = null;
  if (conMontoDestino && montoNumero !== null && montoDestinoNumero !== null) {
    const [pesos, centavos] = monedaMonto === "COP" ? [montoNumero, montoDestinoNumero] : [montoDestinoNumero, montoNumero];
    tasaVistaPrevia = tasaImplicita(pesos, centavos);
  }
  /** ¿Se puede enviar lo tecleado? Entre monedas, también «Llegó». */
  const montosValidos = montoNumero !== null && (!conMontoDestino || montoDestinoNumero !== null);
  const monedas = { origen: monedaMonto, destino: monedaDestino };

  /* ── Partes (N-41, N-42, N-43) ─────────────────────────────────────── */

  /** Dos partes: la primera con la categoría efectiva y sin monto. Nunca en transferencia. */
  function activarPartes() {
    if (valores.tipo === "transferencia") return;
    const efectiva = categoriaEfectiva(valores, propuesta);
    setValores((v) => ({
      ...v,
      partes: [
        { categoriaId: efectiva, monto: "" },
        { categoriaId: null, monto: "" },
      ],
    }));
    limpiarError("partes");
  }

  function desactivarPartes() {
    setValores((v) => ({ ...v, partes: null }));
    limpiarError("partes");
  }

  function agregarParte() {
    setValores((v) => (v.partes ? { ...v, partes: [...v.partes, { categoriaId: null, monto: "" }] } : v));
    limpiarError("partes");
  }

  /** Desde dos partes no se quita ninguna. */
  function quitarParte(indice: number) {
    setValores((v) => (v.partes && v.partes.length > 2 ? { ...v, partes: v.partes.filter((_, i) => i !== indice) } : v));
    limpiarError("partes");
  }

  /** Cambia la categoría o el monto de una parte; el monto se formatea al teclear. */
  function cambiarParte(indice: number, cambios: Partial<ValorParte>) {
    const formateados = cambios.monto === undefined ? cambios : { ...cambios, monto: formatearEntradaPesos(cambios.monto) };
    setValores((v) => (v.partes ? { ...v, partes: v.partes.map((p, i) => (i === indice ? { ...p, ...formateados } : p)) } : v));
    limpiarError("partes");
  }

  /** «El resto»: la última parte toma lo que falta para el total, si es mayor que cero. */
  function completarResto() {
    setValores((v) => {
      const total = montoValido(v.monto, monedaMontoPara(v));
      if (!v.partes || total === null) return v;
      const resto = restante(BigInt(total), v.partes.slice(0, -1));
      if (resto <= 0n) return v;
      return { ...v, partes: v.partes.map((p, i, todas) => (i === todas.length - 1 ? { ...p, monto: desdeMonto(resto) } : p)) };
    });
    limpiarError("partes");
  }

  const total = montoNumero ?? 0n;
  const restantePartes = valores.partes ? restante(total, valores.partes) : null;
  const errorDePartes = valores.partes ? errorPartes(total, valores.partes) : null;

  const categorias: readonly Categoria[] =
    categoriasPorTipo && valores.tipo !== "transferencia" ? categoriasPorTipo[valores.tipo] : [];

  return {
    valores,
    setValores,
    errores,
    errorGeneral,
    limpiarErrores,
    mostrarFallo,
    cambiar,
    cambiarTipo,
    cambiarDescripcion,
    aceptarConcepto,
    tocarCategoria,
    categorias,
    propuesta,
    conceptos,
    fantasma,
    olvidarSugerencias,
    propuestaPara,
    montoNumero,
    monedaMonto,
    monedaDestino,
    conMontoDestino,
    montoDestinoNumero,
    tasaVistaPrevia,
    montosValidos,
    monedas,
    activarPartes,
    desactivarPartes,
    agregarParte,
    quitarParte,
    cambiarParte,
    completarResto,
    restantePartes,
    errorDePartes,
  };
}

export type NucleoFormulario = ReturnType<typeof useFormulario>;
