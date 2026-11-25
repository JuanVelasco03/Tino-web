"use client";

import { useRouter } from "next/navigation";
import type { DatosCaptura } from "@/services/captura";
import type { Movimiento } from "@/services/movimientos";
import { HojaCaptura } from "../captura/hoja-captura";
import { PanelCaptura } from "../captura/panel-captura";
import { useEscritorio } from "../captura/proveedor-captura";
import { useEdicion, type AccionesEdicion, type PrestamoDeEdicion, type ResultadoEdicion } from "./usar-edicion";
import { rutaLibro } from "@/domain/movimiento/sin-clasificar";

type Props = {
  movimiento: Movimiento;
  datos: DatosCaptura;
  /** `"YYYY-MM"` del mes listado: cerrar vuelve a `?mes=`. */
  mes: string;
  /** Los préstamos: la cuenta de uno queda fija y el tipo, bloqueado. */
  prestamos?: readonly PrestamoDeEdicion[];
  /** Abierta desde `/movimientos/sin-clasificar`: cerrar vuelve ahí. */
  sinClasificar?: boolean;
  acciones: AccionesEdicion;
  alTerminar: (resultado: ResultadoEdicion) => void;
};

/**
 * Edición de un movimiento abierta por URL (`?movimiento=<id>`): el mismo
 * formulario de la captura en modo edición. Escritorio: panel de 480 px.
 * Móvil: la hoja a pantalla completa con teclado propio.
 */
export function EdicionMovimiento({ movimiento, datos, mes, prestamos, sinClasificar = false, acciones, alTerminar }: Props) {
  const router = useRouter();
  const escritorio = useEscritorio();
  const edicion = useEdicion({
    movimiento,
    datos,
    mes,
    prestamos,
    acciones,
    alTerminar,
    alCerrar: () => router.replace(`${rutaLibro(sinClasificar)}?mes=${mes}`, { scroll: false }),
  });
  return escritorio ? <PanelCaptura c={edicion} /> : <HojaCaptura c={edicion} />;
}
