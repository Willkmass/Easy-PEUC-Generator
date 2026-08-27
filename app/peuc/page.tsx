'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ListarPEUCsPage() {
  const [peucs, setPeucs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarPEUCs();
  }, []);

  const carregarPEUCs = async () => {
    setLoading(true);
    let peucsBanco: any[] = [];

    // 1. Tenta buscar no Supabase
    try {
      const { data } = await supabase.from('peucs').select('*').order('created_at', { ascending: false });
      if (data) peucsBanco = data;
    } catch (err) {
      console.warn('Supabase offline ou sem tabela peucs:', err);
    }

    // 2. Busca no localStorage
    let peucsLocais: any[] = [];
    try {
      const localRaw = localStorage.getItem('peucs_salvas');
      if (localRaw) {
        peucsLocais = JSON.parse(localRaw);
      }
    } catch (err) {
      console.error('Erro ao ler localStorage:', err);
    }

    // Unifica os dados removendo duplicados por ID
    const mapa = new Map<string, any>();
    [...peucsBanco, ...peucsLocais].forEach(item => mapa.set(item.id, item));
    
    setPeucs(Array.from(mapa.values()));
    setLoading(false);
  };

  const excluirPEUC = (id: string) => {
    if (!confirm('Deseja realmente excluir esta PEUC?')) return;

    // Remove do localStorage
    const locaisAtualizados = peucs.filter(p => String(p.id) !== String(id));
    localStorage.setItem('peucs_salvas', JSON.stringify(locaisAtualizados));

    // Atualiza estado local
    setPeucs(locaisAtualizados);
  };

  return (
    <main className="min-h-screen bg-[#080914] text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Topo / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider uppercase bg-[#181c33] text-indigo-300 px-3 py-1 rounded-full border border-indigo-900/40">
                EASY PEUC GENERATOR
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase bg-[#14182b] text-slate-400 px-3 py-1 rounded-full border border-slate-800">
                Planos Cadastrados
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Planos de Ensino (PEUC)
            </h1>
            <p className="text-sm text-slate-400">
              Lista de PEUCs cadastradas no sistema.
            </p>
          </div>

          <Link
            href="/peuc/criar"
            className="inline-flex items-center justify-center bg-[#1e2544] hover:bg-[#273057] text-white font-bold text-xs px-4 py-2.5 rounded-lg border border-slate-700/60 shadow-lg transition-all"
          >
            + Nova PEUC
          </Link>
        </div>

        {/* Conteúdo Principal */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-sm font-semibold animate-pulse">
            Carregando PEUCs salvas...
          </div>
        ) : peucs.length === 0 ? (
          <div className="text-center py-16 bg-[#0f1222] rounded-xl border border-slate-800/80 p-8 space-y-4 shadow-xl">
            <p className="text-slate-400 text-sm">Nenhuma PEUC encontrada localmente ou no banco.</p>
            <Link
              href="/peuc/criar"
              className="inline-block bg-[#1e2544] hover:bg-[#273057] text-white text-xs font-bold px-5 py-2.5 rounded-lg border border-slate-700/60 transition-all"
            >
              Criar Primeira PEUC
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {peucs.map((peuc) => (
              <div
                key={peuc.id}
                className="bg-[#0f1222] border border-slate-800/90 rounded-xl p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold tracking-wider uppercase bg-[#181c33] text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-900/50">
                      {peuc.modalidade || 'PEUC SENAI'}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      {peuc.created_at ? new Date(peuc.created_at).toLocaleDateString('pt-BR') : ''}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-white text-lg tracking-tight line-clamp-2">
                      {peuc.uc_nome || 'UC não informada'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      Curso: <span className="text-slate-200">{peuc.curso_nome || 'Não informado'}</span>
                    </p>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1.5 pt-2 border-t border-slate-800/80">
                    <p><strong className="text-slate-300">Docente:</strong> {peuc.docente || 'N/A'}</p>
                    <p><strong className="text-slate-300">Estratégia:</strong> {peuc.tipo_situacao || 'N/A'}</p>
                    <p><strong className="text-slate-300">Linhas de Aula:</strong> {peuc.planos_aula?.length || 0} item(ns)</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-800/80">
                  <Link
                    href={`/peuc/visualizar/${peuc.id}`}
                    className="flex-1 text-center bg-[#161a30] hover:bg-[#1f2545] text-indigo-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-indigo-900/40 transition-all"
                  >
                    Visualizar / Imprimir
                  </Link>
                  <button
                    onClick={() => excluirPEUC(peuc.id)}
                    className="bg-[#2a121d] hover:bg-[#3d1727] text-rose-300 hover:text-rose-100 text-xs font-bold px-3 py-2 rounded-lg border border-rose-900/50 transition-all"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
