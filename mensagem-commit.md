# Mensagem de commit

Copie o bloco abaixo. Este arquivo não deve entrar no commit: apague depois de usar.

```
feat: regras do CPS na geração, Didáskaros IA e barra de progresso

Regras do Centro Paula Souza (Deliberação CEETEPS 23/2015 e Portaria CETEC 1.263/2017):
- banco (database/db.sql, substitui schema.sql): professor.contrato,
  tabelas preferencia e compromisso_externo
- validador confere compromisso externo, 11h de descanso entre jornadas,
  8h por dia, 1h de refeição acima de 6h e 30 aulas por semana
- geração de um turno considera as aulas que o professor já tem nos outros turnos
- ordem de classificação: contrato indeterminado primeiro, depois pontuação
- hora-aula da noite com 45 minutos
- janelas, preferências e distribuição na semana viraram preferências, não regras
- tela de Professores: contrato, quadro Indisponível/Prefere/Evitar
  e compromissos em outras unidades
- novos testes do validador

Interface:
- a IA aparece como "Didáskaros IA" em vez de Claude, inclusive nas mensagens de erro
- Gerar Grade: barra de progresso com porcentagem, etapas e tempo restante
  estimado (aprende com as gerações anteriores)
- animações: destaque do menu lateral desliza entre as páginas, números do
  painel contam até o valor, transição entre páginas, check das preferências
- menu da conta no avatar (Meu perfil, Preferências, Cadastrar coordenador,
  Sair); rota /perfil em branco até a tela da Julia
- logo oficial (lápis e relógio) na sidebar, em src/assets, com fundo transparente
- hover com deslocamento em botões, cartões do painel, itens do menu e linhas clicáveis
- cadastros (professores, turmas, disciplinas, salas): formulário entra deslizando
  ao escolher um item ou clicar em Novo, item em edição marcado na tabela,
  confirmação "cadastrado/salvo/excluído" e erro com leve tremida
- respeita a opção do sistema de reduzir animações

Didáskaros IA flexível:
- conversa de ajuste: o coordenador pede mudanças ou tira dúvidas sobre a
  grade (POST /grades/:id/ajustar); se a IA altera, o validador confere e
  salva uma nova versão em rascunho
- diagnóstico de cadastros (GET /grades/diagnostico): a IA avisa o que
  impede a geração e o que vale conferir, com atalhos para as telas;
  botão Gerar bloqueado enquanto houver problema
- docs/tecnologias-e-funcionamento.md: tecnologias e funcionamento do sistema

Login:
- tela de abertura depois do login: logo vetorial (nítido em qualquer
  tamanho), ponteiros do relógio girando e zoom no relógio com fade out
  revelando o painel
- removida a tela de Login (fica com a Julia); login automático provisório
  com a coordenadora de exemplo até a tela nova chegar
```

## Comandos

```
git pull
git add -A
git reset mensagem-commit.md
git commit
```

O `git commit` abre o editor: cole a mensagem, salve e feche.
