'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CriarPEUCPage() {
  const router = useRouter();

  // Estados principais
  const [listaCursos, setListaCursos] = useState<any[]>([]);
  const [ucsDisponiveis, setUcsDisponiveis] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Formulário - Seleção de Curso e UC
  const [cursoSelecionado, setCursoSelecionado] = useState('');
  const [modalidade, setModalidade] = useState('');
  const [ucSelecionada, setUcSelecionada] = useState('');
  const [ucCargaHoraria, setUcCargaHoraria] = useState('');
  const [modulo, setModulo] = useState('');
  const [docente, setDocente] = useState('');
  const [numAulas, setNumAulas] = useState('20');
  const [numSa, setNumSa] = useState('1');

  // Objetivos e Capacidades
  const [objetivoGeral, setObjetivoGeral] = useState('');
  const [competencias, setCompetencias] = useState('');
  const [capacidadesTecnicas, setCapacidadesTecnicas] = useState('');
  const [capacidadesBasicas, setCapacidadesBasicas] = useState('');
  const [capacidadesSocioemocionais, setCapacidadesSocioemocionais] = useState('');

  // Situação de Aprendizagem
  const [tipoSituacao, setTipoSituacao] = useState('Situação-Problema');
  const [contextualizacao, setContextualizacao] = useState('');
  const [desafio, setDesafio] = useState('');
  const [resultadosEsperados, setResultadosEsperados] = useState('');
  const [criteriosQualidade, setCriteriosQualidade] = useState('');
  const [gerandoIA, setGerandoIA] = useState(false);

  // Plano de Aula
  const [planosAula, setPlanosAula] = useState([
    {
      numAulas: '4',
      conhecimentos: '',
      capacidades: '',
      estrategias: '',
      recursos: '',
      instrumentos: ''
    }
  ]);

  // Função para gerar automaticamente as lacunas de plano de aula
  const gerarLacunasAulas = (cargaHoraria: string) => {
    const ch = parseFloat(cargaHoraria);
    if (!isNaN(ch) && ch > 0) {
      const quantidadeAulas = Math.ceil(ch / 4);
      const novasAulas = Array.from({ length: quantidadeAulas }, () => ({
        numAulas: '4',
        conhecimentos: '',
        capacidades: '',
        estrategias: '',
        recursos: '',
        instrumentos: ''
      }));
      setPlanosAula(novasAulas);
    }
  };

  useEffect(() => {
    if (ucCargaHoraria) {
      gerarLacunasAulas(ucCargaHoraria);
    }
  }, [ucCargaHoraria]);

  // Formatador auxiliar de textos
  const formatarTexto = (val: any): string => {
    if (!val) return '';
    if (Array.isArray(val)) {
      return val.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join('\n');
    }
    if (typeof val === 'object') return JSON.stringify(val, null, 2);
    return String(val);
  };

  // Carrega matrizes e UCs
  const carregarDadosCursosEUCs = async () => {
    setCarregando(true);
    let cursosEncontrados: any[] = [];

    try {
      const { data: pcasDb, error: errPca } = await supabase.from('pcas').select('*');
      if (!errPca && pcasDb && pcasDb.length > 0) {
        cursosEncontrados = pcasDb;
      } else {
        const { data: cursosDb } = await supabase.from('cursos').select('*');
        if (cursosDb && cursosDb.length > 0) {
          cursosEncontrados = cursosDb;
        }
      }
    } catch (e) {
      console.warn('Busca no Supabase falhou, tentando localStorage:', e);
    }

    try {
      const chavesRelevantes = ['cursos_peuc', 'pcas_salvos', 'cursos'];
      chavesRelevantes.forEach((chave) => {
        const itemStr = localStorage.getItem(chave);
        if (itemStr) {
          try {
            const parsed = JSON.parse(itemStr);
            if (Array.isArray(parsed)) {
              cursosEncontrados = [...cursosEncontrados, ...parsed];
            } else if (parsed && typeof parsed === 'object') {
              if (parsed.cursos || parsed.pcas || parsed.data) {
                const arr = parsed.cursos || parsed.pcas || parsed.data;
                if (Array.isArray(arr)) cursosEncontrados = [...cursosEncontrados, ...arr];
              } else {
                cursosEncontrados.push(parsed);
              }
            }
          } catch (e) {}
        }
      });

      if (cursosEncontrados.length === 0) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const itemStr = localStorage.getItem(key);
            if (itemStr) {
              try {
                const parsed = JSON.parse(itemStr);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  if (parsed[0].nome || parsed[0].nomeCurso || parsed[0].nome_curso || parsed[0].ucs || parsed[0].unidadesCurriculares) {
                    cursosEncontrados = [...cursosEncontrados, ...parsed];
                  }
                } else if (parsed && typeof parsed === 'object' && (parsed.nome || parsed.nomeCurso || parsed.nome_curso)) {
                  cursosEncontrados.push(parsed);
                }
              } catch (err) {}
            }
          }
        }
      }
    } catch (err) {
      console.error('Erro ao ler localStorage:', err);
    }

    const cursosFormatados = cursosEncontrados
      .map((c) => {
        if (!c) return null;
        const nome = c.nome || c.nomeCurso || c.nome_curso || c.curso || c.titulo;
        if (!nome) return null;

        const ucsBrutas = c.unidadesCurriculares || c.unidades_curriculares || c.ucs || c.unidades || [];

        return {
          ...c,
          nome,
          modalidade: c.modalidade || c.modalidade_curso || 'Presencial',
          ucs: Array.isArray(ucsBrutas) ? ucsBrutas : []
        };
      })
      .filter(Boolean);

    const cursosUnicos = cursosFormatados.filter(
      (curso, index, self) => index === self.findIndex((t) => t.nome === curso.nome)
    );

    setListaCursos(cursosUnicos);

    if (cursosUnicos.length > 0) {
      const primeiro = cursosUnicos[0];
      setCursoSelecionado(primeiro.nome);
      setModalidade(primeiro.modalidade || '');
      setUcsDisponiveis(primeiro.ucs || []);

      if (primeiro.ucs && primeiro.ucs.length > 0) {
        aplicarUC(primeiro.ucs[0]);
      }
    }

    setCarregando(false);
  };

  useEffect(() => {
    carregarDadosCursosEUCs();
  }, []);

  const aoMudarCurso = (nomeCurso: string) => {
    setCursoSelecionado(nomeCurso);
    const encontrado = listaCursos.find((c) => c.nome === nomeCurso);

    if (encontrado) {
      setModalidade(encontrado.modalidade || '');
      const ucs = encontrado.ucs || [];
      setUcsDisponiveis(ucs);

      if (ucs.length > 0) {
        aplicarUC(ucs[0]);
      } else {
        limparUC();
      }
    }
  };

  const aoMudarUC = (nomeUC: string) => {
    const ucEncontrada = ucsDisponiveis.find(
      (u) => (u.nomeUc || u.nome_uc || u.nome || u.unidade || u.titulo) === nomeUC
    );
    if (ucEncontrada) {
      aplicarUC(ucEncontrada);
    }
  };

  const aplicarUC = (uc: any) => {
    setUcSelecionada(uc.nomeUc || uc.nome_uc || uc.nome || uc.unidade || uc.titulo || '');
    setUcCargaHoraria(uc.cargaHoraria || uc.carga_horaria || uc.ch || uc.horas || '');
    setModulo(uc.modulo || uc.modulo_nome || '');

    const caps = uc.capacidades || {};
    
    if (typeof caps === 'object' && !Array.isArray(caps)) {
      setCapacidadesTecnicas(formatarTexto(caps.tecnicas || uc.capacidades_tecnicas || uc.capacidadesTecnicas));
      setCapacidadesBasicas(formatarTexto(caps.basicas || uc.capacidades_basicas || uc.capacidadesBasicas));
      setCapacidadesSocioemocionais(
        formatarTexto(caps.socioemocionais || uc.capacidades_socioemocionais || uc.capacidadesSocioemocionais)
      );
    } else {
      setCapacidadesTecnicas(formatarTexto(caps || uc.capacidades_tecnicas || uc.capacidadesTecnicas));
      setCapacidadesBasicas(formatarTexto(uc.capacidades_basicas || uc.capacidadesBasicas));
      setCapacidadesSocioemocionais(formatarTexto(uc.capacidades_socioemocionais || uc.capacidadesSocioemocionais));
    }

    setObjetivoGeral(formatarTexto(caps.objetivo || uc.objetivo_geral || uc.objetivo || uc.conhecimentos));
    setCompetencias(formatarTexto(caps.competencia || uc.competencias || uc.competencia));
  };

  const limparUC = () => {
    setUcSelecionada('');
    setUcCargaHoraria('');
    setModulo('');
    setCapacidadesTecnicas('');
    setCapacidadesBasicas('');
    setCapacidadesSocioemocionais('');
    setObjetivoGeral('');
    setCompetencias('');
  };

  const gerarSituacaoComGemini = async () => {
    setGerandoIA(true);
    try {
      const res = await fetch('/api/gerar-situacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curso: cursoSelecionado,
          uc: ucSelecionada,
          tipoSituacao,
          capacidades: `Capacidades Técnicas:\n${capacidadesTecnicas}\n\nCapacidades Básicas:\n${capacidadesBasicas}\n\nCapacidades Socioemocionais:\n${capacidadesSocioemocionais}`
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na requisição');

      if (data.contextualizacao) setContextualizacao(data.contextualizacao);
      if (data.desafio) setDesafio(data.desafio);
      if (data.resultados_esperados) setResultadosEsperados(data.resultados_esperados);
      if (data.criterios_qualidade) setCriteriosQualidade(data.criterios_qualidade);
    } catch (err: any) {
      alert('Erro ao gerar com o Gemini: ' + err.message);
    } finally {
      setGerandoIA(false);
    }
  };

  const adicionarLinhaAula = () => {
    setPlanosAula([
      ...planosAula,
      {
        numAulas: '4',
        conhecimentos: '',
        capacidades: '',
        estrategias: '',
        recursos: '',
        instrumentos: ''
      }
    ]);
  };

  const atualizarLinhaAula = (index: number, campo: string, valor: string) => {
    const novasLinhas = [...planosAula];
    novasLinhas[index] = { ...novasLinhas[index], [campo]: valor };
    setPlanosAula(novasLinhas);
  };

  const removerLinhaAula = (index: number) => {
    setPlanosAula(planosAula.filter((_, i) => i !== index));
  };

  const salvarPEUC = async (e: React.FormEvent) => {
    e.preventDefault();

    const novaPEUC = {
      id: String(Date.now()),
      curso_nome: cursoSelecionado,
      modalidade,
      uc_nome: ucSelecionada,
      uc_carga_horaria: ucCargaHoraria,
      modulo,
      docente,
      num_aulas: numAulas,
      num_sa: numSa,
      objetivo_geral: objetivoGeral,
      competencias,
      capacidades_tecnicas: capacidadesTecnicas,
      capacidades_basicas: capacidadesBasicas,
      capacidades_socioemocionais: capacidadesSocioemocionais,
      tipo_situacao: tipoSituacao,
      contextualizacao,
      desafio,
      resultados_esperados: resultadosEsperados,
      criterios_qualidade: criteriosQualidade,
      planos_aula: planosAula,
      created_at: new Date().toISOString()
    };

    try {
      const salvas = JSON.parse(localStorage.getItem('peucs_salvas') || '[]');
      salvas.unshift(novaPEUC);
      localStorage.setItem('peucs_salvas', JSON.stringify(salvas));
    } catch (err) {
      console.error('Erro ao salvar localmente:', err);
    }

    try {
      await supabase.from('peucs').insert([novaPEUC]);
    } catch (err) {
      console.warn('Erro Supabase, mantido salvo localmente.');
    }

    router.push(`/peuc/visualizar/${novaPEUC.id}`);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 pb-24 selection:bg-purple-500 selection:text-white font-sans">
      {/* HEADER */}
      <header className="relative overflow-hidden bg-slate-900 border-b border-indigo-500/10 py-8 px-6 shadow-xl mb-10">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/10 text-indigo-400 text-[11px] font-bold px-3 py-1 rounded-full border border-indigo-500/20 uppercase tracking-wider">
                Easy PEUC Generator
              </span>
              <span className="bg-slate-800 text-slate-400 text-[11px] font-medium px-2.5 py-1 rounded-full border border-slate-700/50">
                Metodologia SENAI
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Criar Plano de Ensino por Unidade Curricular
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Gere planos alinhados com a matriz curricular de forma ágil e com suporte de inteligência artificial.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/peuc')}
            className="text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 px-4 py-2.5 rounded-xl transition duration-200 backdrop-blur-sm"
          >
            ← Voltar ao Painel
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6">
        <form onSubmit={salvarPEUC} className="space-y-8">
          
          {/* SEÇÃO 1: IDENTIFICAÇÃO GERAL */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg backdrop-blur-sm transition hover:border-slate-700/60">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-5 mb-6 border-b border-slate-800/80 gap-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 font-black text-xs border border-indigo-500/30">
                  01
                </span>
                <h2 className="text-lg font-bold text-slate-100">Identificação Geral</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-medium">
                  {carregando ? 'Carregando PCAs...' : `${listaCursos.length} Curso(s) Encontrado(s)`}
                </span>
                <button
                  type="button"
                  onClick={carregarDadosCursosEUCs}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1 rounded-full font-medium transition active:scale-95"
                  title="Atualizar lista de cursos do banco/localStorage"
                >
                  🔄 Recarregar Cursos
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div className="md:col-span-1">
                <label className="font-semibold block mb-2 text-indigo-300">Selecionar Curso (PCA)</label>
                <select
                  value={cursoSelecionado}
                  onChange={(e) => aoMudarCurso(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  required
                >
                  {carregando ? (
                    <option value="">Carregando matrizes...</option>
                  ) : listaCursos.length === 0 ? (
                    <option value="">Nenhum curso carregado</option>
                  ) : (
                    listaCursos.map((c, i) => (
                      <option key={i} value={c.nome}>
                        {c.nome}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-2 text-slate-400">Modalidade</label>
                <input
                  type="text"
                  value={modalidade}
                  onChange={(e) => setModalidade(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800 text-slate-300 p-3 rounded-xl font-medium focus:ring-2 focus:ring-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold block mb-2 text-slate-400">Módulo</label>
                <input
                  type="text"
                  value={modulo}
                  onChange={(e) => setModulo(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800 text-slate-300 p-3 rounded-xl font-medium focus:ring-2 focus:ring-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold block mb-2 text-indigo-300">Unidade Curricular (UC)</label>
                <select
                  value={ucSelecionada}
                  onChange={(e) => aoMudarUC(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  required
                >
                  {ucsDisponiveis.length === 0 ? (
                    <option value="">Selecione um curso com UCs</option>
                  ) : (
                    ucsDisponiveis.map((u, i) => {
                      const nomeUC = u.nomeUc || u.nome_uc || u.nome || u.unidade || u.titulo || `UC #${i + 1}`;
                      return (
                        <option key={i} value={nomeUC}>
                          {nomeUC}
                        </option>
                      );
                    })
                  )}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-2 text-slate-400">Carga Horária Total</label>
                <input
                  type="text"
                  value={ucCargaHoraria}
                  onChange={(e) => setUcCargaHoraria(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800 text-slate-300 p-3 rounded-xl font-medium focus:ring-2 focus:ring-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold block mb-2 text-indigo-300">Docente Responsável</label>
                <input
                  type="text"
                  value={docente}
                  onChange={(e) => setDocente(e.target.value)}
                  placeholder="Nome do docente..."
                  className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  required
                />
              </div>
            </div>
          </section>

          {/* SEÇÃO 2: OBJETIVOS E CAPACIDADES */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg backdrop-blur-sm transition hover:border-slate-700/60">
            <div className="flex items-center gap-3 pb-5 mb-6 border-b border-slate-800/80">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 font-black text-xs border border-purple-500/30">
                02
              </span>
              <h2 className="text-lg font-bold text-slate-100">Objetivos e Capacidades do PCA</h2>
            </div>

            <div className="space-y-5 text-xs">
              <div>
                <label className="font-semibold block mb-2 text-slate-300">Objetivo Geral da UC</label>
                <textarea
                  rows={2}
                  value={objetivoGeral}
                  onChange={(e) => setObjetivoGeral(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition resize-y"
                />
              </div>

              <div>
                <label className="font-semibold block mb-2 text-slate-300">Competência(s) Relacionada(s)</label>
                <textarea
                  rows={2}
                  value={competencias}
                  onChange={(e) => setCompetencias(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition resize-y"
                />
              </div>

              {/* TRES MINI-CARDS LADO A LADO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                <div className="bg-slate-950/60 border border-indigo-500/20 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Capacidades Técnicas</span>
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  </div>
                  <textarea
                    rows={6}
                    value={capacidadesTecnicas}
                    onChange={(e) => setCapacidadesTecnicas(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 text-slate-200 p-3 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
                  />
                </div>

                <div className="bg-slate-950/60 border border-purple-500/20 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Capacidades Básicas</span>
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                  </div>
                  <textarea
                    rows={6}
                    value={capacidadesBasicas}
                    onChange={(e) => setCapacidadesBasicas(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 text-slate-200 p-3 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-purple-500 outline-none resize-y"
                  />
                </div>

                <div className="bg-slate-950/60 border border-emerald-500/20 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Capacidades Socioemocionais</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <textarea
                    rows={6}
                    value={capacidadesSocioemocionais}
                    onChange={(e) => setCapacidadesSocioemocionais(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 text-slate-200 p-3 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 outline-none resize-y"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SEÇÃO 3: SITUAÇÃO DE APRENDIZAGEM */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg backdrop-blur-sm transition hover:border-slate-700/60 text-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 mb-6 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-pink-600/20 text-pink-400 font-black text-xs border border-pink-500/30">
                  03
                </span>
                <h2 className="text-lg font-bold text-slate-100">Situação de Aprendizagem (SA)</h2>
              </div>
              <button
                type="button"
                onClick={gerarSituacaoComGemini}
                disabled={gerandoIA}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:shadow-purple-500/10 transition active:scale-95 disabled:opacity-50 text-xs"
              >
                {gerandoIA ? (
                  <>
                    <span className="animate-spin h-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                    <span>Gerando com Gemini...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Gerar com Gemini IA</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="font-semibold block mb-2 text-pink-300">Tipo de Situação</label>
                  <select
                    value={tipoSituacao}
                    onChange={(e) => setTipoSituacao(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3 rounded-xl font-medium focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition"
                  >
                    <option value="Situação-Problema">Situação-Problema</option>
                    <option value="Estudo de Caso">Estudo de Caso</option>
                    <option value="Projeto">Projeto</option>
                    <option value="Pesquisa Aplicada">Pesquisa Aplicada</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-2 text-slate-300">Nº de Aulas da SA</label>
                  <input
                    type="text"
                    value={numAulas}
                    onChange={(e) => setNumAulas(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-2 text-slate-300">Identificação da SA</label>
                  <input
                    type="text"
                    value={numSa}
                    onChange={(e) => setNumSa(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-2 text-slate-300">Contextualização do Tema</label>
                <textarea
                  rows={3}
                  value={contextualizacao}
                  onChange={(e) => setContextualizacao(e.target.value)}
                  placeholder="Gerado pela IA ou preenchido manualmente..."
                  className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition resize-y"
                />
              </div>

              <div>
                <label className="font-semibold block mb-2 text-slate-300">Desafio Proposto</label>
                <textarea
                  rows={3}
                  value={desafio}
                  onChange={(e) => setDesafio(e.target.value)}
                  placeholder="Desafio da SA..."
                  className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition resize-y"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="font-semibold block mb-2 text-slate-300">Resultados Esperados</label>
                  <textarea
                    rows={3}
                    value={resultadosEsperados}
                    onChange={(e) => setResultadosEsperados(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition resize-y"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-2 text-slate-300">Critérios Mínimos de Qualidade</label>
                  <textarea
                    rows={3}
                    value={criteriosQualidade}
                    onChange={(e) => setCriteriosQualidade(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3.5 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition resize-y"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SEÇÃO 4: PLANO DE AULA */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg backdrop-blur-sm transition hover:border-slate-700/60">
            <div className="flex justify-between items-center pb-5 mb-6 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 font-black text-xs border border-emerald-500/30">
                  04
                </span>
                <h2 className="text-lg font-bold text-slate-100">Matriz do Plano de Aula</h2>
              </div>
              <button
                type="button"
                onClick={adicionarLinhaAula}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition active:scale-95 shadow-md shadow-emerald-900/20"
              >
                + Adicionar Aula
              </button>
            </div>

            <div className="space-y-4">
              {planosAula.map((item, idx) => (
                <div
                  key={idx}
                  className="border border-slate-800/80 p-4 rounded-xl bg-slate-950/60 space-y-3 text-xs"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-2.5 py-1 rounded-md text-[11px]">
                      Aula #{idx + 1}
                    </span>
                    {planosAula.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerLinhaAula(idx)}
                        className="text-rose-400 hover:text-rose-300 font-semibold text-[11px] transition"
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Nº Aulas</label>
                      <input
                        type="text"
                        value={item.numAulas}
                        onChange={(e) => atualizarLinhaAula(idx, 'numAulas', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 p-2.5 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Conhecimentos</label>
                      <input
                        type="text"
                        value={item.conhecimentos}
                        onChange={(e) => atualizarLinhaAula(idx, 'conhecimentos', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 p-2.5 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Capacidades</label>
                      <input
                        type="text"
                        value={item.capacidades}
                        onChange={(e) => atualizarLinhaAula(idx, 'capacidades', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 p-2.5 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Estratégias</label>
                      <input
                        type="text"
                        value={item.estrategias}
                        onChange={(e) => atualizarLinhaAula(idx, 'estrategias', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 p-2.5 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Recursos</label>
                      <input
                        type="text"
                        value={item.recursos}
                        onChange={(e) => atualizarLinhaAula(idx, 'recursos', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 p-2.5 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Instrumentos</label>
                      <input
                        type="text"
                        value={item.instrumentos}
                        onChange={(e) => atualizarLinhaAula(idx, 'instrumentos', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 p-2.5 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* BOTÃO SALVAR */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition active:scale-95 text-xs"
            >
              Salvar Plano de Ensino (PEUC)
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
