-- Didáskaros — modelo de dados (MySQL 8 / MariaDB 10.4+)
-- Recria o banco do zero. Rodar com: npm run db:setup (dentro de backend/)

DROP DATABASE IF EXISTS didaskaros;
CREATE DATABASE didaskaros CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE didaskaros;

-- Unidade do Centro Paula Souza (ETEC ou FATEC). Todo dado pertence a uma unidade.
CREATE TABLE unidade (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  tipo       ENUM('ETEC','FATEC') NOT NULL,
  nome       VARCHAR(120) NOT NULL,
  municipio  VARCHAR(80)  NOT NULL,
  UNIQUE KEY uq_unidade (tipo, nome, municipio)
);

-- Coordenador: único perfil com acesso à web.
CREATE TABLE coordenador (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  unidade_id          INT NOT NULL,
  nome                VARCHAR(120) NOT NULL,
  cpf                 CHAR(11)     NOT NULL UNIQUE,
  data_nascimento     DATE         NOT NULL,
  telefone            VARCHAR(20)  NOT NULL,
  email               VARCHAR(160) NOT NULL UNIQUE,
  email_pessoal       VARCHAR(160),
  senha_hash          VARCHAR(100) NOT NULL,
  curso               VARCHAR(120) NOT NULL,
  turnos              VARCHAR(60)  NOT NULL,          -- lista separada por vírgula
  registro_funcional  VARCHAR(8)   NOT NULL,
  categoria           VARCHAR(60)  NOT NULL,
  data_inicio         DATE         NOT NULL,
  nivel_acesso        ENUM('COORDENADOR','ADMIN') NOT NULL DEFAULT 'COORDENADOR',
  observacoes         VARCHAR(500),
  criado_em           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unidade_id) REFERENCES unidade(id)
);

CREATE TABLE disciplina (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  unidade_id         INT NOT NULL,
  nome               VARCHAR(80) NOT NULL,
  sigla              VARCHAR(12) NOT NULL,
  exige_laboratorio  BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE KEY uq_disciplina (unidade_id, nome),
  FOREIGN KEY (unidade_id) REFERENCES unidade(id)
);

CREATE TABLE sala (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  unidade_id  INT NOT NULL,
  nome        VARCHAR(40) NOT NULL,
  tipo        ENUM('SALA','LABORATORIO') NOT NULL DEFAULT 'SALA',
  capacidade  INT NOT NULL,
  UNIQUE KEY uq_sala (unidade_id, nome),
  FOREIGN KEY (unidade_id) REFERENCES unidade(id)
);

CREATE TABLE professor (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  unidade_id      INT NOT NULL,
  nome            VARCHAR(120) NOT NULL,
  email           VARCHAR(160) NOT NULL,
  telefone        VARCHAR(20),
  pontuacao_cps   DECIMAL(7,2) NOT NULL DEFAULT 0,    -- prioridade na atribuição de aulas
  UNIQUE KEY uq_professor_email (unidade_id, email),
  FOREIGN KEY (unidade_id) REFERENCES unidade(id)
);

-- Quais disciplinas cada professor está habilitado a lecionar.
CREATE TABLE habilitacao (
  professor_id   INT NOT NULL,
  disciplina_id  INT NOT NULL,
  PRIMARY KEY (professor_id, disciplina_id),
  FOREIGN KEY (professor_id)  REFERENCES professor(id)  ON DELETE CASCADE,
  FOREIGN KEY (disciplina_id) REFERENCES disciplina(id) ON DELETE CASCADE
);

-- Horários em que o professor NÃO pode dar aula (restrição dura).
-- dia: 0 = segunda … 4 = sexta. ordem: posição da aula no turno (0 = primeira).
CREATE TABLE indisponibilidade (
  professor_id  INT NOT NULL,
  turno         ENUM('MANHA','TARDE','NOITE') NOT NULL,
  dia           TINYINT NOT NULL,
  ordem         TINYINT NOT NULL,
  PRIMARY KEY (professor_id, turno, dia, ordem),
  FOREIGN KEY (professor_id) REFERENCES professor(id) ON DELETE CASCADE
);

CREATE TABLE turma (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  unidade_id  INT NOT NULL,
  codigo      VARCHAR(12)  NOT NULL,                  -- ex.: 3DS
  curso       VARCHAR(120) NOT NULL,
  turno       ENUM('MANHA','TARDE','NOITE') NOT NULL,
  qtd_alunos  INT NOT NULL,
  UNIQUE KEY uq_turma (unidade_id, codigo),
  FOREIGN KEY (unidade_id) REFERENCES unidade(id)
);

-- Carga horária: quantas aulas semanais cada disciplina tem em cada turma.
-- professor_id opcional: se preenchido, a aula já está atribuída a esse docente.
CREATE TABLE carga_horaria (
  turma_id        INT NOT NULL,
  disciplina_id   INT NOT NULL,
  aulas_semanais  TINYINT NOT NULL,
  professor_id    INT NULL,
  PRIMARY KEY (turma_id, disciplina_id),
  FOREIGN KEY (turma_id)      REFERENCES turma(id)      ON DELETE CASCADE,
  FOREIGN KEY (disciplina_id) REFERENCES disciplina(id) ON DELETE CASCADE,
  FOREIGN KEY (professor_id)  REFERENCES professor(id)  ON DELETE SET NULL
);

-- Grade gerada para um turno inteiro da unidade (todas as turmas do turno de uma vez).
CREATE TABLE grade (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  unidade_id      INT NOT NULL,
  turno           ENUM('MANHA','TARDE','NOITE') NOT NULL,
  ano             SMALLINT NOT NULL,
  semestre        TINYINT  NOT NULL,
  aulas_por_dia   TINYINT  NOT NULL,
  status          ENUM('RASCUNHO','PUBLICADA','ARQUIVADA') NOT NULL DEFAULT 'RASCUNHO',
  restricoes      JSON,                               -- preferências (restrições moles) escolhidas
  observacoes     TEXT,                               -- explicação devolvida pela IA
  violacoes       JSON,                               -- resultado do validador independente
  modelo          VARCHAR(60),
  tentativas      TINYINT,
  criado_por      INT,
  criado_em       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unidade_id) REFERENCES unidade(id),
  FOREIGN KEY (criado_por) REFERENCES coordenador(id) ON DELETE SET NULL
);

CREATE TABLE grade_aula (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  grade_id       INT NOT NULL,
  turma_id       INT NOT NULL,
  disciplina_id  INT NOT NULL,
  professor_id   INT NOT NULL,
  sala_id        INT NOT NULL,
  dia            TINYINT NOT NULL,
  ordem          TINYINT NOT NULL,
  FOREIGN KEY (grade_id)      REFERENCES grade(id) ON DELETE CASCADE,
  FOREIGN KEY (turma_id)      REFERENCES turma(id),
  FOREIGN KEY (disciplina_id) REFERENCES disciplina(id),
  FOREIGN KEY (professor_id)  REFERENCES professor(id),
  FOREIGN KEY (sala_id)       REFERENCES sala(id),
  INDEX ix_grade_slot (grade_id, dia, ordem)
);
