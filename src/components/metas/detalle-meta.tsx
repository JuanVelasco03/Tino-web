import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { formatearFecha, formatearFechaSinAnio } from "@/domain/fecha/formato";
import {
  avisoExcedido,
  etiquetaAporte,
  etiquetaValor,
  montoFila,
  notaApartado,
  notaInversion,
  pesos,
  textoCuenta,
  textoFalta,
  textoFechaCondicion,
  textoPorcentaje,
  textoRitmo,
} from "@/domain/meta/presentacion";
import type { FilaAporte, FilaValor, MetaDetalle } from "@/domain/meta/tipos";
import { IconoCuenta } from "../iconos";
import { BarraAvance } from "./barra-avance";
import { rutaAporte } from "./rutas";

type Props = {
  detalle: MetaDetalle;
  /** Hoy según la API; `null` en archivadas (sin textos relativos a hoy). */
  fechaHoy: string | null;
  /** «‹ Metas» o «‹ Archivadas», solo en móvil. */
  volver: { href: string; rotulo: string };
  /** `AccionesMeta` (cliente, con las server actions). Sin ellas, el detalle no tiene botones. */
  acciones?: ReactNode;
};

/**
 * Historial: ancho (≥ 448 px de su contenedor) en `64px | flexible | 120px |
 * 130px`; angosto en `flexible | 96px | 104px`, con la fecha bajo la etiqueta.
 */
const COLUMNAS = "grid-cols-[minmax(0,1fr)_96px_104px] @md:grid-cols-[64px_minmax(0,1fr)_120px_130px]";

type Fila = { clave: string; fecha: string; etiqueta: string; monto: string; acumulado: string; href: string | null };

function filasAporte(d: MetaDetalle & { historial: FilaAporte[] }, enlazar: boolean): Fila[] {
  return d.historial.map((f) => ({
    clave: f.id,
    fecha: f.fecha,
    etiqueta: etiquetaAporte(f),
    monto: montoFila(f.monto, f.tipo),
    acumulado: pesos(f.acumulado),
    href: enlazar ? rutaAporte(d.id, f.id) : null,
  }));
}

function filasValor(historial: readonly FilaValor[], creadaEl: string): Fila[] {
  return historial.map((f, i) => ({
    clave: `${f.tipo}-${f.fecha}-${i}`,
    fecha: f.fecha,
    etiqueta: etiquetaValor(f, creadaEl),
    monto: montoFila(f.variacion, "variacion"),
    acumulado: f.valor === null ? "—" : pesos(f.valor),
    href: null,
  }));
}

function FilaHistorial({ fila }: { fila: Fila }) {
  const contenido = (
    <>
      <span className="hidden font-mono text-cifra-xs tabular-nums text-secundario @md:block">{formatearFechaSinAnio(fila.fecha)}</span>
      <span className="flex min-w-0 flex-col">
        <span className="text-cuerpo">{fila.etiqueta}</span>
        <span className="font-mono text-cifra-xs tabular-nums text-secundario @md:hidden">{formatearFechaSinAnio(fila.fecha)}</span>
      </span>
      <span className="text-right font-mono text-cifra-s tabular-nums">{fila.monto}</span>
      <span className="text-right font-mono text-cifra-s font-medium tabular-nums">{fila.acumulado}</span>
    </>
  );
  const clase = `grid ${COLUMNAS} items-baseline gap-3 border-b border-linea px-2 py-3`;
  return (
    <li>
      {fila.href ? (
        <Link href={fila.href} scroll={false} className={`${clase} hover:bg-hundido`}>
          {contenido}
        </Link>
      ) : (
        <div className={clase}>{contenido}</div>
      )}
    </li>
  );
}

function Historial({ d, enlazar }: { d: MetaDetalle; enlazar: boolean }) {
  const apartado = d.modo === "apartado";
  const filas = d.modo === "apartado" ? filasAporte(d, enlazar) : filasValor(d.historial, d.creadaEl);
  return (
    <section aria-label="Historial" className="@container min-w-0">
      <div className={`grid ${COLUMNAS} items-baseline gap-3 border-b border-raya px-2 pb-2 text-rotulo uppercase text-secundario`}>
        <span className="hidden @md:block">Fecha</span>
        <span>Historial</span>
        <span className="text-right">{apartado ? "Aporte" : "Variación"}</span>
        <span className="text-right">{apartado ? "Acumulado" : "Valor"}</span>
      </div>
      {filas.length === 0 ? (
        <p className="px-2 py-3 text-etiqueta font-normal text-secundario">Sin aportes todavía.</p>
      ) : (
        <ul>
          {filas.map((fila) => (
            <FilaHistorial key={fila.clave} fila={fila} />
          ))}
        </ul>
      )}
    </section>
  );
}

const FILA = "flex items-baseline justify-between gap-3 border-b border-linea py-2";

function Condiciones({ d }: { d: MetaDetalle }) {
  return (
    <dl aria-label="Condiciones">
      <div className={FILA}>
        <dt className="text-etiqueta font-normal text-secundario">Cuenta asociada</dt>
        <dd className="text-right text-cuerpo">{textoCuenta(d)}</dd>
      </div>
      <div className={FILA}>
        <dt className="text-etiqueta font-normal text-secundario">Objetivo</dt>
        <dd className="font-mono text-cifra-s tabular-nums">{pesos(d.objetivo)}</dd>
      </div>
      <div className={FILA}>
        <dt className="text-etiqueta font-normal text-secundario">Fecha meta</dt>
        <dd className="text-right text-cuerpo">{textoFechaCondicion(d)}</dd>
      </div>
      <div className={FILA}>
        <dt className="text-etiqueta font-normal text-secundario">Creada</dt>
        <dd className="text-right text-cuerpo">{formatearFecha(d.creadaEl)}</dd>
      </div>
    </dl>
  );
}

/**
 * Detalle de una meta (N-17 a N-33): cuenta y modo, nombre, avance de
 * objetivo, barra, ritmo, notas, historial y condiciones. Todo llega
 * calculado de la API; aquí solo se arman frases.
 */
export function DetalleMeta({ detalle: d, fechaHoy, volver, acciones }: Props) {
  const cumplida = d.cumplidaEl !== null;
  const ritmo = textoRitmo(d, fechaHoy, "largo");
  const nota = notaApartado(d) ?? notaInversion(d);
  const excedido = avisoExcedido(d);
  // Las filas de una meta por apartado no archivada abren su edición.
  const enlazar = d.modo === "apartado" && d.archivadaEn === null;

  return (
    <article aria-label={d.nombre} className="@container flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link href={volver.href} className="-ml-1 inline-flex h-11 items-center gap-1 self-start text-cuerpo text-secundario md:hidden">
          <ChevronLeft size={20} strokeWidth={1.5} aria-hidden />
          {volver.rotulo}
        </Link>
        <header className="flex flex-col gap-1 border-b border-raya pb-4">
          <span className="flex items-center gap-1 text-etiqueta font-normal text-secundario">
            <IconoCuenta tipo={d.cuenta.tipo} tamano={16} />
            {textoCuenta(d)}
          </span>
          <h2 className="text-titulo-2">{d.nombre}</h2>
        </header>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="font-mono text-cifra-l tabular-nums">{d.avance === null ? "—" : pesos(d.avance)}</span>
          <span className="flex items-baseline gap-2">
            <span className="text-cuerpo text-secundario">de</span>
            <span className="font-mono text-cifra-m tabular-nums">{pesos(d.objetivo)}</span>
          </span>
        </div>
        <BarraAvance porcentaje={d.porcentaje} alto="detalle" cumplida={cumplida} />
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 font-mono text-cifra-xs tabular-nums text-secundario">
          <span>{textoPorcentaje(d.porcentaje)}</span>
          <span>{textoFalta(d)}</span>
        </div>
      </div>

      {(ritmo || nota || excedido) && (
        <div className="flex flex-col gap-2">
          {ritmo && <p className="text-cuerpo">{ritmo}</p>}
          {nota && <p className="text-etiqueta font-normal text-secundario">{nota}</p>}
          {excedido && (
            <p role="status" className="text-etiqueta text-marca-texto">
              {excedido}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-8 @4xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] @4xl:items-start">
        <Historial d={d} enlazar={enlazar} />
        <div className="flex flex-col gap-6">
          <Condiciones d={d} />
          {acciones}
        </div>
      </div>
    </article>
  );
}
