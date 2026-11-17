import { DIAS, horarios, type Aula, type DadosGeracao } from "./tipos.js";
import { validarGrade } from "./validador.js";

// edicao manual da grade (arrastar e soltar na tela): o coordenador muda aulas de horario
// e o validador confere tudo de novo, sem a IA

/** qual quadro o coordenador ta vendo: o de uma turma, de um professor ou de uma sala */
export type Agrupar = "turmaId" | "professorId" | "salaId";

/**
 * move a aula `indice` pro horario (dia, ordem). se o quadro ja tem uma aula ali
 * (mesma turma, professor ou sala, conforme `agrupar`) as duas trocam de lugar.
 * o front faz a mesma conta em lib/edicaoGrade.ts, tem q ficar igual
 */
export function moverAula(aulas: Aula[], indice: number, dia: number, ordem: number, agrupar: Agrupar): Aula[] {
  const a = aulas[indice];
  if (!a || (a.dia === dia && a.ordem === ordem)) return aulas;
  const ocupante = aulas.findIndex((x, i) => i !== indice && x[agrupar] === a[agrupar] && x.dia === dia && x.ordem === ordem);
  return aulas.map((x, i) => {
    if (i === indice) return { ...x, dia, ordem };
    if (i === ocupante) return { ...x, dia: a.dia, ordem: a.ordem };
    return x;
  });
}

export interface Destino {
  dia: number;
  ordem: number;
  /** total de conflitos q a grade teria com a aula solta aqui */
  conflitos: number;
  /** conflitos q nao existiam antes de soltar */
  novos: string[];
}

/** pra cada horario da semana: como a grade ficaria se a aula fosse solta ali */
export function simularDestinos(dados: DadosGeracao, aulas: Aula[], indice: number, agrupar: Agrupar) {
  const antes = validarGrade(dados, aulas).map((v) => v.mensagem);
  const origem = aulas[indice];
  const destinos: Destino[] = [];

  for (let dia = 0; dia < 5; dia++) {
    for (let ordem = 0; ordem < dados.aulasPorDia; ordem++) {
      if (!origem || (origem.dia === dia && origem.ordem === ordem)) continue;
      const depois = validarGrade(dados, moverAula(aulas, indice, dia, ordem, agrupar)).map((v) => v.mensagem);
      // tira do "depois" o q ja tinha antes (contando repetidas), sobra o q a mudanca criou
      const restantes = [...antes];
      const novos = depois.filter((m) => {
        const k = restantes.indexOf(m);
        if (k < 0) return true;
        restantes.splice(k, 1);
        return false;
      });
      destinos.push({ dia, ordem, conflitos: depois.length, novos });
    }
  }
  return { conflitosAtuais: antes.length, destinos };
}

/**
 * o q mudou de horario entre a grade salva e a editada, em texto, pra IA e pras observacoes.
 * pareia as aulas pela turma + disciplina + professor + sala (eh o q o arrastar nao muda)
 */
export function descreverMudancas(dados: DadosGeracao, original: Aula[], editada: Aula[]): string[] {
  const hora = horarios(dados.turno, dados.aulasPorDia);
  const quando = (s: { dia: number; ordem: number }) => `${DIAS[s.dia] ?? `dia ${s.dia}`}, ${s.ordem + 1}ª aula (${hora[s.ordem] ?? "?"})`;
  const chave = (a: Aula) => `${a.turmaId}:${a.disciplinaId}:${a.professorId}:${a.salaId}`;
  const grupos = new Map<string, { aula: Aula; antes: Aula[]; depois: Aula[] }>();
  for (const [lado, lista] of [["antes", original], ["depois", editada]] as const) {
    for (const a of lista) {
      const g = grupos.get(chave(a)) ?? { aula: a, antes: [], depois: [] };
      g[lado].push(a);
      grupos.set(chave(a), g);
    }
  }

  const mudancas: string[] = [];
  const mesmoHorario = (x: Aula, y: Aula) => x.dia === y.dia && x.ordem === y.ordem;
  const ordenar = (l: Aula[]) => [...l].sort((x, y) => x.dia - y.dia || x.ordem - y.ordem);
  for (const { aula, antes, depois } of grupos.values()) {
    const sairam = ordenar(antes.filter((x) => !depois.some((y) => mesmoHorario(x, y))));
    const entraram = ordenar(depois.filter((y) => !antes.some((x) => mesmoHorario(x, y))));
    if (!sairam.length && !entraram.length) continue;

    const nome = `${dados.turmas.find((t) => t.id === aula.turmaId)?.codigo ?? "?"} · ` +
      `${dados.disciplinas.find((d) => d.id === aula.disciplinaId)?.nome ?? "?"} ` +
      `(${dados.professores.find((p) => p.id === aula.professorId)?.nome ?? "?"})`;
    for (let i = 0; i < Math.max(sairam.length, entraram.length); i++) {
      const de = sairam[i];
      const para = entraram[i];
      if (de && para) mudancas.push(`${nome}: de ${quando(de)} para ${quando(para)}`);
      else if (de) mudancas.push(`${nome}: saiu de ${quando(de)}`);
      else if (para) mudancas.push(`${nome}: entrou em ${quando(para)}`);
    }
  }
  return mudancas;
}
