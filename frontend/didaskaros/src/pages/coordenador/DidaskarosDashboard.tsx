import { useState } from "react";
import { Sidebar } from "./dashboard/Sidebar";
import { PainelPrincipal } from "./dashboard/PainelPrincipal";
import { Planejamento } from "./dashboard/Planejamento";
import type { Screen } from "./dashboard/types";

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
