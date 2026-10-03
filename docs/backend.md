# Backend do Didáskaros

Documentação do que foi implementado no backend: estrutura, banco de dados, rotas da API
e o fluxo de geração de grade com a Claude.

**Tecnologias:** Node.js 20.19+, Express 5, TypeScript, MySQL 8 / MariaDB (driver `mysql2`),
Zod (validação), JWT + bcryptjs (autenticação) e `@anthropic-ai/sdk` (API da Claude).

---

## Estrutura de pastas

```
backend/src/
├── server.ts, app.ts     → sobe a API e registra as rotas (/api/...)
├── env.ts                → lê as configurações do .env
├── db.ts                 → pool de conexões MySQL, helpers select/exec e transações
├── http.ts               → validação com Zod e tratamento de erros (mensagens em português)
├── auth.ts               → login, cadastro de coordenador e middleware de autenticação
├── routes/
│   ├── cadastros.ts      → disciplinas, salas, professores e turmas
│   ├── grades.ts         → gerar, diagnosticar, ajustar com a IA, listar, publicar, revalidar e excluir grades
│   └── painel.ts         → números do Painel Principal
├── grade/
│   ├── claude.ts         → integração com a API da Claude
│   ├── validador.ts      → confere os conflitos (independente da IA)
│   ├── validador.test.ts → testes automatizados do validador
│   └── tipos.ts          → tipos compartilhados e cálculo dos horários do turno
└── scripts/setup-db.ts   → cria o banco e insere dados de exemplo

database/db.sql           → modelo de dados (DDL)
```

---

## 1. Banco de dados

Arquivo: `database/db.sql`. Segue o modelo entidade-relacionamento do projeto
(Escola, Curso, Aluno, Professor, Turma, Disciplina e o relacionamento Leciona). São 13 tabelas:

| Tabela | O que guarda |
|---|---|
| `escola` | A ETEC ou FATEC (código, nome, município, e-mail, telefone). Todo dado do sistema pertence a uma escola. |
| `curso` | Cursos oferecidos pela escola. |
| `aluno` | RM, CPF, nome, e-mail e a turma do aluno. |
| `coordenador` | Quem faz login na web (senha armazenada com hash bcrypt), curso, dados pessoais e funcionais. |
| `disciplina` | Nome, sigla e se exige laboratório. |
| `sala` | Sala comum ou laboratório, e a capacidade de alunos. |
| `professor` | Código, nome, CPF, contato, pontuação CPS e tipo de contrato (indeterminado/determinado) — juntos definem a ordem na atribuição de aulas. |
| `habilitacao` | Quais disciplinas cada professor pode lecionar. |
| `indisponibilidade` | Horários (turno, dia, aula) em que o professor **não pode** dar aula. |
| `preferencia` | Horários que o professor **prefere** ou prefere **evitar** (restrição mole). |
| `compromisso_externo` | Dia e hora em que o professor trabalha em outra unidade — entra nas regras de jornada. |
| `turma` | Código (ex.: 3DS), curso, turno e quantidade de alunos. |
| `carga_horaria` | Relacionamento Leciona: quantas aulas semanais cada disciplina tem em cada turma, e o professor (opcional, se já estiver definido). |
| `grade` | A grade gerada: turno, ano, semestre, status (rascunho / publicada / arquivada), preferências usadas, explicação da IA, conflitos encontrados, modelo e número de tentativas. |
| `grade_aula` | Cada aula da grade: turma, disciplina, professor, sala, dia e horário. |

Convenções:
- `dia`: 0 = segunda … 4 = sexta. `ordem`: posição da aula no turno (0 = primeira).
- Chaves estrangeiras garantem integridade: não é possível excluir um professor, turma ou
  sala que já aparece em uma grade gerada.

---

## 2. Autenticação (`auth.ts`)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/login` | Confere e-mail e senha e devolve um token JWT (8 horas, ou 30 dias com "manter conectado"). |
| POST | `/api/auth/cadastro` | Cadastra um coordenador. Cria a escola e o curso se ainda não existirem. |
| GET | `/api/auth/me` | Devolve os dados de quem está logado. |

- Todas as demais rotas exigem o cabeçalho `Authorization: Bearer <token>`.
- O token carrega o id do coordenador e da escola; cada coordenador só enxerga os dados
  da própria escola.

---

## 3. Cadastros (`routes/cadastros.ts`)

Cada recurso tem as quatro operações: `GET` (listar), `POST` (criar), `PUT /:id` (editar)
e `DELETE /:id` (excluir).

| Rota | Particularidades |
|---|---|
| `/api/disciplinas` | CRUD simples. |
| `/api/salas` | CRUD simples. |
| `/api/professores` | Habilitações, indisponibilidades, preferências e compromissos externos são salvos junto, numa transação (grava tudo ou nada). |
| `/api/turmas` | A carga horária é salva junto, numa transação. |

- Os dados de entrada são validados com Zod; erros voltam com mensagem legível (HTTP 400).
- Registros duplicados retornam HTTP 409; exclusão de registro em uso também retorna 409
  com explicação.

---

## 4. Geração da grade com a Claude

### Fluxo

1. **`POST /api/grades/gerar`** recebe turno, ano, semestre, aulas por dia e preferências
   da coordenação.
2. **Verificação de viabilidade** (antes de chamar a IA): detecta problemas impossíveis de
   resolver — turma com mais aulas que horários, disciplina sem professor habilitado,
   disciplina de laboratório sem laboratório cadastrado, turma maior que todas as salas.
   Se houver, responde HTTP 422 com a lista de problemas.
3. A API **responde imediatamente** com um id de acompanhamento (HTTP 202). A geração
   continua em segundo plano, porque pode levar minutos.
4. **`claude.ts`** envia à Claude todos os dados do turno (turmas, carga horária,
   professores, salas e preferências). A resposta vem em JSON estruturado, com formato
   fixo (lista de aulas + observações).
5. **`validador.ts`** confere a grade devolvida.
6. Se houver violações, a lista de erros volta para a Claude corrigir — **até 3 tentativas**.
   A melhor tentativa (com menos violações) é salva.
7. O frontend acompanha o andamento por **`GET /api/grades/jobs/:id`**
   (etapa atual, tentativa e tempo decorrido).

### Por que a grade inteira do turno de uma vez

As turmas de um turno disputam os mesmos professores e laboratórios. Gerar uma turma por vez
faria a ordem de geração decidir quem fica com os piores horários.

### Configuração (`backend/.env`)

| Variável | Uso |
|---|---|
| `ANTHROPIC_API_KEY` | Chave da API (obrigatória para gerar grades). |
| `CLAUDE_MODEL` | Modelo usado (padrão: `claude-opus-5-5`). |
| `CLAUDE_EFFORT` | Nível de esforço do modelo (padrão: `high`). |

Detalhes técnicos da chamada: streaming (evita timeout em respostas longas), saída
estruturada com schema Zod e fallback automático para outro modelo caso a Claude recuse a
requisição por engano. Erros da API (chave inválida, limite de uso, sem conexão) viram
mensagens em português para o usuário.

---

## 5. Validador independente (`grade/validador.ts`)

É a peça central da garantia de "zero conflitos": foi escrito **separado da IA**, de modo
que um erro do modelo nunca passa despercebido.

Restrições duras verificadas:

| Regra | O que confere |
|---|---|
| `conflito-turma` | A turma não tem duas aulas no mesmo horário. |
| `conflito-professor` | O professor não está em duas turmas ao mesmo tempo. |
| `conflito-sala` | A sala não recebe duas turmas ao mesmo tempo. |
| `carga` | Cada disciplina recebe exatamente as aulas semanais da carga horária. |
| `habilitacao` | O professor é habilitado para a disciplina. |
| `atribuicao` | Se a carga já define o professor, ele é respeitado. |
| `professor-unico` | A disciplina de uma turma é dada pelo mesmo professor a semana toda. |
| `indisponibilidade` | O professor não é alocado em horário em que está indisponível. |
| `laboratorio` | Disciplina que exige laboratório fica em laboratório. |
| `capacidade` | A sala comporta a quantidade de alunos da turma. |
| `horario` | A aula está dentro da grade de horários do turno. |
| `referencia` | Turma, disciplina, professor e sala existem. |
| `compromisso-externo` | A aula não coincide com compromisso do professor em outra unidade. |
| `interjornada` | No mínimo 11h entre o fim de um dia de trabalho e o início do seguinte. |
| `jornada-diaria` | No máximo 8h de trabalho por dia. |
| `refeicao` | Dia acima de 6h tem pausa de pelo menos 1h. |
| `limite-semanal` | No máximo 30 aulas na semana. |

### Regras de jornada do CPS

As cinco últimas regras somam as aulas desta grade com o que o professor já tem nos
**outros turnos** (a grade publicada de cada turno do mesmo semestre ou, se não houver, o
rascunho mais recente) e nos **compromissos externos**. Cada hora-aula conta como 60 min,
porque é assim que o CPS remunera (LC 1.044/2008, art. 20). Os valores ficam em
`REGRAS_CPS` (`grade/tipos.ts`).

| Regra | Fonte |
|---|---|
| 11h entre jornadas, 1h de refeição, 8h por dia | Memorandos de atribuição de aulas das ETECs (com base na Portaria CETEC 1.263/2017 e na CLT) |
| Indeterminado antes de determinado, depois maior pontuação | Deliberação CEETEPS 23/2015 e Portaria CETEC 1.263/2017 |
| 30 aulas por semana (40h com 30% de hora-atividade) | Fonte secundária: **confirmar com a unidade** |

Janelas na grade do professor não têm regra oficial: são tratadas como restrição mole.

Além disso, calcula **métricas de qualidade** (restrições moles): número de janelas nas
grades das turmas e dos professores.

**Testes:** `validador.test.ts` tem 20 testes automatizados (um caso válido e um caso para
cada tipo de violação, incluindo as regras de jornada, além de viabilidade, métricas e horários). Rodar com `npm test`.

---

## 6. Gestão das grades (`routes/grades.ts`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/grades` | Lista as grades com total de aulas, turmas e conflitos. |
| GET | `/api/grades/:id` | Grade completa: aulas, horários, métricas, conflitos, observações da IA e nomes de turmas, professores, salas e disciplinas. |
| PATCH | `/api/grades/:id/status` | Publica, arquiva ou volta para rascunho. |
| POST | `/api/grades/:id/validar` | Revalida a grade contra os cadastros atuais. |
| DELETE | `/api/grades/:id` | Exclui a grade. |
| GET | `/api/grades/diagnostico?turno=&aulasPorDia=` | O que falta nos cadastros do turno: `problemas` (impedem gerar) e `avisos`. |
| POST | `/api/grades/:id/ajustar` | Conversa com a Didáskaros IA sobre a grade (`mensagem`, `historico`). Responde com um job; se a IA alterar a grade, o job traz `gradeId` da nova versão (rascunho) e `resposta`. |

Regras de publicação:
- **Grade com conflito não pode ser publicada** (HTTP 409).
- Só existe uma grade publicada por turno/semestre: ao publicar uma nova, a anterior é
  arquivada automaticamente, mantendo o histórico.

---

## 7. Painel (`routes/painel.ts`)

`GET /api/painel` devolve:
- Totais: professores, turmas, disciplinas, salas, grades (publicadas e rascunhos) e
  conflitos pendentes nos rascunhos.
- Aulas de hoje, a partir das grades publicadas.
- As 5 grades mais recentes.
- Aulas semanais de cada professor nas grades publicadas.

---

## 8. Horários do turno

Calculados em `grade/tipos.ts`: aulas de 50 minutos no diurno e 45 minutos à noite, com
intervalo de 10 minutos após a 3ª aula. Início: manhã 07:30, tarde 13:00, noite 19:00.
Exemplo (manhã, 5 aulas): 07:30, 08:20, 09:10, 10:10, 11:00.

---

## 9. Dados de exemplo (`npm run db:setup`)

Recria o banco (**apaga o existente**) e insere a ETEC Uirapuru com:
- Coordenadora Maria Costa — login `maria.costa@etec.sp.gov.br` / senha `didaskaros123`
- 12 disciplinas (3 exigem laboratório), 6 salas (2 laboratórios)
- 10 professores com habilitações, pontuação CPS, contrato, algumas indisponibilidades,
  preferências de horário e dois compromissos em outras unidades
- 4 turmas (1DS, 2DS e 3DS de manhã; 2INFO à noite) com carga horária

---

## 10. Como rodar

```bash
cd backend
npm install
cp .env.example .env   # ajuste DB_*, JWT_SECRET e ANTHROPIC_API_KEY
npm run db:setup       # cria o banco com dados de exemplo
npm run dev            # API em http://localhost:3333/api
npm test               # testes do validador
```
