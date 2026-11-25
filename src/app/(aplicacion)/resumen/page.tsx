import { Suspense } from "react";
import { redirect } from "next/navigation";
import { NavegacionMes } from "@/components/movimientos/navegacion-mes";
import { CambioDelMes } from "@/components/resumen/cambio-del-mes";
import { CifrasMes } from "@/components/resumen/cifras-mes";
import { DiaUno } from "@/components/resumen/dia-uno";
import { EsqueletoResumen } from "@/components/resumen/esqueleto-resumen";
import { GastoCategorias } from "@/components/resumen/gasto-categorias";
import { PatrimonioNeto } from "@/components/resumen/grafica-patrimonio";
import { esMes, formatearMes, formatearNombreMes, formatearRango } from "@/domain/fecha/formato";
import { limitesMes } from "@/domain/resumen/navegacion";
import { obtenerResumen } from "@/services/resumen";

export const metadata = { title: "Resumen · Tino" };

function texto(valor: string | string[] | undefined): string | undefined {
  return typeof valor === "string" ? valor : undefined;
}

const ROTULO = <p className="text-rotulo uppercase text-secundario">Resumen del mes</p>;

/**
 * Resumen de un mes. `?mes=YYYY-MM` elige el mes (sin él, el actual según la
 * API). Un mes mal formado, inexistente o futuro vuelve a `/resumen`. Todas
 * las cifras llegan calculadas: la página solo las presenta.
 */
export default async function PaginaResumen({ searchParams }: PageProps<"/resumen">) {
  const mesPedido = texto((await searchParams).mes);
  if (mesPedido !== undefined && !esMes(mesPedido)) redirect("/resumen");

  // La `key` por mes hace que cambiar de mes (misma ruta, otro `?mes=`) vuelva
  // a mostrar el esqueleto en vez de dejar el mes anterior quieto hasta que llegue la API.
  return (
    <Suspense key={mesPedido ?? "actual"} fallback={<EsqueletoResumen mes={mesPedido} />}>
      <ContenidoResumen mesPedido={mesPedido} />
    </Suspense>
  );
}

async function ContenidoResumen({ mesPedido }: { mesPedido: string | undefined }) {
  const r = await obtenerResumen(mesPedido);

  if (!r.tieneMovimientos) {
    return (
      <div className="flex max-w-[1440px] flex-col gap-6 md:gap-8">
        <header className="flex flex-col gap-1">
          {ROTULO}
          <h1 className="text-titulo-1">{formatearMes(r.mes)}</h1>
        </header>
        <DiaUno cuentasActivas={r.cuentasActivas} inicio={r.inicio} fechaHoy={r.fechaHoy} patrimonioHoy={r.patrimonio.hoy} />
      </div>
    );
  }

  const { actual, hayAnterior, haySiguiente } = limitesMes(r);
  const movimientos = r.cantidadMovimientos === 1 ? "movimiento" : "movimientos";

  return (
    // Tope de 1440 px: en pantallas muy anchas, el rótulo y su cifra no se separan más de lo que se puede comparar.
    <div className="asentar flex max-w-[1440px] flex-col gap-8 md:gap-12">
      <header className="flex flex-col gap-1 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <div className="flex flex-col gap-1">
          {ROTULO}
          <NavegacionMes mes={r.mes} actual={actual} ruta="/resumen" hayAnterior={hayAnterior} haySiguiente={haySiguiente} variante="titulo" />
        </div>
        <p className="text-etiqueta font-normal text-secundario lg:pb-3">
          {formatearRango(r.desde, r.hasta)} · <span className="font-mono tabular-nums">{r.cantidadMovimientos}</span> {movimientos} · comparado
          con {formatearNombreMes(r.mesAnterior)}
        </p>
      </header>

      <CifrasMes ingresos={r.ingresos} gastos={r.gastos} resultado={r.resultado} mesAnterior={r.mesAnterior} />

      <GastoCategorias categorias={r.categorias} sinCategoria={r.sinCategoria} gastos={r.gastos} mes={r.mes} mesAnterior={r.mesAnterior} />

      {/* Lado a lado solo desde xl: con el menú lateral, un tercio de lg (216 px) parte los rótulos del puente. */}
      <div className="flex flex-col gap-8 md:gap-12 xl:grid xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:items-start">
        <PatrimonioNeto patrimonio={r.patrimonio} mes={r.mes} />
        <CambioDelMes cambio={r.cambioDelMes} mes={r.mes} esActual={r.mes === actual} />
      </div>
    </div>
  );
}
