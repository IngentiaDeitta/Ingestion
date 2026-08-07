import {
  DollarSign, TrendingUp, Clock, Zap, AlertTriangle,
  ChevronRight, BarChart2, Users as UsersIcon, Folder as FolderIcon,
  ArrowUpRight, Briefcase, FileText, Target, Calendar, Plus, X, Save
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import exchangeRates from '../data/exchange_rates.json';

interface Stats {
  totalClients: number;
  totalProjects: number;
  totalTasks: number;
  projectsAtRisk: number;
  portfolioHealth: number;
  totalBalanceARS: number;
  totalBalanceUSD: number;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  avgProjectDuration: number;
  // Commercial
  leadsTotal: number;
  leadsQualified: number;
  quotesSent: number;
  quotesConverted: number;
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
    totalBalanceARS: 0,
    totalBalanceUSD: 0,
    totalHours: 0,
    billableHours: 0,
    nonBillableHours: 0,
    avgProjectDuration: 45,
    leadsTotal: 0,
    leadsQualified: 0,
    quotesSent: 0,
    quotesConverted: 0
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
        { data: leadsData },
        { data: quotesData }
      ] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('id, name, status, budget, outcome'),
        supabase.from('tasks').select('*'),
        supabase.from('finances').select('amount, type, currency'),
        supabase.from('team').select('*'),
        supabase.from('leads_cuentas').select('id, estado'),
        supabase.from('quotes').select('id, status')
      ]);

      const atRiskCount = projectsData?.filter(p => p.status === 'En Riesgo').length ?? 0;
      const totalProjects = projectsData?.filter(p => !['Completado', 'Finalizado', 'Perdido', 'Cancelado'].includes(p.status)).length ?? 0;
      const health = totalProjects > 0 ? Math.round(((totalProjects - atRiskCount) / totalProjects) * 100) : 100;

      let totalEstimatedHours = 0;
      let totalActualHours = 0;
      (tasksData || []).forEach((t: any) => {
        totalEstimatedHours += Number(t.hours) || 0;
        totalActualHours += Number(t.actual_hours) || 0;
      });

      setAllTasks(tasksData || []);
      setTeam(teamData || []);

      const EXCHANGE_RATES = {
        USD: Number(import.meta.env.VITE_EXCHANGE_RATE_USD || exchangeRates.USD || 1405),
        EUR: Number(import.meta.env.VITE_EXCHANGE_RATE_EUR || exchangeRates.EUR || 1665),
        ARS: 1
      };

      let totalBalanceARS = 0;
      let totalBalanceUSD = 0;
      (financesData || []).forEach((t: any) => {
        const currency = t.currency || 'USD';
        
        let amtARS = 0;
        let amtUSD = 0;

        if (currency === 'ARS') {
            amtARS = parseFloat(t.amount);
            amtUSD = parseFloat(t.amount) / EXCHANGE_RATES.USD;
        } else if (currency === 'USD') {
            amtARS = parseFloat(t.amount) * EXCHANGE_RATES.USD;
            amtUSD = parseFloat(t.amount);
        } else if (currency === 'EUR') {
            amtARS = parseFloat(t.amount) * EXCHANGE_RATES.EUR;
            amtUSD = amtARS / EXCHANGE_RATES.USD;
        }

        if (t.type === 'income') {
            totalBalanceARS += amtARS;
            totalBalanceUSD += amtUSD;
        } else {
            totalBalanceARS -= amtARS;
            totalBalanceUSD -= amtUSD;
        }
      });

      const leadsTotal = leadsData?.length || 0;
      const leadsQualified = leadsData?.filter(l => ['REUNION_AGENDADA', 'ENRIQUECIDO', 'CONVERTIDO'].includes(l.estado)).length || 0;

      const quotesSent = quotesData?.filter(q => q.status !== 'Generada').length || 0;
      const quotesConverted = quotesData?.filter(q => q.status === 'Aceptada').length || 0;

      setStats({
        totalClients: clientsCount ?? 0,
        totalProjects,
        totalTasks: (tasksData || []).length,
        projectsAtRisk: atRiskCount,
        portfolioHealth: health,
        totalBalanceARS,
        totalBalanceUSD,
        totalHours: Number(totalActualHours.toFixed(1)),
        billableHours: totalEstimatedHours,
        nonBillableHours: totalActualHours - totalEstimatedHours,
        avgProjectDuration: 45,
        leadsTotal,
        leadsQualified,
        quotesSent,
        quotesConverted
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-[1200px] mx-auto pb-10 px-4 md:px-0">
      
      {/* ── Header ── */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">
          Dashboard
        </h1>
        <p className="text-[#666666] text-sm">Vista general de operaciones, prospección comercial y finanzas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ── Left Column: Metrics ── */}
        <div className="lg:col-span-8 flex flex-col gap-5">
            
            {/* ── Financials ── */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <DollarSign size={16} className="text-[#666666]" />
                    <h2 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide">Finanzas</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm flex flex-col gap-1.5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                        <p className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">Balance Total (ARS)</p>
                        <h4 className={`text-3xl font-light tracking-tight ${stats.totalBalanceARS < 0 ? 'text-red-600' : 'text-[#1A1A1A]'}`}>
                            ${(stats.totalBalanceARS / 1_000_000).toFixed(2)}M
                        </h4>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm flex flex-col gap-1.5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                        <p className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">Balance Total (USD)</p>
                        <h4 className={`text-3xl font-light tracking-tight ${stats.totalBalanceUSD < 0 ? 'text-red-600' : 'text-[#1A1A1A]'}`}>
                            U$D {(stats.totalBalanceUSD).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </h4>
                        <p className="text-[9px] text-[#666666] uppercase mt-0.5 font-medium">TC BNA del día</p>
                    </div>
                </div>
            </section>

            {/* ── Commercial Prospection Funnel ── */}
            <section>
                <div className="flex items-center gap-2 mb-3 mt-1">
                    <Target size={16} className="text-[#666666]" />
                    <h2 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide">Funnel Comercial</h2>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm overflow-x-auto custom-scrollbar">
                    <div className="min-w-[500px] flex items-center justify-between gap-2">
                        {/* Step 1 */}
                        <div className="flex-1 relative flex flex-col items-center justify-center h-28 group cursor-pointer transition-all hover:scale-[1.02]" onClick={() => navigate('/leads')}>
                            <div className="absolute inset-0 bg-black/[0.03] group-hover:bg-[#FFD166]/20 transition-colors" style={{ clipPath: 'polygon(0 0%, 100% 10%, 100% 90%, 0 100%)', borderRadius: '8px' }}></div>
                            <div className="relative z-10 flex flex-col items-center justify-center">
                                <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1 text-center">Leads Totales</span>
                                <span className="text-2xl font-light text-[#1A1A1A]">{stats.leadsTotal}</span>
                            </div>
                        </div>
                        
                        <ChevronRight size={16} className="text-black/20 shrink-0" />
                        
                        {/* Step 2 */}
                        <div className="flex-1 relative flex flex-col items-center justify-center h-28 group cursor-pointer transition-all hover:scale-[1.02]" onClick={() => navigate('/leads')}>
                            <div className="absolute inset-0 bg-black/[0.03] group-hover:bg-[#FFD166]/20 transition-colors" style={{ clipPath: 'polygon(0 10%, 100% 20%, 100% 80%, 0 90%)', borderRadius: '8px' }}></div>
                            <div className="relative z-10 flex flex-col items-center justify-center">
                                <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1 text-center">Leads Calificados</span>
                                <span className="text-2xl font-light text-[#1A1A1A]">{stats.leadsQualified}</span>
                                <span className="text-[9px] font-bold text-emerald-600 mt-1 bg-emerald-50 px-1.5 py-0.5 rounded-sm shadow-sm border border-emerald-100">
                                    {stats.leadsTotal > 0 ? Math.round((stats.leadsQualified / stats.leadsTotal) * 100) : 0}%
                                </span>
                            </div>
                        </div>

                        <ChevronRight size={16} className="text-black/20 shrink-0" />

                        {/* Step 3 */}
                        <div className="flex-1 relative flex flex-col items-center justify-center h-28 group cursor-pointer transition-all hover:scale-[1.02]" onClick={() => navigate('/smart-quoter')}>
                            <div className="absolute inset-0 bg-black/[0.03] group-hover:bg-[#FFD166]/20 transition-colors" style={{ clipPath: 'polygon(0 20%, 100% 30%, 100% 70%, 0 80%)', borderRadius: '8px' }}></div>
                            <div className="relative z-10 flex flex-col items-center justify-center">
                                <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1 text-center">Pptos. Enviados</span>
                                <span className="text-2xl font-light text-[#1A1A1A]">{stats.quotesSent}</span>
                            </div>
                        </div>

                        <ChevronRight size={16} className="text-black/20 shrink-0" />

                        {/* Step 4 */}
                        <div className="flex-1 relative flex flex-col items-center justify-center h-28 group cursor-pointer transition-all hover:scale-[1.02]" onClick={() => navigate('/smart-quoter')}>
                            <div className="absolute inset-0 bg-black/[0.03] group-hover:bg-[#FFD166]/20 transition-colors" style={{ clipPath: 'polygon(0 30%, 100% 40%, 100% 60%, 0 70%)', borderRadius: '8px' }}></div>
                            <div className="relative z-10 flex flex-col items-center justify-center">
                                <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1 text-center">Pptos. Aceptados</span>
                                <span className="text-2xl font-light text-[#1A1A1A]">{stats.quotesConverted}</span>
                                <span className="text-[9px] font-bold text-emerald-600 mt-1 bg-emerald-50 px-1.5 py-0.5 rounded-sm shadow-sm border border-emerald-100">
                                    {stats.quotesSent > 0 ? Math.round((stats.quotesConverted / stats.quotesSent) * 100) : 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Projects ── */}
            <section>
                <div className="flex items-center gap-2 mb-3 mt-1">
                    <Briefcase size={16} className="text-[#666666]" />
                    <h2 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide">Estado de Proyectos</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#1A1A1A] text-white rounded-2xl p-5 shadow-md flex flex-col gap-1.5">
                        <div className="flex justify-between items-start">
                            <p className="text-[11px] font-bold text-white/60 uppercase tracking-wider">Proyectos Activos</p>
                            <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                {stats.portfolioHealth}% Salud
                            </span>
                        </div>
                        <h4 className="text-3xl font-light tracking-tight">{stats.totalProjects}</h4>
                        <div className="w-full bg-white/10 h-1 rounded-full mt-1.5">
                            <div className="bg-emerald-400 h-1 rounded-full" style={{ width: `${stats.portfolioHealth}%` }}></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm flex flex-col gap-1.5 justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">Proyectos en Riesgo</p>
                            <h4 className={`text-3xl font-light tracking-tight ${stats.projectsAtRisk > 0 ? 'text-red-500' : 'text-[#1A1A1A]'}`}>
                                {stats.projectsAtRisk}
                            </h4>
                        </div>
                        {stats.projectsAtRisk > 0 && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 bg-red-50 w-fit px-2 py-1 rounded-md">
                                <AlertTriangle size={12} /> Requieren atención
                            </div>
                        )}
                        {stats.projectsAtRisk === 0 && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-md">
                                Todo en orden
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>

        {/* ── Right Column: Calendar & Follow-ups ── */}
        <div className="lg:col-span-4 flex flex-col gap-5">
            <section className="h-full flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                    <Calendar size={16} className="text-[#666666]" />
                    <h2 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide">Agenda y Tareas</h2>
                </div>
                <div className="flex-1 bg-white rounded-2xl border border-black/5 shadow-sm flex flex-col overflow-hidden min-h-[450px]">
                    <DashboardCalendar 
                        tasks={allTasks} 
                        teamMembers={team} 
                        onTaskAdded={() => fetchDashboardData()} 
                    />
                </div>
            </section>
        </div>
      </div>
    </div>
  );
}

function DashboardCalendar({ tasks, teamMembers, onTaskAdded }: { tasks: any[], teamMembers: any[], onTaskAdded: () => void }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', due_date: '', project_name: 'General' });
  const [savingTask, setSavingTask] = useState(false);
  
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

  // Get upcoming tasks (next 7 days)
  const today = new Date();
  today.setHours(0,0,0,0);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const upcomingTasks = tasks.filter(t => {
      if (!t.due_date || t.due_date === 'Sin fecha' || t.status === 'done') return false;
      let normalized = t.due_date;
      if (t.due_date.includes('/')) {
        const [d, m, y] = t.due_date.split('/');
        normalized = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
      const dueDate = new Date(normalized.split('T')[0]);
      dueDate.setHours(23,59,59,999);
      return dueDate >= today && dueDate <= nextWeek;
  }).sort((a, b) => {
      let dA = a.due_date.includes('/') ? a.due_date.split('/').reverse().join('-') : a.due_date;
      let dB = b.due_date.includes('/') ? b.due_date.split('/').reverse().join('-') : b.due_date;
      return new Date(dA).getTime() - new Date(dB).getTime();
  }).slice(0, 5); // Take top 5

  const handleDayClick = (date: number) => {
      const clickedDate = new Date(year, month, date);
      if (selectedDate && 
          selectedDate.getDate() === date && 
          selectedDate.getMonth() === month && 
          selectedDate.getFullYear() === year) {
          setSelectedDate(null);
      } else {
          setSelectedDate(clickedDate);
      }
  };

  let displayedTasks = upcomingTasks;
  if (selectedDate) {
      displayedTasks = tasks.filter(t => {
          if (!t.due_date || t.due_date === 'Sin fecha' || t.status === 'done') return false;
          let normalized = t.due_date;
          if (t.due_date.includes('/')) {
            const [d, m, y] = t.due_date.split('/');
            normalized = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          }
          const dueDateStr = normalized.split('T')[0];
          const selectedStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
          return dueDateStr === selectedStr;
      });
  }

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.due_date) return;
    try {
        setSavingTask(true);
        const { error } = await supabase.from('tasks').insert([{
            title: newTask.title,
            due_date: newTask.due_date,
            project_name: newTask.project_name,
            status: 'todo',
            assignees: [], // can be assigned later
            hours: 0,
            actual_hours: 0
        }]);
        if (error) throw error;
        setIsModalOpen(false);
        setNewTask({ title: '', due_date: '', project_name: 'General' });
        onTaskAdded();
    } catch (err) {
        console.error('Error adding task:', err);
        alert('Error al agregar la tarea');
    } finally {
        setSavingTask(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-2">
        <div className="flex justify-between items-center mb-3">
          <p className="font-bold text-[#1A1A1A] text-sm">{capitalizedMonth} {year}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1 p-1 px-2 hover:bg-[#FFD166]/20 text-[#1A1A1A] rounded-md transition-colors mr-1">
                <Plus size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wide">Nueva</span>
            </button>
            <button onClick={prevMonth} className="p-1 hover:bg-black/5 rounded-md transition-colors"><ChevronRight size={16} className="rotate-180" /></button>
            <button onClick={nextMonth} className="p-1 hover:bg-black/5 rounded-md transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(d => (
            <div key={d} className="text-center text-[9px] font-bold text-[#666666] uppercase">{d}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-3">
          {calendarDays.map((date, i) => {
            if (date === null) return <div key={`empty-${i}`} className="h-7" />;
            
            const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
            const dayTasks = tasks.filter(t => {
              if (!t.due_date || t.due_date === 'Sin fecha' || t.status === 'done') return false;
              let normalized = t.due_date;
              if (t.due_date.includes('/')) {
                const [d, m, y] = t.due_date.split('/');
                normalized = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
              }
              return normalized.split('T')[0] === dayStr;
            });
            
            const isToday = new Date().getDate() === date && new Date().getMonth() === month && new Date().getFullYear() === year;
            const isSelected = selectedDate?.getDate() === date && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year;
            const hasTasks = dayTasks.length > 0;

            return (
              <div key={date} className="relative h-7 flex items-center justify-center">
                <button 
                  onClick={() => handleDayClick(date)}
                  className={`text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all
                  ${isSelected ? 'ring-2 ring-[#FFD166] ring-offset-1' : ''}
                  ${isToday ? 'bg-[#1A1A1A] text-white' : 'text-[#1A1A1A] hover:bg-black/5'} 
                  ${hasTasks && !isToday ? 'bg-orange-50 text-orange-700' : ''}`}>
                  {date}
                </button>
                {hasTasks && isToday && <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-orange-500 rounded-full border border-white"></div>}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="border-t border-black/5 bg-zinc-50 flex-1 p-4 flex flex-col">
        <div className="flex justify-between items-center mb-2">
            <h4 className="text-[10px] font-bold text-[#666666] uppercase tracking-wide">
                {selectedDate ? `Vencimientos del ${selectedDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}` : 'Próximos Vencimientos'}
            </h4>
            {selectedDate && (
                <button onClick={() => setSelectedDate(null)} className="text-[9px] font-bold text-orange-600 hover:underline">Ver Próximos</button>
            )}
        </div>
        <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar">
            {displayedTasks.length === 0 ? (
                <p className="text-xs text-[#666666] py-2">
                    {selectedDate ? 'No hay tareas para este día.' : 'No hay tareas próximas a vencer.'}
                </p>
            ) : (
                displayedTasks.map(t => {
                    let formattedDate = 'Pronto';
                    if (t.due_date) {
                        let normalized = t.due_date;
                        if (t.due_date.includes('/')) {
                            const [d, m, y] = t.due_date.split('/');
                            normalized = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                        }
                        const d = new Date(normalized);
                        formattedDate = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                    }

                    const isGeneral = !t.project_name || t.project_name === 'General';

                    return (
                        <div key={t.id} className={`bg-white p-2.5 rounded-xl border ${isGeneral ? 'border-[#FFD166]/50' : 'border-black/5'} flex flex-col gap-1 shadow-sm`}>
                            <div className="flex justify-between items-start gap-2">
                                <p className="text-[13px] font-medium text-[#1A1A1A] line-clamp-1">{t.title}</p>
                                <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                                    {formattedDate}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                {t.assignees && t.assignees.length > 0 && (
                                    <div className="flex -space-x-1">
                                        {t.assignees.slice(0, 2).map((name: string, idx: number) => {
                                            const member = teamMembers.find(m => m.name === name);
                                            return (
                                                <div key={idx} className="w-3.5 h-3.5 rounded-full border border-white flex items-center justify-center text-[5px] text-white" style={{ backgroundColor: member?.avatar_color || '#222222' }}>
                                                    {name[0]}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                <span className={`text-[9px] font-bold uppercase tracking-wider truncate ${isGeneral ? 'text-[#FFB020]' : 'text-[#666666]'}`}>
                                    {t.project_name || 'Comercial'}
                                </span>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col animate-in zoom-in-95">
                  <div className="p-4 border-b border-black/5 flex justify-between items-center">
                      <h3 className="text-base font-bold text-[#1A1A1A]">Agregar Tarea</h3>
                      <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-black/5 rounded-full transition-colors"><X size={16} /></button>
                  </div>
                  <form onSubmit={handleSaveTask} className="p-4 flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">Título de la Tarea</label>
                          <input 
                              required 
                              type="text" 
                              placeholder="Ej: Seguimiento cliente EK"
                              value={newTask.title}
                              onChange={e => setNewTask({...newTask, title: e.target.value})}
                              className="w-full h-10 rounded-xl border border-black/10 bg-white text-sm px-3 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all shadow-sm"
                          />
                      </div>
                      <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">Fecha de Vencimiento</label>
                          <input 
                              required 
                              type="date" 
                              value={newTask.due_date}
                              onChange={e => setNewTask({...newTask, due_date: e.target.value})}
                              className="w-full h-10 rounded-xl border border-black/10 bg-white text-sm px-3 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all shadow-sm"
                          />
                      </div>
                      <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">Proyecto / Etiqueta</label>
                          <input 
                              type="text" 
                              placeholder="General, Comercial, etc."
                              value={newTask.project_name}
                              onChange={e => setNewTask({...newTask, project_name: e.target.value})}
                              className="w-full h-10 rounded-xl border border-black/10 bg-white text-sm px-3 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all shadow-sm"
                          />
                      </div>
                      <button 
                          type="submit" 
                          disabled={savingTask}
                          className="w-full h-10 mt-2 bg-[#222222] hover:bg-black disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
                      >
                          <Save size={16} />
                          {savingTask ? 'Guardando...' : 'Guardar Tarea'}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}
