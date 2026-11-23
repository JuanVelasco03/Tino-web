import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { EnlaceTexto } from "@/components/enlace-texto";
import { EstadoVacio } from "@/components/estado-vacio";
import { AccionesMeta, type AccionesDetalleMeta } from "@/components/metas/acciones-meta";
import { DetalleMeta } from "@/components/metas/detalle-meta";
import { ListaMetasArchivadas } from "@/components/metas/lista-metas";
import { RUTA_ARCHIVADAS, RUTA_METAS } from "@/components/metas/rutas";
import { obtenerArchivadas, obtenerMeta } from "@/services/metas";
import { esId } from "../../captura/entrada";
import { archivarMeta, eliminarMeta, restaurarMeta } from "../acciones";

export const metadata = { title: "Metas archivadas · Tino" };

const ACCIONES_DETALLE: AccionesDetalleMeta = { archivar: archivarMeta, restaurar: restaurarMeta, eliminar: eliminarMeta };

function texto(valor: string | string[] | undefined): string | undefined {
  return typeof valor === "string" ? valor : undefined;
}

/**
 * Metas archivadas (N-48, N-49, N-65): lista sin grupos y detalle de solo
 * lectura con «Restaurar» y «Eliminar meta…». `?meta=<id>` elige la meta:
 * escritorio sin parámetro muestra la primera; móvil, solo la lista, y con
 * el parámetro solo el detalle. Un id desconocido vuelve a la lista.
 */
export default async function PaginaMetasArchivadas({ searchParams }: PageProps<"/metas/archivadas">) {
  const parametros = await searchParams;
  const idPedido = texto(parametros.meta);
  if (idPedido !== undefined && !esId(idPedido)) redirect(RUTA_ARCHIVADAS);

  const [metas, pedido] = await Promise.all([obtenerArchivadas(), idPedido ? obtenerMeta(idPedido) : null]);
  if (idPedido !== undefined && (!metas.some((m) => m.id === idPedido) || pedido === null)) redirect(RUTA_ARCHIVADAS);

  const primera = metas[0] ?? null;
  const detalle = pedido ?? (primera ? await obtenerMeta(primera.id) : null);
  if (primera && !detalle) redirect(RUTA_ARCHIVADAS);

  const soloLista = idPedido !== undefined ? "hidden md:flex" : "flex";

  return (
    <div className="flex flex-col gap-8">
      <header className={`${soloLista} flex-col items-start gap-1`}>
        <EnlaceTexto href={RUTA_METAS} className="-ml-1 gap-1">
          <ChevronLeft size={18} strokeWidth={1.5} aria-hidden />
          Metas
        </EnlaceTexto>
        <h1 className="text-titulo-1">Metas archivadas</h1>
      </header>

      {metas.length === 0 ? (
        <EstadoVacio rotulo="Archivadas" titulo="Sin metas archivadas." detalle="Al archivar una meta cumplida, aparece aquí." />
      ) : (
        <div className="flex flex-col gap-8 xl:grid xl:grid-cols-[400px_minmax(0,1fr)] xl:items-start xl:gap-12">
          <div className={`${soloLista} flex-col`}>
            <ListaMetasArchivadas metas={metas} elegida={detalle?.id ?? null} />
          </div>
          {detalle && (
            <div className={`min-w-0 ${idPedido !== undefined ? "" : "hidden md:block"}`}>
              <DetalleMeta
                key={detalle.id}
                detalle={detalle}
                fechaHoy={null}
                volver={{ href: RUTA_ARCHIVADAS, rotulo: "Archivadas" }}
                acciones={<AccionesMeta key={detalle.id} meta={detalle} acciones={ACCIONES_DETALLE} />}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
