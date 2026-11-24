"use client";

import { useState } from "react";
import type { Ciclo, Compra } from "@/domain/cuenta/tarjeta";
import type { Naturaleza, TipoCuenta } from "@/domain/cuenta/naturaleza";
import { Boton } from "../boton";
import { useContextoCaptura } from "../captura/proveedor-captura";
import { EnlaceTexto } from "../enlace-texto";
import { EstadoVacio } from "../estado-vacio";
import { CabeceraCuenta } from "./cabecera-cuenta";
import { CicloTarjeta } from "./ciclo-tarjeta";
import { CondicionesTarjeta } from "./condiciones-tarjeta";
import { ConsultaCompra, type ResultadoCompra } from "./consulta-compra";
import { LineaCiclo } from "./linea-ciclo";
import { ResumenTarjeta } from "./resumen-tarjeta";

type Fila = {
  movimientoId: string;
  tipo: "gasto" | "ingreso" | "transferencia";
  fecha: string;
  descripcion: string | null;
  monto: bigint;
  categoria: { id: string; nombre: string } | null;
  partes: readonly unknown[];
  contraparte: { id: string; nombre: string } | null;
};

export type CicloCompleto = Ciclo & {
  corteAnterior: { fecha: string; saldo: bigint };
  abonos: Fila[];
  pagoSugerido: bigint;
  consumos: Fila[];
  totalConsumos: bigint;
  cargos: (Fila & { clase: "intereses" | "cuota_manejo" })[];
  totalCargos: bigint;
  deudaAlCorte: bigint;
};

type Props = {
  cuenta: {
    id: string;
    nombre: string;
    tipo: TipoCuenta;
    naturaleza: Naturaleza;
    detalle: string | null;
    archivadaEn: string | null;
    /** La deuda, positiva. */
    saldo: bigint;
    tarjeta: {
      cupo: bigint;
      disponible: bigint;
      porcentajeUsado: number;
      diaCorte: number | null;
      diaPago: number | null;
      tasaMensual: number | null;
      tasaEfectivaAnual: number | null;
      cuotaManejo: bigint | null;
      cuentaPago: { id: string; nombre: string } | null;
    };
  };
  fechaHoy: string;
  /** `null`: tarjeta sin condiciones (N-79). */
  ciclo: CicloCompleto | null;
  /** `?editar=1` del detalle. */
  rutaEditar: string;
  consultar: (id: string, monto: string) => Promise<ResultadoCompra>;
};

/**
 * Detalle de una tarjeta de crédito (SPEC 13): cabecera con «Registrar
 * pago», cupo con «¿Puedo comprar esto?», línea del ciclo, ciclo en curso y
 * condiciones. Sin condiciones, la invitación a completarlas en el lugar del
 * ciclo. Una archivada: sin «Registrar pago» ni «Editar cuenta»; la consulta
 * sigue. Todas las cifras de la API.
 */
export function DetalleTarjeta({ cuenta, fechaHoy, ciclo, rutaEditar, consultar }: Props) {
  const { abrir } = useContextoCaptura();
  const [compra, setCompra] = useState<Compra | null>(null);
  const archivada = cuenta.archivadaEn !== null;
  const { tarjeta } = cuenta;

  function registrarPago() {
    abrir({
      tipo: "transferencia",
      cuentaOrigenId: tarjeta.cuentaPago?.id ?? null,
      cuentaDestinoId: cuenta.id,
      monto: ciclo && ciclo.pagoSugerido > 0n ? ciclo.pagoSugerido : null,
    });
  }

  const porcentajeTras = compra?.cabe ? compra.porcentajeTras : null;
  const consulta = (
    <ConsultaCompra
      cuentaId={cuenta.id}
      fechaHoy={fechaHoy}
      ciclo={ciclo}
      disponible={tarjeta.disponible}
      compra={compra}
      alCambiarCompra={setCompra}
      consultar={consultar}
    />
  );

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <CabeceraCuenta
        cuenta={cuenta}
        accion={archivada ? undefined : <Boton onClick={registrarPago}>Registrar pago</Boton>}
        hrefEditar={archivada ? undefined : rutaEditar}
      />

      {/* Cupo y consulta: en escritorio, dos columnas separadas por un renglón; en móvil, apilados con el pago debajo. */}
      <div className="flex flex-col gap-6 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,360px)] md:gap-0">
        <div className="md:pr-8">
          <div className="hidden md:block">
            <ResumenTarjeta tarjeta={tarjeta} saldo={cuenta.saldo} porcentajeTras={porcentajeTras} />
          </div>
          <div className="md:hidden">
            <ResumenTarjeta formato="movil" tarjeta={tarjeta} saldo={cuenta.saldo} porcentajeTras={porcentajeTras} />
          </div>
        </div>
        <div className="md:border-l md:border-linea md:pl-8">{consulta}</div>
        {!archivada && (
          <Boton onClick={registrarPago} className="w-full justify-center md:hidden">
            Registrar pago
          </Boton>
        )}
      </div>

      {ciclo ? (
        <>
          <LineaCiclo ciclo={ciclo} fechaHoy={fechaHoy} />
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] xl:items-start">
            <CicloTarjeta ciclo={ciclo} fechaHoy={fechaHoy} />
            <div className="hidden md:block">
              <CondicionesTarjeta tarjeta={tarjeta} />
            </div>
          </div>
        </>
      ) : (
        <EstadoVacio
          rotulo="Ciclo"
          titulo="Falta el día de corte y el de pago."
          detalle="Con ellos TINO arma el ciclo, el pago límite y lo que va en cada corte."
          accion={archivada ? undefined : { etiqueta: "Completar condiciones", href: rutaEditar, scroll: false, sinMas: true }}
        />
      )}

      {!archivada && (
        <EnlaceTexto href={rutaEditar} scroll={false} className="self-start md:hidden">
          Editar cuenta
        </EnlaceTexto>
      )}
    </div>
  );
}
