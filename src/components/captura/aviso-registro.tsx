import { Check } from "lucide-react";
import { formatearDinero, type Moneda } from "@/domain/dinero/formato";
import type { TipoMovimiento } from "@/domain/movimiento/cuerpo";
import { importeEnPatrimonio } from "@/domain/movimiento/vista-previa";
import { Boton } from "../boton";
import { MensajeError } from "../mensaje-error";

const ROTULO_TIPO: Record<TipoMovimiento, string> = { gasto: "Gasto", ingreso: "Ingreso", transferencia: "Transferencia", ajuste: "Ajuste" };

export type DatosAviso = {
  tipo: TipoMovimiento;
  /** Siempre positivo, en `moneda`. */
  monto: bigint;
  /** Solo en un ajuste: sube el saldo (trae `cuentaDestino`). */
  ajusteSube?: boolean;
  /** La del monto: COP salvo una transferencia desde una inversión en dólares. */
  moneda?: Moneda;
  descripcion: string | null;
  /** «Nequi»; en transferencia, «Nequi → Visa Oro». */
  cuenta: string;
  /** «Registrado» (captura), «Guardado» o «Eliminado» (edición). */
  verbo?: string;
  /** Tras el texto: « · ahora en Octubre 2026» si una edición lo cambió de mes. */
  sufijo?: string;
  /** Sin él no hay «Deshacer» (la edición y el borrado no se deshacen). */
  alDeshacer?: () => void;
  deshaciendo?: boolean;
  error?: string | null;
};

export type DatosOferta = {
  /** «¿Siempre «peluquería» → Hogar?». */
  pregunta: string;
  /** «Crear regla» o «Cambiar regla». */
  accion: string;
  alAceptar: () => void;
  alRechazar: () => void;
  pendiente: boolean;
  error?: string | null;
};

type Props = {
  /** `panel`: escritorio, una línea con «Registrado: …». `hoja`: móvil, compacto, sobre el botón. */
  formato?: "panel" | "hoja";
  aviso?: DatosAviso | null;
  oferta?: DatosOferta | null;
};

/** Importe con signo y color desde el patrimonio: gasto −, ingreso +, transferencia sin signo. */
function Importe({ tipo, monto, moneda = "COP", ajusteSube }: { tipo: TipoMovimiento; monto: bigint; moneda?: Moneda; ajusteSube?: boolean }) {
  const efecto = importeEnPatrimonio(tipo, monto, ajusteSube);
  const cifra = formatearDinero({ monto: efecto ?? monto, moneda }, { omitirCOP: true, signoMas: efecto !== null });
  const color = efecto === null ? "" : efecto < 0n ? "text-salida-texto" : "text-entrada-texto";
  return <span className={`whitespace-nowrap font-mono text-cifra-s tabular-nums ${color}`}>{cifra}</span>;
}

/**
 * Aviso tras registrar: «Registrado: …» con «Deshacer» durante 5 s y, si
 * aplica, la oferta de crear o ajustar la regla (RN-11), que sigue hasta que
 * el usuario responde o registra otro. Sin sombra: borde de renglón.
 */
export function AvisoRegistro({ formato = "panel", aviso, oferta }: Props) {
  if (!aviso && !oferta) return null;
  const enHoja = formato === "hoja";

  return (
    <div
      role="status"
      className={`flex flex-col rounded-campo border border-linea ${enHoja ? "bg-superficie" : "bg-fondo"}`}
    >
      {aviso && (
        <div className="flex flex-col pl-3">
          <div className="flex min-h-11 items-center gap-3">
            <span className="flex text-entrada">
              <Check size={16} strokeWidth={1.5} aria-hidden />
            </span>
            {enHoja ? (
              <>
                <span className="min-w-0 flex-1 truncate text-cuerpo">
                  {aviso.descripcion ?? ROTULO_TIPO[aviso.tipo]} · {aviso.cuenta}
                </span>
                <Importe tipo={aviso.tipo} monto={aviso.monto} moneda={aviso.moneda} ajusteSube={aviso.ajusteSube} />
              </>
            ) : (
              <span className={`min-w-0 flex-1 text-cuerpo ${aviso.alDeshacer ? "" : "py-2 pr-3"}`}>
                {aviso.verbo ?? "Registrado"}: {aviso.descripcion ?? ROTULO_TIPO[aviso.tipo]}{" "}
                <Importe tipo={aviso.tipo} monto={aviso.monto} moneda={aviso.moneda} ajusteSube={aviso.ajusteSube} /> en {aviso.cuenta}
                {aviso.sufijo}
              </span>
            )}
            {aviso.alDeshacer && (
              <Boton compacto variante="texto" onClick={aviso.alDeshacer} disabled={aviso.deshaciendo} className="shrink-0 px-3">
                {aviso.deshaciendo ? "Deshaciendo…" : "Deshacer"}
              </Boton>
            )}
          </div>
          {aviso.error && <MensajeError mensaje={aviso.error} className="pr-3 pb-2" />}
        </div>
      )}
      {oferta && (
        <div className={`flex flex-col pl-3 ${aviso ? "border-t border-linea" : ""}`}>
          <div className="flex min-h-11 flex-wrap items-center gap-x-3">
            <span className="min-w-0 flex-1 py-2 text-etiqueta text-secundario">{oferta.pregunta}</span>
            <span className="flex shrink-0 items-center">
              <Boton compacto variante="texto" onClick={oferta.alAceptar} disabled={oferta.pendiente} className="px-2">
                {oferta.pendiente ? "Guardando…" : oferta.accion}
              </Boton>
              <span aria-hidden className="text-terciario">
                ·
              </span>
              <Boton compacto variante="texto" onClick={oferta.alRechazar} disabled={oferta.pendiente} className="px-3">
                No
              </Boton>
            </span>
          </div>
          {oferta.error && <MensajeError mensaje={oferta.error} className="pr-3 pb-2" />}
        </div>
      )}
    </div>
  );
}
