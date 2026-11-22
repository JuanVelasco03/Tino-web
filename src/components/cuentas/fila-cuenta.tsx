import type { DragEventHandler, ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { formatearDinero, formatearTasa } from "@/domain/dinero/formato";
import type { Cuenta } from "@/services/cuentas";
import { IconoCuenta, ROTULO_TIPO_CUENTA } from "../iconos";

/** Pesos sin «COP»: los saldos de la pantalla están en pesos (una inversión USD lleva su valor en dólares debajo). */
export function pesos(monto: bigint): string {
  return formatearDinero({ monto, moneda: "COP" }, { omitirCOP: true });
}

/** Saldo como se muestra: un pasivo es deuda y lleva «−» (lo pone la web, N-15). */
export function saldoMostrado(cuenta: Cuenta): string {
  return pesos(cuenta.naturaleza === "pasivo" ? -cuenta.saldo : cuenta.saldo);
}

/** Valor de mercado de una inversión USD, en su moneda: «US$ 7.750,00». `null` en COP. */
function valorEnDolares(cuenta: Cuenta): string | null {
  if (!cuenta.inversion || cuenta.moneda !== "USD") return null;
  return formatearDinero({ monto: cuenta.inversion.valorMercado, moneda: "USD" });
}

/** Una inversión USD sin TRM nunca obtenida: su saldo en COP no existe (la API manda `"0"`). */
function sinTrm(cuenta: Cuenta): boolean {
  return cuenta.inversion !== null && cuenta.moneda === "USD" && cuenta.inversion.tasa === null;
}

/** Tipo en escritorio: «Inversión · USD» (en COP, «Inversión»). */
function tipoEscritorio(cuenta: Cuenta): string {
  const tipo = ROTULO_TIPO_CUENTA[cuenta.tipo];
  return cuenta.tipo === "inversion" && cuenta.moneda === "USD" ? `${tipo} · USD` : tipo;
}

/**
 * Subtítulo de móvil: `Banco · Ahorros ·· 4821`, `Banco`, `Tarjeta de crédito · cupo 4.000.000`,
 * `Inversión · TRM 4.120,00`.
 * El cupo es una cifra: va en mono y nunca se corta. Si no cabe, «cupo X» baja
 * entero a la línea siguiente; el resto de subtítulos se trunca.
 */
function subtituloMovil(cuenta: Cuenta): ReactNode {
  const tipo = ROTULO_TIPO_CUENTA[cuenta.tipo];
  if (cuenta.inversion && cuenta.moneda === "USD") {
    return (
      <span className="block truncate">
        {cuenta.inversion.tasa === null ? (
          `${tipo} · USD`
        ) : (
          <>
            {tipo} · TRM <span className="font-mono tabular-nums">{formatearTasa(cuenta.inversion.tasa)}</span>
          </>
        )}
      </span>
    );
  }
  if (cuenta.tarjeta) {
    return (
      <span className="block">
        {/* Espacio duro antes del «·»: si se parte, la línea nueva empieza en «cupo». */}
        {tipo}&nbsp;·{" "}
        <span className="whitespace-nowrap">
          cupo <span className="font-mono tabular-nums">{pesos(cuenta.tarjeta.cupo)}</span>
        </span>
      </span>
    );
  }
  return <span className="block truncate">{cuenta.detalle ? `${tipo} · ${cuenta.detalle}` : tipo}</span>;
}

export type ControlesOrden = {
  puedeSubir: boolean;
  puedeBajar: boolean;
  alSubir: () => void;
  alBajar: () => void;
  /** Fila destino de un arrastre válido. */
  resaltada: boolean;
  alEmpezarArrastre: DragEventHandler<HTMLLIElement>;
  alArrastrarEncima: DragEventHandler<HTMLLIElement>;
  alSoltar: DragEventHandler<HTMLLIElement>;
  alTerminarArrastre: DragEventHandler<HTMLLIElement>;
};

type Props = {
  cuenta: Cuenta;
  /** Presente solo en modo «Ordenar». */
  orden?: ControlesOrden;
};

/** Barra de cupo usado de la tarjeta. Porcentaje y disponible vienen de la API (N-16 a N-18). */
function BarraCupo({ tarjeta, conCupo }: { tarjeta: NonNullable<Cuenta["tarjeta"]>; conCupo: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        role="meter"
        aria-label="Cupo usado"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={tarjeta.porcentajeUsado}
        className="h-1 overflow-hidden rounded-muestra bg-linea"
      >
        <div className="h-1 bg-salida" style={{ width: `${tarjeta.porcentajeUsado}%` }} />
      </div>
      <div className="flex justify-between gap-3 font-mono text-cifra-xs tabular-nums text-secundario">
        <span className="whitespace-nowrap">Usado {tarjeta.porcentajeUsado} %</span>
        <span className="truncate">
          Disponible {pesos(tarjeta.disponible)}
          {conCupo && ` de ${pesos(tarjeta.cupo)}`}
        </span>
      </div>
    </div>
  );
}

const BOTON_ORDEN =
  "flex size-11 items-center justify-center rounded-campo border border-linea bg-superficie text-texto disabled:cursor-not-allowed disabled:text-terciario";

/**
 * Fila de cuenta. Escritorio (md+): agarre · ícono · nombre y tipo · detalle · saldo.
 * Móvil: ícono · nombre y subtítulo · saldo, con la barra de la tarjeta debajo.
 * Fuera del modo «Ordenar», la fila es un enlace a su edición (`?cuenta=<id>`);
 * una inversión enlaza a su detalle en `/inversiones` (se edita desde ahí con
 * «Editar cuenta»). Una inversión USD muestra su saldo en COP, «US$ 7.750,00»
 * debajo y «US$ 7.750,00 × 4.120,00» de detalle (REGLAS §6).
 */
export function FilaCuenta({ cuenta, orden }: Props) {
  const ordenando = orden !== undefined;
  const esPasivo = cuenta.naturaleza === "pasivo";
  const dolares = valorEnDolares(cuenta);
  const faltaTrm = sinTrm(cuenta);

  // El margen negativo lleva el fondo (hover, destino de arrastre) hasta el borde
  // de la hoja; el contenido conserva la sangría de la lista.
  const rejilla = `-mx-4 grid min-h-16 items-center gap-3 px-4 py-3 md:-mx-6 md:grid-cols-[28px_24px_minmax(0,1.1fr)_minmax(0,1.6fr)_200px] md:px-6 ${
    ordenando ? "grid-cols-[18px_20px_minmax(0,1fr)_auto]" : "grid-cols-[20px_minmax(0,1fr)_auto]"
  }`;

  const contenido = (
    <>
      <span className={`${ordenando ? "flex" : "hidden md:flex"} justify-center text-secundario ${ordenando ? "cursor-grab" : ""}`}>
        {ordenando && <GripVertical size={18} strokeWidth={1.5} aria-hidden />}
      </span>

      <span className="flex text-secundario">
        <IconoCuenta tipo={cuenta.tipo} />
      </span>

      <div className="min-w-0">
        <div className="truncate text-cuerpo font-semibold">{cuenta.nombre}</div>
        <div className="text-etiqueta font-normal text-secundario">
          <span className="hidden truncate md:block">{tipoEscritorio(cuenta)}</span>
          <span className="md:hidden">{subtituloMovil(cuenta)}</span>
        </div>
      </div>

      <div className="hidden min-w-0 flex-col gap-2 text-etiqueta font-normal text-secundario md:flex">
        {cuenta.detalle && <span className="truncate">{cuenta.detalle}</span>}
        {dolares && (
          <span className="truncate font-mono text-cifra-xs tabular-nums">
            {dolares}
            {cuenta.inversion?.tasa != null && ` × ${formatearTasa(cuenta.inversion.tasa)}`}
          </span>
        )}
        {cuenta.tarjeta && (
          <div className="max-w-[380px]">
            <BarraCupo tarjeta={cuenta.tarjeta} conCupo />
          </div>
        )}
      </div>

      {orden ? (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={orden.alSubir}
            disabled={!orden.puedeSubir}
            aria-label={`Subir ${cuenta.nombre}`}
            className={BOTON_ORDEN}
          >
            <ArrowUp size={18} strokeWidth={1.5} aria-hidden />
          </button>
          <button
            type="button"
            onClick={orden.alBajar}
            disabled={!orden.puedeBajar}
            aria-label={`Bajar ${cuenta.nombre}`}
            className={BOTON_ORDEN}
          >
            <ArrowDown size={18} strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      ) : (
        <div className="text-right">
          {faltaTrm ? (
            <div className="whitespace-nowrap text-etiqueta text-marca-texto">Sin TRM</div>
          ) : (
            <div
              className={`whitespace-nowrap font-mono text-[17px]/[22px] font-medium tabular-nums md:text-cifra-m ${
                esPasivo ? "text-salida-texto" : "text-texto"
              }`}
            >
              {saldoMostrado(cuenta)}
            </div>
          )}
          {esPasivo && <div className="font-mono text-cifra-xs text-secundario">deuda</div>}
          {dolares && <div className="whitespace-nowrap font-mono text-cifra-xs tabular-nums text-secundario">{dolares}</div>}
        </div>
      )}

      {cuenta.tarjeta && !ordenando && (
        <div className="col-[2/-1] md:hidden">
          <BarraCupo tarjeta={cuenta.tarjeta} conCupo={false} />
        </div>
      )}
    </>
  );

  if (!orden) {
    return (
      <li>
        <Link
          href={
            cuenta.tipo === "inversion"
              ? `/inversiones?inversion=${encodeURIComponent(cuenta.id)}`
              : `/cuentas?cuenta=${encodeURIComponent(cuenta.id)}`
          }
          scroll={cuenta.tipo === "inversion" ? undefined : false}
          className={`${rejilla} hover:bg-hundido focus-visible:-outline-offset-2`}
        >
          {contenido}
        </Link>
      </li>
    );
  }

  return (
    <li
      draggable
      onDragStart={orden.alEmpezarArrastre}
      onDragOver={orden.alArrastrarEncima}
      onDrop={orden.alSoltar}
      onDragEnd={orden.alTerminarArrastre}
    >
      <div className={`${rejilla} ${orden.resaltada ? "bg-hundido" : ""}`}>{contenido}</div>
    </li>
  );
}
