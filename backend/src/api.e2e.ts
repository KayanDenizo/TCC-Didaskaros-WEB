/**
 * testes de integracao da api (caixa-preta): sobe o servidor de verdade e faz as requisicoes http.
 * pra rodar: npm run test:api
 *
 * roda num banco SEPARADO (didaskaros_teste), recriado do zero toda vez com os dados de exemplo.
 * ninguem mexe no banco de verdade (didaskaros). a chave da IA vira uma falsa,
 * entao nenhum teste gasta credito da api da Anthropic
 */
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

process.env.DB_NAME = process.env.DB_NAME_TESTE ?? "didaskaros_teste";
process.env.ANTHROPIC_API_KEY = "sk-ant-chave-falsa-para-testes";
if (process.env.DB_NAME === "didaskaros") throw new Error("Os testes não podem rodar no banco de verdade.");

/* eslint-disable @typescript-eslint/no-explicit-any */
type Resposta = { status: number; json: any; texto: string };

let server: Server;
let base = "";
let pool: typeof import("./db.js").pool;
let env: typeof import("./env.js").env;

const tempos: { rota: string; status: number; ms: number }[] = [];

let token = ""; // coordenadora da escola de exemplo (Maria Costa)
let tokenOutraEscola = ""; // coordenador criado no teste de cadastro

async function api(metodo: string, rota: string, opts: { corpo?: unknown; bruto?: string; token?: string | null } = {}): Promise<Resposta> {
  const headers: Record<string, string> = {};
  const tk = opts.token === undefined ? token : opts.token;
  if (tk) headers.Authorization = `Bearer ${tk}`;
  let body: string | undefined;
  if (opts.bruto !== undefined || opts.corpo !== undefined) {
    headers["Content-Type"] = "application/json";
    body = opts.bruto ?? JSON.stringify(opts.corpo);
  }
  const inicio = performance.now();
  const res = await fetch(base + rota, { method: metodo, headers, body });
  const texto = await res.text();
  const ms = performance.now() - inicio;
  const rotaNormalizada = rota.replace(/\?.*/, "").replace(/\/[0-9a-f-]{36}/, "/:jobId").replace(/\/\d+/g, "/:id");
  tempos.push({ rota: `${metodo} /api${rotaNormalizada}`, status: res.status, ms });
  let json: any = null;
  try { json = texto ? JSON.parse(texto) : null; } catch { /* resposta não é JSON */ }
  return { status: res.status, json, texto };
}

async function sql<T = any>(query: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await pool.query(query, params);
  return rows as T[];
}

async function idDe(tabela: string, coluna: string, valor: string): Promise<number> {
  const [row] = await sql<{ id: number }>(`SELECT id FROM ${tabela} WHERE ${coluna} = ?`, [valor]);
  assert.ok(row, `${tabela} "${valor}" não encontrado no banco de teste`);
  return row.id;
}

const payloadJwt = (t: string) => JSON.parse(Buffer.from(t.split(".")[1], "base64url").toString());

before(async () => {
  await import("./scripts/setup-db.js"); // recria o banco de teste com a escola de exemplo
  ({ pool } = await import("./db.js"));
  ({ env } = await import("./env.js"));
  const { app } = await import("./app.js");
  server = app.listen(0);
  await new Promise<void>((ok) => server.once("listening", () => ok()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});

after(async () => {
  server?.closeAllConnections();
  await new Promise((ok) => server?.close(ok));
  await pool?.end();
  if (process.env.RELATORIO_API) writeFileSync(process.env.RELATORIO_API, JSON.stringify(tempos, null, 2));
});

// ---------------------------------------------------------------------------
describe("Saúde do servidor", () => {
  test("CT01 GET /health responde que a API está no ar", async () => {
    const r = await api("GET", "/health", { token: null });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { ok: true });
  });
});

// ---------------------------------------------------------------------------
describe("Autenticação (RF002, RNF005)", () => {
  const login = (corpo: unknown) => api("POST", "/auth/login", { corpo, token: null });

  test("CT02 login com e-mail e senha corretos devolve token e dados do usuário, sem a senha", async () => {
    const r = await login({ email: "maria.costa@etec.sp.gov.br", senha: "didaskaros123" });
    assert.equal(r.status, 200);
    assert.equal(typeof r.json.token, "string");
    assert.equal(r.json.usuario.nome, "Maria Costa");
    assert.equal(r.json.usuario.unidade, "ETEC Uirapuru");
    assert.ok(!/senha/i.test(JSON.stringify(r.json.usuario)), "a resposta não pode expor a senha");
    token = r.json.token;
  });

  test("CT03 login com senha incorreta é recusado (401)", async () => {
    const r = await login({ email: "maria.costa@etec.sp.gov.br", senha: "senhaErrada" });
    assert.equal(r.status, 401);
    assert.equal(r.json.erro, "E-mail ou senha incorretos.");
  });

  test("CT04 login com e-mail não cadastrado dá a mesma mensagem (não revela quem existe)", async () => {
    const r = await login({ email: "ninguem@etec.sp.gov.br", senha: "didaskaros123" });
    assert.equal(r.status, 401);
    assert.equal(r.json.erro, "E-mail ou senha incorretos.");
  });

  test("CT05 login com e-mail mal formatado é recusado na validação (400)", async () => {
    const r = await login({ email: "maria.costa", senha: "didaskaros123" });
    assert.equal(r.status, 400);
    assert.equal(r.json.erro, "email: E-mail inválido.");
  });

  test("CT06 login sem senha é recusado na validação (400)", async () => {
    const r = await login({ email: "maria.costa@etec.sp.gov.br", senha: "" });
    assert.equal(r.status, 400);
    assert.equal(r.json.erro, "senha: Informe a senha.");
  });

  test("CT07 tentativa de injeção de SQL no login não entra no sistema", async () => {
    const noEmail = await login({ email: "' OR '1'='1", senha: "x" });
    assert.equal(noEmail.status, 400);
    const naSenha = await login({ email: "maria.costa@etec.sp.gov.br", senha: "' OR '1'='1' -- " });
    assert.equal(naSenha.status, 401);
  });

  test("CT08 'manter conectado' estende a sessão de 8 horas para 30 dias", async () => {
    const curto = payloadJwt(token);
    const longo = payloadJwt((await login({ email: "maria.costa@etec.sp.gov.br", senha: "didaskaros123", manterConectado: true })).json.token);
    assert.equal(curto.exp - curto.iat, 8 * 3600);
    assert.equal(longo.exp - longo.iat, 30 * 24 * 3600);
  });

  test("CT09 GET /auth/me devolve o usuário do token", async () => {
    const r = await api("GET", "/auth/me");
    assert.equal(r.status, 200);
    assert.equal(r.json.email, "maria.costa@etec.sp.gov.br");
    assert.equal(r.json.nivelAcesso, "COORDENADOR");
  });

  test("CT10 rota protegida sem token é bloqueada (401)", async () => {
    const r = await api("GET", "/professores", { token: null });
    assert.equal(r.status, 401);
    assert.equal(r.json.erro, "Faça login para continuar.");
  });

  test("CT11 token com assinatura adulterada é bloqueado (401)", async () => {
    const r = await api("GET", "/professores", { token: token.slice(0, -4) + "AAAA" });
    assert.equal(r.status, 401);
  });

  test("CT12 token expirado é bloqueado (401)", async () => {
    const jwt = (await import("jsonwebtoken")).default;
    const vencido = jwt.sign({ coordenadorId: 1, unidadeId: 1, exp: Math.floor(Date.now() / 1000) - 60 }, env.jwtSecret);
    const r = await api("GET", "/professores", { token: vencido });
    assert.equal(r.status, 401);
    assert.equal(r.json.erro, "Sessão expirada. Faça login novamente.");
  });

  test("CT13 token assinado com outra chave é bloqueado (401)", async () => {
    const jwt = (await import("jsonwebtoken")).default;
    const falso = jwt.sign({ coordenadorId: 1, unidadeId: 1 }, "chave-de-um-invasor");
    assert.equal((await api("GET", "/professores", { token: falso })).status, 401);
  });

  const cadastro = {
    nomeCompleto: "Coordenador de Teste",
    cpf: "390.533.447-05",
    dataNascimento: "1990-05-20",
    telefone: "(11) 98888-7777",
    emailInstitucional: "Coord.Teste@etec.sp.gov.br",
    senha: "senhaSegura123",
    tipoInstituicao: "ETEC",
    unidade: "Teste Automatizado",
    municipio: "São Paulo",
    curso: "Desenvolvimento de Sistemas",
    turnosResponsavel: ["Manhã"],
    registroFuncional: "1234567",
    categoriaFuncional: "Coordenador de Curso",
    dataInicio: "2024-02-01",
    nivelAcesso: "COORDENADOR",
  };

  test("CT14 cadastro de coordenador cria a escola e já devolve a sessão (201)", async () => {
    const r = await api("POST", "/auth/cadastro", { corpo: cadastro, token: null });
    assert.equal(r.status, 201);
    assert.equal(r.json.usuario.unidade, "ETEC Teste Automatizado");
    assert.equal(r.json.usuario.email, "coord.teste@etec.sp.gov.br", "e-mail salvo em minúsculas");
    tokenOutraEscola = r.json.token;
    const [c] = await sql("SELECT cpf FROM coordenador WHERE email = ?", ["coord.teste@etec.sp.gov.br"]);
    assert.equal(c.cpf, "39053344705", "CPF salvo só com dígitos");
  });

  test("CT15 a senha é guardada criptografada (bcrypt), nunca em texto puro", async () => {
    const [c] = await sql("SELECT senha_hash FROM coordenador WHERE email = ?", ["coord.teste@etec.sp.gov.br"]);
    assert.match(c.senha_hash, /^\$2[aby]\$10\$/);
    assert.notEqual(c.senha_hash, cadastro.senha);
    const r = await api("POST", "/auth/login", { corpo: { email: "coord.teste@etec.sp.gov.br", senha: cadastro.senha }, token: null });
    assert.equal(r.status, 200);
  });

  test("CT16 cadastro com e-mail já usado é recusado (409)", async () => {
    const r = await api("POST", "/auth/cadastro", { corpo: { ...cadastro, cpf: "11144477735" }, token: null });
    assert.equal(r.status, 409);
    assert.equal(r.json.erro, "Já existe um registro com esses dados.");
  });

  test("CT17 cadastro com senha de menos de 8 caracteres é recusado (400)", async () => {
    const r = await api("POST", "/auth/cadastro", { corpo: { ...cadastro, emailInstitucional: "outro@etec.sp.gov.br", senha: "1234567" }, token: null });
    assert.equal(r.status, 400);
    assert.equal(r.json.erro, "senha: A senha deve ter no mínimo 8 caracteres.");
  });

  test("CT18 cadastro com CPF incompleto é recusado (400)", async () => {
    const r = await api("POST", "/auth/cadastro", { corpo: { ...cadastro, emailInstitucional: "outro@etec.sp.gov.br", cpf: "123.456" }, token: null });
    assert.equal(r.status, 400);
    assert.equal(r.json.erro, "cpf: CPF inválido.");
  });

  test("CT19 cadastro com registro funcional fora do padrão é recusado (400)", async () => {
    const r = await api("POST", "/auth/cadastro", { corpo: { ...cadastro, emailInstitucional: "outro@etec.sp.gov.br", registroFuncional: "12A" }, token: null });
    assert.equal(r.status, 400);
    assert.equal(r.json.erro, "registroFuncional: RF deve ter de 6 a 8 dígitos.");
  });
});

// ---------------------------------------------------------------------------
describe("Painel", () => {
  test("CT20 GET /painel traz os totais da escola de exemplo", async () => {
    const r = await api("GET", "/painel");
    assert.equal(r.status, 200);
    assert.deepEqual(
      { ...r.json.totais },
      { professores: 10, turmas: 4, disciplinas: 12, salas: 6, grades: 0, publicadas: 0, rascunhos: 0, conflitos: 0 },
    );
    assert.equal(r.json.professores.length, 10);
  });
});

// ---------------------------------------------------------------------------
describe("Disciplinas (RF004)", () => {
  let id = 0;

  test("CT21 lista as 12 disciplinas da escola em ordem alfabética", async () => {
    const r = await api("GET", "/disciplinas");
    assert.equal(r.status, 200);
    assert.equal(r.json.length, 12);
    const nomes = r.json.map((d: any) => d.nome);
    assert.deepEqual(nomes, [...nomes].sort((a: string, b: string) => a.localeCompare(b, "pt-BR")));
    assert.equal(typeof r.json[0].exigeLaboratorio, "boolean");
  });

  test("CT22 cadastra uma disciplina nova (201)", async () => {
    const r = await api("POST", "/disciplinas", { corpo: { nome: "Robótica", sigla: "ROB", exigeLaboratorio: true } });
    assert.equal(r.status, 201);
    id = r.json.id;
    const lista = (await api("GET", "/disciplinas")).json;
    assert.ok(lista.some((d: any) => d.id === id && d.nome === "Robótica" && d.exigeLaboratorio === true));
  });

  test("CT23 não deixa cadastrar duas disciplinas com o mesmo nome (409)", async () => {
    const r = await api("POST", "/disciplinas", { corpo: { nome: "Robótica", sigla: "ROB2", exigeLaboratorio: false } });
    assert.equal(r.status, 409);
  });

  test("CT24 recusa dados inválidos: sigla longa demais e campo obrigatório faltando (400)", async () => {
    const longa = await api("POST", "/disciplinas", { corpo: { nome: "Teste", sigla: "SIGLAMUITOLONGA", exigeLaboratorio: false } });
    assert.equal(longa.status, 400);
    assert.match(longa.json.erro, /^sigla:/);
    const semCampo = await api("POST", "/disciplinas", { corpo: { nome: "Teste", sigla: "TS" } });
    assert.equal(semCampo.status, 400);
    assert.match(semCampo.json.erro, /^exigeLaboratorio:/);
  });

  test("CT25 edita uma disciplina (200)", async () => {
    const r = await api("PUT", `/disciplinas/${id}`, { corpo: { nome: "Robótica Educacional", sigla: "ROBE", exigeLaboratorio: false } });
    assert.equal(r.status, 200);
    const d = (await api("GET", "/disciplinas")).json.find((x: any) => x.id === id);
    assert.deepEqual(d, { id, nome: "Robótica Educacional", sigla: "ROBE", exigeLaboratorio: false });
  });

  test("CT26 editar disciplina inexistente dá 404", async () => {
    const r = await api("PUT", "/disciplinas/999999", { corpo: { nome: "Nada", sigla: "N", exigeLaboratorio: false } });
    assert.equal(r.status, 404);
    assert.equal(r.json.erro, "Registro não encontrado.");
  });

  test("CT27 id que não é número na URL dá 400", async () => {
    assert.equal((await api("DELETE", "/disciplinas/abc")).status, 400);
  });

  test("CT28 exclui a disciplina (204) e excluir de novo dá 404", async () => {
    assert.equal((await api("DELETE", `/disciplinas/${id}`)).status, 204);
    assert.equal((await api("DELETE", `/disciplinas/${id}`)).status, 404);
  });

  test("CT29 texto com comando SQL é salvo como texto comum (proteção contra injeção)", async () => {
    const nome = "Teste'); DROP TABLE disciplina; --";
    const r = await api("POST", "/disciplinas", { corpo: { nome, sigla: "SQL", exigeLaboratorio: false } });
    assert.equal(r.status, 201);
    const lista = (await api("GET", "/disciplinas")).json;
    assert.ok(lista.some((d: any) => d.nome === nome), "o nome volta exatamente como foi enviado");
    assert.equal(lista.length, 13, "a tabela continua inteira");
    await api("DELETE", `/disciplinas/${r.json.id}`);
  });
});

// ---------------------------------------------------------------------------
describe("Salas e laboratórios (RF006)", () => {
  let id = 0;

  test("CT30 cadastra um laboratório (201)", async () => {
    const r = await api("POST", "/salas", { corpo: { nome: "Lab. Robótica", tipo: "LABORATORIO", capacidade: 30 } });
    assert.equal(r.status, 201);
    id = r.json.id;
    assert.equal((await api("GET", "/salas")).json.length, 7);
  });

  test("CT31 recusa tipo de sala desconhecido e capacidade zero, negativa ou quebrada (400)", async () => {
    for (const corpo of [
      { nome: "Auditório", tipo: "AUDITORIO", capacidade: 100 },
      { nome: "Sala X", tipo: "SALA", capacidade: 0 },
      { nome: "Sala X", tipo: "SALA", capacidade: -5 },
      { nome: "Sala X", tipo: "SALA", capacidade: 10.5 },
    ]) {
      assert.equal((await api("POST", "/salas", { corpo })).status, 400, JSON.stringify(corpo));
    }
  });

  test("CT32 edita (200) e exclui (204) a sala", async () => {
    const r = await api("PUT", `/salas/${id}`, { corpo: { nome: "Lab. Robótica", tipo: "LABORATORIO", capacidade: 35 } });
    assert.equal(r.status, 200);
    assert.equal((await api("GET", "/salas")).json.find((s: any) => s.id === id).capacidade, 35);
    assert.equal((await api("DELETE", `/salas/${id}`)).status, 204);
  });
});

// ---------------------------------------------------------------------------
describe("Professores, disponibilidade e restrições (RF003, RF007)", () => {
  let id = 0;
  let mat = 0;
  let fis = 0;
  const base = () => ({
    nome: "Professor de Teste",
    email: "Prof.Teste@etec.sp.gov.br",
    telefone: "(11) 97777-6666",
    pontuacaoCps: 77.5,
    contrato: "DETERMINADO",
    disciplinaIds: [mat, fis],
    indisponibilidades: [{ turno: "MANHA", dia: 0, ordem: 0 }],
    preferencias: [
      { turno: "MANHA", dia: 2, ordem: 1, tipo: "PREFERE" },
      { turno: "MANHA", dia: 0, ordem: 0, tipo: "PREFERE" }, // mesmo horário da indisponibilidade
    ],
    compromissosExternos: [{ dia: 4, inicio: "19:00", fim: "22:30", descricao: "aulas em outra unidade" }],
  });

  test("CT33 cadastra professor com habilitações, indisponibilidade, preferências e compromisso externo (201)", async () => {
    mat = await idDe("disciplina", "sigla", "MAT");
    fis = await idDe("disciplina", "sigla", "FIS");
    const r = await api("POST", "/professores", { corpo: base() });
    assert.equal(r.status, 201);
    id = r.json.id;
    const p = (await api("GET", "/professores")).json.find((x: any) => x.id === id);
    assert.equal(p.email, "prof.teste@etec.sp.gov.br");
    assert.equal(p.contrato, "DETERMINADO");
    assert.equal(p.pontuacaoCps, 77.5);
    assert.deepEqual([...p.disciplinaIds].sort(), [mat, fis].sort());
    assert.deepEqual(p.indisponibilidades, [{ turno: "MANHA", dia: 0, ordem: 0 }]);
    assert.deepEqual(p.compromissosExternos, [{ dia: 4, inicio: "19:00", fim: "22:30", descricao: "aulas em outra unidade" }]);
  });

  test("CT34 preferência em horário indisponível é descartada (a indisponibilidade vence)", async () => {
    const p = (await api("GET", "/professores")).json.find((x: any) => x.id === id);
    assert.deepEqual(p.preferencias, [{ turno: "MANHA", dia: 2, ordem: 1, tipo: "PREFERE" }]);
  });

  test("CT35 compromisso que termina antes de começar é recusado (400)", async () => {
    const corpo = { ...base(), email: "x1@etec.sp.gov.br", compromissosExternos: [{ dia: 1, inicio: "15:00", fim: "13:00" }] };
    const r = await api("POST", "/professores", { corpo });
    assert.equal(r.status, 400);
    assert.equal(r.json.erro, "compromissosExternos.0: O compromisso precisa terminar depois de começar.");
  });

  test("CT36 hora em formato inválido é recusada (400)", async () => {
    const corpo = { ...base(), email: "x2@etec.sp.gov.br", compromissosExternos: [{ dia: 1, inicio: "25:00", fim: "26:00" }] };
    const r = await api("POST", "/professores", { corpo });
    assert.equal(r.status, 400);
    assert.match(r.json.erro, /Hora inválida \(use HH:MM\)\./);
  });

  test("CT37 disciplina inexistente é recusada e nada fica salvo pela metade (transação)", async () => {
    const antes = (await api("GET", "/professores")).json.length;
    const r = await api("POST", "/professores", { corpo: { ...base(), email: "x3@etec.sp.gov.br", disciplinaIds: [999999] } });
    assert.equal(r.status, 400);
    assert.equal(r.json.erro, "Há disciplinas inválidas na requisição.");
    assert.equal((await api("GET", "/professores")).json.length, antes);
  });

  test("CT38 dois professores com o mesmo e-mail na escola são recusados (409)", async () => {
    assert.equal((await api("POST", "/professores", { corpo: base() })).status, 409);
  });

  test("CT39 horário fora da semana letiva (sábado) é recusado (400)", async () => {
    const corpo = { ...base(), email: "x4@etec.sp.gov.br", indisponibilidades: [{ turno: "MANHA", dia: 5, ordem: 0 }] };
    assert.equal((await api("POST", "/professores", { corpo })).status, 400);
  });

  test("CT40 editar substitui todos os vínculos (200); professor inexistente dá 404", async () => {
    const r = await api("PUT", `/professores/${id}`, { corpo: { ...base(), disciplinaIds: [mat], indisponibilidades: [], preferencias: [], compromissosExternos: [] } });
    assert.equal(r.status, 200);
    const p = (await api("GET", "/professores")).json.find((x: any) => x.id === id);
    assert.deepEqual(p.disciplinaIds, [mat]);
    assert.deepEqual([p.indisponibilidades, p.preferencias, p.compromissosExternos], [[], [], []]);
    assert.equal((await api("PUT", "/professores/999999", { corpo: base() })).status, 404);
  });

  test("CT41 excluir o professor (204) apaga também as habilitações dele", async () => {
    assert.equal((await api("DELETE", `/professores/${id}`)).status, 204);
    const [{ n }] = await sql("SELECT COUNT(*) AS n FROM habilitacao WHERE professor_id = ?", [id]);
    assert.equal(n, 0);
  });
});

// ---------------------------------------------------------------------------
describe("Turmas e carga horária (RF005)", () => {
  let id = 0;
  let mat = 0;
  let pw = 0;
  let lucas = 0;

  test("CT42 cadastra turma com carga horária; código vira maiúsculo e o curso novo é criado (201)", async () => {
    mat = await idDe("disciplina", "sigla", "MAT");
    pw = await idDe("disciplina", "sigla", "PW");
    lucas = await idDe("professor", "nome", "Lucas Ramos");
    const r = await api("POST", "/turmas", {
      corpo: {
        codigo: "9teste", curso: "Curso de Teste Automatizado", turno: "TARDE", qtdAlunos: 32,
        cargas: [{ disciplinaId: mat, aulasSemanais: 4, professorId: null }, { disciplinaId: pw, aulasSemanais: 2, professorId: lucas }],
      },
    });
    assert.equal(r.status, 201);
    id = r.json.id;
    const t = (await api("GET", "/turmas")).json.find((x: any) => x.id === id);
    assert.equal(t.codigo, "9TESTE");
    assert.equal(t.curso, "Curso de Teste Automatizado");
    assert.equal(t.cargas.length, 2);
    assert.ok(t.cargas.some((c: any) => c.disciplinaId === pw && c.professorId === lucas && c.aulasSemanais === 2));
  });

  test("CT43 carga semanal de 0 ou mais de 20 aulas é recusada (400)", async () => {
    for (const aulasSemanais of [0, 21]) {
      const corpo = { codigo: "9X", curso: "Teste", turno: "TARDE", qtdAlunos: 30, cargas: [{ disciplinaId: mat, aulasSemanais, professorId: null }] };
      assert.equal((await api("POST", "/turmas", { corpo })).status, 400);
    }
  });

  test("CT44 turno inexistente é recusado (400)", async () => {
    const r = await api("POST", "/turmas", { corpo: { codigo: "9X", curso: "Teste", turno: "MADRUGADA", qtdAlunos: 30 } });
    assert.equal(r.status, 400);
    assert.match(r.json.erro, /^turno:/);
  });

  test("CT45 professor inexistente na carga horária é recusado (400)", async () => {
    const corpo = { codigo: "9X", curso: "Teste", turno: "TARDE", qtdAlunos: 30, cargas: [{ disciplinaId: mat, aulasSemanais: 2, professorId: 999999 }] };
    const r = await api("POST", "/turmas", { corpo });
    assert.equal(r.status, 400);
    assert.equal(r.json.erro, "Há professores inválidos na requisição.");
  });

  test("CT46 código de turma repetido na escola é recusado (409)", async () => {
    const r = await api("POST", "/turmas", { corpo: { codigo: "1ds", curso: "Desenvolvimento de Sistemas", turno: "MANHA", qtdAlunos: 30 } });
    assert.equal(r.status, 409);
  });

  test("CT47 edita a turma (200) e, ao excluir (204), a carga horária vai junto", async () => {
    const r = await api("PUT", `/turmas/${id}`, { corpo: { codigo: "9TESTE", curso: "Curso de Teste Automatizado", turno: "TARDE", qtdAlunos: 28, cargas: [] } });
    assert.equal(r.status, 200);
    assert.equal((await api("GET", "/turmas")).json.find((x: any) => x.id === id).qtdAlunos, 28);
    assert.equal((await api("DELETE", `/turmas/${id}`)).status, 204);
    const [{ n }] = await sql("SELECT COUNT(*) AS n FROM carga_horaria WHERE turma_id = ?", [id]);
    assert.equal(n, 0);
    assert.equal((await api("PUT", "/turmas/999999", { corpo: { codigo: "X", curso: "Teste", turno: "TARDE", qtdAlunos: 1 } })).status, 404);
  });
});

// ---------------------------------------------------------------------------
describe("Geração automática da grade (RF008)", () => {
  test("CT48 diagnóstico do turno da manhã não aponta impedimentos; turno vazio aponta", async () => {
    const manha = await api("GET", "/grades/diagnostico?turno=MANHA&aulasPorDia=5");
    assert.equal(manha.status, 200);
    assert.deepEqual(manha.json.problemas, []);
    assert.ok(Array.isArray(manha.json.avisos));
    const tarde = await api("GET", "/grades/diagnostico?turno=TARDE");
    assert.ok(tarde.json.problemas.includes("Não há turmas cadastradas neste turno."));
  });

  test("CT49 diagnóstico com turno inválido dá 400", async () => {
    assert.equal((await api("GET", "/grades/diagnostico?turno=SABADO")).status, 400);
  });

  test("CT50 pedido de geração com parâmetros inválidos é recusado (400)", async () => {
    for (const corpo of [
      { turno: "MANHA", ano: 2026, semestre: 3, aulasPorDia: 5 },
      { turno: "MANHA", ano: 2026, semestre: 1, aulasPorDia: 9 },
      { turno: "MANHA", ano: 1999, semestre: 1, aulasPorDia: 5 },
    ]) {
      assert.equal((await api("POST", "/grades/gerar", { corpo })).status, 400, JSON.stringify(corpo));
    }
  });

  test("CT51 sem a chave da IA configurada, a geração avisa o que falta (503)", async () => {
    const chave = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      const r = await api("POST", "/grades/gerar", { corpo: { turno: "MANHA", ano: 2026, semestre: 2, aulasPorDia: 5 } });
      assert.equal(r.status, 503);
      assert.match(r.json.erro, /ANTHROPIC_API_KEY/);
    } finally {
      process.env.ANTHROPIC_API_KEY = chave;
    }
  });

  test("CT52 turno sem turmas não chega a chamar a IA: devolve os impedimentos (422)", async () => {
    const r = await api("POST", "/grades/gerar", { corpo: { turno: "TARDE", ano: 2026, semestre: 2, aulasPorDia: 5 } });
    assert.equal(r.status, 422);
    assert.ok(r.json.problemas.includes("Não há turmas cadastradas neste turno."));
  });

  test("CT53 geração roda em segundo plano: responde 202 na hora e o andamento é consultado pelo job", async () => {
    const r = await api("POST", "/grades/gerar", { corpo: { turno: "MANHA", ano: 2026, semestre: 2, aulasPorDia: 5 } });
    assert.equal(r.status, 202);
    assert.match(r.json.jobId, /^[0-9a-f-]{36}$/);
    // com a chave falsa a IA recusa a conexao: o job tem q terminar em "erro" sem derrubar o servidor
    let job: any;
    for (let i = 0; i < 120; i++) {
      job = (await api("GET", `/grades/jobs/${r.json.jobId}`)).json;
      if (job.status !== "executando") break;
      await new Promise((ok) => setTimeout(ok, 500));
    }
    assert.equal(job.status, "erro");
    assert.equal(typeof job.erro, "string");
    assert.equal((await sql("SELECT id FROM grade")).length, 0, "nenhuma grade é salva quando a IA falha");
    assert.equal((await api("GET", "/health")).status, 200, "o servidor continua no ar");
  });

  test("CT54 consultar job inexistente dá 404", async () => {
    assert.equal((await api("GET", "/grades/jobs/00000000-0000-0000-0000-000000000000")).status, 404);
  });
});

// ---------------------------------------------------------------------------
// pra testar consulta, publicacao e validacao sem depender da IA, o teste grava direto no banco
// tres grades do jeito q a IA gravaria: A e B sem conflito, C com um conflito
describe("Consulta, validação e publicação da grade (RF010, RF012, RF014)", () => {
  const g = { A: 0, B: 0, C: 0 };
  let mat = 0;

  before(async () => {
    const escola = await idDe("escola", "nome", "Uirapuru");
    const turma = await idDe("turma", "codigo", "1DS");
    mat = await idDe("disciplina", "sigla", "MAT");
    const por = await idDe("disciplina", "sigla", "POR");
    const joao = await idDe("professor", "nome", "João Silva");
    const maria = await idDe("professor", "nome", "Maria Santos");
    const sala = await idDe("sala", "nome", "Sala 101");
    const conflito = JSON.stringify([{ regra: "conflito-professor", mensagem: "João Silva em duas turmas ao mesmo tempo." }]);
    for (const [nome, violacoes] of [["A", "[]"], ["B", "[]"], ["C", conflito]] as const) {
      const [r]: any = await pool.query(
        `INSERT INTO grade (escola_id, turno, ano, semestre, aulas_por_dia, restricoes, violacoes, modelo, tentativas, criado_por)
         VALUES (?, 'MANHA', 2026, 2, 5, '[]', ?, 'teste', 1, 1)`, [escola, violacoes],
      );
      g[nome] = r.insertId;
      await pool.query("INSERT INTO grade_aula (grade_id, turma_id, disciplina_id, professor_id, sala_id, dia, ordem) VALUES ?", [[
        [r.insertId, turma, mat, joao, sala, 1, 0],
        [r.insertId, turma, por, maria, sala, 1, 1],
      ]]);
    }
  });

  test("CT55 lista as grades da escola com total de aulas e de conflitos", async () => {
    const r = await api("GET", "/grades");
    assert.equal(r.status, 200);
    assert.equal(r.json.length, 3);
    const c = r.json.find((x: any) => x.id === g.C);
    assert.equal(c.conflitos, 1);
    assert.equal(c.totalAulas, 2);
    assert.equal(c.status, "RASCUNHO");
  });

  test("CT56 detalhe da grade traz aulas, horários, nomes de turmas/professores/salas e métricas", async () => {
    const r = await api("GET", `/grades/${g.A}`);
    assert.equal(r.status, 200);
    assert.equal(r.json.aulas.length, 2);
    assert.equal(r.json.horarios.length, 5);
    assert.equal(r.json.intervalos.length, 5);
    assert.match(r.json.intervalos[0].inicio, /^\d\d:\d\d$/);
    assert.deepEqual(r.json.turmas.map((t: any) => t.codigo), ["1DS"]);
    assert.deepEqual(r.json.professores.map((p: any) => p.nome), ["João Silva", "Maria Santos"]);
    assert.deepEqual(r.json.salas.map((s: any) => s.nome), ["Sala 101"]);
    assert.ok(r.json.metricas && typeof r.json.metricas === "object");
  });

  test("CT57 grade inexistente dá 404", async () => {
    assert.equal((await api("GET", "/grades/999999")).status, 404);
  });

  test("CT58 publica uma grade sem conflitos (rascunho → publicada)", async () => {
    const r = await api("PATCH", `/grades/${g.A}/status`, { corpo: { status: "PUBLICADA" } });
    assert.equal(r.status, 200);
    const [row] = await sql("SELECT status FROM grade WHERE id = ?", [g.A]);
    assert.equal(row.status, "PUBLICADA");
  });

  test("CT59 publicar outra grade do mesmo turno e semestre arquiva a anterior", async () => {
    assert.equal((await api("PATCH", `/grades/${g.B}/status`, { corpo: { status: "PUBLICADA" } })).status, 200);
    const linhas = await sql("SELECT id, status FROM grade WHERE id IN (?) ORDER BY id", [[g.A, g.B]]);
    assert.deepEqual(linhas.map((l) => l.status), ["ARQUIVADA", "PUBLICADA"]);
  });

  test("CT60 grade com conflitos não pode ser publicada (409)", async () => {
    const r = await api("PATCH", `/grades/${g.C}/status`, { corpo: { status: "PUBLICADA" } });
    assert.equal(r.status, 409);
    assert.equal(r.json.erro, "Grade com conflitos não pode ser publicada. Gere novamente.");
  });

  test("CT61 status desconhecido é recusado (400)", async () => {
    assert.equal((await api("PATCH", `/grades/${g.C}/status`, { corpo: { status: "APROVADA" } })).status, 400);
  });

  test("CT62 revalidar a grade com o validador detecta a carga horária incompleta e grava os conflitos", async () => {
    const r = await api("POST", `/grades/${g.A}/validar`);
    assert.equal(r.status, 200);
    assert.ok(r.json.violacoes.some((v: any) => v.regra === "carga"));
    const [row] = await sql("SELECT JSON_LENGTH(violacoes) AS n FROM grade WHERE id = ?", [g.A]);
    assert.equal(row.n, r.json.violacoes.length);
  });

  test("CT63 o painel reflete as grades publicadas, os rascunhos e os conflitos", async () => {
    const t = (await api("GET", "/painel")).json.totais;
    assert.deepEqual([t.grades, t.publicadas, t.rascunhos, t.conflitos], [3, 1, 1, 1]);
  });

  test("CT64 não deixa excluir disciplina que está numa grade gerada (409)", async () => {
    const r = await api("DELETE", `/disciplinas/${mat}`);
    assert.equal(r.status, 409);
    assert.match(r.json.erro, /em uso/);
  });

  test("CT65 pedido de ajuste pela IA valida a mensagem (400) e a grade (404)", async () => {
    assert.equal((await api("POST", `/grades/${g.C}/ajustar`, { corpo: { mensagem: "" } })).status, 400);
    assert.equal((await api("POST", "/grades/999999/ajustar", { corpo: { mensagem: "Tire as aulas de sexta." } })).status, 404);
  });

  test("CT66 exclui a grade (204) e as aulas dela vão junto", async () => {
    assert.equal((await api("DELETE", `/grades/${g.C}`)).status, 204);
    const [{ n }] = await sql("SELECT COUNT(*) AS n FROM grade_aula WHERE grade_id = ?", [g.C]);
    assert.equal(n, 0);
    assert.equal((await api("DELETE", `/grades/${g.C}`)).status, 404);
  });
});

// ---------------------------------------------------------------------------
describe("Isolamento entre escolas (RNF005, RNF007)", () => {
  test("CT67 coordenador de outra escola começa com tudo vazio", async () => {
    const opts = { token: tokenOutraEscola };
    assert.deepEqual((await api("GET", "/professores", opts)).json, []);
    assert.deepEqual((await api("GET", "/disciplinas", opts)).json, []);
    assert.deepEqual((await api("GET", "/grades", opts)).json, []);
    const t = (await api("GET", "/painel", opts)).json.totais;
    assert.deepEqual([t.professores, t.turmas, t.disciplinas, t.salas], [0, 0, 0, 0]);
  });

  test("CT68 não consegue editar nem excluir disciplina de outra escola (404)", async () => {
    const mat = await idDe("disciplina", "sigla", "MAT");
    const opts = { token: tokenOutraEscola };
    assert.equal((await api("PUT", `/disciplinas/${mat}`, { ...opts, corpo: { nome: "Invadida", sigla: "X", exigeLaboratorio: false } })).status, 404);
    assert.equal((await api("DELETE", `/disciplinas/${mat}`, opts)).status, 404);
    const [d] = await sql("SELECT nome FROM disciplina WHERE id = ?", [mat]);
    assert.equal(d.nome, "Matemática");
  });

  test("CT69 não consegue ver nem publicar grade de outra escola (404)", async () => {
    const [grade] = await sql("SELECT id FROM grade LIMIT 1");
    const opts = { token: tokenOutraEscola };
    assert.equal((await api("GET", `/grades/${grade.id}`, opts)).status, 404);
    assert.equal((await api("PATCH", `/grades/${grade.id}/status`, { ...opts, corpo: { status: "ARQUIVADA" } })).status, 404);
  });

  test("CT70 não consegue usar disciplina de outra escola no cadastro de professor (400)", async () => {
    const mat = await idDe("disciplina", "sigla", "MAT");
    const r = await api("POST", "/professores", { token: tokenOutraEscola, corpo: { nome: "Prof. Outra Escola", email: "p@outra.sp.gov.br", disciplinaIds: [mat] } });
    assert.equal(r.status, 400);
  });

  test("CT71 escolas diferentes podem ter disciplinas com o mesmo nome (201)", async () => {
    const r = await api("POST", "/disciplinas", { token: tokenOutraEscola, corpo: { nome: "Matemática", sigla: "MAT", exigeLaboratorio: false } });
    assert.equal(r.status, 201);
  });
});

// ---------------------------------------------------------------------------
describe("Tratamento de erros gerais", () => {
  test("CT72 rota inexistente dá 404", async () => {
    assert.equal((await api("GET", "/rota-que-nao-existe", { token: null })).status, 404);
  });

  test("CT73 corpo com JSON mal formado dá 400 com mensagem, não erro interno", async () => {
    const r = await api("POST", "/auth/login", { bruto: '{"email": "maria.costa@etec.sp.gov.br", "senha": ', token: null });
    assert.equal(r.status, 400);
    assert.equal(typeof r.json?.erro, "string");
  });

  test("CT74 corpo maior que o limite de 1 MB dá 413 com mensagem, não erro interno", async () => {
    const r = await api("POST", "/disciplinas", { corpo: { nome: "x".repeat(1_100_000), sigla: "X", exigeLaboratorio: false } });
    assert.equal(r.status, 413);
    assert.equal(typeof r.json?.erro, "string");
  });
});

// ---------------------------------------------------------------------------
describe("Desempenho (RNF010)", () => {
  test("CT75 todas as requisições feitas nos testes responderam em menos de 2 segundos", () => {
    const lentas = tempos.filter((t) => t.ms >= 2000);
    assert.deepEqual(lentas, []);
  });
});
