import type { GradeCell, DiscColor, NavGroup } from "./types";

export const NEXT_CLASSES = [
  { time: "07:30", disc: "Matemática", prof: "Prof. João Silva · 50 min", sala: "Sala 101", color: "bg-violet-500" },
  { time: "08:20", disc: "Português", prof: "Profa. Maria Santos · 50 min", sala: "Sala 102", color: "bg-pink-500" },
  { time: "09:10", disc: "Física", prof: "Prof. Carlos Oliveira · 50 min", sala: "Lab. Fís", color: "bg-blue-500" },
  { time: "10:10", disc: "História", prof: "Profa. Ana Lima · 50 min", sala: "Sala 103", color: "bg-amber-500" },
  { time: "11:00", disc: "Geografia", prof: "Prof. Roberto Melo · 50 min", sala: "Sala 101", color: "bg-emerald-500" },
];

export const PROFESSORS = [
  { initials: "JS", name: "Prof. João Silva", disc: "Matemática · Ciências", status: "Disponível", dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700", av: "from-violet-500 to-indigo-500" },
  { initials: "MS", name: "Profa. Maria Santos", disc: "Português · Literatura", status: "Disponível", dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700", av: "from-pink-500 to-rose-500" },
  { initials: "CO", name: "Prof. Carlos Oliveira", disc: "Física · Lab. Física", status: "Em aula", dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700", av: "from-emerald-500 to-teal-500" },
  { initials: "AL", name: "Profa. Ana Lima", disc: "História · Sociologia", status: "Disponível", dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700", av: "from-amber-400 to-orange-500" },
  { initials: "RM", name: "Prof. Roberto Melo", disc: "Geografia", status: "Disponível", dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700", av: "from-blue-500 to-cyan-500" },
  { initials: "PF", name: "Profa. Paula Ferreira", disc: "Química · Biologia", status: "Ausente", dot: "bg-gray-300", badge: "bg-gray-100 text-gray-500", av: "from-violet-500 to-pink-500" },
  { initials: "LR", name: "Prof. Lucas Ramos", disc: "Ed. Física", status: "Disponível", dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700", av: "from-teal-500 to-cyan-500" },
  { initials: "FC", name: "Profa. Fernanda Castro", disc: "Inglês · Espanhol", status: "Em aula", dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700", av: "from-orange-400 to-red-500" },
];

export const ACTIVITIES = [
  { color: "bg-blue-500", text: <><strong>Grade 3DS-2025</strong> foi publicada com sucesso — 22 aulas alocadas.</>, time: "Hoje, 08:14" },
  { color: "bg-emerald-500", text: <><strong>Prof. João Silva</strong> atualizou sua disponibilidade semanal.</>, time: "Hoje, 07:40" },
  { color: "bg-amber-500", text: <><strong>Solicitação de troca</strong> enviada por Profa. Maria Santos — aguarda aprovação.</>, time: "Ontem, 17:22" },
  { color: "bg-violet-500", text: <><strong>Nova disciplina</strong> "Ciências de Dados" cadastrada no sistema.</>, time: "Ontem, 14:05" },
  { color: "bg-rose-500", text: <><strong>Conflito resolvido</strong> na grade 2DS — Sala 101 realocada para Quarta.</>, time: "22 Jul, 10:30" },
];

export const GRADE_DATA: Record<string, GradeCell[]> = {
  "07:30": ["Física / Prof. Carlos / S101", "Matemática / Prof. João / S102", "Português / Profa. Maria / S103", "História / Profa. Ana / S102", "Geografia / Prof. Roberto / S101"],
  "08:20": ["Matemática / Prof. João / S101", "Português / Profa. Maria / S102", "Matemática / Prof. João / S101", "Física / Prof. Carlos / Lab", "Português / Profa. Maria / S103"],
  "09:10": [null, "História / Profa. Ana / S102", "Física / Prof. Carlos / Lab", "Matemática / Prof. João / S101", "Ciências / Prof. João / Lab"],
  "10:10": ["Ciências / Prof. João / Lab", "Geografia / Prof. Roberto / S101", "História / Profa. Ana / S103", "Geografia / Prof. Roberto / S102", "Matemática / Prof. João / S101"],
  "11:00": ["Geografia / Prof. Roberto / S101", "Física / Prof. Carlos / Lab", "Ciências / Prof. João / Lab", "Português / Profa. Maria / S102", "História / Profa. Ana / S103"],
};

export const DISC_COLORS: Record<string, DiscColor> = {
  "Física": { cell: "bg-blue-50 border-l-blue-500 text-blue-800", dot: "bg-blue-500" },
  "Matemática": { cell: "bg-violet-50 border-l-violet-500 text-violet-800", dot: "bg-violet-500" },
  "Português": { cell: "bg-pink-50 border-l-pink-500 text-pink-800", dot: "bg-pink-500" },
  "História": { cell: "bg-amber-50 border-l-amber-500 text-amber-800", dot: "bg-amber-500" },
  "Geografia": { cell: "bg-emerald-50 border-l-emerald-500 text-emerald-800", dot: "bg-emerald-500" },
  "Ciências": { cell: "bg-purple-50 border-l-purple-500 text-purple-800", dot: "bg-purple-500" },
};

export function getDiscColor(cellStr: GradeCell): DiscColor | null {
  if (!cellStr) return null;
  const disc = cellStr.split(" / ")[0];
  return DISC_COLORS[disc] || { cell: "bg-gray-50 border-l-gray-400 text-gray-700", dot: "bg-gray-400" };
}

export const OTHER_GRADES = [
  { name: "Grade 2DS — 2025", sub: "Manhã · 20 aulas/sem", badge: "bg-amber-50 text-amber-700", label: "Rascunho" },
  { name: "Grade 1DS — 2025", sub: "Tarde · 18 aulas/sem", badge: "bg-emerald-50 text-emerald-700", label: "Publicada" },
  { name: "Grade 3INFO — 2025", sub: "Noite · 16 aulas/sem", badge: "bg-gray-100 text-gray-500", label: "Arquivada" },
];

export const TURMAS = [
  { id: "3ds", nome: "3DS — Desenvolvimento de Sistemas" },
  { id: "2ds", nome: "2DS — Desenvolvimento de Sistemas" },
  { id: "1ds", nome: "1DS — Desenvolvimento de Sistemas" },
  { id: "3info", nome: "3INFO — Informática" },
];

export const CONSTRAINTS = [
  { id: "evitar-janelas", label: "Evitar janelas na grade", desc: "Não deixar horários vagos entre aulas de um mesmo dia" },
  { id: "priorizar-preferencias", label: "Priorizar preferências dos professores", desc: "Respeitar horários preferidos informados pelo docente" },
  { id: "agrupar-disciplina", label: "Agrupar aulas da mesma disciplina", desc: "Evitar intercalar disciplinas diferentes no mesmo dia" },
  { id: "limitar-carga-diaria", label: "Limitar carga diária por professor", desc: "No máximo 2 disciplinas distintas por professor ao dia" },
  { id: "priorizar-salas-fixas", label: "Priorizar salas fixas por turma", desc: "Manter a turma na mesma sala sempre que possível" },
  { id: "evitar-ultimo-horario", label: "Evitar disciplinas teóricas no último horário", desc: "Reservar o fim do turno para aulas práticas" },
];

export const NAV: NavGroup[] = [
  { section: "GERAL", items: [{ label: "Painel Principal", icon: "Grid", screen: "painel" }] },
  {
    section: "PLANEJAMENTO",
    items: [
      { label: "Grades Horárias", icon: "Calendar", screen: "planejamento" },
      { label: "Gerar Grade", icon: "Sparkles", screen: "gerar-grade" },
      { label: "Equipe Docente", icon: "Users", screen: null },
      { label: "Classes", icon: null, screen: null },
      { label: "Disciplinas", icon: null, screen: null },
      { label: "Salas", icon: null, screen: null },
    ],
  },
  {
    section: "COMUNICAÇÃO",
    items: [
      { label: "Postar Avisos", icon: "Bell", screen: null },
      { label: "Aprovações", icon: null, screen: null, badge: "3" },
    ],
  },
];
