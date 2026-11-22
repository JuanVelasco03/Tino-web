"use client";

import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { desdeMonto } from "@/domain/dinero/entrada";
import { accionAviso, detalleAviso, momento, montoAviso, tituloAviso, type Aviso } from "@/domain/aviso/presentacion";
import { montoValido } from "@/domain/movimiento/cuerpo";
import { Boton } from "../boton";
import { CampoMonto } from "../campo-monto";
import { IconoAviso } from "../iconos";
import { MensajeError } from "../mensaje-error";

export const MENSAJE_MONTO_AVISO = "Escribe un valor en pesos, sin decimales.";

type Props = {
  aviso: Aviso;
  /** `"YYYY-MM-DD"` de la API: el momento nunca usa el reloj del navegador. */
  fechaHoy: string;
  /** IANA, la del perfil. */
  zona: string;
  /** `mensaje` de la API bajo la fila. */
  error?: string | null;
  /** Este aviso tiene el campo de ajuste abierto (uno a la vez). */
  ajustando?: boolean;
  /** Este aviso se está confirmando: su botón dice «Confirmando…». */
  confirmando?: boolean;
  /** Otra confirmación en curso: las acciones de la fila se deshabilitan. */
  ocupado?: boolean;
  /** Enfoca el campo al abrir el ajuste. `false` en una muestra estática. */
  enfocar?: boolean;
  /** Valor inicial del campo (muestras de /estilos); por defecto, el monto del aviso. */
  valorAjuste?: string;
  /** Tocar la fila alterna leído. Sin ella, la fila solo presenta. */
  alAlternar?: () => void;
  /** «Confirmar» (sin monto) o el ajuste (con monto, string entero en pesos). */
  alConfirmar?: (monto?: string) => void;
  alAbrirAjuste?: () => void;
  alCerrarAjuste?: () => void;
};

const ACCION = "relative z-10 inline-flex h-11 items-center text-etiqueta font-semibold text-marca-texto disabled:cursor-not-allowed disabled:text-terciario";

/**
 * Una fila de la lista de avisos. Toda la fila es un `<button>` que alterna
 * leído (estirado con un pseudo-elemento, como la fila de movimiento como
 * enlace) y la acción es un hermano por encima, fuera de él: nunca botón
 * dentro de botón. Escritorio (md+): rejilla `12px | 20px | flexible | auto |
 * auto` con icono y detalle largo. Móvil: `10px | flexible | auto`, sin icono,
 * con detalle corto y la acción debajo.
 */
export function FilaAviso({
  aviso,
  fechaHoy,
  zona,
  error = null,
  ajustando = false,
  confirmando = false,
  ocupado = false,
  enfocar = true,
  valorAjuste,
  alAlternar,
  alConfirmar,
  alAbrirAjuste,
  alCerrarAjuste,
}: Props) {
  const titulo = tituloAviso(aviso, zona);
  const monto = montoAviso(aviso);
  const accion = accionAviso(aviso);
  const cuando = momento(aviso, fechaHoy, zona);
  const leido = aviso.leido;

  const contenidoTitulo = (
    <span className={`text-cuerpo ${leido ? "font-normal text-secundario" : "font-semibold text-texto"}`}>{titulo}</span>
  );

  return (
    <li className="relative grid grid-cols-[10px_minmax(0,1fr)_auto] gap-x-3 border-b border-linea py-3 has-[[data-fila]:hover]:bg-hundido has-[[data-fila]:focus-visible]:outline-2 has-[[data-fila]:focus-visible]:outline-offset-2 has-[[data-fila]:focus-visible]:outline-marca md:grid-cols-[12px_20px_minmax(0,1fr)_auto_auto]">
      {/* Punto de no leído: conserva su espacio leído. */}
      <span className="col-start-1 row-start-1 flex h-[22px] items-center">
        <span aria-hidden className={`size-2 rounded-campo ${leido ? "bg-transparent" : "bg-marca"}`} />
        <span className="sr-only">{leido ? "Leído" : "No leído"}</span>
      </span>

      <span className="hidden text-secundario md:col-start-2 md:row-start-1 md:flex md:pt-px">
        <IconoAviso tipo={aviso.tipo} />
      </span>

      <span className="col-start-2 row-start-1 min-w-0 md:col-start-3">
        {alAlternar ? (
          <button
            type="button"
            data-fila
            onClick={alAlternar}
            aria-label={`${titulo}. ${leido ? "Marcar como no leído" : "Marcar como leído"}`}
            className="text-left outline-none! after:absolute after:inset-0 after:content-['']"
          >
            {contenidoTitulo}
          </button>
        ) : (
          contenidoTitulo
        )}
      </span>

      <span className="col-start-2 row-start-2 min-w-0 text-etiqueta font-normal text-secundario md:col-start-3 md:col-end-5">
        <span className="md:hidden">{detalleAviso(aviso, "corto")}</span>
        <span className="hidden md:inline">{detalleAviso(aviso, "largo")}</span>
      </span>

      <span
        className={`col-start-3 row-start-1 justify-self-end whitespace-nowrap font-mono text-cifra-s tabular-nums md:col-start-4 ${
          monto?.sentido === "salida" ? "text-salida-texto" : "text-texto"
        }`}
      >
        {monto?.texto}
      </span>

      <span className="col-start-3 row-start-2 justify-self-end whitespace-nowrap text-right font-mono text-cifra-xs tabular-nums text-secundario md:col-start-5 md:row-start-1 md:min-w-[110px] md:self-center">
        {cuando}
      </span>

      {accion && !ajustando && (
        <span className="col-start-2 row-start-3 justify-self-start md:col-start-5 md:row-start-2 md:justify-self-end">
          {accion.clase === "enlace" ? (
            <Link href={accion.href} className={ACCION}>
              {accion.rotulo}
            </Link>
          ) : (
            <button
              type="button"
              disabled={ocupado || !alConfirmar}
              onClick={() => (accion.clase === "confirmar" ? alConfirmar?.() : alAbrirAjuste?.())}
              className={ACCION}
            >
              {confirmando ? "Confirmando…" : accion.rotulo}
            </button>
          )}
        </span>
      )}

      {ajustando && aviso.tipo === "recurrente" && (
        <AjusteAviso
          clave={aviso.clave}
          concepto={aviso.recurrente.concepto}
          inicial={valorAjuste ?? desdeMonto(aviso.monto)}
          confirmando={confirmando}
          ocupado={ocupado}
          enfocar={enfocar}
          alConfirmar={(m) => alConfirmar?.(m)}
          alCancelar={() => alCerrarAjuste?.()}
        />
      )}

      {error && (
        <MensajeError mensaje={error} className="relative z-10 col-start-2 col-end-[-1] pt-1 md:col-start-3" />
      )}
    </li>
  );
}

type PropsAjuste = {
  clave: string;
  concepto: string;
  inicial: string;
  confirmando: boolean;
  ocupado: boolean;
  enfocar: boolean;
  alConfirmar: (monto: string) => void;
  alCancelar: () => void;
};

/**
 * Ajuste en la fila (recurrente variable): el monto en cifra-campo con «COP»
 * sobre una raya, «Confirmar {35.000}» y «Cancelar». Enter confirma, Escape
 * cancela. Vacío, cero o con decimales: el mensaje bajo el campo, sin enviar.
 */
function AjusteAviso({ clave, concepto, inicial, confirmando, ocupado, enfocar, alConfirmar, alCancelar }: PropsAjuste) {
  const [valor, setValor] = useState(inicial);
  const [error, setError] = useState<string | null>(null);
  const nombre = `ajuste-${clave.replace(/[^a-zA-Z0-9-]/g, "-")}`;

  useEffect(() => {
    if (!enfocar) return;
    const campo = document.getElementById(nombre);
    if (campo instanceof HTMLInputElement) {
      campo.focus();
      campo.select();
    }
  }, [enfocar, nombre]);

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const monto = montoValido(valor);
    if (monto === null) {
      setError(MENSAJE_MONTO_AVISO);
      return;
    }
    alConfirmar(monto);
  }

  function alTeclear(evento: KeyboardEvent) {
    if (evento.key === "Escape") {
      evento.preventDefault();
      alCancelar();
    }
  }

  return (
    <form
      onSubmit={enviar}
      onKeyDown={alTeclear}
      aria-label={`Ajustar ${concepto}`}
      className="relative z-10 col-start-1 col-end-[-1] row-start-3 flex flex-col gap-3 pt-3 md:col-start-3 md:flex-row md:items-end"
    >
      <div className="min-w-0 md:flex-1">
        <CampoMonto
          valor={valor}
          moneda="COP"
          etiqueta={`Importe de ${concepto}`}
          editable={{
            nombre,
            alCambiar: (v) => {
              setValor(v);
              setError(null);
            },
            error: error ?? undefined,
            deshabilitado: confirmando,
          }}
        />
      </div>
      <div className="flex flex-col gap-2 md:flex-row md:pb-3">
        <Boton type="submit" disabled={ocupado} monto={confirmando || valor === "" ? undefined : valor} className="justify-center">
          {confirmando ? "Confirmando…" : "Confirmar"}
        </Boton>
        <Boton variante="secundario" onClick={alCancelar} disabled={confirmando} className="justify-center">
          Cancelar
        </Boton>
      </div>
    </form>
  );
}
