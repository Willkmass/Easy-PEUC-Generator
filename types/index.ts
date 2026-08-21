// ==========================================
// 1. ENTIDADES BASE (Do Plano de Curso - PCA)
// ==========================================

export interface Curso {
  id: string;
  nome: string;
  modalidade: "Aprendizagem Industrial" | "Habilitação Técnica" | "Qualificação Profissional" | string;
  eixoTecnologico: string;
  cargaHorariaTotal: number;
  createdAt?: string;
}

export interface UnidadeCurricular {
  id: string;
  cursoId: string; // Vínculo com o Curso
  codigo: string;
  nome: string;
  cargaHoraria: number;
  objetivo?: string;
  versao?: number;
}

export interface Capacidade {
  id: string;
  unidadeCurricularId: string; // Vínculo com a UC
  tipo: "basica" | "tecnica" | "socioemocional" | "gestao";
  descricao: string;
}

export interface Conhecimento {
  id: string;
  unidadeCurricularId: string; // Vínculo com a UC
  descricao: string;
}

// ==========================================
// 2. CADASTROS AUXILIARES PEDAGÓGICOS
// ==========================================

export interface Metodologia {
  id: string;
  nome: string; // ex: Estudo de Caso, Situação-Problema, Projeto Integrador
  descricao?: string;
}

export interface InstrumentoAvaliacao {
  id: string;
  nome: string; // ex: Rubrica, Lista de Checagem, Ficha de Observação
  descricao?: string;
}

export interface CriterioAvaliacao {
  id: string;
  descricao: string;
}

// ==========================================
// 3. ESTRUTURA COMPLETA DA PEUC E SITUAÇÃO DE APRENDIZAGEM (SA)
// ==========================================

export type TipoSituacaoAprendizagem = 
  | "Situacao-Problema" 
  | "Estudo de Caso" 
  | "Pesquisa Aplicada" 
  | "Projeto" 
  | "Projeto Integrador";

export interface CronogramaAula {
  id: string;
  peucId: string;
  numeroAulas: number;
  capacidadesIds: string[]; // Várias capacidades trabalhadas nessa aula
  conhecimentosIds: string[]; // Vários conhecimentos trabalhados nessa aula
  estrategiaEnsino: string; // Descrição da metodologia/atividade prática
  ambientesERecursos: string; // Sala, Lab de Informática, softwares, etc.
  criteriosIds: string[]; // Critérios de avaliação aplicados
  instrumentosIds: string[]; // Instrumentos de avaliação
}

export interface PEUC {
  id: string;
  cursoId: string;
  unidadeCurricularId: string;
  docenteId: string;
  modalidade: string;
  cargaHorariaUC: number;
  
  // Seleções do PCA para esta PEUC
  capacidadesSelecionadasIds: string[];
  conhecimentosSelecionadosIds: string[];

  // Contextualização e Estratégia
  tipoSituacaoAprendizagem: TipoSituacaoAprendizagem;
  integraOutraUC: boolean;
  ucsIntegradasIds?: string[]; // Se houver integração com outras UCs
  
  contextualizacao: string; // O cenário / problema real
  desafio: string; // O que o aluno precisará resolver/fazer
  resultadosEsperados: string; // Entregáveis do aluno

  // Cronograma / Plano de Aulas detalhado
  cronograma: CronogramaAula[];

  status: "rascunho" | "em_revisao" | "aprovado";
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// 4. USUÁRIO E PERMISSÕES
// ==========================================

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: "admin" | "coordenador" | "docente" | "consulta";
  createdAt?: string;
}
