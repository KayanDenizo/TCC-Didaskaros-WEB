import { useEffect, useState } from "react";

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

export function StatCard({ label, value, detail, emoji, accent, delay = 0 }: {
  label: string;
  value: number | string;
  detail: string;
  emoji: string;
  accent: "blue" | "emerald" | "amber" | "violet";
  delay?: number;
}) {
  const cores = {
    blue: ["bg-blue-50", "bg-blue-500"],
    emerald: ["bg-emerald-50", "bg-emerald-500"],
    amber: ["bg-amber-50", "bg-amber-500"],
    violet: ["bg-violet-50", "bg-violet-500"],
  }[accent];
  const contado = useContagem(typeof value === "number" ? value : 0, delay);

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-[transform,box-shadow] duration-300 ease-out animate-fade-in-up group"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}>
      <span className={`absolute -right-9 top-1/2 -translate-y-1/2 w-28 h-28 rounded-full ${cores[1]} opacity-[0.06]`} />
      <span className={`absolute -right-5 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full ${cores[1]} opacity-[0.12]`} />
      <div className={`relative w-10 h-10 rounded-xl ${cores[0]} flex items-center justify-center text-lg mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6`}>{emoji}</div>
      <p className="relative text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="relative text-3xl font-extrabold text-gray-900 tracking-tight leading-none tabular-nums">{typeof value === "number" ? contado : value}</p>
      <p className="relative text-[11px] text-gray-400 mt-2">{detail}</p>
    </div>
  );
}
