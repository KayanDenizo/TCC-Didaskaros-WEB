import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { api, mensagemErro } from "../api/client";
import type { GradeDetalhe, JobGeracao, MensagemAjuste } from "../api/types";
import { NOME_IA } from "../lib/ia";
import { Icons } from "./icons";
import { Card, CardHeader } from "./ui";

interface Mensagem extends MensagemAjuste {
  versao?: { id: number; conflitos: number };
  erro?: boolean;
}

const SUGESTOES = [
  "Explique as principais escolhas desta grade",
  "O que está faltando nos cadastros?",
  "Diminua as janelas dos professores",
  "Evite aulas no último horário de sexta",
];

// Chat com a IA sobre a grade. Quando ela altera a grade, a nova versão chega por onNovaVersao.
export function ChatAjuste({ grade, onNovaVersao }: { grade: GradeDetalhe; onNovaVersao: (g: GradeDetalhe) => void }) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [job, setJob] = useState<JobGeracao | null>(null);
  const fimRef = useRef<HTMLDivElement>(null);
  const pensando = job?.status === "executando";

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [mensagens, pensando]);

  async function enviar(pedido: string) {
    const mensagem = pedido.trim();
    if (!mensagem || pensando) return;
    const historico = mensagens.filter((m) => !m.erro).map(({ papel, texto }) => ({ papel, texto }));
    setMensagens((ms) => [...ms, { papel: "coordenador", texto: mensagem }]);
    setTexto("");
    try {
      const { data } = await api.post<{ jobId: string }>(`/grades/${grade.id}/ajustar`, { mensagem, historico });
      setJob({ id: data.jobId, status: "executando", etapa: "Analisando o pedido", tentativa: 0, segundos: 0 });
    } catch (err) {
      setMensagens((ms) => [...ms, { papel: "ia", texto: mensagemErro(err), erro: true }]);
    }
  }

  // Acompanha a resposta da IA
  useEffect(() => {
    if (job?.status !== "executando") return;
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get<JobGeracao>(`/grades/jobs/${job.id}`);
        if (data.status === "concluido") {
          let versao: Mensagem["versao"];
          if (data.gradeId) {
            const { data: nova } = await api.get<GradeDetalhe>(`/grades/${data.gradeId}`);
            versao = { id: nova.id, conflitos: nova.violacoes.length };
            onNovaVersao(nova);
          }
          setMensagens((ms) => [...ms, { papel: "ia", texto: data.resposta ?? "Pronto.", versao }]);
        }
        if (data.status === "erro") setMensagens((ms) => [...ms, { papel: "ia", texto: data.erro ?? "Falha na Didáskaros IA.", erro: true }]);
        setJob(data);
      } catch (err) {
        setMensagens((ms) => [...ms, { papel: "ia", texto: mensagemErro(err), erro: true }]);
        setJob(null);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [job]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    enviar(texto);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar(texto);
    }
  }

  return (
    <Card className="overflow-hidden animate-fade-in-up">
      <CardHeader title={`Ajustar com a ${NOME_IA}`}
        subtitle="Peça mudanças ou tire dúvidas sobre a grade. Cada ajuste vira uma nova versão em rascunho." />

      <div className="px-5 py-4 space-y-3 max-h-[420px] overflow-y-auto bg-gray-50/50" aria-live="polite">
        {!mensagens.length && (
          <div className="py-2">
            <p className="text-[12px] text-gray-500 mb-3">Experimente:</p>
            <div className="flex flex-wrap gap-2">
              {SUGESTOES.map((s) => (
                <button key={s} type="button" onClick={() => enviar(s)}
                  className="text-[12px] font-medium text-blue-700 bg-white border border-blue-100 px-3 py-1.5 rounded-full transition-all duration-200 hover:border-blue-300 hover:-translate-y-0.5 hover:shadow-sm">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensagens.map((m, i) => m.papel === "coordenador" ? (
          <div key={i} className="flex justify-end animate-fade-in-up">
            <p className="max-w-[75%] whitespace-pre-wrap text-[13px] leading-relaxed text-white bg-gradient-to-br from-[#1E4DA1] to-blue-600 px-4 py-2.5 rounded-2xl rounded-br-md shadow-sm">
              {m.texto}
            </p>
          </div>
        ) : (
          <div key={i} className="flex gap-2.5 items-start animate-fade-in-up">
            <AvatarIA />
            <div className={`max-w-[80%] text-[13px] leading-relaxed px-4 py-2.5 rounded-2xl rounded-tl-md border shadow-sm
              ${m.erro ? "bg-red-50 border-red-200 text-red-700" : "bg-white border-gray-200 text-gray-800"}`}>
              <p className="whitespace-pre-wrap">{m.texto}</p>
              {m.versao && (
                <p className={`mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full
                  ${m.versao.conflitos ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                  {m.versao.conflitos ? "⚠" : "✓"} Nova versão #{m.versao.id}
                  {m.versao.conflitos ? ` com ${m.versao.conflitos} conflito(s)` : " sem conflitos"}
                </p>
              )}
            </div>
          </div>
        ))}

        {pensando && (
          <div className="flex gap-2.5 items-center animate-fade-in-up">
            <AvatarIA ativo />
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-2.5 shadow-sm">
              <p className="text-[12px] text-gray-500 flex items-center gap-2">
                <span className="flex gap-1">
                  {[0, 150, 300].map((d) => <span key={d} className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                </span>
                {job.etapa}…{job.tentativa > 1 && ` (tentativa ${job.tentativa} de 3)`}
              </p>
            </div>
          </div>
        )}
        <div ref={fimRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-end gap-2 px-4 py-3 border-t border-gray-100 bg-white">
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={handleKeyDown} rows={1} maxLength={2000}
          placeholder="Ex: Passe a aula de Matemática da 1DS de segunda para quarta"
          aria-label={`Mensagem para a ${NOME_IA}`}
          className="flex-1 resize-none max-h-32 px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 placeholder-gray-300 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        <button type="submit" disabled={!texto.trim() || pensando} aria-label="Enviar"
          className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-[#1E4DA1] to-blue-600 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none">
          <Icons.Send />
        </button>
      </form>
    </Card>
  );
}

function AvatarIA({ ativo }: { ativo?: boolean }) {
  return (
    <span className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-[#1E4DA1] to-blue-500 ${ativo ? "animate-breathe" : ""}`}>
      <Icons.Sparkles />
    </span>
  );
}
