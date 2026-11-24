import { redirect } from "next/navigation";
import { ListaCuentas } from "@/components/cuentas/lista-cuentas";
import { PanelCuenta } from "@/components/cuentas/panel-cuenta";
import { obtenerCuentas } from "@/services/cuentas";
import { archivarCuenta, crearCuenta, editarCuenta, eliminarCuenta, guardarOrden } from "./acciones";

export const metadata = { title: "Cuentas · Tino" };

const ACCIONES = { crear: crearCuenta, editar: editarCuenta, archivar: archivarCuenta, eliminar: eliminarCuenta };

/**
 * `?cuenta=nueva` abre el panel de alta; `?cuenta=<id>`, la edición de una
 * cuenta no archivada sin salir de la lista (el lápiz de cada fila, SPEC 13).
 * Un id que no está en la lista vuelve a `/cuentas`.
 */
export default async function PaginaCuentas({ searchParams }: PageProps<"/cuentas">) {
  const [lista, { cuenta: parametro }] = await Promise.all([obtenerCuentas(), searchParams]);
  const valor = typeof parametro === "string" ? parametro : undefined;

  // «Se paga desde» de una tarjeta nueva: efectivo y banco activas, en su orden.
  const cuentasPago = lista.activos.cuentas.filter((c) => c.tipo === "efectivo" || c.tipo === "banco");

  let panel = null;
  if (valor === "nueva") {
    panel = <PanelCuenta key="nueva" cuenta={null} acciones={ACCIONES} cuentasPago={cuentasPago} />;
  } else if (valor !== undefined) {
    const cuenta = [...lista.activos.cuentas, ...lista.pasivos.cuentas].find((c) => c.id === valor);
    if (!cuenta) redirect("/cuentas");
    panel = <PanelCuenta key={cuenta.id} cuenta={cuenta} acciones={ACCIONES} cuentasPago={cuentasPago} />;
  }

  return (
    <>
      <ListaCuentas lista={lista} guardarOrden={guardarOrden} />
      {panel}
    </>
  );
}
