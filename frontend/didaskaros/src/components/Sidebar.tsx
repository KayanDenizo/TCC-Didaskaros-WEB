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
    <aside className="sidebar fixed left-0 top-0 bottom-0 w-60 flex flex-col z-50 print:hidden">
      <div className="px-5 h-[60px] border-b border-white/[0.08] flex items-center">
        <Link to="/painel" aria-label="Ir para o Painel Principal" className="cursor-pointer rounded-md">
          <img src={logo} alt="Didáskaros" className="brand-mark h-9 w-auto select-none" draggable={false} />
        </Link>
      </div>

      <nav className="relative flex-1 px-3 py-2 overflow-y-auto">
        {marcador && (
          <span aria-hidden className="nav-marker absolute left-3 right-3 rounded-xl bg-white/[0.09] ring-1 ring-inset ring-white/[0.08] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)] pointer-events-none"
            style={{ top: marcador.top, height: marcador.height }}>
            <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-blue-300 shadow-[0_0_12px_rgba(147,197,253,0.9)]" />
          </span>
        )}
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="text-[10px] font-semibold tracking-[1.4px] text-white/30 uppercase px-3 pt-5 pb-2">{group.section}</p>
            {group.items.map((item) => {
              const Icon = Icons[item.icon];
              return (
                <NavLink key={item.to} to={item.to}
                  ref={(el) => { if (el) links.current.set(item.to, el); else links.current.delete(item.to); }}
                  className={({ isActive }) => `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 my-0.5 text-[13px] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-blue-300/60 ${isActive
                    ? "text-white font-semibold"
                    : "text-white/55 hover:text-white hover:bg-white/[0.04]"}`}>
                  {({ isActive }) => (
                    <>
                      <span className={`transition-all duration-300 ${isActive ? "text-blue-200" : "group-hover:scale-110"}`}><Icon /></span>
                      <span className="transition-transform duration-200 group-hover:translate-x-0.5">{item.label}</span>
                      {item.to === "/gerar-grade" && (
                        <span className="ml-auto rounded-md bg-gradient-to-r from-blue-400/30 to-cyan-300/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-100 ring-1 ring-inset ring-white/10">IA</span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Conta: no rodapé, onde o olho procura */}
      <div className="m-3 rounded-2xl bg-white/[0.05] ring-1 ring-inset ring-white/[0.07] p-2.5">
        <div className="flex items-center gap-2.5 px-1">
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {iniciais(usuario?.nome ?? "")}
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#16306a]" title="Conectado" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-[12px] font-semibold leading-tight truncate">{usuario?.nome}</p>
            <p className="text-white/45 text-[10px] leading-tight truncate mt-0.5">{usuario?.unidade}</p>
          </div>
          <button onClick={() => { sair(); window.location.assign("/painel"); }} title="Sair" aria-label="Sair"
            className="grid h-8 w-8 place-items-center rounded-lg text-white/45 transition-colors hover:bg-white/10 hover:text-white">
            <Icons.LogOut />
          </button>
        </div>
      </div>
    </aside>
  );
}
