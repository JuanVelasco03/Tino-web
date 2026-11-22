"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { aDigitos, formatearEntradaPesos } from "@/domain/dinero/entrada";
import { formatearFechaSinAnio } from "@/domain/fecha/formato";
import {
  aplicarPropuesta,
  cuerpoAbono,
  totalAbono,
  VALORES_ABONO,
  type CampoAbono,
  type ValoresAbono,
} from "@/domain/prestamo/formulario";
import { pesos, tieneTasa } from "@/domain/prestamo/presentacion";
import type { AbonoCuerpo, PrestamoDetalle, PropuestaAbono } from "@/domain/prestamo/tipos";
import type { DatosCaptura } from "@/services/captura";
import { Boton } from "../boton";
import { CampoMonto } from "../campo-monto";
import { FichaCuenta } from "../captura/ficha-cuenta";
import { ConfirmarDescarte } from "../captura/panel-captura";
import { CampoSubrayado } from "../campo-subrayado";
import { MensajeError } from "../mensaje-error";
import { PanelLateral, type ControlPanel } from "../panel-lateral";
import { RUTA_DEUDAS, rutaPrestamo } from "./rutas";

type Fallo = { ok: false; codigo: string; mensaje: string; campo?: CampoAbono };

/** Server actions; llegan por prop desde la página (los componentes no importan `app/`). */
export type AccionesPanelAbono = {
  proponer: (id: string, fecha: string, monto: string) => Promise<{ ok: true; propuesta: PropuestaAbono } | Fallo>;
  abonar: (id: string, cuerpo: AbonoCuerpo) => Promise<{ ok: true } | Fallo>;
};

type Props = {
  prestamo: Pick<PrestamoDetalle, "id" | "nombre" | "tipo" | "tasaMensual" | "capitalPendiente" | "interesesCausados" | "fechaHoy">;
  /** Cuentas activas y la predeterminada; `null` si no se pudieron cargar. */
  formulario: Pick<DatosCaptura, "captura" | "cuentas"> | null;
  acciones: AccionesPanelAbono;
  /** Tras la salida de la hoja; por defecto navega. En `/estilos`, cierra la muestra. */
  alCerrar?: (destino: string) => void;
};

type Errores = Partial<Record<CampoAbono, string>>;

const MENSAJE_MONTO = "Escribe un valor en pesos, sin decimales.";
const ID_FORMULARIO = "formulario-abono";

/** Campo de cifra editable en cifra-s sobre su renglón (capital e interés de la propuesta). */
function CampoCifra({
  etiqueta,
  nombre,
  valor,
  alCambiar,
  error,
  nota,
  deshabilitado,
}: {
  etiqueta: string;
  nombre: string;
  valor: string;
  alCambiar: (v: string) => void;
  error?: string;
  nota?: string;
  deshabilitado?: boolean;
}) {
  return (
    <CampoSubrayado
      etiqueta={etiqueta}
      extra={nota ? <span className="font-mono text-cifra-xs tabular-nums">{nota}</span> : undefined}
      id={nombre}
      name={nombre}
      inputMode="numeric"
      autoComplete="off"
      placeholder="0"
      value={valor}
      disabled={deshabilitado}
      onChange={(e) => alCambiar(formatearEntradaPesos(e.target.value))}
      error={error}
      className="font-mono tabular-nums"
    />
  );
}

/**
 * Registrar un abono (N-43 a N-54). Con tasa: el total se reparte con la
 * propuesta de la API (al salir del total o cambiar la fecha) y capital e
 * interés quedan editables; editarlos no vuelve a pedirla. Sin tasa: todo va
 * a capital. Solo se aplica la respuesta del último pedido, y nunca tras
 * editar capital o interés a mano.
 */
export function PanelAbono({ prestamo, formulario, acciones, alCerrar }: Props) {
  const router = useRouter();
  const panel = useRef<ControlPanel>(null);
  const conInteres = tieneTasa(prestamo.tasaMensual);
  const otorgado = prestamo.tipo === "prestamo_otorgado";
  const [iniciales] = useState<ValoresAbono>(() => VALORES_ABONO(prestamo.fechaHoy, formulario?.captura.cuentaPredeterminadaId ?? null));
  const [valores, setValores] = useState<ValoresAbono>(iniciales);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [propuesta, setPropuesta] = useState<PropuestaAbono | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);
  const [pendiente, iniciar] = useTransition();
  /** Turno del último pedido: una respuesta vieja, o una que llega tras editar a mano, se descarta. */
  const turno = useRef(0);
  /** Total y fecha del último pedido: volver a salir del total sin cambiarlo no pisa lo editado a mano. */
  const ultimoPedido = useRef<string | null>(null);

  const conCambios = (Object.keys(iniciales) as (keyof ValoresAbono)[]).some((c) => iniciales[c] !== valores[c]);

  async function cerrar(destino = rutaPrestamo(prestamo.id)) {
    await panel.current?.cerrar();
    if (alCerrar) alCerrar(destino);
    else router.replace(destino, { scroll: false });
  }

  function solicitarCierre() {
    if (pendiente) return;
    if (conCambios) setConfirmandoDescarte(true);
    else void cerrar();
  }

  function cambiar<C extends keyof ValoresAbono>(campo: C, valor: ValoresAbono[C]) {
    setValores((actual) => ({ ...actual, [campo]: valor }));
    setErrores((actual) => (actual[campo] ? { ...actual, [campo]: undefined } : actual));
  }

  /** Capital o interés a mano: la propuesta en camino ya no se aplica. */
  function cambiarReparto(campo: "capital" | "interes", valor: string) {
    turno.current++;
    setCalculando(false);
    cambiar(campo, valor);
  }

  /** Pide el reparto de `total` a la fecha `fecha`. Sin tasa o sin un total entero, nada. */
  function pedirPropuesta(total: string, fecha: string) {
    if (!conInteres) return;
    const monto = aDigitos(total);
    if (monto === null || monto === "0" || fecha === "") return;
    const clave = `${monto}|${fecha}`;
    if (clave === ultimoPedido.current) return;
    ultimoPedido.current = clave;
    const mio = ++turno.current;
    setCalculando(true);
    setErrores((actual) => ({ ...actual, total: undefined }));
    void acciones.proponer(prestamo.id, fecha, monto).then((resultado) => {
      if (turno.current !== mio) return;
      setCalculando(false);
      if (resultado.ok) {
        setPropuesta(resultado.propuesta);
        setValores((actual) => aplicarPropuesta(actual, resultado.propuesta));
        setErrores((actual) => ({ ...actual, capital: undefined, interes: undefined }));
      } else if (resultado.codigo === "PRESTAMO_NO_ENCONTRADO") {
        router.replace(RUTA_DEUDAS);
      } else {
        // Se puede volver a pedir con los mismos datos.
        ultimoPedido.current = null;
        setErrores((actual) => ({ ...actual, [resultado.campo ?? "total"]: resultado.mensaje }));
      }
    });
  }

  /** Sin interés, el capital es el total: sus errores van bajo «Total». */
  function campoDeError(campo: CampoAbono | undefined): CampoAbono | undefined {
    if (!conInteres && (campo === "capital" || campo === "interes")) return "total";
    return campo;
  }

  function registrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente || calculando || formulario === null) return;
    setErrorGeneral(null);

    // Enter en el total sin haber salido de él: primero el reparto de ese total.
    const monto = aDigitos(valores.total);
    if (conInteres && monto !== null && monto !== "0" && `${monto}|${valores.fecha}` !== ultimoPedido.current) {
      pedirPropuesta(valores.total, valores.fecha);
      return;
    }

    const cuerpo = cuerpoAbono(valores, conInteres);
    if (cuerpo === null) {
      if (!conInteres) setErrores({ total: MENSAJE_MONTO });
      else
        setErrores({
          capital: aDigitos(valores.capital) === null ? MENSAJE_MONTO : undefined,
          interes: aDigitos(valores.interes) === null ? MENSAJE_MONTO : undefined,
        });
      return;
    }

    setErrores({});
    setConfirmandoDescarte(false);
    iniciar(async () => {
      const resultado = await acciones.abonar(prestamo.id, cuerpo);
      if (resultado.ok) {
        await cerrar();
        return;
      }
      if (resultado.codigo === "PRESTAMO_NO_ENCONTRADO") {
        router.replace(RUTA_DEUDAS);
        return;
      }
      // Ya se saldó en otro lado: la página se refresca con el estado real.
      if (resultado.codigo === "PRESTAMO_SALDADO") router.refresh();
      const campo = campoDeError(resultado.campo);
      if (campo) setErrores({ [campo]: resultado.mensaje });
      else setErrorGeneral(resultado.mensaje);
    });
  }

  const total = conInteres ? totalAbono(valores) : aDigitos(valores.total) === null ? null : BigInt(aDigitos(valores.total) as string);
  const causados = propuesta
    ? { fecha: propuesta.fecha, monto: propuesta.interesesCausados }
    : { fecha: prestamo.fechaHoy, monto: prestamo.interesesCausados };

  const pie = (
    <div className="flex flex-col gap-2">
      {confirmandoDescarte ? (
        <ConfirmarDescarte alDescartar={() => void cerrar()} alSeguir={() => setConfirmandoDescarte(false)} />
      ) : (
        <Boton
          type="submit"
          form={ID_FORMULARIO}
          disabled={pendiente || calculando || formulario === null}
          monto={!pendiente && total !== null ? pesos(total) : undefined}
          className="w-full justify-center"
        >
          {pendiente ? "Registrando…" : "Registrar abono"}
        </Boton>
      )}
      {errorGeneral && <MensajeError mensaje={errorGeneral} />}
    </div>
  );

  return (
    <PanelLateral ref={panel} titulo={`Registrar abono · ${prestamo.nombre}`} alSolicitarCierre={solicitarCierre} pie={pie}>
      {formulario === null ? (
        <div role="alert" className="flex flex-col items-start gap-4">
          <p className="text-cuerpo font-semibold">No pudimos cargar el formulario.</p>
          <Boton variante="secundario" onClick={() => router.refresh()}>
            Reintentar
          </Boton>
        </div>
      ) : (
        <form id={ID_FORMULARIO} onSubmit={registrar} noValidate className="flex flex-col gap-6">
          <p className="text-etiqueta font-normal text-secundario">
            Capital pendiente <span className="font-mono tabular-nums">{pesos(prestamo.capitalPendiente)}</span>
            {conInteres && (
              <>
                {" · causados a hoy "}
                <span className="font-mono tabular-nums">{pesos(prestamo.interesesCausados)}</span>
              </>
            )}
          </p>

          <div className="flex flex-col gap-1" onBlur={() => pedirPropuesta(valores.total, valores.fecha)}>
            <CampoMonto
              valor={valores.total}
              moneda="COP"
              etiqueta="Total"
              editable={{
                nombre: "abono-total",
                alCambiar: (v) => cambiar("total", v),
                error: errores.total,
                nota: calculando ? "Calculando…" : undefined,
              }}
            />
          </div>

          <CampoSubrayado
            etiqueta="Fecha"
            name="fecha"
            type="date"
            required
            value={valores.fecha}
            onChange={(e) => {
              const fecha = e.target.value;
              if (fecha === "") return;
              cambiar("fecha", fecha);
              pedirPropuesta(valores.total, fecha);
            }}
            error={errores.fecha}
          />

          {conInteres && (
            <>
              <CampoCifra
                etiqueta="Capital"
                nombre="abono-capital"
                valor={valores.capital}
                alCambiar={(v) => cambiarReparto("capital", v)}
                error={errores.capital}
              />
              <CampoCifra
                etiqueta="Interés"
                nombre="abono-interes"
                valor={valores.interes}
                alCambiar={(v) => cambiarReparto("interes", v)}
                error={errores.interes}
                nota={`Causados al ${formatearFechaSinAnio(causados.fecha)}: ${pesos(causados.monto)}`}
              />
            </>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-etiqueta text-secundario">{otorgado ? "Llega a" : "Sale de"}</span>
            <div role="group" aria-label={otorgado ? "Llega a" : "Sale de"} className="grid grid-cols-2 gap-2">
              {formulario.cuentas.map((cuenta) => (
                <FichaCuenta key={cuenta.id} cuenta={cuenta} elegida={cuenta.id === valores.cuentaId} alPulsar={() => cambiar("cuentaId", cuenta.id)} />
              ))}
            </div>
            {errores.cuentaId && <MensajeError mensaje={errores.cuentaId} />}
          </div>
        </form>
      )}
    </PanelLateral>
  );
}
