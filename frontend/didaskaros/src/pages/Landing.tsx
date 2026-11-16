import { Fragment, useEffect, useRef, useState } from "react";
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
  ChevronLeft,
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
  ArrowUp,
} from "lucide-react";
import { AnimatedNumber } from "../components/AnimatedNumber";
import { Logo } from "../components/Logo";
import { useReveal } from "../hooks/useReveal";
import { useEfeitosLanding } from "../hooks/useEfeitosLanding";
import shotGrades from "../assets/landing/app-grades.jpg";
import shotProfessores from "../assets/landing/app-professores.jpg";
import shotPainel from "../assets/landing/app-painel.jpg";
import shotGerarGrade from "../assets/landing/app-gerar-grade.jpg";
import shotMobile from "../assets/landing/screen-mobile.png";

/* ---------------- header ---------------- */
const LINKS_NAV = [
  { id: "problemas", rotulo: "Problemas" },
  { id: "solucao", rotulo: "Solução" },
  { id: "funcionalidades", rotulo: "Funcionalidades" },
  { id: "cps", rotulo: "Diferencial CPS" },
  { id: "tecnologias", rotulo: "Tecnologias" },
  { id: "faq", rotulo: "FAQ" },
];

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [ativo, setAtivo] = useState("");
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // destaca na navbar a secao q ta no meio da tela
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) if (e.isIntersecting) setAtivo(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const { id } of LINKS_NAV) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? "py-3" : "py-5"
        }`}
    >
      <div className="barra-rolagem" aria-hidden />
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-6 rounded-2xl px-4 sm:px-6 transition-all duration-300 ${scrolled ? "glass-card mx-3 py-2.5 sm:mx-auto" : "py-2"
          }`}
      >
        <a href="#top" className="logo-landing flex items-center py-1" aria-label="Didáskaros — início">
          <Logo cor="#0F172A" className="w-36 sm:w-40" />
        </a>
        <nav className="hidden items-center gap-1 text-sm font-medium text-muted-foreground lg:flex">
          {LINKS_NAV.map(({ id, rotulo }) => (
            <a key={id} href={`#${id}`} className={`nav-link ${ativo === id ? "ativo" : ""}`}>
              {rotulo}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="#cta"
            className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-brand/5 hover:text-brand sm:inline-flex"
          >
            Demonstração
          </a>
          <Link
            to="/painel"
            className="group inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white shadow-float shine-on-hover transition-all hover:-translate-y-0.5 hover:bg-brand"
          >
            Entrar
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------------- print do app numa janela de navegador ---------------- */
function JanelaApp({ src, alt, url, eager }: { src: string; alt: string; url: string; eager?: boolean }) {
  return (
    <div className="janela-app overflow-hidden rounded-2xl border border-border/80 bg-white shadow-float ring-1 ring-ink/5">
      <div className="flex items-center gap-3 border-b border-border bg-muted/70 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="mx-auto flex min-w-0 max-w-xs flex-1 items-center justify-center gap-1.5 rounded-md bg-white px-3 py-1 text-[11px] font-medium text-muted-foreground ring-1 ring-border">
          <Shield className="h-3 w-3 shrink-0 text-success" />
          <span className="truncate">{url}</span>
        </div>
        <div className="w-[42px]" />
      </div>
      <div className="overflow-hidden">
        <img src={src} alt={alt} width={1920} height={1200} loading={eager ? "eager" : "lazy"} className="block w-full" />
      </div>
    </div>
  );
}

/* ---------------- print do app mobile dentro de um celular ---------------- */
function Celular({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative mx-auto w-full max-w-[290px]">
      {/* Botões laterais */}
      <span className="absolute -left-[3px] top-[22%] h-10 w-[3px] rounded-l-sm bg-[#1f2330]" />
      <span className="absolute -left-[3px] top-[32%] h-16 w-[3px] rounded-l-sm bg-[#1f2330]" />
      <span className="absolute -right-[3px] top-[28%] h-20 w-[3px] rounded-r-sm bg-[#1f2330]" />
      <div className="rounded-[2.75rem] bg-gradient-to-b from-[#2a2f3d] to-[#141720] p-[10px] shadow-float ring-1 ring-ink/20">
        <div className="relative overflow-hidden rounded-[2.1rem] bg-white">
          {/* Câmera frontal */}
          <span className="absolute left-1/2 top-[7px] z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-[#0b0d12] ring-2 ring-[#1f2330]" />
          <img src={src} alt={alt} width={1041} height={2235} loading="lazy" className="block w-full" />
        </div>
      </div>
    </div>
  );
}

/* ---------------- inclinacao 3D seguindo o mouse ---------------- */
type EstadoTilt = { rx: number; ry: number; mx: number; my: number; s: number };
const TILT_REPOUSO: EstadoTilt = { rx: 0, ry: 0, mx: 0.5, my: 0.5, s: 0 };

/*
 * o mouse define um "alvo" e a cada frame o estado anda um pedaco do caminho
 * ate ele (amortecimento). assim a peca tem peso: segue o mouse sem tremer
 * e volta pro lugar desacelerando, em vez de parar seco.
 * a area q pega o mouse (palco) nao gira, so o conteudo, senao treme nas bordas
 */
function Inclinavel({
  children,
  max = 9,
  className = "",
}: {
  children: React.ReactNode;
  max?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const alvo = useRef<EstadoTilt>({ ...TILT_REPOUSO });
  const atual = useRef<EstadoTilt>({ ...TILT_REPOUSO });
  const quadro = useRef(0);

  useEffect(() => () => cancelAnimationFrame(quadro.current), []);

  function animar() {
    const el = ref.current;
    if (!el) return;
    const a = atual.current;
    const t = alvo.current;
    let parado = true;
    for (const k of Object.keys(a) as (keyof EstadoTilt)[]) {
      a[k] += (t[k] - a[k]) * 0.11;
      if (Math.abs(t[k] - a[k]) > 0.002) parado = false;
    }
    el.style.setProperty("--rx", a.rx.toFixed(3));
    el.style.setProperty("--ry", a.ry.toFixed(3));
    el.style.setProperty("--mx", a.mx.toFixed(4));
    el.style.setProperty("--my", a.my.toFixed(4));
    el.style.setProperty("--s", a.s.toFixed(4));
    quadro.current = parado ? 0 : requestAnimationFrame(animar);
  }

  function iniciar() {
    if (!quadro.current) quadro.current = requestAnimationFrame(animar);
  }

  function mover(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
    const y = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1);
    alvo.current = { rx: (0.5 - y) * 2 * max, ry: (x - 0.5) * 2 * max, mx: x, my: y, s: 1 };
    iniciar();
  }

  function sair() {
    alvo.current = { ...TILT_REPOUSO, mx: atual.current.mx, my: atual.current.my };
    iniciar();
  }

  return (
    <div ref={ref} onPointerMove={mover} onPointerLeave={sair} className={`tilt-palco relative ${className}`}>
      <div className="tilt-sombra pointer-events-none absolute" aria-hidden />
      <div className="tilt relative">{children}</div>
    </div>
  );
}

/* etiqueta q flutua na frente da imagem inclinada */
function Etiqueta({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div className={`tilt-camada pointer-events-none absolute hidden sm:block ${className}`}>
      <div className="flex items-center gap-2 whitespace-nowrap rounded-xl border border-white bg-white/95 px-3.5 py-2.5 text-xs font-semibold text-ink shadow-float ring-1 ring-ink/5">
        {children}
      </div>
    </div>
  );
}

/* titulo q entra palavra por palavra, cada uma girando de baixo pra cima */
function Palavras({ texto, inicio = 0, className = "" }: { texto: string; inicio?: number; className?: string }) {
  const palavras = texto.split(" ");
  return (
    <>
      {palavras.map((p, i) => (
        // o espaco fica fora do inline-block pq dentro dele o espaco no fim da caixa some
        <Fragment key={i}>
          <span className="palavra">
            <span className={className} style={{ animationDelay: `${180 + (inicio + i) * 75}ms` }}>
              {p}
            </span>
          </span>
          {i < palavras.length - 1 && " "}
        </Fragment>
      ))}
    </>
  );
}

/* ---------------- hero ---------------- */
function Hero() {
  return (
    <section
      id="top"
      className="grao relative isolate overflow-hidden pt-36 pb-24 sm:pt-40 lg:pt-44"
    >
      {/* background */}
      <div className="absolute inset-0 -z-10 bg-hero-glow" />
      <div className="absolute inset-0 -z-10 grid-bg [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="absolute -top-32 left-1/2 -z-10 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" />
      <div className="paralaxe pointer-events-none absolute inset-0 -z-10 [--prof:-14px]">
        <div className="absolute inset-0 grid-bg opacity-60 [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_55%)]" />
      </div>
      <div className="paralaxe pointer-events-none absolute left-[8%] top-[30%] -z-10 h-72 w-72 rounded-full bg-brand-accent/30 blur-3xl animate-blob [--prof:40px]" />
      <div className="paralaxe pointer-events-none absolute right-[5%] top-[10%] -z-10 h-80 w-80 rounded-full bg-brand-2/25 blur-3xl animate-blob [--prof:-55px]" style={{ animationDelay: "-5s" }} />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-[1.05fr_1fr]">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/15 bg-white px-3 py-1.5 text-xs font-semibold text-brand shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Exclusivo para o Centro Paula Souza
          </div>
          <h1 className="titulo-hero mt-6 text-balance font-display text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            <Palavras texto="O futuro da gestão de" />{" "}
            <Palavras texto="horários acadêmicos" inicio={5} className="text-gradient-brand" />
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
          <div className="hero-rolagem">
            <div className="hero-pouso">
              <div className="animate-float">
                <Inclinavel>
                  <JanelaApp src={shotGrades} alt="Grade horária gerada no Didáskaros" url="didaskaros.app/grades" eager />
                  <div className="tilt-brilho pointer-events-none absolute inset-0 rounded-2xl" />
                  {/* chips flutuantes: ficam "à frente" da janela ao inclinar */}
                  <div className="tilt-camada pointer-events-none absolute -left-6 bottom-[30%] hidden sm:block">
                    <div className="flex items-center gap-2 rounded-xl border border-white bg-white/95 px-3.5 py-2.5 text-xs font-semibold text-ink shadow-float ring-1 ring-ink/5 animate-float-slow">
                      <span className="h-2 w-2 rounded-full bg-success animate-pulse-ring" />
                      0 conflitos detectados
                    </div>
                  </div>
                  <div className="tilt-camada pointer-events-none absolute -right-6 top-[22%] hidden md:block">
                    <div className="flex items-center gap-2 rounded-xl border border-white bg-white/95 px-3.5 py-2.5 text-xs font-semibold text-ink shadow-float ring-1 ring-ink/5 animate-float">
                      <Sparkles className="h-3.5 w-3.5 text-brand" />
                      Gerada pela Didáskaros IA
                    </div>
                  </div>
                </Inclinavel>
              </div>
            </div>
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

/* ---------------- titulo das secoes ---------------- */
function SectionEyebrow({
  eyebrow,
  title,
  description,
  light,
  esquerda,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  light?: boolean;
  esquerda?: boolean;
}) {
  return (
    <div className={`reveal reveal-titulo ${esquerda ? "max-w-xl text-left" : "mx-auto max-w-3xl text-center"}`}>
      <span
        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${light
          ? "border-white/15 bg-white/5 text-brand-accent"
          : "border-brand/20 bg-brand/5 text-brand"
          }`}
      >
        {eyebrow}
      </span>
      <h2
        className={`mt-4 text-balance font-display text-3xl font-extrabold tracking-tight sm:text-4xl ${light ? "text-white" : "text-ink"
          }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-pretty text-base leading-relaxed sm:text-lg ${light ? "text-white/70" : "text-muted-foreground"
            }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

/* ---------------- problemas ---------------- */
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
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        {/* Título fica parado enquanto a lista passa */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionEyebrow
            esquerda
            eyebrow="Problemas"
            title="Os desafios da gestão acadêmica atual"
            description="Coordenadores e secretarias do CPS enfrentam diariamente uma combinação de processos manuais, regras complexas e falta de visibilidade."
          />
          <a
            href="#solucao"
            className="reveal group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand"
          >
            Veja como resolvemos
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>

        <ol className="border-t border-border">
          {items.map(({ icon: Icon, title, desc }, i) => (
            <li
              key={title}
              className="reveal problema group relative grid grid-cols-[3rem_1fr_auto] items-start gap-4 border-b border-border py-7 sm:grid-cols-[4rem_1fr_auto]"
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              <span className="problema-numero pt-0.5 font-display text-sm font-bold tabular-nums text-muted-foreground/70">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="problema-titulo font-display text-lg font-bold text-ink sm:text-xl">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground sm:text-base">{desc}</p>
              </div>
              <span className="problema-icone grid h-10 w-10 place-items-center rounded-xl border border-border bg-white text-muted-foreground">
                <Icon className="h-[18px] w-[18px]" />
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------- solucao / timeline ---------------- */
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
        <ol data-rolagem className="palco-3d mt-16 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="reveal cartao passo rounded-2xl border border-border bg-white p-6 shadow-sm"
              style={{ transitionDelay: `${i * 80}ms`, "--i": i } as React.CSSProperties}
            >
              <div className="flex items-center gap-3">
                <span className="cartao-icone passo-numero grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand text-sm font-bold text-white shadow-brand">
                  {i + 1}
                </span>
                <h3 className="font-display text-base font-bold text-ink">{s.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              <span className="passo-trilho" aria-hidden />
              {i < steps.length - 1 && (
                <ChevronRight className="passo-seta absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-brand/40 lg:block" />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------- funcionalidades ---------------- */
/* mini-interfaces feitas em codigo pros blocos maiores do bento */
const GRADE_DEMO = [
  ["PW", "BD", "ES", "MAT", "PW"],
  ["PW", "BD", "POR", "MAT", "ING"],
  ["ES", "ING", "POR", "SO", "BD"],
  ["ES", "SO", "PW", "SO", "BD"],
];
const COR_DISCIPLINA: Record<string, string> = {
  PW: "bg-brand text-white",
  BD: "bg-brand-2 text-white",
  ES: "bg-brand-accent/80 text-ink",
  MAT: "bg-indigo-100 text-indigo-700",
  POR: "bg-sky-100 text-sky-700",
  ING: "bg-slate-200 text-slate-700",
  SO: "bg-blue-100 text-blue-700",
};

function DemoGrade() {
  const dias = ["Seg", "Ter", "Qua", "Qui", "Sex"];
  return (
    <div className="demo-grade mt-6 rounded-xl border border-border bg-background/60 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
        <span>2º DS · Manhã</span>
        <span className="demo-grade-ok inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-success">
          <Check className="h-3 w-3" strokeWidth={3} /> 0 conflitos
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {dias.map((d) => (
          <span key={d} className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {d}
          </span>
        ))}
        {GRADE_DEMO.flatMap((linha, l) =>
          linha.map((sigla, c) => (
            <span
              key={`${l}-${c}`}
              className={`demo-celula grid h-8 place-items-center rounded-md text-[10px] font-bold sm:h-9 ${COR_DISCIPLINA[sigla]}`}
              // ordem "embaralhada" pra parecer o motor preenchendo e nao uma varredura
              style={{ "--ordem": (c * 7 + l * 3) % 20 } as React.CSSProperties}
            >
              {sigla}
            </span>
          )),
        )}
      </div>
    </div>
  );
}

function DemoConflito() {
  return (
    <div className="demo-conflito mt-6 rounded-xl border border-border bg-background/60 p-4">
      <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
        <span>Prof. Ana · Segunda</span>
        <span className="relative h-5 w-28">
          <span className="demo-conflito-erro absolute inset-0 inline-flex items-center justify-end gap-1 text-red-500">
            <AlertTriangle className="h-3 w-3" /> Conflito
          </span>
          <span className="demo-conflito-ok absolute inset-0 inline-flex items-center justify-end gap-1 text-success">
            <Check className="h-3 w-3" strokeWidth={3} /> Resolvido
          </span>
        </span>
      </div>
      <div className="relative mt-3 h-9 rounded-lg bg-white ring-1 ring-border">
        <div className="absolute inset-y-0 left-1/4 w-px bg-border" />
        <div className="absolute inset-y-0 left-2/4 w-px bg-border" />
        <div className="absolute inset-y-0 left-3/4 w-px bg-border" />
        <span className="absolute inset-y-1 left-[6%] grid w-[34%] place-items-center rounded-md bg-brand text-[10px] font-bold text-white">
          PW · Lab 2
        </span>
        <span className="demo-conflito-bloco absolute inset-y-1 left-[28%] grid w-[34%] place-items-center rounded-md text-[10px] font-bold text-white">
          BD · Lab 2
        </span>
      </div>
      <div className="mt-2 flex justify-between text-[10px] tabular-nums text-muted-foreground">
        <span>07:30</span>
        <span>09:10</span>
        <span>10:50</span>
        <span>12:30</span>
      </div>
    </div>
  );
}

function DemoNotificacoes() {
  const avisos = [
    { titulo: "Nova grade publicada", detalhe: "2º DS · Manhã" },
    { titulo: "Aula remanejada", detalhe: "Qui · 3ª aula → Lab 4" },
    { titulo: "Disponibilidade recebida", detalhe: "Prof. Carlos" },
  ];
  return (
    <ul className="mt-6 space-y-2">
      {avisos.map((a, i) => (
        <li
          key={a.titulo}
          className="demo-aviso flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2.5 shadow-sm"
          style={{ "--ordem": i } as React.CSSProperties}
        >
          <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
            <Bell className="h-4 w-4" />
            {i === 0 && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-white animate-pulse-ring" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold text-ink">{a.titulo}</span>
            <span className="block truncate text-[11px] text-muted-foreground">{a.detalhe}</span>
          </span>
          <span className="text-[10px] tabular-nums text-muted-foreground">{i === 0 ? "agora" : `${i * 4} min`}</span>
        </li>
      ))}
    </ul>
  );
}

function DemoPainel() {
  const barras = [42, 58, 51, 74, 66, 88, 79];
  return (
    <div className="mt-6 flex items-end gap-4">
      <div className="shrink-0">
        <p className="text-[11px] font-semibold text-muted-foreground">Ocupação docente</p>
        <p className="font-display text-3xl font-extrabold tabular-nums text-ink">
          <AnimatedNumber to={87} suffix="%" />
        </p>
      </div>
      <div className="flex h-20 flex-1 items-end gap-1.5">
        {barras.map((h, i) => (
          <span
            key={i}
            className="demo-barra flex-1 rounded-t-md bg-gradient-to-t from-brand to-brand-accent"
            style={{ height: `${h}%`, "--ordem": i } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}

function Features() {
  const destaques = [
    {
      icon: Sparkles,
      title: "Gerador Inteligente",
      desc: "Motor de otimização que monta horários completos em segundos, respeitando cada regra institucional.",
      demo: <DemoGrade />,
      classe: "md:col-span-2 lg:row-span-2",
    },
    {
      icon: AlertTriangle,
      title: "Controle de Conflitos",
      desc: "Sobreposições de sala e professor são detectadas e resolvidas antes de publicar.",
      demo: <DemoConflito />,
      classe: "md:col-span-2",
    },
  ];
  const simples = [
    { icon: Calendar, title: "Disponibilidade Docente", desc: "Coleta estruturada de janelas e restrições por professor." },
    { icon: TrendingUp, title: "Pontuação Docente CPS", desc: "Cálculo automático de prioridades conforme regras do CPS." },
  ];
  const simples2 = [
    { icon: ShieldCheck, title: "Validação de Restrições", desc: "Checagem em tempo real de regras, vínculos e contratos." },
    { icon: CalendarSync, title: "Integração com Calendários", desc: "Sincronização com Google, Apple e Outlook." },
  ];
  const simples3 = [
    { icon: History, title: "Histórico de Alterações", desc: "Auditoria completa de cada mudança de grade." },
    { icon: FileBarChart, title: "Relatórios Gerenciais", desc: "Indicadores para coordenação e gestão acadêmica." },
  ];

  const blocoSimples = ({ icon: Icon, title, desc }: (typeof simples)[number], i: number) => (
    <div
      key={title}
      className="reveal cartao group flex flex-col rounded-2xl border border-border bg-white p-6"
      style={{ transitionDelay: `${(i % 4) * 60}ms` }}
    >
      <div className="cartao-icone grid h-10 w-10 place-items-center rounded-lg bg-brand/10 text-brand group-hover:bg-gradient-brand group-hover:text-white">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 font-display text-base font-bold text-ink">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );

  const blocoDestaque = (
    { icon: Icon, title, desc, demo, classe }: { icon: typeof Sparkles; title: string; desc: string; demo: React.ReactNode; classe: string },
    i: number,
  ) => (
    <div
      key={title}
      className={`reveal cartao group flex flex-col rounded-2xl border border-border bg-white p-6 sm:p-7 ${classe}`}
      style={{ transitionDelay: `${i * 60}ms` }}
    >
      <div className="flex items-center gap-3">
        <div className="cartao-icone grid h-10 w-10 place-items-center rounded-lg bg-gradient-brand text-white shadow-brand">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      </div>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{desc}</p>
      <div className="mt-auto">{demo}</div>
    </div>
  );

  return (
    <section id="funcionalidades" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionEyebrow
          eyebrow="Funcionalidades"
          title="Tudo o que a gestão acadêmica precisa"
          description="Um produto coeso, projetado para coordenadores, professores e secretarias do Centro Paula Souza."
        />
        <div className="palco-3d mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {blocoDestaque(destaques[0], 0)}
          {blocoDestaque(destaques[1], 1)}
          {simples.map(blocoSimples)}
          {blocoDestaque(
            {
              icon: Bell,
              title: "Notificações em Tempo Real",
              desc: "Professores e alunos recebem cada mudança no celular, na hora.",
              demo: <DemoNotificacoes />,
              classe: "md:col-span-2",
            },
            0,
          )}
          {simples2.map(blocoSimples)}
          {simples3.map(blocoSimples)}
          {blocoDestaque(
            {
              icon: LayoutDashboard,
              title: "Dashboard Estratégico",
              desc: "Visão consolidada da operação de cada unidade.",
              demo: <DemoPainel />,
              classe: "md:col-span-2",
            },
            1,
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- diferencial CPS (parte escura) ---------------- */
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
    <section id="cps" data-luz className="grao relative overflow-hidden py-28 bg-dark-section">
      <div className="luz-cursor" aria-hidden />
      <div className="absolute inset-0 grid-bg-dark [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="absolute left-1/2 top-1/3 -z-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-brand/30 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-6">
        <SectionEyebrow
          eyebrow="Diferencial CPS"
          title="Desenvolvido para a realidade do Centro Paula Souza"
          description="Cada regra, prioridade e restrição institucional já vem modelada no produto."
          light
        />
        <div className="palco-3d mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t, i) => (
            <div
              key={t}
              className="reveal cartao cartao-escuro glass-dark group rounded-2xl p-5"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start gap-3">
                <span className="cartao-icone grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-brand text-white shadow-brand">
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

/* ---------------- vista explodida: as telas se separam qnd rola ---------------- */
const CAMADAS_EXPLOSAO = [
  { img: shotProfessores, url: "didaskaros.app/professores", etapa: "1 · Disponibilidade", nome: "Professores informam a disponibilidade", z: "0px" },
  { img: shotGerarGrade, url: "didaskaros.app/gerar-grade", etapa: "2 · Geração", nome: "O motor monta a grade com as regras CPS", z: "150px" },
  { img: shotPainel, url: "didaskaros.app/painel", etapa: "3 · Acompanhamento", nome: "A coordenação acompanha tudo no painel", z: "300px" },
];
// ponto da rolagem (--f) em q as telas terminam de abrir, tem q bater com o --b do index.css
const EXPLOSAO_ABERTA = 0.74;

/*
 * qnd rola, a pilha isometrica separa e abre (no css, via --f). dps de aberta
 * vira um carrossel em anel: cada tela fica num angulo do anel e trocar de tela so
 * gira esse angulo, a q da a volta passa por tras das outras.
 */
function Explosao() {
  const ref = useRef<HTMLElement>(null);
  const [aberto, setAberto] = useState(false);
  // posicao do anel. nao volta pra 0..2 de proposito: crescendo sem limite o giro vai sempre pelo caminho mais curto
  const [giro, setGiro] = useState(1);
  const total = CAMADAS_EXPLOSAO.length;
  const ativa = ((giro % total) + total) % total;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAberto(true);
      return;
    }
    let quadro = 0;
    const medir = () => {
      quadro = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const f = -r.top / Math.max(r.height - window.innerHeight, 1);
      setAberto(f >= EXPLOSAO_ABERTA);
    };
    const agendar = () => {
      if (!quadro) quadro = requestAnimationFrame(medir);
    };
    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", agendar);
    medir();
    return () => {
      window.removeEventListener("scroll", agendar);
      window.removeEventListener("resize", agendar);
      cancelAnimationFrame(quadro);
    };
  }, []);

  function irPara(i: number) {
    const passo = (((i - giro) % total) + total) % total; // 0, 1 ou 2
    if (passo === 1) setGiro(giro + 1);
    else if (passo === total - 1) setGiro(giro - 1);
  }

  return (
    <section ref={ref} data-fixo className={`explosao relative h-[300vh] bg-background ${aberto ? "aberta" : ""}`}>
      <div className="sticky top-0 flex h-svh flex-col items-center justify-center overflow-hidden px-6">
        <div className="absolute inset-0 -z-10 grid-bg [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="explosao-titulo mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-semibold text-brand">
            Por dentro da plataforma
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Três telas, um só fluxo
          </h2>
          <p className="mt-3 text-base text-muted-foreground">Role para desmontar a plataforma camada por camada.</p>
        </div>

        <div className="explosao-palco relative mt-6 aspect-[16/10] w-[min(78vw,720px)] sm:mt-10">
          <div className="explosao-pilha absolute inset-0">
            {CAMADAS_EXPLOSAO.map((c, i) => {
              const centro = i === ativa;
              return (
                <div
                  key={c.url}
                  role={aberto && !centro ? "button" : undefined}
                  tabIndex={aberto && !centro ? 0 : -1}
                  aria-label={aberto && !centro ? `Mostrar: ${c.nome}` : undefined}
                  onClick={() => aberto && irPara(i)}
                  onKeyDown={(e) => {
                    if (aberto && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      irPara(i);
                    }
                  }}
                  className={`explosao-camada absolute inset-0 ${centro ? "centro" : ""}`}
                  style={{ "--z": c.z, "--ang": `${(i - giro) * (360 / total)}deg` } as React.CSSProperties}
                >
                  <JanelaApp src={c.img} alt={c.nome} url={c.url} />
                  <div className="explosao-veu pointer-events-none absolute inset-0 rounded-2xl" />
                  <span className="explosao-etapa pointer-events-none absolute -right-3 top-6 hidden rounded-lg bg-ink px-2.5 py-1 text-[11px] font-semibold text-white shadow-float sm:block">
                    {c.etapa}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controles do carrossel: só aparecem depois que as telas se abrem */}
        <div className="explosao-controles mt-10 flex flex-col items-center gap-4 sm:mt-14" aria-hidden={!aberto}>
          <p key={ativa} className="explosao-nome text-center text-sm font-semibold text-ink sm:text-base">
            <span className="text-brand">{CAMADAS_EXPLOSAO[ativa].etapa}</span>
            <span className="mx-2 text-muted-foreground">—</span>
            {CAMADAS_EXPLOSAO[ativa].nome}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setGiro(giro - 1)}
              tabIndex={aberto ? 0 : -1}
              aria-label="Tela anterior"
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-white text-ink shadow-sm transition-all hover:-translate-x-0.5 hover:border-brand/40 hover:text-brand"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              {CAMADAS_EXPLOSAO.map((c, i) => (
                <button
                  key={c.url}
                  type="button"
                  onClick={() => irPara(i)}
                  tabIndex={aberto ? 0 : -1}
                  aria-label={`Ir para: ${c.nome}`}
                  aria-current={i === ativa}
                  className={`h-2 rounded-full transition-all duration-500 ${i === ativa ? "w-7 bg-gradient-brand" : "w-2 bg-ink/20 hover:bg-ink/40"
                    }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setGiro(giro + 1)}
              tabIndex={aberto ? 0 : -1}
              aria-label="Próxima tela"
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-white text-ink shadow-sm transition-all hover:translate-x-0.5 hover:border-brand/40 hover:text-brand"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="explosao-trilho absolute bottom-6 left-1/2 h-1 w-40 -translate-x-1/2 overflow-hidden rounded-full bg-ink/10" aria-hidden>
          <div className="h-full origin-left rounded-full bg-gradient-brand" />
        </div>
      </div>
    </section>
  );
}

/* ---------------- mockups alternados ---------------- */
function Mockups() {
  const rows = [
    {
      eyebrow: "Visão Estratégica",
      title: "Dashboard Estratégico",
      desc: "Acompanhe indicadores de horários, ocupação docente e conflitos em uma única tela pensada para a coordenação.",
      img: shotPainel,
      url: "didaskaros.app/painel",
      reverse: false,
      etiquetas: (
        <>
          <Etiqueta className="-right-5 top-[16%] [--z:70px]">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse-ring" />
            Dados atualizados agora
          </Etiqueta>
          <Etiqueta className="-left-6 bottom-[14%] [--z:45px]">
            <LayoutDashboard className="h-3.5 w-3.5 text-brand" />
            Visão por unidade
          </Etiqueta>
        </>
      ),
    },
    {
      eyebrow: "Coleta Inteligente",
      title: "Disponibilidade Docente",
      desc: "Professores registram janelas e restrições em segundos; o sistema entende vínculos, deslocamentos e pontuação CPS.",
      img: shotProfessores,
      url: "didaskaros.app/professores",
      reverse: true,
      etiquetas: (
        <Etiqueta className="-left-6 top-[24%] [--z:65px]">
          <span className="grid h-4 w-4 place-items-center rounded-full bg-success/15 text-success">
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </span>
          Disponibilidade registrada
        </Etiqueta>
      ),
    },
    {
      eyebrow: "Motor Inteligente",
      title: "Gerador de Horários",
      desc: "Algoritmo de otimização monta grades completas respeitando regras institucionais — em segundos, não semanas.",
      img: shotGerarGrade,
      url: "didaskaros.app/gerar-grade",
      reverse: false,
      etiquetas: (
        <Etiqueta className="-right-6 bottom-[22%] [--z:70px]">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          Regras CPS validadas
        </Etiqueta>
      ),
    },
    {
      eyebrow: "Aplicativo Mobile",
      title: "Central na palma da mão",
      desc: "Professores e alunos recebem o horário atualizado, notificações e avisos institucionais no celular.",
      img: shotMobile,
      url: "",
      reverse: true,
      portrait: true,
      etiquetas: (
        <Etiqueta className="-left-16 top-[15%] [--z:80px]">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-brand text-white">
            <Bell className="h-3.5 w-3.5" />
          </span>
          <span className="flex flex-col leading-tight">
            Nova grade publicada
            <span className="text-[10px] font-medium text-muted-foreground">Didáskaros · agora</span>
          </span>
        </Etiqueta>
      ),
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
              className={`grid grid-cols-1 items-center gap-10 lg:grid-cols-2 ${r.reverse ? "lg:[&>div:first-child]:order-2" : ""
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
                {/* Gira em 3D acompanhando a rolagem; o lado define para onde aponta */}
                <div data-rolagem className="rola-3d" style={{ "--lado": r.reverse ? 1 : -1 } as React.CSSProperties}>
                  {r.portrait ? (
                    <Inclinavel max={10} className="mx-auto max-w-[290px]">
                      <Celular src={r.img} alt={r.title} />
                      <div className="tilt-brilho pointer-events-none absolute inset-0 rounded-[2.75rem]" />
                      {r.etiquetas}
                    </Inclinavel>
                  ) : (
                    <Inclinavel max={7}>
                      <JanelaApp src={r.img} alt={r.title} url={r.url} />
                      <div className="tilt-brilho pointer-events-none absolute inset-0 rounded-2xl" />
                      {r.etiquetas}
                    </Inclinavel>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- beneficios (contadores) ---------------- */
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
        <div className="palco-3d mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="reveal cartao rounded-2xl border border-border bg-white p-5 text-center shadow-sm"
              style={{ transitionDelay: `${i * 70}ms` }}
            >
              <div className="cartao-icone font-display text-3xl font-extrabold tabular-nums text-gradient-brand sm:text-4xl">
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

/* ---------------- publico-alvo ---------------- */
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
        <div className="palco-3d mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-3">
          {items.map(({ icon: Icon, role, desc }, i) => (
            <div
              key={role}
              className="reveal cartao group rounded-2xl border border-border bg-white p-6 text-center"
              style={{ transitionDelay: `${i * 70}ms` }}
            >
              <div className="cartao-icone mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-brand text-white shadow-brand">
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

/* ---------------- tecnologias ---------------- */
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
        <div className="reveal mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-sm sm:grid-cols-2 lg:grid-cols-5">
          {groups.map(({ icon: Icon, title, items }) => (
            <div key={title} className="tecnologia group bg-white p-6 transition-colors duration-300 hover:bg-background">
              <div className="flex items-center gap-2.5 text-muted-foreground transition-colors group-hover:text-brand">
                <Icon className="h-4 w-4" />
                <h3 className="font-display text-xs font-bold uppercase tracking-[0.14em]">{title}</h3>
              </div>
              <ul className="mt-4 space-y-1.5">
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

/* ---------------- faq ---------------- */
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
                  className={`pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-brand to-transparent transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center gap-4 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-all duration-300 ${isOpen
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
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-45 border-brand/40 bg-brand/5 text-brand" : ""
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
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-sm font-semibold text-white shadow-brand shine-on-hover transition-all hover:-translate-y-0.5"
          >
            Falar com a equipe
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------------- cta final ---------------- */
function FinalCTA() {
  return (
    <section id="cta" className="relative overflow-hidden py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div data-luz className="grao reveal relative overflow-hidden rounded-3xl bg-dark-section p-10 text-center shadow-float sm:p-16">
          <div className="piso-3d" aria-hidden>
            <div className="piso-3d-grade" />
          </div>
          <div className="luz-cursor" aria-hidden />
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
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink shadow-float transition-all hover:-translate-y-0.5"
              >
                Solicitar Demonstração
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#funcionalidades"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
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

/* ---------------- footer ---------------- */
function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <a href="#top" className="logo-landing inline-flex" aria-label="Didáskaros — voltar ao início">
            <Logo cor="#0F172A" className="w-40" />
          </a>
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

/* ---------------- botao de voltar pro topo ---------------- */
function VoltarAoTopo() {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisivel(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Voltar ao topo"
      className={`voltar-topo group fixed bottom-6 right-6 z-50 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-brand text-white shadow-brand ring-4 ring-white/70 hover:-translate-y-1 ${visivel ? "" : "oculto"
        }`}
    >
      <ArrowUp className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
    </button>
  );
}

/* ---------------- pagina ---------------- */
export default function Landing() {
  useReveal();
  useEfeitosLanding();
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
        <Explosao />
        <Mockups />
        <Benefits />
        <Audiences />
        <TechStack />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <VoltarAoTopo />
    </div>
  );
}
