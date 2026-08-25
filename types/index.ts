export interface Curso {
  id?: string;
  nome: string;
  categoria: string;
  carga_horaria_total?: string;
  created_at?: string;
}

export interface UnidadeCurricular {
  id?: string;
  curso_id: string;
  numero: number;
  nome: string;
  carga_horaria: number;
  capacidades?: string[];
  conhecimentos?: string[];
}

export interface PEUC {
  id?: string;
  cursoId: string;
  unidadeCurricularId: string;
  docenteId?: string;
  tipoSituacaoAprendizagem: string;
  integraOutraUC: boolean;
  contextualizacao: string;
  desafio: string;
  resultadosEsperados: string;
  capacidadesSelecionadasIds?: string[];
  conhecimentosSelecionadosIds?: string[];
  cronograma?: any[];
  status: string;
}
