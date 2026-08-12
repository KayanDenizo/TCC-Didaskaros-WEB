import type { ReactNode } from "react";

export function StatCard({
  label, value, trend, trendColor, sub, emoji, iconBg, accent, delay = 0,
}: {
  label: string;
  value: string;
  trend: string;
  trendColor: string;
  sub: string;
  emoji: ReactNode;
  iconBg: string;
  accent: string;
  delay?: number;
}) {
  return (
    <div
      className="relative overflow-hidden bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      {/* meia-circunferência decorativa */}
      <span className={`absolute -right-9 top-1/2 -translate-y-1/2 w-28 h-28 rounded-full ${accent} opacity-[0.06] pointer-events-none`} />
      <span className={`absolute -right-5 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full ${accent} opacity-[0.12] pointer-events-none`} />

      <div className={`relative w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-lg mb-3`}>{emoji}</div>
      <p className="relative text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="relative text-3xl font-extrabold text-gray-900 tracking-tight leading-none">{value}</p>
      <div className="relative flex items-center gap-1.5 mt-2">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${trendColor}`}>{trend}</span>
        <span className="text-[10px] text-gray-400">{sub}</span>
      </div>
    </div>
  );
}
