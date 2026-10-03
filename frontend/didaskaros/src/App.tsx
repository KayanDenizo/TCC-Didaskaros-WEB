import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { RequireAuth } from "./auth/AuthContext";
import { Layout } from "./components/Layout";
import type { RouteHandle } from "./components/Topbar";
import CadastroCoordenador from "./pages/CadastroCoordenador";
import Disciplinas from "./pages/Disciplinas";
import GerarGrade from "./pages/GerarGrade";
import Grades from "./pages/Grades";
import Painel from "./pages/Painel";
import Perfil from "./pages/Perfil";
import Professores from "./pages/Professores";
import Salas from "./pages/Salas";
import Turmas from "./pages/Turmas";

const pagina = (path: string, element: React.ReactNode, handle: RouteHandle) => ({ path, element, handle });

const router = createBrowserRouter([
  { path: "/cadastro", element: <CadastroCoordenador /> },
  {
    element: <RequireAuth />,
    children: [{
      element: <Layout />,
      children: [
        pagina("/painel", <Painel />, { title: "Painel Principal" }),
        pagina("/grades", <Grades />, { title: "Grades Horárias", section: "Planejamento" }),
        pagina("/gerar-grade", <GerarGrade />, { title: "Gerar Grade", section: "Planejamento" }),
        pagina("/professores", <Professores />, { title: "Professores", section: "Cadastros" }),
        pagina("/turmas", <Turmas />, { title: "Turmas", section: "Cadastros" }),
        pagina("/disciplinas", <Disciplinas />, { title: "Disciplinas", section: "Cadastros" }),
        pagina("/salas", <Salas />, { title: "Salas", section: "Cadastros" }),
        pagina("/perfil", <Perfil />, { title: "Meu Perfil", section: "Conta" }),
      ],
    }],
  },
  { path: "*", element: <Navigate to="/painel" replace /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
