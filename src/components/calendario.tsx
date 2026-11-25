"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { DIAS_CUADRICULA, mismoDiaEnMes, nombreDia, semanasDelMes } from "@/domain/fecha/calendario";
import { formatearMes, mesDeFecha, sumarDias, sumarMeses } from "@/domain/fecha/formato";

type Props = {
  /** `"YYYY-MM-DD"` elegido, o `""` si aún no hay. */
  valor: string;
  /** `fechaHoy` de la API (nunca el reloj del navegador): marca el día de hoy y abre en su mes si no hay valor. */
  hoy: string | null;
  alElegir: (fecha: string) => void;
  /** Nombre del grupo para el lector de pantalla («Otra fecha»). */
  etiqueta?: string;
  /** Primer y último día que se pueden elegir (`"YYYY-MM-DD"`); fuera de ellos, la casilla queda deshabilitada. */
  min?: string;
  max?: string;
  /** Al montarse, el foco va a la casilla activa (cuando se abre desde un campo). */
  autoFoco?: boolean;
};

/** Las fechas `"YYYY-MM-DD"` y los meses `"YYYY-MM"` se comparan como texto. */
const fueraDe = (fecha: string, min?: string, max?: string) => (min !== undefined && fecha < min) || (max !== undefined && fecha > max);

function acotar(fecha: string, min?: string, max?: string): string {
  if (min !== undefined && fecha < min) return min;
  if (max !== undefined && fecha > max) return max;
  return fecha;
}

/** Fecha en la que arranca el foco: la elegida, hoy o el primero del mes, dentro de los límites. */
function inicial(valor: string, hoy: string | null, min?: string, max?: string): string {
  if (valor !== "") return valor;
  return acotar(hoy ?? `${new Date().toISOString().slice(0, 7)}-01`, min, max);
}

const FLECHA =
  "presion flex size-11 items-center justify-center rounded-campo text-secundario hover:bg-hundido hover:text-texto disabled:text-terciario disabled:hover:bg-transparent md:size-10";

/** Cabecera «‹ Noviembre 2026 ›» (o «‹ 2026 ›» en la cuadrícula de meses). */
function Cabecera({
  titulo,
  anterior,
  siguiente,
  alAnterior,
  alSiguiente,
  hayAnterior,
  haySiguiente,
}: {
  titulo: string;
  anterior: string;
  siguiente: string;
  alAnterior: () => void;
  alSiguiente: () => void;
  hayAnterior: boolean;
  haySiguiente: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <button type="button" onClick={alAnterior} disabled={!hayAnterior} aria-label={anterior} className={`-ml-2 ${FLECHA}`}>
        <ChevronLeft size={18} strokeWidth={1.5} aria-hidden />
      </button>
      <span aria-live="polite" className="text-cuerpo font-semibold">
        {titulo}
      </span>
      <button type="button" onClick={alSiguiente} disabled={!haySiguiente} aria-label={siguiente} className={`-mr-2 ${FLECHA}`}>
        <ChevronRight size={18} strokeWidth={1.5} aria-hidden />
      </button>
    </div>
  );
}

/** Casilla elegida en tinta llena; hoy en latón 600; deshabilitada en `terciario`. */
function claseCasilla(elegida: boolean, esHoy: boolean, tipografia = "font-mono text-cifra-s tabular-nums"): string {
  const base = `presion flex h-11 w-full items-center justify-center rounded-campo ${tipografia} disabled:text-terciario disabled:hover:bg-transparent md:h-10`;
  if (elegida) return `${base} bg-texto font-medium text-fondo`;
  if (esHoy) return `${base} font-semibold text-marca-texto hover:bg-hundido`;
  return `${base} text-texto hover:bg-hundido`;
}

/**
 * Calendario del libro. Mes con «‹ Noviembre 2026 ›» y una cuadrícula de
 * lunes a domingo con las cifras en mono. La fecha elegida va en tinta llena
 * (como el tipo activo); hoy, en latón 600; fuera de `min`/`max`, en
 * `terciario` y sin poder elegirse. Teclado: flechas día a día y semana a
 * semana, Inicio/Fin la semana, RePág/AvPág el mes; Enter o espacio eligen.
 * Al cambiar de mes la cuadrícula entra con «Asentar».
 */
export function Calendario({ valor, hoy, alElegir, etiqueta = "Calendario", min, max, autoFoco = false }: Props) {
  const [foco, setFoco] = useState(() => inicial(valor, hoy, min, max));
  const [mes, setMes] = useState(() => mesDeFecha(inicial(valor, hoy, min, max)));
  const cuadricula = useRef<HTMLTableElement>(null);
  const moverFoco = useRef(autoFoco);

  // Tras moverse con el teclado (o al abrirse con `autoFoco`), el foco sigue a la casilla.
  useEffect(() => {
    if (!moverFoco.current) return;
    moverFoco.current = false;
    cuadricula.current?.querySelector<HTMLButtonElement>(`[data-fecha="${foco}"]`)?.focus();
  }, [foco, mes]);

  function irA(fecha: string) {
    const destino = acotar(fecha, min, max);
    moverFoco.current = true;
    setFoco(destino);
    setMes(mesDeFecha(destino));
  }

  function cambiarMes(n: number) {
    setMes(sumarMeses(mes, n));
    setFoco(acotar(mismoDiaEnMes(foco, n), min, max));
  }

  function alTeclear(evento: KeyboardEvent<HTMLTableElement>) {
    const lunesAntes = (new Date(`${foco}T00:00:00Z`).getUTCDay() + 6) % 7;
    const destinos: Record<string, () => string> = {
      ArrowLeft: () => sumarDias(foco, -1),
      ArrowRight: () => sumarDias(foco, 1),
      ArrowUp: () => sumarDias(foco, -7),
      ArrowDown: () => sumarDias(foco, 7),
      Home: () => sumarDias(foco, -lunesAntes),
      End: () => sumarDias(foco, 6 - lunesAntes),
      PageUp: () => mismoDiaEnMes(foco, -1),
      PageDown: () => mismoDiaEnMes(foco, 1),
    };
    const destino = destinos[evento.key];
    if (!destino) return;
    evento.preventDefault();
    irA(destino());
  }

  const titulo = formatearMes(mes);
  const anterior = sumarMeses(mes, -1);
  const siguiente = sumarMeses(mes, 1);

  return (
    <div role="group" aria-label={etiqueta} className="flex flex-col gap-2">
      <Cabecera
        titulo={titulo}
        anterior={`Mes anterior: ${formatearMes(anterior)}`}
        siguiente={`Mes siguiente: ${formatearMes(siguiente)}`}
        alAnterior={() => cambiarMes(-1)}
        alSiguiente={() => cambiarMes(1)}
        hayAnterior={min === undefined || mesDeFecha(min) <= anterior}
        haySiguiente={max === undefined || mesDeFecha(max) >= siguiente}
      />

      <table ref={cuadricula} role="grid" aria-label={titulo} onKeyDown={alTeclear} className="w-full table-fixed border-collapse">
        <thead>
          <tr className="border-b border-linea">
            {DIAS_CUADRICULA.map((d) => (
              <th key={d.nombre} scope="col" className="pb-2 text-center text-rotulo font-semibold text-secundario">
                <abbr title={d.nombre} className="no-underline">
                  {d.inicial}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        {/* `key` por mes: la cuadrícula nueva entra con «Asentar». */}
        <tbody key={mes} className="asentar">
          {semanasDelMes(mes).map((semana, i) => (
            <tr key={i}>
              {semana.map((fecha, j) => {
                if (!fecha) return <td key={j} />;
                const esHoy = fecha === hoy;
                return (
                  <td key={fecha} className="p-1">
                    <button
                      type="button"
                      data-fecha={fecha}
                      tabIndex={fecha === foco ? 0 : -1}
                      disabled={fueraDe(fecha, min, max)}
                      aria-pressed={fecha === valor}
                      aria-current={esHoy ? "date" : undefined}
                      aria-label={esHoy ? `Hoy, ${nombreDia(fecha)}` : nombreDia(fecha)}
                      onClick={() => {
                        setFoco(fecha);
                        alElegir(fecha);
                      }}
                      className={claseCasilla(fecha === valor, esHoy)}
                    >
                      {Number.parseInt(fecha.slice(8), 10)}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] as const;

/**
 * Cuadrícula de meses («Un mes» de la fecha meta): «‹ 2026 ›» y doce casillas
 * en 3 columnas con el mes corto. Mismo trato que el calendario: el elegido en
 * tinta llena, el actual en latón, fuera de `min`/`max` en `terciario`.
 * Flechas mueven el foco un mes (arriba y abajo, tres).
 */
export function CalendarioMeses({
  valor,
  hoy,
  alElegir,
  etiqueta = "Mes",
  min,
  max,
  autoFoco = false,
}: {
  /** `"YYYY-MM"` o `""`. */
  valor: string;
  /** `fechaHoy` de la API: marca el mes actual. */
  hoy: string | null;
  alElegir: (mes: string) => void;
  etiqueta?: string;
  /** Primer y último mes elegibles (`"YYYY-MM"`). */
  min?: string;
  max?: string;
  autoFoco?: boolean;
}) {
  const actual = hoy ? hoy.slice(0, 7) : null;
  const arranque = valor !== "" ? valor : acotar(actual ?? new Date().toISOString().slice(0, 7), min, max);
  const [foco, setFoco] = useState(arranque);
  const [anio, setAnio] = useState(() => Number.parseInt(arranque.slice(0, 4), 10));
  const rejilla = useRef<HTMLDivElement>(null);
  const moverFoco = useRef(autoFoco);

  useEffect(() => {
    if (!moverFoco.current) return;
    moverFoco.current = false;
    rejilla.current?.querySelector<HTMLButtonElement>(`[data-mes="${foco}"]`)?.focus();
  }, [foco, anio]);

  function irA(mes: string) {
    const destino = acotar(mes, min, max);
    moverFoco.current = true;
    setFoco(destino);
    setAnio(Number.parseInt(destino.slice(0, 4), 10));
  }

  function alTeclear(evento: KeyboardEvent<HTMLDivElement>) {
    const pasos: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3, PageUp: -12, PageDown: 12 };
    const paso = pasos[evento.key];
    if (paso === undefined) return;
    evento.preventDefault();
    irA(sumarMeses(foco, paso));
  }

  const meses = MESES_CORTOS.map((_, i) => `${anio}-${String(i + 1).padStart(2, "0")}`);

  return (
    <div role="group" aria-label={etiqueta} className="flex flex-col gap-2">
      <Cabecera
        titulo={String(anio)}
        anterior={`Año anterior: ${anio - 1}`}
        siguiente={`Año siguiente: ${anio + 1}`}
        alAnterior={() => setAnio(anio - 1)}
        alSiguiente={() => setAnio(anio + 1)}
        hayAnterior={min === undefined || Number.parseInt(min.slice(0, 4), 10) <= anio - 1}
        haySiguiente={max === undefined || Number.parseInt(max.slice(0, 4), 10) >= anio + 1}
      />
      <div ref={rejilla} key={anio} onKeyDown={alTeclear} className="asentar grid grid-cols-3 gap-2 border-t border-linea pt-3">
        {meses.map((mes, i) => (
          <button
            key={mes}
            type="button"
            data-mes={mes}
            tabIndex={mes === foco || (!meses.includes(foco) && i === 0) ? 0 : -1}
            disabled={fueraDe(mes, min, max)}
            aria-pressed={mes === valor}
            aria-current={mes === actual ? "date" : undefined}
            aria-label={formatearMes(mes)}
            onClick={() => {
              setFoco(mes);
              alElegir(mes);
            }}
            className={claseCasilla(mes === valor, mes === actual, "text-cuerpo")}
          >
            {MESES_CORTOS[i]}
          </button>
        ))}
      </div>
    </div>
  );
}
