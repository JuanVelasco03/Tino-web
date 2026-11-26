"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { Cuenta, ResultadoCuenta } from "@/services/cuentas";
import { CampoSubrayado } from "../campo-subrayado";
import { Boton } from "../boton";
import { EnlaceTexto } from "../enlace-texto";
import { IconoCuenta, ROTULO_TIPO_CUENTA } from "../iconos";
import { MensajeError } from "../mensaje-error";
import { BloqueEliminar, DETALLE_ELIMINAR_CUENTA } from "../bloque-eliminar";
import Link from "next/link";
import { enlaceCuenta } from "./rutas";
import { llamarAccion } from "./sin-conexion";

type Props = {
  cuentas: Cuenta[];
  /** Server actions; llegan por prop desde la página. */
  restaurar: (id: string, nombre?: string) => Promise<ResultadoCuenta>;
  eliminar: (id: string) => Promise<ResultadoCuenta>;
};

/** Cabecera de /cuentas/archivadas, compartida con la carga y el error. */
export function CabeceraArchivadas() {
  return (
    <header className="flex flex-col items-start gap-1">
      <EnlaceTexto href="/cuentas">‹ Cuentas</EnlaceTexto>
      <h1 className="text-titulo-1">Cuentas archivadas</h1>
    </header>
  );
}

/** Lista de cuentas archivadas, en el orden de la API (la más reciente primero). */
export function ListaArchivadas({ cuentas, restaurar, eliminar }: Props) {
  return (
    <div className="asentar flex flex-col gap-6 md:gap-8">
      <CabeceraArchivadas />
      {cuentas.length === 0 ? (
        <p className="border-t border-raya pt-6 text-cuerpo text-secundario">No tienes cuentas archivadas.</p>
      ) : (
        <ul className="border-t border-raya">
          {cuentas.map((cuenta) => (
            <FilaArchivada key={cuenta.id} cuenta={cuenta} restaurar={restaurar} eliminar={eliminar} />
          ))}
        </ul>
      )}
    </div>
  );
}

type PropsFila = {
  cuenta: Cuenta;
  restaurar: Props["restaurar"];
  eliminar: Props["eliminar"];
};

type Modo = "normal" | "renombrar" | "eliminar";

function subtitulo(cuenta: Cuenta): string {
  const tipo = ROTULO_TIPO_CUENTA[cuenta.tipo];
  return cuenta.detalle ? `${tipo} · ${cuenta.detalle}` : tipo;
}

/**
 * Fila de una archivada: «Restaurar» y «Eliminar…». Si el nombre choca al
 * restaurar, la fila se abre en su lugar (C19) para renombrar; el borrado
 * se confirma en la fila (C26).
 */
function FilaArchivada({ cuenta, restaurar, eliminar }: PropsFila) {
  const [modo, setModo] = useState<Modo>("normal");
  const [nombre, setNombre] = useState(cuenta.nombre);
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  function volver() {
    setModo("normal");
    setError(null);
    setErrorNombre(null);
  }

  function restaurarSinCuerpo() {
    if (pendiente) return;
    setError(null);
    iniciar(async () => {
      const resultado = await llamarAccion(() => restaurar(cuenta.id));
      if (resultado.ok) return; // La lista revalidada ya no la trae.
      if (resultado.codigo === "NOMBRE_DUPLICADO") {
        setNombre(cuenta.nombre);
        setModo("renombrar");
        return;
      }
      setError(resultado.mensaje);
    });
  }

  function restaurarConNombre(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente) return;
    setError(null);
    setErrorNombre(null);
    iniciar(async () => {
      const resultado = await llamarAccion(() => restaurar(cuenta.id, nombre));
      if (resultado.ok) return;
      if (resultado.campo === "nombre") setErrorNombre(resultado.mensaje);
      else setError(resultado.mensaje);
    });
  }

  function confirmarBorrado() {
    if (pendiente) return;
    setError(null);
    iniciar(async () => {
      const resultado = await llamarAccion(() => eliminar(cuenta.id));
      if (!resultado.ok) setError(resultado.mensaje);
    });
  }

  const abierta = modo === "renombrar";

  return (
    <li
      className={`grid grid-cols-[20px_minmax(0,1fr)] gap-x-3 py-3 md:grid-cols-[24px_minmax(0,1fr)_auto] ${
        abierta ? "-mt-px border-y border-raya bg-superficie px-4 md:px-6" : "border-b border-linea last:border-b-0"
      }`}
    >
      <span className="flex min-h-10 items-center text-secundario">
        <IconoCuenta tipo={cuenta.tipo} />
      </span>

      <div className="flex min-h-10 min-w-0 flex-col justify-center">
        {/* El nombre abre su detalle en solo lectura (SPEC 13). */}
        <Link
          href={enlaceCuenta(cuenta)}
          // Objetivo táctil de 46 px sin cambiar el alto de la fila (el recorte va en el hijo, no aquí).
          className="relative block text-cuerpo font-semibold after:absolute after:inset-x-0 after:-inset-y-3 hover:text-marca-texto"
        >
          <span className="block truncate">{cuenta.nombre}</span>
        </Link>
        {!abierta && <div className="truncate text-etiqueta font-normal text-secundario">{subtitulo(cuenta)}</div>}
      </div>

      {modo === "normal" && (
        <div className="col-start-2 flex items-center gap-4 md:col-start-3 md:row-start-1 md:justify-end">
          <Boton compacto variante="texto" onClick={restaurarSinCuerpo} disabled={pendiente}>
            {pendiente ? "Restaurando…" : "Restaurar"}
          </Boton>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setModo("eliminar");
            }}
            disabled={pendiente}
            className="h-11 px-1 text-cuerpo text-secundario hover:text-texto disabled:cursor-not-allowed"
          >
            Eliminar…
          </button>
        </div>
      )}

      {abierta && (
        <form onSubmit={restaurarConNombre} noValidate className="col-start-2 flex flex-col gap-4 pt-1 pb-2 md:col-end-4">
          <p className="text-etiqueta font-normal text-secundario">
            Ya tienes una cuenta con ese nombre. Elige otro para restaurarla.
          </p>
          <div className="max-w-sm">
            <CampoSubrayado
              etiqueta="Nombre"
              name="nombre"
              autoComplete="off"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                setErrorNombre(null);
              }}
              error={errorNombre ?? undefined}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Boton type="submit" disabled={pendiente}>
              {pendiente ? "Restaurando…" : "Restaurar con este nombre"}
            </Boton>
            <Boton variante="texto" onClick={volver} disabled={pendiente}>
              Cancelar
            </Boton>
          </div>
        </form>
      )}

      {modo === "eliminar" && (
        <div className="col-start-2 pt-2 pb-2 md:col-end-4">
          <BloqueEliminar
            nombre={cuenta.nombre}
            detalle={DETALLE_ELIMINAR_CUENTA}
            alConfirmar={confirmarBorrado}
            alCancelar={volver}
            pendiente={pendiente}
            error={error}
          />
        </div>
      )}

      {error && modo !== "eliminar" && (
        <MensajeError mensaje={error} className="col-start-2 pb-1 md:col-end-4" />
      )}
    </li>
  );
}
