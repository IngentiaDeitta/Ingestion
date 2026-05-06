import { LayoutDashboard, Users, FolderKanban, FileText, Calculator, Settings, Clock, LogOut, ChevronRight, Zap, CheckSquare, Microscope } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: CheckSquare, label: 'Tareas', path: '/kanban' },
  { icon: Calculator, label: 'Smart Quoter', path: '/smart-quoter' },
  { icon: FolderKanban, label: 'Proyectos', path: '/projects' },
  { icon: FileText, label: 'Finanzas', path: '/finance' },
  { icon: Users, label: 'Equipo', path: '/team' },
  { icon: Users, label: 'Clientes', path: '/clients' },
  { icon: Zap, label: 'Tech Stack', path: '/tech-stack' },
];

export default function Sidebar() {
  const { profile, signOut } = useUser();

  return (
    <aside className="w-[280px] bg-white border-r border-black/5 flex flex-col sticky top-0 h-screen z-50">
      {/* Logo Section - Fixed at 58px as per branding requirements */}
      <div className="h-24 flex items-center justify-center px-8 border-b border-black/[0.02]">
        <img 
          src="/Recursos/Logo Blanco_T.png" 
          alt="Ingentia Management" 
          className="h-[58px] w-auto object-contain"
        />
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
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  `${profile?.first_name?.[0] || 'U'}${profile?.last_name?.[0] || ''}`
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#1A1A1A]">{profile?.first_name || 'Usuario'} {profile?.last_name || ''}</span>
                <span className="text-[10px] font-medium text-[#666666]">{profile?.role || 'Project Manager'}</span>
              </div>
           </div>
           
           <button 
             onClick={() => signOut()}
             className="flex items-center justify-center gap-2 w-full h-11 bg-white hover:bg-rose-50 border border-black/5 rounded-2xl text-rose-600 transition-all group"
           >
             <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
             <span className="text-xs font-bold uppercase tracking-widest">Cerrar Sesión</span>
           </button>
        </div>
      </div>
    </aside>
  );
}
