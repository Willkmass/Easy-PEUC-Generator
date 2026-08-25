import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

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
      <body className="bg-slate-50 min-h-screen text-slate-800 antialiased flex flex-col">
        {/* Componente de Navegação Global */}
        <Navbar />
        
        {/* Conteúdo da Rota Ativa */}
        <main className="flex-1 py-6">{children}</main>
      </body>
    </html>
  );
}
