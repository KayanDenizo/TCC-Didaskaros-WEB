import { useState } from "react";
import type { Disciplina, Professor, Slot, Turno } from "../api/types";
import { CrudPage } from "../components/CrudPage";
import { Chips, Field, Input } from "../components/form";
import { useApi } from "../hooks/useApi";
import { DIAS_CURTOS, TURNOS, TURNO_LABEL } from "../lib/format";
import { maskPhone } from "../lib/masks";

type Form = Omit<Professor, "id">;
const AULAS_NO_QUADRO = 6;

/** Quadro semanal: clique marca/desmarca horários em que o professor NÃO pode dar aula. */
function QuadroIndisponibilidade({ valor, onChange }: { valor: Slot[]; onChange: (v: Slot[]) => void }) {
  const [turno, setTurno] = useState<Turno>("MANHA");
  const marcado = (dia: number, ordem: number) => valor.some((s) => s.turno === turno && s.dia === dia && s.ordem === ordem);
  const alternar = (dia: number, ordem: number) =>
    onChange(marcado(dia, ordem)
      ? valor.filter((s) => !(s.turno === turno && s.dia === dia && s.ordem === ordem))
      : [...valor, { turno, dia, ordem }]);

  return (
    <div>
      <div className="flex gap-1 mb-2">
        {TURNOS.map((t) => (
          <button key={t} type="button" onClick={() => setTurno(t)}
            className={`flex-1 py-1 rounded-lg text-[11px] font-semibold ${turno === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>
            {TURNO_LABEL[t]} {valor.some((s) => s.turno === t) && "•"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[32px_repeat(5,1fr)] gap-1 text-[10px]">
        <span />
        {DIAS_CURTOS.map((d) => <span key={d} className="text-center font-bold text-gray-400 uppercase">{d}</span>)}
        {Array.from({ length: AULAS_NO_QUADRO }, (_, ordem) => (
          <div key={ordem} className="contents">
            <span className="text-right pr-1 text-gray-400 self-center">{ordem + 1}ª</span>
            {DIAS_CURTOS.map((_, dia) => (
              <button key={dia} type="button" onClick={() => alternar(dia, ordem)} aria-label={`${DIAS_CURTOS[dia]}, ${ordem + 1}ª aula`}
                className={`h-6 rounded-md border transition-colors ${marcado(dia, ordem) ? "bg-red-400 border-red-400" : "bg-emerald-50 border-emerald-100 hover:border-emerald-300"}`} />
            ))}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-400 mt-1.5">Vermelho = indisponível. A IA nunca aloca aulas nesses horários.</p>
    </div>
  );
}

export default function Professores() {
  const disciplinas = useApi<Disciplina[]>("/disciplinas").data ?? [];
  const nomeDisciplina = (id: number) => disciplinas.find((d) => d.id === id)?.sigla ?? "?";

  return (
    <CrudPage<Professor, Form>
      title="Professores"
      singular="Professor"
      description="Equipe docente: disciplinas que cada um pode lecionar e horários indisponíveis."
      recurso="/professores"
      largura="grid-cols-[1fr_420px]"
      vazio={{ nome: "", email: "", telefone: "", pontuacaoCps: 0, disciplinaIds: [], indisponibilidades: [] }}
      paraForm={({ id: _, ...p }) => p}
      validar={(f) => (f.nome.trim().length < 3 ? "Informe o nome." : !f.email.includes("@") ? "Informe um e-mail válido." : null)}
      colunas={[
        { titulo: "Professor", render: (p) => (
          <div><p className="font-semibold text-gray-900">{p.nome}</p><p className="text-[11px] text-gray-400">{p.email}</p></div>
        ) },
        { titulo: "Disciplinas", render: (p) => p.disciplinaIds.map(nomeDisciplina).join(" · ") || "—" },
        { titulo: "Indisp.", render: (p) => (p.indisponibilidades.length ? `${p.indisponibilidades.length} horários` : "—") },
        { titulo: "Pontos CPS", render: (p) => p.pontuacaoCps, className: "text-right tabular-nums" },
      ]}
      renderForm={(f, set) => (
        <>
          <Field label="Nome completo" required><Input value={f.nome} onChange={(nome) => set({ nome })} placeholder="Ex: João Carlos Silva" /></Field>
          <Field label="E-mail institucional" required><Input type="email" value={f.email} onChange={(email) => set({ email })} placeholder="professor@etec.sp.gov.br" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefone"><Input value={f.telefone} onChange={(v) => set({ telefone: maskPhone(v) })} placeholder="(11) 99999-0000" /></Field>
            <Field label="Pontuação CPS" hint="Prioridade na atribuição">
              <Input type="number" min={0} step="0.01" value={f.pontuacaoCps} onChange={(v) => set({ pontuacaoCps: Number(v) })} />
            </Field>
          </div>
          <Field label="Disciplinas habilitadas">
            {disciplinas.length
              ? <Chips options={disciplinas.map((d) => d.id)} selected={f.disciplinaIds} label={(id) => disciplinas.find((d) => d.id === id)?.nome ?? ""} onChange={(disciplinaIds) => set({ disciplinaIds })} />
              : <p className="text-[12px] text-gray-400">Cadastre disciplinas primeiro.</p>}
          </Field>
          <Field label="Indisponibilidade">
            <QuadroIndisponibilidade valor={f.indisponibilidades} onChange={(indisponibilidades) => set({ indisponibilidades })} />
          </Field>
        </>
      )}
    />
  );
}
