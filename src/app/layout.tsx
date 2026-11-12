import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PoliConnect | Bolsa de Empleo Institucional — EPN (FIS)",
  description:
    "Plataforma de vinculación laboral, pasantías y red profesional para la Escuela Politécnica Nacional — Facultad de Ingeniería de Sistemas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
        {children}
      </body>
    </html>
  );
}
