import { mesDeFecha } from "../fecha/formato";

export type LimitesMes = {
  /** `"YYYY-MM"` del mes actual en la zona del usuario (de `fechaHoy`). */
  actual: string;
  /** `‹`: hay un mes anterior con datos (`desde` posterior a `inicio`). */
  hayAnterior: boolean;
  /** `›`: el siguiente no es futuro (la API respondería `MES_FUTURO`). */
  haySiguiente: boolean;
};

/**
 * Límites de la navegación del resumen, tomados de la respuesta de la API:
 * sin `inicio` (sin cuentas) o con `desde ≤ inicio` no hay anterior; en el
 * mes actual no hay siguiente. Las fechas `"YYYY-MM-DD"` se comparan como texto.
 */
export function limitesMes(r: { mes: string; desde: string; inicio: string | null; fechaHoy: string }): LimitesMes {
  const actual = mesDeFecha(r.fechaHoy);
  return {
    actual,
    hayAnterior: r.inicio !== null && r.desde > r.inicio,
    haySiguiente: r.mes < actual,
  };
}
