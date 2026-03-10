import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  DollarSign,
  Settings,
  LogOut,
  Kanban as KanbanIcon,
  Clock,
  BarChart2,
} from "lucide-react";
import { clsx } from "clsx";

export default function Sidebar() {
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Users, label: "Clientes", path: "/clients" },
    { icon: FolderOpen, label: "Proyectos", path: "/projects" },
    { icon: KanbanIcon, label: "Tablero", path: "/kanban" },
    { icon: Clock, label: "Tiempos", path: "/timesheet" },
    { icon: BarChart2, label: "Reportes", path: "/reports" },
    { icon: DollarSign, label: "Finanzas", path: "/finance" },
  ];

  return (
    <aside className="hidden w-72 flex-col border-r border-[#1A1A1A]/5 bg-white/60 backdrop-blur-xl lg:flex shrink-0 z-20">
      <div className="flex h-24 items-center px-8">
        <Link to="/" className="flex items-center gap-3">
          <svg viewBox="0 0 200 60" className="h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="16" height="60" fill="#111111" />
            <text x="24" y="44" fontFamily="sans-serif" fontWeight="bold" fontSize="42" fill="#111111" letterSpacing="-0.05em">ingentia</text>
          </svg>
        </Link>
      </div>

      <div className="flex flex-1 flex-col justify-between p-6 overflow-y-auto">
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#222222] text-white shadow-lg shadow-black/10 scale-[1.02]"
                    : "text-[#666666] hover:bg-white/80 hover:text-[#1A1A1A]"
                )
              }
            >
              <item.icon size={20} className={clsx("transition-transform", "group-hover:scale-110")} />
              <span>{item.label}</span>
              {item.label === "Dashboard" && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FFD166]"></span>
              )}
            </NavLink>
          ))}

          <div className="my-4 h-px bg-[#1A1A1A]/5 mx-2" />

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[#222222] text-white shadow-lg shadow-black/10"
                  : "text-[#666666] hover:bg-white/80 hover:text-[#1A1A1A]"
              )
            }
          >
            <Settings size={20} />
            <span>Configuración</span>
          </NavLink>
        </nav>

        <div className="mt-8 flex flex-col gap-4">
          <NavLink
            to="/login"
            className="flex w-full items-center justify-center gap-3 rounded-2xl h-12 px-4 bg-[#1A1A1A]/5 hover:bg-red-50 text-[#666666] hover:text-red-600 text-sm font-semibold transition-all"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </NavLink>

          <div className="flex items-center gap-3 rounded-3xl border border-white/50 bg-white/40 p-4 shadow-sm backdrop-blur-md">
            <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-sm">
              <img
                alt="User Avatar"
                className="h-full w-full object-cover"
                src="https://i.pravatar.cc/150?u=maria"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-sm font-bold text-[#1A1A1A]">
                María García
              </span>
              <span className="truncate text-[10px] uppercase tracking-wider font-bold text-[#666666]">
                Administrator
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
