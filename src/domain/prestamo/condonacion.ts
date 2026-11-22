/**
 * Condonar lo que te deben: el monto elegido y la vista previa «Qué cambia».
 * La vista previa la asigna el contrato al cliente (docs/api/prestamos.md):
 * es la única resta de montos de la web, solo para presentar. Con `bigint`.
 */
import { aDigitos } from "../dinero/entrada";

export type ModoCondonacion = "todo" | "parte";

export const MENSAJE_MONTO = "Escribe un valor en pesos, sin decimales.";
export const MENSAJE_EXCEDE = "No puedes condonar más de lo pendiente.";

/**
 * Todo → el capital pendiente. Una parte: lo escrito, entero y mayor que
 * cero, sin pasar del pendiente. Lo que excede se rechaza: no se recorta (RN-13).
 */
export function montoCondonacion(
  modo: ModoCondonacion,
  valor: string,
  capitalPendiente: bigint,
): { monto: bigint } | { error: string } {
  if (modo === "todo") return { monto: capitalPendiente };
  const digitos = aDigitos(valor);
  if (digitos === null || digitos === "0") return { error: MENSAJE_MONTO };
  const monto = BigInt(digitos);
  if (monto > capitalPendiente) return { error: MENSAJE_EXCEDE };
  return { monto };
}

/** «Gasto de hoy», «{persona} te deberá» y «Patrimonio neto {antes} → {después}». Solo presentación. */
export function vistaPreviaCondonacion(
  capitalPendiente: bigint,
  monto: bigint,
  patrimonioNeto: bigint,
): { gasto: bigint; queda: bigint; patrimonioAntes: bigint; patrimonioDespues: bigint } {
  return {
    gasto: monto,
    queda: capitalPendiente - monto,
    patrimonioAntes: patrimonioNeto,
    patrimonioDespues: patrimonioNeto - monto,
  };
}
