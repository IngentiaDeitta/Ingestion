import { DollarSign, Download, Filter, ArrowUpRight, ArrowDownRight, MoreVertical, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  status: string;
  project_id?: string;
}

export default function Finance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    balance: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    revenueGrowth: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('finances')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      
      const trans = data || [];
      setTransactions(trans);

      // Calcular estadísticas
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let balance = 0;
      let monthlyRevenue = 0;
      let monthlyExpenses = 0;

      trans.forEach((t: any) => {
        const amount = parseFloat(t.amount);
        const tDate = new Date(t.date);
        
        if (t.type === 'income') {
          balance += amount;
          if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
            monthlyRevenue += amount;
          }
        } else {
          balance -= amount;
          if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
            monthlyExpenses += amount;
          }
        }
      });

      setStats({
        balance,
        monthlyRevenue,
        monthlyExpenses,
        revenueGrowth: 5 
      });

    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de eliminar esta transacción?')) return;
    try {
      const { error } = await supabase.from('finances').delete().eq('id', id);
      if (error) throw error;
      fetchData();
      setOpenActionId(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleToggleStatus = async (transaction: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = transaction.status === 'Paid' ? 'Pending' : 'Paid';
    try {
      const { error } = await supabase
        .from('finances')
        .update({ status: newStatus })
        .eq('id', transaction.id);
      if (error) throw error;
      fetchData();
      setOpenActionId(null);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto" onClick={() => setOpenActionId(null)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-[42px] font-normal tracking-tight text-[#1A1A1A]">Finanzas</h3>
          <p className="text-[#666666] mt-1">Control de ingresos, gastos y facturación real.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center gap-2 bg-white/50 border border-black/10 hover:bg-white/80 text-[#1A1A1A] px-6 py-3 rounded-full text-sm font-medium transition-colors shadow-sm">
            <Download size={20} />
            Exportar CSV
          </button>
          <Link to="/finance/new-invoice" className="flex items-center justify-center gap-2 bg-[#222222] hover:bg-black text-white px-6 py-3 rounded-full text-sm font-medium transition-colors shadow-lg shadow-black/10">
            <DollarSign size={20} />
            Nueva Transacción
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#222222] text-white rounded-[32px] p-6 shadow-xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-white/10 rounded-2xl">
              <DollarSign size={24} />
            </div>
            <span className="flex items-center text-[#222222] bg-[#FFD166] px-3 py-1 rounded-full text-xs font-bold">
              <ArrowUpRight size={14} className="mr-1" /> Balance Total
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-white/70 text-sm font-medium mb-1">Balance Actual</p>
            <h4 className="text-4xl font-light">${stats.balance.toLocaleString()}</h4>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/40 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-[#1A1A1A]">
              <ArrowUpRight size={24} />
            </div>
            <span className="flex items-center text-[#1A1A1A] bg-[#FFD166] px-3 py-1 rounded-full text-xs font-bold">
              Mes Actual
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-[#666666] text-sm font-medium mb-1">Ingresos (Mes)</p>
            <h4 className="text-4xl font-light text-[#1A1A1A]">${stats.monthlyRevenue.toLocaleString()}</h4>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/40 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-[#1A1A1A]">
              <ArrowDownRight size={24} />
            </div>
            <span className="flex items-center text-[#666666] bg-black/5 px-3 py-1 rounded-full text-xs font-bold">
              Mes Actual
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-[#666666] text-sm font-medium mb-1">Gastos (Mes)</p>
            <h4 className="text-4xl font-light text-[#1A1A1A]">${stats.monthlyExpenses.toLocaleString()}</h4>
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-black/5 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <h4 className="text-xl font-medium text-[#1A1A1A]">Flujo de Caja</h4>
          <button className="flex items-center justify-center gap-2 bg-white/50 border border-black/10 hover:bg-white/80 text-[#1A1A1A] px-6 py-3 rounded-full text-sm font-medium transition-colors w-full sm:w-auto">
            <Filter size={18} />
            Filtros
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center text-[#666666]">Cargando transacciones...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/5">
                  <th className="px-6 py-4 text-xs font-medium text-[#666666] uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#666666] uppercase tracking-wider">Descripción</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#666666] uppercase tracking-wider text-center">Estado</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#666666] uppercase tracking-wider text-right">Importe</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#666666] uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-white/40 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-[#1A1A1A]">{new Date(transaction.date).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-[#1A1A1A]">{transaction.description}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${transaction.status === 'Paid' || transaction.status === 'Completado'
                        ? 'bg-[#FFD166]/20 text-[#1A1A1A] border-[#FFD166]/50'
                        : 'bg-black/5 text-[#666666] border-black/10'
                        }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                        {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionId(openActionId === transaction.id ? null : transaction.id);
                        }}
                        className="text-[#666666] hover:text-[#1A1A1A] transition-colors p-2 rounded-full hover:bg-black/5"
                      >
                        <MoreVertical size={20} />
                      </button>
                      
                      {openActionId === transaction.id && (
                        <div className="absolute right-12 top-0 w-48 bg-white rounded-2xl shadow-xl border border-black/5 flex flex-col p-2 z-[9999]" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={(e) => handleToggleStatus(transaction, e)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1A1A1A] hover:bg-black/5 rounded-xl transition-colors text-left"
                          >
                            <DollarSign size={16} />
                            {transaction.status === 'Paid' ? 'Marcar Pendiente' : 'Marcar Pagado'}
                          </button>
                          <button 
                            onClick={(e) => handleDelete(transaction.id, e)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors text-left"
                          >
                            <Trash2 size={16} />
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-[#666666]">No hay transacciones registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
