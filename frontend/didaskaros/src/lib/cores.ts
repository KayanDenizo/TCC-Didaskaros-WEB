// Uma cor por disciplina, escolhida de forma estável a partir do id.
const PALETA = [
  { cell: "bg-blue-50 border-l-blue-500 text-blue-800", dot: "bg-blue-500" },
  { cell: "bg-violet-50 border-l-violet-500 text-violet-800", dot: "bg-violet-500" },
  { cell: "bg-pink-50 border-l-pink-500 text-pink-800", dot: "bg-pink-500" },
  { cell: "bg-amber-50 border-l-amber-500 text-amber-800", dot: "bg-amber-500" },
  { cell: "bg-emerald-50 border-l-emerald-500 text-emerald-800", dot: "bg-emerald-500" },
  { cell: "bg-cyan-50 border-l-cyan-500 text-cyan-800", dot: "bg-cyan-500" },
  { cell: "bg-orange-50 border-l-orange-500 text-orange-800", dot: "bg-orange-500" },
  { cell: "bg-teal-50 border-l-teal-500 text-teal-800", dot: "bg-teal-500" },
  { cell: "bg-rose-50 border-l-rose-500 text-rose-800", dot: "bg-rose-500" },
  { cell: "bg-indigo-50 border-l-indigo-500 text-indigo-800", dot: "bg-indigo-500" },
  { cell: "bg-lime-50 border-l-lime-600 text-lime-800", dot: "bg-lime-600" },
  { cell: "bg-fuchsia-50 border-l-fuchsia-500 text-fuchsia-800", dot: "bg-fuchsia-500" },
];

export const corDisciplina = (id: number) => PALETA[id % PALETA.length];
