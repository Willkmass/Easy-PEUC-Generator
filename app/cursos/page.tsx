'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Curso, UnidadeCurricular } from '@/types';
import { RefreshCw, Trash2, ChevronDown, ChevronUp, Clock, Layers, GraduationCap, AlertTriangle, BookOpen, BrainCircuit } from 'lucide-react';

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
        id: String(c.id), // Normalizando ID para string
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
                id: uc.id ? String(uc.id) : `uc-${ucIdx}`,
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

      // 3. Mescla ambas as fontes evitando duplicidade por ID ou Nome Normalizado
      const mapaCursos = new Map<string, CursoComUCs>();

      [...cursosSupabase, ...cursosLocais].forEach((curso) => {
        const chave = curso.id || curso.nome.trim().toLowerCase();
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
            (item: any) => String(item.id) !== id && (item.nomeCurso !== nome && item.nome !== nome)
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
    <main className="min-h-screen bg-slate-950 text-slate-100 pb-20 selection:bg-purple-500 selection:text-white font-sans">
      {/* HEADER - Seguindo o padrão premium */}
      <header className="relative overflow-hidden bg-slate-900 border-b border-indigo-500/10 py-10 px-6 shadow-2xl mb-10">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/10 text-indigo-400 text-[11px] font-bold px-3 py-1 rounded-full border border-indigo-500/20 uppercase tracking-wider">
                Easy PEUC Generator
              </span>
              <span className="bg-slate-800 text-slate-400 text-[11px] font-medium px-2.5 py-1 rounded-full border border-slate-700/50">
                Acervo Digital
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mt-3 tracking-tight flex items-center gap-3">
              <GraduationCap className="w-9 h-9 text-indigo-400" />
              Acervo de Cursos & UCs
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl font-normal leading-relaxed">
              Base de dados cadastrada via extração de PCA (SENAI-PR). Gerencie as matrizes curriculares disponíveis para o plano de ensino.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={carregarCursos}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800 px-5 py-3 text-xs font-semibold text-slate-200 shadow-lg hover:bg-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Atualizando...' : '🔄 Atualizar Acervo'}
            </button>
            <button
              onClick={() => (window.location.href = '/peuc/criar')}
              className="text-xs font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white px-5 py-3 rounded-xl shadow-xl transition"
            >
              + Novo PEUC
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6">
        {/* States de Loading/Erro/Vazio no padrão visual */}
        {loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center shadow-2xl">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-indigo-600/10 text-indigo-400 mb-4 animate-spin-slow">
              <RefreshCw className="w-8 h-8" />
            </div>
            <p className="text-sm text-slate-300 font-medium">Sincronizando base de dados do acervo...</p>
          </div>
        )}

        {erro && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 flex items-center gap-4">
            <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
            <p className="text-sm font-medium text-rose-300">{erro}</p>
          </div>
        )}

        {!loading && !erro && cursos.length === 0 && (
          <div className="bg-slate-900 border-2 border-dashed border-slate-700 rounded-3xl p-16 text-center shadow-2xl">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-slate-800 text-slate-500 mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Nenhum curso cadastrado ainda</h3>
            <p className="mt-2 text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
              Importe um Plano de Curso (PCA) em formato PDF na aba "Importar PCA" para alimentar a base de dados do Easy PEUC Generator.
            </p>
          </div>
        )}

        {/* Lista de Cursos no padrão Dark Mode Cards */}
        {!loading && !erro && cursos.length > 0 && (
          <div className="space-y-6">
            {cursos.map((curso) => {
              const isExpanded = cursoExpandido === curso.id;
              const qtdUCs = curso.unidades_curriculares?.length || 0;
              const isDeletando = deletandoId === curso.id;

              return (
                <div
                  key={curso.id}
                  className={`overflow-hidden rounded-3xl border transition shadow-xl ${
                    isExpanded ? 'border-indigo-500/50' : 'border-slate-800 hover:border-slate-700'
                  } bg-slate-900/90 backdrop-blur-sm`}
                >
                  {/* Header do Card do Curso - Área clicável */}
                  <div
                    onClick={() => curso.id && toggleExpandir(curso.id)}
                    className="flex cursor-pointer flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 hover:bg-slate-800/40 transition duration-200"
                  >
                    <div className="flex flex-col gap-1.5 flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex rounded-lg bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-400 border border-indigo-500/20 uppercase tracking-wider shadow-inner">
                          {curso.categoria || 'Curso'}
                        </span>
                        {curso.carga_horaria_total && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-800/50 px-2.5 py-0.5 rounded-full border border-slate-700/50">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {curso.carga_horaria_total}
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-bold text-white tracking-tight leading-snug">{curso.nome}</h2>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 bg-slate-800 px-3.5 py-1.5 rounded-full border border-slate-700/50 shadow">
                        <Layers className="w-4 h-4 text-slate-500" />
                        {qtdUCs} {qtdUCs === 1 ? 'UC' : 'UCs'}
                      </span>

                      {/* Botão de Excluir estilizado (Rose padrão) */}
                      <button
                        type="button"
                        disabled={isDeletando}
                        onClick={(e) => curso.id && handleDeletarCurso(e, curso.id, curso.nome)}
                        title="Excluir curso"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-950/20 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900 hover:border-rose-400/40 transition disabled:opacity-50 disabled:scale-100 active:scale-95 shadow"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {isDeletando ? 'Excluindo...' : '🗑️'}
                      </button>

                      <div className={`p-1.5 rounded-full transition ${isExpanded ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-white" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detalhes expandidos: Lista de UCs vinculadas */}
                  {isExpanded && (
                    <div className="border-t border-slate-800 bg-slate-950/40 p-6 md:p-8 space-y-5">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2.5 mb-5 border-b border-slate-800 pb-3">
                        <BookOpen className="w-4 h-4 text-slate-600" />
                        Unidades Curriculares Vinculadas à Matriz
                      </h3>

                      {qtdUCs === 0 ? (
                        <p className="text-xs text-slate-500 italic py-4 bg-slate-900 rounded-lg text-center border border-dashed border-slate-700">
                          Nenhuma Unidade Curricular vinculada a este curso.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                          {curso.unidades_curriculares?.map((uc, idx) => (
                            <div
                              key={uc.id || `uc-item-${idx}`}
                              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-inner transition hover:border-slate-700 hover:scale-[1.01]"
                            >
                              <div className="flex justify-between items-start gap-3 mb-4 pb-3 border-b border-slate-800">
                                <h4 className="font-semibold text-sm text-slate-100 flex items-baseline gap-1.5 leading-relaxed">
                                  {uc.numero && (
                                    <span className="font-black text-indigo-400 text-xs">{uc.numero}.</span>
                                  )}
                                  {uc.nome}
                                </h4>
                                {uc.carga_horaria ? (
                                  <span className="shrink-0 text-xs font-extrabold text-slate-200 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-1 rounded-md shadow-inner">
                                    {uc.carga_horaria}h
                                  </span>
                                ) : null}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                                {/* Capacidades */}
                                <div className="bg-slate-950 p-4 rounded-xl space-y-2 border border-slate-800/60 shadow-md">
                                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                    <BrainCircuit className="w-3.5 h-3.5 text-indigo-500" />
                                    Capacidades ({uc.capacidades?.length || 0})
                                  </span>
                                  {uc.capacidades && uc.capacidades.length > 0 ? (
                                    <ul className="list-decimal list-inside space-y-1.5 text-slate-400 leading-relaxed font-normal">
                                      {uc.capacidades.map((cap, capIdx) => (
                                        <li key={capIdx} className="line-clamp-2">{cap}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <span className="text-slate-500 italic">Nenhuma capacidade listada.</span>
                                  )}
                                </div>

                                {/* Conhecimentos */}
                                <div className="bg-slate-950 p-4 rounded-xl space-y-2 border border-slate-800/60 shadow-md">
                                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5 text-purple-500" />
                                    Conhecimentos ({uc.conhecimentos?.length || 0})
                                  </span>
                                  {uc.conhecimentos && uc.conhecimentos.length > 0 ? (
                                    <ul className="list-decimal list-inside space-y-1.5 text-slate-400 leading-relaxed font-normal">
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
        </div>
      )}
    </main>
  );
}
