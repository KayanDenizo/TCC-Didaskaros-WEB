import type { ErrorRequestHandler } from "express";
import { z } from "zod";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Valida o corpo/parâmetros com zod; erro vira 400 com a primeira mensagem legível. */
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
  // Violações de integridade do MySQL viram mensagens compreensíveis
  if (err?.code === "ER_DUP_ENTRY") {
    res.status(409).json({ erro: "Já existe um registro com esses dados." });
    return;
  }
  if (err?.code === "ER_ROW_IS_REFERENCED_2") {
    res.status(409).json({ erro: "Não é possível excluir: o registro está em uso (por exemplo, em uma grade gerada)." });
    return;
  }
  if (err?.code === "ECONNREFUSED") {
    res.status(503).json({ erro: "Banco de dados indisponível. Verifique se o MySQL está rodando." });
    return;
  }
  console.error(err);
  res.status(500).json({ erro: "Erro interno no servidor." });
};
