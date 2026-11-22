import { tasaEnCentesimas } from "@/domain/dinero/tasa";

export { tasaEnCentesimas };
import { ErrorApi, obtener } from "./cliente";

/*
 * Contrato de Tino API (docs/api/trm.md, Tino-API SPEC 09). Se copia, no se
 * redefine. `valor` es un decimal como texto ("4120.00"): la única excepción a
 * la convención de montos. La web lo pasa a centésimas de peso (`bigint`).
 */
export type TrmDto = { valor: string; vigenteDesde: string; vigenteHasta: string; fuente: string };

export type TrmVigenteDto = { fechaHoy: string; trm: TrmDto | null; desactualizada: boolean };

/* Modelo de la web. `valor` en centésimas de peso por US$: "4120.00" → 412000n. */
export type Trm = { valor: bigint; vigenteDesde: string; vigenteHasta: string; fuente: string };

export type TrmVigente = { fechaHoy: string; trm: Trm | null; desactualizada: boolean };

export function aTrm(dto: TrmDto): Trm {
  return { valor: tasaEnCentesimas(dto.valor), vigenteDesde: dto.vigenteDesde, vigenteHasta: dto.vigenteHasta, fuente: dto.fuente };
}

export function aTrmVigente(dto: TrmVigenteDto): TrmVigente {
  return { fechaHoy: dto.fechaHoy, trm: dto.trm && aTrm(dto.trm), desactualizada: dto.desactualizada };
}

/** `GET /trm`: la TRM vigente hoy en la zona del perfil. Que la fuente falle nunca es un error HTTP. */
export async function leerTrm(): Promise<TrmVigente> {
  const dto = await obtener<TrmVigenteDto>("/trm");
  if (!dto) throw new ErrorApi(404, "ERROR_INTERNO", "Tino API no encontró /trm.");
  return aTrmVigente(dto);
}
