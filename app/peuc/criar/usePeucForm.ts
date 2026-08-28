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

  // Converter qualquer tipo de dado (Array, Objeto, String) para String formatada
  const formatarTexto = (val: any): string => {
    if (!val) return '';
    if (Array.isArray(val)) {
      return val
        .map((item) => {
          if (typeof item === 'string') return item.trim();
          if (typeof item === 'object' && item !== null) {
            return (item.descricao || item.nome || item.titulo || item.texto || JSON.stringify(item)).trim();
          }
          return String(item).trim();
        })
        .filter(Boolean)
        .join('\n');
    }
    if (typeof val === 'object') {
      return (val.descricao || val.nome || val.titulo || JSON.stringify(val, null, 2)).trim();
    }
    return String(val).trim();
  };

  // Extrai lista universal independente do nome da chave ou estrutura
  const extrairCapacidadesDaUC = (ucObjeto: any) => {
    if (!ucObjeto) return;

    const extrairLinhas = (fonte: any): string[] => {
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
          .filter((s) => s.length > 0);
      }
      if (typeof fonte === 'string') {
        return fonte
          .split(/\n|;/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
      }
      return [];
    };

    const caps = ucObjeto.capacidades || {};

    // 1. Busca ampla por todos os nomes possíveis de chaves
    let tecnicas = extrairLinhas(
      caps.tecnicas ||
      ucObjeto.capacidades_tecnicas ||
      ucObjeto.capacidadesTecnicas ||
      ucObjeto.tecnicas
    );

    let basicas = extrairLinhas(
      caps.basicas ||
      ucObjeto.capacidades_basicas ||
      ucObjeto.capacidadesBasicas ||
      ucObjeto.basicas
    );

    let socio = extrairLinhas(
      caps.socioemocionais ||
      ucObjeto.capacidades_socioemocionais ||
      ucObjeto.capacidadesSocioemocionais ||
      ucObjeto.socioemocionais ||
      ucObjeto.socio_emocionais
    );

    // 2. Se a UC só tiver uma lista genérica 'capacidades' ou 'listaCapacidades'
    if (tecnicas.length === 0 && basicas.length === 0 && socio.length === 0) {
      const listaUnica = extrairLinhas(ucObjeto.capacidades || ucObjeto.listaCapacidades);
      
      // Triagem por inteligência de palavras-chave caso venham juntas em uma lista só
      listaUnica.forEach((cap) => {
        const cLower = cap.toLowerCase();
        if (
          cLower.includes('equipe') ||
          cLower.includes('comunicação') ||
          cLower.includes('ética') ||
          cLower.includes('proatividade') ||
          cLower.includes('relacionamento') ||
          cLower.includes('autonomia') ||
          cLower.includes('liderança') ||
          cLower.includes('atitude')
        ) {
          socio.push(cap);
        } else if (
          cLower.includes('interpretar') ||
          cLower.includes('calcular') ||
          cLower.includes('fundamento') ||
          cLower.includes('conceito') ||
          cLower.includes('leitura') ||
          cLower.includes('reconhecer')
        ) {
          basicas.push(cap);
        } else {
          tecnicas.push(cap);
        }
      });
    }

    setCapacidadesTecnicas(tecnicas.join('\n'));
    setCapacidadesBasicas(basicas.join('\n'));
    setCapacidadesSocioemocionais(socio.join('\n'));
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

    // Chama a função isolada e corrigida de extração
    extrairCapacidadesDaUC(uc);
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
