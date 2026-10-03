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

/**
 * Período em que o professor já trabalha fora da grade que está sendo gerada:
 * aula em outro turno desta unidade ou compromisso em outra unidade.
 * Horários em minutos desde 00:00.
 */
export interface Ocupacao {
  dia: number;
  inicio: number;
  fim: number;
  minutosContados: number; // quanto conta na jornada diária (hora-aula conta como 60 min)
  origem: string;          // ex.: "aula no turno da noite", "ETEC Vila Nova"
}

export interface Slot {
  dia: number;
  ordem: number;
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
    contrato: "INDETERMINADO" | "DETERMINADO";
    disciplinaIds: number[];
    indisponiveis: Slot[];
    preferidos: Slot[];
    evitar: Slot[];
    ocupacoes: Ocupacao[];
    aulasEmOutrosTurnos: number;
  }[];
  salas: { id: number; nome: string; tipo: "SALA" | "LABORATORIO"; capacidade: number }[];
  preferencias: string[];
}

export interface Violacao {
  regra: string;
  mensagem: string;
}

export const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

/**
 * Regras de jornada do docente no CPS.
 * Fontes: Deliberação CEETEPS 23/2015, Portaria CETEC 1.263/2017 e memorandos de
 * atribuição de aulas das ETECs (interjornada de 11h, 1h de refeição, máximo de 8h/dia).
 */
export const REGRAS_CPS = {
  interjornadaMin: 11 * 60,
  refeicaoMin: 60,
  /** Acima disso a pausa de refeição é obrigatória (CLT, art. 71). */
  jornadaSemRefeicaoMin: 6 * 60,
  jornadaDiariaMaxMin: 8 * 60,
  /** Hora-aula de 50 ou 45 min é paga e contada como 60 min (LC 1.044/2008, art. 20). */
  minutosPorAula: 60,
  /**
   * 40h semanais incluindo 30% de hora-atividade ≈ 30 aulas.
   * Valor de fonte secundária: confirmar com a unidade.
   */
  aulasSemanaisMax: 30,
};

const INICIO: Record<Turno, number> = { MANHA: 7 * 60 + 30, TARDE: 13 * 60, NOITE: 19 * 60 };
/** Hora-aula: 50 min no diurno, 45 min no noturno. */
const DURACAO: Record<Turno, number> = { MANHA: 50, TARDE: 50, NOITE: 45 };
const INTERVALO = { depoisDaAula: 3, minutos: 10 };

/** Início e fim (minutos desde 00:00) de uma aula do turno. */
export function intervaloAula(turno: Turno, ordem: number) {
  const inicio = INICIO[turno] + ordem * DURACAO[turno] + (ordem >= INTERVALO.depoisDaAula ? INTERVALO.minutos : 0);
  return { inicio, fim: inicio + DURACAO[turno] };
}

export const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** Horário de início de cada aula do turno, ex.: ["07:30", "08:20", …]. */
export function horarios(turno: Turno, aulasPorDia: number): string[] {
  return Array.from({ length: aulasPorDia }, (_, i) => hhmm(intervaloAula(turno, i).inicio));
}
