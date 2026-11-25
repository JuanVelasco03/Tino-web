"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { cuerpoAjuste, hayCambiosAjuste, ladoAjuste, valoresAjusteDesde, type ValoresAjuste } from "@/domain/movimiento/ajuste";
import { mesDeFecha } from "@/domain/fecha/formato";
import { cuentaArchivada } from "@/domain/movimiento/edicion";
import type { DatosCaptura } from "@/services/captura";
import type { CampoCaptura, Movimiento } from "@/services/movimientos";
import { BloqueEliminar } from "../bloque-eliminar";
import { Boton } from "../boton";
import { CampoMonto } from "../campo-monto";
import { CampoSubrayado } from "../campo-subrayado";
import { EnlaceTexto } from "../enlace-texto";
import { FichaCuenta } from "../captura/ficha-cuenta";
import { MAX_DESCRIPCION, MAX_NOTA } from "../captura/usar-formulario";
import { MensajeError } from "../mensaje-error";
import { PanelLateral, type ControlPanel } from "../panel-lateral";
import type { AccionesEdicion, ResultadoEdicion } from "./usar-edicion";
import { rutaLibro } from "@/domain/movimiento/sin-clasificar";

type Props = {
  /** Un movimiento de tipo `ajuste`. */
  movimiento: Movimiento;
  /** `GET /cuentas` (con la captura): las fichas de efectivo y banco. */
  datos: DatosCaptura;
  /** `"YYYY-MM"` del mes listado: cerrar vuelve a `?mes=`. */
  mes: string;
  sinClasificar?: boolean;
  acciones: Pick<AccionesEdicion, "guardar" | "eliminar">;
  alTerminar: (resultado: ResultadoEdicion) => void;
};

type Errores = Partial<Record<"monto" | "fecha" | "cuenta" | "descripcion" | "nota", string>>;

const CAMPOS: Partial<Record<CampoCaptura, keyof Errores>> = {
  monto: "monto",
  fecha: "fecha",
  cuenta: "cuenta",
  destino: "cuenta",
  descripcion: "descripcion",
  nota: "nota",
};

/**
 * Edición de un ajuste de saldo (`?movimiento=<id>` en `/movimientos`), en
 * `PanelLateral` (hoja inferior en móvil). Sin selector de tipo, sin
 * categoría ni partes: monto, fecha, cuenta (efectivo o banco, conservando el
 * lado), descripción y nota. Guarda con `PUT /movimientos/:id` y
 * `tipo: "ajuste"`; se elimina como cualquier movimiento.
 */
export function EdicionAjuste({ movimiento, datos, mes, sinClasificar = false, acciones, alTerminar }: Props) {
  const router = useRouter();
  const panel = useRef<ControlPanel>(null);
  const [iniciales] = useState<ValoresAjuste>(() => valoresAjusteDesde(movimiento));
  const [valores, setValores] = useState<ValoresAjuste>(iniciales);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [errorBorrado, setErrorBorrado] = useState<string | null>(null);
  const [accion, setAccion] = useState<"guardar" | "eliminar" | null>(null);
  const enCurso = useRef(false);

  const sube = ladoAjuste(movimiento) === "destino";
  const soloLectura = cuentaArchivada(movimiento, datos.cuentas);
  const cuentas = datos.cuentas.filter((c) => c.tipo === "efectivo" || c.tipo === "banco");
  const cambios = hayCambiosAjuste(iniciales, valores);
  const cuerpo = cuerpoAjuste(movimiento, valores);
  const ocupado = accion !== null;
  const nombreCuenta = (movimiento.cuentaDestino ?? movimiento.cuentaOrigen)?.nombre ?? "";

  async function cerrar() {
    await panel.current?.cerrar();
    router.replace(`${rutaLibro(sinClasificar)}?mes=${mes}`, { scroll: false });
  }

  function solicitarCierre() {
    if (ocupado) return;
    if (cambios && !soloLectura) setConfirmandoDescarte(true);
    else void cerrar();
  }

  function cambiar<C extends keyof ValoresAjuste>(campo: C, valor: ValoresAjuste[C]) {
    setValores((actual) => ({ ...actual, [campo]: valor }));
    const clave: keyof Errores = campo === "cuentaId" ? "cuenta" : campo;
    setErrores((actual) => (actual[clave] ? { ...actual, [clave]: undefined } : actual));
    setErrorGeneral(null);
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enCurso.current || soloLectura || !cuerpo) return;
    if (!cambios) {
      void cerrar();
      return;
    }
    enCurso.current = true;
    setAccion("guardar");
    setConfirmandoDescarte(false);
    setErrores({});
    setErrorGeneral(null);
    const resultado = await acciones.guardar(movimiento.id, cuerpo);
    enCurso.current = false;
    setAccion(null);
    if (!resultado.ok) {
      const campo = resultado.campo && CAMPOS[resultado.campo];
      if (campo) setErrores({ [campo]: resultado.mensaje });
      else setErrorGeneral(resultado.mensaje);
      return;
    }
    const mesGuardado = mesDeFecha(resultado.movimiento.fecha);
    alTerminar({ tipo: "guardado", movimiento: resultado.movimiento, mesNuevo: mesGuardado === mes ? null : mesGuardado, oferta: null });
    await cerrar();
  }

  async function eliminar() {
    if (enCurso.current || soloLectura) return;
    enCurso.current = true;
    setAccion("eliminar");
    setErrorBorrado(null);
    const resultado = await acciones.eliminar(movimiento.id);
    enCurso.current = false;
    setAccion(null);
    if (!resultado.ok) {
      setErrorBorrado(resultado.mensaje);
      return;
    }
    alTerminar({ tipo: "eliminado", movimiento });
    await cerrar();
  }

  const guardando = accion === "guardar";

  return (
    <PanelLateral ref={panel} titulo="Editar movimiento" alSolicitarCierre={solicitarCierre}>
      <form onSubmit={guardar} noValidate className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-cuerpo font-semibold">Ajuste de saldo</p>
          <p className="text-etiqueta font-normal text-secundario">
            {sube ? "Subió" : "Bajó"} el saldo de {nombreCuenta}. No cuenta como ingreso ni gasto en el resumen.
          </p>
        </div>

        {soloLectura && (
          <div className="flex flex-col items-start gap-1">
            <p className="text-etiqueta font-normal text-secundario">
              La cuenta {soloLectura.nombre} está archivada. Restáurala para modificar este movimiento.
            </p>
            <EnlaceTexto href="/cuentas/archivadas">Ver archivadas</EnlaceTexto>
          </div>
        )}

        <fieldset disabled={soloLectura !== null || ocupado} className="flex min-w-0 flex-col gap-6">
          <CampoMonto
            valor={valores.monto}
            moneda="COP"
            signo={sube ? "entrada" : "salida"}
            editable={{ nombre: "ajuste-monto", alCambiar: (v) => cambiar("monto", v), error: errores.monto }}
          />

          <CampoSubrayado
            etiqueta="Fecha"
            name="fecha"
            type="date"
            required
            value={valores.fecha}
            onChange={(e) => {
              if (e.target.value !== "") cambiar("fecha", e.target.value);
            }}
            error={errores.fecha}
            className="font-mono tabular-nums"
          />

          <div role="group" aria-label="Cuenta" className="flex flex-col gap-2">
            <span className="text-etiqueta font-normal text-secundario">Cuenta</span>
            <div className="grid grid-cols-2 gap-2">
              {cuentas.map((c) => (
                <FichaCuenta key={c.id} cuenta={c} elegida={c.id === valores.cuentaId} alPulsar={() => cambiar("cuentaId", c.id)} />
              ))}
            </div>
            {errores.cuenta && <MensajeError mensaje={errores.cuenta} />}
          </div>

          <CampoSubrayado
            etiqueta="Descripción"
            name="descripcion"
            autoComplete="off"
            maxLength={MAX_DESCRIPCION}
            value={valores.descripcion}
            onChange={(e) => cambiar("descripcion", e.target.value)}
            error={errores.descripcion}
          />

          <CampoSubrayado
            etiqueta="Nota · opcional"
            name="nota"
            autoComplete="off"
            maxLength={MAX_NOTA}
            value={valores.nota}
            onChange={(e) => cambiar("nota", e.target.value)}
            error={errores.nota}
          />
        </fieldset>

        {!soloLectura && (
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
              <Boton type="submit" disabled={ocupado || cuerpo === null} className="w-full justify-center">
                {guardando ? "Guardando…" : "Guardar cambios"}
              </Boton>
            )}
            {errorGeneral && <MensajeError mensaje={errorGeneral} />}
          </div>
        )}
      </form>

      {!soloLectura && (
        <div className="mt-6 border-t border-linea pt-6">
          {confirmandoBorrado ? (
            <BloqueEliminar
              nombre={movimiento.descripcion ?? "Ajuste"}
              detalle={`El saldo de ${nombreCuenta} vuelve a como estaba. No se puede deshacer.`}
              alConfirmar={() => void eliminar()}
              alCancelar={() => {
                setConfirmandoBorrado(false);
                setErrorBorrado(null);
              }}
              pendiente={accion === "eliminar"}
              error={errorBorrado}
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setConfirmandoDescarte(false);
                setConfirmandoBorrado(true);
              }}
              disabled={ocupado}
              className="py-2 text-etiqueta font-normal text-secundario hover:text-texto disabled:cursor-not-allowed"
            >
              Eliminar movimiento…
            </button>
          )}
        </div>
      )}
    </PanelLateral>
  );
}
