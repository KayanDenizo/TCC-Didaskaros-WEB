import { useMatches } from "react-router-dom";
import { MenuPerfil } from "./MenuPerfil";

export interface RouteHandle {
  title: string;
  section?: string;
}

export function Topbar() {
  const handle = useMatches().map((m) => m.handle as RouteHandle | undefined).reverse().find(Boolean);
  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
    .replace(/^./, (c) => c.toUpperCase());

  return (
    <header className="h-[60px] bg-white border-b border-gray-200 flex items-center px-6 gap-4 sticky top-0 z-40 shadow-sm print:hidden">
      <div>
        <p className="text-[15px] font-bold text-gray-900 leading-tight">{handle?.title}</p>
        <p className="text-[11px] text-gray-400">Didaskaros{handle?.section && ` › ${handle.section}`} › {handle?.title}</p>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-[12px] text-gray-400 font-medium">{hoje}</span>
        <MenuPerfil />
      </div>
    </header>
  );
}
