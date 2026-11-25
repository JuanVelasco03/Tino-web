"use client";

import type { ReactNode } from "react";
import type { Precision } from "@/domain/meta/formulario";
import { MensajeError } from "../mensaje-error";
import { OpcionUnica } from "../opcion-unica";
import { CampoFecha } from "../campo-fecha";

/**
 * Campo dependiente (DESIGN.md → Movimiento): se despliega en su lugar, la
 * fila crece de `0fr` a `1fr` sin animar `height` y el contenido se asienta
 * 4 px. Plegado queda `inert`. Con movimiento reducido, solo el fundido.
 */
export function Despliegue({ abierto, children }: { abierto: boolean; children: ReactNode }) {
  return (
    <div
      inert={!abierto}
      className={`grid transition-[grid-template-rows,opacity] motion-reduce:transition-opacity ${
        abierto ? "grid-rows-[1fr] opacity-100 duration-300 ease-despliegue" : "grid-rows-[0fr] opacity-0 duration-180 ease-retirada"
      }`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`pt-2 transition-transform motion-reduce:transition-none ${
            abierto ? "translate-y-0 duration-300 ease-despliegue" : "-translate-y-1 duration-180 ease-retirada"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

const OPCIONES = [
  { valor: "ninguna", rotulo: "Sin fecha" },
  { valor: "dia", rotulo: "Un día" },
  { valor: "mes", rotulo: "Un mes" },
] as const;

type Props = {
  precision: Precision;
  /** `"YYYY-MM-DD"` en «Un día», `"YYYY-MM"` en «Un mes»; `""` sin elegir. */
  valor: string;
  /** Al cambiar de precisión, el valor se descarta (llega `""`). */
  alCambiar: (precision: Precision, valor: string) => void;
  /** Hoy según la API: `min` del día y, su mes, del mes. */
  fechaHoy: string;
  error?: string;
  deshabilitado?: boolean;
};


/**
 * Fecha meta: «Sin fecha» / «Un día» / «Un mes» (`OpcionUnica`) y, según la
 * precisión, un `CampoFecha` (calendario del libro, o la cuadrícula de meses)
 * que se despliega debajo. No se elige un día pasado ni un mes anterior al actual.
 */
export function CampoFechaMeta({ precision, valor, alCambiar, fechaHoy, error, deshabilitado = false }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <OpcionUnica
        nombre="fecha-meta"
        etiqueta="Fecha meta"
        opciones={OPCIONES}
        valor={precision}
        alCambiar={(nueva) => alCambiar(nueva, "")}
        deshabilitado={deshabilitado}
      />
      <Despliegue abierto={precision === "dia"}>
        <CampoFecha
          etiqueta="Día"
          hoy={fechaHoy}
          min={fechaHoy}
          valor={precision === "dia" ? valor : ""}
          alCambiar={(fecha) => alCambiar("dia", fecha)}
          deshabilitado={deshabilitado}
          invalido={Boolean(error) && precision === "dia"}
          enLinea
        />
      </Despliegue>
      <Despliegue abierto={precision === "mes"}>
        <CampoFecha
          etiqueta="Mes"
          modo="mes"
          hoy={fechaHoy}
          min={fechaHoy.slice(0, 7)}
          valor={precision === "mes" ? valor : ""}
          vacio="Elegir mes"
          alCambiar={(mes) => alCambiar("mes", mes)}
          deshabilitado={deshabilitado}
          invalido={Boolean(error) && precision === "mes"}
          enLinea
        />
      </Despliegue>
      {error && <MensajeError mensaje={error} />}
    </div>
  );
}
