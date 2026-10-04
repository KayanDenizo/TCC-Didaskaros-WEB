# Como rodar o Didáskaros (apresentação)

Este guia explica como colocar o projeto no ar **localmente**: banco, backend e frontend.

Escolha o seu caso:

- **[Caso A](#caso-a--no-notebook-onde-o-projeto-já-roda)**: a apresentação vai ser no notebook onde o projeto já roda. Leva uns 2 minutos.
- **[Caso B](#caso-b--em-outro-computador-clone-do-zero)**: a apresentação vai ser em outro computador, clonando do zero. Leva uns 20 minutos.

> ⚠️ **Nunca rode `npm run db:setup` num computador onde o banco já existe.** Ele **apaga** o banco inteiro e recria só com os dados de exemplo, e as grades já geradas se perdem.

---

## Visão geral

| Parte    | Tecnologia            | Endereço                    |
|----------|-----------------------|-----------------------------|
| Banco    | MySQL 8 (ou XAMPP)    | `127.0.0.1:3306`, banco `didaskaros` |
| Backend  | Node + Express        | http://localhost:3333/api   |
| Frontend | React + Vite          | http://localhost:5173       |

O frontend encaminha tudo que começa com `/api` para o backend, então não precisa configurar nada no front.

O comando `npm run dev` na **raiz** do projeto sobe o backend e o frontend juntos e abre o navegador na landing page.

---

## Caso A: no notebook onde o projeto já roda

1. **Confira se o MySQL está ligado.**
   O serviço `MySQL80` inicia sozinho com o Windows. Para conferir, abra o PowerShell e rode:
   ```powershell
   Get-Service MySQL80
   ```
   O `Status` precisa ser `Running`. Se não for, abra o PowerShell **como administrador** e rode:
   ```powershell
   Start-Service MySQL80
   ```

2. **Conecte na internet.** A geração de grade usa a IA (API da Anthropic).

3. **Suba o projeto.** Na pasta raiz do projeto:
   ```powershell
   npm run dev
   ```
   Espere aparecer o endereço do Vite. O navegador abre sozinho na landing.

4. **Para parar:** `Ctrl + C` no terminal.

Pronto. Não precisa instalar nada nem mexer no banco.

---

## Caso B: em outro computador (clone do zero)

O `git clone` traz **só o código**. Você ainda precisa providenciar:

- as dependências (`node_modules`);
- o arquivo `backend/.env`, que **não vai pro GitHub** porque tem a chave da API;
- o banco de dados.

### 1. Programas necessários

Instale o que faltar na máquina:

- **Node.js 20.19 ou mais novo**: https://nodejs.org (versão LTS). Para conferir: `node -v`.
- **MySQL 8**: https://dev.mysql.com/downloads/installer/. Também funciona o **XAMPP**: abra o painel e clique em *Start* no MySQL.
- **Git**: https://git-scm.com

### 2. Clonar o projeto

```powershell
git clone <url-do-repositorio>
cd TCC-Didaskaros-WEB
```

### 3. Instalar as dependências

```powershell
cd backend
npm install
cd ..

cd frontend/didaskaros
npm install
cd ../..
```

### 4. Criar o `.env` do backend

```powershell
copy backend\.env.example backend\.env
```

Abra o `backend/.env` num editor e preencha:

```env
PORT=3333

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=          # senha do root do MySQL dessa máquina (no XAMPP fica vazio)
DB_NAME=didaskaros

JWT_SECRET=qualquer-texto-longo-e-aleatorio

ANTHROPIC_API_KEY=    # copie do .env do seu notebook
CLAUDE_MODEL=claude-opus-5-5
CLAUDE_EFFORT=high
```

> 💡 Leve a `ANTHROPIC_API_KEY` com você: num pendrive, num e-mail para você mesmo, etc. **Sem ela a geração de grade não funciona.** Não coloque essa chave no GitHub.

### 5. Criar o banco

Escolha **uma** das opções.

**Opção 1: banco novo com dados de exemplo**

```powershell
cd backend
npm run db:setup
cd ..
```

Isso cria as tabelas e uma escola de exemplo (ETEC Uirapuru), com cursos, disciplinas, salas, professores e a coordenadora. **Não vem nenhuma grade gerada**, então você vai ter que gerar uma na hora.

**Opção 2: levar o banco do seu notebook, com as grades já geradas**

No **seu notebook**, exporte o banco:
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" -u root -p --databases didaskaros > didaskaros-backup.sql
```

Leve o arquivo `didaskaros-backup.sql` para o outro computador e importe:
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "source didaskaros-backup.sql"
```

> No XAMPP, os executáveis ficam em `C:\xampp\mysql\bin\`.

### 6. Subir o projeto

Na raiz do projeto:

```powershell
npm run dev
```

O backend sobe na porta 3333, o frontend na 5173, e o navegador abre na landing.

---

## Login

| Campo  | Valor                         |
|--------|-------------------------------|
| E-mail | `maria.costa@etec.sp.gov.br`  |
| Senha  | `didaskaros123`               |

Coordenadora: **Maria Costa**.

---

## Problemas comuns

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| Backend fecha com erro `ECONNREFUSED 127.0.0.1:3306` | MySQL desligado | Ligue o serviço `MySQL80` ou o MySQL no XAMPP |
| Erro `Access denied for user 'root'` | Senha errada no `.env` | Corrija `DB_PASSWORD` no `backend/.env` |
| Erro `Unknown database 'didaskaros'` | Banco não foi criado | Faça o passo 5 |
| `EADDRINUSE` na porta 3333 ou 5173 | Já tem algo rodando nessa porta | Feche o outro terminal ou reinicie o PC |
| Telas abrem mas os dados não carregam | Backend não subiu | Leia o erro do `[backend]` no terminal |
| Gerar grade dá erro | Sem internet ou sem `ANTHROPIC_API_KEY` | Confira a conexão e o `.env` |
| `npm` não é reconhecido | Node não instalado | Instale o Node.js e **reabra** o terminal |

---

## Checklist para o dia

- [ ] Testar tudo **na véspera, na máquina da apresentação**: abrir, logar, ver a grade.
- [ ] MySQL ligado.
- [ ] Internet funcionando. Leve o 4G do celular como plano B, porque rede de escola às vezes bloqueia.
- [ ] `ANTHROPIC_API_KEY` configurada no `backend/.env`.
- [ ] Ter uma grade **já gerada** para mostrar. A geração ao vivo demora alguns minutos porque a IA analisa bastante antes de responder.
- [ ] **Não** rodar `npm run db:setup` se o banco já tiver dados.
