import type { ReactNode } from "react";

export function StatCard({
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
