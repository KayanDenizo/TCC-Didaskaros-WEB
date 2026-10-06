import { useMatches } from "react-router-dom";
import { Icons } from "./icons";
import { MenuPerfil } from "./MenuPerfil";
import { EVENTO_ABRIR_PALETA } from "./PaletaComandos";

export interface RouteHandle {
  title: string;
  section?: string;
}

export function Topbar() {
  const handle = useMatches().map((m) => m.handle as RouteHandle | undefined).reverse().find(Boolean);
  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })
    .replace(/^./, (c) => c.toUpperCase());
  const mac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="h-[60px] border-b border-gray-200/70 bg-white/75 backdrop-blur-xl backdrop-saturate-150 flex items-center px-6 gap-4 sticky top-0 z-40 print:hidden">
      <div className="min-w-0">
        <nav aria-label="Você está em" className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
          <span>Didáskaros</span>
          {handle?.section && (<><span className="text-gray-300">/</span><span>{handle.section}</span></>)}
        </nav>
        <p className="text-[15px] font-bold text-gray-900 leading-tight truncate">{handle?.title}</p>
      </div>

      <button type="button" onClick={() => window.dispatchEvent(new Event(EVENTO_ABRIR_PALETA))}
        className="group ml-auto flex h-9 w-64 items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50/80 px-3 text-[12px] text-gray-400 transition-all duration-200 hover:border-blue-300 hover:bg-white hover:shadow-sm">
        <span className="transition-colors group-hover:text-blue-600"><Icons.Search /></span>
        <span className="flex-1 text-left">Buscar ou ir para…</span>
        <kbd className="tecla">{mac ? "⌘" : "Ctrl"}</kbd>
        <kbd className="tecla -ml-1.5">K</kbd>
      </button>

      <div className="flex items-center gap-3">
        <span className="hidden xl:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-gray-500">
          <Icons.Calendar /> {hoje}
        </span>
        <MenuPerfil />
      </div>
    </header>
  );
}
