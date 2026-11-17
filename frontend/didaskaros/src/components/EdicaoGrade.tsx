import { useEffect, useState, type ReactNode } from "react";
import type { AnaliseEdicao } from "../api/types";
import { chaveSlot, type EdicaoGrade } from "../hooks/useEdicaoGrade";
import { DIAS } from "../lib/format";
import { NOME_IA } from "../lib/ia";
import { Icons } from "./icons";
import { Alert, Button } from "./ui";

// pecas da edicao manual (arrastar e soltar) usadas pelos dois quadros de grade:
// Grades Horárias e o resultado do Gerar Grade

export function BotaoEditar({ edicao }: { edicao: EdicaoGrade }) {
  if (edicao.editando) return null;
  return (
    <Button onClick={edicao.entrar} className="print:hidden" title="Mude aulas de horário arrastando os cartões. A IA avisa se der conflito ou se a grade piorar.">
      <Icons.Edit /> Editar arrastando
    </Button>
  );
}

/** barra em cima do quadro: o q ta acontecendo agora + desfazer, cancelar e salvar */
export function BarraEdicao({ edicao }: { edicao: EdicaoGrade }) {
  const [confirmando, setConfirmando] = useState(false);
  useEffect(() => {
    if (!confirmando) return;
    const t = setTimeout(() => setConfirmando(false), 4000);
    return () => clearTimeout(t);
  }, [confirmando]);

  if (!edicao.editando) return null;
  const { movidas, verificacao } = edicao;
  const conflitos = verificacao?.violacoes.length ?? 0;

  function cancelar() {
    if (movidas && !confirmando) return setConfirmando(true);
    edicao.sair();
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/70 px-4 py-3 mb-4 print:hidden animate-fade-in-up">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white"><Icons.Edit /></span>
        <div className="min-w-[220px] flex-1">
          <p className="text-[13px] font-bold text-gray-800">
            Editando a grade
            {movidas > 0 && <span className="font-semibold text-gray-500"> · {movidas} aula(s) fora do horário original</span>}
          </p>
          <Dica edicao={edicao} />
        </div>
        <Button onClick={edicao.desfazer} disabled={!edicao.podeDesfazer} title="Desfazer (Ctrl+Z)"><Icons.Undo /> Desfazer</Button>
        <Button onClick={cancelar} variant={confirmando ? "danger" : "secondary"}>
          {confirmando ? `Descartar ${movidas} mudança(s)?` : "Cancelar"}
        </Button>
        <Button variant="primary" onClick={edicao.salvar} loading={edicao.salvando} disabled={!movidas}
          title={conflitos ? `Vai virar um rascunho com ${conflitos} conflito(s): só dá para publicar depois de resolver.` : "A grade original não muda: as alterações viram um rascunho novo."}>
          <Icons.Check /> Salvar como nova versão
        </Button>
      </div>
      {edicao.erro && <div className="mt-3"><Alert>{edicao.erro}</Alert></div>}
    </div>
  );
}

/** linha de ajuda: o q acontece se soltar a aula onde o mouse ta */
function Dica({ edicao }: { edicao: EdicaoGrade }) {
  const { selecao, alvo, destinos, aulas, grade } = edicao;
  let texto = "Arraste uma aula para outro horário, ou clique nela e depois no destino. Soltar sobre outra aula troca as duas de lugar.";
  let cor = "text-gray-500";

  if (selecao) {
    const origem = aulas[selecao.indice];
    texto = selecao.arrastando
      ? "Solte num horário: verde não cria conflito, vermelho cria."
      : "Agora clique no horário de destino (Esc ou clicar na mesma aula cancela). Verde não cria conflito, vermelho cria.";
    if (alvo && alvo !== chaveSlot(origem.dia, origem.ordem)) {
      const [dia, ordem] = alvo.split(":").map(Number);
      const onde = `${DIAS[dia]}, ${ordem + 1}ª aula (${grade.horarios[ordem]})`;
      const d = destinos?.porSlot[alvo];
      if (!d) texto = `${onde}: conferindo…`;
      else if (d.novos.length) {
        cor = "text-red-700 font-semibold";
        texto = `⚠ ${onde}: ${d.novos.length} conflito(s) novo(s). ${d.novos[0]}${d.novos.length > 1 ? ` (+${d.novos.length - 1})` : ""}`;
      } else {
        cor = "text-emerald-700 font-semibold";
        const resolve = destinos!.conflitosAtuais - d.conflitos;
        texto = `✓ ${onde}: ${resolve > 0 ? `resolve ${resolve} conflito(s)` : "sem conflito novo"}.`;
      }
    }
  }
  return <p className={`text-[12px] mt-0.5 ${cor}`} aria-live="polite">{texto}</p>;
}

const AVALIACAO: Record<AnaliseEdicao["avaliacao"], { label: string; cor: string; icone: string }> = {
  boa: { label: "Mudanças boas", cor: "bg-emerald-50 text-emerald-700 border-emerald-200", icone: "✓" },
  atencao: { label: "Atenção", cor: "bg-amber-50 text-amber-800 border-amber-200", icone: "!" },
  ruim: { label: "Ficou ruim", cor: "bg-red-50 text-red-700 border-red-200", icone: "⚠" },
};

/** conferencia do validador (na hora) + opiniao da IA (qnd para de mexer) */
export function PainelEdicao({ edicao }: { edicao: EdicaoGrade }) {
  const { verificacao, grade } = edicao;
  const antes = grade.metricas;
  const depois = verificacao?.metricas;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <section className="rounded-2xl border border-gray-200 bg-white/70 px-5 py-4">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Conferência automática</p>
        {!verificacao ? (
          <p className="text-[12px] text-gray-400">Conferindo a grade…</p>
        ) : verificacao.violacoes.length === 0 ? (
          <p className="text-[13px] font-semibold text-emerald-700">✓ Nenhum conflito: turmas, professores e salas estão livres em todos os horários.</p>
        ) : (
          <>
            <p className="text-[13px] font-semibold text-red-700 mb-1">{verificacao.violacoes.length} conflito(s). As aulas envolvidas estão marcadas em vermelho.</p>
            <ul className="list-disc pl-5 text-[12px] text-red-700 space-y-0.5 max-h-40 overflow-y-auto">
              {verificacao.violacoes.map((v, i) => <li key={i}>{v.mensagem}</li>)}
            </ul>
          </>
        )}
        {depois && (
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <Comparacao label="Janelas das turmas" antes={antes.janelasTurmas} depois={depois.janelasTurmas} />
            <Comparacao label="Janelas dos professores" antes={antes.janelasProfessores} depois={depois.janelasProfessores} />
          </div>
        )}
      </section>

      <OpiniaoIA edicao={edicao} />
    </div>
  );
}

function Comparacao({ label, antes, depois }: { label: string; antes: number; depois: number }) {
  const cor = depois > antes ? "bg-amber-50 text-amber-800" : depois < antes ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600";
  return (
    <span className={`rounded-full px-2.5 py-1 font-semibold ${cor}`}>
      {label}: {antes === depois ? antes : `${antes} → ${depois}`}
    </span>
  );
}

function OpiniaoIA({ edicao }: { edicao: EdicaoGrade }) {
  const { analise, analisando, versao, movidas } = edicao;
  const atual = analise?.versao === versao;
  const resultado = analise?.resultado;

  let estado: ReactNode = null;
  if (!movidas) estado = <p className="text-[12px] text-gray-500">Mova alguma aula e a {NOME_IA} avisa se a grade ficou pior ou com conflito.</p>;
  else if (analisando !== null) estado = <Pensando texto="Analisando as mudanças…" />;
  else if (!atual) estado = <Pensando texto="A IA analisa quando você parar de mexer…" parado />;

  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50/50 px-5 py-4">
      <p className="flex items-center gap-2 text-[11px] font-bold text-blue-700 uppercase tracking-wide mb-2">
        <span className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-br from-[#1E4DA1] to-blue-500 text-white"><Icons.Sparkles /></span>
        Opinião da {NOME_IA}
      </p>
      {estado}
      {movidas > 0 && analise?.erro && atual && <p className="text-[12px] text-red-700">{analise.erro}</p>}
      {movidas > 0 && resultado && (
        <div className={`mt-2 space-y-2 transition-opacity ${atual ? "" : "opacity-50"}`}>
          {!atual && <p className="text-[11px] text-gray-500">Análise da versão anterior:</p>}
          <div className="flex items-start gap-2">
            <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${AVALIACAO[resultado.avaliacao].cor}`}>
              {AVALIACAO[resultado.avaliacao].icone} {AVALIACAO[resultado.avaliacao].label}
            </span>
            <p className="text-[13px] text-gray-800 leading-snug">{resultado.resumo}</p>
          </div>
          {resultado.avisos.length > 0 && (
            <ul className="list-disc pl-5 text-[12px] text-gray-700 space-y-0.5">
              {resultado.avisos.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          )}
          {resultado.sugestoes.length > 0 && (
            <div className="rounded-xl bg-white/80 border border-blue-100 px-3 py-2">
              <p className="text-[11px] font-bold text-blue-700 mb-0.5">Sugestões</p>
              <ul className="list-disc pl-5 text-[12px] text-gray-700 space-y-0.5">
                {resultado.sugestoes.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Pensando({ texto, parado }: { texto: string; parado?: boolean }) {
  return (
    <p className="text-[12px] text-gray-500 flex items-center gap-2">
      <span className="flex gap-1">
        {[0, 150, 300].map((d) => (
          <span key={d} className={`w-1.5 h-1.5 rounded-full bg-blue-500 ${parado ? "opacity-40" : "animate-bounce"}`} style={{ animationDelay: `${d}ms` }} />
        ))}
      </span>
      {texto}
    </p>
  );
}

/** canto do card: "!" se a aula ta em conflito, ponto azul se mudou de horario */
export function MarcaEdicao({ conflito, movida }: { conflito: boolean; movida: boolean }) {
  if (conflito) {
    return <span aria-label="Aula em conflito" className="absolute top-1 right-1 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white">!</span>;
  }
  if (movida) return <span aria-label="Mudou de horário" title="Mudou de horário" className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500" />;
  return null;
}

/** titulo da caixa de observacoes: versao editada a mao nao foi escrita pela IA */
export const tituloObservacoes = (g: { modelo: string | null }) => (g.modelo === "manual" ? "✎ Edição manual" : "✨ Observações da IA");
