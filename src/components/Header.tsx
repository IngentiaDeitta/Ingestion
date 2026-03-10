import { Search, Bell, Plus, ChevronDown, User, LogOut, Settings as SettingsIcon, MessageSquare, LogIn } from 'lucide-react';
import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const { profile } = useUser();
  const location = useLocation();
  const isAuthPage = ['/login', '/forgot-password', '/register'].includes(location.pathname);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  if (isAuthPage) return null;

  return (
    <header className="h-20 bg-white/60 backdrop-blur-xl border-b border-white/40 px-8 flex items-center justify-between sticky top-0 z-40">
      {/* Left Search */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999999] group-focus-within:text-[#1A1A1A] transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar proyectos, clientes, facturas..." 
            className="w-full h-11 bg-white/40 border border-white/60 rounded-full pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#FFD166]/50 focus:border-[#FFD166]/50 transition-all font-medium text-sm text-[#1A1A1A] placeholder:text-[#999999]"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          {/* Create Button */}
          <div className="relative group mr-2">
            <button className="h-11 bg-[#222222] hover:bg-black text-white px-6 rounded-full flex items-center gap-2 transition-all shadow-lg shadow-black/10 active:scale-95 group">
              <Plus size={18} className="transition-transform group-hover:rotate-90" />
              <span className="text-sm font-medium">Crear</span>
            </button>
            
            {/* Quick Actions Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-black/5 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0">
               <Link to="/new-project" className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-black/5 text-sm font-medium text-[#1A1A1A] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">P</div>
                  Nuevo Proyecto
               </Link>
               <Link to="/new-client" className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-black/5 text-sm font-medium text-[#1A1A1A] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">C</div>
                  Nuevo Cliente
               </Link>
               <Link to="/new-invoice" className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-black/5 text-sm font-medium text-[#1A1A1A] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">F</div>
                  Nueva Factura
               </Link>
            </div>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="w-11 h-11 bg-white border border-black/5 rounded-full flex items-center justify-center text-[#666666] hover:text-[#1A1A1A] hover:bg-black/5 transition-all relative"
            >
              <Bell size={20} />
              <span className="absolute top-3 right-3 w-2 h-2 bg-[#FFD166] rounded-full border-2 border-white"></span>
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 top-full mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-black/5 overflow-hidden animate-in slide-in-from-top-4 duration-300">
                <div className="p-4 border-b border-black/5 flex justify-between items-center">
                  <h4 className="font-bold text-[#1A1A1A]">Notificaciones</h4>
                  <button className="text-[10px] font-bold text-[#008fcd] uppercase tracking-widest">Marcar todo</button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                   <div className="p-4 flex gap-4 hover:bg-black/5 transition-colors cursor-pointer border-b border-black/5">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                         <Bell size={18} />
                      </div>
                      <div>
                         <p className="text-sm font-medium text-[#1A1A1A]">Nueva factura generada</p>
                         <p className="text-xs text-[#666666] mt-1">El proyecto 'E-commerce' ha generado la factura #412.</p>
                         <p className="text-[10px] text-[#999999] mt-2 font-bold uppercase">Hace 5 minutos</p>
                      </div>
                   </div>
                   <div className="p-4 flex gap-4 hover:bg-black/5 transition-colors cursor-pointer">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                         <MessageSquare size={18} />
                      </div>
                      <div>
                         <p className="text-sm font-medium text-[#1A1A1A]">Nuevo mensaje de cliente</p>
                         <p className="text-xs text-[#666666] mt-1">Juan Pérez ha respondido a la propuesta de presupuesto.</p>
                         <p className="text-[10px] text-[#999999] mt-2 font-bold uppercase">Hace 2 horas</p>
                      </div>
                   </div>
                </div>
                <button className="w-full py-3 text-xs font-bold text-[#666666] bg-black/5 hover:bg-black/10 transition-colors uppercase tracking-[0.2em]">Ver todas las notificaciones</button>
              </div>
            )}
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="w-px h-8 bg-black/5"></div>

        {/* User Profile */}
        <div className="relative">
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-1.5 pr-4 rounded-full bg-white border border-black/5 hover:bg-black/5 transition-all group"
          >
            <div className="w-9 h-9 rounded-full bg-[#222222] flex items-center justify-center text-white font-medium text-xs overflow-hidden">
               {profile.avatarUrl ? (
                 <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 `${profile.firstName[0]}${profile.lastName[0]}`
               )}
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-bold text-[#1A1A1A] leading-none">{profile.firstName}</span>
              <span className="text-[10px] font-medium text-[#666666] mt-1">{profile.role}</span>
            </div>
            <ChevronDown size={14} className={`text-[#999999] transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-4 w-64 bg-white rounded-3xl shadow-2xl border border-black/5 p-2 overflow-hidden animate-in slide-in-from-top-4 duration-300">
               <div className="p-3 mb-2 border-b border-black/5">
                  <p className="text-xs font-bold text-[#999999] uppercase tracking-widest mb-1">Empresa</p>
                  <p className="text-sm font-bold text-[#1A1A1A]">Ingentia Digital Studio</p>
               </div>
               <Link to="/settings" className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-black/5 text-sm font-medium text-[#1A1A1A] transition-colors">
                  <User size={18} className="text-[#666666]" />
                  Mi Perfil
               </Link>
               <Link to="/settings#config" className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-black/5 text-sm font-medium text-[#1A1A1A] transition-colors">
                  <SettingsIcon size={18} className="text-[#666666]" />
                  Ajustes
               </Link>
               <div className="h-px bg-black/5 my-2"></div>
               <Link to="/login" className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-rose-50 text-sm font-medium text-rose-600 transition-colors">
                  <LogOut size={18} />
                  Cerrar Sesión
               </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
