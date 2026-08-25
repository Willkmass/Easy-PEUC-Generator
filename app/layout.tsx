import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Easy PEUC Generator | SENAI-PR',
  description: 'Sistema de Automação de Planos de Ensino e Extração de PCA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full bg-slate-50">
      <body className="h-full font-sans text-slate-900 antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
