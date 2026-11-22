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
import { AccionesPrestamo } from "./detalle-prestamo";
import { RUTA_DEUDAS } from "./rutas";

type Fallo = { ok: false; codigo: string; mensaje: string };

/** El gasto que creó la condonación: lo que el aviso muestra y lo que «Deshacer» borra. */
type Gasto = { id: string; monto: bigint; categoria: { nombre: string } | null };

/** Server actions; llegan por prop desde la página (los componentes no importan `app/`). */
export type AccionCondonar = (id: string, cuerpo: CondonacionCuerpo) => Promise<{ ok: true; movimiento: Gasto } | (Fallo & { campo?: "monto" | "categoria" })>;
export type AccionDeshacer = (movimientoId: string) => Promise<{ ok: true } | Fallo>;

/* ── Aviso con «Deshacer» ─────────────────────────────────────────────── */

type Aviso = { clave: number; gasto: Gasto; error: string | null };

type ContextoAviso = {
  aviso: Aviso | null;
  deshaciendo: boolean;
  mostrar: (gasto: Gasto) => void;
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

  function quitar() {
    limpiar();
    setAviso(null);
  }

  function deshacer() {
    if (!aviso || deshaciendo) return;
    const actual = aviso;
    limpiar();
    setDeshaciendo(true);
    void (async () => {
      const resultado = await accionDeshacer(actual.gasto.id);
      setDeshaciendo(false);
      if (resultado.ok) {
        setAviso((a) => (a?.clave === actual.clave ? null : a));
        return;
      }
      // El aviso se queda con el `mensaje` de la API 5 s más.
      setAviso((a) => (a?.clave === actual.clave ? { ...a, error: resultado.mensaje } : a));
      programarCierre(actual.clave);
    })();
  }

  return <Contexto.Provider value={{ aviso, deshaciendo, mostrar, quitar, deshacer }}>{children}</Contexto.Provider>;
}

function useAvisoDeudas(): ContextoAviso {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("CondonarPrestamo y AvisoCondonacion necesitan ProveedorAvisoDeudas.");
  return contexto;
}

/** «Condonado. Se registró un gasto de 500.000 en Otros.» · «Deshacer». Fila de 44 px; dura 5 s. */
export function AvisoCondonacion() {
  const { aviso, deshaciendo, deshacer } = useAvisoDeudas();
  if (!aviso) return null;
  const { gasto } = aviso;
  return (
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
  );
}

/* ── Condonar ─────────────────────────────────────────────────────────── */

type Categoria = { id: string; nombre: string };

type Props = {
  prestamo: Pick<PrestamoDetalle, "id" | "nombre" | "capitalPendiente" | "interesesCausados">;
  /** Categorías de gasto (`GET /captura`) y patrimonio neto (`GET /cuentas`); `null` si no se pudieron cargar. */
  formulario: { categorias: readonly Categoria[]; patrimonioNeto: bigint } | null;
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
export function CondonarPrestamo({ prestamo, formulario, condonar, abiertoInicial = false, inicial }: Props) {
  const router = useRouter();
  const { mostrar, quitar } = useAvisoDeudas();
  const [abierto, setAbierto] = useState(abiertoInicial);
  const [modo, setModo] = useState<ModoCondonacion>(inicial?.modo ?? "todo");
  const [valor, setValor] = useState(inicial?.valor ?? "");
  const [categoriaId, setCategoriaId] = useState<string | null>(inicial?.categoriaId ?? null);
  const [errorMonto, setErrorMonto] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const nombre = primerNombre(prestamo.nombre);

  if (!abierto) {
    return (
      <AccionesPrestamo
        id={prestamo.id}
        extra={
          <button
            type="button"
            onClick={() => {
              quitar();
              setAbierto(true);
            }}
            className="h-12 px-1 text-cuerpo text-secundario underline underline-offset-4 hover:text-texto"
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
  const categoria = formulario?.categorias.find((c) => c.id === categoriaId) ?? null;
  const vista = formulario ? vistaPreviaCondonacion(prestamo.capitalPendiente, monto ?? 0n, formulario.patrimonioNeto) : null;
  const puedeCondonar = monto !== null && categoria !== null && !pendiente && formulario !== null;

  function cancelar() {
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
      const resultado = await condonar(prestamo.id, { monto: monto.toString(), categoriaId: categoria.id });
      if (resultado.ok) {
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
      <Boton onClick={enviar} disabled={!puedeCondonar} monto={monto !== null ? pesos(monto) : undefined} className="justify-center">
        Condonar
      </Boton>
      <Boton variante="secundario" onClick={cancelar} disabled={pendiente} className="justify-center">
        Cancelar
      </Boton>
    </div>
  );

  return (
    <section aria-label={`Condonar a ${nombre}`} className="grid gap-8 border-t border-raya pt-6 @2xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h3 className="text-titulo-2">Condonar a {nombre}</h3>
          <p className="text-cuerpo text-secundario">{modo === "todo" ? EXPLICACION.todo(nombre) : EXPLICACION.parte()}</p>
        </div>

        <OpcionUnica
          nombre={`condonar-${prestamo.id}`}
          etiqueta="Valor a condonar"
          opciones={[
            { valor: "todo", rotulo: `Todo lo pendiente ${pesos(prestamo.capitalPendiente)}` },
            { valor: "parte", rotulo: "Solo una parte" },
          ]}
          valor={modo}
          alCambiar={(m: ModoCondonacion) => {
            setModo(m);
            setErrorMonto(null);
          }}
          deshabilitado={pendiente}
        />

        {modo === "parte" && (
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
        )}

        {formulario === null ? (
          <div role="alert" className="flex flex-col items-start gap-4">
            <p className="text-cuerpo font-semibold">No pudimos cargar el formulario.</p>
            <Boton variante="secundario" onClick={() => router.refresh()}>
              Reintentar
            </Boton>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="text-etiqueta text-secundario">Categoría del gasto</span>
            <div role="group" aria-label="Categoría del gasto" className="flex flex-wrap gap-2">
              {formulario.categorias.map((c) => (
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
          <p className="text-etiqueta font-normal text-secundario">
            Los intereses causados sin cobrar (<span className="font-mono tabular-nums">{pesos(prestamo.interesesCausados)}</span>) también se
            dejan de cobrar. No se registran como gasto porque nunca entraron a tu patrimonio.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {vista && (
          <section aria-label="Qué cambia">
            <h4 className="border-b border-raya pb-2 text-rotulo uppercase">Qué cambia</h4>
            <dl>
              <div className="flex items-baseline justify-between gap-3 border-b border-linea py-2">
                <dt className="text-cuerpo">{categoria ? `Gasto de hoy · ${categoria.nombre}` : "Gasto de hoy"}</dt>
                <dd className={`font-mono text-cifra-s tabular-nums ${vista.gasto > 0n ? "text-salida-texto" : ""}`}>{pesos(-vista.gasto)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-b border-linea py-2">
                <dt className="text-cuerpo">{nombre} te deberá</dt>
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
          {botones}
          {errorGeneral && <MensajeError mensaje={errorGeneral} />}
        </div>
      </div>
    </section>
  );
}
