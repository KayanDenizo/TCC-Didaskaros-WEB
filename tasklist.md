# Tasklist

Ideias anotadas para fazer depois.

## Garantir a pontuação CPS na geração de grade

Hoje a pontuação CPS e o tipo de contrato só aparecem como **instrução no prompt** da Claude
(`backend/src/grade/claude.ts`, linhas 51–53 e 57). O validador (`backend/src/grade/validador.ts`)
não olha `pontuacaoCps` nem `contrato`. Então uma grade que dê a aula a um professor
DETERMINADO de pontuação menor, havendo um INDETERMINADO habilitado e livre, passa sem erro.

Regra (Deliberação CEETEPS 23/2015): contrato INDETERMINADO antes de DETERMINADO e, dentro
de cada grupo, maior pontuação CPS primeiro.

Escolher **uma** das duas opções:

- [ ] **Opção A: checar no validador.**
      Em `validador.ts`, para cada carga sem `professorId`, ver se o professor escolhido
      "furou a fila": se existe outro professor habilitado para a disciplina, mais bem
      classificado, que estaria livre em todos os horários dessa disciplina sem quebrar
      nenhuma regra dura (indisponibilidade, ocupações, jornada, limite semanal).
      Se existir, gerar uma violação do tipo `classificacao`, e a Claude corrige no
      ciclo de reparo que já existe.
      - Prós: muda pouco, a Claude continua livre para equilibrar a grade.
      - Contras: o "estaria livre" é caro e ambíguo (o outro professor poderia ficar livre
        se outras aulas mudassem), o que pode gerar falsos positivos.

- [ ] **Opção B: atribuir no backend antes de chamar a Claude** (recomendada).
      Criar uma etapa de atribuição (ex.: `backend/src/grade/atribuicao.ts`) que percorre
      as cargas sem `professorId` e escolhe o professor pela ordem de classificação,
      respeitando habilitação, limite semanal de aulas e indisponibilidades. A Claude passa
      a receber todas as cargas com `professorId` e só monta os horários (a regra 5 já
      obriga a usar o professor dado).
      - Prós: a regra fica garantida por código e é fácil de explicar no TCC. O problema da
        Claude fica menor, o que deve dar menos erros e respostas mais rápidas.
      - Contras: a atribuição não enxerga os horários. Pode cair num professor bem
        classificado que depois não cabe na grade, então tem que haver fallback para o
        próximo da fila quando a geração falhar por jornada ou indisponibilidade.
      - Bate com o que já foi decidido em `docs/tarefas-gerar-grade.md` (Fase 0): a
        atribuição acontece **antes** da grade.

Depois de escolher:

- [ ] Testes em `validador.test.ts` (opção A) ou um `atribuicao.test.ts` novo (opção B),
      cobrindo: indeterminado vence determinado, desempate por pontuação, professor no limite
      semanal é pulado, professor indisponível é pulado.
- [ ] Mostrar na tela de geração qual professor foi atribuído e por quê (posição na
      classificação), para a coordenação conferir.
- [ ] Ajustar o prompt em `claude.ts` (remover ou simplificar as linhas 51–53 se for a opção B).
- [ ] Atualizar `docs/backend.md` (seção "Regras de jornada do CPS").

## Tela de notificações (coordenador → professores e alunos)

O coordenador escreve um aviso na web, escolhe o tipo e para quem vai, e envia. O aviso fica
salvo no banco. Na web é só o envio e o histórico; quem vai **ler** os avisos é o app mobile,
que vem depois. Por isso a API de leitura já tem que ficar pronta e documentada.

### Banco (`database/db.sql` + `backend/src/scripts/setup-db.ts`)

- [ ] Tabela `notificacao`: `id`, `escola_id`, `coordenador_id` (quem enviou), `tipo`,
      `titulo`, `mensagem` (TEXT), `criada_em`.
- [ ] Tipos de aviso como ENUM, ex.: `GERAL`, `URGENTE`, `GRADE_HORARIA` (grade nova ou
      alterada), `EVENTO`, `PROVA`, `REUNIAO`, `CANCELAMENTO_AULA`. Fechar a lista com a
      coordenação.
- [ ] Destinatários: tabela `notificacao_destino` (`notificacao_id`, `publico` =
      `PROFESSORES` / `ALUNOS` / `TODOS`, `turma_id` NULL = a escola toda). Assim dá para
      mandar "só para os alunos do 3DS" ou "para todos os professores".
- [ ] Leitura (para o mobile): tabela `notificacao_leitura` (`notificacao_id`, `professor_id`
      ou `aluno_id`, `lida_em`), para mostrar "não lida" no app e "lida por X de Y" na web.
- [ ] Incluir alguns avisos de exemplo no `db:setup`.

### Backend (`backend/src/routes/notificacoes.ts`)

- [ ] `POST /api/notificacoes`: só coordenador. Validar com zod (`tipo`, `titulo`,
      `mensagem` com limite de tamanho, destinatários) e gravar numa transação.
- [ ] `GET /api/notificacoes`: histórico enviado pela unidade do coordenador, com filtro
      por tipo e paginação.
- [ ] `DELETE /api/notificacoes/:id`: apagar ou cancelar um aviso enviado por engano.
- [ ] Rotas para o mobile, já pensando no login de professor/aluno:
      `GET /api/minhas-notificacoes` (filtra pelo público e pela turma de quem está logado)
      e `POST /api/minhas-notificacoes/:id/lida`.
- [ ] Testes em `api.e2e.ts`: coordenador envia, aluno de outra turma não recebe, professor
      não consegue enviar.

### Frontend web (`frontend/didaskaros/src/pages/Notificacoes.tsx`)

- [ ] Formulário: seletor de **tipo de aviso** (com cor ou ícone por tipo), escolha de
      **destinatários** (professores / alunos / todos + turma opcional), título e uma **box de
      mensagem** (textarea com contador de caracteres) e botão **Enviar**.
- [ ] Confirmação antes de enviar ("Enviar para 120 alunos do 3DS?") e toast de sucesso.
- [ ] Lista dos avisos já enviados ao lado/abaixo: tipo, título, destinatários, data e
      contagem de leitura quando o mobile existir.
- [ ] Tipos novos em `src/api/types.ts`.

- [  ] Adicionar funcionalidade de clicar no perfil canto inferior esquerdo vai pra tela de perfil

### Mobile (depois)

- [ ] Documentar as rotas `minhas-notificacoes` em `docs/backend.md` para o app consumir.
- [ ] No app: lista de avisos com badge de não lidos, filtro por tipo e marcar como lido ao abrir.
- [ ] Futuro: notificação push (ex.: Firebase Cloud Messaging), o que exige guardar o token do
      aparelho por usuário (tabela `dispositivo`).

## Telas de login e cadastro

Hoje **não existe tela de login**. O `AuthContext.tsx` faz um *login provisório* automático com a
coordenadora de exemplo (`maria.costa@etec.sp.gov.br`), e o comentário lá diz que a tela de login
estava com a Julia, então combinar antes de começar. O backend já está pronto: `POST /api/auth/login`,
`POST /api/auth/cadastro` e `GET /api/auth/me` em `backend/src/auth.ts`.

Designs já feitos: `design/login/Login.html`, `design/cadastro/.../Didaskaros Login.dc.html`,
`design/cadastro/.../Cadastrar Coordenador.dc.html` e `design/recuperar-senha/RecuperarSenha.html`.

### Login (`frontend/didaskaros/src/pages/Login.tsx`)

- [ ] Fazer a tela seguindo o `design/login/Login.html`: e-mail, senha (com botão de mostrar),
      "manter conectado", botão Entrar, link "Esqueci minha senha" e link para o cadastro.
- [ ] Ligar no `POST /api/auth/login` e chamar `entrar(token, usuario, manterConectado)` do
      `AuthContext`. Mandar `manterConectado` para a API (o token passa de 8h para 30 dias).
- [ ] Mostrar o erro da API ("E-mail ou senha incorretos.") e desativar o botão enquanto envia.
- [ ] Rota pública `/login` no `App.tsx`. Se já estiver logado, redirecionar para `/painel`.
- [ ] Tirar o `loginProvisorio()` do `AuthContext.tsx`. Quando não tiver usuário, o `RequireAuth`
      deve redirecionar para `/login` (guardando a página que a pessoa tentou abrir, para voltar
      depois de entrar) em vez de mostrar o alerta "Não foi possível entrar".
- [ ] Botões "Sair" (`Sidebar.tsx`, `MenuPerfil.tsx`, `PaletaComandos.tsx`) mandam para `/painel`;
      trocar para `/login`.
- [ ] Botões "Entrar" da landing (`Landing.tsx`) apontando para `/login`.
- [ ] Token expirado (401 em qualquer chamada): limpar o token e voltar para `/login`
      (interceptor em `src/api/client.ts`).

### Cadastro do coordenador (`CadastroCoordenador.tsx`, já existe em `/cadastro`)

- [ ] Conferir a tela com o design `Cadastrar Coordenador.dc.html` e o fluxo completo contra o
      `POST /api/auth/cadastro` (CPF, e-mail ou RF duplicados devem mostrar erro legível, não 500).
- [ ] O "Cancelar" já aponta para `/login`, que hoje cai no `*` e vai para o painel. Vai
      funcionar quando a rota existir.
- [ ] Link "Já tenho conta, entrar" na tela de cadastro.

### Cadastro do professor (`CadastroProfessor.tsx` está vazio)

- [ ] Definir se o professor se cadastra sozinho ou se o coordenador cadastra (já existe o CRUD
      em `/professores`) e o professor só cria a senha no primeiro acesso. Isso pesa no mobile,
      junto com o login de aluno (a tabela `aluno` já tem `senha_hash`).
- [ ] Se o professor/aluno for logar, o backend precisa de um `Sessao` com papel
      (`COORDENADOR` / `PROFESSOR` / `ALUNO`), porque hoje o token só tem `coordenadorId`. É a
      mesma base que as rotas `minhas-notificacoes` vão precisar.

### Recuperar senha (`design/recuperar-senha/RecuperarSenha.html`)

- [ ] Tela `/recuperar-senha` com o e-mail.
- [ ] Backend: gerar um token de redefinição com validade curta, guardar com hash numa tabela
      `redefinicao_senha` e mandar o link por e-mail (precisa de um serviço SMTP), mais a rota que
      troca a senha. Se não der tempo no TCC, deixar só a tela e um aviso "procure a secretaria".

### Testes

- [ ] `api.e2e.ts`: login certo, senha errada, cadastro com e-mail repetido, `/auth/me` sem token.
