"use client";

import { useRef, useState } from "react";
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
import { VistaDiaUno } from "@/components/resumen/dia-uno";
import { desdeMonto, formatearEntradaPesos } from "@/domain/dinero/entrada";
import type { TipoMovimiento } from "@/domain/movimiento/cuerpo";
import { errorPartes, restante, type ValorParte } from "@/domain/movimiento/partes";
import { saldoResultante } from "@/domain/movimiento/vista-previa";

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
