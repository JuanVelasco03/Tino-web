import { redirect } from "next/navigation";

/** La portada de la aplicación es el Resumen: primera entrada del menú y de la barra. */
export default function Inicio() {
  redirect("/resumen");
}
