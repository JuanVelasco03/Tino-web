"use client";

import { useState, type ReactNode } from "react";
import { Boton } from "@/components/boton";
import { CampoMonto } from "@/components/campo-monto";
import { TecladoNumerico } from "@/components/captura/teclado-numerico";
import { FilaCuenta } from "@/components/cuentas/fila-cuenta";
import { BloquePrecio, type AccionesPrecio } from "@/components/inversiones/bloque-precio";
import { CifrasInversion } from "@/components/inversiones/cifras-inversion";
import { DiaUnoInversiones } from "@/components/inversiones/dia-uno-inversiones";
import { ListaOperaciones } from "@/components/inversiones/lista-operaciones";
import { PanelInversion } from "@/components/inversiones/panel-inversion";
import { PanelOperacion, type AccionesOperacion } from "@/components/inversiones/panel-operacion";
import { SelectorInversiones } from "@/components/inversiones/selector-inversiones";
import { TablaPosiciones } from "@/components/inversiones/tabla-posiciones";
import { LineaTrm, TrmReferencia } from "@/components/linea-trm";
import { formatearTasa } from "@/domain/dinero/formato";
import { tasaImplicita } from "@/domain/dinero/tasa";
import { aMenores } from "@/domain/dinero/entrada";
import type { InversionDetalle, InversionResumen, Operacion, Posicion, Trm } from "@/domain/inversion/tipos";
import type { Cuenta } from "@/services/cuentas";

const HOY = "2026-11-11";
const ZONA = "America/Bogota";
const TRM: Trm = { valor: 412_000n, vigenteDesde: HOY, vigenteHasta: HOY, fuente: "Superintendencia Financiera de Colombia" };

/** Valor en COP con la TRM del diseño (4.120,00), como lo daría la API. */
function cop(centavos: bigint): bigint {
  return (centavos * 412_000n + 5_000n) / 10_000n;
}

type Base = Pick<Posicion, "activoId" | "simbolo" | "nombre" | "cantidad" | "costo" | "costoPromedio" | "precio" | "valor" | "rendimientoPorcentaje"> &
  Partial<Posicion>;

function posicion(b: Base): Posicion {
  const rendimiento = b.valor - b.costo;
  return {
    precioFecha: "2026-11-10",
    precioOrigen: "cierre",
    precioCotizadoEn: "2026-11-10T21:00:00.000Z",
    precioVencido: false,
    precioAnterior: null,
    cotizacion: "automatica",
    clase: "etf",
    valorCop: cop(b.valor),
    rendimiento,
    rendimientoCop: cop(rendimiento),
    ...b,
  };
}

/** Las cinco del diseño (`Inversiones.dc.html`): eToro en USD con TRM 4.120,00 del 11 nov 2026. */
const POSICIONES: Posicion[] = [
  posicion({ activoId: "voo", simbolo: "VOO", nombre: "Vanguard S&P 500 ETF", cantidad: "6.25", costo: 311_700n, costoPromedio: 49_872n, precio: 56_240n, valor: 351_500n, rendimientoPorcentaje: 1277 }),
  posicion({ activoId: "qqq", simbolo: "QQQ", nombre: "Invesco QQQ Trust", cantidad: "3.1", costo: 136_757n, costoPromedio: 44_115n, precio: 48_690n, valor: 150_939n, rendimientoPorcentaje: 1037 }),
  posicion({ activoId: "aapl", simbolo: "AAPL", nombre: "Apple Inc.", cantidad: "4", costo: 76_560n, costoPromedio: 19_140n, precio: 22_852n, valor: 91_408n, rendimientoPorcentaje: 1939, clase: "accion" }),
  posicion({
    activoId: "btc",
    simbolo: "BTC",
    nombre: "Bitcoin",
    cantidad: "0.0125",
    costo: 72_800n,
    costoPromedio: 5_824_000n,
    precio: 7_140_000n,
    valor: 89_250n,
    rendimientoPorcentaje: 2260,
    clase: "cripto",
    precioOrigen: "intradia",
    precioFecha: HOY,
    precioCotizadoEn: "2026-11-11T14:30:00.000Z",
  }),
  posicion({
    activoId: "renew",
    simbolo: "RENEW",
    nombre: "Smart Portfolio · energías renovables",
    cantidad: "1",
    costo: 40_000n,
    costoPromedio: 40_000n,
    precio: 40_542n,
    valor: 40_542n,
    rendimientoPorcentaje: 136,
    clase: null,
    cotizacion: "manual",
    precioOrigen: "manual",
    precioFecha: "2026-11-07",
    precioAnterior: { precio: 40_000n, fecha: "2026-11-01" },
  }),
];

const ETORO: InversionDetalle = {
  id: "etoro",
  nombre: "eToro",
  moneda: "USD",
  fechaHoy: HOY,
  trm: TRM,
  trmDesactualizada: false,
  valorMercado: 775_000n,
  valorMercadoCop: 31_930_000n,
  costo: 637_817n,
  costoCop: 26_278_060n,
  rendimiento: 85_822n,
  rendimientoCop: 3_535_866n,
  rendimientoPorcentaje: 1346,
  efectivo: 51_361n,
  efectivoCop: 2_116_073n,
  posiciones: POSICIONES,
  archivadaEn: null,
};

const ACCIONES_COP: InversionDetalle = {
  ...ETORO,
  id: "acciones-cop",
  nombre: "Acciones COP",
  moneda: "COP",
  valorMercado: 1_000_000n,
  valorMercadoCop: null,
  costo: 0n,
  costoCop: null,
  rendimiento: 0n,
  rendimientoCop: null,
  rendimientoPorcentaje: null,
  efectivo: 1_000_000n,
  efectivoCop: null,
  posiciones: [],
};

const RESUMENES: InversionResumen[] = [
  { id: "etoro", nombre: "eToro", moneda: "USD", valorMercado: 775_000n, valorMercadoCop: 31_930_000n, rendimiento: 85_822n, rendimientoPorcentaje: 1346 },
  { id: "acciones-cop", nombre: "Acciones COP", moneda: "COP", valorMercado: 1_000_000n, valorMercadoCop: null, rendimiento: 0n, rendimientoPorcentaje: null },
];

function operacion(o: Pick<Operacion, "id" | "clase" | "cantidad" | "monto" | "precioUnitario" | "fecha" | "gananciaRealizada" | "activo">): Operacion {
  return { creadoEn: `${o.fecha}T15:00:00.000Z`, actualizadoEn: `${o.fecha}T15:00:00.000Z`, ...o };
}

const OPERACIONES: Operacion[] = [
  operacion({ id: "o1", clase: "venta", activo: { id: "qqq", simbolo: "QQQ", nombre: "Invesco QQQ Trust" }, cantidad: "1", monto: 48_690n, precioUnitario: 48_690n, fecha: "2026-11-09", gananciaRealizada: 4_475n }),
  operacion({ id: "o2", clase: "compra", activo: { id: "voo", simbolo: "VOO", nombre: "Vanguard S&P 500 ETF" }, cantidad: "6.25", monto: 311_700n, precioUnitario: 49_872n, fecha: "2026-10-02", gananciaRealizada: null }),
  operacion({ id: "o3", clase: "inicial", activo: { id: "renew", simbolo: "RENEW", nombre: "Smart Portfolio · energías renovables" }, cantidad: "1", monto: 40_000n, precioUnitario: 40_000n, fecha: "2026-08-14", gananciaRealizada: null }),
];

function cuentaInversion(id: string, tasa: bigint | null): Cuenta {
  return {
    id,
    nombre: "eToro",
    tipo: "inversion",
    moneda: "USD",
    naturaleza: "activo",
    detalle: null,
    saldo: tasa === null ? 0n : 31_930_000n,
    saldoInicial: 51_361n,
    tarjeta: null,
    inversion: { efectivo: 51_361n, valorMercado: 775_000n, tasa },
    archivadaEn: null,
  };
}

async function esperar(): Promise<void> {
  await new Promise((resolver) => setTimeout(resolver, 500));
}

const ACCIONES_PRECIO: AccionesPrecio = {
  guardar: async () => {
    await esperar();
    return { ok: true };
  },
  cambiarCotizacion: async (_id, _activo, cotizacion) => {
    await esperar();
    return cotizacion === "automatica"
      ? { ok: false, codigo: "ACTIVO_NO_CUBIERTO", mensaje: "El proveedor de precios no cubre este activo." }
      : { ok: true };
  },
};

const ACCIONES_OPERACION: AccionesOperacion = {
  buscar: async (_id, simbolo) => {
    await esperar();
    const cubierto = simbolo === "MSFT";
    return {
      ok: true,
      busqueda: { simbolo, cubierto, nombre: cubierto ? "Microsoft Corporation" : null, clase: cubierto ? "accion" : null, proveedorDisponible: true },
    };
  },
  registrar: async () => {
    await esperar();
    return { ok: false, codigo: "EFECTIVO_INSUFICIENTE", mensaje: "No hay efectivo suficiente en la cuenta. Registra primero el fondeo." };
  },
  editar: async () => {
    await esperar();
    return { ok: true };
  },
  eliminar: async () => {
    await esperar();
    return { ok: false, codigo: "CANTIDAD_INSUFICIENTE", mensaje: "La operación deja una cantidad negativa en una fecha posterior." };
  },
};

async function crear() {
  await esperar();
  return { ok: false as const, codigo: "NOMBRE_DUPLICADO", mensaje: "Ya tienes una cuenta con ese nombre.", campo: "nombre" as const };
}

function Etiqueta({ children }: { children: ReactNode }) {
  return <div className="mb-3 font-mono text-rotulo text-marca-texto">{children}</div>;
}

/** «Llegó» con su tasa de vista previa y el teclado móvil con «,» en dólares. */
function MuestraLlego({ sufijo }: { sufijo: string }) {
  const [pesos, setPesos] = useState("8.240.000");
  const [dolares, setDolares] = useState("2.000,00");
  const p = aMenores(pesos, "COP");
  const d = aMenores(dolares, "USD");
  const tasa = p && d && d !== "0" ? `Tasa ${formatearTasa(tasaImplicita(BigInt(p), BigInt(d)))} COP por US$ · TRM de hoy 4.120,00` : undefined;
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="flex flex-col gap-4">
        <CampoMonto valor={pesos} moneda="COP" etiqueta="Monto · desde Bancolombia" editable={{ nombre: `llego-pesos-${sufijo}`, alCambiar: setPesos }} />
        <CampoMonto valor={dolares} moneda="USD" etiqueta="Llegó" editable={{ nombre: `llego-dolares-${sufijo}`, alCambiar: setDolares, nota: tasa }} />
      </div>
      <div className="max-w-[360px]">
        <TecladoNumerico valor={dolares} moneda="USD" alCambiar={setDolares} />
      </div>
    </div>
  );
}

/** Inversiones (SPEC 10) con los datos del diseño. */
export function MuestraInversiones({ sufijo }: { sufijo: string }) {
  const [panel, setPanel] = useState<"inversion" | "operacion" | "edicion" | "hoja-manual" | "hoja-automatica" | null>(null);
  const cerrar = () => setPanel(null);

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-4">
        <Etiqueta>LineaTrm · aplicada, desactualizada, sin TRM y de hoy (día uno)</Etiqueta>
        <LineaTrm trm={TRM} desactualizada={false} />
        <LineaTrm trm={{ ...TRM, vigenteDesde: "2026-11-08" }} desactualizada />
        <LineaTrm trm={null} desactualizada={false} />
        <LineaTrm trm={TRM} desactualizada={false} prefijo="hoy" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div>
          <Etiqueta>TRM de referencia · menú</Etiqueta>
          <TrmReferencia trm={{ fechaHoy: HOY, trm: TRM, desactualizada: false }} />
        </div>
        <div>
          <Etiqueta>Desactualizada</Etiqueta>
          <TrmReferencia trm={{ fechaHoy: HOY, trm: { ...TRM, vigenteDesde: "2026-11-08" }, desactualizada: true }} />
        </div>
        <div>
          <Etiqueta>Sin TRM</Etiqueta>
          <TrmReferencia trm={{ fechaHoy: HOY, trm: null, desactualizada: false }} />
        </div>
      </div>

      <div>
        <Etiqueta>Selector · dos inversiones (eToro abierta)</Etiqueta>
        <SelectorInversiones inversiones={RESUMENES} elegida="etoro" />
      </div>

      <div className="flex flex-col gap-8">
        <div>
          <Etiqueta>Cifras · USD con «≈ COP»</Etiqueta>
          <CifrasInversion detalle={ETORO} />
        </div>
        <div>
          <Etiqueta>Cifras · COP, sin posiciones (sin «≈»)</Etiqueta>
          <CifrasInversion detalle={ACCIONES_COP} />
        </div>
      </div>

      <div>
        <Etiqueta>Tabla de posiciones · las cinco del diseño, con el bloque manual de RENEW abierto (tabla desde 1280 px, lista por debajo)</Etiqueta>
        <TablaPosiciones
          detalle={ETORO}
          zona={ZONA}
          abierto="renew"
          bloque={<BloquePrecio detalle={ETORO} posicion={POSICIONES[4]} acciones={ACCIONES_PRECIO} formato="linea" alCerrar={() => {}} />}
        />
      </div>

      <div>
        <Etiqueta>Bloque de precio · automático (VOO), en línea</Etiqueta>
        <BloquePrecio detalle={ETORO} posicion={POSICIONES[0]} acciones={ACCIONES_PRECIO} formato="linea" alCerrar={() => {}} />
      </div>

      <div>
        <Etiqueta>Cuenta vacía · Acciones COP (columnas «· COP», sin nota)</Etiqueta>
        <TablaPosiciones detalle={ACCIONES_COP} zona={ZONA} />
      </div>

      <div>
        <Etiqueta>Operaciones · venta con ganancia, compra y «Ya lo tenía»</Etiqueta>
        <ListaOperaciones operaciones={OPERACIONES} moneda="USD" enlace={() => "/estilos"} />
      </div>

      <div>
        <Etiqueta>Operaciones · sin ninguna</Etiqueta>
        <ListaOperaciones operaciones={[]} moneda="COP" />
      </div>

      <div>
        <Etiqueta>Día uno · sin inversiones</Etiqueta>
        <DiaUnoInversiones trm={TRM} trmDesactualizada={false} />
      </div>

      <div>
        <Etiqueta>Fila de inversión en Cuentas · con TRM y sin TRM</Etiqueta>
        <ul className="divide-y divide-linea rounded-hoja border border-linea bg-superficie px-4 md:px-6">
          <FilaCuenta cuenta={cuentaInversion(`etoro-${sufijo}`, 412_000n)} />
          <FilaCuenta cuenta={cuentaInversion(`etoro-sin-${sufijo}`, null)} />
        </ul>
      </div>

      <div>
        <Etiqueta>Captura · transferencia entre monedas: «Llegó», tasa de vista previa y teclado con «,»</Etiqueta>
        <MuestraLlego sufijo={sufijo} />
      </div>

      <div>
        <Etiqueta>Paneles · alta de inversión, operación (prueba «MSFT»; registrar da EFECTIVO_INSUFICIENTE), edición y hojas de precio</Etiqueta>
        <div className="flex flex-wrap gap-3">
          <Boton variante="secundario" onClick={() => setPanel("inversion")}>
            Nueva inversión
          </Boton>
          <Boton variante="secundario" onClick={() => setPanel("operacion")}>
            Registrar operación
          </Boton>
          <Boton variante="secundario" onClick={() => setPanel("edicion")}>
            Editar operación
          </Boton>
          <Boton variante="secundario" onClick={() => setPanel("hoja-manual")}>
            Hoja · precio manual
          </Boton>
          <Boton variante="secundario" onClick={() => setPanel("hoja-automatica")}>
            Hoja · precio automático
          </Boton>
        </div>
        {panel === "inversion" && <PanelInversion crear={crear} rutaCierre="/estilos" alCerrar={cerrar} />}
        {(panel === "operacion" || panel === "edicion") && (
          <PanelOperacion
            detalle={ETORO}
            operaciones={OPERACIONES}
            operacion={panel === "edicion" ? OPERACIONES[1] : null}
            acciones={ACCIONES_OPERACION}
            alCerrar={cerrar}
          />
        )}
        {panel === "hoja-manual" && (
          <BloquePrecio detalle={ETORO} posicion={POSICIONES[4]} acciones={ACCIONES_PRECIO} formato="hoja" alCerrar={cerrar} />
        )}
        {panel === "hoja-automatica" && (
          <BloquePrecio detalle={ETORO} posicion={POSICIONES[0]} acciones={ACCIONES_PRECIO} formato="hoja" alCerrar={cerrar} />
        )}
      </div>
    </div>
  );
}
