"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Boton, BOTON_ENLACE } from "@/components/boton";
import { BarraSeleccion } from "@/components/cuentas/barra-seleccion";
import { CabeceraCuenta } from "@/components/cuentas/cabecera-cuenta";
import { CamposTarjeta } from "@/components/cuentas/campos-tarjeta";
import { CicloTarjeta } from "@/components/cuentas/ciclo-tarjeta";
import { CifrasCuenta } from "@/components/cuentas/cifras-cuenta";
import { CondicionesTarjeta } from "@/components/cuentas/condiciones-tarjeta";
import { EsqueletoArchivadas, EsqueletoCuentas, EsqueletoDetalleCuenta } from "@/components/cuentas/esqueleto-cuentas";
import { ConsultaCompra, type ResultadoCompra } from "@/components/cuentas/consulta-compra";
import { LineaCiclo } from "@/components/cuentas/linea-ciclo";
import { PanelAjuste } from "@/components/cuentas/panel-ajuste";
import { RangoHistorial } from "@/components/cuentas/rango-historial";
import { ResumenTarjeta } from "@/components/cuentas/resumen-tarjeta";
import { TablaHistorial } from "@/components/cuentas/tabla-historial";
import { EstadoVacio } from "@/components/estado-vacio";
import { sumaSeleccion, type FilaHistorial } from "@/domain/cuenta/detalle";
import { valoresTarjetaDesde, type ValoresTarjeta } from "@/domain/cuenta/edicion";
import type { Compra } from "@/domain/cuenta/tarjeta";

const HOY = "2026-11-11";

/** Efectivo del diseño: saldo antes del rango 122.200, octubre conciliado. */
const BASE: [string, string, string, number][] = [
  ["2026-10-22", "Almuerzo", "Comida", -15000],
  ["2026-10-24", "Pago taxi", "Transporte", -30000],
  ["2026-10-27", "Desayuno", "Comida", -8000],
  ["2026-10-28", "Retiro cajero", "Bancolombia", 100000],
  ["2026-10-29", "Agua", "Comida", -1100],
  ["2026-10-30", "Almuerzo", "Comida", -15000],
  ["2026-10-31", "Pan", "Comida", -5000],
  ["2026-11-03", "Recarga datos", "Servicios", -4000],
  ["2026-11-04", "Almuerzo", "Comida", -15000],
  ["2026-11-05", "Recarga tarjeta SITP", "Transporte", -10000],
  ["2026-11-06", "Almuerzo", "Comida", -15000],
  ["2026-11-07", "Pago taxi", "Transporte", -30000],
  ["2026-11-10", "Desayuno", "Comida", -8000],
  ["2026-11-10", "Pan", "Comida", -5000],
  ["2026-11-11", "Agua", "Comida", -1100],
  ["2026-11-11", "Almuerzo", "Comida", -15000],
];

function filasEfectivo(sufijo: string): FilaHistorial[] {
  let saldo = 122_200n;
  const filas = BASE.map(([fecha, descripcion, cat, monto], i): FilaHistorial => {
    saldo += BigInt(monto);
    const transferencia = cat === "Bancolombia";
    return {
      movimientoId: `${sufijo}-m${i}`,
      tipo: transferencia ? "transferencia" : "gasto",
      fecha,
      descripcion,
      efecto: BigInt(monto),
      saldo,
      conciliado: fecha < "2026-11-01",
      categoria: transferencia ? null : { id: cat, nombre: cat },
      partes: [],
      contraparte: transferencia ? { id: "b1", nombre: "Bancolombia", sentido: "desde" } : null,
    };
  });
  return filas.reverse();
}

/** Extras de la muestra: un ajuste, un gasto dividido y uno programado para mañana. */
function filasExtra(sufijo: string): FilaHistorial[] {
  return [
    {
      movimientoId: `${sufijo}-prog`,
      tipo: "gasto",
      fecha: "2026-11-12",
      descripcion: "Mercado D1",
      efecto: -20_000n,
      saldo: 21_500n,
      conciliado: false,
      categoria: { id: "Comida", nombre: "Comida" },
      partes: [],
      contraparte: null,
    },
    {
      movimientoId: `${sufijo}-aj`,
      tipo: "ajuste",
      fecha: HOY,
      descripcion: "Ajuste de saldo",
      efecto: -3_500n,
      saldo: 41_500n,
      conciliado: true,
      categoria: { id: "aj", nombre: "Ajuste" },
      partes: [],
      contraparte: null,
    },
    {
      movimientoId: `${sufijo}-div`,
      tipo: "gasto",
      fecha: "2026-11-09",
      descripcion: "Éxito",
      efecto: -60_000n,
      saldo: 45_000n,
      conciliado: false,
      categoria: null,
      partes: [
        { categoria: { id: "Comida", nombre: "Comida" }, monto: 45_000n },
        { categoria: { id: "Hogar", nombre: "Hogar" }, monto: 15_000n },
      ],
      contraparte: null,
    },
  ];
}

const EFECTIVO = { id: "efectivo", nombre: "Efectivo", tipo: "efectivo", naturaleza: "activo", detalle: "billetera", archivadaEn: null } as const;
const VISA = { id: "visa", nombre: "Tarjeta de crédito", tipo: "tarjeta_credito", naturaleza: "pasivo", detalle: "Visa ·· 7731", archivadaEn: null } as const;

const TARJETA = {
  cupo: 4_000_000n,
  disponible: 2_715_700n,
  porcentajeUsado: 32,
  diaCorte: 15,
  diaPago: 30,
  tasaMensual: 198,
  tasaEfectivaAnual: 2652,
  cuotaManejo: 26_990n,
  cuentaPago: { id: "b1", nombre: "Bancolombia" },
};
const SIN_CONDICIONES = { ...TARJETA, diaCorte: null, diaPago: null, tasaMensual: null, tasaEfectivaAnual: null, cuotaManejo: null, cuentaPago: null };

const CONSUMOS: [string, string, string, number][] = [
  ["2026-10-17", "Rappi · restaurante", "Salidas", 46900],
  ["2026-10-19", "Mercado D1", "Comida", 87400],
  ["2026-10-23", "Cine Procinal", "Salidas", 38000],
  ["2026-10-25", "Mensualidad Apple", "Suscripciones", 3900],
  ["2026-10-26", "Falabella", "Otros", 189900],
  ["2026-10-30", "Netflix", "Suscripciones", 26900],
  ["2026-11-01", "Spotify", "Suscripciones", 16900],
  ["2026-11-02", "Droguería Cruz Verde", "Salud", 23450],
  ["2026-11-04", "Mercado D1", "Comida", 87400],
  ["2026-11-07", "Uber", "Transporte", 18700],
  ["2026-11-09", "Restaurante Wok", "Salidas", 112000],
];

const CICLO = {
  inicio: "2026-10-16",
  corte: "2026-11-15",
  pagoLimite: "2026-11-30",
  diasHastaCorte: 4,
  diasHastaPago: 19,
  corteAnterior: { fecha: "2026-10-15", saldo: 1_217_980n },
  abonos: [
    {
      movimientoId: "pago",
      tipo: "transferencia" as const,
      fecha: "2026-10-28",
      descripcion: null,
      monto: 620_000n,
      categoria: null,
      partes: [],
      contraparte: { id: "b1", nombre: "Bancolombia" },
    },
  ],
  saldoAnteriorPendiente: 597_980n,
  pagoSugerido: 597_980n,
  consumos: CONSUMOS.map(([fecha, descripcion, cat, monto], i) => ({
    movimientoId: `c${i}`,
    tipo: "gasto" as const,
    fecha,
    descripcion,
    monto: BigInt(monto),
    categoria: { id: cat, nombre: cat },
    partes: [],
    contraparte: null,
  })),
  totalConsumos: 651_450n,
  cargos: [
    {
      movimientoId: "cuota",
      tipo: "gasto" as const,
      fecha: "2026-10-16",
      descripcion: "Cuota de manejo",
      monto: 26_990n,
      categoria: { id: "cm", nombre: "Cuota de manejo" },
      partes: [],
      contraparte: null,
      clase: "cuota_manejo" as const,
    },
    {
      movimientoId: "intereses",
      tipo: "gasto" as const,
      fecha: "2026-10-16",
      descripcion: "Intereses corrientes · 1,98 % M.V.",
      monto: 7_880n,
      categoria: { id: "in", nombre: "Intereses" },
      partes: [],
      contraparte: null,
      clase: "intereses" as const,
    },
  ],
  totalCargos: 34_870n,
  deudaAlCorte: 1_284_300n,
};

const CUENTAS_PAGO = [
  { id: "b1", nombre: "Bancolombia", tipo: "banco", naturaleza: "activo", saldo: 3_254_800n },
  { id: "efectivo", nombre: "Efectivo", tipo: "efectivo", naturaleza: "activo", saldo: 45_000n },
] as const;

/** «¿Puedo comprar esto?» sin API: el cálculo de la muestra imita la respuesta del diseño. */
async function consultarMuestra(_id: string, monto: string): Promise<ResultadoCompra> {
  const n = BigInt(monto);
  if (n <= TARJETA.disponible) {
    const tras = Number(((1_284_300n + n) * 100n) / TARJETA.cupo);
    return { ok: true, compra: { monto: n, cabe: true, disponibleTras: TARJETA.disponible - n, porcentajeTras: Math.min(100, tras), falta: null } };
  }
  return { ok: true, compra: { monto: n, cabe: false, disponibleTras: null, porcentajeTras: null, falta: n - TARJETA.disponible } };
}

async function registrarMuestra(): Promise<{ ok: false; codigo: string; mensaje: string }> {
  return { ok: false, codigo: "MUESTRA", mensaje: "Es una muestra: no se registra nada." };
}

function Etiqueta({ children }: { children: ReactNode }) {
  return <div className="mb-3 font-mono text-cifra-xs text-secundario">{children}</div>;
}

function Historial({ sufijo, archivada = false, vacio = false }: { sufijo: string; archivada?: boolean; vacio?: boolean }) {
  const [filas, setFilas] = useState(() => (vacio ? [] : [...filasExtra(sufijo), ...filasEfectivo(sufijo)]));
  const [seleccion, setSeleccion] = useState<ReadonlySet<string>>(new Set());
  const elegir = (id: string, elegida: boolean) =>
    setSeleccion((s) => {
      const n = new Set(s);
      if (elegida) n.add(id);
      else n.delete(id);
      return n;
    });
  const conciliar = (ids: readonly string[], valor: boolean) =>
    setFilas((fs) => fs.map((f) => (ids.includes(f.movimientoId) ? { ...f, conciliado: valor } : f)));

  return (
    <div className="flex flex-col gap-4">
      {seleccion.size > 0 && (
        <BarraSeleccion
          cantidad={seleccion.size}
          suma={sumaSeleccion(filas, seleccion)}
          alMarcar={() => {
            conciliar([...seleccion], true);
            setSeleccion(new Set());
          }}
          alCancelar={() => setSeleccion(new Set())}
        />
      )}
      <TablaHistorial
        filas={filas}
        fechaHoy={HOY}
        desde="2026-10-12"
        saldoInicioRango={122_200n}
        seleccion={seleccion}
        modoSeleccion={false}
        alElegir={archivada ? undefined : elegir}
        alConciliar={archivada ? undefined : (f) => conciliar([f.movimientoId], !f.conciliado)}
      />
    </div>
  );
}

function Tarjeta({ sufijo }: { sufijo: string }) {
  const [compra, setCompra] = useState<Compra | null>(null);
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <div className="flex flex-col gap-8">
        <ResumenTarjeta tarjeta={TARJETA} saldo={1_284_300n} porcentajeTras={compra?.cabe ? compra.porcentajeTras : null} />
        <ResumenTarjeta formato="movil" tarjeta={TARJETA} saldo={1_284_300n} porcentajeTras={compra?.cabe ? compra.porcentajeTras : null} />
      </div>
      <ConsultaCompra
        nombre={`compra-${sufijo}`}
        cuentaId="visa"
        fechaHoy={HOY}
        ciclo={CICLO}
        disponible={TARJETA.disponible}
        compra={compra}
        alCambiarCompra={setCompra}
        consultar={consultarMuestra}
      />
    </div>
  );
}

function Campos({ sufijo, sinCuentas = false }: { sufijo: string; sinCuentas?: boolean }) {
  const [valores, setValores] = useState<ValoresTarjeta>(() => valoresTarjetaDesde(sinCuentas ? null : TARJETA));
  return (
    <CamposTarjeta
      prefijo={`tarjeta-${sufijo}`}
      valores={valores}
      alCambiar={(campo, valor) => setValores((v) => ({ ...v, [campo]: valor }))}
      cuentasPago={sinCuentas ? [] : CUENTAS_PAGO}
      errores={sinCuentas ? { diaPago: "Elige un día entre 1 y 31.", tarjeta: "La tarjeta necesita día de corte y día de pago." } : {}}
    />
  );
}

/**
 * Detalle de cuenta y tarjeta con ciclo (SPEC 13): cada pieza con los datos
 * del diseño (Efectivo y la tarjeta Visa, hoy 11 nov 2026) y sus variantes.
 */
export function MuestraCuentas({ sufijo }: { sufijo: string }) {
  const [ajuste, setAjuste] = useState(false);

  return (
    <div className="flex flex-col gap-12">
      <div>
        <Etiqueta>Esqueletos · lista, detalle y archivadas (forma real, bloques `linea`, sin cifras)</Etiqueta>
        <div className="flex flex-col gap-12" data-muestra="esqueletos-cuentas">
          <EsqueletoCuentas />
          <EsqueletoDetalleCuenta />
          <EsqueletoArchivadas />
        </div>
      </div>

      <div>
        <Etiqueta>Cabecera · efectivo, tarjeta y archivada</Etiqueta>
        <div className="flex flex-col gap-8">
          <CabeceraCuenta
            cuenta={EFECTIVO}
            accion={
              <Link href="/estilos" scroll={false} className={BOTON_ENLACE.secundario}>
                Ajustar saldo
              </Link>
            }
            hrefEditar="/estilos"
            extraMovil={<Boton variante="texto">Seleccionar</Boton>}
          />
          <CabeceraCuenta cuenta={VISA} accion={<Boton>Registrar pago</Boton>} hrefEditar="/estilos" />
          <CabeceraCuenta cuenta={{ ...EFECTIVO, nombre: "Daviplata", tipo: "banco", detalle: null, archivadaEn: "2026-10-01T00:00:00Z" }} />
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div>
          <Etiqueta>Cifras · con pendientes</Etiqueta>
          <CifrasCuenta
            historial={{ fechaHoy: HOY, saldo: 45_000n, conciliacion: { saldo: 148_100n, al: "2026-10-31", pendientes: 9 }, entradas: 100_000n, salidas: 177_200n }}
            ajustarMovil={<Boton variante="secundario">Ajustar</Boton>}
          />
        </div>
        <div>
          <Etiqueta>Cifras · nunca conciliada</Etiqueta>
          <CifrasCuenta historial={{ fechaHoy: HOY, saldo: 45_000n, conciliacion: { saldo: null, al: null, pendientes: 16 }, entradas: 100_000n, salidas: 177_200n }} />
        </div>
      </div>

      <div>
        <Etiqueta>Rango · «Últimos 30 días» activo; el botón despliega el rango libre (escritorio)</Etiqueta>
        <RangoHistorial
          cuentaId="efectivo"
          pedido={{}}
          historial={{ fechaHoy: HOY, desde: "2026-10-12", hasta: null }}
          extra={<Boton variante="texto">Seleccionar pendientes</Boton>}
        />
      </div>

      <div>
        <Etiqueta>Barra de selección · escritorio</Etiqueta>
        <BarraSeleccion cantidad={3} suma={-29_000n} alMarcar={() => {}} alCancelar={() => {}} />
      </div>

      <div>
        <Etiqueta>Historial · programado, ajuste, dividido y transferencia; elegir filas muestra la barra</Etiqueta>
        <Historial sufijo={sufijo} />
      </div>

      <div className="grid grid-cols-1 gap-12 xl:grid-cols-2">
        <div>
          <Etiqueta>Historial · archivada (solo lectura)</Etiqueta>
          <Historial sufijo={`${sufijo}-arch`} archivada />
        </div>
        <div>
          <Etiqueta>Historial · rango vacío</Etiqueta>
          <Historial sufijo={`${sufijo}-vacio`} vacio />
        </div>
      </div>

      <div>
        <Etiqueta>Panel · ajustar saldo (saldo a hoy 45.000, con programados)</Etiqueta>
        <Boton variante="secundario" onClick={() => setAjuste(true)}>
          Ajustar saldo
        </Boton>
        {ajuste && (
          <PanelAjuste
            cuenta={{ id: "efectivo", tipo: "efectivo" }}
            historial={{ fechaHoy: HOY, saldo: 25_000n, saldoHoy: 45_000n }}
            rutaCierre="/estilos"
            registrar={registrarMuestra}
            alCerrar={() => setAjuste(false)}
          />
        )}
      </div>

      <div>
        <Etiqueta>Tarjeta · cupo (escritorio y móvil) y «¿Puedo comprar esto?» (prueba 450.000 y 3.000.000)</Etiqueta>
        <Tarjeta sufijo={sufijo} />
      </div>

      <div>
        <Etiqueta>Línea del ciclo</Etiqueta>
        <LineaCiclo ciclo={CICLO} fechaHoy={HOY} />
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <Etiqueta>Ciclo en curso</Etiqueta>
          <CicloTarjeta ciclo={CICLO} fechaHoy={HOY} />
        </div>
        <div className="flex flex-col gap-8">
          <div>
            <Etiqueta>Condiciones</Etiqueta>
            <CondicionesTarjeta tarjeta={TARJETA} />
          </div>
          <div>
            <Etiqueta>Condiciones · sin definir</Etiqueta>
            <CondicionesTarjeta tarjeta={SIN_CONDICIONES} />
          </div>
        </div>
      </div>

      <div>
        <Etiqueta>Ciclo · sin consumos ni cargos</Etiqueta>
        <CicloTarjeta ciclo={{ ...CICLO, abonos: [], consumos: [], totalConsumos: 0n, cargos: [], totalCargos: 0n, deudaAlCorte: 597_980n }} fechaHoy={HOY} />
      </div>

      <div>
        <Etiqueta>Tarjeta sin condiciones</Etiqueta>
        <EstadoVacio
          rotulo="Ciclo"
          titulo="Falta el día de corte y el de pago."
          detalle="Con ellos TINO arma el ciclo, el pago límite y lo que va en cada corte."
          accion={{ etiqueta: "Completar condiciones", href: "/estilos", scroll: false, sinMas: true }}
        />
      </div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <div>
          <Etiqueta>Condiciones en el panel de cuenta · edición</Etiqueta>
          <Campos sufijo={sufijo} />
        </div>
        <div>
          <Etiqueta>Condiciones en el panel · alta sin cuentas de pago, con errores</Etiqueta>
          <Campos sufijo={`${sufijo}-alta`} sinCuentas />
        </div>
      </div>
    </div>
  );
}
