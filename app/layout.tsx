import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Easy PEUC Generator',
  description: 'Sistema Inteligente de Geração de PEUC do SENAI-PR',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
