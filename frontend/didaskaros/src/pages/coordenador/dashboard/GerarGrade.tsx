import { useState } from "react";
import { Icons } from "./icons";
import { Topbar } from "./Topbar";
import { TURMAS, CONSTRAINTS, GRADE_DATA, DISC_COLORS, getDiscColor } from "./data";
import type { SetScreen } from "./types";

type Step = 1 | 2 | 3 | 4;
type Turno = "manha" | "tarde" | "noite";

const TURNO_LABEL: Record<Turno, string> = { manha: "Manhã", tarde: "Tarde", noite: "Noite" };
const STEPS = [
  { n: 1 as Step, label: "Parâmetros" },
  { n: 2 as Step, label: "Restrições" },
  { n: 3 as Step, label: "Revisão" },
  { n: 4 as Step, label: "Resultado" },
];
const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

export function GerarGrade({ setScreen }: { setScreen: SetScreen }) {
  const [step, setStep] = useState<Step>(1);
  const [turma, setTurma] = useState(TURMAS[0].id);
  const [turno, setTurno] = useState<Turno>("manha");
  const [aulasPorDia, setAulasPorDia] = useState(5);
  const [selectedConstraints, setSelectedConstraints] = useState<string[]>(["evitar-janelas", "priorizar-preferencias"]);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const turmaNome = TURMAS.find((t) => t.id === turma)?.nome ?? "";

  function toggleConstraint(id: string) {
    setSelectedConstraints((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function handleGenerate() {
    setStep(4);
    setDone(false);
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setDone(true);
    }, 2000);
  }

  return (
    <main className="flex-1 ml-60">
      <Topbar title="Gerar Grade" breadcrumb="Didaskaros › Planejamento › Gerar Grade" />
      <div className="p-7">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-extrabold text-gray-900 tracking-tight">Gerar Grade com IA</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Configure os parâmetros e deixe a IA montar a grade horária automaticamente.</p>
          </div>
          <button
            onClick={() => setScreen("planejamento")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-[13px] font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-all"
          >
            <Icons.ChevronLeft /> Voltar às Grades
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center mb-6 bg-white border border-gray-200 rounded-2xl px-6 py-4 shadow-sm">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 transition-all duration-300
                    ${step === s.n ? "bg-blue-700 text-white scale-110 shadow-[0_0_0_4px_rgba(37,99,235,0.15)]" : step > s.n ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"}`}
                >
                  <span className={step > s.n ? "animate-pop-in inline-block" : "inline-block"}>{step > s.n ? "✓" : s.n}</span>
                </div>
                <span className={`text-[13px] font-semibold whitespace-nowrap transition-colors duration-300 ${step >= s.n ? "text-gray-900" : "text-gray-400"}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-[2px] mx-4 rounded bg-gray-100 overflow-hidden`}>
                  <div className={`h-full bg-emerald-400 transition-all duration-500 ease-out ${step > s.n ? "w-full" : "w-0"}`} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* STEP 1 — Parâmetros */}
        {step === 1 && (
          <div className="grid grid-cols-[1fr_300px] gap-5 animate-fade-in-up">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <p className="text-[14px] font-bold text-gray-900 mb-1">Parâmetros da Grade</p>
              <p className="text-[12px] text-gray-400 mb-5">Defina turma, turno e período letivo</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-semibold text-gray-600 block mb-1.5">Turma</label>
                  <select
                    value={turma}
                    onChange={(e) => setTurma(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-[13px] text-gray-700 bg-white outline-none focus:border-blue-400"
                  >
                    {TURMAS.map((t) => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-gray-600 block mb-1.5">Ano Letivo</label>
                  <select className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-[13px] text-gray-700 bg-white outline-none focus:border-blue-400">
                    <option>2026</option>
                    <option>2027</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-[12px] font-semibold text-gray-600 block mb-1.5">Turno</label>
                  <div className="flex gap-2">
                    {(Object.keys(TURNO_LABEL) as Turno[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTurno(t)}
                        className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold border transition-all
                          ${turno === t ? "bg-blue-700 border-blue-700 text-white" : "bg-white border-gray-200 text-gray-600 hover:border-blue-300"}`}
                      >
                        {TURNO_LABEL[t]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-gray-600 block mb-1.5">Aulas por dia</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={aulasPorDia}
                    onChange={(e) => setAulasPorDia(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-[13px] text-gray-700 bg-white outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-gray-600 block mb-1.5">Duração da aula</label>
                  <select className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-[13px] text-gray-700 bg-white outline-none focus:border-blue-400">
                    <option>50 minutos</option>
                    <option>45 minutos</option>
                    <option>60 minutos</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 h-fit">
              <p className="text-[13px] font-bold text-gray-900 mb-3">Disciplinas na turma</p>
              <div className="flex flex-col gap-2.5">
                {Object.entries(DISC_COLORS).map(([disc, { dot }]) => (
                  <div key={disc} className="flex items-center gap-2 text-[12px] text-gray-600">
                    <span className={`w-2 h-2 rounded-full ${dot}`} /> {disc}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — Restrições */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-fade-in-up">
            <p className="text-[14px] font-bold text-gray-900 mb-1">Restrições e Preferências</p>
            <p className="text-[12px] text-gray-400 mb-5">Escolha as regras que a IA deve respeitar ao montar a grade</p>

            <div className="grid grid-cols-2 gap-3">
              {CONSTRAINTS.map((c) => {
                const active = selectedConstraints.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleConstraint(c.id)}
                    className={`flex items-start gap-3 text-left p-4 rounded-xl border transition-all duration-150 hover:scale-[1.01] active:scale-[0.98]
                      ${active ? "border-blue-400 bg-blue-50/50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"}`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-150
                        ${active ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}
                    >
                      {active && <span className="text-white text-[10px] font-bold animate-pop-in inline-block">✓</span>}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900">{c.label}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{c.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3 — Revisão */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-fade-in-up">
            <p className="text-[14px] font-bold text-gray-900 mb-1">Revisar Configurações</p>
            <p className="text-[12px] text-gray-400 mb-5">Confira os parâmetros antes de gerar a grade</p>

            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Turma</p>
                <p className="text-[13px] font-bold text-gray-900">{turmaNome}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Turno</p>
                <p className="text-[13px] font-bold text-gray-900">{TURNO_LABEL[turno]}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Aulas/dia</p>
                <p className="text-[13px] font-bold text-gray-900">{aulasPorDia}</p>
              </div>
            </div>

            <p className="text-[12px] font-bold text-gray-700 mb-2">Restrições ativas ({selectedConstraints.length})</p>
            <div className="flex flex-wrap gap-2">
              {selectedConstraints.length === 0 && <span className="text-[12px] text-gray-400">Nenhuma restrição selecionada</span>}
              {selectedConstraints.map((id) => {
                const c = CONSTRAINTS.find((c) => c.id === id);
                return c ? (
                  <span key={id} className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{c.label}</span>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* STEP 4 — Resultado */}
        {step === 4 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in-up">
            {generating && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="relative w-14 h-14">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
                </div>
                <p className="text-[14px] font-bold text-gray-900">Gerando grade com IA...</p>
                <p className="text-[12px] text-gray-400 animate-pulse">Analisando disponibilidade de professores e restrições</p>
              </div>
            )}

            {done && (
              <div className="animate-scale-in">
                <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 bg-emerald-50/50">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold animate-pop-in">✓</span>
                    <div>
                      <p className="text-[14px] font-bold text-gray-900">Grade gerada com sucesso</p>
                      <p className="text-[11px] text-gray-400">{turmaNome} · 0 conflitos encontrados</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-3 py-1 rounded-full">Rascunho</span>
                </div>

                <div className="overflow-x-auto px-4 py-4">
                  <table className="w-full border-separate border-spacing-1 min-w-[560px]">
                    <thead>
                      <tr>
                        <th className="w-16 text-right pr-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide pb-2">Horário</th>
                        {DAYS.map((d) => (
                          <th key={d} className="text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide pb-2">{d}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(GRADE_DATA).map((time) => (
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
                                <div className={`rounded-lg px-2.5 py-2 border-l-[3px] h-[52px] ${style.cell}`}>
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

                <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                  <button
                    onClick={handleGenerate}
                    className="text-[12px] font-semibold text-gray-600 border border-gray-200 bg-white px-4 py-2 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-all active:scale-[0.97]"
                  >
                    ↻ Gerar Novamente
                  </button>
                  <div className="flex gap-2.5">
                    <button className="text-[13px] font-semibold text-gray-700 border border-gray-200 bg-white px-4 py-2 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-all active:scale-[0.97]">
                      Salvar Rascunho
                    </button>
                    <button
                      onClick={() => setScreen("planejamento")}
                      className="text-[13px] font-semibold text-white px-4 py-2 rounded-xl hover:opacity-90 hover:scale-[1.02] active:scale-[0.97] transition-all"
                      style={{ background: "linear-gradient(135deg, #1E4DA1, #2563EB)", boxShadow: "0 2px 12px rgba(37,99,235,0.3)" }}
                    >
                      Publicar Grade
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navegação entre etapas */}
        {step < 4 && (
          <div className="flex items-center justify-between mt-5">
            <button
              onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
              disabled={step === 1}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-[13px] font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-600 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-700 disabled:active:scale-100"
            >
              <Icons.ChevronLeft /> Voltar
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep((s) => (s + 1) as Step)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 hover:scale-[1.02] active:scale-[0.97] transition-all"
                style={{ background: "linear-gradient(135deg, #1E4DA1, #2563EB)", boxShadow: "0 2px 12px rgba(37,99,235,0.3)" }}
              >
                Próximo <Icons.ChevronRight />
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 hover:scale-[1.02] active:scale-[0.97] transition-all"
                style={{ background: "linear-gradient(135deg, #1E4DA1, #2563EB)", boxShadow: "0 2px 12px rgba(37,99,235,0.3)" }}
              >
                <Icons.Sparkles /> Gerar Grade
              </button>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
