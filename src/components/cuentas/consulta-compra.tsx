"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CircleHelp, X } from "lucide-react";
import { textoCompra, type Ciclo, type Compra } from "@/domain/cuenta/tarjeta";
import { aDigitos } from "@/domain/dinero/entrada";
import { CampoMonto } from "../campo-monto";

export type ResultadoCompra = { ok: true; compra: Compra | null } | { ok: false; codigo: string; mensaje: string };

type Props = {
  cuentaId: string;
  fechaHoy: string;
  ciclo: Pick<Ciclo, "corte" | "pagoLimite"> | null;
  disponible: bigint;
  /** La compra vigente (`null`: sin valor). La página la comparte con `ResumenTarjeta`. */
  compra: Compra | null;
  alCambiarCompra: (compra: Compra | null) => void;
  /** Server action: `GET /cuentas/:id/ciclo?compra=`. */
  consultar: (id: string, monto: string) => Promise<ResultadoCompra>;
  /** `id` del campo (dos consultas en `/estilos`). */
  nombre?: string;
};

/** Espera tras la última tecla antes de consultar. */
const ESPERA_MS = 300;
const SIN_RED = "No pudimos consultar. Intenta de nuevo.";

/**
 * «¿Puedo comprar esto?» (SPEC 13). Cada cambio del monto, tras 300 ms,
 * consulta a la API (server action, sin recargar la página); una respuesta
 * vieja que llega tarde se descarta (contador). Vacío o 0: la invitación,
 * sin llamada. ✓ si cabe, ✕ si no, ? sin valor. Todas las cifras de la API.
 */
export function ConsultaCompra({ cuentaId, fechaHoy, ciclo, disponible, compra, alCambiarCompra, consultar, nombre = "compra" }: Props) {
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const secuencia = useRef(0);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (espera.current) clearTimeout(espera.current);
    },
    [],
  );

  function cambiar(valor: string) {
    setTexto(valor);
    setError(null);
    if (espera.current) clearTimeout(espera.current);
    const n = ++secuencia.current;
    const digitos = aDigitos(valor);
    if (digitos === null || digitos === "0") {
      alCambiarCompra(null);
      return;
    }
    espera.current = setTimeout(async () => {
      espera.current = null;
      let resultado: ResultadoCompra;
      try {
        resultado = await consultar(cuentaId, digitos);
      } catch {
        resultado = { ok: false, codigo: "SIN_CONEXION", mensaje: SIN_RED };
      }
      if (n !== secuencia.current) return; // llegó tarde: ya se pidió otra
      if (resultado.ok) alCambiarCompra(resultado.compra);
      else {
        alCambiarCompra(null);
        setError(resultado.codigo === "MONTO_INVALIDO" ? resultado.mensaje : SIN_RED);
      }
    }, ESPERA_MS);
  }

  const { titulo, detalle } = textoCompra(compra, ciclo, disponible, fechaHoy);
  const icono =
    compra === null ? (
      <CircleHelp size={18} strokeWidth={1.5} aria-hidden className="text-secundario" />
    ) : compra.cabe ? (
      <Check size={18} strokeWidth={1.5} aria-hidden className="text-entrada-texto" />
    ) : (
      <X size={18} strokeWidth={1.5} aria-hidden className="text-texto" />
    );

  return (
    <section aria-label="¿Puedo comprar esto?" className="flex flex-col gap-3">
      <h2 className="text-rotulo uppercase">¿Puedo comprar esto?</h2>
      <CampoMonto valor={texto} moneda="COP" etiqueta="Valor de la compra" editable={{ nombre, alCambiar: cambiar, error: error ?? undefined }} />
      <div role="status" aria-live="polite" className="grid grid-cols-[18px_minmax(0,1fr)] gap-x-3">
        <span className="flex pt-0.5">{icono}</span>
        <div className="flex flex-col gap-1">
          <p className="text-cuerpo font-semibold">{titulo}</p>
          <p className="text-etiqueta font-normal text-secundario">{detalle}</p>
        </div>
      </div>
    </section>
  );
}
