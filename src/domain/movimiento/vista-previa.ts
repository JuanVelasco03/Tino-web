/**
 * Presentación de un movimiento: vista previa del saldo y signo en la lista.
 * Es solo presentación; el saldo vigente lo da `GET /cuentas` (RN-01).
 */
import { efectoEnSaldo, type Sentido, type TipoCuenta } from "../cuenta/naturaleza";
import { formatearDinero, formatearTasa, type Dinero, type Moneda } from "../dinero/formato";
import { ladoCop, type TipoMovimiento } from "./cuerpo";

/**
 * Saldo de la cuenta tras el movimiento: `saldo + efectoEnSaldo` (RN-02).
 * En un pasivo, el saldo es la deuda: un gasto la sube, un ingreso la baja.
 */
export function saldoResultante(cuenta: { tipo: TipoCuenta; saldo: bigint }, sentido: Sentido, monto: bigint): bigint {
  return cuenta.saldo + efectoEnSaldo(cuenta.tipo, sentido, monto);
}

/**
 * Importe con signo leído desde el patrimonio: gasto negativo, ingreso
 * positivo; transferencia `null` (sin signo, no cambia el patrimonio). Coincide
 * con `efectoEnPatrimonio` para cualquier tipo de cuenta, así que la fila no
 * necesita saber de qué cuenta sale. Un ajuste (solo efectivo o banco, SPEC
 * 14) sube si trae `cuentaDestino` (`ajusteSube`) y baja si trae `cuentaOrigen`.
 */
export function importeEnPatrimonio(tipo: TipoMovimiento, monto: bigint, ajusteSube = false): bigint | null {
  switch (tipo) {
    case "gasto":
      return -monto;
    case "ingreso":
      return monto;
    case "transferencia":
      return null;
    case "ajuste":
      return ajusteSube ? monto : -monto;
  }
}

/**
 * Importe que muestra la lista y su línea de detalle. Una transferencia entre
 * monedas se lee por su lado COP, con «US$ 2.000,00 · TRM 4.120,00» debajo
 * (el lado USD y la tasa congelada del movimiento, RN-04). Las demás, su
 * monto en su moneda, sin línea.
 */
export function importeMostrado(m: {
  moneda: Moneda;
  monto: bigint;
  montoDestino: bigint | null;
  tasa: bigint;
}): { dinero: Dinero; linea: string | null } {
  const cop = ladoCop(m);
  if (cop === null || m.montoDestino === null) return { dinero: { monto: m.monto, moneda: m.moneda }, linea: null };
  const dolares = m.moneda === "USD" ? m.monto : m.montoDestino;
  return {
    dinero: { monto: cop, moneda: "COP" },
    linea: `${formatearDinero({ monto: dolares, moneda: "USD" })} · TRM ${formatearTasa(m.tasa)}`,
  };
}
