import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Easy PEUC Generator",
  description: "Sistema Inteligente para Geração de PEUC SENAI-PR"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
