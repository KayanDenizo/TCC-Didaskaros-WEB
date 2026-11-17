import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { api, mensagemErro } from "../api/client";
import type { Aula, GradeDetalhe, GradeResumo, StatusGrade } from "../api/types";
import { BarraEdicao, BotaoEditar, MarcaEdicao, PainelEdicao, tituloObservacoes } from "../components/EdicaoGrade";
import { ExcluirGradeDialog } from "../components/ExcluirGradeDialog";
import { Select } from "../components/form";
import { Icons } from "../components/icons";
import { Alert, Button, Card, Empty, LinkButton, Loading, PageHeader, StatusBadge } from "../components/ui";
import { useApi } from "../hooks/useApi";
import { useEdicaoGrade, type EdicaoGrade } from "../hooks/useEdicaoGrade";
import type { Agrupar } from "../lib/edicaoGrade";
import { corDisciplina } from "../lib/cores";
import { DIAS, TURNO_LABEL, dataCurta, nomeGrade } from "../lib/format";

type Modo = "turma" | "professor" | "sala";
const MODOS: { id: Modo; label: string; chave: Agrupar; rotulo: string }[] = [
  { id: "turma", label: "Por Turma", chave: "turmaId", rotulo: "Turma" },
  { id: "professor", label: "Por Professor", chave: "professorId", rotulo: "Professor" },
  { id: "sala", label: "Por Sala", chave: "salaId", rotulo: "Sala" },
];

const minutos = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** segunda-feira da semana de `d` */
function segundaDaSemana(d: Date) {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
  return s;
}

function rotuloSemana(segunda: Date) {
  const sexta = new Date(segunda);
  sexta.setDate(sexta.getDate() + 4);
  const mes = (d: Date) => d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  const ini = segunda.getMonth() === sexta.getMonth() ? `${segunda.getDate()}` : `${segunda.getDate()} ${mes(segunda)}`;
  return `${ini}–${sexta.getDate()} ${mes(sexta)} ${sexta.getFullYear()}`;
}

/** relogio q atualiza a cada 30s, pra destacar o dia de hoje e a aula do horario atual */
function useAgora() {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return agora;
}

export default function Grades() {
  const [params, setParams] = useSearchParams();
  const lista = useApi<GradeResumo[]>("/grades");
  const grades = lista.data ?? [];
  const idSelecionado = Number(params.get("id")) || (grades.find((g) => g.status === "PUBLICADA") ?? grades[0])?.id;
  const detalhe = useApi<GradeDetalhe>(idSelecionado ? `/grades/${idSelecionado}` : null);
  const grade = detalhe.data?.id === idSelecionado ? detalhe.data : null;
  const [erroAcao, setErroAcao] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function acao(fn: () => Promise<unknown>) {
    setOcupado(true);
    setErroAcao("");
    try {
      await fn();
      await Promise.all([lista.recarregar(), detalhe.recarregar()]);
    } catch (err) {
      setErroAcao(mensagemErro(err));
    } finally {
      setOcupado(false);
    }
  }

  const mudarStatus = (status: StatusGrade) => acao(() => api.patch(`/grades/${idSelecionado}/status`, { status }));
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  async function excluir() {
    // os erros aparecem dentro da propria caixa de confirmacao
    await api.delete(`/grades/${idSelecionado}`);
    setConfirmandoExclusao(false);
    setParams({});
    await lista.recarregar();
  }

  // salvou a edicao manual: abre a versao nova
  async function abrirVersao(nova: GradeDetalhe) {
    setParams({ id: String(nova.id) });
    await lista.recarregar();
  }

  if (lista.carregando && !grades.length) return <Loading />;

  const semestre = grade ? `${grade.semestre}º Semestre ${grade.ano}` : "";

  return (
    <>
      <PageHeader title="Grades Horárias"
        description={`Visualize e gerencie os horários das turmas${semestre ? ` — ${semestre}` : ""}.`}>
        <Button onClick={() => window.print()} disabled={!grade}><Icons.Printer /> Exportar PDF</Button>
        <LinkButton to="/gerar-grade" variant="primary"><Icons.Sparkles /> Gerar Grade</LinkButton>
      </PageHeader>

      {lista.erro && <Alert>{lista.erro}</Alert>}
      {!grades.length && !lista.erro && (
        <Card><Empty>Nenhuma grade gerada ainda. Use “Gerar Grade” para criar a primeira.</Empty></Card>
      )}

      {grades.length > 0 && (
        <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-5 items-start print:block">
          <div className="flex flex-col gap-5 min-w-0">
            {!grade ? (
              <Card className="rounded-3xl overflow-hidden"><Loading /></Card>
            ) : (
              <GradeAberta key={grade.id} grade={grade} onSalva={abrirVersao}>
                <ResumoGradeCard grade={grade} />
                <Card className="rounded-3xl px-6 py-4 flex flex-wrap items-center gap-2 print:hidden">
                  <p className="text-[12px] text-gray-400 mr-auto">Grade #{grade.id} · gerada em {dataCurta(grade.criadoEm)}</p>
                  {grade.status !== "PUBLICADA" && (
                    <Button variant="primary" onClick={() => mudarStatus("PUBLICADA")} loading={ocupado} disabled={grade.violacoes.length > 0}>Publicar</Button>
                  )}
                  {grade.status !== "ARQUIVADA" && <Button onClick={() => mudarStatus("ARQUIVADA")} disabled={ocupado}>Arquivar</Button>}
                  {grade.status === "ARQUIVADA" && <Button onClick={() => mudarStatus("RASCUNHO")} disabled={ocupado}>Voltar para rascunho</Button>}
                  <Button onClick={() => acao(() => api.post(`/grades/${grade.id}/validar`))} disabled={ocupado}>Revalidar conflitos</Button>
                  <Button variant="danger" onClick={() => setConfirmandoExclusao(true)} disabled={ocupado}>Excluir</Button>
                  {erroAcao && <div className="w-full"><Alert>{erroAcao}</Alert></div>}
                </Card>
                {confirmandoExclusao && (
                  <ExcluirGradeDialog grade={grade} onCancelar={() => setConfirmandoExclusao(false)} onConfirmar={excluir} />
                )}
              </GradeAberta>
            )}
          </div>

          <div className="flex flex-col gap-5 sticky top-[76px] print:hidden">
            <Card className="rounded-3xl overflow-hidden">
              <div className="px-6 pt-5 pb-3">
                <p className="text-[16px] font-bold text-gray-900">Outras Grades</p>
                <p className="text-[12px] text-gray-400">{grades.length} gerada(s)</p>
              </div>
              <div className="px-4 pb-4 flex flex-col gap-2.5 max-h-[420px] overflow-y-auto">
                {grades.map((g) => (
                  <button key={g.id} onClick={() => setParams({ id: String(g.id) })}
                    className={`w-full text-left flex items-center gap-2 rounded-2xl border px-4 py-3 transition-all
                      ${g.id === idSelecionado ? "bg-blue-50 border-blue-300" : "bg-gray-50 border-gray-200 hover:border-blue-300 hover:-translate-y-0.5"}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-800 truncate">Grade #{g.id} — {nomeGrade(g)}</p>
                      <p className="text-[11px] text-gray-400">
                        {g.totalTurmas} turma(s) · {g.totalAulas} aulas{g.conflitos > 0 && <span className="text-red-600"> · {g.conflitos} conflito(s)</span>}
                      </p>
                    </div>
                    <StatusBadge status={g.status} />
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

/** grade aberta: o quadro e embaixo o resumo e as acoes, ou o painel da edicao enquanto edita */
function GradeAberta({ grade, onSalva, children }: { grade: GradeDetalhe; onSalva: (nova: GradeDetalhe) => void; children: ReactNode }) {
  const edicao = useEdicaoGrade(grade, onSalva);
  return (
    <>
      <Card className="rounded-3xl overflow-hidden print:border-0 print:shadow-none">
        <QuadroGrade grade={grade} edicao={edicao} />
      </Card>
      {edicao.editando ? <Card className="rounded-3xl p-6 print:hidden"><PainelEdicao edicao={edicao} /></Card> : children}
    </>
  );
}

/** quadro da semana (design da Julia): filtros, navegar entre semanas, grade e legenda */
function QuadroGrade({ grade, edicao }: { grade: GradeDetalhe; edicao: EdicaoGrade }) {
  const [modo, setModo] = useState<Modo>("turma");
  const listas = {
    turma: grade.turmas.map((t) => ({ value: t.id, label: `${t.codigo} — ${t.curso}` })),
    professor: grade.professores.map((p) => ({ value: p.id, label: p.nome })),
    sala: grade.salas.map((s) => ({ value: s.id, label: s.nome })),
  };
  const [selecionado, setSelecionado] = useState<Record<Modo, number | undefined>>({ turma: undefined, professor: undefined, sala: undefined });
  const atual = selecionado[modo] ?? listas[modo][0]?.value;
  const { chave, rotulo } = MODOS.find((m) => m.id === modo)!;
  // editando, mostra a versao da tela; o indice eh o da aula na lista (eh por ele q a edicao identifica)
  const aulas = (edicao.editando ? edicao.aulas : grade.aulas).flatMap((a, i) => (a[chave] === atual ? [{ ...a, i }] : []));
  const agora = useAgora();
  const [segunda, setSegunda] = useState(() => segundaDaSemana(new Date()));
  const mudarSemana = (n: number) => setSegunda((s) => new Date(s.getFullYear(), s.getMonth(), s.getDate() + 7 * n));

  const nome = {
    turma: (id: number) => grade.turmas.find((t) => t.id === id)?.codigo ?? "",
    disciplina: (id: number) => grade.disciplinas.find((d) => d.id === id)?.nome ?? "",
    professor: (id: number) => grade.professores.find((p) => p.id === id)?.nome ?? "",
    sala: (id: number) => grade.salas.find((s) => s.id === id)?.nome ?? "",
  };
  const titulo = {
    turma: () => { const t = grade.turmas.find((x) => x.id === atual); return t ? `${t.codigo} — ${t.curso}` : ""; },
    professor: () => nome.professor(atual ?? 0),
    sala: () => nome.sala(atual ?? 0),
  }[modo]();
  // linhas de baixo do card: o q nao ta sendo filtrado
  const detalhe = (a: Aula) => (modo === "professor" ? nome.turma(a.turmaId) : nome.professor(a.professorId));
  const local = (a: Aula) => (modo === "sala" ? nome.turma(a.turmaId) : nome.sala(a.salaId));
  const disciplinasVisiveis = [...new Set(aulas.map((a) => a.disciplinaId))];

  const hoje = segundaDaSemana(agora).getTime() === segunda.getTime() ? (agora.getDay() + 6) % 7 : -1;
  const minAgora = agora.getHours() * 60 + agora.getMinutes();
  const dataDoDia = (dia: number) => {
    const d = new Date(segunda);
    d.setDate(d.getDate() + dia);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  return (
    <div className="p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[19px] font-bold text-gray-900 truncate">Grade Horária — {titulo}</h2>
          <p className="text-[13px] text-gray-400 mt-0.5">
            {rotulo} · {TURNO_LABEL[grade.turno]} · {aulas.length} aulas semanais
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <BotaoEditar edicao={edicao} />
          <StatusBadge status={grade.status} />
        </div>
      </div>

      <div className="-mx-7 my-4 border-t border-gray-100" />

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex border border-gray-200 rounded-xl p-1">
            {MODOS.map((m) => (
              <button key={m.id} onClick={() => { edicao.cancelarSelecao(); setModo(m.id); }}
                className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${modo === m.id ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
                {m.label}
              </button>
            ))}
          </div>
          <div className="w-64">
            <Select value={atual ?? ""} options={listas[modo]} onChange={(v) => { edicao.cancelarSelecao(); setSelecionado({ ...selecionado, [modo]: Number(v) }); }} />
          </div>
        </div>

        <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-700">
          <button onClick={() => mudarSemana(-1)} aria-label="Semana anterior"
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-100 transition"><Icons.ChevronLeft /></button>
          <button onClick={() => setSegunda(segundaDaSemana(new Date()))} title="Voltar para esta semana" className="min-w-[130px] text-center tabular-nums">
            {rotuloSemana(segunda)}
          </button>
          <button onClick={() => mudarSemana(1)} aria-label="Próxima semana"
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-100 transition"><Icons.ChevronRight /></button>
        </div>
      </div>

      <div className="-mx-7 my-4 border-t border-gray-100" />

      <BarraEdicao edicao={edicao} />

      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-separate border-spacing-x-2 border-spacing-y-2 min-w-[760px]">
          <thead>
            <tr>
              <th className="w-16 text-right pr-2 text-[11px] font-bold text-gray-400 uppercase tracking-wide pb-1">Horário</th>
              {DIAS.map((d, dia) => (
                <th key={d} className={`text-center text-[12px] font-bold uppercase tracking-wide pb-1 ${dia === hoje ? "text-blue-600" : "text-gray-400"}`}>
                  {d}
                  <span className="block text-[10px] font-semibold normal-case tracking-normal opacity-70">{dataDoDia(dia)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grade.horarios.map((hora, ordem) => (
              <tr key={hora}>
                <td className="text-right pr-2 text-[13px] font-bold text-gray-400 tabular-nums align-middle">{hora}</td>
                {DIAS.map((_, dia) => {
                  // normalmente eh uma aula so; com conflito na edicao podem ser duas no mesmo horario
                  const aqui = aulas.filter((x) => x.dia === dia && x.ordem === ordem);
                  const intervalo = grade.intervalos?.[ordem];
                  const acontecendo = dia === hoje && !!intervalo && minAgora >= minutos(intervalo.inicio) && minAgora < minutos(intervalo.fim);
                  return (
                    <td key={dia} className="p-0">
                      <div {...edicao.propsCelula(dia, ordem)}
                        className={`h-[74px] rounded-xl flex flex-col gap-1 transition-colors ${edicao.classeCelula(dia, ordem)}`}>
                        {aqui.length ? aqui.map((a) => {
                          const conflitos = edicao.conflitosDaAula(a.i);
                          return (
                            <div key={a.i} {...edicao.propsAula(a.i, chave)}
                              title={conflitos.length ? conflitos.join("\n") : undefined}
                              className={`relative flex-1 min-h-0 rounded-xl px-3 py-2 border border-gray-200 border-l-4 shadow-sm overflow-hidden transition-transform hover:-translate-y-0.5
                                ${corDisciplina(a.disciplinaId).cell} ${acontecendo ? "ring-2 ring-blue-500 ring-offset-1" : ""} ${edicao.classeAula(a.i)}`}>
                              <p className="text-[13px] font-semibold leading-tight truncate pr-4">{nome.disciplina(a.disciplinaId)}</p>
                              <p className="text-[11px] opacity-75 mt-1 leading-tight truncate">{detalhe(a)}</p>
                              <p className="text-[11px] opacity-60 mt-0.5 leading-tight truncate">{local(a)}</p>
                              <MarcaEdicao conflito={conflitos.length > 0} movida={edicao.foiMovida(a.i)} />
                            </div>
                          );
                        }) : (
                          <div className="h-full rounded-xl border-2 border-dashed border-gray-200" />
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
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
          {disciplinasVisiveis.map((id) => (
            <span key={id} className="flex items-center gap-2 text-[12px] text-gray-600">
              <span className={`w-4 h-4 rounded-md ${corDisciplina(id).dot}`} /> {nome.disciplina(id)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** numeros da grade, explicacao da IA e conflitos do validador */
function ResumoGradeCard({ grade }: { grade: GradeDetalhe }) {
  const blocos = [
    { label: "Aulas semanais", valor: grade.aulas.length, cor: "bg-red-50 border-red-200 text-red-800" },
    { label: "Professores", valor: grade.professores.length, cor: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    { label: "Disciplinas", valor: grade.disciplinas.length, cor: "bg-violet-50 border-violet-200 text-violet-800" },
    { label: "Conflitos", valor: grade.violacoes.length, cor: grade.violacoes.length ? "bg-red-100 border-red-300 text-red-700" : "bg-orange-50 border-orange-200 text-orange-800" },
  ];

  return (
    <Card className="rounded-3xl p-7 print:break-inside-avoid">
      <p className="text-[17px] font-bold text-gray-900 mb-4">Resumo da Grade — {nomeGrade(grade)}</p>
      <div className="grid grid-cols-4 gap-4">
        {blocos.map((b) => (
          <div key={b.label} className={`rounded-2xl border py-6 text-center ${b.cor}`}>
            <p className="text-[36px] font-extrabold leading-none tabular-nums">{b.valor}</p>
            <p className="text-[12px] font-semibold mt-2 opacity-60">{b.label}</p>
          </div>
        ))}
      </div>

      {grade.observacoes && (
        <div className="mt-5 rounded-2xl bg-blue-50/60 border border-blue-100 px-5 py-4">
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide mb-1">{tituloObservacoes(grade)}</p>
          <p className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-line">{grade.observacoes}</p>
        </div>
      )}

      {grade.violacoes.length > 0 && (
        <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 px-5 py-4">
          <p className="text-[11px] font-bold text-red-700 uppercase tracking-wide mb-1">Conflitos encontrados pelo validador</p>
          <ul className="list-disc pl-5 text-[12px] text-red-700 space-y-0.5 max-h-48 overflow-y-auto">
            {grade.violacoes.map((v, i) => <li key={i}>{v.mensagem}</li>)}
          </ul>
        </div>
      )}
    </Card>
  );
}
