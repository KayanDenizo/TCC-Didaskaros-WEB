# Tela Ver Grade: do design para o sistema

Como o design da tela Ver Grade (feito pela Julia em `design/ver-grade/verGrade.html`) virou a página `/grades` do sistema, ligada ao backend.

O arquivo de design original não foi alterado. A implementação está em `frontend/didaskaros/src/pages/Grades.tsx`.

## O que foi mantido do design

- Cabeçalho "Grades Horárias" com descrição do semestre e os botões **Exportar PDF** e **Gerar Grade**.
- Card principal com título "Grade Horária — …", subtítulo (tipo de filtro, turno e quantidade de aulas semanais) e selo de status (Publicada, Rascunho, Arquivada).
- Abas **Por Turma**, **Por Professor** e **Por Sala**, com a aba ativa em azul.
- Navegação de semana com setas para voltar e avançar.
- Grade semanal com coluna de horários e uma coluna por dia (segunda a sexta).
- Cartões de aula coloridos, com borda grossa à esquerda, mostrando disciplina, professor e sala.
- Horários vagos com borda tracejada.
- Legenda de cores das disciplinas abaixo da grade.
- Coluna da direita com **Outras Grades** (nome, resumo e status de cada grade).
- **Resumo da Grade** com os quatro blocos: aulas semanais, professores, disciplinas e conflitos.

## O que foi alterado

| Item | No design | No sistema | Motivo |
|---|---|---|---|
| Menu lateral e barra superior | Copiados dentro do HTML | Os componentes que o app já tem (`Sidebar` e `Topbar`) | Evitar duas versões do mesmo menu |
| Escolha da turma | Texto fixo "Turma: 3º DS" | Lista para escolher a turma, o professor ou a sala | Navegar pelos dados reais |
| Cores das disciplinas | Escolhidas à mão (PDTCC vermelho, Química azul…) | Paleta automática do app (`lib/cores.ts`), uma cor por disciplina | As disciplinas vêm do banco, então a cor precisa ser gerada |
| Ícones | Material Symbols (Google) | Ícones próprios do app (`components/icons.tsx`) | Não depender de fonte externa |
| Largura | Colunas com no mínimo 280px e resumo com 1720px | Grade que se ajusta à largura da tela | O tamanho fixo estourava a tela em notebooks |
| Posição do Resumo da Grade | Largura total, abaixo de tudo | Abaixo da grade, na coluna da esquerda | Manter a coluna da direita visível ao lado |
| Cores do Resumo | Fundos mais fortes (tons 200) | Fundos mais suaves (tons 50) | Seguir o padrão dos outros cards do app |
| Nome em Outras Grades | "Grade 2ºDS — 2025" | "Grade #2 — Manhã · 2º sem. 2026" | No sistema, cada grade é de um turno inteiro, não de uma turma |
| Painel Disponibilidade Hoje | Lista de professores com indicador "Ao vivo" e status Disponível / Em aula | Removido | O sistema não tem como saber em tempo real se o professor está disponível; a grade só mostra o que foi planejado |
| Arredondamento dos cards | 30px | 24px | Padrão do app |

## O que foi acrescentado

- **Data em cada dia** da grade, com o dia de hoje destacado em azul.
- **Aula acontecendo agora** com contorno azul.
- **Observações da IA** e **lista de conflitos** no card de resumo. A página antiga já tinha essas duas partes.
- **Barra de ações** com Publicar, Arquivar, Voltar para rascunho, Revalidar conflitos e Excluir. A página antiga também já tinha essas ações.
- **Caixa de confirmação de exclusão** (`components/ExcluirGradeDialog.tsx`), no lugar do aviso padrão do navegador. Ela mostra a grade em miniatura nas cores das disciplinas. Ao confirmar, as aulas se apagam uma a uma. Se a grade estiver publicada, aparece um aviso.

## Mudanças no backend

A rota `GET /api/grades/:id` passou a devolver também `intervalos`, com o horário de início e de fim de cada aula:

```json
"intervalos": [
  { "inicio": "07:30", "fim": "08:20" },
  { "inicio": "08:20", "fim": "09:10" }
]
```

É isso que permite destacar a aula do horário atual. O resto da tela usa rotas que já existiam:

| Rota | Uso na tela |
|---|---|
| `GET /api/grades` | Lista de Outras Grades |
| `GET /api/grades/:id` | Grade aberta, com aulas, turmas, professores, salas e resumo |
| `PATCH /api/grades/:id/status` | Publicar, arquivar e voltar para rascunho |
| `POST /api/grades/:id/validar` | Revalidar conflitos |
| `DELETE /api/grades/:id` | Excluir |

## Ligação com o Painel

O Painel Principal leva para esta tela pelo botão **Ver Grades** e pelo link **Ver grade completa**. Também leva clicando em uma grade de **Grades Recentes**, que abre direto a grade escolhida (`/grades?id=…`). Sem `id` na URL, a tela abre a grade publicada ou, se não houver nenhuma, a mais recente.

## Limitações conhecidas

- As setas de semana só mudam as datas mostradas. A grade é a mesma toda semana.
- O Painel só mostra "Aulas de Hoje" de grades **publicadas**.
- O botão Exportar PDF usa a impressão do navegador. Para gerar o arquivo, escolha "Salvar como PDF".
