export type Turno = "MANHA" | "TARDE" | "NOITE";

/** uma aula alocada: turma x disciplina x professor x sala em um horario da semana */
export interface Aula {
  turmaId: number;
  disciplinaId: number;
  professorId: number;
  salaId: number;
  dia: number;   // 0 = segunda ... 4 = sexta
  ordem: number; // 0 = primeira aula do turno
}

/**
 * horario em q o professor ja ta trabalhando fora da grade q ta sendo gerada,
 * ou seja aula em outro turno daqui ou compromisso em outra unidade.
 * horarios em minutos desde 00:00
 */
export interface Ocupacao {
  dia: number;
  inicio: number;
  fim: number;
  minutosContados: number; // quanto conta na jornada do dia (hora-aula conta como 60 min)
  origem: string;          // tipo "aula no turno da noite", "ETEC Vila Nova"
}

export interface Slot {
  dia: number;
  ordem: number;
}

/** tudo q a geracao precisa saber de um turno da unidade */
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
 * regras de jornada do professor no CPS.
 * tirei de: Deliberacao CEETEPS 23/2015, Portaria CETEC 1.263/2017 e dos memorandos de
 * atribuicao de aulas das ETECs (interjornada de 11h, 1h de refeicao, max 8h por dia)
 */
export const REGRAS_CPS = {
  interjornadaMin: 11 * 60,
  refeicaoMin: 60,
  /** passou disso a pausa pra refeicao vira obrigatoria (CLT, art. 71) */
  jornadaSemRefeicaoMin: 6 * 60,
  jornadaDiariaMaxMin: 8 * 60,
  /** a hora-aula de 50 ou 45 min conta como 60 min, inclusive no pagamento (LC 1.044/2008, art. 20) */
  minutosPorAula: 60,
  /**
   * 40h por semana com 30% de hora-atividade, sobra mais ou menos 30 aulas.
   * achei esse numero em fonte secundaria, tem q confirmar com a escola
   */
  aulasSemanaisMax: 30,
};

const INICIO: Record<Turno, number> = { MANHA: 7 * 60 + 30, TARDE: 13 * 60, NOITE: 19 * 60 };
/** hora-aula: 50 min de dia, 45 min a noite */
const DURACAO: Record<Turno, number> = { MANHA: 50, TARDE: 50, NOITE: 45 };
const INTERVALO = { depoisDaAula: 3, minutos: 10 };

/** inicio e fim de uma aula do turno (em minutos desde 00:00) */
export function intervaloAula(turno: Turno, ordem: number) {
  const inicio = INICIO[turno] + ordem * DURACAO[turno] + (ordem >= INTERVALO.depoisDaAula ? INTERVALO.minutos : 0);
  return { inicio, fim: inicio + DURACAO[turno] };
}

export const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** horario q cada aula do turno comeca, tipo ["07:30", "08:20", ...] */
export function horarios(turno: Turno, aulasPorDia: number): string[] {
  return Array.from({ length: aulasPorDia }, (_, i) => hhmm(intervaloAula(turno, i).inicio));
}
