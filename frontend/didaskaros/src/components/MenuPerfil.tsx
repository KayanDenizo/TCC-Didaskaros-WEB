import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { iniciais } from "../lib/format";
import { Icons, type IconName } from "./icons";

const OPCOES: { label: string; desc: string; icon: IconName; to: string }[] = [
  { label: "Meu perfil", desc: "Dados pessoais e senha", icon: "User", to: "/perfil" },
  { label: "Preferências", desc: "Turno padrão e avisos da IA", icon: "Settings", to: "/perfil#preferencias" },
  { label: "Cadastrar coordenador", desc: "Dar acesso a outra pessoa da coordenação", icon: "UserPlus", to: "/cadastro" },
];

/** avatar no canto de cima com o menu da conta */
export function MenuPerfil() {
  const { usuario, sair } = useAuth();
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  // fecha se clicar fora ou apertar Esc
  useEffect(() => {
    if (!aberto) return;
    const clique = (e: MouseEvent) => { if (!raiz.current?.contains(e.target as Node)) setAberto(false); };
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false); };
    document.addEventListener("mousedown", clique);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", clique);
      document.removeEventListener("keydown", tecla);
    };
  }, [aberto]);

  const sigla = iniciais(usuario?.nome ?? "");

  return (
    <div ref={raiz} className="relative">
      <button type="button" onClick={() => setAberto(!aberto)} aria-haspopup="menu" aria-expanded={aberto}
        title={usuario?.nome} aria-label="Menu da conta"
        className={`w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-xs font-bold
          transition-all duration-200 hover:scale-105 ${aberto ? "ring-4 ring-blue-100" : "hover:ring-4 hover:ring-blue-50"}`}>
        {sigla}
      </button>

      {aberto && (
        <div role="menu" className="absolute right-0 top-[calc(100%+10px)] w-72 bg-white rounded-2xl border border-gray-200 shadow-[0_12px_40px_rgba(15,36,86,0.16)] overflow-hidden origin-top-right animate-scale-in">
          <div className="flex items-center gap-3 px-4 py-4 bg-gradient-to-br from-[#0F2456] to-[#1B3A7A]">
            <span className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-300 flex items-center justify-center text-white text-sm font-bold ring-2 ring-white/20 shrink-0">
              {sigla}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-white truncate">{usuario?.nome}</p>
              <p className="text-[11px] text-white/60 truncate">{usuario?.email}</p>
              <p className="mt-1 inline-block text-[10px] font-semibold text-blue-100 bg-white/10 px-2 py-0.5 rounded-full truncate max-w-full">
                Coordenação · {usuario?.unidade}
              </p>
            </div>
          </div>

          <div className="py-1.5">
            {OPCOES.map((o) => {
              const Icon = Icons[o.icon];
              return (
                <Link key={o.label} to={o.to} role="menuitem" onClick={() => setAberto(false)}
                  className="group flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 focus:bg-gray-50 outline-none transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center shrink-0 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
                    <Icon />
                  </span>
                  <span className="min-w-0 transition-transform duration-200 group-hover:translate-x-0.5">
                    <span className="block text-[13px] font-semibold text-gray-800">{o.label}</span>
                    <span className="block text-[11px] text-gray-400 truncate">{o.desc}</span>
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="border-t border-gray-100 py-1.5">
            <button type="button" role="menuitem" onClick={() => { sair(); window.location.assign("/painel"); }}
              className="group w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-red-50 focus:bg-red-50 outline-none transition-colors">
              <span className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0"><Icons.LogOut /></span>
              <span className="text-[13px] font-semibold text-red-600 transition-transform duration-200 group-hover:translate-x-0.5">Sair</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
