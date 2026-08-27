'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Curso, UnidadeCurricular } from '@/types';

interface CursoComUCs extends Curso {
  unidades_curriculares?: UnidadeCurricular[];
}

export default function CursosPage() {
  const [cursos, setCursos] = useState<CursoComUCs[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [cursoExpandido, setCursoExpandido] = useState<string | null>(null);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);

  const carregarCursos = async () => {
    setLoading(true);
    setErro(null);

    try {
      // 1. Carrega dados do Supabase
      const { data: dataSupabase, error } = await supabase
        .from('cursos')
        .select(`
          *,
          unidades_curriculares (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Falha ao buscar no Supabase, buscando backup local:', error);
      }

      const cursosSupabase = (dataSupabase || []).map((c: any) => ({
        ...c,
        unidades_curriculares: c.unidades_curriculares?.sort(
          (a: UnidadeCurricular, b: UnidadeCurricular) => (a.numero || 0) - (b.numero || 0)
        ),
      }));

      // 2. Carrega dados do localStorage (Fallback de Ingestão Local)
      let cursosLocais: CursoComUCs[] = [];
      try {
        const localRaw = localStorage.getItem('cursos_peuc');
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          cursosLocais = parsed.map((item: any, idx: number) => ({
            id: item.id ? String(item.id) : `local-${idx}`,
            nome: item.nomeCurso || item.nome || 'Curso sem nome',
            categoria: item.categoria || 'Geral',
            carga_horaria_total: item.cargaHorariaTotal || '',
            created_at: item.criadoEm || new Date().toISOString(),
            unidades_curriculares: (item.unidadesCurriculares || item.unidades_curriculares || []).map(
              (uc: any, ucIdx: number) => ({
                id: uc.id || `uc-${ucIdx}`,
                numero: uc.numero || ucIdx + 1,
                nome: uc.nomeUc || uc.nome || 'UC sem nome',
                carga_horaria: uc.cargaHoraria || uc.carga_horaria || 0,
                capacidades: uc.capacidades || [],
                conhecimentos: uc.conhecimentos || [],
              })
            ),
          }));
        }
      } catch (e) {
        console.error('Erro ao ler localStorage:', e);
      }

      // 3. Mescla ambas as fontes evitando duplicidade por ID ou Nome
      const mapaCursos = new Map<string, CursoComUCs>();

      [...cursosSupabase, ...cursosLocais].forEach((curso) => {
        const chave = curso.id || curso.nome;
        if (!mapaCursos.has(chave)) {
          mapaCursos.set(chave, curso);
        }
      });

      setCursos(Array.from(mapaCursos.values()));
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar acervo de cursos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarCursos();
  }, []);

  const toggleExpandir = (id: string) => {
    setCursoExpandido(cursoExpandido === id ? null : id);
  };

  const handleDeletarCurso = async (e: React.MouseEvent, id: string, nome: string) => {
    e.stopPropagation();

    const confirmou = window.confirm(
      `Tem certeza que deseja excluir o curso "${nome}"?\n\nEsta ação excluirá permanentemente o curso.`
    );

    if (!confirmou) return;

    try {
      setDeletandoId(id);

      // Remove do Supabase se não for ID temporário local
      if (!id.startsWith('local-')) {
        const { error } = await supabase.from('cursos').delete().eq('id', id);
        if (error) console.warn('Erro ao deletar no Supabase:', error);
      }

      // Remove do localStorage
      try {
        const localRaw = localStorage.getItem('cursos_peuc');
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          const filtrados = parsed.filter(
            (item: any) => String(item.id) !== id && item.nomeCurso !== nome && item.nome !== nome
          );
          localStorage.setItem('cursos_peuc', JSON.stringify(filtrados));
        }
      } catch (e) {
        console.error('Erro ao remover do localStorage:', e);
      }

      setCursos((prev) => prev.filter((curso) => curso.id !== id));
      if (cursoExpandido === id) {
        setCursoExpandido(null);
      }
    } catch (err: any) {
      alert(`Erro ao excluir o curso: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setDeletandoId(null);
    }
  };

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Acervo de Cursos & UCs</h1>
          <p className="text-sm text-slate-500">
            Base de dados cadastrada via extração de PCA (SENAI-PR).
          </p>
        </div>
        <button
          onClick={carregarCursos}
          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
        >
          🔄 Atualizar Lista
        </button>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-blue-600 font-medium animate-pulse">Carregando acervo de cursos...</p>
        </div>
      )}

      {erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-600">{erro}</p>
        </div>
      )}

      {!loading && !erro && cursos.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h3 className="text-base font-semibold text-slate-900">Nenhum curso cadastrado ainda</h3>
          <p className="mt-1 text-sm text-slate-500">
            Importe um Plano de Curso (PCA) em formato PDF para alimentar a base de dados.
          </p>
        </div>
      )}

      {!loading && !erro && cursos.length > 0 && (
        <div className="space-y-4">
          {cursos.map((curso) => {
            const isExpanded = cursoExpandido === curso.id;
            const qtdUCs = curso.unidades_curriculares?.length || 0;
            const isDeletando = deletandoId === curso.id;

            return (
              <div
                key={curso.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300"
              >
                {/* Linha Principal do Curso */}
                <div
                  onClick={() => curso.id && toggleExpandir(curso.id)}
                  className="flex cursor-pointer flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 hover:bg-slate-50/50"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-block rounded bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-100">
                        {curso.categoria || 'Curso'}
                      </span>
                      {curso.carga_horaria_total && (
                        <span className="text-xs font-medium text-slate-500">
                          • {curso.carga_horaria_total}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">{curso.nome}</h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                      {qtdUCs} {qtdUCs === 1 ? 'UC' : 'UCs'}
                    </span>

                    {/* Botão de Excluir */}
                    <button
                      type="button"
                      disabled={isDeletando}
                      onClick={(e) => curso.id && handleDeletarCurso(e, curso.id, curso.nome)}
                      title="Excluir curso"
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 hover:text-red-700 transition disabled:opacity-50"
                    >
                      {isDeletando ? 'Excluindo...' : '🗑️ Excluir'}
                    </button>

                    <span className="text-slate-400 text-sm font-bold ml-1">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {/* Detalhes expandidos: Lista de UCs */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/60 p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      Unidades Curriculares Vinculadas
                    </h3>

                    {qtdUCs === 0 ? (
                      <p className="text-xs text-slate-500 italic">Nenhuma UC vinculada a este curso.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {curso.unidades_curriculares?.map((uc, idx) => (
                          <div
                            key={uc.id || `uc-item-${idx}`}
                            className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-sm text-slate-900">
                                {uc.numero ? `${uc.numero}. ` : ''}{uc.nome}
                              </h4>
                              {uc.carga_horaria ? (
                                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                  {uc.carga_horaria}h
                                </span>
                              ) : null}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
                              {/* Capacidades */}
                              <div>
                                <span className="font-bold text-slate-700 block mb-1">
                                  Capacidades ({uc.capacidades?.length || 0}):
                                </span>
                                {uc.capacidades && uc.capacidades.length > 0 ? (
                                  <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                                    {uc.capacidades.map((cap, capIdx) => (
                                      <li key={capIdx} className="line-clamp-2">{cap}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="text-slate-400 italic">Nenhuma capacidade listada.</span>
                                )}
                              </div>

                              {/* Conhecimentos */}
                              <div>
                                <span className="font-bold text-slate-700 block mb-1">
                                  Conhecimentos ({uc.conhecimentos?.length || 0}):
                                </span>
                                {uc.conhecimentos && uc.conhecimentos.length > 0 ? (
                                  <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                                    {uc.conhecimentos.map((con, conIdx) => (
                                      <li key={conIdx} className="line-clamp-2">{con}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="text-slate-400 italic">Nenhum conhecimento listado.</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
