"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  cuerpoAlta,
  cuerpoDesembolso,
  personaExistente,
  VALORES_ALTA,
  type CampoAlta,
  type ValoresAlta,
} from "@/domain/prestamo/formulario";
import { admiteGastoIngreso } from "@/domain/cuenta/naturaleza";
import type { DesembolsoCuerpo, Prestamo, PrestamoCuerpo, TipoPrestamo } from "@/domain/prestamo/tipos";
import type { DatosCaptura } from "@/services/captura";
import { Boton } from "../boton";
import { CampoMonto } from "../campo-monto";
import { CampoSubrayado } from "../campo-subrayado";
import { FichaCuenta } from "../captura/ficha-cuenta";
import { ConfirmarDescarte } from "../captura/panel-captura";
import { ChipCategoria } from "../chip-categoria";
import { MensajeError } from "../mensaje-error";
import { OpcionUnica } from "../opcion-unica";
import { PanelLateral, type ControlPanel } from "../panel-lateral";
import { rutaPrestamo } from "./rutas";
import { CampoFecha } from "../campo-fecha";
import { llamarAccion } from "@/lib/sin-conexion";
import { enfocarPrimerError } from "@/lib/enfocar-error";
import { pesos } from "@/domain/prestamo/presentacion";
import { CifraAviso } from "../recurrentes/bandeja-recurrentes";
import { useAvisoRegistro } from "./condonar-prestamo";

type Fallo = { ok: false; codigo: string; mensaje: string; campo?: CampoAlta };
type Resultado = { ok: true; id: string } | Fallo;

/** Server actions; llegan por prop desde la página (los componentes no importan `app/`). */
export type AccionesPanelPrestamo = {
  crear: (cuerpo: PrestamoCuerpo) => Promise<Resultado>;
  desembolsar: (id: string, cuerpo: DesembolsoCuerpo) => Promise<Resultado>;
};

type Props = {
  /** De `?nuevo=`: cualquier valor distinto de `deuda_contraida` abre «Le presté a alguien». */
  tipoInicial: TipoPrestamo;
  /** Hoy según la API: defecto de la fecha. */
  fechaHoy: string;
  /** Todos los préstamos (saldados incluidos): las personas de cada sentido. */
  prestamos: readonly Prestamo[];
  /** Cuentas activas y la predeterminada (`GET /captura`, `GET /cuentas`); `null` si no se pudieron cargar. */
  formulario: Pick<DatosCaptura, "captura" | "cuentas"> | null;
  acciones: AccionesPanelPrestamo;
  /** Ruta a la que vuelve al cerrar sin registrar (quita `?nuevo=`). */
  rutaCierre: string;
  /** Tras la salida de la hoja; por defecto navega. En `/estilos`, cierra la muestra. */
  alCerrar?: (destino: string) => void;
};

type Errores = Partial<Record<CampoAlta, string>>;

const MENSAJE_MONTO = "Escribe un valor en pesos, sin decimales.";

/** Monto vacío o en cero: lo que falta, no el formato. */
function faltaMonto(tipo: TipoPrestamo): string {
  return tipo === "prestamo_otorgado" ? "Escribe cuánto le prestaste." : "Escribe cuánto te prestó.";
}

function vacio(monto: string): boolean {
  const limpio = monto.replace(/\./g, "").trim();
  return limpio === "" || /^0+$/.test(limpio);
}
const ID_FORMULARIO = "formulario-prestamo";

const OPCIONES_SENTIDO = [
  { valor: "prestamo_otorgado", rotulo: "Le presté a alguien", detalle: "Queda como activo: te deben" },
  { valor: "deuda_contraida", rotulo: "Alguien me prestó", detalle: "Queda como pasivo: le debes" },
] as const;

/**
 * Alta de un préstamo o una deuda, o desembolso sobre uno existente (N-75 a
 * N-89). Si el nombre coincide con alguien del mismo sentido (`personaExistente`),
 * el panel pasa a desembolso: oculta tasa y fecha acordada y suma a ese
 * préstamo (lo reabre si estaba saldado). Formulario controlado: un fallo
 * nunca borra lo escrito.
 */
export function PanelPrestamo({ tipoInicial, fechaHoy, prestamos, formulario, acciones, rutaCierre, alCerrar }: Props) {
  const router = useRouter();
  const avisar = useAvisoRegistro();
  const panel = useRef<ControlPanel>(null);
  const [iniciales] = useState<ValoresAlta>(() =>
    VALORES_ALTA(tipoInicial, fechaHoy, formulario?.captura.cuentaPredeterminadaId ?? null),
  );
  const [valores, setValores] = useState<ValoresAlta>(iniciales);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);
  const [pendiente, iniciar] = useTransition();

  const existente = personaExistente(valores.nombre, prestamos, valores.tipo);
  const personas = prestamos.filter((p) => p.tipo === valores.tipo);
  const otorgado = valores.tipo === "prestamo_otorgado";
  const conCambios = (Object.keys(iniciales) as (keyof ValoresAlta)[]).some((c) => iniciales[c] !== valores[c]);

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

  function cambiar<C extends keyof ValoresAlta>(campo: C, valor: ValoresAlta[C]) {
    setValores((actual) => ({ ...actual, [campo]: valor }));
    setErrores((actual) => (actual[campo] ? { ...actual, [campo]: undefined } : actual));
  }

  function registrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente || formulario === null) return;
    setErrorGeneral(null);

    const persona = existente;
    const cuerpo = persona ? cuerpoDesembolso(valores) : cuerpoAlta(valores);
    // Todo lo que falta a la vez, antes de ir a la API (que igual lo valida).
    const sinNombre = valores.nombre.trim() === "";
    if (cuerpo === null || sinNombre) {
      setErrores({
        nombre: sinNombre ? "Escribe el nombre de la persona." : undefined,
        monto: cuerpo === null ? (vacio(valores.monto) ? faltaMonto(valores.tipo) : MENSAJE_MONTO) : undefined,
      });
      enfocarPrimerError(ID_FORMULARIO);
      return;
    }

    setErrores({});
    setConfirmandoDescarte(false);
    iniciar(async () => {
      // Sin red, el error se queda en el pie y no tumba la página.
      const resultado = await llamarAccion(() =>
        persona ? acciones.desembolsar(persona.id, cuerpo as DesembolsoCuerpo) : acciones.crear(cuerpo as PrestamoCuerpo),
      );
      if (resultado.ok) {
        await cerrar(rutaPrestamo(resultado.id));
        const que = persona ? "Desembolso registrado" : otorgado ? "Préstamo registrado" : "Deuda registrada";
        avisar(
          <>
            {que}: <CifraAviso>{pesos(BigInt(cuerpo.monto))}</CifraAviso> ·{" "}
            <span className="break-words">{persona ? persona.nombre : valores.nombre.trim()}</span>.
          </>,
        );
        return;
      }
      if (resultado.campo) {
        setErrores({ [resultado.campo]: resultado.mensaje });
        enfocarPrimerError(ID_FORMULARIO);
      } else setErrorGeneral(resultado.mensaje);
      // Otro dispositivo lo borró o creó: la lista de personas está vieja.
      if (resultado.codigo === "PRESTAMO_EXISTENTE" || resultado.codigo === "PRESTAMO_NO_ENCONTRADO") router.refresh();
    });
  }

  const etiqueta = pendiente
    ? "Registrando…"
    : existente
      ? "Registrar desembolso"
      : otorgado
        ? "Registrar préstamo"
        : "Registrar deuda";

  const pie = (
    <div className="flex flex-col gap-2">
      {confirmandoDescarte ? (
        <ConfirmarDescarte alDescartar={() => void cerrar()} alSeguir={() => setConfirmandoDescarte(false)} />
      ) : (
        <Boton type="submit" form={ID_FORMULARIO} disabled={pendiente || formulario === null} className="w-full justify-center">
          {etiqueta}
        </Boton>
      )}
      {errorGeneral && <MensajeError mensaje={errorGeneral} />}
    </div>
  );

  return (
    <PanelLateral ref={panel} titulo="Nuevo préstamo o deuda" ancho="amplio" alSolicitarCierre={solicitarCierre} pie={pie}>
      {formulario === null ? (
        <div role="alert" className="flex flex-col items-start gap-4">
          <p className="text-cuerpo font-semibold">No pudimos cargar tus cuentas.</p>
          <Boton variante="secundario" onClick={() => router.refresh()}>
            Reintentar
          </Boton>
        </div>
      ) : (
        <form id={ID_FORMULARIO} onSubmit={registrar} noValidate className="flex flex-col gap-6">
          <OpcionUnica
            nombre="prestamo-sentido"
            etiqueta="Sentido"
            opciones={OPCIONES_SENTIDO}
            valor={valores.tipo}
            alCambiar={(tipo: TipoPrestamo) => cambiar("tipo", tipo)}
            error={errores.tipo}
          />

          <div className="flex flex-col gap-2">
            <CampoSubrayado
              etiqueta="Persona"
              name="nombre"
              autoComplete="off"
              maxLength={60}
              value={valores.nombre}
              onChange={(e) => cambiar("nombre", e.target.value)}
              error={errores.nombre}
            />
            {personas.length > 0 && (
              <div role="group" aria-label="Personas" className="flex flex-wrap gap-2">
                {personas.map((p) => (
                  <ChipCategoria key={p.id} etiqueta={p.nombre} seleccionada={existente?.id === p.id} onClick={() => cambiar("nombre", p.nombre)} />
                ))}
              </div>
            )}
            {existente && (
              <p className="text-etiqueta font-normal text-secundario">
                <span className="break-words">Suma al préstamo con {existente.nombre}.</span>{existente.estado === "saldado" && " Está saldado: se reabre."}
              </p>
            )}
          </div>

          <CampoMonto
            valor={valores.monto}
            moneda="COP"
            etiqueta="Monto"
            editable={{ nombre: "prestamo-monto", alCambiar: (v) => cambiar("monto", v), error: errores.monto }}
          />

          <div className="flex flex-col gap-2">
            <span className="text-etiqueta text-secundario">{otorgado ? "Sale de" : "Llega a"}</span>
            <div role="group" aria-label={otorgado ? "Sale de" : "Llega a"} className="grid grid-cols-2 gap-2">
              {/* Una inversión no presta ni recibe préstamos (`CUENTA_DE_INVERSION`). */}
              {formulario.cuentas.filter((c) => admiteGastoIngreso(c.tipo)).map((cuenta) => (
                <FichaCuenta key={cuenta.id} cuenta={cuenta} elegida={cuenta.id === valores.cuentaId} alPulsar={() => cambiar("cuentaId", cuenta.id)} />
              ))}
            </div>
            {errores.cuentaId && <MensajeError mensaje={errores.cuentaId} />}
          </div>

          <CampoFecha etiqueta="Fecha" hoy={fechaHoy} valor={valores.fecha} alCambiar={(fecha) => cambiar("fecha", fecha)} error={errores.fecha} />

          {!existente && (
            <>
              <div className="flex flex-col gap-1">
                <CampoSubrayado
                  etiqueta="Tasa mensual"
                  name="tasaMensual"
                  inputMode="decimal"
                  autoComplete="off"
                  maxLength={6}
                  value={valores.tasaMensual}
                  onChange={(e) => cambiar("tasaMensual", e.target.value)}
                  error={errores.tasaMensual}
                  className="font-mono tabular-nums"
                />
                {!errores.tasaMensual && <p className="text-etiqueta font-normal text-secundario">En % mensual. Déjala vacía si no hay intereses.</p>}
              </div>

              <CampoFecha
                etiqueta="Fecha acordada"
                extra={<span>Opcional</span>}
                hoy={fechaHoy}
                min={valores.fecha || undefined}
                valor={valores.fechaAcordada}
                vacio="Sin fecha acordada"
                alCambiar={(fecha) => cambiar("fechaAcordada", fecha)}
                error={errores.fechaAcordada}
              />
            </>
          )}
        </form>
      )}
    </PanelLateral>
  );
}
