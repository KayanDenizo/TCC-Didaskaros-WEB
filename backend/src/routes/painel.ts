import { Router } from "express";
import { select } from "../db.js";
import { horarios, type Turno } from "../grade/tipos.js";

export const painelRouter = Router();

painelRouter.get("/", async (req, res) => {
  const unidade = req.sessao.unidadeId;

  const [totais] = await select<Record<string, number>>(
    `SELECT
       (SELECT COUNT(*) FROM professor  WHERE unidade_id = ?) AS professores,
       (SELECT COUNT(*) FROM turma      WHERE unidade_id = ?) AS turmas,
       (SELECT COUNT(*) FROM disciplina WHERE unidade_id = ?) AS disciplinas,
       (SELECT COUNT(*) FROM sala       WHERE unidade_id = ?) AS salas`,
    [unidade, unidade, unidade, unidade],
  );

  const grades = await select<{ id: number; turno: Turno; ano: number; semestre: number; status: string; aulasPorDia: number; criadoEm: string; conflitos: number }>(
    `SELECT id, turno, ano, semestre, status, aulas_por_dia AS aulasPorDia, criado_em AS criadoEm,
            COALESCE(JSON_LENGTH(violacoes), 0) AS conflitos
     FROM grade WHERE unidade_id = ? ORDER BY criado_em DESC, id DESC`,
    [unidade],
  );

  // Aulas de hoje, a partir das grades publicadas (0 = segunda … 4 = sexta)
  const diaSemana = (new Date().getDay() + 6) % 7;
  const publicadas = grades.filter((g) => g.status === "PUBLICADA");
  const aulasHoje = diaSemana > 4 || !publicadas.length ? [] : await select<{ gradeId: number; ordem: number }>(
    `SELECT a.grade_id AS gradeId, a.ordem, t.codigo AS turma, d.nome AS disciplina, p.nome AS professor, s.nome AS sala
     FROM grade_aula a
       JOIN turma t ON t.id = a.turma_id JOIN disciplina d ON d.id = a.disciplina_id
       JOIN professor p ON p.id = a.professor_id JOIN sala s ON s.id = a.sala_id
     WHERE a.grade_id IN (?) AND a.dia = ? ORDER BY a.ordem, t.codigo`,
    [publicadas.map((g) => g.id), diaSemana],
  );

  // Carga semanal de cada professor nas grades publicadas
  const professores = await select(
    `SELECT p.id, p.nome,
            (SELECT GROUP_CONCAT(d.nome ORDER BY d.nome SEPARATOR ' · ')
               FROM habilitacao h JOIN disciplina d ON d.id = h.disciplina_id WHERE h.professor_id = p.id) AS disciplinas,
            (SELECT COUNT(*) FROM grade_aula a JOIN grade g ON g.id = a.grade_id
               WHERE a.professor_id = p.id AND g.status = 'PUBLICADA') AS aulasSemana
     FROM professor p WHERE p.unidade_id = ? ORDER BY aulasSemana DESC, p.nome`,
    [unidade],
  );

  res.json({
    totais: {
      ...totais,
      grades: grades.length,
      publicadas: publicadas.length,
      rascunhos: grades.filter((g) => g.status === "RASCUNHO").length,
      conflitos: grades.filter((g) => g.status === "RASCUNHO").reduce((s, g) => s + Number(g.conflitos), 0),
    },
    aulasHoje: aulasHoje.map((a) => {
      const g = publicadas.find((p) => p.id === a.gradeId)!;
      return { ...a, horario: horarios(g.turno, g.aulasPorDia)[a.ordem] };
    }),
    gradesRecentes: grades.slice(0, 5),
    professores,
  });
});
