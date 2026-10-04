# Fluxo de trabalho com Git

Convenções de branches e commits usadas no repositório.

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

