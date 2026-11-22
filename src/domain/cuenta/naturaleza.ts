export type TipoCuenta =
  | "efectivo"
  | "banco"
  | "tarjeta_credito"
  | "inversion"
  | "prestamo_otorgado"
  | "deuda_contraida";

export type Naturaleza = "activo" | "pasivo";

/** Sentido del dinero respecto a la cuenta: un gasto es una salida; un ingreso, una entrada. */
export type Sentido = "salida" | "entrada";

/** RN-02: naturaleza de cada tipo de cuenta. */
export function naturalezaDe(tipo: TipoCuenta): Naturaleza {
  switch (tipo) {
    case "efectivo":
    case "banco":
    case "inversion":
    case "prestamo_otorgado":
      return "activo";
    case "tarjeta_credito":
    case "deuda_contraida":
      return "pasivo";
  }
}

/**
 * RN-02: efecto con signo sobre el saldo de la cuenta, en unidades menores.
 * `monto` siempre es positivo. Activo: salida resta, entrada suma.
 * Pasivo: salida suma (más deuda), entrada resta.
 */
export function efectoEnSaldo(tipo: TipoCuenta, sentido: Sentido, monto: bigint): bigint {
  const delta = sentido === "entrada" ? monto : -monto;
  return naturalezaDe(tipo) === "activo" ? delta : -delta;
}

/**
 * Efecto con signo sobre el patrimonio del usuario (negativo = lo reduce).
 * Más deuda reduce el patrimonio, así que en un pasivo se invierte el
 * efecto sobre el saldo. De aquí sale el signo y el color de la lista general.
 */
export function efectoEnPatrimonio(tipo: TipoCuenta, sentido: Sentido, monto: bigint): bigint {
  const efecto = efectoEnSaldo(tipo, sentido, monto);
  return naturalezaDe(tipo) === "activo" ? efecto : -efecto;
}

/**
 * ¿Puede ser la cuenta de un gasto o un ingreso? Una inversión solo admite
 * transferencias (`CUENTA_DE_INVERSION`): todo selector de cuenta fuera de la
 * transferencia la excluye.
 */
export function admiteGastoIngreso(tipo: TipoCuenta): boolean {
  return tipo !== "inversion";
}
