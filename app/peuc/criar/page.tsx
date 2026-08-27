'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Curso, UnidadeCurricular } from '@/types';

export default function CriarPEUCPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [ucs, setUcs] = useState<UnidadeCurricular[]>([]);
  
  const [cursoSelecionadoId, setCursoSelecionadoId] = useState<string>('');
  const [ucSelecionadaId, setUcSelecionadaId] = useState<string>('');
  
  const [ucAtual, setUcAtual] = useState<UnidadeCurricular | null>(null);
  const [capacidadesSelecionadas, setCapacidadesSelecionadas] = useState<string[]>([]);
  const [conhecimentosSelecionados, setConhecimentosSelecionados] = useState<string[]>([]);

  const [tipoSituacao, setTipoSituacao] = useState('Projeto');
  const [integraOutraUC, setIntegraOutraUC] = useState(false);
  const [contextualizacao, setContextualizacao] = useState('');
  const [desafio, setDesafio] = useState('');
  const [resultadosEsperados, setResultadosEsperados] = useState('');

  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // 1. Carrega cursos cadastrados (Supabase + localStorage)
  useEffect(() => {
    async function carregarCursos() {
      setLoading(true);

      // Leitura via Supabase
      let cursosSupabase: Curso[] = [];
      try {
        const { data, error } = await supabase
          .from('cursos')
          .select('*')
          .order('nome', { ascending: true });

        if (!error && data) {
          cursosSupabase = data;
        }
      } catch (err) {
        console.warn('Falha ao conectar ao Supabase para buscar cursos:', err);
      }

      // Leitura via localStorage
      let cursosLocais: Curso[] = [];
      try {
        const localRaw = localStorage.getItem('cursos_peuc');
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          cursosLocais = parsed.map((item: any, idx: number) => ({
            id: item.id ? String(item.id) : `local-${idx}`,
            nome: item.nomeCurso || item.nome || 'Curso Sem Nome',
            categoria: item.categoria || 'Geral',
            carga_horaria_total: item.cargaHorariaTotal || '',
            created_at: item.criadoEm || new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.error('Erro ao ler cursos do localStorage:', err);
      }

      // Mesclagem e desduplicação por ID/Nome
      const mapa = new Map<string, Curso>();
      [...cursosSupabase, ...cursosLocais].forEach((c) => {
        const chave = c.id || c.nome;
        if (!mapa.has(chave)) {
          mapa.set(chave, c);
        }
      });

      setCursos(Array.from(mapa.values()));
      setLoading(false);
    }

    carregarCursos();
  }, []);

  // 2. Carrega UCs ao selecionar um Curso (Supabase + localStorage)
  useEffect(() => {
    async function carregarUCs() {
      if (!cursoSelecionadoId) {
        setUcs([]);
        setUcSelecionadaId('');
        setUcAtual(null);
        return;
      }

      let ucsEncontradas: UnidadeCurricular[] = [];

      // A. Caso seja um curso do Supabase
      if (!cursoSelecionadoId.startsWith('local-')) {
        try {
          const { data, error } = await supabase
            .from('unidades_curriculares')
            .select('*')
            .eq('curso_id', cursoSelecionadoId)
            .order('numero', { ascending: true });

          if (!error && data) {
            ucsEncontradas = data;
          }
        } catch (err) {
          console.warn('Erro ao carregar UCs do Supabase:', err);
        }
      }

      // B. Caso seja/esteja no localStorage
      if (ucsEncontradas.length === 0) {
        try {
          const localRaw = localStorage.getItem('cursos_peuc');
          if (localRaw) {
            const parsed = JSON.parse(localRaw);
            const cursoLocal = parsed.find(
              (item: any) => String(item.id) === cursoSelecionadoId || item.nomeCurso === cursoSelecionadoId
            );

            if (cursoLocal && cursoLocal.unidadesCurriculares) {
              ucsEncontradas = cursoLocal.unidadesCurriculares.map((uc: any, idx: number) => ({
                id: uc.id || `uc-local-${idx}`,
                curso_id: cursoSelecionadoId,
                numero: uc.numero || idx + 1,
                nome: uc.nomeUc || uc.nome || 'UC sem nome',
                carga_horaria: uc.cargaHoraria || uc.carga_horaria || 0,
                capacidades: uc.capacidades || [],
                conhecimentos: uc.conhecimentos || [],
              }));
            }
          }
        } catch (err) {
          console.error('Erro ao ler UCs do localStorage:', err);
        }
      }

      setUcs(ucsEncontradas);
    }

    carregarUCs();
  }, [cursoSelecionadoId]);

  // 3. Atualiza os dados da UC selecionada
  useEffect(() => {
    if (!ucSelecionadaId) {
      setUcAtual(null);
      setCapacidadesSelecionadas([]);
      setConhecimentosSelecionados([]);
      return;
    }

    const uc = ucs.find((u) => u.id === ucSelecionadaId) || null;
    setUcAtual(uc);
    if (uc) {
      setCapacidadesSelecionadas(uc.capacidades || []);
      setConhecimentosSelecionados(uc.conhecimentos || []);
    }
  }, [ucSelecionadaId, ucs]);

  const handleSalvarPEUC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cursoSelecionadoId || !ucSelecionadaId) {
      setMensagem({ tipo: 'erro', texto: 'Selecione um Curso e uma Unidade Curricular.' });
      return;
    }

    setSalvando(true);
    setMensagem(null);

    const peucPayload = {
      id: Date.now().toString(),
      curso_id: cursoSelecionadoId,
      unidade_curricular_id: ucSelecionadaId,
      tipo_situacao_aprendizagem: tipoSituacao,
      integra_outra_uc: integraOutraUC,
      contextualizacao,
      desafio,
      resultados_esperados: resultadosEsperados,
      capacidades_selecionadas: capacidadesSelecionadas,
      conhecimentos_selecionados: conhecimentosSelecionados,
      status: 'Concluído',
      created_at: new Date().toISOString()
    };

    try {
      // Gravação no Supabase (se válido)
      if (!cursoSelecionadoId.startsWith('local-')) {
        const { error } = await supabase.from('peucs').insert(peucPayload);
        if (error) console.warn('Erro ao salvar no Supabase:', error);
      }

      // Backup de gravação LocalStorage
      const peucsLocais = JSON.parse(localStorage.getItem('peucs_salvas') || '[]');
      peucsLocais.push(peucPayload);
      localStorage.setItem('peucs_salvas', JSON.stringify(peucsLocais));

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
                    [{c.categoria || 'Geral'}] {c.nome}
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
                    {u.numero ? `${u.numero}. ` : ''}{u.nome} ({u.carga_horaria || 0}h)
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
