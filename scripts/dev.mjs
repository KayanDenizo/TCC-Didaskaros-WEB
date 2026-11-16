// sobe o backend e o front juntos, o vite abre o navegador na landing (/)
import { spawn } from "node:child_process";

const apps = [
  { nome: "backend", pasta: "backend" },
  { nome: "frontend", pasta: "frontend/didaskaros" },
];

const processos = apps.map(({ nome, pasta }) => {
  const p = spawn("npm", ["run", "dev"], { cwd: pasta, stdio: "inherit", shell: true });
  p.on("exit", (codigo) => {
    console.log(`\n[${nome}] encerrou (código ${codigo}). Parando o resto...`);
    encerrar();
  });
  return p;
});

function encerrar() {
  for (const p of processos) if (p.exitCode === null) p.kill();
  process.exit();
}

process.on("SIGINT", encerrar);
process.on("SIGTERM", encerrar);
