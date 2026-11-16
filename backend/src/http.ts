import type { ErrorRequestHandler } from "express";
import { z } from "zod";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** valida body/params com zod, se der erro vira 400 com a primeira msg legivel */
export function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const campo = issue.path.join(".");
    throw new HttpError(400, campo ? `${campo}: ${issue.message}` : issue.message);
  }
  return result.data;
}

export const idParam = z.object({ id: z.coerce.number().int().positive() });

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ erro: err.message });
    return;
  }
  // erros de integridade do mysql viram msg q da pra entender
  if (err?.code === "ER_DUP_ENTRY") {
    res.status(409).json({ erro: "Já existe um registro com esses dados." });
    return;
  }
  if (err?.code === "ER_ROW_IS_REFERENCED_2") {
    res.status(409).json({ erro: "Não é possível excluir: o registro está em uso (por exemplo, em uma grade gerada)." });
    return;
  }
  // erros do express.json: body com json invalido ou q passou do limite
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ erro: "O corpo da requisição não é um JSON válido." });
    return;
  }
  if (err?.type === "entity.too.large") {
    res.status(413).json({ erro: "O corpo da requisição passou do limite de 1 MB." });
    return;
  }
  if (err?.code === "ECONNREFUSED") {
    res.status(503).json({ erro: "Banco de dados indisponível. Verifique se o MySQL está rodando." });
    return;
  }
  console.error(err);
  res.status(500).json({ erro: "Erro interno no servidor." });
};
