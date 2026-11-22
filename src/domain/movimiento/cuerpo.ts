/**
 * Formulario de captura: valores tecleados y cuerpo de `POST /movimientos`.
 * Funciones puras, sin `number` para los montos (REGLAS §6). Los tipos tienen
 * la forma del contrato de Tino API (docs/api/movimientos.md, captura.md);
 * el dominio no importa `repositories/`.
 */
import { aMenores } from "../dinero/entrada";
import type { Moneda } from "../dinero/formato";
import { errorPartes, type ValorParte } from "./partes";

export type { ValorParte };

export type TipoMovimiento = "gasto" | "ingreso" | "transferencia";

/** `CategoriaDto` del contrato. La transferencia no tiene categorías (RN-05). */
export type Categoria = { id: string; nombre: string; tipo: "gasto" | "ingreso" };

/** `SugerenciasDto["propuesta"]`: la regla de texto que coincide con la descripción (RN-11). */
export type Propuesta = { categoria: Categoria; regla: { id: string; palabraClave: string } };

/** Lo que decidió el usuario sobre la categoría. */
export type DecisionCategoria =
  /** Sin tocar: vale la propuesta de la regla, si hay. */
  | { modo: "propuesta" }
  | { modo: "elegida"; id: string }
  /** Tocó la propuesta para quitarla: se registra sin clasificar. */
  | { modo: "quitada" };

/** Estado del formulario, en el cliente. */
export type ValoresCaptura = {
  tipo: TipoMovimiento;
  /** Lo tecleado ya formateado, en la moneda del origen: `"15.000"`, `"2.000,00"`. */
  monto: string;
  /** «Llegó»: transferencia entre monedas, en la moneda del destino. `""` si no aplica. */
  montoDestino: string;
  descripcion: string;
  categoria: DecisionCategoria;
  /** Gasto: origen · ingreso: destino · transferencia: origen. */
  cuentaId: string | null;
  /** Solo transferencia. */
  destinoId: string | null;
  /** `"YYYY-MM-DD"`; por defecto `captura.fechaHoy`. `""` mientras no llega: la API pone hoy. */
  fecha: string;
  nota: string;
  /** `null` = sin dividir. Nunca en transferencia (RN-05). */
  partes: ValorParte[] | null;
};

export type CampoCaptura =
  | "tipo"
  | "monto"
  | "montoDestino"
  | "descripcion"
  | "categoria"
  | "cuenta"
  | "destino"
  | "fecha"
  | "nota"
  | "partes";

/** Monedas de las cuentas elegidas: la del monto (origen) y la del destino de una transferencia. */
export type MonedasCaptura = { origen: Moneda; destino: Moneda | null };

/** `MovimientoCuerpo` del contrato. */
export type CuerpoMovimiento = {
  tipo: TipoMovimiento;
  /** `^\d{1,19}$`, > 0, en la moneda del origen. */
  monto: string;
  /** Solo en una transferencia entre monedas, en la moneda del destino. */
  montoDestino?: string;
  fecha?: string;
  descripcion: string | null;
  nota: string | null;
  cuentaOrigenId?: string | null;
  cuentaDestinoId?: string | null;
  categoriaId?: string | null;
  partes?: { categoriaId: string; monto: string }[] | null;
};

/**
 * Categoría que se registrará: elegida > propuesta > ninguna. La propuesta
 * solo vale si es del tipo del movimiento; en transferencia, nunca hay.
 */
export function categoriaEfectiva(valores: Pick<ValoresCaptura, "tipo" | "categoria">, propuesta: Propuesta | null): string | null {
  if (valores.tipo === "transferencia") return null;
  switch (valores.categoria.modo) {
    case "elegida":
      return valores.categoria.id;
    case "quitada":
      return null;
    case "propuesta":
      return propuesta && propuesta.categoria.tipo === valores.tipo ? propuesta.categoria.id : null;
  }
}

/** Monto tecleado como string entero > 0 en unidades menores de su moneda (pesos por defecto), o `null`. */
export function montoValido(monto: string, moneda: Moneda = "COP"): string | null {
  const digitos = aMenores(monto, moneda);
  return digitos === null || digitos === "0" ? null : digitos;
}

function textoONulo(texto: string): string | null {
  const recortado = texto.trim();
  return recortado === "" ? null : recortado;
}

/** Partes del cuerpo, o `null` si no son válidas (`errorPartes`): cada una con categoría y entero > 0. */
function partesDelCuerpo(total: string, partes: readonly ValorParte[]): { categoriaId: string; monto: string }[] | null {
  if (errorPartes(BigInt(total), partes) !== null) return null;
  const cuerpo: { categoriaId: string; monto: string }[] = [];
  for (const parte of partes) {
    const monto = montoValido(parte.monto);
    if (parte.categoriaId === null || monto === null) return null;
    cuerpo.push({ categoriaId: parte.categoriaId, monto });
  }
  return cuerpo;
}

/**
 * Cuerpo de `POST /movimientos` (o `PUT`) desde el formulario, o `null` si el
 * monto o las partes no son válidos. Gasto: `cuentaOrigenId`. Ingreso:
 * `cuentaDestinoId`. Transferencia: ambos, nunca `categoriaId` ni `partes`
 * (RN-03, RN-05). Con partes, nunca `categoriaId` (`PARTES_CON_CATEGORIA`).
 * El monto va en la moneda del origen; entre monedas, la transferencia lleva
 * además `montoDestino` en la del destino (SPEC 10).
 */
export function cuerpoDesdeValores(
  valores: ValoresCaptura,
  propuesta: Propuesta | null,
  monedas: MonedasCaptura = { origen: "COP", destino: null },
): CuerpoMovimiento | null {
  const esTransferencia = valores.tipo === "transferencia";
  const monto = montoValido(valores.monto, esTransferencia ? monedas.origen : "COP");
  if (monto === null) return null;

  const cuerpo: CuerpoMovimiento = {
    tipo: valores.tipo,
    monto,
    descripcion: textoONulo(valores.descripcion),
    nota: textoONulo(valores.nota),
  };
  if (valores.fecha !== "") cuerpo.fecha = valores.fecha;

  if (esTransferencia) {
    cuerpo.cuentaOrigenId = valores.cuentaId;
    cuerpo.cuentaDestinoId = valores.destinoId;
    if (requiereMontoDestino(monedas.origen, monedas.destino) && monedas.destino !== null) {
      const montoDestino = montoValido(valores.montoDestino, monedas.destino);
      if (montoDestino === null) return null;
      cuerpo.montoDestino = montoDestino;
    }
    return cuerpo;
  }

  if (valores.tipo === "gasto") cuerpo.cuentaOrigenId = valores.cuentaId;
  else cuerpo.cuentaDestinoId = valores.cuentaId;

  if (valores.partes !== null) {
    const partes = partesDelCuerpo(monto, valores.partes);
    if (partes === null) return null;
    cuerpo.partes = partes;
  } else {
    cuerpo.categoriaId = categoriaEfectiva(valores, propuesta);
  }
  return cuerpo;
}

/**
 * ¿La transferencia necesita «Llegó»? Solo entre cuentas de monedas
 * distintas (`MONTO_DESTINO_REQUERIDO`); con la misma moneda está prohibido
 * (`MONTO_DESTINO_NO_PERMITIDO`).
 */
export function requiereMontoDestino(origen: Moneda | null, destino: Moneda | null): boolean {
  return origen !== null && destino !== null && origen !== destino;
}

/**
 * El equivalente en COP de un movimiento entre monedas es su lado COP:
 * `monto` si el origen es COP, `montoDestino` si lo es el destino. Sin
 * `montoDestino`, `null`.
 */
export function ladoCop(m: { moneda: Moneda; monto: bigint; montoDestino: bigint | null }): bigint | null {
  if (m.montoDestino === null) return null;
  return m.moneda === "COP" ? m.monto : m.montoDestino;
}
