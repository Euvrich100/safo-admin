import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SafO Admin",
  description: "Panel de administración SafO",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[#060B18] text-white antialiased">
        {children}
      </body>
    </html>
  );
}