import { useState, type ReactNode } from "react";

// -- ícones simples inline para não precisar de dependência --
const Icons = {
  Grid: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={2} />
      <line x1="16" y1="2" x2="16" y2="6" strokeWidth={2} />
      <line x1="8" y1="2" x2="8" y2="6" strokeWidth={2} />
      <line x1="3" y1="10" x2="21" y2="10" strokeWidth={2} />
    </svg>
  ),
  Users: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  Bell: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  Search: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polyline points="15 18 9 12 15 6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polyline points="9 18 15 12 9 6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" strokeWidth={2} strokeLinecap="round" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth={2} strokeLinecap="round" />
    </svg>
  ),
  Sparkles: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l1.5 4.5L11 9l-4.5 1.5L5 15l-1.5-4.5L-1 9l4.5-1.5L5 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
    </svg>
  ),
  Download: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="15" x2="12" y2="3" strokeWidth={2} strokeLinecap="round" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  LogOut: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <line x1="21" y1="12" x2="9" y2="12" strokeWidth={2} strokeLinecap="round" />
    </svg>
  ),
};

type Screen = "painel" | "planejamento";
type IconName = keyof typeof Icons;
type SetScreen = (screen: Screen) => void;
type ProfessorFilter = "todos" | "disponivel" | "ausente";

// ── DADOS ──────────────────────────────────────────────────────────
const NEXT_CLASSES = [
  { time: "07:30", disc: "Matemática", prof: "Prof. João Silva · 50 min", sala: "Sala 101", color: "bg-violet-500" },
  { time: "08:20", disc: "Português",  prof: "Profa. Maria Santos · 50 min", sala: "Sala 102", color: "bg-pink-500" },
  { time: "09:10", disc: "Física",     prof: "Prof. Carlos Oliveira · 50 min", sala: "Lab. Fís", color: "bg-blue-500" },
  { time: "10:10", disc: "História",   prof: "Profa. Ana Lima · 50 min", sala: "Sala 103", color: "bg-amber-500" },
  { time: "11:00", disc: "Geografia",  prof: "Prof. Roberto Melo · 50 min", sala: "Sala 101", color: "bg-emerald-500" },
];

const PROFESSORS = [
  { initials: "JS", name: "Prof. João Silva",     disc: "Matemática · Ciências",  status: "Disponível", dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700",  av: "from-violet-500 to-indigo-500" },
  { initials: "MS", name: "Profa. Maria Santos",  disc: "Português · Literatura", status: "Disponível", dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700",  av: "from-pink-500 to-rose-500" },
  { initials: "CO", name: "Prof. Carlos Oliveira",disc: "Física · Lab. Física",   status: "Em aula",    dot: "bg-amber-400",   badge: "bg-amber-50 text-amber-700",    av: "from-emerald-500 to-teal-500" },
  { initials: "AL", name: "Profa. Ana Lima",      disc: "História · Sociologia",  status: "Disponível", dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700",  av: "from-amber-400 to-orange-500" },
  { initials: "RM", name: "Prof. Roberto Melo",   disc: "Geografia",              status: "Disponível", dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700",  av: "from-blue-500 to-cyan-500" },
  { initials: "PF", name: "Profa. Paula Ferreira",disc: "Química · Biologia",     status: "Ausente",    dot: "bg-gray-300",    badge: "bg-gray-100 text-gray-500",     av: "from-violet-500 to-pink-500" },
  { initials: "LR", name: "Prof. Lucas Ramos",    disc: "Ed. Física",             status: "Disponível", dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700",  av: "from-teal-500 to-cyan-500" },
  { initials: "FC", name: "Profa. Fernanda Castro",disc:"Inglês · Espanhol",      status: "Em aula",    dot: "bg-amber-400",   badge: "bg-amber-50 text-amber-700",    av: "from-orange-400 to-red-500" },
];

const ACTIVITIES = [
  { color: "bg-blue-500",    text: <><strong>Grade 3DS-2025</strong> foi publicada com sucesso — 22 aulas alocadas.</>,   time: "Hoje, 08:14" },
  { color: "bg-emerald-500", text: <><strong>Prof. João Silva</strong> atualizou sua disponibilidade semanal.</>,          time: "Hoje, 07:40" },
  { color: "bg-amber-500",   text: <><strong>Solicitação de troca</strong> enviada por Profa. Maria Santos — aguarda aprovação.</>, time: "Ontem, 17:22" },
  { color: "bg-violet-500",  text: <><strong>Nova disciplina</strong> "Ciências de Dados" cadastrada no sistema.</>,       time: "Ontem, 14:05" },
  { color: "bg-rose-500",    text: <><strong>Conflito resolvido</strong> na grade 2DS — Sala 101 realocada para Quarta.</>,time: "22 Jul, 10:30" },
];

type GradeCell = string | null;
type DiscColor = { cell: string; dot: string };

const GRADE_DATA: Record<string, GradeCell[]> = {
  "07:30": ["Física / Prof. Carlos / S101",    "Matemática / Prof. João / S102",   "Português / Profa. Maria / S103",  "História / Profa. Ana / S102",     "Geografia / Prof. Roberto / S101"],
  "08:20": ["Matemática / Prof. João / S101",  "Português / Profa. Maria / S102",  "Matemática / Prof. João / S101",   "Física / Prof. Carlos / Lab",      "Português / Profa. Maria / S103"],
  "09:10": [null,                               "História / Profa. Ana / S102",     "Física / Prof. Carlos / Lab",      "Matemática / Prof. João / S101",   "Ciências / Prof. João / Lab"],
  "10:10": ["Ciências / Prof. João / Lab",     "Geografia / Prof. Roberto / S101", "História / Profa. Ana / S103",     "Geografia / Prof. Roberto / S102", "Matemática / Prof. João / S101"],
  "11:00": ["Geografia / Prof. Roberto / S101","Física / Prof. Carlos / Lab",       "Ciências / Prof. João / Lab",      "Português / Profa. Maria / S102",  "História / Profa. Ana / S103"],
};

const DISC_COLORS: Record<string, DiscColor> = {
  "Física":      { cell: "bg-blue-50 border-l-blue-500 text-blue-800",     dot: "bg-blue-500" },
  "Matemática":  { cell: "bg-violet-50 border-l-violet-500 text-violet-800",dot: "bg-violet-500" },
  "Português":   { cell: "bg-pink-50 border-l-pink-500 text-pink-800",     dot: "bg-pink-500" },
  "História":    { cell: "bg-amber-50 border-l-amber-500 text-amber-800",  dot: "bg-amber-500" },
  "Geografia":   { cell: "bg-emerald-50 border-l-emerald-500 text-emerald-800", dot: "bg-emerald-500" },
  "Ciências":    { cell: "bg-purple-50 border-l-purple-500 text-purple-800",dot: "bg-purple-500" },
};

function getDiscColor(cellStr: GradeCell): DiscColor | null {
  if (!cellStr) return null;
  const disc = cellStr.split(" / ")[0];
  return DISC_COLORS[disc] || { cell: "bg-gray-50 border-l-gray-400 text-gray-700", dot: "bg-gray-400" };
}

const OTHER_GRADES = [
  { name: "Grade 2DS — 2025", sub: "Manhã · 20 aulas/sem", badge: "bg-amber-50 text-amber-700", label: "Rascunho" },
  { name: "Grade 1DS — 2025", sub: "Tarde · 18 aulas/sem",  badge: "bg-emerald-50 text-emerald-700", label: "Publicada" },
  { name: "Grade 3INFO — 2025", sub: "Noite · 16 aulas/sem", badge: "bg-gray-100 text-gray-500", label: "Arquivada" },
];

// ── NAV ITEMS ──────────────────────────────────────────────────────
const NAV: { section: string; items: { label: string; icon: IconName | null; screen: Screen | null; badge?: string }[] }[] = [
  { section: "GERAL", items: [{ label: "Painel Principal", icon: "Grid", screen: "painel" }] },
  {
    section: "PLANEJAMENTO",
    items: [
      { label: "Grades Horárias", icon: "Calendar", screen: "planejamento" },
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

// ══════════════════════════════════════════════════════════════════
// COMPONENTES
// ══════════════════════════════════════════════════════════════════

function Sidebar({ active, setScreen }: { active: Screen; setScreen: SetScreen }) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 flex flex-col z-50"
      style={{ background: "linear-gradient(180deg, #0F2456 0%, #1B3A7A 100%)" }}>

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-black text-sm">D</div>
          <span className="text-white font-extrabold text-sm tracking-tight">DIDÁSKAROS</span>
        </div>
      </div>

      {/* Usuário */}
      <div className="px-4 py-3.5 flex items-center gap-2.5 border-b border-white/10 bg-white/5">
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">MC</div>
        <div>
          <p className="text-white text-xs font-semibold leading-tight">Maria Costa</p>
          <p className="text-white/50 text-[10px] leading-tight">Coordenadora · ETEC Uirapuru</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="text-[9px] font-bold tracking-[1.2px] text-white/35 uppercase px-5 pt-4 pb-1.5">{group.section}</p>
            {group.items.map((item) => {
              const isActive = active === item.screen;
              const IconEl = item.icon ? Icons[item.icon] : null;
              return (
                <button
                  key={item.label}
                  onClick={() => item.screen && setScreen(item.screen)}
                  className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-[13px] transition-all relative text-left
                    ${isActive
                      ? "text-white font-semibold bg-blue-600/20"
                      : "text-white/60 hover:text-white hover:bg-white/7 font-normal"
                    }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r bg-blue-400" />
                  )}
                  {IconEl && <span className={isActive ? "text-blue-300" : "text-white/40"}><IconEl /></span>}
                  {!IconEl && <span className={`w-1 h-1 rounded-full ${isActive ? "bg-blue-400" : "bg-white/25"}`} />}
                  {item.label}
                  {item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 py-2">
        <button className="w-full flex items-center gap-2.5 px-5 py-2.5 text-[13px] text-white/50 hover:text-white transition-colors">
          <Icons.Settings /><span>Configurações</span>
        </button>
        <button className="w-full flex items-center gap-2.5 px-5 py-2.5 text-[13px] text-white/50 hover:text-white transition-colors">
          <Icons.LogOut /><span>Sair</span>
        </button>
      </div>
    </aside>
  );
}

function Topbar({ title, breadcrumb }: { title: string; breadcrumb: string }) {
  return (
    <header className="h-[60px] bg-white border-b border-gray-200 flex items-center px-6 gap-4 sticky top-0 z-40 shadow-sm">
      <div>
        <p className="text-[15px] font-bold text-gray-900 leading-tight">{title}</p>
        <p className="text-[11px] text-gray-400">{breadcrumb}</p>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Icons.Search /></span>
          <input
            className="bg-gray-100 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-[13px] text-gray-700 placeholder-gray-400 outline-none focus:border-blue-400 focus:bg-white w-56 transition-all"
            placeholder="Buscar professores, turmas..."
          />
        </div>
        <span className="text-[12px] text-gray-400 font-medium">Ter, 21 Jul 2026</span>
        <button className="relative w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
          <Icons.Bell />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
        </button>
        <button className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-xs font-bold">MC</button>
      </div>
    </header>
  );
}

function StatCard({
  label, value, trend, trendColor, sub, emoji, iconBg,
}: {
  label: string;
  value: string;
  trend: string;
  trendColor: string;
  sub: string;
  emoji: ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-lg mb-3`}>{emoji}</div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-extrabold text-gray-900 tracking-tight leading-none">{value}</p>
      <div className="flex items-center gap-1.5 mt-2">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${trendColor}`}>{trend}</span>
        <span className="text-[10px] text-gray-400">{sub}</span>
      </div>
    </div>
  );
}

function ProfList({ filter }: { filter: ProfessorFilter }) {
  const filtered = filter === "todos"
    ? PROFESSORS
    : filter === "disponivel"
    ? PROFESSORS.filter(p => p.status === "Disponível")
    : PROFESSORS.filter(p => p.status === "Ausente");

  return (
    <div className="divide-y divide-gray-50">
      {filtered.map((p) => (
        <div key={p.name} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="relative shrink-0">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${p.av} flex items-center justify-center text-white text-xs font-bold`}>
              {p.initials}
            </div>
            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${p.dot} rounded-full border-2 border-white`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-800 truncate">{p.name}</p>
            <p className="text-[11px] text-gray-400 truncate">{p.disc}</p>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${p.badge}`}>{p.status}</span>
        </div>
      ))}
    </div>
  );
}

// ── TELA PAINEL PRINCIPAL ─────────────────────────────────────────
function PainelPrincipal({ setScreen }: { setScreen: SetScreen }) {
  const [profFilter, setProfFilter] = useState<ProfessorFilter>("todos");
  const filterTabs: ProfessorFilter[] = ["todos", "disponivel", "ausente"];
  const filterLabels: Record<ProfessorFilter, string> = { todos: "Todos (24)", disponivel: "Disponíveis (18)", ausente: "Ausentes (6)" };

  return (
    <main className="flex-1 ml-60">
      <Topbar title="Painel Principal" breadcrumb="Didáskaros › Painel Principal" />
      <div className="p-7">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-extrabold text-gray-900 tracking-tight">Painel Principal</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Bem-vinda, Maria! Aqui está o resumo do dia — Terça-feira, 21 de julho de 2026.</p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => setScreen("planejamento")} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-[13px] font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-all">
              <Icons.Calendar /> Ver Grades
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #1E4DA1, #2563EB)", boxShadow: "0 2px 12px rgba(37,99,235,0.3)" }}>
              ✨ Gerar Grade
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label="Total de Professores" value="24" trend="↑ 2 novos" trendColor="bg-blue-50 text-blue-700" sub="este mês" emoji="👨‍🏫" iconBg="bg-blue-50" />
          <StatCard label="Disponíveis Hoje" value="18" trend="6 ausentes" trendColor="bg-amber-50 text-amber-700" sub="hoje" emoji="✅" iconBg="bg-emerald-50" />
          <StatCard label="Grades Geradas" value="7" trend="3 publicadas" trendColor="bg-emerald-50 text-emerald-700" sub="· 4 rascunhos" emoji="📋" iconBg="bg-amber-50" />
          <StatCard label="Conflitos Pendentes" value="2" trend="Atenção" trendColor="bg-amber-50 text-amber-700" sub="necessária" emoji="⚠️" iconBg="bg-violet-50" />
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-[1fr_300px] gap-5">

          {/* COLUNA ESQUERDA */}
          <div className="flex flex-col gap-5">

            {/* Próximas Aulas */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-start justify-between border-b border-gray-100">
                <div>
                  <p className="text-[14px] font-bold text-gray-900">Próximas Aulas — Hoje</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Turma 3DS · Turno Manhã</p>
                </div>
                <button onClick={() => setScreen("planejamento")} className="text-[12px] font-semibold text-blue-600 hover:underline">
                  Ver grade completa →
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {NEXT_CLASSES.map((a) => (
                  <div key={a.time} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
                    <span className="text-[12px] font-bold text-blue-700 w-10 tabular-nums shrink-0">{a.time}</span>
                    <span className={`w-[3px] h-9 rounded-full ${a.color} shrink-0`} />
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-gray-900">{a.disc}</p>
                      <p className="text-[11px] text-gray-400">{a.prof}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg shrink-0">{a.sala}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conflitos */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
                <div>
                  <p className="text-[14px] font-bold text-gray-900">Conflitos e Alertas</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Requerem sua atenção</p>
                </div>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">2 pendentes</span>
              </div>

              <div className="divide-y divide-gray-50">
                <div className="flex items-start gap-3 px-5 py-4">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shrink-0 mt-0.5"><Icons.AlertTriangle /></div>
                  <div className="flex-1">
                    <p className="text-[13px] text-gray-700 leading-snug"><strong className="text-gray-900">Prof. Carlos Oliveira</strong> alocado em duas turmas simultaneamente na Quinta-feira, 09h10.</p>
                    <p className="text-[11px] text-gray-400 mt-1">Detectado há 2 horas · Grade 3DS-2025</p>
                  </div>
                  <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-1 rounded-full shrink-0">Crítico</span>
                </div>
                <div className="flex items-start gap-3 px-5 py-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">🔔</div>
                  <div className="flex-1">
                    <p className="text-[13px] text-gray-700 leading-snug"><strong className="text-gray-900">Sala 102</strong> com capacidade excedida — 38 alunos vs. 35 lugares.</p>
                    <p className="text-[11px] text-gray-400 mt-1">Detectado ontem · Turma 2DS</p>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded-full shrink-0">Aviso</span>
                </div>
              </div>

              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                <button className="text-[12px] font-semibold text-gray-600 border border-gray-200 bg-white px-3 py-1.5 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-all">
                  Ver todos os conflitos
                </button>
              </div>
            </div>

            {/* Atividades */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
                <p className="text-[14px] font-bold text-gray-900">Atividades Recentes</p>
                <button className="text-[12px] font-semibold text-blue-600 hover:underline">Ver histórico</button>
              </div>
              <div className="divide-y divide-gray-50">
                {ACTIVITIES.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                    <span className={`w-2 h-2 rounded-full ${a.color} shrink-0 mt-1.5`} />
                    <div>
                      <p className="text-[13px] text-gray-700 leading-snug [&_strong]:text-gray-900 [&_strong]:font-semibold">{a.text}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>{/* /col esquerda */}

          {/* COLUNA DIREITA — PROFESSORES */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-4">
              <div className="px-4 py-4 border-b border-gray-100 flex items-start justify-between">
                <div>
                  <p className="text-[14px] font-bold text-gray-900">Professores Disponíveis</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Status em tempo real — hoje</p>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ao vivo
                </span>
              </div>

              {/* filter tabs */}
              <div className="flex gap-1.5 px-3 py-2.5 border-b border-gray-100">
                {filterTabs.map((f) => (
                  <button
                    key={f}
                    onClick={() => setProfFilter(f)}
                    className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all
                      ${profFilter === f
                        ? "bg-blue-700 text-white"
                        : "text-gray-500 hover:bg-gray-100"
                      }`}
                  >
                    {filterLabels[f].split(" ")[0]}
                    <br />
                    <span className="font-normal opacity-80">{filterLabels[f].split(" ")[1]}</span>
                  </button>
                ))}
              </div>

              <div className="max-h-[420px] overflow-y-auto">
                <ProfList filter={profFilter} />
              </div>

              <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
                <p className="text-[12px] text-blue-700 font-medium">
                  📊 <strong>18 disponíveis</strong> · <strong>4 em aula</strong> · <strong>2 ausentes</strong>
                </p>
              </div>
            </div>
          </div>

        </div>{/* /grid */}
      </div>
    </main>
  );
}

// ── TELA PLANEJAMENTO ─────────────────────────────────────────────
function Planejamento() {
  const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
  const times = Object.keys(GRADE_DATA);
  const [viewMode, setViewMode] = useState<"turma" | "professor" | "sala">("turma");

  return (
    <main className="flex-1 ml-60">
      <Topbar title="Grades Horárias" breadcrumb="Didáskaros › Planejamento › Grades Horárias" />
      <div className="p-7">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-extrabold text-gray-900 tracking-tight">Grades Horárias</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Visualize e gerencie os horários das turmas — 2º Semestre 2026</p>
          </div>
          <div className="flex gap-2.5">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-[13px] font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-all">
              <Icons.Download /> Exportar PDF
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-all"
              style={{ background: "linear-gradient(135deg, #1E4DA1, #2563EB)", boxShadow: "0 2px 12px rgba(37,99,235,0.3)" }}>
              ✨ Gerar Nova Grade
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_280px] gap-5">

          {/* GRADE */}
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

              {/* Card header */}
              <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
                <div>
                  <p className="text-[14px] font-bold text-gray-900">Grade Horária — 3DS (2025)</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Turno Manhã · 22 aulas semanais</p>
                </div>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">✓ Publicada</span>
              </div>

              {/* Filters */}
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
                {/* view mode tabs */}
                <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                  {(["turma", "professor", "sala"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setViewMode(m)}
                      className={`px-3.5 py-1.5 text-[12px] font-semibold transition-all capitalize
                        ${viewMode === m ? "bg-blue-700 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                    >
                      {m === "turma" ? "Por Turma" : m === "professor" ? "Por Professor" : "Por Sala"}
                    </button>
                  ))}
                </div>

                <select className="px-3 py-1.5 border border-gray-200 rounded-xl text-[12px] text-gray-700 bg-white outline-none focus:border-blue-400">
                  <option>Turma: 3DS</option>
                  <option>Turma: 2DS</option>
                  <option>Turma: 1DS</option>
                </select>

                <div className="ml-auto flex items-center gap-2">
                  <button className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-all">
                    <Icons.ChevronLeft />
                  </button>
                  <span className="text-[12px] font-semibold text-gray-700">21–25 Jul 2026</span>
                  <button className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-all">
                    <Icons.ChevronRight />
                  </button>
                </div>
              </div>

              {/* Grade table */}
              <div className="overflow-x-auto px-4 py-4">
                <table className="w-full border-separate border-spacing-1 min-w-[560px]">
                  <thead>
                    <tr>
                      <th className="w-16 text-right pr-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide pb-2">Horário</th>
                      {days.map(d => (
                        <th key={d} className="text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide pb-2">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {times.map((time) => (
                      <tr key={time}>
                        <td className="text-right pr-2 text-[11px] font-bold text-gray-400 tabular-nums pt-1.5 align-top">{time}</td>
                        {GRADE_DATA[time].map((cell, ci) => {
                          if (!cell) {
                            return (
                              <td key={ci} className="p-0.5">
                                <div className="h-[52px] rounded-lg bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
                                  <span className="text-[10px] text-gray-300">—</span>
                                </div>
                              </td>
                            );
                          }
                          const style = getDiscColor(cell) ?? { cell: "bg-gray-50 border-l-gray-400 text-gray-700", dot: "bg-gray-400" };
                          const [disc, prof, sala] = cell.split(" / ");
                          return (
                            <td key={ci} className="p-0.5">
                              <div className={`rounded-lg px-2.5 py-2 border-l-[3px] cursor-pointer hover:opacity-80 transition-opacity h-[52px] ${style.cell}`}>
                                <p className="text-[11px] font-bold leading-tight">{disc}</p>
                                <p className="text-[10px] opacity-70 mt-0.5 leading-tight">{prof}</p>
                                <p className="text-[10px] opacity-60 mt-0.5 leading-tight">{sala}</p>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-3">
                {Object.entries(DISC_COLORS).map(([disc, { dot }]) => (
                  <div key={disc} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-sm ${dot}`} />
                    <span className="text-[11px] text-gray-600">{disc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumo */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-[14px] font-bold text-gray-900 mb-4">Resumo da Grade — 3DS</p>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { value: "22", label: "Aulas/sem", bg: "bg-blue-50 border-blue-100", valC: "text-blue-700" },
                  { value: "5", label: "Professores", bg: "bg-emerald-50 border-emerald-100", valC: "text-emerald-700" },
                  { value: "6", label: "Disciplinas", bg: "bg-violet-50 border-violet-100", valC: "text-violet-700" },
                  { value: "0", label: "Conflitos", bg: "bg-amber-50 border-amber-100", valC: "text-amber-700" },
                ].map((s) => (
                  <div key={s.label} className={`text-center py-4 px-3 rounded-xl border ${s.bg}`}>
                    <p className={`text-2xl font-extrabold ${s.valC}`}>{s.value}</p>
                    <p className="text-[11px] text-gray-500 mt-1 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SIDEBAR DIREITA */}
          <div className="flex flex-col gap-4">

            {/* Disponibilidade */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-4">
              <div className="px-4 py-4 border-b border-gray-100 flex items-start justify-between">
                <div>
                  <p className="text-[14px] font-bold text-gray-900">Disponibilidade Hoje</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Para esta grade</p>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Ao vivo
                </span>
              </div>

              <div className="divide-y divide-gray-50">
                {PROFESSORS.slice(0, 5).map((p) => (
                  <div key={p.name} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                    <div className="relative shrink-0">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${p.av} flex items-center justify-center text-white text-[10px] font-bold`}>{p.initials}</div>
                      <span className={`absolute bottom-0 right-0 w-2 h-2 ${p.dot} rounded-full border-2 border-white`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-gray-800 truncate">{p.name.replace("Prof. ", "").replace("Profa. ", "")}</p>
                      <p className="text-[10px] text-gray-400 truncate">{p.disc.split(" · ")[0]}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${p.badge}`}>{p.status}</span>
                  </div>
                ))}
              </div>

              {/* Outras grades */}
              <div className="px-4 pt-4 pb-3 border-t border-gray-100">
                <p className="text-[12px] font-bold text-gray-700 mb-2.5">Outras Grades</p>
                <div className="flex flex-col gap-2">
                  {OTHER_GRADES.map((g) => (
                    <div key={g.name} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                      <div>
                        <p className="text-[12px] font-semibold text-gray-800">{g.name}</p>
                        <p className="text-[10px] text-gray-400">{g.sub}</p>
                      </  div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${g.badge}`}>{g.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}

// ══════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export default function DidaskarosDashboard() {
  const [screen, setScreen] = useState<Screen>("painel");

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar active={screen} setScreen={setScreen} />
      {screen === "painel"
        ? <PainelPrincipal setScreen={setScreen} />
        : <Planejamento />
      }
    </div>
  );
}
