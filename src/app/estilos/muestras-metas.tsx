"use client";

import { useState, type ReactNode } from "react";
import { Boton } from "@/components/boton";
import { EnlaceTexto } from "@/components/enlace-texto";
import { EstadoVacio } from "@/components/estado-vacio";
import { AccionesMeta, type AccionesDetalleMeta } from "@/components/metas/acciones-meta";
import { BarraAvance } from "@/components/metas/barra-avance";
import { CampoFechaMeta } from "@/components/metas/campo-fecha-meta";
import { DetalleMeta } from "@/components/metas/detalle-meta";
import { ListaMetas, ListaMetasArchivadas, TotalesCabecera } from "@/components/metas/lista-metas";
import { PanelAporte, type AccionesPanelAporte } from "@/components/metas/panel-aporte";
import { PanelMeta, type AccionesPanelMeta } from "@/components/metas/panel-meta";
import type { Precision } from "@/domain/meta/formulario";
import type { FilaAporte, Meta, MetaDetalle } from "@/domain/meta/tipos";
import type { Cuenta } from "@/services/cuentas";

const HOY = "2026-11-11";
const TRM = { valor: 412_000n, vigenteDesde: HOY, vigenteHasta: HOY, fuente: "Superintendencia Financiera de Colombia" };
const NUBANK = { id: "nubank", nombre: "Nubank", tipo: "banco", moneda: "COP" } as const;
const BANCOLOMBIA = { id: "banco", nombre: "Bancolombia", tipo: "banco", moneda: "COP" } as const;
const ETORO = { id: "etoro", nombre: "eToro", tipo: "inversion", moneda: "USD" } as const;

/** Las cuatro del diseño (`Metas.dc.html`), con `fechaHoy` 11 nov 2026 y TRM 4.120,00. */
function datosMetas(sufijo: string) {
  const viaje: Meta = {
    id: `viaje-${sufijo}`,
    nombre: "Viaje a Cartagena",
    modo: "apartado",
    cuenta: NUBANK,
    objetivo: 1_800_000n,
    avance: 600_000n,
    falta: 1_200_000n,
    porcentaje: 3333,
    fechaMeta: "2026-12-15",
    cumplidaEl: null,
    uso: null,
    ritmo: { tipo: "dias", falta: 1_200_000n, dias: 34, vencida: false },
    creadaEl: "2026-09-20",
    archivadaEn: null,
  };
  const cuota: Meta = {
    ...viaje,
    id: `cuota-${sufijo}`,
    nombre: "Cuota inicial apartamento",
    modo: "cuenta",
    cuenta: ETORO,
    objetivo: 45_000_000n,
    avance: 31_930_000n,
    falta: 13_070_000n,
    porcentaje: 7095,
    fechaMeta: "2027-12",
    ritmo: { tipo: "meses", falta: 13_070_000n, meses: 13, cuotaMensual: 1_005_385n, vencida: false },
    creadaEl: "2026-07-31",
  };
  const fondo: Meta = {
    ...viaje,
    id: `fondo-${sufijo}`,
    nombre: "Fondo de emergencia",
    objetivo: 7_500_000n,
    avance: 1_900_000n,
    falta: 5_600_000n,
    porcentaje: 2533,
    fechaMeta: null,
    ritmo: { tipo: "promedio", promedioMensual: 316_667n, mesEstimado: "2028-05" },
    creadaEl: "2026-06-15",
  };
  const moto: Meta = {
    ...viaje,
    id: `moto-${sufijo}`,
    nombre: "Arreglo de la moto",
    cuenta: BANCOLOMBIA,
    objetivo: 850_000n,
    avance: 850_000n,
    falta: 0n,
    porcentaje: 10_000,
    fechaMeta: null,
    cumplidaEl: "2026-09-12",
    uso: { fecha: "2026-09-14", motivo: "taller" },
    ritmo: null,
    creadaEl: "2026-07-01",
  };

  const historialFondo: FilaAporte[] = [
    { id: "f5", tipo: "aporte", fecha: "2026-11-10", monto: 350_000n, acumulado: 1_900_000n, inicial: false, motivo: null, cuentaOrigen: { id: "banco", nombre: "Bancolombia" }, movimientoId: "m5" },
    { id: "f4", tipo: "retiro", fecha: "2026-10-31", monto: 100_000n, acumulado: 1_550_000n, inicial: false, motivo: "arreglo de la nevera", cuentaOrigen: null, movimientoId: null },
    { id: "f3", tipo: "aporte", fecha: "2026-09-30", monto: 450_000n, acumulado: 1_650_000n, inicial: false, motivo: null, cuentaOrigen: null, movimientoId: null },
    { id: "f2", tipo: "aporte", fecha: "2026-07-31", monto: 900_000n, acumulado: 1_200_000n, inicial: false, motivo: "prima", cuentaOrigen: null, movimientoId: null },
    { id: "f1", tipo: "aporte", fecha: "2026-06-15", monto: 300_000n, acumulado: 300_000n, inicial: true, motivo: null, cuentaOrigen: null, movimientoId: null },
  ];
  const apartadosFondo = {
    saldoCuenta: 2_500_000n,
    apartadoAqui: 1_900_000n,
    otras: [{ metaId: viaje.id, nombre: "Viaje a Cartagena", apartado: 600_000n }],
    libre: 0n,
    excedido: false,
  };

  const detalleFondo: MetaDetalle = { ...fondo, modo: "apartado", historial: historialFondo, apartados: apartadosFondo, inversion: null };
  const fondoExcedido: MetaDetalle = {
    ...detalleFondo,
    id: `${fondo.id}-excedido`,
    apartados: { ...apartadosFondo, saldoCuenta: 2_300_000n, libre: -200_000n, excedido: true },
  };
  const detalleViaje: MetaDetalle = {
    ...viaje,
    modo: "apartado",
    historial: [{ id: "v1", tipo: "aporte", fecha: "2026-09-20", monto: 600_000n, acumulado: 600_000n, inicial: true, motivo: null, cuentaOrigen: null, movimientoId: null }],
    apartados: { ...apartadosFondo, apartadoAqui: 600_000n, otras: [{ metaId: fondo.id, nombre: "Fondo de emergencia", apartado: 1_900_000n }] },
    inversion: null,
  };
  const detalleCuota: MetaDetalle = {
    ...cuota,
    modo: "cuenta",
    historial: [
      { tipo: "cierre", fecha: "2026-07-31", valor: 28_400_000n, variacion: null, trm: null },
      { tipo: "cierre", fecha: "2026-08-31", valor: 29_150_000n, variacion: 750_000n, trm: null },
      { tipo: "cierre", fecha: "2026-09-30", valor: 30_820_000n, variacion: 1_670_000n, trm: null },
      { tipo: "cierre", fecha: "2026-10-31", valor: 30_540_000n, variacion: -280_000n, trm: null },
      { tipo: "hoy", fecha: HOY, valor: 31_930_000n, variacion: 1_390_000n, trm: TRM },
    ],
    apartados: null,
    inversion: { valorMercado: 775_000n, moneda: "USD", trm: TRM },
  };
  const cuotaSinTrm: MetaDetalle = {
    ...detalleCuota,
    id: `${cuota.id}-sin-trm`,
    avance: null,
    falta: null,
    porcentaje: null,
    ritmo: null,
    historial: [
      { tipo: "cierre", fecha: "2026-07-31", valor: 28_400_000n, variacion: null, trm: null },
      { tipo: "hoy", fecha: HOY, valor: null, variacion: null, trm: null },
    ],
    inversion: { valorMercado: 775_000n, moneda: "USD", trm: null },
  };
  const detalleMoto: MetaDetalle = {
    ...moto,
    modo: "apartado",
    historial: [
      { id: "mo2", tipo: "retiro", fecha: "2026-09-14", monto: 850_000n, acumulado: 0n, inicial: false, motivo: "taller", cuentaOrigen: null, movimientoId: null },
      { id: "mo1", tipo: "aporte", fecha: "2026-09-12", monto: 850_000n, acumulado: 850_000n, inicial: true, motivo: null, cuentaOrigen: null, movimientoId: null },
    ],
    apartados: { saldoCuenta: 980_000n, apartadoAqui: 0n, otras: [], libre: 980_000n, excedido: false },
    inversion: null,
  };
  const motoConApartado: MetaDetalle = {
    ...detalleMoto,
    id: `${moto.id}-apartado`,
    uso: null,
    historial: detalleMoto.historial.slice(1),
    apartados: { saldoCuenta: 980_000n, apartadoAqui: 850_000n, otras: [], libre: 130_000n, excedido: false },
  };
  const motoArchivada: MetaDetalle = { ...detalleMoto, id: `${moto.id}-archivada`, archivadaEn: "2026-10-01T15:00:00.000Z" };

  return { viaje, cuota, fondo, moto, detalleFondo, fondoExcedido, detalleViaje, detalleCuota, cuotaSinTrm, detalleMoto, motoConApartado, motoArchivada };
}

function cuenta(id: string, nombre: string, tipo: Cuenta["tipo"], saldo: bigint, moneda: Cuenta["moneda"] = "COP"): Cuenta {
  const naturaleza = tipo === "tarjeta_credito" ? "pasivo" : "activo";
  return { id, nombre, tipo, moneda, naturaleza, detalle: null, saldo, saldoInicial: 0n, tarjeta: null, inversion: null, archivadaEn: null };
}

const CUENTAS: Cuenta[] = [
  cuenta("nubank", "Nubank", "banco", 2_500_000n),
  cuenta("banco", "Bancolombia", "banco", 980_000n),
  cuenta("nequi", "Nequi", "efectivo", 412_000n),
  cuenta("etoro", "eToro", "inversion", 31_930_000n, "USD"),
  cuenta("visa", "Visa", "tarjeta_credito", 1_284_300n),
];

async function esperar(): Promise<void> {
  await new Promise((resolver) => setTimeout(resolver, 400));
}

/** Crear con «Ya está» falla como en la API (libre 0); con origen, se crea. */
const ACCIONES_META: AccionesPanelMeta = {
  async crear(cuerpo) {
    await esperar();
    if (cuerpo.aporteInicial && !cuerpo.aporteInicial.cuentaOrigenId) {
      return { ok: false, codigo: "SALDO_LIBRE_INSUFICIENTE", campo: "aporteInicial", mensaje: "La cuenta no tiene saldo libre suficiente." };
    }
    return { ok: true, id: "muestra" };
  },
  async editar(id) {
    await esperar();
    return { ok: true, id };
  },
};

/** Un retiro mayor que lo apartado falla como en la API. */
const ACCIONES_APORTE: AccionesPanelAporte = {
  async registrar(_id, cuerpo) {
    await esperar();
    if (cuerpo.tipo === "retiro" && BigInt(cuerpo.monto) > 1_900_000n) {
      return { ok: false, codigo: "APARTADO_INSUFICIENTE", campo: "monto", mensaje: "Lo apartado no alcanza para ese retiro." };
    }
    return { ok: true };
  },
  async editar() {
    await esperar();
    return { ok: true };
  },
  async eliminar() {
    await esperar();
    return { ok: true };
  },
};

const ACCIONES_DETALLE: AccionesDetalleMeta = {
  async archivar() {
    await esperar();
    return { ok: true };
  },
  async restaurar() {
    await esperar();
    return { ok: true };
  },
  async eliminar() {
    await esperar();
    return { ok: true };
  },
};

function Etiqueta({ children }: { children: ReactNode }) {
  return <div className="mb-3 font-mono text-cifra-xs text-secundario">{children}</div>;
}

const NADA = () => {};

function Detalle({ d, archivada = false }: { d: MetaDetalle; archivada?: boolean }) {
  return (
    <DetalleMeta
      detalle={d}
      fechaHoy={archivada ? null : HOY}
      volver={{ href: "/estilos", rotulo: archivada ? "Archivadas" : "Metas" }}
      acciones={<AccionesMeta meta={d} acciones={ACCIONES_DETALLE} alNavegar={NADA} />}
    />
  );
}

function FechaMeta({ sufijo, inicial }: { sufijo: string; inicial: { precision: Precision; valor: string } }) {
  const [v, setV] = useState(inicial);
  return (
    <div key={sufijo}>
      <CampoFechaMeta precision={v.precision} valor={v.valor} alCambiar={(precision, valor) => setV({ precision, valor })} fechaHoy={HOY} />
    </div>
  );
}

type PanelAbierto = "alta" | "edicion" | "aporte" | "retiro" | "aporte-cuenta" | "editar-aporte" | null;

/**
 * Metas de ahorro: cabecera, lista (activa, cumplida y elegida), barras de 4 y
 * 8 px, detalle por estado (apartado con nota y excedido, inversión USD con y
 * sin TRM, cumplida con uso y con lo apartado, archivada), campo de fecha
 * meta, vacío y los paneles.
 */
export function MuestraMetas({ sufijo }: { sufijo: string }) {
  const [d] = useState(() => datosMetas(sufijo));
  const [panel, setPanel] = useState<PanelAbierto>(null);
  const cerrar = () => setPanel(null);
  const activas = [d.viaje, d.cuota, d.fondo];
  const todas = [...activas, d.moto];

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-1">
        <Etiqueta>Cabecera · completa y sin TRM</Etiqueta>
        <TotalesCabecera totales={{ avance: 34_430_000n, objetivo: 54_300_000n, incompleto: false }} activas={activas} />
        <TotalesCabecera totales={{ avance: 2_500_000n, objetivo: 54_300_000n, incompleto: true }} activas={[d.viaje, { ...d.cuota, avance: null }, d.fondo]} />
      </div>

      <div className="grid grid-cols-1 gap-12 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="flex flex-col gap-2">
          <Etiqueta>Lista · activas y cumplida (Fondo elegido)</Etiqueta>
          <ListaMetas activas={activas} cumplidas={[d.moto]} fechaHoy={HOY} elegida={d.fondo.id} />
          <EnlaceTexto href="/estilos" className="self-start">
            Ver archivadas
          </EnlaceTexto>
        </div>
        <div className="min-w-0">
          <Etiqueta>Detalle · Fondo, por apartado con nota compartida</Etiqueta>
          <Detalle d={d.detalleFondo} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Etiqueta>Barra · 4 px (lista), activa y cumplida</Etiqueta>
          <div className="flex flex-col gap-3">
            <BarraAvance porcentaje={3333} alto="lista" />
            <BarraAvance porcentaje={10_000} alto="lista" cumplida />
          </div>
        </div>
        <div>
          <Etiqueta>Barra · 8 px (detalle), 25,3 % y pasada del objetivo</Etiqueta>
          <div className="flex flex-col gap-3">
            <BarraAvance porcentaje={2533} alto="detalle" />
            <BarraAvance porcentaje={12_000} alto="detalle" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 xl:grid-cols-2">
        <div className="min-w-0">
          <Etiqueta>Detalle · lo apartado supera el saldo</Etiqueta>
          <Detalle d={d.fondoExcedido} />
        </div>
        <div className="min-w-0">
          <Etiqueta>Detalle · toda la cuenta sobre inversión USD</Etiqueta>
          <Detalle d={d.detalleCuota} />
        </div>
        <div className="min-w-0">
          <Etiqueta>Detalle · inversión USD sin TRM</Etiqueta>
          <Detalle d={d.cuotaSinTrm} />
        </div>
        <div className="min-w-0">
          <Etiqueta>Detalle · cumplida con uso (archivable)</Etiqueta>
          <Detalle d={d.detalleMoto} />
        </div>
        <div className="min-w-0">
          <Etiqueta>Detalle · cumplida con lo apartado (retiro antes de archivar)</Etiqueta>
          <Detalle d={d.motoConApartado} />
        </div>
        <div className="min-w-0">
          <Etiqueta>Detalle · archivada (solo lectura)</Etiqueta>
          <Detalle d={d.motoArchivada} archivada />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div>
          <Etiqueta>Archivadas · lista sin grupos, fechas con año</Etiqueta>
          <ListaMetasArchivadas metas={[d.motoArchivada]} elegida={d.motoArchivada.id} />
        </div>
        <div>
          <Etiqueta>Vacío · sin metas</Etiqueta>
          <EstadoVacio
            rotulo="Metas"
            titulo="Sin metas todavía."
            detalle="Aparta parte de una cuenta, o toma una cuenta entera, para llegar a un objetivo."
            accion={{ etiqueta: "Nueva meta", href: "/estilos", scroll: false }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div>
          <Etiqueta>Fecha meta · sin fecha</Etiqueta>
          <FechaMeta sufijo={`${sufijo}-ninguna`} inicial={{ precision: "ninguna", valor: "" }} />
        </div>
        <div>
          <Etiqueta>Fecha meta · un día</Etiqueta>
          <FechaMeta sufijo={`${sufijo}-dia`} inicial={{ precision: "dia", valor: "2026-12-15" }} />
        </div>
        <div>
          <Etiqueta>Fecha meta · un mes</Etiqueta>
          <FechaMeta sufijo={`${sufijo}-mes`} inicial={{ precision: "mes", valor: "2027-12" }} />
        </div>
      </div>

      <div>
        <Etiqueta>Paneles · meta (alta: «Ya está» falla por saldo libre) y aporte (retiro de más de 1.900.000 falla)</Etiqueta>
        <div className="flex flex-wrap gap-3">
          <Boton variante="secundario" onClick={() => setPanel("alta")}>
            Nueva meta
          </Boton>
          <Boton variante="secundario" onClick={() => setPanel("edicion")}>
            Editar meta
          </Boton>
          <Boton variante="secundario" onClick={() => setPanel("aporte")}>
            Registrar aporte
          </Boton>
          <Boton variante="secundario" onClick={() => setPanel("retiro")}>
            Registrar retiro
          </Boton>
          <Boton variante="secundario" onClick={() => setPanel("aporte-cuenta")}>
            Aporte · toda la cuenta
          </Boton>
          <Boton variante="secundario" onClick={() => setPanel("editar-aporte")}>
            Editar aporte
          </Boton>
        </div>
        {panel === "alta" && (
          <PanelMeta fechaHoy={HOY} metas={todas} cuentas={CUENTAS} acciones={ACCIONES_META} rutaCierre="/estilos" alCerrar={cerrar} />
        )}
        {panel === "edicion" && (
          <PanelMeta meta={d.detalleFondo} fechaHoy={HOY} metas={todas} cuentas={CUENTAS} acciones={ACCIONES_META} rutaCierre="/estilos" alCerrar={cerrar} />
        )}
        {panel === "aporte" && <PanelAporte meta={d.detalleViaje} fechaHoy={HOY} cuentas={CUENTAS} acciones={ACCIONES_APORTE} alCerrar={cerrar} />}
        {panel === "retiro" && (
          <PanelAporte meta={d.detalleFondo} fechaHoy={HOY} tipoInicial="retiro" cuentas={CUENTAS} acciones={ACCIONES_APORTE} alCerrar={cerrar} />
        )}
        {panel === "aporte-cuenta" && (
          <PanelAporte
            meta={{ ...d.detalleCuota, cuenta: { ...NUBANK, nombre: "Nequi", id: "nequi", tipo: "efectivo" }, inversion: null }}
            fechaHoy={HOY}
            cuentas={CUENTAS}
            acciones={ACCIONES_APORTE}
            alCerrar={cerrar}
          />
        )}
        {panel === "editar-aporte" && (
          <PanelAporte
            meta={d.detalleFondo}
            fechaHoy={HOY}
            aporte={d.detalleFondo.modo === "apartado" ? d.detalleFondo.historial[0] : undefined}
            cuentas={null}
            acciones={ACCIONES_APORTE}
            alCerrar={cerrar}
          />
        )}
      </div>
    </div>
  );
}
