import { Plus, Search, Filter, MoreVertical, Building2, Mail, Trash2, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';

interface Client {
  id: string;
  name: string;
  industry: string;
  email: string;
  contact_person: string;
  status: string;
}

export default function Clients() {
  const { isAdmin } = useUser();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      setClients(clients.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Error al eliminar cliente');
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-[42px] font-normal tracking-tight text-[#1A1A1A]">Directorio de Clientes</h3>
          <p className="text-[#666666] mt-1">Gestiona la información y el estado de tus clientes.</p>
        </div>
        <Link to="/clients/new" className="flex items-center justify-center gap-2 bg-[#222222] hover:bg-black text-white px-6 py-3 rounded-full text-sm font-medium transition-colors shadow-lg shadow-black/10">
          <Plus size={20} />
          Nuevo Cliente
        </Link>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm flex flex-col">
        <div className="p-6 border-b border-black/5 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#666666]">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Buscar clientes..."
              className="block w-full pl-12 pr-4 py-3 rounded-full border border-black/10 bg-white/50 text-[#1A1A1A] placeholder-[#666666] focus:border-[#FFD166] focus:ring-2 focus:ring-[#FFD166]/20 sm:text-sm outline-none transition-all"
            />
          </div>
          <button className="flex items-center justify-center gap-2 bg-white/50 border border-black/10 hover:bg-white/80 text-[#1A1A1A] px-6 py-3 rounded-full text-sm font-medium transition-colors w-full sm:w-auto">
            <Filter size={20} />
            Filtros
          </button>
        </div>

        {loading ? (
          <div className="p-20 text-center text-[#666666]">Cargando clientes...</div>
        ) : (
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/5">
                  <th className="px-6 py-4 text-xs font-medium text-[#666666] uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#666666] uppercase tracking-wider">Contacto Principal</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#666666] uppercase tracking-wider">Industria</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#666666] uppercase tracking-wider text-center">Estado</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#666666] uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-white/40 transition-colors group">
                    <td className="px-6 py-4">
                      <Link to={`/clients/${client.id}`} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#1A1A1A] group-hover:bg-[#FFD166] transition-colors">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <span className="font-medium text-[#1A1A1A]">{client.name}</span>
                          <p className="text-xs text-[#666666] mt-0.5">ID: CLI-{client.id.substring(0, 4).toUpperCase()}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-[#1A1A1A]">{client.contact_person}</span>
                        <div className="flex items-center gap-3 text-xs text-[#666666]">
                          <span className="flex items-center gap-1"><Mail size={12} /> {client.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#666666]">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/50 text-[#1A1A1A] border border-black/5">
                        {client.industry}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${client.status === 'Activo'
                        ? 'bg-[#FFD166]/20 text-[#1A1A1A] border-[#FFD166]/50'
                        : 'bg-black/5 text-[#666666] border-black/10'
                        }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isAdmin && (
                        <div className="relative inline-block text-left">
                          <button 
                            onClick={() => setActiveMenu(activeMenu === client.id ? null : client.id)}
                            className="text-[#666666] hover:text-[#1A1A1A] p-2 rounded-full hover:bg-black/5"
                          >
                            <MoreVertical size={20} />
                          </button>
  
                          {activeMenu === client.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-[90]" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenu(null);
                                }}
                              ></div>
                              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white shadow-2xl border border-black/5 z-[100] overflow-hidden py-1">
                                <Link 
                                  to={`/clients/${client.id}`}
                                  className="flex items-center gap-3 px-4 py-3 text-sm text-[#1A1A1A] hover:bg-black/5 transition-colors"
                                >
                                  <Edit size={16} />
                                  Editar / Ver
                                </Link>
                                <button 
                                  onClick={() => {
                                    handleDelete(client.id);
                                    setActiveMenu(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-black/5"
                                >
                                  <Trash2 size={16} />
                                  Eliminar
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-6 border-t border-black/5">
          <p className="text-sm text-[#666666]">Mostrando <span className="font-medium text-[#1A1A1A]">{clients.length}</span> clientes</p>
        </div>
      </div>
    </div>
  );
}
