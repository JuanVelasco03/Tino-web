/**
 * Edición de un ajuste de saldo en `/movimientos` (Tino-API SPEC 14, web SPEC
 * 13). Un ajuste trae una sola cuenta: en `cuentaDestino` si subió el saldo,
 * en `cuentaOrigen` si lo bajó. Se edita monto, fecha, cuenta (conservando
 * el lado), descripción y nota; nunca tipo, categoría ni partes. Funciones
 * puras, sin `number` para los montos.
 */
import { aDigitos, desdeMonto } from "../dinero/entrada";

type Ref = { id: string; nombre: string };

/** Lo que la edición necesita de un ajuste. `Movimiento` de la web lo cumple. */
export type Ajuste = {
  monto: bigint;
  fecha: string;
  descripcion: string | null;
  nota: string | null;
  cuentaOrigen: Ref | null;
  cuentaDestino: Ref | null;
  categoria: Ref | null;
};

export type LadoAjuste = "origen" | "destino";

export type ValoresAjuste = {
  /** Lo tecleado, ya formateado: `"3.500"`. */
  monto: string;
  fecha: string;
  cuentaId: string | null;
  descripcion: string;
  nota: string;
};

/** `MovimientoCuerpo` del contrato para `PUT /movimientos/:id` de un ajuste. */
export type CuerpoAjusteMovimiento = {
  tipo: "ajuste";
  monto: string;
  fecha: string;
  descripcion: string | null;
  nota: string | null;
  cuentaOrigenId: string | null;
  cuentaDestinoId: string | null;
  categoriaId: string | null;
};

/** `destino` si el ajuste subió el saldo; `origen` si lo bajó. */
export function ladoAjuste(a: Pick<Ajuste, "cuentaDestino">): LadoAjuste {
  return a.cuentaDestino !== null ? "destino" : "origen";
}

export function valoresAjusteDesde(a: Ajuste): ValoresAjuste {
  return {
    monto: desdeMonto(a.monto),
    fecha: a.fecha,
    cuentaId: (a.cuentaDestino ?? a.cuentaOrigen)?.id ?? null,
    descripcion: a.descripcion ?? "",
    nota: a.nota ?? "",
  };
}

function textoONulo(texto: string): string | null {
  const recortado = texto.trim();
  return recortado === "" ? null : recortado;
}

/**
 * Cuerpo del `PUT` (reemplazo completo, con la categoría que trae), o `null`
 * si el monto no es un entero > 0 o falta la cuenta.
 */
export function cuerpoAjuste(a: Ajuste, v: ValoresAjuste): CuerpoAjusteMovimiento | null {
  const monto = aDigitos(v.monto);
  if (monto === null || monto === "0" || v.cuentaId === null || v.fecha === "") return null;
  const sube = ladoAjuste(a) === "destino";
  return {
    tipo: "ajuste",
    monto,
    fecha: v.fecha,
    descripcion: textoONulo(v.descripcion),
    nota: textoONulo(v.nota),
    cuentaOrigenId: sube ? null : v.cuentaId,
    cuentaDestinoId: sube ? v.cuentaId : null,
    categoriaId: a.categoria?.id ?? null,
  };
}

/** ¿Cambió algo? Ignora espacios alrededor de los textos y el formato del monto. */
export function hayCambiosAjuste(original: ValoresAjuste, actual: ValoresAjuste): boolean {
  const forma = (v: ValoresAjuste) =>
    JSON.stringify([aDigitos(v.monto) ?? v.monto.trim(), v.fecha, v.cuentaId, v.descripcion.trim(), v.nota.trim()]);
  return forma(original) !== forma(actual);
}
