import { LayoutDashboard, Users, FolderKanban, FileText, PieChart, Calculator, Settings, Clock, LogOut, ChevronRight, Zap } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Calculator, label: 'Smart Quoter', path: '/smart-quoter' },
  { icon: FolderKanban, label: 'Proyectos', path: '/projects' },
  { icon: FileText, label: 'Finanzas', path: '/finance' },
  { icon: Users, label: 'Clientes', path: '/clients' },
  { icon: Clock, label: 'Timesheet', path: '/timesheet' },
  { icon: PieChart, label: 'Reportes', path: '/reports' },
  { icon: Zap, label: 'Tech Stack', path: '/tech-stack' },
];

export default function Sidebar() {
  const { profile } = useUser();

  return (
    <aside className="w-[280px] bg-white border-r border-black/5 flex flex-col sticky top-0 h-screen z-50">
      {/* Logo Section */}
      <div className="h-24 flex items-center px-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#222222] rounded-xl flex items-center justify-center text-white shadow-lg shadow-black/10">
            <div className="w-5 h-5 bg-white rounded-md"></div>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-[#1A1A1A]">Ingent<span className="text-[#FFD166]">IA</span></h1>
            <span className="text-[10px] font-bold text-[#666666] tracking-[0.2em] uppercase leading-none">Management</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-[10px] font-bold text-[#999999] uppercase tracking-[0.2em] mb-4">Menú Principal</p>
        
        {menuItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) => `
              flex items-center justify-between px-4 h-12 rounded-2xl transition-all duration-300 group
              ${isActive 
                ? 'bg-[#222222] text-white shadow-xl shadow-black/10 translate-x-1' 
                : 'text-[#666666] hover:bg-black/5 hover:text-[#1A1A1A]'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-[#FFD166]' : 'group-hover:scale-110 transition-transform'} />
                  <span className={`text-sm font-medium ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                </div>
                {isActive && <ChevronRight size={14} className="text-[#FFD166]" />}
              </>
            )}
          </NavLink>
        ))}

        <div className="mt-8">
          <p className="px-4 text-[10px] font-bold text-[#999999] uppercase tracking-[0.2em] mb-4">Sistema</p>
          <NavLink
            to="/settings"
            className={({ isActive }) => `
              flex items-center gap-3 px-4 h-12 rounded-2xl transition-all group
              ${isActive 
                ? 'bg-[#222222] text-white shadow-xl shadow-black/10 transition-all' 
                : 'text-[#666666] hover:bg-black/5 hover:text-[#1A1A1A]'}
            `}
          >
            <Settings size={20} />
            <span className="text-sm font-medium">Configuración</span>
          </NavLink>
        </div>
      </nav>

      {/* Profile Section */}
      <div className="p-4 mt-auto">
        <div className="bg-black/5 rounded-[32px] p-4 flex flex-col gap-4">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#222222] flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  `${profile.firstName[0]}${profile.lastName[0]}`
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#1A1A1A]">{profile.firstName} {profile.lastName}</span>
                <span className="text-[10px] font-medium text-[#666666]">{profile.role}</span>
              </div>
           </div>
           
           <NavLink to="/login" className="flex items-center justify-center gap-2 w-full h-11 bg-white hover:bg-rose-50 border border-black/5 rounded-2xl text-rose-600 transition-all group">
              <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-widest">Cerrar Sesión</span>
           </NavLink>
        </div>
      </div>
    </aside>
  );
}
