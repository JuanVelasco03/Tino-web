import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";
import { Plus } from "lucide-react";
import { BOTON_ENLACE } from "@/components/boton";
import { EstadoVacio } from "@/components/estado-vacio";
import { BandejaRecurrentes } from "@/components/recurrentes/bandeja-recurrentes";
import { ComprometidoMes } from "@/components/recurrentes/comprometido-mes";
import { ListaPlantillas, RUTA_NUEVA_PLANTILLA } from "@/components/recurrentes/lista-plantillas";
import { MarcaAbriendo } from "@/components/recurrentes/marca-abriendo";
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
    <div className="asentar flex flex-col gap-8 md:gap-12">
      <header className="flex items-end justify-between gap-6">
        <h1 className="text-titulo-1">Recurrentes</h1>
        {!sinPlantillas && (
          <div className="hidden md:block">
            <Link href={RUTA_NUEVA_PLANTILLA} scroll={false} className={`${BOTON_ENLACE.secundario} has-[[data-abriendo]]:bg-hundido`}>
              <Plus size={18} strokeWidth={1.5} aria-hidden />
              Nueva plantilla
              <MarcaAbriendo />
            </Link>
          </div>
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
            <div>
              <BandejaRecurrentes
                fechaHoy={datos.fechaHoy}
                ventanaDias={datos.ventanaDias}
                bandeja={datos.bandeja}
                recurrentes={datos.recurrentes}
                acciones={ACCIONES_BANDEJA}
              />
            </div>
            <div className="xl:sticky xl:top-8">
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
