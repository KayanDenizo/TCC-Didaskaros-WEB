import { app } from "./app.js";
import { env } from "./env.js";

app.listen(env.port, () => {
  console.log(`API do Didáskaros em http://localhost:${env.port}/api`);
  if (!process.env.ANTHROPIC_API_KEY) console.warn("Aviso: ANTHROPIC_API_KEY não configurada — geração de grades desativada.");
});
