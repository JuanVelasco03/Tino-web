import { cache, Suspense, type ReactNode } from "react";
import { unstable_rethrow } from "next/navigation";
import { ProveedorCaptura } from "@/components/captura/proveedor-captura";
import type { AccionesCaptura } from "@/components/captura/usar-captura";
import { TrmReferencia } from "@/components/linea-trm";
import { BarraPestanas } from "@/components/menu/barra-pestanas";
import { NumeroAvisos, PuntoAvisos } from "@/components/menu/contador-avisos";
import { MenuLateral } from "@/components/menu/menu-lateral";
import { contarNoLeidos } from "@/services/avisos";
import { obtenerTrm, type TrmVigente } from "@/services/trm";
import { salir } from "../(acceso)/acciones";
import {
  ajustarRegla,
  cargarCaptura,
  crearRegla,
  deshacerRegistro,
  elegirPredeterminada,
  registrarMovimiento,
  sugerir,
} from "./captura/acciones";

const ACCIONES_CAPTURA: AccionesCaptura = {
  cargar: cargarCaptura,
  sugerir,
  registrar: registrarMovimiento,
  deshacer: deshacerRegistro,
  crearRegla,
  ajustarRegla,
  elegirPredeterminada,
};

/**
 * `GET /trm` para el menú (N-01), una vez por petición aunque lo pidan el
 * menú lateral y la hoja «Más». Si falla, el bloque no se muestra y la página sigue.
 */
const trmDelMenu = cache(async (): Promise<TrmVigente | null> => {
  try {
    return await obtenerTrm();
  } catch (error) {
    // La sesión vencida redirige; cualquier otro fallo solo oculta la TRM.
    unstable_rethrow(error);
    return null;
  }
});

/** La TRM de referencia, leída en el servidor. Va dentro de `<Suspense>`: el menú no espera a la API. */
async function BloqueTrm({ className }: { className: string }) {
  const trm = await trmDelMenu();
  return trm ? <TrmReferencia trm={trm} className={className} /> : null;
}

/**
 * `GET /avisos/conteo` para el menú (N-02), una vez por petición aunque lo
 * pidan el menú lateral, la hoja «Más» y la pestaña. Si falla, no se muestra
 * y la página sigue. Se refresca cuando una server action revalida (la
 * respuesta trae el layout de nuevo) o en una carga completa.
 */
const noLeidosDelMenu = cache(async (): Promise<number | null> => {
  try {
    return await contarNoLeidos();
  } catch (error) {
    // La sesión vencida redirige; cualquier otro fallo solo oculta el número.
    unstable_rethrow(error);
    return null;
  }
});

/** El número de sin leer junto a «Avisos», leído en el servidor. Nada con 0 o si falló. */
async function BloqueNumeroAvisos() {
  return <NumeroAvisos noLeidos={(await noLeidosDelMenu()) ?? 0} />;
}

/** El punto sobre la pestaña «Más». Nada con 0 o si falló. */
async function BloquePuntoAvisos() {
  return <PuntoAvisos noLeidos={(await noLeidosDelMenu()) ?? 0} />;
}

/**
 * Aplicación autenticada: barra lateral desde 768 px (md), pestañas abajo por
 * debajo. El relleno lateral del contenido baja a 24 px entre 768 y 1023 px.
 * La captura rápida envuelve menú, contenido y pestañas: se abre desde
 * cualquier página sin cambiar la URL. La TRM de referencia va al pie del
 * menú y de la hoja «Más»; el número de avisos sin leer, junto a «Avisos» y
 * como punto sobre «Más». Los dos van en `<Suspense>`: el menú no espera.
 */
export default function LayoutAplicacion({ children }: { children: ReactNode }) {
  return (
    <ProveedorCaptura acciones={ACCIONES_CAPTURA}>
      <div className="w-full flex-1 md:grid md:grid-cols-[232px_minmax(0,1fr)]">
        <div className="hidden md:block">
          <MenuLateral
            salir={salir}
            trm={
              <Suspense fallback={null}>
                <BloqueTrm className="mb-4 px-2" />
              </Suspense>
            }
            avisos={
              <Suspense fallback={null}>
                <BloqueNumeroAvisos />
              </Suspense>
            }
          />
        </div>
        <main className="flex min-w-0 max-w-[1120px] flex-col px-4 pt-3 pb-[calc(88px+max(env(safe-area-inset-bottom),28px))] md:px-6 md:pt-6 md:pb-16 lg:px-12">
          {children}
        </main>
        <BarraPestanas
          salir={salir}
          trm={
            <Suspense fallback={null}>
              <BloqueTrm className="border-t border-linea py-3" />
            </Suspense>
          }
          avisos={
            <Suspense fallback={null}>
              <BloqueNumeroAvisos />
            </Suspense>
          }
          puntoAvisos={
            <Suspense fallback={null}>
              <BloquePuntoAvisos />
            </Suspense>
          }
        />
      </div>
    </ProveedorCaptura>
  );
}
