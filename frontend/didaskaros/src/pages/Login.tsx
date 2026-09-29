import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { api, mensagemErro } from "../api/client";
import type { Usuario } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Alert, Button } from "../components/ui";
import { DIAS_CURTOS } from "../lib/format";

// Grade ilustrativa do painel direito (só decoração).
const VITRINE: ([string, string, string] | null)[][] = [
  [["Física", "S101", "blue"], ["Matemática", "S102", "violet"], ["Português", "S103", "pink"], ["História", "S102", "amber"], ["Geografia", "S101", "emerald"]],
  [["Matemática", "S101", "violet"], ["Português", "S102", "pink"], ["Matemática", "S101", "violet"], ["Física", "Lab", "blue"], ["Português", "S103", "pink"]],
  [null, ["História", "S102", "amber"], ["Física", "Lab", "blue"], ["Matemática", "S101", "violet"], ["Ciências", "Lab", "cyan"]],
  [["Ciências", "Lab", "cyan"], ["Geografia", "S101", "emerald"], ["História", "S103", "amber"], ["Geografia", "S102", "emerald"], ["Matemática", "S101", "violet"]],
  [["Geografia", "S101", "emerald"], ["Física", "Lab", "blue"], ["Ciências", "Lab", "cyan"], ["Português", "S102", "pink"], ["História", "S103", "amber"]],
];
const HORAS = ["07:30", "08:20", "09:10", "10:10", "11:00"];
const COR: Record<string, string> = {
  blue: "bg-blue-400/15 border-blue-400 text-blue-200",
  violet: "bg-violet-400/15 border-violet-400 text-violet-200",
  pink: "bg-pink-400/15 border-pink-400 text-pink-200",
  amber: "bg-amber-400/15 border-amber-400 text-amber-200",
  emerald: "bg-emerald-400/15 border-emerald-400 text-emerald-200",
  cyan: "bg-cyan-400/15 border-cyan-400 text-cyan-200",
};

const campo = "w-full py-3 pl-4 pr-4 border border-[#E3E6EE] rounded-[10px] bg-white text-[14px] outline-none transition focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/15";

export default function Login() {
  const { usuario, entrar } = useAuth();
  const navigate = useNavigate();
  const destino = (useLocation().state as { de?: string } | null)?.de ?? "/painel";
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [manter, setManter] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={destino} replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const { data } = await api.post<{ token: string; usuario: Usuario }>("/auth/login", { email, senha, manterConectado: manter });
      entrar(data.token, data.usuario, manter);
      navigate(destino, { replace: true });
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(420px,46fr)_54fr] bg-[#FBFBFD] text-[#101828]">
      <section className="flex flex-col px-7 py-8 lg:px-14 lg:pt-11 lg:pb-9">
        <div className="flex items-center gap-3">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br from-[#16336E] to-blue-600 text-white font-archivo font-bold text-[17px] flex items-center justify-center">D</div>
          <div>
            <div className="font-archivo font-bold text-[15px] tracking-[.16em] text-[#0D1F47]">DIDÁSKAROS</div>
            <div className="text-[11px] text-[#667085]">Centro Paula Souza</div>
          </div>
        </div>

        <div className="my-auto w-full max-w-[400px] py-12">
          <h1 className="font-archivo text-[34px] font-semibold tracking-tight leading-tight text-[#0D1F47]">Acesso da coordenação</h1>
          <p className="text-[14px] leading-relaxed text-[#667085] mt-3 mb-8">
            Entre com seu e-mail institucional para montar, revisar e publicar as grades da sua unidade.
          </p>

          <form onSubmit={handleSubmit} className="space-y-[18px]">
            <div>
              <label htmlFor="email" className="block text-[13px] font-medium text-[#344054] mb-1.5">E-mail institucional</label>
              <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="maria.costa@etec.sp.gov.br" className={campo} />
            </div>
            <div>
              <label htmlFor="senha" className="block text-[13px] font-medium text-[#344054] mb-1.5">Senha</label>
              <div className="relative">
                <input id="senha" type={mostrar ? "text" : "password"} autoComplete="current-password" required value={senha}
                  onChange={(e) => setSenha(e.target.value)} placeholder="••••••••••" className={`${campo} pr-20`} />
                <button type="button" onClick={() => setMostrar(!mostrar)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-blue-600 hover:underline">
                  {mostrar ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2.5 text-[13px] text-[#475467] pt-1">
              <input type="checkbox" checked={manter} onChange={(e) => setManter(e.target.checked)} className="w-4 h-4 accent-blue-600" />
              Manter conectado neste computador
            </label>
            {erro && <Alert>{erro}</Alert>}
            <Button type="submit" variant="primary" loading={enviando} className="w-full !py-3 !rounded-[10px] !text-[14.5px]">Entrar</Button>
          </form>

          <p className="mt-7 pt-5 border-t border-[#E3E6EE] text-[13px] text-[#667085] leading-relaxed">
            <strong className="text-[#344054] font-semibold">Só a coordenação entra pela web.</strong> Professores e alunos não têm acesso por aqui.<br />
            Primeiro acesso? <Link to="/cadastro" className="text-blue-600 font-medium hover:underline">Criar cadastro de coordenador</Link>
          </p>
        </div>

        <div className="text-[11.5px] text-[#98A2B3]">© {new Date().getFullYear()} Centro Paula Souza · Didáskaros</div>
      </section>

      <section className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-[#0D1F47] to-[#16336E] text-white px-14 py-14">
        <div className="w-full max-w-[640px] mx-auto">
          <div className="text-[12.5px] text-white/55 mb-1.5">3DS · Desenvolvimento de Sistemas · Manhã</div>
          <h2 className="font-archivo text-[21px] font-semibold tracking-tight mb-6">Grade montada sem conflitos</h2>
          <table className="w-full border-separate border-spacing-[5px]">
            <thead>
              <tr>
                <th className="w-12" />
                {DIAS_CURTOS.map((d) => <th key={d} className="text-[10.5px] font-semibold tracking-[.09em] uppercase text-white/40 pb-2">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {VITRINE.map((linha, i) => (
                <tr key={HORAS[i]}>
                  <td className="text-right pr-2 align-top pt-2 text-[11px] font-semibold text-white/45 tabular-nums">{HORAS[i]}</td>
                  {linha.map((aula, dia) => (
                    <td key={dia}>
                      {aula ? (
                        <div className={`h-[54px] rounded-lg px-2.5 py-2 border-l-2 animate-fade-in-up ${COR[aula[2]]}`}
                          style={{ animationDelay: `${100 + dia * 80}ms`, animationFillMode: "backwards" }}>
                          <div className="text-[11.5px] font-semibold leading-tight">{aula[0]}</div>
                          <div className="text-[10px] text-white/55 mt-1">{aula[1]}</div>
                        </div>
                      ) : <div className="h-[54px] rounded-lg border border-dashed border-white/10" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-6 pt-5 border-t border-white/10 text-[13px] text-white/60 leading-relaxed max-w-[46ch]">
            <b className="text-white font-semibold">Grade gerada por IA e conferida por um validador independente:</b> nenhum
            conflito de professor, sala ou turma.
          </p>
        </div>
      </section>
    </div>
  );
}
