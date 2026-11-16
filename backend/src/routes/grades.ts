import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { exec, select, transaction } from "../db.js";
import { HttpError, idParam, parse } from "../http.js";
import { GeracaoError, ajustarComClaude, gerarComClaude } from "../grade/claude.js";
import { REGRAS_CPS, hhmm, horarios, intervaloAula, type Aula, type DadosGeracao, type Turno } from "../grade/tipos.js";
import { metricas, validarGrade, verificarViabilidade } from "../grade/validador.js";
import { TURNOS } from "./cadastros.js";

const TURNO_NOME: Record<Turno, string> = { MANHA: "manhã", TARDE: "tarde", NOITE: "noite" };
const minutos = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));

// aulas q os professores ja tem nos outros turnos do semestre (pega a grade publicada
// ou, se nao tiver, o rascunho mais novo). usa nas regras de jornada
async function aulasDeOutrosTurnos(unidadeId: number, turno: Turno, ano: number, semestre: number) {
  const grades = await select<{ id: number; turno: Turno }>(
    `SELECT id, turno FROM grade
     WHERE escola_id = ? AND ano = ? AND semestre = ? AND turno <> ? AND status <> 'ARQUIVADA'
     ORDER BY status = 'PUBLICADA' DESC, criado_em DESC, id DESC`,
    [unidadeId, ano, semestre, turno],
  );
  const escolhidas = new Map<Turno, number>();
  for (const g of grades) if (!escolhidas.has(g.turno)) escolhidas.set(g.turno, g.id);
  if (!escolhidas.size) return [];

  const aulas = await select<{ gradeId: number; professorId: number; dia: number; ordem: number }>(
    "SELECT grade_id AS gradeId, professor_id AS professorId, dia, ordem FROM grade_aula WHERE grade_id IN (?)",
    [[...escolhidas.values()]],
  );
  const turnoDaGrade = new Map([...escolhidas].map(([t, id]) => [id, t]));
  return aulas.map((a) => ({ ...a, turno: turnoDaGrade.get(a.gradeId)! }));
}

/** puxa do banco tudo q a geracao de um turno precisa */
async function carregarDados(
  unidadeId: number, turno: Turno, aulasPorDia: number, ano: number, semestre: number, preferencias: string[],
): Promise<DadosGeracao> {
  const turmas = await select<{ id: number; codigo: string; qtdAlunos: number }>(
    "SELECT id, codigo, qtd_alunos AS qtdAlunos FROM turma WHERE escola_id = ? AND turno = ? ORDER BY codigo",
    [unidadeId, turno],
  );
  const cargas = await select<{ turmaId: number; disciplinaId: number; aulasSemanais: number; professorId: number | null }>(
    `SELECT c.turma_id AS turmaId, c.disciplina_id AS disciplinaId, c.aulas_semanais AS aulasSemanais, c.professor_id AS professorId
     FROM carga_horaria c JOIN turma t ON t.id = c.turma_id WHERE t.escola_id = ? AND t.turno = ?`,
    [unidadeId, turno],
  );
  const disciplinas = await select<{ id: number; nome: string; exigeLaboratorio: boolean }>(
    "SELECT id, nome, exige_laboratorio AS exigeLaboratorio FROM disciplina WHERE escola_id = ?", [unidadeId],
  );
  const professores = await select<{ id: number; nome: string; pontuacaoCps: number; contrato: "INDETERMINADO" | "DETERMINADO" }>(
    "SELECT id, nome, pontuacao_cps AS pontuacaoCps, contrato FROM professor WHERE escola_id = ?", [unidadeId],
  );
  const prefs = await select<{ professorId: number; dia: number; ordem: number; tipo: "PREFERE" | "EVITAR" }>(
    `SELECT f.professor_id AS professorId, f.dia, f.ordem, f.tipo
     FROM preferencia f JOIN professor p ON p.id = f.professor_id WHERE p.escola_id = ? AND f.turno = ?`,
    [unidadeId, turno],
  );
  const externos = await select<{ professorId: number; dia: number; inicio: string; fim: string; descricao: string }>(
    `SELECT c.professor_id AS professorId, c.dia, TIME_FORMAT(c.hora_inicio, '%H:%i') AS inicio,
            TIME_FORMAT(c.hora_fim, '%H:%i') AS fim, c.descricao
     FROM compromisso_externo c JOIN professor p ON p.id = c.professor_id WHERE p.escola_id = ?`,
    [unidadeId],
  );
  const outrosTurnos = await aulasDeOutrosTurnos(unidadeId, turno, ano, semestre);
  const habs = await select<{ professorId: number; disciplinaId: number }>(
    `SELECT h.professor_id AS professorId, h.disciplina_id AS disciplinaId
     FROM habilitacao h JOIN professor p ON p.id = h.professor_id WHERE p.escola_id = ?`, [unidadeId],
  );
  const indisp = await select<{ professorId: number; dia: number; ordem: number }>(
    `SELECT i.professor_id AS professorId, i.dia, i.ordem
     FROM indisponibilidade i JOIN professor p ON p.id = i.professor_id WHERE p.escola_id = ? AND i.turno = ?`,
    [unidadeId, turno],
  );
  const salas = await select<{ id: number; nome: string; tipo: "SALA" | "LABORATORIO"; capacidade: number }>(
    "SELECT id, nome, tipo, capacidade FROM sala WHERE escola_id = ?", [unidadeId],
  );

  return {
    turno,
    aulasPorDia,
    turmas: turmas.map((t) => ({ ...t, cargas: cargas.filter((c) => c.turmaId === t.id).map(({ turmaId: _, ...c }) => c) })),
    disciplinas,
    professores: professores.map((p) => {
      const meusOutrosTurnos = outrosTurnos.filter((a) => a.professorId === p.id);
      const slots = (tipo: "PREFERE" | "EVITAR") =>
        prefs.filter((f) => f.professorId === p.id && f.tipo === tipo).map(({ dia, ordem }) => ({ dia, ordem }));
      return {
        ...p,
        pontuacaoCps: Number(p.pontuacaoCps),
        disciplinaIds: habs.filter((h) => h.professorId === p.id).map((h) => h.disciplinaId),
        indisponiveis: indisp.filter((i) => i.professorId === p.id).map(({ dia, ordem }) => ({ dia, ordem })),
        preferidos: slots("PREFERE"),
        evitar: slots("EVITAR"),
        ocupacoes: [
          ...meusOutrosTurnos.map((a) => ({
            dia: a.dia, ...intervaloAula(a.turno, a.ordem), minutosContados: REGRAS_CPS.minutosPorAula,
            origem: `aula no turno da ${TURNO_NOME[a.turno]}`,
          })),
          ...externos.filter((c) => c.professorId === p.id).map((c) => ({
            dia: c.dia, inicio: minutos(c.inicio), fim: minutos(c.fim), minutosContados: minutos(c.fim) - minutos(c.inicio),
            origem: c.descricao || "compromisso externo",
          })),
        ],
        aulasEmOutrosTurnos: meusOutrosTurnos.length,
      };
    }),
    salas,
    preferencias,
  };
}

// os jobs ficam na memoria: o POST responde na hora com um id e o front fica consultando
// GET /grades/jobs/:id ate acabar, pq a IA pode demorar uns minutos

interface Job {
  id: string;
  unidadeId: number;
  status: "executando" | "concluido" | "erro";
  etapa: string;
  tentativa: number;
  gradeId?: number;
  resposta?: string; // texto da IA (ajuste pelo chat)
  erro?: string;
  iniciadoEm: number;
}

const jobs = new Map<string, Job>();
const UMA_HORA = 60 * 60 * 1000;

function limparJobsAntigos() {
  for (const [id, job] of jobs) if (Date.now() - job.iniciadoEm > UMA_HORA) jobs.delete(id);
}

/** cria o job, responde 202 com o id e roda a tarefa em segundo plano */
function iniciarJob(
  res: import("express").Response, unidadeId: number,
  tarefa: (progresso: (etapa: string, tentativa: number) => void) => Promise<{ gradeId?: number; resposta?: string }>,
) {
  limparJobsAntigos();
  const job: Job = { id: randomUUID(), unidadeId, status: "executando", etapa: "Preparando dados", tentativa: 0, iniciadoEm: Date.now() };
  jobs.set(job.id, job);
  res.status(202).json({ jobId: job.id });

  tarefa((etapa, tentativa) => Object.assign(job, { etapa, tentativa }))
    .then((r) => Object.assign(job, { status: "concluido", etapa: "Concluído", ...r }))
    .catch((err) => {
      if (!(err instanceof GeracaoError)) console.error("Falha na tarefa de IA:", err);
      Object.assign(job, { status: "erro", erro: err instanceof GeracaoError ? err.message : "Erro inesperado na Didáskaros IA." });
    });
}

function exigirChave() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new HttpError(503, "Configure a ANTHROPIC_API_KEY no arquivo backend/.env para usar a Didáskaros IA.");
  }
}

// avisos de cadastro incompleto q nao impedem de gerar
function avisosDeCadastro(dados: DadosGeracao): string[] {
  const avisos: string[] = [];
  const usadas = new Set(dados.turmas.flatMap((t) => t.cargas.map((c) => c.disciplinaId)));
  for (const p of dados.professores) {
    if (!p.disciplinaIds.length) avisos.push(`${p.nome} não tem nenhuma disciplina habilitada.`);
  }
  for (const d of dados.disciplinas) {
    if (usadas.has(d.id) && dados.professores.filter((p) => p.disciplinaIds.includes(d.id)).length === 1) {
      avisos.push(`Só um professor pode dar ${d.nome}: se ele faltar ou ficar sem horário, não há substituto.`);
    }
  }
  for (const t of dados.turmas) {
    const total = t.cargas.reduce((s, c) => s + c.aulasSemanais, 0);
    if (t.cargas.length && total < 5 * dados.aulasPorDia * 0.5) {
      avisos.push(`${t.codigo} tem só ${total} aulas semanais cadastradas. Confira se falta alguma disciplina na carga horária.`);
    }
  }
  return avisos;
}

const gerarSchema = z.object({
  turno: z.enum(TURNOS),
  ano: z.number().int().min(2020).max(2100),
  semestre: z.union([z.literal(1), z.literal(2)]),
  aulasPorDia: z.number().int().min(1).max(8),
  preferencias: z.array(z.string()).default([]),
});

async function salvarGrade(
  unidadeId: number, coordenadorId: number, params: z.infer<typeof gerarSchema>,
  r: Awaited<ReturnType<typeof gerarComClaude>>,
) {
  return transaction(async (conn) => {
    const { insertId } = await exec(
      `INSERT INTO grade (escola_id, turno, ano, semestre, aulas_por_dia, restricoes, observacoes, violacoes, modelo, tentativas, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [unidadeId, params.turno, params.ano, params.semestre, params.aulasPorDia, JSON.stringify(params.preferencias),
        r.observacoes, JSON.stringify(r.violacoes), r.modelo, r.tentativas, coordenadorId],
      conn,
    );
    if (r.aulas.length) {
      await exec(
        "INSERT INTO grade_aula (grade_id, turma_id, disciplina_id, professor_id, sala_id, dia, ordem) VALUES ?",
        [r.aulas.map((a) => [insertId, a.turmaId, a.disciplinaId, a.professorId, a.salaId, a.dia, a.ordem])],
        conn,
      );
    }
    return insertId;
  });
}

export const gradesRouter = Router();

gradesRouter.post("/gerar", async (req, res) => {
  const params = parse(gerarSchema, req.body);
  const { unidadeId, coordenadorId } = req.sessao;

  exigirChave();
  const dados = await carregarDados(unidadeId, params.turno, params.aulasPorDia, params.ano, params.semestre, params.preferencias);
  const problemas = verificarViabilidade(dados);
  if (problemas.length) {
    res.status(422).json({ erro: "Não é possível gerar a grade com os dados atuais.", problemas });
    return;
  }

  iniciarJob(res, unidadeId, async (progresso) => {
    const resultado = await gerarComClaude(dados, progresso);
    return { gradeId: await salvarGrade(unidadeId, coordenadorId, params, resultado) };
  });
});

// o q ta faltando ou inconsistente nos cadastros de um turno, antes de gerar
gradesRouter.get("/diagnostico", async (req, res) => {
  const { turno, aulasPorDia } = parse(
    z.object({ turno: z.enum(TURNOS), aulasPorDia: z.coerce.number().int().min(1).max(8).default(5) }), req.query,
  );
  const ano = new Date().getFullYear();
  const semestre = new Date().getMonth() < 6 ? 1 : 2;
  const dados = await carregarDados(req.sessao.unidadeId, turno, aulasPorDia, ano, semestre, []);
  res.json({ problemas: verificarViabilidade(dados), avisos: avisosDeCadastro(dados) });
});

gradesRouter.get("/jobs/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job || job.unidadeId !== req.sessao.unidadeId) throw new HttpError(404, "Geração não encontrada.");
  const { unidadeId: _, iniciadoEm, ...publico } = job;
  res.json({ ...publico, segundos: Math.round((Date.now() - iniciadoEm) / 1000) });
});

gradesRouter.get("/", async (req, res) => {
  const grades = await select<{ violacoes: unknown }>(
    `SELECT g.id, g.turno, g.ano, g.semestre, g.status, g.aulas_por_dia AS aulasPorDia, g.criado_em AS criadoEm,
            g.modelo, g.violacoes,
            COUNT(a.id) AS totalAulas, COUNT(DISTINCT a.turma_id) AS totalTurmas
     FROM grade g LEFT JOIN grade_aula a ON a.grade_id = g.id
     WHERE g.escola_id = ? GROUP BY g.id ORDER BY g.criado_em DESC, g.id DESC`,
    [req.sessao.unidadeId],
  );
  res.json(grades.map(({ violacoes, ...g }) => ({ ...g, conflitos: jsonArray(violacoes).length })));
});

/** o mysql devolve JSON como objeto e o mariadb como string */
function jsonArray(v: unknown): unknown[] {
  const parsed = typeof v === "string" ? JSON.parse(v) : v;
  return Array.isArray(parsed) ? parsed : [];
}

gradesRouter.get("/:id", async (req, res) => {
  const { id } = parse(idParam, req.params);
  const unidadeId = req.sessao.unidadeId;
  const [grade] = await select<{ turno: Turno; aulasPorDia: number; restricoes: unknown; violacoes: unknown }>(
    `SELECT id, turno, ano, semestre, status, aulas_por_dia AS aulasPorDia, restricoes, observacoes, violacoes,
            modelo, tentativas, criado_em AS criadoEm
     FROM grade WHERE id = ? AND escola_id = ?`,
    [id, unidadeId],
  );
  if (!grade) throw new HttpError(404, "Grade não encontrada.");

  const aulas = await select<Aula>(
    `SELECT turma_id AS turmaId, disciplina_id AS disciplinaId, professor_id AS professorId, sala_id AS salaId, dia, ordem
     FROM grade_aula WHERE grade_id = ? ORDER BY dia, ordem`,
    [id],
  );
  const ids = (k: keyof Aula) => [...new Set(aulas.map((a) => a[k]))];
  const buscar = <T>(sql: string, lista: number[]) => (lista.length ? select<T>(sql, [lista]) : Promise.resolve([] as T[]));

  res.json({
    ...grade,
    restricoes: jsonArray(grade.restricoes),
    violacoes: jsonArray(grade.violacoes),
    horarios: horarios(grade.turno, grade.aulasPorDia),
    // inicio/fim de cada aula, pra saber quem ta em aula agora
    intervalos: Array.from({ length: grade.aulasPorDia }, (_, i) => {
      const { inicio, fim } = intervaloAula(grade.turno, i);
      return { inicio: hhmm(inicio), fim: hhmm(fim) };
    }),
    metricas: metricas(aulas),
    aulas,
    turmas: await buscar("SELECT t.id, t.codigo, c.nome AS curso FROM turma t JOIN curso c ON c.id = t.curso_id WHERE t.id IN (?) ORDER BY t.codigo", ids("turmaId")),
    disciplinas: await buscar("SELECT id, nome, sigla FROM disciplina WHERE id IN (?) ORDER BY nome", ids("disciplinaId")),
    professores: await buscar("SELECT id, nome FROM professor WHERE id IN (?) ORDER BY nome", ids("professorId")),
    salas: await buscar("SELECT id, nome FROM sala WHERE id IN (?) ORDER BY nome", ids("salaId")),
  });
});

gradesRouter.patch("/:id/status", async (req, res) => {
  const { id } = parse(idParam, req.params);
  const { status } = parse(z.object({ status: z.enum(["RASCUNHO", "PUBLICADA", "ARQUIVADA"]) }), req.body);
  const unidadeId = req.sessao.unidadeId;

  await transaction(async (conn) => {
    const [grade] = await select<{ turno: string; ano: number; semestre: number; violacoes: unknown }>(
      "SELECT turno, ano, semestre, violacoes FROM grade WHERE id = ? AND escola_id = ?", [id, unidadeId], conn,
    );
    if (!grade) throw new HttpError(404, "Grade não encontrada.");
    if (status === "PUBLICADA") {
      if (jsonArray(grade.violacoes).length) throw new HttpError(409, "Grade com conflitos não pode ser publicada. Gere novamente.");
      // so pode ter uma grade publicada por turno/semestre, a antiga vai pro arquivo
      await exec(
        `UPDATE grade SET status = 'ARQUIVADA'
         WHERE escola_id = ? AND turno = ? AND ano = ? AND semestre = ? AND status = 'PUBLICADA' AND id <> ?`,
        [unidadeId, grade.turno, grade.ano, grade.semestre, id], conn,
      );
    }
    await exec("UPDATE grade SET status = ? WHERE id = ?", [status, id], conn);
  });
  res.json({ id, status });
});

gradesRouter.delete("/:id", async (req, res) => {
  const { id } = parse(idParam, req.params);
  const { affectedRows } = await exec("DELETE FROM grade WHERE id = ? AND escola_id = ?", [id, req.sessao.unidadeId]);
  if (!affectedRows) throw new HttpError(404, "Grade não encontrada.");
  res.status(204).end();
});

// revalida uma grade salva com os dados de agora (serve pra qnd mexeram nos cadastros dps)
gradesRouter.post("/:id/validar", async (req, res) => {
  const { id } = parse(idParam, req.params);
  const unidadeId = req.sessao.unidadeId;
  const [grade] = await select<{ turno: Turno; aulasPorDia: number; ano: number; semestre: number }>(
    "SELECT turno, aulas_por_dia AS aulasPorDia, ano, semestre FROM grade WHERE id = ? AND escola_id = ?", [id, unidadeId],
  );
  if (!grade) throw new HttpError(404, "Grade não encontrada.");
  const aulas = await select<Aula>(
    `SELECT turma_id AS turmaId, disciplina_id AS disciplinaId, professor_id AS professorId, sala_id AS salaId, dia, ordem
     FROM grade_aula WHERE grade_id = ?`, [id],
  );
  const dados = await carregarDados(unidadeId, grade.turno, grade.aulasPorDia, grade.ano, grade.semestre, []);
  const violacoes = validarGrade(dados, aulas);
  await exec("UPDATE grade SET violacoes = ? WHERE id = ?", [JSON.stringify(violacoes), id]);
  res.json({ violacoes });
});

// conversa com a IA sobre a grade. se o pedido mudar a grade salva uma versao nova (rascunho)
const ajusteSchema = z.object({
  mensagem: z.string().trim().min(1).max(2000),
  historico: z.array(z.object({ papel: z.enum(["coordenador", "ia"]), texto: z.string().max(4000) })).max(40).default([]),
});

gradesRouter.post("/:id/ajustar", async (req, res) => {
  const { id } = parse(idParam, req.params);
  const { mensagem, historico } = parse(ajusteSchema, req.body);
  const { unidadeId, coordenadorId } = req.sessao;
  exigirChave();

  const [grade] = await select<{ turno: Turno; aulasPorDia: number; ano: number; semestre: 1 | 2; restricoes: unknown }>(
    "SELECT turno, aulas_por_dia AS aulasPorDia, ano, semestre, restricoes FROM grade WHERE id = ? AND escola_id = ?",
    [id, unidadeId],
  );
  if (!grade) throw new HttpError(404, "Grade não encontrada.");
  const aulas = await select<Aula>(
    `SELECT turma_id AS turmaId, disciplina_id AS disciplinaId, professor_id AS professorId, sala_id AS salaId, dia, ordem
     FROM grade_aula WHERE grade_id = ?`, [id],
  );
  const preferencias = jsonArray(grade.restricoes).map(String);
  const dados = await carregarDados(unidadeId, grade.turno, grade.aulasPorDia, grade.ano, grade.semestre, preferencias);
  const problemas = [...verificarViabilidade(dados), ...avisosDeCadastro(dados)];

  iniciarJob(res, unidadeId, async (progresso) => {
    const r = await ajustarComClaude(dados, aulas, historico, mensagem, problemas, progresso);
    if (!r.alterou) return { resposta: r.resposta };
    const params = { turno: grade.turno, ano: grade.ano, semestre: grade.semestre, aulasPorDia: grade.aulasPorDia, preferencias: [...preferencias, mensagem] };
    const gradeId = await salvarGrade(unidadeId, coordenadorId, params, { ...r, observacoes: r.resposta });
    return { gradeId, resposta: r.resposta };
  });
});
