import './globals.css';

export const metadata = {
  title: 'Sistema PEUC - SENAI',
  description: 'Plano de Ensino da Unidade Curricular',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
        {/* Garanta que NÃO exita a tag <VercelToolbar /> aqui */}
      </body>
    </html>
  );
}
