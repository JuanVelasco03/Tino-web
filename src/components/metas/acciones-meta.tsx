"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { accionesMeta, type AccionMeta } from "@/domain/meta/presentacion";
import type { MetaDetalle } from "@/domain/meta/tipos";
import { BloqueEliminar } from "../bloque-eliminar";
import { Boton } from "../boton";
import { BOTON_ENLACE } from "../deudas/rutas";
import { rutaInversion } from "../inversiones/rutas";
import { MensajeError } from "../mensaje-error";
import { RUTA_ARCHIVADAS, RUTA_METAS, rutaEditar, rutaMeta, rutaRegistrar } from "./rutas";

type Fallo = { ok: false; codigo: string; mensaje: string };
type Resultado = { ok: true } | Fallo;

/** Server actions; llegan por prop desde la página (los componentes no importan `app/`). */
export type AccionesDetalleMeta = {
  archivar: (id: string) => Promise<Resultado>;
  restaurar: (id: string) => Promise<Resultado>;
  eliminar: (id: string) => Promise<Resultado>;
};

type Props = {
  meta: MetaDetalle;
  acciones: AccionesDetalleMeta;
  /** Tras archivar, restaurar o eliminar; por defecto navega. En `/estilos`, no hace nada. */
  alNavegar?: (destino: string) => void;
};

/** Al archivar, el estado cambió en otro lado: se muestra el `mensaje` y se refresca. */
const REFRESCAN = new Set(["APARTADO_NO_CERO", "META_NO_CUMPLIDA", "META_ARCHIVADA", "META_NO_ARCHIVADA", "META_NO_ENCONTRADA"]);

function detalleEliminar(m: MetaDetalle): string {
  return m.modo === "apartado"
    ? "Se borra con sus aportes y retiros, y lo apartado queda libre. Las transferencias siguen en Movimientos. No se puede deshacer."
    : "Se borra la meta; la cuenta y sus movimientos no cambian. No se puede deshacer.";
}

/**
 * Botones del detalle según estado y modo (`accionesMeta`): enlaces a los
 * paneles, «Archivar» y «Restaurar» sin confirmación, y «Eliminar meta…»
 * como vínculo discreto que abre `BloqueEliminar` en su lugar. Nada es
 * optimista: cada acción espera la respuesta y la página se revalida.
 */
export function AccionesMeta({ meta: m, acciones, alNavegar }: Props) {
  const router = useRouter();
  const [enCurso, setEnCurso] = useState<"archivar" | "restaurar" | "eliminar" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [errorBorrado, setErrorBorrado] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  const lista = accionesMeta(m);
  const archivada = m.archivadaEn !== null;

  function navegar(destino: string) {
    if (alNavegar) alNavegar(destino);
    else router.push(destino, { scroll: false });
  }

  function ejecutar(accion: "archivar" | "restaurar", destino: string) {
    if (pendiente) return;
    setError(null);
    setEnCurso(accion);
    iniciar(async () => {
      const resultado = await acciones[accion](m.id);
      setEnCurso(null);
      if (resultado.ok) {
        navegar(destino);
        return;
      }
      setError(resultado.mensaje);
      if (REFRESCAN.has(resultado.codigo)) router.refresh();
    });
  }

  function eliminar() {
    if (pendiente) return;
    setErrorBorrado(null);
    setEnCurso("eliminar");
    iniciar(async () => {
      const resultado = await acciones.eliminar(m.id);
      setEnCurso(null);
      if (resultado.ok || resultado.codigo === "META_NO_ENCONTRADA") {
        navegar(archivada ? RUTA_ARCHIVADAS : RUTA_METAS);
        return;
      }
      setErrorBorrado(resultado.mensaje);
    });
  }

  function boton(accion: AccionMeta) {
    switch (accion) {
      case "registrar_aporte":
        return (
          <Link key={accion} href={rutaRegistrar(m.id, "aporte")} scroll={false} className={BOTON_ENLACE.primario}>
            Registrar aporte
          </Link>
        );
      case "ver_inversiones":
        return (
          <Link key={accion} href={rutaInversion(m.cuenta.id)} className={BOTON_ENLACE.primario}>
            Ver inversiones
          </Link>
        );
      case "editar":
        return (
          <Link key={accion} href={rutaEditar(m.id)} scroll={false} className={BOTON_ENLACE.secundario}>
            Editar meta
          </Link>
        );
      case "registrar_retiro":
        return (
          <Link key={accion} href={rutaRegistrar(m.id, "retiro")} scroll={false} className={BOTON_ENLACE.secundario}>
            Registrar retiro
          </Link>
        );
      case "archivar":
        return (
          <Boton key={accion} variante="secundario" onClick={() => ejecutar("archivar", RUTA_METAS)} disabled={pendiente} className="justify-center">
            {enCurso === "archivar" ? "Archivando…" : "Archivar"}
          </Boton>
        );
      case "restaurar":
        return (
          <Boton key={accion} onClick={() => ejecutar("restaurar", rutaMeta(m.id))} disabled={pendiente} className="justify-center">
            {enCurso === "restaurar" ? "Restaurando…" : "Restaurar"}
          </Boton>
        );
      case "eliminar":
        return null;
    }
  }

  const botones = lista.filter((a) => a !== "eliminar");

  return (
    <div className="flex flex-col gap-3">
      {botones.length > 0 && (
        <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">{botones.map(boton)}</div>
      )}
      {lista.includes("registrar_retiro") && <p className="text-etiqueta font-normal text-secundario">Para archivarla, retira lo apartado.</p>}
      {error && <MensajeError mensaje={error} />}
      {lista.includes("eliminar") &&
        (confirmando ? (
          <BloqueEliminar
            nombre={m.nombre}
            detalle={detalleEliminar(m)}
            alConfirmar={eliminar}
            alCancelar={() => {
              setConfirmando(false);
              setErrorBorrado(null);
            }}
            pendiente={enCurso === "eliminar"}
            error={errorBorrado}
          />
        ) : (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            disabled={pendiente}
            className="self-start py-2 text-etiqueta font-normal text-secundario hover:text-texto disabled:cursor-not-allowed"
          >
            Eliminar meta…
          </button>
        ))}
    </div>
  );
}
