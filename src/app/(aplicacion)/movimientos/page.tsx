import { redirect } from "next/navigation";
import { PaginaLibro } from "./libro";

export const metadata = { title: "Movimientos · Tino" };

/**
 * Todos los movimientos de un mes (ver `PaginaLibro`). El antiguo
 * `?sinClasificar=1` redirige a la subruta `/movimientos/sin-clasificar`.
 */
export default async function PaginaMovimientos({ searchParams }: PageProps<"/movimientos">) {
  const parametros = await searchParams;
  if (parametros.sinClasificar === "1") {
    const mes = typeof parametros.mes === "string" ? `?mes=${encodeURIComponent(parametros.mes)}` : "";
    redirect(`/movimientos/sin-clasificar${mes}`);
  }
  return <PaginaLibro parametros={parametros} sinClasificar={false} />;
}
