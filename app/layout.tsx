import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter/opsz.css";
import "./globals.css";
import { CIUDAD } from "@/lib/ciudad";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

// El CSS de FontAwesome se carga arriba; evita que lo inyecte otra vez en el navegador
config.autoAddCss = false;

export const metadata: Metadata = {
  title: {
    default: `SafO — Taxi seguro en ${CIUDAD.nombre}`,
    template: "%s · SafO",
  },
  description: `Plataforma de taxis seguros y verificados en ${CIUDAD.nombre}, ${CIUDAD.pais}.`,
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#13161b" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-white text-[#16181D] antialiased">
        {children}
      </body>
    </html>
  );
}