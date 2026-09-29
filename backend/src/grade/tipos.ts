export type Turno = "MANHA" | "TARDE" | "NOITE";

/** Uma aula alocada: turma × disciplina × professor × sala num horário da semana. */
export interface Aula {
  turmaId: number;
  disciplinaId: number;
  professorId: number;
  salaId: number;
  dia: number;   // 0 = segunda … 4 = sexta
  ordem: number; // 0 = primeira aula do turno
}

/** Tudo o que a geração precisa saber sobre um turno da unidade. */
export interface DadosGeracao {
  turno: Turno;
  aulasPorDia: number;
  turmas: {
    id: number;
    codigo: string;
    qtdAlunos: number;
    cargas: { disciplinaId: number; aulasSemanais: number; professorId: number | null }[];
  }[];
  disciplinas: { id: number; nome: string; exigeLaboratorio: boolean }[];
  professores: {
    id: number;
    nome: string;
    pontuacaoCps: number;
    disciplinaIds: number[];
    indisponiveis: { dia: number; ordem: number }[];
  }[];
  salas: { id: number; nome: string; tipo: "SALA" | "LABORATORIO"; capacidade: number }[];
  preferencias: string[];
}

export interface Violacao {
  regra: string;
  mensagem: string;
}

export const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

const INICIO: Record<Turno, number> = { MANHA: 7 * 60 + 30, TARDE: 13 * 60, NOITE: 19 * 60 };
const DURACAO = 50;
const INTERVALO = { depoisDaAula: 3, minutos: 10 };

/** Horário de início de cada aula do turno, ex.: ["07:30", "08:20", …]. */
export function horarios(turno: Turno, aulasPorDia: number): string[] {
  return Array.from({ length: aulasPorDia }, (_, i) => {
    const min = INICIO[turno] + i * DURACAO + (i >= INTERVALO.depoisDaAula ? INTERVALO.minutos : 0);
    return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
  });
}
