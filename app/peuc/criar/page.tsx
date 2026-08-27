'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface CapacidadesPCA {
  tecnicas: string;
  basicas: string;
  socioemocionais: string;
  objetivo?: string;
  competencia?: string;
}

interface UCItem {
  nome: string;
  cargaHoraria: string;
  modulo: string;
  capacidades: CapacidadesPCA;
}

interface CursoPCA {
  nome: string;
  modalidade: string;
  ucs: UCItem[];
}

export default function CriarPEUCPage() {
  const router = useRouter();

  // Cursos e UCs carregados dos PCAs importados
  const [listaCursos, setListaCursos] = useState<CursoPCA[]>([]);
  const [ucsDisponiveis, setUcsDisponiveis] = useState<UCItem[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Campos de Identificação Geral
  const [cursoSelecionado, setCursoSelecionado] = useState('');
  const [modalidade, setModalidade] = useState('');
  const [ucSelecionada, setUcSelecionada] = useState('');
  const [ucCargaHoraria, setUcCargaHoraria] = useState('');
  const [modulo, setModulo] = useState('');
  const [docente, setDocente] = useState('');
  const [numAulas, setNumAulas] = useState('20');
  const [numSa, setNumSa] = useState('1');

  // Objetivos e Competências
  const [objetivoGeral, setObjetivoGeral] = useState('');
  const [competencias, setCompetencias] = useState('');

  // Capacidades Extraídas do PCA (Editáveis pelo docente)
  const [capacidadesTecnicas, setCapacidadesTecnicas] = useState('');
  const [capacidadesBasicas, setCapacidadesBasicas] = useState('');
  const [capacidadesSocioemocionais, setCapacidadesSocioemocionais] = useState('');

  // Situação de Aprendizagem
  const [tipoSituacao, setTipoSituacao] = useState('Situação-Problema');
  const [contextualizacao, setContextualizacao] = useState('');
  const [desafio, setDesafio] = useState('');
  const [resultadosEsperados, setResultadosEsperados] = useState('');
  const [criteriosQualidade, setCriteriosQualidade] = useState('');

  // Estado de carregamento do Gemini
  const [gerandoIA, setGerandoIA] = useState(false);

  // Linhas do Plano de Aula
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

  const extrairArrayCursos = (dados: any): any[] => {
    if (Array.isArray(dados)) return dados;
    if (dados && typeof dados === 'object') {
      if (Array.isArray(dados.cursos)) return dados.cursos;
      if (Array.isArray(dados.pcas)) return dados.pcas;
      if (Array.isArray(dados.data)) return dados.data;
      if (Array.isArray(dados.itens)) return dados.itens;
      const chaveArray = Object.keys(dados).find((k) => Array.isArray(dados[k]));
      if (chaveArray) return dados[chaveArray];
      return [dados];
    }
    return [];
  };

  const formatarCapacidade = (val: any) => {
    if (Array.isArray(val)) return val.map((i) => `• ${i}`).join('\n');
    if (typeof val === 'string') return val;
    return '';
  };

  useEffect(() => {
    const carregarCursosPCA = async () => {
      setCarregando(true);
      let dadosBrutos: any[] = [];

      try {
        for (let i = 0; i < localStorage.length; i++) {
          const chave = localStorage.key(i);
          if (chave && (chave.includes('pca') || chave.includes('curso') || chave.includes('import'))) {
            const itemStr = localStorage.getItem(chave);
            if (itemStr) {
              const parsed = JSON.parse(itemStr);
              const extraidos = extrairArrayCursos(parsed);
              if (extraidos.length > 0) {
                dadosBrutos = [...dadosBrutos, ...extraidos];
              }
            }
          }
        }
      } catch (e) {
        console.error('Erro ao ler localStorage:', e);
      }

      if (dadosBrutos.length === 0) {
        ['pcas_importados', 'pcas', 'cursos_pca', 'pca_data', 'pca'].forEach((k) => {
          try {
            const item = localStorage.getItem(k);
            if (item) dadosBrutos.push(...extrairArrayCursos(JSON.parse(item)));
          } catch (e) {}
        });
      }

      if (dadosBrutos.length === 0) {
        try {
          const { data } = await supabase.from('pcas').select('*');
          if (data && data.length > 0) {
            dadosBrutos = extrairArrayCursos(data);
          }
        } catch (err) {
          console.warn('Erro ao consultar Supabase:', err);
        }
      }

      const cursosNormalizados: CursoPCA[] = dadosBrutos
        .map((item: any) => {
          if (!item || typeof item !== 'object') return null;

          const nomeCurso = item.nome || item.nome_curso || item.curso || item.titulo || item.name;
          if (!nomeCurso) return null;

          const modalidadeCurso = item.modalidade || item.modalidade_curso || 'Geral';
          const ucsBrutas = item.ucs || item.unidades_curriculares || item.unidadesCurriculares || item.unidades || [];

          const ucsMapeadas: UCItem[] = (Array.isArray(ucsBrutas) ? ucsBrutas : []).map((uc: any) => {
            const nomeUC = uc.nome || uc.nome_uc || uc.titulo || uc.unidade || 'UC Sem Nome';
            const carga = uc.cargaHoraria || uc.carga_horaria || uc.ch || uc.horas || '';
            const mod = uc.modulo || uc.modulo_nome || '';
            const caps = uc.capacidades || {};

            return {
              nome: nomeUC,
              cargaHoraria: carga,
              modulo: mod,
              capacidades: {
                tecnicas: caps.tecnicas || formatarCapacidade(uc.capacidades_tecnicas || uc.capacidadesTecnicas),
                basicas: caps.basicas || formatarCapacidade(uc.capacidades_basicas || uc.capacidadesBasicas),
                socioemocionais: caps.socioemocionais || formatarCapacidade(uc.capacidades_socioemocionais || uc.capacidadesSocioemocionais),
                objetivo: caps.objetivo || uc.objetivo_geral || uc.objetivo || '',
                competencia: caps.competencia || uc.competencias || uc.competencia || ''
              }
            };
          });

          return {
            nome: nomeCurso,
            modalidade: modalidadeCurso,
            ucs: ucsMapeadas
          };
        })
        .filter(Boolean) as CursoPCA[];

      const cursosUnicos = cursosNormalizados.filter(
        (curso, index, self) => index === self.findIndex((c) => c.nome === curso.nome)
      );

      if (cursosUnicos.length > 0) {
        setListaCursos(cursosUnicos);
        const primeiroCurso = cursosUnicos[0];
        setCursoSelecionado(primeiroCurso.nome);
        setModalidade(primeiroCurso.modalidade);
        setUcsDisponiveis(primeiroCurso.ucs || []);

        if (primeiroCurso.ucs && primeiroCurso.ucs.length > 0) {
          const primeiraUC = primeiroCurso.ucs[0];
          setUcSelecionada(primeiraUC.nome);
          setUcCargaHoraria(primeiraUC.cargaHoraria);
          setModulo(primeiraUC.modulo);
          setCapacidadesTecnicas(primeiraUC.capacidades.tecnicas);
          setCapacidadesBasicas(primeiraUC.capacidades.basicas);
          setCapacidadesSocioemocionais(primeiraUC.capacidades.socioemocionais);
          setObjetivoGeral(primeiraUC.capacidades.objetivo || '');
          setCompetencias(primeiraUC.capacidades.competencia || '');
        }
      }

      setCarregando(false);
    };

    carregarCursosPCA();
  }, []);

  const selecionarCurso = (nomeCurso: string) => {
    setCursoSelecionado(nomeCurso);
    const cursoEncontrado = listaCursos.find((c) => c.nome === nomeCurso);

    if (cursoEncontrado) {
      setModalidade(cursoEncontrado.modalidade);
      setUcsDisponiveis(cursoEncontrado.ucs || []);

      if (cursoEncontrado.ucs && cursoEncontrado.ucs.length > 0) {
        selecionarUC(cursoEncontrado.ucs[0].nome, cursoEncontrado.ucs);
      } else {
        resetarCamposUC();
      }
    }
  };

  const selecionarUC = (nomeUC: string, ucs = ucsDisponiveis) => {
    setUcSelecionada(nomeUC);
    const ucEncontrada = ucs.find((u) => u.nome === nomeUC);

    if (ucEncontrada) {
      setUcCargaHoraria(ucEncontrada.cargaHoraria || '');
      setModulo(ucEncontrada.modulo || '');
      setCapacidadesTecnicas(ucEncontrada.capacidades?.tecnicas || '');
      setCapacidadesBasicas(ucEncontrada.capacidades?.basicas || '');
      setCapacidadesSocioemocionais(ucEncontrada.capacidades?.socioemocionais || '');
      setObjetivoGeral(ucEncontrada.capacidades?.objetivo || '');
      setCompetencias(ucEncontrada.capacidades?.competencia || '');
    }
  };

  const resetarCamposUC = () => {
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
      {/* 1. TOP BAR / HEADER COM GRADIENTE PREMIUM */}
      <header className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 border-b border-indigo-500/20 py-10 px-6 shadow-2xl mb-8">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full border border-indigo-400/30 uppercase tracking-widest shadow-inner">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              Metodologia SENAI
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white mt-3 tracking-tight drop-shadow-md">
              Plano de Ensino por Unidade Curricular (PEUC)
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl font-normal leading-relaxed">
              Elaboração assistida por IA preditiva Gemini integrando com matrizes curriculares importadas do PCA.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/peuc')}
            className="text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/90 text-slate-200 border border-slate-600/50 px-5 py-3 rounded-xl transition shadow-lg backdrop-blur flex items-center gap-2"
          >
            <span>←</span> Painel PEUC
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6">
        <form onSubmit={salvarPEUC} className="space-y-8">
          {/* SEÇÃO 1: IDENTIFICAÇÃO GERAL DO CURSO */}
          <section className="bg-slate-900/90 border border-indigo-500/20 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 text-white font-extrabold text-sm shadow-md shadow-indigo-600/30">
                  1
                </span>
                <h2 className="text-xl font-bold text-slate-100 tracking-tight">Identificação Geral</h2>
              </div>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full font-semibold">
                {carregando ? 'Buscando PCAs...' : `${listaCursos.length} Curso(s) Encontrado(s)`}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div>
                <label className="font-semibold block mb-2 text-indigo-300">Selecionar Curso (PCA)</label>
                <select
                  value={cursoSelecionado}
                  onChange={(e) => selecionarCurso(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  required
                >
                  {carregando ? (
                    <option value="">Buscando matrizes importadas...</option>
                  ) : listaCursos.length === 0 ? (
                    <option value="">Nenhum PCA importado encontrado</option>
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
                  readOnly
                />
              </div>

              <div>
                <label className="font-semibold block mb-2 text-slate-400">Módulo</label>
                <input
                  type="text"
                  value={modulo}
                  onChange={(e) => setModulo(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800/80 text-slate-400 p-3 rounded-xl font-medium"
                  readOnly
                />
              </div>

              <div>
                <label className="font-semibold block mb-2 text-indigo-300">Unidade Curricular (UC)</label>
                <select
                  value={ucSelecionada}
                  onChange={(e) => selecionarUC(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  required
                >
                  {ucsDisponiveis.length === 0 ? (
                    <option value="">Selecione um curso primeiro</option>
                  ) : (
                    ucsDisponiveis.map((u, i) => (
                      <option key={i} value={u.nome}>
                        {u.nome}
                      </option>
                    ))
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
                  readOnly
                />
              </div>

              <div>
                <label className="font-semibold block mb-2 text-indigo-300">Docente Responsável</label>
                <input
                  type="text"
                  value={docente}
                  onChange={(e) => setDocente(e.target.value)}
                  placeholder="Seu nome completo..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  required
                />
              </div>
            </div>
          </section>

          {/* SEÇÃO 2: OBJETIVOS E CAPACIDADES DA PCA */}
          <section className="bg-slate-900/90 border border-purple-500/20 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-600 text-white font-extrabold text-sm shadow-md shadow-purple-600/30">
                2
              </span>
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">Objetivos e Capacidades do PCA</h2>
            </div>

            <div className="space-y-5 text-xs">
              <div>
                <label className="font-semibold block mb-2 text-slate-300">Objetivo Geral da UC</label>
                <textarea
                  rows={2}
                  value={objetivoGeral}
                  onChange={(e) => setObjetivoGeral(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3.5 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
              </div>

              <div>
                <label className="font-semibold block mb-2 text-slate-300">Competência(s) Relacionada(s)</label>
                <textarea
                  rows={2}
                  value={competencias}
                  onChange={(e) => setCompetencias(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3.5 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
              </div>

              {/* TRÊS MINI-CARDS COLORIDOS LADO A LADO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="bg-gradient-to-b from-indigo-950/60 to-slate-950 border border-indigo-500/30 p-5 rounded-2xl space-y-3 shadow-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">
                      Capacidades Técnicas
                    </span>
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  </div>
                  <textarea
                    rows={7}
                    value={capacidadesTecnicas}
                    onChange={(e) => setCapacidadesTecnicas(e.target.value)}
                    className="w-full bg-slate-950/90 border border-indigo-500/20 text-slate-200 p-3 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="bg-gradient-to-b from-purple-950/60 to-slate-950 border border-purple-500/30 p-5 rounded-2xl space-y-3 shadow-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-purple-400 uppercase tracking-wider">
                      Capacidades Básicas
                    </span>
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                  </div>
                  <textarea
                    rows={7}
                    value={capacidadesBasicas}
                    onChange={(e) => setCapacidadesBasicas(e.target.value)}
                    className="w-full bg-slate-950/90 border border-purple-500/20 text-slate-200 p-3 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div className="bg-gradient-to-b from-emerald-950/60 to-slate-950 border border-emerald-500/30 p-5 rounded-2xl space-y-3 shadow-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                      Capacidades Socioemocionais
                    </span>
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

          {/* SEÇÃO 3: SITUAÇÃO DE APRENDIZAGEM COM BOTÃO GEMINI DESTACADO */}
          <section className="bg-slate-900/90 border border-pink-500/20 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 text-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-pink-600 text-white font-extrabold text-sm shadow-md shadow-pink-600/30">
                  3
                </span>
                <h2 className="text-xl font-bold text-slate-100 tracking-tight">Situação de Aprendizagem (SA)</h2>
              </div>
              <button
                type="button"
                onClick={gerarSituacaoComGemini}
                disabled={gerandoIA}
                className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-extrabold px-5 py-3 rounded-2xl flex items-center gap-2.5 shadow-xl shadow-pink-900/30 transition transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <span className="text-base animate-spin-slow">✨</span>
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
                placeholder="Clique no botão acima para autopreencher a narrativa técnica..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3.5 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none transition"
              />
            </div>

            <div>
              <label className="font-semibold block mb-2 text-slate-300">Desafio Proposto ao Estudante</label>
              <textarea
                rows={3}
                value={desafio}
                onChange={(e) => setDesafio(e.target.value)}
                placeholder="Clique em 'Gerar com Gemini IA' para formular o desafio prático..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3.5 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="font-semibold block mb-2 text-slate-300">Resultados Esperados</label>
                <textarea
                  rows={3}
                  value={resultadosEsperados}
                  onChange={(e) => setResultadosEsperados(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3.5 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none transition"
                />
              </div>

              <div>
                <label className="font-semibold block mb-2 text-slate-300">Critérios Mínimos de Qualidade</label>
                <textarea
                  rows={3}
                  value={criteriosQualidade}
                  onChange={(e) => setCriteriosQualidade(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3.5 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none transition"
                />
              </div>
            </div>
          </section>

          {/* SEÇÃO 4: MATRIZ DO PLANO DE AULA */}
          <section className="bg-slate-900/90 border border-emerald-500/20 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-600 text-white font-extrabold text-sm shadow-md shadow-emerald-600/30">
                  4
                </span>
                <h2 className="text-xl font-bold text-slate-100 tracking-tight">Matriz do Plano de Aula</h2>
              </div>
              <button
                type="button"
                onClick={adicionarLinhaAula}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-lg transition flex items-center gap-1.5"
              >
                <span>+</span> Adicionar Aula
              </button>
            </div>

            <div className="space-y-4">
              {planosAula.map((item, idx) => (
                <div
                  key={idx}
                  className="border border-slate-800/80 p-5 rounded-2xl bg-slate-950/70 space-y-3 text-xs shadow-inner"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-black text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded-lg">
                      Aula #{idx + 1}
                    </span>
                    {planosAula.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerLinhaAula(idx)}
                        className="text-rose-400 hover:text-rose-300 font-bold transition"
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
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 p-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Conteúdos</label>
                      <input
                        type="text"
                        value={item.conhecimentos}
                        onChange={(e) => atualizarLinhaAula(idx, 'conhecimentos', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 p-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Capacidades</label>
                      <input
                        type="text"
                        value={item.capacidades}
                        onChange={(e) => atualizarLinhaAula(idx, 'capacidades', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 p-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Estratégias</label>
                      <input
                        type="text"
                        value={item.estrategias}
                        onChange={(e) => atualizarLinhaAula(idx, 'estrategias', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 p-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Recursos</label>
                      <input
                        type="text"
                        value={item.recursos}
                        onChange={(e) => atualizarLinhaAula(idx, 'recursos', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 p-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Instrumentos</label>
                      <input
                        type="text"
                        value={item.instrumentos}
                        onChange={(e) => atualizarLinhaAula(idx, 'instrumentos', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 p-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* BOTÃO PRINCIPAL DE SUBMISSÃO */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white font-black py-4 px-10 rounded-2xl shadow-2xl shadow-purple-900/50 text-sm tracking-wide transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Salvar e Gerar PEUC Completa
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
