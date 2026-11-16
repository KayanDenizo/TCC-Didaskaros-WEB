import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { mensagemErro } from "../api/client";
import type { GradeDetalhe } from "../api/types";
import { corDisciplina } from "../lib/cores";
import { DIAS_CURTOS, nomeGrade } from "../lib/format";
import { Alert, Button } from "./ui";

const MAX_TURMAS = 3;

/** confirmacao de excluir q mostra a grade em miniatura, qnd confirma as aulas vao sumindo */
export function ExcluirGradeDialog({ grade, onCancelar, onConfirmar }: {
  grade: GradeDetalhe;
  onCancelar: () => void;
  onConfirmar: () => Promise<void>;
}) {
  const [apagando, setApagando] = useState(false);
  const [erro, setErro] = useState("");
  const cancelar = useRef<HTMLButtonElement>(null);

  // o foco ja comeca no "Cancelar", pra ser a opcao segura
  useEffect(() => cancelar.current?.focus(), []);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && !apagando && onCancelar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [apagando, onCancelar]);

  async function confirmar() {
    setApagando(true);
    setErro("");
    try {
      // espera a miniatura terminar de apagar antes de fechar
      await Promise.all([onConfirmar(), new Promise((r) => setTimeout(r, 650))]);
    } catch (err) {
      setErro(mensagemErro(err));
      setApagando(false);
    }
  }

  const turmas = grade.turmas.slice(0, MAX_TURMAS);
  const publicada = grade.status === "PUBLICADA";
  let indice = 0; // ordem q as celulas vao apagando

  return createPortal(
    <div className="dialogo-fundo fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[#0F2456]/45 backdrop-blur-[3px]"
      onMouseDown={(e) => e.target === e.currentTarget && !apagando && onCancelar()}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="excluir-titulo" aria-describedby="excluir-texto"
        className="dialogo-caixa w-full max-w-[460px] bg-white rounded-3xl shadow-[0_24px_64px_rgba(15,36,86,0.28)] overflow-hidden">

        <div className={`bg-gray-50 border-b border-gray-100 px-6 pt-6 pb-5 ${apagando ? "apagando" : ""}`}>
          <div className="flex justify-center gap-5">
            {turmas.map((t) => (
              <figure key={t.id} className="flex flex-col items-center gap-2">
                <div className="grid grid-cols-5 gap-[3px]" aria-hidden>
                  {grade.horarios.flatMap((_, ordem) => DIAS_CURTOS.map((_, dia) => {
                    const a = grade.aulas.find((x) => x.turmaId === t.id && x.dia === dia && x.ordem === ordem);
                    const atraso = a ? indice++ * 9 : 0;
                    return (
                      <span key={`${dia}-${ordem}`} style={{ transitionDelay: apagando ? `${atraso}ms` : "0ms" }}
                        className={`dialogo-celula w-[14px] h-[14px] rounded-[4px] ${a ? corDisciplina(a.disciplinaId).dot : "border border-dashed border-gray-300"}`} />
                    );
                  }))}
                </div>
                <figcaption className="text-[11px] font-semibold text-gray-500">{t.codigo}</figcaption>
              </figure>
            ))}
          </div>
          {grade.turmas.length > MAX_TURMAS && (
            <p className="text-center text-[11px] text-gray-400 mt-3">e mais {grade.turmas.length - MAX_TURMAS} turma(s)</p>
          )}
        </div>

        <div className="px-6 pt-5 pb-6">
          <h2 id="excluir-titulo" className="text-[18px] font-bold text-gray-900">Excluir a Grade #{grade.id}?</h2>
          <p id="excluir-texto" className="text-[13px] text-gray-500 leading-relaxed mt-1.5">
            {nomeGrade(grade)}, com {grade.turmas.length} turma(s) e {grade.aulas.length} aulas.
            Ela sai da lista de grades e não pode ser recuperada.
          </p>

          {publicada && (
            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-[12px] text-amber-800 leading-relaxed">
              Esta é a grade publicada do turno. Depois de excluir, o painel para de mostrar as aulas de hoje até você publicar outra grade.
            </div>
          )}
          {erro && <div className="mt-4"><Alert>{erro}</Alert></div>}

          <div className="flex justify-end gap-2.5 mt-6">
            <Button ref={cancelar} onClick={onCancelar} disabled={apagando}>Cancelar</Button>
            <Button onClick={confirmar} loading={apagando}
              className="!text-white !bg-red-600 !border-red-600 hover:!bg-red-700 shadow-[0_2px_12px_rgba(220,38,38,0.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
              {apagando ? "Excluindo grade" : "Excluir grade"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
