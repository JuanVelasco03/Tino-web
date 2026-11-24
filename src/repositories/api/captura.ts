import { ErrorApi, obtener } from "./cliente";
import type { TipoCaptura as TipoMovimiento } from "./movimientos";

/*
 * Contrato de Tino API (docs/api/captura.md, Tino-API SPEC 04). Se copia, no
 * se redefine. Montos como string con un entero en unidades menores.
 */
export type CategoriaDto = { id: string; nombre: string; tipo: "gasto" | "ingreso" };

export type CapturaDto = {
  /** `"YYYY-MM-DD"` en la zona del usuario: el defecto de la fecha. */
  fechaHoy: string;
  /** La elegida si está activa; si no, la primera activa; `null` sin cuentas. */
  cuentaPredeterminadaId: string | null;
  /** En el orden en que se muestran. */
  categorias: { gasto: CategoriaDto[]; ingreso: CategoriaDto[] };
  /** Suma de los gastos de hoy (sin ingresos ni transferencias). */
  gastosHoy: string;
  /** Hasta 6 por tipo, últimos 90 días, el más usado primero. */
  conceptosFrecuentes: Record<TipoMovimiento, string[]>;
};

export type SugerenciasDto = {
  /** Hasta 2. `categoria`: la que propone la regla para ese concepto. */
  conceptos: { descripcion: string; categoria: CategoriaDto | null }[];
  propuesta: {
    categoria: CategoriaDto;
    regla: { id: string; palabraClave: string };
  } | null;
};

/* Modelo de la web. */
export type Categoria = CategoriaDto;

export type Captura = {
  fechaHoy: string;
  cuentaPredeterminadaId: string | null;
  categorias: { gasto: Categoria[]; ingreso: Categoria[] };
  gastosHoy: bigint;
  conceptosFrecuentes: Record<TipoMovimiento, string[]>;
};

export type Sugerencias = SugerenciasDto;

export function aCaptura(dto: CapturaDto): Captura {
  return {
    fechaHoy: dto.fechaHoy,
    cuentaPredeterminadaId: dto.cuentaPredeterminadaId,
    categorias: dto.categorias,
    gastosHoy: BigInt(dto.gastosHoy),
    conceptosFrecuentes: dto.conceptosFrecuentes,
  };
}

/** `GET /captura`: lo que necesita el formulario al abrir. */
export async function leerCaptura(): Promise<Captura> {
  const dto = await obtener<CapturaDto>("/captura");
  if (!dto) throw new ErrorApi(404, "ERROR_INTERNO", "Tino API no encontró /captura.");
  return aCaptura(dto);
}

/** `GET /sugerencias?tipo=&texto=`: autocompletado y categoría propuesta (RN-11). */
export async function leerSugerencias(tipo: TipoMovimiento, texto: string): Promise<Sugerencias> {
  const consulta = new URLSearchParams({ tipo, texto });
  const dto = await obtener<SugerenciasDto>(`/sugerencias?${consulta.toString()}`);
  if (!dto) throw new ErrorApi(404, "ERROR_INTERNO", "Tino API no encontró /sugerencias.");
  return dto;
}
