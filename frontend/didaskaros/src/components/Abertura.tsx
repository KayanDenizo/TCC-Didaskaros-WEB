import { useEffect } from "react";
import { Logo } from "./Logo";

const DURACAO_MS = 2600;

// abertura dps do login: os ponteiros giram e o zoom no relogio mostra o painel
export function Abertura({ onFim }: { onFim: () => void }) {
  useEffect(() => {
    const semAnimacao = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(onFim, semAnimacao ? 0 : DURACAO_MS);
    return () => clearTimeout(t);
  }, [onFim]);

  return (
    <div className="abertura fixed inset-0 z-[100] flex items-center justify-center cursor-pointer" onClick={onFim} aria-hidden>
      <Logo className="abertura-logo w-[min(560px,80vw)]" />
    </div>
  );
}
