import type { StatusGrade, Turno } from "../api/types";

export const TURNOS: Turno[] = ["MANHA", "TARDE", "NOITE"];
export const TURNO_LABEL: Record<Turno, string> = { MANHA: "Manhã", TARDE: "Tarde", NOITE: "Noite" };
export const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
export const DIAS_CURTOS = ["Seg", "Ter", "Qua", "Qui", "Sex"];

export const STATUS_LABEL: Record<StatusGrade, string> = { RASCUNHO: "Rascunho", PUBLICADA: "Publicada", ARQUIVADA: "Arquivada" };

export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

export function dataLonga(d = new Date()) {
  const s = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return s[0].toUpperCase() + s.slice(1);
}

export function dataCurta(iso: string) {
  return new Date(iso.replace(" ", "T")).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function nomeGrade(g: { turno: Turno; ano: number; semestre: number }) {
  return `${TURNO_LABEL[g.turno]} · ${g.semestre}º sem. ${g.ano}`;
}
