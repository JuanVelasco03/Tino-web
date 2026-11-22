"use client";

import { useState, type ReactNode } from "react";
import { Boton } from "@/components/boton";
import { CondonarPrestamo, ProveedorAvisoDeudas, type AccionCondonar } from "@/components/deudas/condonar-prestamo";
import { ConsolidadoDeudas } from "@/components/deudas/consolidado-deudas";
import { DetallePrestamo } from "@/components/deudas/detalle-prestamo";
import { DiaUnoDeudas } from "@/components/deudas/dia-uno-deudas";
import { ListaPrestamos } from "@/components/deudas/lista-prestamos";
import { PanelAbono, type AccionesPanelAbono } from "@/components/deudas/panel-abono";
import { PanelEdicionPrestamo } from "@/components/deudas/panel-edicion-prestamo";
import { PanelPrestamo, type AccionesPanelPrestamo } from "@/components/deudas/panel-prestamo";
import { AvisoBandeja, CifraAviso } from "@/components/recurrentes/bandeja-recurrentes";
import type { Prestamo, PrestamoDetalle, Prestamos } from "@/domain/prestamo/tipos";
import type { DatosCaptura } from "@/services/captura";
import type { Cuenta } from "@/services/cuentas";

const HOY = "2026-11-11";
const NEQUI = { id: "nequi", nombre: "Nequi" };
const BANCOLOMBIA = { id: "banco", nombre: "Bancolombia" };

function resumenDe(d: PrestamoDetalle): Prestamo {
  return {
    id: d.id,
    nombre: d.nombre,
    tipo: d.tipo,
    estado: d.estado,
    capitalPendiente: d.capitalPendiente,
    desde: d.desde,
    fechaAcordada: d.fechaAcordada,
    vencido: d.vencido,
    cierre: d.cierre,
    interesesCausados: d.interesesCausados,
  };
}

/** Los tres del diseño (`Deudas.dc.html`): Camila con fecha vencida, Mamá sin intereses y Andrés saldado. */
function datosDeudas(sufijo: string): { lista: Prestamos; camila: PrestamoDetalle; mama: PrestamoDetalle; andres: PrestamoDetalle } {
  const camila: PrestamoDetalle = {
    id: `camila-${sufijo}`,
    nombre: "Camila Ortiz",
    tipo: "prestamo_otorgado",
    estado: "te_debe",
    capitalPendiente: 500_000n,
    desde: "2026-08-14",
    fechaAcordada: "2026-10-15",
    vencido: true,
    cierre: null,
    interesesCausados: 6_667n,
    fechaHoy: HOY,
    tasaMensual: "1",
    totalPrestado: 600_000n,
    totalAbonado: 100_000n,
    totalCondonado: 0n,
    interesesCobrados: 12_000n,
    ultimoAbono: "2026-10-02",
    creadoEn: "2026-08-14T17:03:11.402Z",
    historial: [
      {
        fecha: "2026-08-14",
        clase: "desembolso",
        cuenta: NEQUI,
        categoria: null,
        capital: 600_000n,
        interes: 0n,
        saldoCapital: 600_000n,
        movimientoId: "m1",
        movimientoInteresId: null,
      },
      {
        fecha: "2026-10-02",
        clase: "abono",
        cuenta: NEQUI,
        categoria: null,
        capital: -100_000n,
        interes: 12_000n,
        saldoCapital: 500_000n,
        movimientoId: "m2",
        movimientoInteresId: "m3",
      },
    ],
  };
  const mama: PrestamoDetalle = {
    id: `mama-${sufijo}`,
    nombre: "Mamá",
    tipo: "deuda_contraida",
    estado: "le_debes",
    capitalPendiente: 500_000n,
    desde: "2026-03-01",
    fechaAcordada: "2026-06-30",
    vencido: true,
    cierre: null,
    interesesCausados: 0n,
    fechaHoy: HOY,
    tasaMensual: "0",
    totalPrestado: 800_000n,
    totalAbonado: 300_000n,
    totalCondonado: 0n,
    interesesCobrados: 0n,
    ultimoAbono: "2026-11-06",
    creadoEn: "2026-03-01T12:00:00.000Z",
    historial: [
      {
        fecha: "2026-03-01",
        clase: "desembolso",
        cuenta: BANCOLOMBIA,
        categoria: null,
        capital: 800_000n,
        interes: 0n,
        saldoCapital: 800_000n,
        movimientoId: "m4",
        movimientoInteresId: null,
      },
      {
        fecha: "2026-08-05",
        clase: "abono",
        cuenta: BANCOLOMBIA,
        categoria: null,
        capital: -150_000n,
        interes: 0n,
        saldoCapital: 650_000n,
        movimientoId: "m5",
        movimientoInteresId: null,
      },
      {
        fecha: "2026-11-06",
        clase: "abono",
        cuenta: BANCOLOMBIA,
        categoria: null,
        capital: -150_000n,
        interes: 0n,
        saldoCapital: 500_000n,
        movimientoId: "m6",
        movimientoInteresId: null,
      },
    ],
  };
  const andres: PrestamoDetalle = {
    id: `andres-${sufijo}`,
    nombre: "Andrés Gil",
    tipo: "prestamo_otorgado",
    estado: "saldado",
    capitalPendiente: 0n,
    desde: null,
    fechaAcordada: null,
    vencido: false,
    cierre: { fecha: "2026-09-20", forma: "pago" },
    interesesCausados: 0n,
    fechaHoy: HOY,
    tasaMensual: "0",
    totalPrestado: 200_000n,
    totalAbonado: 200_000n,
    totalCondonado: 0n,
    interesesCobrados: 0n,
    ultimoAbono: "2026-09-20",
    creadoEn: "2026-07-10T12:00:00.000Z",
    historial: [
      {
        fecha: "2026-07-10",
        clase: "desembolso",
        cuenta: NEQUI,
        categoria: null,
        capital: 200_000n,
        interes: 0n,
        saldoCapital: 200_000n,
        movimientoId: "m7",
        movimientoInteresId: null,
      },
      {
        fecha: "2026-09-20",
        clase: "abono",
        cuenta: NEQUI,
        categoria: null,
        capital: -200_000n,
        interes: 0n,
        saldoCapital: 0n,
        movimientoId: "m8",
        movimientoInteresId: null,
      },
    ],
  };
  return {
    lista: {
      fechaHoy: HOY,
      teDeben: { total: 500_000n, personas: 1, interesesCausados: 6_667n },
      debes: { total: 500_000n, personas: 1, interesesCausados: 0n, conIntereses: false },
      posicionNeta: 0n,
      prestamos: [camila, mama, andres].map(resumenDe),
    },
    camila,
    mama,
    andres,
  };
}

function cuenta(id: string, nombre: string, tipo: "banco" | "efectivo", saldo: bigint): Cuenta {
  return { id, nombre, tipo, moneda: "COP", naturaleza: "activo", detalle: null, saldo, saldoInicial: 0n, tarjeta: null, inversion: null, archivadaEn: null };
}

const CATEGORIAS_GASTO = ["Comida", "Casa", "Transporte", "Salud", "Otros"].map((nombre) => ({
  id: nombre.toLowerCase(),
  nombre,
  tipo: "gasto" as const,
}));

const FORMULARIO: Pick<DatosCaptura, "captura" | "cuentas"> = {
  captura: {
    fechaHoy: HOY,
    cuentaPredeterminadaId: "nequi",
    categorias: { gasto: CATEGORIAS_GASTO, ingreso: [] },
    gastosHoy: 0n,
    conceptosFrecuentes: { gasto: [], ingreso: [], transferencia: [] },
  },
  cuentas: [cuenta("nequi", "Nequi", "efectivo", 412_000n), cuenta("banco", "Bancolombia", "banco", 3_284_300n)],
};

const FORMULARIO_CONDONAR = { categorias: CATEGORIAS_GASTO, patrimonioNeto: 12_480_000n };

async function esperar(): Promise<void> {
  await new Promise((resolver) => setTimeout(resolver, 400));
}

const ACCIONES_ALTA: AccionesPanelPrestamo = {
  async crear() {
    await esperar();
    return { ok: true, id: "muestra" };
  },
  async desembolsar(id) {
    await esperar();
    return { ok: true, id };
  },
};

/** Propuesta fija, la del diseño: en la muestra no hay API que reparta. Registrar muestra el error de capital. */
const ACCIONES_ABONO: AccionesPanelAbono = {
  async proponer(_id, fecha, monto) {
    await esperar();
    return {
      ok: true,
      propuesta: { fecha, monto: BigInt(monto), capital: 105_333n, interes: 6_667n, interesesCausados: 6_667n, capitalPendiente: 500_000n },
    };
  },
  async abonar() {
    await esperar();
    return { ok: false, codigo: "ABONO_EXCEDE_CAPITAL", campo: "capital", mensaje: "El abono a capital supera lo pendiente." };
  },
};

const CONDONAR: AccionCondonar = async (_id, cuerpo) => {
  await esperar();
  const categoria = CATEGORIAS_GASTO.find((c) => c.id === cuerpo.categoriaId) ?? null;
  return { ok: true, movimiento: { id: "muestra", monto: BigInt(cuerpo.monto), categoria } };
};

async function deshacer(): Promise<{ ok: true }> {
  await esperar();
  return { ok: true };
}

async function editar(): Promise<{ ok: true }> {
  await esperar();
  return { ok: true };
}

function Etiqueta({ children }: { children: ReactNode }) {
  return <div className="mb-3 font-mono text-cifra-xs text-secundario">{children}</div>;
}

const NADA = () => {};

/**
 * Deudas y préstamos: consolidado (con saldos y en cero), lista con los tres
 * grupos, detalle (Camila, Mamá vencida, Andrés saldado), condonar (todo y
 * una parte con error), aviso, día uno y los tres paneles.
 */
export function MuestraDeudas({ sufijo }: { sufijo: string }) {
  const [{ lista, camila, mama, andres }] = useState(() => datosDeudas(sufijo));
  const [panel, setPanel] = useState<"otorgado" | "contraida" | "abono" | "editar" | null>(null);
  const cerrar = () => setPanel(null);

  return (
    <ProveedorAvisoDeudas deshacer={deshacer}>
      <div className="flex flex-col gap-12">
        <div>
          <Etiqueta>Consolidado · con saldos (posición neta en cero)</Etiqueta>
          <ConsolidadoDeudas teDeben={lista.teDeben} debes={lista.debes} posicionNeta={lista.posicionNeta} />
        </div>
        <div>
          <Etiqueta>Consolidado · día uno, en cero y sin leyenda</Etiqueta>
          <ConsolidadoDeudas
            teDeben={{ total: 0n, personas: 0, interesesCausados: 0n }}
            debes={{ total: 0n, personas: 0, interesesCausados: 0n, conIntereses: false }}
            posicionNeta={0n}
            diaUno
          />
        </div>
        <div>
          <Etiqueta>Aviso de condonación · 5 s con «Deshacer»</Etiqueta>
          <AvisoBandeja
            texto={
              <>
                Condonado. Se registró un gasto de <CifraAviso>500.000</CifraAviso> en Otros.
              </>
            }
            alDeshacer={NADA}
            deshaciendo={false}
          />
        </div>

        <div className="grid grid-cols-1 gap-12 xl:grid-cols-[400px_minmax(0,1fr)]">
          <div>
            <Etiqueta>Lista · te deben, debes y saldadas (Camila elegida)</Etiqueta>
            <ListaPrestamos prestamos={lista.prestamos} fechaHoy={HOY} totales={{ teDeben: 500_000n, debes: 500_000n }} elegido={camila.id} />
          </div>
          <div className="min-w-0">
            <Etiqueta>Detalle · Camila, con condonar</Etiqueta>
            <DetallePrestamo detalle={camila} condonar={<CondonarPrestamo prestamo={camila} formulario={FORMULARIO_CONDONAR} condonar={CONDONAR} />} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 xl:grid-cols-2">
          <div className="min-w-0">
            <Etiqueta>Detalle · Mamá, sin intereses y con fecha vencida</Etiqueta>
            <DetallePrestamo detalle={mama} />
          </div>
          <div className="min-w-0">
            <Etiqueta>Detalle · Andrés, saldado (sin acciones)</Etiqueta>
            <DetallePrestamo detalle={andres} />
          </div>
        </div>

        <div className="@container min-w-0">
          <Etiqueta>Condonar · todo lo pendiente, sin categoría elegida</Etiqueta>
          <CondonarPrestamo prestamo={{ ...camila, id: `${camila.id}-todo` }} formulario={FORMULARIO_CONDONAR} condonar={CONDONAR} abiertoInicial />
        </div>
        <div className="@container min-w-0">
          <Etiqueta>Condonar · una parte mayor que lo pendiente (error, no se envía)</Etiqueta>
          <CondonarPrestamo
            prestamo={{ ...camila, id: `${camila.id}-parte` }}
            formulario={FORMULARIO_CONDONAR}
            condonar={CONDONAR}
            abiertoInicial
            inicial={{ modo: "parte", valor: "600.000", categoriaId: "otros" }}
          />
        </div>

        <div>
          <Etiqueta>Día uno · sin préstamos</Etiqueta>
          <DiaUnoDeudas />
        </div>

        <div>
          <Etiqueta>Paneles · alta (escribe «camila ortiz» para el desembolso), abono con propuesta y edición</Etiqueta>
          <div className="flex flex-wrap gap-3">
            <Boton variante="secundario" onClick={() => setPanel("otorgado")}>
              Le presté a alguien
            </Boton>
            <Boton variante="secundario" onClick={() => setPanel("contraida")}>
              Alguien me prestó
            </Boton>
            <Boton variante="secundario" onClick={() => setPanel("abono")}>
              Registrar abono
            </Boton>
            <Boton variante="secundario" onClick={() => setPanel("editar")}>
              Cambiar fecha acordada
            </Boton>
          </div>
          {(panel === "otorgado" || panel === "contraida") && (
            <PanelPrestamo
              tipoInicial={panel === "otorgado" ? "prestamo_otorgado" : "deuda_contraida"}
              fechaHoy={HOY}
              prestamos={lista.prestamos}
              formulario={FORMULARIO}
              acciones={ACCIONES_ALTA}
              rutaCierre="/estilos"
              alCerrar={cerrar}
            />
          )}
          {panel === "abono" && <PanelAbono prestamo={camila} formulario={FORMULARIO} acciones={ACCIONES_ABONO} alCerrar={cerrar} />}
          {panel === "editar" && <PanelEdicionPrestamo prestamo={camila} editar={editar} alCerrar={cerrar} />}
        </div>
      </div>
    </ProveedorAvisoDeudas>
  );
}
