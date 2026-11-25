import { redirect } from "next/navigation";
import { LibroMovimientos } from "@/components/movimientos/libro-movimientos";
import type { AccionesEdicion } from "@/components/movimientos/usar-edicion";
import { esMes, mesEnZona } from "@/domain/fecha/formato";
import { esSinClasificar, rutaLibro } from "@/domain/movimiento/sin-clasificar";
import { cargar as cargarCaptura } from "@/services/captura";
import { listarDelMes } from "@/services/movimientos";
import { obtenerPrestamos } from "@/services/prestamos";
import { obtenerPerfil } from "@/services/perfil";
import { ajustarRegla, crearRegla, sugerir } from "../captura/acciones";
import { eliminarMovimiento, guardarMovimiento } from "./acciones";

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

type Parametros = Record<string, string | string[] | undefined>;

/**
 * Libro de movimientos de un mes, compartido por `/movimientos` y su subruta
 * `/movimientos/sin-clasificar` (solo los gastos sin clasificar, desde el
 * resumen). `?mes=YYYY-MM` elige el mes (sin él, el actual en la zona del
 * usuario); `?movimiento=<id>` abre su edición. Un mes mal formado vuelve a
 * la ruta sin parámetros; un id que no está en el mes, a `?mes=`.
 */
export async function PaginaLibro({ parametros, sinClasificar }: { parametros: Parametros; sinClasificar: boolean }) {
  const ruta = rutaLibro(sinClasificar);
  const mesPedido = texto(parametros.mes);
  const idPedido = texto(parametros.movimiento);
  if (mesPedido !== undefined && !esMes(mesPedido)) redirect(ruta);

  // Los préstamos dan la persona de cada movimiento: su cuenta no está entre las activas.
  const [{ mes, movimientos }, perfil, { prestamos }] = await Promise.all([
    listarDelMes(mesPedido),
    mesPedido === undefined ? null : obtenerPerfil(),
    obtenerPrestamos(),
  ]);

  // Sin `?mes` manda la API; con él, el actual se calcula en la zona del perfil (REGLAS §6).
  const actual = mesPedido === undefined ? mes : mesEnZona(perfil?.zonaHoraria ?? ZONA_POR_DEFECTO, new Date());

  // La edición se busca en todo el mes: recién clasificado, el movimiento sale del filtro pero sigue abierto.
  let edicion = null;
  if (idPedido !== undefined) {
    const movimiento = movimientos.find((m) => m.id === idPedido);
    if (!movimiento) redirect(`${ruta}?mes=${mes}`);
    edicion = { movimiento, datos: await cargarCaptura(), prestamos };
  }
  const listados = sinClasificar ? movimientos.filter(esSinClasificar) : movimientos;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <LibroMovimientos
        mes={mes}
        actual={actual}
        personas={prestamos.map((p) => ({ id: p.id, nombre: p.nombre }))}
        movimientos={listados}
        sinClasificar={sinClasificar}
        edicion={edicion}
        acciones={ACCIONES}
      />
    </div>
  );
}
