import {
  DollarSign, Download, Filter, ArrowUpRight, ArrowDownRight,
  MoreVertical, Trash2, Tag, TrendingUp, Clock, Zap, CheckCircle2, Edit2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { mockStats } from '../data/mockData';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  status: string;
  currency: string;
  tag?: string;
  project_id?: string;
  client_id?: string;
  fund_source?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TRANSACTION_TAGS = [
  { value: 'operational', label: 'Costos Operativos', color: 'bg-blue-100 text-blue-800' },
  { value: 'salaries', label: 'Sueldos', color: 'bg-purple-100 text-purple-800' },
  { value: 'travel', label: 'Viáticos', color: 'bg-orange-100 text-orange-800' },
  { value: 'software', label: 'Licencias', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'capital', label: 'Ajuste de Capital / Inversión', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'other', label: 'Otros', color: 'bg-gray-100 text-gray-600' },
];

const CURRENCIES = [
  { code: 'USD', label: 'Dólar', symbol: '$', color: 'bg-green-100 text-green-800', badge: 'bg-green-100 text-green-700' },
  { code: 'ARS', label: 'Peso', symbol: '$', color: 'bg-yellow-100 text-yellow-800', badge: 'bg-yellow-100 text-yellow-700' },
  { code: 'EUR', label: 'Euro', symbol: '€', color: 'bg-blue-100 text-blue-800', badge: 'bg-blue-100 text-blue-700' },
];

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getTagInfo = (value?: string) => TRANSACTION_TAGS.find(t => t.value === value) ?? null;
const getCurrencyInfo = (code: string) => CURRENCIES.find(c => c.code === code) ?? CURRENCIES[0];

function buildMonthlyChartData(transactions: Transaction[]) {
  const now = new Date();
  const data = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth(), y = d.getFullYear();
    let ingresos = 0, gastos = 0;
    transactions.forEach(t => {
      const td = new Date(t.date);
      if (td.getMonth() === m && td.getFullYear() === y) {
        const amt = parseFloat(t.amount as any);
        if (t.type === 'income') ingresos += amt; else gastos += amt;
      }
    });
    data.push({ name: MONTHS[m], ingresos, gastos });
  }
  return data;
}



export default function Finance() {
  const { isAdmin } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [filterCurrency, setFilterCurrency] = useState('all');
  const [filterTag, setFilterTag] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const [hoursChartData, setHoursChartData] = useState<any[]>([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [finResponse, projectsResponse, tasksResponse] = await Promise.all([
        supabase.from('finances').select('*').order('date', { ascending: false }),
        supabase.from('projects').select('id, name, outcome'),
        supabase.from('tasks').select('id, project, hours, actual_hours, status, created_at')
      ]);

      if (finResponse.error) throw finResponse.error;
      const trans = (finResponse.data || []).map((t: any) => ({ ...t, currency: t.currency ?? 'USD' }));
      setTransactions(trans);

      const projs = projectsResponse.data || [];
      const tasks = tasksResponse.data || [];

      // Process Hours Distribution Data
      const now = new Date();
      const hData = [];
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

      // Generate last 12 months including current
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const m = d.getMonth();
        const y = d.getFullYear();
        
        let facturables = 0;
        let noFacturables = 0;
        
        tasks.forEach((t: any) => {
          const td = new Date(t.created_at);
          if (td.getMonth() === m && td.getFullYear() === y) {
            const project = projs.find(p => p.name?.trim().toLowerCase() === t.project?.trim().toLowerCase());
            const isBillable = project?.outcome === 'Ganado';
            
            // Logic similar to Dashboard: use actual_hours if done, otherwise hours
            const h = t.status === 'done' 
              ? (Number(t.actual_hours) || Number(t.hours) || 0) 
              : (Number(t.hours) || 0);
              
            if (isBillable) facturables += h; else noFacturables += h;
          }
        });
        
        hData.push({ name: months[m], facturables, noFacturables });
      }
      setHoursChartData(hData);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de eliminar esta transacción?')) return;
    await supabase.from('finances').delete().eq('id', id);
    fetchData(); setOpenActionId(null);
  };

  const handleToggleStatus = async (t: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('finances').update({ status: t.status === 'Paid' ? 'Pending' : 'Paid' }).eq('id', t.id);
    fetchData(); setOpenActionId(null);
  };

  const filtered = transactions.filter(t => {
    if (filterCurrency !== 'all' && t.currency !== filterCurrency) return false;
    if (filterTag !== 'all' && t.tag !== filterTag) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    return true;
  });

  const currencyBalances = CURRENCIES.map(c => {
    const inc = transactions.filter(t => t.type === 'income' && t.currency === c.code).reduce((a, t) => a + parseFloat(t.amount as any), 0);
    const exp = transactions.filter(t => t.type === 'expense' && t.currency === c.code).reduce((a, t) => a + parseFloat(t.amount as any), 0);
    return { ...c, income: inc, expenses: exp, net: inc - exp };
  });

  const totalBalanceUSD = currencyBalances.find(c => c.code === 'USD')?.net ?? 0;
  const monthlyChart = buildMonthlyChartData(transactions);

  return (
    <div className="flex-1 flex flex-col gap-8 w-full max-w-[1400px] mx-auto pb-12" onClick={() => setOpenActionId(null)}>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-[42px] font-normal tracking-tight text-[#1A1A1A]">Finanzas</h3>
          <p className="text-[#666666] mt-1">Gestión integral de ingresos, egresos y analíticas financieras.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-6 py-3 rounded-full border border-black/10 text-sm font-medium hover:bg-black/5 transition-colors">
            <Download size={18} /> Exportar
          </button>
          {isAdmin && (
            <Link to="/finance/new-invoice" className="flex items-center gap-2 bg-[#222222] hover:bg-black text-white px-8 py-3 rounded-full text-sm font-medium transition-colors shadow-lg">
              Nueva Transacción
            </Link>
          )}
        </div>
      </div>

      {/* ── Balance Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#222222] text-white rounded-[32px] p-6 shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/10 rounded-2xl"><DollarSign size={24} /></div>
            <span className="flex items-center text-[#222222] bg-[#FFD166] px-3 py-1 rounded-full text-xs font-bold">Total USD</span>
          </div>
          <p className="text-white/70 text-sm font-medium mb-1">Balance Consolidado</p>
          <h4 className="text-4xl font-light">${totalBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
        </div>

        {currencyBalances.map(c => (
          <div key={c.code} className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/40 shadow-sm transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-4">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${c.badge}`}>{c.code}</span>
              <span className={`flex items-center text-[10px] font-bold uppercase tracking-wider ${c.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {c.net >= 0 ? <ArrowUpRight size={12} className="mr-0.5" /> : <ArrowDownRight size={12} className="mr-0.5" />}
                {c.label}
              </span>
            </div>
            <p className="text-[#666666] text-xs font-medium mb-1">Saldo en {c.code}</p>
            <h4 className={`text-3xl font-light ${c.net >= 0 ? 'text-[#1A1A1A]' : 'text-red-500'}`}>
              {c.symbol}{c.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h4>
          </div>
        ))}
      </div>

      {/* ── Analytics Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-medium text-[#1A1A1A]">Facturación vs Costes</h4>
            <TrendingUp size={20} className="text-[#666]" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChart}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#222222" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#222222" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}k`} tick={{ fill: '#999', fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`$${v.toLocaleString()}`, '']} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                <Area type="monotone" dataKey="ingresos" stroke="#1A1A1A" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" />
                <Area type="monotone" dataKey="gastos" stroke="#FFD166" strokeWidth={3} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-medium text-[#1A1A1A]">Distribución de Horas</h4>
            <Clock size={20} className="text-[#666]" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hoursChartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} formatter={(v: any) => [`${v}h`, '']} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                <Bar name="Facturables" dataKey="facturables" stackId="a" fill="#1A1A1A" radius={[0, 0, 0, 0]} />
                <Bar name="No Facturables" dataKey="noFacturables" stackId="a" fill="#FFD166" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Transactions Table ── */}
      <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm min-h-[500px]">
        <div className="p-8 border-b border-black/5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h4 className="text-xl font-medium text-[#1A1A1A]">Registro de Operaciones</h4>
            <p className="text-sm text-[#666]">Últimos movimientos registrados en el sistema.</p>
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-white/50 border border-black/10 hover:bg-white text-[#1A1A1A] px-6 py-2.5 rounded-full text-sm font-medium transition-all">
            <Filter size={18} /> Filtros {showFilters ? '▲' : '▼'}
          </button>
        </div>

        {showFilters && (
          <div className="px-8 py-6 border-b border-black/5 flex flex-wrap gap-6 bg-black/[0.02]">
            {[
              { label: 'Tipo', value: filterType, setter: setFilterType, options: [['all', 'Todos'], ['income', 'Ingresos'], ['expense', 'Gastos']] },
              { label: 'Moneda', value: filterCurrency, setter: setFilterCurrency, options: [['all', 'Todas'], ['USD', 'USD'], ['ARS', 'ARS'], ['EUR', 'EUR']] },
              { label: 'Categoría', value: filterTag, setter: setFilterTag, options: [['all', 'Todas'], ...TRANSACTION_TAGS.map(t => [t.value, t.label])] },
            ].map(f => (
              <div key={f.label} className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest">{f.label}</label>
                <select value={f.value} onChange={e => f.setter(e.target.value)}
                  className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/5 transition-all">
                  {(f.options as [string, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
            <button onClick={() => { setFilterType('all'); setFilterCurrency('all'); setFilterTag('all'); }}
              className="self-end h-10 px-6 rounded-xl text-sm font-medium text-[#666] hover:text-[#1A1A1A] transition-colors">
              Limpiar filtros
            </button>
          </div>
        )}

        <div className="overflow-visible">
          {loading ? <div className="p-20 text-center text-[#666] font-medium">Sincronizando con Supabase...</div> : (
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-black/[0.01]">
                  {['Fecha', 'Descripción', 'Categoría', 'Origen', 'Moneda', 'Importe', ''].map((h, i) => (
                    <th key={i} className={`px-8 py-6 text-[11px] font-bold text-[#999] uppercase tracking-widest ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {filtered.map(t => {
                  const tagInfo = getTagInfo(t.tag);
                  const curr = getCurrencyInfo(t.currency);
                  return (
                    <tr key={t.id} className="group hover:bg-black/[0.01] transition-colors">
                      <td className="px-8 py-5 whitespace-nowrap text-sm text-[#1A1A1A] font-medium">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="px-8 py-5">
                        <div className="text-sm text-[#1A1A1A] font-medium">{t.description}</div>
                        <div className="text-[10px] text-[#999] uppercase tracking-tighter">{t.status}</div>
                      </td>
                      <td className="px-8 py-5">
                        {tagInfo
                          ? <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${tagInfo.color}`}><Tag size={10} />{tagInfo.label}</span>
                          : <span className="text-xs text-[#999] uppercase font-bold tracking-tighter opacity-50">{t.type === 'income' ? 'Ingreso' : 'Egreso'}</span>}
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs font-medium text-[#666666]">{t.fund_source || '-'}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${curr.badge}`}>{t.currency}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className={`text-sm font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                          {t.type === 'income' ? '+' : '-'}{curr.symbol}{Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right relative">
                        <button onClick={(e) => { e.stopPropagation(); setOpenActionId(openActionId === t.id ? null : t.id); }}
                          className="text-[#DDD] group-hover:text-[#1A1A1A] p-2 rounded-full hover:bg-white transition-all shadow-sm">
                          <MoreVertical size={18} />
                        </button>
                        {openActionId === t.id && (
                          <div className="absolute right-12 top-10 w-48 bg-white rounded-2xl shadow-2xl border border-black/5 flex flex-col p-2 z-[9999]">
                            <button onClick={(e) => handleToggleStatus(t, e)} className="flex items-center gap-3 px-4 py-3 text-sm text-[#1A1A1A] font-medium hover:bg-black/5 rounded-xl transition-colors text-left">
                              <DollarSign size={16} />{t.status === 'Paid' ? 'Pendiente' : 'Pagado'}
                            </button>
                            <Link to={`/finance/edit/${t.id}`} className="flex items-center gap-3 px-4 py-3 text-sm text-[#1A1A1A] font-medium hover:bg-black/5 rounded-xl transition-colors text-left">
                              <Edit2 size={16} />Editar
                            </Link>
                            <button onClick={(e) => handleDelete(t.id, e)} className="flex items-center gap-3 px-4 py-3 text-sm text-red-500 font-medium hover:bg-red-50 rounded-xl transition-colors text-left">
                              <Trash2 size={16} />Eliminar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
