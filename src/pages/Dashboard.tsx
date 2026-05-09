import {
  DollarSign, TrendingUp, Clock, Zap, AlertTriangle,
  ChevronRight, BarChart2, Users as UsersIcon, Folder as FolderIcon,
  ArrowUpRight
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { mockStats } from '../data/mockData';
import exchangeRates from '../data/exchange_rates.json';

interface Stats {
  totalClients: number;
  totalProjects: number;
  totalTasks: number;
  projectsAtRisk: number;
  portfolioHealth: number;
  totalRevenue: number;
  totalBalance: number;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  avgProposalDays: number;
  conversionRate: number;
  avgProjectDuration: number;
}

export default function Dashboard() {
  const { profile } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    totalProjects: 0,
    totalTasks: 0,
    projectsAtRisk: 0,
    portfolioHealth: 100,
    totalRevenue: 0,
    totalBalance: 0,
    totalHours: 0,
    billableHours: 0,
    nonBillableHours: 0,
    avgProposalDays: 14,
    conversionRate: 0,
    avgProjectDuration: 45,
  });
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [
        { count: clientsCount },
        { data: projectsData },
        { data: tasksData },
        { data: financesData },
        { data: teamData },
      ] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('id, name, status, budget, outcome'),
        supabase.from('tasks').select('*'),
        supabase.from('finances').select('amount, type, currency'),
        supabase.from('team').select('*'),
      ]);

      const atRiskCount = projectsData?.filter(p => p.status === 'En Riesgo').length ?? 0;
      const totalProjects = projectsData?.filter(p => !['Completado', 'Finalizado', 'Perdido', 'Cancelado'].includes(p.status)).length ?? 0;
      const totalBudget = projectsData?.reduce((a, p) => a + (p.budget || 0), 0) ?? 0;
      const health = totalProjects > 0 ? Math.round(((totalProjects - atRiskCount) / totalProjects) * 100) : 100;

      let totalEstimatedHours = 0;
      let totalActualHours = 0;

      (tasksData || []).forEach((t: any) => {
        const est = Number(t.hours) || 0;
        const act = Number(t.actual_hours) || 0;
        totalEstimatedHours += est;
        totalActualHours += act;
      });

      const totalHours = Number(totalActualHours.toFixed(1));
      const hoursGap = totalActualHours - totalEstimatedHours;

      setAllTasks(tasksData || []);
      setTeam(teamData || []);

      //── Notificaciones para Tareas Próximas a Vencer ──
      const checkTaskAlerts = async () => {
        const today = new Date();
        today.setHours(0,0,0,0);
        const todayStr = today.toISOString().split('T')[0];
        
        for (const task of (tasksData || [])) {
          if (task.status === 'done' || !task.due_date) continue;
          
          const taskDateStr = task.due_date.split('T')[0];
          const [y, m, d] = taskDateStr.split('-').map(Number);
          const dueDate = new Date(y, m - 1, d);
          const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          let alertTitle = '';
          let alertContent = '';

          if (taskDateStr === todayStr) {
            alertTitle = '🚨 Tarea vence HOY';
            alertContent = `Atención: La tarea "${task.title}" vence hoy mismo.`;
          } else if (diffDays > 0 && diffDays <= 3) {
            alertTitle = 'Tarea próxima a vencer';
            alertContent = `La tarea "${task.title}" vence en ${diffDays} días.`;
          }

          if (alertTitle) {
            // Verificar si ya existe una notificación para esta tarea con este título hoy
            const { data: existing } = await supabase
              .from('system_notifications')
              .select('id')
              .eq('title', alertTitle)
              .ilike('content', `%${task.title}%`)
              .limit(1);

            if (!existing || existing.length === 0) {
              await supabase.from('system_notifications').insert([{
                title: alertTitle,
                content: alertContent,
                type: 'info',
                is_read: false
              }]);
            }
          }
        }
      };
      checkTaskAlerts();

      const EXCHANGE_RATES = {
        USD: Number(import.meta.env.VITE_EXCHANGE_RATE_USD || exchangeRates.USD || 1405),
        EUR: Number(import.meta.env.VITE_EXCHANGE_RATE_EUR || exchangeRates.EUR || 1665),
        ARS: 1
      };

      let totalBalanceARS = 0;
      (financesData || []).forEach((t: any) => {
        const currency = t.currency || 'USD';
        const rate = EXCHANGE_RATES[currency as keyof typeof EXCHANGE_RATES] || 1;
        const amt = parseFloat(t.amount) * rate;
        totalBalanceARS += t.type === 'income' ? amt : -amt;
      });

      const won = projectsData?.filter(p => p.outcome === 'Ganado').length ?? 0;
      const conversionRate = totalProjects > 0 ? Math.round((won / totalProjects) * 100) : 0;

      setStats({
        totalClients: clientsCount ?? 0,
        totalProjects,
        totalTasks: (tasksData || []).length,
        projectsAtRisk: atRiskCount,
        portfolioHealth: health,
        totalRevenue: totalBudget,
        totalBalance: totalBalanceARS,
        totalHours,
        billableHours: totalEstimatedHours, // Re-utilizando campo para estimado
        nonBillableHours: hoursGap, // Re-utilizando campo para gap
        avgProposalDays: 14,
        conversionRate,
        avgProjectDuration: 45,
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-8 w-full max-w-[1400px] mx-auto pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col gap-6">
        <h1 className="text-4xl md:text-[42px] font-normal tracking-tight text-[#1A1A1A]">
          Hola, {profile?.first_name || 'Usuario'}!
        </h1>

        <div className="flex flex-wrap items-center gap-x-12 gap-y-6">
          <div className="flex flex-col gap-2 min-w-[120px]">
            <span className="text-sm text-[#666666]">Salud Global</span>
            <div className="h-8 w-28 bg-[#222222] rounded-full flex items-center px-3 text-white text-xs font-medium">
              {stats.portfolioHealth}%
            </div>
          </div>
          <div className="flex flex-col gap-2 min-w-[120px] cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/finance')}>
            <span className="text-sm text-[#666666]">Balance Total</span>
            <div className={`h-8 w-28 bg-[#FFD166] rounded-full flex items-center px-3 text-xs font-medium ${stats.totalBalance < 0 ? 'text-red-600' : 'text-[#222222]'}`}>
              ${(stats.totalBalance / 1_000_000).toFixed(2)}M
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-1 min-w-[200px] cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/kanban')}>
            <span className="text-sm text-[#666666]">Tareas Activas</span>
            <div className="h-8 w-full max-w-[300px] bg-white/40 rounded-full overflow-hidden">
              <div className="h-full bg-white/60 flex items-center px-3 text-[#222222] text-xs font-medium" style={{ width: '100%' }}>
                {stats.totalTasks} tareas cargadas
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 min-w-[120px]">
            <span className="text-sm text-[#666666]">En Riesgo</span>
            <div className={`h-8 w-28 border ${stats.projectsAtRisk > 0 ? 'bg-red-50 border-red-200' : 'border-[#222222]/20'} rounded-full flex items-center px-3 text-[#222222] text-xs font-medium`}>
              {stats.projectsAtRisk} proyectos
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-8 ml-0 md:ml-auto w-full md:w-auto justify-between md:justify-end mt-4 md:mt-0">
            <div className="flex items-baseline gap-2 cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate('/clients')}>
              <span className="text-[#666666] text-sm flex items-center gap-1"><UsersIcon size={14} /> Clientes</span>
              <span className="text-5xl font-light text-[#1A1A1A]">{stats.totalClients}</span>
            </div>
            <div className="flex items-baseline gap-2 cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate('/projects')}>
              <span className="text-[#666666] text-sm flex items-center gap-1"><FolderIcon size={14} /> Proyectos</span>
              <span className="text-5xl font-light text-[#1A1A1A]">{stats.totalProjects}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 1: KPI Cards (6 metrics from Reports) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Balance Total */}
        <div
          className="bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-white/40 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/finance')}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-white rounded-xl shadow-sm"><DollarSign size={20} /></div>
            <span className="flex items-center text-[#1A1A1A] bg-[#FFD166] px-2.5 py-0.5 rounded-full text-xs font-bold">
              <ArrowUpRight size={12} className="mr-0.5" />+{mockStats.revenueGrowth}%
            </span>
          </div>
          <p className="text-[#666666] text-xs font-medium mb-1">Balance Consolidado (ARS)</p>
          <h4 className={`text-3xl font-light ${stats.totalBalance < 0 ? 'text-red-500' : 'text-[#1A1A1A]'}`}>
            ${(stats.totalBalance / 1_000_000).toFixed(2)}M
          </h4>
        </div>

        {/* Salud del Portfolio */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-white/40 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-white rounded-xl shadow-sm"><TrendingUp size={20} /></div>
            <span className="text-[#1A1A1A] bg-[#FFD166] px-2.5 py-0.5 rounded-full text-xs font-bold">+2.4%</span>
          </div>
          <p className="text-[#666666] text-xs font-medium mb-1">Salud del Portfolio</p>
          <h4 className="text-3xl font-light text-[#1A1A1A]">{stats.portfolioHealth}%</h4>
        </div>

        {/* Productividad (Gap de Horas) */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-white/40 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/kanban')}>
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-white rounded-xl shadow-sm"><Clock size={20} /></div>
            <div className="flex flex-col items-end">
              <span className="text-[#666666] text-[10px] font-bold">Plan: {stats.billableHours}h</span>
              <span className={`${stats.nonBillableHours > 0 ? 'text-red-500' : 'text-emerald-500'} text-[10px] font-bold`}>
                Gap: {stats.nonBillableHours > 0 ? '+' : ''}{stats.nonBillableHours}h
              </span>
            </div>
          </div>
          <p className="text-[#666666] text-xs font-medium mb-1">Horas Reales Totales</p>
          <h4 className="text-3xl font-light text-[#1A1A1A]">{stats.totalHours}h</h4>
        </div>

        {/* Velocidad Comercial */}
        <div className="bg-[#222222] text-white rounded-[28px] p-5 shadow-xl">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-white/10 rounded-xl"><Zap size={20} className="text-[#FFD166]" /></div>
            <div className="text-right text-white/40 text-[10px] font-bold uppercase tracking-widest">Velocidad</div>
          </div>
          <p className="text-white/60 text-xs font-medium mb-1">Velocidad Comercial</p>
          <h4 className="text-3xl font-light">{stats.avgProposalDays}d</h4>
        </div>

        {/* Rate de Conversión */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-white/40 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-[#FFD166]/10 rounded-xl"><TrendingUp size={20} className="text-[#1A1A1A]" /></div>
          </div>
          <p className="text-[#666666] text-xs font-medium mb-1">Rate de Conversión</p>
          <h4 className="text-3xl font-light text-[#1A1A1A]">{stats.conversionRate}%</h4>
        </div>

        {/* Ciclo de Ejecución */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-white/40 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-black/5 rounded-xl"><Clock size={20} /></div>
          </div>
          <p className="text-[#666666] text-xs font-medium mb-1">Ciclo de Ejecución</p>
          <h4 className="text-3xl font-light text-[#1A1A1A]">{stats.avgProjectDuration}d</h4>
        </div>
      </div>

      {/* ── Row 2: Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Profile */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-4 shadow-sm border border-white/40 relative overflow-hidden group">
            <div className="aspect-[4/5] rounded-[24px] overflow-hidden mb-4 relative bg-[#1A1A1A] flex items-center justify-center">
              <svg className="absolute top-0 right-0 w-full h-full" viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg">
                <circle cx="150" cy="50" r="100" fill="#2A2A2A" />
                <circle cx="150" cy="50" r="75"  fill="#333333" />
                <circle cx="150" cy="50" r="50"  fill="#D4A353" />
                <path d="M-20 200 Q 80 160 220 220 L 220 280 L -20 280 Z" fill="#222222" />
                <path d="M-20 230 Q 100 190 220 250 L 220 280 L -20 280 Z" fill="#2A2A2A" />
              </svg>
              <div className="z-10 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-[#2A2A2A] rounded-2xl border border-white/10 flex items-center justify-center shadow-xl">
                  <div className="flex items-end gap-1.5 h-6">
                    <div className="w-1 h-3 bg-[#D4A353] rounded-full"></div>
                    <div className="w-1 h-6 bg-[#D4A353] rounded-full"></div>
                    <div className="w-1 h-4 bg-[#D4A353] rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 bg-[#2A2A2A] text-white px-4 py-1.5 rounded-full text-sm font-medium border border-white/10">
                {profile?.role || 'Project Manager'}
              </div>
            </div>
            <div className="px-2 pb-2">
              <h3 className="text-xl font-medium text-[#1A1A1A]">{profile?.first_name || 'Usuario'} {profile?.last_name || ''}</h3>
              <p className="text-[#666666] text-sm">{profile?.role || 'Project Manager'}</p>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-6 shadow-sm border border-white/40 flex flex-col gap-4">
            <div className="flex items-center justify-between py-2 border-b border-black/5 cursor-pointer hover:bg-black/5 rounded-lg px-2 transition-colors" onClick={() => navigate('/finance')}>
              <span className="text-[#1A1A1A] font-medium">Finanzas</span>
              <ChevronRight size={18} className="text-[#666666]" />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-black/5 cursor-pointer hover:bg-black/5 rounded-lg px-2 transition-colors" onClick={() => navigate('/kanban')}>
              <span className="text-[#1A1A1A] font-medium">Kanban</span>
              <div className="flex items-center gap-2">
                <span className="bg-[#FFD166] text-[#222222] text-xs font-bold px-2 py-0.5 rounded-full">{stats.totalTasks}</span>
                <ChevronRight size={18} className="text-[#666666]" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-8 shadow-sm border border-white/40">
              <h3 className="text-lg font-medium text-[#1A1A1A] mb-4">Salud del Portafolio</h3>
              <div className="text-5xl font-light text-[#1A1A1A] mb-4">{stats.portfolioHealth}%</div>
              <p className="text-sm text-[#666666]">Basado en {stats.totalProjects} proyectos activos.</p>
              <div className="w-full bg-black/5 h-2 rounded-full mt-6">
                <div className="bg-[#FFD166] h-2 rounded-full" style={{ width: `${stats.portfolioHealth}%` }}></div>
              </div>
            </div>



            <div className="bg-[#222222] text-white rounded-[32px] p-8 shadow-xl">
              <h3 className="text-lg font-medium mb-4">Proyectos en Riesgo</h3>
              <div className="text-5xl font-light text-[#FFD166] mb-4">{stats.projectsAtRisk}</div>
              <p className="text-white/50 text-sm">Requieren atención inmediata.</p>
              {stats.projectsAtRisk > 0 && (
                <div className="mt-6 flex items-center gap-2 text-rose-400 text-sm font-medium">
                  <AlertTriangle size={18} /> Acción requerida
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-8 border border-white/40 shadow-sm flex flex-col gap-6">
            <div className="flex justify-between items-center text-[#1A1A1A]">
              <h3 className="text-xl font-medium">Estado operativo</h3>
              <div className="p-3 bg-black/5 rounded-2xl"><BarChart2 size={24} /></div>
            </div>
            <p className="text-[#666666] leading-relaxed">
              El dashboard está conectado directamente a Supabase. Cualquier cambio en Clientes, Proyectos, Finanzas o Kanban se refleja automáticamente aquí.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="p-4 bg-white rounded-2xl border border-black/5">
                <p className="text-xs text-[#666666] mb-1">Clientes Activos</p>
                <p className="text-lg font-medium text-[#1A1A1A]">{stats.totalClients} clientes</p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-black/5">
                <p className="text-xs text-[#666666] mb-1">Balance Financiero</p>
                <p className={`text-lg font-medium ${stats.totalBalance < 0 ? 'text-red-600' : 'text-[#1A1A1A]'}`}>
                  ${(stats.totalBalance / 1_000_000).toFixed(2)}M ARS
                </p>
              </div>
            </div>
          </div>

          {/* ── Calendar Section ── */}
          <DashboardCalendar tasks={allTasks} teamMembers={team} />
        </div>
      </div>
    </div>
  );
}

function DashboardCalendar({ tasks, teamMembers }: { tasks: any[], teamMembers: any[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const numDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);
  
  const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) calendarDays.push(null);
  for (let d = 1; d <= numDays; d++) calendarDays.push(d);

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-8 border border-white/40 shadow-sm flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-medium text-[#1A1A1A]">Calendario de Tareas</h3>
          <p className="text-sm text-[#666666]">{capitalizedMonth} {year}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-black/5 rounded-full transition-colors"><ChevronRight size={20} className="rotate-180" /></button>
          <button onClick={nextMonth} className="p-2 hover:bg-black/5 rounded-full transition-colors"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar pb-4">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-7 gap-px bg-black/5 rounded-2xl border border-black/5 mb-2">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
              <div key={d} className="bg-white/50 py-3 text-center text-[10px] font-bold text-[#666666] uppercase tracking-wider">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-black/5 rounded-2xl border border-black/5 overflow-hidden">
            {calendarDays.map((date, i) => {
              if (date === null) return <div key={`empty-${i}`} className="bg-white/30 min-h-[120px]" />;
              
              const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
              const dayTasks = tasks.filter(t => {
                if (!t.due_date || t.due_date === 'Sin fecha') return false;
                
                let normalized = t.due_date;
                if (t.due_date.includes('/')) {
                  const [d, m, y] = t.due_date.split('/');
                  normalized = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                }
                return normalized.split('T')[0] === dayStr;
              });
              
              return (
                <div key={date} className="bg-white min-h-[120px] p-2 flex flex-col gap-1 border border-black/[0.02] hover:bg-black/[0.01] transition-colors relative">
                  <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${new Date().getDate() === date && new Date().getMonth() === month && new Date().getFullYear() === year ? 'bg-[#FFD166] text-[#222222] shadow-sm' : 'text-[#666666]'}`}>{date}</span>
                  <div className="flex flex-col gap-1 overflow-y-auto max-h-[100px] custom-scrollbar">
                    {dayTasks.map(t => {
                      const statusColors: Record<string, string> = {
                        'todo': 'bg-gray-400',
                        'in-progress': 'bg-amber-500',
                        'review': 'bg-purple-500',
                        'done': 'bg-emerald-500'
                      };
                      const statusColor = statusColors[t.status as keyof typeof statusColors] || 'bg-gray-400';

                      return (
                        <div key={t.id} className="text-[9px] p-1.5 rounded-lg border border-black/5 bg-white shadow-sm flex items-start gap-1.5 group hover:border-[#FFD166] transition-all">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${statusColor}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#1A1A1A] truncate">{t.title}</p>
                            <div className="flex -space-x-1 mt-1">
                              {(t.assignees || []).slice(0, 2).map((name: string, idx: number) => {
                                const member = teamMembers.find(m => m.name === name);
                                return (
                                  <div key={idx} className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[6px] text-white" style={{ backgroundColor: member?.avatar_color || '#222222' }}>
                                    {name[0]}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
