import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/** Moldura das páginas internas: menu lateral + barra superior. */
export function Layout() {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-60 min-w-0 print:ml-0">
        <Topbar />
        <div key={pathname} className="p-7 print:p-0 animate-page-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
