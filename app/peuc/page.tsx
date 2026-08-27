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
    <main className="mx-auto max-w-6xl p-6">
      <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Planos de Ensino (PEUC)</h1>
          <p className="text-sm text-slate-500">Lista de PEUCs cadastradas no sistema</p>
        </div>
        <Link
          href="/peuc/criar"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-md shadow-sm transition"
        >
          + Nova PEUC
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Carregando PEUCs salvas...</div>
      ) : peucs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8">
          <p className="text-slate-600 mb-4">Nenhuma PEUC encontrada localmente ou no banco.</p>
          <Link
            href="/peuc/criar"
            className="inline-block bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-md"
          >
            Criar Primeira PEUC
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {peucs.map((peuc) => (
            <div key={peuc.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {peuc.modalidade || 'PEUC SENAI'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {peuc.created_at ? new Date(peuc.created_at).toLocaleDateString('pt-BR') : ''}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">{peuc.uc_nome || 'UC não informada'}</h3>
                <p className="text-xs text-slate-600 mb-3 font-medium">Curso: {peuc.curso_nome || 'Não informado'}</p>
                
                <div className="text-xs text-slate-500 space-y-1 mb-4">
                  <p><strong>Docente:</strong> {peuc.docente || 'N/A'}</p>
                  <p><strong>Estratégia:</strong> {peuc.tipo_situacao || 'N/A'}</p>
                  <p><strong>Linhas de Aula:</strong> {peuc.planos_aula?.length || 0} item(ns)</p>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <Link
                  href={`/peuc/visualizar/${peuc.id}`}
                  className="w-full text-center bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold py-2 rounded-md block transition"
                >
                  Visualizar / Imprimir
                </Link>
                <button
                  onClick={() => excluirPEUC(peuc.id)}
                  className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-3 py-2 rounded-md transition"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
