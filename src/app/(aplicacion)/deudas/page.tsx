import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";
import { Plus } from "lucide-react";
import { AvisoCondonacion, CondonarPrestamo, ProveedorAvisoDeudas } from "@/components/deudas/condonar-prestamo";
import { ConsolidadoDeudas } from "@/components/deudas/consolidado-deudas";
import { DetallePrestamo } from "@/components/deudas/detalle-prestamo";
import { DiaUnoDeudas } from "@/components/deudas/dia-uno-deudas";
import { ListaPrestamos } from "@/components/deudas/lista-prestamos";
import { PanelAbono } from "@/components/deudas/panel-abono";
import { PanelEdicionPrestamo } from "@/components/deudas/panel-edicion-prestamo";
import { PanelPrestamo } from "@/components/deudas/panel-prestamo";
import { BOTON_ENLACE, RUTA_DEUDAS, rutaNuevo, rutaPrestamo } from "@/components/deudas/rutas";
import { EnlaceTexto } from "@/components/enlace-texto";
import { cargarFormulario, obtenerPrestamo, obtenerPrestamos, type DatosFormularioPrestamo, type TipoPrestamo } from "@/services/prestamos";
import {
  abonarPrestamo,
  condonarPrestamo,
  crearPrestamo,
  desembolsarPrestamo,
  deshacerCondonacion,
  editarPrestamo,
  proponerAbono,
} from "./acciones";

export const metadata = { title: "Deudas y préstamos · Tino" };

const ACCIONES_ALTA = { crear: crearPrestamo, desembolsar: desembolsarPrestamo };
const ACCIONES_ABONO = { proponer: proponerAbono, abonar: abonarPrestamo };

function texto(valor: string | string[] | undefined): string | undefined {
  return typeof valor === "string" ? valor : undefined;
}

/** Cuentas, categorías y patrimonio (`GET /captura`, `GET /cuentas`). Un fallo se muestra en el panel o en condonar. */
async function datosFormulario(): Promise<DatosFormularioPrestamo | null> {
  try {
    return await cargarFormulario();
  } catch (error) {
    // La sesión vencida redirige; cualquier otro fallo deja el formulario con su aviso de error.
    unstable_rethrow(error);
    return null;
  }
}

/**
 * Deudas y préstamos: consolidado, lista y detalle (maestro-detalle por URL).
 * `?prestamo=<id>` elige la persona: escritorio sin parámetro muestra la
 * primera; móvil sin parámetro, solo la lista. `?nuevo=<tipo>` abre el alta;
 * `&abono=1` y `&editar=1`, los paneles de esa persona. Un id que no está en la
 * lista vuelve a `/deudas`. Toda cifra llega de la API.
 */
export default async function PaginaDeudas({ searchParams }: PageProps<"/deudas">) {
  const [datos, parametros] = await Promise.all([obtenerPrestamos(), searchParams]);
  const idPedido = texto(parametros.prestamo);
  const nuevo = texto(parametros.nuevo);
  const pideAbono = texto(parametros.abono) === "1";
  const pideEditar = texto(parametros.editar) === "1";

  if (idPedido !== undefined && !datos.prestamos.some((p) => p.id === idPedido)) redirect(RUTA_DEUDAS);

  // Escritorio sin parámetro: la primera persona. En móvil no se ve, pero la página la trae igual.
  const resumen = datos.prestamos.find((p) => p.id === idPedido) ?? datos.prestamos[0] ?? null;
  const condonable = resumen !== null && resumen.tipo === "prestamo_otorgado" && resumen.estado === "te_debe";
  const necesitaFormulario = nuevo !== undefined || (idPedido !== undefined && pideAbono) || condonable;

  const [detalle, formulario] = await Promise.all([
    resumen ? obtenerPrestamo(resumen.id) : null,
    necesitaFormulario ? datosFormulario() : null,
  ]);
  if (resumen && !detalle) redirect(RUTA_DEUDAS);

  // Los paneles de una saldada no existen: vuelve a su detalle.
  const abierto = idPedido !== undefined && detalle !== null;
  if (abierto && (pideAbono || pideEditar) && detalle.estado === "saldado") redirect(rutaPrestamo(detalle.id));

  let panel = null;
  if (nuevo !== undefined) {
    const tipo: TipoPrestamo = nuevo === "deuda_contraida" ? "deuda_contraida" : "prestamo_otorgado";
    panel = (
      <PanelPrestamo
        key={`nuevo-${tipo}`}
        tipoInicial={tipo}
        fechaHoy={datos.fechaHoy}
        prestamos={datos.prestamos}
        formulario={formulario}
        acciones={ACCIONES_ALTA}
        rutaCierre={idPedido ? rutaPrestamo(idPedido) : RUTA_DEUDAS}
      />
    );
  } else if (abierto && pideAbono) {
    panel = <PanelAbono key={`abono-${detalle.id}`} prestamo={detalle} formulario={formulario} acciones={ACCIONES_ABONO} />;
  } else if (abierto && pideEditar) {
    panel = <PanelEdicionPrestamo key={`editar-${detalle.id}`} prestamo={detalle} editar={editarPrestamo} />;
  }

  const diaUno = datos.prestamos.length === 0;
  // Móvil con `?prestamo`: solo el detalle.
  const soloEscritorio = idPedido !== undefined ? "hidden md:flex" : "flex";

  return (
    <ProveedorAvisoDeudas deshacer={deshacerCondonacion}>
      <div className="group/deudas asentar flex flex-col gap-8">
        <header className={`${soloEscritorio} items-end justify-between gap-6`}>
          <h1 className="text-titulo-1">Deudas y préstamos</h1>
          <div className="hidden md:block">
            <Link href={rutaNuevo("prestamo_otorgado", idPedido)} scroll={false} className={BOTON_ENLACE.secundario}>
              <Plus size={18} strokeWidth={1.5} aria-hidden />
              Nuevo préstamo o deuda
            </Link>
          </div>
        </header>

        <div className={idPedido !== undefined ? "hidden md:block" : ""}>
          <ConsolidadoDeudas teDeben={datos.teDeben} debes={datos.debes} posicionNeta={datos.posicionNeta} diaUno={diaUno} />
        </div>

        <AvisoCondonacion />

        {diaUno ? (
          <DiaUnoDeudas />
        ) : (
          <div className="flex flex-col gap-8 xl:grid xl:grid-cols-[400px_minmax(0,1fr)] xl:items-start xl:gap-12">
            <div className={`${soloEscritorio} flex-col gap-2`}>
              <ListaPrestamos
                prestamos={datos.prestamos}
                fechaHoy={datos.fechaHoy}
                totales={{ teDeben: datos.teDeben.total, debes: datos.debes.total }}
                elegido={resumen?.id ?? null}
              />
              <EnlaceTexto href={rutaNuevo("prestamo_otorgado")} scroll={false} className="self-start md:hidden">
                <Plus size={16} strokeWidth={1.5} aria-hidden />
                Nuevo préstamo o deuda
              </EnlaceTexto>
            </div>
            {detalle && (
              // Mientras llega otra persona, el detalle viejo se atenúa (marca de `ListaPrestamos`).
              <div
                className={`min-w-0 transition-opacity duration-150 ease-llegada group-has-[[data-prestamo-pendiente]]/deudas:opacity-50 ${
                  idPedido !== undefined ? "" : "hidden md:block"
                }`}
              >
                <DetallePrestamo
                  key={detalle.id}
                  detalle={detalle}
                  condonar={
                    condonable ? (
                      <CondonarPrestamo
                        key={detalle.id}
                        prestamo={detalle}
                        formulario={formulario && { categorias: formulario.captura.categorias.gasto, patrimonioNeto: formulario.patrimonioNeto }}
                        condonar={condonarPrestamo}
                      />
                    ) : undefined
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>
      {panel}
    </ProveedorAvisoDeudas>
  );
}
