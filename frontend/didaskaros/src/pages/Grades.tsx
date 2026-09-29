import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, mensagemErro } from "../api/client";
import type { GradeDetalhe, GradeResumo, StatusGrade } from "../api/types";
import { GradeViewer } from "../components/GradeViewer";
import { Icons } from "../components/icons";
import { ResumoGrade } from "../components/ResumoGrade";
import { Alert, Button, Card, CardHeader, Empty, LinkButton, Loading, PageHeader, StatusBadge } from "../components/ui";
import { useApi } from "../hooks/useApi";
import { dataCurta, nomeGrade } from "../lib/format";

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
  const excluir = () => confirm("Excluir esta grade? Essa ação não pode ser desfeita.") &&
    acao(async () => {
      await api.delete(`/grades/${idSelecionado}`);
      setParams({});
    });

  if (lista.carregando && !grades.length) return <Loading />;

  return (
    <>
      <PageHeader title="Grades Horárias" description="Visualize, publique e arquive as grades geradas para a unidade.">
        <Button onClick={() => window.print()} disabled={!grade}><Icons.Printer /> Imprimir / PDF</Button>
        <LinkButton to="/gerar-grade" variant="primary"><Icons.Sparkles /> Gerar Nova Grade</LinkButton>
      </PageHeader>

      {lista.erro && <Alert>{lista.erro}</Alert>}
      {!grades.length && !lista.erro && (
        <Card><Empty>Nenhuma grade gerada ainda. Use “Gerar Nova Grade” para criar a primeira.</Empty></Card>
      )}

      {grades.length > 0 && (
        <div className="grid grid-cols-[1fr_300px] gap-5 items-start print:block">
          <Card className="overflow-hidden print:border-0 print:shadow-none">
            {!grade ? <Loading /> : (
              <>
                <CardHeader title={`Grade #${grade.id} — ${nomeGrade(grade)}`}
                  subtitle={`${grade.turmas.length} turma(s) · ${grade.aulas.length} aulas · gerada em ${dataCurta(grade.criadoEm)}`}>
                  <StatusBadge status={grade.status} />
                </CardHeader>
                <GradeViewer key={grade.id} grade={grade} />
                <ResumoGrade grade={grade} />
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-2 print:hidden">
                  {grade.status !== "PUBLICADA" && (
                    <Button variant="primary" onClick={() => mudarStatus("PUBLICADA")} loading={ocupado} disabled={grade.violacoes.length > 0}>Publicar</Button>
                  )}
                  {grade.status !== "ARQUIVADA" && <Button onClick={() => mudarStatus("ARQUIVADA")} disabled={ocupado}>Arquivar</Button>}
                  {grade.status === "ARQUIVADA" && <Button onClick={() => mudarStatus("RASCUNHO")} disabled={ocupado}>Voltar para rascunho</Button>}
                  <Button onClick={() => acao(() => api.post(`/grades/${grade.id}/validar`))} disabled={ocupado}>Revalidar conflitos</Button>
                  <Button variant="danger" onClick={excluir} disabled={ocupado} className="ml-auto">Excluir</Button>
                </div>
                {erroAcao && <div className="px-5 pb-4 bg-gray-50"><Alert>{erroAcao}</Alert></div>}
              </>
            )}
          </Card>

          <Card className="overflow-hidden sticky top-[76px] print:hidden">
            <CardHeader title="Todas as Grades" subtitle={`${grades.length} gerada(s)`} />
            <div className="divide-y divide-gray-50 max-h-[560px] overflow-y-auto">
              {grades.map((g) => (
                <button key={g.id} onClick={() => setParams({ id: String(g.id) })}
                  className={`w-full text-left flex items-center gap-2 px-4 py-3 transition-colors ${g.id === idSelecionado ? "bg-blue-50/70" : "hover:bg-gray-50"}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-800 truncate">#{g.id} · {nomeGrade(g)}</p>
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
      )}
    </>
  );
}
