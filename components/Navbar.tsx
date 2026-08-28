'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Importar PCA (PDF)', href: '/importar-pca' },
    { label: 'Cursos & UCs', href: '/cursos' },
    { label: 'Nova PEUC', href: '/peuc/criar' },
    { label: 'PEUCs Salvas', href: '/peuc' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Identidade do Sistema */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-sm">
            E
          </div>
          <Link href="/" className="font-semibold text-slate-900 tracking-tight hover:text-blue-600 transition">
            Easy PEUC <span className="text-xs font-normal text-slate-500 border border-slate-200 rounded px-1.5 py-0.5 ml-1">SENAI-PR</span>
          </Link>
        </div>

        {/* Links de Navegação Principal */}
        <nav className="flex items-center space-x-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-100 text-blue-700 font-semibold shadow-inner'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

      </div>
    </header>
  );
}
