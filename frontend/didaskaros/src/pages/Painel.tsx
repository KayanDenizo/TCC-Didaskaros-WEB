import { Link } from "react-router-dom";
import type { Painel as PainelData } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Icons } from "../components/icons";
import { StatCard } from "../components/StatCard";
import { Alert, Card, CardHeader, Empty, LinkButton, Loading, PageHeader, StatusBadge } from "../components/ui";
import { useApi } from "../hooks/useApi";
import { dataCurta, dataLonga, iniciais, nomeGrade } from "../lib/format";

export default function Painel() {
  const { usuario } = useAuth();
  const { data, erro, carregando } = useApi<PainelData>("/painel");

  if (carregando) return <Loading />;
  if (erro || !data) return <Alert>{erro}</Alert>;
  const { totais, aulasHoje, gradesRecentes, professores } = data;
  const semCadastro = !totais.turmas || !totais.professores || !totais.salas;

  return (
    <>
      <PageHeader title="Painel Principal" description={`Olá, ${usuario?.nome.split(" ")[0]}! ${dataLonga()}.`}>
        <LinkButton to="/grades"><Icons.Calendar /> Ver Grades</LinkButton>
        <LinkButton to="/gerar-grade" variant="primary"><Icons.Sparkles /> Gerar Grade</LinkButton>
      </PageHeader>

      {semCadastro && (
        <div className="mb-5">
          <Alert tone="info" title="Comece pelos cadastros">
            Para gerar grades, cadastre <Link className="underline" to="/disciplinas">disciplinas</Link>, <Link className="underline" to="/salas">salas</Link>,{" "}
            <Link className="underline" to="/professores">professores</Link> e <Link className="underline" to="/turmas">turmas</Link> (com a carga horária).
          </Alert>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Professores" value={totais.professores} detail={`${totais.disciplinas} disciplinas cadastradas`} emoji="👨‍🏫" accent="blue" />
        <StatCard label="Turmas" value={totais.turmas} detail={`${totais.salas} salas disponíveis`} emoji="🎓" accent="emerald" delay={80} />
        <StatCard label="Grades Geradas" value={totais.grades} detail={`${totais.publicadas} publicadas · ${totais.rascunhos} rascunhos`} emoji="📋" accent="amber" delay={160} />
        <StatCard label="Conflitos em Rascunhos" value={totais.conflitos} detail={totais.conflitos ? "Gere novamente para corrigir" : "Nenhum conflito pendente"} emoji="⚠️" accent="violet" delay={240} />
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-5 items-start">
        <div className="flex flex-col gap-5">
          <Card className="overflow-hidden">
            <CardHeader title="Aulas de Hoje" subtitle="Das grades publicadas">
              <Link to="/grades" className="group text-[12px] font-semibold text-blue-600 hover:underline">Ver grade completa <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span></Link>
            </CardHeader>
            {aulasHoje.length ? (
              <div className="divide-y divide-gray-50 max-h-[380px] overflow-y-auto">
                {aulasHoje.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <span className="text-[12px] font-bold text-blue-700 w-10 tabular-nums shrink-0">{a.horario}</span>
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-md w-14 text-center shrink-0">{a.turma}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">{a.disciplina}</p>
                      <p className="text-[11px] text-gray-400 truncate">{a.professor}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg shrink-0">{a.sala}</span>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>{totais.publicadas ? "Não há aulas hoje." : "Nenhuma grade publicada ainda."}</Empty>
            )}
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Grades Recentes" subtitle="Últimas gerações" />
            {gradesRecentes.length ? (
              <div className="divide-y divide-gray-50">
                {gradesRecentes.map((g) => (
                  <Link key={g.id} to={`/grades?id=${g.id}`} className="group flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 transition-transform duration-200 group-hover:translate-x-1">
                      <p className="text-[13px] font-semibold text-gray-900">Grade #{g.id} — {nomeGrade(g)}</p>
                      <p className="text-[11px] text-gray-400">{dataCurta(g.criadoEm)}</p>
                    </div>
                    {g.conflitos > 0 && <span className="text-[11px] font-semibold text-red-600">{g.conflitos} conflito(s)</span>}
                    <StatusBadge status={g.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <Empty>Nenhuma grade gerada. <Link to="/gerar-grade" className="group text-blue-600 font-semibold">Gerar a primeira <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span></Link></Empty>
            )}
          </Card>
        </div>

        <Card className="overflow-hidden sticky top-[76px]">
          <CardHeader title="Equipe Docente" subtitle="Aulas semanais nas grades publicadas">
            <Link to="/professores" className="text-[12px] font-semibold text-blue-600 hover:underline">Gerenciar</Link>
          </CardHeader>
          <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
            {professores.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {iniciais(p.nome)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-800 truncate">{p.nome}</p>
                  <p className="text-[11px] text-gray-400 truncate">{p.disciplinas ?? "Sem disciplinas"}</p>
                </div>
                <span className="text-[11px] font-bold text-gray-600 tabular-nums">{p.aulasSemana} aulas</span>
              </div>
            ))}
            {!professores.length && <Empty>Nenhum professor cadastrado.</Empty>}
          </div>
        </Card>
      </div>
    </>
  );
}
