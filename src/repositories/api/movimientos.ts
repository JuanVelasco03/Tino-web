import { enviar, ErrorApi, obtener } from "./cliente";
import { tasaEnCentesimas } from "./trm";

/*
 * Contrato de Tino API (docs/api/movimientos.md, Tino-API SPEC 04, 10 y 14).
 * Se copia, no se redefine. Montos como string con un entero en unidades
 * menores de su moneda.
 */
/** `ajuste` (SPEC 14): una sola cuenta y la categoría «Ajuste»; solo nace en `POST /cuentas/:id/ajustes`. */
export type TipoMovimiento = "gasto" | "ingreso" | "transferencia" | "ajuste";
/** Lo que se registra con `POST /movimientos` (captura, recurrentes): nunca un ajuste. */
export type TipoCaptura = Exclude<TipoMovimiento, "ajuste">;
export type Moneda = "COP" | "USD";

export type Ref = { id: string; nombre: string };

export type MovimientoDto = {
  id: string;
  tipo: TipoMovimiento;
  /** SIEMPRE positivo, en la moneda de `moneda`; el signo lo pone el cliente según `tipo`. */
  monto: string;
  /** La de la cuenta de origen, o la del destino en un ingreso. */
  moneda: Moneda;
  /** Solo en una transferencia entre monedas: lo que llegó, en la moneda del destino. */
  montoDestino: string | null;
  /** Decimal como texto: la implícita (COP por US$ 1) entre monedas, o `"1"`. */
  tasa: string;
  /** `"YYYY-MM-DD"`, día contable del usuario. */
  fecha: string;
  descripcion: string | null;
  nota: string | null;
  cuentaOrigen: Ref | null;
  cuentaDestino: Ref | null;
  /** `null` y `partes` vacío = «sin clasificar». */
  categoria: Ref | null;
  partes: { categoria: Ref; monto: string }[];
  creadoEn: string;
  actualizadoEn: string;
};

export type ListaMovimientosDto = { mes: string; movimientos: MovimientoDto[] };

/** Cuerpo de `POST /movimientos` y de `PUT /movimientos/:id` (con `fecha` obligatoria). */
export type MovimientoCuerpo = {
  tipo: TipoMovimiento;
  /** `^\d{1,19}$`, > 0, en la moneda del origen (o del destino en un ingreso). */
  monto: string;
  /** Solo en una transferencia entre monedas: lo que llegó, en la moneda del destino. */
  montoDestino?: string | null;
  /** `"YYYY-MM-DD"`. Opcional en POST: hoy en la zona del usuario. */
  fecha?: string;
  /** ≤ 80; `""` = sin descripción. */
  descripcion?: string | null;
  /** ≤ 500; `""` = sin nota. */
  nota?: string | null;
  cuentaOrigenId?: string | null;
  cuentaDestinoId?: string | null;
  /** `null` o ausente = sin clasificar. */
  categoriaId?: string | null;
  partes?: { categoriaId: string; monto: string }[] | null;
};

/* Modelo de la web. Montos en `bigint` (REGLAS §6). */
export type Parte = { categoria: Ref; monto: bigint };

export type Movimiento = {
  id: string;
  tipo: TipoMovimiento;
  /** Siempre positivo, en `moneda`. */
  monto: bigint;
  moneda: Moneda;
  /** Transferencia entre monedas: lo que llegó, en la moneda del destino. */
  montoDestino: bigint | null;
  /** Centésimas de peso por US$; `100n` con la misma moneda. */
  tasa: bigint;
  /** `"YYYY-MM-DD"`. */
  fecha: string;
  descripcion: string | null;
  nota: string | null;
  cuentaOrigen: Ref | null;
  cuentaDestino: Ref | null;
  categoria: Ref | null;
  /** `[]` si no está dividido. */
  partes: Parte[];
};

export type ListaMovimientos = {
  /** `"YYYY-MM"`, tal cual llega. */
  mes: string;
  /** En el orden de la API: fecha desc, el último registrado primero (N-06). */
  movimientos: Movimiento[];
};

/** String entero de la API → `bigint`. Sin pasar nunca por `number`. */
export function aMovimiento(dto: MovimientoDto): Movimiento {
  return {
    id: dto.id,
    tipo: dto.tipo,
    monto: BigInt(dto.monto),
    moneda: dto.moneda,
    montoDestino: dto.montoDestino === null ? null : BigInt(dto.montoDestino),
    tasa: tasaEnCentesimas(dto.tasa),
    fecha: dto.fecha,
    descripcion: dto.descripcion,
    nota: dto.nota,
    cuentaOrigen: dto.cuentaOrigen,
    cuentaDestino: dto.cuentaDestino,
    categoria: dto.categoria,
    partes: dto.partes.map((parte) => ({ categoria: parte.categoria, monto: BigInt(parte.monto) })),
  };
}

export function aListaMovimientos(dto: ListaMovimientosDto): ListaMovimientos {
  return { mes: dto.mes, movimientos: dto.movimientos.map(aMovimiento) };
}

/** `GET /movimientos`: sin `mes`, el mes actual en la zona del usuario. */
export async function listarMovimientos(mes?: string): Promise<ListaMovimientos> {
  const ruta = mes === undefined ? "/movimientos" : `/movimientos?mes=${encodeURIComponent(mes)}`;
  const dto = await obtener<ListaMovimientosDto>(ruta);
  if (!dto) throw new ErrorApi(404, "ERROR_INTERNO", "Tino API no encontró /movimientos.");
  return aListaMovimientos(dto);
}

/** `POST /movimientos` → `201 MovimientoDto`. */
export async function crearMovimiento(cuerpo: MovimientoCuerpo): Promise<Movimiento> {
  const dto = await enviar<MovimientoDto>("POST", "/movimientos", cuerpo);
  if (!dto) throw new ErrorApi(500, "ERROR_INTERNO", "Tino API no devolvió el movimiento.");
  return aMovimiento(dto);
}

/** `PUT /movimientos/:id`: reemplazo completo, con `fecha`. */
export async function reemplazarMovimiento(id: string, cuerpo: MovimientoCuerpo): Promise<Movimiento> {
  const dto = await enviar<MovimientoDto>("PUT", `/movimientos/${encodeURIComponent(id)}`, cuerpo);
  if (!dto) throw new ErrorApi(500, "ERROR_INTERNO", "Tino API no devolvió el movimiento.");
  return aMovimiento(dto);
}

/** `DELETE /movimientos/:id`. «Deshacer» un registro es esta misma llamada (RN-13). */
export async function eliminarMovimiento(id: string): Promise<void> {
  await enviar<null>("DELETE", `/movimientos/${encodeURIComponent(id)}`);
}
