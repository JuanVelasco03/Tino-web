"use client";

import { useOptimistic, useState, useTransition } from "react";
import { aplicarCambio, rotuloOpcion, TIPOS } from "@/domain/aviso/antelacion";
import type { AvisoConfig, ConfigCuerpo, TipoAviso } from "@/domain/aviso/presentacion";
import { Casilla } from "../casilla";
import { ChipCategoria } from "../chip-categoria";
import { MensajeError } from "../mensaje-error";

type Fallo = { ok: false; codigo: string; mensaje: string };

/** Server action; llega por prop desde la página (los componentes no importan `app/`). */
export type ConfigurarAvisos = (tipo: TipoAviso, cambio: ConfigCuerpo) => Promise<{ ok: true; config: AvisoConfig } | Fallo>;

type Props = {
  config: AvisoConfig[];
  /** `"08:00"`, de la API. */
  horaAvisos: string;
  /** «hora de Colombia» (`zonaLegible`), armado en el servidor. Solo en la variante de página. */
  nombreZona: string;
  /**
   * `columna`: al lado de la lista desde xl, con «Avisos a las 08:00» a la
   * derecha del rótulo. `pagina`: `?antelacion=1` por debajo de xl, con la
   * frase de la zona y el prefijo en su propia línea.
   */
  variante: "columna" | "pagina";
  /** Sin ella, la antelación solo presenta (muestras de /estilos). */
  configurar?: ConfigurarAvisos;
  /** Prefijo de los `id` de las casillas, para que dos instancias en la página no choquen. */
  sufijo?: string;
};

/**
 * Antelación por tipo: un bloque por tipo de `config`, en su orden, con su
 * casilla de activo y sus opciones como chips. Marcar la casilla o elegir
 * una opción cambia el bloque al instante (`useOptimistic`) y vuelve atrás si
 * la API falla; elegir una opción enciende el tipo, como la API.
 */
export function AntelacionAvisos({ config, horaAvisos, nombreZona, variante, configurar, sufijo = variante }: Props) {
  const [optimista, aplicar] = useOptimistic(config, (estado: AvisoConfig[], c: { tipo: TipoAviso; cambio: ConfigCuerpo }) =>
    aplicarCambio(estado, c.tipo, c.cambio),
  );
  const [errores, setErrores] = useState<Partial<Record<TipoAviso, string>>>({});
  const [, iniciar] = useTransition();

  function cambiar(tipo: TipoAviso, cambio: ConfigCuerpo) {
    if (!configurar) return;
    setErrores((actual) => ({ ...actual, [tipo]: undefined }));
    iniciar(async () => {
      aplicar({ tipo, cambio });
      const resultado = await configurar(tipo, cambio);
      if (!resultado.ok) setErrores((actual) => ({ ...actual, [tipo]: resultado.mensaje }));
    });
  }

  const pagina = variante === "pagina";

  return (
    <section aria-labelledby={`antelacion-${sufijo}`} className="flex flex-col">
      {pagina ? (
        <div className="flex flex-col gap-1 border-b border-raya pb-3">
          <h1 id={`antelacion-${sufijo}`} className="text-titulo-2">
            Antelación por tipo
          </h1>
          <p className="text-etiqueta font-normal text-secundario">
            Los avisos llegan a las <span className="font-mono text-cifra-xs tabular-nums text-texto">{horaAvisos}</span>, {nombreZona}.
          </p>
        </div>
      ) : (
        <div className="flex items-baseline justify-between gap-3 border-b border-raya pb-2">
          <h2 id={`antelacion-${sufijo}`} className="text-rotulo uppercase">
            Antelación por tipo
          </h2>
          <span className="text-etiqueta font-normal text-secundario">
            Avisos a las <span className="font-mono text-cifra-xs tabular-nums text-texto">{horaAvisos}</span>
          </span>
        </div>
      )}

      <ul>
        {optimista.map((c) => {
          const info = TIPOS[c.tipo];
          const tono = c.activo ? "text-secundario" : "text-terciario";
          return (
            <li key={c.tipo} className="flex flex-col gap-2 border-b border-linea py-4">
              <Casilla
                nombre={`antelacion-${sufijo}-${c.tipo}`}
                rotulo={info.rotulo}
                descripcion={info.descripcion}
                marcada={c.activo}
                alCambiar={(activo) => cambiar(c.tipo, { activo })}
              />
              <div
                role="group"
                aria-label={`${info.rotulo}: ${info.prefijo.toLowerCase()}`}
                className={`flex pl-[30px] ${pagina ? "flex-col items-start gap-2" : "flex-wrap items-center gap-x-3 gap-y-2"} ${
                  c.activo ? "" : "text-terciario"
                }`}
              >
                <span className={`text-etiqueta font-normal ${tono}`}>{info.prefijo}</span>
                <span className="flex flex-wrap gap-2">
                  {c.opciones.map((dias) => (
                    <ChipCategoria
                      key={dias}
                      etiqueta={rotuloOpcion(c.tipo, dias)}
                      seleccionada={c.activo && c.dias === dias}
                      onClick={configurar && !(c.activo && c.dias === dias) ? () => cambiar(c.tipo, { dias }) : undefined}
                    />
                  ))}
                </span>
              </div>
              {errores[c.tipo] && <MensajeError mensaje={errores[c.tipo] as string} className="pl-[30px]" />}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
