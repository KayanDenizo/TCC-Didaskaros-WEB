import { useState } from "react";
import { Icons } from "./icons";
import { Topbar } from "./Topbar";
import { PROFESSORS, GRADE_DATA, DISC_COLORS, OTHER_GRADES, getDiscColor } from "./data";

export function Planejamento() {
  const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
  const times = Object.keys(GRADE_DATA);
  const [viewMode, setViewMode] = useState<"turma" | "professor" | "sala">("turma");

  return (
    <main className="flex-1 ml-60">
      <Topbar title="Grades Horárias" breadcrumb="Didáskaros › Planejamento › Grades Horárias" />
      <div className="p-7">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-extrabold text-gray-900 tracking-tight">Grades Horárias</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Visualize e gerencie os horários das turmas — 2º Semestre 2026</p>
          </div>
          <div className="flex gap-2.5">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-[13px] font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-all">
              <Icons.Download /> Exportar PDF
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-all"
              style={{ background: "linear-gradient(135deg, #1E4DA1, #2563EB)", boxShadow: "0 2px 12px rgba(37,99,235,0.3)" }}>
              ✨ Gerar Nova Grade
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_280px] gap-5">

          {/* GRADE */}
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

              {/* Card header */}
              <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
                <div>
                  <p className="text-[14px] font-bold text-gray-900">Grade Horária — 3DS (2025)</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Turno Manhã · 22 aulas semanais</p>
                </div>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">✓ Publicada</span>
              </div>

              {/* Filters */}
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
                {/* view mode tabs */}
                <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                  {(["turma", "professor", "sala"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setViewMode(m)}
                      className={`px-3.5 py-1.5 text-[12px] font-semibold transition-all capitalize
                        ${viewMode === m ? "bg-blue-700 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                    >
                      {m === "turma" ? "Por Turma" : m === "professor" ? "Por Professor" : "Por Sala"}
                    </button>
                  ))}
                </div>

                <select className="px-3 py-1.5 border border-gray-200 rounded-xl text-[12px] text-gray-700 bg-white outline-none focus:border-blue-400">
                  <option>Turma: 3DS</option>
                  <option>Turma: 2DS</option>
                  <option>Turma: 1DS</option>
                </select>

                <div className="ml-auto flex items-center gap-2">
                  <button className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-all">
                    <Icons.ChevronLeft />
                  </button>
                  <span className="text-[12px] font-semibold text-gray-700">21–25 Jul 2026</span>
                  <button className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-all">
                    <Icons.ChevronRight />
                  </button>
                </div>
              </div>

              {/* Grade table */}
              <div className="overflow-x-auto px-4 py-4">
                <table className="w-full border-separate border-spacing-1 min-w-[560px]">
                  <thead>
                    <tr>
                      <th className="w-16 text-right pr-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide pb-2">Horário</th>
                      {days.map(d => (
                        <th key={d} className="text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide pb-2">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {times.map((time) => (
                      <tr key={time}>
                        <td className="text-right pr-2 text-[11px] font-bold text-gray-400 tabular-nums pt-1.5 align-top">{time}</td>
                        {GRADE_DATA[time].map((cell, ci) => {
                          if (!cell) {
                            return (
                              <td key={ci} className="p-0.5">
                                <div className="h-[52px] rounded-lg bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
                                  <span className="text-[10px] text-gray-300">—</span>
                                </div>
                              </td>
                            );
                          }
                          const style = getDiscColor(cell) ?? { cell: "bg-gray-50 border-l-gray-400 text-gray-700", dot: "bg-gray-400" };
                          const [disc, prof, sala] = cell.split(" / ");
                          return (
                            <td key={ci} className="p-0.5">
                              <div className={`rounded-lg px-2.5 py-2 border-l-[3px] cursor-pointer hover:opacity-80 transition-opacity h-[52px] ${style.cell}`}>
                                <p className="text-[11px] font-bold leading-tight">{disc}</p>
                                <p className="text-[10px] opacity-70 mt-0.5 leading-tight">{prof}</p>
                                <p className="text-[10px] opacity-60 mt-0.5 leading-tight">{sala}</p>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-3">
                {Object.entries(DISC_COLORS).map(([disc, { dot }]) => (
                  <div key={disc} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-sm ${dot}`} />
                    <span className="text-[11px] text-gray-600">{disc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumo */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-[14px] font-bold text-gray-900 mb-4">Resumo da Grade — 3DS</p>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { value: "22", label: "Aulas/sem", bg: "bg-blue-50 border-blue-100", valC: "text-blue-700" },
                  { value: "5", label: "Professores", bg: "bg-emerald-50 border-emerald-100", valC: "text-emerald-700" },
                  { value: "6", label: "Disciplinas", bg: "bg-violet-50 border-violet-100", valC: "text-violet-700" },
                  { value: "0", label: "Conflitos", bg: "bg-amber-50 border-amber-100", valC: "text-amber-700" },
                ].map((s) => (
                  <div key={s.label} className={`text-center py-4 px-3 rounded-xl border ${s.bg}`}>
                    <p className={`text-2xl font-extrabold ${s.valC}`}>{s.value}</p>
                    <p className="text-[11px] text-gray-500 mt-1 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SIDEBAR DIREITA */}
          <div className="flex flex-col gap-4">

            {/* Disponibilidade */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-4">
              <div className="px-4 py-4 border-b border-gray-100 flex items-start justify-between">
                <div>
                  <p className="text-[14px] font-bold text-gray-900">Disponibilidade Hoje</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Para esta grade</p>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Ao vivo
                </span>
              </div>

              <div className="divide-y divide-gray-50">
                {PROFESSORS.slice(0, 5).map((p) => (
                  <div key={p.name} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                    <div className="relative shrink-0">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${p.av} flex items-center justify-center text-white text-[10px] font-bold`}>{p.initials}</div>
                      <span className={`absolute bottom-0 right-0 w-2 h-2 ${p.dot} rounded-full border-2 border-white`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-gray-800 truncate">{p.name.replace("Prof. ", "").replace("Profa. ", "")}</p>
                      <p className="text-[10px] text-gray-400 truncate">{p.disc.split(" · ")[0]}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${p.badge}`}>{p.status}</span>
                  </div>
                ))}
              </div>

              {/* Outras grades */}
              <div className="px-4 pt-4 pb-3 border-t border-gray-100">
                <p className="text-[12px] font-bold text-gray-700 mb-2.5">Outras Grades</p>
                <div className="flex flex-col gap-2">
                  {OTHER_GRADES.map((g) => (
                    <div key={g.name} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                      <div>
                        <p className="text-[12px] font-semibold text-gray-800">{g.name}</p>
                        <p className="text-[10px] text-gray-400">{g.sub}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${g.badge}`}>{g.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
