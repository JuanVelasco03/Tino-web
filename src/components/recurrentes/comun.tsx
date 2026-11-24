import { formatearDinero } from "@/domain/dinero/formato";
import type { TipoCaptura as TipoMovimiento } from "@/domain/movimiento/cuerpo";
import { importeEnPatrimonio } from "@/domain/movimiento/vista-previa";
import type { Recurrente } from "@/domain/recurrente/tipos";

/** Pesos sin «COP»: toda la pantalla está en pesos (plantillas en USD, fuera de alcance). */
export function pesos(monto: bigint): string {
  return formatearDinero({ monto, moneda: "COP" }, { omitirCOP: true });
}

/** Importe con el signo de su tipo, leído desde el patrimonio: gasto −, ingreso +, transferencia sin signo. */
export function importeConSigno(tipo: TipoMovimiento, monto: bigint): string {
  const efecto = importeEnPatrimonio(tipo, monto);
  return formatearDinero({ monto: efecto ?? monto, moneda: "COP" }, { omitirCOP: true, signoMas: efecto !== null });
}

/** Color del importe: `salida-texto`, `entrada-texto` o tinta. */
export function colorImporte(tipo: TipoMovimiento): string {
  return tipo === "gasto" ? "text-salida-texto" : tipo === "ingreso" ? "text-entrada-texto" : "";
}

/** Importe en cifra-s con signo y color; «≈ » delante si es un estimado. */
export function Importe({
  tipo,
  monto,
  aproximado,
  tenue = false,
  className = "",
}: {
  tipo: TipoMovimiento;
  monto: bigint;
  aproximado: boolean;
  tenue?: boolean;
  className?: string;
}) {
  return (
    <span className={`whitespace-nowrap font-mono text-cifra-s tabular-nums ${tenue ? "text-terciario" : colorImporte(tipo)} ${className}`}>
      {aproximado && "≈ "}
      {importeConSigno(tipo, monto)}
    </span>
  );
}

type ConCuentas = Pick<Recurrente, "tipo" | "cuentaOrigen" | "cuentaDestino">;

/** «Bancolombia»; en transferencia, «Nequi → Visa Oro». */
export function cuentaTexto(r: ConCuentas): string {
  if (r.tipo === "transferencia") return `${r.cuentaOrigen?.nombre ?? "—"} → ${r.cuentaDestino?.nombre ?? "—"}`;
  return (r.tipo === "gasto" ? r.cuentaOrigen?.nombre : r.cuentaDestino?.nombre) ?? "—";
}

/** La cuenta afectada al confirmar: la de origen en gasto y transferencia, la de destino en ingreso. */
export function cuentaAfectada(r: ConCuentas): string {
  return (r.tipo === "ingreso" ? r.cuentaDestino?.nombre : r.cuentaOrigen?.nombre) ?? "—";
}

/** «Servicios», «Sin categoría» o, en transferencia, «Transferencia». */
export function categoriaTexto(r: Pick<Recurrente, "tipo" | "categoria">): string {
  if (r.tipo === "transferencia") return "Transferencia";
  return r.categoria?.nombre ?? "Sin categoría";
}

/** Rótulo de sección con contador: «POR CONFIRMAR 2»; en un contenedor angosto, «POR CONFIRMAR · 2». */
export function RotuloContador({ titulo, cantidad, ancho }: { titulo: string; cantidad: number; ancho: "@2xl" | "@5xl" }) {
  const separador = ancho === "@2xl" ? "@2xl:hidden" : "@5xl:hidden";
  return (
    <h2 className="flex items-baseline gap-2 text-rotulo uppercase">
      <span>
        {titulo}
        <span aria-hidden className={separador}>
          {" "}
          ·
        </span>
      </span>
      <span className="font-mono text-cifra-xs font-normal tabular-nums text-secundario">{cantidad}</span>
    </h2>
  );
}
