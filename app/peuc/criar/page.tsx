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

  // Carrega e normaliza os Cursos salvos dos PCAs importados
  useEffect(() => {
    const carregarCursosPCA = async () => {
      let dadosBrutos: any[] = [];

      try {
        const local = localStorage.getItem('pcas_importados');
        if (local) {
          dadosBrutos = JSON.parse(local);
        }
      } catch (e) {
        console.error('Erro ao ler PCAs do localStorage:', e);
      }

      // Normaliza qualquer formato de chave vindo da tela de importação de PCA
      const cursosNormalizados: CursoPCA[] = dadosBrutos.map((item: any) => {
        const nomeCurso = item.nome || item.nome_curso || item.curso || 'Curso Sem Nome';
        const modalidadeCurso = item.modalidade || item.modalidade_curso || 'Geral';
        const ucsBrutas = item.ucs || item.unidades_curriculares || item.unidadesCurriculares || [];

        const ucsMapeadas: UCItem[] = ucsBrutas.map((uc: any) => {
          const nomeUC = uc.nome || uc.nome_uc || uc.titulo || 'UC Sem Nome';
          const carga = uc.cargaHoraria || uc.carga_horaria || uc.ch || '';
          const mod = uc.modulo || uc.modulo_nome || '';
          const caps = uc.capacidades || {};

          // Trata tanto strings formatadas quanto arrays de capacidades
          const formatarCapacidade = (val: any) => {
            if (Array.isArray(val)) return val.map((i) => `• ${i}`).join('\n');
            if (typeof val === 'string') return val;
            return '';
          };

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
      });

      if (cursosNormalizados.length > 0) {
        setListaCursos(cursosNormalizados);
        const primeiroCurso = cursosNormalizados[0];
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
    };

    carregarCursosPCA();
  }, []);

  // Seleciona um curso e atualiza UCs
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

  // Seleciona a UC e preenche automaticamente todos os dados e capacidades da PCA
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

  // Chama o Gemini para gerar a Situação de Aprendizagem
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
    <main className="max-w-5xl mx-auto p-6 bg-slate-50 min-h-screen text-slate-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nova PEUC - Metodologia SENAI</h1>
          <p className="text-xs text-slate-500">Seleção dinâmica por PCA e Inteligência Artificial Gemini</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/peuc')}
          className="text-xs bg-white border border-slate-300 px-3 py-2 rounded-md hover:bg-slate-100"
        >
          Cancelar
        </button>
      </div>

      <form onSubmit={salvarPEUC} className="space-y-6">
        {/* 1. IDENTIFICAÇÃO GERAL COM SELEÇÃO AUTOMÁTICA DA PCA */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-sm font-bold text-blue-900 uppercase">1. Identificação Geral (Upload PCA)</h2>
            <span className="text-[11px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded font-medium">
              Autopreenchimento Ativo
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* SELEÇÃO DO CURSO */}
            <div>
              <label className="font-semibold block mb-1">Selecionar Curso (PCA)</label>
              <select
                value={cursoSelecionado}
                onChange={(e) => selecionarCurso(e.target.value)}
                className="w-full border p-2 rounded bg-white font-medium focus:ring-2 focus:ring-blue-500"
                required
              >
                {listaCursos.length === 0 ? (
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

            {/* MODALIDADE (AUTO) */}
            <div>
              <label className="font-semibold block mb-1">Modalidade</label>
              <input
                type="text"
                value={modalidade}
                onChange={(e) => setModalidade(e.target.value)}
                className="w-full border p-2 rounded bg-slate-100 text-slate-700 font-medium"
                readOnly
              />
            </div>

            {/* MÓDULO (AUTO) */}
            <div>
              <label className="font-semibold block mb-1">Módulo</label>
              <input
                type="text"
                value={modulo}
                onChange={(e) => setModulo(e.target.value)}
                className="w-full border p-2 rounded bg-slate-100 text-slate-700 font-medium"
                readOnly
              />
            </div>

            {/* SELEÇÃO DA UC */}
            <div>
              <label className="font-semibold block mb-1">Unidade Curricular (UC)</label>
              <select
                value={ucSelecionada}
                onChange={(e) => selecionarUC(e.target.value)}
                className="w-full border p-2 rounded bg-white font-medium focus:ring-2 focus:ring-blue-500"
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

            {/* CARGA HORÁRIA (AUTO) */}
            <div>
              <label className="font-semibold block mb-1">Carga Horária Total</label>
              <input
                type="text"
                value={ucCargaHoraria}
                onChange={(e) => setUcCargaHoraria(e.target.value)}
                className="w-full border p-2 rounded bg-slate-100 text-slate-700 font-medium"
                readOnly
              />
            </div>

            {/* DOCENTE */}
            <div>
              <label className="font-semibold block mb-1">Docente Responsável</label>
              <input
                type="text"
                value={docente}
                onChange={(e) => setDocente(e.target.value)}
                placeholder="Digite seu nome..."
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* 2. OBJETIVOS E CAPACIDADES PREENCHIDOS AUTOMATICAMENTE DA PCA */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-blue-900 uppercase border-b pb-2">
            2. Objetivos e Capacidades do Plano de Curso (PCA)
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold block mb-1">Objetivo Geral da UC</label>
              <textarea
                rows={2}
                value={objetivoGeral}
                onChange={(e) => setObjetivoGeral(e.target.value)}
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Competência(s) Relacionada(s)</label>
              <textarea
                rows={2}
                value={competencias}
                onChange={(e) => setCompetencias(e.target.value)}
                className="w-full border p-2 rounded"
              />
            </div>

            {/* CAPACIDADES EDITÁVEIS PELO PROFESSOR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="font-bold text-blue-800 block mb-1">Capacidades Técnicas (PCA)</label>
                <span className="text-[10px] text-slate-500 block mb-1">Extraído da PCA. Editável:</span>
                <textarea
                  rows={6}
                  value={capacidadesTecnicas}
                  onChange={(e) => setCapacidadesTecnicas(e.target.value)}
                  className="w-full border border-blue-200 p-2 rounded bg-blue-50/20 text-xs font-sans"
                />
              </div>
              <div>
                <label className="font-bold text-blue-800 block mb-1">Capacidades Básicas (PCA)</label>
                <span className="text-[10px] text-slate-500 block mb-1">Extraído da PCA. Editável:</span>
                <textarea
                  rows={6}
                  value={capacidadesBasicas}
                  onChange={(e) => setCapacidadesBasicas(e.target.value)}
                  className="w-full border border-blue-200 p-2 rounded bg-blue-50/20 text-xs font-sans"
                />
              </div>
              <div>
                <label className="font-bold text-blue-800 block mb-1">Capacidades Socioemocionais</label>
                <span className="text-[10px] text-slate-500 block mb-1">Extraído da PCA. Editável:</span>
                <textarea
                  rows={6}
                  value={capacidadesSocioemocionais}
                  onChange={(e) => setCapacidadesSocioemocionais(e.target.value)}
                  className="w-full border border-blue-200 p-2 rounded bg-blue-50/20 text-xs font-sans"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. SITUAÇÃO DE APRENDIZAGEM COM GERADOR GEMINI */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-sm font-bold text-blue-900 uppercase">3. Situação de Aprendizagem</h2>
            <button
              type="button"
              onClick={gerarSituacaoComGemini}
              disabled={gerandoIA}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <span>✨</span>
              <span>{gerandoIA ? 'Gerando com Gemini...' : 'Gerar com Gemini'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold block mb-1">Tipo de Situação</label>
              <select
                value={tipoSituacao}
                onChange={(e) => setTipoSituacao(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="Situação-Problema">Situação-Problema</option>
                <option value="Estudo de Caso">Estudo de Caso</option>
                <option value="Projeto">Projeto</option>
                <option value="Pesquisa Aplicada">Pesquisa Aplicada</option>
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1">Número de Aulas da SA</label>
              <input
                type="text"
                value={numAulas}
                onChange={(e) => setNumAulas(e.target.value)}
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Identificação da SA</label>
              <input
                type="text"
                value={numSa}
                onChange={(e) => setNumSa(e.target.value)}
                className="w-full border p-2 rounded"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">Contextualização do Tema</label>
            <textarea
              rows={3}
              value={contextualizacao}
              onChange={(e) => setContextualizacao(e.target.value)}
              placeholder="Clique em 'Gerar com Gemini' para autopreencher ou digite..."
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Desafio Proposto ao Estudante</label>
            <textarea
              rows={3}
              value={desafio}
              onChange={(e) => setDesafio(e.target.value)}
              placeholder="Clique em 'Gerar com Gemini' para autopreencher ou digite..."
              className="w-full border p-2 rounded"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold block mb-1">Resultados Esperados (Entregáveis)</label>
              <textarea
                rows={3}
                value={resultadosEsperados}
                onChange={(e) => setResultadosEsperados(e.target.value)}
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Critérios Mínimos de Qualidade</label>
              <textarea
                rows={3}
                value={criteriosQualidade}
                onChange={(e) => setCriteriosQualidade(e.target.value)}
                className="w-full border p-2 rounded"
              />
            </div>
          </div>
        </div>

        {/* 4. PLANO DE AULA DETALHADO */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-sm font-bold text-blue-900 uppercase">4. Matriz do Plano de Aula</h2>
            <button
              type="button"
              onClick={adicionarLinhaAula}
              className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded hover:bg-blue-100"
            >
              + Adicionar Aula
            </button>
          </div>

          {planosAula.map((item, idx) => (
            <div key={idx} className="border border-slate-200 p-3 rounded-lg bg-slate-50 space-y-2 text-xs">
              <div className="flex justify-between items-center font-bold text-slate-700">
                <span>Aula #{idx + 1}</span>
                {planosAula.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerLinhaAula(idx)}
                    className="text-red-500 hover:text-red-700 text-[11px]"
                  >
                    Remover
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold">Nº Aulas</label>
                  <input
                    type="text"
                    value={item.numAulas}
                    onChange={(e) => atualizarLinhaAula(idx, 'numAulas', e.target.value)}
                    className="w-full border p-1 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold">Conteúdos</label>
                  <input
                    type="text"
                    value={item.conhecimentos}
                    onChange={(e) => atualizarLinhaAula(idx, 'conhecimentos', e.target.value)}
                    className="w-full border p-1 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold">Capacidades</label>
                  <input
                    type="text"
                    value={item.capacidades}
                    onChange={(e) => atualizarLinhaAula(idx, 'capacidades', e.target.value)}
                    className="w-full border p-1 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold">Estratégias</label>
                  <input
                    type="text"
                    value={item.estrategias}
                    onChange={(e) => atualizarLinhaAula(idx, 'estrategias', e.target.value)}
                    className="w-full border p-1 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold">Recursos</label>
                  <input
                    type="text"
                    value={item.recursos}
                    onChange={(e) => atualizarLinhaAula(idx, 'recursos', e.target.value)}
                    className="w-full border p-1 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold">Instrumentos</label>
                  <input
                    type="text"
                    value={item.instrumentos}
                    onChange={(e) => atualizarLinhaAula(idx, 'instrumentos', e.target.value)}
                    className="w-full border p-1 rounded bg-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* BOTÃO FINAL DE SUBMISSÃO */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-sm shadow transition"
          >
            Gerar e Salvar PEUC Completa
          </button>
        </div>
      </form>
    </main>
  );
}
