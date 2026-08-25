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

  const carregarCursos = async () => {
    setLoading(true);
    setErro(null);

    try {
      // Busca cursos e inclui suas unidades curriculares ordenadas pelo número
      const { data, error } = await supabase
        .from('cursos')
        .select(`
          *,
          unidades_curriculares (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Ordenar as UCs internamente pelo número da UC
      const cursosFormatados = (data || []).map((c: any) => ({
        ...c,
        unidades_curriculares: c.unidades_curriculares?.sort(
          (a: UnidadeCurricular, b: UnidadeCurricular) => a.numero - b.numero
        ),
      }));

      setCursos(cursosFormatados);
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
          <p className="text-sm text-blue-600 font-medium animate-pulse">Carregando acervo do Supabase...</p>
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
                        {curso.categoria}
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
                    <span className="text-slate-400 text-sm font-bold">
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
                        {curso.unidades_curriculares?.map((uc) => (
                          <div
                            key={uc.id || uc.numero}
                            className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-sm text-slate-900">
                                {uc.numero}. {uc.nome}
                              </h4>
                              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                {uc.carga_horaria}h
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
                              {/* Capacidades */}
                              <div>
                                <span className="font-bold text-slate-700 block mb-1">
                                  Capacidades ({uc.capacidades?.length || 0}):
                                </span>
                                {uc.capacidades && uc.capacidades.length > 0 ? (
                                  <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                                    {uc.capacidades.map((cap, idx) => (
                                      <li key={idx} className="line-clamp-2">{cap}</li>
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
                                    {uc.conhecimentos.map((con, idx) => (
                                      <li key={idx} className="line-clamp-2">{con}</li>
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
