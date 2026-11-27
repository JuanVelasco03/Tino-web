import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { BOTON_ENLACE } from "@/components/boton";
import { EnlaceTexto } from "@/components/enlace-texto";
import { BloquePrecio, type AccionesPrecio } from "@/components/inversiones/bloque-precio";
import { CabeceraInversion } from "@/components/inversiones/cabecera-inversion";
import { CifrasInversion } from "@/components/inversiones/cifras-inversion";
import { DiaUnoInversiones } from "@/components/inversiones/dia-uno-inversiones";
import { ListaOperaciones } from "@/components/inversiones/lista-operaciones";
import { PanelInversion } from "@/components/inversiones/panel-inversion";
import { PanelOperacion, type AccionesOperacion } from "@/components/inversiones/panel-operacion";
import { RUTA_INVERSIONES, rutaInversion, rutaNueva } from "@/components/inversiones/rutas";
import { SelectorInversiones } from "@/components/inversiones/selector-inversiones";
import { TablaPosiciones } from "@/components/inversiones/tabla-posiciones";
import { LineaTrm } from "@/components/linea-trm";
import { notaPrecios } from "@/domain/inversion/presentacion";
import { ErrorApi, obtenerInversion, obtenerInversiones, obtenerOperaciones, type Operacion } from "@/services/inversiones";
import { obtenerPerfil } from "@/services/perfil";
import { esId } from "../captura/entrada";
import {
  buscarActivo,
  cambiarCotizacion,
  crearInversion,
  editarOperacion,
  eliminarOperacion,
  guardarPrecio,
  registrarOperacion,
} from "./acciones";

export const metadata = { title: "Inversiones · Tino" };

const ACCIONES_PRECIO: AccionesPrecio = { guardar: guardarPrecio, cambiarCotizacion };
const ACCIONES_OPERACION: AccionesOperacion = {
  buscar: buscarActivo,
  registrar: registrarOperacion,
  editar: editarOperacion,
  eliminar: eliminarOperacion,
};

/** Zona si el usuario no tiene perfil (anterior a SPEC 02): la de la moneda base del producto. */
const ZONA_POR_DEFECTO = "America/Bogota";

function texto(valor: string | string[] | undefined): string | undefined {
  return typeof valor === "string" ? valor : undefined;
}

/** Operaciones de la inversión; `null` si ya no existe (la página vuelve a `/inversiones`). */
async function operacionesDe(id: string): Promise<Operacion[] | null> {
  try {
    return await obtenerOperaciones(id);
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 404) return null;
    throw error;
  }
}

/**
 * Inversiones: una cuenta de inversión a la vez, a valor de mercado. Sin
 * parámetro, la primera de `GET /inversiones`; `?inversion=<id>` elige otra
 * (también una archivada, en solo lectura). `?nueva=1` abre el alta;
 * `&precio=<activoId>`, el bloque de precio; `&operacion=nueva|<id>`, el
 * panel de operación. Un id desconocido vuelve a `/inversiones`. Toda cifra
 * llega de la API.
 */
export default async function PaginaInversiones({ searchParams }: PageProps<"/inversiones">) {
  const [lista, parametros] = await Promise.all([obtenerInversiones(), searchParams]);
  const idPedido = texto(parametros.inversion);
  const pideNueva = texto(parametros.nueva) === "1";
  const precioPedido = texto(parametros.precio);
  const operacionPedida = texto(parametros.operacion);

  if (idPedido !== undefined && !esId(idPedido)) redirect(RUTA_INVERSIONES);
  const id = idPedido ?? lista.inversiones[0]?.id ?? null;

  const [detalle, operaciones, perfil] = id
    ? await Promise.all([obtenerInversion(id), operacionesDe(id), obtenerPerfil()])
    : [null, null, null];
  if (id && (!detalle || !operaciones)) redirect(RUTA_INVERSIONES);

  const panelNueva = pideNueva ? (
    <PanelInversion key="nueva" crear={crearInversion} rutaCierre={id ? rutaInversion(id) : RUTA_INVERSIONES} />
  ) : null;

  // Día uno: ninguna inversión y ninguna pedida por URL.
  if (!detalle || !operaciones) {
    return (
      <div className="flex flex-col gap-8">
        <h1 className="text-titulo-1">Inversiones</h1>
        <DiaUnoInversiones trm={lista.trm} trmDesactualizada={lista.trmDesactualizada} />
        {panelNueva}
      </div>
    );
  }

  const zona = perfil?.zonaHoraria ?? ZONA_POR_DEFECTO;
  const archivada = detalle.archivadaEn !== null;

  // Una archivada no tiene precio ni operaciones que abrir; un activo u operación desconocidos vuelven al detalle.
  const posicionAbierta = precioPedido ? (detalle.posiciones.find((p) => p.activoId === precioPedido) ?? null) : null;
  const operacionAbierta =
    operacionPedida && operacionPedida !== "nueva" ? (operaciones.find((o) => o.id === operacionPedida) ?? null) : null;
  const precioInvalido = precioPedido !== undefined && (archivada || !posicionAbierta);
  const operacionInvalida = operacionPedida !== undefined && (archivada || (operacionPedida !== "nueva" && !operacionAbierta));
  if (precioInvalido || operacionInvalida) redirect(rutaInversion(detalle.id));

  // En línea bajo su fila en escritorio ancho; por debajo, la misma pieza abre su hoja inferior.
  const bloque = posicionAbierta ? (
    <BloquePrecio key={posicionAbierta.activoId} detalle={detalle} posicion={posicionAbierta} acciones={ACCIONES_PRECIO} />
  ) : null;

  let panel = panelNueva;
  if (!panel && operacionPedida !== undefined) {
    panel = (
      <PanelOperacion
        key={operacionAbierta?.id ?? "nueva"}
        detalle={detalle}
        operaciones={operaciones}
        operacion={operacionAbierta}
        acciones={ACCIONES_OPERACION}
      />
    );
  }

  const nota = notaPrecios(detalle, zona);

  return (
    <div className="flex flex-col gap-8">
      <CabeceraInversion detalle={detalle} />

      <SelectorInversiones inversiones={lista.inversiones} elegida={detalle.id} />

      <div className="flex flex-col gap-4">
        <CifrasInversion detalle={detalle} />
        {detalle.moneda === "USD" && <LineaTrm trm={detalle.trm} desactualizada={detalle.trmDesactualizada} className="md:hidden" />}
      </div>

      <TablaPosiciones key={detalle.id} detalle={detalle} zona={zona} abierto={posicionAbierta?.activoId ?? null} bloque={bloque} />

      {(!archivada || nota.length > 0) && (
        <div className="flex flex-col gap-4">
          {!archivada && (
            <div className="flex flex-col gap-3 md:flex-row">
              <Link href={rutaInversion(detalle.id, { operacion: "nueva" })} scroll={false} className={BOTON_ENLACE.primario}>
                Registrar operación
              </Link>
              <Link href={`/cuentas?cuenta=${encodeURIComponent(detalle.id)}`} className={BOTON_ENLACE.secundario}>
                Editar cuenta
              </Link>
            </div>
          )}
          {nota.length > 0 && <p className="max-w-[760px] text-etiqueta font-normal text-secundario">{nota.join(" ")}</p>}
        </div>
      )}

      <ListaOperaciones
        operaciones={operaciones}
        moneda={detalle.moneda}
        enlace={archivada ? undefined : (o) => rutaInversion(detalle.id, { operacion: o.id })}
      />

      {!archivada && (
        <EnlaceTexto href={rutaNueva(detalle.id)} scroll={false} className="self-start md:hidden">
          <Plus size={16} strokeWidth={1.5} aria-hidden />
          Nueva inversión
        </EnlaceTexto>
      )}

      {panel}
    </div>
  );
}
