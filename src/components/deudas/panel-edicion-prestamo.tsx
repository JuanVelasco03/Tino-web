"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { cambioDesde, type CampoEdicion, type ValoresEdicion } from "@/domain/prestamo/formulario";
import type { PrestamoCambio, PrestamoDetalle } from "@/domain/prestamo/tipos";
import { Boton } from "../boton";
import { CampoSubrayado } from "../campo-subrayado";
import { ConfirmarDescarte } from "../captura/panel-captura";
import { MensajeError } from "../mensaje-error";
import { PanelLateral, type ControlPanel } from "../panel-lateral";
import { RUTA_DEUDAS, rutaPrestamo } from "./rutas";
import { CampoFecha } from "../campo-fecha";
import { llamarAccion } from "@/lib/sin-conexion";
import { enfocarPrimerError } from "@/lib/enfocar-error";

type Fallo = { ok: false; codigo: string; mensaje: string; campo?: CampoEdicion };

/** Server action; llega por prop desde la página (los componentes no importan `app/`). */
export type AccionEditarPrestamo = (id: string, cambio: PrestamoCambio) => Promise<{ ok: true } | Fallo>;

type Props = {
  prestamo: Pick<PrestamoDetalle, "id" | "nombre" | "tipo" | "fechaAcordada" | "fechaHoy">;
  editar: AccionEditarPrestamo;
  /** Tras la salida de la hoja; por defecto navega. En `/estilos`, cierra la muestra. */
  alCerrar?: (destino: string) => void;
};

type Errores = Partial<Record<CampoEdicion, string>>;

const ID_FORMULARIO = "formulario-edicion-prestamo";

/**
 * Renombrar a la persona y mover o quitar la fecha acordada (N-56 a N-58).
 * Envía solo lo que cambió; sin cambios, «Guardar cambios» queda deshabilitado.
 */
export function PanelEdicionPrestamo({ prestamo, editar, alCerrar }: Props) {
  const router = useRouter();
  const panel = useRef<ControlPanel>(null);
  const [iniciales] = useState<ValoresEdicion>({ nombre: prestamo.nombre, fechaAcordada: prestamo.fechaAcordada ?? "" });
  const [valores, setValores] = useState<ValoresEdicion>(iniciales);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);
  const [pendiente, iniciar] = useTransition();

  const cambio = cambioDesde(iniciales, valores);

  async function cerrar() {
    const destino = rutaPrestamo(prestamo.id);
    await panel.current?.cerrar();
    if (alCerrar) alCerrar(destino);
    else router.replace(destino, { scroll: false });
  }

  function solicitarCierre() {
    if (pendiente) return;
    if (cambio) setConfirmandoDescarte(true);
    else void cerrar();
  }

  function cambiar(campo: keyof ValoresEdicion, valor: string) {
    setValores((actual) => ({ ...actual, [campo]: valor }));
    setErrores((actual) => (actual[campo] ? { ...actual, [campo]: undefined } : actual));
  }

  function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente || cambio === null) return;
    setErrorGeneral(null);
    if (valores.nombre.trim() === "") {
      setErrores({ nombre: "Escribe el nombre de la persona." });
      enfocarPrimerError(ID_FORMULARIO);
      return;
    }
    setErrores({});
    setConfirmandoDescarte(false);
    const enviado = cambio;
    iniciar(async () => {
      const resultado = await llamarAccion(() => editar(prestamo.id, enviado));
      if (resultado.ok) {
        await cerrar();
        return;
      }
      if (resultado.codigo === "PRESTAMO_NO_ENCONTRADO") {
        router.replace(RUTA_DEUDAS);
        return;
      }
      if (resultado.campo) {
        setErrores({ [resultado.campo]: resultado.mensaje });
        enfocarPrimerError(ID_FORMULARIO);
      } else setErrorGeneral(resultado.mensaje);
    });
  }

  const pie = (
    <div className="flex flex-col gap-2">
      {confirmandoDescarte ? (
        <ConfirmarDescarte alDescartar={() => void cerrar()} alSeguir={() => setConfirmandoDescarte(false)} />
      ) : (
        <Boton type="submit" form={ID_FORMULARIO} disabled={pendiente || cambio === null} className="w-full justify-center">
          {pendiente ? "Guardando…" : "Guardar cambios"}
        </Boton>
      )}
      {errorGeneral && <MensajeError mensaje={errorGeneral} />}
    </div>
  );

  return (
    <PanelLateral ref={panel} titulo={prestamo.tipo === "deuda_contraida" ? "Editar deuda" : "Editar préstamo"} alSolicitarCierre={solicitarCierre} pie={pie}>
      <form id={ID_FORMULARIO} onSubmit={guardar} noValidate className="flex flex-col gap-6">
        <CampoSubrayado
          etiqueta="Persona"
          name="nombre"
          autoComplete="off"
          maxLength={60}
          value={valores.nombre}
          onChange={(e) => cambiar("nombre", e.target.value)}
          error={errores.nombre}
        />
        <div className="flex flex-col items-start gap-1">
          <div className="w-full">
            <CampoFecha
              etiqueta="Fecha acordada"
              hoy={prestamo.fechaHoy}
              valor={valores.fechaAcordada}
              vacio="Sin fecha acordada"
              alCambiar={(fecha) => cambiar("fechaAcordada", fecha)}
              error={errores.fechaAcordada}
            />
          </div>
          {valores.fechaAcordada !== "" && (
            <Boton variante="texto" onClick={() => cambiar("fechaAcordada", "")} disabled={pendiente}>
              Quitar fecha
            </Boton>
          )}
        </div>
      </form>
    </PanelLateral>
  );
}
