import { useState, type FormEvent, type ReactNode } from "react";
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

/** Tela de cadastro padrão: tabela à esquerda, formulário de criação/edição à direita. */
export function CrudPage<T extends { id: number }, F extends object>(p: Props<T, F>) {
  const { itens, erro, carregando, salvar, excluir } = useRecurso<T>(p.recurso);
  const [form, setForm] = useState<F>(p.vazio);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [erroForm, setErroForm] = useState("");
  const [salvando, setSalvando] = useState(false);

  function limpar() {
    setForm(p.vazio);
    setEditandoId(null);
    setErroForm("");
  }

  function editar(item: T) {
    setForm(p.paraForm(item));
    setEditandoId(item.id);
    setErroForm("");
  }

  async function executar(acao: () => Promise<void>) {
    setSalvando(true);
    setErroForm("");
    try {
      await acao();
      limpar();
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
    executar(() => salvar({ ...form, id: editandoId ?? undefined } as unknown as T));
  }

  function handleExcluir() {
    if (editandoId && confirm(`Excluir ${p.feminino ? "esta" : "este"} ${p.singular.toLowerCase()}?`)) executar(() => excluir(editandoId));
  }

  return (
    <>
      <PageHeader title={p.title} description={p.description}>
        <Button variant="primary" onClick={limpar}><Icons.Plus /> Novo</Button>
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
                  <tr key={item.id} onClick={() => editar(item)}
                    className={`cursor-pointer transition-colors ${editandoId === item.id ? "bg-blue-50/60" : "hover:bg-gray-50"}`}>
                    {p.colunas.map((c) => <td key={c.titulo} className={`px-5 py-3 text-gray-700 ${c.className ?? ""}`}>{c.render(item)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="sticky top-[76px]">
          <CardHeader title={editandoId ? `Editar ${p.singular}` : `${p.feminino ? "Nova" : "Novo"} ${p.singular}`} />
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {p.renderForm(form, (patch) => setForm((f) => ({ ...f, ...patch })))}
            {erroForm && <Alert>{erroForm}</Alert>}
            <div className="flex gap-2 pt-1">
              <Button type="submit" variant="primary" loading={salvando} className="flex-1">{editandoId ? "Salvar alterações" : "Cadastrar"}</Button>
              {editandoId && <Button variant="danger" onClick={handleExcluir} disabled={salvando}>Excluir</Button>}
              {editandoId && <Button onClick={limpar}>Cancelar</Button>}
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
