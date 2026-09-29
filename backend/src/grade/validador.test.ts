import { test } from "node:test";
import assert from "node:assert/strict";
import { metricas, validarGrade, verificarViabilidade } from "./validador.js";
import { horarios, type Aula, type DadosGeracao } from "./tipos.js";

// Duas turmas, duas disciplinas (uma de laboratório), dois professores, uma sala e um laboratório.
const dados: DadosGeracao = {
  turno: "MANHA",
  aulasPorDia: 2,
  turmas: [
    { id: 1, codigo: "1DS", qtdAlunos: 30, cargas: [{ disciplinaId: 10, aulasSemanais: 2, professorId: null }, { disciplinaId: 20, aulasSemanais: 1, professorId: 200 }] },
    { id: 2, codigo: "2DS", qtdAlunos: 30, cargas: [{ disciplinaId: 10, aulasSemanais: 1, professorId: null }] },
  ],
  disciplinas: [
    { id: 10, nome: "Matemática", exigeLaboratorio: false },
    { id: 20, nome: "Banco de Dados", exigeLaboratorio: true },
  ],
  professores: [
    { id: 100, nome: "João", pontuacaoCps: 10, disciplinaIds: [10], indisponiveis: [{ dia: 4, ordem: 0 }] },
    { id: 200, nome: "Bia", pontuacaoCps: 10, disciplinaIds: [20, 10], indisponiveis: [] },
  ],
  salas: [
    { id: 1000, nome: "Sala 101", tipo: "SALA", capacidade: 40 },
    { id: 2000, nome: "Lab 1", tipo: "LABORATORIO", capacidade: 40 },
  ],
  preferencias: [],
};

const valida: Aula[] = [
  { turmaId: 1, disciplinaId: 10, professorId: 100, salaId: 1000, dia: 0, ordem: 0 },
  { turmaId: 1, disciplinaId: 10, professorId: 100, salaId: 1000, dia: 1, ordem: 0 },
  { turmaId: 1, disciplinaId: 20, professorId: 200, salaId: 2000, dia: 0, ordem: 1 },
  { turmaId: 2, disciplinaId: 10, professorId: 100, salaId: 1000, dia: 0, ordem: 1 },
];

const regras = (aulas: Aula[]) => validarGrade(dados, aulas).map((v) => v.regra);
const trocar = (i: number, mudanca: Partial<Aula>) => valida.map((a, j) => (j === i ? { ...a, ...mudanca } : a));

test("grade correta não tem violações", () => {
  assert.deepEqual(validarGrade(dados, valida), []);
});

test("detecta professor em duas turmas ao mesmo tempo", () => {
  assert.ok(regras(trocar(3, { ordem: 0, salaId: 2000 })).includes("conflito-professor"));
});

test("detecta sala ocupada por duas turmas", () => {
  const aulas = trocar(3, { professorId: 200, dia: 0, ordem: 0 });
  assert.ok(regras(aulas).includes("conflito-sala"));
});

test("detecta turma com duas aulas no mesmo horário", () => {
  assert.ok(regras(trocar(1, { dia: 0, ordem: 1, salaId: 1000 })).includes("conflito-turma"));
});

test("detecta carga horária incompleta", () => {
  assert.ok(regras(valida.slice(1)).includes("carga"));
});

test("detecta disciplina de laboratório fora do laboratório", () => {
  assert.ok(regras(trocar(2, { salaId: 1000, dia: 2 })).includes("laboratorio"));
});

test("detecta professor não habilitado e atribuição fixa desrespeitada", () => {
  const r = regras(trocar(2, { professorId: 100 }));
  assert.ok(r.includes("habilitacao"));
  assert.ok(r.includes("atribuicao"));
});

test("detecta horário em que o professor está indisponível", () => {
  assert.ok(regras(trocar(1, { dia: 4, ordem: 0 })).includes("indisponibilidade"));
});

test("detecta disciplina dividida entre professores", () => {
  assert.ok(regras(trocar(1, { professorId: 200 })).includes("professor-unico"));
});

test("detecta aula fora da grade de horários", () => {
  assert.ok(regras(trocar(1, { ordem: 5 })).includes("horario"));
});

test("viabilidade: turma com mais aulas que horários", () => {
  const cheio = { ...dados, aulasPorDia: 1, turmas: [{ ...dados.turmas[0], cargas: [{ disciplinaId: 10, aulasSemanais: 6, professorId: null }] }] };
  assert.match(verificarViabilidade(cheio).join(), /6 aulas semanais/);
  assert.deepEqual(verificarViabilidade(dados), []);
});

test("métricas contam janelas", () => {
  const comJanela: Aula[] = [
    { turmaId: 1, disciplinaId: 10, professorId: 100, salaId: 1000, dia: 0, ordem: 0 },
    { turmaId: 1, disciplinaId: 10, professorId: 100, salaId: 1000, dia: 0, ordem: 2 },
  ];
  assert.deepEqual(metricas(comJanela), { janelasTurmas: 1, janelasProfessores: 1 });
});

test("horários do turno da manhã seguem o padrão da ETEC", () => {
  assert.deepEqual(horarios("MANHA", 5), ["07:30", "08:20", "09:10", "10:10", "11:00"]);
});
