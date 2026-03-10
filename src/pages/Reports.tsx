import { Download, Filter, Calendar, ArrowUpRight, ArrowDownRight, DollarSign, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/40 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-[#1A1A1A]">
              <DollarSign size={24} />
            </div>
            <span className="flex items-center text-[#1A1A1A] bg-[#FFD166] px-3 py-1 rounded-full text-xs font-bold">
              <ArrowUpRight size={14} className="mr-1" /> +{mockStats.revenueGrowth}%
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-[#666666] text-sm font-medium mb-1">Balance Total</p>
            <h4 className="text-4xl font-light text-[#1A1A1A]">${(mockStats.balance / 1000).toFixed(1)}k</h4>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/40 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-[#1A1A1A]">
              <ArrowUpRight size={24} />
            </div>
            <span className="flex items-center text-[#1A1A1A] bg-[#FFD166] px-3 py-1 rounded-full text-xs font-bold">
              <ArrowUpRight size={14} className="mr-1" /> +2.4%
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-[#666666] text-sm font-medium mb-1">Salud del Portfolio</p>
            <h4 className="text-4xl font-light text-[#1A1A1A]">{mockStats.portfolioHealth}%</h4>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/40 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-[#1A1A1A]">
              <Clock size={24} />
            </div>
            <span className="flex items-center text-[#1A1A1A] bg-[#FFD166] px-3 py-1 rounded-full text-xs font-bold">
              <ArrowUpRight size={14} className="mr-1" /> +8%
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-[#666666] text-sm font-medium mb-1">Horas Totales mes</p>
            <h4 className="text-4xl font-light text-[#1A1A1A]">{mockStats.totalHours}h</h4>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/40 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-[#1A1A1A]">
              <ArrowDownRight size={24} />
            </div>
            <span className="flex items-center text-[#666666] bg-black/5 px-3 py-1 rounded-full text-xs font-bold">
              <ArrowDownRight size={14} className="mr-1" /> -1.2%
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-[#666666] text-sm font-medium mb-1">Tasa de Utilización</p>
            <h4 className="text-4xl font-light text-[#1A1A1A]">{mockStats.billableHoursPercentage}%</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h4 className="text-xl font-medium text-[#1A1A1A]">Evolución de Facturación vs Costes</h4>
              <p className="text-sm text-[#666666]">Comparativa mensual del año en curso</p>
            </div>
            <button className="p-3 bg-white rounded-full text-[#666666] hover:text-[#1A1A1A] transition-colors shadow-sm">
              <Filter size={20} />
            </button>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorFacturado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#222222" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#222222" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCostes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFD166" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#FFD166" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#000000" strokeOpacity={0.05} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666666', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666666', fontSize: 12 }} tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#666666' }} />
                <Area type="monotone" dataKey="facturado" name="Facturado" stroke="#222222" strokeWidth={3} fillOpacity={1} fill="url(#colorFacturado)" />
                <Area type="monotone" dataKey="costes" name="Costes Directos" stroke="#FFD166" strokeWidth={3} fillOpacity={1} fill="url(#colorCostes)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h4 className="text-xl font-medium text-[#1A1A1A]">Distribución de Horas</h4>
              <p className="text-sm text-[#666666]">Horas facturables vs no facturables</p>
            </div>
            <button className="p-3 bg-white rounded-full text-[#666666] hover:text-[#1A1A1A] transition-colors shadow-sm">
              <Filter size={20} />
            </button>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={hoursData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#000000" strokeOpacity={0.05} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666666', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666666', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#666666' }} />
                <Bar dataKey="facturables" name="Facturables" stackId="a" fill="#222222" radius={[0, 0, 4, 4]} />
                <Bar dataKey="noFacturables" name="Internas" stackId="a" fill="#FFD166" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
