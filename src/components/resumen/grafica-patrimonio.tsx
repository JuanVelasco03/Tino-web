import { useId } from "react";
import { formatearDinero } from "@/domain/dinero/formato";
import { formatearMesCorto, mesDeFecha } from "@/domain/fecha/formato";
import { casillasPuntoDePartida, geometriaSerie, MARGEN, type Lienzo } from "@/domain/resumen/grafica";

type Serie = readonly { fecha: string; patrimonio: bigint }[];

type Props =
  /** Serie de la API (1 a 12 puntos; el último es hoy). */
  | { serie: Serie; puntoDePartida?: undefined }
  /** Día uno: hoy a la izquierda y los 11 meses por venir, con la línea por trazar. */
  | { serie?: undefined; puntoDePartida: { fechaHoy: string } };

/** `viewBox` fijo por formato: los tamaños del texto están pensados para cada ancho. */
const LIENZOS = {
  escritorio: { ancho: 690, alto: 240 },
  movil: { ancho: 358, alto: 180 },
} as const satisfies Record<string, Lienzo>;

/** Día uno: más bajo, en media columna (escritorio) y sobre el botón (móvil). */
const LIENZOS_PARTIDA = {
  escritorio: { ancho: 480, alto: 140 },
  movil: { ancho: 358, alto: 100 },
} as const satisfies Record<string, Lienzo>;

/** Cifra-xs (12/16 · 400) dentro del SVG: el texto toma la familia mono de la página. */
const TEXTO = "font-mono text-cifra-xs";

function pesos(monto: bigint): string {
  return formatearDinero({ monto, moneda: "COP" }, { omitirCOP: true });
}

/** Base del área (raya) y renglón de las etiquetas de mes. */
function baseDe(lienzo: Lienzo) {
  const yBase = lienzo.alto - MARGEN.abajo + 6;
  return { yBase, yMeses: lienzo.alto - 4, xFin: lienzo.ancho - MARGEN.derecha + 8 };
}

function SvgSerie({ serie, lienzo, className, etiqueta }: { serie: Serie; lienzo: Lienzo; className: string; etiqueta: string }) {
  const { puntos, rejilla } = geometriaSerie(serie, lienzo);
  const { yBase, yMeses, xFin } = baseDe(lienzo);
  const ultimo = puntos.length - 1;
  return (
    <svg role="img" aria-label={etiqueta} viewBox={`0 0 ${lienzo.ancho} ${lienzo.alto}`} className={`h-auto w-full overflow-visible ${className}`}>
      {rejilla.map((l) => (
        <g key={l.etiqueta}>
          <line x1={0} x2={xFin} y1={l.y} y2={l.y} className="stroke-linea" strokeWidth={1} />
          <text x={lienzo.ancho} y={l.y + 4} textAnchor="end" className={`${TEXTO} fill-secundario`}>
            {l.etiqueta}
          </text>
        </g>
      ))}
      <line x1={0} x2={xFin} y1={yBase} y2={yBase} className="stroke-raya" strokeWidth={1} />
      {puntos.length > 1 && (
        <polyline
          points={puntos.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          className="stroke-texto"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      )}
      {puntos.map((p, i) => (
        <g key={p.x}>
          <circle
            cx={p.x}
            cy={p.y}
            r={i === ultimo ? 3.5 : 2.5}
            className={`stroke-texto ${i === ultimo ? "fill-texto" : "fill-fondo"}`}
            strokeWidth={1.5}
          />
          <text x={p.x} y={yMeses} textAnchor="middle" className={`${TEXTO} ${i === ultimo ? "fill-texto" : "fill-secundario"}`}>
            {p.etiqueta}
          </text>
        </g>
      ))}
    </svg>
  );
}

function SvgPuntoDePartida({ fechaHoy, lienzo, className }: { fechaHoy: string; lienzo: Lienzo; className: string }) {
  const casillas = casillasPuntoDePartida(fechaHoy, lienzo.ancho);
  const { yBase, yMeses, xFin } = baseDe(lienzo);
  const yLinea = Math.round((MARGEN.arriba + lienzo.alto - MARGEN.abajo) / 2);
  return (
    <svg aria-hidden viewBox={`0 0 ${lienzo.ancho} ${lienzo.alto}`} className={`h-auto w-full overflow-visible ${className}`}>
      <line x1={casillas[0].x} x2={xFin} y1={yLinea} y2={yLinea} className="stroke-terciario" strokeWidth={1} strokeDasharray="4 4" />
      <line x1={0} x2={xFin} y1={yBase} y2={yBase} className="stroke-raya" strokeWidth={1} />
      <circle cx={casillas[0].x} cy={yLinea} r={5} className="fill-texto stroke-fondo" strokeWidth={3} />
      {casillas.map((c, i) => (
        <text key={c.x} x={c.x} y={yMeses} textAnchor="middle" className={`${TEXTO} ${i === 0 ? "fill-texto" : "fill-terciario"}`}>
          {c.etiqueta}
        </text>
      ))}
    </svg>
  );
}

/**
 * Patrimonio neto en el tiempo (N-36, N-37, N-39): SVG propio, sin librería.
 * La escala se calcula en `domain/` con `bigint`; aquí solo se dibujan
 * píxeles. Rejilla en renglón, base en raya, línea de 1,5 px en tinta,
 * puntos huecos y hoy relleno. Un `viewBox` por formato, estirado al ancho.
 */
export function GraficaPatrimonio(props: Props) {
  if (props.puntoDePartida) {
    const { fechaHoy } = props.puntoDePartida;
    return (
      <div>
        <SvgPuntoDePartida fechaHoy={fechaHoy} lienzo={LIENZOS_PARTIDA.escritorio} className="hidden md:block" />
        <SvgPuntoDePartida fechaHoy={fechaHoy} lienzo={LIENZOS_PARTIDA.movil} className="md:hidden" />
      </div>
    );
  }

  const { serie } = props;
  if (serie.length === 0) return null;
  const primero = serie[0];
  const hoy = serie[serie.length - 1];
  const etiqueta = `Patrimonio neto: de ${pesos(primero.patrimonio)} en ${formatearMesCorto(mesDeFecha(primero.fecha))} a ${pesos(hoy.patrimonio)} hoy`;
  return (
    <div>
      <SvgSerie serie={serie} lienzo={LIENZOS.escritorio} etiqueta={etiqueta} className="hidden md:block" />
      <SvgSerie serie={serie} lienzo={LIENZOS.movil} etiqueta={etiqueta} className="md:hidden" />
    </div>
  );
}

/**
 * Bloque «Patrimonio neto · 12 meses» (N-35 a N-39): el de hoy en cifra-l,
 * su variación «desde» el primer punto y la gráfica. Con un solo punto no hay
 * variación que contar: solo la cifra y hoy.
 */
export function PatrimonioNeto({ patrimonio }: { patrimonio: { hoy: bigint; serie: Serie; variacionSerie: bigint } }) {
  const { hoy, serie, variacionSerie } = patrimonio;
  const titulo = useId();
  const desde = serie.length > 1 ? formatearMesCorto(mesDeFecha(serie[0].fecha)) : null;
  return (
    <section aria-labelledby={titulo}>
      <div className="flex items-baseline justify-between gap-3 border-b border-raya pb-2">
        <h2 id={titulo} className="text-rotulo uppercase">
          Patrimonio neto · 12 meses
        </h2>
        {desde && <span className="hidden text-etiqueta font-normal text-secundario md:inline">{desde} – hoy</span>}
      </div>
      <div className="flex flex-col gap-1 pt-4 pb-4 md:flex-row md:items-baseline md:justify-between md:gap-3 md:pb-6">
        <span className="font-mono text-cifra-l tabular-nums">{pesos(hoy)}</span>
        {desde && (
          <span className="text-etiqueta font-normal text-secundario">
            <span className="font-mono tabular-nums text-texto">
              {formatearDinero({ monto: variacionSerie, moneda: "COP" }, { omitirCOP: true, signoMas: true })}
            </span>{" "}
            desde {desde}
          </span>
        )}
      </div>
      <GraficaPatrimonio serie={serie} />
    </section>
  );
}
