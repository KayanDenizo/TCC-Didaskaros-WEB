import { useState } from "react";
import type { Aula, GradeDetalhe } from "../api/types";
import type { EdicaoGrade } from "../hooks/useEdicaoGrade";
import { corDisciplina } from "../lib/cores";
import type { Agrupar } from "../lib/edicaoGrade";
import { DIAS } from "../lib/format";
import { BarraEdicao, BotaoEditar, MarcaEdicao } from "./EdicaoGrade";
import { Select } from "./form";

type Modo = "turma" | "professor" | "sala";
const MODOS: { id: Modo; label: string; chave: Agrupar }[] = [
  { id: "turma", label: "Por Turma", chave: "turmaId" },
  { id: "professor", label: "Por Professor", chave: "professorId" },
  { id: "sala", label: "Por Sala", chave: "salaId" },
];

/** grade da semana, da pra navegar por turma, professor ou sala */
export function GradeViewer({ grade, edicao }: { grade: GradeDetalhe; edicao: EdicaoGrade }) {
  const [modo, setModo] = useState<Modo>("turma");
  const listas = {
    turma: grade.turmas.map((t) => ({ value: t.id, label: `${t.codigo} — ${t.curso}` })),
    professor: grade.professores.map((p) => ({ value: p.id, label: p.nome })),
    sala: grade.salas.map((s) => ({ value: s.id, label: s.nome })),
  };
  const [selecionado, setSelecionado] = useState<Record<Modo, number | undefined>>({ turma: undefined, professor: undefined, sala: undefined });
  const atual = selecionado[modo] ?? listas[modo][0]?.value;
  const { chave } = MODOS.find((m) => m.id === modo)!;
  // editando, mostra a versao da tela; o indice eh o da aula na lista (eh por ele q a edicao identifica)
  const aulas = (edicao.editando ? edicao.aulas : grade.aulas).flatMap((a, i) => (a[chave] === atual ? [{ ...a, i }] : []));

  const nome = {
    turma: (id: number) => grade.turmas.find((t) => t.id === id)?.codigo ?? "",
    disciplina: (id: number) => grade.disciplinas.find((d) => d.id === id)?.nome ?? "",
    professor: (id: number) => grade.professores.find((p) => p.id === id)?.nome ?? "",
    sala: (id: number) => grade.salas.find((s) => s.id === id)?.nome ?? "",
  };
  // segunda linha da celula: o q nao ta sendo filtrado
  const detalhe = (a: Aula) => (modo === "professor" ? nome.turma(a.turmaId) : nome.professor(a.professorId));
  const local = (a: Aula) => (modo === "sala" ? nome.turma(a.turmaId) : nome.sala(a.salaId));
  const disciplinasVisiveis = [...new Set(aulas.map((a) => a.disciplinaId))];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-gray-100 print:hidden">
        <div className="flex bg-gray-100 rounded-xl p-1">
          {MODOS.map((m) => (
            <button key={m.id} onClick={() => { edicao.cancelarSelecao(); setModo(m.id); }}
              className={`px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${modo === m.id ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {m.label}
            </button>
          ))}
        </div>
        <div className="w-80">
          <Select value={atual ?? ""} options={listas[modo]} onChange={(v) => { edicao.cancelarSelecao(); setSelecionado({ ...selecionado, [modo]: Number(v) }); }} />
        </div>
        <div className="ml-auto"><BotaoEditar edicao={edicao} /></div>
      </div>

      <div className="overflow-x-auto px-4 py-4">
        <BarraEdicao edicao={edicao} />
        <table className="w-full table-fixed border-separate border-spacing-1 min-w-[640px]">
          <thead>
            <tr>
              <th className="w-16 text-right pr-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide pb-2">Horário</th>
              {DIAS.map((d) => <th key={d} className="text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide pb-2">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {grade.horarios.map((hora, ordem) => (
              <tr key={hora}>
                <td className="text-right pr-2 text-[11px] font-bold text-gray-400 tabular-nums pt-1.5 align-top">{hora}</td>
                {DIAS.map((_, dia) => {
                  // normalmente eh uma aula so; com conflito na edicao podem ser duas no mesmo horario
                  const aqui = aulas.filter((x) => x.dia === dia && x.ordem === ordem);
                  return (
                    <td key={dia} className="p-0.5">
                      <div {...edicao.propsCelula(dia, ordem)}
                        className={`h-[58px] rounded-lg flex flex-col gap-0.5 transition-colors ${edicao.classeCelula(dia, ordem)}`}>
                        {aqui.length ? aqui.map((a) => {
                          const conflitos = edicao.conflitosDaAula(a.i);
                          return (
                            <div key={a.i} {...edicao.propsAula(a.i, chave)} title={conflitos.length ? conflitos.join("\n") : undefined}
                              className={`relative flex-1 min-h-0 rounded-lg px-2.5 py-2 border-l-[3px] overflow-hidden ${corDisciplina(a.disciplinaId).cell} ${edicao.classeAula(a.i)}`}>
                              <p className="text-[11px] font-bold leading-tight truncate pr-4">{nome.disciplina(a.disciplinaId)}</p>
                              <p className="text-[10px] opacity-70 mt-0.5 leading-tight truncate">{detalhe(a)}</p>
                              <p className="text-[10px] opacity-60 mt-0.5 leading-tight truncate">{local(a)}</p>
                              <MarcaEdicao conflito={conflitos.length > 0} movida={edicao.foiMovida(a.i)} />
                            </div>
                          );
                        }) : (
                          <div className="h-full rounded-lg bg-gray-50/60 border border-dashed border-gray-200 flex items-center justify-center text-[10px] text-gray-300">—</div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {disciplinasVisiveis.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-2 px-5 pb-4">
          {disciplinasVisiveis.map((id) => (
            <span key={id} className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className={`w-2 h-2 rounded-full ${corDisciplina(id).dot}`} /> {nome.disciplina(id)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
