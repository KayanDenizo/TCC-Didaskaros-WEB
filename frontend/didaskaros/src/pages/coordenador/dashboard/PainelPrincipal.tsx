import { useState } from "react";
import { Icons } from "./icons";
import { Topbar } from "./Topbar";
import { StatCard } from "./StatCard";
import { ProfList } from "./ProfList";
import { NEXT_CLASSES, ACTIVITIES } from "./data";
import type { SetScreen, ProfessorFilter } from "./types";

export function PainelPrincipal({ setScreen }: { setScreen: SetScreen }) {
  const [profFilter, setProfFilter] = useState<ProfessorFilter>("todos");
  const filterTabs: ProfessorFilter[] = ["todos", "disponivel", "ausente"];
  const filterLabels: Record<ProfessorFilter, string> = { todos: "Todos (24)", disponivel: "Disponíveis (18)", ausente: "Ausentes (6)" };

  return (
    <main className="flex-1 ml-60">
      <Topbar title="Painel Principal" breadcrumb="Didaskaros › Painel Principal" />
      <div className="p-7">

        {/* Header */}
        <div className="flex items-start justify-between mb-6 animate-fade-in-up">
          <div>
            <h1 className="text-[22px] font-extrabold text-gray-900 tracking-tight">Painel Principal</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Bem-vinda, Maria! Aqui está o resumo do dia — Terça-feira, 21 de julho de 2026.</p>
          </div>
          <div className="flex gap-2.5">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-[13px] font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:scale-[1.02] active:scale-[0.97] transition-all">
              <Icons.Calendar /> Ver Grades
            </button>
            <button onClick={() => setScreen("gerar-grade")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.97]"
              style={{ background: "linear-gradient(135deg, #1E4DA1, #2563EB)", boxShadow: "0 2px 12px rgba(37,99,235,0.3)" }}>
              ✨ Gerar Grade
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label="Total de Professores" value="24" trend="↑ 2 novos" trendColor="bg-blue-50 text-blue-700" sub="este mês" emoji="👨‍🏫" iconBg="bg-blue-50" accent="bg-blue-500" delay={0} />
          <StatCard label="Disponíveis Hoje" value="18" trend="6 ausentes" trendColor="bg-amber-50 text-amber-700" sub="hoje" emoji="✅" iconBg="bg-emerald-50" accent="bg-emerald-500" delay={80} />
          <StatCard label="Grades Geradas" value="7" trend="3 publicadas" trendColor="bg-emerald-50 text-emerald-700" sub="· 4 rascunhos" emoji="📋" iconBg="bg-amber-50" accent="bg-amber-500" delay={160} />
          <StatCard label="Conflitos Pendentes" value="2" trend="Atenção" trendColor="bg-amber-50 text-amber-700" sub="necessária" emoji="⚠️" iconBg="bg-violet-50" accent="bg-violet-500" delay={240} />
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-[1fr_300px] gap-5">

          {/* COLUNA ESQUERDA */}
          <div className="flex flex-col gap-5">

            {/* Próximas Aulas */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: "120ms", animationFillMode: "backwards" }}>
              <div className="px-5 py-4 flex items-start justify-between border-b border-gray-100">
                <div>
                  <p className="text-[14px] font-bold text-gray-900">Próximas Aulas — Hoje</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Turma 3DS · Turno Manhã</p>
                </div>
                <button className="text-[12px] font-semibold text-blue-600 hover:underline">
                  Ver grade completa →
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {NEXT_CLASSES.map((a) => (
                  <div key={a.time} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 hover:pl-6 transition-all cursor-pointer">
                    <span className="text-[12px] font-bold text-blue-700 w-10 tabular-nums shrink-0">{a.time}</span>
                    <span className={`w-[3px] h-9 rounded-full ${a.color} shrink-0`} />
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-gray-900">{a.disc}</p>
                      <p className="text-[11px] text-gray-400">{a.prof}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg shrink-0">{a.sala}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conflitos */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: "200ms", animationFillMode: "backwards" }}>
              <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
                <div>
                  <p className="text-[14px] font-bold text-gray-900">Conflitos e Alertas</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Requerem sua atenção</p>
                </div>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">2 pendentes</span>
              </div>

              <div className="divide-y divide-gray-50">
                <div className="flex items-start gap-3 px-5 py-4 hover:bg-red-50/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shrink-0 mt-0.5"><Icons.AlertTriangle /></div>
                  <div className="flex-1">
                    <p className="text-[13px] text-gray-700 leading-snug"><strong className="text-gray-900">Prof. Carlos Oliveira</strong> alocado em duas turmas simultaneamente na Quinta-feira, 09h10.</p>
                    <p className="text-[11px] text-gray-400 mt-1">Detectado há 2 horas · Grade 3DS-2025</p>
                  </div>
                  <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-1 rounded-full shrink-0 animate-pulse">Crítico</span>
                </div>
                <div className="flex items-start gap-3 px-5 py-4 hover:bg-amber-50/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">🔔</div>
                  <div className="flex-1">
                    <p className="text-[13px] text-gray-700 leading-snug"><strong className="text-gray-900">Sala 102</strong> com capacidade excedida — 38 alunos vs. 35 lugares.</p>
                    <p className="text-[11px] text-gray-400 mt-1">Detectado ontem · Turma 2DS</p>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded-full shrink-0">Aviso</span>
                </div>
              </div>

              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                <button className="text-[12px] font-semibold text-gray-600 border border-gray-200 bg-white px-3 py-1.5 rounded-lg hover:border-blue-400 hover:text-blue-600 hover:scale-[1.02] active:scale-[0.97] transition-all">
                  Ver todos os conflitos
                </button>
              </div>
            </div>

            {/* Atividades */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: "280ms", animationFillMode: "backwards" }}>
              <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
                <p className="text-[14px] font-bold text-gray-900">Atividades Recentes</p>
                <button className="text-[12px] font-semibold text-blue-600 hover:underline">Ver histórico</button>
              </div>
              <div className="divide-y divide-gray-50">
                {ACTIVITIES.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <span className={`w-2 h-2 rounded-full ${a.color} shrink-0 mt-1.5`} />
                    <div>
                      <p className="text-[13px] text-gray-700 leading-snug [&_strong]:text-gray-900 [&_strong]:font-semibold">{a.text}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>{/* /col esquerda */}

          {/* COLUNA DIREITA — PROFESSORES */}
          <div className="animate-fade-in-up" style={{ animationDelay: "160ms", animationFillMode: "backwards" }}>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-4">
              <div className="px-4 py-4 border-b border-gray-100 flex items-start justify-between">
                <div>
                  <p className="text-[14px] font-bold text-gray-900">Professores Disponíveis</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Status em tempo real — hoje</p>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ao vivo
                </span>
              </div>

              {/* filter tabs */}
              <div className="flex gap-1.5 px-3 py-2.5 border-b border-gray-100">
                {filterTabs.map((f) => (
                  <button
                    key={f}
                    onClick={() => setProfFilter(f)}
                    className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all
                      ${profFilter === f
                        ? "bg-blue-700 text-white"
                        : "text-gray-500 hover:bg-gray-100"
                      }`}
                  >
                    {filterLabels[f].split(" ")[0]}
                    <br />
                    <span className="font-normal opacity-80">{filterLabels[f].split(" ")[1]}</span>
                  </button>
                ))}
              </div>

              <div className="max-h-[420px] overflow-y-auto">
                <ProfList filter={profFilter} />
              </div>

              <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
                <p className="text-[12px] text-blue-700 font-medium">
                  📊 <strong>18 disponíveis</strong> · <strong>4 em aula</strong> · <strong>2 ausentes</strong>
                </p>
              </div>
            </div>
          </div>

        </div>{/* /grid */}
      </div>
    </main>
  );
}
