import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";
import { Plus } from "lucide-react";
import { BOTON_ENLACE } from "@/components/boton";
import { EnlaceTexto } from "@/components/enlace-texto";
import { EstadoVacio } from "@/components/estado-vacio";
import { AccionesMeta, type AccionesDetalleMeta } from "@/components/metas/acciones-meta";
import { DetalleMeta } from "@/components/metas/detalle-meta";
import { ListaMetas, TotalesCabecera } from "@/components/metas/lista-metas";
import { PanelAporte, type AccionesPanelAporte } from "@/components/metas/panel-aporte";
import { PanelMeta, type AccionesPanelMeta } from "@/components/metas/panel-meta";
import { RUTA_ARCHIVADAS, RUTA_METAS, rutaMeta, rutaNueva } from "@/components/metas/rutas";
import { obtenerCuentas, type Cuenta } from "@/services/cuentas";
import { obtenerMeta, obtenerMetas, type MetaDetalle } from "@/services/metas";
import { esId } from "../captura/entrada";
import {
  archivarMeta,
  crearMeta,
  editarAporte,
  editarMeta,
  eliminarAporte,
  eliminarMeta,
  registrarAporte,
  restaurarMeta,
} from "./acciones";

export const metadata = { title: "Metas de ahorro · Tino" };

const ACCIONES_DETALLE: AccionesDetalleMeta = { archivar: archivarMeta, restaurar: restaurarMeta, eliminar: eliminarMeta };
const ACCIONES_META: AccionesPanelMeta = { crear: crearMeta, editar: editarMeta };
const ACCIONES_APORTE: AccionesPanelAporte = { registrar: registrarAporte, editar: editarAporte, eliminar: eliminarAporte };

function texto(valor: string | string[] | undefined): string | undefined {
  return typeof valor === "string" ? valor : undefined;
}

/** Cuentas activas para los paneles (`GET /cuentas`). Un fallo se muestra en el panel. */
async function cuentasFormulario(): Promise<Cuenta[] | null> {
  try {
    const lista = await obtenerCuentas();
    return [...lista.activos.cuentas, ...lista.pasivos.cuentas];
  } catch (error) {
    // La sesión vencida redirige; cualquier otro fallo deja el panel con su aviso.
    unstable_rethrow(error);
    return null;
  }
}

type Panel =
  | { tipo: "nueva" }
  | { tipo: "editar" }
  | { tipo: "registrar"; registro: "aporte" | "retiro" }
  | { tipo: "aporte"; aporteId: string }
  | null;

function panelPedido(p: Record<string, string | string[] | undefined>): Panel {
  if (texto(p.nueva) === "1") return { tipo: "nueva" };
  if (texto(p.editar) === "1") return { tipo: "editar" };
  const registro = texto(p.registrar);
  if (registro === "aporte" || registro === "retiro") return { tipo: "registrar", registro };
  const aporteId = texto(p.aporte);
  if (aporteId !== undefined) return { tipo: "aporte", aporteId };
  return null;
}

/** Un panel que la meta no admite (N-43): la URL vuelve a su detalle. */
function panelImposible(panel: Panel, d: MetaDetalle): boolean {
  if (panel === null || panel.tipo === "nueva") return false;
  const cumplida = d.cumplidaEl !== null;
  const inversion = d.modo === "cuenta" && d.cuenta.tipo === "inversion";
  switch (panel.tipo) {
    case "editar":
      return cumplida;
    case "registrar":
      return panel.registro === "aporte" ? cumplida || inversion : d.modo === "cuenta";
    case "aporte":
      return d.modo !== "apartado" || !d.historial.some((f) => f.id === panel.aporteId);
  }
}

/**
 * Metas de ahorro: cabecera, lista y detalle (maestro-detalle por URL).
 * `?meta=<id>` elige la meta: escritorio sin parámetro muestra la primera;
 * móvil sin parámetro, solo la lista. `?nueva=1` abre el alta; `&editar=1`,
 * `&registrar=aporte|retiro` y `&aporte=<id>`, los paneles de esa meta. Un id
 * desconocido o un panel imposible vuelven atrás. Toda cifra llega de la API.
 */
export default async function PaginaMetas({ searchParams }: PageProps<"/metas">) {
  const parametros = await searchParams;
  const idPedido = texto(parametros.meta);
  if (idPedido !== undefined && !esId(idPedido)) redirect(RUTA_METAS);
  const panel = panelPedido(parametros);

  // Con `?meta`, lista y detalle en paralelo.
  const [datos, pedido] = await Promise.all([obtenerMetas(), idPedido ? obtenerMeta(idPedido) : null]);
  const todas = [...datos.activas, ...datos.cumplidas];
  if (idPedido !== undefined && (!todas.some((m) => m.id === idPedido) || pedido === null)) redirect(RUTA_METAS);

  // Escritorio sin parámetro: la primera meta. En móvil no se ve, pero la página la trae igual.
  const primera = todas[0] ?? null;
  const necesitaCuentas = panel !== null && (panel.tipo === "nueva" || panel.tipo === "editar" || (panel.tipo === "registrar" && panel.registro === "aporte"));
  const [detalle, cuentas] = await Promise.all([
    pedido ?? (primera ? obtenerMeta(primera.id) : null),
    necesitaCuentas ? cuentasFormulario() : null,
  ]);
  if (primera && !detalle) redirect(RUTA_METAS);

  const abierta = idPedido !== undefined && detalle !== null ? detalle : null;
  if (abierta && panelImposible(panel, abierta)) redirect(rutaMeta(abierta.id));

  let hoja = null;
  if (panel?.tipo === "nueva") {
    hoja = (
      <PanelMeta
        key="nueva"
        fechaHoy={datos.fechaHoy}
        metas={todas}
        cuentas={cuentas}
        acciones={ACCIONES_META}
        rutaCierre={idPedido ? rutaMeta(idPedido) : RUTA_METAS}
      />
    );
  } else if (abierta && panel?.tipo === "editar") {
    hoja = (
      <PanelMeta
        key={`editar-${abierta.id}`}
        meta={abierta}
        fechaHoy={datos.fechaHoy}
        metas={todas}
        cuentas={cuentas}
        acciones={ACCIONES_META}
        rutaCierre={rutaMeta(abierta.id)}
      />
    );
  } else if (abierta && panel?.tipo === "registrar") {
    hoja = (
      <PanelAporte
        key={`registrar-${abierta.id}-${panel.registro}`}
        meta={abierta}
        fechaHoy={datos.fechaHoy}
        tipoInicial={panel.registro}
        cuentas={cuentas}
        acciones={ACCIONES_APORTE}
      />
    );
  } else if (abierta?.modo === "apartado" && panel?.tipo === "aporte") {
    const fila = abierta.historial.find((f) => f.id === panel.aporteId);
    if (fila) {
      hoja = <PanelAporte key={`aporte-${fila.id}`} meta={abierta} fechaHoy={datos.fechaHoy} aporte={fila} cuentas={null} acciones={ACCIONES_APORTE} />;
    }
  }

  const vacio = todas.length === 0;
  // Móvil con `?meta`: solo el detalle.
  const soloLista = idPedido !== undefined ? "hidden md:flex" : "flex";

  return (
    <>
      <div className="flex flex-col gap-8">
        <header className={`${soloLista} flex-col gap-1`}>
          <div className="flex items-end justify-between gap-6">
            <h1 className="text-titulo-1">
              <span className="md:hidden">Metas</span>
              <span className="hidden md:inline">Metas de ahorro</span>
            </h1>
            <div className="hidden md:block">
              <Link href={rutaNueva(idPedido)} scroll={false} className={BOTON_ENLACE.secundario}>
                <Plus size={18} strokeWidth={1.5} aria-hidden />
                Nueva meta
              </Link>
            </div>
            <Link
              href={rutaNueva()}
              scroll={false}
              aria-label="Nueva meta"
              title="Nueva meta"
              className="-mr-2 inline-flex size-11 items-center justify-center rounded-campo md:hidden"
            >
              <Plus size={20} strokeWidth={1.5} aria-hidden />
            </Link>
          </div>
          <TotalesCabecera totales={datos.totales} activas={datos.activas} />
        </header>

        {vacio ? (
          <div className="flex flex-col gap-2">
            <EstadoVacio
              rotulo="Metas"
              titulo="Sin metas todavía."
              detalle="Aparta parte de una cuenta, o toma una cuenta entera, para llegar a un objetivo."
              accion={{ etiqueta: "Nueva meta", href: rutaNueva(), scroll: false }}
            />
            <EnlaceTexto href={RUTA_ARCHIVADAS} className="self-start">
              Ver archivadas
            </EnlaceTexto>
          </div>
        ) : (
          <div className="flex flex-col gap-8 xl:grid xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start xl:gap-12">
            <div className={`${soloLista} flex-col gap-2`}>
              <ListaMetas activas={datos.activas} cumplidas={datos.cumplidas} fechaHoy={datos.fechaHoy} elegida={detalle?.id ?? null} />
              <EnlaceTexto href={RUTA_ARCHIVADAS} className="self-start">
                Ver archivadas
              </EnlaceTexto>
            </div>
            {detalle && (
              <div className={`min-w-0 ${idPedido !== undefined ? "" : "hidden md:block"}`}>
                <DetalleMeta
                  key={detalle.id}
                  detalle={detalle}
                  fechaHoy={datos.fechaHoy}
                  volver={{ href: RUTA_METAS, rotulo: "Metas" }}
                  acciones={<AccionesMeta key={detalle.id} meta={detalle} acciones={ACCIONES_DETALLE} />}
                />
              </div>
            )}
          </div>
        )}
      </div>
      {hoja}
    </>
  );
}
