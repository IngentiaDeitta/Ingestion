import { Download, Filter, Calendar, ArrowUpRight, ArrowDownRight, DollarSign, Clock, Zap, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { mockStats } from '../data/mockData';

const revenueData = [
  { name: 'Ene', facturado: 40000, costes: 24000 },
  { name: 'Feb', facturado: 30000, costes: 13980 },
  { name: 'Mar', facturado: 20000, costes: 9800 },
  { name: 'Abr', facturado: 27800, costes: 3908 },
  { name: 'May', facturado: 18900, costes: 4800 },
  { name: 'Jun', facturado: 23900, costes: 3800 },
  { name: 'Jul', facturado: 34900, costes: 4300 },
  { name: 'Ago', facturado: 42000, costes: 21000 },
  { name: 'Sep', facturado: 45200, costes: 23500 },
  { name: 'Oct', facturado: mockStats.monthlyRevenue, costes: mockStats.monthlyExpenses },
];

const hoursData = [
  { name: 'Ene', facturables: 800, noFacturables: 200 },
  { name: 'Feb', facturables: 750, noFacturables: 150 },
  { name: 'Mar', facturables: 600, noFacturables: 300 },
  { name: 'Abr', facturables: 850, noFacturables: 100 },
  { name: 'May', facturables: 700, noFacturables: 250 },
  { name: 'Jun', facturables: 900, noFacturables: 150 },
  { name: 'Jul', facturables: 1100, noFacturables: 100 },
  { name: 'Ago', facturables: 1050, noFacturables: 150 },
  { name: 'Sep', facturables: 1240, noFacturables: 200 },
  { name: 'Oct', facturables: mockStats.totalHours, noFacturables: 180 },
];

export default function Reports() {
  const [metrics, setMetrics] = useState({
    avgProposalDays: 12,
    avgProjectDuration: 30,
    conversionRate: 65
  });

  useEffect(() => {
    fetchRealMetrics();
  }, []);

  const fetchRealMetrics = async () => {
    try {
      const { data: history } = await supabase.from('project_status_history').select('*');
      const { data: projects } = await supabase.from('projects').select('*');

      if (projects && projects.length > 0) {
        const won = projects.filter(p => p.outcome === 'Ganado').length;
        setMetrics({
          avgProposalDays: history && history.length > 0 ? 14.5 : 12,
          avgProjectDuration: 45,
          conversionRate: Math.round((won / projects.length) * 100)
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-[42px] font-normal tracking-tight text-[#1A1A1A]">Reportes y Analíticas</h3>
          <p className="text-[#666666] mt-1">Visualiza el rendimiento financiero y operativo de la agencia.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center gap-2 bg-white/50 border border-black/10 hover:bg-white/80 text-[#1A1A1A] px-6 py-3 rounded-full text-sm font-medium transition-colors shadow-sm">
            <Calendar size={20} />
            Últimos 12 Meses
          </button>
          <button className="flex items-center justify-center gap-2 bg-[#222222] hover:bg-black text-white px-6 py-3 rounded-full text-sm font-medium transition-colors shadow-lg shadow-black/10">
            <Download size={20} />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* FILA 1: MÉTRICAS FINANCIERAS Y OPERATIVAS CLÁSICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/40 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-[#1A1A1A]">
              <DollarSign size={24} />
            </div>
            <span className="flex items-center text-[#1A1A1A] bg-[#FFD166] px-3 py-1 rounded-full text-xs font-bold">
              <ArrowUpRight size={14} className="mr-1" /> +{mockStats.revenueGrowth}%
            </span>
          </div>
          <p className="text-[#666666] text-sm font-medium mb-1">Balance Total</p>
          <h4 className="text-4xl font-light text-[#1A1A1A]">${(mockStats.balance / 1000).toFixed(1)}k</h4>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/40 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-[#1A1A1A]">
              <TrendingUp size={24} />
            </div>
            <span className="flex items-center text-[#1A1A1A] bg-[#FFD166] px-3 py-1 rounded-full text-xs font-bold">
              +2.4%
            </span>
          </div>
          <p className="text-[#666666] text-sm font-medium mb-1">Salud del Portfolio</p>
          <h4 className="text-4xl font-light text-[#1A1A1A]">{mockStats.portfolioHealth}%</h4>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/40 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-[#1A1A1A]">
              <Clock size={24} />
            </div>
            <span className="flex items-center text-[#1A1A1A] bg-[#FFD166] px-3 py-1 rounded-full text-xs font-bold">
              +8%
            </span>
          </div>
          <p className="text-[#666666] text-sm font-medium mb-1">Horas Totales mes</p>
          <h4 className="text-4xl font-light text-[#1A1A1A]">{mockStats.totalHours}h</h4>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/40 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-[#1A1A1A]">
              <ArrowDownRight size={24} />
            </div>
            <span className="flex items-center text-[#666666] bg-black/5 px-3 py-1 rounded-full text-xs font-bold">
              -1.2%
            </span>
          </div>
          <p className="text-[#666666] text-sm font-medium mb-1">Tasa de Utilización</p>
          <h4 className="text-4xl font-light text-[#1A1A1A]">{mockStats.billableHoursPercentage}%</h4>
        </div>
      </div>

      {/* FILA 2: EFICIENCIA COMERCIAL (NUEVA) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#222222] text-white rounded-[32px] p-8 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[180px]">
          <div className="relative z-10 flex justify-between items-start">
            <div className="p-3 bg-white/10 rounded-2xl">
              <Zap size={24} className="text-[#FFD166]" />
            </div>
            <div className="text-right text-white/50 text-xs font-bold uppercase tracking-widest">Velocidad Comercial</div>
          </div>
          <div className="relative z-10">
            <h4 className="text-5xl font-light mb-1">{metrics.avgProposalDays}d</h4>
            <p className="text-white/60 text-sm">Media en etapa de Propuesta</p>
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-8 border border-black/5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[180px]">
          <div className="relative z-10 flex justify-between items-start">
            <div className="p-3 bg-[#FFD166]/10 rounded-2xl">
              <TrendingUp size={24} className="text-[#1A1A1A]" />
            </div>
            <div className="text-right text-[#666666] text-xs font-bold uppercase tracking-widest">Rate de Conversión</div>
          </div>
          <div className="relative z-10">
            <h4 className="text-5xl font-light text-[#1A1A1A]">{metrics.conversionRate}%</h4>
            <p className="text-[#666666] text-sm">Propuestas que pasan a Ganado</p>
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-8 border border-black/5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[180px]">
          <div className="relative z-10 flex justify-between items-start">
            <div className="p-3 bg-black/5 rounded-2xl transition-colors">
              <Clock size={24} className="text-[#1A1A1A]" />
            </div>
            <div className="text-right text-[#666666] text-xs font-bold uppercase tracking-widest">Ciclo de Ejecución</div>
          </div>
          <div className="relative z-10">
            <h4 className="text-5xl font-light text-[#1A1A1A]">{metrics.avgProjectDuration}d</h4>
            <p className="text-[#666666] text-sm">Duración media de proyectos</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8">
          <h4 className="text-xl font-medium text-[#1A1A1A] mb-8">Facturación vs Costes</h4>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorFacturado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#222222" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#222222" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666666', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="facturado" stroke="#1A1A1A" strokeWidth={3} fill="url(#colorFacturado)" />
                <Area type="monotone" dataKey="costes" stroke="#FFD166" strokeWidth={3} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8">
          <h4 className="text-xl font-medium text-[#1A1A1A] mb-8">Distribución de Horas</h4>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hoursData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                <Bar dataKey="facturables" stackId="a" fill="#1A1A1A" radius={[0, 0, 0, 0]} />
                <Bar dataKey="noFacturables" stackId="a" fill="#FFD166" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
