DROP DATABASE IF EXISTS didaskaros;
CREATE DATABASE didaskaros CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE didaskaros;

CREATE TABLE escola (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  cod_escola   VARCHAR(10),
  tipo         ENUM('ETEC','FATEC') NOT NULL,
  nome         VARCHAR(120) NOT NULL,
  municipio    VARCHAR(80)  NOT NULL,
  email        VARCHAR(160),
  telefone     VARCHAR(20),
  UNIQUE KEY uq_escola (tipo, nome, municipio)
);

CREATE TABLE curso (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  escola_id  INT NOT NULL,
  nome       VARCHAR(120) NOT NULL,
  UNIQUE KEY uq_curso (escola_id, nome),
  FOREIGN KEY (escola_id) REFERENCES escola(id)
);

CREATE TABLE professor (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  escola_id       INT NOT NULL,
  cod_professor   VARCHAR(20),
  nome            VARCHAR(120) NOT NULL,
  cpf             CHAR(11),
  email           VARCHAR(160) NOT NULL,
  telefone        VARCHAR(20),
  senha_hash      VARCHAR(100),
  pontuacao_cps   DECIMAL(7,2) NOT NULL DEFAULT 0,
  -- Deliberacao CEETEPS 23/2015: indeterminado escolhe aula antes do determinado
  contrato        ENUM('INDETERMINADO','DETERMINADO') NOT NULL DEFAULT 'INDETERMINADO',
  UNIQUE KEY uq_professor_email (escola_id, email),
  UNIQUE KEY uq_professor_cod (escola_id, cod_professor),
  UNIQUE KEY uq_professor_cpf (cpf),
  FOREIGN KEY (escola_id) REFERENCES escola(id)
);

CREATE TABLE disciplina (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  escola_id          INT NOT NULL,
  nome               VARCHAR(80) NOT NULL,
  sigla              VARCHAR(12) NOT NULL,
  exige_laboratorio  BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE KEY uq_disciplina (escola_id, nome),
  FOREIGN KEY (escola_id) REFERENCES escola(id)
);

CREATE TABLE turma (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  escola_id   INT NOT NULL,
  curso_id    INT NOT NULL,
  codigo      VARCHAR(12) NOT NULL,                   -- numero da turma, tipo 3DS
  turno       ENUM('MANHA','TARDE','NOITE') NOT NULL, -- periodo
  qtd_alunos  INT NOT NULL,
  UNIQUE KEY uq_turma (escola_id, codigo),
  FOREIGN KEY (escola_id) REFERENCES escola(id),
  FOREIGN KEY (curso_id)  REFERENCES curso(id)
);

CREATE TABLE aluno (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  escola_id   INT NOT NULL,
  turma_id    INT NULL,
  rm          VARCHAR(10)  NOT NULL,
  cpf         CHAR(11)     NOT NULL UNIQUE,
  nome        VARCHAR(120) NOT NULL,
  email       VARCHAR(160) NOT NULL,
  senha_hash  VARCHAR(100),
  UNIQUE KEY uq_aluno_rm (escola_id, rm),
  UNIQUE KEY uq_aluno_email (escola_id, email),
  FOREIGN KEY (escola_id) REFERENCES escola(id),
  FOREIGN KEY (turma_id)  REFERENCES turma(id) ON DELETE SET NULL
);

-- leciona (professor x turma x disciplina)
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

-- coordenador
CREATE TABLE coordenador (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  escola_id           INT NOT NULL,
  curso_id            INT NOT NULL,
  nome                VARCHAR(120) NOT NULL,
  cpf                 CHAR(11)     NOT NULL UNIQUE,
  data_nascimento     DATE         NOT NULL,
  telefone            VARCHAR(20)  NOT NULL,
  email               VARCHAR(160) NOT NULL UNIQUE,
  email_pessoal       VARCHAR(160),
  senha_hash          VARCHAR(100) NOT NULL,
  turnos              VARCHAR(60)  NOT NULL,          -- lista separada por virgula
  registro_funcional  VARCHAR(8)   NOT NULL,
  categoria           VARCHAR(60)  NOT NULL,
  data_inicio         DATE         NOT NULL,
  nivel_acesso        ENUM('COORDENADOR','ADMIN') NOT NULL DEFAULT 'COORDENADOR',
  observacoes         VARCHAR(500),
  criado_em           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (escola_id) REFERENCES escola(id),
  FOREIGN KEY (curso_id)  REFERENCES curso(id)
);

CREATE TABLE sala (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  escola_id   INT NOT NULL,
  nome        VARCHAR(40) NOT NULL,
  tipo        ENUM('SALA','LABORATORIO') NOT NULL DEFAULT 'SALA',
  capacidade  INT NOT NULL,
  UNIQUE KEY uq_sala (escola_id, nome),
  FOREIGN KEY (escola_id) REFERENCES escola(id)
);

CREATE TABLE habilitacao (
  professor_id   INT NOT NULL,
  disciplina_id  INT NOT NULL,
  PRIMARY KEY (professor_id, disciplina_id),
  FOREIGN KEY (professor_id)  REFERENCES professor(id)  ON DELETE CASCADE,
  FOREIGN KEY (disciplina_id) REFERENCES disciplina(id) ON DELETE CASCADE
);

-- dias/horarios em q o professor nao pode dar aula
-- dia: 0 = segunda ... 4 = sexta. ordem: qual aula do turno (0 = primeira)
CREATE TABLE indisponibilidade (
  professor_id  INT NOT NULL,
  turno         ENUM('MANHA','TARDE','NOITE') NOT NULL,
  dia           TINYINT NOT NULL,
  ordem         TINYINT NOT NULL,
  PRIMARY KEY (professor_id, turno, dia, ordem),
  FOREIGN KEY (professor_id) REFERENCES professor(id) ON DELETE CASCADE
);

-- horarios q o professor prefere (ou quer evitar). restricao mole, a IA tenta atender
CREATE TABLE preferencia (
  professor_id  INT NOT NULL,
  turno         ENUM('MANHA','TARDE','NOITE') NOT NULL,
  dia           TINYINT NOT NULL,
  ordem         TINYINT NOT NULL,
  tipo          ENUM('PREFERE','EVITAR') NOT NULL,
  PRIMARY KEY (professor_id, turno, dia, ordem),
  FOREIGN KEY (professor_id) REFERENCES professor(id) ON DELETE CASCADE
);

-- horario q o professor trabalha FORA daqui (outra ETEC/FATEC, outro emprego)
-- entra na conta de conflito, interjornada de 11h, refeicao e limite de 8h por dia
CREATE TABLE compromisso_externo (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  professor_id  INT NOT NULL,
  dia           TINYINT NOT NULL,
  hora_inicio   TIME NOT NULL,
  hora_fim      TIME NOT NULL,
  descricao     VARCHAR(120) NOT NULL DEFAULT '',
  FOREIGN KEY (professor_id) REFERENCES professor(id) ON DELETE CASCADE
);

CREATE TABLE grade (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  escola_id       INT NOT NULL,
  turno           ENUM('MANHA','TARDE','NOITE') NOT NULL,
  ano             SMALLINT NOT NULL,
  semestre        TINYINT  NOT NULL,
  aulas_por_dia   TINYINT  NOT NULL,
  status          ENUM('RASCUNHO','PUBLICADA','ARQUIVADA') NOT NULL DEFAULT 'RASCUNHO',
  restricoes      JSON,
  observacoes     TEXT,
  violacoes       JSON,
  modelo          VARCHAR(60),
  tentativas      TINYINT,
  criado_por      INT,
  criado_em       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (escola_id)  REFERENCES escola(id),
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
