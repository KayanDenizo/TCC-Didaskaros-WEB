import { useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent, type MouseEvent } from "react";
import axios from "axios";
import { api, mensagemErro } from "../api/client";
import type { AnaliseEdicao, Aula, Destino, GradeDetalhe, JobGeracao, Verificacao } from "../api/types";
import { aulasMovidas, moverAula, type Agrupar } from "../lib/edicaoGrade";

/* Edicao manual da grade: o coordenador arrasta as aulas (ou clica na aula e depois no destino).
 * - a cada mudanca o validador do backend confere a grade inteira (rapido, sem IA)
 * - ao pegar uma aula, o backend simula cada horario pra pintar de verde/vermelho onde da pra soltar
 * - qnd o coordenador para de mexer, a IA avalia as mudancas e avisa se ficou ruim
 * Nada eh salvo ate clicar em "Salvar como nova versão" (vira um rascunho novo, a original fica igual). */

/** tempo parado antes de pedir a opiniao da IA, pra nao chamar a cada aula arrastada */
const ESPERA_ANALISE_MS = 2500;

export const chaveSlot = (dia: number, ordem: number) => `${dia}:${ordem}`;

interface Selecao { indice: number; agrupar: Agrupar; arrastando: boolean }
interface Destinos { conflitosAtuais: number; porSlot: Record<string, Destino> }
interface Analise { versao: number; resultado?: AnaliseEdicao; erro?: string }

export type EdicaoGrade = ReturnType<typeof useEdicaoGrade>;

export function useEdicaoGrade(grade: GradeDetalhe, onSalva: (nova: GradeDetalhe) => void) {
  const [editando, setEditando] = useState(false);
  const [aulas, setAulas] = useState<Aula[]>(grade.aulas);
  const [passado, setPassado] = useState<Aula[][]>([]); // pro desfazer
  const [versao, setVersao] = useState(0); // sobe a cada mudanca, so cresce
  const [verificacao, setVerificacao] = useState<Verificacao | null>(null);
  const [selecao, setSelecao] = useState<Selecao | null>(null);
  const [destinos, setDestinos] = useState<Destinos | null>(null);
  const [alvo, setAlvo] = useState<string | null>(null); // horario com o mouse em cima
  const [analise, setAnalise] = useState<Analise | null>(null);
  const [analisando, setAnalisando] = useState<number | null>(null); // versao q a IA ta olhando
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const vivo = useRef(true);
  const pedidoDestinos = useRef(0);
  const indicesMovidos = useMemo(() => aulasMovidas(grade.aulas, aulas), [grade.aulas, aulas]);
  const movidas = indicesMovidos.size;

  useEffect(() => {
    vivo.current = true;
    return () => { vivo.current = false; };
  }, []);

  // confere a grade a cada mudanca
  useEffect(() => {
    if (!editando) return;
    let atual = true;
    api.post<Verificacao>(`/grades/${grade.id}/verificar`, { aulas })
      .then(({ data }) => { if (atual) { setVerificacao(data); setErro(""); } })
      .catch((err) => { if (atual) setErro(mensagemErro(err)); });
    return () => { atual = false; };
  }, [editando, aulas, grade.id]);

  // pede a opiniao da IA qnd o coordenador para de mexer (e nao tem outra analise rodando)
  useEffect(() => {
    if (!editando || !movidas || selecao || analisando !== null || analise?.versao === versao) return;
    const v = versao;
    const snapshot = aulas;
    const timer = setTimeout(() => void analisar(v, snapshot), ESPERA_ANALISE_MS);
    return () => clearTimeout(timer);
  }, [editando, movidas, selecao, analisando, analise?.versao, versao, aulas]); // eslint-disable-line react-hooks/exhaustive-deps

  async function analisar(v: number, snapshot: Aula[]) {
    setAnalisando(v);
    const resultado = await esperarAnalise(grade.id, snapshot).then(
      (r): Analise => ({ versao: v, resultado: r }),
      (err): Analise => ({ versao: v, erro: err instanceof Error && !axios.isAxiosError(err) ? err.message : mensagemErro(err) }),
    );
    if (!vivo.current) return;
    setAnalise(resultado);
    setAnalisando(null);
  }

  function pegar(indice: number, agrupar: Agrupar, arrastando: boolean) {
    setSelecao({ indice, agrupar, arrastando });
    setAlvo(null);
    setDestinos(null);
    const pedido = ++pedidoDestinos.current;
    api.post<{ conflitosAtuais: number; destinos: Destino[] }>(`/grades/${grade.id}/destinos`, { aulas, indice, agrupar })
      .then(({ data }) => {
        if (pedido !== pedidoDestinos.current) return;
        setDestinos({ conflitosAtuais: data.conflitosAtuais, porSlot: Object.fromEntries(data.destinos.map((d) => [chaveSlot(d.dia, d.ordem), d])) });
      })
      .catch(() => { /* fica sem as cores de dica, mas da pra soltar igual */ });
  }

  function cancelarSelecao() {
    pedidoDestinos.current++;
    setSelecao(null);
    setDestinos(null);
    setAlvo(null);
  }

  function aplicar(novas: Aula[]) {
    if (novas === aulas) return;
    setPassado((p) => [...p, aulas]);
    setAulas(novas);
    setVersao((v) => v + 1);
  }

  function soltar(dia: number, ordem: number) {
    if (selecao) aplicar(moverAula(aulas, selecao.indice, dia, ordem, selecao.agrupar));
    cancelarSelecao();
  }

  function clicarAula(indice: number, agrupar: Agrupar) {
    if (!selecao) return pegar(indice, agrupar, false);
    if (selecao.indice === indice) return cancelarSelecao();
    soltar(aulas[indice].dia, aulas[indice].ordem); // clicou em outra aula: troca as duas
  }

  function desfazer() {
    const anterior = passado[passado.length - 1];
    if (!anterior) return;
    setPassado((p) => p.slice(0, -1));
    setAulas(anterior);
    setVersao((v) => v + 1);
    cancelarSelecao();
  }

  function reiniciar() {
    cancelarSelecao();
    setAulas(grade.aulas);
    setPassado([]);
    setVerificacao(null);
    setAnalise(null);
    setErro("");
    setVersao((v) => v + 1);
  }

  function entrar() {
    reiniciar();
    setEditando(true);
  }

  function sair() {
    reiniciar();
    setEditando(false);
  }

  async function salvar() {
    setSalvando(true);
    setErro("");
    try {
      // so manda o resumo da IA se ele for dessa versao da grade
      const resumoIA = analise?.versao === versao ? analise.resultado?.resumo : undefined;
      const { data } = await api.post<{ id: number }>(`/grades/${grade.id}/versoes`, { aulas, resumoIA });
      const { data: nova } = await api.get<GradeDetalhe>(`/grades/${data.id}`);
      if (!vivo.current) return;
      setEditando(false);
      onSalva(nova);
    } catch (err) {
      if (vivo.current) setErro(mensagemErro(err));
    } finally {
      if (vivo.current) setSalvando(false);
    }
  }

  // trocou a grade (ex.: versao nova vinda do chat): a edicao comeca do zero
  const gradeId = useRef(grade.id);
  useEffect(() => {
    if (gradeId.current === grade.id) return;
    gradeId.current = grade.id;
    sair();
  }, [grade.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Esc larga a aula, Ctrl+Z desfaz
  const atalhos = useRef({ desfazer, cancelarSelecao });
  atalhos.current = { desfazer, cancelarSelecao };
  useEffect(() => {
    if (!editando) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest("input, textarea, select")) return;
      if (e.key === "Escape") atalhos.current.cancelarSelecao();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        atalhos.current.desfazer();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editando]);

  /* ---------- o q os quadros da grade usam ---------- */

  /** props do card de uma aula: arrastar, clicar e teclado */
  function propsAula(indice: number, agrupar: Agrupar) {
    if (!editando) return {};
    return {
      draggable: true,
      role: "button",
      tabIndex: 0,
      "aria-pressed": selecao?.indice === indice,
      onDragStart: (e: DragEvent<HTMLElement>) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(indice));
        // mexer no estado dentro do dragstart pode cancelar o arrasto no Chrome, entao deixa pro proximo tick
        setTimeout(() => pegar(indice, agrupar, true), 0);
      },
      onDragEnd: () => cancelarSelecao(),
      onClick: (e: MouseEvent) => {
        e.stopPropagation();
        clicarAula(indice, agrupar);
      },
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        clicarAula(indice, agrupar);
      },
    };
  }

  /** props da celula (horario): onde a aula pode ser solta */
  function propsCelula(dia: number, ordem: number) {
    if (!editando) return {};
    const chave = chaveSlot(dia, ordem);
    const largar = (x: string | null) => (x === chave ? null : x);
    return {
      onDragOver: (e: DragEvent<HTMLElement>) => {
        if (!selecao) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (alvo !== chave) setAlvo(chave);
      },
      onDragLeave: (e: DragEvent<HTMLElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setAlvo(largar);
      },
      onDrop: (e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        soltar(dia, ordem);
      },
      onClick: () => { if (selecao) soltar(dia, ordem); },
      onMouseEnter: () => { if (selecao && !selecao.arrastando) setAlvo(chave); },
      onMouseLeave: () => { if (selecao && !selecao.arrastando) setAlvo(largar); },
    };
  }

  /** verde onde da pra soltar sem conflito novo, vermelho onde cria conflito */
  function classeCelula(dia: number, ordem: number) {
    if (!editando || !selecao) return "";
    const origem = aulas[selecao.indice];
    if (origem.dia === dia && origem.ordem === ordem) return "";
    const sobre = alvo === chaveSlot(dia, ordem);
    const d = destinos?.porSlot[chaveSlot(dia, ordem)];
    if (!d) return sobre ? "ring-2 ring-blue-400" : "";
    if (d.novos.length) return sobre ? "ring-2 ring-red-500 bg-red-100" : "ring-1 ring-red-200 bg-red-50";
    return sobre ? "ring-2 ring-emerald-500 bg-emerald-100" : "ring-1 ring-emerald-300 bg-emerald-50";
  }

  function classeAula(indice: number) {
    if (!editando) return "";
    return [
      "cursor-grab active:cursor-grabbing select-none outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
      verificacao?.porAula[indice] ? "ring-2 ring-red-500" : "",
      selecao?.indice === indice ? "opacity-50 ring-2 ring-blue-500" : "",
    ].join(" ");
  }

  const conflitosDaAula = (indice: number) => (editando ? verificacao?.porAula[indice] ?? [] : []);
  const foiMovida = (indice: number) => editando && indicesMovidos.has(indice);

  return {
    grade, editando, aulas, movidas, versao, verificacao, selecao, destinos, alvo, analise, analisando, salvando, erro,
    podeDesfazer: passado.length > 0,
    entrar, sair, desfazer, salvar, cancelarSelecao,
    propsAula, propsCelula, classeCelula, classeAula, conflitosDaAula, foiMovida,
  };
}

/** pede a analise e fica olhando o job ate a IA responder */
async function esperarAnalise(gradeId: number, aulas: Aula[]): Promise<AnaliseEdicao | undefined> {
  const { data } = await api.post<{ jobId: string }>(`/grades/${gradeId}/analisar`, { aulas });
  for (;;) {
    await new Promise((r) => setTimeout(r, 1500));
    const { data: job } = await api.get<JobGeracao>(`/grades/jobs/${data.jobId}`);
    if (job.status === "concluido") return job.analise;
    if (job.status === "erro") throw new Error(job.erro ?? "Falha na Didáskaros IA.");
  }
}
