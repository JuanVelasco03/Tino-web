/**
 * Formularios de préstamos: alta y desembolso, abono y edición. Valores
 * tecleados (texto) → cuerpos del contrato. Sin `number` para los montos ni
 * para la tasa (REGLAS §6): la tasa viaja como texto y la valida la API.
 */
import { aDigitos, desdeMonto } from "../dinero/entrada";
import { montoValido } from "../movimiento/cuerpo";
import type {
  AbonoCuerpo,
  DesembolsoCuerpo,
  Prestamo,
  PrestamoCambio,
  PrestamoCuerpo,
  PropuestaAbono,
  TipoPrestamo,
} from "./tipos";

export type ValoresAlta = {
  tipo: TipoPrestamo;
  nombre: string;
  /** Lo tecleado ya formateado: `"600.000"`. */
  monto: string;
  cuentaId: string | null;
  /** `"YYYY-MM-DD"`. */
  fecha: string;
  /** Como lo escribió el usuario: `"1,5"`. `""` = sin intereses. */
  tasaMensual: string;
  /** `""` = sin fecha acordada. */
  fechaAcordada: string;
};

export type ValoresAbono = { cuentaId: string | null; fecha: string; total: string; capital: string; interes: string };

export type ValoresEdicion = { nombre: string; fechaAcordada: string };

export type CampoAlta = "tipo" | "nombre" | "monto" | "cuentaId" | "fecha" | "tasaMensual" | "fechaAcordada";
export type CampoAbono = "cuentaId" | "fecha" | "total" | "capital" | "interes";
export type CampoEdicion = "nombre" | "fechaAcordada";

/** Alta vacía en el sentido pedido, con fecha de hoy y la cuenta predeterminada de la captura. */
export function VALORES_ALTA(tipo: TipoPrestamo, fechaHoy: string, cuentaPredeterminada: string | null): ValoresAlta {
  return { tipo, nombre: "", monto: "", cuentaId: cuentaPredeterminada, fecha: fechaHoy, tasaMensual: "", fechaAcordada: "" };
}

function clave(nombre: string): string {
  return nombre.trim().toLocaleLowerCase("es");
}

/**
 * El préstamo con esa persona en ese sentido, o `null`. Recorta y compara sin
 * mayúsculas, como la API (`PRESTAMO_EXISTENTE`). Los saldados cuentan: un
 * desembolso los reabre.
 */
export function personaExistente(nombre: string, prestamos: readonly Prestamo[], tipo: TipoPrestamo): Prestamo | null {
  const buscada = clave(nombre);
  if (buscada === "") return null;
  return prestamos.find((p) => p.tipo === tipo && clave(p.nombre) === buscada) ?? null;
}

/** `"1,5"` → `"1.5"`; vacío → `"0"`. La forma la valida la API (`TASA_INVALIDA`). */
function tasaDelCuerpo(tasa: string): string {
  const limpia = tasa.trim().replace(",", ".");
  return limpia === "" ? "0" : limpia;
}

/** `POST /prestamos`, o `null` si el monto no se puede enviar (vacío, cero o mal escrito). */
export function cuerpoAlta(v: ValoresAlta): PrestamoCuerpo | null {
  const monto = montoValido(v.monto);
  if (monto === null) return null;
  return {
    tipo: v.tipo,
    nombre: v.nombre.trim(),
    monto,
    // Sin cuenta, la API responde `CUENTA_INVALIDA` bajo el campo.
    cuentaId: v.cuentaId ?? "",
    fecha: v.fecha,
    tasaMensual: tasaDelCuerpo(v.tasaMensual),
    fechaAcordada: v.fechaAcordada === "" ? null : v.fechaAcordada,
  };
}

/** `POST /prestamos/:id/desembolsos`, o `null` si el monto no se puede enviar. */
export function cuerpoDesembolso(v: ValoresAlta): DesembolsoCuerpo | null {
  const monto = montoValido(v.monto);
  if (monto === null) return null;
  return { monto, cuentaId: v.cuentaId ?? "", fecha: v.fecha };
}

export function VALORES_ABONO(fechaHoy: string, cuentaPredeterminada: string | null): ValoresAbono {
  return { cuentaId: cuentaPredeterminada, fecha: fechaHoy, total: "", capital: "", interes: "" };
}

/** Capital e interés desde la propuesta de la API; total, fecha y cuenta quedan. */
export function aplicarPropuesta(v: ValoresAbono, p: PropuestaAbono): ValoresAbono {
  return { ...v, capital: desdeMonto(p.capital), interes: desdeMonto(p.interes) };
}

/** Capital + interés escritos, para el texto del botón; `null` si alguno no es entero. La API valida el abono. */
export function totalAbono(v: ValoresAbono): bigint | null {
  const capital = aDigitos(v.capital);
  const interes = aDigitos(v.interes);
  if (capital === null || interes === null) return null;
  return BigInt(capital) + BigInt(interes);
}

/**
 * «Todo lo pendiente» del abono: capital pendiente más los intereses causados a
 * la fecha de la propuesta, como total sugerido. Solo llena el campo: el reparto
 * lo propone la API y el abono lo valida ella.
 */
export function totalPendiente(capitalPendiente: bigint, interesesCausados: bigint): string {
  return desdeMonto(capitalPendiente + interesesCausados);
}

/**
 * `POST /prestamos/:id/abonos`. Con interés, capital e interés escritos; sin
 * él (tasa 0), todo el total a capital e interés `"0"`. `null` si algún monto
 * no es entero. Sin `categoriaInteresId`: la API usa «Intereses».
 */
export function cuerpoAbono(v: ValoresAbono, conInteres: boolean): AbonoCuerpo | null {
  const capital = aDigitos(conInteres ? v.capital : v.total);
  const interes = conInteres ? aDigitos(v.interes) : "0";
  if (capital === null || interes === null) return null;
  return { cuentaId: v.cuentaId ?? "", fecha: v.fecha, capital, interes };
}

/**
 * `PATCH /prestamos/:id` con solo lo que cambió; `""` en la fecha la quita
 * (`null`). Sin cambios, `null`: no se envía (evita `SIN_CAMBIOS`).
 */
export function cambioDesde(antes: ValoresEdicion, despues: ValoresEdicion): PrestamoCambio | null {
  const cambio: PrestamoCambio = {};
  if (despues.nombre.trim() !== antes.nombre.trim()) cambio.nombre = despues.nombre.trim();
  if (despues.fechaAcordada !== antes.fechaAcordada) cambio.fechaAcordada = despues.fechaAcordada === "" ? null : despues.fechaAcordada;
  return Object.keys(cambio).length === 0 ? null : cambio;
}
