'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ListaPeucsPage() {
  const [peucs, setPeucs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [peucDetalhada, setPeucDetalhada] = useState<any | null>(null);

  const carregarPeucs = async () => {
    setLoading(true);
    setErro(null);

    // 1. Busca do Supabase
    let peucsSupabase: any[] = [];
    try {
      const { data, error } = await supabase
        .from('peucs')
        .select(`
          *,
          cursos (nome, categoria),
          unidades_curriculares (nome, carga_horaria)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        peucsSupabase = data;
      }
    } catch (err) {
      console.warn('Falha ao buscar PEUCs do Supabase:', err);
    }

    // 2. Busca do localStorage
    let peucsLocais: any[] = [];
    try {
      const localRaw = localStorage.getItem('peucs_salvas');
      const cursosLocaisRaw = localStorage.getItem('cursos_peuc');

      if (localRaw) {
        const parsedPeucs = JSON.parse(localRaw);
        const parsedCursos = cursosLocaisRaw ? JSON.parse(cursosLocaisRaw) : [];

        peucsLocais = parsedPeucs.map((item: any) => {
          // Resolve referências de Curso e UC caso o dado venha do localStorage
          let cursoObj = parsedCursos.find(
            (c: any) => String(c.id) === String(item.curso_id) || c.nomeCurso === item.curso_id
          );

          let ucObj: any = null;
          if (cursoObj && cursoObj.unidadesCurriculares) {
            ucObj = cursoObj.unidadesCurriculares.find(
              (u: any) => String(u.id) === String(item.unidade_curricular_id) || u.nomeUc === item.unidade_curricular_id
            );
          }

          return {
            ...item,
            cursos: item.cursos || {
              nome: cursoObj?.nomeCurso || cursoObj?.nome || 'Curso Local',
              categoria: cursoObj?.categoria || 'Geral',
            },
            unidades_curriculares: item.unidades_curriculares || {
              nome: ucObj?.nomeUc || ucObj?.nome || 'UC Local',
              carga_horaria: ucObj?.cargaHoraria || ucObj?.carga_horaria || 0,
            },
          };
        });
      }
    } catch (err) {
      console.error('Erro ao ler PEUCs do localStorage:', err);
    }

    // 3. Mescla e desduplica por ID
    const mapa = new Map<string, any>();
    [...peucsSupabase, ...peucsLocais].forEach((peuc) => {
      const idChave = peuc.id || `${peuc.curso_id}-${peuc.unidade_curricular_id}`;
      if (!mapa.has(idChave)) {
        mapa.set(idChave, peuc);
      }
    });

    setPeucs(Array.from(mapa.values()));
    setLoading(false);
  };

  useEffect(() => {
    carregarPeucs();
  }, []);

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">PEUCs Elaboradas</h1>
          <p className="text-sm text-slate-500">
            Gerencie, consulte e valide os Planos de Ensino por Unidade Curricular salvos no sistema.
          </p>
        </div>
        <Link
          href="/peuc/criar"
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          + Criar Nova PEUC
        </Link>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-blue-600 font-medium animate-pulse">Carregando registros de PEUCs...</p>
        </div>
      )}

      {erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-600">{erro}</p>
        </div>
      )}

      {!loading && !erro && peucs.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h3 className="text-base font-semibold text-slate-900">Nenhuma PEUC cadastrada</h3>
          <p className="mt-1 text-sm text-slate-500 mb-4">
            Utilize os dados importados dos PCAs para elaborar seu primeiro Plano de Ensino.
          </p>
          <Link
            href="/peuc/criar"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            Elaborar PEUC Agora
          </Link>
        </div>
      )}

      {!loading && !erro && peucs.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {peucs.map((peuc) => (
            <div
              key={peuc.id}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-slate-300 transition"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-100">
                      {peuc.cursos?.categoria || 'Geral'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {peuc.cursos?.nome || 'Curso Sem Nome'}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    UC: {peuc.unidades_curriculares?.nome || 'UC Não Identificada'} ({peuc.unidades_curriculares?.carga_horaria || 0}h)
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    {peuc.status || 'Concluído'}
                  </span>
                  <button
                    onClick={() => setPeucDetalhada(peucDetalhada?.id === peuc.id ? null : peuc)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    {peucDetalhada?.id === peuc.id ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                  </button>
                </div>
              </div>

              {/* Informações Resumidas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-600 block mb-1">Estratégia Pedagógica:</span>
                  <span className="text-slate-800 font-medium">{peuc.tipo_situacao_aprendizagem}</span>
                  {peuc.integra_outra_uc && (
                    <span className="ml-2 text-blue-600 font-semibold">(Integra outra UC)</span>
                  )}
                </div>
                <div>
                  <span className="font-bold text-slate-600 block mb-1">Data de Criação:</span>
                  <span className="text-slate-800">
                    {peuc.created_at ? new Date(peuc.created_at).toLocaleDateString('pt-BR') : 'Sem data'}
                  </span>
                </div>
              </div>

              {/* Modal/Gaveta de Detalhes Expandidos */}
              {peucDetalhada?.id === peuc.id && (
                <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50 p-4 rounded-lg space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-700 block uppercase">Contextualização:</span>
                    <p className="text-slate-800 mt-1 whitespace-pre-line">{peuc.contextualizacao}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block uppercase">Desafio:</span>
                    <p className="text-slate-800 mt-1 whitespace-pre-line">{peuc.desafio}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block uppercase">Resultados Esperados:</span>
                    <p className="text-slate-800 mt-1 whitespace-pre-line">{peuc.resultados_esperados}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
