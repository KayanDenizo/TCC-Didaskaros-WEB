import { useCallback, useEffect, useState } from "react";
import { api, mensagemErro } from "../api/client";

/** GET com estados de carregamento/erro e função para recarregar. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(!!path);

  const recarregar = useCallback(async () => {
    if (!path) return;
    setCarregando(true);
    try {
      setData((await api.get<T>(path)).data);
      setErro("");
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setCarregando(false);
    }
  }, [path]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { data, erro, carregando, recarregar };
}

/** Lista de um cadastro (professores, turmas…) com salvar/excluir. */
export function useRecurso<T extends { id: number }>(path: string) {
  const { data, erro, carregando, recarregar } = useApi<T[]>(path);

  async function salvar(item: Omit<T, "id"> & { id?: number }) {
    const { id, ...corpo } = item;
    if (id) await api.put(`${path}/${id}`, corpo);
    else await api.post(path, corpo);
    await recarregar();
  }

  async function excluir(id: number) {
    await api.delete(`${path}/${id}`);
    await recarregar();
  }

  return { itens: data ?? [], erro, carregando, salvar, excluir };
}
