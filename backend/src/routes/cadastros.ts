import { Router } from "express";
import { z } from "zod";
import { exec, select, transaction, type Conn } from "../db.js";
import { HttpError, idParam, parse } from "../http.js";

export const TURNOS = ["MANHA", "TARDE", "NOITE"] as const;

/**
 * CRUD de uma tabela simples da unidade (disciplina, sala).
 * `colunas` mapeia campo da API → coluna do banco.
 */
function crudSimples<S extends z.ZodObject>(tabela: string, colunas: Record<keyof z.infer<S> & string, string>, schema: S, ordem: string) {
  const r = Router();
  const campos = Object.entries(colunas) as [string, string][];
  const selectSql = `SELECT id, ${campos.map(([api, col]) => `${col} AS ${api}`).join(", ")} FROM ${tabela}`;

  r.get("/", async (req, res) => {
    res.json(await select(`${selectSql} WHERE escola_id = ? ORDER BY ${ordem}`, [req.sessao.unidadeId]));
  });

  r.post("/", async (req, res) => {
    const d = parse(schema, req.body) as Record<string, unknown>;
    const { insertId } = await exec(
      `INSERT INTO ${tabela} (escola_id, ${campos.map(([, c]) => c).join(", ")}) VALUES (?${", ?".repeat(campos.length)})`,
      [req.sessao.unidadeId, ...campos.map(([api]) => d[api])],
    );
    res.status(201).json({ id: insertId, ...d });
  });

  r.put("/:id", async (req, res) => {
    const { id } = parse(idParam, req.params);
    const d = parse(schema, req.body) as Record<string, unknown>;
    const { affectedRows } = await exec(
      `UPDATE ${tabela} SET ${campos.map(([, c]) => `${c} = ?`).join(", ")} WHERE id = ? AND escola_id = ?`,
      [...campos.map(([api]) => d[api]), id, req.sessao.unidadeId],
    );
    if (!affectedRows) throw new HttpError(404, "Registro não encontrado.");
    res.json({ id, ...d });
  });

  r.delete("/:id", async (req, res) => {
    const { id } = parse(idParam, req.params);
    const { affectedRows } = await exec(`DELETE FROM ${tabela} WHERE id = ? AND escola_id = ?`, [id, req.sessao.unidadeId]);
    if (!affectedRows) throw new HttpError(404, "Registro não encontrado.");
    res.status(204).end();
  });

  return r;
}

export const disciplinasRouter = crudSimples(
  "disciplina",
  { nome: "nome", sigla: "sigla", exigeLaboratorio: "exige_laboratorio" },
  z.object({
    nome: z.string().trim().min(2),
    sigla: z.string().trim().min(1).max(12),
    exigeLaboratorio: z.boolean(),
  }),
  "nome",
);

export const salasRouter = crudSimples(
  "sala",
  { nome: "nome", tipo: "tipo", capacidade: "capacidade" },
  z.object({
    nome: z.string().trim().min(1).max(40),
    tipo: z.enum(["SALA", "LABORATORIO"]),
    capacidade: z.number().int().positive(),
  }),
  "tipo, nome",
);

// ── Professores (com habilitações e indisponibilidades) ────────────────────

const slot = z.object({ turno: z.enum(TURNOS), dia: z.number().int().min(0).max(4), ordem: z.number().int().min(0).max(9) });

const professorSchema = z.object({
  nome: z.string().trim().min(3),
  email: z.string().email(),
  telefone: z.string().optional().default(""),
  pontuacaoCps: z.number().min(0).default(0),
  disciplinaIds: z.array(z.number().int()).default([]),
  indisponibilidades: z.array(slot).default([]),
});

async function garantirDaUnidade(tabela: string, ids: number[], unidadeId: number, conn: Conn) {
  if (!ids.length) return;
  const rows = await select<{ id: number }>(`SELECT id FROM ${tabela} WHERE escola_id = ? AND id IN (?)`, [unidadeId, ids], conn);
  if (rows.length !== new Set(ids).size) throw new HttpError(400, `Há ${tabela}s inválidas na requisição.`);
}

async function salvarVinculosProfessor(id: number, d: z.infer<typeof professorSchema>, unidadeId: number, conn: Conn) {
  await garantirDaUnidade("disciplina", d.disciplinaIds, unidadeId, conn);
  await exec("DELETE FROM habilitacao WHERE professor_id = ?", [id], conn);
  await exec("DELETE FROM indisponibilidade WHERE professor_id = ?", [id], conn);
  if (d.disciplinaIds.length) {
    await exec("INSERT INTO habilitacao (professor_id, disciplina_id) VALUES ?", [d.disciplinaIds.map((did) => [id, did])], conn);
  }
  if (d.indisponibilidades.length) {
    await exec(
      "INSERT IGNORE INTO indisponibilidade (professor_id, turno, dia, ordem) VALUES ?",
      [d.indisponibilidades.map((s) => [id, s.turno, s.dia, s.ordem])], conn,
    );
  }
}

export const professoresRouter = Router();

professoresRouter.get("/", async (req, res) => {
  const unidade = req.sessao.unidadeId;
  const profs = await select<{ id: number }>(
    `SELECT id, nome, email, telefone, pontuacao_cps AS pontuacaoCps FROM professor WHERE escola_id = ? ORDER BY nome`, [unidade],
  );
  const habs = await select<{ professorId: number; disciplinaId: number }>(
    `SELECT h.professor_id AS professorId, h.disciplina_id AS disciplinaId
     FROM habilitacao h JOIN professor p ON p.id = h.professor_id WHERE p.escola_id = ?`, [unidade],
  );
  const indisp = await select<{ professorId: number; turno: string; dia: number; ordem: number }>(
    `SELECT i.professor_id AS professorId, i.turno, i.dia, i.ordem
     FROM indisponibilidade i JOIN professor p ON p.id = i.professor_id WHERE p.escola_id = ?`, [unidade],
  );
  res.json(profs.map((p) => ({
    ...p,
    disciplinaIds: habs.filter((h) => h.professorId === p.id).map((h) => h.disciplinaId),
    indisponibilidades: indisp.filter((i) => i.professorId === p.id).map(({ turno, dia, ordem }) => ({ turno, dia, ordem })),
  })));
});

professoresRouter.post("/", async (req, res) => {
  const d = parse(professorSchema, req.body);
  const id = await transaction(async (conn) => {
    const { insertId } = await exec(
      "INSERT INTO professor (escola_id, nome, email, telefone, pontuacao_cps) VALUES (?, ?, ?, ?, ?)",
      [req.sessao.unidadeId, d.nome, d.email.toLowerCase(), d.telefone, d.pontuacaoCps], conn,
    );
    await salvarVinculosProfessor(insertId, d, req.sessao.unidadeId, conn);
    return insertId;
  });
  res.status(201).json({ id, ...d });
});

professoresRouter.put("/:id", async (req, res) => {
  const { id } = parse(idParam, req.params);
  const d = parse(professorSchema, req.body);
  await transaction(async (conn) => {
    const { affectedRows } = await exec(
      "UPDATE professor SET nome = ?, email = ?, telefone = ?, pontuacao_cps = ? WHERE id = ? AND escola_id = ?",
      [d.nome, d.email.toLowerCase(), d.telefone, d.pontuacaoCps, id, req.sessao.unidadeId], conn,
    );
    if (!affectedRows) throw new HttpError(404, "Professor não encontrado.");
    await salvarVinculosProfessor(id, d, req.sessao.unidadeId, conn);
  });
  res.json({ id, ...d });
});

professoresRouter.delete("/:id", async (req, res) => {
  const { id } = parse(idParam, req.params);
  const { affectedRows } = await exec("DELETE FROM professor WHERE id = ? AND escola_id = ?", [id, req.sessao.unidadeId]);
  if (!affectedRows) throw new HttpError(404, "Professor não encontrado.");
  res.status(204).end();
});

// ── Turmas (com carga horária) ─────────────────────────────────────────────

const turmaSchema = z.object({
  codigo: z.string().trim().min(1).max(12),
  curso: z.string().trim().min(2),
  turno: z.enum(TURNOS),
  qtdAlunos: z.number().int().positive(),
  cargas: z.array(z.object({
    disciplinaId: z.number().int(),
    aulasSemanais: z.number().int().min(1).max(20),
    professorId: z.number().int().nullable(),
  })).default([]),
});

/** Id do curso da escola com esse nome; cria o curso se ainda não existir. */
export async function idCurso(escolaId: number, nome: string, conn: Conn) {
  await exec("INSERT IGNORE INTO curso (escola_id, nome) VALUES (?, ?)", [escolaId, nome], conn);
  const [curso] = await select<{ id: number }>("SELECT id FROM curso WHERE escola_id = ? AND nome = ?", [escolaId, nome], conn);
  return curso.id;
}

async function salvarCargas(turmaId: number, d: z.infer<typeof turmaSchema>, unidadeId: number, conn: Conn) {
  await garantirDaUnidade("disciplina", d.cargas.map((c) => c.disciplinaId), unidadeId, conn);
  await garantirDaUnidade("professor", d.cargas.flatMap((c) => (c.professorId ? [c.professorId] : [])), unidadeId, conn);
  await exec("DELETE FROM carga_horaria WHERE turma_id = ?", [turmaId], conn);
  if (d.cargas.length) {
    await exec(
      "INSERT INTO carga_horaria (turma_id, disciplina_id, aulas_semanais, professor_id) VALUES ?",
      [d.cargas.map((c) => [turmaId, c.disciplinaId, c.aulasSemanais, c.professorId])], conn,
    );
  }
}

export const turmasRouter = Router();

turmasRouter.get("/", async (req, res) => {
  const unidade = req.sessao.unidadeId;
  const turmas = await select<{ id: number }>(
    `SELECT t.id, t.codigo, c.nome AS curso, t.turno, t.qtd_alunos AS qtdAlunos
     FROM turma t JOIN curso c ON c.id = t.curso_id
     WHERE t.escola_id = ? ORDER BY FIELD(t.turno,'MANHA','TARDE','NOITE'), t.codigo`,
    [unidade],
  );
  const cargas = await select<{ turmaId: number; disciplinaId: number; aulasSemanais: number; professorId: number | null }>(
    `SELECT c.turma_id AS turmaId, c.disciplina_id AS disciplinaId, c.aulas_semanais AS aulasSemanais, c.professor_id AS professorId
     FROM carga_horaria c JOIN turma t ON t.id = c.turma_id WHERE t.escola_id = ?`, [unidade],
  );
  res.json(turmas.map((t) => ({
    ...t,
    cargas: cargas.filter((c) => c.turmaId === t.id).map(({ turmaId: _, ...c }) => c),
  })));
});

turmasRouter.post("/", async (req, res) => {
  const d = parse(turmaSchema, req.body);
  const id = await transaction(async (conn) => {
    const { insertId } = await exec(
      "INSERT INTO turma (escola_id, codigo, curso_id, turno, qtd_alunos) VALUES (?, ?, ?, ?, ?)",
      [req.sessao.unidadeId, d.codigo.toUpperCase(), await idCurso(req.sessao.unidadeId, d.curso, conn), d.turno, d.qtdAlunos], conn,
    );
    await salvarCargas(insertId, d, req.sessao.unidadeId, conn);
    return insertId;
  });
  res.status(201).json({ id, ...d });
});

turmasRouter.put("/:id", async (req, res) => {
  const { id } = parse(idParam, req.params);
  const d = parse(turmaSchema, req.body);
  await transaction(async (conn) => {
    const { affectedRows } = await exec(
      "UPDATE turma SET codigo = ?, curso_id = ?, turno = ?, qtd_alunos = ? WHERE id = ? AND escola_id = ?",
      [d.codigo.toUpperCase(), await idCurso(req.sessao.unidadeId, d.curso, conn), d.turno, d.qtdAlunos, id, req.sessao.unidadeId], conn,
    );
    if (!affectedRows) throw new HttpError(404, "Turma não encontrada.");
    await salvarCargas(id, d, req.sessao.unidadeId, conn);
  });
  res.json({ id, ...d });
});

turmasRouter.delete("/:id", async (req, res) => {
  const { id } = parse(idParam, req.params);
  const { affectedRows } = await exec("DELETE FROM turma WHERE id = ? AND escola_id = ?", [id, req.sessao.unidadeId]);
  if (!affectedRows) throw new HttpError(404, "Turma não encontrada.");
  res.status(204).end();
});
