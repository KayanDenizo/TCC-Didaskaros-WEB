import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Sparkles,
  Calendar,
  Bell,
  Shield,
  TrendingUp,
  ArrowRight,
  Check,
  AlertTriangle,
  Clock,
  Plus,
  HelpCircle,
  RefreshCw,
  MessageSquareOff,
  Eye,
  ClipboardList,
  Settings2,
  History,
  LayoutDashboard,
  FileBarChart,
  CalendarSync,
  ShieldCheck,
  UserCheck,
  Building2,
  ChevronRight,
  Github,
  Linkedin,
  Twitter,
  Mail,
  Smartphone,
  Server,
  Database,
  Code2,
  BrainCircuit,
} from "lucide-react";
import { AnimatedNumber } from "../components/AnimatedNumber";
import { useReveal } from "../hooks/useReveal";
import heroMockup from "../assets/landing/hero-mockup.png";
import shotAvailability from "../assets/landing/screen-availability.jpg";
import shotDashboard from "../assets/landing/screen-dashboard.jpg";
import shotGenerator from "../assets/landing/screen-generator.jpg";
import shotMobile from "../assets/landing/screen-mobile.jpg";

/* -------------------------------------------------- */
/* Header                                              */
/* -------------------------------------------------- */
function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "py-3" : "py-5"
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-6 rounded-2xl px-4 sm:px-6 transition-all duration-300 ${
          scrolled ? "glass-card mx-3 py-2.5 sm:mx-auto" : "py-2"
        }`}
      >
        <a href="#top" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand shadow-brand">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-ink">
            Didaskaros
          </span>
        </a>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#problemas" className="hover:text-ink transition-colors">Problemas</a>
          <a href="#solucao" className="hover:text-ink transition-colors">Solução</a>
          <a href="#funcionalidades" className="hover:text-ink transition-colors">Funcionalidades</a>
          <a href="#cps" className="hover:text-ink transition-colors">Diferencial CPS</a>
          <a href="#tecnologias" className="hover:text-ink transition-colors">Tecnologias</a>
          <a href="#faq" className="hover:text-ink transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="#cta"
            className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-ink hover:bg-muted sm:inline-flex"
          >
            Demonstração
          </a>
          <Link
            to="/painel"
            className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white shadow-float transition-transform hover:-translate-y-0.5"
          >
            Entrar
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------- */
/* Hero                                                */
/* -------------------------------------------------- */
function Hero() {
  return (
    <section
      id="top"
      className="relative isolate overflow-hidden pt-36 pb-24 sm:pt-40 lg:pt-44"
    >
      {/* background */}
      <div className="absolute inset-0 -z-10 bg-hero-glow" />
      <div className="absolute inset-0 -z-10 grid-bg [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="absolute -top-32 left-1/2 -z-10 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" />
      <div className="pointer-events-none absolute left-[8%] top-[30%] -z-10 h-72 w-72 rounded-full bg-brand-accent/30 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute right-[5%] top-[10%] -z-10 h-80 w-80 rounded-full bg-brand-2/25 blur-3xl animate-blob" style={{ animationDelay: "-5s" }} />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-[1.05fr_1fr]">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/15 bg-white px-3 py-1.5 text-xs font-semibold text-brand shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Exclusivo para o Centro Paula Souza
          </div>
          <h1 className="mt-6 font-display text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            O futuro da gestão de{" "}
            <span className="text-gradient-brand animate-gradient">horários acadêmicos</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Automatize a geração de horários, elimine conflitos docentes, centralize
            notificações e transforme a gestão acadêmica.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#cta"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-sm font-semibold text-white shadow-brand shine-on-hover transition-all hover:-translate-y-0.5"
            >
              Ver Demonstração
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#funcionalidades"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-muted"
            >
              Conhecer Plataforma
            </a>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            {[
              "Compatível com ETECs e FATECs",
              "Regras institucionais CPS",
              "Gestão inteligente de horários",
            ].map((t) => (
              <li key={t} className="inline-flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-success/15 text-success">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* mockup */}
        <div className="relative">
          <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[2rem] bg-gradient-brand opacity-20 blur-3xl" />
          <div className="relative animate-float">
            <img
              src={heroMockup}
              alt="Didaskaros — dashboards e gerador de horários"
              width={1600}
              height={1200}
              className="w-full drop-shadow-2xl"
            />
          </div>
          {/* floating chips */}
          <div className="glass-card absolute -left-2 top-10 hidden items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-ink shadow-float sm:flex animate-float-slow">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse-ring" />
            0 conflitos detectados
          </div>
          <div className="glass-card absolute -right-2 bottom-12 hidden items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-ink shadow-float md:flex animate-float">
            <Bell className="h-3.5 w-3.5 text-brand" />
            Horário publicado
          </div>
        </div>
      </div>

      {/* logos/trust */}
      <div className="mx-auto mt-20 max-w-5xl px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Construído para a realidade do Centro Paula Souza
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-ink/60">
          <span className="font-display text-lg font-bold tracking-tight">ETEC</span>
          <span className="font-display text-lg font-bold tracking-tight">FATEC</span>
          <span className="font-display text-lg font-bold tracking-tight">CPS</span>
          <span className="font-display text-lg font-bold tracking-tight">TCC 2026</span>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------- */
/* Section header                                      */
/* -------------------------------------------------- */
function SectionEyebrow({
  eyebrow,
  title,
  description,
  light,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  light?: boolean;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center reveal">
      <span
        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
          light
            ? "border-white/15 bg-white/5 text-brand-accent"
            : "border-brand/20 bg-brand/5 text-brand"
        }`}
      >
        {eyebrow}
      </span>
      <h2
        className={`mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl ${
          light ? "text-white" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-base leading-relaxed sm:text-lg ${
            light ? "text-white/70" : "text-muted-foreground"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------- */
/* Problemas                                           */
/* -------------------------------------------------- */
function Problems() {
  const items = [
    { icon: AlertTriangle, title: "Conflitos de Horários", desc: "Sobreposições entre disciplinas, salas e professores." },
    { icon: Clock, title: "Montagem Manual Demorada", desc: "Semanas de planilhas, retrabalho e revisões intermináveis." },
    { icon: RefreshCw, title: "Mudanças de Última Hora", desc: "Ajustes constantes que quebram a grade já publicada." },
    { icon: MessageSquareOff, title: "Comunicação Descentralizada", desc: "Avisos espalhados em e-mails, grupos e murais físicos." },
    { icon: Eye, title: "Falta de Visibilidade", desc: "Coordenação sem painel único da operação acadêmica." },
    { icon: ClipboardList, title: "Regras Docentes Complexas", desc: "Difícil respeitar pontuação, vínculos e restrições do CPS." },
  ];
  return (
    <section id="problemas" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionEyebrow
          eyebrow="Problemas"
          title="Os desafios da gestão acadêmica atual"
          description="Coordenadores e secretarias do CPS enfrentam diariamente uma combinação de processos manuais, regras complexas e falta de visibilidade."
        />
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className="reveal group relative overflow-hidden rounded-2xl border border-border bg-white p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-float"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand/10 to-brand-accent/10 text-brand">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------- */
/* Solução / Timeline                                  */
/* -------------------------------------------------- */
function Solution() {
  const steps = [
    { title: "Disponibilidade", desc: "Professor informa janelas e restrições." },
    { title: "Análise", desc: "Sistema interpreta vínculos e prioridades." },
    { title: "Motor CPS", desc: "Processa regras institucionais e pontuação." },
    { title: "Validação", desc: "Detecta conflitos antes da publicação." },
    { title: "Geração", desc: "Cria horários otimizados em segundos." },
    { title: "Publicação", desc: "Distribuição em todas as unidades." },
    { title: "Notificações", desc: "Alertas automáticos para todos os públicos." },
  ];
  return (
    <section id="solucao" className="relative py-28 bg-muted/40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionEyebrow
          eyebrow="Solução"
          title="Como o Didaskaros resolve isso"
          description="Um fluxo orquestrado de ponta a ponta, do levantamento de disponibilidade à publicação do horário oficial."
        />
        <ol className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="reveal relative rounded-2xl border border-border bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-float"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand text-sm font-bold text-white shadow-brand">
                  {i + 1}
                </span>
                <h3 className="font-display text-base font-bold text-ink">{s.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              {i < steps.length - 1 && (
                <ChevronRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-brand/40 lg:block" />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* -------------------------------------------------- */
/* Funcionalidades                                     */
/* -------------------------------------------------- */
function Features() {
  const items = [
    { icon: Calendar, title: "Disponibilidade Docente", desc: "Coleta estruturada de janelas e restrições por professor." },
    { icon: TrendingUp, title: "Pontuação Docente CPS", desc: "Cálculo automático de prioridades conforme regras do CPS." },
    { icon: Sparkles, title: "Gerador Inteligente", desc: "Motor de otimização que monta horários completos em segundos." },
    { icon: ShieldCheck, title: "Validação de Restrições", desc: "Checagem em tempo real de regras, vínculos e contratos." },
    { icon: AlertTriangle, title: "Controle de Conflitos", desc: "Detecção automática de sobreposições antes de publicar." },
    { icon: Bell, title: "Notificações em Tempo Real", desc: "Alertas para professores e alunos." },
    { icon: CalendarSync, title: "Integração com Calendários", desc: "Sincronização com Google, Apple e Outlook." },
    { icon: History, title: "Histórico de Alterações", desc: "Auditoria completa de cada mudança de grade." },
    { icon: LayoutDashboard, title: "Dashboard Estratégico", desc: "Visão consolidada da operação de cada unidade." },
    { icon: FileBarChart, title: "Relatórios Gerenciais", desc: "Indicadores para coordenação e gestão acadêmica." },
  ];
  return (
    <section id="funcionalidades" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionEyebrow
          eyebrow="Funcionalidades"
          title="Tudo o que a gestão acadêmica precisa"
          description="Um produto coeso, projetado para coordenadores, professores e secretarias do Centro Paula Souza."
        />
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {items.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className="reveal group rounded-2xl border border-border bg-white p-5 transition-all hover:-translate-y-1 hover:border-brand/30 hover:shadow-float"
              style={{ transitionDelay: `${(i % 5) * 60}ms` }}
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand/10 text-brand transition-colors group-hover:bg-gradient-brand group-hover:text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-sm font-bold text-ink">{title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------- */
/* Diferencial CPS (dark)                              */
/* -------------------------------------------------- */
function CPSDifferential() {
  const items = [
    "Prioridade para professores indeterminados",
    "Sistema de pontuação docente",
    "Validação de deslocamento entre unidades",
    "Intervalo mínimo de 11 horas",
    "Limite diário de aulas",
    "Compatibilidade com ETEC e FATEC",
    "Configuração de regras institucionais",
  ];
  return (
    <section id="cps" className="relative overflow-hidden py-28 bg-dark-section">
      <div className="absolute inset-0 grid-bg-dark [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="absolute left-1/2 top-1/3 -z-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-brand/30 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-6">
        <SectionEyebrow
          eyebrow="Diferencial CPS"
          title="Desenvolvido para a realidade do Centro Paula Souza"
          description="Cada regra, prioridade e restrição institucional já vem modelada no produto."
          light
        />
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t, i) => (
            <div
              key={t}
              className="reveal glass-dark group rounded-2xl p-5 transition-all hover:-translate-y-1"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-brand text-white shadow-brand">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
                <p className="pt-1.5 text-sm font-medium text-white/90">{t}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------- */
/* Mockups alternados                                  */
/* -------------------------------------------------- */
function Mockups() {
  const rows = [
    {
      eyebrow: "Visão Estratégica",
      title: "Dashboard Estratégico",
      desc: "Acompanhe indicadores de horários, ocupação docente e conflitos em uma única tela pensada para a coordenação.",
      img: shotDashboard,
      reverse: false,
    },
    {
      eyebrow: "Coleta Inteligente",
      title: "Disponibilidade Docente",
      desc: "Professores registram janelas e restrições em segundos; o sistema entende vínculos, deslocamentos e pontuação CPS.",
      img: shotAvailability,
      reverse: true,
    },
    {
      eyebrow: "Motor Inteligente",
      title: "Gerador de Horários",
      desc: "Algoritmo de otimização monta grades completas respeitando regras institucionais — em segundos, não semanas.",
      img: shotGenerator,
      reverse: false,
    },
    {
      eyebrow: "Aplicativo Mobile",
      title: "Central na palma da mão",
      desc: "Professores e alunos recebem o horário atualizado, notificações e avisos institucionais no celular.",
      img: shotMobile,
      reverse: true,
      portrait: true,
    },
  ];
  return (
    <section className="relative py-28 bg-muted/40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionEyebrow
          eyebrow="Produto"
          title="Uma plataforma, todas as visões"
          description="Cada perfil enxerga exatamente o que precisa, com a fluidez de um SaaS moderno."
        />
        <div className="mt-20 space-y-28">
          {rows.map((r) => (
            <div
              key={r.title}
              className={`grid grid-cols-1 items-center gap-10 lg:grid-cols-2 ${
                r.reverse ? "lg:[&>div:first-child]:order-2" : ""
              }`}
            >
              <div className="reveal">
                <span className="inline-flex rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-semibold text-brand">
                  {r.eyebrow}
                </span>
                <h3 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                  {r.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">{r.desc}</p>
                <ul className="mt-6 space-y-2 text-sm text-ink">
                  {["Interface premium e responsiva", "Acessível e auditável", "Pronta para escala institucional"].map((t) => (
                    <li key={t} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success" strokeWidth={3} /> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="reveal relative">
                <div className="pointer-events-none absolute -inset-6 -z-10 rounded-3xl bg-gradient-brand opacity-15 blur-2xl" />
                <div
                  className={`relative overflow-hidden rounded-2xl border border-border bg-white shadow-float ${
                    r.portrait ? "mx-auto max-w-xs" : ""
                  }`}
                >
                  <img
                    src={r.img}
                    alt={r.title}
                    loading="lazy"
                    className="block w-full"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------- */
/* Benefícios (counters)                               */
/* -------------------------------------------------- */
function Benefits() {
  const stats = [
    { value: 92, suffix: "%", label: "Menos conflitos acadêmicos" },
    { value: 80, suffix: "%", label: "Mais eficiência administrativa" },
    { value: 100, suffix: "%", label: "Comunicação centralizada" },
    { value: 4.9, decimals: 1, label: "Experiência docente (avaliação)" },
    { value: 60, suffix: "x", label: "Mais rápido que processo manual" },
    { value: 0, label: "Conflitos não detectados" },
  ];
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionEyebrow
          eyebrow="Benefícios"
          title="Resultados que a coordenação sente"
          description="Indicadores observados em cenários simulados e validados com a operação de unidades do CPS."
        />
        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="reveal rounded-2xl border border-border bg-white p-5 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-float"
              style={{ transitionDelay: `${i * 70}ms` }}
            >
              <div className="font-display text-3xl font-extrabold text-gradient-brand sm:text-4xl">
                <AnimatedNumber to={s.value} suffix={s.suffix ?? ""} decimals={s.decimals ?? 0} />
              </div>
              <p className="mt-2 text-xs font-medium text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------- */
/* Público-alvo                                        */
/* -------------------------------------------------- */
function Audiences() {
  const items = [
    { icon: GraduationCap, role: "Professor", desc: "Informe disponibilidade, acompanhe sua grade e receba avisos." },
    { icon: Settings2, role: "Coordenador", desc: "Gere, valide e publique horários institucionais em minutos." },
    { icon: UserCheck, role: "Aluno", desc: "Acesse o horário oficial, mudanças e notificações em tempo real." },
  ];
  return (
    <section className="relative py-28 bg-muted/40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionEyebrow
          eyebrow="Público-alvo"
          title="Uma experiência para cada perfil"
        />
        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-3">
          {items.map(({ icon: Icon, role, desc }, i) => (
            <div
              key={role}
              className="reveal group rounded-2xl border border-border bg-white p-6 text-center transition-all hover:-translate-y-1 hover:shadow-float"
              style={{ transitionDelay: `${i * 70}ms` }}
            >
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-brand text-white shadow-brand transition-transform group-hover:scale-105">
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-ink">{role}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------- */
/* Tecnologias                                         */
/* -------------------------------------------------- */
function TechStack() {
  const groups = [
    {
      icon: Code2,
      title: "Frontend",
      items: ["React", "TypeScript", "Tailwind CSS"],
    },
    {
      icon: Server,
      title: "Backend",
      items: ["Node.js", "Express"],
    },
    {
      icon: Database,
      title: "Banco de Dados",
      items: ["MySQL"],
    },
    {
      icon: Smartphone,
      title: "Mobile",
      items: ["React Native", "Expo"],
    },
    {
      icon: BrainCircuit,
      title: "Inteligência Artificial",
      items: ["Claude API"],
    },
  ];
  return (
    <section id="tecnologias" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionEyebrow
          eyebrow="Tecnologias"
          title="Stack moderna, robusta e escalável"
          description="Construído com tecnologias consagradas pela indústria, pensadas para evoluir junto com a instituição."
        />
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {groups.map(({ icon: Icon, title, items }, i) => (
            <div
              key={title}
              className="reveal rounded-2xl border border-border bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-float"
              style={{ transitionDelay: `${i * 70}ms` }}
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand/10 to-brand-accent/10 text-brand">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {title}
              </h3>
              <ul className="mt-2 space-y-1">
                {items.map((t) => (
                  <li key={t} className="text-base font-semibold text-ink">{t}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------- */
/* FAQ                                                 */
/* -------------------------------------------------- */
function FAQ() {
  const faqs = [
    {
      q: "O Didaskaros é compatível com as regras do Centro Paula Souza?",
      a: "Sim. O motor foi desenhado a partir das diretrizes do CPS — pontuação docente, intervalo mínimo de 11h, prioridade para indeterminados, vínculo único e restrições de jornada são aplicados automaticamente em cada geração.",
    },
    {
      q: "Quanto tempo leva para gerar uma grade completa?",
      a: "De minutos a poucos segundos por unidade, dependendo do volume. Uma ETEC de porte médio sai com a grade validada em menos de 30 segundos após o fechamento das disponibilidades.",
    },
    {
      q: "Funciona tanto em ETECs quanto em FATECs?",
      a: "Sim. As particularidades de cada modalidade — turnos, regime docente e calendário acadêmico — são tratadas em perfis institucionais separados na mesma plataforma.",
    },
    {
      q: "Os professores precisam instalar algo?",
      a: "Não. O painel web é responsivo e há aplicativo mobile (iOS e Android) para registrar disponibilidade, ver a grade publicada e receber notificações.",
    },
    {
      q: "Como o sistema evita conflitos de horário?",
      a: "O validador roda em tempo real: sobreposição de sala, professor em dois locais, choque com restrições contratuais e quebra de intervalo são bloqueados antes da publicação.",
    },
    {
      q: "Quem pode acessar e o que cada perfil enxerga?",
      a: "A coordenação acessa a plataforma web e enxerga a operação completa. Professores e alunos usam o aplicativo e recebem apenas a grade pertinente e os avisos relevantes.",
    },
  ];
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative overflow-hidden py-28">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -left-32 top-20 -z-10 h-80 w-80 rounded-full bg-brand/20 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -right-24 bottom-10 -z-10 h-96 w-96 rounded-full bg-brand-accent/25 blur-3xl animate-blob" style={{ animationDelay: "-6s" }} />

      <div className="mx-auto max-w-4xl px-6">
        <SectionEyebrow
          eyebrow="Perguntas frequentes"
          title="Tudo o que você precisa saber"
          description="Respostas rápidas para as dúvidas mais comuns de coordenação, professores e equipes acadêmicas."
        />

        <div className="mt-14 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className="reveal group relative overflow-hidden rounded-2xl border border-border bg-white transition-all duration-500 hover:border-brand/40 hover:shadow-float"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                {/* glow accent */}
                <div
                  className={`pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-brand to-transparent transition-opacity duration-500 ${
                    isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center gap-4 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-all duration-300 ${
                      isOpen
                        ? "bg-gradient-brand text-white shadow-brand"
                        : "bg-brand/10 text-brand group-hover:bg-brand/15"
                    }`}
                  >
                    <HelpCircle className="h-5 w-5" />
                  </span>
                  <span className="flex-1 font-display text-base font-bold text-ink sm:text-lg">
                    {f.q}
                  </span>
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-transform duration-300 ${
                      isOpen ? "rotate-45 border-brand/40 bg-brand/5 text-brand" : ""
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
                <div
                  className="grid transition-[grid-template-rows] duration-500 ease-out"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="pb-6 pl-20 pr-6 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {f.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="reveal mt-10 flex flex-col items-center justify-center gap-3 rounded-2xl border border-brand/15 bg-gradient-to-br from-brand/5 via-white to-brand-accent/5 px-6 py-8 text-center sm:flex-row sm:text-left">
          <div className="flex-1">
            <h3 className="font-display text-lg font-bold text-ink">Ficou alguma dúvida?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Fale com a equipe Didaskaros — respondemos em até 24h úteis.
            </p>
          </div>
          <a
            href="#cta"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-sm font-semibold text-white shadow-brand shine-on-hover transition-transform hover:-translate-y-0.5"
          >
            Falar com a equipe
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------- */
/* CTA final                                           */
/* -------------------------------------------------- */
function FinalCTA() {
  return (
    <section id="cta" className="relative overflow-hidden py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-dark-section p-10 text-center shadow-float sm:p-16">
          <div className="absolute inset-0 grid-bg-dark opacity-60" />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[400px] w-[700px] rounded-full bg-brand/40 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-brand-accent">
              <Building2 className="h-3.5 w-3.5" /> Centro Paula Souza
            </span>
            <h2 className="mx-auto mt-5 max-w-3xl font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Transformando a gestão acadêmica do Centro Paula Souza
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
              Uma solução moderna para uma gestão mais eficiente. Conheça o Didaskaros e veja
              como ETECs e FATECs podem ganhar tempo, transparência e tranquilidade.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink shadow-float transition-transform hover:-translate-y-0.5"
              >
                Solicitar Demonstração
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#funcionalidades"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Conhecer Plataforma
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------- */
/* Footer                                              */
/* -------------------------------------------------- */
function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand shadow-brand">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-ink">
              Didaskaros
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Sistema inteligente para gestão acadêmica do Centro Paula Souza — ETECs e FATECs.
          </p>
          <div className="mt-5 flex items-center gap-2">
            {[Github, Linkedin, Twitter, Mail].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <FooterCol
          title="Plataforma"
          links={["Funcionalidades", "Diferencial CPS", "Mobile", "Tecnologias"]}
        />
        <FooterCol
          title="Institucional"
          links={["Centro Paula Souza", "ETEC", "FATEC", "TCC 2026"]}
        />
        <FooterCol
          title="Contato"
          links={["Solicitar Demo", "Suporte", "Equipe", "Imprensa"]}
        />
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>© 2026 Didaskaros. Projeto acadêmico — TCC 2026.</p>
          <p className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" /> Compatível com diretrizes do Centro Paula Souza.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="font-display text-sm font-bold text-ink">{title}</h4>
      <ul className="mt-4 space-y-2">
        {links.map((l) => (
          <li key={l}>
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-ink">
              {l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------- */
/* Page                                                */
/* -------------------------------------------------- */
export default function Landing() {
  useReveal();
  useEffect(() => {
    const anterior = document.title;
    document.title = "Didaskaros — Gestão acadêmica inteligente para o CPS";
    return () => {
      document.title = anterior;
    };
  }, []);

  return (
    <div className="landing min-h-screen bg-background text-ink antialiased">
      <Header />
      <main>
        <Hero />
        <Problems />
        <Solution />
        <Features />
        <CPSDifferential />
        <Mockups />
        <Benefits />
        <Audiences />
        <TechStack />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
