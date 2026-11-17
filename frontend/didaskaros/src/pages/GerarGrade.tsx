import { useEffect, useMemo, useState } from "react";
import { api, mensagemErro } from "../api/client";
import type { Diagnostico, GradeDetalhe, JobGeracao, Turma, Turno } from "../api/types";
import { atualizarGrade, iniciarGeracao, marcarVisto, mostrarErro, segundosPorTurma, useGeracao } from "../lib/geracao";
import { Link } from "react-router-dom";
import { ChatAjuste } from "../components/ChatAjuste";
import { PainelEdicao } from "../components/EdicaoGrade";
import { inputClass } from "../components/form";
import { GradeViewer } from "../components/GradeViewer";
import { Icons, type IconName } from "../components/icons";
import { ResumoGrade } from "../components/ResumoGrade";
import { Alert, Button, Card, LinkButton, PageHeader } from "../components/ui";
import { useApi } from "../hooks/useApi";
import { useEdicaoGrade } from "../hooks/useEdicaoGrade";
import { corDisciplina } from "../lib/cores";
import { DIAS_CURTOS, TURNOS, TURNO_LABEL } from "../lib/format";
import { NOME_IA } from "../lib/ia";

type Step = 1 | 2 | 3 | 4;
const STEPS = [
  { label: "Parâmetros", desc: "Turno e período" },
  { label: "Preferências", desc: "O que deixa melhor" },
  { label: "Revisão", desc: "Conferir e gerar" },
  { label: "Resultado", desc: "Grade pronta" },
];

// restricoes moles: a IA tenta atender, mas se nao der a grade continua valendo
const PREFERENCIAS: { label: string; desc: string; icon: IconName }[] = [
  { label: "Evitar janelas na grade", desc: "Não deixar horários vagos entre aulas de uma turma ou professor no mesmo dia", icon: "Grid" },
  { label: "Agrupar aulas da mesma disciplina", desc: "Preferir aulas geminadas (em sequência) da mesma disciplina", icon: "Layers" },
  { label: "Distribuir a disciplina na semana", desc: "Evitar concentrar todas as aulas de uma disciplina no mesmo dia", icon: "Calendar" },
  { label: "Manter a turma na mesma sala", desc: "Usar sempre a mesma sala comum para cada turma", icon: "Door" },
  { label: "Evitar teóricas no último horário", desc: "Reservar o fim do turno para aulas práticas", icon: "Clock" },
  { label: "Equilibrar a carga dos professores", desc: "Distribuir as aulas de cada professor ao longo da semana", icon: "Users" },
];

const SUGESTOES_ORIENTACAO = [
  "Prefiro Matemática nos primeiros horários.",
  "Evite duas aulas de laboratório seguidas.",
  "Deixe a sexta-feira mais leve.",
];

const TURNO_INFO: Record<Turno, { icon: IconName; desc: string }> = {
  MANHA: { icon: "Sun", desc: "Período matutino" },
  TARDE: { icon: "Sunset", desc: "Período vespertino" },
  NOITE: { icon: "Moon", desc: "Período noturno" },
};

const anoAtual = new Date().getFullYear();

/* ---------------- etapas ---------------- */
function Stepper({ step, onIr }: { step: Step; onIr: (s: Step) => void }) {
  return (
    <Card className="mb-6 px-3 py-3">
      <ol className="flex items-center">
        {STEPS.map(({ label, desc }, i) => {
          const n = (i + 1) as Step;
          const feito = step > n;
          const atual = step === n;
          // da pra voltar numa etapa q ja fez, mas nao pular pra frente nem sair do resultado
          const clicavel = feito && step < 4;
          return (
            <li key={label} className="flex flex-1 items-center last:flex-none">
              <button type="button" disabled={!clicavel} onClick={() => onIr(n)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${clicavel ? "hover:bg-gray-50" : "cursor-default"}`}>
                <span className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-bold transition-all duration-500
                  ${atual ? "bg-gradient-to-br from-[#1E4DA1] to-blue-500 text-white shadow-[0_6px_16px_-4px_rgba(37,99,235,0.55)]" : feito ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                  {feito ? <span className="animate-pop-in"><Icons.Check /></span> : n}
                  {atual && <span className="absolute inset-0 rounded-full ring-4 ring-blue-500/15 animate-pulse" />}
                </span>
                <span className="hidden md:block">
                  <span className={`block text-[13px] font-semibold ${step >= n ? "text-gray-900" : "text-gray-400"}`}>{label}</span>
                  <span className="block text-[11px] text-gray-400">{clicavel ? <span className="text-blue-600 group-hover:underline">Editar</span> : desc}</span>
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className="mx-2 h-[2px] flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div className={`h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700 ease-out ${feito ? "w-full" : "w-0"}`} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function formatarTempo(seg: number) {
  if (seg < 60) return `${Math.max(5, Math.ceil(seg / 5) * 5)}s`;
  return `${Math.round(seg / 60)} min`;
}

/* ---------------- progresso da geracao ---------------- */
const ETAPAS = ["Preparar dados", "Montar grade", "Validar conflitos", "Salvar"];

/** grade em miniatura q vai enchendo conforme o progresso de verdade avanca */
function GradeViva({ pct, aulasPorDia, concluido }: { pct: number; aulasPorDia: number; concluido: boolean }) {
  const total = aulasPorDia * 5;
  // ordem de preencher "embaralhada" mas sempre igual, pra parecer o motor encaixando as aulas
  const ordem = useMemo(() => Array.from({ length: total }, (_, i) => (i * 7 + 3) % total), [total]);
  const preenchidas = Math.round((Math.min(pct, 100) / 100) * total);
  return (
    <div className={`grade-viva mx-auto w-full max-w-[340px] rounded-2xl border bg-white p-3 transition-colors duration-500 ${concluido ? "border-emerald-200" : "border-gray-200"}`}>
      <div className="grid grid-cols-5 gap-1.5">
        {DIAS_CURTOS.map((d) => <span key={d} className="pb-0.5 text-center text-[9px] font-bold uppercase tracking-wider text-gray-400">{d}</span>)}
        {Array.from({ length: total }, (_, i) => {
          const linha = Math.floor(i / 5);
          const coluna = i % 5;
          const cheia = ordem[i] < preenchidas;
          return (
            <span key={i}
              className={`h-5 rounded-[5px] transition-all duration-500 ${cheia ? `${corDisciplina(linha * 3 + coluna * 2).dot} scale-100 opacity-90` : "scale-90 bg-gray-100"}`}
              style={{ transitionDelay: cheia ? `${(ordem[i] % 4) * 60}ms` : "0ms" }} />
          );
        })}
      </div>
    </div>
  );
}

function ProgressoGeracao({ job, inicio, estimativa, concluido, aulasPorDia }: {
  job: JobGeracao; inicio: number; estimativa: number; concluido: boolean; aulasPorDia: number;
}) {
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    if (concluido) return;
    const t = setInterval(() => setAgora(Date.now()), 500);
    return () => clearInterval(t);
  }, [concluido]);

  const decorrido = (agora - inicio) / 1000;
  // cada tentativa de correcao soma uns 60% do tempo previsto
  const previsto = estimativa * (1 + 0.6 * Math.max(job.tentativa - 1, 0));
  const fracao = decorrido / previsto;
  // vai linear ate 85% no tempo previsto, dps anda devagar e nao chega a 100% sozinho
  let pct = fracao <= 1 ? 3 + fracao * 82 : 85 + 9 * (1 - Math.exp(-(fracao - 1) * 2));
  const validando = job.etapa.startsWith("Validando");
  if (validando) pct = Math.max(pct, 90);
  if (concluido) pct = 100;

  const etapaAtual = concluido ? 4 : job.etapa === "Preparando dados" ? 0 : validando ? 2 : 1;
  const restante = previsto - decorrido;

  return (
    <Card className="overflow-hidden">
      <div className="grid items-center gap-10 px-10 py-12 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex items-center gap-4">
            <div className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white transition-colors duration-500
              ${concluido ? "bg-emerald-500 animate-pop-in" : "bg-gradient-to-br from-[#1E4DA1] to-blue-500"}`}>
              {concluido ? <span className="scale-150"><Icons.Check /></span> : <span className="scale-150 animate-sparkle"><Icons.Sparkles /></span>}
              {!concluido && <span className="absolute inset-0 rounded-2xl ring-4 ring-blue-500/20 animate-ping [animation-duration:2s]" />}
            </div>
            <div className="min-w-0">
              <p className="text-[17px] font-bold text-gray-900">
                {concluido ? "Grade pronta!" : `${job.etapa}…`}
              </p>
              <p className="text-[12px] text-gray-400 mt-0.5">
                {concluido ? "Abrindo o resultado"
                  : job.tentativa > 1 ? `O validador encontrou conflitos. ${NOME_IA} está corrigindo — tentativa ${job.tentativa} de 3.`
                    : `${NOME_IA} monta todas as turmas do turno juntas.`}
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-baseline justify-between text-[12px]">
            <span className="text-[22px] font-extrabold tabular-nums text-gray-900">{Math.floor(pct)}<span className="text-[14px] text-gray-400">%</span></span>
            <span className="text-gray-500 tabular-nums">
              {concluido ? `Concluído em ${formatarTempo(decorrido)}`
                : restante > 5 ? `Faltam cerca de ${formatarTempo(restante)}`
                  : "Levando um pouco mais que o previsto. Quase lá."}
            </span>
          </div>
          <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-gray-100" role="progressbar"
            aria-valuenow={Math.floor(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso da geração">
            <div className="progress-fill relative h-full overflow-hidden rounded-full" style={{ width: `${pct}%` }} />
          </div>

          <ol className="mt-7 space-y-3">
            {ETAPAS.map((e, i) => {
              const feita = i < etapaAtual;
              const atual = i === etapaAtual;
              return (
                <li key={e} className="flex items-center gap-3 text-[13px]">
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition-all duration-500
                    ${feita ? "bg-emerald-500 text-white" : atual ? "bg-blue-50 ring-2 ring-blue-500" : "bg-gray-100"}`}>
                    {feita ? <span className="scale-75 animate-pop-in"><Icons.Check /></span>
                      : atual ? <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" /> : null}
                  </span>
                  <span className={`transition-colors duration-300 ${feita ? "text-gray-500 line-through decoration-gray-300" : atual ? "font-semibold text-gray-900" : "text-gray-400"}`}>{e}</span>
                  {atual && !concluido && <span className="ml-auto text-[11px] font-medium text-blue-600">em andamento</span>}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="text-center">
          <GradeViva pct={pct} aulasPorDia={aulasPorDia} concluido={concluido} />
          <p className="mt-4 text-[11px] text-gray-400">Pode deixar esta página aberta. Ao terminar, a grade aparece aqui.</p>
        </div>
      </div>
    </Card>
  );
}

/* ---------------- avisos da IA sobre os cadastros ---------------- */
const TELAS = [
  { to: "/professores", label: "Professores" },
  { to: "/turmas", label: "Turmas" },
  { to: "/disciplinas", label: "Disciplinas" },
  { to: "/salas", label: "Salas" },
];

/** antes de gerar a IA avisa o q ta faltando ou inconsistente nos cadastros */
function AvisosCadastro({ diagnostico }: { diagnostico: Diagnostico }) {
  const { problemas, avisos } = diagnostico;
  if (!problemas.length && !avisos.length) return null;
  const grave = problemas.length > 0;
  return (
    <div className={`mb-5 rounded-2xl border px-5 py-4 animate-fade-in-up ${grave ? "bg-red-50/80 border-red-200" : "bg-amber-50/80 border-amber-200"}`}>
      <div className="flex items-start gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white ${grave ? "bg-red-500" : "bg-amber-500"}`}>
          {grave ? <Icons.AlertTriangle /> : <Icons.Sparkles />}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-[13px] font-bold ${grave ? "text-red-800" : "text-amber-900"}`}>
            {grave ? `A ${NOME_IA} encontrou o que impede a geração` : `A ${NOME_IA} recomenda conferir os cadastros`}
          </p>
          <ul className={`mt-1.5 space-y-1 text-[12px] ${grave ? "text-red-700" : "text-amber-800"}`}>
            {problemas.map((p) => <li key={p} className="flex gap-2 font-semibold"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-current" />{p}</li>)}
            {avisos.map((a) => <li key={a} className="flex gap-2"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-current" />{a}</li>)}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            {TELAS.map((t) => (
              <Link key={t.to} to={t.to}
                className="group inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-semibold text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:text-blue-600">
                {t.label} <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- controles reaproveitados ---------------- */
function Segmentado<T extends string | number>({ valor, opcoes, onChange }: {
  valor: T; opcoes: { valor: T; label: string }[]; onChange: (v: T) => void;
}) {
  const indice = Math.max(0, opcoes.findIndex((o) => o.valor === valor));
  return (
    <div className="relative grid rounded-xl bg-gray-100 p-1" style={{ gridTemplateColumns: `repeat(${opcoes.length}, 1fr)` }}>
      {/* Fundo branco desliza até a opção escolhida */}
      <span aria-hidden className="absolute inset-y-1 left-1 rounded-lg bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ width: `calc((100% - 0.5rem) / ${opcoes.length})`, transform: `translateX(${indice * 100}%)` }} />
      {opcoes.map((o) => (
        <button key={o.label} type="button" onClick={() => onChange(o.valor)}
          className={`relative z-10 rounded-lg py-2 text-[13px] font-semibold transition-colors duration-200 ${o.valor === valor ? "text-blue-700" : "text-gray-500 hover:text-gray-700"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Rotulo({ children, extra }: { children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-500">{children}</p>
      {extra && <p className="text-[11px] text-gray-400">{extra}</p>}
    </div>
  );
}

/* ---------------- pagina ---------------- */
export default function GerarGrade() {
  // a geracao vive fora da pagina (lib/geracao): se ainda tem uma rodando ou pronta, volta direto no resultado
  const { ativa, job, grade, erro, inicio, estimativa, aulasPorDia: aulasGeradas } = useGeracao();
  const [step, setStep] = useState<Step>(ativa ? 4 : 1);
  // depois de um F5 a geracao e retomada de forma assincrona: leva pro resultado qnd ela volta
  useEffect(() => { if (ativa) setStep(4); }, [ativa]);
  // viu o resultado (ou o erro): some o aviso da sidebar
  useEffect(() => { if (step === 4 && (grade || erro)) marcarVisto(); }, [step, grade, erro]);
  const [turno, setTurno] = useState<Turno>("MANHA");
  const [ano, setAno] = useState(anoAtual);
  const [semestre, setSemestre] = useState(new Date().getMonth() < 6 ? 1 : 2);
  const [aulasPorDia, setAulasPorDia] = useState(5);
  const [preferencias, setPreferencias] = useState<string[]>([PREFERENCIAS[0].label, PREFERENCIAS[2].label]);
  const [orientacoes, setOrientacoes] = useState("");

  const [publicando, setPublicando] = useState(false);
  // editando a grade a mao: publicar/gerar de novo esperam salvar ou cancelar
  const [editandoGrade, setEditandoGrade] = useState(false);

  const todasTurmas = useApi<Turma[]>("/turmas").data ?? [];
  const turmas = todasTurmas.filter((t) => t.turno === turno);
  const diagnostico = useApi<Diagnostico>(`/grades/diagnostico?turno=${turno}&aulasPorDia=${aulasPorDia}`).data;
  const bloqueado = !!diagnostico?.problemas.length;
  const horariosNaSemana = aulasPorDia * 5;
  const cargaDe = (t: Turma) => t.cargas.reduce((s, c) => s + c.aulasSemanais, 0);
  const turmasEstouradas = turmas.filter((t) => cargaDe(t) > horariosNaSemana);
  const todasPreferencias = [...preferencias, ...(orientacoes.trim() ? [orientacoes.trim()] : [])];
  const estimativaPrevia = Math.max(45, Math.round(segundosPorTurma() * Math.max(turmas.length, 1)));

  function gerar() {
    setStep(4);
    // roda no store, entao continua mesmo se o usuario sair da pagina
    void iniciarGeracao({ turno, ano, semestre, aulasPorDia, preferencias: todasPreferencias }, turmas.length, estimativaPrevia);
  }

  async function publicar() {
    if (!grade) return;
    setPublicando(true);
    try {
      await api.patch(`/grades/${grade.id}/status`, { status: "PUBLICADA" });
      atualizarGrade({ ...grade, status: "PUBLICADA" });
    } catch (err) {
      mostrarErro(mensagemErro(err));
    } finally {
      setPublicando(false);
    }
  }

  const gerando = job?.status === "executando" || (job?.status === "concluido" && !grade);
  const alternarPreferencia = (label: string) =>
    setPreferencias(preferencias.includes(label) ? preferencias.filter((x) => x !== label) : [...preferencias, label]);

  return (
    <div className="pb-24">
      <PageHeader title="Gerar Grade com IA" description={`A ${NOME_IA} monta a grade do turno inteiro e um validador independente confere cada conflito.`} />
      <Stepper step={step} onIr={setStep} />

      {step < 4 && diagnostico && <AvisosCadastro diagnostico={diagnostico} />}

      {/* ---------- 1. Parâmetros ---------- */}
      {step === 1 && (
        <div key="passo1" className="grid grid-cols-[1fr_340px] items-start gap-5 animate-fade-in-up">
          <Card className="p-6">
            <p className="text-[15px] font-bold text-gray-900">Parâmetros da grade</p>
            <p className="mt-1 mb-6 text-[12px] text-gray-400">Todas as turmas do turno são geradas juntas, porque disputam os mesmos professores e salas.</p>

            <Rotulo>Turno</Rotulo>
            <div className="grid grid-cols-3 gap-3">
              {TURNOS.map((t) => {
                const ativo = turno === t;
                const Icon = Icons[TURNO_INFO[t].icon];
                const qtd = todasTurmas.filter((x) => x.turno === t).length;
                return (
                  <button key={t} type="button" onClick={() => setTurno(t)} aria-pressed={ativo}
                    className={`turno-opcao group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 active:scale-[0.98]
                      ${ativo ? "border-blue-500 bg-gradient-to-br from-blue-50 to-white shadow-[0_10px_30px_-12px_rgba(37,99,235,0.45)] ring-4 ring-blue-500/10" : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"}`}>
                    <span className={`grid h-10 w-10 place-items-center rounded-xl transition-all duration-500 ${ativo ? "bg-blue-600 text-white rotate-0" : "bg-gray-100 text-gray-500 group-hover:rotate-12"}`}>
                      <span className="scale-125"><Icon /></span>
                    </span>
                    <span className="mt-3 block text-[14px] font-bold text-gray-900">{TURNO_LABEL[t]}</span>
                    <span className="block text-[11px] text-gray-400">{qtd} {qtd === 1 ? "turma" : "turmas"} · {TURNO_INFO[t].desc}</span>
                    <span className={`absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-white transition-all duration-300 ${ativo ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}>
                      <span className="scale-75"><Icons.Check /></span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-5">
              <div>
                <Rotulo>Ano letivo</Rotulo>
                <Segmentado valor={ano} onChange={setAno} opcoes={[anoAtual, anoAtual + 1].map((a) => ({ valor: a, label: String(a) }))} />
              </div>
              <div>
                <Rotulo>Semestre</Rotulo>
                <Segmentado valor={semestre} onChange={setSemestre} opcoes={[{ valor: 1, label: "1º semestre" }, { valor: 2, label: "2º semestre" }]} />
              </div>
            </div>

            <div className="mt-6">
              <Rotulo extra={`${horariosNaSemana} horários por semana`}>Aulas por dia</Rotulo>
              <div className="flex items-center gap-6 rounded-2xl border border-gray-200 bg-gray-50/50 p-4">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setAulasPorDia(Math.max(3, aulasPorDia - 1))} disabled={aulasPorDia <= 3}
                    aria-label="Menos aulas por dia"
                    className="grid h-9 w-9 place-items-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-all hover:border-blue-300 hover:text-blue-600 active:scale-90 disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600">
                    <Icons.Minus />
                  </button>
                  <span key={aulasPorDia} className="w-10 text-center text-[28px] font-extrabold tabular-nums text-gray-900 animate-pop-in">{aulasPorDia}</span>
                  <button type="button" onClick={() => setAulasPorDia(Math.min(7, aulasPorDia + 1))} disabled={aulasPorDia >= 7}
                    aria-label="Mais aulas por dia"
                    className="grid h-9 w-9 place-items-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-all hover:border-blue-300 hover:text-blue-600 active:scale-90 disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600">
                    <Icons.Plus />
                  </button>
                </div>
                {/* Prévia da semana: uma coluna por dia, um bloco por aula */}
                <div className="flex flex-1 items-end justify-end gap-2" aria-hidden>
                  {DIAS_CURTOS.map((d) => (
                    <div key={d} className="flex flex-col items-center gap-1">
                      <div className="flex flex-col gap-1">
                        {Array.from({ length: 7 }, (_, i) => (
                          <span key={i} className={`h-2 w-7 rounded-sm transition-all duration-300 ${i < aulasPorDia ? "bg-blue-500/80" : "bg-gray-200/60 scale-x-75"}`}
                            style={{ transitionDelay: `${i * 25}ms` }} />
                        ))}
                      </div>
                      <span className="text-[9px] font-bold uppercase text-gray-400">{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="sticky top-[84px] overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-4">
              <p className="text-[14px] font-bold text-gray-900">Turmas do turno</p>
              <p className="mt-0.5 text-[11px] text-gray-400">Carga semanal × {horariosNaSemana} horários disponíveis</p>
            </div>
            <div className="max-h-[420px] overflow-y-auto p-2">
              {turmas.map((t, i) => {
                const aulas = cargaDe(t);
                const estoura = aulas > horariosNaSemana;
                const pct = Math.min(100, (aulas / horariosNaSemana) * 100);
                return (
                  <div key={t.id} className="rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50 animate-fade-in-up" style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}>
                    <div className="flex items-baseline justify-between gap-2 text-[12px]">
                      <span className="font-semibold text-gray-800">{t.codigo} <span className="font-normal text-gray-400">· {t.curso}</span></span>
                      <span className={`shrink-0 tabular-nums ${estoura ? "font-bold text-red-600" : "text-gray-500"}`}>{aulas}/{horariosNaSemana}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div className={`h-full rounded-full transition-all duration-500 ${estoura ? "bg-red-500" : pct > 90 ? "bg-amber-400" : "bg-gradient-to-r from-blue-500 to-cyan-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                    {estoura && <p className="mt-1 text-[10px] font-medium text-red-500">Mais aulas que horários — aumente as aulas por dia</p>}
                  </div>
                );
              })}
              {!turmas.length && (
                <div className="px-3 py-8 text-center">
                  <p className="text-[12px] text-gray-400">Nenhuma turma no turno da {TURNO_LABEL[turno].toLowerCase()}.</p>
                  <Link to="/turmas" className="mt-2 inline-block text-[12px] font-semibold text-blue-600 hover:underline">Cadastrar turma →</Link>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ---------- 2. Preferências ---------- */}
      {step === 2 && (
        <Card key="passo2" className="p-6 animate-fade-in-up">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-[15px] font-bold text-gray-900">Preferências da coordenação</p>
              <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-gray-400">
                Conflitos, carga horária, laboratórios, indisponibilidades e as regras de jornada do CPS são <strong className="font-semibold text-gray-600">sempre</strong> respeitados. Aqui você escolhe o que deixa a grade <em>melhor</em>.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700 tabular-nums">
              {preferencias.length} de {PREFERENCIAS.length} ativas
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {PREFERENCIAS.map((p, i) => {
              const ativo = preferencias.includes(p.label);
              const Icon = Icons[p.icon];
              return (
                <button key={p.label} type="button" role="switch" aria-checked={ativo} onClick={() => alternarPreferencia(p.label)}
                  className={`group flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-300 animate-fade-in-up
                    ${ativo ? "border-blue-300 bg-blue-50/50 shadow-[0_6px_20px_-12px_rgba(37,99,235,0.5)]" : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm"}`}
                  style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors duration-300 ${ativo ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 group-hover:text-gray-700"}`}>
                    <Icon />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-gray-900">{p.label}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-gray-400">{p.desc}</span>
                  </span>
                  {/* Interruptor */}
                  <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${ativo ? "bg-blue-600" : "bg-gray-200"}`}>
                    <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${ativo ? "translate-x-5" : ""}`} />
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <Rotulo extra={`${orientacoes.length}/500`}>Outras orientações (opcional)</Rotulo>
            <textarea value={orientacoes} onChange={(e) => setOrientacoes(e.target.value)} rows={3} maxLength={500}
              placeholder="Escreva em linguagem natural — a IA interpreta."
              className={`${inputClass()} resize-none`} />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-gray-400">Sugestões:</span>
              {SUGESTOES_ORIENTACAO.map((s) => (
                <button key={s} type="button" disabled={orientacoes.includes(s)}
                  onClick={() => setOrientacoes((o) => (o.trim() ? `${o.trim()} ${s}` : s).slice(0, 500))}
                  className="rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-[11px] text-gray-500 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:border-solid disabled:border-blue-200 disabled:bg-blue-50 disabled:text-blue-600">
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* ---------- 3. Revisão ---------- */}
      {step === 3 && (
        <div key="passo3" className="grid grid-cols-[1fr_340px] items-start gap-5 animate-fade-in-up">
          <Card className="overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-5">
              <p className="text-[15px] font-bold text-gray-900">Revisar antes de gerar</p>
              <p className="mt-0.5 text-[12px] text-gray-400">Confira o que será enviado para a {NOME_IA}.</p>
            </div>

            <div className="divide-y divide-gray-100">
              <div className="flex items-start gap-4 px-6 py-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><span className="scale-110">{(() => { const I = Icons[TURNO_INFO[turno].icon]; return <I />; })()}</span></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Parâmetros</p>
                  <p className="mt-1 text-[15px] font-bold text-gray-900">{TURNO_LABEL[turno]} · {semestre}º semestre de {ano} · {aulasPorDia} aulas por dia</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {turmas.map((t) => <span key={t.id} className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">{t.codigo}</span>)}
                    {!turmas.length && <span className="text-[12px] text-red-500">Nenhuma turma neste turno</span>}
                  </div>
                </div>
                <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:underline"><Icons.Edit /> Editar</button>
              </div>

              <div className="flex items-start gap-4 px-6 py-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600"><Icons.Settings /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Preferências ({todasPreferencias.length})</p>
                  <ul className="mt-2 space-y-1.5">
                    {todasPreferencias.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-[13px] text-gray-700">
                        <span className="mt-0.5 text-emerald-500"><Icons.Check /></span>{p}
                      </li>
                    ))}
                    {!todasPreferencias.length && <li className="text-[13px] text-gray-400">Nenhuma — só as regras obrigatórias.</li>}
                  </ul>
                </div>
                <button type="button" onClick={() => setStep(2)} className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:underline"><Icons.Edit /> Editar</button>
              </div>
            </div>
          </Card>

          {/* Checagem final */}
          <Card className="sticky top-[84px] p-5">
            <p className="text-[14px] font-bold text-gray-900">Pronto para gerar?</p>
            <ul className="mt-4 space-y-3">
              {[
                { ok: turmas.length > 0, texto: turmas.length ? `${turmas.length} ${turmas.length === 1 ? "turma" : "turmas"} no turno` : "Nenhuma turma no turno" },
                { ok: !bloqueado, texto: bloqueado ? "Cadastros com pendências" : "Cadastros consistentes" },
                { ok: !turmasEstouradas.length, texto: turmasEstouradas.length ? `${turmasEstouradas.map((t) => t.codigo).join(", ")} sem horários suficientes` : "Carga cabe nos horários", aviso: true },
              ].map((c) => (
                <li key={c.texto} className="flex items-start gap-2.5 text-[12px]">
                  <span className={`mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full ${c.ok ? "bg-emerald-100 text-emerald-600" : c.aviso ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"}`}>
                    <span className="scale-75">{c.ok ? <Icons.Check /> : <Icons.AlertTriangle />}</span>
                  </span>
                  <span className={c.ok ? "text-gray-600" : c.aviso ? "text-amber-700" : "font-semibold text-red-600"}>{c.texto}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-[12px] text-gray-500">
              <Icons.Clock /> Tempo estimado: <strong className="font-semibold text-gray-800">~{formatarTempo(estimativaPrevia)}</strong>
            </div>
            <Button variant="primary" onClick={gerar} disabled={!turmas.length || bloqueado}
              className="botao-gerar group mt-4 w-full py-3 text-[14px]"
              title={bloqueado ? "Resolva o que falta nos cadastros antes de gerar" : undefined}>
              <span className="transition-transform duration-300 group-hover:rotate-12 group-hover:scale-125"><Icons.Sparkles /></span>
              Gerar grade
            </Button>
          </Card>

          {turmasEstouradas.length > 0 && (
            <div className="col-span-2 -mt-1">
              <Alert tone="warning">{turmasEstouradas.map((t) => t.codigo).join(", ")} tem(têm) mais aulas do que horários disponíveis. Aumente as aulas por dia ou ajuste a carga.</Alert>
            </div>
          )}
        </div>
      )}

      {/* ---------- 4. Resultado ---------- */}
      {step === 4 && (
        <div key="passo4" className="animate-fade-in-up space-y-5">
          {!erro && !grade && (
            <ProgressoGeracao job={job ?? { id: "", status: "executando", etapa: "Preparando dados", tentativa: 0, segundos: 0 }}
              inicio={inicio} estimativa={estimativa} concluido={job?.status === "concluido"} aulasPorDia={aulasGeradas} />
          )}

          {erro && (
            <Alert title={erro.mensagem}>
              {erro.problemas && <ul className="list-disc pl-5 mt-1 space-y-0.5">{erro.problemas.map((p) => <li key={p}>{p}</li>)}</ul>}
            </Alert>
          )}

          {grade && <GradeGerada grade={grade} onEditando={setEditandoGrade} />}
        </div>
      )}

      {/* Barra de ações sempre à mão no rodapé */}
      {(step < 4 || !gerando) && (
        <div className="barra-acoes fixed bottom-5 left-[calc(15rem+1.75rem)] right-7 z-30 print:hidden">
          <div className="mx-auto flex max-w-full items-center justify-between gap-3 rounded-2xl border border-gray-200/80 bg-white/85 px-4 py-3 shadow-[0_12px_40px_-12px_rgba(15,36,86,0.25)] backdrop-blur-xl">
            {step < 4 ? (
              <>
                <Button onClick={() => setStep((s) => (s - 1) as Step)} disabled={step === 1}><Icons.ChevronLeft /> Voltar</Button>
                <span className="text-[12px] text-gray-400">Etapa <strong className="text-gray-700">{step}</strong> de 3 · {STEPS[step - 1].label}</span>
                {step < 3
                  ? <Button variant="primary" onClick={() => setStep((s) => (s + 1) as Step)}>Próximo <Icons.ChevronRight /></Button>
                  : <Button variant="primary" onClick={gerar} disabled={!turmas.length || bloqueado} className="group"
                    title={bloqueado ? "Resolva o que falta nos cadastros antes de gerar" : undefined}>
                    <span className="transition-transform duration-300 group-hover:rotate-12"><Icons.Sparkles /></span> Gerar grade
                  </Button>}
              </>
            ) : (
              <>
                <Button onClick={() => setStep(3)}><Icons.ChevronLeft /> Ajustar parâmetros</Button>
                <div className="flex gap-2.5">
                  <Button onClick={gerar} disabled={editandoGrade}><Icons.Refresh /> Gerar novamente</Button>
                  {grade && <LinkButton to={`/grades?id=${grade.id}`}>Abrir em Grades Horárias</LinkButton>}
                  {grade && grade.status !== "PUBLICADA" && (
                    <Button variant="primary" onClick={publicar} loading={publicando} disabled={grade.violacoes.length > 0 || editandoGrade}
                      title={editandoGrade ? "Salve ou cancele a edição antes de publicar"
                        : grade.violacoes.length ? "Grades com conflitos não podem ser publicadas" : undefined}>
                      <Icons.Upload /> Publicar grade
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- grade gerada ----------------
 * quadro + resumo + chat. editando a mao, o painel da edicao toma o lugar do resumo e o chat
 * so fica escondido (sem desmontar), pra conversa continuar la qnd voltar */
function GradeGerada({ grade, onEditando }: { grade: GradeDetalhe; onEditando: (editando: boolean) => void }) {
  const edicao = useEdicaoGrade(grade, atualizarGrade);
  useEffect(() => { onEditando(edicao.editando); }, [edicao.editando, onEditando]);
  useEffect(() => () => onEditando(false), [onEditando]);
  const manual = grade.modelo === "manual";

  return (
    <>
      <Card className="overflow-hidden animate-scale-in">
        <div className={`relative overflow-hidden px-6 py-5 flex items-center gap-4 border-b ${grade.violacoes.length ? "bg-gradient-to-r from-red-50 to-white border-red-100" : "bg-gradient-to-r from-emerald-50 to-white border-emerald-100"}`}>
          <span className={`resultado-selo relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white ${grade.violacoes.length ? "bg-red-500" : "bg-emerald-500"}`}>
            <span className="scale-125">{grade.violacoes.length ? <Icons.AlertTriangle /> : <Icons.Check />}</span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-bold text-gray-900">
              {`${manual ? "Grade editada" : "Grade gerada"} ${grade.violacoes.length ? `com ${grade.violacoes.length} conflito(s)` : "sem conflitos"}`}
            </p>
            <p className="text-[12px] text-gray-500 mt-0.5">
              Grade #{grade.id} · {grade.aulas.length} aulas · {manual ? "editada à mão" : `${grade.tentativas} tentativa(s) · ${NOME_IA}`}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${grade.status === "PUBLICADA" ? "bg-emerald-100 text-emerald-700" : "bg-white text-gray-600 ring-1 ring-gray-200"}`}>
            {grade.status === "PUBLICADA" ? "Publicada" : "Rascunho"}
          </span>
        </div>
        <GradeViewer grade={grade} edicao={edicao} />
        {edicao.editando
          ? <div className="border-t border-gray-100 px-5 py-4"><PainelEdicao edicao={edicao} /></div>
          : <ResumoGrade grade={grade} />}
      </Card>

      <div className={edicao.editando ? "hidden" : ""}>
        <ChatAjuste grade={grade} onNovaVersao={atualizarGrade} />
      </div>
    </>
  );
}
