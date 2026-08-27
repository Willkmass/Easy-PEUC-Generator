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

  // Função para formatar capacidades (caso venham como array ou texto)
  const formatarTexto = (val: any) => {
    if (!val) return '';
    if (Array.isArray(val)) return val.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join('\n');
    if (typeof val === 'object') return JSON.stringify(val, null, 2);
    return String(val);
  };

  // FUNÇÃO PRINCIPAL: Carrega exatamente como a aba de Cursos e UCs
  const carregarDadosCursosEUCs = async () => {
    setCarregando(true);
    let cursosEncontrados: any[] = [];

    // 1. Tentar buscar no Supabase na tabela 'pcas' ou 'cursos'
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

    // 2. Se não encontrou no Supabase ou quer varrer o localStorage (mesmo padrão da aba Cursos/UCs)
    if (cursosEncontrados.length === 0) {
      try {
        // Varre todas as chaves salvas no localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const itemStr = localStorage.getItem(key);
            if (itemStr) {
              try {
                const parsed = JSON.parse(itemStr);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  // Verifica se tem estrutura de curso/UC
                  if (parsed[0].nome || parsed[0].nome_curso || parsed[0].ucs || parsed[0].unidades_curriculares) {
                    cursosEncontrados = [...cursosEncontrados, ...parsed];
                  }
                } else if (parsed && typeof parsed === 'object') {
                  if (parsed.cursos || parsed.pcas || parsed.data) {
                    const arr = parsed.cursos || parsed.pcas || parsed.data;
                    if (Array.isArray(arr)) cursosEncontrados = [...cursosEncontrados, ...arr];
                  } else if (parsed.nome || parsed.nome_curso) {
                    cursosEncontrados.push(parsed);
                  }
                }
              } catch (err) {}
            }
          }
        }
      } catch (err) {
        console.error('Erro ao ler localStorage:', err);
      }
    }

    // 3. Normalização flexível dos cursos
    const cursosFormatados = cursosEncontrados
      .map((c) => {
        if (!c) return null;
        const nome = c.nome || c.nome_curso || c.curso || c.titulo;
        if (!nome) return null;

        const ucsBrutas = c.ucs || c.unidades_curriculares || c.unidadesCurriculares || c.unidades || [];

        return {
          ...c,
          nome,
          modalidade: c.modalidade || c.modalidade_curso || 'Presencial',
          ucs: Array.isArray(ucsBrutas) ? ucsBrutas : []
        };
      })
      .filter(Boolean);

    // Remove duplicados por nome
    const cursosUnicos = cursosFormatados.filter(
      (curso, index, self) => index === self.findIndex((t) => t.nome === curso.nome)
    );

    setListaCursos(cursosUnicos);

    // Seleciona automaticamente o primeiro curso e a primeira UC se existirem
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

  // Quando o usuário troca de Curso
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

  // Quando o usuário troca de UC
  const aoMudarUC = (nomeUC: string) => {
    const ucEncontrada = ucsDisponiveis.find(
      (u) => (u.nome || u.nome_uc || u.unidade || u.titulo) === nomeUC
    );
    if (ucEncontrada) {
      aplicarUC(ucEncontrada);
    }
  };

  // Preenche os campos da UC selecionada
  const aplicarUC = (uc: any) => {
    setUcSelecionada(uc.nome || uc.nome_uc || uc.unidade || uc.titulo || '');
    setUcCargaHoraria(uc.cargaHoraria || uc.carga_horaria || uc.ch || uc.horas || '');
    setModulo(uc.modulo || uc.modulo_nome || '');

    // Extração das Capacidades e Objetivos
    const caps = uc.capacidades || {};
    setCapacidadesTecnicas(formatarTexto(caps.tecnicas || uc.capacidades_tecnicas || uc.capacidadesTecnicas));
    setCapacidadesBasicas(formatarTexto(caps.basicas || uc.capacidades_basicas || uc.capacidadesBasicas));
    setCapacidadesSocioemocionais(
      formatarTexto(caps.socioemocionais || uc.capacidades_socioemocionais || uc.capacidadesSocioemocionais)
    );
    setObjetivoGeral(formatarTexto(caps.objetivo || uc.objetivo_geral || uc.objetivo));
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
      console.error('Erro local:', err);
    }

    try {
      await supabase.from('peucs').insert([novaPEUC]);
    } catch (err) {
      console.warn('Salvo localmente.');
    }

    router.push(`/peuc/visualizar/${novaPEUC.id}`);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 pb-20 selection:bg-purple-500 selection:text-white">
      {/* HEADER */}
      <header className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 border-b border-indigo-500/20 py-10 px-6 shadow-2xl mb-8">
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full border border-indigo-400/30 uppercase tracking-widest">
              Metodologia SENAI
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white mt-3 tracking-tight">
              Plano de Ensino por Unidade Curricular (PEUC)
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Criação de plano assistido por IA integrado com os PCAs cadastrados.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/peuc')}
            className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600/50 px-5 py-3 rounded-xl transition"
          >
            ← Voltar ao Painel
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6">
        <form onSubmit={salvarPEUC} className="space-y-8">
          {/* SEÇÃO 1: IDENTIFICAÇÃO GERAL */}
          <section className="bg-slate-900/90 border border-indigo-500/20 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 text-white font-extrabold text-sm">
                  1
                </span>
                <h2 className="text-xl font-bold text-slate-100">Identificação Geral</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full font-semibold">
                  {carregando ? 'Carregando PCAs...' : `${listaCursos.length} Curso(s) Encontrado(s)`}
                </span>
                <button
                  type="button"
                  onClick={carregarDadosCursosEUCs}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-full font-medium transition"
                  title="Atualizar lista de cursos do banco/localStorage"
                >
                  🔄 Recarregar Cursos
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div>
                <label className="font-semibold block mb-2 text-indigo-300">Selecionar Curso (PCA)</label>
                <select
                  value={cursoSelecionado}
                  onChange={(e) => aoMudarCurso(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
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
                  className="w-full bg-slate-950/60 border border-slate-800/80 text-slate-400 p-3 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-semibold block mb-2 text-slate-400">Módulo</label>
                <input
                  type="text"
                  value={modulo}
                  onChange={(e) => setModulo(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800/80 text-slate-400 p-3 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-semibold block mb-2 text-indigo-300">Unidade Curricular (UC)</label>
                <select
                  value={ucSelecionada}
                  onChange={(e) => aoMudarUC(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                >
                  {ucsDisponiveis.length === 0 ? (
                    <option value="">Selecione um curso com UCs</option>
                  ) : (
                    ucsDisponiveis.map((u, i) => {
                      const nomeUC = u.nome || u.nome_uc || u.unidade || u.titulo || `UC #${i + 1}`;
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
                  className="w-full bg-slate-950/60 border border-slate-800/80 text-slate-400 p-3 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-semibold block mb-2 text-indigo-300">Docente Responsável</label>
                <input
                  type="text"
                  value={docente}
                  onChange={(e) => setDocente(e.target.value)}
                  placeholder="Nome do docente..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
            </div>
          </section>

          {/* SEÇÃO 2: OBJETIVOS E CAPACIDADES */}
          <section className="bg-slate-900/90 border border-purple-500/20 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-600 text-white font-extrabold text-sm">
                2
              </span>
              <h2 className="text-xl font-bold text-slate-100">Objetivos e Capacidades do PCA</h2>
            </div>

            <div className="space-y-5 text-xs">
              <div>
                <label className="font-semibold block mb-2 text-slate-300">Objetivo Geral da UC</label>
                <textarea
                  rows={2}
                  value={objetivoGeral}
                  onChange={(e) => setObjetivoGeral(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3.5 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold block mb-2 text-slate-300">Competência(s) Relacionada(s)</label>
                <textarea
                  rows={2}
                  value={competencias}
                  onChange={(e) => setCompetencias(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3.5 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              {/* TRES MINI-CARDS LADO A LADO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="bg-gradient-to-b from-indigo-950/60 to-slate-950 border border-indigo-500/30 p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-indigo-400 uppercase">Capacidades Técnicas</span>
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  </div>
                  <textarea
                    rows={7}
                    value={capacidadesTecnicas}
                    onChange={(e) => setCapacidadesTecnicas(e.target.value)}
                    className="w-full bg-slate-950/90 border border-indigo-500/20 text-slate-200 p-3 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="bg-gradient-to-b from-purple-950/60 to-slate-950 border border-purple-500/30 p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-purple-400 uppercase">Capacidades Básicas</span>
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                  </div>
                  <textarea
                    rows={7}
                    value={capacidadesBasicas}
                    onChange={(e) => setCapacidadesBasicas(e.target.value)}
                    className="w-full bg-slate-950/90 border border-purple-500/20 text-slate-200 p-3 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div className="bg-gradient-to-b from-emerald-950/60 to-slate-950 border border-emerald-500/30 p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-emerald-400 uppercase">Capacidades Socioemocionais</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <textarea
                    rows={7}
                    value={capacidadesSocioemocionais}
                    onChange={(e) => setCapacidadesSocioemocionais(e.target.value)}
                    className="w-full bg-slate-950/90 border border-emerald-500/20 text-slate-200 p-3 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SEÇÃO 3: SITUAÇÃO DE APRENDIZAGEM */}
          <section className="bg-slate-900/90 border border-pink-500/20 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 text-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-pink-600 text-white font-extrabold text-sm">
                  3
                </span>
                <h2 className="text-xl font-bold text-slate-100">Situação de Aprendizagem (SA)</h2>
              </div>
              <button
                type="button"
                onClick={gerarSituacaoComGemini}
                disabled={gerandoIA}
                className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-extrabold px-5 py-3 rounded-2xl flex items-center gap-2 shadow-xl transition transform hover:scale-[1.02] disabled:opacity-50"
              >
                <span>✨</span>
                <span>{gerandoIA ? 'Gerando com Gemini...' : 'Gerar com Gemini IA'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="font-semibold block mb-2 text-pink-300">Tipo de Situação</label>
                <select
                  value={tipoSituacao}
                  onChange={(e) => setTipoSituacao(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3 rounded-xl font-medium focus:ring-2 focus:ring-pink-500 outline-none"
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
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold block mb-2 text-slate-300">Identificação da SA</label>
                <input
                  type="text"
                  value={numSa}
                  onChange={(e) => setNumSa(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3 rounded-xl"
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
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3.5 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>

            <div>
              <label className="font-semibold block mb-2 text-slate-300">Desafio Proposto</label>
              <textarea
                rows={3}
                value={desafio}
                onChange={(e) => setDesafio(e.target.value)}
                placeholder="Desafio da SA..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3.5 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="font-semibold block mb-2 text-slate-300">Resultados Esperados</label>
                <textarea
                  rows={3}
                  value={resultadosEsperados}
                  onChange={(e) => setResultadosEsperados(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3.5 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold block mb-2 text-slate-300">Critérios Mínimos de Qualidade</label>
                <textarea
                  rows={3}
                  value={criteriosQualidade}
                  onChange={(e) => setCriteriosQualidade(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3.5 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>
            </div>
          </section>

          {/* SEÇÃO 4: PLANO DE AULA */}
          <section className="bg-slate-900/90 border border-emerald-500/20 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-600 text-white font-extrabold text-sm">
                  4
                </span>
                <h2 className="text-xl font-bold text-slate-100">Matriz do Plano de Aula</h2>
              </div>
              <button
                type="button"
                onClick={adicionarLinhaAula}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition"
              >
                + Adicionar Aula
              </button>
            </div>

            <div className="space-y-4">
              {planosAula.map((item, idx) => (
                <div
                  key={idx}
                  className="border border-slate-800 p-5 rounded-2xl bg-slate-950/70 space-y-3 text-xs"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-black text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded-lg">
                      Aula #{idx + 1}
                    </span>
                    {planosAula.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerLinhaAula(idx)}
                        className="text-rose-400 hover:text-rose-300 font-bold"
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
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 p-2.5 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Conteúdos</label>
                      <input
                        type="text"
                        value={item.conhecimentos}
                        onChange={(e) => atualizarLinhaAula(idx, 'conhecimentos', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 p-2.5 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Capacidades</label>
                      <input
                        type="text"
                        value={item.capacidades}
                        onChange={(e) => atualizarLinhaAula(idx, 'capacidades', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 p-2.5 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Estratégias</label>
                      <input
                        type="text"
                        value={item.estrategias}
                        onChange={(e) => atualizarLinhaAula(idx, 'estrategias', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 p-2.5 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Recursos</label>
                      <input
                        type="text"
                        value={item.recursos}
                        onChange={(e) => atualizarLinhaAula(idx, 'recursos', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 p-2.5 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Instrumentos</label>
                      <input
                        type="text"
                        value={item.instrumentos}
                        onChange={(e) => atualizarLinhaAula(idx, 'instrumentos', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 p-2.5 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* BOTÃO DE SALVAR */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white font-black py-4 px-10 rounded-2xl shadow-2xl text-sm transition transform hover:-translate-y-0.5"
            >
              Salvar e Gerar PEUC Completa
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
