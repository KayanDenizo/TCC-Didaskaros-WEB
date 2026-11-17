import { useSyncExternalStore } from "react";
import axios from "axios";
import { api, mensagemErro } from "../api/client";
import type { GradeDetalhe, JobGeracao, Turno } from "../api/types";

/* Estado da geracao de grade fica aqui, fora dos componentes, pra continuar
 * rodando (e acompanhando o job) mesmo qnd o usuario troca de pagina.
 * Qnd ele volta, a pagina le o q esta guardado aqui. */

export interface ParamsGeracao { turno: Turno; ano: number; semestre: number; aulasPorDia: number; preferencias: string[] }

export interface EstadoGeracao {
  /** tem geracao em andamento, com erro ou com resultado guardado */
  ativa: boolean;
  job: JobGeracao | null;
  grade: GradeDetalhe | null;
  erro: { mensagem: string; problemas?: string[] } | null;
  inicio: number;
  estimativa: number;
  aulasPorDia: number;
  turmas: number;
  /** o usuario ja viu o resultado (ou o erro)? usado pro aviso na sidebar */
  visto: boolean;
}

const VAZIO: EstadoGeracao = { ativa: false, job: null, grade: null, erro: null, inicio: 0, estimativa: 60, aulasPorDia: 5, turmas: 0, visto: true };

let estado: EstadoGeracao = VAZIO;
let token = 0; // cada geracao nova invalida o acompanhamento da anterior
let restaurada = false;
const ouvintes = new Set<() => void>();

/* ---------------- persistencia ----------------
 * guarda o minimo no sessionStorage pra sobreviver a um F5 (o job em si
 * continua no backend, entao da pra retomar pelo id) */
const CHAVE_ESTADO = "didaskaros.geracao";

interface Salvo {
  jobId?: string; gradeId?: number; erro?: EstadoGeracao["erro"];
  inicio: number; estimativa: number; aulasPorDia: number; turmas: number; visto: boolean;
}

function salvar() {
  try {
    if (!estado.ativa) { sessionStorage.removeItem(CHAVE_ESTADO); return; }
    const salvo: Salvo = {
      jobId: estado.job?.id || undefined,
      gradeId: estado.grade?.id ?? estado.job?.gradeId,
      erro: estado.erro,
      inicio: estado.inicio, estimativa: estado.estimativa, aulasPorDia: estado.aulasPorDia, turmas: estado.turmas, visto: estado.visto,
    };
    sessionStorage.setItem(CHAVE_ESTADO, JSON.stringify(salvo));
  } catch { /* sem sessionStorage: so nao sobrevive ao F5 */ }
}

function definir(parcial: Partial<EstadoGeracao>) {
  estado = { ...estado, ...parcial };
  salvar();
  ouvintes.forEach((l) => l());
}

export function useGeracao(): EstadoGeracao {
  return useSyncExternalStore(
    (cb) => { ouvintes.add(cb); return () => { ouvintes.delete(cb); }; },
    () => estado,
  );
}

export type StatusGeracao = "gerando" | "pronta" | "erro" | null;

/** resumo pra mostrar na sidebar */
export function statusDe(e: EstadoGeracao): StatusGeracao {
  if (!e.ativa) return null;
  if (e.erro) return e.visto ? null : "erro";
  if (e.grade) return e.visto ? null : "pronta";
  return "gerando";
}

export function marcarVisto() {
  if (!estado.visto) definir({ visto: true });
}

/* ---------------- estimativa de tempo ----------------
 * comeca com um chute por turma e vai aprendendo com as geracoes anteriores
 * (segundos por turma, fica salvo no navegador) */
const CHAVE_DURACAO = "didaskaros.segundosPorTurma";

export function segundosPorTurma(): number {
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

/* ---------------- acoes ---------------- */
function acompanhar(meu: number) {
  const tick = async () => {
    const atual = estado.job;
    if (meu !== token || atual?.status !== "executando") return;
    try {
      const { data } = await api.get<JobGeracao>(`/grades/jobs/${atual.id}`);
      if (meu !== token) return;
      if (data.status === "concluido") {
        const { data: nova } = await api.get<GradeDetalhe>(`/grades/${data.gradeId}`);
        if (meu !== token) return;
        registrarDuracao((Date.now() - estado.inicio) / 1000, estado.turmas);
        definir({ job: data });
        // deixa a barra chegar em 100% antes de mostrar a grade
        setTimeout(() => { if (meu === token) definir({ grade: nova, visto: false }); }, 900);
        return;
      }
      if (data.status === "erro") {
        definir({ job: data, erro: { mensagem: data.erro ?? "Falha na geração." }, visto: false });
        return;
      }
      definir({ job: data });
      setTimeout(tick, 2000);
    } catch (err) {
      if (meu === token) definir({ erro: { mensagem: mensagemErro(err) }, job: null, visto: false });
    }
  };
  setTimeout(tick, 2000);
}

export async function iniciarGeracao(params: ParamsGeracao, turmas: number, estimativa: number) {
  const meu = ++token;
  restaurada = true;
  estado = { ...VAZIO, ativa: true, visto: false, inicio: Date.now(), estimativa, aulasPorDia: params.aulasPorDia, turmas };
  salvar();
  ouvintes.forEach((l) => l());
  try {
    const { data } = await api.post<{ jobId: string }>("/grades/gerar", params);
    if (meu !== token) return;
    definir({ job: { id: data.jobId, status: "executando", etapa: "Preparando dados", tentativa: 0, segundos: 0 } });
    acompanhar(meu);
  } catch (err) {
    if (meu !== token) return;
    const problemas = axios.isAxiosError(err) ? err.response?.data?.problemas : undefined;
    definir({ erro: { mensagem: mensagemErro(err), problemas }, visto: false });
  }
}

/** chamado uma vez com o usuario logado: retoma a geracao q estava guardada (ex.: depois de um F5) */
export async function restaurarGeracao() {
  if (restaurada || estado.ativa) return;
  restaurada = true;
  let salvo: Salvo | null = null;
  try { salvo = JSON.parse(sessionStorage.getItem(CHAVE_ESTADO) ?? "null"); } catch { /* ignora */ }
  if (!salvo) return;

  const meu = ++token;
  const base = { ativa: true, inicio: salvo.inicio, estimativa: salvo.estimativa, aulasPorDia: salvo.aulasPorDia, turmas: salvo.turmas, visto: salvo.visto };
  if (salvo.gradeId) {
    try {
      const { data } = await api.get<GradeDetalhe>(`/grades/${salvo.gradeId}`);
      if (meu === token) definir({ ...base, grade: data, job: { id: salvo.jobId ?? "", status: "concluido", etapa: "Concluído", tentativa: 0, segundos: 0, gradeId: data.id } });
    } catch {
      // grade apagada ou de outro usuario: esquece
      if (meu === token) { estado = VAZIO; salvar(); }
    }
  } else if (salvo.erro) {
    definir({ ...base, erro: salvo.erro });
  } else if (salvo.jobId) {
    definir({ ...base, job: { id: salvo.jobId, status: "executando", etapa: "Preparando dados", tentativa: 0, segundos: 0 } });
    acompanhar(meu);
  }
}

export function atualizarGrade(grade: GradeDetalhe) {
  definir({ grade });
}

export function mostrarErro(mensagem: string) {
  definir({ erro: { mensagem }, visto: false });
}
