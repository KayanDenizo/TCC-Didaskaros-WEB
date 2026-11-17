import type { Aula } from "../api/types";

/** qual quadro o coordenador ta vendo: o de uma turma, de um professor ou de uma sala */
export type Agrupar = "turmaId" | "professorId" | "salaId";

/**
 * move a aula `indice` pro horario (dia, ordem). se o quadro ja tem uma aula ali
 * (mesma turma, professor ou sala, conforme `agrupar`) as duas trocam de lugar.
 * o backend faz a mesma conta em grade/edicao.ts pra simular os destinos, tem q ficar igual
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

/**
 * indices das aulas da grade editada q nao existiam assim na original.
 * compara a aula inteira (turma, disciplina, professor, sala e horario), entao trocar duas aulas
 * iguais de lugar (tipo duas de Matematica geminadas) nao conta como mudanca, igual no backend
 */
export function aulasMovidas(original: Aula[], editada: Aula[]): Set<number> {
  const chave = (a: Aula) => `${a.turmaId}:${a.disciplinaId}:${a.professorId}:${a.salaId}:${a.dia}:${a.ordem}`;
  const sobrando = new Map<string, number>();
  for (const a of original) sobrando.set(chave(a), (sobrando.get(chave(a)) ?? 0) + 1);
  const movidas = new Set<number>();
  editada.forEach((a, i) => {
    const n = sobrando.get(chave(a)) ?? 0;
    if (n > 0) sobrando.set(chave(a), n - 1);
    else movidas.add(i);
  });
  return movidas;
}
