import { redirect } from "next/navigation";
import { ErrorApi } from "@/repositories/api/cliente";
import * as api from "@/repositories/api/resumen";
import type { CategoriaResumen, Comparacion, Ref, Resumen } from "@/repositories/api/resumen";

export type { CategoriaResumen, Comparacion, Ref, Resumen };

/**
 * Resumen de un mes (N-05). Sin `mes`, el actual en la zona del usuario.
 * Token vencido → `/login`. Un mes que la API rechaza (`MES_INVALIDO`,
 * `MES_FUTURO`) vuelve a `/resumen` (N-09, N-10). Cualquier otro error se relanza.
 */
export async function obtenerResumen(mes?: string): Promise<Resumen> {
  try {
    return await api.obtenerResumen(mes);
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 401) redirect("/login");
    if (error instanceof ErrorApi && (error.codigo === "MES_INVALIDO" || error.codigo === "MES_FUTURO")) redirect("/resumen");
    throw error;
  }
}
