import type { ReactNode } from "react";
import { Boton } from "@/components/boton";
import { BotonTema } from "@/components/boton-tema";
import { CampoMonto } from "@/components/campo-monto";
import { CampoSubrayado } from "@/components/campo-subrayado";
import { ChipCategoria } from "@/components/chip-categoria";
import { EncabezadoSeccion } from "@/components/encabezado-seccion";
import { EnlaceTexto } from "@/components/enlace-texto";
import { EstadoVacio } from "@/components/estado-vacio";
import { FilaMovimiento } from "@/components/fila-movimiento";
import { NavegacionMes } from "@/components/movimientos/navegacion-mes";
import {
  IconoCuenta,
  IconoNavegacion,
  ROTULO_DESTINO,
  ROTULO_TIPO_CUENTA,
  type DestinoNavegacion,
} from "@/components/iconos";
import { CambioDelMes } from "@/components/resumen/cambio-del-mes";
import { CifrasMes } from "@/components/resumen/cifras-mes";
import { GastoCategorias } from "@/components/resumen/gasto-categorias";
import { GraficaPatrimonio, PatrimonioNeto } from "@/components/resumen/grafica-patrimonio";
import { TarjetaCuenta } from "@/components/tarjeta-cuenta";
import type { TipoCuenta } from "@/domain/cuenta/naturaleza";
import { formatearEquivalencia } from "@/domain/dinero/formato";
import { AlternarTema } from "./alternar-tema";
import { MuestraDeudas } from "./muestras-deudas";
import {
  MuestraAvisoRegistro,
  MuestraBloqueEliminar,
  MuestraChipsInteractivos,
  MuestraDiaUno,
  MuestraEditorPartes,
  MuestraEstadoVacioBoton,
  MuestraFichasCuenta,
  MuestraMontoEditable,
  MuestraOpcionUnica,
  MuestraPanelLateral,
  MuestraRecurrentes,
  MuestraSelectorTipo,
  MuestraTeclado,
} from "./muestras-interactivas";

export const metadata = { title: "Estilos · Tino" };

/*
 * Referencia viva del sistema de diseño. Los hex mostrados son documentación y
 * deben mantenerse en sincronía con los tokens de `globals.css`, que es la
 * fuente: todo lo demás de esta página usa los tokens, no valores propios.
 */
const PALETA = [
  { token: "fondo", fondoClase: "bg-fondo", uso: "Papel. Fondo de la app", claro: "#FAF8F3", oscuro: "#12141A" },
  { token: "superficie", fondoClase: "bg-superficie", uso: "Hoja: campos, teclado, tarjeta de cuenta", claro: "#FFFFFF", oscuro: "#181B22" },
  { token: "hundido", fondoClase: "bg-hundido", uso: "Tecla presionada, fila seleccionada", claro: "#F2EEE5", oscuro: "#1F232C" },
  { token: "texto", fondoClase: "bg-texto", uso: "Cifras y texto principal", claro: "#1A1A17", oscuro: "#E8E4DC" },
  { token: "secundario", fondoClase: "bg-secundario", uso: "Etiquetas, fechas, equivalencias", claro: "#6B6760", oscuro: "#8B8A84" },
  { token: "terciario", fondoClase: "bg-terciario", uso: "Marcadores y cero vacío. Nunca información", claro: "#9A958B", oscuro: "#5E5F63" },
  { token: "linea", fondoClase: "bg-linea", uso: "División entre filas y bordes de hoja", claro: "#E4DFD4", oscuro: "#272B34" },
  { token: "raya", fondoClase: "bg-raya", uso: "Raya de total, simple o doble", claro: "#1A1A17", oscuro: "#8B8A84" },
] as const;

const ACENTOS = [
  { nombre: "Marca · latón", uso: "Foco, sugerencias, enlaces", base: "marca", baseHex: "#A8762C", claro: "#8A5F1F", oscuro: "#BC8A3E", texto: "text-marca-texto", muestra: "Sugerida" },
  { nombre: "Entrada", uso: "Aumenta tu patrimonio", base: "entrada", baseHex: "#2F7D5A", claro: "#2F7D5A", oscuro: "#4E9E78", texto: "text-entrada-texto", muestra: "+4.850.000" },
  { nombre: "Salida", uso: "Reduce tu patrimonio", base: "salida", baseHex: "#B0452E", claro: "#B0452E", oscuro: "#D0664B", texto: "text-salida-texto", muestra: "−18.500" },
] as const;

const COLOR_BASE: Record<string, string> = {
  marca: "bg-marca",
  entrada: "bg-entrada",
  salida: "bg-salida",
};

const CIFRAS = [
  { token: "cifra-xl", clase: "text-cifra-xl", muestra: "18.500", medida: "56/60 · 500" },
  { token: "cifra-l", clase: "text-cifra-l", muestra: "4.850.000", medida: "32/36 · 500" },
  { token: "cifra-m", clase: "text-cifra-m", muestra: "1.267.900", medida: "20/28 · 500" },
  { token: "cifra-s", clase: "text-cifra-s", muestra: "−18.500", medida: "15/22 · 500" },
  { token: "cifra-xs", clase: "text-cifra-xs text-secundario", muestra: "≈ 31.775.000 COP", medida: "12/16 · 400" },
] as const;

const TEXTOS = [
  { token: "titulo-1", clase: "text-titulo-1", muestra: "Noviembre", medida: "28/34 · 600" },
  { token: "titulo-2", clase: "text-titulo-2", muestra: "Bancolombia Ahorros", medida: "20/26 · 600" },
  { token: "cuerpo", clase: "text-cuerpo", muestra: "Almuerzo corrientazo", medida: "15/22 · 400" },
  { token: "etiqueta", clase: "text-etiqueta text-secundario", muestra: "Comida · Nequi", medida: "13/18 · 500" },
  { token: "rotulo", clase: "text-rotulo uppercase", muestra: "Activos", medida: "11/14 · 600 · +8 %" },
] as const;

const ESPACIADO = [
  [4, "w-1", "Icono a texto"],
  [8, "w-2", "Entre chips"],
  [12, "w-3", "Columnas de una fila"],
  [16, "w-4", "Margen móvil, interior de hoja"],
  [24, "w-6", "Entre grupos"],
  [32, "w-8", "Margen escritorio"],
  [48, "w-12", "Entre secciones"],
  [64, "w-16", "Respiro de página"],
] as const;

const RADIOS = [
  [0, "rounded-fila", "Filas, tablas, teclado"],
  [2, "rounded-muestra", "Muestras, barras de cupo"],
  [4, "rounded-campo", "Campos, botones, chips"],
  [6, "rounded-hoja", "Hojas: tarjeta de cuenta, panel inferior"],
] as const;

/* Resumen del mes: ejemplo de docs/api/resumen.md (noviembre 2026) y una serie de 12 meses. */
const RESUMEN = {
  ingresos: { actual: 0n, anterior: 2_000_000n, variacion: -2_000_000n, variacionPorcentaje: -1000 },
  gastos: { actual: 300_000n, anterior: 420_000n, variacion: -120_000n, variacionPorcentaje: -286 },
  resultado: { actual: -300_000n, anterior: 1_580_000n, variacion: -1_880_000n, variacionPorcentaje: -1190 },
  categorias: [
    { categoria: { id: "comida", nombre: "Comida" }, monto: 260_000n, anterior: 300_000n, variacion: -40_000n, porcentaje: 867 },
    { categoria: { id: "mercado", nombre: "Mercado" }, monto: 30_000n, anterior: 0n, variacion: 30_000n, porcentaje: 100 },
    { categoria: { id: "transporte", nombre: "Transporte" }, monto: 0n, anterior: 20_000n, variacion: -20_000n, porcentaje: 0 },
  ],
  sinCategoria: { monto: 10_000n, anterior: 100_000n, variacion: -90_000n, porcentaje: 33, cantidad: 1 },
  serie: [
    { fecha: "2026-10-31", patrimonio: 2_580_000n },
    { fecha: "2026-11-21", patrimonio: 2_280_000n },
  ],
  cambio: {
    fechaAnterior: "2026-10-31",
    fechaCierre: "2026-11-30",
    patrimonioAnterior: 2_580_000n,
    resultado: -300_000n,
    otrosCambios: 0n,
    patrimonioCierre: 2_280_000n,
  },
};

const SERIE_DOCE = (
  [
    ["2025-12-31", 27_412_380n],
    ["2026-01-31", 27_958_110n],
    ["2026-02-28", 28_301_645n],
    ["2026-03-31", 28_077_920n],
    ["2026-04-30", 29_115_430n],
    ["2026-05-31", 29_884_210n],
    ["2026-06-30", 30_402_775n],
    ["2026-07-31", 31_268_940n],
    ["2026-08-31", 31_050_315n],
    ["2026-09-30", 32_106_940n],
    ["2026-10-31", 33_784_215n],
    ["2026-11-21", 34_121_072n],
  ] as const
).map(([fecha, patrimonio]) => ({ fecha, patrimonio }));

/** Componentes del resumen: a todo el ancho, porque la tabla de categorías lo necesita. */
function ComponentesResumen() {
  return (
    <>
      <div>
        <Etiqueta>Navegación de meses · título, con límites (sin ‹ en el primer mes, sin › en el actual)</Etiqueta>
        <div className="flex flex-col gap-4">
          <NavegacionMes mes="2026-11" actual="2026-11" ruta="/estilos" haySiguiente={false} variante="titulo" />
          <NavegacionMes mes="2026-10" actual="2026-11" ruta="/estilos" hayAnterior={false} variante="titulo" />
          <NavegacionMes mes="2026-10" actual="2026-11" ruta="/estilos" hayAnterior={false} />
        </div>
      </div>

      <div>
        <Etiqueta>Cifras del mes · ingresos, gastos y resultado frente al anterior</Etiqueta>
        <CifrasMes ingresos={RESUMEN.ingresos} gastos={RESUMEN.gastos} resultado={RESUMEN.resultado} mesAnterior="2026-10" />
      </div>

      <div>
        <Etiqueta>Gasto por categoría · barras, sin categoría, total e indicador</Etiqueta>
        <GastoCategorias
          categorias={RESUMEN.categorias}
          sinCategoria={RESUMEN.sinCategoria}
          gastos={RESUMEN.gastos}
          mes="2026-11"
          mesAnterior="2026-10"
        />
      </div>

      <div>
        <Etiqueta>Gasto por categoría · mes sin gastos</Etiqueta>
        <GastoCategorias
          categorias={[]}
          sinCategoria={{ monto: 0n, anterior: 0n, variacion: 0n, porcentaje: null, cantidad: 0 }}
          gastos={{ actual: 0n, anterior: 0n, variacion: 0n, variacionPorcentaje: null }}
          mes="2026-08"
          mesAnterior="2026-07"
        />
      </div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div>
          <Etiqueta>Patrimonio neto · 2 puntos en las dos últimas casillas</Etiqueta>
          <PatrimonioNeto patrimonio={{ hoy: 2_280_000n, serie: RESUMEN.serie, variacionSerie: -300_000n }} />
        </div>
        <div>
          <Etiqueta>Cambio del mes · mes actual</Etiqueta>
          <CambioDelMes cambio={RESUMEN.cambio} mes="2026-11" esActual />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div>
          <Etiqueta>Patrimonio neto · 12 meses</Etiqueta>
          <PatrimonioNeto patrimonio={{ hoy: 34_121_072n, serie: SERIE_DOCE, variacionSerie: 6_708_692n }} />
        </div>
        <div>
          <Etiqueta>Cambio del mes · mes cerrado</Etiqueta>
          <CambioDelMes
            cambio={{
              fechaAnterior: "2026-09-30",
              fechaCierre: "2026-10-31",
              patrimonioAnterior: 32_106_940n,
              resultado: 1_250_500n,
              otrosCambios: 426_775n,
              patrimonioCierre: 33_784_215n,
            }}
            mes="2026-10"
            esActual={false}
          />
        </div>
      </div>

      <div>
        <Etiqueta>Gráfica · un solo punto (serie plana) y punto de partida (día uno)</Etiqueta>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <GraficaPatrimonio serie={[{ fecha: "2026-11-21", patrimonio: 975_372n }]} />
          <GraficaPatrimonio puntoDePartida={{ fechaHoy: "2026-11-11" }} />
        </div>
      </div>

      <div>
        <Etiqueta>Día uno · con 3 cuentas</Etiqueta>
        <MuestraDiaUno cuentasActivas={3} />
      </div>

      <div>
        <Etiqueta>Día uno · con una cuenta</Etiqueta>
        <MuestraDiaUno cuentasActivas={1} />
      </div>

      <div>
        <Etiqueta>Día uno · sin cuentas</Etiqueta>
        <MuestraDiaUno cuentasActivas={0} />
      </div>
    </>
  );
}

const DESTINOS = Object.keys(ROTULO_DESTINO) as DestinoNavegacion[];
const TIPOS_CUENTA = Object.keys(ROTULO_TIPO_CUENTA) as TipoCuenta[];

function Seccion({ numero, titulo, nota, children }: { numero: string; titulo: string; nota?: string; children: ReactNode }) {
  return (
    <section className="pt-16">
      <div className="mb-6 flex flex-wrap items-baseline gap-4">
        <span className="font-mono text-etiqueta text-marca-texto">{numero}</span>
        <h2 className="text-titulo-1">{titulo}</h2>
        {nota && <span className="text-etiqueta text-secundario">{nota}</span>}
      </div>
      {children}
    </section>
  );
}

function Rotulo({ children }: { children: ReactNode }) {
  return <div className="border-b border-raya pb-2 text-rotulo uppercase">{children}</div>;
}

/** Panel que fija su propio modo, para ver claro y oscuro a la vez. */
function Panel({ modo, titulo, hex, children }: { modo: "light" | "dark"; titulo: string; hex: string; children: ReactNode }) {
  return (
    <div data-theme={modo} className="flex h-full flex-col gap-12 rounded-hoja border border-linea bg-fondo p-6 text-texto">
      <div className="flex items-baseline justify-between">
        <span className="text-titulo-2">{titulo}</span>
        <span className="font-mono text-cifra-xs text-secundario">{hex}</span>
      </div>
      {children}
    </div>
  );
}

function Etiqueta({ children }: { children: ReactNode }) {
  return <div className="mb-3 font-mono text-rotulo text-marca-texto">{children}</div>;
}

function FilaCuenta({ nombre, cifra }: { nombre: string; cifra: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-linea py-3">
      <span className="text-cuerpo">{nombre}</span>
      <span className="font-mono text-cifra-s tabular-nums font-normal">{cifra}</span>
    </div>
  );
}

function Componentes({ modo }: { modo: "light" | "dark" }) {
  return (
    <>
      <div>
        <Etiqueta>C1 · Encabezado de sección</Etiqueta>
        <EncabezadoSeccion titulo="Activos" total="35.512.800" />
        <FilaCuenta nombre="Bancolombia Ahorros" cifra="3.240.500" />
        <FilaCuenta nombre="Interactive Brokers" cifra="31.775.000" />
        <FilaCuenta nombre="Nequi" cifra="412.300" />
        <FilaCuenta nombre="Efectivo" cifra="85.000" />
        <EncabezadoSeccion titulo="Pasivos" total="1.717.900" separado />
        <FilaCuenta nombre="Visa Oro" cifra="1.267.900" />
        <FilaCuenta nombre="Debo a mamá" cifra="450.000" />
        <div className="doble-raya flex items-baseline justify-between pb-2 pt-3">
          <span className="text-cuerpo font-semibold">Patrimonio neto</span>
          <span className="font-mono text-cifra-m tabular-nums">33.794.900</span>
        </div>
      </div>

      <div>
        <Etiqueta>C2 · Fila de movimiento · lista general</Etiqueta>
        <div className="border-t border-linea">
          <FilaMovimiento fecha="04 nov" concepto="Almuerzo corrientazo" tipo="gasto" monto={{ monto: 18_500n, moneda: "COP" }} categoria="Comida" cuenta="Nequi" omitirCOP />
          <FilaMovimiento fecha="03 nov" concepto="Compra D1" tipo="gasto" monto={{ monto: 27_900n, moneda: "COP" }} categoria={null} cuenta="Visa Oro" omitirCOP />
          <FilaMovimiento fecha="02 nov" concepto="Pago tarjeta" tipo="transferencia" transferencia={{ origen: "Bancolombia", destino: "Visa Oro" }} monto={{ monto: 1_200_000n, moneda: "COP" }} omitirCOP />
          <FilaMovimiento fecha="19 nov" concepto="Almuerzo · recién registrado" tipo="gasto" monto={{ monto: 15_000n, moneda: "COP" }} categoria="Comida" cuenta="Nequi" omitirCOP resaltada />
          <FilaMovimiento
            fecha="18 nov"
            concepto="Almuerzo y mercado · dividido, con sub-renglones"
            tipo="gasto"
            monto={{ monto: 30_000n, moneda: "COP" }}
            categoria="Dividido"
            cuenta="Nequi"
            partes={[
              { categoria: "Comida", monto: 20_000n },
              { categoria: "Mercado", monto: 10_000n },
            ]}
            omitirCOP
          />
          <FilaMovimiento fecha="17 nov" concepto="Taxi · como enlace a su edición" tipo="gasto" monto={{ monto: 12_000n, moneda: "COP" }} categoria="Transporte" cuenta="Efectivo" omitirCOP href="#" />
          <FilaMovimiento fecha="01 nov" concepto="Nómina octubre" tipo="ingreso" monto={{ monto: 4_850_000n, moneda: "COP" }} categoria="Salario" cuenta="Bancolombia" omitirCOP />
          <FilaMovimiento fecha="01 nov" concepto="Compra VOO" tipo="transferencia" transferencia={{ origen: "Bancolombia", destino: "Interactive Brokers" }} monto={{ monto: 50_000n, moneda: "USD" }} equivalenteCOP={2_050_000n} omitirCOP />
        </div>
      </div>

      <div>
        <Etiqueta>C3 · Tarjeta de cuenta · activo, activo en USD, pasivo</Etiqueta>
        <div className="flex flex-col gap-3">
          <TarjetaCuenta nombre="Bancolombia Ahorros" tipo="banco" saldo={{ monto: 3_240_500n, moneda: "COP" }} />
          <TarjetaCuenta nombre="Interactive Brokers" tipo="inversion" saldo={{ monto: 775_000n, moneda: "USD" }} equivalente={{ cop: 31_775_000n, tasa: 410_000n, fecha: "hoy" }} />
          <TarjetaCuenta nombre="Visa Oro" tipo="tarjeta_credito" saldo={{ monto: 1_267_900n, moneda: "COP" }} cupoTotal={6_000_000n} corte={{ fecha: "15 nov", enDias: 11 }} pagoLimite={{ fecha: "30 nov", enDias: 26 }} />
        </div>
      </div>

      <div>
        <Etiqueta>C4 · Campo de monto · vacío, con valor, en USD</Etiqueta>
        <div className="flex flex-col gap-6">
          <CampoMonto valor="" moneda="COP" />
          <CampoMonto valor="18.500" moneda="COP" />
          <CampoMonto valor="120,00" moneda="USD" equivalencia={formatearEquivalencia(492_000n, 410_000n)} />
        </div>
      </div>

      <div>
        <Etiqueta>C4 · Campo de monto editable · vacío, con nota, con error</Etiqueta>
        <MuestraMontoEditable sufijo={modo} />
      </div>

      <div>
        <Etiqueta>C5 · Chip de categoría · sugerida, normal, sin clasificar</Etiqueta>
        <div className="flex flex-wrap gap-2">
          <ChipCategoria etiqueta="Comida" estado="sugerida" />
          <ChipCategoria etiqueta="Transporte" />
          <ChipCategoria etiqueta="Celular" />
          <ChipCategoria etiqueta="Mercado" seleccionada />
          <ChipCategoria etiqueta="Salud" />
          <ChipCategoria etiqueta="Sin clasificar" estado="sin-clasificar" />
        </div>
      </div>

      <div>
        <Etiqueta>C5 · Chip de categoría interactivo · tocar la propuesta la quita</Etiqueta>
        <MuestraChipsInteractivos />
      </div>

      <div>
        <Etiqueta>C6 · Botones</Etiqueta>
        <div className="flex flex-wrap items-center gap-3">
          <Boton monto="18.500">Registrar gasto</Boton>
          <Boton variante="secundario">Cancelar</Boton>
          <Boton variante="texto">Deshacer</Boton>
          <Boton disabled>Registrar gasto</Boton>
        </div>
      </div>

      <div>
        <Etiqueta>C7 · Estado vacío · primer día</Etiqueta>
        <EstadoVacio
          rotulo="Movimientos · noviembre"
          titulo="La primera página está en blanco."
          detalle="Lo que registres aparecerá aquí por fecha, con el saldo al lado."
          accion={{ etiqueta: "Registrar el primero", href: "#" }}
        />
      </div>

      <div>
        <Etiqueta>C7 · Estado vacío · acción que abre la captura</Etiqueta>
        <MuestraEstadoVacioBoton />
      </div>

      <div>
        <Etiqueta>Campo subrayado · vacío, con valor, con error</Etiqueta>
        <div className="flex flex-col gap-6">
          <CampoSubrayado etiqueta="Nombre" placeholder="Nequi" id={`estilos-nombre-${modo}`} />
          <CampoSubrayado etiqueta="Detalle · opcional" defaultValue="Ahorros ·· 4821" id={`estilos-detalle-${modo}`} />
          <CampoSubrayado
            etiqueta="Nombre"
            defaultValue="Nequi"
            error="Ya tienes una cuenta con ese nombre."
            id={`estilos-error-${modo}`}
          />
        </div>
      </div>

      <div>
        <Etiqueta>Enlace de texto · acción que navega</Etiqueta>
        <div className="flex flex-wrap gap-6">
          <EnlaceTexto href="#">← Cuentas</EnlaceTexto>
          <EnlaceTexto href="#">+ Nueva cuenta</EnlaceTexto>
          <EnlaceTexto href="#">Ver archivadas</EnlaceTexto>
        </div>
      </div>

      <div>
        <Etiqueta>C22 · Panel lateral</Etiqueta>
        <MuestraPanelLateral />
      </div>

      <div>
        <Etiqueta>C34 · Opción única</Etiqueta>
        <MuestraOpcionUnica sufijo={modo} />
      </div>

      <div>
        <Etiqueta>Selector de tipo · segmentado (escritorio) y pestañas (móvil)</Etiqueta>
        <MuestraSelectorTipo />
      </div>

      <div>
        <Etiqueta>Ficha de cuenta · vista previa del saldo en la elegida</Etiqueta>
        <MuestraFichasCuenta />
      </div>

      <div>
        <Etiqueta>Aviso de registro · deshacer y oferta de regla</Etiqueta>
        <MuestraAvisoRegistro />
      </div>

      <div>
        <Etiqueta>Teclado numérico · captura en móvil</Etiqueta>
        <MuestraTeclado />
      </div>

      <div>
        <Etiqueta>Navegación de meses · actual y otro mes (con «Este mes»); con límites en «06 · Resumen del mes»</Etiqueta>
        <div className="flex flex-col gap-2">
          <NavegacionMes mes="2026-11" actual="2026-11" ruta="/estilos" />
          <NavegacionMes mes="2026-10" actual="2026-11" ruta="/estilos" />
        </div>
      </div>

      <div>
        <Etiqueta>Editor de partes · dividir entre categorías</Etiqueta>
        <MuestraEditorPartes sufijo={modo} />
      </div>

      <div>
        <Etiqueta>C26 · Confirmación de borrado · con el detalle de un movimiento</Etiqueta>
        <MuestraBloqueEliminar />
      </div>
    </>
  );
}

export default function Estilos() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 md:px-8">
      <BotonTema />
      <header className="flex flex-col gap-4 border-b border-raya pb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-cifra-l font-bold tracking-[0.16em]">TINO</h1>
          <span className="font-mono text-cifra-xs text-secundario">Sistema de diseño · v1 · noviembre 2026</span>
        </div>
        <p className="max-w-xl text-cuerpo text-secundario">
          Un libro de cuentas personal. Papel y tinta: el contenido son cifras en columnas, y el diseño
          existe para que se lean y se comparen rápido. Se separa con líneas y espacio; las tarjetas son la excepción.
        </p>
        <div>
          <AlternarTema />
        </div>
      </header>

      <Seccion numero="01" titulo="Color">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {(["light", "dark"] as const).map((modo) => (
            <Panel key={modo} modo={modo} titulo={modo === "light" ? "Claro · papel" : "Oscuro · tinta"} hex={modo === "light" ? "#FAF8F3" : "#12141A"}>
              <div>
                {PALETA.map((c) => (
                  <div key={c.token} className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 border-t border-linea py-3">
                    <span className={`h-7 w-7 rounded-muestra border border-linea ${c.fondoClase}`} />
                    <div>
                      <div className="text-cuerpo font-medium">{c.token}</div>
                      <div className="text-etiqueta text-secundario">{c.uso}</div>
                    </div>
                    <span className="font-mono text-etiqueta font-normal">{modo === "light" ? c.claro : c.oscuro}</span>
                  </div>
                ))}
              </div>
            </Panel>
          ))}
        </div>

        <div className="mt-12">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-raya pb-2">
            <span className="text-rotulo uppercase">Acentos · solo texto e iconos</span>
            <span className="text-etiqueta text-secundario">Nunca como fondo de un bloque</span>
          </div>
          <div className="grid grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))] gap-4 border-b border-linea py-3 text-rotulo uppercase text-secundario max-md:hidden">
            <span>Acento</span>
            <span>Base · iconos y gráficas</span>
            <span>Texto sobre papel</span>
            <span>Texto sobre tinta</span>
          </div>
          {ACENTOS.map((a) => (
            <div key={a.nombre} className="grid grid-cols-1 items-center gap-4 border-b border-linea py-4 md:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))]">
              <div>
                <div className="text-cuerpo font-semibold">{a.nombre}</div>
                <div className="text-etiqueta text-secundario">{a.uso}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`h-5 w-5 rounded-muestra ${COLOR_BASE[a.base]}`} />
                <span className="font-mono text-etiqueta font-normal">{a.baseHex}</span>
              </div>
              {(["light", "dark"] as const).map((modo) => (
                <div key={modo} data-theme={modo} className="flex items-center justify-between gap-2 rounded-campo border border-linea bg-fondo px-3 py-2 text-texto">
                  <span className={`font-mono text-cifra-s tabular-nums ${a.texto}`}>{a.muestra}</span>
                  <span className="font-mono text-cifra-xs text-secundario">{modo === "light" ? a.claro : a.oscuro}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion numero="02" titulo="Tipografía">
        <div className="grid grid-cols-1 gap-x-12 md:grid-cols-2">
          <div className="border-t border-raya pb-6 pt-4">
            <div className="mb-4 flex justify-between text-etiqueta text-secundario"><span>Interfaz</span><span>400 · 500 · 600 · 700</span></div>
            <div className="text-titulo-1 font-semibold">Familjen Grotesk</div>
            <p className="mt-3 text-cuerpo text-secundario">Etiquetas, títulos y navegación.</p>
          </div>
          <div className="border-t border-raya pb-6 pt-4">
            <div className="mb-4 flex justify-between text-etiqueta text-secundario"><span>Cifras</span><span>400 · 500</span></div>
            <div className="font-mono text-cifra-l">1.234.567</div>
            <p className="mt-3 text-cuerpo text-secundario">IBM Plex Mono para todo importe monetario, sin excepción.</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
          {[
            { filas: CIFRAS, mono: true },
            { filas: TEXTOS, mono: false },
          ].map((grupo, i) => (
            <div key={i}>
              <div className="grid grid-cols-[96px_minmax(0,1fr)_auto] gap-4 border-b border-raya pb-2 text-rotulo uppercase text-secundario">
                <span>Token</span><span>Muestra</span><span>Tamaño</span>
              </div>
              {grupo.filas.map((f) => (
                <div key={f.token} className="grid grid-cols-[96px_minmax(0,1fr)_auto] items-baseline gap-4 border-b border-linea py-3">
                  <span className="font-mono text-cifra-xs text-secundario">{f.token}</span>
                  <span className={`${grupo.mono ? "font-mono" : ""} ${f.clase}`}>{f.muestra}</span>
                  <span className="font-mono text-cifra-xs text-secundario">{f.medida}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="mt-4 text-etiqueta text-secundario">
          Regla de peso: el monto siempre va un escalón por encima de su etiqueta. Un saldo en cifra-m acompaña a un nombre en cuerpo; nunca al revés.
        </p>
      </Seccion>

      <Seccion numero="03" titulo="Espaciado, radios y líneas">
        <div className="grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-3">
          <div>
            <Rotulo>Espaciado · base 4</Rotulo>
            {ESPACIADO.map(([px, ancho, uso]) => (
              <div key={px} className="grid grid-cols-[40px_72px_minmax(0,1fr)] items-center gap-3 border-b border-linea py-2">
                <span className="font-mono text-etiqueta font-normal">{px}</span>
                <span className={`h-2 bg-texto ${ancho}`} />
                <span className="text-etiqueta text-secundario">{uso}</span>
              </div>
            ))}
          </div>
          <div>
            <Rotulo>Radios · máximo 6</Rotulo>
            {RADIOS.map(([px, clase, uso]) => (
              <div key={px} className="grid grid-cols-[40px_44px_minmax(0,1fr)] items-center gap-3 border-b border-linea py-3">
                <span className="font-mono text-etiqueta font-normal">{px}</span>
                <span className={`h-8 w-8 border border-texto ${clase}`} />
                <span className="text-etiqueta text-secundario">{uso}</span>
              </div>
            ))}
          </div>
          <div>
            <Rotulo>Líneas · sin sombras</Rotulo>
            {[
              ["border-t border-linea", "División · entre filas"],
              ["border-t border-raya", "Raya · bajo encabezado de sección"],
              ["doble-raya", "Doble raya · total que cierra un grupo"],
              ["punteada", "Punteada · provisional: sin clasificar, por confirmar"],
            ].map(([clase, uso]) => (
              <div key={uso} className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-3 border-b border-linea py-4">
                <span className={`block h-0 ${clase}`} />
                <span className="text-etiqueta text-secundario">{uso}</span>
              </div>
            ))}
          </div>
        </div>
      </Seccion>

      <Seccion numero="04" titulo="Iconos" nota="Lucide · 20 px · trazo 1,5 · color del texto que acompañan">
        <div className="grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-2">
          <div>
            <Rotulo>Navegación · uno por destino</Rotulo>
            <div className="grid grid-cols-2 gap-x-6 sm:grid-cols-3">
              {DESTINOS.map((d) => (
                <div key={d} className="flex items-center gap-3 border-b border-linea py-3 text-cuerpo">
                  <IconoNavegacion destino={d} />
                  <span>{ROTULO_DESTINO[d]}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Rotulo>Tipo de cuenta · uno por tipo</Rotulo>
            <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
              {TIPOS_CUENTA.map((t) => (
                <div key={t} className="flex items-center gap-3 border-b border-linea py-3 text-cuerpo">
                  <span className="flex text-secundario"><IconoCuenta tipo={t} /></span>
                  <span>{ROTULO_TIPO_CUENTA[t]}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-etiqueta text-secundario">Las filas de movimientos no llevan icono.</p>
          </div>
        </div>
      </Seccion>

      <Seccion numero="05" titulo="Componentes" nota="Cada modo como pieza propia">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {(["light", "dark"] as const).map((modo) => (
            <Panel key={modo} modo={modo} titulo={modo === "light" ? "Claro · papel" : "Oscuro · tinta"} hex={modo === "light" ? "#FAF8F3" : "#12141A"}>
              <Componentes modo={modo} />
            </Panel>
          ))}
        </div>
      </Seccion>

      <Seccion numero="06" titulo="Resumen del mes" nota="A todo el ancho: el formato cambia en 768 px">
        <div className="grid grid-cols-1 gap-6">
          {(["light", "dark"] as const).map((modo) => (
            <Panel key={modo} modo={modo} titulo={modo === "light" ? "Claro · papel" : "Oscuro · tinta"} hex={modo === "light" ? "#FAF8F3" : "#12141A"}>
              <ComponentesResumen />
            </Panel>
          ))}
        </div>
      </Seccion>

      <Seccion numero="07" titulo="Recurrentes" nota="Bandeja y plantillas cambian de forma con el ancho de su contenedor">
        <div className="grid grid-cols-1 gap-6">
          {(["light", "dark"] as const).map((modo) => (
            <Panel key={modo} modo={modo} titulo={modo === "light" ? "Claro · papel" : "Oscuro · tinta"} hex={modo === "light" ? "#FAF8F3" : "#12141A"}>
              <MuestraRecurrentes sufijo={modo} />
            </Panel>
          ))}
        </div>
      </Seccion>

      <Seccion numero="08" titulo="Deudas y préstamos" nota="Maestro-detalle: el formato cambia en 768 px">
        <div className="grid grid-cols-1 gap-6">
          {(["light", "dark"] as const).map((modo) => (
            <Panel key={modo} modo={modo} titulo={modo === "light" ? "Claro · papel" : "Oscuro · tinta"} hex={modo === "light" ? "#FAF8F3" : "#12141A"}>
              <MuestraDeudas sufijo={modo} />
            </Panel>
          ))}
        </div>
      </Seccion>
    </main>
  );
}
