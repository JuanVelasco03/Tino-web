"use client";

import { useRef, useState, type ReactNode } from "react";
import { BloqueEliminar } from "@/components/bloque-eliminar";
import { Boton } from "@/components/boton";
import { CampoMonto } from "@/components/campo-monto";
import { AvisoRegistro } from "@/components/captura/aviso-registro";
import { EditorPartes } from "@/components/captura/editor-partes";
import { FichaCuenta } from "@/components/captura/ficha-cuenta";
import { SelectorTipo } from "@/components/captura/selector-tipo";
import { TecladoNumerico } from "@/components/captura/teclado-numerico";
import { ChipCategoria } from "@/components/chip-categoria";
import { EstadoVacio } from "@/components/estado-vacio";
import { IconoCuenta } from "@/components/iconos";
import { OpcionUnica } from "@/components/opcion-unica";
import { PanelLateral, type ControlPanel } from "@/components/panel-lateral";
import {
  AvisoBandeja,
  BandejaRecurrentes,
  CifraAviso,
  FilaBandeja,
  type AccionesBandeja,
} from "@/components/recurrentes/bandeja-recurrentes";
import { ComprometidoMes } from "@/components/recurrentes/comprometido-mes";
import { ListaPlantillas } from "@/components/recurrentes/lista-plantillas";
import { PanelPlantilla, type AccionesPlantilla, type DatosFormulario } from "@/components/recurrentes/panel-plantilla";
import { VistaDiaUno } from "@/components/resumen/dia-uno";
import { desdeMonto, formatearEntradaPesos } from "@/domain/dinero/entrada";
import type { TipoMovimiento } from "@/domain/movimiento/cuerpo";
import { errorPartes, restante, type ValorParte } from "@/domain/movimiento/partes";
import { saldoResultante } from "@/domain/movimiento/vista-previa";
import type { Ocurrencia, Recurrente } from "@/domain/recurrente/tipos";
import type { Cuenta } from "@/services/cuentas";

type Tipo = "banco" | "efectivo" | "tarjeta_credito";

const OPCIONES = [
  { valor: "banco", rotulo: "Banco", icono: <IconoCuenta tipo="banco" /> },
  { valor: "efectivo", rotulo: "Efectivo", icono: <IconoCuenta tipo="efectivo" /> },
  { valor: "tarjeta_credito", rotulo: "Tarjeta de crédito", icono: <IconoCuenta tipo="tarjeta_credito" /> },
] as const;

/** C4 editable: formatea pesos al teclear. `sufijo` separa los ids de claro y oscuro. */
export function MuestraMontoEditable({ sufijo }: { sufijo: string }) {
  const [valor, setValor] = useState("1.284.300");
  const [vacio, setVacio] = useState("");
  return (
    <div className="flex flex-col gap-6">
      <CampoMonto valor={vacio} moneda="COP" etiqueta="Saldo de hoy" editable={{ nombre: `monto-vacio-${sufijo}`, alCambiar: setVacio }} />
      <CampoMonto
        valor={valor}
        moneda="COP"
        etiqueta="Saldo inicial"
        editable={{ nombre: `monto-valor-${sufijo}`, alCambiar: setValor, nota: "Cambiarlo queda registrado." }}
      />
      <CampoMonto
        valor="0"
        moneda="COP"
        etiqueta="Cupo total"
        editable={{
          nombre: `monto-error-${sufijo}`,
          alCambiar: () => {},
          error: "La tarjeta necesita un cupo mayor que cero.",
        }}
      />
    </div>
  );
}

/** C34 · Opción única con ícono. */
export function MuestraOpcionUnica({ sufijo }: { sufijo: string }) {
  const [tipo, setTipo] = useState<Tipo>("banco");
  return <OpcionUnica nombre={`tipo-${sufijo}`} etiqueta="Tipo" opciones={OPCIONES} valor={tipo} alCambiar={setTipo} />;
}

/** C22 · Panel lateral: se abre sobre la página; Escape, «Cerrar» o el velo lo cierran. */
export function MuestraPanelLateral() {
  const [abierto, setAbierto] = useState(false);
  const panel = useRef<ControlPanel>(null);

  async function cerrar() {
    await panel.current?.cerrar();
    setAbierto(false);
  }

  return (
    <>
      <Boton variante="secundario" onClick={() => setAbierto(true)}>
        Abrir panel
      </Boton>
      {abierto && (
        <PanelLateral ref={panel} titulo="Panel lateral" alSolicitarCierre={() => void cerrar()}>
          <div className="flex flex-col gap-6">
            <p className="text-cuerpo text-secundario">
              Hoja de 400 px a la derecha con raya a la izquierda en escritorio; hoja inferior en móvil. Sin sombra.
            </p>
            <MuestraOpcionUnica sufijo="panel" />
            <MuestraMontoEditable sufijo="panel" />
            <Boton className="w-full justify-center" onClick={() => void cerrar()}>
              Listo
            </Boton>
          </div>
        </PanelLateral>
      )}
    </>
  );
}

/** C5 interactivo: la propuesta se toca para quitarla; otra se elige; la elegida se toca para quitarla. */
export function MuestraChipsInteractivos() {
  const [decision, setDecision] = useState<string>("propuesta");
  const categorias = ["Comida", "Transporte", "Hogar", "Ocio"];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-etiqueta text-secundario">
        <span>Categoría</span>
        {decision === "propuesta" && <span className="text-marca-texto">Sugerida por «almuerzo»</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {categorias.map((c) => (
          <ChipCategoria
            key={c}
            etiqueta={c}
            estado={decision === "propuesta" && c === "Comida" ? "sugerida" : "normal"}
            seleccionada={decision === c}
            onClick={() => setDecision((d) => ((d === "propuesta" && c === "Comida") || d === c ? "quitada" : c))}
          />
        ))}
      </div>
    </div>
  );
}

/** Selector de tipo en sus dos variantes. */
export function MuestraSelectorTipo() {
  const [tipo, setTipo] = useState<TipoMovimiento>("gasto");
  return (
    <div className="flex flex-col gap-4">
      <SelectorTipo valor={tipo} alCambiar={setTipo} />
      <SelectorTipo valor={tipo} alCambiar={setTipo} variante="pestanas" />
    </div>
  );
}

/** Teclado numérico (móvil) con el monto que escribe. */
export function MuestraTeclado() {
  const [monto, setMonto] = useState("15.000");
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-center gap-2">
        <output className={`font-mono text-cifra-xl tabular-nums ${monto === "" ? "text-terciario" : ""}`}>{monto || "0"}</output>
        <span className="text-etiqueta text-secundario">COP</span>
      </div>
      <TecladoNumerico valor={monto} alCambiar={setMonto} />
    </div>
  );
}

const FICHAS = [
  { id: "nequi", nombre: "Nequi", tipo: "banco", naturaleza: "activo", saldo: 20_321n },
  { id: "efectivo", nombre: "Efectivo", tipo: "efectivo", naturaleza: "activo", saldo: 45_000n },
  { id: "visa", nombre: "Visa Oro", tipo: "tarjeta_credito", naturaleza: "pasivo", saldo: 1_284_300n },
] as const;

/** Fichas de cuenta con la vista previa de un gasto de 15.000 en la elegida. */
export function MuestraFichasCuenta() {
  const [elegida, setElegida] = useState<string>("nequi");
  return (
    <div className="grid grid-cols-2 gap-2">
      {FICHAS.map((cuenta) => (
        <FichaCuenta
          key={cuenta.id}
          cuenta={cuenta}
          elegida={cuenta.id === elegida}
          resultante={cuenta.id === elegida ? saldoResultante(cuenta, "salida", 15_000n) : null}
          alPulsar={() => setElegida(cuenta.id)}
        />
      ))}
    </div>
  );
}

/** Aviso tras registrar: con oferta de crear regla, de ajustarla (con error) y en formato hoja. */
export function MuestraAvisoRegistro() {
  const nada = () => {};
  const aviso = { tipo: "gasto" as const, monto: 15_000n, descripcion: "Peluquería", cuenta: "Nequi", alDeshacer: nada, deshaciendo: false };
  return (
    <div className="flex flex-col gap-4">
      <AvisoRegistro
        aviso={aviso}
        oferta={{ pregunta: "¿Siempre «Peluquería» → Hogar?", accion: "Crear regla", alAceptar: nada, alRechazar: nada, pendiente: false }}
      />
      <AvisoRegistro
        oferta={{
          pregunta: "¿Cambiar la regla «almuerzo» a Ocio?",
          accion: "Cambiar regla",
          alAceptar: nada,
          alRechazar: nada,
          pendiente: false,
          error: "La regla no existe.",
        }}
      />
      <AvisoRegistro formato="hoja" aviso={{ ...aviso, descripcion: "Almuerzo" }} />
    </div>
  );
}

/** C7 con una acción que no navega (en la app, abre la captura). */
export function MuestraEstadoVacioBoton() {
  const [veces, setVeces] = useState(0);
  return (
    <EstadoVacio
      rotulo="Movimientos · noviembre"
      titulo="Aún no registras movimientos este mes."
      detalle={veces === 0 ? "Registra tu primer gasto." : `Abriría la captura (${veces}).`}
      accion={{ etiqueta: "Registrar", alPulsar: () => setVeces((v) => v + 1) }}
    />
  );
}

const CATEGORIAS_PARTES = [
  { id: "comida", nombre: "Comida" },
  { id: "mercado", nombre: "Mercado" },
  { id: "hogar", nombre: "Hogar" },
  { id: "ocio", nombre: "Ocio" },
];

/** Editor de partes sobre un total de 30.000: falta, sobra, cuadra y «El resto». `sufijo` separa los ids. */
export function MuestraEditorPartes({ sufijo }: { sufijo: string }) {
  const total = 30_000n;
  const [partes, setPartes] = useState<ValorParte[] | null>([
    { categoriaId: "comida", monto: "20.000" },
    { categoriaId: null, monto: "" },
  ]);
  const error = partes ? errorPartes(total, partes) : null;

  function cambiar(indice: number, cambios: Partial<ValorParte>) {
    const formateados = cambios.monto === undefined ? cambios : { ...cambios, monto: formatearEntradaPesos(cambios.monto) };
    setPartes((p) => p?.map((parte, i) => (i === indice ? { ...parte, ...formateados } : parte)) ?? null);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-etiqueta font-normal text-secundario">
        Total <span className="font-mono tabular-nums">30.000</span>
      </p>
      <EditorPartes
        idBase={`estilos-${sufijo}`}
        total={total}
        partes={partes}
        categorias={CATEGORIAS_PARTES}
        alActivar={() => setPartes([{ categoriaId: "comida", monto: "" }, { categoriaId: null, monto: "" }])}
        alDesactivar={() => setPartes(null)}
        alCambiar={cambiar}
        alAgregar={() => setPartes((p) => (p ? [...p, { categoriaId: null, monto: "" }] : p))}
        alQuitar={(indice) => setPartes((p) => (p && p.length > 2 ? p.filter((_, i) => i !== indice) : p))}
        alCompletar={() =>
          setPartes((p) => {
            if (!p) return p;
            const resto = restante(total, p.slice(0, -1));
            return resto > 0n ? p.map((parte, i) => (i === p.length - 1 ? { ...parte, monto: desdeMonto(resto) } : parte)) : p;
          })
        }
        error={error}
      />
    </div>
  );
}

/** C26 con el texto de un movimiento: el bloque reemplaza al vínculo que lo abre. */
export function MuestraBloqueEliminar() {
  const [abierto, setAbierto] = useState(false);
  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className="py-2 text-etiqueta font-normal text-secundario hover:text-texto">
        Eliminar movimiento…
      </button>
    );
  }
  return (
    <BloqueEliminar
      nombre="Almuerzo"
      detalle="El saldo de Nequi vuelve a como estaba. No se puede deshacer."
      alConfirmar={() => setAbierto(false)}
      alCancelar={() => setAbierto(false)}
      pendiente={false}
    />
  );
}

/** Día uno del resumen: con 3 cuentas, con una y sin cuentas. Aquí no hay captura que abrir. */
export function MuestraDiaUno({ cuentasActivas }: { cuentasActivas: number }) {
  return (
    <VistaDiaUno
      cuentasActivas={cuentasActivas}
      inicio={cuentasActivas === 0 ? null : "2026-11-11"}
      fechaHoy="2026-11-11"
      patrimonioHoy={975_372n}
      alRegistrar={() => {}}
    />
  );
}

/* ── Recurrentes ─────────────────────────────────────────────────────── */

const HOY_RECURRENTES = "2026-11-11";

type DatosRecurrentes = { recurrentes: Recurrente[]; bandeja: Ocurrencia[]; ingresos: Ocurrencia[] };

type DatosPlantilla = Partial<Recurrente> & { estado?: Ocurrencia["estado"]; vence?: string; estimado?: bigint };

/**
 * Datos del diseño (`Recurrentes.dc.html`) con `fechaHoy` 2026-11-11, más una
 * vencida, una omitida y una pausada para mostrar todos los estados del mes.
 * `sufijo` separa los ids de claro y oscuro.
 */
function datosRecurrentes(sufijo: string): DatosRecurrentes {
  const banco = { id: "banco", nombre: "Bancolombia" };
  const tarjeta = { id: "visa", nombre: "Visa Oro" };
  const nequi = { id: "nequi", nombre: "Nequi" };
  const cat = (nombre: string) => ({ id: nombre.toLowerCase(), nombre });

  function plantilla(id: string, concepto: string, monto: bigint, datos: DatosPlantilla): Recurrente {
    const { estado, vence, estimado, ...resto } = datos;
    const idCompleto = `${id}-${sufijo}`;
    const ocurrencias: Ocurrencia[] =
      estado && vence
        ? [
            {
              recurrenteId: idCompleto,
              vencimiento: vence,
              estado,
              monto: estimado ?? monto,
              estimado: (resto.variable ?? false) && estado !== "pagada",
              movimientoId: estado === "pagada" ? `mov-${idCompleto}` : null,
            },
          ]
        : [];
    return {
      id: idCompleto,
      tipo: "gasto",
      concepto,
      monto,
      variable: false,
      periodicidad: "mensual",
      primerVencimiento: vence ?? "2026-01-01",
      ultimoDia: false,
      cuentaOrigen: banco,
      cuentaDestino: null,
      categoria: cat("Servicios"),
      pausada: false,
      pausadaDesde: null,
      ultimoConfirmado: null,
      ocurrenciasDelMes: ocurrencias,
      proximoVencimiento: estado === "pagada" || estado === "omitida" ? null : (vence ?? null),
      ...resto,
    };
  }

  const recurrentes = [
    plantilla("arriendo", "Arriendo", 1_100_000n, { categoria: cat("Casa"), estado: "pagada", vence: "2026-11-01" }),
    plantilla("spotify", "Spotify", 16_900n, { cuentaOrigen: tarjeta, categoria: cat("Suscripciones"), estado: "pagada", vence: "2026-11-01" }),
    plantilla("enel", "Energía Enel", 84_320n, { variable: true, estado: "pagada", vence: "2026-11-03" }),
    plantilla("mama", "Abono a mamá", 100_000n, {
      tipo: "transferencia",
      cuentaOrigen: nequi,
      cuentaDestino: banco,
      categoria: null,
      estado: "pagada",
      vence: "2026-11-06",
    }),
    plantilla("parqueadero", "Parqueadero", 120_000n, { categoria: cat("Transporte"), estado: "omitida", vence: "2026-11-05" }),
    plantilla("seguro", "Seguro del carro", 210_000n, { categoria: cat("Transporte"), estado: "vencida", vence: "2026-11-09" }),
    plantilla("internet", "Internet Claro hogar", 89_900n, { estado: "por_confirmar", vence: "2026-11-12" }),
    plantilla("gas", "Gas Vanti", 32_400n, {
      variable: true,
      estimado: 31_870n,
      estado: "por_confirmar",
      vence: "2026-11-14",
      ultimoConfirmado: { monto: 31_870n, vencimiento: "2026-10-14" },
    }),
    plantilla("manejo", "Cuota de manejo", 26_990n, {
      cuentaOrigen: tarjeta,
      categoria: cat("Cargo del banco"),
      estado: "por_confirmar",
      vence: "2026-11-16",
    }),
    plantilla("apple", "Mensualidad Apple", 3_900n, {
      cuentaOrigen: tarjeta,
      categoria: cat("Suscripciones"),
      estado: "programada",
      vence: "2026-11-25",
    }),
    plantilla("salario", "Salario Andina SAS", 4_200_000n, {
      tipo: "ingreso",
      cuentaOrigen: null,
      cuentaDestino: banco,
      categoria: cat("Salario"),
      ultimoDia: true,
      estado: "programada",
      vence: "2026-11-30",
    }),
    plantilla("agua", "Acueducto EAAB", 41_860n, {
      variable: true,
      periodicidad: "bimestral",
      primerVencimiento: "2026-02-18",
      proximoVencimiento: "2026-12-18",
    }),
    plantilla("ingles", "Clases de inglés", 380_000n, {
      categoria: cat("Educación"),
      primerVencimiento: "2026-03-20",
      pausada: true,
      pausadaDesde: "2026-11-12",
    }),
  ];

  const ocurrencias = recurrentes.flatMap((r) => r.ocurrenciasDelMes);
  return {
    recurrentes,
    bandeja: ocurrencias.filter((o) => o.estado === "vencida" || o.estado === "por_confirmar"),
    ingresos: ocurrencias.filter((o) => o.recurrenteId.startsWith("salario")),
  };
}

const COMPROMETIDO = {
  total: 1_618_170n,
  pagado: { monto: 1_396_220n, cantidad: 5 },
  porConfirmar: { monto: 191_150n, cantidad: 4 },
  programado: { monto: 30_800n, cantidad: 2 },
};

function cuentaMuestra(id: string, nombre: string, tipo: Tipo, saldo: bigint): Cuenta {
  return {
    id,
    nombre,
    tipo,
    naturaleza: tipo === "tarjeta_credito" ? "pasivo" : "activo",
    detalle: null,
    saldo,
    saldoInicial: 0n,
    tarjeta: null,
    archivadaEn: null,
  };
}

const FORMULARIO_PLANTILLA: DatosFormulario = {
  captura: {
    fechaHoy: HOY_RECURRENTES,
    cuentaPredeterminadaId: "banco",
    categorias: {
      gasto: ["Servicios", "Casa", "Suscripciones", "Transporte", "Educación"].map((nombre) => ({
        id: nombre.toLowerCase(),
        nombre,
        tipo: "gasto" as const,
      })),
      ingreso: [{ id: "salario", nombre: "Salario", tipo: "ingreso" as const }],
    },
    gastosHoy: 0n,
    conceptosFrecuentes: { gasto: [], ingreso: [], transferencia: [] },
  },
  cuentas: [
    cuentaMuestra("banco", "Bancolombia", "banco", 3_284_300n),
    cuentaMuestra("nequi", "Nequi", "efectivo", 412_000n),
    cuentaMuestra("visa", "Visa Oro", "tarjeta_credito", 1_284_300n),
  ],
};

async function esperar(): Promise<void> {
  await new Promise((resolver) => setTimeout(resolver, 400));
}

const ACCIONES_BANDEJA: AccionesBandeja = {
  async confirmar(_id, _vencimiento, monto) {
    await esperar();
    return { ok: true, movimiento: { id: "muestra", monto: monto === undefined ? 89_900n : BigInt(monto) } };
  },
  async omitir() {
    await esperar();
    return { ok: true };
  },
  async deshacerConfirmacion() {
    await esperar();
    return { ok: true };
  },
  async deshacerOmision() {
    await esperar();
    return { ok: true };
  },
};

const ACCIONES_PLANTILLA: AccionesPlantilla = {
  async crear() {
    await esperar();
    return { ok: true };
  },
  async editar() {
    await esperar();
    return { ok: true };
  },
  async pausar() {
    await esperar();
    return { ok: false, codigo: "MUESTRA", mensaje: "En la muestra la pausa no se guarda." };
  },
  async eliminar() {
    await esperar();
    return { ok: true };
  },
};

function EtiquetaMuestra({ children }: { children: ReactNode }) {
  return <div className="mb-3 font-mono text-cifra-xs text-secundario">{children}</div>;
}

const NADA = () => {};

/**
 * Recurrentes: bandeja (normal, ajustando, aviso y vacía), comprometido,
 * plantillas con todos los estados del mes y el panel de plantilla.
 */
export function MuestraRecurrentes({ sufijo }: { sufijo: string }) {
  const [datos] = useState(() => datosRecurrentes(sufijo));
  const [panel, setPanel] = useState<"nueva" | "editar" | null>(null);
  const gas = datos.recurrentes.find((r) => r.id === `gas-${sufijo}`) as Recurrente;
  const pausada = datos.recurrentes.find((r) => r.pausada) as Recurrente;

  return (
    <div className="flex flex-col gap-12">
      <div className="grid grid-cols-1 gap-12 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div>
          <EtiquetaMuestra>Bandeja · normal, con una vencida (las acciones responden sin guardar)</EtiquetaMuestra>
          <BandejaRecurrentes
            fechaHoy={HOY_RECURRENTES}
            ventanaDias={7}
            bandeja={datos.bandeja}
            recurrentes={datos.recurrentes}
            acciones={ACCIONES_BANDEJA}
          />
        </div>
        <div>
          <EtiquetaMuestra>Comprometido del mes · total, barra, grupos e ingreso esperado</EtiquetaMuestra>
          <ComprometidoMes mes="2026-11" comprometido={COMPROMETIDO} ingresosEsperados={datos.ingresos} recurrentes={datos.recurrentes} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="@container">
          <EtiquetaMuestra>Bandeja · aviso tras confirmar y fila ajustando el importe</EtiquetaMuestra>
          <AvisoBandeja
            texto={
              <>
                Gas Vanti confirmado con <CifraAviso>35.120</CifraAviso>. Ya cuenta en Bancolombia.
              </>
            }
            alDeshacer={NADA}
            deshaciendo={false}
          />
          <ul>
            <FilaBandeja
              o={gas.ocurrenciasDelMes[0]}
              r={gas}
              fechaHoy={HOY_RECURRENTES}
              ajuste={{ clave: "gas", valor: "35.120", error: null }}
              error={null}
              ocupado={false}
              enfocar={false}
              alConfirmar={NADA}
              alAjustar={NADA}
              alOmitir={NADA}
              alCambiarAjuste={NADA}
              alEnviarAjuste={NADA}
              alCancelarAjuste={NADA}
            />
          </ul>
        </div>
        <div>
          <EtiquetaMuestra>Bandeja · vacía</EtiquetaMuestra>
          <BandejaRecurrentes fechaHoy={HOY_RECURRENTES} ventanaDias={7} bandeja={[]} recurrentes={[]} acciones={ACCIONES_BANDEJA} />
        </div>
      </div>

      <div>
        <EtiquetaMuestra>Plantillas · pagado, omitido, vencido, por confirmar, programado, próximo y pausada</EtiquetaMuestra>
        <ListaPlantillas recurrentes={datos.recurrentes} mes="2026-11" />
      </div>

      <div>
        <EtiquetaMuestra>Panel de plantilla · alta y edición de una pausada</EtiquetaMuestra>
        <div className="flex flex-wrap gap-3">
          <Boton variante="secundario" onClick={() => setPanel("nueva")}>
            Nueva plantilla
          </Boton>
          <Boton variante="secundario" onClick={() => setPanel("editar")}>
            Editar {pausada.concepto}
          </Boton>
        </div>
        {panel && (
          <PanelPlantilla
            recurrente={panel === "editar" ? pausada : null}
            fechaHoy={HOY_RECURRENTES}
            formulario={FORMULARIO_PLANTILLA}
            acciones={ACCIONES_PLANTILLA}
            alCerrar={() => setPanel(null)}
          />
        )}
      </div>
    </div>
  );
}
