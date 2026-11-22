import { AntelacionAvisos } from "@/components/avisos/antelacion-avisos";
import { ListaAvisos } from "@/components/avisos/lista-avisos";
import { EnlaceTexto } from "@/components/enlace-texto";
import { zonaLegible } from "@/domain/aviso/antelacion";
import { obtenerAvisos } from "@/services/avisos";
import { confirmar, configurar, leerTodos, marcar } from "./acciones";

export const metadata = { title: "Avisos · Tino" };

const ACCIONES = { marcar, leerTodos, confirmar };

/**
 * Avisos: la lista agrupada con su cabecera y la antelación por tipo. Desde
 * xl (1280 px), lado a lado; por debajo, la lista con «Configurar» y la
 * antelación en `?antelacion=1` con «‹ Avisos» (en xl se ignora). Toda cifra,
 * leído y resuelto llegan de la API; la web solo arma las frases.
 */
export default async function PaginaAvisos({ searchParams }: PageProps<"/avisos">) {
  const [datos, { antelacion }] = await Promise.all([obtenerAvisos(), searchParams]);
  const pideAntelacion = antelacion === "1";
  const nombreZona = zonaLegible(datos.zonaHoraria);

  return (
    <>
      <ListaAvisos
        avisos={datos.avisos}
        noLeidos={datos.noLeidos}
        fechaHoy={datos.fechaHoy}
        zona={datos.zonaHoraria}
        acciones={ACCIONES}
        className={pideAntelacion ? "hidden xl:flex" : "flex"}
        antelacion={
          <AntelacionAvisos
            config={datos.config}
            horaAvisos={datos.horaAvisos}
            nombreZona={nombreZona}
            variante="columna"
            configurar={configurar}
          />
        }
      />
      {pideAntelacion && (
        <div className="flex flex-col gap-4 xl:hidden">
          <EnlaceTexto href="/avisos" className="self-start">
            ‹ Avisos
          </EnlaceTexto>
          <AntelacionAvisos
            config={datos.config}
            horaAvisos={datos.horaAvisos}
            nombreZona={nombreZona}
            variante="pagina"
            configurar={configurar}
          />
        </div>
      )}
    </>
  );
}
