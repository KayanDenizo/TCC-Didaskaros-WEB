import { Outlet, useLocation } from "react-router-dom";
import { PaletaComandos } from "./PaletaComandos";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/** Moldura das páginas internas: menu lateral + barra superior. */
export function Layout() {
  const { pathname } = useLocation();
  return (
    <div className="painel-fundo flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-60 min-w-0 print:ml-0">
        <Topbar />
        <div key={pathname} className="p-7 print:p-0 animate-page-in">
          <Outlet />
        </div>
      </main>
      <PaletaComandos />
    </div>
  );
}
