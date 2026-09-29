import { useEffect, useState } from "react";
import axios from "axios";
import { api, mensagemErro } from "../api/client";
import type { GradeDetalhe, JobGeracao, Turma, Turno } from "../api/types";
import { Field, Select, inputClass } from "../components/form";
import { GradeViewer } from "../components/GradeViewer";
import { Icons } from "../components/icons";
import { ResumoGrade } from "../components/ResumoGrade";
import { Alert, Button, Card, CardHeader, LinkButton, PageHeader, Spinner } from "../components/ui";
import { useApi } from "../hooks/useApi";
import { TURNOS, TURNO_LABEL } from "../lib/format";

type Step = 1 | 2 | 3 | 4;
const STEPS = ["Parâmetros", "Preferências", "Revisão", "Resultado"];

// Restrições moles: a IA tenta atender, mas não invalidam a grade.
const PREFERENCIAS = [
  { label: "Evitar janelas na grade", desc: "Não deixar horários vagos entre aulas de uma turma ou professor no mesmo dia" },
  { label: "Agrupar aulas da mesma disciplina", desc: "Preferir aulas geminadas (em sequência) da mesma disciplina" },
  { label: "Distribuir a disciplina na semana", desc: "Evitar concentrar todas as aulas de uma disciplina no mesmo dia" },
  { label: "Manter a turma na mesma sala", desc: "Usar sempre a mesma sala comum para cada turma" },
  { label: "Evitar teóricas no último horário", desc: "Reservar o fim do turno para aulas práticas" },
  { label: "Equilibrar a carga dos professores", desc: "Distribuir as aulas de cada professor ao longo da semana" },
];

const anoAtual = new Date().getFullYear();

function Stepper({ step }: { step: Step }) {
  return (
    <Card className="flex items-center mb-6 px-6 py-4">
      {STEPS.map((label, i) => {
        const n = i + 1;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 transition-all
              ${step === n ? "bg-blue-700 text-white shadow-[0_0_0_4px_rgba(37,99,235,0.15)]" : step > n ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"}`}>
              {step > n ? "✓" : n}
            </div>
            <span className={`ml-2.5 text-[13px] font-semibold whitespace-nowrap ${step >= n ? "text-gray-900" : "text-gray-400"}`}>{label}</span>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-[2px] mx-4 rounded bg-gray-100 overflow-hidden">
                <div className={`h-full bg-emerald-400 transition-all duration-500 ${step > n ? "w-full" : "w-0"}`} />
              </div>
            )}
          </div>
        );
      })}
    </Card>
  );
}

function Resumo({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
      <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">{label}</p>
      <p className="text-[13px] font-bold text-gray-900">{valor}</p>
    </div>
  );
}

export default function GerarGrade() {
  const [step, setStep] = useState<Step>(1);
  const [turno, setTurno] = useState<Turno>("MANHA");
  const [ano, setAno] = useState(anoAtual);
  const [semestre, setSemestre] = useState(new Date().getMonth() < 6 ? 1 : 2);
  const [aulasPorDia, setAulasPorDia] = useState(5);
  const [preferencias, setPreferencias] = useState<string[]>([PREFERENCIAS[0].label, PREFERENCIAS[2].label]);
  const [orientacoes, setOrientacoes] = useState("");

  const [job, setJob] = useState<JobGeracao | null>(null);
  const [grade, setGrade] = useState<GradeDetalhe | null>(null);
  const [erro, setErro] = useState<{ mensagem: string; problemas?: string[] } | null>(null);
  const [publicando, setPublicando] = useState(false);

  const turmas = (useApi<Turma[]>("/turmas").data ?? []).filter((t) => t.turno === turno);
  const horariosNaSemana = aulasPorDia * 5;
  const turmasEstouradas = turmas.filter((t) => t.cargas.reduce((s, c) => s + c.aulasSemanais, 0) > horariosNaSemana);
  const todasPreferencias = [...preferencias, ...(orientacoes.trim() ? [orientacoes.trim()] : [])];

  async function gerar() {
    setStep(4);
    setErro(null);
    setGrade(null);
    setJob(null);
    try {
      const { data } = await api.post<{ jobId: string }>("/grades/gerar", { turno, ano, semestre, aulasPorDia, preferencias: todasPreferencias });
      setJob({ id: data.jobId, status: "executando", etapa: "Preparando dados", tentativa: 0, segundos: 0 });
    } catch (err) {
      const problemas = axios.isAxiosError(err) ? err.response?.data?.problemas : undefined;
      setErro({ mensagem: mensagemErro(err), problemas });
    }
  }

  // Acompanha o job de geração até terminar
  useEffect(() => {
    if (job?.status !== "executando") return;
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get<JobGeracao>(`/grades/jobs/${job.id}`);
        if (data.status === "concluido") setGrade((await api.get<GradeDetalhe>(`/grades/${data.gradeId}`)).data);
        if (data.status === "erro") setErro({ mensagem: data.erro ?? "Falha na geração." });
        setJob(data);
      } catch (err) {
        setErro({ mensagem: mensagemErro(err) });
        setJob(null);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [job]);

  async function publicar() {
    if (!grade) return;
    setPublicando(true);
    try {
      await api.patch(`/grades/${grade.id}/status`, { status: "PUBLICADA" });
      setGrade({ ...grade, status: "PUBLICADA" });
    } catch (err) {
      setErro({ mensagem: mensagemErro(err) });
    } finally {
      setPublicando(false);
    }
  }

  const gerando = job?.status === "executando";

  return (
    <>
      <PageHeader title="Gerar Grade com IA" description="A Claude monta a grade do turno inteiro e um validador independente confere cada conflito." />
      <Stepper step={step} />

      {step === 1 && (
        <div className="grid grid-cols-[1fr_320px] gap-5 animate-fade-in-up">
          <Card className="p-6">
            <p className="text-[14px] font-bold text-gray-900 mb-1">Parâmetros da Grade</p>
            <p className="text-[12px] text-gray-400 mb-5">A grade é gerada para todas as turmas do turno de uma vez, porque elas disputam os mesmos professores e salas.</p>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Turno" className="col-span-3">
                <div className="flex gap-2">
                  {TURNOS.map((t) => (
                    <button key={t} type="button" onClick={() => setTurno(t)}
                      className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold border transition-all ${turno === t ? "bg-blue-700 border-blue-700 text-white" : "bg-white border-gray-200 text-gray-600 hover:border-blue-300"}`}>
                      {TURNO_LABEL[t]}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Ano letivo">
                <Select value={ano} onChange={(v) => setAno(Number(v))} options={[anoAtual, anoAtual + 1].map((a) => ({ value: a, label: String(a) }))} />
              </Field>
              <Field label="Semestre">
                <Select value={semestre} onChange={(v) => setSemestre(Number(v))} options={[{ value: 1, label: "1º semestre" }, { value: 2, label: "2º semestre" }]} />
              </Field>
              <Field label="Aulas por dia">
                <Select value={aulasPorDia} onChange={(v) => setAulasPorDia(Number(v))} options={[3, 4, 5, 6, 7].map((n) => ({ value: n, label: `${n} aulas` }))} />
              </Field>
            </div>
          </Card>

          <Card className="overflow-hidden h-fit">
            <CardHeader title={`Turmas do turno (${turmas.length})`} subtitle={`${horariosNaSemana} horários por semana`} />
            <div className="divide-y divide-gray-50">
              {turmas.map((t) => {
                const aulas = t.cargas.reduce((s, c) => s + c.aulasSemanais, 0);
                return (
                  <div key={t.id} className="flex justify-between px-5 py-2.5 text-[12px]">
                    <span className="font-semibold text-gray-800">{t.codigo}</span>
                    <span className={aulas > horariosNaSemana ? "text-red-600 font-bold" : "text-gray-500"}>{aulas} aulas/sem</span>
                  </div>
                );
              })}
              {!turmas.length && <p className="px-5 py-4 text-[12px] text-gray-400">Nenhuma turma neste turno.</p>}
            </div>
          </Card>
        </div>
      )}

      {step === 2 && (
        <Card className="p-6 animate-fade-in-up">
          <p className="text-[14px] font-bold text-gray-900 mb-1">Preferências da Coordenação</p>
          <p className="text-[12px] text-gray-400 mb-5">
            Conflitos de professor, sala e turma, carga horária, laboratórios e indisponibilidades são sempre respeitados. Aqui você escolhe o que deixa a grade <em>melhor</em>.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {PREFERENCIAS.map((p) => {
              const ativo = preferencias.includes(p.label);
              return (
                <button key={p.label} type="button"
                  onClick={() => setPreferencias(ativo ? preferencias.filter((x) => x !== p.label) : [...preferencias, p.label])}
                  className={`flex items-start gap-3 text-left p-4 rounded-xl border transition-all ${ativo ? "border-blue-400 bg-blue-50/50" : "border-gray-200 hover:border-gray-300"}`}>
                  <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 text-white text-[10px] font-bold ${ativo ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>{ativo && "✓"}</span>
                  <span>
                    <span className="block text-[13px] font-semibold text-gray-900">{p.label}</span>
                    <span className="block text-[11px] text-gray-400 mt-0.5">{p.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <Field label="Outras orientações (opcional)" hint="Escreva em linguagem natural — a IA interpreta.">
            <textarea value={orientacoes} onChange={(e) => setOrientacoes(e.target.value)} rows={3} maxLength={500}
              placeholder="Ex: Prefiro Matemática nos primeiros horários. Evite duas aulas de laboratório seguidas para a 1DS."
              className={`${inputClass()} resize-none`} />
          </Field>
        </Card>
      )}

      {step === 3 && (
        <Card className="p-6 animate-fade-in-up">
          <p className="text-[14px] font-bold text-gray-900 mb-5">Revisar antes de gerar</p>
          <div className="grid grid-cols-4 gap-4 mb-5">
            <Resumo label="Turno" valor={TURNO_LABEL[turno]} />
            <Resumo label="Período" valor={`${semestre}º sem. ${ano}`} />
            <Resumo label="Aulas por dia" valor={String(aulasPorDia)} />
            <Resumo label="Turmas" valor={turmas.map((t) => t.codigo).join(", ") || "Nenhuma"} />
          </div>
          <p className="text-[12px] font-bold text-gray-700 mb-2">Preferências ({todasPreferencias.length})</p>
          <ul className="list-disc pl-5 text-[12px] text-gray-600 space-y-1 mb-4">
            {todasPreferencias.map((p) => <li key={p}>{p}</li>)}
            {!todasPreferencias.length && <li className="text-gray-400">Nenhuma</li>}
          </ul>
          {turmasEstouradas.length > 0 && (
            <Alert tone="warning">{turmasEstouradas.map((t) => t.codigo).join(", ")} tem(têm) mais aulas do que horários disponíveis. Aumente as aulas por dia ou ajuste a carga.</Alert>
          )}
        </Card>
      )}

      {step === 4 && (
        <div className="animate-fade-in-up space-y-5">
          {gerando && (
            <Card className="flex flex-col items-center justify-center py-20 gap-3">
              <Spinner className="w-12 h-12 text-blue-600" />
              <p className="text-[14px] font-bold text-gray-900">{job.etapa}…</p>
              <p className="text-[12px] text-gray-400">
                {job.tentativa > 1 && `Tentativa ${job.tentativa} de 3 · `}{job.segundos}s — isso pode levar alguns minutos.
              </p>
            </Card>
          )}

          {!gerando && !grade && !erro && <Card className="py-16"><Spinner className="w-8 h-8 text-blue-600 mx-auto block" /></Card>}

          {erro && (
            <Alert title={erro.mensagem}>
              {erro.problemas && <ul className="list-disc pl-5 mt-1 space-y-0.5">{erro.problemas.map((p) => <li key={p}>{p}</li>)}</ul>}
            </Alert>
          )}

          {grade && (
            <Card className="overflow-hidden">
              <div className={`px-5 py-4 flex items-center justify-between border-b border-gray-100 ${grade.violacoes.length ? "bg-red-50/60" : "bg-emerald-50/50"}`}>
                <div>
                  <p className="text-[14px] font-bold text-gray-900">
                    {grade.violacoes.length ? `Grade gerada com ${grade.violacoes.length} conflito(s)` : "Grade gerada sem conflitos"}
                  </p>
                  <p className="text-[11px] text-gray-400">Grade #{grade.id} · {grade.aulas.length} aulas · {grade.tentativas} tentativa(s) · {grade.modelo}</p>
                </div>
                <span className="text-[10px] font-bold bg-white px-3 py-1 rounded-full text-gray-600 border border-gray-200">
                  {grade.status === "PUBLICADA" ? "Publicada" : "Rascunho"}
                </span>
              </div>
              <GradeViewer grade={grade} />
              <ResumoGrade grade={grade} />
            </Card>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-5">
        {step < 4 ? (
          <>
            <Button onClick={() => setStep((s) => (s - 1) as Step)} disabled={step === 1}><Icons.ChevronLeft /> Voltar</Button>
            {step < 3
              ? <Button variant="primary" onClick={() => setStep((s) => (s + 1) as Step)}>Próximo <Icons.ChevronRight /></Button>
              : <Button variant="primary" onClick={gerar} disabled={!turmas.length}><Icons.Sparkles /> Gerar Grade</Button>}
          </>
        ) : !gerando && (
          <>
            <Button onClick={() => setStep(3)}><Icons.ChevronLeft /> Ajustar parâmetros</Button>
            <div className="flex gap-2.5">
              <Button onClick={gerar}>↻ Gerar novamente</Button>
              {grade && <LinkButton to={`/grades?id=${grade.id}`}>Abrir em Grades Horárias</LinkButton>}
              {grade && grade.status !== "PUBLICADA" && (
                <Button variant="primary" onClick={publicar} loading={publicando} disabled={grade.violacoes.length > 0}
                  title={grade.violacoes.length ? "Grades com conflitos não podem ser publicadas" : undefined}>
                  Publicar Grade
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
