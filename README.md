# TCC-Didaskaros-WEB
Repositório do TCC Didaskaros para WEB

# Estrutura de commits:
- *feat*: adiciona tela de login

- *fix*: corrige validação de senha

- *docs*: atualiza documentação

- *refactor*: reorganiza estrutura da API

- *test*: adiciona testes de autenticação

# Estrutura de branches:
main
├── feature/login
├── feature/cadastro-usuario
├── feature/dashboard
└── feature/chat

# Fluxo de trabalho
## 1. Atualizar a main

Antes de começar uma tarefa:
```git checkout main
git pull origin main```

## 2. Criar uma branch para a funcionalidade

Exemplo: implementar login.

## 3. Fazer commits
```git add .
git commit -m "feat: implementa autenticação de usuários"```

## 4. Enviar a branch para o GitHub
```git push origin feature/login```
=> A branch aparecerá no GitHub.

## 5. Criar um Pull Request
### No GitHub:
feature/login
    ↓
Pull Request
    ↓
main

## 6. Fazer o merge

Depois da aprovação:
feature/login
    ↓
Merge
    ↓
main
*(Mas ai é comigo Kayan Denizo)*
