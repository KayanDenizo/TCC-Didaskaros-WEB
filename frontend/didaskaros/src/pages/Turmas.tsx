import type { Carga, Disciplina, Professor, Turma, Turno } from "../api/types";
import { CrudPage } from "../components/CrudPage";
import { Field, Input, Select } from "../components/form";
import { Icons } from "../components/icons";
import { Badge } from "../components/ui";
import { useApi } from "../hooks/useApi";
import { TURNOS, TURNO_LABEL } from "../lib/format";

type Form = Omit<Turma, "id">;
const total = (cargas: Carga[]) => cargas.reduce((s, c) => s + c.aulasSemanais, 0);

/** Tabela editável de carga horária: disciplina × aulas semanais × professor (opcional). */
function EditorCargas({ cargas, onChange, disciplinas, professores }: {
  cargas: Carga[]; onChange: (c: Carga[]) => void; disciplinas: Disciplina[]; professores: Professor[];
}) {
  const alterar = (i: number, patch: Partial<Carga>) => onChange(cargas.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const livres = disciplinas.filter((d) => !cargas.some((c) => c.disciplinaId === d.id));

  return (
    <div className="space-y-2">
      {cargas.map((c, i) => {
        const habilitados = professores.filter((p) => p.disciplinaIds.includes(c.disciplinaId));
        return (
          <div key={i} className="grid grid-cols-[1fr_56px_1fr_24px] gap-1.5 items-center">
            <Select value={c.disciplinaId} onChange={(v) => alterar(i, { disciplinaId: Number(v), professorId: null })}
              options={disciplinas.filter((d) => d.id === c.disciplinaId || livres.includes(d)).map((d) => ({ value: d.id, label: d.nome }))} />
            <Input type="number" min={1} max={20} value={c.aulasSemanais} onChange={(v) => alterar(i, { aulasSemanais: Number(v) })} className="!px-2 text-center" />
            <Select value={c.professorId ?? ""} placeholder="IA escolhe" onChange={(v) => alterar(i, { professorId: v ? Number(v) : null })}
              options={habilitados.map((p) => ({ value: p.id, label: p.nome }))} />
            <button type="button" onClick={() => onChange(cargas.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-500 text-lg" aria-label="Remover">×</button>
          </div>
        );
      })}
      {livres.length > 0 && (
        <button type="button" onClick={() => onChange([...cargas, { disciplinaId: livres[0].id, aulasSemanais: 2, professorId: null }])}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 hover:underline">
          <Icons.Plus /> Adicionar disciplina
        </button>
      )}
      <p className="text-[11px] text-gray-400">
        Total: <strong className="text-gray-700">{total(cargas)} aulas/semana</strong>. Professor em branco = a IA escolhe entre os habilitados.
      </p>
    </div>
  );
}

export default function Turmas() {
  const disciplinas = useApi<Disciplina[]>("/disciplinas").data ?? [];
  const professores = useApi<Professor[]>("/professores").data ?? [];

  return (
    <CrudPage<Turma, Form>
      title="Turmas"
      singular="Turma"
      feminino
      description="Turmas por turno e a carga horária semanal de cada disciplina — é o que a IA precisa encaixar na grade."
      recurso="/turmas"
      largura="grid-cols-[1fr_460px]"
      vazio={{ codigo: "", curso: "", turno: "MANHA", qtdAlunos: 40, cargas: [] }}
      paraForm={({ id: _, ...t }) => t}
      validar={(f) => (!f.codigo.trim() || !f.curso.trim() ? "Informe código e curso." : null)}
      colunas={[
        { titulo: "Turma", render: (t) => (
          <div><p className="font-semibold text-gray-900">{t.codigo}</p><p className="text-[11px] text-gray-400">{t.curso}</p></div>
        ) },
        { titulo: "Turno", render: (t) => <Badge className="bg-blue-50 text-blue-700">{TURNO_LABEL[t.turno]}</Badge> },
        { titulo: "Alunos", render: (t) => t.qtdAlunos, className: "tabular-nums" },
        { titulo: "Carga", render: (t) => `${t.cargas.length} disc. · ${total(t.cargas)} aulas`, className: "tabular-nums" },
      ]}
      renderForm={(f, set) => (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Código" required><Input value={f.codigo} onChange={(v) => set({ codigo: v.toUpperCase() })} placeholder="Ex: 3DS" maxLength={12} /></Field>
            <Field label="Alunos" required><Input type="number" min={1} value={f.qtdAlunos} onChange={(v) => set({ qtdAlunos: Number(v) })} /></Field>
          </div>
          <Field label="Curso" required><Input value={f.curso} onChange={(curso) => set({ curso })} placeholder="Ex: Desenvolvimento de Sistemas" /></Field>
          <Field label="Turno" required>
            <Select value={f.turno} onChange={(v) => set({ turno: v as Turno })} options={TURNOS.map((t) => ({ value: t, label: TURNO_LABEL[t] }))} />
          </Field>
          <Field label="Carga horária semanal">
            {disciplinas.length
              ? <EditorCargas cargas={f.cargas} onChange={(cargas) => set({ cargas })} disciplinas={disciplinas} professores={professores} />
              : <p className="text-[12px] text-gray-400">Cadastre disciplinas primeiro.</p>}
          </Field>
        </>
      )}
    />
  );
}
