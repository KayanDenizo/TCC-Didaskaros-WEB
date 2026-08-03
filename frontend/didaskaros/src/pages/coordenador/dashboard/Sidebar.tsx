import { Icons } from "./icons";
import { NAV } from "./data";
import type { Screen, SetScreen } from "./types";

export function Sidebar({ active, setScreen }: { active: Screen; setScreen: SetScreen }) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 flex flex-col z-50"
      style={{ background: "linear-gradient(180deg, #0F2456 0%, #1B3A7A 100%)" }}>

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-black text-sm">D</div>
          <span className="text-white font-extrabold text-sm tracking-tight">DIDÁSKAROS</span>
        </div>
      </div>

      {/* Usuário */}
      <div className="px-4 py-3.5 flex items-center gap-2.5 border-b border-white/10 bg-white/5">
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">MC</div>
        <div>
          <p className="text-white text-xs font-semibold leading-tight">Maria Costa</p>
          <p className="text-white/50 text-[10px] leading-tight">Coordenadora · ETEC Uirapuru</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="text-[9px] font-bold tracking-[1.2px] text-white/35 uppercase px-5 pt-4 pb-1.5">{group.section}</p>
            {group.items.map((item) => {
              const isActive = active === item.screen;
              const IconEl = item.icon ? Icons[item.icon] : null;
              return (
                <button
                  key={item.label}
                  onClick={() => item.screen && setScreen(item.screen)}
                  className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-[13px] transition-all relative text-left
                    ${isActive
                      ? "text-white font-semibold bg-blue-600/20"
                      : "text-white/60 hover:text-white hover:bg-white/7 font-normal"
                    }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r bg-blue-400" />
                  )}
                  {IconEl && <span className={isActive ? "text-blue-300" : "text-white/40"}><IconEl /></span>}
                  {!IconEl && <span className={`w-1 h-1 rounded-full ${isActive ? "bg-blue-400" : "bg-white/25"}`} />}
                  {item.label}
                  {item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 py-2">
        <button className="w-full flex items-center gap-2.5 px-5 py-2.5 text-[13px] text-white/50 hover:text-white transition-colors">
          <Icons.Settings /><span>Configurações</span>
        </button>
        <button className="w-full flex items-center gap-2.5 px-5 py-2.5 text-[13px] text-white/50 hover:text-white transition-colors">
          <Icons.LogOut /><span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
