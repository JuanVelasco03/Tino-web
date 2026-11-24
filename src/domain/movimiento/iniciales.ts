/**
 * Captura prellenada (web SPEC 13): «Registrar pago» de la tarjeta abre la
 * captura con una transferencia de la cuenta de pago a la tarjeta por el pago
 * sugerido. El usuario puede cambiar todo; la fecha es hoy.
 */
import { desdeMonto } from "../dinero/entrada";
import type { ValoresCaptura } from "./cuerpo";

export type InicialesCaptura = {
  tipo: "transferencia";
  cuentaOrigenId: string | null;
  cuentaDestinoId: string;
  /** `null`: sin monto (tarjeta sin ciclo o sin pago pendiente). */
  monto: bigint | null;
};

/** ¿Es un `InicialesCaptura`? `abrir` también llega como manejador de clic con un evento. */
export function esIniciales(valor: unknown): valor is InicialesCaptura {
  if (!valor || typeof valor !== "object") return false;
  const v = valor as Record<string, unknown>;
  return (
    v.tipo === "transferencia" &&
    typeof v.cuentaDestinoId === "string" &&
    (v.cuentaOrigenId === null || typeof v.cuentaOrigenId === "string") &&
    (v.monto === null || typeof v.monto === "bigint")
  );
}

/**
 * Valores del formulario para las iniciales: tipo «Transferencia», las dos
 * cuentas y el monto puestos, sin texto ni categoría, y la fecha vacía (al
 * cargar, la captura pone hoy). Una cuenta que no está entre `cuentas` se
 * ignora: el origen cae en la predeterminada al cargar y el destino queda sin
 * elegir.
 */
export function valoresDesdeIniciales(
  actual: ValoresCaptura,
  iniciales: InicialesCaptura,
  cuentas: readonly { id: string }[] | null,
): ValoresCaptura {
  const existe = (id: string | null) => id !== null && (cuentas === null || cuentas.some((c) => c.id === id));
  return {
    ...actual,
    tipo: "transferencia",
    monto: iniciales.monto !== null && iniciales.monto > 0n ? desdeMonto(iniciales.monto) : "",
    montoDestino: "",
    descripcion: "",
    categoria: { modo: "propuesta" },
    cuentaId: existe(iniciales.cuentaOrigenId) ? iniciales.cuentaOrigenId : cuentas === null ? null : actual.cuentaId,
    destinoId: existe(iniciales.cuentaDestinoId) ? iniciales.cuentaDestinoId : null,
    fecha: "",
    nota: "",
    partes: null,
  };
}
