import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { api, token } from "../api/client";
import type { Usuario } from "../api/types";
import { Loading } from "../components/ui";

interface Auth {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (tokenRecebido: string, usuario: Usuario, lembrar: boolean) => void;
  sair: () => void;
}

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(!!token.get());

  // Com token salvo, recupera o usuário ao abrir a página
  useEffect(() => {
    if (!token.get()) return;
    api.get<Usuario>("/auth/me")
      .then((r) => setUsuario(r.data))
      .catch(() => token.clear())
      .finally(() => setCarregando(false));
  }, []);

  const auth: Auth = {
    usuario,
    carregando,
    entrar: (t, u, lembrar) => {
      token.set(t, lembrar);
      setUsuario(u);
    },
    sair: () => {
      token.clear();
      setUsuario(null);
    },
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
  const { usuario, carregando } = useAuth();
  const location = useLocation();
  if (carregando) return <Loading />;
  if (!usuario) return <Navigate to="/login" replace state={{ de: location.pathname }} />;
  return <Outlet />;
}
