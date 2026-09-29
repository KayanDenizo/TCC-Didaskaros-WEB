import express from "express";
import cors from "cors";
import { authRouter, requireAuth } from "./auth.js";
import { errorHandler } from "./http.js";
import { disciplinasRouter, professoresRouter, salasRouter, turmasRouter } from "./routes/cadastros.js";
import { gradesRouter } from "./routes/grades.js";
import { painelRouter } from "./routes/painel.js";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/painel", requireAuth, painelRouter);
app.use("/api/disciplinas", requireAuth, disciplinasRouter);
app.use("/api/salas", requireAuth, salasRouter);
app.use("/api/professores", requireAuth, professoresRouter);
app.use("/api/turmas", requireAuth, turmasRouter);
app.use("/api/grades", requireAuth, gradesRouter);

app.use(errorHandler);
