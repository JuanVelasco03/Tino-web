import { ErrorApi, obtener } from "./cliente";

/*
 * Contrato de Tino API (docs/api/resumen.md, Tino-API SPEC 06). Se copia, no
 * se redefine. Montos como string con un entero en unidades menores;
 * porcentajes como enteros en décimas (`274` = 27,4 %), sin convertir.
 */
export type Ref = { id: string; nombre: string };

export type ComparacionDto = {
  actual: string;
  anterior: string;
  /** actual − anterior; puede ser negativo. */
  variacion: string;
  /** Décimas; `null` si `anterior` es `"0"`. */
  variacionPorcentaje: number | null;
};

export type CategoriaResumenDto = {
  categoria: Ref;
  monto: string;
  anterior: string;
  variacion: string;
  /** Décimas de `gastos.actual`; `null` si `gastos.actual` es `"0"`. */
  porcentaje: number | null;
};

export type ResumenDto = {
  mes: string;
  mesAnterior: string;
  desde: string;
  hasta: string;
  fechaHoy: string;
  /** Día de creación de la cuenta más antigua; `null` sin cuentas. */
  inicio: string | null;
  /** `false` → estado de día uno (todo el historial, no solo el mes). */
  tieneMovimientos: boolean;
  cuentasActivas: number;
  cantidadMovimientos: number;
  ingresos: ComparacionDto;
  gastos: ComparacionDto;
  resultado: ComparacionDto;
  categorias: CategoriaResumenDto[];
  sinCategoria: { monto: string; anterior: string; variacion: string; porcentaje: number | null; cantidad: number };
  patrimonio: {
    hoy: string;
    /** Ascendente; último = hoy; 1 a 12 puntos (`[]` sin cuentas). */
    serie: { fecha: string; patrimonio: string }[];
    variacionSerie: string;
  };
  cambioDelMes: {
    fechaAnterior: string;
    fechaCierre: string;
    patrimonioAnterior: string;
    resultado: string;
    otrosCambios: string;
    patrimonioCierre: string;
  };
};

/* Modelo de la web. Montos en `bigint` (REGLAS §6); porcentajes tal como llegan. */
export type Comparacion = { actual: bigint; anterior: bigint; variacion: bigint; variacionPorcentaje: number | null };

export type CategoriaResumen = { categoria: Ref; monto: bigint; anterior: bigint; variacion: bigint; porcentaje: number | null };

export type Resumen = {
  mes: string;
  mesAnterior: string;
  desde: string;
  hasta: string;
  fechaHoy: string;
  inicio: string | null;
  tieneMovimientos: boolean;
  cuentasActivas: number;
  cantidadMovimientos: number;
  ingresos: Comparacion;
  gastos: Comparacion;
  resultado: Comparacion;
  categorias: CategoriaResumen[];
  sinCategoria: Omit<CategoriaResumen, "categoria"> & { cantidad: number };
  patrimonio: { hoy: bigint; serie: { fecha: string; patrimonio: bigint }[]; variacionSerie: bigint };
  cambioDelMes: {
    fechaAnterior: string;
    fechaCierre: string;
    patrimonioAnterior: bigint;
    resultado: bigint;
    otrosCambios: bigint;
    patrimonioCierre: bigint;
  };
};

function aComparacion(dto: ComparacionDto): Comparacion {
  return {
    actual: BigInt(dto.actual),
    anterior: BigInt(dto.anterior),
    variacion: BigInt(dto.variacion),
    variacionPorcentaje: dto.variacionPorcentaje,
  };
}

/** String entero de la API → `bigint`. Sin pasar nunca por `number`. */
export function aResumen(dto: ResumenDto): Resumen {
  return {
    mes: dto.mes,
    mesAnterior: dto.mesAnterior,
    desde: dto.desde,
    hasta: dto.hasta,
    fechaHoy: dto.fechaHoy,
    inicio: dto.inicio,
    tieneMovimientos: dto.tieneMovimientos,
    cuentasActivas: dto.cuentasActivas,
    cantidadMovimientos: dto.cantidadMovimientos,
    ingresos: aComparacion(dto.ingresos),
    gastos: aComparacion(dto.gastos),
    resultado: aComparacion(dto.resultado),
    categorias: dto.categorias.map((c) => ({
      categoria: c.categoria,
      monto: BigInt(c.monto),
      anterior: BigInt(c.anterior),
      variacion: BigInt(c.variacion),
      porcentaje: c.porcentaje,
    })),
    sinCategoria: {
      monto: BigInt(dto.sinCategoria.monto),
      anterior: BigInt(dto.sinCategoria.anterior),
      variacion: BigInt(dto.sinCategoria.variacion),
      porcentaje: dto.sinCategoria.porcentaje,
      cantidad: dto.sinCategoria.cantidad,
    },
    patrimonio: {
      hoy: BigInt(dto.patrimonio.hoy),
      serie: dto.patrimonio.serie.map((p) => ({ fecha: p.fecha, patrimonio: BigInt(p.patrimonio) })),
      variacionSerie: BigInt(dto.patrimonio.variacionSerie),
    },
    cambioDelMes: {
      fechaAnterior: dto.cambioDelMes.fechaAnterior,
      fechaCierre: dto.cambioDelMes.fechaCierre,
      patrimonioAnterior: BigInt(dto.cambioDelMes.patrimonioAnterior),
      resultado: BigInt(dto.cambioDelMes.resultado),
      otrosCambios: BigInt(dto.cambioDelMes.otrosCambios),
      patrimonioCierre: BigInt(dto.cambioDelMes.patrimonioCierre),
    },
  };
}

/** `GET /resumen`: sin `mes`, el mes actual en la zona del usuario. */
export async function obtenerResumen(mes?: string): Promise<Resumen> {
  const ruta = mes === undefined ? "/resumen" : `/resumen?mes=${encodeURIComponent(mes)}`;
  const dto = await obtener<ResumenDto>(ruta);
  if (!dto) throw new ErrorApi(404, "ERROR_INTERNO", "Tino API no encontró /resumen.");
  return aResumen(dto);
}
