import { useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { iniciais } from "../lib/format";
import logo from "../assets/logo-didaskaros.png";
import { Icons, type IconName } from "./icons";

const NAV: { section: string; items: { label: string; icon: IconName; to: string }[] }[] = [
  { section: "Geral", items: [{ label: "Painel Principal", icon: "Grid", to: "/painel" }] },
  {
    section: "Planejamento",
    items: [
      { label: "Grades Horárias", icon: "Calendar", to: "/grades" },
      { label: "Gerar Grade", icon: "Sparkles", to: "/gerar-grade" },
    ],
  },
  {
    section: "Cadastros",
    items: [
      { label: "Professores", icon: "Users", to: "/professores" },
      { label: "Turmas", icon: "Layers", to: "/turmas" },
      { label: "Disciplinas", icon: "Book", to: "/disciplinas" },
      { label: "Salas", icon: "Door", to: "/salas" },
    ],
  },
];

export function Sidebar() {
  const { usuario, sair } = useAuth();
  const { pathname } = useLocation();
  const links = useRef(new Map<string, HTMLAnchorElement>());
  const [marcador, setMarcador] = useState<{ top: number; height: number } | null>(null);

  // O destaque do item ativo desliza até o link da página atual
  useLayoutEffect(() => {
    const ativo = [...links.current].find(([to]) => pathname.startsWith(to))?.[1];
    setMarcador(ativo ? { top: ativo.offsetTop, height: ativo.offsetHeight } : null);
  }, [pathname]);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 flex flex-col z-50 bg-gradient-to-b from-[#0F2456] to-[#1B3A7A] print:hidden">
      <div className="px-5 py-5 border-b border-white/10 flex items-center gap-2.5">
        <Link to="/painel" aria-label="Ir para o Painel Principal" className="cursor-pointer rounded-md">
          <img src={logo} alt="Didáskaros" className="brand-mark h-9 w-auto select-none" draggable={false} />
        </Link>
      </div>

      <div className="px-4 py-3.5 flex items-center gap-2.5 border-b border-white/10 bg-white/5">
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {iniciais(usuario?.nome ?? "")}
        </div>
        <div className="min-w-0">
          <p className="text-white text-xs font-semibold leading-tight truncate">{usuario?.nome}</p>
          <p className="text-white/50 text-[10px] leading-tight truncate">Coordenação · {usuario?.unidade}</p>
        </div>
      </div>

      <nav className="relative flex-1 py-3 overflow-y-auto">
        {marcador && (
          <span aria-hidden className="nav-marker absolute left-0 right-0 bg-blue-600/20 pointer-events-none"
            style={{ top: marcador.top, height: marcador.height }}>
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r bg-blue-400" />
          </span>
        )}
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="text-[9px] font-bold tracking-[1.2px] text-white/35 uppercase px-5 pt-4 pb-1.5">{group.section}</p>
            {group.items.map((item) => {
              const Icon = Icons[item.icon];
              return (
                <NavLink key={item.to} to={item.to}
                  ref={(el) => { if (el) links.current.set(item.to, el); else links.current.delete(item.to); }}
                  className={({ isActive }) => `group relative flex items-center gap-2.5 px-5 py-2.5 text-[13px] transition-colors duration-200 ${isActive
                    ? "text-white font-semibold"
                    : "text-white/60 hover:text-white hover:bg-white/5"}`}>
                  <span className="transition-transform duration-200 group-hover:scale-105"><Icon /></span>
                  <span className="transition-transform duration-200 group-hover:translate-x-0.5">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 py-2">
        <button onClick={() => { sair(); window.location.assign("/painel"); }}
          className="w-full flex items-center gap-2.5 px-5 py-2.5 text-[13px] text-white/50 hover:text-white transition-colors">
          <Icons.LogOut /> Sair
        </button>
      </div>
    </aside>
  );
}
