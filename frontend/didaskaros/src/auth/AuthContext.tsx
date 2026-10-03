import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { api, token } from "../api/client";
import type { Usuario } from "../api/types";
import { Abertura } from "../components/Abertura";
import { Alert, Loading } from "../components/ui";

interface Auth {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (tokenRecebido: string, usuario: Usuario, lembrar: boolean) => void;
  sair: () => void;
  /** Mostra a tela de abertura (logo + relógio) logo depois do login. */
  abertura: boolean;
  encerrarAbertura: () => void;
}

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [abertura, setAbertura] = useState(false);
  const encerrarAbertura = useCallback(() => setAbertura(false), []);

  // Com token salvo, recupera o usuário ao abrir a página
  useEffect(() => {
    if (!token.get()) {
      loginProvisorio().finally(() => setCarregando(false));
      return;
    }
    api.get<Usuario>("/auth/me")
      .then((r) => setUsuario(r.data))
      .catch(() => token.clear())
      .finally(() => setCarregando(false));
  }, []);

  // PROVISÓRIO: a tela de Login é da Julia. Até ela chegar, entra direto com a
  // coordenadora do banco de exemplo. Remover quando a rota /login voltar.
  async function loginProvisorio() {
    try {
      const { data } = await api.post<{ token: string; usuario: Usuario }>("/auth/login", {
        email: "maria.costa@etec.sp.gov.br", senha: "didaskaros123",
      });
      token.set(data.token, false);
      setUsuario(data.usuario);
      setAbertura(true);
    } catch { /* backend fora do ar: as páginas mostram o erro */ }
  }

  const auth: Auth = {
    usuario,
    carregando,
    entrar: (t, u, lembrar) => {
      token.set(t, lembrar);
      setUsuario(u);
      setAbertura(true);
    },
    sair: () => {
      token.clear();
      setUsuario(null);
    },
    abertura,
    encerrarAbertura,
  };
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth fora do AuthProvider");
  return ctx;
}

/** Rotas que exigem login. */
export function RequireAuth() {
  const { usuario, carregando, abertura, encerrarAbertura } = useAuth();
  if (carregando) return <Loading />;
  if (!usuario) return (
    <div className="p-8"><Alert title="Não foi possível entrar">O backend está rodando? Recarregue a página depois de subir.</Alert></div>
  );
  return (
    <>
      <Outlet />
      {abertura && <Abertura onFim={encerrarAbertura} />}
    </>
  );
}
