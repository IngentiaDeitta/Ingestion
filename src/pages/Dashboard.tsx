import { Play, Pause, Clock, CheckCircle2, ChevronRight, MoreVertical, AlertTriangle, BarChart2, Users as UsersIconComponent, Folder as FolderIconComponent } from "lucide-react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Stats {
  totalClients: number;
  totalProjects: number;
  totalTasks: number;
  projectsAtRisk: number;
  portfolioHealth: number;
  totalRevenue: number;
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
    totalRevenue: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Clients Count
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      // 2. Fetch Projects and calculate stats
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, status, budget');

      // 3. Fetch Tasks
      const { count: tasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true });

      const atRiskCount = projectsData?.filter(p => p.status === 'En Riesgo').length || 0;
      const totalProjects = projectsData?.length || 0;
      const totalBudget = projectsData?.reduce((acc, p) => acc + (p.budget || 0), 0) || 0;
      
      const health = totalProjects > 0 
        ? Math.round(((totalProjects - atRiskCount) / totalProjects) * 100) 
        : 100;

      setStats({
        totalClients: clientsCount || 0,
        totalProjects: totalProjects,
        totalTasks: tasksCount || 0,
        projectsAtRisk: atRiskCount,
        portfolioHealth: health,
        totalRevenue: totalBudget
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <h1 className="text-[42px] font-normal tracking-tight text-[#1A1A1A]">
          Hola, {profile.firstName}!
        </h1>

        <div className="flex flex-wrap items-center gap-x-12 gap-y-6">
          <div className="flex flex-col gap-2 min-w-[120px]">
            <span className="text-sm text-[#666666]">Salud Global</span>
            <div className="flex items-center gap-3">
              <div className="h-8 w-24 bg-[#222222] rounded-full flex items-center px-3 text-white text-xs font-medium">
                {stats.portfolioHealth}%
              </div>
            </div>
          </div>
          <div
            className="flex flex-col gap-2 min-w-[120px] cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/finance')}
          >
            <span className="text-sm text-[#666666]">Presupuesto Total</span>
            <div className="flex items-center gap-3">
              <div className="h-8 w-24 bg-[#FFD166] rounded-full flex items-center px-3 text-[#222222] text-xs font-medium">
                ${(stats.totalRevenue / 1000).toFixed(0)}k
              </div>
            </div>
          </div>
          <div
            className="flex flex-col gap-2 flex-1 min-w-[200px] cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/kanban')}
          >
            <span className="text-sm text-[#666666]">Tareas Activas</span>
            <div className="h-8 w-full max-w-[300px] bg-white/40 rounded-full overflow-hidden flex">
              <div className="h-full bg-white/60 flex items-center px-3 text-[#222222] text-xs font-medium" style={{ width: '100%' }}>
                {stats.totalTasks} tareas cargadas
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 min-w-[120px]">
            <span className="text-sm text-[#666666]">En Riesgo</span>
            <div className="flex items-center gap-3">
              <div className={`h-8 w-24 border ${stats.projectsAtRisk > 0 ? 'bg-red-50 border-red-200' : 'border-[#222222]/20'} rounded-full flex items-center px-3 text-[#222222] text-xs font-medium`}>
                {stats.projectsAtRisk} proyectos
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8 ml-auto">
            <div
              className="flex items-baseline gap-2 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => navigate('/clients')}
            >
              <span className="text-[#666666] text-sm flex items-center gap-1">
                <UsersIconComponent size={14} /> Clientes
              </span>
              <span className="text-5xl font-light text-[#1A1A1A]">{stats.totalClients}</span>
            </div>
            <div
              className="flex items-baseline gap-2 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => navigate('/projects')}
            >
              <span className="text-[#666666] text-sm flex items-center gap-1">
                <FolderIconComponent size={14} /> Proyectos
              </span>
              <span className="text-5xl font-light text-[#1A1A1A]">{stats.totalProjects}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Profile */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-4 shadow-sm border border-white/40 relative overflow-hidden group">
            <div className="aspect-[4/5] rounded-[24px] overflow-hidden mb-4 relative bg-[#1A1A1A] flex items-center justify-center">
              <svg className="absolute top-0 right-0 w-full h-full" viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg">
                <circle cx="150" cy="50" r="100" fill="#2A2A2A" />
                <circle cx="150" cy="50" r="75" fill="#333333" />
                <circle cx="150" cy="50" r="50" fill="#D4A353" />
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
                {profile.role}
              </div>
            </div>
            <div className="px-2 pb-2">
              <h3 className="text-xl font-medium text-[#1A1A1A]">{profile.firstName} {profile.lastName}</h3>
              <p className="text-[#666666] text-sm">{profile.role}</p>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-6 shadow-sm border border-white/40 flex flex-col gap-4">
            <div
              className="flex items-center justify-between py-2 border-b border-black/5 cursor-pointer hover:bg-black/5 rounded-lg px-2 transition-colors"
              onClick={() => navigate('/reports')}
            >
              <span className="text-[#1A1A1A] font-medium">Reportes</span>
              <ChevronRight size={18} className="text-[#666666]" />
            </div>
            <div
              className="flex items-center justify-between py-2 border-b border-black/5 cursor-pointer hover:bg-black/5 rounded-lg px-2 transition-colors"
              onClick={() => navigate('/kanban')}
            >
              <span className="text-[#1A1A1A] font-medium">Kanban</span>
              <div className="flex items-center gap-2">
                <span className="bg-[#FFD166] text-[#222222] text-xs font-bold px-2 py-0.5 rounded-full">{stats.totalTasks}</span>
                <ChevronRight size={18} className="text-[#666666]" />
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Projects Info */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-8 shadow-sm border border-white/40">
              <h3 className="text-lg font-medium text-[#1A1A1A] mb-4">Salud del Portafolio</h3>
              <div className="text-5xl font-light text-[#1A1A1A] mb-4">{stats.portfolioHealth}%</div>
              <p className="text-sm text-[#666666]">Basado en {stats.totalProjects} proyectos activos.</p>
              <div className="w-full bg-black/5 h-2 rounded-full mt-6">
                <div className="bg-[#FFD166] h-2 rounded-full" style={{ width: `${stats.portfolioHealth}%` }}></div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-8 shadow-sm border border-white/40">
              <h3 className="text-lg font-medium text-[#1A1A1A] mb-4">Tareas totales</h3>
              <div className="text-5xl font-light text-[#1A1A1A] mb-4">{stats.totalTasks}</div>
              <p className="text-sm text-[#666666]">Sincronizadas con Supabase.</p>
              <button 
                onClick={() => navigate('/kanban')}
                className="mt-6 text-sm font-medium text-[#1A1A1A] flex items-center gap-2 hover:underline"
              >
                Gestionar tareas <ChevronRight size={16} />
              </button>
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
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-medium text-[#1A1A1A]">Bienvenido al panel real</h3>
              <div className="p-3 bg-black/5 rounded-2xl">
                <BarChart2 size={24} className="text-[#1A1A1A]" />
              </div>
            </div>
            <p className="text-[#666666] leading-relaxed">
              Este dashboard ahora está conectado directamente a tu base de datos de Supabase. 
              Cualquier cambio que realices en las secciones de Clientes, Proyectos o Kanban se verá reflejado aquí automáticamente al recargar.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-2">
               <div className="p-4 bg-white rounded-2xl border border-black/5">
                  <p className="text-xs text-[#666666] mb-1">Métrica Real</p>
                  <p className="text-lg font-medium text-[#1A1A1A]">{stats.totalClients} Clientes Activos</p>
               </div>
               <div className="p-4 bg-white rounded-2xl border border-black/5">
                  <p className="text-xs text-[#666666] mb-1">Volumen Total</p>
                  <p className="text-lg font-medium text-[#1A1A1A]">${stats.totalRevenue.toLocaleString()} Proyectados</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
