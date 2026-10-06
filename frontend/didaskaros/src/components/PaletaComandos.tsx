import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Icons, type IconName } from "./icons";

/** Outros componentes abrem a paleta disparando este evento (ex.: botão de busca da barra superior). */
export const EVENTO_ABRIR_PALETA = "didaskaros:abrir-paleta";

interface Comando {
  id: string;
  label: string;
  grupo: "Páginas" | "Ações" | "Conta";
  icon: IconName;
  /** Palavras extras para a busca encontrar o comando */
  termos?: string;
  executar: () => void;
}

/** Tira acento e caixa para a busca não depender de digitar "horário" com acento. */
const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Busca rápida de páginas e ações — Ctrl+K / ⌘K de qualquer tela do painel. */
export function PaletaComandos() {
  const navigate = useNavigate();
  const { sair } = useAuth();
  const [aberta, setAberta] = useState(false);
  const [busca, setBusca] = useState("");
  const [indice, setIndice] = useState(0);
  const campo = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLUListElement>(null);

  const comandos = useMemo<Comando[]>(() => {
    const ir = (to: string) => () => navigate(to);
    return [
      { id: "painel", label: "Painel Principal", grupo: "Páginas", icon: "Grid", termos: "inicio dashboard", executar: ir("/painel") },
      { id: "grades", label: "Grades Horárias", grupo: "Páginas", icon: "Calendar", termos: "horarios publicadas rascunhos", executar: ir("/grades") },
      { id: "gerar", label: "Gerar Grade", grupo: "Páginas", icon: "Sparkles", termos: "ia criar nova", executar: ir("/gerar-grade") },
      { id: "professores", label: "Professores", grupo: "Páginas", icon: "Users", termos: "docentes equipe", executar: ir("/professores") },
      { id: "turmas", label: "Turmas", grupo: "Páginas", icon: "Layers", termos: "classes cursos", executar: ir("/turmas") },
      { id: "disciplinas", label: "Disciplinas", grupo: "Páginas", icon: "Book", termos: "materias", executar: ir("/disciplinas") },
      { id: "salas", label: "Salas", grupo: "Páginas", icon: "Door", termos: "laboratorios", executar: ir("/salas") },
      { id: "nova-grade", label: "Gerar nova grade com IA", grupo: "Ações", icon: "Zap", termos: "criar montar", executar: ir("/gerar-grade") },
      { id: "imprimir", label: "Ver grade publicada para imprimir", grupo: "Ações", icon: "Printer", termos: "pdf imprimir", executar: ir("/grades") },
      { id: "coordenador", label: "Cadastrar coordenador", grupo: "Ações", icon: "UserPlus", termos: "acesso usuario", executar: ir("/cadastro") },
      { id: "perfil", label: "Meu perfil", grupo: "Conta", icon: "User", termos: "senha dados", executar: ir("/perfil") },
      { id: "sair", label: "Sair", grupo: "Conta", icon: "LogOut", termos: "logout", executar: () => { sair(); window.location.assign("/painel"); } },
    ];
  }, [navigate, sair]);

  const filtrados = useMemo(() => {
    const q = normalizar(busca.trim());
    if (!q) return comandos;
    return comandos.filter((c) => normalizar(`${c.label} ${c.termos ?? ""}`).includes(q));
  }, [busca, comandos]);

  // Atalho global e evento vindo da barra superior
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAberta((a) => !a);
      }
    };
    const abrir = () => setAberta(true);
    window.addEventListener("keydown", tecla);
    window.addEventListener(EVENTO_ABRIR_PALETA, abrir);
    return () => {
      window.removeEventListener("keydown", tecla);
      window.removeEventListener(EVENTO_ABRIR_PALETA, abrir);
    };
  }, []);

  useEffect(() => {
    if (!aberta) return;
    setBusca("");
    setIndice(0);
    requestAnimationFrame(() => campo.current?.focus());
  }, [aberta]);

  useEffect(() => setIndice(0), [busca]);

  // Mantém o item destacado visível ao navegar pelas setas
  useEffect(() => {
    lista.current?.querySelector<HTMLElement>(`[data-indice="${indice}"]`)?.scrollIntoView({ block: "nearest" });
  }, [indice]);

  if (!aberta) return null;

  function executar(c: Comando | undefined) {
    if (!c) return;
    setAberta(false);
    c.executar();
  }

  function teclado(e: React.KeyboardEvent) {
    if (e.key === "Escape") setAberta(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndice((i) => (i + 1) % Math.max(filtrados.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndice((i) => (i - 1 + filtrados.length) % Math.max(filtrados.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      executar(filtrados[indice]);
    }
  }

  const grupos = [...new Set(filtrados.map((c) => c.grupo))];

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[14vh] print:hidden" onKeyDown={teclado}>
      <div className="dialogo-fundo absolute inset-0 bg-[#0F2456]/30 backdrop-blur-[3px]" onClick={() => setAberta(false)} />
      <div role="dialog" aria-modal="true" aria-label="Busca rápida"
        className="dialogo-caixa relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_24px_80px_-12px_rgba(15,36,86,0.35)]">
        <div className="flex items-center gap-3 border-b border-gray-100 px-4">
          <span className="text-gray-400"><Icons.Search /></span>
          <input ref={campo} value={busca} onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar páginas e ações…" aria-label="Buscar"
            className="h-14 flex-1 bg-transparent text-[14px] font-medium text-gray-900 placeholder-gray-400 outline-none" />
          <kbd className="tecla">Esc</kbd>
        </div>

        <ul ref={lista} className="max-h-[52vh] overflow-y-auto p-2" role="listbox">
          {grupos.map((g) => (
            <li key={g}>
              <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[1.2px] text-gray-400">{g}</p>
              <ul>
                {filtrados.map((c, i) => c.grupo === g && (
                  <li key={c.id} data-indice={i} role="option" aria-selected={i === indice}
                    onMouseMove={() => setIndice(i)} onClick={() => executar(c)}
                    className={`group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150 ${i === indice ? "bg-blue-50 text-blue-700" : "text-gray-700"}`}>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors duration-150 ${i === indice ? "bg-white text-blue-600 shadow-sm" : "bg-gray-100 text-gray-500"}`}>
                      {(() => { const Icon = Icons[c.icon]; return <Icon />; })()}
                    </span>
                    <span className="flex-1 text-[13px] font-semibold">{c.label}</span>
                    <span className={`transition-all duration-150 ${i === indice ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0"}`}>
                      <Icons.ArrowRight />
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
          {!filtrados.length && (
            <li className="px-3 py-10 text-center text-[13px] text-gray-400">Nada encontrado para “{busca}”.</li>
          )}
        </ul>

        <div className="flex items-center gap-4 border-t border-gray-100 bg-gray-50/70 px-4 py-2.5 text-[11px] text-gray-400">
          <span className="flex items-center gap-1.5"><kbd className="tecla">↑</kbd><kbd className="tecla">↓</kbd> navegar</span>
          <span className="flex items-center gap-1.5"><kbd className="tecla">Enter</kbd> abrir</span>
          <span className="ml-auto flex items-center gap-1.5"><kbd className="tecla">Ctrl</kbd><kbd className="tecla">K</kbd> abre de qualquer tela</span>
        </div>
      </div>
    </div>
  );
}
