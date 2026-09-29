import type { Sala } from "../api/types";
import { CrudPage } from "../components/CrudPage";
import { Field, Input, Select } from "../components/form";
import { Badge } from "../components/ui";

export default function Salas() {
  return (
    <CrudPage<Sala, Omit<Sala, "id">>
      title="Salas"
      singular="Sala"
      feminino
      description="Salas de aula e laboratórios disponíveis para a grade."
      recurso="/salas"
      vazio={{ nome: "", tipo: "SALA", capacidade: 40 }}
      paraForm={({ id: _, ...s }) => s}
      validar={(f) => (!f.nome.trim() ? "Informe o nome da sala." : f.capacidade < 1 ? "Capacidade inválida." : null)}
      colunas={[
        { titulo: "Sala", render: (s) => <span className="font-semibold text-gray-900">{s.nome}</span> },
        { titulo: "Tipo", render: (s) => s.tipo === "LABORATORIO"
          ? <Badge className="bg-violet-50 text-violet-700">Laboratório</Badge>
          : <Badge className="bg-gray-100 text-gray-500">Sala comum</Badge> },
        { titulo: "Capacidade", render: (s) => `${s.capacidade} alunos` },
      ]}
      renderForm={(f, set) => (
        <>
          <Field label="Nome" required><Input value={f.nome} onChange={(nome) => set({ nome })} placeholder="Ex: Sala 101" /></Field>
          <Field label="Tipo" required>
            <Select value={f.tipo} onChange={(v) => set({ tipo: v as Sala["tipo"] })}
              options={[{ value: "SALA", label: "Sala comum" }, { value: "LABORATORIO", label: "Laboratório" }]} />
          </Field>
          <Field label="Capacidade (alunos)" required>
            <Input type="number" min={1} value={f.capacidade} onChange={(v) => set({ capacidade: Number(v) })} />
          </Field>
        </>
      )}
    />
  );
}
