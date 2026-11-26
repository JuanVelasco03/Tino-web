"use client";

import type { CampoTarjeta, ValoresTarjeta } from "@/domain/cuenta/edicion";
import type { Naturaleza, TipoCuenta } from "@/domain/cuenta/naturaleza";
import { CampoMonto } from "../campo-monto";
import { CampoSubrayado } from "../campo-subrayado";
import { FichaCuenta } from "../captura/ficha-cuenta";
import { MensajeError } from "../mensaje-error";

/** Cuenta de efectivo o banco activa, para «Se paga desde». */
export type CuentaPago = { id: string; nombre: string; tipo: TipoCuenta; naturaleza: Naturaleza; saldo: bigint };

type Props = {
  valores: ValoresTarjeta;
  alCambiar: <C extends keyof ValoresTarjeta>(campo: C, valor: ValoresTarjeta[C]) => void;
  /** Efectivo y banco activas de `GET /cuentas`, en su orden. */
  cuentasPago: readonly CuentaPago[];
  errores: Partial<Record<CampoTarjeta | "tarjeta", string>>;
  /** Prefijo de `name` e `id` (dos paneles en `/estilos`). */
  prefijo?: string;
};

/** Solo dígitos, máximo dos: el día del mes. */
function soloDia(texto: string): string {
  return texto.replace(/\D/g, "").slice(0, 2);
}

/**
 * Condiciones de la tarjeta dentro de `PanelCuenta` (SPEC 13): días de corte
 * y de pago (1–31, dos por fila), tasa M.V. en % con coma, cuota de manejo y
 * la cuenta desde la que se paga (`FichaCuenta`, con «Sin definir»). Los
 * errores van bajo su campo; los del bloque (`CONDICIONES_REQUERIDAS`), bajo
 * el rótulo.
 */
export function CamposTarjeta({ valores, alCambiar, cuentasPago, errores, prefijo = "tarjeta" }: Props) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <legend className="text-rotulo uppercase text-secundario">Condiciones de la tarjeta</legend>
        {errores.tarjeta && <MensajeError mensaje={errores.tarjeta} />}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CampoSubrayado
          etiqueta="Día de corte"
          id={`${prefijo}-dia-corte`}
          name="diaCorte"
          inputMode="numeric"
          autoComplete="off"
          placeholder="15"
          value={valores.diaCorte}
          onChange={(e) => alCambiar("diaCorte", soloDia(e.target.value))}
          error={errores.diaCorte}
          className="font-mono tabular-nums"
        />
        <CampoSubrayado
          etiqueta="Día límite de pago"
          id={`${prefijo}-dia-pago`}
          name="diaPago"
          inputMode="numeric"
          autoComplete="off"
          placeholder="30"
          value={valores.diaPago}
          onChange={(e) => alCambiar("diaPago", soloDia(e.target.value))}
          error={errores.diaPago}
          className="font-mono tabular-nums"
        />
      </div>

      <CampoSubrayado
        etiqueta="Tasa mensual (M.V.) · opcional"
        id={`${prefijo}-tasa`}
        name="tasaMensual"
        inputMode="decimal"
        autoComplete="off"
        placeholder="1,98"
        value={valores.tasa}
        onChange={(e) => alCambiar("tasa", e.target.value.replace(/[^\d,.]/g, ""))}
        error={errores.tasaMensual}
        sufijo="%"
        className="font-mono tabular-nums"
      />

      <CampoMonto
        valor={valores.cuotaManejo}
        moneda="COP"
        etiqueta="Cuota de manejo · opcional"
        editable={{ nombre: `${prefijo}-cuota`, alCambiar: (v) => alCambiar("cuotaManejo", v), error: errores.cuotaManejo }}
      />

      <div role="group" aria-label="Se paga desde" className="flex flex-col gap-2">
        <span className="text-etiqueta font-normal text-secundario">Se paga desde · opcional</span>
        <div className="grid grid-cols-2 gap-2">
          <FichaCuenta cuenta={{ nombre: "Sin definir" }} sinSaldo elegida={valores.cuentaPagoId === null} alPulsar={() => alCambiar("cuentaPagoId", null)} />
          {cuentasPago.map((c) => (
            <FichaCuenta key={c.id} cuenta={c} elegida={valores.cuentaPagoId === c.id} alPulsar={() => alCambiar("cuentaPagoId", c.id)} />
          ))}
        </div>
        {cuentasPago.length === 0 && (
          <p className="text-etiqueta font-normal text-secundario">Crea una cuenta de efectivo o banco para elegirla.</p>
        )}
        {errores.cuentaPagoId && <MensajeError mensaje={errores.cuentaPagoId} />}
      </div>
    </fieldset>
  );
}
