"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Importação PCA (PDF)", href: "/importacao" },
    { label: "Gestão de Cursos", href: "/cursos" },
    { label: "Elaborar PEUC", href: "/peuc" },
  ];

  return (
    <header className="bg-slate-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo / Título do Sistema */}
        <div className="flex items-center space-x-3">
          <div className="bg-red-600 font-extrabold px-3 py-1 rounded text-sm tracking-wider">
            SENAI
          </div>
          <span className="font-semibold text-lg hidden sm:inline">
            Sistema PEUC
          </span>
        </div>

        {/* Links das Abas */}
        <nav className="flex space-x-1 sm:space-x-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-800 text-blue-400 font-semibold border-b-2 border-blue-500 rounded-b-none"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
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
