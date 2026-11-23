"use client";

import type { ReactNode } from "react";
import type { Precision } from "@/domain/meta/formulario";
import { MensajeError } from "../mensaje-error";
import { OpcionUnica } from "../opcion-unica";

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

const INPUT =
  "h-11 w-full rounded-none border-0 border-b bg-transparent p-0 font-mono text-[17px] tabular-nums text-texto placeholder:text-terciario disabled:text-terciario";

/**
 * Fecha meta: «Sin fecha» / «Un día» / «Un mes» (`OpcionUnica`) y, según la
 * precisión, un `<input type="date">` o `type="month"` nativo que se despliega
 * debajo. No se elige un día pasado ni un mes anterior al actual.
 */
export function CampoFechaMeta({ precision, valor, alCambiar, fechaHoy, error, deshabilitado = false }: Props) {
  const borde = error ? "border-salida" : "border-linea focus:border-raya";
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
        <input
          type="date"
          aria-label="Fecha meta: día"
          name="fechaMeta-dia"
          min={fechaHoy}
          value={precision === "dia" ? valor : ""}
          onChange={(e) => alCambiar("dia", e.target.value)}
          disabled={deshabilitado}
          aria-invalid={error && precision === "dia" ? true : undefined}
          className={`${INPUT} ${borde}`}
        />
      </Despliegue>
      <Despliegue abierto={precision === "mes"}>
        <input
          type="month"
          aria-label="Fecha meta: mes"
          name="fechaMeta-mes"
          min={fechaHoy.slice(0, 7)}
          placeholder="AAAA-MM"
          value={precision === "mes" ? valor : ""}
          onChange={(e) => alCambiar("mes", e.target.value)}
          disabled={deshabilitado}
          aria-invalid={error && precision === "mes" ? true : undefined}
          className={`${INPUT} ${borde}`}
        />
      </Despliegue>
      {error && <MensajeError mensaje={error} />}
    </div>
  );
}
