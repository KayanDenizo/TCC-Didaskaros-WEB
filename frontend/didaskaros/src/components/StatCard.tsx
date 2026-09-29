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

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}>
      <span className={`absolute -right-9 top-1/2 -translate-y-1/2 w-28 h-28 rounded-full ${cores[1]} opacity-[0.06]`} />
      <span className={`absolute -right-5 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full ${cores[1]} opacity-[0.12]`} />
      <div className={`relative w-10 h-10 rounded-xl ${cores[0]} flex items-center justify-center text-lg mb-3`}>{emoji}</div>
      <p className="relative text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="relative text-3xl font-extrabold text-gray-900 tracking-tight leading-none">{value}</p>
      <p className="relative text-[11px] text-gray-400 mt-2">{detail}</p>
    </div>
  );
}
