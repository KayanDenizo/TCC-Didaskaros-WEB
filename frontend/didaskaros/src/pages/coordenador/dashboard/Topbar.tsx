import { Icons } from "./icons";

export function Topbar({ title, breadcrumb }: { title: string; breadcrumb: string }) {
  return (
    <header className="h-[60px] bg-white border-b border-gray-200 flex items-center px-6 gap-4 sticky top-0 z-40 shadow-sm">
      <div>
        <p className="text-[15px] font-bold text-gray-900 leading-tight">{title}</p>
        <p className="text-[11px] text-gray-400">{breadcrumb}</p>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Icons.Search /></span>
          <input
            className="bg-gray-100 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-[13px] text-gray-700 placeholder-gray-400 outline-none focus:border-blue-400 focus:bg-white w-56 transition-all"
            placeholder="Buscar professores, turmas..."
          />
        </div>
        <span className="text-[12px] text-gray-400 font-medium">Ter, 21 Jul 2026</span>
        <button className="relative w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
          <Icons.Bell />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
        </button>
        <button className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-xs font-bold">MC</button>
      </div>
    </header>
  );
}
