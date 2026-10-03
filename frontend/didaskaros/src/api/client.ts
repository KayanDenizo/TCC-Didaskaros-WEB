import axios from "axios";

const TOKEN_KEY = "didaskaros.token";

export const api = axios.create({ baseURL: "/api" });

/** Token fica no localStorage se "manter conectado", senão só na sessão da aba. */
export const token = {
  get: () => localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY),
  set: (valor: string, lembrar: boolean) => (lembrar ? localStorage : sessionStorage).setItem(TOKEN_KEY, valor),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  },
};

api.interceptors.request.use((config) => {
  const t = token.get();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(undefined, (err) => {
  // Sessão expirada: limpa e volta para o login
  if (err.response?.status === 401 && token.get()) {
    token.clear();
    window.location.assign("/painel");
  }
  return Promise.reject(err);
});

/** Mensagem legível de um erro da API. */
export function mensagemErro(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.response?.data?.erro) return err.response.data.erro;
    if (!err.response) return "Não foi possível falar com o servidor. O backend está rodando?";
  }
  return "Algo deu errado. Tente novamente.";
}
