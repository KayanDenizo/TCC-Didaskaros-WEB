import { useState } from "react";
import type { CompromissoExterno, Disciplina, Professor, Turno } from "../api/types";
import { CrudPage } from "../components/CrudPage";
import { Chips, Field, Input, Select } from "../components/form";
import { useApi } from "../hooks/useApi";
import { DIAS, DIAS_CURTOS, TURNOS, TURNO_LABEL } from "../lib/format";
import { maskPhone } from "../lib/masks";

type Form = Omit<Professor, "id">;
type Quadro = Pick<Form, "indisponibilidades" | "preferencias">;
type Pincel = "INDISPONIVEL" | "PREFERE" | "EVITAR";
const AULAS_NO_QUADRO = 6;

const PINCEIS: { id: Pincel; label: string; cor: string }[] = [
  { id: "INDISPONIVEL", label: "Indisponível", cor: "bg-red-400 border-red-400" },
  { id: "PREFERE", label: "Prefere", cor: "bg-emerald-400 border-emerald-400" },
  { id: "EVITAR", label: "Evitar", cor: "bg-amber-300 border-amber-300" },
];

// quadro da semana: horario indisponivel a IA nunca usa, prefere/evitar ela tenta respeitar
function QuadroHorarios({ valor, onChange }: { valor: Quadro; onChange: (v: Quadro) => void }) {
  const [turno, setTurno] = useState<Turno>("MANHA");
  const [pincel, setPincel] = useState<Pincel>("INDISPONIVEL");
  const mesmo = (dia: number, ordem: number) => (s: { turno: Turno; dia: number; ordem: number }) =>
    s.turno === turno && s.dia === dia && s.ordem === ordem;

  const estado = (dia: number, ordem: number): Pincel | null =>
    valor.indisponibilidades.some(mesmo(dia, ordem)) ? "INDISPONIVEL" : valor.preferencias.find(mesmo(dia, ordem))?.tipo ?? null;

  const pintar = (dia: number, ordem: number) => {
    const limpo: Quadro = {
      indisponibilidades: valor.indisponibilidades.filter((s) => !mesmo(dia, ordem)(s)),
      preferencias: valor.preferencias.filter((s) => !mesmo(dia, ordem)(s)),
    };
    if (estado(dia, ordem) === pincel) return onChange(limpo);
    onChange(pincel === "INDISPONIVEL"
      ? { ...limpo, indisponibilidades: [...limpo.indisponibilidades, { turno, dia, ordem }] }
      : { ...limpo, preferencias: [...limpo.preferencias, { turno, dia, ordem, tipo: pincel }] });
  };

  const usado = (t: Turno) => valor.indisponibilidades.some((s) => s.turno === t) || valor.preferencias.some((s) => s.turno === t);

  return (
    <div>
      <div className="flex gap-1 mb-2">
        {TURNOS.map((t) => (
          <button key={t} type="button" onClick={() => setTurno(t)}
            className={`flex-1 py-1 rounded-lg text-[11px] font-semibold ${turno === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>
            {TURNO_LABEL[t]} {usado(t) && "•"}
          </button>
        ))}
      </div>
      <div className="flex gap-1 mb-2">
        {PINCEIS.map((p) => (
          <button key={p.id} type="button" onClick={() => setPincel(p.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded-lg text-[11px] font-semibold border ${pincel === p.id ? "border-gray-800 text-gray-900" : "border-gray-200 text-gray-500"}`}>
            <span className={`w-2.5 h-2.5 rounded-sm border ${p.cor}`} />{p.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[32px_repeat(5,1fr)] gap-1 text-[10px]">
        <span />
        {DIAS_CURTOS.map((d) => <span key={d} className="text-center font-bold text-gray-400 uppercase">{d}</span>)}
        {Array.from({ length: AULAS_NO_QUADRO }, (_, ordem) => (
          <div key={ordem} className="contents">
            <span className="text-right pr-1 text-gray-400 self-center">{ordem + 1}ª</span>
            {DIAS_CURTOS.map((_, dia) => {
              const e = estado(dia, ordem);
              return (
                <button key={dia} type="button" onClick={() => pintar(dia, ordem)} aria-label={`${DIAS_CURTOS[dia]}, ${ordem + 1}ª aula`}
                  className={`h-6 rounded-md border transition-colors ${e ? PINCEIS.find((p) => p.id === e)!.cor : "bg-gray-50 border-gray-100 hover:border-gray-300"}`} />
              );
            })}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-400 mt-1.5">
        Indisponível a IA nunca usa. Prefere e Evitar são desejos: ela atende quando der, priorizando quem tem mais pontos.
      </p>
    </div>
  );
}

// horarios q o professor trabalha em outra unidade (contam na jornada)
function CompromissosExternos({ valor, onChange }: { valor: CompromissoExterno[]; onChange: (v: CompromissoExterno[]) => void }) {
  const alterar = (i: number, mudanca: Partial<CompromissoExterno>) => onChange(valor.map((c, j) => (j === i ? { ...c, ...mudanca } : c)));
  return (
    <div className="space-y-2">
      {valor.map((c, i) => (
        <div key={i} className="grid grid-cols-[1.1fr_0.8fr_0.8fr_auto] gap-1.5 items-center">
          <Select value={c.dia} onChange={(v) => alterar(i, { dia: Number(v) })} options={DIAS.map((d, dia) => ({ value: dia, label: d }))} />
          <Input type="time" value={c.inicio} onChange={(inicio) => alterar(i, { inicio })} aria-label="Início" />
          <Input type="time" value={c.fim} onChange={(fim) => alterar(i, { fim })} aria-label="Fim" />
          <button type="button" onClick={() => onChange(valor.filter((_, j) => j !== i))} aria-label="Remover compromisso"
            className="px-2 text-[16px] text-gray-400 hover:text-red-500">×</button>
          <Input value={c.descricao} onChange={(descricao) => alterar(i, { descricao })} placeholder="Onde? Ex: ETEC Vila Nova"
            className="col-span-4 !py-1.5" maxLength={120} />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...valor, { dia: 0, inicio: "19:00", fim: "23:00", descricao: "" }])}
        className="text-[12px] font-semibold text-blue-600 hover:text-blue-800">+ Adicionar compromisso</button>
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
      description="Equipe docente: disciplinas, classificação CPS, horários e compromissos em outras unidades."
      recurso="/professores"
      largura="grid-cols-[1fr_420px]"
      vazio={{
        nome: "", email: "", telefone: "", pontuacaoCps: 0, contrato: "INDETERMINADO",
        disciplinaIds: [], indisponibilidades: [], preferencias: [], compromissosExternos: [],
      }}
      paraForm={({ id: _, ...p }) => p}
      validar={(f) =>
        f.nome.trim().length < 3 ? "Informe o nome."
          : !f.email.includes("@") ? "Informe um e-mail válido."
            : f.compromissosExternos.some((c) => !c.inicio || !c.fim || c.inicio >= c.fim) ? "Compromisso externo precisa terminar depois de começar."
              : null}
      colunas={[
        {
          titulo: "Professor", render: (p) => (
            <div><p className="font-semibold text-gray-900">{p.nome}</p><p className="text-[11px] text-gray-400">{p.email}</p></div>
          )
        },
        { titulo: "Disciplinas", render: (p) => p.disciplinaIds.map(nomeDisciplina).join(" · ") || "—" },
        { titulo: "Indisp.", render: (p) => (p.indisponibilidades.length ? `${p.indisponibilidades.length} horários` : "—") },
        { titulo: "Contrato", render: (p) => (p.contrato === "INDETERMINADO" ? "Indeterm." : "Determ.") },
        { titulo: "Pontos CPS", render: (p) => p.pontuacaoCps, className: "text-right tabular-nums" },
      ]}
      renderForm={(f, set) => (
        <>
          <Field label="Nome completo" required><Input value={f.nome} onChange={(nome) => set({ nome })} placeholder="Ex: João Carlos Silva" /></Field>
          <Field label="E-mail institucional" required><Input type="email" value={f.email} onChange={(email) => set({ email })} placeholder="professor@etec.sp.gov.br" /></Field>
          <Field label="Telefone"><Input value={f.telefone} onChange={(v) => set({ telefone: maskPhone(v) })} placeholder="(11) 99999-0000" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contrato" hint="Indeterminado escolhe antes">
              <Select value={f.contrato} onChange={(v) => set({ contrato: v as Form["contrato"] })}
                options={[{ value: "INDETERMINADO", label: "Indeterminado" }, { value: "DETERMINADO", label: "Determinado" }]} />
            </Field>
            <Field label="Pontuação CPS" hint="Ordem na atribuição">
              <Input type="number" min={0} step="0.01" value={f.pontuacaoCps} onChange={(v) => set({ pontuacaoCps: Number(v) })} />
            </Field>
          </div>
          <Field label="Disciplinas habilitadas">
            {disciplinas.length
              ? <Chips options={disciplinas.map((d) => d.id)} selected={f.disciplinaIds} label={(id) => disciplinas.find((d) => d.id === id)?.nome ?? ""} onChange={(disciplinaIds) => set({ disciplinaIds })} />
              : <p className="text-[12px] text-gray-400">Cadastre disciplinas primeiro.</p>}
          </Field>
          <Field label="Horários nesta unidade">
            <QuadroHorarios valor={f} onChange={set} />
          </Field>
          <Field label="Compromissos em outras unidades" hint="Usados nas regras de 11h entre jornadas, refeição e 8h por dia.">
            <CompromissosExternos valor={f.compromissosExternos} onChange={(compromissosExternos) => set({ compromissosExternos })} />
          </Field>
        </>
      )}
    />
  );
}
