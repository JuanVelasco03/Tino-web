import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";
import { Plus } from "lucide-react";
import { EstadoVacio } from "@/components/estado-vacio";
import { BandejaRecurrentes } from "@/components/recurrentes/bandeja-recurrentes";
import { ComprometidoMes } from "@/components/recurrentes/comprometido-mes";
import { ListaPlantillas, RUTA_NUEVA_PLANTILLA } from "@/components/recurrentes/lista-plantillas";
import { PanelPlantilla, type DatosFormulario } from "@/components/recurrentes/panel-plantilla";
import { cargar } from "@/services/captura";
import { obtenerRecurrentes } from "@/services/recurrentes";
import {
  confirmarOcurrencia,
  crearPlantilla,
  deshacerConfirmacion,
  deshacerOmision,
  editarPlantilla,
  eliminarPlantilla,
  omitirOcurrencia,
  pausarPlantilla,
} from "./acciones";

export const metadata = { title: "Recurrentes · Tino" };

const ACCIONES_BANDEJA = { confirmar: confirmarOcurrencia, omitir: omitirOcurrencia, deshacerConfirmacion, deshacerOmision };
const ACCIONES_PANEL = { crear: crearPlantilla, editar: editarPlantilla, pausar: pausarPlantilla, eliminar: eliminarPlantilla };

/** Categorías y cuentas del formulario (`GET /captura`, `GET /cuentas`). Un fallo se muestra en el panel. */
async function datosFormulario(): Promise<DatosFormulario | null> {
  try {
    return await cargar();
  } catch (error) {
    // La sesión vencida redirige; cualquier otro fallo deja el panel con su aviso de error.
    unstable_rethrow(error);
    return null;
  }
}

/**
 * Recurrentes: bandeja por confirmar, comprometido del mes y plantillas.
 * `?plantilla=nueva` abre el alta; `?plantilla=<id>`, la edición. Un id que no
 * está en la lista vuelve a `/recurrentes`. Toda cifra llega de la API.
 */
export default async function PaginaRecurrentes({ searchParams }: PageProps<"/recurrentes">) {
  const [datos, { plantilla: parametro }] = await Promise.all([obtenerRecurrentes(), searchParams]);
  const valor = typeof parametro === "string" ? parametro : undefined;

  let panel = null;
  if (valor !== undefined) {
    const recurrente = valor === "nueva" ? null : datos.recurrentes.find((r) => r.id === valor);
    if (recurrente === undefined) redirect("/recurrentes");
    panel = (
      <PanelPlantilla
        key={recurrente?.id ?? "nueva"}
        recurrente={recurrente}
        fechaHoy={datos.fechaHoy}
        formulario={await datosFormulario()}
        acciones={ACCIONES_PANEL}
      />
    );
  }

  const sinPlantillas = datos.recurrentes.length === 0;

  return (
    <div className="flex flex-col gap-8 md:gap-12">
      <header className="flex items-end justify-between gap-6">
        <h1 className="text-titulo-1">Recurrentes</h1>
        {!sinPlantillas && (
          <Link
            href={RUTA_NUEVA_PLANTILLA}
            scroll={false}
            className="hidden h-12 items-center gap-3 rounded-campo border border-linea bg-superficie px-6 text-cuerpo font-medium md:inline-flex"
          >
            <Plus size={18} strokeWidth={1.5} aria-hidden />
            Nueva plantilla
          </Link>
        )}
      </header>

      {sinPlantillas ? (
        <EstadoVacio
          rotulo="Recurrentes"
          titulo="Aún no tienes plantillas."
          detalle="Arriendo, servicios, salario: lo que se repite se confirma con un toque."
          accion={{ etiqueta: "Nueva plantilla", href: RUTA_NUEVA_PLANTILLA, scroll: false }}
        />
      ) : (
        <>
          <div className="flex flex-col gap-8 xl:grid xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start xl:gap-12">
            <div className="order-2 xl:order-1">
              <BandejaRecurrentes
                fechaHoy={datos.fechaHoy}
                ventanaDias={datos.ventanaDias}
                bandeja={datos.bandeja}
                recurrentes={datos.recurrentes}
                acciones={ACCIONES_BANDEJA}
              />
            </div>
            <div className="order-1 xl:order-2">
              <ComprometidoMes
                mes={datos.mes}
                comprometido={datos.comprometido}
                ingresosEsperados={datos.ingresosEsperados}
                recurrentes={datos.recurrentes}
              />
            </div>
          </div>
          <ListaPlantillas recurrentes={datos.recurrentes} mes={datos.mes} />
        </>
      )}
      {panel}
    </div>
  );
}
