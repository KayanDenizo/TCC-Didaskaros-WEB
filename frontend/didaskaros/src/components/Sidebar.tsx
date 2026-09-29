import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { iniciais } from "../lib/format";
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
  const navigate = useNavigate();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 flex flex-col z-50 bg-gradient-to-b from-[#0F2456] to-[#1B3A7A] print:hidden">
      <div className="px-5 py-5 border-b border-white/10 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-black text-sm">D</div>
        <span className="text-white font-extrabold text-sm tracking-tight">DIDASKAROS</span>
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

      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="text-[9px] font-bold tracking-[1.2px] text-white/35 uppercase px-5 pt-4 pb-1.5">{group.section}</p>
            {group.items.map((item) => {
              const Icon = Icons[item.icon];
              return (
                <NavLink key={item.to} to={item.to}
                  className={({ isActive }) => `relative flex items-center gap-2.5 px-5 py-2.5 text-[13px] transition-all ${isActive
                    ? "text-white font-semibold bg-blue-600/20 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-6 before:rounded-r before:bg-blue-400"
                    : "text-white/60 hover:text-white hover:bg-white/5"}`}>
                  <Icon />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 py-2">
        <button onClick={() => { sair(); navigate("/login"); }}
          className="w-full flex items-center gap-2.5 px-5 py-2.5 text-[13px] text-white/50 hover:text-white transition-colors">
          <Icons.LogOut /> Sair
        </button>
      </div>
    </aside>
  );
}
