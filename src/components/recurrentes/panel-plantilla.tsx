"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { admiteGastoIngreso } from "@/domain/cuenta/naturaleza";
import { formatearFechaSinAnio } from "@/domain/fecha/formato";
import {
  cambiaCalendario,
  cuerpoDesdeValores,
  hayCambios,
  permiteUltimoDia,
  VALORES_ALTA,
  valoresDesdePlantilla,
  type CampoPlantilla,
  type ValoresPlantilla,
} from "@/domain/recurrente/formulario";
import { PERIODICIDADES, type Periodicidad, type Recurrente, type RecurrenteCuerpo, type Ref } from "@/domain/recurrente/tipos";
import { diaDeVencimiento, formatearCada, notaVencimiento } from "@/domain/recurrente/vencimiento";
import type { TipoMovimiento } from "@/domain/movimiento/cuerpo";
import type { DatosCaptura } from "@/services/captura";
import { BloqueEliminar } from "../bloque-eliminar";
import { Boton } from "../boton";
import { CampoMonto } from "../campo-monto";
import { CampoSubrayado } from "../campo-subrayado";
import { FichaCuenta } from "../captura/ficha-cuenta";
import { SelectorTipo } from "../captura/selector-tipo";
import { ChipCategoria } from "../chip-categoria";
import { MensajeError } from "../mensaje-error";
import { OpcionUnica } from "../opcion-unica";
import { PanelLateral, type ControlPanel } from "../panel-lateral";

type Fallo = { ok: false; codigo: string; mensaje: string };

/** Server actions; llegan por prop desde la página (los componentes no importan `app/`). */
export type AccionesPlantilla = {
  crear: (cuerpo: RecurrenteCuerpo) => Promise<{ ok: true } | (Fallo & { campo?: CampoPlantilla })>;
  editar: (id: string, cuerpo: RecurrenteCuerpo) => Promise<{ ok: true } | (Fallo & { campo?: CampoPlantilla })>;
  pausar: (id: string, pausada: boolean) => Promise<{ ok: true; recurrente: Recurrente } | Fallo>;
  eliminar: (id: string) => Promise<{ ok: true } | Fallo>;
};

/** Categorías (`GET /captura`) y cuentas activas (`GET /cuentas`) del formulario. */
export type DatosFormulario = DatosCaptura;

type Props = {
  /** `null`: alta. Con plantilla: edición, pausa y borrado. */
  recurrente: Recurrente | null;
  /** Hoy según la API: defecto y `min` del primer vencimiento en el alta. */
  fechaHoy: string;
  /** `null` si no se pudo cargar. */
  formulario: DatosFormulario | null;
  acciones: AccionesPlantilla;
  /** Tras la salida de la hoja. Por defecto, quita `?plantilla=` de la URL (en `/estilos`, cierra la muestra). */
  alCerrar?: () => void;
};

type Errores = Partial<Record<CampoPlantilla, string>>;

const MENSAJE_MONTO = "Escribe un valor en pesos, sin decimales.";
const AVISO_CALENDARIO =
  "Cambiar la periodicidad o el primer vencimiento reinicia el calendario: lo que esté por confirmar antes de esa fecha desaparece.";
const DETALLE_ELIMINAR = "Se borra la plantilla y lo que tenía por confirmar. Los movimientos ya confirmados se quedan.";
const ID_FORMULARIO = "formulario-plantilla";
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const OPCIONES_CADA = PERIODICIDADES.map((p) => ({ valor: p, rotulo: formatearCada(p) }));
const OPCIONES_IMPORTE = [
  { valor: "fijo", rotulo: "Fijo" },
  { valor: "variable", rotulo: "Variable · se estima con el último confirmado" },
] as const;

const RUTA = "/recurrentes";

/**
 * Panel de alta y edición de una plantilla, armado con piezas que ya existen
 * (captura y cuentas). Formulario controlado: un fallo nunca reinicia lo
 * escrito. En edición añade pausar o reanudar y eliminar.
 */
export function PanelPlantilla({ recurrente, fechaHoy, formulario, acciones, alCerrar }: Props) {
  const router = useRouter();
  const panel = useRef<ControlPanel>(null);
  const esAlta = recurrente === null;
  const [iniciales] = useState<ValoresPlantilla>(() =>
    recurrente
      ? valoresDesdePlantilla(recurrente)
      : { ...VALORES_ALTA(fechaHoy), cuentaOrigenId: formulario?.captura.cuentaPredeterminadaId ?? null },
  );
  const [valores, setValores] = useState<ValoresPlantilla>(iniciales);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [pausa, setPausa] = useState({ pausada: recurrente?.pausada ?? false, desde: recurrente?.pausadaDesde ?? null });
  const [errorPausa, setErrorPausa] = useState<string | null>(null);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [errorBorrado, setErrorBorrado] = useState<string | null>(null);
  const [accion, setAccion] = useState<"guardar" | "pausar" | "eliminar" | null>(null);
  const [pendiente, iniciar] = useTransition();

  const conCambios = hayCambios(iniciales, valores);
  const esTransferencia = valores.tipo === "transferencia";
  const fechaValida = FECHA.test(valores.primerVencimiento);

  /** Retira la hoja y después quita `?plantilla=` de la URL, que la desmonta. */
  async function cerrar() {
    await panel.current?.cerrar();
    if (alCerrar) alCerrar();
    else router.replace(RUTA, { scroll: false });
  }

  function solicitarCierre() {
    if (pendiente) return;
    if (conCambios) setConfirmandoDescarte(true);
    else void cerrar();
  }

  function cambiar<C extends keyof ValoresPlantilla>(campo: C, valor: ValoresPlantilla[C]) {
    setValores((actual) => ({ ...actual, [campo]: valor }));
    const campoError: CampoPlantilla | null =
      campo === "cuentaOrigenId" ? "cuentaOrigen" : campo === "cuentaDestinoId" ? "cuentaDestino" : campo === "categoriaId" ? "categoria" : campo === "variable" ? null : (campo as CampoPlantilla);
    if (campoError) setErrores((actual) => (actual[campoError] ? { ...actual, [campoError]: undefined } : actual));
  }

  /**
   * Al cambiar de tipo, la cuenta elegida pasa al rol que el tipo usa (gasto:
   * origen; ingreso: destino) y una categoría del otro tipo se descarta. Lo
   * que no aplica lo limpia `cuerpoDesdeValores` al enviar.
   */
  function cambiarTipo(tipo: TipoMovimiento) {
    setValores((actual) => {
      const nuevos = { ...actual, tipo };
      if (tipo === "ingreso" && nuevos.cuentaDestinoId === null) nuevos.cuentaDestinoId = actual.cuentaOrigenId;
      if (tipo === "gasto" && nuevos.cuentaOrigenId === null) nuevos.cuentaOrigenId = actual.cuentaDestinoId;
      const categorias = tipo === "transferencia" ? [] : (formulario?.captura.categorias[tipo] ?? []);
      if (!categorias.some((c) => c.id === nuevos.categoriaId)) nuevos.categoriaId = null;
      return nuevos;
    });
    setErrores({});
  }

  function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente) return;
    setErrorGeneral(null);

    const cuerpo = cuerpoDesdeValores(valores);
    if (cuerpo === null) {
      setErrores({ monto: MENSAJE_MONTO });
      return;
    }
    if (recurrente && !conCambios) {
      // Nada cambió: sin petición.
      void cerrar();
      return;
    }

    setErrores({});
    setAccion("guardar");
    iniciar(async () => {
      const resultado = recurrente ? await acciones.editar(recurrente.id, cuerpo) : await acciones.crear(cuerpo);
      if (resultado.ok) {
        await cerrar();
      } else if (resultado.campo) {
        setErrores({ [resultado.campo]: resultado.mensaje });
      } else {
        setErrorGeneral(resultado.mensaje);
      }
      setAccion(null);
    });
  }

  function alternarPausa() {
    if (!recurrente || pendiente) return;
    setErrorPausa(null);
    setAccion("pausar");
    iniciar(async () => {
      const resultado = await acciones.pausar(recurrente.id, !pausa.pausada);
      if (resultado.ok) setPausa({ pausada: resultado.recurrente.pausada, desde: resultado.recurrente.pausadaDesde });
      else setErrorPausa(resultado.mensaje);
      setAccion(null);
    });
  }

  function eliminar() {
    if (!recurrente || pendiente) return;
    setErrorBorrado(null);
    setAccion("eliminar");
    iniciar(async () => {
      const resultado = await acciones.eliminar(recurrente.id);
      if (resultado.ok) await cerrar();
      else setErrorBorrado(resultado.mensaje);
      setAccion(null);
    });
  }

  const guardando = pendiente && accion === "guardar";
  const etiquetaGuardar = esAlta ? (guardando ? "Creando…" : "Crear plantilla") : guardando ? "Guardando…" : "Guardar cambios";
  const avisoCalendario = !esAlta && cambiaCalendario(iniciales, valores);

  const pie = (
    <div className="flex flex-col gap-3">
      {avisoCalendario && !confirmandoDescarte && <p className="text-etiqueta font-normal text-secundario">{AVISO_CALENDARIO}</p>}
      {confirmandoDescarte ? (
        <div role="group" aria-label="Descartar los cambios" className="flex flex-col gap-3">
          <p className="text-cuerpo font-semibold">¿Descartar los cambios?</p>
          <div className="flex flex-wrap items-center gap-3">
            <Boton onClick={() => void cerrar()}>Descartar</Boton>
            <Boton variante="texto" onClick={() => setConfirmandoDescarte(false)}>
              Seguir editando
            </Boton>
          </div>
        </div>
      ) : (
        <Boton type="submit" form={ID_FORMULARIO} disabled={pendiente || formulario === null} className="w-full justify-center">
          {etiquetaGuardar}
        </Boton>
      )}
      {errorGeneral && <MensajeError mensaje={errorGeneral} />}

      {recurrente && (
        <div className="mt-1 border-t border-linea pt-3">
          {confirmandoBorrado ? (
            <BloqueEliminar
              nombre="plantilla"
              detalle={DETALLE_ELIMINAR}
              alConfirmar={eliminar}
              alCancelar={() => {
                setConfirmandoBorrado(false);
                setErrorBorrado(null);
              }}
              pendiente={pendiente && accion === "eliminar"}
              error={errorBorrado}
            />
          ) : (
            <div className="flex flex-wrap items-center gap-x-1">
              <Boton variante="texto" onClick={alternarPausa} disabled={pendiente} className="h-11">
                {pendiente && accion === "pausar"
                  ? pausa.pausada
                    ? "Reanudando…"
                    : "Pausando…"
                  : pausa.pausada
                    ? "Reanudar plantilla"
                    : "Pausar plantilla"}
              </Boton>
              <span aria-hidden className="text-terciario">
                ·
              </span>
              <button
                type="button"
                onClick={() => setConfirmandoBorrado(true)}
                disabled={pendiente}
                className="h-11 px-1 text-etiqueta font-normal text-secundario hover:text-texto disabled:cursor-not-allowed"
              >
                Eliminar plantilla…
              </button>
            </div>
          )}
          {errorPausa && <MensajeError mensaje={errorPausa} />}
        </div>
      )}
    </div>
  );

  return (
    <PanelLateral
      ref={panel}
      titulo={esAlta ? "Nueva plantilla" : "Editar plantilla"}
      ancho="amplio"
      alSolicitarCierre={solicitarCierre}
      pie={pie}
    >
      {pausa.pausada && (
        <p className="mb-6 border-b border-linea pb-4 text-cuerpo text-secundario">
          Pausada desde {pausa.desde ? formatearFechaSinAnio(pausa.desde) : "—"}. No genera ocurrencias nuevas.
        </p>
      )}

      {formulario === null ? (
        <div role="alert" className="flex flex-col items-start gap-4">
          <p className="text-cuerpo font-semibold">No pudimos cargar el formulario.</p>
          <Boton variante="secundario" onClick={() => router.refresh()}>
            Reintentar
          </Boton>
        </div>
      ) : (
        <form id={ID_FORMULARIO} onSubmit={guardar} noValidate className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <div className="hidden md:block">
              <SelectorTipo valor={valores.tipo} alCambiar={cambiarTipo} />
            </div>
            <div className="md:hidden">
              <SelectorTipo valor={valores.tipo} alCambiar={cambiarTipo} variante="pestanas" />
            </div>
            {errores.tipo && <MensajeError mensaje={errores.tipo} />}
          </div>

          <CampoSubrayado
            etiqueta="Concepto"
            name="concepto"
            autoComplete="off"
            maxLength={80}
            value={valores.concepto}
            onChange={(e) => cambiar("concepto", e.target.value)}
            error={errores.concepto}
            placeholder="Internet Claro hogar"
          />

          <CampoMonto
            valor={valores.monto}
            moneda="COP"
            etiqueta="Importe"
            signo={valores.tipo === "gasto" ? "salida" : valores.tipo === "ingreso" ? "entrada" : undefined}
            editable={{ nombre: "plantilla-monto", alCambiar: (v) => cambiar("monto", v), error: errores.monto }}
          />

          <OpcionUnica
            nombre="plantilla-variable"
            etiqueta="Importe"
            opciones={OPCIONES_IMPORTE}
            valor={valores.variable ? "variable" : "fijo"}
            alCambiar={(v) => cambiar("variable", v === "variable")}
          />

          <OpcionUnica
            nombre="plantilla-periodicidad"
            etiqueta="Cada"
            opciones={OPCIONES_CADA}
            valor={valores.periodicidad}
            alCambiar={(p: Periodicidad) => cambiar("periodicidad", p)}
            error={errores.periodicidad}
          />

          <div className="flex flex-col gap-2">
            <CampoSubrayado
              etiqueta="Primer vencimiento"
              name="primerVencimiento"
              type="date"
              required
              min={esAlta ? fechaHoy : undefined}
              value={valores.primerVencimiento}
              onChange={(e) => cambiar("primerVencimiento", e.target.value)}
              error={errores.primerVencimiento}
            />
            {fechaValida && !permiteUltimoDia(valores.periodicidad) && (
              <p className="text-etiqueta font-normal text-secundario">{notaVencimiento(valores)}</p>
            )}
          </div>

          {permiteUltimoDia(valores.periodicidad) && (
            <div className="flex flex-col gap-2">
              <OpcionUnica
                nombre="plantilla-dia"
                etiqueta="Día"
                opciones={[
                  { valor: "dia", rotulo: fechaValida ? `Día ${diaDeVencimiento(valores.primerVencimiento)} de cada mes` : "Día de cada mes" },
                  { valor: "ultimo", rotulo: "Último día de cada mes" },
                ]}
                valor={valores.ultimoDia ? "ultimo" : "dia"}
                alCambiar={(v) => cambiar("ultimoDia", v === "ultimo")}
                error={errores.ultimoDia}
              />
              {fechaValida && <p className="text-etiqueta font-normal text-secundario">{notaVencimiento(valores)}</p>}
            </div>
          )}

          {esTransferencia ? (
            <>
              <GrupoCuentas
                etiqueta="Desde"
                cuentas={formulario.cuentas}
                elegida={valores.cuentaOrigenId}
                guardada={recurrente?.cuentaOrigen ?? null}
                alElegir={(id) => cambiar("cuentaOrigenId", id)}
                error={errores.cuentaOrigen}
              />
              <GrupoCuentas
                etiqueta="Hacia"
                cuentas={formulario.cuentas}
                elegida={valores.cuentaDestinoId}
                guardada={recurrente?.cuentaDestino ?? null}
                alElegir={(id) => cambiar("cuentaDestinoId", id)}
                error={errores.cuentaDestino}
              />
            </>
          ) : valores.tipo === "gasto" ? (
            <GrupoCuentas
              etiqueta="Cuenta"
              cuentas={formulario.cuentas}
              elegida={valores.cuentaOrigenId}
              guardada={recurrente?.cuentaOrigen ?? null}
              alElegir={(id) => cambiar("cuentaOrigenId", id)}
              error={errores.cuentaOrigen ?? errores.cuentaDestino}
            />
          ) : (
            <GrupoCuentas
              etiqueta="Cuenta"
              cuentas={formulario.cuentas}
              elegida={valores.cuentaDestinoId}
              guardada={recurrente?.cuentaDestino ?? null}
              alElegir={(id) => cambiar("cuentaDestinoId", id)}
              error={errores.cuentaDestino ?? errores.cuentaOrigen}
            />
          )}

          {valores.tipo !== "transferencia" && (
            <div className="flex flex-col gap-2">
              <span className="text-etiqueta text-secundario">Categoría</span>
              <div role="group" aria-label="Categoría" className="flex flex-wrap gap-2">
                {formulario.captura.categorias[valores.tipo].map((c) => (
                  <ChipCategoria
                    key={c.id}
                    etiqueta={c.nombre}
                    seleccionada={valores.categoriaId === c.id}
                    onClick={() => cambiar("categoriaId", c.id)}
                  />
                ))}
                <ChipCategoria
                  etiqueta="Sin categoría"
                  estado={valores.categoriaId === null ? "normal" : "sin-clasificar"}
                  seleccionada={valores.categoriaId === null}
                  onClick={() => cambiar("categoriaId", null)}
                />
              </div>
              {errores.categoria && <MensajeError mensaje={errores.categoria} />}
            </div>
          )}
        </form>
      )}
    </PanelLateral>
  );
}

type PropsGrupo = {
  etiqueta: string;
  cuentas: DatosFormulario["cuentas"];
  elegida: string | null;
  /** La cuenta que la plantilla tiene guardada: si está archivada no viene en `cuentas`. */
  guardada: Ref | null;
  alElegir: (id: string) => void;
  error?: string;
};

/**
 * Fichas de cuenta, dos por fila. Una cuenta archivada de la plantilla se
 * muestra con su nombre y elegida. Las inversiones no admiten recurrentes
 * (`CUENTA_DE_INVERSION`): no se ofrecen.
 */
function GrupoCuentas({ etiqueta, cuentas: todas, elegida, guardada, alElegir, error }: PropsGrupo) {
  const cuentas = todas.filter((c) => admiteGastoIngreso(c.tipo));
  const archivada = guardada && !todas.some((c) => c.id === guardada.id) ? guardada : null;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-etiqueta text-secundario">{etiqueta}</span>
      <div role="group" aria-label={etiqueta} className="grid grid-cols-2 gap-2">
        {cuentas.map((cuenta) => (
          <FichaCuenta key={cuenta.id} cuenta={cuenta} elegida={cuenta.id === elegida} alPulsar={() => alElegir(cuenta.id)} />
        ))}
        {archivada && (
          <FichaCuenta cuenta={{ nombre: archivada.nombre }} elegida={archivada.id === elegida} alPulsar={() => alElegir(archivada.id)} />
        )}
      </div>
      {error && <MensajeError mensaje={error} />}
    </div>
  );
}
