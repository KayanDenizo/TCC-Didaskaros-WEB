import type { Disciplina } from "../api/types";
import { CrudPage } from "../components/CrudPage";
import { Field, Input } from "../components/form";
import { Badge } from "../components/ui";
import { corDisciplina } from "../lib/cores";

export default function Disciplinas() {
  return (
    <CrudPage<Disciplina, Omit<Disciplina, "id">>
      title="Disciplinas"
      singular="Disciplina"
      feminino
      description="Componentes curriculares oferecidos pela unidade."
      recurso="/disciplinas"
      vazio={{ nome: "", sigla: "", exigeLaboratorio: false }}
      paraForm={({ id: _, ...d }) => d}
      validar={(f) => (!f.nome.trim() || !f.sigla.trim() ? "Informe nome e sigla." : null)}
      colunas={[
        {
          titulo: "Disciplina", render: (d) => (
            <span className="flex items-center gap-2 font-semibold text-gray-900">
              <span className={`w-2 h-2 rounded-full ${corDisciplina(d.id).dot}`} />{d.nome}
            </span>
          )
        },
        { titulo: "Sigla", render: (d) => d.sigla },
        {
          titulo: "Sala", render: (d) => d.exigeLaboratorio
            ? <Badge className="bg-violet-50 text-violet-700">Laboratório</Badge>
            : <Badge className="bg-gray-100 text-gray-500">Comum</Badge>
        },
      ]}
      renderForm={(f, set) => (
        <>
          <Field label="Nome" required><Input value={f.nome} onChange={(nome) => set({ nome })} placeholder="Ex: Banco de Dados" /></Field>
          <Field label="Sigla" required><Input value={f.sigla} onChange={(sigla) => set({ sigla: sigla.toUpperCase() })} maxLength={12} placeholder="Ex: BD" /></Field>
          <label className="flex items-center gap-2.5 text-[13px] text-gray-700">
            <input type="checkbox" checked={f.exigeLaboratorio} onChange={(e) => set({ exigeLaboratorio: e.target.checked })} className="w-4 h-4 accent-blue-600" />
            Exige laboratório
          </label>
        </>
      )}
    />
  );
}
