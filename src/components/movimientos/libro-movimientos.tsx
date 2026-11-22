"use client";

import Link from "next/link";
import { formatearDinero } from "@/domain/dinero/formato";
import { formatearFechaSinAnio, formatearMes } from "@/domain/fecha/formato";
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
import { useAvisoEdicion, type AccionesEdicion, type PrestamoDeEdicion, type ResultadoEdicion } from "./usar-edicion";

type Props = {
  /** `"YYYY-MM"` del mes listado. */
  mes: string;
  /** ¿Es el mes actual? Cambia el texto del estado vacío. */
  esActual: boolean;
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

const COLUMNAS = "grid-cols-[52px_minmax(0,1fr)_minmax(0,176px)_128px]";

/**
 * Libro de movimientos de un mes. Escritorio: rejilla de cuatro columnas.
 * Móvil: C2. Cada fila es un enlace a su edición (`?movimiento=<id>`); un
 * movimiento dividido muestra sus partes como sub-renglones. Tras registrar,
 * guardar o eliminar, el aviso va arriba de la lista y la fila se resalta.
 * Con el filtro de gastos sin clasificar, los enlaces lo conservan y al
 * clasificar uno la fila sale de la lista.
 */
export function LibroMovimientos({ mes, esActual, movimientos, sinClasificar = false, edicion, acciones }: Props) {
  const { abrir, resaltadoId: registrado } = useContextoCaptura();
  const aviso = useAvisoEdicion(acciones);
  const nombreMes = formatearMes(mes).split(" ")[0].toLowerCase();
  const filtro = sinClasificar ? "&sinClasificar=1" : "";
  const verTodos = `/movimientos?mes=${mes}`;
  const enlace = (m: Movimiento) => `/movimientos?mes=${mes}${filtro}&movimiento=${m.id}`;
  const resaltada = (m: Movimiento) => m.id === registrado || m.id === aviso.resaltadoId;

  const datosAviso = datosAvisoEdicion(aviso.aviso);
  const datosOferta = datosDeOferta(aviso.oferta, (acepta) => void aviso.responderOferta(acepta));

  return (
    <>
      <AvisoRegistro aviso={datosAviso} oferta={datosOferta} />

      {sinClasificar && movimientos.length > 0 && (
        <div className="flex items-center justify-between gap-3 max-md:border-b max-md:border-raya">
          {/* En escritorio la raya la pone la fila de rótulos de la tabla. */}
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
        <section aria-label={`Movimientos de ${mes}`}>
          {/* Escritorio */}
          <div role="table" className="hidden md:block">
            <div role="row" className={`grid ${COLUMNAS} gap-3 border-b border-raya pb-2 text-rotulo uppercase text-secundario`}>
              <span role="columnheader">Fecha</span>
              <span role="columnheader">Descripción</span>
              <span role="columnheader">Cuenta</span>
              <span role="columnheader" className="text-right">
                Importe
              </span>
            </div>
            {movimientos.map((m) => {
              const destacada = resaltada(m);
              const peso = destacada ? "font-semibold" : "";
              const cat = categoria(m);
              return (
                <div
                  key={m.id}
                  role="row"
                  className={`relative grid ${COLUMNAS} items-baseline gap-x-3 border-b border-linea py-3 ${
                    destacada ? "bg-hundido" : "hover:bg-hundido"
                  }`}
                >
                  <span role="cell" className="font-mono text-cifra-xs text-secundario">
                    {formatearFechaSinAnio(m.fecha)}
                  </span>
                  <span role="cell" className="flex min-w-0 flex-col">
                    {/* El enlace se estira sobre toda la fila: un solo objetivo, nombrado por el concepto. */}
                    <Link href={enlace(m)} scroll={false} className={`truncate text-cuerpo after:absolute after:inset-0 ${peso}`}>
                      {conceptoDe(m)}
                    </Link>
                    <span className="text-etiqueta text-secundario">
                      {m.tipo === "transferencia" ? "Transferencia" : cat ?? <span className="punteada">Sin clasificar</span>}
                    </span>
                  </span>
                  <span role="cell" className="truncate text-etiqueta text-secundario">
                    {cuentaDe(m)}
                  </span>
                  <span role="cell" className="text-right">
                    <Importe m={m} peso={peso} />
                  </span>
                  {m.partes.length > 0 && <SubRenglones partes={partesDe(m)} className="col-span-3 col-start-2 pt-1" />}
                </div>
              );
            })}
          </div>

          {/* Móvil */}
          <div className="md:hidden">
            {movimientos.map((m) => (
              <FilaMovimiento
                key={m.id}
                fecha={formatearFechaSinAnio(m.fecha)}
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
          </div>
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
