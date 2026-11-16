import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { mensagemErro } from "../api/client";
import { useRecurso } from "../hooks/useApi";
import { Icons } from "./icons";
import { Alert, Button, Card, CardHeader, Empty, Loading, PageHeader } from "./ui";

interface Props<T extends { id: number }, F> {
  title: string;
  singular: string;
  description: string;
  recurso: string;
  vazio: F;
  paraForm: (item: T) => F;
  colunas: { titulo: string; render: (item: T) => ReactNode; className?: string }[];
  renderForm: (form: F, set: (patch: Partial<F>) => void) => ReactNode;
  validar?: (form: F) => string | null;
  largura?: string;
  feminino?: boolean;
}

/** tela de cadastro padrao: tabela na esquerda e form de criar/editar na direita */
export function CrudPage<T extends { id: number }, F extends object>(p: Props<T, F>) {
  const { itens, erro, carregando, salvar, excluir } = useRecurso<T>(p.recurso);
  const [form, setForm] = useState<F>(p.vazio);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [erroForm, setErroForm] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [destaque, setDestaque] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const artigo = p.feminino ? "a" : "o";

  // a confirmacao some sozinha dps de uns segundos
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(""), 2800);
    return () => clearTimeout(t);
  }, [aviso]);

  function focarForm() {
    setDestaque((d) => d + 1);
    requestAnimationFrame(() => {
      formRef.current?.closest("[data-form-card]")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      formRef.current?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
    });
  }

  function novo() {
    limpar();
    setAviso("");
    focarForm();
  }

  function limpar() {
    setForm(p.vazio);
    setEditandoId(null);
    setErroForm("");
  }

  function editar(item: T) {
    setForm(p.paraForm(item));
    setEditandoId(item.id);
    setErroForm("");
    setAviso("");
  }

  async function executar(acao: () => Promise<void>, mensagem: string) {
    setSalvando(true);
    setErroForm("");
    try {
      await acao();
      limpar();
      setAviso(mensagem);
    } catch (err) {
      setErroForm(mensagemErro(err));
    } finally {
      setSalvando(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const problema = p.validar?.(form);
    if (problema) return setErroForm(problema);
    executar(() => salvar({ ...form, id: editandoId ?? undefined } as unknown as T),
      editandoId ? "Alterações salvas" : `${p.singular} cadastrad${artigo}`);
  }

  function handleExcluir() {
    if (editandoId && confirm(`Excluir ${p.feminino ? "esta" : "este"} ${p.singular.toLowerCase()}?`)) executar(() => excluir(editandoId), `${p.singular} excluíd${artigo}`);
  }

  return (
    <>
      <PageHeader title={p.title} description={p.description}>
        <Button variant="primary" onClick={novo}><Icons.Plus /> Novo</Button>
      </PageHeader>

      <div className={`grid gap-5 items-start ${p.largura ?? "grid-cols-[1fr_380px]"}`}>
        <Card className="overflow-hidden">
          <CardHeader title={`${itens.length} cadastrado(s)`} subtitle="Clique em uma linha para editar" />
          {carregando && !itens.length ? <Loading /> : erro ? <div className="p-5"><Alert>{erro}</Alert></div> : !itens.length ? (
            <Empty>Nada cadastrado ainda. Use o formulário ao lado.</Empty>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  {p.colunas.map((c) => <th key={c.titulo} className={`px-5 py-2.5 ${c.className ?? ""}`}>{c.titulo}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {itens.map((item) => (
                  <tr key={item.id} onClick={() => { editar(item); focarForm(); }}
                    className={`group cursor-pointer transition-[background-color,box-shadow] duration-200 ${editandoId === item.id
                      ? "bg-blue-50/70 shadow-[inset_3px_0_0_#3b82f6]" : "hover:bg-gray-50 hover:shadow-[inset_3px_0_0_#bfdbfe]"}`}>
                    {p.colunas.map((c, i) => (
                      <td key={c.titulo} className={`px-5 py-3 text-gray-700 ${c.className ?? ""}`}>
                        <div className={i === 0 ? `transition-transform duration-200 ${editandoId === item.id ? "translate-x-1" : "group-hover:translate-x-1"}` : ""}>{c.render(item)}</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className={`sticky top-[76px] transition-[box-shadow,border-color] duration-300 ${editandoId ? "border-blue-200 shadow-[0_0_0_4px_rgba(59,130,246,0.08)]" : ""}`}>
          <div data-form-card key={`${editandoId ?? "novo"}-${destaque}`} className="animate-form-in">
          <CardHeader title={editandoId ? `Editar ${p.singular}` : `${p.feminino ? "Nova" : "Novo"} ${p.singular}`} />
          <form ref={formRef} onSubmit={handleSubmit} className="p-5 space-y-4">
            {p.renderForm(form, (patch) => setForm((f) => ({ ...f, ...patch })))}
            {erroForm && <div className="animate-shake"><Alert>{erroForm}</Alert></div>}
            {aviso && (
              <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-[12px] font-semibold text-emerald-700 animate-scale-in">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[11px] animate-pop-in">✓</span>
                {aviso}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <Button type="submit" variant="primary" loading={salvando} className="flex-1">{editandoId ? "Salvar alterações" : "Cadastrar"}</Button>
              {editandoId && <Button variant="danger" onClick={handleExcluir} disabled={salvando}>Excluir</Button>}
              {editandoId && <Button onClick={limpar}>Cancelar</Button>}
            </div>
          </form>
          </div>
        </Card>
      </div>
    </>
  );
}
