import type { Metadata, Viewport } from "next";
import "./globals.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

// El CSS de FontAwesome se carga arriba; evita que lo inyecte otra vez en el navegador
config.autoAddCss = false;

export const metadata: Metadata = {
  title: {
    default: "SafO — Taxi seguro en Huánuco",
    template: "%s · SafO",
  },
  description: "Plataforma de taxis seguros y verificados en Huánuco, Perú.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-white text-[#1D1D1F] antialiased">
        {children}
      </body>
    </html>
  );
}