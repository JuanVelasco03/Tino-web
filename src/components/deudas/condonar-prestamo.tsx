"use client";

import { createContext, useContext, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { formatearEntradaPesos } from "@/domain/dinero/entrada";
import { montoCondonacion, vistaPreviaCondonacion, type ModoCondonacion } from "@/domain/prestamo/condonacion";
import { pesos, primerNombre } from "@/domain/prestamo/presentacion";
import type { CondonacionCuerpo, PrestamoDetalle } from "@/domain/prestamo/tipos";
import { Boton } from "../boton";
import { ChipCategoria } from "../chip-categoria";
import { MensajeError } from "../mensaje-error";
import { OpcionUnica } from "../opcion-unica";
import { AvisoBandeja, CifraAviso } from "../recurrentes/bandeja-recurrentes";
import { llamarAccion } from "@/lib/sin-conexion";
import { AccionesPrestamo } from "./detalle-prestamo";
import { RUTA_DEUDAS } from "./rutas";

type Fallo = { ok: false; codigo: string; mensaje: string };

/** El gasto que creó la condonación: lo que el aviso muestra y lo que «Deshacer» borra. */
type Gasto = { id: string; monto: bigint; categoria: { nombre: string } | null };

/** Server actions; llegan por prop desde la página (los componentes no importan `app/`). */
export type AccionCondonar = (id: string, cuerpo: CondonacionCuerpo) => Promise<{ ok: true; movimiento: Gasto } | (Fallo & { campo?: "monto" | "categoria" })>;
export type AccionDeshacer = (movimientoId: string) => Promise<{ ok: true } | Fallo>;

/* ── Avisos de la pantalla ────────────────────────────────────────────── */

/** Condonación (con «Deshacer») o registro de un abono, alta o desembolso (sin él). */
type Aviso = { clave: number; gasto: Gasto; error: string | null } | { clave: number; registro: ReactNode };

type ContextoAviso = {
  aviso: Aviso | null;
  deshaciendo: boolean;
  mostrar: (gasto: Gasto) => void;
  registrado: (texto: ReactNode) => void;
  quitar: () => void;
  deshacer: () => void;
};

const Contexto = createContext<ContextoAviso | null>(null);

const DURACION_AVISO = 5000;

/**
 * Guarda el aviso de condonación fuera del detalle: tras condonar todo, el
 * préstamo pasa a «Saldadas» y la fila de acciones desaparece, pero el aviso
 * y el `id` del gasto siguen aquí (riesgo «Deshacer tras revalidar»).
 */
export function ProveedorAvisoDeudas({ deshacer: accionDeshacer, children }: { deshacer: AccionDeshacer; children: ReactNode }) {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [deshaciendo, setDeshaciendo] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contador = useRef(0);

  function limpiar() {
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = null;
  }

  useEffect(() => limpiar, []);

  function programarCierre(clave: number) {
    limpiar();
    temporizador.current = setTimeout(() => setAviso((a) => (a?.clave === clave ? null : a)), DURACION_AVISO);
  }

  function mostrar(gasto: Gasto) {
    const clave = ++contador.current;
    setAviso({ clave, gasto, error: null });
    programarCierre(clave);
  }

  function registrado(texto: ReactNode) {
    const clave = ++contador.current;
    setAviso({ clave, registro: texto });
    programarCierre(clave);
  }

  function quitar() {
    limpiar();
    setAviso(null);
  }

  function deshacer() {
    if (!aviso || !("gasto" in aviso) || deshaciendo) return;
    const actual = aviso;
    limpiar();
    setDeshaciendo(true);
    void (async () => {
      const resultado = await llamarAccion(() => accionDeshacer(actual.gasto.id));
      setDeshaciendo(false);
      if (resultado.ok) {
        setAviso((a) => (a?.clave === actual.clave ? null : a));
        return;
      }
      // El aviso se queda con el `mensaje` de la API 5 s más.
      setAviso((a) => (a?.clave === actual.clave ? { ...actual, error: resultado.mensaje } : a));
      programarCierre(actual.clave);
    })();
  }

  return <Contexto.Provider value={{ aviso, deshaciendo, mostrar, registrado, quitar, deshacer }}>{children}</Contexto.Provider>;
}

/** Para los paneles: avisar lo registrado. Fuera de `ProveedorAvisoDeudas` (muestras de `/estilos`), nada. */
export function useAvisoRegistro(): (texto: ReactNode) => void {
  const contexto = useContext(Contexto);
  return contexto ? contexto.registrado : () => {};
}

function useAvisoDeudas(): ContextoAviso {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("CondonarPrestamo y AvisoDeudas necesitan ProveedorAvisoDeudas.");
  return contexto;
}

/**
 * «Condonado. Se registró un gasto de 500.000 en Otros.» · «Deshacer», o
 * «Abono registrado: 120.000 · Camila.» sin él. Fila de 44 px; dura 5 s.
 */
export function AvisoDeudas() {
  const { aviso, deshaciendo, deshacer } = useAvisoDeudas();
  if (!aviso) return null;
  // `key`: cada aviso entra con «Asentar», aunque reemplace a uno todavía visible.
  if ("registro" in aviso) {
    return (
      <div key={aviso.clave} className="asentar">
        <AvisoBandeja texto={aviso.registro} />
      </div>
    );
  }
  const { gasto } = aviso;
  return (
    <div key={aviso.clave} className="asentar">
      <AvisoBandeja
        texto={
          <>
            Condonado. Se registró un gasto de <CifraAviso>{pesos(gasto.monto)}</CifraAviso>
            {gasto.categoria ? ` en ${gasto.categoria.nombre}` : ""}.
          </>
        }
        alDeshacer={deshacer}
        deshaciendo={deshaciendo}
        error={aviso.error}
      />
    </div>
  );
}

/* ── Condonar ─────────────────────────────────────────────────────────── */

type Categoria = { id: string; nombre: string };

/** Categorías de gasto (`GET /captura`) y patrimonio neto (`GET /cuentas`). */
export type DatosCondonacion = { categorias: readonly Categoria[]; patrimonioNeto: bigint };
export type AccionDatosCondonacion = () => Promise<{ ok: true; datos: DatosCondonacion } | Fallo>;

type Props = {
  prestamo: Pick<PrestamoDetalle, "id" | "nombre" | "capitalPendiente" | "interesesCausados">;
  /**
   * Pide los datos al abrir el bloque: el detalle no carga cuentas ni categorías
   * para un bloque que casi nunca se abre. Sin `cargar`, se usa `formulario`
   * (muestras de `/estilos`; `null` = no se pudieron cargar).
   */
  cargar?: AccionDatosCondonacion;
  formulario?: DatosCondonacion | null;
  condonar: AccionCondonar;
  /** Abierto al montar (muestras de `/estilos`). */
  abiertoInicial?: boolean;
  /** Valores iniciales para las muestras de `/estilos`. */
  inicial?: { modo: ModoCondonacion; valor: string; categoriaId: string | null };
};

const EXPLICACION = {
  todo: (nombre: string) =>
    `Lo que ${nombre} te debe deja de ser un activo y se registra como un gasto tuyo con fecha de hoy. El préstamo se cierra y su historial se conserva.`,
  parte: () =>
    "La parte que condonas deja de ser un activo y se registra como un gasto tuyo con fecha de hoy. El resto sigue pendiente y sus intereses siguen corriendo.",
} as const;

/**
 * Fila de acciones de un préstamo otorgado con capital y, al pulsar
 * «Condonar lo pendiente…», el bloque que la reemplaza (N-62 a N-72): todo o
 * una parte, categoría de gasto (ninguna elegida), «Qué cambia» con la resta
 * que el contrato asigna al cliente y, al condonar, el aviso con «Deshacer».
 * Se acomoda al ancho de su contenedor (`@container`, el detalle): dos
 * columnas desde 672 px; si no, una, con «Qué cambia» debajo.
 */
/** Última categoría con la que se condonó, en este navegador: sube al principio, sin quedar elegida (RN-11). */
const CLAVE_CATEGORIA = "tino-condonar-categoria";

function leerRecordada(): string | null {
  try {
    return localStorage.getItem(CLAVE_CATEGORIA);
  } catch {
    return null;
  }
}

function recordar(id: string) {
  try {
    localStorage.setItem(CLAVE_CATEGORIA, id);
  } catch {
    // Sin almacenamiento (ventana privada): solo se pierde la sugerencia.
  }
}

/** Bloque de carga con el `leading` del texto que reemplaza. */
function Bloque({ className }: { className: string }) {
  return <span aria-hidden className={`inline-block max-w-full rounded-muestra bg-linea align-middle motion-safe:animate-pulse ${className}`} />;
}

const ANCHOS_CHIP = ["w-20", "w-24", "w-16", "w-20", "w-16", "w-24"] as const;

export function CondonarPrestamo({ prestamo, cargar, formulario: fijo = null, condonar, abiertoInicial = false, inicial }: Props) {
  const router = useRouter();
  const { mostrar, quitar } = useAvisoDeudas();
  const [abierto, setAbierto] = useState(abiertoInicial);
  const [modo, setModo] = useState<ModoCondonacion>(inicial?.modo ?? "todo");
  const [valor, setValor] = useState(inicial?.valor ?? "");
  const [categoriaId, setCategoriaId] = useState<string | null>(inicial?.categoriaId ?? null);
  const [errorMonto, setErrorMonto] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  /** `undefined`: sin pedir todavía; `"cargando"`; `null`: falló. */
  const [datos, setDatos] = useState<DatosCondonacion | null | "cargando" | undefined>(cargar ? undefined : fijo);
  const [recordada, setRecordada] = useState<string | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const disparador = useRef<HTMLButtonElement>(null);
  /** Abrir o cancelar a mano: el control pulsado desaparece y el foco no puede quedar en el aire. */
  const cambioPorUsuario = useRef(false);

  useEffect(() => {
    if (!cambioPorUsuario.current) return;
    cambioPorUsuario.current = false;
    if (!abierto) {
      disparador.current?.focus();
      return;
    }
    titulo.current?.focus({ preventScroll: true });
    titulo.current?.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [abierto]);

  const nombre = primerNombre(prestamo.nombre);

  function pedirDatos() {
    if (!cargar) {
      router.refresh();
      return;
    }
    setDatos("cargando");
    void llamarAccion(cargar).then((resultado) => setDatos(resultado.ok ? resultado.datos : null));
  }

  if (!abierto) {
    return (
      <AccionesPrestamo
        id={prestamo.id}
        extra={
          <button
            ref={disparador}
            type="button"
            onClick={() => {
              quitar();
              cambioPorUsuario.current = true;
              setRecordada(leerRecordada());
              if (cargar && (datos === undefined || datos === null)) pedirDatos();
              setAbierto(true);
            }}
            className="presion h-12 px-1 text-cuerpo text-secundario underline underline-offset-4 hover:text-texto"
          >
            Condonar lo pendiente…
          </button>
        }
      />
    );
  }

  const calculo = montoCondonacion(modo, valor, prestamo.capitalPendiente);
  const monto = "monto" in calculo ? calculo.monto : null;
  // Vacío no es error todavía: el botón espera. Lo escrito que no sirve, sí.
  const errorCampo = errorMonto ?? (modo === "parte" && valor !== "" && "error" in calculo ? calculo.error : null);
  const cargando = datos === "cargando" || datos === undefined;
  const formulario = datos === "cargando" || datos === undefined ? null : datos;
  const categorias = formulario
    ? [...formulario.categorias].sort((a, b) => Number(b.id === recordada) - Number(a.id === recordada))
    : [];
  const categoria = formulario?.categorias.find((c) => c.id === categoriaId) ?? null;
  const vista = formulario ? vistaPreviaCondonacion(prestamo.capitalPendiente, monto ?? 0n, formulario.patrimonioNeto) : null;
  const puedeCondonar = monto !== null && categoria !== null && !pendiente && formulario !== null;
  const idFalta = `condonar-falta-${prestamo.id}`;
  // Por qué «Condonar» espera: lo primero que falta. Un monto inválido ya lo dice su campo.
  const falta =
    pendiente || formulario === null || errorCampo
      ? null
      : monto === null
        ? "Escribe cuánto vas a condonar."
        : categoria === null
          ? "Elige la categoría del gasto."
          : null;

  function cancelar() {
    cambioPorUsuario.current = true;
    setAbierto(false);
    setModo("todo");
    setValor("");
    setCategoriaId(null);
    setErrorMonto(null);
    setErrorGeneral(null);
  }

  function enviar() {
    if (!puedeCondonar || monto === null || categoria === null) return;
    setErrorMonto(null);
    setErrorGeneral(null);
    iniciar(async () => {
      const resultado = await llamarAccion(() => condonar(prestamo.id, { monto: monto.toString(), categoriaId: categoria.id }));
      if (resultado.ok) {
        recordar(categoria.id);
        cancelar();
        mostrar(resultado.movimiento);
        return;
      }
      if (resultado.codigo === "PRESTAMO_NO_ENCONTRADO") {
        router.replace(RUTA_DEUDAS);
        return;
      }
      // Ya cambió en otro lado (doble toque, otro dispositivo): el detalle está viejo.
      if (resultado.codigo === "PRESTAMO_SALDADO" || resultado.codigo === "CONDONACION_EXCEDE_CAPITAL") router.refresh();
      if (resultado.campo === "monto" && modo === "parte") setErrorMonto(resultado.mensaje);
      else setErrorGeneral(resultado.mensaje);
    });
  }

  const botones = (
    <div className="flex flex-col gap-3 @2xl:flex-row @2xl:flex-wrap">
      <Boton
        onClick={enviar}
        disabled={!puedeCondonar}
        aria-describedby={falta ? idFalta : undefined}
        monto={!pendiente && monto !== null ? pesos(monto) : undefined}
        className="justify-center"
      >
        {pendiente ? "Condonando…" : "Condonar"}
      </Boton>
      <Boton variante="secundario" onClick={cancelar} disabled={pendiente} className="justify-center">
        Cancelar
      </Boton>
    </div>
  );

  return (
    <section aria-label={`Condonar a ${nombre}`} className="asentar grid gap-8 border-t border-raya pt-6 @2xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h3 ref={titulo} tabIndex={-1} className="scroll-mt-8 text-cuerpo font-semibold break-words">Condonar a {nombre}</h3>
          <p className="max-w-prose text-cuerpo text-pretty text-secundario">{modo === "todo" ? EXPLICACION.todo(nombre) : EXPLICACION.parte()}</p>
        </div>

        <OpcionUnica
          nombre={`condonar-${prestamo.id}`}
          etiqueta="Valor a condonar"
          opciones={[
            { valor: "todo", rotulo: "Todo lo pendiente", cifra: pesos(prestamo.capitalPendiente) },
            { valor: "parte", rotulo: "Solo una parte" },
          ]}
          valor={modo}
          alCambiar={(m: ModoCondonacion) => {
            setModo(m);
            setErrorMonto(null);
          }}
          deshabilitado={pendiente}
        />

        {/*
         * «Solo una parte» despliega su campo en su lugar (campo dependiente: grid 0fr → 1fr,
         * sin animar `height`, y el campo se asienta 4 px). Plegado queda `inert`. Con
         * movimiento reducido el alto cambia de golpe y queda el fundido.
         */}
        <div
          inert={modo !== "parte"}
          className={`-mt-6 grid transition-[grid-template-rows,opacity] motion-reduce:transition-opacity ${
            modo === "parte" ? "grid-rows-[1fr] opacity-100 duration-300 ease-despliegue" : "grid-rows-[0fr] opacity-0 duration-180 ease-retirada"
          }`}
        >
          {/* 4 px de holgura: el recorte no se come el anillo de foco del campo. */}
          <div className="-mx-1 -mb-1 min-h-0 overflow-hidden px-1 pb-1">
            <div
              className={`pt-6 transition-transform motion-reduce:transition-none ${
                modo === "parte" ? "translate-y-0 duration-300 ease-despliegue" : "-translate-y-1 duration-180 ease-retirada"
              }`}
            >
              <div className="flex flex-col gap-1">
                <div className="border-b border-raya pb-3 pt-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-marca">
                  <label htmlFor={`condonar-valor-${prestamo.id}`} className="sr-only">
                    Valor a condonar
                  </label>
                  <div className="flex items-baseline gap-2">
                    <input
                      id={`condonar-valor-${prestamo.id}`}
                      value={valor}
                      onChange={(e) => {
                        setValor(formatearEntradaPesos(e.target.value));
                        setErrorMonto(null);
                      }}
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="0"
                      disabled={pendiente}
                      aria-invalid={errorCampo ? true : undefined}
                      aria-describedby={errorCampo ? `condonar-valor-${prestamo.id}-error` : undefined}
                      className="min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-cifra-campo tabular-nums text-texto caret-marca outline-none! placeholder:text-terciario"
                    />
                    <span className="text-etiqueta text-secundario">COP</span>
                  </div>
                </div>
                {errorCampo && <MensajeError id={`condonar-valor-${prestamo.id}-error`} mensaje={errorCampo} />}
              </div>
            </div>
          </div>
        </div>

        {cargando ? (
          // Mientras llegan las categorías: su rótulo y la forma de los chips, sin nombres inventados.
          <div aria-busy="true" className="flex flex-col gap-2">
            <span className="text-etiqueta text-secundario">Categoría del gasto</span>
            <span role="status" className="sr-only">
              Cargando categorías…
            </span>
            <div className="flex flex-wrap gap-2">
              {ANCHOS_CHIP.map((ancho, i) => (
                <Bloque key={i} className={`h-11 rounded-campo md:h-9 ${ancho}`} />
              ))}
            </div>
          </div>
        ) : formulario === null ? (
          <div role="alert" className="flex flex-col items-start gap-4">
            <p className="text-cuerpo font-semibold">No pudimos cargar tus categorías.</p>
            <Boton variante="secundario" onClick={pedirDatos}>
              Reintentar
            </Boton>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="text-etiqueta text-secundario">Categoría del gasto</span>
            <div role="group" aria-label="Categoría del gasto" className="flex flex-wrap gap-2">
              {categorias.map((c) => (
                <ChipCategoria
                  key={c.id}
                  etiqueta={c.nombre}
                  seleccionada={c.id === categoriaId}
                  deshabilitado={pendiente}
                  onClick={() => setCategoriaId(c.id)}
                />
              ))}
            </div>
          </div>
        )}

        {modo === "todo" && prestamo.interesesCausados > 0n && (
          <p className="max-w-prose text-etiqueta font-normal text-pretty text-secundario">
            Los intereses sin cobrar (<span className="font-mono tabular-nums">{pesos(prestamo.interesesCausados)}</span>) también se perdonan. No
            cuentan como gasto porque nunca entraron a tu patrimonio.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {cargando && (
          <section aria-hidden>
            <p className="border-b border-raya pb-2 text-rotulo uppercase">Qué cambia</p>
            {["Gasto de hoy", `${nombre} te deberá`, "Patrimonio neto"].map((rotulo, i) => (
              <div key={rotulo} className={`flex items-baseline justify-between gap-3 py-2 ${i < 2 ? "border-b border-linea" : ""}`}>
                <span className="min-w-0 text-cuerpo break-words">{rotulo}</span>
                <span className="text-cifra-s">
                  <Bloque className={`h-4 ${i === 2 ? "w-40" : "w-20"}`} />
                </span>
              </div>
            ))}
          </section>
        )}
        {vista && (
          <section aria-label="Qué cambia">
            <h4 className="border-b border-raya pb-2 text-rotulo uppercase">Qué cambia</h4>
            <dl>
              <div className="flex items-baseline justify-between gap-3 border-b border-linea py-2">
                <dt className="min-w-0 text-cuerpo break-words">{categoria ? `Gasto de hoy · ${categoria.nombre}` : "Gasto de hoy"}</dt>
                <dd className={`font-mono text-cifra-s tabular-nums ${vista.gasto > 0n ? "text-salida-texto" : ""}`}>{pesos(-vista.gasto)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-b border-linea py-2">
                <dt className="min-w-0 text-cuerpo break-words">{nombre} te deberá</dt>
                <dd className="font-mono text-cifra-s tabular-nums">{pesos(vista.queda)}</dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 py-2">
                <dt className="text-cuerpo">Patrimonio neto</dt>
                <dd className="font-mono text-cifra-s tabular-nums">
                  {pesos(vista.patrimonioAntes)} → {pesos(vista.patrimonioDespues)}
                </dd>
              </div>
            </dl>
          </section>
        )}
        <div className="flex flex-col gap-2">
          {/* Siempre montado: `aria-live` anuncia el cambio («Elige la categoría…») sin mover el foco. */}
          <p id={idFalta} aria-live="polite" className={`text-etiqueta font-normal text-secundario ${falta ? "" : "hidden"}`}>
            {falta}
          </p>
          {botones}
          {errorGeneral && <MensajeError mensaje={errorGeneral} />}
        </div>
      </div>
    </section>
  );
}
