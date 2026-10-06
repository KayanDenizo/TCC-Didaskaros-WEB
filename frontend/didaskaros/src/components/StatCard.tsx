import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icons, type IconName } from "./icons";

/** Conta de 0 até o valor quando o cartão aparece. */
function useContagem(alvo: number, atraso: number) {
  const [valor, setValor] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setValor(alvo);
    let quadro = 0;
    const inicio = performance.now() + atraso;
    const passo = (agora: number) => {
      const t = Math.min(Math.max((agora - inicio) / 900, 0), 1);
      setValor(Math.round(alvo * (1 - Math.pow(1 - t, 3))));
      if (t < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [alvo, atraso]);
  return valor;
}

const CORES = {
  blue: { icone: "bg-blue-50 text-blue-600 ring-blue-100", brilho: "rgba(37, 99, 235, 0.12)" },
  emerald: { icone: "bg-emerald-50 text-emerald-600 ring-emerald-100", brilho: "rgba(16, 185, 129, 0.12)" },
  amber: { icone: "bg-amber-50 text-amber-600 ring-amber-100", brilho: "rgba(245, 158, 11, 0.12)" },
  violet: { icone: "bg-violet-50 text-violet-600 ring-violet-100", brilho: "rgba(139, 92, 246, 0.12)" },
  red: { icone: "bg-red-50 text-red-600 ring-red-100", brilho: "rgba(239, 68, 68, 0.12)" },
};

/**
 * Guarda a posição do cursor no elemento: `--cx/--cy` em px (para a luz) e
 * `--px/--py` de -1 a 1 (para inclinações 3D feitas em CSS).
 */
export function seguirCursor(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  el.style.setProperty("--cx", `${x}px`);
  el.style.setProperty("--cy", `${y}px`);
  el.style.setProperty("--px", ((x / r.width) * 2 - 1).toFixed(3));
  el.style.setProperty("--py", ((y / r.height) * 2 - 1).toFixed(3));
}

export function soltarCursor(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  el.style.setProperty("--px", "0");
  el.style.setProperty("--py", "0");
}

export function StatCard({ label, value, detail, icon, accent, delay = 0, to, children }: {
  label: string;
  value: number | string;
  detail: ReactNode;
  icon: IconName;
  accent: keyof typeof CORES;
  delay?: number;
  /** Com destino, o cartão inteiro vira link para a página correspondente */
  to?: string;
  /** Visual extra abaixo do número (barra, anel…) */
  children?: ReactNode;
}) {
  const cor = CORES[accent];
  const contado = useContagem(typeof value === "number" ? value : 0, delay);
  const Icon = Icons[icon];

  const conteudo = (
    <>
      <div className="flex items-start justify-between [transform-style:preserve-3d]">
        <p className="flex items-center gap-1 text-[12px] font-semibold text-gray-500">
          {label}
          {to && (
            <span className="-translate-x-1 text-blue-600 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
              <Icons.ArrowRight />
            </span>
          )}
        </p>
        <span className={`cartao-3d-icone grid h-10 w-10 place-items-center rounded-xl ring-1 ring-inset ${cor.icone}`}>
          <Icon />
        </span>
      </div>
      <p className="mt-1 text-[32px] font-extrabold text-gray-900 tracking-tight leading-none tabular-nums">
        {typeof value === "number" ? contado : value}
      </p>
      <div className="mt-auto pt-3">
        {children}
        <p className="text-[11px] text-gray-400 mt-2">{detail}</p>
      </div>
    </>
  );

  const comum = {
    onPointerMove: seguirCursor,
    onPointerLeave: soltarCursor,
    className: `painel-cartao vidro group relative flex flex-col rounded-2xl p-5 animate-fade-up outline-none ${to ? "cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500/50" : ""}`,
    style: { animationDelay: `${delay}ms`, "--brilho": cor.brilho } as React.CSSProperties,
  };

  return to
    ? <Link to={to} aria-label={`${label}: ${value}. Abrir página`} {...comum}>{conteudo}</Link>
    : <div {...comum}>{conteudo}</div>;
}
