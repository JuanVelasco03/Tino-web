import { leyendaNeta, pesos, subtituloDebes, subtituloTeDeben } from "@/domain/prestamo/presentacion";
import type { Prestamos } from "@/domain/prestamo/tipos";

type Props = Pick<Prestamos, "teDeben" | "debes" | "posicionNeta"> & {
  /** Sin préstamos: cifras en `terciario`, doble raya en renglón y sin leyenda. */
  diaUno?: boolean;
};

/**
 * Cifra de columna: cifra-l si la columna mide 18 rem (288 px) o más, donde cabe
 * «−12.345.678.901»; si no (escritorio angosto, 1024 px), cifra-m, para que una
 * cifra de diez dígitos no invada la columna vecina.
 */
const CIFRA_COLUMNA = "font-mono text-cifra-m tabular-nums whitespace-nowrap @2xs:text-cifra-l";

type Cifra = { rotulo: string; texto: string; subtitulo: string; color: { grande: string; chica: string } };

/**
 * «Te deben», «Debes» y «Posición neta» (N-06 a N-14). Las cifras llegan de
 * la API; aquí solo se formatean. Escritorio: tres columnas bajo una raya,
 * separadas por renglones. Móvil: filas, con la posición sobre doble raya y la
 * leyenda debajo.
 */
export function ConsolidadoDeudas({ teDeben, debes, posicionNeta, diaUno = false }: Props) {
  const leyenda = diaUno ? null : leyendaNeta({ teDeben, debes, posicionNeta });
  const tenue = { grande: "text-terciario", chica: "text-terciario" };
  const tinta = { grande: "", chica: "" };
  const deuda = debes.total > 0n ? { grande: "text-salida", chica: "text-salida-texto" } : tinta;

  const cifras: Cifra[] = [
    { rotulo: "Te deben", texto: pesos(teDeben.total), subtitulo: subtituloTeDeben(teDeben), color: diaUno ? tenue : tinta },
    { rotulo: "Debes", texto: pesos(-debes.total), subtitulo: subtituloDebes(debes), color: diaUno ? tenue : deuda },
  ];
  const neta = pesos(posicionNeta);
  const colorNeta = diaUno ? "text-terciario" : "";
  const dobleRaya = diaUno ? "border-b-[3px] border-double border-linea" : "doble-raya";

  return (
    <section aria-label="Consolidado">
      {/* Escritorio */}
      <div className="hidden grid-cols-3 border-t border-raya lg:grid">
        {cifras.map((c, i) => (
          <div key={c.rotulo} className={`@container flex min-w-0 flex-col gap-2 pt-6 pr-6 ${i > 0 ? "border-l border-linea pl-6" : ""}`}>
            <h2 className="text-rotulo uppercase">{c.rotulo}</h2>
            <span className={`${CIFRA_COLUMNA} ${c.color.grande}`}>{c.texto}</span>
            <span className="text-etiqueta font-normal text-secundario">{c.subtitulo}</span>
          </div>
        ))}
        <div className="@container flex min-w-0 flex-col items-start gap-2 border-l border-linea pt-6 pl-6">
          <h2 className="text-rotulo uppercase">Posición neta</h2>
          <span className={`pb-1 ${CIFRA_COLUMNA} ${dobleRaya} ${colorNeta}`}>{neta}</span>
          {leyenda && <span className="text-etiqueta font-normal text-secundario">{leyenda}</span>}
        </div>
      </div>

      {/* Móvil */}
      <div className="lg:hidden">
        <dl>
          {cifras.map((c) => (
            <div key={c.rotulo} className="flex items-baseline justify-between gap-3 border-b border-linea py-3">
              <dt className="flex min-w-0 flex-col">
                <span className="text-cuerpo">{c.rotulo}</span>
                <span className="text-etiqueta font-normal text-secundario">{c.subtitulo}</span>
              </dt>
              <dd className={`font-mono text-cifra-m tabular-nums ${c.color.chica}`}>{c.texto}</dd>
            </div>
          ))}
          <div className={`flex items-baseline justify-between gap-3 py-3 ${dobleRaya}`}>
            <dt className="text-cuerpo font-semibold">Posición neta</dt>
            <dd className={`font-mono text-cifra-m tabular-nums ${colorNeta}`}>{neta}</dd>
          </div>
        </dl>
        {leyenda && <p className="pt-2 text-etiqueta font-normal text-secundario">{leyenda}</p>}
      </div>
    </section>
  );
}
