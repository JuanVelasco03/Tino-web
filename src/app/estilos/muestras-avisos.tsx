"use client";

import { useState, type ReactNode } from "react";
import { AntelacionAvisos } from "@/components/avisos/antelacion-avisos";
import { FilaAviso } from "@/components/avisos/fila-aviso";
import { ListaAvisos } from "@/components/avisos/lista-avisos";
import { Casilla } from "@/components/casilla";
import { NumeroAvisos, PuntoAvisos } from "@/components/menu/contador-avisos";
import { IconoNavegacion } from "@/components/iconos";
import type { Aviso, AvisoConfig, AvisoCobro, AvisoDeuda, AvisoPrecio, AvisoRecurrente } from "@/domain/aviso/presentacion";
import { Ellipsis } from "lucide-react";

const HOY = "2026-11-11";
const ZONA = "America/Bogota";
/** Lo que `zonaLegible` da para Bogotá; fijo para que el servidor y el navegador pinten lo mismo. */
const NOMBRE_ZONA = "hora de Colombia";

/** 08:00 en Bogotá (UTC−5) del día dado. */
function ocho(dia: string): string {
  return `${dia}T13:00:00.000Z`;
}

const NEQUI = { id: "nequi", nombre: "Nequi" };
const BANCOLOMBIA = { id: "bancolombia", nombre: "Bancolombia" };

/* Los avisos del diseño (`Avisos.dc.html`) sin los de tarjeta, con hoy mié 11 nov. */
const GAS: AvisoRecurrente = {
  clave: "recurrente:gas:2026-11-14",
  tipo: "recurrente",
  instante: ocho("2026-11-11"),
  leido: false,
  resuelto: false,
  recurrente: { id: "gas", concepto: "Gas Vanti", tipo: "gasto", variable: true },
  vencimiento: "2026-11-14",
  cuenta: NEQUI,
  monto: 32_400n,
  estimado: true,
  resolucion: null,
};
const INTERNET: AvisoRecurrente = {
  ...GAS,
  clave: "recurrente:internet:2026-11-12",
  instante: ocho("2026-11-09"),
  recurrente: { id: "internet", concepto: "Internet Claro hogar", tipo: "gasto", variable: false },
  vencimiento: "2026-11-12",
  cuenta: BANCOLOMBIA,
  monto: 89_900n,
  estimado: false,
};
const GIMNASIO: AvisoRecurrente = {
  ...INTERNET,
  clave: "recurrente:gimnasio:2026-11-08",
  instante: ocho("2026-11-05"),
  leido: true,
  resuelto: true,
  recurrente: { id: "gimnasio", concepto: "Gimnasio", tipo: "gasto", variable: false },
  vencimiento: "2026-11-08",
  monto: 95_000n,
  resolucion: { forma: "confirmada", fecha: "2026-11-08" },
};
const MAMA: AvisoDeuda = {
  clave: "deuda:mama:2026-11-06",
  tipo: "deuda",
  instante: ocho("2026-11-03"),
  leido: true,
  resuelto: true,
  prestamo: { id: "mama", nombre: "Mamá" },
  fechaAcordada: "2026-11-06",
  monto: 100_000n,
  capitalPendiente: 500_000n,
  resolucion: { forma: "abono", fecha: "2026-11-06", monto: 100_000n, cuenta: NEQUI },
};
const CAMILA: AvisoCobro = {
  clave: "cobro:camila:2026-10-15",
  tipo: "cobro",
  instante: ocho("2026-10-15"),
  leido: true,
  resuelto: false,
  prestamo: { id: "camila", nombre: "Camila" },
  fechaAcordada: "2026-10-15",
  recordatorio: "2026-10-15",
  monto: 500_000n,
  capitalPendiente: 500_000n,
  proximoRecordatorio: "2026-11-14",
  resolucion: null,
};
const VOO: AvisoPrecio = {
  clave: "precio_manual:voo:2026-11-03",
  tipo: "precio_manual",
  instante: ocho("2026-11-10"),
  leido: false,
  resuelto: false,
  activo: { id: "voo", simbolo: "VOO", nombre: "Vanguard S&P 500" },
  inversion: { id: "xtb", nombre: "XTB" },
  precioFecha: "2026-11-03",
  resolucion: null,
};
const DEUDA_PENDIENTE: AvisoDeuda = {
  ...MAMA,
  clave: "deuda:mama:2026-11-15",
  instante: ocho("2026-11-08"),
  leido: false,
  resuelto: false,
  fechaAcordada: "2026-11-15",
  monto: 500_000n,
  resolucion: null,
};

const DISENO: Aviso[] = [GAS, INTERNET, GIMNASIO, MAMA, CAMILA];

/** Deuda con 3 días de antelación y precio manual inactivo, como los datos de prueba del spec. */
const CONFIG: AvisoConfig[] = [
  { tipo: "recurrente", activo: true, dias: 3, opciones: [1, 3, 5, 7] },
  { tipo: "cobro", activo: true, dias: 30, opciones: [0, 14, 30] },
  { tipo: "deuda", activo: true, dias: 3, opciones: [1, 3, 7] },
  { tipo: "precio_manual", activo: false, dias: 7, opciones: [3, 7, 14] },
];

function Etiqueta({ children }: { children: ReactNode }) {
  return <div className="mb-3 font-mono text-rotulo text-marca-texto">{children}</div>;
}

function Fila({ aviso, ajustando = false }: { aviso: Aviso; ajustando?: boolean }) {
  return (
    <ul className="border-t border-raya">
      <FilaAviso aviso={aviso} fechaHoy={HOY} zona={ZONA} ajustando={ajustando} enfocar={false} valorAjuste={ajustando ? "35.000" : undefined} alAlternar={() => {}} alConfirmar={() => {}} alCerrarAjuste={() => {}} />
    </ul>
  );
}

/** Lista, filas, ajuste, antelación, casilla, vacío y contador del menú (SPEC 11). */
export function MuestraAvisos({ sufijo }: { sufijo: string }) {
  const [casilla, setCasilla] = useState(true);
  const antelacion = (donde: string) => (
    <AntelacionAvisos config={CONFIG} horaAvisos="08:00" nombreZona={NOMBRE_ZONA} variante="columna" sufijo={`${donde}-${sufijo}`} />
  );

  return (
    <div className="flex flex-col gap-12">
      <div>
        <Etiqueta>ListaAvisos · los avisos del diseño con la antelación al lado desde 1280 px (por debajo, «Configurar»)</Etiqueta>
        <ListaAvisos avisos={DISENO} noLeidos={2} fechaHoy={HOY} zona={ZONA} antelacion={antelacion("lista")} />
      </div>

      <div className="flex flex-col gap-6">
        <Etiqueta>FilaAviso · detalle largo desde 768 px, corto por debajo (sin icono)</Etiqueta>
        <div>
          <Etiqueta>No leído · Ajustar (recurrente variable)</Etiqueta>
          <Fila aviso={GAS} />
        </div>
        <div>
          <Etiqueta>No leído · Confirmar (recurrente fijo)</Etiqueta>
          <Fila aviso={INTERNET} />
        </div>
        <div>
          <Etiqueta>Leído · resuelto, sin acción</Etiqueta>
          <Fila aviso={GIMNASIO} />
        </div>
        <div>
          <Etiqueta>Leído · Registrar abono (cobro)</Etiqueta>
          <Fila aviso={CAMILA} />
        </div>
        <div>
          <Etiqueta>No leído · Registrar precio (precio manual, ayer)</Etiqueta>
          <Fila aviso={VOO} />
        </div>
        <div>
          <Etiqueta>No leído · deuda pendiente, sin acción</Etiqueta>
          <Fila aviso={DEUDA_PENDIENTE} />
        </div>
        <div>
          <Etiqueta>Ajuste abierto · Confirmar 35.000</Etiqueta>
          <Fila aviso={GAS} ajustando />
        </div>
        <div>
          <Etiqueta>Error bajo la fila</Etiqueta>
          <ul className="border-t border-raya">
            <FilaAviso aviso={INTERNET} fechaHoy={HOY} zona={ZONA} error="No pudimos conectar. Intenta de nuevo." alAlternar={() => {}} alConfirmar={() => {}} />
          </ul>
        </div>
      </div>

      <div>
        <Etiqueta>Vacío · «Todo leído» y «Marcar todo» deshabilitado</Etiqueta>
        <ListaAvisos avisos={[]} noLeidos={0} fechaHoy={HOY} zona={ZONA} antelacion={antelacion("vacia")} />
      </div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <div>
          <Etiqueta>AntelacionAvisos · columna (xl), precio manual inactivo</Etiqueta>
          {antelacion("columna")}
        </div>
        <div>
          <Etiqueta>AntelacionAvisos · página (?antelacion=1)</Etiqueta>
          <AntelacionAvisos config={CONFIG} horaAvisos="08:00" nombreZona={NOMBRE_ZONA} variante="pagina" sufijo={`pagina-${sufijo}`} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <div>
          <Etiqueta>Casilla · toca para alternar</Etiqueta>
          <Casilla
            nombre={`casilla-${sufijo}`}
            rotulo="Recurrentes por confirmar"
            descripcion="Cuando aparecen en la bandeja, antes de vencer."
            marcada={casilla}
            alCambiar={setCasilla}
          />
          <Casilla nombre={`casilla-off-${sufijo}`} rotulo="Precio manual sin actualizar" descripcion="Inversiones con cotización ingresada a mano." marcada={false} alCambiar={() => {}} />
        </div>
        <div>
          <Etiqueta>Contador del menú · lateral, hoja «Más» y punto en la pestaña</Etiqueta>
          <div className="flex flex-col gap-4">
            <div className="flex h-10 items-center gap-3 rounded-campo px-2 text-cuerpo text-secundario">
              <IconoNavegacion destino="avisos" />
              <span className="flex-1">Avisos</span>
              <NumeroAvisos noLeidos={2} />
            </div>
            <div className="grid min-h-13 grid-cols-[20px_minmax(0,1fr)] items-center gap-3 border-t border-linea text-cuerpo">
              <span className="flex text-secundario">
                <IconoNavegacion destino="avisos" />
              </span>
              <span className="flex items-baseline justify-between gap-3">
                <span>Avisos</span>
                <NumeroAvisos noLeidos={2} />
              </span>
            </div>
            <div className="flex items-center gap-6 text-secundario">
              <span className="flex flex-col items-center gap-1 text-rotulo">
                <span className="relative flex size-6 items-center justify-center">
                  <Ellipsis size={20} strokeWidth={1.5} aria-hidden />
                  <PuntoAvisos noLeidos={2} />
                </span>
                Más · con sin leer
              </span>
              <span className="flex flex-col items-center gap-1 text-rotulo">
                <span className="relative flex size-6 items-center justify-center">
                  <Ellipsis size={20} strokeWidth={1.5} aria-hidden />
                  <PuntoAvisos noLeidos={0} />
                </span>
                Más · todo leído
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
