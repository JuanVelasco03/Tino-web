"use client";

import { useEffect, useRef, useState, useTransition, type KeyboardEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { desdeMonto, formatearEntradaPesos } from "@/domain/dinero/entrada";
import { formatearFechaSinAnio } from "@/domain/fecha/formato";
import { montoValido } from "@/domain/movimiento/cuerpo";
import type { Ocurrencia, Recurrente } from "@/domain/recurrente/tipos";
import { estaVencida, etiquetaUltimo, textoRelativo } from "@/domain/recurrente/vencimiento";
import { Boton } from "../boton";
import { MensajeError } from "../mensaje-error";
import { categoriaTexto, colorImporte, cuentaAfectada, cuentaTexto, importeConSigno, pesos, RotuloContador } from "./comun";

type Fallo = { ok: false; codigo: string; mensaje: string };

/** Server actions; llegan por prop desde la página (los componentes no importan `app/`). */
export type AccionesBandeja = {
  confirmar: (id: string, vencimiento: string, monto?: string) => Promise<{ ok: true; movimiento: { id: string; monto: bigint } } | Fallo>;
  omitir: (id: string, vencimiento: string) => Promise<{ ok: true } | Fallo>;
  deshacerConfirmacion: (movimientoId: string) => Promise<{ ok: true } | Fallo>;
  deshacerOmision: (id: string, vencimiento: string) => Promise<{ ok: true } | Fallo>;
};

type Props = {
  /** `"YYYY-MM-DD"` de la API: el texto relativo nunca usa el reloj del navegador. */
  fechaHoy: string;
  ventanaDias: number;
  /** Vencidas y por confirmar, en el orden de la API. */
  bandeja: Ocurrencia[];
  /** Concepto, cuentas, categoría y último confirmado de cada ocurrencia. */
  recurrentes: Recurrente[];
  acciones: AccionesBandeja;
};

/**
 * Lo que «Deshacer» necesita, guardado en el cliente e independiente de la
 * lista: tras revalidar, la fila ya no está.
 */
type Deshacer = { tipo: "confirmacion"; movimientoId: string } | { tipo: "omision"; recurrenteId: string; vencimiento: string };

type Aviso = { id: number; texto: ReactNode; deshacer: Deshacer; error: string | null };

type Ajuste = { clave: string; valor: string; error: string | null };

const DURACION_AVISO = 5000;
const MENSAJE_MONTO = "Escribe un valor en pesos mayor que cero.";

function claveDe(o: Ocurrencia): string {
  return `${o.recurrenteId}|${o.vencimiento}`;
}

function Cifra({ children }: { children: ReactNode }) {
  return <span className="whitespace-nowrap font-mono tabular-nums">{children}</span>;
}

/**
 * Bandeja «Por confirmar»: ocurrencias que aún no tocan los saldos (RN-10).
 * Confirmar, ajustar el importe en la fila u omitir, con un aviso de 5 s y
 * «Deshacer». Una fila se ajusta a la vez. Fila de escritorio
 * (`96px | flexible | 150px | auto`) cuando el contenedor lo permite; si no,
 * la de móvil, con las acciones debajo.
 */
export function BandejaRecurrentes({ fechaHoy, ventanaDias, bandeja, recurrentes, acciones }: Props) {
  const router = useRouter();
  const porId = new Map(recurrentes.map((r) => [r.id, r]));
  const [ajuste, setAjuste] = useState<Ajuste | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [deshaciendo, setDeshaciendo] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contador = useRef(0);

  function limpiarTemporizador() {
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = null;
  }

  useEffect(() => limpiarTemporizador, []);

  /** El aviso dura 5 s o hasta la siguiente acción en la bandeja. */
  function mostrarAviso(texto: ReactNode, deshacer: Deshacer) {
    limpiarTemporizador();
    const id = ++contador.current;
    setAviso({ id, texto, deshacer, error: null });
    temporizador.current = setTimeout(() => setAviso((actual) => (actual?.id === id ? null : actual)), DURACION_AVISO);
  }

  function quitarAviso() {
    limpiarTemporizador();
    setAviso(null);
  }

  function ponerError(clave: string, fallo: Fallo) {
    // Otro dispositivo o un doble toque ya la cerró: la lista está vieja.
    if (fallo.codigo === "OCURRENCIA_CERRADA") router.refresh();
    setErrores((actual) => ({ ...actual, [clave]: fallo.mensaje }));
  }

  function limpiarError(clave: string) {
    setErrores((actual) => {
      if (!(clave in actual)) return actual;
      const resto = { ...actual };
      delete resto[clave];
      return resto;
    });
  }

  function confirmar(o: Ocurrencia, r: Recurrente, montoAjustado?: string) {
    if (pendiente) return;
    const clave = claveDe(o);
    limpiarError(clave);
    quitarAviso();
    iniciar(async () => {
      const resultado = await acciones.confirmar(o.recurrenteId, o.vencimiento, montoAjustado);
      if (!resultado.ok) {
        ponerError(clave, resultado);
        return;
      }
      setAjuste(null);
      const { movimiento } = resultado;
      const cuenta = cuentaAfectada(r);
      const texto =
        montoAjustado === undefined ? (
          <>
            {r.concepto} confirmado: <Cifra>{importeConSigno(r.tipo, movimiento.monto)}</Cifra> ya cuenta en {cuenta}.
          </>
        ) : (
          <>
            {r.concepto} confirmado con <Cifra>{pesos(movimiento.monto)}</Cifra>. Ya cuenta en {cuenta}.
          </>
        );
      mostrarAviso(texto, { tipo: "confirmacion", movimientoId: movimiento.id });
    });
  }

  function omitir(o: Ocurrencia, r: Recurrente) {
    if (pendiente) return;
    const clave = claveDe(o);
    limpiarError(clave);
    quitarAviso();
    if (ajuste?.clave === clave) setAjuste(null);
    iniciar(async () => {
      const resultado = await acciones.omitir(o.recurrenteId, o.vencimiento);
      if (!resultado.ok) {
        ponerError(clave, resultado);
        return;
      }
      mostrarAviso(<>{r.concepto} omitido. La plantilla sigue activa.</>, {
        tipo: "omision",
        recurrenteId: o.recurrenteId,
        vencimiento: o.vencimiento,
      });
    });
  }

  function deshacer() {
    if (!aviso || deshaciendo) return;
    const actual = aviso;
    limpiarTemporizador();
    setDeshaciendo(true);
    void (async () => {
      const d = actual.deshacer;
      const resultado =
        d.tipo === "confirmacion" ? await acciones.deshacerConfirmacion(d.movimientoId) : await acciones.deshacerOmision(d.recurrenteId, d.vencimiento);
      setDeshaciendo(false);
      if (resultado.ok) {
        setAviso((a) => (a?.id === actual.id ? null : a));
        return;
      }
      // Se queda el aviso con el error 5 s más.
      setAviso((a) => (a?.id === actual.id ? { ...a, error: resultado.mensaje } : a));
      temporizador.current = setTimeout(() => setAviso((a) => (a?.id === actual.id ? null : a)), DURACION_AVISO);
    })();
  }

  function empezarAjuste(o: Ocurrencia) {
    setAjuste({ clave: claveDe(o), valor: desdeMonto(o.monto), error: null });
    limpiarError(claveDe(o));
  }

  function enviarAjuste(o: Ocurrencia, r: Recurrente) {
    if (!ajuste) return;
    const monto = montoValido(ajuste.valor);
    if (monto === null) {
      setAjuste({ ...ajuste, error: MENSAJE_MONTO });
      return;
    }
    confirmar(o, r, monto);
  }

  const ocupado = pendiente || deshaciendo;

  return (
    <section aria-label="Por confirmar" className="@container">
      <div className="flex items-baseline justify-between gap-3 border-b border-raya pb-2">
        <RotuloContador titulo="Por confirmar" cantidad={bandeja.length} ancho="@2xl" />
        <span className="text-etiqueta font-normal text-secundario">
          <span className="@2xl:hidden">No tocan los saldos</span>
          <span className="hidden @2xl:inline">Aún no tocan los saldos</span>
        </span>
      </div>

      {aviso && <AvisoBandeja texto={aviso.texto} alDeshacer={deshacer} deshaciendo={deshaciendo} error={aviso.error} />}

      {bandeja.length === 0 ? (
        <div className="flex flex-col gap-1 border-b border-linea py-6">
          <p className="text-cuerpo font-semibold">Nada por confirmar.</p>
          <p className="text-etiqueta font-normal text-secundario">
            El próximo aparece <span className="font-mono tabular-nums">{ventanaDias}</span> días antes de su vencimiento.
          </p>
        </div>
      ) : (
        <ul>
          {bandeja.map((o) => {
            const r = porId.get(o.recurrenteId);
            if (!r) return null;
            const clave = claveDe(o);
            return (
              <FilaBandeja
                key={clave}
                o={o}
                r={r}
                fechaHoy={fechaHoy}
                ajuste={ajuste?.clave === clave ? ajuste : null}
                error={errores[clave] ?? null}
                ocupado={ocupado}
                alConfirmar={() => confirmar(o, r)}
                alAjustar={() => empezarAjuste(o)}
                alOmitir={() => omitir(o, r)}
                alCambiarAjuste={(valor) => setAjuste((a) => (a ? { ...a, valor, error: null } : a))}
                alEnviarAjuste={() => enviarAjuste(o, r)}
                alCancelarAjuste={() => setAjuste(null)}
              />
            );
          })}
        </ul>
      )}
    </section>
  );
}

type PropsAviso = {
  texto: ReactNode;
  alDeshacer: () => void;
  deshaciendo: boolean;
  error?: string | null;
};

/**
 * Aviso tras confirmar u omitir: fila de 44 px arriba de las ocurrencias,
 * sobre una división, con la marca en verde y «Deshacer». No es
 * `AvisoRegistro`: su formato («Registrado: …») no coincide.
 */
export function AvisoBandeja({ texto, alDeshacer, deshaciendo, error }: PropsAviso) {
  return (
    <div role="status" className="flex flex-col border-b border-linea">
      <div className="flex min-h-11 items-center gap-3">
        <span className="flex text-entrada">
          <Check size={16} strokeWidth={1.5} aria-hidden />
        </span>
        <span className="min-w-0 flex-1 py-2 text-cuerpo">{texto}</span>
        <Boton variante="texto" onClick={alDeshacer} disabled={deshaciendo} className="h-11 shrink-0 px-3">
          {deshaciendo ? "Deshaciendo…" : "Deshacer"}
        </Boton>
      </div>
      {error && <MensajeError mensaje={error} className="pb-2" />}
    </div>
  );
}

/** Cifra en mono dentro del texto de un aviso. */
export { Cifra as CifraAviso };

type PropsFila = {
  o: Ocurrencia;
  r: Recurrente;
  fechaHoy: string;
  ajuste: Ajuste | null;
  error: string | null;
  ocupado: boolean;
  /** Enfoca el campo al empezar a ajustar. `false` en una muestra estática. */
  enfocar?: boolean;
  alConfirmar: () => void;
  alAjustar: () => void;
  alOmitir: () => void;
  alCambiarAjuste: (valor: string) => void;
  alEnviarAjuste: () => void;
  alCancelarAjuste: () => void;
};

const OMITIR =
  "h-12 px-2 text-cuerpo text-secundario hover:text-texto disabled:cursor-not-allowed disabled:text-terciario";

/** Una ocurrencia de la bandeja: la misma estructura se reordena con el ancho del contenedor. */
export function FilaBandeja({
  o,
  r,
  fechaHoy,
  ajuste,
  error,
  ocupado,
  enfocar = true,
  alConfirmar,
  alAjustar,
  alOmitir,
  alCambiarAjuste,
  alEnviarAjuste,
  alCancelarAjuste,
}: PropsFila) {
  const ajustando = ajuste !== null;
  const vencida = estaVencida(o.vencimiento, fechaHoy);
  const fecha = formatearFechaSinAnio(o.vencimiento);
  const relativo = textoRelativo(o.vencimiento, fechaHoy);
  const idCampo = `ajuste-${r.id}-${o.vencimiento}`;
  const idError = `${idCampo}-error`;
  const signo = r.tipo === "gasto" ? "−" : r.tipo === "ingreso" ? "+" : null;
  const colorSigno = r.tipo === "gasto" ? "text-salida @2xl:text-salida-texto" : "text-entrada @2xl:text-entrada-texto";

  function alTeclear(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "Enter") {
      evento.preventDefault();
      alEnviarAjuste();
    } else if (evento.key === "Escape") {
      evento.preventDefault();
      alCancelarAjuste();
    }
  }

  return (
    <li
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 py-3 punteada @2xl:min-h-16 @2xl:grid-cols-[96px_minmax(0,1fr)_150px_auto] @2xl:items-center @2xl:gap-x-4 ${
        ajustando ? "bg-hundido" : ""
      }`}
    >
      {/* Escritorio: fecha y texto relativo. */}
      <div className="hidden flex-col @2xl:flex">
        <span className="font-mono text-cifra-xs tabular-nums">{fecha}</span>
        <span className={`text-etiqueta font-normal ${vencida ? "text-salida-texto" : "text-secundario"}`}>{relativo}</span>
      </div>

      <div className="min-w-0">
        <div className="truncate text-cuerpo font-semibold">{r.concepto}</div>
        <div className="text-etiqueta font-normal text-secundario">
          <span className="@2xl:hidden">
            <span className="font-mono tabular-nums">{fecha}</span> ·{" "}
            <span className={vencida ? "text-salida-texto" : ""}>{relativo}</span> · {cuentaTexto(r)}
          </span>
          <span className="hidden truncate @2xl:block">
            {r.tipo === "transferencia" ? `Transferencia · ${cuentaTexto(r)}` : `${categoriaTexto(r)} · ${cuentaTexto(r)}`}
          </span>
        </div>
      </div>

      {ajuste ? (
        <div className="col-span-2 flex flex-col gap-1 @2xl:col-span-1 @2xl:items-end">
          <label htmlFor={idCampo} className="sr-only">
            Importe de {r.concepto}
          </label>
          <div className="flex w-full items-baseline gap-2 border-b border-raya pb-1 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-marca @2xl:gap-1">
            {signo && (
              <span aria-hidden className={`font-mono text-cifra-l @2xl:text-cifra-s ${colorSigno}`}>
                {signo}
              </span>
            )}
            <input
              id={idCampo}
              autoFocus={enfocar}
              value={ajuste.valor}
              onChange={(e) => alCambiarAjuste(formatearEntradaPesos(e.target.value))}
              onKeyDown={alTeclear}
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              aria-invalid={ajuste.error ? true : undefined}
              aria-describedby={ajuste.error ? idError : undefined}
              className="min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-cifra-l tabular-nums text-texto caret-marca outline-none! placeholder:text-terciario @2xl:text-right @2xl:text-cifra-s"
            />
            <span className="text-etiqueta text-secundario @2xl:hidden">COP</span>
          </div>
          {r.ultimoConfirmado && (
            <span className="font-mono text-cifra-xs tabular-nums text-secundario">
              {etiquetaUltimo(r.periodicidad)}: {pesos(r.ultimoConfirmado.monto)}
            </span>
          )}
          {ajuste.error && <MensajeError id={idError} mensaje={ajuste.error} />}
        </div>
      ) : (
        <div className="flex flex-col items-end">
          <span className={`whitespace-nowrap font-mono text-cifra-s font-medium tabular-nums ${colorImporte(r.tipo)}`}>
            {o.estimado && "≈ "}
            {importeConSigno(r.tipo, o.monto)}
          </span>
          <span className="font-mono text-cifra-xs text-secundario">{o.estimado ? "estimado" : "fijo"}</span>
        </div>
      )}

      {ajuste ? (
        <div className="col-span-2 grid grid-cols-[1fr_auto] gap-2 @2xl:col-span-1 @2xl:flex @2xl:justify-end">
          <Boton onClick={alEnviarAjuste} disabled={ocupado} monto={ajuste.valor === "" ? undefined : ajuste.valor} className="justify-center">
            Confirmar
          </Boton>
          <Boton variante="secundario" onClick={alCancelarAjuste} disabled={ocupado}>
            Cancelar
          </Boton>
        </div>
      ) : (
        <div className="col-span-2 grid grid-cols-[1fr_1fr_auto] gap-2 @2xl:col-span-1 @2xl:flex @2xl:justify-end">
          <Boton onClick={alConfirmar} disabled={ocupado} className="justify-center">
            Confirmar
          </Boton>
          <Boton variante="secundario" onClick={alAjustar} disabled={ocupado} className="justify-center">
            Ajustar
          </Boton>
          <button type="button" onClick={alOmitir} disabled={ocupado} className={OMITIR}>
            Omitir
          </button>
        </div>
      )}

      {error && <MensajeError mensaje={error} className="col-span-full" />}
    </li>
  );
}
