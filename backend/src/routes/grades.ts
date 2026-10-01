import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { exec, select, transaction } from "../db.js";
import { HttpError, idParam, parse } from "../http.js";
import { GeracaoError, gerarComClaude } from "../grade/claude.js";
import { horarios, type Aula, type DadosGeracao, type Turno } from "../grade/tipos.js";
import { metricas, validarGrade, verificarViabilidade } from "../grade/validador.js";
import { TURNOS } from "./cadastros.js";

/** Lê do banco tudo o que a geração de um turno precisa. */
async function carregarDados(unidadeId: number, turno: Turno, aulasPorDia: number, preferencias: string[]): Promise<DadosGeracao> {
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
  const professores = await select<{ id: number; nome: string; pontuacaoCps: number }>(
    "SELECT id, nome, pontuacao_cps AS pontuacaoCps FROM professor WHERE escola_id = ?", [unidadeId],
  );
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
    professores: professores.map((p) => ({
      ...p,
      disciplinaIds: habs.filter((h) => h.professorId === p.id).map((h) => h.disciplinaId),
      indisponiveis: indisp.filter((i) => i.professorId === p.id).map(({ dia, ordem }) => ({ dia, ordem })),
    })),
    salas,
    preferencias,
  };
}

// ── Jobs de geração (em memória) ───────────────────────────────────────────
// A geração leva de segundos a minutos: o POST responde na hora com um id e o
// front acompanha o progresso por GET /grades/jobs/:id.

interface Job {
  id: string;
  unidadeId: number;
  status: "executando" | "concluido" | "erro";
  etapa: string;
  tentativa: number;
  gradeId?: number;
  erro?: string;
  iniciadoEm: number;
}

const jobs = new Map<string, Job>();
const UMA_HORA = 60 * 60 * 1000;

function limparJobsAntigos() {
  for (const [id, job] of jobs) if (Date.now() - job.iniciadoEm > UMA_HORA) jobs.delete(id);
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

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new HttpError(503, "Configure a ANTHROPIC_API_KEY no arquivo backend/.env para gerar grades com a Claude.");
  }
  const dados = await carregarDados(unidadeId, params.turno, params.aulasPorDia, params.preferencias);
  const problemas = verificarViabilidade(dados);
  if (problemas.length) {
    res.status(422).json({ erro: "Não é possível gerar a grade com os dados atuais.", problemas });
    return;
  }

  limparJobsAntigos();
  const job: Job = { id: randomUUID(), unidadeId, status: "executando", etapa: "Preparando dados", tentativa: 0, iniciadoEm: Date.now() };
  jobs.set(job.id, job);
  res.status(202).json({ jobId: job.id });

  gerarComClaude(dados, (etapa, tentativa) => Object.assign(job, { etapa, tentativa }))
    .then((resultado) => salvarGrade(unidadeId, coordenadorId, params, resultado))
    .then((gradeId) => Object.assign(job, { status: "concluido", etapa: "Concluído", gradeId }))
    .catch((err) => {
      if (!(err instanceof GeracaoError)) console.error("Falha ao gerar grade:", err);
      Object.assign(job, { status: "erro", erro: err instanceof GeracaoError ? err.message : "Erro inesperado ao gerar a grade." });
    });
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

/** MySQL devolve JSON como objeto; MariaDB como string. */
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
      // Só uma grade publicada por turno/semestre: a anterior vai para o arquivo.
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

// Revalida uma grade salva contra os dados atuais (útil depois de editar cadastros).
gradesRouter.post("/:id/validar", async (req, res) => {
  const { id } = parse(idParam, req.params);
  const unidadeId = req.sessao.unidadeId;
  const [grade] = await select<{ turno: Turno; aulasPorDia: number }>(
    "SELECT turno, aulas_por_dia AS aulasPorDia FROM grade WHERE id = ? AND escola_id = ?", [id, unidadeId],
  );
  if (!grade) throw new HttpError(404, "Grade não encontrada.");
  const aulas = await select<Aula>(
    `SELECT turma_id AS turmaId, disciplina_id AS disciplinaId, professor_id AS professorId, sala_id AS salaId, dia, ordem
     FROM grade_aula WHERE grade_id = ?`, [id],
  );
  const violacoes = validarGrade(await carregarDados(unidadeId, grade.turno, grade.aulasPorDia, []), aulas);
  await exec("UPDATE grade SET violacoes = ? WHERE id = ?", [JSON.stringify(violacoes), id]);
  res.json({ violacoes });
});
