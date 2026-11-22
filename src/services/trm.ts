import { redirect } from "next/navigation";
import { ErrorApi } from "@/repositories/api/cliente";
import { leerTrm, type Trm, type TrmVigente } from "@/repositories/api/trm";

export type { Trm, TrmVigente };

/** `GET /trm` para el menú (N-01). Token vencido → `/login`; cualquier otro error se relanza. */
export async function obtenerTrm(): Promise<TrmVigente> {
  try {
    return await leerTrm();
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 401) redirect("/login");
    throw error;
  }
}
