import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from "lucide-react";
import { rutaNuevo } from "./rutas";

const ENTRADAS = [
  { tipo: "prestamo_otorgado", rotulo: "Le presté a alguien", detalle: "Queda como activo: te deben", Icono: ArrowUpRight },
  { tipo: "deuda_contraida", rotulo: "Alguien me prestó", detalle: "Queda como pasivo: le debes", Icono: ArrowDownLeft },
] as const;

/**
 * Deudas sin préstamos (N-90, N-91): el mensaje y las dos entradas al alta,
 * filas de 60 px sobre una raya. 400 px en escritorio.
 */
export function DiaUnoDeudas() {
  return (
    <section aria-label="Sin préstamos" className="flex flex-col gap-6 md:w-[400px]">
      <div className="flex flex-col gap-1">
        <p className="text-cuerpo font-semibold">Nadie anotado todavía.</p>
        <p className="text-cuerpo text-pretty text-secundario">
          Aquí llevas lo que prestas y lo que te prestan, persona por persona, con abonos e intereses aparte.
        </p>
      </div>
      <ul className="border-t border-raya">
        {ENTRADAS.map(({ tipo, rotulo, detalle, Icono }) => (
          <li key={tipo}>
            <Link
              href={rutaNuevo(tipo)}
              scroll={false}
              className="grid min-h-15 grid-cols-[20px_minmax(0,1fr)_20px] items-center gap-3 border-b border-linea px-2 hover:bg-hundido"
            >
              <span className="flex text-secundario">
                <Icono size={20} strokeWidth={1.5} aria-hidden />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-cuerpo font-semibold">{rotulo}</span>
                <span className="text-etiqueta font-normal text-secundario">{detalle}</span>
              </span>
              <span className="flex text-secundario">
                <ChevronRight size={20} strokeWidth={1.5} aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
