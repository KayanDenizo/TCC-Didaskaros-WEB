import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 3333),
  db: {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "didaskaros",
  },
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-troque-no-env",
  claudeModel: process.env.CLAUDE_MODEL ?? "claude-opus-5-5",
  claudeEffort: (process.env.CLAUDE_EFFORT ?? "high") as "low" | "medium" | "high" | "xhigh" | "max",
};
