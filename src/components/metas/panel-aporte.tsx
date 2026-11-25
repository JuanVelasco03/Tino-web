"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { aDigitos, desdeMonto } from "@/domain/dinero/entrada";
import { cuentasOrigen, validarAporte, type CampoAporte, type ValoresAporte } from "@/domain/meta/formulario";
import { pesos } from "@/domain/meta/presentacion";
import type { AporteCambio, AporteCuerpo, FilaAporte, MetaDetalle } from "@/domain/meta/tipos";
import type { Cuenta } from "@/services/cuentas";
import { BloqueEliminar, PedirEliminar } from "../bloque-eliminar";
import { Boton } from "../boton";
import { CampoMonto } from "../campo-monto";
import { CampoSubrayado } from "../campo-subrayado";
import { FichaCuenta } from "../captura/ficha-cuenta";
import { ConfirmarDescarte } from "../captura/panel-captura";
import { MensajeError } from "../mensaje-error";
import { OpcionUnica } from "../opcion-unica";
import { PanelLateral, type ControlPanel } from "../panel-lateral";
import { rutaMeta } from "./rutas";
import { CampoFecha } from "../campo-fecha";

type Fallo = { ok: false; codigo: string; mensaje: string; campo?: CampoAporte };
type Resultado = { ok: true } | Fallo;

/** Server actions; llegan por prop desde la página (los componentes no importan `app/`). */
export type AccionesPanelAporte = {
  registrar: (id: string, cuerpo: AporteCuerpo) => Promise<Resultado>;
  editar: (id: string, aporteId: string, cambio: AporteCambio) => Promise<Resultado>;
  eliminar: (id: string, aporteId: string) => Promise<{ ok: true } | { ok: false; codigo: string; mensaje: string }>;
};

type Props = {
  meta: MetaDetalle;
  /** Hoy según la API: fecha por defecto y `max`. */
  fechaHoy: string;
  /** Al registrar: el tipo con que abre (`&registrar=`). En toda la cuenta, siempre aporte. */
  tipoInicial?: "aporte" | "retiro";
  /** Con ella, edición de ese aporte o retiro (`&aporte=<id>`). */
  aporte?: FilaAporte;
  /** Cuentas activas (`GET /cuentas`); `null` si no se pudieron cargar. */
  cuentas: readonly Cuenta[] | null;
  acciones: AccionesPanelAporte;
  /** Tras la salida de la hoja; por defecto navega. En `/estilos`, cierra la muestra. */
  alCerrar?: (destino: string) => void;
};

type Errores = Partial<Record<CampoAporte, string>>;

const ID_FORMULARIO = "formulario-aporte";

/** El estado cambió en otro lado: se muestra el `mensaje` y se refresca. */
const REFRESCAN = new Set(["META_CUMPLIDA", "META_ARCHIVADA"]);

function valoresIniciales(meta: MetaDetalle, fechaHoy: string, tipo: "aporte" | "retiro", aporte?: FilaAporte): ValoresAporte {
  if (aporte) {
    return {
      modo: meta.modo,
      tipo: aporte.tipo,
      monto: desdeMonto(aporte.monto),
      fecha: aporte.fecha,
      origenId: aporte.cuentaOrigen?.id ?? null,
      motivo: aporte.motivo ?? "",
    };
  }
  return { modo: meta.modo, tipo: meta.modo === "cuenta" ? "aporte" : tipo, monto: "", fecha: fechaHoy, origenId: null, motivo: "" };
}

function detalleEliminar(aporte: FilaAporte, cuenta: string): string {
  if (aporte.cuentaOrigen) return `También se borra su transferencia de ${aporte.cuentaOrigen.nombre} a ${cuenta}. No se puede deshacer.`;
  return aporte.tipo === "aporte"
    ? `Lo apartado baja en ${pesos(aporte.monto)}. No se puede deshacer.`
    : `Lo apartado vuelve a subir en ${pesos(aporte.monto)}. No se puede deshacer.`;
}

/**
 * Registrar un aporte o retiro, o corregir uno (N-34 a N-41, N-46). Por
 * apartado, «Ya está en {cuenta}» va elegida por defecto: nada se transfiere
 * salvo que el usuario elija un origen (RN-16). El retiro solo libera; el
 * gasto se registra aparte. En toda la cuenta, el origen es obligatorio.
 */
export function PanelAporte({ meta, fechaHoy, tipoInicial = "aporte", aporte, cuentas, acciones, alCerrar }: Props) {
  const router = useRouter();
  const panel = useRef<ControlPanel>(null);
  const edicion = aporte !== undefined;
  const [iniciales] = useState<ValoresAporte>(() => valoresIniciales(meta, fechaHoy, tipoInicial, aporte));
  const [valores, setValores] = useState<ValoresAporte>(iniciales);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [errorBorrado, setErrorBorrado] = useState<string | null>(null);
  const [accion, setAccion] = useState<"guardar" | "eliminar" | null>(null);
  const [pendiente, iniciar] = useTransition();

  const apartado = meta.modo === "apartado";
  const cumplida = meta.cumplidaEl !== null;
  const cuenta = meta.cuenta.nombre;
  const retiro = valores.tipo === "retiro";
  const origenes = cuentas ? cuentasOrigen(cuentas, meta.cuenta.id) : [];
  const origen = origenes.find((c) => c.id === valores.origenId) ?? null;
  const conCambios = (Object.keys(iniciales) as (keyof ValoresAporte)[]).some((c) => iniciales[c] !== valores[c]);
  const digitos = aDigitos(valores.monto);
  const monto = digitos !== null && digitos !== "0" ? pesos(BigInt(digitos)) : undefined;
  const sinCuentas = cuentas === null && !edicion && !retiro;

  async function cerrar(destino = rutaMeta(meta.id)) {
    await panel.current?.cerrar();
    if (alCerrar) alCerrar(destino);
    else router.replace(destino, { scroll: false });
  }

  function solicitarCierre() {
    if (pendiente) return;
    if (conCambios) setConfirmandoDescarte(true);
    else void cerrar();
  }

  function cambiar<C extends keyof ValoresAporte>(campo: C, valor: ValoresAporte[C], limpiar: CampoAporte) {
    setValores((actual) => ({ ...actual, [campo]: valor }));
    setErrores((actual) => (actual[limpiar] ? { ...actual, [limpiar]: undefined } : actual));
  }

  function mostrarFallo(resultado: Fallo) {
    if (resultado.codigo === "APORTE_NO_ENCONTRADO") {
      router.refresh();
      void cerrar();
      return;
    }
    if (resultado.campo) setErrores({ [resultado.campo]: resultado.mensaje });
    else setErrorGeneral(resultado.mensaje);
    if (REFRESCAN.has(resultado.codigo)) router.refresh();
  }

  function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente || sinCuentas || (edicion && !conCambios)) return;
    setErrorGeneral(null);
    const validacion = validarAporte(valores);
    if ("errores" in validacion) {
      setErrores(validacion.errores);
      return;
    }
    setErrores({});
    setConfirmandoDescarte(false);
    setAccion("guardar");
    const cuerpo = validacion.cuerpo;
    // El tipo de un aporte es fijo: el `PUT` no lo lleva.
    const cambio: AporteCambio = { monto: cuerpo.monto, fecha: cuerpo.fecha, motivo: cuerpo.motivo };
    if (cuerpo.cuentaOrigenId !== undefined) cambio.cuentaOrigenId = cuerpo.cuentaOrigenId;
    iniciar(async () => {
      const resultado = aporte ? await acciones.editar(meta.id, aporte.id, cambio) : await acciones.registrar(meta.id, cuerpo);
      setAccion(null);
      if (resultado.ok) await cerrar();
      else mostrarFallo(resultado);
    });
  }

  function eliminar() {
    if (!aporte || pendiente) return;
    setErrorBorrado(null);
    setAccion("eliminar");
    iniciar(async () => {
      const resultado = await acciones.eliminar(meta.id, aporte.id);
      setAccion(null);
      if (resultado.ok || resultado.codigo === "APORTE_NO_ENCONTRADO") {
        if (!resultado.ok) router.refresh();
        await cerrar();
        return;
      }
      setErrorBorrado(resultado.mensaje);
      if (REFRESCAN.has(resultado.codigo)) router.refresh();
    });
  }

  const titulo = edicion ? (retiro ? "Editar retiro" : "Editar aporte") : `${retiro ? "Registrar retiro" : "Registrar aporte"} · ${meta.nombre}`;
  const etiqueta =
    accion === "guardar" ? (edicion ? "Guardando…" : "Registrando…") : edicion ? "Guardar cambios" : retiro ? "Registrar retiro" : "Registrar aporte";

  const pie = (
    <div className="flex flex-col gap-3">
      {confirmandoDescarte ? (
        <ConfirmarDescarte alDescartar={() => void cerrar()} alSeguir={() => setConfirmandoDescarte(false)} />
      ) : (
        <Boton
          type="submit"
          form={ID_FORMULARIO}
          disabled={pendiente || sinCuentas || (edicion && !conCambios)}
          monto={edicion || accion === "guardar" ? undefined : monto}
          className="w-full justify-center"
        >
          {etiqueta}
        </Boton>
      )}
      {errorGeneral && <MensajeError mensaje={errorGeneral} />}
      {aporte && !confirmandoDescarte && (
        <div className="mt-2 border-t border-linea pt-4">
          {confirmandoBorrado ? (
            <BloqueEliminar
              nombre={aporte.tipo}
              detalle={detalleEliminar(aporte, cuenta)}
              alConfirmar={eliminar}
              alCancelar={() => {
                setConfirmandoBorrado(false);
                setErrorBorrado(null);
              }}
              pendiente={accion === "eliminar"}
              error={errorBorrado}
            />
          ) : (
            <PedirEliminar onClick={() => setConfirmandoBorrado(true)} disabled={pendiente}>
              {aporte.tipo === "retiro" ? "Eliminar retiro…" : "Eliminar aporte…"}
            </PedirEliminar>
          )}
        </div>
      )}
    </div>
  );

  return (
    <PanelLateral ref={panel} titulo={titulo} alSolicitarCierre={solicitarCierre} pie={pie}>
      <form id={ID_FORMULARIO} onSubmit={guardar} noValidate className="flex flex-col gap-6">
        {apartado && !edicion && (
          <OpcionUnica
            nombre="aporte-tipo"
            etiqueta="Tipo"
            opciones={[
              { valor: "aporte", rotulo: "Aporte", detalle: "Aparta dinero para esta meta.", deshabilitada: cumplida },
              { valor: "retiro", rotulo: "Retiro", detalle: "Libera lo apartado." },
            ]}
            valor={valores.tipo}
            alCambiar={(tipo) => cambiar("tipo", tipo, "tipo")}
            error={errores.tipo}
          />
        )}

        <CampoMonto
          valor={valores.monto}
          moneda="COP"
          etiqueta="Monto"
          editable={{ nombre: "aporte-monto", alCambiar: (v) => cambiar("monto", v, "monto"), error: errores.monto }}
        />

        <CampoFecha
          etiqueta="Fecha"
          hoy={fechaHoy}
          min={meta.creadaEl}
          max={fechaHoy}
          valor={valores.fecha}
          alCambiar={(fecha) => cambiar("fecha", fecha, "fecha")}
          error={errores.fecha}
        />

        {edicion && aporte.tipo === "aporte" && (
          <div className="flex flex-col gap-1">
            <p className="text-cuerpo">{aporte.cuentaOrigen ? `Desde ${aporte.cuentaOrigen.nombre}` : `Ya estaba en ${cuenta}`}</p>
            {aporte.cuentaOrigen && <p className="text-etiqueta font-normal text-secundario">Con origen, el cambio también corrige su transferencia.</p>}
            {errores.cuentaOrigenId && <MensajeError mensaje={errores.cuentaOrigenId} />}
          </div>
        )}

        {!edicion && !retiro && (
          <div className="flex flex-col gap-2">
            <span className="text-etiqueta text-secundario">Desde</span>
            {cuentas === null ? (
              <MensajeError mensaje="No pudimos cargar tus cuentas." />
            ) : (
              <div role="group" aria-label="Desde" className="grid grid-cols-2 gap-2">
                {apartado && (
                  <FichaCuenta
                    cuenta={{ nombre: `Ya está en ${cuenta}`, tipo: meta.cuenta.tipo, naturaleza: "activo", saldo: 0n }}
                    elegida={valores.origenId === null}
                    sinSaldo
                    alPulsar={() => cambiar("origenId", null, "cuentaOrigenId")}
                  />
                )}
                {origenes.map((c) => (
                  <FichaCuenta key={c.id} cuenta={c} elegida={c.id === valores.origenId} alPulsar={() => cambiar("origenId", c.id, "cuentaOrigenId")} />
                ))}
              </div>
            )}
            {origen ? (
              <p className="text-etiqueta font-normal text-secundario">
                Se registra una transferencia de {origen.nombre} a {cuenta}.
              </p>
            ) : (
              apartado &&
              meta.apartados && (
                <p className="text-etiqueta font-normal text-secundario">
                  Marca dinero que ya está en {cuenta}. Saldo libre: <span className="font-mono tabular-nums">{pesos(meta.apartados.libre)}</span>.
                </p>
              )
            )}
            {errores.cuentaOrigenId && <MensajeError mensaje={errores.cuentaOrigenId} />}
          </div>
        )}

        {retiro && (
          <div className="flex flex-col gap-1">
            <p className="text-etiqueta font-normal text-secundario">Liberar no registra un gasto. Si lo gastaste, regístralo aparte en Movimientos.</p>
            {meta.apartados && (
              <p className="text-etiqueta font-normal text-secundario">
                Apartado hoy: <span className="font-mono tabular-nums">{pesos(meta.apartados.apartadoAqui)}</span>
              </p>
            )}
          </div>
        )}

        <CampoSubrayado
          etiqueta="Motivo · opcional"
          name="motivo"
          autoComplete="off"
          maxLength={80}
          value={valores.motivo}
          onChange={(e) => cambiar("motivo", e.target.value, "motivo")}
          error={errores.motivo}
        />
      </form>
    </PanelLateral>
  );
}
