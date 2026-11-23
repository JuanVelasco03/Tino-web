"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { aDigitos } from "@/domain/dinero/entrada";
import {
  cambioDesde,
  cuentasAdmitidas,
  cuentasOrigen,
  validarMeta,
  valoresAlta,
  valoresEdicion,
  type CampoMeta,
  type Precision,
  type ValoresMeta,
} from "@/domain/meta/formulario";
import { pesos } from "@/domain/meta/presentacion";
import type { Meta, MetaCambio, MetaCuerpo, MetaDetalle, ModoMeta } from "@/domain/meta/tipos";
import type { Cuenta } from "@/services/cuentas";
import { Boton } from "../boton";
import { CampoMonto } from "../campo-monto";
import { CampoSubrayado } from "../campo-subrayado";
import { FichaCuenta } from "../captura/ficha-cuenta";
import { ConfirmarDescarte } from "../captura/panel-captura";
import { EnlaceTexto } from "../enlace-texto";
import { MensajeError } from "../mensaje-error";
import { OpcionUnica } from "../opcion-unica";
import { PanelLateral, type ControlPanel } from "../panel-lateral";
import { CampoFechaMeta, Despliegue } from "./campo-fecha-meta";
import { rutaMeta } from "./rutas";

type Fallo = { ok: false; codigo: string; mensaje: string; campo?: CampoMeta };
type Resultado = { ok: true; id: string } | Fallo;

/** Server actions; llegan por prop desde la página (los componentes no importan `app/`). */
export type AccionesPanelMeta = {
  crear: (cuerpo: MetaCuerpo) => Promise<Resultado>;
  editar: (id: string, cambio: MetaCambio) => Promise<Resultado>;
};

type Props = {
  /** Sin ella, alta; con ella, edición de esa meta. */
  meta?: MetaDetalle;
  /** Hoy según la API: `min` de la fecha meta. */
  fechaHoy: string;
  /** Las metas sin archivar: las cuentas que excluyen (`cuentasAdmitidas`). */
  metas: readonly Pick<Meta, "id" | "modo" | "cuenta">[];
  /** Cuentas activas (`GET /cuentas`); `null` si no se pudieron cargar. */
  cuentas: readonly Cuenta[] | null;
  acciones: AccionesPanelMeta;
  /** Ruta a la que vuelve al cerrar sin guardar. */
  rutaCierre: string;
  /** Tras la salida de la hoja; por defecto navega. En `/estilos`, cierra la muestra. */
  alCerrar?: (destino: string) => void;
};

type Errores = Partial<Record<CampoMeta, string>>;

const ID_FORMULARIO = "formulario-meta";

const OPCIONES_MODO = [
  { valor: "apartado", rotulo: "Apartar parte del saldo", detalle: "Varias metas pueden compartir la cuenta." },
  { valor: "cuenta", rotulo: "Toda la cuenta", detalle: "El avance es su saldo, o su valor de mercado si es una inversión." },
] as const;

/** La meta ya no admite cambios: otro dispositivo la cumplió o la archivó. */
const REFRESCAN = new Set(["META_CUMPLIDA", "META_ARCHIVADA", "META_NO_ENCONTRADA"]);

function iguales(a: ValoresMeta, b: ValoresMeta): boolean {
  return (Object.keys(a) as (keyof ValoresMeta)[]).every((c) => a[c] === b[c]);
}

/**
 * Alta y edición de una meta (N-44, N-45, N-50 a N-56). Modo primero: las
 * cuentas se filtran por `cuentasAdmitidas` y cambiar el modo descarta la
 * elegida si ya no está. En el alta por apartado, el apartado inicial con su
 * origen: «Ya está en {cuenta}» por defecto (sin transferencia, RN-16).
 * Formulario controlado: un fallo nunca borra lo escrito.
 */
export function PanelMeta({ meta, fechaHoy, metas, cuentas, acciones, rutaCierre, alCerrar }: Props) {
  const router = useRouter();
  const panel = useRef<ControlPanel>(null);
  const alta = meta === undefined;
  const [iniciales] = useState<ValoresMeta>(() => (meta ? valoresEdicion(meta) : valoresAlta()));
  const [valores, setValores] = useState<ValoresMeta>(iniciales);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);
  const [pendiente, iniciar] = useTransition();

  const admitidas = cuentas ? cuentasAdmitidas(valores.modo, cuentas, metas, meta?.id) : [];
  const cuentaMeta = cuentas?.find((c) => c.id === valores.cuentaId) ?? null;
  const modoFijo = meta !== undefined && meta.modo === "apartado" && meta.historial.length > 0;
  const cambio = meta ? cambioDesde(meta, valores) : null;
  const conCambios = !iguales(iniciales, valores);
  const inicial = aDigitos(valores.aporteInicial);
  const conInicial = alta && valores.modo === "apartado" && inicial !== null && inicial !== "0" && cuentaMeta !== null;
  const origenes = cuentas && valores.cuentaId ? cuentasOrigen(cuentas, valores.cuentaId) : [];
  const origen = origenes.find((c) => c.id === valores.origenId) ?? null;
  const apartadoAqui = meta?.modo === "apartado" ? (meta.apartados?.apartadoAqui ?? 0n) : 0n;
  const pasaA = meta && apartadoAqui > 0n && valores.modo === "apartado" && cuentaMeta && cuentaMeta.id !== meta.cuenta.id ? cuentaMeta : null;

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

  function quitarError(...campos: CampoMeta[]) {
    setErrores((actual) => (campos.some((c) => actual[c]) ? { ...actual, ...Object.fromEntries(campos.map((c) => [c, undefined])) } : actual));
  }

  function cambiar<C extends keyof ValoresMeta>(campo: C, valor: ValoresMeta[C], ...limpiar: CampoMeta[]) {
    setValores((actual) => ({ ...actual, [campo]: valor }));
    quitarError(...limpiar);
  }

  function cambiarModo(modo: ModoMeta) {
    setValores((actual) => {
      const siguen = cuentas ? cuentasAdmitidas(modo, cuentas, metas, meta?.id) : [];
      const cuentaId = siguen.some((c) => c.id === actual.cuentaId) ? actual.cuentaId : null;
      return { ...actual, modo, cuentaId };
    });
    quitarError("modo", "cuentaId");
  }

  function elegirCuenta(id: string) {
    // El origen no puede ser la cuenta de la meta.
    setValores((actual) => ({ ...actual, cuentaId: id, origenId: actual.origenId === id ? null : actual.origenId }));
    quitarError("cuentaId", "cuentaOrigenId");
  }

  function cambiarFecha(precision: Precision, fecha: string) {
    setValores((actual) => ({ ...actual, precision, fecha }));
    quitarError("fechaMeta");
  }

  function mostrarFallo(resultado: Fallo) {
    if (resultado.campo) setErrores({ [resultado.campo]: resultado.mensaje });
    else setErrorGeneral(resultado.mensaje);
    if (REFRESCAN.has(resultado.codigo)) router.refresh();
  }

  function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente || cuentas === null) return;
    setErrorGeneral(null);
    const validacion = validarMeta(valores, alta);
    if ("errores" in validacion) {
      setErrores(validacion.errores);
      return;
    }
    if (!alta && cambio === null) return;
    setErrores({});
    setConfirmandoDescarte(false);
    const cuerpo = validacion.cuerpo;
    const enviado = cambio;
    iniciar(async () => {
      const resultado = meta && enviado ? await acciones.editar(meta.id, enviado) : await acciones.crear(cuerpo);
      if (resultado.ok) await cerrar(rutaMeta(resultado.id));
      else mostrarFallo(resultado);
    });
  }

  const etiqueta = alta ? (pendiente ? "Creando…" : "Crear meta") : pendiente ? "Guardando…" : "Guardar cambios";

  const pie = (
    <div className="flex flex-col gap-2">
      {confirmandoDescarte ? (
        <ConfirmarDescarte alDescartar={() => void cerrar()} alSeguir={() => setConfirmandoDescarte(false)} />
      ) : (
        <Boton
          type="submit"
          form={ID_FORMULARIO}
          disabled={pendiente || cuentas === null || (!alta && cambio === null)}
          className="w-full justify-center"
        >
          {etiqueta}
        </Boton>
      )}
      {errorGeneral && <MensajeError mensaje={errorGeneral} />}
    </div>
  );

  return (
    <PanelLateral ref={panel} titulo={alta ? "Nueva meta" : "Editar meta"} ancho="amplio" alSolicitarCierre={solicitarCierre} pie={pie}>
      {cuentas === null ? (
        <div role="alert" className="flex flex-col items-start gap-4">
          <p className="text-cuerpo font-semibold">No pudimos cargar tus cuentas.</p>
          <Boton variante="secundario" onClick={() => router.refresh()}>
            Reintentar
          </Boton>
        </div>
      ) : (
        <form id={ID_FORMULARIO} onSubmit={guardar} noValidate className="flex flex-col gap-6">
          <CampoSubrayado
            etiqueta="Nombre"
            name="nombre"
            autoComplete="off"
            maxLength={60}
            value={valores.nombre}
            onChange={(e) => cambiar("nombre", e.target.value, "nombre")}
            error={errores.nombre}
          />

          <div className="flex flex-col gap-1">
            <OpcionUnica nombre="meta-modo" etiqueta="Modo" opciones={OPCIONES_MODO} valor={valores.modo} alCambiar={cambiarModo} deshabilitado={modoFijo} error={errores.modo} />
            {modoFijo && <p className="text-etiqueta font-normal text-secundario">Una meta con aportes no cambia de modo.</p>}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-etiqueta text-secundario">Cuenta</span>
            {admitidas.length === 0 ? (
              <p className="text-etiqueta font-normal text-secundario">
                No hay cuentas para este modo. Crea una de {valores.modo === "apartado" ? "efectivo o banco" : "efectivo, banco o inversión"} en{" "}
                <EnlaceTexto href="/cuentas?nueva=1" className="h-auto">
                  Cuentas
                </EnlaceTexto>
                .
              </p>
            ) : (
              <div role="group" aria-label="Cuenta" className="grid grid-cols-2 gap-2">
                {admitidas.map((c) => (
                  <FichaCuenta key={c.id} cuenta={c} elegida={c.id === valores.cuentaId} alPulsar={() => elegirCuenta(c.id)} />
                ))}
              </div>
            )}
            {pasaA && (
              <p className="text-etiqueta font-normal text-secundario">
                Lo apartado (<span className="font-mono tabular-nums">{pesos(apartadoAqui)}</span>) pasa a {pasaA.nombre}.
              </p>
            )}
            {errores.cuentaId && <MensajeError mensaje={errores.cuentaId} />}
          </div>

          <CampoMonto
            valor={valores.objetivo}
            moneda="COP"
            etiqueta="Objetivo"
            editable={{ nombre: "meta-objetivo", alCambiar: (v) => cambiar("objetivo", v, "objetivo"), error: errores.objetivo }}
          />

          <CampoFechaMeta precision={valores.precision} valor={valores.fecha} alCambiar={cambiarFecha} fechaHoy={fechaHoy} error={errores.fechaMeta} />

          {alta && valores.modo === "apartado" && (
            <div className="flex flex-col">
              <CampoMonto
                valor={valores.aporteInicial}
                moneda="COP"
                etiqueta="Apartado inicial · opcional"
                editable={{
                  nombre: "meta-apartado-inicial",
                  alCambiar: (v) => cambiar("aporteInicial", v, "aporteInicial"),
                  error: errores.aporteInicial,
                }}
              />
              <Despliegue abierto={conInicial}>
                {cuentaMeta && (
                  <div className="flex flex-col gap-2">
                    <span className="text-etiqueta text-secundario">Desde</span>
                    <div role="group" aria-label="Desde" className="grid grid-cols-2 gap-2">
                      <FichaCuenta
                        cuenta={{ ...cuentaMeta, nombre: `Ya está en ${cuentaMeta.nombre}` }}
                        elegida={valores.origenId === null}
                        sinSaldo
                        alPulsar={() => cambiar("origenId", null, "cuentaOrigenId")}
                      />
                      {origenes.map((c) => (
                        <FichaCuenta key={c.id} cuenta={c} elegida={c.id === valores.origenId} alPulsar={() => cambiar("origenId", c.id, "cuentaOrigenId")} />
                      ))}
                    </div>
                    <p className="text-etiqueta font-normal text-secundario">
                      {origen
                        ? `Se registra una transferencia de ${origen.nombre} a ${cuentaMeta.nombre}.`
                        : `Marca dinero que ya está en ${cuentaMeta.nombre}.`}
                    </p>
                    {errores.cuentaOrigenId && <MensajeError mensaje={errores.cuentaOrigenId} />}
                  </div>
                )}
              </Despliegue>
            </div>
          )}
        </form>
      )}
    </PanelLateral>
  );
}
