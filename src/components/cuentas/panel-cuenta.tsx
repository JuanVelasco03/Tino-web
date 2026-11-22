"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { cambiosEdicion, type TipoEditable } from "@/domain/cuenta/edicion";
import { aMenores, desdeMenores, desdeMonto } from "@/domain/dinero/entrada";
import type { Moneda } from "@/domain/dinero/formato";
import { mensajeMonto } from "@/domain/inversion/formulario";
import type { CampoCuenta, Cuenta, EdicionCuenta, ResultadoCuenta, ValoresCuenta } from "@/services/cuentas";
import { CampoSubrayado } from "../campo-subrayado";
import { Boton } from "../boton";
import { CampoMonto } from "../campo-monto";
import { MensajeError } from "../mensaje-error";
import { IconoCuenta, ROTULO_TIPO_CUENTA } from "../iconos";
import { OpcionUnica, type Opcion } from "../opcion-unica";
import { PanelLateral, type ControlPanel } from "../panel-lateral";
import { BloqueEliminar, DETALLE_ELIMINAR_CUENTA } from "../bloque-eliminar";

/** Server actions; llegan por prop desde la página (los componentes no importan `app/`). */
export type AccionesCuenta = {
  crear: (valores: ValoresCuenta) => Promise<ResultadoCuenta>;
  editar: (id: string, cambios: EdicionCuenta) => Promise<ResultadoCuenta>;
  archivar: (id: string) => Promise<ResultadoCuenta>;
  eliminar: (id: string) => Promise<ResultadoCuenta>;
};

type Props = {
  /** `null`: alta. Con cuenta: edición de una cuenta no archivada. */
  cuenta: Cuenta | null;
  acciones: AccionesCuenta;
};

type Errores = Partial<Record<CampoCuenta, string>>;

function opcion(tipo: TipoEditable): Opcion<TipoEditable> {
  return { valor: tipo, rotulo: ROTULO_TIPO_CUENTA[tipo], icono: <IconoCuenta tipo={tipo} /> };
}

const OPCIONES_ALTA = [opcion("banco"), opcion("efectivo"), opcion("tarjeta_credito")];
/** En edición solo se ofrece la misma naturaleza (N-39). */
const OPCIONES_ACTIVO = [opcion("banco"), opcion("efectivo")];

const VALORES_ALTA: ValoresCuenta = { nombre: "", tipo: "banco", detalle: "", saldo: "", cupo: "" };

function valoresDe(cuenta: Cuenta): ValoresCuenta {
  return {
    nombre: cuenta.nombre,
    tipo: cuenta.tipo,
    detalle: cuenta.detalle ?? "",
    // En una inversión, el efectivo inicial en su moneda.
    saldo: desdeMenores(cuenta.saldoInicial, cuenta.moneda),
    cupo: cuenta.tarjeta ? desdeMonto(cuenta.tarjeta.cupo) : "",
  };
}

function iguales(a: ValoresCuenta, b: ValoresCuenta): boolean {
  return a.nombre === b.nombre && a.tipo === b.tipo && a.detalle === b.detalle && a.saldo === b.saldo && a.cupo === b.cupo;
}

/** Monto que no se podrá enviar. Vacío es válido: el saldo vacío vale 0 y el cupo vacío lo rechaza la API. */
function montoMalEscrito(texto: string, moneda: Moneda = "COP"): boolean {
  return texto.trim() !== "" && aMenores(texto, moneda) === null;
}

/**
 * Panel de alta y edición de una cuenta (C22). Formulario controlado: la
 * server action recibe los valores y nunca reinicia lo escrito al fallar.
 * En edición añade archivar y eliminar.
 */
export function PanelCuenta({ cuenta, acciones }: Props) {
  const router = useRouter();
  const panel = useRef<ControlPanel>(null);
  const esAlta = cuenta === null;
  const [iniciales] = useState<ValoresCuenta>(() => (cuenta ? valoresDe(cuenta) : VALORES_ALTA));
  const [valores, setValores] = useState<ValoresCuenta>(iniciales);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [errorBorrado, setErrorBorrado] = useState<string | null>(null);
  const [accion, setAccion] = useState<"guardar" | "archivar" | "eliminar" | null>(null);
  const [pendiente, iniciar] = useTransition();

  const esTarjeta = valores.tipo === "tarjeta_credito";
  /** Una inversión: tipo fijo, efectivo inicial en su moneda, sin cupo (SPEC 10). */
  const esInversion = cuenta?.tipo === "inversion";
  const moneda: Moneda = cuenta?.moneda ?? "COP";
  const hayCambios = !iguales(valores, iniciales);

  /** Retira la hoja y después quita `?cuenta=` de la URL, que la desmonta. */
  async function cerrar() {
    await panel.current?.cerrar();
    router.replace("/cuentas", { scroll: false });
  }

  function solicitarCierre() {
    if (pendiente) return;
    if (hayCambios) setConfirmandoDescarte(true);
    else void cerrar();
  }

  function cambiar<C extends keyof ValoresCuenta>(campo: C, valor: ValoresCuenta[C]) {
    setValores((actual) => {
      const nuevos = { ...actual, [campo]: valor };
      // El cupo solo existe en la tarjeta: al cambiar de tipo se descarta.
      if (campo === "tipo" && valor !== "tarjeta_credito") nuevos.cupo = "";
      return nuevos;
    });
    setErrores((actual) => (actual[campo] ? { ...actual, [campo]: undefined } : actual));
  }

  function mostrarResultado(resultado: ResultadoCuenta): boolean {
    if (resultado.ok) return true;
    // El efectivo inicial de una inversión que deja el efectivo negativo algún día: bajo «Efectivo inicial».
    const campo = resultado.campo ?? (resultado.codigo === "EFECTIVO_INSUFICIENTE" ? "saldo" : undefined);
    if (campo) setErrores((actual) => ({ ...actual, [campo]: resultado.mensaje }));
    else setErrorGeneral(resultado.mensaje);
    return false;
  }

  function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente) return;
    setErrorGeneral(null);

    const locales: Errores = {};
    if (montoMalEscrito(valores.saldo, moneda)) locales.saldo = mensajeMonto(moneda);
    if (esTarjeta && montoMalEscrito(valores.cupo)) locales.cupo = mensajeMonto("COP");
    if (Object.keys(locales).length > 0) {
      setErrores(locales);
      return;
    }

    let llamada: () => Promise<ResultadoCuenta>;
    if (cuenta) {
      const cambios = cambiosEdicion(cuenta, valores);
      // Nada cambió: sin petición.
      if (cambios === null) {
        void cerrar();
        return;
      }
      llamada = () => acciones.editar(cuenta.id, cambios);
    } else {
      llamada = () => acciones.crear(valores);
    }

    setErrores({});
    setAccion("guardar");
    iniciar(async () => {
      if (mostrarResultado(await llamada())) await cerrar();
      setAccion(null);
    });
  }

  function archivar() {
    if (!cuenta || pendiente) return;
    setErrorArchivo(null);
    setAccion("archivar");
    iniciar(async () => {
      const resultado = await acciones.archivar(cuenta.id);
      if (resultado.ok) await cerrar();
      else setErrorArchivo(resultado.mensaje);
      setAccion(null);
    });
  }

  function eliminar() {
    if (!cuenta || pendiente) return;
    setErrorBorrado(null);
    setAccion("eliminar");
    iniciar(async () => {
      const resultado = await acciones.eliminar(cuenta.id);
      if (resultado.ok) await cerrar();
      else setErrorBorrado(resultado.mensaje);
      setAccion(null);
    });
  }

  const guardando = pendiente && accion === "guardar";
  const etiquetaSaldo = esAlta
    ? esTarjeta
      ? "Deuda de hoy"
      : "Saldo de hoy"
    : esInversion
      ? "Efectivo inicial"
      : esTarjeta
        ? "Deuda inicial"
        : "Saldo inicial";
  /** Una inversión no se archiva con efectivo o posiciones, pero su saldo es el valor en COP: decide la API (`SALDO_NO_CERO`). */
  const archivable = esInversion || cuenta?.saldo === 0n;
  const etiquetaGuardar = esAlta ? (guardando ? "Creando…" : "Crear cuenta") : guardando ? "Guardando…" : "Guardar cambios";

  return (
    <PanelLateral ref={panel} titulo={esAlta ? "Nueva cuenta" : "Editar cuenta"} alSolicitarCierre={solicitarCierre}>
      <form onSubmit={guardar} noValidate className="flex flex-col gap-6">
        <CampoSubrayado
          etiqueta="Nombre"
          name="nombre"
          autoComplete="off"
          value={valores.nombre}
          onChange={(e) => cambiar("nombre", e.target.value)}
          error={errores.nombre}
          placeholder="Nequi"
        />

        {cuenta?.tipo === "tarjeta_credito" || cuenta?.tipo === "inversion" ? (
          <div className="flex flex-col gap-1">
            <span className="text-rotulo uppercase text-secundario">Tipo</span>
            <div className="flex min-h-11 items-center gap-3 text-cuerpo">
              <span className="flex text-secundario">
                <IconoCuenta tipo={cuenta.tipo} />
              </span>
              {cuenta.tipo === "inversion" ? `${ROTULO_TIPO_CUENTA.inversion} · ${cuenta.moneda}` : ROTULO_TIPO_CUENTA.tarjeta_credito}
            </div>
            {errores.tipo && <MensajeError mensaje={errores.tipo} />}
          </div>
        ) : (
          <OpcionUnica
            nombre="tipo"
            etiqueta="Tipo"
            opciones={esAlta ? OPCIONES_ALTA : OPCIONES_ACTIVO}
            valor={valores.tipo as TipoEditable}
            alCambiar={(tipo) => cambiar("tipo", tipo)}
            error={errores.tipo}
          />
        )}

        <CampoSubrayado
          etiqueta="Detalle · opcional"
          name="detalle"
          autoComplete="off"
          value={valores.detalle}
          onChange={(e) => cambiar("detalle", e.target.value)}
          error={errores.detalle}
          placeholder="Ahorros ·· 4821"
        />

        <div className="flex flex-col">
          <CampoMonto
            valor={valores.saldo}
            moneda={moneda}
            etiqueta={etiquetaSaldo}
            editable={{
              nombre: "saldo",
              alCambiar: (v) => cambiar("saldo", v),
              error: errores.saldo,
              nota: esAlta ? undefined : "Cambiarlo queda registrado.",
            }}
          />
          {/*
           * El cupo se despliega en su lugar al elegir tarjeta: la fila crece
           * (grid 0fr → 1fr, sin animar `height`) y el campo se asienta 4 px.
           * Plegado queda `inert`: fuera del tabulador y del lector de pantalla.
           * Con movimiento reducido el alto cambia de golpe; queda el fundido.
           */}
          <div
            inert={!esTarjeta}
            className={`grid transition-[grid-template-rows,opacity] motion-reduce:transition-opacity ${
              esTarjeta
                ? "grid-rows-[1fr] opacity-100 duration-300 ease-despliegue"
                : "grid-rows-[0fr] opacity-0 duration-180 ease-retirada"
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              <div
                className={`pt-2 transition-transform motion-reduce:transition-none ${
                  esTarjeta
                    ? "translate-y-0 duration-300 ease-despliegue"
                    : "-translate-y-1 duration-180 ease-retirada"
                }`}
              >
                <CampoMonto
                  valor={valores.cupo}
                  moneda="COP"
                  etiqueta="Cupo total"
                  editable={{ nombre: "cupo", alCambiar: (v) => cambiar("cupo", v), error: errores.cupo }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {confirmandoDescarte ? (
            <div role="group" aria-label="Descartar los cambios" className="flex flex-col gap-3">
              <p className="text-cuerpo font-semibold">¿Descartar los cambios?</p>
              <div className="flex flex-wrap items-center gap-3">
                <Boton onClick={() => void cerrar()}>Descartar</Boton>
                <Boton variante="texto" onClick={() => setConfirmandoDescarte(false)}>
                  Seguir editando
                </Boton>
              </div>
            </div>
          ) : (
            <Boton type="submit" disabled={pendiente} className="w-full justify-center">
              {etiquetaGuardar}
            </Boton>
          )}
          {errorGeneral && <MensajeError mensaje={errorGeneral} />}
        </div>
      </form>

      {cuenta && (
        <div className="mt-6 flex flex-col gap-6 border-t border-linea pt-6">
          <div className="flex flex-col items-start gap-2">
            <Boton variante="secundario" onClick={archivar} disabled={pendiente || !archivable}>
              {pendiente && accion === "archivar" ? "Archivando…" : "Archivar"}
            </Boton>
            {!archivable && (
              <p className="text-etiqueta font-normal text-secundario">Solo puedes archivar una cuenta con saldo cero.</p>
            )}
            {errorArchivo && <MensajeError mensaje={errorArchivo} />}
          </div>

          {confirmandoBorrado ? (
            <div className="border-t border-linea pt-6">
              <BloqueEliminar
                nombre={cuenta.nombre}
                detalle={DETALLE_ELIMINAR_CUENTA}
                alConfirmar={eliminar}
                alCancelar={() => {
                  setConfirmandoBorrado(false);
                  setErrorBorrado(null);
                }}
                pendiente={pendiente && accion === "eliminar"}
                error={errorBorrado}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmandoBorrado(true)}
              disabled={pendiente}
              className="self-start py-2 text-etiqueta font-normal text-secundario hover:text-texto disabled:cursor-not-allowed"
            >
              Eliminar cuenta…
            </button>
          )}
        </div>
      )}
    </PanelLateral>
  );
}
