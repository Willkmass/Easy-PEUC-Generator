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
    <main className="min-h-screen bg-[#090A15] text-slate-100 pb-20 font-sans">
      {/* HEADER NO PADRÃO DA SUA IMAGEM */}
      <header className="bg-[#0D0E20] border-b border-indigo-900/30 py-8 px-6 mb-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-[#1A1C3E] text-indigo-300 text-[10px] font-bold px-3 py-1 rounded-full border border-indigo-500/30 tracking-wider">
                EASY PEUC GENERATOR
              </span>
              <span className="bg-[#16192E] text-slate-400 text-[10px] font-medium px-3 py-1 rounded-full border border-slate-700/40">
                Acervo de Cursos
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Acervo de Cursos & UCs
            </h1>
            <p className="text-sm text-slate-400 mt-2 font-normal">
              Base de dados cadastrada via extração de PCA (SENAI-PR).
            </p>
          </div>
          <button
            onClick={carregarCursos}
            className="inline-flex items-center justify-center rounded-lg border border-slate-700/60 bg-[#14162E] px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-[#1C1F42] transition"
          >
            🔄 Atualizar Lista
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6">
        {loading && (
          <div className="bg-[#0D0E20] border border-slate-800 rounded-2xl p-8 text-center">
            <p className="text-sm text-indigo-400 font-medium animate-pulse">Carregando acervo de cursos...</p>
          </div>
        )}

        {erro && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4">
            <p className="text-sm font-medium text-rose-300">{erro}</p>
          </div>
        )}

        {!loading && !erro && cursos.length === 0 && (
          <div className="bg-[#0D0E20] border border-dashed border-slate-800 rounded-2xl p-12 text-center">
            <h3 className="text-base font-bold text-slate-200">Nenhum curso cadastrado ainda</h3>
            <p className="mt-1 text-sm text-slate-400">
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
                  className={`overflow-hidden rounded-xl border transition ${
                    isExpanded ? 'border-indigo-500/40 bg-[#12142B]' : 'border-slate-800/80 bg-[#0D0E20] hover:border-slate-700'
                  }`}
                >
                  {/* Linha Principal do Curso */}
                  <div
                    onClick={() => curso.id && toggleExpandir(curso.id)}
                    className="flex cursor-pointer flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 hover:bg-[#161836] transition duration-150"
                  >
                    <div className="flex flex-col gap-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-block rounded bg-[#1A1C3E] px-2.5 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/20 uppercase tracking-wider">
                          {curso.categoria || 'Curso'}
                        </span>
                        {curso.carga_horaria_total && (
                          <span className="text-xs font-medium text-slate-400 bg-slate-800/40 px-2 py-0.5 rounded border border-slate-700/30">
                            • {curso.carga_horaria_total}
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-bold text-white leading-tight">{curso.nome}</h2>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-300 bg-[#161836] px-3 py-1 rounded-full border border-slate-700/40">
                        {qtdUCs} {qtdUCs === 1 ? 'UC' : 'UCs'}
                      </span>

                      {/* Botão de Excluir */}
                      <button
                        type="button"
                        disabled={isDeletando}
                        onClick={(e) => curso.id && handleDeletarCurso(e, curso.id, curso.nome)}
                        title="Excluir curso"
                        className="inline-flex items-center gap-1 rounded-md border border-rose-500/20 bg-rose-950/20 px-2.5 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-900/40 transition disabled:opacity-50"
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
                    <div className="border-t border-slate-800/60 bg-[#0A0B1A] p-5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Unidades Curriculares Vinculadas
                      </h3>

                      {qtdUCs === 0 ? (
                        <p className="text-xs text-slate-500 italic">Nenhuma UC vinculada a este curso.</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {curso.unidades_curriculares?.map((uc, idx) => (
                            <div
                              key={uc.id || `uc-item-${idx}`}
                              className="rounded-lg border border-slate-800/80 bg-[#0D0E20] p-4 shadow-2xs"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-sm text-slate-200">
                                  {uc.numero ? `${uc.numero}. ` : ''}{uc.nome}
                                </h4>
                                {uc.carga_horaria ? (
                                  <span className="text-xs font-bold text-slate-300 bg-emerald-950/60 border border-emerald-500/20 px-2 py-0.5 rounded">
                                    {uc.carga_horaria}h
                                  </span>
                                ) : null}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
                                {/* Capacidades */}
                                <div>
                                  <span className="font-bold text-indigo-300 block mb-1">
                                    Capacidades ({uc.capacidades?.length || 0}):
                                  </span>
                                  {uc.capacidades && uc.capacidades.length > 0 ? (
                                    <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                                      {uc.capacidades.map((cap, capIdx) => (
                                        <li key={capIdx} className="line-clamp-2">{cap}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <span className="text-slate-500 italic">Nenhuma capacidade listada.</span>
                                  )}
                                </div>

                                {/* Conhecimentos */}
                                <div>
                                  <span className="font-bold text-indigo-300 block mb-1">
                                    Conhecimentos ({uc.conhecimentos?.length || 0}):
                                  </span>
                                  {uc.conhecimentos && uc.conhecimentos.length > 0 ? (
                                    <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                                      {uc.conhecimentos.map((con, conIdx) => (
                                        <li key={conIdx} className="line-clamp-2">{con}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <span className="text-slate-500 italic">Nenhum conhecimento listado.</span>
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
      </div>
    </main>
  );
}
