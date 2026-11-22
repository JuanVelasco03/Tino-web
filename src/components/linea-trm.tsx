import { ArrowLeftRight } from "lucide-react";
import { formatearTasa } from "@/domain/dinero/formato";
import { formatearFecha } from "@/domain/fecha/formato";
import { textoTrm } from "@/domain/inversion/presentacion";
import type { Trm, TrmVigente } from "@/domain/inversion/tipos";

type Props = {
  trm: Trm | null;
  desactualizada: boolean;
  /** «TRM aplicada …» (detalle de una inversión) o «TRM de hoy …» (día uno). */
  prefijo?: "aplicada" | "hoy";
  className?: string;
};

/**
 * Línea de la TRM (REGLAS §6): icono de tasa de 16 px, la cifra en mono tinta
 * y el resto en `etiqueta` secundaria. Desactualizada o sin TRM, todo en
 * `marca-texto`: es un estado degradado, no un error.
 */
export function LineaTrm({ trm, desactualizada, prefijo = "aplicada", className = "" }: Props) {
  const t = textoTrm(trm, desactualizada, prefijo);
  const tono = t.aviso ? "text-marca-texto" : "text-secundario";
  return (
    <p className={`flex items-start gap-2 text-etiqueta ${tono} ${className}`}>
      <ArrowLeftRight size={16} strokeWidth={1.5} aria-hidden className="mt-px shrink-0" />
      <span className="min-w-0">
        {t.antes}
        {t.cifra && <span className="font-mono text-cifra-xs tabular-nums text-texto">{t.cifra}</span>}
        {t.despues}
      </span>
    </p>
  );
}

/**
 * «TRM de referencia» al pie del menú lateral y de la hoja «Más» (N-01): la
 * cifra en mono cifra-s y la fecha de vigencia debajo. Desactualizada, la
 * fecha dice «· sin actualizar» en `marca-texto`; sin TRM, «Sin TRM».
 */
export function TrmReferencia({ trm, className = "" }: { trm: TrmVigente; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-etiqueta font-normal text-secundario">TRM de referencia</span>
      {trm.trm ? (
        <>
          <span className="font-mono text-cifra-s tabular-nums">{formatearTasa(trm.trm.valor)} COP</span>
          <span className={`text-etiqueta font-normal ${trm.desactualizada ? "text-marca-texto" : "text-secundario"}`}>
            {formatearFecha(trm.trm.vigenteDesde)}
            {trm.desactualizada && " · sin actualizar"}
          </span>
        </>
      ) : (
        <span className="text-etiqueta font-normal text-marca-texto">Sin TRM</span>
      )}
    </div>
  );
}
