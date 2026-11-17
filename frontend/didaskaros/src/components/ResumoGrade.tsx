import type { GradeDetalhe } from "../api/types";
import { tituloObservacoes } from "./EdicaoGrade";

/** numeros da grade, explicacao da IA e os conflitos q o validador achou */
export function ResumoGrade({ grade }: { grade: GradeDetalhe }) {
  const stats = [
    { label: "Aulas/sem", valor: grade.aulas.length, cor: "bg-blue-50 text-blue-700" },
    { label: "Professores", valor: grade.professores.length, cor: "bg-emerald-50 text-emerald-700" },
    { label: "Disciplinas", valor: grade.disciplinas.length, cor: "bg-violet-50 text-violet-700" },
    { label: "Janelas", valor: grade.metricas.janelasTurmas, cor: "bg-gray-50 text-gray-700" },
    { label: "Conflitos", valor: grade.violacoes.length, cor: grade.violacoes.length ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700" },
  ];

  return (
    <div className="border-t border-gray-100 px-5 py-4 space-y-4">
      <div className="grid grid-cols-5 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl px-3 py-2.5 text-center ${s.cor}`}>
            <p className="text-[20px] font-extrabold leading-none">{s.valor}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide mt-1 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {grade.observacoes && (
        <div className="rounded-xl bg-blue-50/60 border border-blue-100 px-4 py-3">
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide mb-1">{tituloObservacoes(grade)}</p>
          <p className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-line">{grade.observacoes}</p>
        </div>
      )}

      {grade.violacoes.length > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-[11px] font-bold text-red-700 uppercase tracking-wide mb-1">Conflitos encontrados pelo validador</p>
          <ul className="list-disc pl-5 text-[12px] text-red-700 space-y-0.5 max-h-48 overflow-y-auto">
            {grade.violacoes.map((v, i) => <li key={i}>{v.mensagem}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
