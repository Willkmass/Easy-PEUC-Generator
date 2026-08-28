'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export interface MensagemChat {
  role: 'user' | 'gemini';
  texto: string;
  dadosGerados?: {
    contextualizacao?: string;
    desafio?: string;
    resultadosEsperados?: string;
    criteriosQualidade?: string;
  };
}

export function usePeucForm() {
  const router = useRouter();
  const chatBottomRef = useRef<HTMLDivElement>(null);

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

  // Widget Gemini Chat Flutuante
  const [chatAberto, setChatAberto] = useState(false);
  const [mensagensChat, setMensagensChat] = useState<MensagemChat[]>([
    {
      role: 'gemini',
      texto: 'Olá! Sou o assistente Gemini. Como posso ajudar na construção da sua Situação de Aprendizagem hoje?'
    }
  ]);
  const [inputChat, setInputChat] = useState('');
  const [enviandoChat, setEnviandoChat] = useState(false);

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

  const formatarTexto = (val: any): string => {
    if (!val) return '';
    if (Array.isArray(val)) {
      return val
        .map((item) => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item !== null) {
            return item.descricao || item.nome || item.titulo || item.texto || JSON.stringify(item);
          }
          return String(item);
        })
        .filter(Boolean)
        .join('\n');
    }
    if (typeof val === 'object') {
      return val.descricao || val.nome || val.titulo || JSON.stringify(val, null, 2);
    }
    return String(val);
  };

  // Processador universal de capacidades
  const processarEAdaptarCapacidades = (ucObjeto: any, aulas: typeof planosAula) => {
    if (!ucObjeto) return;

    const extrairListaGenerica = (fonte: any): string[] => {
      if (!fonte) return [];
      if (Array.isArray(fonte)) {
        return fonte
          .map((item) => {
            if (typeof item === 'string') return item.trim();
            if (typeof item === 'object' && item !== null) {
              return (item.descricao || item.nome || item.titulo || item.texto || '').trim();
            }
            return '';
          })
          .filter((s) => s.length > 2);
      }
      if (typeof fonte === 'string') {
        return fonte.split(/\n|;|\./).map((s) => s.trim()).filter((s) => s.length > 2);
      }
      return [];
    };

    // 1. Tentar extrair diretamente se o PCA já tiver os campos separados
    const capsBrutas = ucObjeto.capacidades || {};
    let basicasLista = extrairListaGenerica(capsBrutas.basicas || ucObjeto.capacidades_basicas || ucObjeto.capacidadesBasicas);
    let tecnicasLista = extrairListaGenerica(capsBrutas.tecnicas || ucObjeto.capacidades_tecnicas || ucObjeto.capacidadesTecnicas);
    let socioLista = extrairListaGenerica(capsBrutas.socioemocionais || ucObjeto.capacidades_socioemocionais || ucObjeto.capacidadesSocioemocionais);

    // 2. Se tudo estiver dentro de um array genérico de capacidades
    if (basicasLista.length === 0 && tecnicasLista.length === 0 && socioLista.length === 0) {
      const listaUnica = extrairListaGenerica(ucObjeto.capacidades || ucObjeto.listaCapacidades);
      tecnicasLista = listaUnica;
    }

    // 3. Algoritmo de Triagem (Caso estejam misturadas na lista de técnicas)
    if (tecnicasLista.length > 0 && basicasLista.length === 0 && socioLista.length === 0) {
      const todas = [...tecnicasLista];
      tecnicasLista = [];

      const moduloNome = (modulo || ucObjeto.modulo || ucObjeto.modulo_nome || '').toLowerCase();
      const ehModuloBasico = moduloNome.includes('básico') || moduloNome.includes('basico') || moduloNome.includes('introdução');

      todas.forEach((cap) => {
        const capLower = cap.toLowerCase();
        
        // Termos típicos socioemocionais (SENAI)
        if (
          capLower.includes('equipe') ||
          capLower.includes('comunicação') ||
          capLower.includes('ética') ||
          capLower.includes('proatividade') ||
          capLower.includes('gestão') ||
          capLower.includes('liderança') ||
          capLower.includes('autonomia') ||
          capLower.includes('comprometimento') ||
          capLower.includes('conflito') ||
          capLower.includes('relacionamento')
        ) {
          socioLista.push(cap);
        } 
        // Termos típicos de capacidades básicas
        else if (
          ehModuloBasico ||
          capLower.includes('fundamento') ||
          capLower.includes('calcular') ||
          capLower.includes('interpretar') ||
          capLower.includes('identificar') ||
          capLower.includes('conceito') ||
          capLower.includes('leitura') ||
          capLower.includes('reconhecer')
        ) {
          basicasLista.push(cap);
        } 
        // Restante permanece como técnica
        else {
          tecnicasLista.push(cap);
        }
      });
    }

    // 4. Inserção contextual baseada no Plano de Aula
    const estrategiasTexto = aulas.map((a) => a.estrategias).join(' ').toLowerCase();
    if (estrategiasTexto.trim().length > 0) {
      if ((estrategiasTexto.includes('grupo') || estrategiasTexto.includes('equipe') || estrategiasTexto.includes('apresentação')) && socioLista.length === 0) {
        socioLista.push('Demonstrar capacidade de trabalho em equipe e comunicação assertiva.');
      }
      if ((estrategiasTexto.includes('pesquisa') || estrategiasTexto.includes('manual') || estrategiasTexto.includes('estudo')) && basicasLista.length === 0) {
        basicasLista.push('Compreender e interpretar os fundamentos técnicos e científicos.');
      }
    }

    setCapacidadesTecnicas(tecnicasLista.join('\n'));
    setCapacidadesBasicas(basicasLista.join('\n'));
    setCapacidadesSocioemocionais(socioLista.join('\n'));
  };

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
    if (ucCargaHoraria) gerarLacunasAulas(ucCargaHoraria);
  }, [ucCargaHoraria]);

  useEffect(() => {
    if (chatAberto) chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagensChat, chatAberto]);

  const carregarDadosCursosEUCs = async () => {
    setCarregando(true);
    let cursosEncontrados: any[] = [];

    try {
      const { data: pcasDb, error: errPca } = await supabase.from('pcas').select('*');
      if (!errPca && pcasDb && pcasDb.length > 0) {
        cursosEncontrados = pcasDb;
      } else {
        const { data: cursosDb } = await supabase.from('cursos').select('*');
        if (cursosDb && cursosDb.length > 0) cursosEncontrados = cursosDb;
      }
    } catch (e) {
      console.warn('Busca no Supabase falhou, buscando no localStorage:', e);
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
              const arr = parsed.cursos || parsed.pcas || parsed.data;
              if (Array.isArray(arr)) cursosEncontrados = [...cursosEncontrados, ...arr];
              else cursosEncontrados.push(parsed);
            }
          } catch (e) {}
        }
      });
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
      if (primeiro.ucs && primeiro.ucs.length > 0) aplicarUC(primeiro.ucs[0]);
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
      if (ucs.length > 0) aplicarUC(ucs[0]);
      else limparUC();
    }
  };

  const aoMudarUC = (nomeUC: string) => {
    const ucEncontrada = ucsDisponiveis.find(
      (u) => (u.nomeUc || u.nome_uc || u.nome || u.unidade || u.titulo) === nomeUC
    );
    if (ucEncontrada) aplicarUC(ucEncontrada);
  };

  const aplicarUC = (uc: any) => {
    setUcSelecionada(uc.nomeUc || uc.nome_uc || uc.nome || uc.unidade || uc.titulo || '');
    setUcCargaHoraria(uc.cargaHoraria || uc.carga_horaria || uc.ch || uc.horas || '');
    setModulo(uc.modulo || uc.modulo_nome || '');
    
    const caps = uc.capacidades || {};
    setObjetivoGeral(formatarTexto(uc.objetivo_geral || uc.objetivo || caps.objetivo || uc.conhecimentos));
    setCompetencias(formatarTexto(uc.competencias || uc.competencia || caps.competencia));
    
    processarEAdaptarCapacidades(uc, planosAula);
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

  const enviarMensagemGemini = async (promptCustomizado?: string) => {
    const promptFinal = promptCustomizado || inputChat;
    if (!promptFinal.trim() || enviandoChat) return;

    const novasMensagens = [...mensagensChat, { role: 'user' as const, texto: promptFinal }];
    setMensagensChat(novasMensagens);
    if (!promptCustomizado) setInputChat('');
    setEnviandoChat(true);

    try {
      const res = await fetch('/api/gerar-situacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptFinal,
          curso: cursoSelecionado,
          uc: ucSelecionada,
          tipoSituacao,
          capacidades: `Técnicas: ${capacidadesTecnicas} | Básicas: ${capacidadesBasicas} | Socioemocionais: ${capacidadesSocioemocionais}`
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na requisição');

      const temDadosEstruturados = data.contextualizacao || data.desafio;

      setMensagensChat([
        ...novasMensagens,
        {
          role: 'gemini',
          texto: data.resposta || 'Abaixo está a sugestão para a sua Situação de Aprendizagem:',
          dadosGerados: temDadosEstruturados
            ? {
                contextualizacao: data.contextualizacao,
                desafio: data.desafio,
                resultadosEsperados: data.resultadosEsperados,
                criteriosQualidade: data.criteriosQualidade
              }
            : undefined
        }
      ]);
    } catch (err: any) {
      setMensagensChat([...novasMensagens, { role: 'gemini', texto: `⚠️ Erro: ${err.message}` }]);
    } finally {
      setEnviandoChat(false);
    }
  };

  const aplicarDadosNoFormulario = (dados: NonNullable<MensagemChat['dadosGerados']>) => {
    if (dados.contextualizacao) setContextualizacao(dados.contextualizacao);
    if (dados.desafio) setDesafio(dados.desafio);
    if (dados.resultadosEsperados) setResultadosEsperados(dados.resultadosEsperados);
    if (dados.criteriosQualidade) setCriteriosQualidade(dados.criteriosQualidade);
  };

  const adicionarLinhaAula = () => {
    setPlanosAula([
      ...planosAula,
      { numAulas: '4', conhecimentos: '', capacidades: '', estrategias: '', recursos: '', instrumentos: '' }
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

  return {
    router,
    chatBottomRef,
    listaCursos,
    ucsDisponiveis,
    carregando,
    cursoSelecionado,
    modalidade,
    ucSelecionada,
    ucCargaHoraria,
    modulo,
    docente,
    numAulas,
    numSa,
    objetivoGeral,
    competencias,
    capacidadesTecnicas,
    capacidadesBasicas,
    capacidadesSocioemocionais,
    tipoSituacao,
    contextualizacao,
    desafio,
    resultadosEsperados,
    criteriosQualidade,
    chatAberto,
    mensagensChat,
    inputChat,
    enviandoChat,
    planosAula,
    setModalidade,
    setModulo,
    setUcCargaHoraria,
    setDocente,
    setNumAulas,
    setNumSa,
    setObjetivoGeral,
    setCompetencias,
    setCapacidadesTecnicas,
    setCapacidadesBasicas,
    setCapacidadesSocioemocionais,
    setTipoSituacao,
    setContextualizacao,
    setDesafio,
    setResultadosEsperados,
    setCriteriosQualidade,
    setChatAberto,
    setInputChat,
    aoMudarCurso,
    aoMudarUC,
    enviarMensagemGemini,
    aplicarDadosNoFormulario,
    adicionarLinhaAula,
    atualizarLinhaAula,
    removerLinhaAula,
    salvarPEUC
  };
}
