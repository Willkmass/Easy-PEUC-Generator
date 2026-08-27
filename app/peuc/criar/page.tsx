'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CriarPEUCPage() {
  const router = useRouter();

  // Dados Gerais
  const [cursoNome, setCursoNome] = useState('AUXILIAR DE PRODUÇÃO');
  const [modalidade, setModalidade] = useState('Aprendizagem Industrial');
  const [ucNome, setUcNome] = useState('Planejamento e Controle da Produção');
  const [ucCargaHoraria, setUcCargaHoraria] = useState('80 horas');
  const [modulo, setModulo] = useState('Módulo Específico');
  const [docente, setDocente] = useState('');
  const [numAulas, setNumAulas] = useState('20');
  const [numSa, setNumSa] = useState('1');

  // Objetivos e Competências
  const [objetivoGeral, setObjetivoGeral] = useState(
    'Desenvolver capacidades para planejar, programar e controlar os fluxos de produção industrial de acordo com metas, normas técnicas, de qualidade e segurança.'
  );
  const [competencias, setCompetencias] = useState(
    'Auxiliar no planejamento e controle da produção, acompanhando ordens de serviço, estoques e indicadores operacionais na linha de fabricação.'
  );

  // Capacidades Extraídas/Baseadas na PCA (Editáveis)
  const [capacidadesTecnicas, setCapacidadesTecnicas] = useState(
    '• Mapear as etapas do processo produtivo.\n• Preencher fichas de controle e ordens de produção.\n• Identificar gargalos e paradas de linha.\n• Controlar movimentação de matérias-primas e insumos.'
  );
  const [capacidadesBasicas, setCapacidadesBasicas] = useState(
    '• Interpretar gráficos, tabelas e relatórios operacionais.\n• Aplicar cálculos matemáticos básicos aplicados ao rendimento e refugo.\n• Compreender a simbologia e terminologia técnica da produção.'
  );
  const [capacidadesSocioemocionais, setCapacidadesSocioemocionais] = useState(
    '• Demonstrar compromisso com a qualidade e prazos.\n• Trabalhar em equipe de forma colaborativa.\n• Comunicar discrepâncias no processo com clareza e objetividade.'
  );

  // Situação de Aprendizagem
  const [tipoSituacao, setTipoSituacao] = useState('Situação-Problema');
  const [integraOutraUc, setIntegraOutraUc] = useState('Não');
  const [outraUcNome, setOutraUcNome] = useState('');
  const [contextualizacao, setContextualizacao] = useState('');
  const [desafio, setDesafio] = useState('');
  const [resultadosEsperados, setResultadosEsperados] = useState('');
  const [criteriosQualidade, setCriteriosQualidade] = useState('');

  // Estado de carregamento da IA
  const [gerandoIA, setGerandoIA] = useState(false);

  // Linhas do Plano de Aula
  const [planosAula, setPlanosAula] = useState([
    {
      numAulas: '4',
      conhecimentos: 'Conceitos de PCP e Tipos de Processos Produtivos',
      capacidades: 'Mapear etapas do processo produtivo',
      estrategias: 'Aula expositiva dialogada e estudo de fluxo de fábrica',
      recursos: 'Sala de aula, data-show, amostras de ordens de produção',
      criterios: 'Identificação correta das etapas da linha',
      instrumentos: 'Lista de verificação e exercícios práticos'
    }
  ]);

  // Função para chamar a IA Gemini e preencher a Situação de Aprendizagem
  const gerarSituacaoComGemini = async () => {
    setGerandoIA(true);
    try {
      const res = await fetch('/api/gerar-situacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curso: cursoNome,
          uc: ucNome,
          tipoSituacao,
          capacidades: `${capacidadesTecnicas}\n${capacidadesBasicas}\n${capacidadesSocioemocionais}`
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na requisição');

      if (data.contextualizacao) setContextualizacao(data.contextualizacao);
      if (data.desafio) setDesafio(data.desafio);
      if (data.resultados_esperados) setResultadosEsperados(data.resultados_esperados);
      if (data.criterios_qualidade) setCriteriosQualidade(data.criterios_qualidade);
    } catch (err: any) {
      alert('Não foi possível gerar com o Gemini: ' + err.message);
    } finally {
      setGerandoIA(false);
    }
  };

  const carregarDadosPCA = (uc: string) => {
    setUcNome(uc);
    if (uc.toLowerCase().includes('controle') || uc.toLowerCase().includes('planejamento')) {
      setCapacidadesTecnicas(
        '• Mapear as etapas do processo produtivo.\n• Preencher fichas de controle e ordens de produção.\n• Identificar gargalos e paradas de linha.'
      );
      setCapacidadesBasicas(
        '• Interpretar gráficos e relatórios operacionais.\n• Aplicar cálculos matemáticos básicos aplicados ao rendimento.'
      );
      setCapacidadesSocioemocionais(
        '• Demonstrar compromisso com a qualidade e prazos.\n• Trabalhar em equipe de forma colaborativa.'
      );
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
        criterios: '',
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
      curso_nome: cursoNome,
      modalidade,
      uc_nome: ucNome,
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
      integra_outra_uc: integraOutraUc,
      outra_uc_nome: outraUcNome,
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
      console.error('Erro no localStorage:', err);
    }

    try {
      await supabase.from('peucs').insert([novaPEUC]);
    } catch (err) {
      console.warn('Banco de dados offline. Salvo localmente.');
    }

    router.push(`/peuc/visualizar/${novaPEUC.id}`);
  };

  return (
    <main className="max-w-5xl mx-auto p-6 bg-slate-50 min-h-screen text-slate-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nova PEUC - Metodologia SENAI</h1>
          <p className="text-xs text-slate-500">Preenchimento guiado com Assistente Gemini</p>
        </div>
        <button
          onClick={() => router.push('/peuc')}
          className="text-xs bg-white border border-slate-300 px-3 py-2 rounded-md hover:bg-slate-100"
        >
          Cancelar
        </button>
      </div>

      <form onSubmit={salvarPEUC} className="space-y-6">
        {/* 1. IDENTIFICAÇÃO */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-blue-900 uppercase border-b pb-2">1. Identificação Geral</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold block mb-1">Nome do Curso</label>
              <input
                type="text"
                value={cursoNome}
                onChange={(e) => setCursoNome(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Modalidade</label>
              <input
                type="text"
                value={modalidade}
                onChange={(e) => setModalidade(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Módulo</label>
              <input
                type="text"
                value={modulo}
                onChange={(e) => setModulo(e.target.value)}
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Unidade Curricular (UC)</label>
              <input
                type="text"
                value={ucNome}
                onChange={(e) => carregarDadosPCA(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Carga Horária Total</label>
              <input
                type="text"
                value={ucCargaHoraria}
                onChange={(e) => setUcCargaHoraria(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Docente Responsável</label>
              <input
                type="text"
                value={docente}
                onChange={(e) => setDocente(e.target.value)}
                placeholder="Nome do Professor"
                className="w-full border p-2 rounded"
                required
              />
            </div>
          </div>
        </div>

        {/* 2. OBJETIVOS E CAPACIDADES DA PCA */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-blue-900 uppercase border-b pb-2">2. Objetivos e Capacidades (PCA)</h2>
          
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="font-bold text-blue-800 block mb-1">Capacidades Técnicas (PCA)</label>
                <textarea
                  rows={5}
                  value={capacidadesTecnicas}
                  onChange={(e) => setCapacidadesTecnicas(e.target.value)}
                  className="w-full border border-blue-200 p-2 rounded bg-blue-50/30 text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-blue-800 block mb-1">Capacidades Básicas (PCA)</label>
                <textarea
                  rows={5}
                  value={capacidadesBasicas}
                  onChange={(e) => setCapacidadesBasicas(e.target.value)}
                  className="w-full border border-blue-200 p-2 rounded bg-blue-50/30 text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-blue-800 block mb-1">Capacidades Socioemocionais</label>
                <textarea
                  rows={5}
                  value={capacidadesSocioemocionais}
                  onChange={(e) => setCapacidadesSocioemocionais(e.target.value)}
                  className="w-full border border-blue-200 p-2 rounded bg-blue-50/30 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. SITUAÇÃO DE APRENDIZAGEM COM FERRAMENTA GEMINI */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-sm font-bold text-blue-900 uppercase">3. Situação de Aprendizagem</h2>
            
            {/* BOTÃO INTEGRAÇÃO GEMINI */}
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
              placeholder="Clique em 'Gerar com Gemini' acima para preencher automaticamente ou digite manualmente..."
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Desafio Proposto ao Estudante</label>
            <textarea
              rows={3}
              value={desafio}
              onChange={(e) => setDesafio(e.target.value)}
              placeholder="Clique em 'Gerar com Gemini' acima para preencher automaticamente ou digite manualmente..."
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

        {/* BOTÃO FINAL */}
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
