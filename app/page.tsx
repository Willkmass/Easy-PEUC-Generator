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
      } finally {
        setLoading(false);
      }
    }

    carregarMetricas();
  }, []);

  return (
    <main className="mx-auto max-w-7xl p-6">
      {/* Cabeçalho de Boas-Vindas */}
      <div className="mb-8 border-b border-slate-200 pb-5">
        <span className="rounded bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">
          SENAI-PR • Gestão Pedagógica
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Easy PEUC Generator
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Plataforma automatizada para extração de Planos de Curso (PCA) e elaboração de Planos de Ensino por Unidade Curricular.
        </p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Cursos Cadastrados
          </span>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {loading ? '...' : stats.cursos}
          </p>
          <span className="mt-1 block text-xs text-slate-500">Extraídos via PCA (PDF)</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Unidades Curriculares
          </span>
          <p className="mt-2 text-3xl font-extrabold text-blue-600">
            {loading ? '...' : stats.ucs}
          </p>
          <span className="mt-1 block text-xs text-slate-500">Mapeadas no Supabase</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            PEUCs Geradas
          </span>
          <p className="mt-2 text-3xl font-extrabold text-emerald-600">
            {loading ? '...' : stats.peucs}
          </p>
          <span className="mt-1 block text-xs text-slate-500">Planos de ensino concluídos</span>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Ações do Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <Link
            href="/importar-pca"
            className="group rounded-lg border border-slate-200 p-4 hover:border-blue-500 hover:bg-blue-50/50 transition"
          >
            <h3 className="font-semibold text-sm text-slate-900 group-hover:text-blue-600">
              📄 1. Importar PCA (PDF)
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Alimente a base de dados extraindo Categoria, Curso e UCs via IA.
            </p>
          </Link>

          <Link
            href="/cursos"
            className="group rounded-lg border border-slate-200 p-4 hover:border-blue-500 hover:bg-blue-50/50 transition"
          >
            <h3 className="font-semibold text-sm text-slate-900 group-hover:text-blue-600">
              📚 2. Consultar Acervo
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Visualize a lista de cursos cadastrados e suas respectivas disciplinas.
            </p>
          </Link>

          <Link
            href="/peuc/criar"
            className="group rounded-lg border border-slate-200 p-4 hover:border-blue-500 hover:bg-blue-50/50 transition"
          >
            <h3 className="font-semibold text-sm text-slate-900 group-hover:text-blue-600">
              ⚡ 3. Criar Nova PEUC
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Elabore o Plano de Ensino integrando a Situação de Aprendizagem.
            </p>
          </Link>

        </div>
      </div>
    </main>
  );
}
