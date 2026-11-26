/**
 * Los dos fallos de red de la web, con su texto único. No son el mismo: en uno
 * falla la red de quien usa la app; en el otro, el servidor web no llega a
 * Tino API, y pedirle a la persona que revise su conexión la despistaría.
 */

/** El servidor web no obtuvo respuesta de Tino API (caída, red del servidor, error sin código). */
export const MENSAJE_SIN_API = "No pudimos conectar. Intenta de nuevo.";

/** La server action ni siquiera llega al servidor desde el navegador (sin red, despliegue nuevo). */
export const MENSAJE_SIN_CONEXION = "No pudimos conectar. Revisa tu conexión e intenta de nuevo.";

/**
 * Llama a una server action y convierte un fallo de red en un resultado de
 * error, para que el formulario lo muestre en su lugar en vez de tumbar la
 * página hasta su `error.tsx`.
 */
export async function llamarAccion<T>(accion: () => Promise<T>): Promise<T | { ok: false; codigo: "SIN_CONEXION"; mensaje: string; campo?: undefined }> {
  try {
    return await accion();
  } catch {
    return { ok: false, codigo: "SIN_CONEXION", mensaje: MENSAJE_SIN_CONEXION };
  }
}
