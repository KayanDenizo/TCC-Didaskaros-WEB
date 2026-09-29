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
│   ├── grades.ts         → gerar, listar, publicar, revalidar e excluir grades
│   └── painel.ts         → números do Painel Principal
├── grade/
│   ├── claude.ts         → integração com a API da Claude
│   ├── validador.ts      → confere os conflitos (independente da IA)
│   ├── validador.test.ts → testes automatizados do validador
│   └── tipos.ts          → tipos compartilhados e cálculo dos horários do turno
└── scripts/setup-db.ts   → cria o banco e insere dados de exemplo

database/schema.sql       → modelo de dados (DDL)
```

---

## 1. Banco de dados

Arquivo: `database/schema.sql`. São 11 tabelas:

| Tabela | O que guarda |
|---|---|
| `unidade` | A ETEC ou FATEC. Todo dado do sistema pertence a uma unidade. |
| `coordenador` | Quem faz login (senha armazenada com hash bcrypt), dados pessoais e funcionais. |
| `disciplina` | Nome, sigla e se exige laboratório. |
| `sala` | Sala comum ou laboratório, e a capacidade de alunos. |
| `professor` | Nome, contato e pontuação CPS (prioridade na atribuição de aulas). |
| `habilitacao` | Quais disciplinas cada professor pode lecionar. |
| `indisponibilidade` | Horários (turno, dia, aula) em que o professor **não pode** dar aula. |
| `turma` | Código (ex.: 3DS), curso, turno e quantidade de alunos. |
| `carga_horaria` | Quantas aulas semanais cada disciplina tem em cada turma, e o professor (opcional, se já estiver definido). |
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
| POST | `/api/auth/cadastro` | Cadastra um coordenador. Cria a unidade se ela ainda não existir. |
| GET | `/api/auth/me` | Devolve os dados de quem está logado. |

- Todas as demais rotas exigem o cabeçalho `Authorization: Bearer <token>`.
- O token carrega o id do coordenador e da unidade; cada coordenador só enxerga os dados
  da própria unidade.

---

## 3. Cadastros (`routes/cadastros.ts`)

Cada recurso tem as quatro operações: `GET` (listar), `POST` (criar), `PUT /:id` (editar)
e `DELETE /:id` (excluir).

| Rota | Particularidades |
|---|---|
| `/api/disciplinas` | CRUD simples. |
| `/api/salas` | CRUD simples. |
| `/api/professores` | Habilitações e indisponibilidades são salvas junto, numa transação (grava tudo ou nada). |
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

Além disso, calcula **métricas de qualidade** (restrições moles): número de janelas nas
grades das turmas e dos professores.

**Testes:** `validador.test.ts` tem 13 testes automatizados (um caso válido e um caso para
cada tipo de violação, além de viabilidade, métricas e horários). Rodar com `npm test`.

---

## 6. Gestão das grades (`routes/grades.ts`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/grades` | Lista as grades com total de aulas, turmas e conflitos. |
| GET | `/api/grades/:id` | Grade completa: aulas, horários, métricas, conflitos, observações da IA e nomes de turmas, professores, salas e disciplinas. |
| PATCH | `/api/grades/:id/status` | Publica, arquiva ou volta para rascunho. |
| POST | `/api/grades/:id/validar` | Revalida a grade contra os cadastros atuais. |
| DELETE | `/api/grades/:id` | Exclui a grade. |

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

Calculados em `grade/tipos.ts`: aulas de 50 minutos com intervalo de 10 minutos após a
3ª aula. Início: manhã 07:30, tarde 13:00, noite 19:00.
Exemplo (manhã, 5 aulas): 07:30, 08:20, 09:10, 10:10, 11:00.

---

## 9. Dados de exemplo (`npm run db:setup`)

Recria o banco (**apaga o existente**) e insere a ETEC Uirapuru com:
- Coordenadora Maria Costa — login `maria.costa@etec.sp.gov.br` / senha `didaskaros123`
- 12 disciplinas (3 exigem laboratório), 6 salas (2 laboratórios)
- 10 professores com habilitações, pontuação CPS e algumas indisponibilidades
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
