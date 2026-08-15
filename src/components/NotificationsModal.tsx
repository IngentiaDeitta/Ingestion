import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Bell, 
  Check, 
  Trash2, 
  Search, 
  Filter, 
  Calendar, 
  FileText, 
  BarChart2, 
  Zap, 
  Plus, 
  MessageSquare, 
  User, 
  ArrowUpRight, 
  CheckCheck,
  Clock,
  Sparkles,
  Inbox
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateCount?: () => void;
}

type NotificationCategory = 'all' | 'unread' | 'projects' | 'finance' | 'clients' | 'came';

export default function NotificationsModal({ isOpen, onClose, onUpdateCount }: NotificationsModalProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAllNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const fetchAllNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching all notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const { error } = await supabase
        .from('system_notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      if (onUpdateCount) onUpdateCount();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      const { error } = await supabase
        .from('system_notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      if (onUpdateCount) onUpdateCount();
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setIsMarkingAll(false);
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

      setNotifications(prev => prev.filter(n => n.id !== id));
      if (onUpdateCount) onUpdateCount();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm('¿Deseas eliminar todas las notificaciones?')) return;
    try {
      const { error } = await supabase
        .from('system_notifications')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      setNotifications([]);
      if (onUpdateCount) onUpdateCount();
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const handleNotificationClick = async (n: any) => {
    if (!n.is_read) {
      await markAsRead(n.id);
    }
    onClose();

    // Navegar según el tipo
    switch (n.type) {
      case 'invoice':
        navigate('/finance');
        break;
      case 'project':
        navigate('/projects');
        break;
      case 'client':
      case 'quote':
        navigate('/clients');
        break;
      case 'came_evento':
      case 'came_boletin':
      case 'came_ipip':
      case 'came_novedad':
        navigate('/dashboard');
        break;
      case 'system':
      default:
        navigate('/settings');
        break;
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // Category filter
      if (activeCategory === 'unread' && n.is_read) return false;
      if (activeCategory === 'projects' && n.type !== 'project') return false;
      if (activeCategory === 'finance' && n.type !== 'invoice') return false;
      if (activeCategory === 'clients' && !['client', 'quote'].includes(n.type)) return false;
      if (activeCategory === 'came' && !['came_evento', 'came_boletin', 'came_ipip', 'came_novedad'].includes(n.type)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (n.title || '').toLowerCase().includes(q);
        const contentMatch = (n.content || '').toLowerCase().includes(q);
        return titleMatch || contentMatch;
      }

      return true;
    });
  }, [notifications, activeCategory, searchQuery]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

  const typeConfig = {
    invoice: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20', icon: Bell, tag: 'Finanzas' },
    project: { bg: 'bg-sky-500/10', text: 'text-sky-600', border: 'border-sky-500/20', icon: Plus, tag: 'Proyectos' },
    quote: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20', icon: MessageSquare, tag: 'Cotización' },
    client: { bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-500/20', icon: User, tag: 'Clientes' },
    system: { bg: 'bg-gray-500/10', text: 'text-gray-600', border: 'border-gray-500/20', icon: Bell, tag: 'Sistema' },
    info: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20', icon: MessageSquare, tag: 'Info' },
    came_evento: { bg: 'bg-purple-500/10', text: 'text-purple-700', border: 'border-purple-500/20', icon: Calendar, tag: 'Radar CAME' },
    came_boletin: { bg: 'bg-blue-500/10', text: 'text-blue-700', border: 'border-blue-500/20', icon: FileText, tag: 'Boletín' },
    came_ipip: { bg: 'bg-emerald-500/10', text: 'text-emerald-700', border: 'border-emerald-500/20', icon: BarChart2, tag: 'IPIP CAME' },
    came_novedad: { bg: 'bg-amber-500/10', text: 'text-amber-700', border: 'border-amber-500/20', icon: Zap, tag: 'Novedad CAME' }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 z-50 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-black/10 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 md:p-6 border-b border-black/5 flex items-center justify-between gap-4 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#008fcd]/10 text-[#008fcd] flex items-center justify-center font-bold">
              <Bell size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#1A1A1A]">Centro de Notificaciones</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-[#FFD166] text-[#1A1A1A] rounded-full">
                    {unreadCount} sin leer
                  </span>
                )}
              </div>
              <p className="text-xs text-[#666666]">
                Historial completo de alertas, eventos y actualizaciones del sistema
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={isMarkingAll}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-black/10 text-xs font-bold text-[#008fcd] hover:bg-[#008fcd]/5 transition-all shadow-xs"
              >
                <CheckCheck size={14} />
                <span>Marcar leídas</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full hover:bg-black/5 flex items-center justify-center text-[#666666] hover:text-[#1A1A1A] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 border-b border-black/5 flex flex-col sm:flex-row gap-3 bg-white">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999999]" />
            <input
              type="text"
              placeholder="Buscar en notificaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-black/[0.03] border border-black/5 rounded-xl text-[#1A1A1A] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#008fcd]/30 focus:border-[#008fcd]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#1A1A1A]"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Quick Actions (Mobile view) */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="sm:hidden flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#008fcd]/10 text-xs font-bold text-[#008fcd]"
            >
              <CheckCheck size={14} />
              <span>Marcar todas como leídas</span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="px-4 py-2.5 border-b border-black/5 bg-zinc-50/70 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Todas', count: notifications.length },
            { id: 'unread', label: 'Sin leer', count: unreadCount },
            { id: 'projects', label: 'Proyectos', count: notifications.filter(n => n.type === 'project').length },
            { id: 'finance', label: 'Finanzas', count: notifications.filter(n => n.type === 'invoice').length },
            { id: 'clients', label: 'Leads / Clientes', count: notifications.filter(n => ['client', 'quote'].includes(n.type)).length },
            { id: 'came', label: 'Radar CAME', count: notifications.filter(n => ['came_evento', 'came_boletin', 'came_ipip', 'came_novedad'].includes(n.type)).length },
          ].map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as NotificationCategory)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive 
                    ? 'bg-[#1A1A1A] text-white shadow-xs' 
                    : 'bg-white border border-black/5 text-[#666666] hover:text-[#1A1A1A] hover:bg-black/5'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  isActive ? 'bg-white/20 text-white font-bold' : 'bg-black/5 text-[#666666]'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Notification List Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-black/5 p-2 sm:p-4">
          {loading ? (
            <div className="p-12 text-center text-[#999999] flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-[#008fcd] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-medium">Cargando notificaciones...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-16 text-center text-[#999999] flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-full bg-black/[0.03] flex items-center justify-center text-[#999999]">
                <Inbox size={28} />
              </div>
              <p className="text-sm font-bold text-[#1A1A1A]">No hay notificaciones para mostrar</p>
              <p className="text-xs text-[#666666] max-w-sm">
                {searchQuery 
                  ? 'No se encontraron resultados para el término de búsqueda.' 
                  : 'Estás al día con todos tus proyectos, finanzas y actualizaciones.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const date = new Date(n.created_at);
              const now = new Date();
              const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
              const timeFormatted = diffMin < 1 
                ? 'Ahora' 
                : diffMin < 60 
                ? `Hace ${diffMin} min` 
                : diffMin < 1440 
                ? `Hace ${Math.floor(diffMin / 60)} h` 
                : date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

              const config = typeConfig[n.type as keyof typeof typeConfig] || typeConfig.info;
              const Icon = config.icon;

              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 rounded-2xl transition-all cursor-pointer flex gap-4 group relative my-1 ${
                    !n.is_read 
                      ? 'bg-sky-50/40 border border-sky-100 hover:bg-sky-50/70' 
                      : 'bg-white hover:bg-black/[0.02] border border-transparent'
                  }`}
                >
                  {/* Indicator Dot */}
                  {!n.is_read && (
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#008fcd]"></div>
                  )}

                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${config.bg} ${config.text} ${config.border}`}>
                    <Icon size={20} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${config.bg} ${config.text}`}>
                        {config.tag}
                      </span>
                      <span className="text-[11px] text-[#999999] flex items-center gap-1 font-medium">
                        <Clock size={11} />
                        {timeFormatted}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#1A1A1A] mt-1.5 leading-snug group-hover:text-[#008fcd] transition-colors">
                      {n.title}
                    </h4>

                    <p className="text-xs text-[#666666] mt-1 leading-relaxed line-clamp-2">
                      {n.content}
                    </p>
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute right-4 bottom-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.is_read && (
                      <button
                        onClick={(e) => markAsRead(n.id, e)}
                        title="Marcar como leída"
                        className="p-1.5 text-[#666666] hover:text-[#008fcd] hover:bg-[#008fcd]/10 rounded-lg transition-colors"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      onClick={(e) => deleteNotification(n.id, e)}
                      title="Eliminar notificación"
                      className="p-1.5 text-[#666666] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="p-1.5 text-[#666666] group-hover:text-[#008fcd] rounded-lg">
                      <ArrowUpRight size={14} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-black/5 bg-zinc-50/80 flex items-center justify-between text-xs text-[#666666]">
          <span className="text-[11px]">
            Mostrando {filteredNotifications.length} de {notifications.length} notificaciones
          </span>

          <div className="flex items-center gap-3">
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-[11px] font-bold text-red-500 hover:text-red-600 hover:underline flex items-center gap-1"
              >
                <Trash2 size={12} />
                <span>Vaciar historial</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#1A1A1A] text-white rounded-xl font-bold hover:bg-black transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
