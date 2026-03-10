import { Bell, Settings, User, LogOut, Calculator } from "lucide-react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import { useState, useRef, useEffect } from "react";
import { useUser } from "../context/UserContext";

export default function Header() {
  const { profile } = useUser();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { label: "Dashboard", path: "/" },
    { label: "Clientes", path: "/clients" },
    { label: "Proyectos", path: "/projects" },
    { label: "Tablero", path: "/kanban" },
    { label: "Tiempos", path: "/timesheet" },
    { label: "Reportes", path: "/reports" },
    { label: "Finanzas", path: "/finance" },
    { label: "Stack Tech", path: "/tech-stack" },
  ];

  return (
    <header className="flex shrink-0 items-center justify-between w-full z-50 relative">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 200 60" className="h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="16" height="60" fill="#111111" />
          <text x="24" y="44" fontFamily="sans-serif" fontWeight="bold" fontSize="42" fill="#111111" letterSpacing="-0.05em">ingentia</text>
        </svg>
      </div>

      {/* Navigation Pill */}
      <nav className="hidden lg:flex items-center bg-white/40 backdrop-blur-md rounded-full p-1.5 shadow-sm border border-white/50">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                "px-5 py-2 rounded-full text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[#222222] text-white shadow-md"
                  : "text-[#4A4A4A] hover:text-[#111111] hover:bg-white/50"
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-3 ml-auto lg:ml-0" ref={dropdownRef}>
        <Link to="/smart-quoter" className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#222222] text-[#FFD166] hover:bg-black transition-colors text-sm font-bold shadow-md">
          <Calculator size={16} />
          <span className="hidden sm:inline">Smart Quoter</span>
        </Link>
        <Link to="/settings" className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-[#4A4A4A] hover:bg-white/60 transition-colors text-sm font-medium">
          <Settings size={18} />
          <span className="hidden sm:inline">Ajustes</span>
        </Link>

        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'notifications' ? null : 'notifications')}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-[#4A4A4A] hover:bg-white/60 transition-colors"
          >
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#FFD166] rounded-full border border-white"></span>
          </button>

          {activeDropdown === 'notifications' && (
            <div className="absolute right-0 mt-2 w-80 bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/40 shadow-xl overflow-hidden z-50">
              <div className="p-4 border-b border-black/5 flex justify-between items-center bg-white/50">
                <h3 className="font-medium text-[#1A1A1A]">Notificaciones</h3>
                <button className="text-xs text-[#666666] hover:text-[#1A1A1A]">Marcar leídas</button>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <div className="p-4 border-b border-black/5 hover:bg-white/40 transition-colors cursor-pointer">
                  <p className="text-sm text-[#1A1A1A] font-medium mb-1">Nuevo proyecto asignado</p>
                  <p className="text-xs text-[#666666]">Se te ha asignado al proyecto "Migración Cloud".</p>
                  <p className="text-[10px] text-[#666666] mt-2">Hace 5 min</p>
                </div>
                <div className="p-4 border-b border-black/5 hover:bg-white/40 transition-colors cursor-pointer">
                  <p className="text-sm text-[#1A1A1A] font-medium mb-1">Factura pagada</p>
                  <p className="text-xs text-[#666666]">TechCorp ha pagado la factura F-2024-089.</p>
                  <p className="text-[10px] text-[#666666] mt-2">Hace 2 horas</p>
                </div>
                <div className="p-4 border-b border-black/5 hover:bg-white/40 transition-colors cursor-pointer">
                  <p className="text-sm text-[#1A1A1A] font-medium mb-1">Alerta de Riesgo</p>
                  <p className="text-xs text-[#666666]">El proyecto "E-commerce B2B" tiene un C.M. negativo.</p>
                  <p className="text-[10px] text-[#666666] mt-2">Hace 5 horas</p>
                </div>
              </div>
              <div className="p-3 text-center bg-white/50 hover:bg-white/80 transition-colors cursor-pointer">
                <span className="text-sm font-medium text-[#1A1A1A]">Ver todas</span>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'user' ? null : 'user')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-[#4A4A4A] hover:bg-white/60 transition-colors overflow-hidden"
          >
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={18} />
            )}
          </button>

          {activeDropdown === 'user' && (
            <div className="absolute right-0 mt-2 w-56 bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/40 shadow-xl overflow-hidden z-50 p-2">
              <div className="px-4 py-3 border-b border-black/5 mb-2">
                <p className="text-sm font-medium text-[#1A1A1A]">{profile.firstName} {profile.lastName}</p>
                <p className="text-xs text-[#666666]">{profile.role}</p>
              </div>
              <Link to="/settings" onClick={() => setActiveDropdown(null)} className="flex items-center gap-2 px-4 py-2 text-sm text-[#4A4A4A] hover:text-[#1A1A1A] hover:bg-white/60 rounded-xl transition-colors">
                <User size={16} />
                Mi Perfil
              </Link>
              <Link to="/settings" onClick={() => setActiveDropdown(null)} className="flex items-center gap-2 px-4 py-2 text-sm text-[#4A4A4A] hover:text-[#1A1A1A] hover:bg-white/60 rounded-xl transition-colors">
                <Settings size={16} />
                Ajustes
              </Link>
              <div className="h-px bg-black/5 my-2"></div>
              <button onClick={() => navigate('/login')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                <LogOut size={16} />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
