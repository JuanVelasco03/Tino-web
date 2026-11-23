"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatearDinero } from "@/domain/dinero/formato";
import { formatearDiaSemana, formatearFechaSinAnio, formatearMes, formatearNombreMes, sumarMeses } from "@/domain/fecha/formato";
import { agruparPorDia, filtrar, hayFiltros, opcionesDe, personaDe, SIN_FILTROS, type Filtros, type Personas } from "@/domain/movimiento/filtros";
import { importeEnPatrimonio, importeMostrado } from "@/domain/movimiento/vista-previa";
import type { DatosCaptura } from "@/services/captura";
import type { Movimiento } from "@/services/movimientos";
import { AvisoRegistro, type DatosAviso } from "../captura/aviso-registro";
import { conceptoDe } from "../captura/panel-captura";
import { useContextoCaptura } from "../captura/proveedor-captura";
import { cuentaDe, datosDeOferta } from "../captura/usar-captura";
import { EnlaceTexto } from "../enlace-texto";
import { EstadoVacio } from "../estado-vacio";
import { FilaMovimiento, SubRenglones, type ParteFila } from "../fila-movimiento";
import { EdicionMovimiento } from "./edicion-movimiento";
import { FiltrosMovimientos, type DefinicionFiltro, type OpcionFiltro } from "./filtros-movimientos";
import { useAvisoEdicion, type AccionesEdicion, type PrestamoDeEdicion, type ResultadoEdicion } from "./usar-edicion";

type Props = {
  /** `"YYYY-MM"` del mes listado. */
  mes: string;
  /** `"YYYY-MM"` del mes actual en la zona del usuario: el vacío y las opciones de fecha. */
  actual: string;
  /** Préstamos (id de su cuenta y persona): la columna y el filtro de persona. */
  personas: readonly { id: string; nombre: string }[];
  /** En el orden de la API: fecha desc, el último registrado primero. Con el filtro, ya filtrados. */
  movimientos: Movimiento[];
  /** `?sinClasificar=1`: solo los gastos sin clasificar, con su rótulo, su vacío y «Ver todos». */
  sinClasificar?: boolean;
  /** `?movimiento=<id>`: el movimiento y lo que su formulario necesita, cargados con la página. */
  edicion: { movimiento: Movimiento; datos: DatosCaptura; prestamos?: readonly PrestamoDeEdicion[] } | null;
  acciones: AccionesEdicion;
};

/** Categoría como se lee: «Dividido» con partes; `null` = sin clasificar. Una transferencia no lleva. */
function categoria(m: Movimiento): string | null {
  if (m.partes.length > 0) return "Dividido";
  return m.categoria?.nombre ?? null;
}

function partesDe(m: Movimiento): ParteFila[] {
  return m.partes.map((p) => ({ categoria: p.categoria.nombre, monto: p.monto }));
}

/**
 * Importe con signo y color desde el patrimonio: gasto −, ingreso +,
 * transferencia sin signo. Entre monedas, el lado COP y debajo «US$ … · TRM …».
 */
function Importe({ m, peso }: { m: Movimiento; peso: string }) {
  const { dinero, linea } = importeMostrado(m);
  const efecto = importeEnPatrimonio(m.tipo, dinero.monto);
  const cifra = formatearDinero({ ...dinero, monto: efecto ?? dinero.monto }, { omitirCOP: true, signoMas: efecto !== null });
  const color = efecto === null ? "" : efecto < 0n ? "text-salida-texto" : "text-entrada-texto";
  return (
    <span className="flex flex-col items-end">
      <span className={`text-right font-mono text-cifra-s tabular-nums ${color} ${peso}`}>{cifra}</span>
      {linea && <span className="whitespace-nowrap text-etiqueta text-secundario">{linea}</span>}
    </span>
  );
}

/** «Guardado: Almuerzo −18.000 en Nequi · ahora en Octubre 2026» / «Eliminado: …». */
function datosAvisoEdicion(resultado: ResultadoEdicion | null): DatosAviso | null {
  if (!resultado) return null;
  const { movimiento } = resultado;
  return {
    tipo: movimiento.tipo,
    monto: movimiento.monto,
    moneda: movimiento.moneda,
    descripcion: movimiento.descripcion,
    cuenta: cuentaDe(movimiento),
    verbo: resultado.tipo === "guardado" ? "Guardado" : "Eliminado",
    sufijo: resultado.tipo === "guardado" && resultado.mesNuevo ? ` · ahora en ${formatearMes(resultado.mesNuevo)}` : undefined,
  };
}

/** Meses del filtro de fecha: el actual y los 11 anteriores, más el listado si cae fuera (un mes futuro). */
function opcionesFecha(mes: string, actual: string): OpcionFiltro[] {
  const meses = Array.from({ length: 12 }, (_, i) => sumarMeses(actual, -i));
  if (!meses.includes(mes)) meses.unshift(mes);
  const anio = actual.slice(0, 4);
  return meses.map((m) => {
    const nombre = formatearMes(m);
    return { valor: m, etiqueta: m.startsWith(anio) ? nombre.split(" ")[0] : nombre, href: `/movimientos?mes=${m}` };
  });
}

const TIPOS: OpcionFiltro[] = [
  { valor: null, etiqueta: "Todos" },
  { valor: "gasto", etiqueta: "Gastos" },
  { valor: "ingreso", etiqueta: "Ingresos" },
  { valor: "transferencia", etiqueta: "Transferencias" },
];

const todas = (opciones: { valor: string; etiqueta: string }[]): OpcionFiltro[] => [{ valor: null, etiqueta: "Todas" }, ...opciones];

/** Escritorio: Fecha · Concepto · Categoría · Cuenta · (Persona desde lg) · Monto. */
const COLUMNAS =
  "grid-cols-[52px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_128px] lg:grid-cols-[52px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.7fr)_128px]";

/** Categoría en su columna: transferencia y sin clasificar en secundario. */
function CeldaCategoria({ m }: { m: Movimiento }) {
  if (m.tipo === "transferencia") return <span className="text-secundario">Transferencia</span>;
  const cat = categoria(m);
  return cat ? <span>{cat}</span> : <span className="punteada text-secundario">Sin clasificar</span>;
}

/**
 * Libro de movimientos de un mes. Arriba, el título con la cantidad y los
 * filtros: fecha (cambia de mes por URL) y, sobre los movimientos ya
 * cargados, búsqueda, cuenta, categoría, tipo y persona. Los movimientos de
 * un mismo día van juntos: en escritorio la fecha solo en la primera fila del
 * día; en móvil, un encabezado por día con filas C2. Cada fila es un enlace a
 * su edición (`?movimiento=<id>`); un movimiento dividido muestra sus partes
 * como sub-renglones. Tras registrar, guardar o eliminar, el aviso va arriba
 * de la lista y la fila se resalta. Con el filtro de gastos sin clasificar,
 * los enlaces lo conservan y al clasificar uno la fila sale de la lista.
 */
export function LibroMovimientos({ mes, actual, personas: prestamos, movimientos, sinClasificar = false, edicion, acciones }: Props) {
  const { abrir, resaltadoId: registrado } = useContextoCaptura();
  const aviso = useAvisoEdicion(acciones);
  const [filtros, setFiltros] = useState<Filtros>(SIN_FILTROS);
  const personas: Personas = useMemo(() => new Map(prestamos.map((p) => [p.id, p.nombre])), [prestamos]);
  const opciones = useMemo(() => opcionesDe(movimientos, personas), [movimientos, personas]);
  const visibles = useMemo(() => filtrar(movimientos, filtros, personas), [movimientos, filtros, personas]);
  const dias = agruparPorDia(visibles);

  const esActual = mes === actual;
  const nombreMes = formatearNombreMes(mes);
  const filtro = sinClasificar ? "&sinClasificar=1" : "";
  const verTodos = `/movimientos?mes=${mes}`;
  const enlace = (m: Movimiento) => `/movimientos?mes=${mes}${filtro}&movimiento=${m.id}`;
  const resaltada = (m: Movimiento) => m.id === registrado || m.id === aviso.resaltadoId;

  const datosAviso = datosAvisoEdicion(aviso.aviso);
  const datosOferta = datosDeOferta(aviso.oferta, (acepta) => void aviso.responderOferta(acepta));

  const cambiar = (clave: "cuentaId" | "categoriaId" | "persona") => (valor: string | null) => setFiltros((f) => ({ ...f, [clave]: valor }));
  const definiciones: DefinicionFiltro[] = [
    { clave: "fecha", rotulo: "Fecha", valor: mes, opciones: opcionesFecha(mes, actual), fijo: true },
    { clave: "cuenta", rotulo: "Cuenta", valor: filtros.cuentaId, opciones: todas(opciones.cuentas), alElegir: cambiar("cuentaId") },
    { clave: "categoria", rotulo: "Categoría", valor: filtros.categoriaId, opciones: todas(opciones.categorias), alElegir: cambiar("categoriaId") },
    {
      clave: "tipo",
      rotulo: "Tipo",
      valor: filtros.tipo,
      opciones: TIPOS,
      alElegir: (valor) => setFiltros((f) => ({ ...f, tipo: valor as Filtros["tipo"] })),
    },
    { clave: "persona", rotulo: "Persona", valor: filtros.persona, opciones: todas(opciones.personas), alElegir: cambiar("persona") },
  ];
  const cantidad = visibles.length;

  return (
    <>
      <header className="flex items-baseline justify-between gap-6">
        <h1 className="text-titulo-1">Movimientos</h1>
        <span className="text-etiqueta font-normal text-secundario">
          <span className="font-mono tabular-nums text-texto">{cantidad}</span>
          <span className="max-md:hidden"> {cantidad === 1 ? "movimiento" : "movimientos"}</span>
        </span>
      </header>

      <FiltrosMovimientos
        texto={filtros.texto}
        alCambiarTexto={(texto) => setFiltros((f) => ({ ...f, texto }))}
        filtros={definiciones}
        activos={hayFiltros(filtros)}
        alLimpiar={() => setFiltros(SIN_FILTROS)}
      />

      <AvisoRegistro aviso={datosAviso} oferta={datosOferta} />

      {sinClasificar && movimientos.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-rotulo uppercase">Gastos sin clasificar · {movimientos.length}</h2>
          <EnlaceTexto href={verTodos}>Ver todos</EnlaceTexto>
        </div>
      )}

      {sinClasificar && movimientos.length === 0 ? (
        <EstadoVacio
          rotulo={`Sin clasificar · ${nombreMes}`}
          titulo={`No quedan gastos sin clasificar en ${nombreMes}.`}
          detalle="Todos tienen categoría o están divididos."
          accion={{ etiqueta: "Ver todos", href: verTodos, sinMas: true }}
        />
      ) : movimientos.length === 0 ? (
        <EstadoVacio
          rotulo={`Movimientos · ${nombreMes}`}
          titulo={esActual ? "Aún no registras movimientos este mes." : `No hay movimientos en ${nombreMes}.`}
          detalle={esActual ? "Registra tu primer gasto." : "Registra uno o cambia de mes."}
          accion={{ etiqueta: "Registrar", alPulsar: abrir }}
        />
      ) : (
        <section aria-label={`Movimientos de ${formatearMes(mes)}`}>
          {/* Escritorio */}
          <div role="table" className="hidden md:block">
            <div role="row" className={`grid ${COLUMNAS} gap-3 border-y border-raya py-2 text-rotulo uppercase text-secundario`}>
              <span role="columnheader">Fecha</span>
              <span role="columnheader">Concepto</span>
              <span role="columnheader">Categoría</span>
              <span role="columnheader">Cuenta</span>
              <span role="columnheader" className="hidden lg:block">
                Persona
              </span>
              <span role="columnheader" className="text-right">
                Monto
              </span>
            </div>
            {dias.map((dia) =>
              dia.movimientos.map((m, i) => {
                const destacada = resaltada(m);
                const peso = destacada ? "font-semibold" : "";
                return (
                  <div
                    key={m.id}
                    role="row"
                    className={`relative grid ${COLUMNAS} items-baseline gap-x-3 border-b border-linea py-3 ${
                      destacada ? "bg-hundido" : "hover:bg-hundido"
                    }`}
                  >
                    <span role="cell" className="font-mono text-cifra-xs text-secundario">
                      {/* La fecha solo en la primera fila del día; las demás quedan bajo ella. */}
                      {i === 0 ? formatearFechaSinAnio(m.fecha) : <span className="sr-only">{formatearFechaSinAnio(m.fecha)}</span>}
                    </span>
                    <span role="cell" className="min-w-0">
                      {/* El enlace se estira sobre toda la fila: un solo objetivo, nombrado por el concepto. */}
                      <Link href={enlace(m)} scroll={false} className={`block truncate text-cuerpo after:absolute after:inset-0 ${peso}`}>
                        {conceptoDe(m)}
                      </Link>
                    </span>
                    <span role="cell" className="truncate text-etiqueta">
                      <CeldaCategoria m={m} />
                    </span>
                    <span role="cell" className="truncate text-etiqueta font-normal text-secundario">
                      {cuentaDe(m)}
                    </span>
                    <span role="cell" className="hidden truncate text-etiqueta font-normal text-secundario lg:block">
                      {personaDe(m, personas)}
                    </span>
                    <span role="cell" className="text-right">
                      <Importe m={m} peso={peso} />
                    </span>
                    {m.partes.length > 0 && <SubRenglones partes={partesDe(m)} className="col-[2/-1] pt-1" />}
                  </div>
                );
              }),
            )}
          </div>

          {/* Móvil */}
          <div className="md:hidden">
            {dias.map((dia) => (
              <section key={dia.fecha} aria-label={formatearDiaSemana(dia.fecha)} className="pt-6 first:pt-0">
                <h2 className="border-b border-raya pb-2 text-rotulo uppercase">{formatearDiaSemana(dia.fecha)}</h2>
                {dia.movimientos.map((m) => (
                  <FilaMovimiento
                    key={m.id}
                    concepto={conceptoDe(m)}
                    tipo={m.tipo}
                    monto={importeMostrado(m).dinero}
                    detalleImporte={importeMostrado(m).linea}
                    categoria={categoria(m)}
                    cuenta={m.tipo === "transferencia" ? undefined : cuentaDe(m)}
                    transferencia={
                      m.tipo === "transferencia" ? { origen: m.cuentaOrigen?.nombre ?? "", destino: m.cuentaDestino?.nombre ?? "" } : undefined
                    }
                    partes={partesDe(m)}
                    omitirCOP
                    resaltada={resaltada(m)}
                    href={enlace(m)}
                  />
                ))}
              </section>
            ))}
          </div>

          {cantidad === 0 && (
            <div className="flex flex-col gap-1 border-b border-linea py-8 max-md:border-t max-md:border-t-raya">
              <p className="text-cuerpo font-semibold">Nada con estos filtros.</p>
              <p className="text-etiqueta font-normal text-secundario">Prueba otro mes o limpia los filtros.</p>
            </div>
          )}
        </section>
      )}

      {edicion && (
        <EdicionMovimiento
          key={edicion.movimiento.id}
          movimiento={edicion.movimiento}
          datos={edicion.datos}
          prestamos={edicion.prestamos}
          mes={mes}
          sinClasificar={sinClasificar}
          acciones={acciones}
          alTerminar={aviso.mostrar}
        />
      )}
    </>
  );
}
