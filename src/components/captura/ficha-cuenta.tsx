import type { Naturaleza, TipoCuenta } from "@/domain/cuenta/naturaleza";
import { formatearDinero } from "@/domain/dinero/formato";
import { IconoCuenta } from "../iconos";

/**
 * Sin `tipo` ni `saldo`: una cuenta archivada que solo se conoce por su nombre
 * (la de una plantilla recurrente); se muestra «Archivada» en vez del saldo.
 */
type CuentaFicha =
  | { nombre: string; tipo: TipoCuenta; naturaleza: Naturaleza; saldo: bigint }
  | { nombre: string; tipo?: undefined; naturaleza?: undefined; saldo?: undefined };

type Props = {
  cuenta: CuentaFicha;
  elegida: boolean;
  /** Saldo estimado tras el movimiento («20.321 → 5.321»), solo en la elegida y con monto. */
  resultante?: bigint | null;
  /** Solo el nombre, sin saldo («Ya está en Nubank» en el origen de un aporte). */
  sinSaldo?: boolean;
  alPulsar: () => void;
};

/** En un pasivo el saldo es deuda: «debe 1.284.300». */
function saldoTexto(monto: bigint, naturaleza: Naturaleza): string {
  const cifra = formatearDinero({ monto, moneda: "COP" }, { omitirCOP: true });
  return naturaleza === "pasivo" ? `debe ${cifra}` : cifra;
}

/**
 * Ficha de cuenta para elegir dónde se registra (captura, escritorio). Dos por
 * fila. La elegida lleva borde en tinta y nombre en 600; con monto muestra la
 * vista previa del saldo (presentación, RN-02).
 */
export function FichaCuenta({ cuenta, elegida, resultante = null, sinSaldo = false, alPulsar }: Props) {
  return (
    <button
      type="button"
      aria-pressed={elegida}
      onClick={alPulsar}
      className={`grid min-h-12 grid-cols-[20px_minmax(0,1fr)] items-center gap-2 rounded-campo border bg-superficie px-3 py-2 text-left ${
        elegida ? "border-texto" : "border-linea hover:border-secundario"
      }`}
    >
      <span className="flex text-secundario">{cuenta.tipo && <IconoCuenta tipo={cuenta.tipo} />}</span>
      <span className="flex min-w-0 flex-col">
        <span className={`truncate text-cuerpo ${elegida ? "font-semibold" : ""}`}>{cuenta.nombre}</span>
        {sinSaldo ? null : cuenta.saldo === undefined ? (
          <span className="truncate text-etiqueta font-normal text-secundario">Archivada</span>
        ) : (
          <span className="truncate font-mono text-cifra-xs tabular-nums text-secundario">
            {saldoTexto(cuenta.saldo, cuenta.naturaleza)}
            {resultante !== null && ` → ${saldoTexto(resultante, cuenta.naturaleza)}`}
          </span>
        )}
      </span>
    </button>
  );
}
