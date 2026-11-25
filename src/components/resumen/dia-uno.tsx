"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useId } from "react";
import { formatearDinero } from "@/domain/dinero/formato";
import { formatearFechaSinAnio } from "@/domain/fecha/formato";
import { Boton } from "../boton";
import { useContextoCaptura } from "../captura/proveedor-captura";
import { EnlaceTexto } from "../enlace-texto";
import { GraficaPatrimonio } from "./grafica-patrimonio";

/** Respuesta al pulsar: el botón cede apenas (0,98) y vuelve. Con movimiento reducido, solo el color. */
const PRESION = "presion";

type Props = {
  /** Cuentas no archivadas: «tus 3 cuentas», «tu cuenta» o la invitación a crear una (N-55). */
  cuentasActivas: number;
  /** Día de creación de la cuenta más antigua: el punto de partida (N-58). */
  inicio: string | null;
  /** Hoy en la zona del usuario: primera casilla de la gráfica. */
  fechaHoy: string;
  /** Patrimonio de hoy (saldos iniciales), de la API. */
  patrimonioHoy: bigint;
};

const CIFRAS = [
  { rotulo: "Ingresos", detalle: "Sin ingresos registrados" },
  { rotulo: "Gastos", detalle: "Sin gastos registrados" },
  { rotulo: "Resultado neto", detalle: "Ingresos menos gastos" },
] as const;

const NUEVA_CUENTA = "/cuentas?cuenta=nueva";

/** «tus 3 cuentas» / «tu cuenta». */
function cuentas(n: number): string {
  return n === 1 ? "tu cuenta" : `tus ${n} cuentas`;
}

/** La captura abre sobre la página; en `/estilos` no hay proveedor y se pasa la acción. */
export function DiaUno(props: Props) {
  const { abrir } = useContextoCaptura();
  return <VistaDiaUno {...props} alRegistrar={abrir} />;
}

/**
 * Estado de día uno (`tieneMovimientos: false`, N-54 a N-61): «Hoy es tu
 * primer día.», cifras en cero tenue, categorías por llenar y el punto de
 * partida del patrimonio. Sin navegación de meses. Sin cuentas, invita a
 * crear una: sin patrimonio ni «Registrar el primer gasto» (la captura pide cuenta).
 */
export function VistaDiaUno({ cuentasActivas, inicio, fechaHoy, patrimonioHoy, alRegistrar }: Props & { alRegistrar: () => void }) {
  const sinCuentas = cuentasActivas === 0;
  const partida = inicio ?? fechaHoy;
  const categorias = useId();
  const patrimonio = useId();

  return (
    <div className="flex flex-col gap-8 md:gap-12">
      {/* Mensaje y acciones */}
      <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12 md:border-b md:border-linea md:pb-6">
        <div className="flex max-w-prose flex-col gap-1">
          <p className="text-titulo-2">Hoy es tu primer día.</p>
          {sinCuentas ? (
            <p className="text-cuerpo text-secundario">Empieza por crear una cuenta: el resumen se arma con lo que registres en ella.</p>
          ) : (
            <p className="text-cuerpo text-secundario">
              <span className="hidden md:inline">
                El resumen se arma solo con lo que registres. Por ahora solo están los saldos iniciales de {cuentas(cuentasActivas)}, y esos no
                cuentan como ingresos.
              </span>
              <span className="md:hidden">
                El resumen se arma con lo que registres. Los saldos iniciales de {cuentas(cuentasActivas)} no cuentan como ingresos.
              </span>
            </p>
          )}
        </div>
        {sinCuentas ? (
          <EnlaceTexto href={NUEVA_CUENTA}>
            <Plus size={16} strokeWidth={1.5} aria-hidden />
            Nueva cuenta
          </EnlaceTexto>
        ) : (
          <div className="hidden gap-2 md:flex">
            <Boton onClick={alRegistrar} className={PRESION}>
              Registrar el primer gasto
            </Boton>
            <Link
              href={NUEVA_CUENTA}
              className={`inline-flex h-12 items-center rounded-campo border border-linea bg-superficie px-6 text-cuerpo font-medium hover:border-secundario ${PRESION}`}
            >
              Agregar otra cuenta
            </Link>
          </div>
        )}
      </div>

      {/* Cifras en cero */}
      <section aria-label="Cifras del mes">
        <div className="hidden grid-cols-3 border-t border-raya md:grid">
          {CIFRAS.map((c, i) => (
            <div key={c.rotulo} className={`flex flex-col gap-3 pt-6 ${i > 0 ? "border-l border-linea pl-6" : ""} ${i < 2 ? "pr-6" : ""}`}>
              <h2 className="text-rotulo uppercase">{c.rotulo}</h2>
              <span className="font-mono text-cifra-l tabular-nums text-secundario">0</span>
              <span className="text-etiqueta font-normal text-secundario">{c.detalle}</span>
            </div>
          ))}
        </div>
        <dl className="md:hidden">
          {CIFRAS.map((c, i) => {
            const esResultado = i === 2;
            return (
              <div
                key={c.rotulo}
                className={`flex items-baseline justify-between gap-3 py-3 ${esResultado ? "doble-raya border-t border-raya" : "border-b border-linea"}`}
              >
                <dt className={`text-cuerpo ${esResultado ? "font-semibold" : ""}`}>{c.rotulo}</dt>
                <dd className={`font-mono tabular-nums text-secundario ${esResultado ? "text-cifra-l" : "text-cifra-m"}`}>0</dd>
              </div>
            );
          })}
        </dl>
      </section>

      {/* Categorías por llenar y punto de partida */}
      <div className="flex flex-col gap-8 md:grid md:grid-cols-2 md:items-start md:gap-12">
        <section aria-labelledby={categorias} className="hidden md:block">
          <h2 id={categorias} className="border-b border-raya pb-2 text-rotulo uppercase">
            Gasto por categoría
          </h2>
          <div aria-hidden>
            <div className="h-11 border-b border-linea" />
            <div className="h-11 border-b border-linea" />
            <div className="h-11 border-b border-linea" />
            <div className="doble-renglon h-11" />
          </div>
          <p className="pt-4 text-etiqueta font-normal text-secundario">
            Cuando registres gastos aparecen aquí, de mayor a menor, con su parte del total.
          </p>
        </section>

        {!sinCuentas && (
          <section aria-labelledby={patrimonio}>
            <div className="flex items-baseline justify-between gap-3 border-b border-raya pb-2">
              <h2 id={patrimonio} className="text-rotulo uppercase">
                Patrimonio neto
              </h2>
              <span className="text-etiqueta font-normal text-secundario">Punto de partida · {formatearFechaSinAnio(partida)}</span>
            </div>
            <div className="pt-4 pb-4 md:pb-6">
              <span className="font-mono text-cifra-l tabular-nums">
                {formatearDinero({ monto: patrimonioHoy, moneda: "COP" }, { omitirCOP: true })}
              </span>
            </div>
            <GraficaPatrimonio puntoDePartida={{ fechaHoy }} />
            <p className="hidden pt-4 text-etiqueta font-normal text-secundario md:block">
              La línea arranca hoy. Cada cierre de mes agrega un punto.
            </p>
          </section>
        )}
      </div>

      {!sinCuentas && (
        <Boton onClick={alRegistrar} className={`w-full justify-center md:hidden ${PRESION}`}>
          Registrar el primer gasto
        </Boton>
      )}
    </div>
  );
}
