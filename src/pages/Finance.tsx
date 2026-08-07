import {
  DollarSign, Download, Filter, ArrowUpRight, ArrowDownRight,
  MoreVertical, Trash2, Tag, TrendingUp, Clock, Zap, CheckCircle2, Edit2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { mockStats } from '../data/mockData';
import exchangeRates from '../data/exchange_rates.json';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'withdrawal';
  status: string;
  currency: string;
  tag?: string;
  project_id?: string;
  client_id?: string;
  fund_source?: string;
  category?: string | null;
  items?: any;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EXCHANGE_RATES = {
  USD: Number(import.meta.env.VITE_EXCHANGE_RATE_USD || exchangeRates.USD || 1405),
  EUR: Number(import.meta.env.VITE_EXCHANGE_RATE_EUR || exchangeRates.EUR || 1665),
  ARS: 1
};

const TRANSACTION_TAGS = [
  { value: 'operational', label: 'Costos Operativos', color: 'bg-blue-100 text-blue-800' },
  { value: 'salaries', label: 'Sueldos', color: 'bg-purple-100 text-purple-800' },
  { value: 'travel', label: 'Viáticos', color: 'bg-orange-100 text-orange-800' },
  { value: 'software', label: 'Licencias', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'capital', label: 'Ajuste de Capital / Inversión', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'contribution', label: 'Aporte de Capital', color: 'bg-indigo-100 text-indigo-800' },
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
        const rate = EXCHANGE_RATES[t.currency as keyof typeof EXCHANGE_RATES] || 1;
        const amt = parseFloat(t.amount as any) * rate;
        if (t.type === 'income') ingresos += amt; else gastos += amt; // Withdrawal counts as expense for monthly balance
      }
    });
    data.push({ name: MONTHS[m], ingresos, gastos });
  }
  return data;
}

const getYearMonth = (dateStr: string) => {
  const parts = dateStr.split('-');
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10) - 1
  };
};

const replicateCyclicExpenses = async (initialTrans: Transaction[]) => {
  const cyclicExpenses = initialTrans.filter(t => t.type === 'expense' && t.category === 'cyclic');
  if (cyclicExpenses.length === 0) return false;

  const groups: Record<string, Transaction[]> = {};
  cyclicExpenses.forEach(t => {
    if (!groups[t.description]) {
      groups[t.description] = [];
    }
    groups[t.description].push(t);
  });

  let insertedAny = false;
  const localTrans = [...initialTrans];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  for (const description of Object.keys(groups)) {
    const groupTxs = groups[description];
    let oldestTx = groupTxs[0];
    groupTxs.forEach(t => {
      if (t.date < oldestTx.date) {
        oldestTx = t;
      }
    });

    const startYM = getYearMonth(oldestTx.date);
    let iterYear = startYM.year;
    let iterMonth = startYM.month;

    while (true) {
      iterMonth++;
      if (iterMonth > 11) {
        iterMonth = 0;
        iterYear++;
      }

      if (iterYear > currentYear || (iterYear === currentYear && iterMonth > currentMonth)) {
        break;
      }

      const exists = localTrans.some(t => {
        if (t.description !== description || t.type !== 'expense') return false;
        const ym = getYearMonth(t.date);
        return ym.year === iterYear && ym.month === iterMonth;
      });

      if (!exists) {
        const pastTxs = localTrans.filter(t => {
          if (t.description !== description || t.type !== 'expense') return false;
          const ym = getYearMonth(t.date);
          return ym.year < iterYear || (ym.year === iterYear && ym.month < iterMonth);
        });

        if (pastTxs.length > 0) {
          pastTxs.sort((a, b) => b.date.localeCompare(a.date));
          const prevTx = pastTxs[0];
          const prevDay = parseInt(prevTx.date.split('-')[2], 10);
          
          const newDate = new Date(iterYear, iterMonth, prevDay);
          if (newDate.getMonth() !== iterMonth) {
            newDate.setDate(0);
          }

          const yearStr = newDate.getFullYear();
          const monthStr = String(newDate.getMonth() + 1).padStart(2, '0');
          const dayStr = String(newDate.getDate()).padStart(2, '0');
          const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

          const newTxPayload = {
            description: prevTx.description,
            amount: prevTx.amount,
            type: 'expense',
            status: 'Paid',
            date: dateStr,
            currency: prevTx.currency,
            tag: prevTx.tag || null,
            client_id: prevTx.client_id || null,
            project_id: prevTx.project_id || null,
            fund_source: prevTx.fund_source || null,
            items: prevTx.items || null,
            category: 'cyclic'
          };

          const { data, error } = await supabase.from('finances').insert([newTxPayload]).select();
          if (error) {
            console.error('Error auto-replicating transaction:', error);
          } else if (data && data[0]) {
            const insertedTx = {
              ...data[0],
              currency: data[0].currency ?? 'USD'
            };
            localTrans.push(insertedTx);
            insertedAny = true;
          }
        }
      }
    }
  }

  return insertedAny;
};

export default function Finance() {
  const { isAdmin } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [filterCurrency, setFilterCurrency] = useState('all');
  const [filterTag, setFilterTag] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [partnerBalances, setPartnerBalances] = useState<any[]>([]);
  const [expensesByTag, setExpensesByTag] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [mrrTotal, setMrrTotal] = useState(0);
  const [cajaPendiente, setCajaPendiente] = useState(0);
  const [cajaCobrada, setCajaCobrada] = useState(0);
  const hasReplicated = useRef(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [finResponse] = await Promise.all([
        supabase.from('finances').select('*').order('date', { ascending: false })
      ]);

      if (finResponse.error) throw finResponse.error;
      let trans = (finResponse.data || []).map((t: any) => ({ ...t, currency: t.currency ?? 'USD' }));

      if (!hasReplicated.current) {
        hasReplicated.current = true;
        const insertedAny = await replicateCyclicExpenses(trans);
        if (insertedAny) {
          const refetchResponse = await supabase.from('finances').select('*').order('date', { ascending: false });
          if (!refetchResponse.error) {
            trans = (refetchResponse.data || []).map((t: any) => ({ ...t, currency: t.currency ?? 'USD' }));
          }
        }
      }

      setTransactions(trans);

      // Process KPIs
      let cobradaUSD = 0;
      let pendienteUSD = 0;
      trans.forEach(t => {
        if (t.type === 'income') {
          const rate = t.currency === 'USD' ? 1 : (t.currency === 'ARS' ? 1 / EXCHANGE_RATES.USD : EXCHANGE_RATES.EUR / EXCHANGE_RATES.USD);
          const amtUSD = parseFloat(t.amount as any) * rate;
          if (t.status === 'Paid') {
            cobradaUSD += amtUSD;
          } else if (t.status === 'Pending' && (t.description?.includes('Hito 2') || t.description?.includes('Hito 3'))) {
            pendienteUSD += amtUSD;
          }
        }
      });
      setCajaCobrada(cobradaUSD);
      setCajaPendiente(pendienteUSD);

      // Fetch Clients for MRR and Projects for Commissions
      const [clientsRes, projectsRes] = await Promise.all([
        supabase.from('clients').select('mrr_value'),
        supabase.from('projects').select('id, name, archetype, source_ally').not('source_ally', 'is', null)
      ]);

      if (!clientsRes.error) {
        const totalMrr = (clientsRes.data || []).reduce((sum, c) => sum + (parseFloat(c.mrr_value as any) || 0), 0);
        setMrrTotal(totalMrr);
      }

      if (!projectsRes.error && projectsRes.data) {
        const computedCommissions: any[] = [];
        const allyProjects = projectsRes.data;
        allyProjects.forEach(proj => {
            const projTrans = trans.filter(t => t.project_id === proj.id && t.type === 'income' && t.category === 'Setup Fee');
            projTrans.forEach(t => {
                let percentage = 0;
                if (proj.archetype === 'Small & Standard (S&S)') percentage = 0.15;
                else if (proj.archetype === 'Medium') percentage = 0.12;
                else if (proj.archetype === 'Nominado') percentage = 0.10;

                if (percentage > 0) {
                    const rate = t.currency === 'USD' ? 1 : (t.currency === 'ARS' ? 1 / EXCHANGE_RATES.USD : EXCHANGE_RATES.EUR / EXCHANGE_RATES.USD);
                    const amountUSD = parseFloat(t.amount as any) * rate;
                    computedCommissions.push({
                        id: `comm_${t.id}`,
                        ally_name: proj.source_ally,
                        project_name: proj.name,
                        transaction_desc: t.description,
                        amount: amountUSD * percentage,
                        status: t.status === 'Paid' ? 'Apta para pago' : 'Pendiente',
                        date: t.date
                    });
                }
            });
        });
        setCommissions(computedCommissions.sort((a, b) => b.date.localeCompare(a.date)));
      }

      // Process Partner Balances
      const partnersList = [
        { id: '1', name: 'Pedro' },
        { id: '2', name: 'Fernando' }
      ];

      const balances = partnersList.map(p => {
        // Encontrar transacciones del socio
        const partnerTrans = trans.filter(t => t.fund_source?.trim().toLowerCase() === p.name.toLowerCase());

        // Retiros en ARS
        const withdrawalsARS = partnerTrans
          .filter(t => t.type === 'withdrawal')
          .reduce((a, t) => {
            const rate = EXCHANGE_RATES[t.currency as keyof typeof EXCHANGE_RATES] || 1;
            return a + (parseFloat(t.amount as any) * rate);
          }, 0);

        // Gastos pagados en ARS
        const expensesPaidARS = partnerTrans
          .filter(t => t.type === 'expense')
          .reduce((a, t) => {
            const rate = EXCHANGE_RATES[t.currency as keyof typeof EXCHANGE_RATES] || 1;
            return a + (parseFloat(t.amount as any) * rate);
          }, 0);

        // Aportes de capital (si se quieren mantener para contexto, pero el saldo neto sigue la fórmula del usuario)
        const contributionsARS = partnerTrans
          .filter(t => t.type === 'income' && t.tag === 'contribution')
          .reduce((a, t) => {
            const rate = EXCHANGE_RATES[t.currency as keyof typeof EXCHANGE_RATES] || 1;
            return a + (parseFloat(t.amount as any) * rate);
          }, 0);

        return {
          ...p,
          contributions: contributionsARS,
          withdrawals: withdrawalsARS,
          expensesPaid: expensesPaidARS,
          // El usuario solicitó: Saldo = Total retiros - Total gastos
          balance: withdrawalsARS - expensesPaidARS
        };
      });
      setPartnerBalances(balances);

      // Process Expenses by Tag for Doughnut Chart
      const tagTotals: Record<string, number> = {};
      trans.filter(t => t.type === 'expense').forEach(t => {
        const tag = t.tag || 'other';
        const rate = EXCHANGE_RATES[t.currency as keyof typeof EXCHANGE_RATES] || 1;
        const amt = parseFloat(t.amount as any) * rate;
        tagTotals[tag] = (tagTotals[tag] || 0) + amt;
      });

      const pieData = Object.entries(tagTotals).map(([tag, total]) => {
        const info = getTagInfo(tag);
        return {
          name: info?.label || 'Otros',
          value: total,
          color: info ? info.color.split(' ')[0].replace('bg-', '#').replace('-100', '') : '#CBD5E1'
        };
      }).sort((a, b) => b.value - a.value);

      // Map tailwind colors to hex for Recharts
      const colorMap: Record<string, string> = {
        blue: '#3B82F6',
        purple: '#A855F7',
        orange: '#F97316',
        cyan: '#06B6D4',
        emerald: '#10B981',
        indigo: '#6366F1',
        gray: '#94A3B8'
      };

      const finalPieData = pieData.map(d => {
        const colorKey = Object.keys(colorMap).find(k => d.name.toLowerCase().includes(k) || d.color.toLowerCase().includes(k));
        return { ...d, color: colorKey ? colorMap[colorKey] : d.color };
      });

      setExpensesByTag(finalPieData);

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
    const exp = transactions.filter(t => (t.type === 'expense' || t.type === 'withdrawal') && t.currency === c.code).reduce((a, t) => a + parseFloat(t.amount as any), 0);
    return { ...c, income: inc, expenses: exp, net: inc - exp };
  });

  const totalBalanceARS = currencyBalances.reduce((acc, curr) => {
    const rate = EXCHANGE_RATES[curr.code as keyof typeof EXCHANGE_RATES] || 1;
    return acc + (curr.net * rate);
  }, 0);
  const monthlyChart = buildMonthlyChartData(transactions);

  return (
    <div className="flex-1 flex flex-col gap-8 w-full max-w-[1400px] mx-auto pb-12" onClick={() => setOpenActionId(null)}>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-4xl md:text-[42px] font-normal tracking-tight text-[#1A1A1A]">Finanzas</h3>
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

      {/* ── KPIs Plan 90 Días ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#222222] text-white rounded-[32px] p-6 shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/10 rounded-2xl"><DollarSign size={24} /></div>
            <span className="flex items-center text-[#222222] bg-green-400 px-3 py-1 rounded-full text-xs font-bold">Caja Real</span>
          </div>
          <p className="text-white/70 text-sm font-medium mb-1">Caja Cobrada (USD)</p>
          <h4 className="text-4xl font-light text-white">
            ${cajaCobrada.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </h4>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/40 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-black/5 rounded-2xl"><DollarSign size={24} className="text-[#666]" /></div>
            <span className="flex items-center text-orange-700 bg-orange-100 px-3 py-1 rounded-full text-xs font-bold">Hitos 2 y 3</span>
          </div>
          <p className="text-[#666] text-sm font-medium mb-1">Caja Pendiente (USD)</p>
          <h4 className="text-4xl font-light text-[#1A1A1A]">
            ${cajaPendiente.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </h4>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/40 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-black/5 rounded-2xl"><DollarSign size={24} className="text-[#666]" /></div>
            <span className="flex items-center text-blue-700 bg-blue-100 px-3 py-1 rounded-full text-xs font-bold">Recurrente</span>
          </div>
          <p className="text-[#666] text-sm font-medium mb-1">MRR Módulo 3 (USD)</p>
          <h4 className="text-4xl font-light text-[#1A1A1A]">
            ${mrrTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </h4>
        </div>
      </div>

      {/* ── Balance Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#222222] text-white rounded-[32px] p-6 shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/10 rounded-2xl"><DollarSign size={24} /></div>
            <span className="flex items-center text-[#222222] bg-[#FFD166] px-3 py-1 rounded-full text-xs font-bold">Consolidado ARS</span>
          </div>
          <p className="text-white/70 text-sm font-medium mb-1">Balance Consolidado (ARS)</p>
          <h4 className={`text-4xl font-light ${totalBalanceARS < 0 ? 'text-red-400' : 'text-white'}`}>
            ${totalBalanceARS.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </h4>
          <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-1">
            <div className="flex justify-between text-[10px] text-white/40 font-bold tracking-wider">
              <span>USD: ${EXCHANGE_RATES.USD.toLocaleString()}</span>
              <span>EUR: ${EXCHANGE_RATES.EUR.toLocaleString()}</span>
            </div>
            <p className="text-[9px] text-white/20 text-right italic">Sincronizado: {exchangeRates.lastUpdated}</p>
          </div>
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
            <h4 className="text-xl font-medium text-[#1A1A1A]">Distribución de Gastos</h4>
            <Tag size={20} className="text-[#666]" />
          </div>
          <div className="h-64 flex flex-col items-center">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={expensesByTag}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expensesByTag.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [`$${v.toLocaleString()}`, '']} contentStyle={{ borderRadius: '16px', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
              {expensesByTag.slice(0, 4).map((entry, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-[10px] text-[#666] font-medium">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Partner Balances ── */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-2xl font-medium text-[#1A1A1A]">Cuenta Corriente Socios</h4>
            <p className="text-[#666666]">Saldos acumulados por aportes y dividendos.</p>
          </div>
          <div className="p-3 bg-white/50 rounded-2xl border border-black/5 shadow-sm">
            <Zap size={20} className="text-[#FFD166]" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partnerBalances.map(pb => (
            <div key={pb.id} className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8 flex flex-col gap-6 transition-transform hover:scale-[1.02]">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-[#1A1A1A] uppercase tracking-tight">{pb.name}</span>
                <div className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${pb.balance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {pb.balance >= 0 ? 'Saldo a favor' : 'Excedente retiros'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Gastos Pagados</span>
                  <span className="text-xl font-medium text-[#1A1A1A]">${pb.expensesPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Retiros</span>
                  <span className="text-xl font-medium text-red-500">${pb.withdrawals.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-black/5 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Saldo Neto Disponible</span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-light ${pb.balance <= 0 ? 'text-[#1A1A1A]' : 'text-red-500'}`}>
                    ${Math.abs(pb.balance).toLocaleString()}
                  </span>
                  <span className="text-sm font-medium text-[#999]">ARS</span>
                </div>
                <p className="text-xs text-[#666] italic mt-1">
                  {pb.balance <= 0 
                    ? `Socio tiene un saldo a favor de $${Math.abs(pb.balance).toLocaleString()} ARS por gastos no retirados.` 
                    : `Socio ha retirado $${pb.balance.toLocaleString()} ARS por encima de sus gastos.`}
                </p>
              </div>
            </div>
          ))}
          {partnerBalances.length === 0 && (
            <div className="col-span-full py-12 text-center bg-black/[0.02] rounded-[32px] border border-dashed border-black/10">
              <p className="text-[#999] text-sm font-medium">No se encontraron registros de socios o transacciones asignadas.</p>
            </div>
          )}
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
              { label: 'Tipo', value: filterType, setter: setFilterType, options: [['all', 'Todos'], ['income', 'Ingresos'], ['expense', 'Gastos'], ['withdrawal', 'Retiros']] },
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

        <div className="overflow-x-auto custom-scrollbar">
          {loading ? <div className="p-20 text-center text-[#666] font-medium">Sincronizando con Supabase...</div> : (
            <table className="w-full text-left border-separate border-spacing-0 min-w-[800px]">
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-sm text-[#1A1A1A] font-medium">{t.description}</div>
                          {t.category === 'cyclic' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/5 text-[#666666] uppercase tracking-wider">
                              <Zap size={8} className="text-[#FFD166]" /> Cíclico
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#999] uppercase tracking-tighter">{t.status}</div>
                      </td>
                      <td className="px-8 py-5">
                        {tagInfo
                          ? <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${tagInfo.color}`}><Tag size={10} />{tagInfo.label}</span>
                          : <span className="text-xs text-[#999] uppercase font-bold tracking-tighter opacity-50">
                              {t.type === 'income' ? 'Ingreso' : (t.type === 'expense' ? 'Gasto' : 'Retiro')}
                            </span>}
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

      {/* ── Comisiones por Pagar ── */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm overflow-hidden mt-8">
        <div className="p-6 md:p-8 border-b border-black/5 flex justify-between items-center bg-white/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FFD166]/20 rounded-2xl text-[#D4A017]">
              <DollarSign size={24} />
            </div>
            <div>
              <h4 className="text-xl font-medium text-[#1A1A1A]">Motor de Comisiones</h4>
              <p className="text-[#666] text-sm">Cálculo de comisiones por referidos (S&S 15%, Medium 12%, Nom 10%)</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/5 bg-black/5">
                <th className="py-4 px-6 text-xs font-semibold text-[#666666] uppercase tracking-wider">Aliado Comercial</th>
                <th className="py-4 px-6 text-xs font-semibold text-[#666666] uppercase tracking-wider">Proyecto</th>
                <th className="py-4 px-6 text-xs font-semibold text-[#666666] uppercase tracking-wider">Hito Relacionado</th>
                <th className="py-4 px-6 text-xs font-semibold text-[#666666] uppercase tracking-wider text-right">Comisión (USD)</th>
                <th className="py-4 px-6 text-xs font-semibold text-[#666666] uppercase tracking-wider text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {commissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#666] italic">No hay comisiones por pagar.</td>
                </tr>
              ) : (
                commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-white/50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-[#1A1A1A]">{c.ally_name}</td>
                    <td className="py-4 px-6 text-sm text-[#666]">{c.project_name}</td>
                    <td className="py-4 px-6 text-sm text-[#666]">{c.transaction_desc}</td>
                    <td className="py-4 px-6 text-sm font-medium text-right text-[#1A1A1A]">${c.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-4 px-6 text-sm text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.status === 'Apta para pago' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {c.status}
                        </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
