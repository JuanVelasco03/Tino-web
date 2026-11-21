"use client";

import { useRouter } from "next/navigation";
import type { DatosCaptura } from "@/services/captura";
import type { Movimiento } from "@/services/movimientos";
import { HojaCaptura } from "../captura/hoja-captura";
import { PanelCaptura } from "../captura/panel-captura";
import { useEscritorio } from "../captura/proveedor-captura";
import { useEdicion, type AccionesEdicion, type ResultadoEdicion } from "./usar-edicion";

type Props = {
  movimiento: Movimiento;
  datos: DatosCaptura;
  /** `"YYYY-MM"` del mes listado: cerrar vuelve a `?mes=`. */
  mes: string;
  /** Abierta desde el filtro de gastos sin clasificar: cerrar vuelve a él. */
  sinClasificar?: boolean;
  acciones: AccionesEdicion;
  alTerminar: (resultado: ResultadoEdicion) => void;
};

/**
 * Edición de un movimiento abierta por URL (`?movimiento=<id>`): el mismo
 * formulario de la captura en modo edición. Escritorio: panel de 480 px.
 * Móvil: la hoja a pantalla completa con teclado propio.
 */
export function EdicionMovimiento({ movimiento, datos, mes, sinClasificar = false, acciones, alTerminar }: Props) {
  const router = useRouter();
  const escritorio = useEscritorio();
  const edicion = useEdicion({
    movimiento,
    datos,
    mes,
    acciones,
    alTerminar,
    alCerrar: () => router.replace(`/movimientos?mes=${mes}${sinClasificar ? "&sinClasificar=1" : ""}`, { scroll: false }),
  });
  return escritorio ? <PanelCaptura c={edicion} /> : <HojaCaptura c={edicion} />;
}
