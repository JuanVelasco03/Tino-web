import { useId } from "react";
import { formatearDinero } from "@/domain/dinero/formato";
import { formatearMesCorto, mesDeFecha } from "@/domain/fecha/formato";
import { CASILLAS, casillasPuntoDePartida, geometriaSerie, MARGEN, type Lienzo } from "@/domain/resumen/grafica";

type Serie = readonly { fecha: string; patrimonio: bigint }[];

type Props =
  /** Serie de la API (1 a 12 puntos; el último es hoy). `mes` (`"YYYY-MM"`): el mes que se está viendo, marcado si es un cierre pasado. */
  | { serie: Serie; mes?: string; puntoDePartida?: undefined }
  /** Día uno: hoy a la izquierda y los 11 meses por venir, con la línea por trazar. */
  | { serie?: undefined; puntoDePartida: { fechaHoy: string } };

/**
 * `viewBox` fijo por formato: los tamaños del texto están pensados para cada
 * ancho. Se elige por el ancho del bloque (container query), no de la
 * ventana, para que el SVG estirado no lleve el texto lejos de 12 px:
 * móvil hasta 448 px, medio hasta 576, escritorio desde ahí.
 */
const LIENZOS = {
  escritorio: { ancho: 690, alto: 240 },
  medio: { ancho: 520, alto: 200 },
  movil: { ancho: 358, alto: 180 },
} as const satisfies Record<string, Lienzo>;

/**
 * Punto de partida: más bajo que la serie. También por ancho del bloque:
 * móvil hasta 448 px, medio (la media columna del día uno) hasta 576, y
 * escritorio en la columna ancha del resumen.
 */
const LIENZOS_PARTIDA = {
  escritorio: { ancho: 690, alto: 112 },
  medio: { ancho: 480, alto: 104 },
  movil: { ancho: 358, alto: 96 },
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

/** En móvil, 12 meses de 3 letras no caben a 12 px: se rotula uno de cada dos, contando desde hoy. */
type Alternas = { alternas?: boolean };

function SvgSerie({
  serie,
  lienzo,
  className,
  etiqueta,
  alternas,
  mes,
}: { serie: Serie; lienzo: Lienzo; className: string; etiqueta: string; mes?: string } & Alternas) {
  const { puntos, rejilla, vacias } = geometriaSerie(serie, lienzo);
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
      {/* Meses antes del inicio, en tenue: la escala de 12 casillas no se estira. Alternas cuentan desde hoy (casilla 11). */}
      {vacias.map((c, i) =>
        alternas && (CASILLAS - 1 - i) % 2 !== 0 ? null : (
          <text key={c.x} x={c.x} y={yMeses} textAnchor="middle" className={`${TEXTO} fill-terciario`}>
            {c.etiqueta}
          </text>
        ),
      )}
      {puntos.length > 1 && (
        <polyline
          points={puntos.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          className="stroke-texto"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      )}
      {puntos.map((p, i) => {
        // El cierre del mes que se está viendo: punto hueco más grande y su mes en tinta.
        // Hoy ya está marcado (relleno), así que en el mes actual no se repite.
        const marcado = i !== ultimo && mes !== undefined && mesDeFecha(serie[i].fecha) === mes;
        return (
        <g key={p.x}>
          <circle
            cx={p.x}
            cy={p.y}
            r={i === ultimo || marcado ? 3.5 : 2.5}
            className={`stroke-texto ${i === ultimo ? "fill-texto" : "fill-fondo"}`}
            strokeWidth={1.5}
          />
          {(!alternas || (ultimo - i) % 2 === 0) && (
            <text
              x={p.x}
              y={yMeses}
              textAnchor="middle"
              className={`${TEXTO} ${i === ultimo || marcado ? "fill-texto" : "fill-secundario"} ${marcado ? "font-medium" : ""}`}
            >
              {p.etiqueta}
            </text>
          )}
        </g>
        );
      })}
    </svg>
  );
}

function SvgPuntoDePartida({ fechaHoy, lienzo, className, alternas }: { fechaHoy: string; lienzo: Lienzo; className: string } & Alternas) {
  const casillas = casillasPuntoDePartida(fechaHoy, lienzo.ancho);
  const { yBase, yMeses } = baseDe(lienzo);
  const yLinea = Math.round((MARGEN.arriba + lienzo.alto - MARGEN.abajo) / 2);
  const ultima = casillas[casillas.length - 1].x;
  // Sin rejilla, la base va de borde a borde, alineada con la raya del encabezado.
  // Hoy es el punto relleno de la serie; cada cierre por venir, un punto hueco
  // en la punteada: lo que «cada cierre de mes agrega un punto» quiere decir.
  return (
    <svg aria-hidden viewBox={`0 0 ${lienzo.ancho} ${lienzo.alto}`} className={`h-auto w-full overflow-visible ${className}`}>
      <line x1={casillas[0].x} x2={ultima} y1={yLinea} y2={yLinea} className="stroke-terciario" strokeWidth={1} strokeDasharray="4 4" />
      <line x1={0} x2={lienzo.ancho} y1={yBase} y2={yBase} className="stroke-raya" strokeWidth={1} />
      {casillas.slice(1).map((c) => (
        <circle key={c.x} cx={c.x} cy={yLinea} r={2.5} className="fill-fondo stroke-terciario" strokeWidth={1} />
      ))}
      <circle cx={casillas[0].x} cy={yLinea} r={3.5} className="fill-texto stroke-texto" strokeWidth={1.5} />
      {casillas.map((c, i) =>
        alternas && i % 2 !== 0 ? null : (
          <text key={c.x} x={c.x} y={yMeses} textAnchor="middle" className={`${TEXTO} ${i === 0 ? "fill-texto" : "fill-terciario"}`}>
            {c.etiqueta}
          </text>
        ),
      )}
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
  const mes = props.puntoDePartida ? undefined : props.mes;
  if (props.puntoDePartida) {
    const { fechaHoy } = props.puntoDePartida;
    return <PuntoDePartida fechaHoy={fechaHoy} />;
  }

  const { serie } = props;
  if (serie.length === 0) return null;
  // Un solo punto no es una línea: es el punto de partida (la cuenta más
  // antigua es de este mes). Mismo dibujo que el día uno, con hoy a la izquierda.
  if (serie.length === 1) return <PuntoDePartida fechaHoy={serie[0].fecha} />;
  const primero = serie[0];
  const hoy = serie[serie.length - 1];
  const etiqueta = `Patrimonio neto: de ${pesos(primero.patrimonio)} en ${formatearMesCorto(mesDeFecha(primero.fecha))} a ${pesos(hoy.patrimonio)} hoy`;
  return (
    <div className="@container">
      <SvgSerie serie={serie} mes={mes} lienzo={LIENZOS.escritorio} etiqueta={etiqueta} className="hidden @xl:block" />
      <SvgSerie serie={serie} mes={mes} lienzo={LIENZOS.medio} etiqueta={etiqueta} className="hidden @md:block @xl:hidden" />
      <SvgSerie serie={serie} mes={mes} lienzo={LIENZOS.movil} etiqueta={etiqueta} className="@md:hidden" alternas />
    </div>
  );
}

function PuntoDePartida({ fechaHoy }: { fechaHoy: string }) {
  return (
    <div className="@container">
      <SvgPuntoDePartida fechaHoy={fechaHoy} lienzo={LIENZOS_PARTIDA.escritorio} className="hidden @xl:block" />
      <SvgPuntoDePartida fechaHoy={fechaHoy} lienzo={LIENZOS_PARTIDA.medio} className="hidden @md:block @xl:hidden" />
      <SvgPuntoDePartida fechaHoy={fechaHoy} lienzo={LIENZOS_PARTIDA.movil} className="@md:hidden" alternas />
    </div>
  );
}

/**
 * Bloque «Patrimonio neto · 12 meses» (N-35 a N-39): el de hoy en cifra-l,
 * su variación «desde» el primer punto y la gráfica. Con un solo punto no hay
 * variación que contar: la cifra, el punto de partida y la nota del día uno.
 */
export function PatrimonioNeto({
  patrimonio,
  mes,
}: {
  patrimonio: { hoy: bigint; serie: Serie; variacionSerie: bigint };
  /** `"YYYY-MM"` del mes consultado: en un mes cerrado, su cierre se marca en la gráfica. */
  mes?: string;
}) {
  const { hoy, serie, variacionSerie } = patrimonio;
  const titulo = useId();
  const desde = serie.length > 1 ? formatearMesCorto(mesDeFecha(serie[0].fecha)) : null;
  return (
    <section aria-labelledby={titulo}>
      <div className="flex items-baseline justify-between gap-3 border-b border-raya pb-2">
        <h2 id={titulo} className="text-rotulo uppercase">
          Patrimonio neto · 12 meses
        </h2>
        {/* leading-none: que el renglón mida lo que el rótulo y la raya quede a la altura de la de «Cambio en …». */}
        {desde && <span className="hidden text-etiqueta leading-none font-normal text-secundario md:inline">{desde} – hoy</span>}
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
      <GraficaPatrimonio serie={serie} mes={mes} />
      {serie.length === 1 && (
        <p className="pt-4 text-etiqueta font-normal text-secundario">La línea arranca hoy. Cada cierre de mes agrega un punto.</p>
      )}
    </section>
  );
}
