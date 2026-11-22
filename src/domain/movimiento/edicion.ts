/**
 * Edición de un movimiento: precarga del formulario, detección de cambios y
 * solo lectura. El `PUT` es un reemplazo completo, así que la precarga lleva
 * todo (nota y partes incluidas): lo que faltara, el reemplazo lo borraría.
 */
import { aDigitos, desdeMonto } from "../dinero/entrada";
import type { TipoMovimiento, ValoresCaptura } from "./cuerpo";

type Ref = { id: string; nombre: string };

/** Forma del `Movimiento` de la web que la edición necesita (el dominio no importa `repositories/`). */
export type Movimiento = {
  tipo: TipoMovimiento;
  /** Siempre positivo. */
  monto: bigint;
  fecha: string;
  descripcion: string | null;
  nota: string | null;
  cuentaOrigen: Ref | null;
  cuentaDestino: Ref | null;
  categoria: Ref | null;
  partes: { categoria: Ref; monto: bigint }[];
};

/**
 * Valores del formulario desde un movimiento. La categoría va como elegida;
 * sin categoría, como quitada: abrir la edición no aplica una regla sola.
 */
export function valoresDesdeMovimiento(m: Movimiento): ValoresCaptura {
  const esTransferencia = m.tipo === "transferencia";
  return {
    tipo: m.tipo,
    monto: desdeMonto(m.monto),
    descripcion: m.descripcion ?? "",
    categoria: m.categoria && !esTransferencia ? { modo: "elegida", id: m.categoria.id } : { modo: "quitada" },
    cuentaId: (m.tipo === "ingreso" ? m.cuentaDestino?.id : m.cuentaOrigen?.id) ?? null,
    destinoId: esTransferencia ? (m.cuentaDestino?.id ?? null) : null,
    fecha: m.fecha,
    nota: m.nota ?? "",
    partes:
      m.partes.length > 0 && !esTransferencia
        ? m.partes.map((parte) => ({ categoriaId: parte.categoria.id, monto: desdeMonto(parte.monto) }))
        : null,
  };
}

/** Forma comparable: textos recortados y montos como dígitos. */
function comparable(v: ValoresCaptura): string {
  return JSON.stringify({
    tipo: v.tipo,
    monto: aDigitos(v.monto) ?? v.monto.trim(),
    descripcion: v.descripcion.trim(),
    categoria: v.categoria,
    cuentaId: v.cuentaId,
    destinoId: v.destinoId,
    fecha: v.fecha,
    nota: v.nota.trim(),
    partes: v.partes?.map((p) => ({ categoriaId: p.categoriaId, monto: aDigitos(p.monto) ?? p.monto.trim() })) ?? null,
  });
}

/** ¿Cambió algo? Ignora espacios alrededor de los textos y el formato de los montos. */
export function hayCambios(original: ValoresCaptura, actual: ValoresCaptura): boolean {
  return comparable(original) !== comparable(actual);
}

/** Un préstamo visto como cuenta: `GET /prestamos` no los lista en `GET /cuentas` (las activas). */
type PrestamoComoCuenta = { id: string; nombre: string; tipo: "prestamo_otorgado" | "deuda_contraida" };

/**
 * La primera cuenta del movimiento que no está entre las activas, o `null`
 * (N-36: solo lectura). Una cuenta de préstamo tampoco está entre las activas,
 * pero no está archivada: se ignora.
 */
export function cuentaArchivada(
  m: Pick<Movimiento, "cuentaOrigen" | "cuentaDestino">,
  activas: readonly { id: string }[],
  prestamos: readonly { id: string }[] = [],
): Ref | null {
  for (const cuenta of [m.cuentaOrigen, m.cuentaDestino]) {
    if (!cuenta || prestamos.some((p) => p.id === cuenta.id)) continue;
    if (!activas.some((a) => a.id === cuenta.id)) return cuenta;
  }
  return null;
}

/** La cuenta del préstamo en un movimiento de préstamo, con el rol del formulario que ocupa. */
export type CuentaDePrestamo = PrestamoComoCuenta & { rol: "cuenta" | "destino" };

/**
 * Si el movimiento es de un préstamo (desembolso, capital de un abono o
 * condonación), su cuenta de préstamo: queda fija y el tipo, bloqueado (la
 * API rechaza el cambio con `MOVIMIENTO_DE_PRESTAMO`). En el formulario, el
 * destino de una transferencia es `destino`; todo lo demás, `cuenta`.
 */
export function cuentaDePrestamo(
  m: Pick<Movimiento, "tipo" | "cuentaOrigen" | "cuentaDestino">,
  prestamos: readonly PrestamoComoCuenta[],
): CuentaDePrestamo | null {
  const lados = [
    { cuenta: m.cuentaOrigen, rol: "cuenta" as const },
    { cuenta: m.cuentaDestino, rol: m.tipo === "transferencia" ? ("destino" as const) : ("cuenta" as const) },
  ];
  for (const { cuenta, rol } of lados) {
    const prestamo = cuenta && prestamos.find((p) => p.id === cuenta.id);
    if (prestamo) return { id: prestamo.id, nombre: prestamo.nombre, tipo: prestamo.tipo, rol };
  }
  return null;
}
