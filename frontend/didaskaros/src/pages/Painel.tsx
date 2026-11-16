import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Painel as PainelData, Turno } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Icons, type IconName } from "../components/icons";
import { seguirCursor, soltarCursor, StatCard } from "../components/StatCard";
import { Alert, Card, Empty, Skeleton, StatusBadge } from "../components/ui";
import { useApi } from "../hooks/useApi";
import { dataCurta, dataLonga, iniciais, nomeGrade } from "../lib/format";

const ICONE_TURNO: Record<Turno, IconName> = { MANHA: "Sun", TARDE: "Sunset", NOITE: "Moon" };
const DURACAO_PADRAO = 50; // minutos de uma aula qnd nao da pra descobrir pelo proximo horario

/** hora atual q atualiza a cada 30s, ja da pra saber a aula de "agora" e a "proxima" */
function useAgora() {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return agora;
}

const minutos = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

function saudacao(d: Date) {
  const h = d.getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

type Situacao = "passada" | "agora" | "futura";
type Aula = PainelData["aulasHoje"][number];

/** junta as aulas de hoje por horario e marca o q ja passou, o q ta rolando e o q vem */
function agruparPorHorario(aulas: Aula[], agora: Date) {
  const horarios = [...new Set(aulas.map((a) => a.horario))].sort((a, b) => minutos(a) - minutos(b));
  const atual = agora.getHours() * 60 + agora.getMinutes();
  return horarios.map((h, i) => {
    const inicio = minutos(h);
    const proximo = horarios[i + 1] ? minutos(horarios[i + 1]) : inicio + DURACAO_PADRAO;
    const fim = Math.min(proximo, inicio + 120);
    const situacao: Situacao = atual >= fim ? "passada" : atual >= inicio ? "agora" : "futura";
    return { horario: h, situacao, progresso: situacao === "agora" ? (atual - inicio) / (fim - inicio) : 0, aulas: aulas.filter((a) => a.horario === h) };
  });
}

/* ---------------- carregando ---------------- */
function PainelEsqueleto() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[188px] rounded-3xl" />
      <div className="grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[150px] rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-[1fr_340px] gap-5">
        <Skeleton className="h-[420px] rounded-2xl" />
        <Skeleton className="h-[420px] rounded-2xl" />
      </div>
    </div>
  );
}

/* ---------------- faixa de boas-vindas ---------------- */
function BoasVindas({ nome, data, agora }: { nome: string; data: PainelData; agora: Date }) {
  const { totais, aulasHoje } = data;
  const blocos = agruparPorHorario(aulasHoje, agora);
  const emAndamento = blocos.find((b) => b.situacao === "agora");
  const proxima = blocos.find((b) => b.situacao === "futura");
  const destaque = emAndamento ?? proxima;

  const resumo = [
    aulasHoje.length ? `${aulasHoje.length} ${aulasHoje.length === 1 ? "aula acontece" : "aulas acontecem"} hoje` : "Nenhuma aula agendada para hoje",
    totais.rascunhos ? `${totais.rascunhos} ${totais.rascunhos === 1 ? "rascunho aguarda" : "rascunhos aguardam"} publicação` : null,
  ].filter(Boolean).join(" · ");

  return (
    <section onPointerMove={seguirCursor} onPointerLeave={soltarCursor}
      className="boas-vindas relative overflow-hidden rounded-3xl px-8 py-7 text-white animate-fade-up">
      <div aria-hidden className="absolute inset-0 boas-vindas-grade" />
      <div aria-hidden className="boas-vindas-luz absolute inset-0" />
      <div aria-hidden className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl animate-blob" />
      <div aria-hidden className="absolute -bottom-32 left-1/3 h-72 w-96 rounded-full bg-blue-500/25 blur-3xl animate-blob" style={{ animationDelay: "-6s" }} />

      <div className="relative flex items-center gap-8 [perspective:1000px]">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-blue-100/70">{dataLonga(agora)}</p>
          <h1 className="mt-1.5 text-[28px] font-extrabold tracking-tight leading-tight">
            {saudacao(agora)}, {nome}
          </h1>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-blue-100/80">{resumo}.</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link to="/gerar-grade"
              className="brilho-botao group inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[13px] font-semibold text-[#0F2456] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)] transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]">
              <span className="text-blue-600 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"><Icons.Sparkles /></span>
              Gerar nova grade
            </Link>
            <Link to="/grades"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white ring-1 ring-inset ring-white/20 backdrop-blur transition-all duration-200 hover:bg-white/15 hover:-translate-y-0.5 active:scale-[0.97]">
              <Icons.Calendar /> Ver grades
            </Link>
          </div>
        </div>

        {/* Cartão de vidro com a aula em andamento ou a próxima */}
        <div className="vidro-escuro inclina-3d hidden w-[300px] shrink-0 rounded-2xl p-4 lg:block">
          {destaque ? (
            <>
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${emAndamento ? "bg-emerald-400/20 text-emerald-200" : "bg-white/10 text-blue-100"}`}>
                  {emAndamento && <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />}
                  {emAndamento ? "Acontecendo agora" : "Próxima aula"}
                </span>
                <span className="text-[13px] font-bold tabular-nums">{destaque.horario}</span>
              </div>
              <p className="mt-3 truncate text-[15px] font-bold">{destaque.aulas[0].disciplina}</p>
              <p className="mt-0.5 truncate text-[12px] text-blue-100/70">
                {destaque.aulas[0].turma} · {destaque.aulas[0].sala} · {destaque.aulas[0].professor}
              </p>
              {destaque.aulas.length > 1 && (
                <p className="mt-2 text-[11px] text-blue-100/60">+ {destaque.aulas.length - 1} {destaque.aulas.length === 2 ? "turma" : "turmas"} no mesmo horário</p>
              )}
              {emAndamento && (
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300 transition-[width] duration-1000" style={{ width: `${Math.round(emAndamento.progresso * 100)}%` }} />
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><Icons.Check /></span>
              <div>
                <p className="text-[13px] font-semibold">{aulasHoje.length ? "Aulas de hoje encerradas" : "Dia livre"}</p>
                <p className="text-[11px] text-blue-100/60">{aulasHoje.length ? "Até amanhã!" : "Nada nas grades publicadas"}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- primeiros passos ---------------- */
function PrimeirosPassos({ totais }: { totais: PainelData["totais"] }) {
  const passos = [
    { label: "Disciplinas", desc: "O que é ensinado", to: "/disciplinas", feito: totais.disciplinas > 0, icon: "Book" as IconName },
    { label: "Salas", desc: "Onde as aulas acontecem", to: "/salas", feito: totais.salas > 0, icon: "Door" as IconName },
    { label: "Professores", desc: "Quem dá cada disciplina", to: "/professores", feito: totais.professores > 0, icon: "Users" as IconName },
    { label: "Turmas", desc: "Com a carga horária", to: "/turmas", feito: totais.turmas > 0, icon: "Layers" as IconName },
  ];
  const feitos = passos.filter((p) => p.feito).length;
  const proximo = passos.findIndex((p) => !p.feito);

  return (
    <Card className="p-5 animate-fade-up" >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[14px] font-bold text-gray-900">Prepare a unidade para gerar grades</p>
          <p className="text-[12px] text-gray-400 mt-0.5">{feitos} de {passos.length} cadastros concluídos</p>
        </div>
        <div className="h-2 w-40 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-[width] duration-700" style={{ width: `${(feitos / passos.length) * 100}%` }} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-3">
        {passos.map((p, i) => {
          const Icon = Icons[p.icon];
          const eProximo = i === proximo;
          return (
            <Link key={p.to} to={p.to}
              className={`group relative flex items-center gap-3 rounded-xl border p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${p.feito ? "border-emerald-200 bg-emerald-50/50" : eProximo ? "border-blue-300 bg-blue-50/60 ring-4 ring-blue-50" : "border-gray-200 bg-white"}`}>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${p.feito ? "bg-emerald-500 text-white" : eProximo ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                {p.feito ? <Icons.Check /> : <Icon />}
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-gray-900">{p.label}</span>
                <span className="block truncate text-[11px] text-gray-400">{p.feito ? "Concluído" : p.desc}</span>
              </span>
              {!p.feito && <span className="ml-auto text-gray-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-blue-500"><Icons.ChevronRight /></span>}
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------------- aulas de hoje (linha do tempo) ---------------- */
function AulasHoje({ data, agora }: { data: PainelData; agora: Date }) {
  const blocos = agruparPorHorario(data.aulasHoje, agora);
  return (
    <Card className="overflow-hidden animate-fade-up" >
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <p className="text-[14px] font-bold text-gray-900">Aulas de hoje</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Das grades publicadas</p>
        </div>
        <Link to="/grades" className="group inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600">
          Grade completa <span className="transition-transform duration-200 group-hover:translate-x-0.5"><Icons.ChevronRight /></span>
        </Link>
      </div>
      {blocos.length ? (
        <ol className="max-h-[440px] overflow-y-auto px-5 py-4">
          {blocos.map((b, i) => (
            <li key={b.horario} className={`linha-tempo relative grid grid-cols-[52px_20px_1fr] gap-x-3 pb-4 last:pb-0 ${b.situacao}`}
              style={{ animationDelay: `${120 + i * 50}ms` }}>
              <span className={`pt-2.5 text-right text-[12px] font-bold tabular-nums ${b.situacao === "agora" ? "text-blue-700" : b.situacao === "passada" ? "text-gray-300" : "text-gray-500"}`}>
                {b.horario}
              </span>
              <span className="relative flex justify-center">
                <span className={`relative z-10 mt-3 h-3 w-3 rounded-full ring-4 ${b.situacao === "agora" ? "bg-blue-600 ring-blue-100" : b.situacao === "passada" ? "bg-gray-200 ring-white" : "bg-white ring-white border-2 border-blue-300"}`}>
                  {b.situacao === "agora" && <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping" />}
                </span>
              </span>
              <div className="space-y-1.5">
                {b.aulas.map((a, j) => (
                  <div key={j}
                    className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-200 hover:-translate-y-px hover:shadow-sm ${b.situacao === "agora" ? "border-blue-200 bg-blue-50/60" : b.situacao === "passada" ? "border-gray-100 bg-gray-50/50 opacity-60 hover:opacity-100" : "border-gray-100 bg-white hover:border-gray-200"}`}>
                    <span className="w-14 shrink-0 rounded-md bg-white px-2 py-1 text-center text-[10px] font-bold text-blue-700 ring-1 ring-inset ring-blue-100">{a.turma}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-gray-900">{a.disciplina}</p>
                      <p className="truncate text-[11px] text-gray-400">{a.professor}</p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500">{a.sala}</span>
                  </div>
                ))}
                {b.situacao === "agora" && (
                  <p className="flex items-center gap-1.5 pl-1 text-[11px] font-semibold text-blue-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" /> Em andamento
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="flex flex-col items-center px-5 py-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gray-50 text-gray-300 ring-1 ring-inset ring-gray-100"><Icons.Calendar /></span>
          <p className="mt-3 text-[13px] font-semibold text-gray-600">{data.totais.publicadas ? "Não há aulas hoje" : "Nenhuma grade publicada ainda"}</p>
          <p className="mt-1 text-[12px] text-gray-400">{data.totais.publicadas ? "Aproveite o dia livre." : "Publique uma grade para ver as aulas do dia aqui."}</p>
        </div>
      )}
    </Card>
  );
}

/* ---------------- grades recentes ---------------- */
function GradesRecentes({ data }: { data: PainelData }) {
  return (
    <Card className="overflow-hidden animate-fade-up">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <p className="text-[14px] font-bold text-gray-900">Grades recentes</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Últimas gerações</p>
        </div>
        <Link to="/grades" className="group inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600">
          Ver todas <span className="transition-transform duration-200 group-hover:translate-x-0.5"><Icons.ChevronRight /></span>
        </Link>
      </div>
      {data.gradesRecentes.length ? (
        <div className="p-2">
          {data.gradesRecentes.map((g) => {
            const Icon = Icons[ICONE_TURNO[g.turno]];
            return (
              <Link key={g.id} to={`/grades?id=${g.id}`}
                className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors duration-200 hover:bg-gray-50">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 ring-1 ring-inset ring-blue-100 transition-transform duration-300 group-hover:scale-105">
                  <Icon />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-gray-900">
                    {nomeGrade(g)} <span className="font-medium text-gray-400">#{g.id}</span>
                  </p>
                  <p className="text-[11px] text-gray-400">{dataCurta(g.criadoEm)}</p>
                </div>
                {g.conflitos > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">
                    <Icons.AlertTriangle /> {g.conflitos}
                  </span>
                )}
                <StatusBadge status={g.status} />
                <span className="-ml-1 text-gray-300 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-blue-500 group-hover:opacity-100"><Icons.ChevronRight /></span>
              </Link>
            );
          })}
        </div>
      ) : (
        <Empty>
          Nenhuma grade gerada.{" "}
          <Link to="/gerar-grade" className="group font-semibold text-blue-600">Gerar a primeira <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span></Link>
        </Empty>
      )}
    </Card>
  );
}

/* ---------------- equipe docente ---------------- */
const CORES_AVATAR = [
  "from-blue-500 to-cyan-400",
  "from-violet-500 to-indigo-400",
  "from-emerald-500 to-teal-400",
  "from-amber-500 to-orange-400",
  "from-pink-500 to-rose-400",
  "from-sky-500 to-blue-400",
];

function EquipeDocente({ data }: { data: PainelData }) {
  const [busca, setBusca] = useState("");
  const ordenados = useMemo(() => [...data.professores].sort((a, b) => b.aulasSemana - a.aulasSemana), [data.professores]);
  const maximo = Math.max(1, ...ordenados.map((p) => p.aulasSemana));
  const q = busca.trim().toLowerCase();
  const visiveis = q ? ordenados.filter((p) => `${p.nome} ${p.disciplinas ?? ""}`.toLowerCase().includes(q)) : ordenados;

  return (
    <Card className="sticky top-[84px] overflow-hidden animate-fade-up" >
      <div className="border-b border-gray-100 px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-bold text-gray-900">Equipe docente</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Aulas por semana nas grades publicadas</p>
          </div>
          <Link to="/professores" className="text-[12px] font-semibold text-blue-600 hover:underline">Gerenciar</Link>
        </div>
        {data.professores.length > 4 && (
          <label className="mt-3 flex h-9 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/70 px-3 text-gray-400 transition-all focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
            <Icons.Search />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Filtrar professor ou disciplina"
              className="flex-1 bg-transparent text-[12px] text-gray-800 placeholder-gray-400 outline-none" />
          </label>
        )}
      </div>
      <div className="max-h-[440px] overflow-y-auto p-2">
        {visiveis.map((p, i) => (
          <div key={p.id} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50">
            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white transition-transform duration-300 group-hover:scale-105 ${CORES_AVATAR[p.id % CORES_AVATAR.length]}`}>
              {iniciais(p.nome)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-[13px] font-semibold text-gray-800">{p.nome}</p>
                <span className="shrink-0 text-[11px] font-bold tabular-nums text-gray-600">{p.aulasSemana}</span>
              </div>
              <p className="truncate text-[11px] text-gray-400">{p.disciplinas ?? "Sem disciplinas"}</p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-gray-100">
                <div className="barra-carga h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                  style={{ width: `${(p.aulasSemana / maximo) * 100}%`, animationDelay: `${200 + i * 40}ms` }} />
              </div>
            </div>
          </div>
        ))}
        {!data.professores.length && <Empty>Nenhum professor cadastrado.</Empty>}
        {data.professores.length > 0 && !visiveis.length && <Empty>Ninguém encontrado para “{busca}”.</Empty>}
      </div>
    </Card>
  );
}

/* ---------------- pagina ---------------- */
export default function Painel() {
  const { usuario } = useAuth();
  const { data, erro, carregando } = useApi<PainelData>("/painel");
  const agora = useAgora();

  if (carregando) return <PainelEsqueleto />;
  if (erro || !data) return <Alert>{erro}</Alert>;
  const { totais } = data;
  const semCadastro = !totais.turmas || !totais.professores || !totais.salas || !totais.disciplinas;
  const pctPublicadas = totais.grades ? (totais.publicadas / totais.grades) * 100 : 0;

  return (
    <div className="space-y-6">
      <BoasVindas nome={usuario?.nome.split(" ")[0] ?? ""} data={data} agora={agora} />

      {semCadastro && <PrimeirosPassos totais={totais} />}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Professores" value={totais.professores} icon="Users" accent="blue" delay={60} to="/professores"
          detail={`${totais.disciplinas} disciplinas cadastradas`} />
        <StatCard label="Turmas" value={totais.turmas} icon="Layers" accent="emerald" delay={120} to="/turmas"
          detail={`${totais.salas} salas disponíveis`} />
        <StatCard label="Grades geradas" value={totais.grades} icon="Calendar" accent="violet" delay={180} to="/grades"
          detail={<><span className="font-semibold text-emerald-600">{totais.publicadas} publicadas</span> · {totais.rascunhos} rascunhos</>}>
          <div className="flex h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className="barra-carga h-full bg-emerald-500" style={{ width: `${pctPublicadas}%`, animationDelay: "500ms" }} />
            <div className="barra-carga h-full bg-amber-400" style={{ width: `${100 - pctPublicadas}%`, animationDelay: "650ms", opacity: totais.grades ? 1 : 0 }} />
          </div>
        </StatCard>
        <StatCard label="Conflitos em rascunhos" value={totais.conflitos} icon={totais.conflitos ? "AlertTriangle" : "Shield"}
          accent={totais.conflitos ? "red" : "emerald"} delay={240} to={totais.conflitos ? "/gerar-grade" : "/grades"}
          detail={totais.conflitos
            ? <span className="font-semibold text-red-600">Gerar novamente para corrigir</span>
            : "Nenhum conflito pendente"}>
          {!totais.conflitos && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <Icons.Check /> Tudo certo
            </span>
          )}
        </StatCard>
      </div>

      <div className="grid grid-cols-[1fr_340px] items-start gap-5">
        <div className="flex min-w-0 flex-col gap-5">
          <AulasHoje data={data} agora={agora} />
          <GradesRecentes data={data} />
        </div>
        <EquipeDocente data={data} />
      </div>
    </div>
  );
}
