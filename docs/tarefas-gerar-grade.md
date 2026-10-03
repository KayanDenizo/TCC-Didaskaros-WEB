# Gerar Grade — lista de tarefas

Plano de trabalho para o núcleo do Didáskaros: gerar a grade horária de uma unidade
ETEC inteira, com múltiplos cursos, respeitando as regras do Centro Paula Souza.

**Estado atual:** backend (Express + MySQL), banco (`database/db.sql`) e frontend
ligados. A geração por turno funciona com a API da Claude + validador independente.

**Decisão de arquitetura (revisada):** a grade é montada pela **Claude** (API da Anthropic,
saída JSON estruturada), e toda saída passa por um **validador independente** escrito em
código (`backend/src/grade/validador.ts`) que confere cada restrição dura. As violações
encontradas voltam para o modelo corrigir (até 3 tentativas); grade com conflito não pode
ser publicada. Assim o "zero conflitos" é garantido pelo validador, não pela palavra do modelo.

Risco conhecido: em escala real (~1.000 aulas semanais, ~40 turmas) o LLM pode não fechar
uma grade sem conflitos em 3 tentativas. Se isso acontecer nos testes da Fase 7, a opção
original continua válida: trocar o gerador por um **solver de restrições** (OR-Tools CP-SAT
ou Timefold) mantendo o mesmo validador e o mesmo contrato de entrada/saída — a Claude
passaria a atuar só nas pontas (Fase 8). Registrar essa comparação no TCC.

---

## Fase 0 — Definições (antes de escrever código)

Estas respostas mudam o modelo inteiro. Vale gastar uma conversa com a coordenação da
unidade antes de qualquer tabela.

- [x] **A atribuição por pontuação CPS acontece antes ou junto com a grade?**
      **Antes** (Deliberação CEETEPS 23/2015): manutenção → recomposição → ampliação, cada
      etapa por classificação (indeterminado antes de determinado, depois pontuação).
      Se o professor já recebe as aulas dele por ordem de pontuação e só depois se monta o
      horário, então a alocação professor↔disciplina é *entrada*, não variável do solver —
      o problema fica bem menor. Se for junto, a pontuação vira restrição de prioridade
      dentro da otimização. **Bloqueia a Fase 1.**
- [ ] Levantar o tamanho real da unidade: quantas turmas, cursos, professores, salas e
      laboratórios, por turno.
- [ ] Mapear a grade de horários real: quantas aulas por turno, duração, intervalo,
      se algum curso tem horário diferente dos outros.
- [ ] Listar os recursos escassos e disputados (lab de informática, cozinha pedagógica,
      lab de nutrição, quadra) e quais disciplinas os exigem obrigatoriamente.
- [ ] Definir a regra para professor que leciona em mais de uma unidade: existe tempo
      mínimo de deslocamento entre escolas? Ele declara disponibilidade ou ela é imposta?
- [ ] Definir o que acontece quando **não existe grade viável**: o sistema recusa,
      entrega parcial, ou relaxa restrições moles sozinho?

---

## Fase 1 — Modelo de dados

- [x] Criar o projeto `backend/` (Node + Express + TypeScript) e `database/`.
- [x] Modelar e migrar as tabelas base:
      `unidade`, `curso`, `turma`, `disciplina`, `professor`, `sala`, `turno`,
      `horario` (os slots da semana).
- [x] `carga_horaria`: quantas aulas semanais cada disciplina tem em cada turma.
      É o que define quantos blocos o solver precisa colocar.
- [x] `habilitacao`: quais disciplinas cada professor pode lecionar.
- [ ] `pontuacao_cps` do professor, com a data-base da pontuação (ela muda por semestre).
- [x] **`compromisso_externo`**: horários em que o professor está ocupado *fora desta
      unidade*. Tratar como entidade de primeira classe desde o começo, mesmo que no TCC
      só uma unidade seja resolvida — é o que impede o mesmo professor de ser alocado às
      09:10 em duas ETECs.
- [x] `disponibilidade` e `preferencia` do professor (o que ele *não pode* vs. o que ele
      *prefere* — vão para baldes diferentes de restrição).
- [ ] `requisito_sala`: disciplina que exige laboratório específico.
- [x] `grade` e `grade_aula`: a grade gerada, com status (rascunho / publicada /
      arquivada) e versionamento, para permitir regerar sem perder a anterior.
- [ ] Seed com dados fictícios **em escala real** (~40 turmas, ~100 professores).
      Testar solver com 4 turmas não prova nada.

---

## Fase 2 — Catálogo de restrições

Documento antes de código: é o coração do TCC e o que a banca vai cobrar.

- [ ] Escrever as **restrições duras** (violou = grade inválida):
      professor em um lugar só por horário; sala em uma turma só por horário; turma com
      uma aula só por horário; carga horária de cada disciplina cumprida integralmente;
      professor só leciona o que é habilitado a lecionar; disciplina de laboratório só em
      sala compatível; indisponibilidade do professor respeitada; compromisso externo
      respeitado; ordem de prioridade da pontuação CPS.
- [ ] Escrever as **restrições moles** (violou = grade pior, não inválida), cada uma com
      um peso justificado: evitar janelas na grade do professor; respeitar preferências de
      horário; agrupar aulas da mesma disciplina; manter a turma na mesma sala; evitar
      teórica no último horário; distribuir a carga do professor ao longo da semana.
- [ ] Definir a **função objetivo**: como os pesos se somam e o que significa
      "grade melhor". Registrar por que cada peso tem o valor que tem.
- [ ] Conferir cada restrição contra a lista que já está na etapa 2 do wizard atual
      (`CONSTRAINTS` em `data.tsx`) e reconciliar as duas.

---

## Fase 3 — Serviço solver

- [ ] Escolher entre **OR-Tools CP-SAT** (microserviço Python) e **Timefold** (Java).
      Registrar a justificativa no TCC.
- [ ] Definir o contrato JSON de entrada e saída, independente do Express.
- [ ] Implementar o modelo: variáveis, restrições duras, objetivo com as moles.
- [ ] Rodar **standalone**, por linha de comando, com um fixture — antes de qualquer
      integração com backend ou tela. Não integrar enquanto não resolver bem no isolado.
- [ ] Medir tempo de solve na escala real e definir um limite (ex.: para em 5 min e
      devolve a melhor solução encontrada até ali).
- [ ] Tratar o caso inviável: identificar e devolver *quais* restrições estão em conflito,
      não só "não deu".

---

## Fase 4 — Backend

- [x] Endpoints CRUD do que a Fase 1 modelou.
- [x] `POST /grades/gerar` — dispara a geração; responde na hora com um id de job,
      nunca segura a requisição até o solver terminar.
- [x] Fila de jobs + `GET /grades/jobs/:id` com status e progresso.
- [x] Montar o payload do solver a partir do banco e persistir o resultado em
      `grade` / `grade_aula`.
- [x] Publicar / arquivar grade, mantendo o histórico de versões.
- [x] Autenticação: só coordenador acessa (JWT + bcrypt, como já previsto no README).

---

## Fase 5 — Validador independente

- [x] Escrever um verificador **separado do solver** que recebe uma grade pronta e aponta
      toda violação de restrição dura.
- [x] Rodar o validador em cima de toda saída do solver, sempre.
      Solver e validador escritos separadamente é o que garante que um bug de modelagem
      não passe silencioso — e é o número que você mostra na defesa.
- [ ] Usar o validador também para conferir grades editadas à mão pelo coordenador.

---

## Fase 6 — Frontend

- [x] **Trocar o wizard de "por turma" para "por turno / unidade".** Hoje o passo 1 pede
      uma turma, e isso não funciona: turmas disputam os mesmos professores e laboratórios,
      então gerar uma de cada vez faz a ordem de geração decidir quem fica com os horários
      ruins. Gera-se o turno inteiro de uma vez e navega-se turma a turma depois.
- [x] Substituir o `setTimeout` de 2s por acompanhamento real do job, com progresso —
      o solve leva de segundos a minutos.
- [x] Trazer de volta a tela de visualização das grades (o HTML está preservado em
      `design/ver-grades/VerGrades.html`), agora ligada à API.
- [x] Fazer os filtros **Por Turma / Por Professor / Por Sala** funcionarem de verdade:
      com 40+ turmas eles deixam de ser enfeite e viram a navegação principal.
- [ ] Tela de conflitos e inviabilidade: mostrar o que impediu a grade de fechar e
      o que dá para afrouxar.
- [ ] Edição manual de célula, com o validador rodando a cada alteração.
- [x] Ligar os botões "Ver Grades" e "Ver grade completa" do Painel Principal, que hoje
      estão inertes.

---

## Fase 7 — Avaliação

- [ ] Definir métricas de qualidade: nº de janelas, preferências atendidas,
      violações de restrição mole, tempo de solve.
- [ ] Comparar a grade gerada com uma grade real montada à mão pela coordenação.
      É a evidência mais forte que o TCC pode ter.
- [ ] Testar em cenários difíceis: professor com pouca disponibilidade, laboratório
      disputado por vários cursos, semestre com falta de professor.

---

## Fase 8 — IA generativa (diferencial, opcional)

Só depois que o solver funcionar. O LLM escreve a *entrada* do solver e lê a *saída* —
nunca escreve a grade.

- [ ] Texto livre → restrição estruturada: *"o João dá aula em Sorocaba nas sextas de
      manhã, só chega depois das 14h"* vira uma regra formal, que o coordenador confirma
      antes de entrar no solver.
- [ ] Explicar a grade em linguagem natural: "por que a Física ficou na quinta?".
- [ ] Explicar a inviabilidade e sugerir o que relaxar para fechar.
- [ ] Ajuste conversacional: "troca a aula de quinta da 3DS" vira um re-solve com
      aquela célula fixada.

---

## Fora de escopo do TCC

- [ ] Resolver **várias ETECs de uma vez**. O modelo de dados já suporta (via
      `compromisso_externo`), mas a resolução conjunta é problema de produto comercial.
      Deixar escrito como trabalho futuro.
- [ ] Acesso de professor e aluno — só a coordenação usa a web.
