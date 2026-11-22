import { redirect } from "next/navigation";
import { LibroMovimientos } from "@/components/movimientos/libro-movimientos";
import { NavegacionMes } from "@/components/movimientos/navegacion-mes";
import type { AccionesEdicion } from "@/components/movimientos/usar-edicion";
import { esMes, mesEnZona } from "@/domain/fecha/formato";
import { esSinClasificar } from "@/domain/movimiento/sin-clasificar";
import { cargar as cargarCaptura } from "@/services/captura";
import { listarDelMes } from "@/services/movimientos";
import { obtenerPrestamos } from "@/services/prestamos";
import { obtenerPerfil } from "@/services/perfil";
import { ajustarRegla, crearRegla, sugerir } from "../captura/acciones";
import { eliminarMovimiento, guardarMovimiento } from "./acciones";

export const metadata = { title: "Movimientos · Tino" };

const ACCIONES: AccionesEdicion = {
  guardar: guardarMovimiento,
  eliminar: eliminarMovimiento,
  sugerir,
  crearRegla,
  ajustarRegla,
};

/** Zona si el usuario no tiene perfil (anterior a SPEC 02): la de la moneda base del producto. */
const ZONA_POR_DEFECTO = "America/Bogota";

function texto(valor: string | string[] | undefined): string | undefined {
  return typeof valor === "string" ? valor : undefined;
}

/**
 * Movimientos de un mes. `?mes=YYYY-MM` elige el mes (sin él, el actual en
 * la zona del usuario); `?movimiento=<id>` abre su edición. Un mes mal
 * formado vuelve a `/movimientos`; un id que no está en el mes, a `?mes=`.
 * `?sinClasificar=1` (desde el resumen) deja solo los gastos sin clasificar;
 * otro valor se ignora.
 */
export default async function PaginaMovimientos({ searchParams }: PageProps<"/movimientos">) {
  const parametros = await searchParams;
  const mesPedido = texto(parametros.mes);
  const idPedido = texto(parametros.movimiento);
  const sinClasificar = texto(parametros.sinClasificar) === "1";
  if (mesPedido !== undefined && !esMes(mesPedido)) redirect("/movimientos");

  const [{ mes, movimientos }, perfil] = await Promise.all([
    listarDelMes(mesPedido),
    mesPedido === undefined ? null : obtenerPerfil(),
  ]);

  // Sin `?mes` manda la API; con él, el actual se calcula en la zona del perfil (REGLAS §6).
  const actual = mesPedido === undefined ? mes : mesEnZona(perfil?.zonaHoraria ?? ZONA_POR_DEFECTO, new Date());

  // La edición se busca en todo el mes: recién clasificado, el movimiento sale del filtro pero sigue abierto.
  let edicion = null;
  if (idPedido !== undefined) {
    const movimiento = movimientos.find((m) => m.id === idPedido);
    if (!movimiento) redirect(`/movimientos?mes=${mes}${sinClasificar ? "&sinClasificar=1" : ""}`);
    // Los préstamos solo se piden al abrir una edición: su cuenta no está entre las activas.
    const [datos, { prestamos }] = await Promise.all([cargarCaptura(), obtenerPrestamos()]);
    edicion = { movimiento, datos, prestamos };
  }
  const listados = sinClasificar ? movimientos.filter(esSinClasificar) : movimientos;

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-titulo-1">Movimientos</h1>
        <NavegacionMes mes={mes} actual={actual} />
      </header>
      <LibroMovimientos
        mes={mes}
        esActual={mes === actual}
        movimientos={listados}
        sinClasificar={sinClasificar}
        edicion={edicion}
        acciones={ACCIONES}
      />
    </div>
  );
}
