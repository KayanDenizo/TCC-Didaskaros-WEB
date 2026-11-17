import { DIAS, REGRAS_CPS, hhmm, intervaloAula, type Aula, type DadosGeracao, type Violacao } from "./tipos.js";

type Registrar = (regra: string, mensagem: string, ...aulas: number[]) => void;

/**
 * confere a grade sem depender da IA e lista toda restricao dura q foi quebrada.
 * se passar `porAula`, anota nele quais aulas (pelo indice em `aulas`) estao em cada problema,
 * pra tela de edicao marcar os cards com conflito
 */
export function validarGrade(dados: DadosGeracao, aulas: Aula[], porAula?: Map<number, string[]>): Violacao[] {
  const v: Violacao[] = [];
  const add: Registrar = (regra, mensagem, ...indices) => {
    v.push({ regra, mensagem });
    if (porAula) for (const i of new Set(indices)) porAula.set(i, [...(porAula.get(i) ?? []), mensagem]);
  };

  const turmas = new Map(dados.turmas.map((t) => [t.id, t]));
  const disciplinas = new Map(dados.disciplinas.map((d) => [d.id, d]));
  const professores = new Map(dados.professores.map((p) => [p.id, p]));
  const salas = new Map(dados.salas.map((s) => [s.id, s]));
  const quando = (a: Aula) => `${DIAS[a.dia] ?? `dia ${a.dia}`}, ${a.ordem + 1}ª aula`;

  // turma/professor/sala@horario -> indice da primeira aula q ocupou
  const ocupado = { turma: new Map<string, number>(), professor: new Map<string, number>(), sala: new Map<string, number>() };
  const contagem = new Map<string, number>();            // turma:disciplina -> qtd de aulas alocadas
  const professorDaDisciplina = new Map<string, number>(); // turma:disciplina -> professor

  for (const [i, a] of aulas.entries()) {
    const turma = turmas.get(a.turmaId);
    const disc = disciplinas.get(a.disciplinaId);
    const prof = professores.get(a.professorId);
    const sala = salas.get(a.salaId);

    if (!turma || !disc || !prof || !sala) {
      add("referencia", `Aula com turma/disciplina/professor/sala inexistente (${JSON.stringify(a)}).`, i);
      continue;
    }
    if (a.dia < 0 || a.dia > 4 || a.ordem < 0 || a.ordem >= dados.aulasPorDia) {
      add("horario", `${turma.codigo}: ${disc.nome} fora da grade de horários (dia ${a.dia}, ordem ${a.ordem}).`, i);
      continue;
    }

    const carga = turma.cargas.find((c) => c.disciplinaId === a.disciplinaId);
    if (!carga) add("carga", `${turma.codigo} não tem ${disc.nome} na carga horária.`, i);
    if (!prof.disciplinaIds.includes(a.disciplinaId)) {
      add("habilitacao", `${prof.nome} não é habilitado(a) para ${disc.nome} (${turma.codigo}, ${quando(a)}).`, i);
    }
    if (carga?.professorId && carga.professorId !== a.professorId) {
      add("atribuicao", `${disc.nome} da ${turma.codigo} é atribuída a ${professores.get(carga.professorId)?.nome}, não a ${prof.nome}.`, i);
    }

    const chaveDisc = `${a.turmaId}:${a.disciplinaId}`;
    contagem.set(chaveDisc, (contagem.get(chaveDisc) ?? 0) + 1);
    const profAnterior = professorDaDisciplina.get(chaveDisc);
    if (profAnterior === undefined) professorDaDisciplina.set(chaveDisc, a.professorId);
    else if (profAnterior !== a.professorId) {
      add("professor-unico", `${disc.nome} da ${turma.codigo} está dividida entre mais de um professor.`, i);
    }

    const slot = `${a.dia}:${a.ordem}`;
    const conflito = (tipo: keyof typeof ocupado, id: number, msg: (outra: Aula) => string) => {
      const chave = `${id}@${slot}`;
      const outra = ocupado[tipo].get(chave);
      if (outra !== undefined) add(`conflito-${tipo}`, msg(aulas[outra]), i, outra);
      else ocupado[tipo].set(chave, i);
    };
    conflito("turma", a.turmaId, () => `${turma.codigo} tem duas aulas ao mesmo tempo (${quando(a)}).`);
    conflito("professor", a.professorId, (o) =>
      `${prof.nome} está em ${turma.codigo} e ${turmas.get(o.turmaId)?.codigo} ao mesmo tempo (${quando(a)}).`);
    conflito("sala", a.salaId, (o) =>
      `${sala.nome} recebe ${turma.codigo} e ${turmas.get(o.turmaId)?.codigo} ao mesmo tempo (${quando(a)}).`);

    if (prof.indisponiveis.some((x) => x.dia === a.dia && x.ordem === a.ordem)) {
      add("indisponibilidade", `${prof.nome} está indisponível em ${quando(a)} (${turma.codigo}).`, i);
    }
    if (disc.exigeLaboratorio && sala.tipo !== "LABORATORIO") {
      add("laboratorio", `${disc.nome} exige laboratório, mas foi para ${sala.nome} (${turma.codigo}, ${quando(a)}).`, i);
    }
    if (sala.capacidade < turma.qtdAlunos) {
      add("capacidade", `${sala.nome} (${sala.capacidade} lugares) não comporta a ${turma.codigo} (${turma.qtdAlunos} alunos).`, i);
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

  validarJornada(dados, aulas.flatMap((a, indice) => (professores.has(a.professorId) && a.dia >= 0 && a.dia <= 4 ? [{ ...a, indice }] : [])), add);
  return v;
}

// jornada do CPS (choque de horario, 8h/dia, refeicao, interjornada e limite semanal),
// contando tb as aulas dos outros turnos e das outras unidades
function validarJornada(dados: DadosGeracao, aulas: (Aula & { indice: number })[], add: Registrar) {
  const R = REGRAS_CPS;
  for (const prof of dados.professores) {
    const minhas = aulas.filter((a) => a.professorId === prof.id);
    if (!minhas.length) continue;

    const totalSemana = minhas.length + prof.aulasEmOutrosTurnos;
    if (totalSemana > R.aulasSemanaisMax) {
      add("limite-semanal", `${prof.nome} ficou com ${totalSemana} aulas na semana (máximo ${R.aulasSemanaisMax}).`);
    }

    // o q o professor trabalha em cada dia: aulas dessa grade + ocupacoes q ja existiam (indice -1)
    const dias = Array.from({ length: 5 }, (_, dia) => [
      ...minhas.filter((a) => a.dia === dia).map((a) => ({
        ...intervaloAula(dados.turno, a.ordem), minutosContados: R.minutosPorAula, origem: "", ordem: a.ordem, indice: a.indice,
      })),
      ...prof.ocupacoes.filter((o) => o.dia === dia).map((o) => ({ ...o, ordem: -1, indice: -1 })),
    ].sort((x, y) => x.inicio - y.inicio));
    const aulasDoDia = (periodos: { indice: number }[]) => periodos.flatMap((p) => (p.indice >= 0 ? [p.indice] : []));

    for (const [dia, periodos] of dias.entries()) {
      if (!periodos.length) continue;
      const nomeDia = DIAS[dia];

      for (const a of periodos.filter((p) => p.ordem >= 0)) {
        const choque = periodos.find((o) => o.ordem < 0 && o.inicio < a.fim && a.inicio < o.fim);
        if (choque) add("compromisso-externo", `${prof.nome} tem ${choque.origem} (${hhmm(choque.inicio)}–${hhmm(choque.fim)}) na ${nomeDia}, mas recebeu a ${a.ordem + 1}ª aula.`, a.indice);
      }

      const contados = periodos.reduce((s, p) => s + p.minutosContados, 0);
      if (contados > R.jornadaDiariaMaxMin) {
        add("jornada-diaria", `${prof.nome} trabalha ${(contados / 60).toFixed(1).replace(".0", "")}h na ${nomeDia} (máximo ${R.jornadaDiariaMaxMin / 60}h).`, ...aulasDoDia(periodos));
      }

      if (contados > R.jornadaSemRefeicaoMin) {
        let maiorPausa = 0;
        let fim = periodos[0].fim;
        for (const p of periodos.slice(1)) {
          maiorPausa = Math.max(maiorPausa, p.inicio - fim);
          fim = Math.max(fim, p.fim);
        }
        if (maiorPausa < R.refeicaoMin) {
          add("refeicao", `${prof.nome} trabalha mais de ${R.jornadaSemRefeicaoMin / 60}h na ${nomeDia} sem pausa de ${R.refeicaoMin} min para refeição.`, ...aulasDoDia(periodos));
        }
      }

      const amanha = dias[dia + 1];
      if (amanha?.length) {
        const fimHoje = Math.max(...periodos.map((p) => p.fim));
        const descanso = 24 * 60 - fimHoje + amanha[0].inicio;
        if (descanso < R.interjornadaMin) {
          const ultima = periodos.find((p) => p.fim === fimHoje)!;
          add("interjornada", `${prof.nome} termina às ${hhmm(fimHoje)} na ${nomeDia} e volta às ${hhmm(amanha[0].inicio)} na ${DIAS[dia + 1]}: ` +
            `${hhmm(descanso)} de descanso (mínimo ${R.interjornadaMin / 60}h).`, ...aulasDoDia([ultima, amanha[0]]));
        }
      }
    }
  }
}

// o q impede de gerar antes de chamar a IA (tipo turma com mais aula do q horario)
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

  for (const p of dados.professores) {
    const atribuidas = dados.turmas.flatMap((t) => t.cargas).filter((c) => c.professorId === p.id).reduce((s, c) => s + c.aulasSemanais, 0);
    const total = atribuidas + p.aulasEmOutrosTurnos;
    if (atribuidas && total > REGRAS_CPS.aulasSemanaisMax) {
      erros.push(`${p.nome} tem ${total} aulas atribuídas na semana somando todos os turnos (máximo ${REGRAS_CPS.aulasSemanaisMax}).`);
    }
  }
  return [...new Set(erros)];
}

/** metricas de qualidade (restricoes moles): quantas janelas sobraram na grade */
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
