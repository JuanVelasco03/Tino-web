"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { aMenores, cambiarMonedaEntrada } from "@/domain/dinero/entrada";
import {
  cuerpoInversion,
  MAX_NOMBRE_INVERSION,
  mensajeMonto,
  VALORES_INVERSION,
  type CampoInversion,
  type ValoresInversion,
} from "@/domain/inversion/formulario";
import type { InversionCuerpo, Moneda } from "@/domain/inversion/tipos";
import { Boton } from "../boton";
import { CampoMonto } from "../campo-monto";
import { CampoSubrayado } from "../campo-subrayado";
import { ConfirmarDescarte } from "../captura/panel-captura";
import { MensajeError } from "../mensaje-error";
import { OpcionUnica } from "../opcion-unica";
import { PanelLateral, type ControlPanel } from "../panel-lateral";
import { rutaInversion } from "./rutas";

type Fallo = { ok: false; codigo: string; mensaje: string; campo?: CampoInversion };

/** Server action; llega por prop desde la página (los componentes no importan `app/`). */
export type AccionCrearInversion = (cuerpo: InversionCuerpo) => Promise<{ ok: true; id: string } | Fallo>;

type Props = {
  crear: AccionCrearInversion;
  /** Adónde vuelve al cerrar sin crear: la inversión que estaba abierta o `/inversiones`. */
  rutaCierre: string;
  /** Tras la salida de la hoja. Por defecto, navega a `destino` (en `/estilos`, cierra la muestra). */
  alCerrar?: (destino: string) => void;
};

type Errores = Partial<Record<CampoInversion, string>>;

const OPCIONES_MONEDA = [
  { valor: "USD", rotulo: "Dólares · USD" },
  { valor: "COP", rotulo: "Pesos · COP" },
] as const satisfies readonly { valor: Moneda; rotulo: string }[];

/**
 * Alta de una cuenta de inversión (N-40 a N-42): nombre, moneda y efectivo
 * inicial. Las posiciones previas se registran después con «Ya lo tenía».
 * Cambiar la moneda reformatea el efectivo conservando la parte entera. Al
 * crear, se cierra hacia el detalle de la nueva.
 */
export function PanelInversion({ crear, rutaCierre, alCerrar }: Props) {
  const router = useRouter();
  const panel = useRef<ControlPanel>(null);
  const [valores, setValores] = useState<ValoresInversion>(VALORES_INVERSION);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);
  const [pendiente, iniciar] = useTransition();

  const conCambios =
    valores.nombre !== VALORES_INVERSION.nombre ||
    valores.moneda !== VALORES_INVERSION.moneda ||
    valores.efectivoInicial !== VALORES_INVERSION.efectivoInicial;

  async function cerrar(destino = rutaCierre) {
    await panel.current?.cerrar();
    if (alCerrar) alCerrar(destino);
    else router.replace(destino, { scroll: false });
  }

  function solicitarCierre() {
    if (pendiente) return;
    if (conCambios) setConfirmandoDescarte(true);
    else void cerrar();
  }

  function cambiar<C extends keyof ValoresInversion>(campo: C, valor: ValoresInversion[C]) {
    setValores((actual) => {
      if (campo !== "moneda") return { ...actual, [campo]: valor };
      const moneda = valor as Moneda;
      return { ...actual, moneda, efectivoInicial: cambiarMonedaEntrada(actual.efectivoInicial, moneda) };
    });
    // Cambiar la moneda reformatea el efectivo: su error ya no aplica.
    setErrores((actual) => (campo === "moneda" ? { ...actual, moneda: undefined, efectivoInicial: undefined } : { ...actual, [campo]: undefined }));
    setErrorGeneral(null);
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente) return;
    setErrorGeneral(null);

    const efectivoMal = valores.efectivoInicial.trim() !== "" && aMenores(valores.efectivoInicial, valores.moneda) === null;
    const cuerpo = efectivoMal ? null : cuerpoInversion(valores);
    if (cuerpo === null) {
      setErrores({ efectivoInicial: mensajeMonto(valores.moneda) });
      return;
    }

    setErrores({});
    setConfirmandoDescarte(false);
    iniciar(async () => {
      const resultado = await crear(cuerpo);
      if (resultado.ok) {
        await cerrar(rutaInversion(resultado.id));
        return;
      }
      if (resultado.campo) setErrores({ [resultado.campo]: resultado.mensaje });
      else setErrorGeneral(resultado.mensaje);
    });
  }

  const pie = (
    <div className="flex flex-col gap-3">
      {confirmandoDescarte ? (
        <ConfirmarDescarte alDescartar={() => void cerrar()} alSeguir={() => setConfirmandoDescarte(false)} />
      ) : (
        <Boton type="submit" form="formulario-inversion" disabled={pendiente} className="w-full justify-center">
          {pendiente ? "Creando…" : "Crear inversión"}
        </Boton>
      )}
      {errorGeneral && <MensajeError mensaje={errorGeneral} />}
    </div>
  );

  return (
    <PanelLateral ref={panel} titulo="Nueva inversión" alSolicitarCierre={solicitarCierre} pie={pie}>
      <form id="formulario-inversion" onSubmit={enviar} noValidate className="flex flex-col gap-6">
        <CampoSubrayado
          etiqueta="Nombre"
          name="nombre"
          autoComplete="off"
          maxLength={MAX_NOMBRE_INVERSION}
          value={valores.nombre}
          onChange={(e) => cambiar("nombre", e.target.value)}
          error={errores.nombre}
          placeholder="eToro"
        />
        <OpcionUnica
          nombre="moneda"
          etiqueta="Moneda"
          opciones={OPCIONES_MONEDA}
          valor={valores.moneda}
          alCambiar={(moneda) => cambiar("moneda", moneda)}
          error={errores.moneda}
        />
        <CampoMonto
          valor={valores.efectivoInicial}
          moneda={valores.moneda}
          etiqueta="Efectivo inicial"
          editable={{
            nombre: "efectivo-inicial",
            alCambiar: (v) => cambiar("efectivoInicial", v),
            error: errores.efectivoInicial,
            nota: "Lo que ya tienes sin invertir. Las posiciones las agregas después con «Ya lo tenía».",
          }}
        />
      </form>
    </PanelLateral>
  );
}
