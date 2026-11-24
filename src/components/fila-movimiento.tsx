import Link from "next/link";
import { formatearDinero, type Dinero } from "@/domain/dinero/formato";
import type { TipoMovimiento } from "@/domain/movimiento/cuerpo";
import { importeEnPatrimonio } from "@/domain/movimiento/vista-previa";

/** Parte de un movimiento dividido, ya con el nombre de su categoría. */
export type ParteFila = { categoria: string; monto: bigint };

type Props = {
  /** Ya formateada, p. ej. "04 nov". Sin ella (agrupada bajo su día), la fila no lleva columna de fecha. */
  fecha?: string;
  concepto: string;
  tipo: TipoMovimiento;
  monto: Dinero;
  /** Solo en un ajuste: sube el saldo («+», verde) o lo baja («−», terracota). */
  ajusteSube?: boolean;
  /** Gasto o ingreso: categoría («Dividido» si tiene partes), o `null` si aún no está clasificado. */
  categoria?: string | null;
  /** Gasto o ingreso: nombre de la cuenta. */
  cuenta?: string;
  /** Transferencia: extremos. */
  transferencia?: { origen: string; destino: string };
  /** Dividido: un sub-renglón por parte (categoría y monto), bajo la fila. */
  partes?: ParteFila[];
  /** Dólares: equivalente en COP, que se muestra debajo en secundario. */
  equivalenteCOP?: bigint;
  /** Transferencia entre monedas: «US$ 2.000,00 · TRM 4.120,00» bajo la cifra (que es el lado COP). */
  detalleImporte?: string | null;
  /** Toda la columna está en pesos: se omite «COP». */
  omitirCOP?: boolean;
  /** El recién registrado o guardado, mientras dura su aviso: fondo hundido y peso 600. */
  resaltada?: boolean;
  /** La fila entera es un enlace a su edición (`?movimiento=<id>`), sin mover el scroll. */
  href?: string;
};

/**
 * Sub-renglones de un movimiento dividido: categoría en `etiqueta` secundaria
 * y monto en cifra-xs, alineado con el importe. Sin signo: el signo es del total.
 */
export function SubRenglones({ partes, omitirCOP = true, className = "" }: { partes: ParteFila[]; omitirCOP?: boolean; className?: string }) {
  return (
    <ul aria-label="Partes" className={`flex flex-col ${className}`}>
      {partes.map((parte) => (
        <li key={parte.categoria} className="flex items-baseline justify-between gap-3 pl-3">
          <span className="truncate text-etiqueta text-secundario">{parte.categoria}</span>
          <span className="font-mono text-cifra-xs tabular-nums text-secundario">
            {formatearDinero({ monto: parte.monto, moneda: "COP" }, { omitirCOP })}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * C2 · Fila de movimiento, lista general. Sin icono.
 * Cada cifra se lee desde el patrimonio: gasto −, terracota; ingreso +, verde;
 * transferencia en tinta, sin signo. El signo sale del tipo
 * (`importeEnPatrimonio`, que coincide con `efectoEnPatrimonio`, RN-02).
 */
export function FilaMovimiento({
  fecha,
  concepto,
  tipo,
  monto,
  ajusteSube,
  categoria,
  cuenta,
  transferencia,
  partes = [],
  equivalenteCOP,
  detalleImporte = null,
  omitirCOP = false,
  resaltada = false,
  href,
}: Props) {
  const efecto = importeEnPatrimonio(tipo, monto.monto, ajusteSube);
  const cifra =
    efecto === null
      ? formatearDinero(monto, { omitirCOP })
      : formatearDinero({ ...monto, monto: efecto }, { omitirCOP, signoMas: true });
  const color = efecto === null ? "" : efecto < 0n ? "text-salida-texto" : "text-entrada-texto";
  // El peso va en cada texto: los tokens de tamaño fijan el suyo y no heredan.
  const peso = resaltada ? "font-semibold" : "";

  return (
    <div
      className={`relative grid ${fecha === undefined ? "grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-[52px_minmax(0,1fr)_auto]"} items-baseline gap-x-3 border-b border-linea py-3 ${
        resaltada ? "bg-hundido" : href ? "hover:bg-hundido" : ""
      }`}
    >
      {fecha !== undefined && <span className="font-mono text-cifra-xs text-secundario">{fecha}</span>}
      <div className="min-w-0">
        {href ? (
          // El enlace se estira sobre toda la fila (`after:inset-0`): un solo objetivo, nombrado por el concepto.
          <Link href={href} scroll={false} className={`block text-cuerpo after:absolute after:inset-0 ${peso}`}>
            {concepto}
          </Link>
        ) : (
          <div className={`text-cuerpo ${peso}`}>{concepto}</div>
        )}
        <div className="text-etiqueta text-secundario">
          {tipo === "transferencia" && transferencia ? (
            <>
              Transferencia · {transferencia.origen} → {transferencia.destino}
            </>
          ) : (
            <>
              {categoria ? (
                categoria
              ) : (
                <span className="punteada">Sin clasificar</span>
              )}
              {cuenta && <> · {cuenta}</>}
            </>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className={`font-mono text-cifra-s tabular-nums ${color} ${peso}`}>{cifra}</div>
        {equivalenteCOP !== undefined && (
          <div className="font-mono text-cifra-xs tabular-nums text-secundario">
            ≈ {formatearDinero({ monto: equivalenteCOP, moneda: "COP" }, { omitirCOP: true })}
          </div>
        )}
        {detalleImporte && <div className="whitespace-nowrap text-etiqueta text-secundario">{detalleImporte}</div>}
      </div>
      {partes.length > 0 && (
        <SubRenglones partes={partes} omitirCOP={omitirCOP} className={`col-span-2 pt-1 ${fecha === undefined ? "col-start-1" : "col-start-2"}`} />
      )}
    </div>
  );
}
