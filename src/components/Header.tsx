import { Search, Bell, Plus, ChevronDown, User, LogOut, Settings as SettingsIcon, MessageSquare, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Header() {
  const { profile, signOut, isAdmin } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = ['/login', '/forgot-password', '/register'].includes(location.pathname);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    projects: any[],
    clients: any[],
    finances: any[]
  }>({ projects: [], clients: [], finances: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.length < 2) {
        setSearchResults({ projects: [], clients: [], finances: [] });
        setIsSearchOpen(false);
        return;
      }

      setIsSearching(true);
      setIsSearchOpen(true);

      try {
        const [projects, clients, finances] = await Promise.all([
          supabase.from('projects').select('id, name').ilike('name', `%${searchQuery}%`).limit(5),
          supabase.from('clients').select('id, name').ilike('name', `%${searchQuery}%`).limit(5),
          supabase.from('finances').select('id, description, amount, currency').ilike('description', `%${searchQuery}%`).limit(5)
        ]);

        setSearchResults({
          projects: projects.data || [],
          clients: clients.data || [],
          finances: finances.data || []
        });
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchNotifications();
    
    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'system_notifications' 
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('system_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setNotifications(data || []);
      setHasUnread(data?.some(n => !n.is_read) || false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleOpenNotifications = async () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    if (!isNotificationsOpen && hasUnread) {
      // Opcional: Marcar como leídas al abrir
      setHasUnread(false);
    }
  };

  const markAllRead = async () => {
    try {
      const { error } = await supabase
        .from('system_notifications')
        .update({ is_read: true })
        .eq('is_read', false);
      
      if (error) throw error;
      fetchNotifications();
    } catch (error) {
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('system_notifications')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = async (n: any) => {
    // 1. Marcar como leída si no lo está
    if (!n.is_read) {
      try {
        await supabase
          .from('system_notifications')
          .update({ is_read: true })
          .eq('id', n.id);
        fetchNotifications();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // 2. Cerrar menú
    setIsNotificationsOpen(false);

    // 3. Navegar según el tipo
    switch (n.type) {
      case 'invoice': navigate('/finance'); break;
      case 'project': navigate('/projects'); break;
      case 'client': navigate('/clients'); break;
      case 'quote': navigate('/clients'); break;
      case 'system': navigate('/settings'); break;
      default: break;
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (isAuthPage) return null;

  return (
    <header className="h-20 bg-white/60 backdrop-blur-xl border-b border-white/40 px-8 flex items-center justify-between sticky top-0 z-40">
      {/* Left Search */}
      <div className="flex-1 max-w-md relative" ref={searchRef}>
        <div className="relative group">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isSearchOpen ? 'text-[#1A1A1A]' : 'text-[#999999]'}`} size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setIsSearchOpen(true)}
            placeholder="Buscar proyectos, clientes, facturas..." 
            className="w-full h-11 bg-white/40 border border-white/60 rounded-full pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#FFD166]/50 focus:border-[#FFD166]/50 transition-all font-medium text-sm text-[#1A1A1A] placeholder:text-[#999999]"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-[#FFD166] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && (searchQuery.length >= 2) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-black/5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
            <div className="max-h-[480px] overflow-y-auto custom-scrollbar p-2">
              {searchResults.projects.length === 0 && searchResults.clients.length === 0 && searchResults.finances.length === 0 && !isSearching ? (
                <div className="p-8 text-center text-sm text-[#999999] italic">No se encontraron resultados para "{searchQuery}"</div>
              ) : (
                <>
                  {searchResults.projects.length > 0 && (
                    <div className="mb-2">
                      <p className="px-4 py-2 text-[10px] font-bold text-[#999999] uppercase tracking-widest">Proyectos</p>
                      {searchResults.projects.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { navigate('/projects'); setIsSearchOpen(false); setSearchQuery(''); }}
                          className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-black/5 text-sm text-[#1A1A1A] transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">P</div>
                          <span className="font-medium truncate">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.clients.length > 0 && (
                    <div className="mb-2">
                      <p className="px-4 py-2 text-[10px] font-bold text-[#999999] uppercase tracking-widest">Clientes</p>
                      {searchResults.clients.map(c => (
                        <button
                          key={c.id}
                          onClick={() => { navigate('/clients'); setIsSearchOpen(false); setSearchQuery(''); }}
                          className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-black/5 text-sm text-[#1A1A1A] transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">C</div>
                          <span className="font-medium truncate">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.finances.length > 0 && (
                    <div>
                      <p className="px-4 py-2 text-[10px] font-bold text-[#999999] uppercase tracking-widest">Finanzas</p>
                      {searchResults.finances.map(f => (
                        <button
                          key={f.id}
                          onClick={() => { navigate('/finance'); setIsSearchOpen(false); setSearchQuery(''); }}
                          className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-black/5 text-sm text-[#1A1A1A] transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">F</div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium truncate">{f.description}</span>
                            <span className="text-[10px] text-[#666666]">{f.currency} {f.amount}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="p-3 bg-black/5 border-t border-black/5 text-center">
              <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">Presiona Esc para cerrar</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <div className="relative group mr-2">
              <button className="h-11 bg-[#222222] hover:bg-black text-white px-6 rounded-full flex items-center gap-2 transition-all shadow-lg shadow-black/10 active:scale-95 group">
                <Plus size={18} className="transition-transform group-hover:rotate-90" />
                <span className="text-sm font-medium">Crear</span>
              </button>
              
              {/* Quick Actions Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-black/5 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <Link to="/projects/new" className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-black/5 text-sm font-medium text-[#1A1A1A] transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">P</div>
                    Nuevo Proyecto
                  </Link>
                  <Link to="/clients/new" className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-black/5 text-sm font-medium text-[#1A1A1A] transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">C</div>
                    Nuevo Cliente
                  </Link>
                  <Link to="/finance/new-invoice" className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-black/5 text-sm font-medium text-[#1A1A1A] transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">F</div>
                    Nueva Factura
                  </Link>
              </div>
            </div>
          )}

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={handleOpenNotifications}
              className="w-11 h-11 bg-white border border-black/5 rounded-full flex items-center justify-center text-[#666666] hover:text-[#1A1A1A] hover:bg-black/5 transition-all relative"
            >
              <Bell size={20} />
              {hasUnread && notifications.length > 0 && (
                <span className="absolute top-3 right-3 w-2 h-2 bg-[#FFD166] rounded-full border-2 border-white"></span>
              )}
            </button>

            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsNotificationsOpen(false)}></div>
                <div className="absolute right-0 top-full mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-black/5 overflow-hidden animate-in slide-in-from-top-4 duration-300 z-20">
                  <div className="p-4 border-b border-black/5 flex justify-between items-center">
                    <h4 className="font-bold text-[#1A1A1A]">Notificaciones</h4>
                    <button 
                      onClick={markAllRead}
                      className="text-[10px] font-bold text-[#008fcd] uppercase tracking-widest hover:underline"
                    >
                      Limpiar todo
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-sm text-[#999999] italic">No tienes notificaciones pendientes</div>
                    ) : (
                      notifications.map(n => {
                        const date = new Date(n.created_at);
                        const diff = Math.floor((new Date().getTime() - date.getTime()) / 60000);
                        const timeStr = diff < 1 ? 'Ahora' : diff < 60 ? `Hace ${diff} min` : diff < 1440 ? `Hace ${Math.floor(diff/60)}h` : date.toLocaleDateString();

                        const typeConfig = {
                          invoice: { bg: 'bg-emerald-100', text: 'text-emerald-600', icon: Bell },
                          project: { bg: 'bg-sky-100', text: 'text-sky-600', icon: Plus },
                          quote: { bg: 'bg-amber-100', text: 'text-amber-600', icon: MessageSquare },
                          client: { bg: 'bg-purple-100', text: 'text-purple-600', icon: User },
                          system: { bg: 'bg-gray-100', text: 'text-gray-600', icon: Bell },
                          info: { bg: 'bg-blue-100', text: 'text-blue-600', icon: MessageSquare }
                        };

                        const config = typeConfig[n.type as keyof typeof typeConfig] || typeConfig.info;
                        const Icon = config.icon;

                        return (
                          <div 
                            key={n.id} 
                            onClick={() => handleNotificationClick(n)}
                            className={`p-4 flex gap-4 hover:bg-black/5 transition-colors cursor-pointer border-b border-black/5 relative group/item ${!n.is_read ? 'bg-black/[0.02]' : ''}`}
                          >
                            {!n.is_read && <div className="absolute top-4 right-4 w-2 h-2 bg-[#FFD166] rounded-full"></div>}
                            
                            <button 
                              onClick={(e) => deleteNotification(n.id, e)}
                              className="absolute bottom-4 right-4 p-1.5 text-[#999999] hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={14} />
                            </button>

                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.bg} ${config.text}`}>
                              <Icon size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#1A1A1A]">{n.title}</p>
                              <p className="text-xs text-[#666666] mt-1 leading-relaxed">{n.content}</p>
                              <p className="text-[10px] text-[#999999] mt-2 font-bold uppercase tracking-wider">{timeStr}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <button 
                    onClick={() => setIsNotificationsOpen(false)}
                    className="w-full py-3 text-xs font-bold text-[#666666] bg-black/5 hover:bg-black/10 transition-colors uppercase tracking-[0.2em]"
                  >
                    Ver todas las notificaciones
                  </button>
                </div>
              </>
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
               {profile?.avatar_url ? (
                 <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 `${profile?.first_name?.[0] || 'U'}${profile?.last_name?.[0] || ''}`
               )}
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-bold text-[#1A1A1A] leading-none">{profile?.first_name || 'Usuario'}</span>
              <span className="text-[10px] font-medium text-[#666666] mt-1">{profile?.role || 'Project Manager'}</span>
            </div>
            <ChevronDown size={14} className={`text-[#999999] transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-4 w-64 bg-white rounded-3xl shadow-2xl border border-black/5 p-2 overflow-hidden animate-in slide-in-from-top-4 duration-300">
               <div className="p-3 mb-2 border-b border-black/5">
                  <p className="text-xs font-bold text-[#999999] uppercase tracking-widest mb-1">Empresa</p>
                  <p className="text-sm font-bold text-[#1A1A1A]">Ingentia Digital Studio</p>
               </div>
               <Link to="/settings" className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-black/5 text-sm font-medium text-[#1A1A1A] transition-colors" onClick={() => setIsProfileOpen(false)}>
                  <User size={18} className="text-[#666666]" />
                  Mi Perfil
               </Link>
               <Link to="/settings#config" className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-black/5 text-sm font-medium text-[#1A1A1A] transition-colors" onClick={() => setIsProfileOpen(false)}>
                  <SettingsIcon size={18} className="text-[#666666]" />
                  Ajustes
               </Link>
               <div className="h-px bg-black/5 my-2"></div>
               <button 
                onClick={handleLogout}
                className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-rose-50 text-sm font-medium text-rose-600 transition-colors text-left"
               >
                  <LogOut size={18} />
                  Cerrar Sesión
               </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
