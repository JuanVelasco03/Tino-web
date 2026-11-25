import { PaginaLibro } from "../libro";

export const metadata = { title: "Gastos sin clasificar · Tino" };

/** Subruta de movimientos: solo los gastos sin clasificar del mes, con «← Movimientos» para volver. */
export default async function PaginaSinClasificar({ searchParams }: PageProps<"/movimientos/sin-clasificar">) {
  return <PaginaLibro parametros={await searchParams} sinClasificar />;
}
