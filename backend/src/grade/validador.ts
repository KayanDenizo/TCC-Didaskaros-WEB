import { DIAS, type Aula, type DadosGeracao, type Violacao } from "./tipos.js";

/**
 * Validador independente da IA: recebe uma grade pronta e aponta toda violação
 * de restrição dura. Escrito separado do gerador de propósito — é ele que garante
 * que "zero conflitos" é verdade, e não uma afirmação do modelo.
 */
export function validarGrade(dados: DadosGeracao, aulas: Aula[]): Violacao[] {
  const v: Violacao[] = [];
  const add = (regra: string, mensagem: string) => v.push({ regra, mensagem });

  const turmas = new Map(dados.turmas.map((t) => [t.id, t]));
  const disciplinas = new Map(dados.disciplinas.map((d) => [d.id, d]));
  const professores = new Map(dados.professores.map((p) => [p.id, p]));
  const salas = new Map(dados.salas.map((s) => [s.id, s]));
  const quando = (a: Aula) => `${DIAS[a.dia] ?? `dia ${a.dia}`}, ${a.ordem + 1}ª aula`;

  const ocupado = { turma: new Map<string, Aula>(), professor: new Map<string, Aula>(), sala: new Map<string, Aula>() };
  const contagem = new Map<string, number>();            // turma:disciplina → aulas alocadas
  const professorDaDisciplina = new Map<string, number>(); // turma:disciplina → professor

  for (const a of aulas) {
    const turma = turmas.get(a.turmaId);
    const disc = disciplinas.get(a.disciplinaId);
    const prof = professores.get(a.professorId);
    const sala = salas.get(a.salaId);

    if (!turma || !disc || !prof || !sala) {
      add("referencia", `Aula com turma/disciplina/professor/sala inexistente (${JSON.stringify(a)}).`);
      continue;
    }
    if (a.dia < 0 || a.dia > 4 || a.ordem < 0 || a.ordem >= dados.aulasPorDia) {
      add("horario", `${turma.codigo}: ${disc.nome} fora da grade de horários (dia ${a.dia}, ordem ${a.ordem}).`);
      continue;
    }

    const carga = turma.cargas.find((c) => c.disciplinaId === a.disciplinaId);
    if (!carga) add("carga", `${turma.codigo} não tem ${disc.nome} na carga horária.`);
    if (!prof.disciplinaIds.includes(a.disciplinaId)) {
      add("habilitacao", `${prof.nome} não é habilitado(a) para ${disc.nome} (${turma.codigo}, ${quando(a)}).`);
    }
    if (carga?.professorId && carga.professorId !== a.professorId) {
      add("atribuicao", `${disc.nome} da ${turma.codigo} é atribuída a ${professores.get(carga.professorId)?.nome}, não a ${prof.nome}.`);
    }

    const chaveDisc = `${a.turmaId}:${a.disciplinaId}`;
    contagem.set(chaveDisc, (contagem.get(chaveDisc) ?? 0) + 1);
    const profAnterior = professorDaDisciplina.get(chaveDisc);
    if (profAnterior === undefined) professorDaDisciplina.set(chaveDisc, a.professorId);
    else if (profAnterior !== a.professorId) {
      add("professor-unico", `${disc.nome} da ${turma.codigo} está dividida entre mais de um professor.`);
    }

    const slot = `${a.dia}:${a.ordem}`;
    const conflito = (tipo: keyof typeof ocupado, id: number, msg: (outra: Aula) => string) => {
      const chave = `${id}@${slot}`;
      const outra = ocupado[tipo].get(chave);
      if (outra) add(`conflito-${tipo}`, msg(outra));
      else ocupado[tipo].set(chave, a);
    };
    conflito("turma", a.turmaId, () => `${turma.codigo} tem duas aulas ao mesmo tempo (${quando(a)}).`);
    conflito("professor", a.professorId, (o) =>
      `${prof.nome} está em ${turma.codigo} e ${turmas.get(o.turmaId)?.codigo} ao mesmo tempo (${quando(a)}).`);
    conflito("sala", a.salaId, (o) =>
      `${sala.nome} recebe ${turma.codigo} e ${turmas.get(o.turmaId)?.codigo} ao mesmo tempo (${quando(a)}).`);

    if (prof.indisponiveis.some((i) => i.dia === a.dia && i.ordem === a.ordem)) {
      add("indisponibilidade", `${prof.nome} está indisponível em ${quando(a)} (${turma.codigo}).`);
    }
    if (disc.exigeLaboratorio && sala.tipo !== "LABORATORIO") {
      add("laboratorio", `${disc.nome} exige laboratório, mas foi para ${sala.nome} (${turma.codigo}, ${quando(a)}).`);
    }
    if (sala.capacidade < turma.qtdAlunos) {
      add("capacidade", `${sala.nome} (${sala.capacidade} lugares) não comporta a ${turma.codigo} (${turma.qtdAlunos} alunos).`);
    }
  }

  for (const turma of dados.turmas) {
    for (const c of turma.cargas) {
      const alocadas = contagem.get(`${turma.id}:${c.disciplinaId}`) ?? 0;
      if (alocadas !== c.aulasSemanais) {
        const nome = disciplinas.get(c.disciplinaId)?.nome;
        add("carga", `${turma.codigo}: ${nome} precisa de ${c.aulasSemanais} aulas semanais e recebeu ${alocadas}.`);
      }
    }
  }

  return v;
}

/**
 * Problemas que tornam a grade impossível antes mesmo de chamar a IA
 * (ex.: turma com mais aulas do que horários disponíveis).
 */
export function verificarViabilidade(dados: DadosGeracao): string[] {
  const erros: string[] = [];
  const slots = 5 * dados.aulasPorDia;
  const temLab = dados.salas.some((s) => s.tipo === "LABORATORIO");

  if (!dados.turmas.length) erros.push("Não há turmas cadastradas neste turno.");
  if (!dados.salas.length) erros.push("Não há salas cadastradas.");

  for (const t of dados.turmas) {
    const total = t.cargas.reduce((s, c) => s + c.aulasSemanais, 0);
    if (!t.cargas.length) erros.push(`${t.codigo} não tem carga horária cadastrada.`);
    if (total > slots) erros.push(`${t.codigo} tem ${total} aulas semanais, mas o turno só tem ${slots} horários.`);
    if (!dados.salas.some((s) => s.capacidade >= t.qtdAlunos)) {
      erros.push(`Nenhuma sala comporta os ${t.qtdAlunos} alunos da ${t.codigo}.`);
    }
    for (const c of t.cargas) {
      const disc = dados.disciplinas.find((d) => d.id === c.disciplinaId);
      if (!c.professorId && !dados.professores.some((p) => p.disciplinaIds.includes(c.disciplinaId))) {
        erros.push(`Nenhum professor habilitado para ${disc?.nome} (${t.codigo}).`);
      }
      if (disc?.exigeLaboratorio && !temLab) erros.push(`${disc.nome} exige laboratório, mas não há laboratório cadastrado.`);
    }
  }
  return [...new Set(erros)];
}

/** Métricas de qualidade (restrições moles): quantas janelas ficaram na grade. */
export function metricas(aulas: Aula[]) {
  const janelas = (chave: (a: Aula) => number) => {
    const porDia = new Map<string, number[]>();
    for (const a of aulas) {
      const k = `${chave(a)}:${a.dia}`;
      porDia.set(k, [...(porDia.get(k) ?? []), a.ordem]);
    }
    let total = 0;
    for (const ordens of porDia.values()) {
      const unicas = new Set(ordens);
      total += Math.max(...unicas) - Math.min(...unicas) + 1 - unicas.size;
    }
    return total;
  };
  return { janelasTurmas: janelas((a) => a.turmaId), janelasProfessores: janelas((a) => a.professorId) };
}
