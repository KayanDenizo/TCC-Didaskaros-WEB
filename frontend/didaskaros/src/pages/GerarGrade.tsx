import { useEffect, useState } from "react";
import axios from "axios";
import { api, mensagemErro } from "../api/client";
import type { Diagnostico, GradeDetalhe, JobGeracao, Turma, Turno } from "../api/types";
import { Link } from "react-router-dom";
import { ChatAjuste } from "../components/ChatAjuste";
import { Field, Select, inputClass } from "../components/form";
import { GradeViewer } from "../components/GradeViewer";
import { Icons } from "../components/icons";
import { ResumoGrade } from "../components/ResumoGrade";
import { Alert, Button, Card, CardHeader, LinkButton, PageHeader } from "../components/ui";
import { useApi } from "../hooks/useApi";
import { TURNOS, TURNO_LABEL } from "../lib/format";
import { NOME_IA } from "../lib/ia";

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

// ── Estimativa de tempo da geração ─────────────────────────────────────────
// Começa com um palpite por turma e aprende com as gerações anteriores
// (segundos por turma, guardado no navegador).
const CHAVE_DURACAO = "didaskaros.segundosPorTurma";

function segundosPorTurma(): number {
  try {
    const salvo = Number(localStorage.getItem(CHAVE_DURACAO));
    if (salvo > 0) return salvo;
  } catch { /* sem localStorage: usa o padrão */ }
  return 25;
}

function registrarDuracao(segundos: number, turmas: number) {
  if (!turmas || segundos <= 0) return;
  try {
    const novo = segundos / turmas;
    const anterior = Number(localStorage.getItem(CHAVE_DURACAO));
    localStorage.setItem(CHAVE_DURACAO, String(anterior > 0 ? (anterior + novo) / 2 : novo));
  } catch { /* ignora */ }
}

function formatarTempo(seg: number) {
  if (seg < 60) return `${Math.max(5, Math.ceil(seg / 5) * 5)}s`;
  return `${Math.round(seg / 60)} min`;
}

const ETAPAS = ["Preparar dados", "Montar grade", "Validar conflitos", "Salvar"];

function ProgressoGeracao({ job, inicio, estimativa, concluido }: { job: JobGeracao; inicio: number; estimativa: number; concluido: boolean }) {
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    if (concluido) return;
    const t = setInterval(() => setAgora(Date.now()), 500);
    return () => clearInterval(t);
  }, [concluido]);

  const decorrido = (agora - inicio) / 1000;
  // Cada tentativa de correção soma ~60% do tempo previsto
  const previsto = estimativa * (1 + 0.6 * Math.max(job.tentativa - 1, 0));
  const fracao = decorrido / previsto;
  // Linear até 85% no tempo previsto; depois avança devagar, sem chegar a 100% sozinho
  let pct = fracao <= 1 ? 3 + fracao * 82 : 85 + 9 * (1 - Math.exp(-(fracao - 1) * 2));
  const validando = job.etapa.startsWith("Validando");
  if (validando) pct = Math.max(pct, 90);
  if (concluido) pct = 100;

  const etapaAtual = concluido ? 4 : job.etapa === "Preparando dados" ? 0 : validando ? 2 : 1;
  const restante = previsto - decorrido;

  return (
    <Card className="px-10 py-14">
      <div className="max-w-xl mx-auto text-center">
        <div className={`w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center text-white transition-colors duration-500
          ${concluido ? "bg-emerald-500 animate-pop-in" : "bg-gradient-to-br from-[#1E4DA1] to-blue-500 animate-breathe"}`}>
          {concluido ? <span className="text-2xl font-bold">✓</span> : <span className="scale-150 animate-sparkle"><Icons.Sparkles /></span>}
        </div>
        <p className="text-[15px] font-bold text-gray-900">
          {concluido ? "Grade pronta!" : `${NOME_IA}: ${job.etapa.charAt(0).toLowerCase()}${job.etapa.slice(1)}…`}
        </p>
        <p className="text-[12px] text-gray-400 mt-1">
          {concluido ? "Abrindo o resultado"
            : job.tentativa > 1 ? `O validador encontrou conflitos. Tentativa ${job.tentativa} de 3.`
            : "Todas as turmas do turno são montadas juntas."}
        </p>

        <div className="mt-7 flex items-baseline justify-between text-[12px]">
          <span className="font-bold text-blue-700 tabular-nums">{Math.floor(pct)}%</span>
          <span className="text-gray-500 tabular-nums">
            {concluido ? `Concluído em ${formatarTempo(decorrido)}`
              : restante > 5 ? `Faltam cerca de ${formatarTempo(restante)}`
              : "Está levando um pouco mais que o previsto. Quase lá."}
          </span>
        </div>
        <div className="relative mt-2 h-2.5 rounded-full bg-gray-100 overflow-hidden" role="progressbar"
          aria-valuenow={Math.floor(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso da geração">
          <div className="progress-fill relative h-full rounded-full overflow-hidden" style={{ width: `${pct}%` }} />
        </div>

        <ol className="mt-5 grid grid-cols-4 gap-2 text-[11px]">
          {ETAPAS.map((e, i) => (
            <li key={e} className={`flex flex-col items-center gap-1.5 transition-colors duration-300
              ${i < etapaAtual ? "text-emerald-600" : i === etapaAtual ? "text-gray-900 font-semibold" : "text-gray-300"}`}>
              <span className={`w-2 h-2 rounded-full transition-all duration-300
                ${i < etapaAtual ? "bg-emerald-500" : i === etapaAtual ? "bg-blue-600 ring-4 ring-blue-100" : "bg-gray-200"}`} />
              {e}
            </li>
          ))}
        </ol>
        <p className="text-[11px] text-gray-400 mt-6">Pode deixar esta página aberta. Ao terminar, a grade aparece aqui.</p>
      </div>
    </Card>
  );
}

const TELAS = [
  { to: "/professores", label: "Professores" },
  { to: "/turmas", label: "Turmas" },
  { to: "/disciplinas", label: "Disciplinas" },
  { to: "/salas", label: "Salas" },
];

/** A IA avisa, antes de gerar, o que falta ou está inconsistente nos cadastros. */
function AvisosCadastro({ diagnostico }: { diagnostico: Diagnostico }) {
  const { problemas, avisos } = diagnostico;
  if (!problemas.length && !avisos.length) return null;
  const grave = problemas.length > 0;
  return (
    <div className={`mb-5 rounded-2xl border px-5 py-4 animate-fade-in-up ${grave ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
      <div className="flex items-start gap-3">
        <span className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center text-white ${grave ? "bg-red-500" : "bg-amber-500"}`}>
          <Icons.Sparkles />
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] font-bold ${grave ? "text-red-800" : "text-amber-900"}`}>
            {grave ? `A ${NOME_IA} encontrou o que impede a geração` : `A ${NOME_IA} recomenda conferir os cadastros`}
          </p>
          <ul className={`mt-1.5 space-y-1 text-[12px] list-disc pl-4 ${grave ? "text-red-700" : "text-amber-800"}`}>
            {problemas.map((p) => <li key={p} className="font-semibold">{p}</li>)}
            {avisos.map((a) => <li key={a}>{a}</li>)}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            {TELAS.map((t) => (
              <Link key={t.to} to={t.to}
                className="text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 px-3 py-1 rounded-full transition-all duration-200 hover:border-blue-400 hover:text-blue-600 hover:-translate-y-0.5">
                Abrir {t.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
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
  const [inicio, setInicio] = useState(0);
  const [estimativa, setEstimativa] = useState(60);

  const turmas = (useApi<Turma[]>("/turmas").data ?? []).filter((t) => t.turno === turno);
  const diagnostico = useApi<Diagnostico>(`/grades/diagnostico?turno=${turno}&aulasPorDia=${aulasPorDia}`).data;
  const bloqueado = !!diagnostico?.problemas.length;
  const horariosNaSemana = aulasPorDia * 5;
  const turmasEstouradas = turmas.filter((t) => t.cargas.reduce((s, c) => s + c.aulasSemanais, 0) > horariosNaSemana);
  const todasPreferencias = [...preferencias, ...(orientacoes.trim() ? [orientacoes.trim()] : [])];

  async function gerar() {
    setStep(4);
    setErro(null);
    setGrade(null);
    setJob(null);
    setInicio(Date.now());
    setEstimativa(Math.max(45, Math.round(segundosPorTurma() * Math.max(turmas.length, 1))));
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
        if (data.status === "concluido") {
          const { data: nova } = await api.get<GradeDetalhe>(`/grades/${data.gradeId}`);
          registrarDuracao((Date.now() - inicio) / 1000, turmas.length);
          // Deixa a barra chegar a 100% antes de mostrar a grade
          setTimeout(() => setGrade(nova), 900);
        }
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

  const gerando = job?.status === "executando" || (job?.status === "concluido" && !grade);

  return (
    <>
      <PageHeader title="Gerar Grade com IA" description={`A ${NOME_IA} monta a grade do turno inteiro e um validador independente confere cada conflito.`} />
      <Stepper step={step} />

      {step < 4 && diagnostico && <AvisosCadastro diagnostico={diagnostico} />}

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
                      className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold border transition-all duration-200 active:scale-[0.97] ${turno === t ? "bg-blue-700 border-blue-700 text-white shadow-[0_4px_14px_rgba(29,78,216,0.3)]" : "bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:-translate-y-0.5"}`}>
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
            Conflitos de professor, sala e turma, carga horária, laboratórios, indisponibilidades e as regras de jornada do CPS (11h entre jornadas, refeição, 8h por dia) são sempre respeitados. Aqui você escolhe o que deixa a grade <em>melhor</em>.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {PREFERENCIAS.map((p) => {
              const ativo = preferencias.includes(p.label);
              return (
                <button key={p.label} type="button"
                  onClick={() => setPreferencias(ativo ? preferencias.filter((x) => x !== p.label) : [...preferencias, p.label])}
                  className={`flex items-start gap-3 text-left p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${ativo ? "border-blue-400 bg-blue-50/50" : "border-gray-200 hover:border-gray-300"}`}>
                  <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 text-white text-[10px] font-bold transition-colors duration-200 ${ativo ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>{ativo && <span className="animate-pop-in">✓</span>}</span>
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
          {!erro && !grade && (
            <ProgressoGeracao job={job ?? { id: "", status: "executando", etapa: "Preparando dados", tentativa: 0, segundos: 0 }}
              inicio={inicio} estimativa={estimativa} concluido={job?.status === "concluido"} />
          )}

          {erro && (
            <Alert title={erro.mensagem}>
              {erro.problemas && <ul className="list-disc pl-5 mt-1 space-y-0.5">{erro.problemas.map((p) => <li key={p}>{p}</li>)}</ul>}
            </Alert>
          )}

          {grade && (
            <Card className="overflow-hidden animate-scale-in">
              <div className={`px-5 py-4 flex items-center justify-between border-b border-gray-100 ${grade.violacoes.length ? "bg-red-50/60" : "bg-emerald-50/50"}`}>
                <div>
                  <p className="text-[14px] font-bold text-gray-900">
                    {grade.violacoes.length ? `Grade gerada com ${grade.violacoes.length} conflito(s)` : "Grade gerada sem conflitos"}
                  </p>
                  <p className="text-[11px] text-gray-400">Grade #{grade.id} · {grade.aulas.length} aulas · {grade.tentativas} tentativa(s) · {NOME_IA}</p>
                </div>
                <span className="text-[10px] font-bold bg-white px-3 py-1 rounded-full text-gray-600 border border-gray-200">
                  {grade.status === "PUBLICADA" ? "Publicada" : "Rascunho"}
                </span>
              </div>
              <GradeViewer grade={grade} />
              <ResumoGrade grade={grade} />
            </Card>
          )}

          {grade && <ChatAjuste grade={grade} onNovaVersao={setGrade} />}
        </div>
      )}

      <div className="flex items-center justify-between mt-5">
        {step < 4 ? (
          <>
            <Button onClick={() => setStep((s) => (s - 1) as Step)} disabled={step === 1}><Icons.ChevronLeft /> Voltar</Button>
            {step < 3
              ? <Button variant="primary" onClick={() => setStep((s) => (s + 1) as Step)}>Próximo <Icons.ChevronRight /></Button>
              : <Button variant="primary" onClick={gerar} disabled={!turmas.length || bloqueado} className="group"
                  title={bloqueado ? "Resolva o que falta nos cadastros antes de gerar" : undefined}><span className="group-hover:animate-sparkle"><Icons.Sparkles /></span> Gerar Grade</Button>}
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
