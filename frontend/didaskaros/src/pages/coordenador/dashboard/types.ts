import type { IconName } from "./icons";

export type Screen = "painel" | "planejamento" | "gerar-grade";
export type SetScreen = (screen: Screen) => void;
export type ProfessorFilter = "todos" | "disponivel" | "ausente";
export type GradeCell = string | null;
export type DiscColor = { cell: string; dot: string };

export type NavGroup = {
  section: string;
  items: { label: string; icon: IconName | null; screen: Screen | null; badge?: string }[];
};
