/**
 * Recria o banco (database/db.sql) e popula com uma escola de exemplo.
 * Uso: npm run db:setup
 * ATENÇÃO: apaga o banco configurado em DB_NAME.
 */
import { readFileSync } from "node:fs";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { env } from "../env.js";

const schema = readFileSync(new URL("../../../database/db.sql", import.meta.url), "utf8")
  .replaceAll("didaskaros", env.db.database);

const conn = await mysql.createConnection({ ...env.db, database: undefined, multipleStatements: true });
await conn.query(schema);
await conn.changeUser({ database: env.db.database });

async function inserir(sql: string, params: unknown[]) {
  const [r] = await conn.query<mysql.ResultSetHeader>(sql, params);
  return r.insertId;
}

// ── Escola, cursos e coordenadora ──────────────────────────────────────────
const unidade = await inserir(
  `INSERT INTO escola (cod_escola, tipo, nome, municipio, email, telefone)
   VALUES ('263', 'ETEC', 'Uirapuru', 'São Paulo', 'e263dir@cps.sp.gov.br', '(11) 3743-0000')`, [],
);
const curso: Record<string, number> = {};
for (const nome of ["Desenvolvimento de Sistemas", "Informática para Internet"]) {
  curso[nome] = await inserir("INSERT INTO curso (escola_id, nome) VALUES (?, ?)", [unidade, nome]);
}
await inserir(
  `INSERT INTO coordenador (escola_id, curso_id, nome, cpf, data_nascimento, telefone, email, senha_hash, turnos,
     registro_funcional, categoria, data_inicio, nivel_acesso)
   VALUES (?, ?, 'Maria Costa', '52998224725', '1982-04-15', '(11) 99999-0000', 'maria.costa@etec.sp.gov.br', ?,
     'Manhã,Noite', '12345678', 'Coordenador de Curso', '2022-02-01', 'COORDENADOR')`,
  [unidade, curso["Desenvolvimento de Sistemas"], await bcrypt.hash("didaskaros123", 10)],
);

// ── Disciplinas ────────────────────────────────────────────────────────────
const disc: Record<string, number> = {};
for (const [sigla, nome, lab] of [
  ["MAT", "Matemática", false], ["POR", "Português", false], ["FIS", "Física", false],
  ["QUI", "Química", false], ["BIO", "Biologia", false], ["HIS", "História", false],
  ["GEO", "Geografia", false], ["ING", "Inglês", false], ["PW", "Programação Web", true],
  ["BD", "Banco de Dados", true], ["DS", "Desenvolvimento de Sistemas", true], ["APS", "Análise e Projeto de Sistemas", false],
] as const) {
  disc[sigla] = await inserir("INSERT INTO disciplina (escola_id, nome, sigla, exige_laboratorio) VALUES (?, ?, ?, ?)", [unidade, nome, sigla, lab]);
}

// ── Salas ──────────────────────────────────────────────────────────────────
for (const [nome, tipo, cap] of [
  ["Sala 101", "SALA", 40], ["Sala 102", "SALA", 40], ["Sala 103", "SALA", 40], ["Sala 104", "SALA", 35],
  ["Lab. Informática 1", "LABORATORIO", 40], ["Lab. Informática 2", "LABORATORIO", 40],
] as const) {
  await inserir("INSERT INTO sala (escola_id, nome, tipo, capacidade) VALUES (?, ?, ?, ?)", [unidade, nome, tipo, cap]);
}

// ── Professores, habilitações e indisponibilidades ─────────────────────────
const prof: Record<string, number> = {};
const professores: [string, string, number, string[]][] = [
  ["João Silva", "joao.silva", 92.5, ["MAT", "FIS"]],
  ["Maria Santos", "maria.santos", 88, ["POR", "ING"]],
  ["Carlos Oliveira", "carlos.oliveira", 75, ["FIS", "QUI"]],
  ["Ana Lima", "ana.lima", 81, ["HIS", "GEO"]],
  ["Roberto Melo", "roberto.melo", 64, ["GEO", "HIS"]],
  ["Paula Ferreira", "paula.ferreira", 70, ["BIO", "QUI"]],
  ["Fernanda Castro", "fernanda.castro", 79, ["ING", "POR"]],
  ["Lucas Ramos", "lucas.ramos", 85, ["PW", "DS"]],
  ["Beatriz Nunes", "beatriz.nunes", 90, ["BD", "APS", "DS"]],
  ["Ricardo Alves", "ricardo.alves", 60, ["MAT", "PW"]],
];
for (const [i, [nome, email, pontos, habs]] of professores.entries()) {
  const id = await inserir(
    "INSERT INTO professor (escola_id, cod_professor, nome, email, telefone, pontuacao_cps) VALUES (?, ?, ?, ?, '', ?)",
    [unidade, `P${String(i + 1).padStart(3, "0")}`, nome, `${email}@etec.sp.gov.br`, pontos],
  );
  prof[nome] = id;
  for (const h of habs) await inserir("INSERT INTO habilitacao (professor_id, disciplina_id) VALUES (?, ?)", [id, disc[h]]);
}
const indisponivel = (nome: string, turno: string, dia: number, ordens: number[]) =>
  Promise.all(ordens.map((o) => inserir("INSERT INTO indisponibilidade VALUES (?, ?, ?, ?)", [prof[nome], turno, dia, o])));
await indisponivel("João Silva", "MANHA", 0, [0, 1, 2, 3, 4]);   // leciona em outra unidade às segundas
await indisponivel("Ana Lima", "MANHA", 4, [3, 4]);
await indisponivel("Lucas Ramos", "MANHA", 2, [0, 1, 2, 3, 4]);

// ── Turmas e carga horária ─────────────────────────────────────────────────
const turmas: [string, string, number, [string, number, string?][]][] = [
  ["1DS", "MANHA", 40, [["MAT", 4], ["POR", 4], ["FIS", 2], ["QUI", 2], ["BIO", 2], ["HIS", 2], ["GEO", 2], ["ING", 2], ["PW", 3]]],
  ["2DS", "MANHA", 38, [["MAT", 4], ["POR", 3], ["FIS", 2], ["QUI", 2], ["HIS", 2], ["ING", 2], ["BD", 4], ["APS", 3]]],
  ["3DS", "MANHA", 35, [["MAT", 3], ["POR", 3], ["FIS", 2], ["GEO", 2], ["ING", 2], ["DS", 4, "Lucas Ramos"], ["BD", 3], ["APS", 2]]],
  ["2INFO", "NOITE", 30, [["MAT", 3], ["POR", 3], ["PW", 4], ["BD", 4], ["DS", 4], ["ING", 2]]],
];
const turma: Record<string, number> = {};
for (const [codigo, turno, alunos, cargas] of turmas) {
  const cursoId = curso[codigo.endsWith("DS") ? "Desenvolvimento de Sistemas" : "Informática para Internet"];
  const id = await inserir("INSERT INTO turma (escola_id, curso_id, codigo, turno, qtd_alunos) VALUES (?, ?, ?, ?, ?)", [unidade, cursoId, codigo, turno, alunos]);
  turma[codigo] = id;
  for (const [sigla, aulas, professor] of cargas) {
    await inserir("INSERT INTO carga_horaria VALUES (?, ?, ?, ?)", [id, disc[sigla], aulas, professor ? prof[professor] : null]);
  }
}

// ── Alunos ─────────────────────────────────────────────────────────────────
for (const [rm, cpf, nome, codigo] of [
  ["24001", "11144477735", "Gabriel Souza", "1DS"],
  ["24002", "39053344705", "Larissa Pereira", "1DS"],
  ["23015", "98765432100", "Pedro Henrique", "2DS"],
  ["22031", "12345678909", "Juliana Rocha", "3DS"],
  ["24050", "71428793860", "Thiago Martins", "2INFO"],
]) {
  const email = `${nome.toLowerCase().normalize("NFD").replace(/[^a-z ]/g, "").replace(" ", ".")}@etec.sp.gov.br`;
  await inserir("INSERT INTO aluno (escola_id, turma_id, rm, cpf, nome, email) VALUES (?, ?, ?, ?, ?, ?)", [unidade, turma[codigo], rm, cpf, nome, email]);
}

await conn.end();
console.log(`Banco "${env.db.database}" criado e populado.`);
console.log("Login de exemplo: maria.costa@etec.sp.gov.br / didaskaros123");
