/** Mensaje cuando la server action ni siquiera llega al servidor (sin red, despliegue nuevo). */
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
