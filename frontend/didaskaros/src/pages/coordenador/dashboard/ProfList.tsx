import { PROFESSORS } from "./data";
import type { ProfessorFilter } from "./types";

export function ProfList({ filter }: { filter: ProfessorFilter }) {
  const filtered = filter === "todos"
    ? PROFESSORS
    : filter === "disponivel"
      ? PROFESSORS.filter(p => p.status === "Disponível")
      : PROFESSORS.filter(p => p.status === "Ausente");

  return (
    <div className="divide-y divide-gray-50">
      {filtered.map((p) => (
        <div key={p.name} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="relative shrink-0">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${p.av} flex items-center justify-center text-white text-xs font-bold`}>
              {p.initials}
            </div>
            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${p.dot} rounded-full border-2 border-white`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-800 truncate">{p.name}</p>
            <p className="text-[11px] text-gray-400 truncate">{p.disc}</p>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${p.badge}`}>{p.status}</span>
        </div>
      ))}
    </div>
  );
}
