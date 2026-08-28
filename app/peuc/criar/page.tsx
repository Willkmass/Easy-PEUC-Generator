'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Curso, UnidadeCurricular } from '@/types';

// Estrutura para separar as 3 categorias
interface CapacidadesCategorizadas {
  basicas: string[];
  tecnicas: string[];
  socioemocionais: string[];
}

/**
 * Função utilitária que classifica e separa as capacidades brutas da UC/PCA 
 * com base no padrão Metodologia SENAI.
 */
function classificarCapacidadesPca(capacidades: any[] = []): CapacidadesCategorizadas {
  const result: CapacidadesCategorizadas = { basicas: [], tecnicas: [], socioemocionais: [] };

  capacidades.forEach((item) => {
    // Trata tanto strings simples quanto objetos vindos do Supabase
    const texto = typeof item === 'string' ? item : item.descricao || '';
    const tipo = typeof item === 'object' ? (item.tipo || '').toLowerCase() : '';
    const modulo = typeof item === 'object' ? (item.modulo || '').toLowerCase() : '';
    const lower = texto.toLowerCase();

    // Regras de Classificação
    const isSocioemocional =
      tipo.includes('socioemocional') ||
      tipo.includes('gestao') ||
      tipo.includes('atitudinal') ||
      /trabalho em equipe|comunicação|liderança|ética|proatividade|gestão|autonomia/i.test(lower);

    const isBasica =
      tipo.includes('basica') ||
      tipo.includes('fundamento') ||
      modulo.includes('basico') ||
      /fundamentos|cálculo|conceito|física|química|interpretação|matemática/i.test(lower);

    if (isSocioemocional) {
      result.socioemocionais.push(texto);
    } else if (isBasica) {
      result.basicas.push(texto);
    } else {
      result.tecnicas.push(texto);
    }
  });

  return result;
}

export default function CriarPEUCPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [ucs, setUcs] = useState<UnidadeCurricular[]>([]);

  const [cursoSelecionadoId, setCursoSelecionadoId] = useState<string>('');
  const [ucSelecionadaId, setUcSelecionadaId] = useState<string>('');
  const [ucAtual, setUcAtual] = useState<UnidadeCurricular | null>(null);

  // Estados Separados para as 3 Categorias
  const [capBasicasDisponiveis, setCapBasicasDisponiveis] = useState<string[]>([]);
  const [capTecnicasDisponiveis, setCapTecnicasDisponiveis] = useState<string[]>([]);
  const [capSocioDisponiveis, setCapSocioDisponiveis] = useState<string[]>([]);

  const [capBasicasSelecionadas, setCapBasicasSelecionadas] = useState<string[]>([]);
  const [capTecnicasSelecionadas, setCapTecnicasSelecionadas] = useState<string[]>([]);
  const [capSocioSelecionadas, setCapSocioSelecionadas] = useState<string[]>([]);

  const [conhecimentosSelecionados, setConhecimentosSelecionados] = useState<string[]>([]);

  const [tipoSituacao, setTipoSituacao] = useState('Projeto');
  const [integraOutraUC, setIntegraOutraUC] = useState(false);
  const [contextualizacao, setContextualizacao] = useState('');
  const [desafio, setDesafio] = useState('');
  const [resultadosEsperados, setResultadosEsperados] = useState('');

  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // 1. Carrega cursos cadastrados no Supabase
  useEffect(() => {
    async function carregarCursos() {
      setLoading(true);
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .order('nome', { ascending: true });

      if (!error && data) {
        setCursos(data);
      }
      setLoading(false);
    }
    carregarCursos();
  }, []);

  // 2. Carrega UCs ao selecionar um Curso
  useEffect(() => {
    async function carregarUCs() {
      if (!cursoSelecionadoId) {
        setUcs([]);
        setUcSelecionadaId('');
        setUcAtual(null);
        return;
      }

      const { data, error } = await supabase
        .from('unidades_curriculares')
        .select('*')
        .eq('curso_id', cursoSelecionadoId)
        .order('numero', { ascending: true });

      if (!error && data) {
        setUcs(data);
      }
    }
    carregarUCs();
  }, [cursoSelecionadoId]);

  // 3. Processa a UC selecionada e classifica as Capacidades nas 3 categorias
  useEffect(() => {
    if (!ucSelecionadaId) {
      setUcAtual(null);
      setCapBasicasDisponiveis([]);
      setCapTecnicasDisponiveis([]);
      setCapSocioDisponiveis([]);
      setCapBasicasSelecionadas([]);
      setCapTecnicasSelecionadas([]);
      setCapSocioSelecionadas([]);
      setConhecimentosSelecionados([]);
      return;
    }

    const uc = ucs.find((u) => u.id === ucSelecionadaId) || null;
    setUcAtual(uc);

    if (uc) {
      const { basicas, tecnicas, socioemocionais } = classificarCapacidadesPca(uc.capacidades || []);
      
      setCapBasicasDisponiveis(basicas);
      setCapTecnicasDisponiveis(tecnicas);
      setCapSocioDisponiveis(socioemocionais);

      // Marca todas por padrão ao selecionar a UC
      setCapBasicasSelecionadas(basicas);
      setCapTecnicasSelecionadas(tecnicas);
      setCapSocioSelecionadas(socioemocionais);

      setConhecimentosSelecionados(uc.conhecimentos || []);
    }
  }, [ucSelecionadaId, ucs]);

  // 4. Auto-edição Dinâmica: Ajusta a seleção das capacidades conforme o Desafio é preenchido
  useEffect(() => {
    const textoDesafio = desafio.toLowerCase().trim();
    if (!textoDesafio || textoDesafio.length < 8) return;

    // Filtra marcando automaticamente apenas as capacidades que possuem termos correlacionados ao desafio
    const autoFiltrar = (listaDisponivel: string[]) =>
      listaDisponivel.filter((cap) =>
        cap.toLowerCase().split(' ').some((palavra) => palavra.length > 3 && textoDesafio.includes(palavra))
      );

    const subBasicas = autoFiltrar(capBasicasDisponiveis);
    const subTecnicas = autoFiltrar(capTecnicasDisponiveis);
    const subSocio = autoFiltrar(capSocioDisponiveis);

    if (subBasicas.length > 0) setCapBasicasSelecionadas(subBasicas);
    if (subTecnicas.length > 0) setCapTecnicasSelecionadas(subTecnicas);
    if (subSocio.length > 0) setCapSocioSelecionadas(subSocio);

  }, [desafio, capBasicasDisponiveis, capTecnicasDisponiveis, capSocioDisponiveis]);

  // Funções Auxiliares para Toggle Individual
  const toggleCapacidaDeItem = (item: string, lista: string[], setLista: React.Dispatch<React.SetStateAction<string[]>>) => {
    setLista(lista.includes(item) ? lista.filter((i) => i !== item) : [...lista, item]);
  };

  const handleSalvarPEUC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cursoSelecionadoId || !ucSelecionadaId) {
      setMensagem({ tipo: 'erro', texto: 'Selecione um Curso e uma Unidade Curricular.' });
      return;
    }

    setSalvando(true);
    setMensagem(null);

    try {
      const { error } = await supabase.from('peucs').insert({
        curso_id: cursoSelecionadoId,
        unidade_curricular_id: ucSelecionadaId,
        tipo_situacao_aprendizagem: tipoSituacao,
        integra_outra_uc: integraOutraUC,
        contextualizacao,
        desafio,
        resultados_esperados: resultadosEsperados,
        
        // Salvamento Estruturado por Categoria no Banco de Dados
        capacidades_basicas: capBasicasSelecionadas,
        capacidades_tecnicas: capTecnicasSelecionadas,
        capacidades_socioemocionais: capSocioSelecionadas,
        conhecimentos_selecionados: conhecimentosSelecionados,
        status: 'Concluído',
      });

      if (error) throw error;

      setMensagem({ tipo: 'sucesso', texto: 'PEUC elaborada e salva com sucesso!' });
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err.message || 'Erro ao salvar PEUC.' });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Elaborar Nova PEUC</h1>
        <p className="text-sm text-slate-500">
          Monte o Plano de Ensino integrando os dados cadastrados no PCA com as Situações de Aprendizagem.
        </p>
      </div>

      <form onSubmit={handleSalvarPEUC} className="space-y-6">
        {/* Seção 1: Seleção de Curso e UC */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">1. Identificação da UC</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Curso (Cadastrado via PCA)
              </label>
              <select
                value={cursoSelecionadoId}
                onChange={(e) => setCursoSelecionadoId(e.target.value)}
                disabled={loading}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="">-- Selecione o Curso --</option>
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.categoria}] {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Unidade Curricular
              </label>
              <select
                value={ucSelecionadaId}
                onChange={(e) => setUcSelecionadaId(e.target.value)}
                disabled={!cursoSelecionadoId || ucs.length === 0}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:bg-slate-100"
                required
              >
                <option value="">-- Selecione a UC --</option>
                {ucs.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.numero}. {u.nome} ({u.carga_horaria}h)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Seção 2: Situação de Aprendizagem */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">2. Situação de Aprendizagem</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Estratégia Pedagógica
              </label>
              <select
                value={tipoSituacao}
                onChange={(e) => setTipoSituacao(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="Projeto">Projeto</option>
                <option value="Estudo de Caso">Estudo de Caso</option>
                <option value="Situação Problema">Situação Problema</option>
                <option value="Pesquisa Aplicada">Pesquisa Aplicada</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={integraOutraUC}
                  onChange={(e) => setIntegraOutraUC(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Integra outra Unidade Curricular
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Contextualização</label>
              <textarea
                rows={3}
                value={contextualizacao}
                onChange={(e) => setContextualizacao(e.target.value)}
                placeholder="Descreva o contexto profissional e a aplicação real..."
                className="w-full rounded-md border border-slate-300 p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Desafio</label>
              <textarea
                rows={3}
                value={desafio}
                onChange={(e) => setDesafio(e.target.value)}
                placeholder="Defina o problema prático que o aluno deverá resolver..."
                className="w-full rounded-md border border-slate-300 p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Resultados Esperados</label>
              <textarea
                rows={2}
                value={resultadosEsperados}
                onChange={(e) => setResultadosEsperados(e.target.value)}
                placeholder="Entregáveis, relatórios ou produtos esperados..."
                className="w-full rounded-md border border-slate-300 p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Seção 3: Seleção e Refinamento de Capacidades (Categorizadas) */}
        {ucSelecionadaId && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <h2 className="text-base font-semibold text-slate-900">
              3. Capacidades Desenvolvidas na Solução do Desafio
            </h2>

            {/* Capacidades Básicas */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4">
              <h3 className="text-xs font-bold uppercase text-amber-800 mb-1">
                Capacidades Básicas (Fundamentos Técnicos e Científicos)
              </h3>
              <p className="text-xs text-amber-700 mb-3">
                Extraídas do Módulo Básico para dar suporte teórico/científico à solução.
              </p>
              <div className="space-y-2">
                {capBasicasDisponiveis.length === 0 ? (
                  <p className="text-xs italic text-slate-400">Nenhuma capacidade básica vinculada a esta UC.</p>
                ) : (
                  capBasicasDisponiveis.map((item, idx) => (
                    <label key={idx} className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={capBasicasSelecionadas.includes(item)}
                        onChange={() => toggleCapacidaDeItem(item, capBasicasSelecionadas, setCapBasicasSelecionadas)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span>{item}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Capacidades Técnicas */}
            <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4">
              <h3 className="text-xs font-bold uppercase text-blue-800 mb-1">
                Capacidades Técnicas (Específicas do Módulo)
              </h3>
              <p className="text-xs text-blue-700 mb-3">
                Atividades práticas e procedimentos operacionais necessários para execução.
              </p>
              <div className="space-y-2">
                {capTecnicasDisponiveis.length === 0 ? (
                  <p className="text-xs italic text-slate-400">Nenhuma capacidade técnica vinculada a esta UC.</p>
                ) : (
                  capTecnicasDisponiveis.map((item, idx) => (
                    <label key={idx} className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={capTecnicasSelecionadas.includes(item)}
                        onChange={() => toggleCapacidaDeItem(item, capTecnicasSelecionadas, setCapTecnicasSelecionadas)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{item}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Capacidades Socioemocionais */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
              <h3 className="text-xs font-bold uppercase text-emerald-800 mb-1">
                Capacidades Socioemocionais (Gestão e Atitudinais)
              </h3>
              <p className="text-xs text-emerald-700 mb-3">
                Atitudes, autonomia, comunicação e trabalho em equipe exigidos pelo desafio.
              </p>
              <div className="space-y-2">
                {capSocioDisponiveis.length === 0 ? (
                  <p className="text-xs italic text-slate-400">Nenhuma capacidade socioemocional vinculada.</p>
                ) : (
                  capSocioDisponiveis.map((item, idx) => (
                    <label key={idx} className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={capSocioSelecionadas.includes(item)}
                        onChange={() => toggleCapacidaDeItem(item, capSocioSelecionadas, setCapSocioSelecionadas)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{item}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notificações */}
        {mensagem && (
          <div
            className={`p-4 rounded-lg border text-sm font-medium ${
              mensagem.tipo === 'sucesso'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {mensagem.texto}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={salvando}
            className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:bg-slate-400"
          >
            {salvando ? 'Salvando PEUC...' : 'Salvar PEUC'}
          </button>
        </div>
      </form>
    </main>
  );
}
