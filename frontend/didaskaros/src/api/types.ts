export type Turno = "MANHA" | "TARDE" | "NOITE";
export type StatusGrade = "RASCUNHO" | "PUBLICADA" | "ARQUIVADA";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  nivelAcesso: string;
  unidade: string;
}

export interface Disciplina {
  id: number;
  nome: string;
  sigla: string;
  exigeLaboratorio: boolean;
}

export interface Sala {
  id: number;
  nome: string;
  tipo: "SALA" | "LABORATORIO";
  capacidade: number;
}

export interface Slot {
  turno: Turno;
  dia: number;
  ordem: number;
}

export interface Professor {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  pontuacaoCps: number;
  contrato: "INDETERMINADO" | "DETERMINADO";
  disciplinaIds: number[];
  indisponibilidades: Slot[];
  preferencias: (Slot & { tipo: "PREFERE" | "EVITAR" })[];
  compromissosExternos: CompromissoExterno[];
}

/** horario q o professor trabalha fora daqui */
export interface CompromissoExterno {
  dia: number;
  inicio: string; // "HH:MM"
  fim: string;
  descricao: string;
}

export interface Carga {
  disciplinaId: number;
  aulasSemanais: number;
  professorId: number | null;
}

export interface Turma {
  id: number;
  codigo: string;
  curso: string;
  turno: Turno;
  qtdAlunos: number;
  cargas: Carga[];
}

export interface Aula {
  turmaId: number;
  disciplinaId: number;
  professorId: number;
  salaId: number;
  dia: number;
  ordem: number;
}

export interface Violacao {
  regra: string;
  mensagem: string;
}

export interface GradeResumo {
  id: number;
  turno: Turno;
  ano: number;
  semestre: number;
  status: StatusGrade;
  aulasPorDia: number;
  criadoEm: string;
  modelo: string | null;
  totalAulas: number;
  totalTurmas: number;
  conflitos: number;
}

export interface GradeDetalhe {
  id: number;
  turno: Turno;
  ano: number;
  semestre: number;
  status: StatusGrade;
  aulasPorDia: number;
  restricoes: string[];
  observacoes: string | null;
  violacoes: Violacao[];
  modelo: string | null;
  tentativas: number | null;
  criadoEm: string;
  horarios: string[];
  intervalos: { inicio: string; fim: string }[];
  metricas: { janelasTurmas: number; janelasProfessores: number };
  aulas: Aula[];
  turmas: { id: number; codigo: string; curso: string }[];
  disciplinas: { id: number; nome: string; sigla: string }[];
  professores: { id: number; nome: string }[];
  salas: { id: number; nome: string }[];
}

export interface JobGeracao {
  id: string;
  status: "executando" | "concluido" | "erro";
  etapa: string;
  tentativa: number;
  segundos: number;
  gradeId?: number;
  resposta?: string;
  erro?: string;
}

/** o q ta faltando ou inconsistente nos cadastros de um turno */
export interface Diagnostico {
  problemas: string[]; // impedem de gerar
  avisos: string[];    // nao impedem mas vale dar uma olhada
}

export interface MensagemAjuste {
  papel: "coordenador" | "ia";
  texto: string;
}

export interface Painel {
  totais: {
    professores: number;
    turmas: number;
    disciplinas: number;
    salas: number;
    grades: number;
    publicadas: number;
    rascunhos: number;
    conflitos: number;
  };
  aulasHoje: { horario: string; ordem: number; turma: string; disciplina: string; professor: string; sala: string }[];
  gradesRecentes: (Omit<GradeResumo, "totalAulas" | "totalTurmas" | "modelo">)[];
  professores: { id: number; nome: string; disciplinas: string | null; aulasSemana: number }[];
}
