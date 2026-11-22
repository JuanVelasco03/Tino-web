import type { Metadata } from "next";
import { Familjen_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { CLAVE_TEMA } from "@/lib/tema";
import "./globals.css";

const SCRIPT_TEMA = `try{var t=localStorage.getItem("${CLAVE_TEMA}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}`;

// Interfaz.
const interfaz = Familjen_Grotesk({
  variable: "--font-interfaz",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// TODO importe monetario, sin excepción.
const cifras = IBM_Plex_Mono({
  variable: "--font-cifras",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Tino",
  description: "Finanzas personales: un libro de cuentas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-CO"
      className={`${interfaz.variable} ${cifras.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        {/* Fija el tema antes del primer pintado: evita el parpadeo. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
