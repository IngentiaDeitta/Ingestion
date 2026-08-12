import {
  DollarSign, TrendingUp, Clock, Zap, AlertTriangle,
  ChevronRight, BarChart2, Users as UsersIcon, Folder as FolderIcon,
  ArrowUpRight, Briefcase, FileText, Target, Calendar, Plus, X, Save,
  Layers, CheckCircle2, ArrowRight, MapPin, Building, ExternalLink, BookmarkPlus
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import exchangeRates from '../data/exchange_rates.json';
import eventosIndustriaData from '../data/eventos_industria.json';

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

  const qualRate = stats.leadsTotal > 0 ? Math.round((stats.leadsQualified / stats.leadsTotal) * 100) : 0;
  const convRate = stats.quotesSent > 0 ? Math.round((stats.quotesConverted / stats.quotesSent) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-[1240px] mx-auto pb-10 px-4 md:px-0">
      
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">
            Dashboard
          </h1>
          <p className="text-[#666666] text-sm">Vista general de operaciones, prospección comercial y finanzas.</p>
        </div>
      </div>

      {/* ── Top Row: Financials & Projects ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ── Financial Section ── */}
        <section className="lg:col-span-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-[#666666]" />
              <h2 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">Finanzas</h2>
            </div>
            <button 
              onClick={() => navigate('/finance')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              Ver detalle <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {/* ARS Card */}
            <div 
              onClick={() => navigate('/finance')}
              className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm flex flex-col justify-between relative overflow-hidden group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-125"></div>
              
              <div className="flex justify-between items-start mb-2">
                <p className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">Balance Total (ARS)</p>
                <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm">
                  <ArrowUpRight size={14} />
                </div>
              </div>

              <div>
                <h4 className={`text-3xl font-light tracking-tight ${stats.totalBalanceARS < 0 ? 'text-red-600' : 'text-[#1A1A1A]'}`}>
                  ${(stats.totalBalanceARS / 1_000_000).toFixed(2)}M
                </h4>
                <p className="text-[10px] text-[#666666] mt-1 font-medium flex items-center gap-1">
                  <span>Haz clic para auditar ingresos / egresos</span>
                </p>
              </div>
            </div>

            {/* USD Card */}
            <div 
              onClick={() => navigate('/finance')}
              className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm flex flex-col justify-between relative overflow-hidden group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-125"></div>

              <div className="flex justify-between items-start mb-2">
                <p className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">Balance Total (USD)</p>
                <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                  <ArrowUpRight size={14} />
                </div>
              </div>

              <div>
                <h4 className={`text-3xl font-light tracking-tight ${stats.totalBalanceUSD < 0 ? 'text-red-600' : 'text-[#1A1A1A]'}`}>
                  U$D {(stats.totalBalanceUSD).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </h4>
                <p className="text-[10px] text-[#666666] mt-1 font-medium">TC BNA oficial al día</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Projects Section ── */}
        <section className="lg:col-span-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-[#666666]" />
              <h2 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">Estado de Proyectos</h2>
            </div>
            <button 
              onClick={() => navigate('/projects')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              Ver proyectos <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {/* Active Projects Card */}
            <div 
              onClick={() => navigate('/projects')}
              className="bg-[#1A1A1A] text-white rounded-2xl p-5 shadow-md flex flex-col justify-between cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] relative overflow-hidden group"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="text-[11px] font-bold text-white/60 uppercase tracking-wider">Proyectos Activos</p>
                <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {stats.portfolioHealth}% Salud
                </span>
              </div>

              <div>
                <h4 className="text-3xl font-light tracking-tight mb-2">{stats.totalProjects}</h4>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${stats.portfolioHealth}%` }}></div>
                </div>
              </div>
            </div>

            {/* At Risk Projects Card */}
            <div 
              onClick={() => navigate('/projects')}
              className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm flex flex-col justify-between cursor-pointer transition-all duration-200 hover:shadow-md hover:border-amber-300 hover:-translate-y-0.5 group"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">Proyectos en Riesgo</p>
                <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-sm">
                  <ArrowUpRight size={14} />
                </div>
              </div>

              <div>
                <h4 className={`text-3xl font-light tracking-tight ${stats.projectsAtRisk > 0 ? 'text-red-500 font-normal' : 'text-[#1A1A1A]'}`}>
                  {stats.projectsAtRisk}
                </h4>
                <div className="mt-2">
                  {stats.projectsAtRisk > 0 ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 bg-red-50 w-fit px-2.5 py-1 rounded-full border border-red-100">
                      <AlertTriangle size={12} /> Requieren atención
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 w-fit px-2.5 py-1 rounded-full border border-emerald-100">
                      <CheckCircle2 size={12} /> Todo en orden
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Bottom Row: Vertical Commercial Funnel & Calendar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ── Vertical Commercial Funnel ── */}
        <section className="lg:col-span-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-[#666666]" />
              <h2 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">Funnel Comercial (Vertical)</h2>
            </div>
            <button 
              onClick={() => navigate('/leads')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              Gestionar leads <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-black/5 shadow-sm flex flex-col items-center justify-center gap-3.5 flex-1 min-h-[460px]">
            
            {/* Stage 1: Leads Totales */}
            <div 
              onClick={() => navigate('/leads')}
              className="w-full relative group cursor-pointer transition-all duration-300 hover:scale-[1.01]"
            >
              <div className="w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-4 text-white shadow-md flex items-center justify-between relative overflow-hidden group-hover:shadow-lg">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl"></div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-indigo-300 font-bold text-xs">
                    01
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Leads Totales</h3>
                    <p className="text-[10px] text-slate-400">Prospección en entrada y base</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-semibold text-white tracking-tight">{stats.leadsTotal}</span>
                  <ChevronRight size={18} className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>

            {/* Down Arrow Step 1->2 */}
            <div className="w-full flex items-center justify-center -my-1 text-indigo-400/60">
              <div className="w-0.5 h-3 bg-gradient-to-b from-indigo-950 to-blue-600"></div>
            </div>

            {/* Stage 2: Leads Calificados */}
            <div 
              onClick={() => navigate('/leads')}
              className="w-[88%] relative group cursor-pointer transition-all duration-300 hover:scale-[1.01]"
            >
              <div className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-xl p-4 text-white shadow-md flex items-center justify-between relative overflow-hidden group-hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-blue-100 font-bold text-xs">
                    02
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">Leads Calificados</h3>
                      <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        {qualRate}% Conv.
                      </span>
                    </div>
                    <p className="text-[10px] text-blue-100/80">Reunión agendada o enriquecidos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-semibold text-white tracking-tight">{stats.leadsQualified}</span>
                  <ChevronRight size={18} className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>

            {/* Down Arrow Step 2->3 */}
            <div className="w-full flex items-center justify-center -my-1 text-teal-400/60">
              <div className="w-0.5 h-3 bg-gradient-to-b from-blue-600 to-teal-600"></div>
            </div>

            {/* Stage 3: Pptos. Enviados */}
            <div 
              onClick={() => navigate('/propuestas')}
              className="w-[74%] relative group cursor-pointer transition-all duration-300 hover:scale-[1.01]"
            >
              <div className="w-full bg-gradient-to-r from-teal-600 via-cyan-700 to-teal-700 rounded-xl p-4 text-white shadow-md flex items-center justify-between relative overflow-hidden group-hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-teal-100 font-bold text-xs">
                    03
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">Pptos. Enviados</h3>
                    <p className="text-[10px] text-teal-100/80">Propuestas comerciales activas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-semibold text-white tracking-tight">{stats.quotesSent}</span>
                  <ChevronRight size={18} className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>

            {/* Down Arrow Step 3->4 */}
            <div className="w-full flex items-center justify-center -my-1 text-emerald-400/60">
              <div className="w-0.5 h-3 bg-gradient-to-b from-teal-600 to-emerald-500"></div>
            </div>

            {/* Stage 4: Pptos. Aceptados */}
            <div 
              onClick={() => navigate('/propuestas')}
              className="w-[60%] relative group cursor-pointer transition-all duration-300 hover:scale-[1.01]"
            >
              <div className="w-full bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 rounded-xl p-4 text-white shadow-md flex items-center justify-between relative overflow-hidden group-hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-emerald-100 font-bold text-xs">
                    04
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">Pptos. Aceptados</h3>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-100 bg-black/20 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                      {convRate}% Cierre
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-white tracking-tight">{stats.quotesConverted}</span>
                  <ChevronRight size={18} className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── Agenda y Tareas ── */}
        <section className="lg:col-span-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-[#666666]" />
              <h2 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">Agenda y Tareas</h2>
            </div>
            <button 
              onClick={() => navigate('/kanban')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              Ir a Kanban <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="flex-1 bg-white rounded-2xl border border-black/5 shadow-sm flex flex-col overflow-hidden min-h-[460px]">
            <DashboardCalendar 
              tasks={allTasks} 
              teamMembers={team} 
              onTaskAdded={() => fetchDashboardData()} 
            />
          </div>
        </section>
      </div>

    </div>
  );
}

function DashboardCalendar({ tasks, teamMembers, onTaskAdded }: { tasks: any[], teamMembers: any[], onTaskAdded: () => void }) {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'events'>('tasks');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', due_date: '', project_name: 'General', assignee: 'Fer' });
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
  }).slice(0, 5);

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

  // Industrial Events Filtering
  const eventsList = (eventosIndustriaData as any[]) || [];
  let displayedEvents = eventsList;
  if (selectedDate) {
      const selectedStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      displayedEvents = eventsList.filter(e => {
          return e.date_start <= selectedStr && e.date_end >= selectedStr;
      });
  }

  const handleAddEventAsTask = async (evt: any) => {
    try {
      setSavingTask(true);
      const assignedName = teamMembers[0]?.name || 'Fer';
      const { error } = await supabase.from('tasks').insert([{
        title: `[Evento] ${evt.title}`,
        due_date: evt.date_start,
        project_name: 'Comercial - Eventos',
        status: 'todo',
        assignees: [assignedName],
        assignee: assignedName,
        hours: 2,
        actual_hours: 0
      }]);
      if (error) throw error;
      alert(`Recordatorio agendado para "${evt.title}"!`);
      onTaskAdded();
    } catch (err) {
      console.error('Error agendando recordatorio de evento:', err);
      alert('No se pudo guardar el recordatorio');
    } finally {
      setSavingTask(false);
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.due_date) return;
    try {
        setSavingTask(true);
        const assignedName = newTask.assignee || (teamMembers[0]?.name || 'Fer');
        const { error } = await supabase.from('tasks').insert([{
            title: newTask.title,
            due_date: newTask.due_date,
            project_name: newTask.project_name,
            status: 'todo',
            assignees: [assignedName],
            assignee: assignedName,
            hours: 0,
            actual_hours: 0
        }]);
        if (error) throw error;
        setIsModalOpen(false);
        setNewTask({ title: '', due_date: '', project_name: 'General', assignee: 'Fer' });
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
      {/* Selector de Pestañas Agenda */}
      <div className="flex border-b border-black/5 bg-zinc-50/80 p-1.5 gap-1">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'tasks'
              ? 'bg-white text-zinc-900 shadow-sm border border-black/5'
              : 'text-zinc-500 hover:text-zinc-800 hover:bg-black/5'
          }`}
        >
          <Calendar size={13} className="text-amber-500" />
          <span>Tareas del Equipo</span>
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'events'
              ? 'bg-purple-950 text-purple-200 shadow-sm border border-purple-800'
              : 'text-purple-700 hover:bg-purple-50'
          }`}
        >
          <Building size={13} className="text-purple-400" />
          <span>Eventos Industria & PyMEs</span>
          <span className="bg-purple-800 text-purple-100 text-[9px] px-1.5 py-0.2 rounded-full ml-0.5">
            {eventsList.length}
          </span>
        </button>
      </div>

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
            
            const dayEvents = eventsList.filter(e => e.date_start <= dayStr && e.date_end >= dayStr);
            const isToday = new Date().getDate() === date && new Date().getMonth() === month && new Date().getFullYear() === year;
            const isSelected = selectedDate?.getDate() === date && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year;
            const hasTasks = dayTasks.length > 0;
            const hasEvents = dayEvents.length > 0;

            return (
              <div key={date} className="relative h-7 flex items-center justify-center">
                <button 
                  onClick={() => handleDayClick(date)}
                  className={`text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all relative
                  ${isSelected ? 'ring-2 ring-purple-500 ring-offset-1' : ''}
                  ${isToday ? 'bg-[#1A1A1A] text-white' : 'text-[#1A1A1A] hover:bg-black/5'} 
                  ${hasTasks && !isToday ? 'bg-orange-50 text-orange-700' : ''}
                  ${hasEvents && !isToday && !hasTasks ? 'bg-purple-100 text-purple-900 font-extrabold' : ''}`}>
                  {date}
                </button>
                {hasEvents && (
                  <div className="absolute top-0 right-0 w-2 h-2 bg-purple-600 rounded-full border border-white shadow-xs" title="Evento Industrial"></div>
                )}
                {hasTasks && isToday && !hasEvents && (
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-orange-500 rounded-full border border-white"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* VISTA 1: Tareas y Vencimientos */}
      {activeTab === 'tasks' && (
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
                          const parts = normalized.split('T')[0].split('-');
                          if (parts.length === 3) {
                              const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
                              formattedDate = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                          }
                      }

                      const isGeneral = !t.project_name || t.project_name === 'General';
                      const taskProject = t.project_name || t.project || 'General';

                      return (
                          <div 
                            key={t.id} 
                            onClick={() => navigate('/kanban', { state: { taskId: t.id, project: taskProject } })}
                            className={`bg-white p-2.5 rounded-xl border ${isGeneral ? 'border-[#FFD166]/50' : 'border-black/5'} flex flex-col gap-1 shadow-sm cursor-pointer hover:border-black/20 hover:shadow-md transition-all`}
                          >
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
                                      {taskProject}
                                  </span>
                              </div>
                          </div>
                      );
                  })
              )}
          </div>
        </div>
      )}

      {/* VISTA 2: Eventos Industriales & PyME */}
      {activeTab === 'events' && (
        <div className="border-t border-purple-100 bg-purple-950/5 flex-1 p-3 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-[10px] font-bold text-purple-900 uppercase tracking-wide flex items-center gap-1">
              <Building size={12} className="text-purple-600" />
              {selectedDate ? `Eventos para ${selectedDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}` : 'Próximas Ferias & Foros PyME'}
            </h4>
            {selectedDate && (
              <button onClick={() => setSelectedDate(null)} className="text-[9px] font-bold text-purple-700 hover:underline">Ver Todos</button>
            )}
          </div>

          <div className="flex flex-col gap-2.5 overflow-y-auto custom-scrollbar flex-1 max-h-[300px]">
            {displayedEvents.length === 0 ? (
              <p className="text-xs text-zinc-500 py-3 text-center">No hay eventos agendados para este día.</p>
            ) : (
              displayedEvents.map((evt: any) => (
                <div key={evt.id} className="bg-white p-3 rounded-xl border border-purple-200/80 shadow-xs hover:shadow-md transition-all flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-purple-900 text-purple-100">
                          {evt.category}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium">
                          {evt.date_start} {evt.date_end !== evt.date_start ? `al ${evt.date_end}` : ''}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-zinc-900 leading-snug">{evt.title}</h5>
                    </div>
                    <button
                      onClick={() => handleAddEventAsTask(evt)}
                      disabled={savingTask}
                      title="Agendar como Tarea del Equipo"
                      className="p-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 transition-colors flex items-center gap-1 text-[10px] font-bold shrink-0"
                    >
                      <BookmarkPlus size={13} />
                      <span className="hidden sm:inline">Agendar</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-zinc-600 line-clamp-2">{evt.description}</p>

                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-purple-50 text-[10px] text-zinc-500">
                    <div className="flex items-center gap-1 text-zinc-700 font-medium">
                      <MapPin size={11} className="text-purple-600 shrink-0" />
                      <span className="truncate max-w-[200px]">{evt.location}</span>
                    </div>

                    {evt.website && (
                      <a
                        href={evt.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-0.5 ml-auto text-[10px]"
                      >
                        Web <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

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
                      <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">Responsable</label>
                          <select
                              value={newTask.assignee || (teamMembers[0]?.name || 'Fer')}
                              onChange={e => setNewTask({...newTask, assignee: e.target.value})}
                              className="w-full h-10 rounded-xl border border-black/10 bg-white text-sm px-3 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all shadow-sm"
                          >
                              {teamMembers.map((m: any) => (
                                  <option key={m.id || m.name} value={m.name}>{m.name}</option>
                              ))}
                              <option value="Tercero (Freelance)">Tercero (Freelance)</option>
                          </select>
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
