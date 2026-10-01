import { Router, type RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "./env.js";
import { exec, select, transaction } from "./db.js";
import { HttpError, parse } from "./http.js";
import { idCurso } from "./routes/cadastros.js";

export interface Sessao {
  coordenadorId: number;
  unidadeId: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      sessao: Sessao;
    }
  }
}

/** Exige token JWT válido e disponibiliza req.sessao. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer /, "");
  if (!token) throw new HttpError(401, "Faça login para continuar.");
  try {
    req.sessao = jwt.verify(token, env.jwtSecret) as Sessao;
  } catch {
    throw new HttpError(401, "Sessão expirada. Faça login novamente.");
  }
  next();
};

interface UsuarioRow {
  id: number;
  escola_id: number;
  nome: string;
  email: string;
  senha_hash: string;
  nivel_acesso: string;
  unidade: string;
}

const USUARIO_SQL = `
  SELECT c.id, c.escola_id, c.nome, c.email, c.senha_hash, c.nivel_acesso,
         CONCAT(u.tipo, ' ', u.nome) AS unidade
  FROM coordenador c JOIN escola u ON u.id = c.escola_id`;

function publico(u: UsuarioRow) {
  return { id: u.id, nome: u.nome, email: u.email, nivelAcesso: u.nivel_acesso, unidade: u.unidade };
}

function emitirToken(u: UsuarioRow, manterConectado = false) {
  const sessao: Sessao = { coordenadorId: u.id, unidadeId: u.escola_id };
  return jwt.sign(sessao, env.jwtSecret, { expiresIn: manterConectado ? "30d" : "8h" });
}

const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(1, "Informe a senha."),
  manterConectado: z.boolean().optional(),
});

const cadastroSchema = z.object({
  nomeCompleto: z.string().trim().min(3),
  cpf: z.string().transform((v) => v.replace(/\D/g, "")).pipe(z.string().length(11, "CPF inválido.")),
  dataNascimento: z.string().date(),
  telefone: z.string().min(10),
  emailInstitucional: z.string().email(),
  emailPessoal: z.union([z.string().email(), z.literal("")]).optional(),
  senha: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
  tipoInstituicao: z.enum(["ETEC", "FATEC"]),
  unidade: z.string().trim().min(2),
  municipio: z.string().trim().min(2),
  curso: z.string().min(1),
  turnosResponsavel: z.array(z.string()).min(1),
  registroFuncional: z.string().regex(/^\d{6,8}$/, "RF deve ter de 6 a 8 dígitos."),
  categoriaFuncional: z.string().min(1),
  dataInicio: z.string().date(),
  nivelAcesso: z.enum(["COORDENADOR", "ADMIN"]),
  observacoes: z.string().max(500).optional(),
});

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { email, senha, manterConectado } = parse(loginSchema, req.body);
  const [u] = await select<UsuarioRow>(`${USUARIO_SQL} WHERE c.email = ?`, [email.toLowerCase()]);
  if (!u || !(await bcrypt.compare(senha, u.senha_hash))) {
    throw new HttpError(401, "E-mail ou senha incorretos.");
  }
  res.json({ token: emitirToken(u, manterConectado), usuario: publico(u) });
});

// Cadastro de coordenador (primeiro acesso). Cria a escola e o curso se ainda não existirem.
authRouter.post("/cadastro", async (req, res) => {
  const d = parse(cadastroSchema, req.body);
  const id = await transaction(async (conn) => {
    await exec(
      "INSERT IGNORE INTO escola (tipo, nome, municipio) VALUES (?, ?, ?)",
      [d.tipoInstituicao, d.unidade, d.municipio], conn,
    );
    const [unidade] = await select<{ id: number }>(
      "SELECT id FROM escola WHERE tipo = ? AND nome = ? AND municipio = ?",
      [d.tipoInstituicao, d.unidade, d.municipio], conn,
    );
    const r = await exec(
      `INSERT INTO coordenador (escola_id, nome, cpf, data_nascimento, telefone, email, email_pessoal,
         senha_hash, curso_id, turnos, registro_funcional, categoria, data_inicio, nivel_acesso, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        unidade.id, d.nomeCompleto, d.cpf, d.dataNascimento, d.telefone, d.emailInstitucional.toLowerCase(),
        d.emailPessoal || null, await bcrypt.hash(d.senha, 10), await idCurso(unidade.id, d.curso, conn), d.turnosResponsavel.join(","),
        d.registroFuncional, d.categoriaFuncional, d.dataInicio, d.nivelAcesso, d.observacoes || null,
      ],
      conn,
    );
    return r.insertId;
  });
  const [u] = await select<UsuarioRow>(`${USUARIO_SQL} WHERE c.id = ?`, [id]);
  res.status(201).json({ token: emitirToken(u), usuario: publico(u) });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const [u] = await select<UsuarioRow>(`${USUARIO_SQL} WHERE c.id = ?`, [req.sessao.coordenadorId]);
  if (!u) throw new HttpError(401, "Usuário não encontrado.");
  res.json(publico(u));
});
