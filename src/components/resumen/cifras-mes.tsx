import { formatearDinero } from "@/domain/dinero/formato";
import { formatearMes, formatearMesCorto } from "@/domain/fecha/formato";
import { formatearPorcentaje } from "@/domain/resumen/porcentaje";
import type { Comparacion } from "@/services/resumen";

type Props = {
  ingresos: Comparacion;
  gastos: Comparacion;
  resultado: Comparacion;
  /** `"YYYY-MM"` del mes con que se compara. */
  mesAnterior: string;
};

type Cifra = {
  rotulo: string;
  dato: Comparacion;
  /** Cómo se lee la cifra del mes: ingreso `+` en verde, gasto `−` en terracota, resultado con su signo en tinta. */
  clase: "ingreso" | "gasto" | "resultado";
};

/** Pesos sin «COP»; con `signo`, los positivos llevan `+`. */
function pesos(monto: bigint, signo = false): string {
  return formatearDinero({ monto, moneda: "COP" }, { omitirCOP: true, signoMas: signo });
}

/** La cifra del mes como se muestra: el gasto se lee desde el patrimonio, con `−`. */
function cifraDelMes({ dato, clase }: Cifra): string {
  if (clase === "gasto") return pesos(-dato.actual);
  return pesos(dato.actual, true);
}

/** Color: un cero va en tinta y sin signo. `grande` (≥ 24 px) usa la base del acento; más chico, su variante `-texto`. */
function colorDe({ dato, clase }: Cifra, grande: boolean): string {
  if (dato.actual === 0n || clase === "resultado") return "";
  if (clase === "ingreso") return grande ? "text-entrada" : "text-entrada-texto";
  return grande ? "text-salida" : "text-salida-texto";
}

/** El anterior se lee como el actual: ingreso y gasto sin signo, resultado con el suyo. */
function anteriorDe({ dato, clase }: Cifra): string {
  return clase === "resultado" ? pesos(dato.anterior, true) : pesos(dato.anterior);
}

/** «+62.500 · +1,5 %»; sin base, «+62.500 · —». Si no cabe, parte en el «·», nunca dentro de una cifra. */
function variacionDe({ dato }: Cifra) {
  return (
    <>
      <span className="whitespace-nowrap">{pesos(dato.variacion, true)} ·</span>{" "}
      <span className="whitespace-nowrap">{formatearPorcentaje(dato.variacionPorcentaje, { signo: true })}</span>
    </>
  );
}

/**
 * Ingresos, gastos y resultado del mes frente al anterior (N-14 a N-20). Las
 * cifras, variaciones y porcentajes llegan de la API: aquí solo se formatean.
 * Desde xl: tres columnas bajo una raya (en lg, con el menú lateral, un
 * tercio deja 184 px y una cifra de 8 dígitos en cifra-l mide 204; en md, una
 * cifra-l no cabe en un tercio). Antes: ingresos y gastos en filas, y el
 * resultado entre raya y doble raya.
 */
export function CifrasMes({ ingresos, gastos, resultado, mesAnterior }: Props) {
  const cifras: Cifra[] = [
    { rotulo: "Ingresos", dato: ingresos, clase: "ingreso" },
    { rotulo: "Gastos", dato: gastos, clase: "gasto" },
    { rotulo: "Resultado neto", dato: resultado, clase: "resultado" },
  ];
  const nombreAnterior = formatearMes(mesAnterior).split(" ")[0];
  const anteriorCorto = formatearMesCorto(mesAnterior).split(" ")[0];

  return (
    <section aria-label="Cifras del mes">
      {/* Escritorio */}
      <div className="hidden grid-cols-3 border-t border-raya xl:grid">
        {cifras.map((c, i) => (
          <div key={c.rotulo} className={`flex min-w-0 flex-col gap-3 pt-6 ${i > 0 ? "border-l border-linea pl-6" : ""} ${i < 2 ? "pr-6" : ""}`}>
            <h2 className="text-rotulo uppercase">{c.rotulo}</h2>
            <span className={`font-mono text-cifra-l tabular-nums ${colorDe(c, true)}`}>{cifraDelMes(c)}</span>
            <dl className="flex flex-col">
              <div className="flex items-baseline justify-between gap-3 border-t border-linea py-2">
                <dt className="text-etiqueta font-normal text-secundario">{nombreAnterior}</dt>
                <dd className="font-mono text-cifra-xs tabular-nums text-secundario">{anteriorDe(c)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-t border-linea py-2">
                <dt className="text-etiqueta font-normal text-secundario">Variación</dt>
                <dd className="text-right font-mono text-cifra-xs tabular-nums">{variacionDe(c)}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      {/* Móvil */}
      <dl className="xl:hidden">
        {cifras.map((c) => {
          const esResultado = c.clase === "resultado";
          return (
            <div
              key={c.rotulo}
              className={`flex items-baseline justify-between gap-3 py-3 ${esResultado ? "doble-raya border-t border-raya" : "border-b border-linea"}`}
            >
              <dt className={`text-cuerpo ${esResultado ? "font-semibold" : ""}`}>{c.rotulo}</dt>
              <dd className="flex flex-col items-end gap-1">
                <span className={`font-mono tabular-nums ${esResultado ? "text-cifra-l" : "text-cifra-m"} ${colorDe(c, esResultado)}`}>
                  {cifraDelMes(c)}
                </span>
                <span className="font-mono text-cifra-xs tabular-nums text-secundario">
                  {formatearPorcentaje(c.dato.variacionPorcentaje, { signo: true })} vs {anteriorCorto}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
