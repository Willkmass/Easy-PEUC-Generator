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

  // Objetivos e Competências
  const [objetivoGeral, setObjetivoGeral] = useState('');
  const [competencias, setCompetencias] = useState('');

  // Lista unificada de capacidades do PCA para seleção pelo usuário
  const [capacidadesDisponiveis, setCapacidadesDisponiveis] = useState<string[]>([]);

  // Campos de Texto Editáveis no Formulário
  const [capacidadesTecnicas, setCapacidadesTecnicas] = useState('');
  const [capacidadesBasicas, setCapacidadesBasicas] = useState('');
  const [capacidadesSocioemocionais, setCapacidadesSocioemocionais] = useState('');

  // Situação de Aprendizagem
  const [tipoSituacao, setTipoSituacao] = useState('Situação-Problema');
  const [contextualizacao, setContextualizacao] = useState('');
  const [desafio, setDesafio] = useState('');
  const [resultadosEsperados, setResultadosEsperados] = useState('');
  const [criteriosQualidade, setCriteriosQualidade] = useState('');

  // Estados de Carregamento e Gemini IA
  const [gerandoSocioemocionais, setGerandoSocioemocionais] = useState(false);
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

  // Formatador universal de dados para texto legível
  const formatarTexto = (val: any): string => {
    if (!val) return '';
    if (Array.isArray(val)) {
      return val
        .map((item) => {
          if (typeof item === 'string') return item.trim();
          if (typeof item === 'object' && item !== null) {
            return (item.descricao || item.nome || item.titulo || item.texto || item.capacidade || JSON.stringify(item)).trim();
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

  // Coleta TODAS as capacidades da UC em uma única lista
  const extrairListaUnicaCapacidades = (ucObjeto: any): string[] => {
    if (!ucObjeto) return [];

    const listaBruta: string[] = [];

    const extrair = (fonte: any) => {
      if (!fonte) return;
      if (Array.isArray(fonte)) {
        fonte.forEach((item) => {
          if (typeof item === 'string' && item.trim()) {
            listaBruta.push(item.trim());
          } else if (typeof item === 'object' && item !== null) {
            const txt = item.descricao || item.nome || item.titulo || item.texto || item.capacidade || item.elemento;
            if (txt) listaBruta.push(String(txt).trim());
          }
        });
      } else if (typeof fonte === 'string') {
        fonte.split(/\n|;/).forEach((s) => {
          if (s.trim()) listaBruta.push(s.trim());
        });
      }
    };

    extrair(ucObjeto.capacidades);
    extrair(ucObjeto.capacidades_tecnicas);
    extrair(ucObjeto.capacidades_basicas);
    extrair(ucObjeto.listaCapacidades);
    extrair(ucObjeto.habilidades);
    extrair(ucObjeto.conhecimentos);
    extrair(ucObjeto.elementos);

    if (typeof ucObjeto.capacidades === 'object' && ucObjeto.capacidades !== null && !Array.isArray(ucObjeto.capacidades)) {
      extrair(ucObjeto.capacidades.tecnicas);
      extrair(ucObjeto.capacidades.basicas);
      extrair(ucObjeto.capacidades.socioemocionais);
      extrair(ucObjeto.capacidades.gerais);
      extrair(ucObjeto.capacidades.itens);
    }

    return Array.from(new Set(listaBruta));
  };

  // Insere o item selecionado na caixa escolhida (Técnicas ou Básicas)
  const adicionarCapacidadeAoCampo = (capacidade: string, destino: 'tecnica' | 'basica') => {
    if (!capacidade) return;

    if (destino === 'tecnica') {
      setCapacidadesTecnicas((prev) => (prev ? `${prev}\n• ${capacidade}` : `• ${capacidade}`));
    } else {
      setCapacidadesBasicas((prev) => (prev ? `${prev}\n• ${capacidade}` : `• ${capacidade}`));
    }
  };

  // PREENCHIMENTO AUTOMÁTICO COM DEBOUNCE
  useEffect(() => {
    if ((!contextualizacao && !desafio) || gerandoSocioemocionais) return;

    const timer = setTimeout(async () => {
      setGerandoSocioemocionais(true);
      try {
        const res = await fetch('/api/gerar-socioemocionais', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            curso: cursoSelecionado,
            uc: ucSelecionada,
            tipoSituacao,
            contextualizacao,
            desafio,
          }),
        });

        const data = await res.json();
        if (res.ok && data.sugestoes) {
          setCapacidadesSocioemocionais((prev) => (prev.trim() === '' ? data.sugestoes : prev));
        }
      } catch (err) {
        console.error('Erro ao sugerir capacidades socioemocionais via IA:', err);
      } finally {
        setGerandoSocioemocionais(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [contextualizacao, desafio, cursoSelecionado, ucSelecionada, tipoSituacao]);

  const aplicarUC = (uc: any) => {
    setUcSelecionada(uc.nomeUc || uc.nome_uc || uc.nome || uc.unidade || uc.titulo || '');
    setUcCargaHoraria(uc.cargaHoraria || uc.carga_horaria || uc.ch || uc.horas || '');
    setModulo(uc.modulo || uc.modulo_nome || '');

    setObjetivoGeral(formatarTexto(uc.objetivo_geral || uc.objetivo || uc.capacidades?.objetivo || uc.conhecimentos));
    setCompetencias(formatarTexto(uc.competencias || uc.competencia || uc.capacidades?.competencia));

    const listaExtraida = extrairListaUnicaCapacidades(uc);
    setCapacidadesDisponiveis(listaExtraida);
  };

  const limparUC = () => {
    setUcSelecionada('');
    setUcCargaHoraria('');
    setModulo('');
    setCapacidadesDisponiveis([]);
    setCapacidadesTecnicas('');
    setCapacidadesBasicas('');
    setCapacidadesSocioemocionais('');
    setObjetivoGeral('');
    setCompetencias('');
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

  // CARREGAMENTO ALFA: Prioriza o LocalStorage totalmente offline e sem erros 404
  const carregarDadosCursosEUCs = async () => {
    setCarregando(true);
    let cursosEncontrados: any[] = [];

    try {
      const chavesRelevantes = ['cursos_peuc', 'pcas_salvos', 'cursos', 'pcas'];
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
          } catch (e) {
            console.warn(`Erro ao processar JSON da chave ${chave}:`, e);
          }
        }
      });

      if (cursosEncontrados.length === 0) {
        const { data: cursosDb } = await supabase.from('cursos').select('*');
        if (cursosDb && cursosDb.length > 0) {
          cursosEncontrados = cursosDb;
        }
      }
    } catch (err) {
      console.error('Erro ao ler dados:', err);
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
      tipoSituacao,
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
      console.warn('Erro ao salvar no Supabase, mantido no localStorage.');
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
    capacidadesDisponiveis,
    capacidadesTecnicas,
    capacidadesBasicas,
    capacidadesSocioemocionais,
    tipoSituacao,
    contextualizacao,
    desafio,
    resultadosEsperados,
    criteriosQualidade,
    gerandoSocioemocionais,
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
    adicionarCapacidadeAoCampo,
    enviarMensagemGemini,
    aplicarDadosNoFormulario,
    adicionarLinhaAula,
    atualizarLinhaAula,
    removerLinhaAula,
    salvarPEUC
  };
}
