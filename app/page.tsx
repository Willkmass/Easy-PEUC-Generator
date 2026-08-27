'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const [stats, setStats] = useState({ cursos: 0, ucs: 0, peucs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarMetricas() {
      try {
        const [resCursos, resUcs, resPeucs] = await Promise.all([
          supabase.from('cursos').select('id', { count: 'exact', head: true }),
          supabase.from('unidades_curriculares').select('id', { count: 'exact', head: true }),
          supabase.from('peucs').select('id', { count: 'exact', head: true }),
        ]);

        setStats({
          cursos: resCursos.count || 0,
          ucs: resUcs.count || 0,
          peucs: resPeucs.count || 0,
        });
      } catch (err) {
        console.error('Erro ao carregar métricas:', err);
      } font-medium {
        setLoading(false);
      }
    }

    carregarMetricas();
  }, []);

  return (
    <main className="min-h-screen bg-[#070913] text-slate-100 p-6 md:p-10 space-y-8">
      {/* Cabeçalho de Boas-Vindas */}
      <div className="space-y-2 border-b border-slate-800 pb-6">
        <div className="flex gap-2 mb-2">
          <span className="text-[11px] font-bold tracking-wider uppercase bg-[#181c33] text-indigo-300 px-3 py-1 rounded-full border border-indigo-900/40">
            EASY PEUC GENERATOR
          </span>
          <span className="text-[11px] font-bold tracking-wider uppercase bg-[#14182b] text-slate-400 px-3 py-1 rounded-full border border-slate-800">
            SENAI-PR • Gestão Pedagógica
          </span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Painel de Controle
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl">
          Plataforma automatizada para extração de Planos de Curso (PCA) e elaboração de Planos de Ensino por Unidade Curricular.
        </p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-[#0f1222] border border-slate-800/80 rounded-xl p-6 shadow-xl relative overflow-hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Cursos Cadastrados
          </span>
          <p className="mt-2 text-4xl font-black text-white">
            {loading ? '...' : stats.cursos}
          </p>
          <span className="mt-2 block text-xs text-slate-500 font-medium">Extraídos via PCA (PDF)</span>
        </div>

        <div className="bg-[#0f1222] border border-slate-800/80 rounded-xl p-6 shadow-xl relative overflow-hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Unidades Curriculares
          </span>
          <p className="mt-2 text-4xl font-black text-indigo-400">
            {loading ? '...' : stats.ucs}
          </p>
          <span className="mt-2 block text-xs text-slate-500 font-medium">Mapeadas no Supabase</span>
        </div>

        <div className="bg-[#0f1222] border border-slate-800/80 rounded-xl p-6 shadow-xl relative overflow-hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            PEUCs Geradas
          </span>
          <p className="mt-2 text-4xl font-black text-emerald-400">
            {loading ? '...' : stats.peucs}
          </p>
          <span className="mt-2 block text-xs text-slate-500 font-medium">Planos de ensino concluídos</span>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-[#0f1222] border border-slate-800/80 rounded-xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
          Ações do Sistema
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/importar-pca"
            className="group rounded-xl border border-slate-800/80 bg-[#14172b] p-5 hover:border-indigo-500/50 hover:bg-[#181c35] transition-all duration-200"
          >
            <h3 className="font-bold text-sm text-white group-hover:text-indigo-400 flex items-center gap-2">
              <span>📄</span> 1. Importar PCA (PDF)
            </h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Alimente a base de dados extraindo Categoria, Curso e UCs via IA.
            </p>
          </Link>

          <Link
            href="/cursos"
            className="group rounded-xl border border-slate-800/80 bg-[#14172b] p-5 hover:border-indigo-500/50 hover:bg-[#181c35] transition-all duration-200"
          >
            <h3 className="font-bold text-sm text-white group-hover:text-indigo-400 flex items-center gap-2">
              <span>📚</span> 2. Consultar Acervo
            </h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Visualize a lista de cursos cadastrados e suas respectivas disciplinas.
            </p>
          </Link>

          <Link
            href="/peuc/criar"
            className="group rounded-xl border border-slate-800/80 bg-[#14172b] p-5 hover:border-indigo-500/50 hover:bg-[#181c35] transition-all duration-200"
          >
            <h3 className="font-bold text-sm text-white group-hover:text-indigo-400 flex items-center gap-2">
              <span>⚡</span> 3. Criar Nova PEUC
            </h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Elabore o Plano de Ensino integrando a Situação de Aprendizagem.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
