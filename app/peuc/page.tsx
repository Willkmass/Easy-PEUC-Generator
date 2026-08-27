'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function CriarPEUCPage() {
  const [cursos, setCursos] = useState<any[]>([]);
  const [ucs, setUcs] = useState<any[]>([]);
  
  const [cursoSelecionadoId, setCursoSelecionadoId] = useState('');
  const [ucSelecionadaId, setUcSelecionadaId] = useState('');

  // 1. Cabeçalho Institucional SENAI
  const [docente, setDocente] = useState('');
  const [modalidade, setModalidade] = useState('Habilitação Técnica');
  const [modulo, setModulo] = useState('');
  const [numAulas, setNumAulas] = useState('');
  const [numSA, setNumSA] = useState('1');

  // 2. Estratégia de Aprendizagem
  const [tipoSituacao, setTipoSituacao] = useState('Situação-Problema');
  const [integraOutraUC, setIntegraOutraUC] = useState('Não');
  const [outraUcNome, setOutraUcNome] = useState('');
  const [contextualizacao, setContextualizacao] = useState('');
  const [desafio, setDesafio] = useState('');
  const [resultadosEsperados, setResultadosEsperados] = useState('');

  // 3. Matriz de Plano de Aula (SENAI)
  const [planosAula, setPlanosAula] = useState([
    {
      numAulas: '',
      capacidades: '',
      conhecimentos: '',
      estrategias: '',
      recursos: '',
      criterios: '',
      instrumentos: ''
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Carrega Cursos (Supabase + localStorage)
  useEffect(() => {
    async function carregarCursos() {
      setLoading(true);
      let cursosSupabase: any[] = [];
      try {
        const { data } = await supabase.from('cursos').select('*').order('nome', { ascending: true });
        if (data) cursosSupabase = data;
      } catch (err) {
        console.warn('Supabase offline ou sem tabela cursos:', err);
      }

      let cursosLocais: any[] = [];
      try {
        const localRaw = localStorage.getItem('cursos_peuc');
        if (localRaw) {
          cursosLocais = JSON.parse(localRaw).map((item: any, idx: number) => ({
            id: item.id ? String(item.id) : `local-${idx}`,
            nome: item.nomeCurso || item.nome || 'Curso Sem Nome',
            categoria: item.categoria || 'Geral',
          }));
        }
      } catch (err) {
        console.error('Erro ao ler localStorage:', err);
      }

      const mapa = new Map<string, any>();
      [...cursosSupabase, ...cursosLocais].forEach(c => mapa.set(c.id || c.nome, c));
      setCursos(Array.from(mapa.values()));
      setLoading(false);
    }
    carregarCursos();
  }, []);

  // Carrega UCs dinamicamente com base no Curso Selecionado
  useEffect(() => {
    async function carregarUCs() {
      if (!cursoSelecionadoId) {
        setUcs([]);
        setUcSelecionadaId('');
        return;
      }
      let ucsEncontradas: any[] = [];
      if (!cursoSelecionadoId.startsWith('local-')) {
        try {
          const { data } = await supabase.from('unidades_curriculares').select('*').eq('curso_id', cursoSelecionadoId);
          if (data) ucsEncontradas = data;
        } catch (err) {
          console.warn('Erro ao carregar UCs:', err);
        }
      }

      if (ucsEncontradas.length === 0) {
        try {
          const localRaw = localStorage.getItem('cursos_peuc');
          if (localRaw) {
            const parsed = JSON.parse(localRaw);
            const cursoLocal = parsed.find((item: any) => String(item.id) === cursoSelecionadoId || item.nomeCurso === cursoSelecionadoId);
            if (cursoLocal?.unidadesCurriculares) {
              ucsEncontradas = cursoLocal.unidadesCurriculares.map((uc: any, idx: number) => ({
                id: uc.id || `uc-local-${idx}`,
                nome: uc.nomeUc || uc.nome || 'UC sem nome',
                carga_horaria: uc.cargaHoraria || uc.carga_horaria || 0,
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

  const addLinhaPlano = () => {
    setPlanosAula([
      ...planosAula,
      { numAulas: '', capacidades: '', conhecimentos: '', estrategias: '', recursos: '', criterios: '', instrumentos: '' }
    ]);
  };

  const removerLinhaPlano = (index: number) => {
    if (planosAula.length === 1) return;
    setPlanosAula(planosAula.filter((_, i) => i !== index));
  };

  const handleSalvarPEUC = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setMensagem(null);

    const cursoAtual = cursos.find(c => c.id === cursoSelecionadoId);
    const ucAtual = ucs.find(u => u.id === ucSelecionadaId);

    const payload = {
      id: Date.now().toString(),
      curso_id: cursoSelecionadoId,
      curso_nome: cursoAtual?.nome || 'Não informado',
      unidade_curricular_id: ucSelecionadaId,
      uc_nome: ucAtual?.nome || 'Não informado',
      uc_carga_horaria: ucAtual?.carga_horaria || 0,
      docente,
      modalidade,
      modulo,
      num_aulas: numAulas,
      num_sa: numSA,
      tipo_situacao: tipoSituacao,
      integra_outra_uc: integraOutraUC,
      outra_uc_nome: outraUcNome,
      contextualizacao,
      desafio,
      resultados_esperados: resultadosEsperados,
      planos_aula: planosAula,
      status: 'Concluído',
      created_at: new Date().toISOString()
    };

    try {
      if (!cursoSelecionadoId.startsWith('local-')) {
        await supabase.from('peucs').insert(payload);
      }
      const peucsLocais = JSON.parse(localStorage.getItem('peucs_salvas') || '[]');
      peucsLocais.push(payload);
      localStorage.setItem('peucs_salvas', JSON.stringify(peucsLocais));

      setMensagem({ tipo: 'sucesso', texto: 'PEUC cadastrada com sucesso! Pronta para exportação em PDF.' });
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err.message || 'Erro ao salvar a PEUC.' });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Plano de Ensino da Unidade Curricular</h1>
        <p className="text-sm text-slate-500">Padrão Oficial Sistema SENAI / DR-PR</p>
      </div>

      <form onSubmit={handleSalvarPEUC} className="space-y-6">
        {/* Bloco 1: Identificação */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-blue-700 mb-4">1. Identificação Geral</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Docente(s)</label>
              <input type="text" value={docente} onChange={(e) => setDocente(e.target.value)} placeholder="Nome do docente" className="w-full border rounded-md p-2 text-sm text-slate-900" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Curso</label>
              <select value={cursoSelecionadoId} onChange={(e) => setCursoSelecionadoId(e.target.value)} className="w-full border rounded-md p-2 text-sm text-slate-900" required>
                <option value="">-- Selecione o Curso --</option>
                {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unidade Curricular</label>
              <select value={ucSelecionadaId} onChange={(e) => setUcSelecionadaId(e.target.value)} disabled={!cursoSelecionadoId} className="w-full border rounded-md p-2 text-sm text-slate-900 disabled:bg-slate-100" required>
                <option value="">-- Selecione a UC --</option>
                {ucs.map(u => <option key={u.id} value={u.id}>{u.nome} ({u.carga_horaria}h)</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Modalidade</label>
              <select value={modalidade} onChange={(e) => setModalidade(e.target.value)} className="w-full border rounded-md p-2 text-sm text-slate-900">
                <option value="Aprendizagem Industrial">Aprendizagem Industrial</option>
                <option value="Habilitação Técnica">Habilitação Técnica</option>
                <option value="Qualificação Profissional">Qualificação Profissional</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Módulo</label>
              <input type="text" value={modulo} onChange={(e) => setModulo(e.target.value)} placeholder="Ex: Módulo Básico" className="w-full border rounded-md p-2 text-sm text-slate-900" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nº Aulas / Nº SA</label>
              <div className="flex gap-2">
                <input type="text" placeholder="Aulas" value={numAulas} onChange={(e) => setNumAulas(e.target.value)} className="w-1/2 border rounded-md p-2 text-sm text-slate-900" />
                <input type="text" placeholder="Nº SA" value={numSA} onChange={(e) => setNumSA(e.target.value)} className="w-1/2 border rounded-md p-2 text-sm text-slate-900" />
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 2: Estratégia de Aprendizagem */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-blue-700">2. Estratégia de Aprendizagem Desafiadora</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Estratégia</label>
              <select value={tipoSituacao} onChange={(e) => setTipoSituacao(e.target.value)} className="w-full border rounded-md p-2 text-sm text-slate-900">
                <option value="Situação-Problema">Situação-Problema</option>
                <option value="Estudo de Caso">Estudo de Caso</option>
                <option value="Pesquisa Aplicada">Pesquisa Aplicada</option>
                <option value="Projeto">Projeto</option>
                <option value="Projeto Integrador">Projeto Integrador</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Integra outra UC/Curso?</label>
              <select value={integraOutraUC} onChange={(e) => setIntegraOutraUC(e.target.value)} className="w-full border rounded-md p-2 text-sm text-slate-900">
                <option value="Não">Não</option>
                <option value="Sim">Sim</option>
              </select>
            </div>
            {integraOutraUC === 'Sim' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Qual outra UC / Curso?</label>
                <input type="text" value={outraUcNome} onChange={(e) => setOutraUcNome(e.target.value)} className="w-full border rounded-md p-2 text-sm text-slate-900" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Contextualização</label>
            <textarea rows={2} value={contextualizacao} onChange={(e) => setContextualizacao(e.target.value)} placeholder="Breve contexto prático da situação..." className="w-full border rounded-md p-2 text-sm text-slate-900" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Desafio</label>
            <textarea rows={2} value={desafio} onChange={(e) => setDesafio(e.target.value)} placeholder="O problema ou projeto a ser resolvido..." className="w-full border rounded-md p-2 text-sm text-slate-900" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Resultados Esperados</label>
            <textarea rows={2} value={resultadosEsperados} onChange={(e) => setResultadosEsperados(e.target.value)} placeholder="Produtos, entregáveis ou relatórios..." className="w-full border rounded-md p-2 text-sm text-slate-900" required />
          </div>
        </div>

        {/* Bloco 3: Matriz de Plano de Aula SENAI */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-700">3. Plano de Aula</h2>
            <button type="button" onClick={addLinhaPlano} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-md border border-slate-300">
              + Adicionar Linha
            </button>
          </div>

          <div className="space-y-3">
            {planosAula.map((linha, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                <div className="flex justify-between items-center font-bold text-slate-600">
                  <span>Item #{idx + 1}</span>
                  {planosAula.length > 1 && (
                    <button type="button" onClick={() => removerLinhaPlano(idx)} className="text-red-500 hover:text-red-700">
                      Remover
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                  <input placeholder="Nº Aulas" value={linha.numAulas} onChange={(e) => { const c = [...planosAula]; c[idx].numAulas = e.target.value; setPlanosAula(c); }} className="border p-1.5 rounded bg-white text-slate-900" />
                  <input placeholder="Capacidades" value={linha.capacidades} onChange={(e) => { const c = [...planosAula]; c[idx].capacidades = e.target.value; setPlanosAula(c); }} className="border p-1.5 rounded bg-white text-slate-900" />
                  <input placeholder="Conhecimentos" value={linha.conhecimentos} onChange={(e) => { const c = [...planosAula]; c[idx].conhecimentos = e.target.value; setPlanosAula(c); }} className="border p-1.5 rounded bg-white text-slate-900" />
                  <input placeholder="Estratégias / Descrição" value={linha.estrategias} onChange={(e) => { const c = [...planosAula]; c[idx].estrategias = e.target.value; setPlanosAula(c); }} className="border p-1.5 rounded bg-white text-slate-900" />
                  <input placeholder="Recursos / Ambientes" value={linha.recursos} onChange={(e) => { const c = [...planosAula]; c[idx].recursos = e.target.value; setPlanosAula(c); }} className="border p-1.5 rounded bg-white text-slate-900" />
                  <input placeholder="Critérios Avaliação" value={linha.criterios} onChange={(e) => { const c = [...planosAula]; c[idx].criterios = e.target.value; setPlanosAula(c); }} className="border p-1.5 rounded bg-white text-slate-900" />
                  <input placeholder="Instrumentos" value={linha.instrumentos} onChange={(e) => { const c = [...planosAula]; c[idx].instrumentos = e.target.value; setPlanosAula(c); }} className="border p-1.5 rounded bg-white text-slate-900" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {mensagem && (
          <div className={`p-4 rounded-lg text-sm font-semibold ${mensagem.tipo === 'sucesso' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {mensagem.texto}
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={salvando} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-md shadow-sm transition disabled:bg-slate-400">
            {salvando ? 'Salvando PEUC...' : 'Salvar PEUC SENAI'}
          </button>
        </div>
      </form>
    </main>
  );
}
