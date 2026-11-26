"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { diferenciaPrevia, fechaCorta, montoConSigno, validarSaldoReal } from "@/domain/cuenta/detalle";
import { Boton } from "../boton";
import { CampoMonto } from "../campo-monto";
import { Casilla } from "../casilla";
import { MensajeError } from "../mensaje-error";
import { PanelLateral, type ControlPanel } from "../panel-lateral";
import { llamarAccion } from "./sin-conexion";

export type ResultadoAjuste = { ok: true } | { ok: false; codigo: string; mensaje: string; campo?: "saldoReal" };

type Props = {
  cuenta: { id: string; tipo: "efectivo" | "banco" };
  historial: { fechaHoy: string; saldo: bigint; saldoHoy: bigint };
  /** El detalle, conservando el rango. */
  rutaCierre: string;
  /** Server action: `POST /cuentas/:id/ajustes`. */
  registrar: (id: string, saldoReal: string, conciliarHastaHoy: boolean) => Promise<ResultadoAjuste>;
  /** En vez de navegar a `rutaCierre` al cerrar (muestra de `/estilos`). */
  alCerrar?: () => void;
};

/** Errores que van bajo el campo aunque la API no traiga `campo`. */
const DEL_CAMPO = new Set(["MONTO_INVALIDO", "SIN_DIFERENCIA"]);

/**
 * «Ajustar saldo» (SPEC 13, `?ajuste=1`), en `PanelLateral` (hoja inferior
 * en móvil). El usuario cuenta lo que tiene y escribe el total; la vista
 * previa resta el saldo a hoy (sin programados, N-25) y la API fija la
 * diferencia al registrar. Nada es optimista: espera la respuesta.
 */
export function PanelAjuste({ cuenta, historial, rutaCierre, registrar, alCerrar }: Props) {
  const router = useRouter();
  const panel = useRef<ControlPanel>(null);
  const [texto, setTexto] = useState("");
  const [conciliar, setConciliar] = useState(true);
  const [errorCampo, setErrorCampo] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);
  const enCurso = useRef(false);

  const validacion = texto.trim() === "" ? null : validarSaldoReal(texto);
  const diferencia = validacion && "valor" in validacion ? diferenciaPrevia(validacion.valor, historial.saldoHoy) : null;
  const errorLocal = validacion && "error" in validacion ? validacion.error : null;
  const puedeRegistrar = diferencia !== null && diferencia !== 0n && !enviando;
  const lugar = cuenta.tipo === "efectivo" ? "la billetera" : "la cuenta";
  const colorDiferencia = diferencia === null || diferencia === 0n ? "text-secundario" : diferencia > 0n ? "text-entrada-texto" : "text-salida-texto";
  const textoDiferencia = montoConSigno(diferencia ?? 0n);

  async function cerrar() {
    await panel.current?.cerrar();
    if (alCerrar) alCerrar();
    else router.replace(rutaCierre, { scroll: false });
  }

  function solicitarCierre() {
    if (enviando) return;
    if (texto.trim() !== "") setConfirmandoDescarte(true);
    else void cerrar();
  }

  async function enviar(evento?: FormEvent<HTMLFormElement>) {
    evento?.preventDefault();
    if (enCurso.current || !puedeRegistrar || !validacion || !("valor" in validacion)) return;
    enCurso.current = true;
    setEnviando(true);
    setErrorCampo(null);
    setErrorGeneral(null);
    setConfirmandoDescarte(false);
    const saldoReal = validacion.valor.toString();
    const resultado = await llamarAccion(() => registrar(cuenta.id, saldoReal, conciliar));
    enCurso.current = false;
    setEnviando(false);
    if (resultado.ok) {
      await cerrar();
      return;
    }
    if (resultado.campo === "saldoReal" || DEL_CAMPO.has(resultado.codigo)) setErrorCampo(resultado.mensaje);
    else setErrorGeneral(resultado.mensaje);
    if (resultado.codigo === "CUENTA_ARCHIVADA") router.refresh();
  }

  const pie = (
    <div className="flex flex-col gap-3">
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
        <div className="flex flex-wrap items-center gap-3">
          <Boton type="submit" form="panel-ajuste" disabled={!puedeRegistrar} className="flex-1 justify-center md:flex-none">
            {enviando ? "Registrando…" : "Registrar ajuste"}
          </Boton>
          <Boton variante="texto" onClick={solicitarCierre} disabled={enviando}>
            Cancelar
          </Boton>
        </div>
      )}
      {errorGeneral && <MensajeError mensaje={errorGeneral} />}
    </div>
  );

  return (
    <PanelLateral ref={panel} titulo="Ajustar saldo" alSolicitarCierre={solicitarCierre} pie={pie}>
      <form id="panel-ajuste" onSubmit={(e) => void enviar(e)} noValidate className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-cuerpo">Cuenta lo que tienes en {lugar} y escribe el total.</p>
          <p className="text-etiqueta font-normal text-secundario">Tino registra la diferencia como un ajuste aparte.</p>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-etiqueta font-normal text-secundario">Saldo en Tino</span>
            <span className="font-mono text-cifra-m tabular-nums">{montoConSigno(historial.saldoHoy, false)}</span>
          </div>
          {historial.saldo !== historial.saldoHoy && (
            <p className="text-etiqueta font-normal text-secundario">Sin los movimientos programados.</p>
          )}
        </div>

        <CampoMonto
          valor={texto}
          moneda="COP"
          etiqueta="Saldo real contado"
          editable={{
            nombre: "saldo-real",
            alCambiar: (v) => {
              setTexto(v);
              setErrorCampo(null);
              setErrorGeneral(null);
            },
            error: errorLocal ?? errorCampo ?? undefined,
            admiteComa: true,
          }}
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-etiqueta font-normal text-secundario">Diferencia</span>
            <span className={`font-mono text-cifra-m tabular-nums ${colorDiferencia}`}>{textoDiferencia}</span>
          </div>
          <p className="text-etiqueta">
            <span className="font-normal text-secundario">Se registrará </span>
            {fechaCorta(historial.fechaHoy, historial.fechaHoy)} · Ajuste de saldo ·{" "}
            <span className="font-mono text-cifra-xs tabular-nums">{textoDiferencia}</span>
          </p>
          <p className="text-etiqueta font-normal text-secundario">No cuenta como ingreso ni gasto en el resumen.</p>
        </div>

        <Casilla nombre="conciliar-hasta-hoy" rotulo="Marcar todo como conciliado hasta hoy" marcada={conciliar} alCambiar={setConciliar} />
      </form>
    </PanelLateral>
  );
}
