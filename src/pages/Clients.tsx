import { Plus, Search, Filter, MoreVertical, Building2, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { mockClients, mockStats } from '../data/mockData';

export default function Clients() {
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

      <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm overflow-hidden flex flex-col">
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

        <div className="overflow-x-auto">
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
              {mockClients.map((client) => (
                <tr key={client.id} className="hover:bg-white/40 transition-colors group">
                  <td className="px-6 py-4">
                    <Link to={`/clients/${client.id}`} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#1A1A1A] group-hover:bg-[#FFD166] transition-colors">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <span className="font-medium text-[#1A1A1A]">{client.name}</span>
                        <p className="text-xs text-[#666666] mt-0.5">ID: CLI-{client.id.toString().padStart(4, '0')}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-[#1A1A1A]">{client.contact}</span>
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
                    <button className="text-[#666666] hover:text-[#1A1A1A] transition-colors p-2 rounded-full hover:bg-black/5">
                      <MoreVertical size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-black/5 flex items-center justify-between">
          <p className="text-sm text-[#666666]">Mostrando <span className="font-medium text-[#1A1A1A]">1</span> a <span className="font-medium text-[#1A1A1A]">{mockClients.length}</span> de <span className="font-medium text-[#1A1A1A]">{mockStats.totalClients}</span> clientes</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-black/10 rounded-full text-sm font-medium text-[#1A1A1A] hover:bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>Anterior</button>
            <button className="px-4 py-2 border border-black/10 rounded-full text-sm font-medium text-[#1A1A1A] hover:bg-white/50">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
}
