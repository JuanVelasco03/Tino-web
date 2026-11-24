import { notFound, redirect } from "next/navigation";
import { DetalleTarjeta } from "@/components/cuentas/detalle-tarjeta";
import { HistorialCuenta } from "@/components/cuentas/historial-cuenta";
import { PanelAjuste } from "@/components/cuentas/panel-ajuste";
import { PanelCuenta, type CuentaPago } from "@/components/cuentas/panel-cuenta";
import { rutaCuenta } from "@/components/cuentas/rutas";
import { obtenerCuenta, obtenerCuentas } from "@/services/cuentas";
import { obtenerCiclo, obtenerHistorial } from "@/services/detalle-cuenta";
import { esId } from "../../captura/entrada";
import { archivarCuenta, crearCuenta, editarCuenta, eliminarCuenta } from "../acciones";
import { conciliarMovimientos, consultarCompra, registrarAjuste } from "./acciones";

export const metadata = { title: "Cuenta · Tino" };

const ACCIONES_CUENTA = { crear: crearCuenta, editar: editarCuenta, archivar: archivarCuenta, eliminar: eliminarCuenta };

function texto(valor: string | string[] | undefined): string | undefined {
  return typeof valor === "string" ? valor : undefined;
}

/**
 * Detalle de una cuenta (SPEC 13). Efectivo y banco: historial con saldo
 * corrido, conciliación y ajuste (`?ajuste=1`); tarjeta: el ciclo con la
 * consulta de compra y «Registrar pago». `?desde=&hasta=` es el rango del
 * historial, tal cual a la API. `?editar=1` abre `PanelCuenta`. Préstamo,
 * cuenta ajena o inexistente → 404; inversión → `/inversiones`. Una
 * archivada se ve en solo lectura: `?ajuste=1` y `?editar=1` vuelven al
 * detalle, como `?ajuste=1` en una tarjeta.
 */
export default async function PaginaCuenta({ params, searchParams }: PageProps<"/cuentas/[id]">) {
  const [{ id }, parametros] = await Promise.all([params, searchParams]);
  if (!esId(id)) notFound();

  // Un préstamo, una cuenta ajena o inexistente: `404 CUENTA_NO_ENCONTRADA` → `null`.
  const cuenta = await obtenerCuenta(id);
  if (!cuenta) notFound();
  if (cuenta.tipo === "inversion") redirect(`/inversiones?inversion=${encodeURIComponent(id)}`);

  const desde = texto(parametros.desde);
  const hasta = texto(parametros.hasta);
  const pideEditar = texto(parametros.editar) === "1";
  const pideAjuste = texto(parametros.ajuste) === "1";
  const archivada = cuenta.archivadaEn !== null;
  const esTarjeta = cuenta.tipo === "tarjeta_credito";

  const rutaBase = rutaCuenta(id, { desde, hasta });
  if ((pideEditar && archivada) || (pideAjuste && (archivada || esTarjeta))) redirect(rutaBase);

  const rutaEditar = rutaCuenta(id, { desde, hasta, editar: "1" });
  const rutaAjuste = rutaCuenta(id, { desde, hasta, ajuste: "1" });

  // Cuentas de pago de una tarjeta: efectivo y banco activas, en su orden.
  let cuentasPago: CuentaPago[] = [];
  if (pideEditar && esTarjeta) {
    const lista = await obtenerCuentas();
    cuentasPago = lista.activos.cuentas.filter((c) => c.tipo === "efectivo" || c.tipo === "banco");
  }
  const panelCuenta = pideEditar ? (
    <PanelCuenta
      key={`editar-${cuenta.id}`}
      cuenta={cuenta}
      acciones={ACCIONES_CUENTA}
      cuentasPago={cuentasPago}
      rutaCierre={rutaBase}
      rutaTrasQuitar="/cuentas"
    />
  ) : null;

  if (esTarjeta) {
    const { fechaHoy, ciclo } = await obtenerCiclo(id);
    // Toda tarjeta trae `tarjeta` (SPEC 03); sin ella no hay nada que mostrar.
    if (!cuenta.tarjeta) notFound();
    return (
      <>
        <DetalleTarjeta
          cuenta={{ ...cuenta, tarjeta: cuenta.tarjeta }}
          fechaHoy={fechaHoy}
          ciclo={ciclo}
          rutaEditar={rutaEditar}
          consultar={consultarCompra}
        />
        {panelCuenta}
      </>
    );
  }

  const historial = await obtenerHistorial(id, { desde, hasta });

  return (
    <>
      <HistorialCuenta
        // La selección es del rango visible: cambiar de rango la limpia.
        key={`${historial.desde}:${historial.hasta ?? ""}`}
        cuenta={cuenta}
        historial={historial}
        pedido={{ desde, hasta }}
        rutas={{ ajuste: rutaAjuste, editar: rutaEditar }}
        conciliar={conciliarMovimientos}
      />
      {pideAjuste && (cuenta.tipo === "efectivo" || cuenta.tipo === "banco") && (
        <PanelAjuste
          key={`ajuste-${cuenta.id}`}
          cuenta={{ id: cuenta.id, tipo: cuenta.tipo }}
          historial={historial}
          rutaCierre={rutaBase}
          registrar={registrarAjuste}
        />
      )}
      {panelCuenta}
    </>
  );
}
