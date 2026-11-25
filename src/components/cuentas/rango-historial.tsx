"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";
import { atajoActivo, rangoDeAtajo, textoRango, validarRango, type Atajo } from "@/domain/cuenta/detalle";
import { formatearNombreMes, sumarMeses } from "@/domain/fecha/formato";
import { Boton } from "../boton";
import { rutaCuenta } from "./rutas";
import { CampoFecha } from "../campo-fecha";

type Props = {
  cuentaId: string;
  /** Lo que pidió la URL (`?desde=&hasta=`), para saber qué atajo está activo. */
  pedido: { desde?: string; hasta?: string };
  historial: { fechaHoy: string; desde: string; hasta: string | null };
  /** A la derecha («Seleccionar pendientes»), solo en escritorio. */
  extra?: ReactNode;
};

const FICHA = "inline-flex h-11 shrink-0 items-center rounded-campo border bg-superficie px-3 text-cuerpo whitespace-nowrap md:h-9";

/** «Noviembre» desde `"2026-11"`. */
function nombreMes(mes: string): string {
  const nombre = formatearNombreMes(mes);
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

/**
 * Rango del historial (SPEC 13): tres fichas que navegan («Últimos 30
 * días», el mes en curso y el anterior); la activa con borde en tinta y peso
 * 600. En escritorio, el botón del rango despliega en línea «Desde» y «Hasta
 * · opcional» con «Aplicar»; un «Hasta» anterior a «Desde» muestra su error
 * sin navegar. En móvil, solo las fichas, con desplazamiento horizontal.
 */
export function RangoHistorial({ cuentaId, pedido, historial, extra }: Props) {
  const router = useRouter();
  const { fechaHoy } = historial;
  const activo = atajoActivo(pedido.desde, pedido.hasta, fechaHoy);
  const [abierto, setAbierto] = useState(false);
  const [desde, setDesde] = useState(historial.desde);
  const [hasta, setHasta] = useState(historial.hasta ?? "");
  const [error, setError] = useState<string | null>(null);

  const mes = fechaHoy.slice(0, 7);
  const fichas: { atajo: Atajo; rotulo: string }[] = [
    { atajo: "30d", rotulo: "Últimos 30 días" },
    { atajo: "mes", rotulo: nombreMes(mes) },
    { atajo: "anterior", rotulo: nombreMes(sumarMeses(mes, -1)) },
  ];

  function aplicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (desde === "") return;
    const mensaje = validarRango(desde, hasta);
    if (mensaje) {
      setError(mensaje);
      return;
    }
    setAbierto(false);
    router.push(rutaCuenta(cuentaId, { desde, hasta: hasta || undefined }), { scroll: false });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="-mx-4 flex min-w-0 gap-2 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
          {fichas.map(({ atajo, rotulo }) => {
            const elegida = atajo === activo;
            return (
              <Link
                key={atajo}
                href={rutaCuenta(cuentaId, rangoDeAtajo(atajo, fechaHoy))}
                scroll={false}
                aria-current={elegida ? "page" : undefined}
                className={`${FICHA} ${elegida ? "border-texto font-semibold" : "border-linea hover:border-secundario"}`}
              >
                {rotulo}
              </Link>
            );
          })}
        </div>
        <button
          type="button"
          aria-expanded={abierto}
          onClick={() => {
            setAbierto((a) => !a);
            setError(null);
          }}
          className={`${FICHA} hidden gap-2 md:inline-flex ${activo === null ? "border-texto font-semibold" : "border-linea hover:border-secundario"}`}
        >
          <Calendar size={16} strokeWidth={1.5} aria-hidden />
          <span className="font-mono text-cifra-xs tabular-nums">{textoRango(historial)}</span>
        </button>
        {extra && <div className="ml-auto hidden md:block">{extra}</div>}
      </div>

      {abierto && (
        <form onSubmit={aplicar} noValidate className="hidden items-start gap-6 md:flex">
          <div className="w-44">
            <CampoFecha
              etiqueta="Desde"
              hoy={fechaHoy}
              max={fechaHoy}
              valor={desde}
              alCambiar={(fecha) => {
                setDesde(fecha);
                setError(null);
              }}
            />
          </div>
          <div className="w-44">
            <CampoFecha
              etiqueta="Hasta · opcional"
              hoy={fechaHoy}
              min={desde || undefined}
              valor={hasta}
              vacio="Hasta hoy"
              alCambiar={(fecha) => {
                setHasta(fecha);
                setError(null);
              }}
              error={error ?? undefined}
            />
          </div>
          <Boton type="submit" variante="secundario" disabled={desde === ""} className="mt-3">
            Aplicar
          </Boton>
        </form>
      )}
    </div>
  );
}
