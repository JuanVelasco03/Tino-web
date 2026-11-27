import { enMoneda, equivalente, formatearPorcentaje, tonoSigno } from "@/domain/inversion/presentacion";
import type { InversionDetalle } from "@/domain/inversion/tipos";

type Props = {
  detalle: Pick<
    InversionDetalle,
    "moneda" | "valorMercado" | "valorMercadoCop" | "costo" | "costoCop" | "rendimiento" | "rendimientoCop" | "rendimientoPorcentaje"
  >;
};

/** Clase del color por signo: + verde, − terracota, 0 secundario. `base` en cifras de 24 px o más. */
export function colorSigno(valor: bigint | number | null, base = false): string {
  const tono = tonoSigno(valor);
  if (tono === "neutro") return "text-secundario";
  if (tono === "entrada") return base ? "text-entrada" : "text-entrada-texto";
  return base ? "text-salida" : "text-salida-texto";
}

/**
 * Valor de mercado, costo de las posiciones y rendimiento con su % (N-08 a
 * N-14). Todo llega de la API. En USD, cada cifra lleva debajo «≈ … COP»
 * («≈ —» sin TRM); en COP no hay equivalente. Escritorio: tres columnas bajo
 * una raya fuerte (desde `lg`: por debajo, `US$ 1.080,08` en cifra-l no
 * cabe en un tercio). Por debajo, filas: valor de mercado y rendimiento, y
 * desde md también el costo.
 */
export function CifrasInversion({ detalle }: Props) {
  const usd = detalle.moneda === "USD";
  const rendimiento = `${enMoneda(detalle.rendimiento, detalle.moneda, true)} · ${formatearPorcentaje(detalle.rendimientoPorcentaje)}`;
  const color = colorSigno(detalle.rendimiento);

  const columnas = [
    { rotulo: "Valor de mercado", cifra: enMoneda(detalle.valorMercado, detalle.moneda), equivalente: equivalente(detalle.valorMercadoCop), color: "", tamano: "text-cifra-l" },
    { rotulo: "Costo de las posiciones", cifra: enMoneda(detalle.costo, detalle.moneda), equivalente: equivalente(detalle.costoCop), color: "", tamano: "text-cifra-m" },
    { rotulo: "Rendimiento", cifra: rendimiento, equivalente: equivalente(detalle.rendimientoCop, { signo: true }), color, tamano: "text-cifra-m" },
  ];

  return (
    <section aria-label="Cifras de la inversión">
      {/* Escritorio */}
      <div className="hidden grid-cols-[1.3fr_1fr_1.2fr] border-t border-raya lg:grid">
        {columnas.map((c, i) => (
          <div key={c.rotulo} className={`flex min-w-0 flex-col gap-2 pt-6 pr-6 ${i > 0 ? "border-l border-linea pl-6" : ""}`}>
            <h2 className={`text-rotulo uppercase ${i === 0 ? "" : "text-secundario"}`}>{c.rotulo}</h2>
            <span className={`font-mono ${c.tamano} tabular-nums [overflow-wrap:anywhere] ${c.color}`}>{c.cifra}</span>
            {usd && <span className="font-mono text-cifra-xs tabular-nums text-secundario">{c.equivalente}</span>}
          </div>
        ))}
      </div>

      {/* Móvil */}
      <dl className="flex flex-col lg:hidden">
        {columnas.map((c, i) => (
          <div
            key={c.rotulo}
            className={`flex-col gap-1 py-3 ${i === 0 ? "border-t border-raya" : "border-t border-linea"} ${i === 1 ? "hidden md:flex" : "flex"}`}
          >
            <dt className="text-rotulo uppercase text-secundario">{c.rotulo}</dt>
            <dd className={`font-mono ${c.tamano} tabular-nums [overflow-wrap:anywhere] ${c.color}`}>{c.cifra}</dd>
            {usd && <dd className="font-mono text-cifra-xs tabular-nums text-secundario">{c.equivalente}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}
