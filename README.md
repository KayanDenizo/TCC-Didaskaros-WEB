# TCC-Didaskaros-WEB
Repositório do TCC Didaskaros para WEB

# TECNOLOGIAS

## 🚀 FRONT-END
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)

## ⚙️ BACKEND
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![MySQL2](https://img.shields.io/badge/MySQL2-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![bcryptjs](https://img.shields.io/badge/bcryptjs-FF6B6B?style=for-the-badge&logo=securityscorecard&logoColor=white)
![UUID](https://img.shields.io/badge/UUID-4B5563?style=for-the-badge&logo=uuid&logoColor=white)
![dotenv](https://img.shields.io/badge/dotenv-ECD53F?style=for-the-badge&logo=dotenv&logoColor=black)
![CORS](https://img.shields.io/badge/CORS-00599C?style=for-the-badge&logo=corsair&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)
![MySQL_8](https://img.shields.io/badge/MySQL_8-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Claude API](https://img.shields.io/badge/Claude_API-D97757?style=for-the-badge&logo=anthropic&logoColor=white)

# Como rodar

Pré-requisitos: **Node.js 20.19+** e **MySQL 8** (ou o MariaDB do XAMPP).

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env      # ajuste DB_*, JWT_SECRET e ANTHROPIC_API_KEY
npm run db:setup          # cria o banco "didaskaros" com dados de exemplo (APAGA o banco existente)
npm run dev               # API em http://localhost:3333/api

# 2. Frontend (outro terminal)
cd frontend/didaskaros
npm install
npm run dev               # http://localhost:5173 (encaminha /api para o backend)
```

Login de exemplo: `maria.costa@etec.sp.gov.br` / `didaskaros123`.

A geração de grade usa a API da Claude: crie uma chave em https://console.anthropic.com e coloque em
`ANTHROPIC_API_KEY` no `backend/.env`. O modelo e o esforço são configuráveis em `CLAUDE_MODEL` e `CLAUDE_EFFORT`.

Testes do validador de conflitos: `cd backend && npm test`.

## Como a grade é gerada

1. O coordenador escolhe o **turno** — todas as turmas do turno são geradas juntas, porque disputam os mesmos professores e salas.
2. O backend lê do banco turmas, carga horária, professores (habilitações, pontuação CPS, indisponibilidades) e salas,
   e confere se o problema é possível (ex.: turma com mais aulas que horários).
3. A **Claude** recebe esses dados e devolve a grade em JSON estruturado.
4. Um **validador independente** (`backend/src/grade/validador.ts`) confere todas as restrições duras: conflito de
   professor/sala/turma, carga horária, habilitação, laboratório, capacidade e indisponibilidade.
5. Se houver violações, elas são devolvidas à Claude para corrigir (até 3 tentativas). A grade só pode ser publicada com zero conflitos.

# Organização do Repositório Didaskaros

## Estrutura Básica do Projeto

```text
didaskaros/
│
├── docs/                  # Documentação do projeto
│   ├── requisitos.md
│   ├── arquitetura.md
│   ├── casos-de-uso.md
│   └── atas-reunioes/
│
├── frontend/              # Interface web
│
├── backend/               # API e regras de negócio
│
├── database/              # Scripts SQL, migrations e modelagem
│
├── tests/                 # Testes automatizados
│
├── assets/                # Imagens, logos e diagramas
│
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
│
├── .gitignore
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

---

## Estrutura de Branches

### Branch Principal

```text
main
```

A branch `main` deve conter apenas versões estáveis do sistema.

### Branches de Funcionalidade

Cada nova funcionalidade deve ser desenvolvida em uma branch própria.

Exemplos:

```text
feature/login
feature/dashboard
feature/chat
feature/cadastro-usuario
feature/gerenciamento-cursos
```

### Branches de Correção

Quando necessário corrigir erros:

```text
fix/login-validation
fix/dashboard-loading
```

### Fluxo de Trabalho

```text
main
 ├── feature/login
 ├── feature/dashboard
 ├── feature/chat
 └── fix/login-validation
```

Após a conclusão da funcionalidade:

```text
feature/login
      │
      ▼
Pull Request
      │
      ▼
main
```

---

## Como Criar uma Branch

Atualizar a branch principal:

```bash
git checkout main
git pull origin main
```

Criar uma nova branch:

```bash
git checkout -b feature/login
```

Enviar a branch para o GitHub:

```bash
git push origin feature/login
```

---

## Como Realizar Commits

### Boas Práticas

* Fazer commits pequenos e frequentes.
* Cada commit deve representar uma alteração específica.
* Utilizar mensagens claras e padronizadas.

### Padrão de Commits

#### Nova funcionalidade

```bash
git commit -m "feat: implementa autenticação de usuários"
```

#### Correção de erro

```bash
git commit -m "fix: corrige validação de senha"
```

#### Alteração de documentação

```bash
git commit -m "docs: atualiza requisitos funcionais"
```

#### Refatoração de código

```bash
git commit -m "refactor: reorganiza estrutura do backend"
```

#### Adição de testes

```bash
git commit -m "test: adiciona testes de autenticação"
```

---

## Fluxo Completo de Desenvolvimento

### 1. Criar a branch

```bash
git checkout main
git pull origin main
git checkout -b feature/login
```

### 2. Desenvolver a funcionalidade

```bash
git add .
git commit -m "feat: cria tela de login"
```

### 3. Enviar para o GitHub

```bash
git push origin feature/login
```

### 4. Criar Pull Request

```text
feature/login → main
```

### 5. Revisão e Merge

Após aprovação:

```text
Merge Pull Request
```

### 6. Remover a branch

```bash
git branch -d feature/login
```

ou pelo próprio GitHub através da opção:

```text
Delete branch
```

---

## Exemplo de Histórico Esperado

```text
feat: cria estrutura inicial do backend
feat: implementa autenticação de usuários
feat: adiciona dashboard do professor
fix: corrige validação de login
docs: atualiza documentação da API
test: adiciona testes de autenticação
```

