import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, Filter, Clock, AlertTriangle, CheckCircle2, XCircle, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * Propuestas comerciales e historial de cotizaciones.
 */
interface Propuesta {
  id: string;
  title: string;
  client_name: string;
  project_name: string | null;
  status: string;
  total_amount: number;
  sent_date: string | null;
  generation_date: string | null;
  comments: string | null;
  lead_id: number | null;
  client_id: string | null;
  project_id: string | null;
}

const ESTADOS: Record<string, { chip: string; icon: typeof Clock; label: string }> = {
  Generada: { chip: 'bg-black/5 text-[#666666] border-black/10', icon: FileText, label: 'Generada' },
  Enviada: { chip: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock, label: 'Enviada' },
  Aceptada: { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Aceptada (Ganada)' },
  Ganada: { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Aceptada (Ganada)' },
  Rechazada: { chip: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle, label: 'Rechazada' },
  Perdida: { chip: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle, label: 'Perdida' },
};

/** Días desde el envío. Sirve para detectar propuestas que se enfrían. */
function diasDesde(fecha: string | null): number | null {
  if (!fecha) return null;
  return Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000);
}

export default function Propuestas() {
  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<'PENDIENTES' | 'TODAS' | 'Aceptada' | 'Rechazada'>('TODAS');

  useEffect(() => { fetchPropuestas(); }, []);

  const fetchPropuestas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quotes')
        .select('id, title, client_name, project_name, status, total_amount, sent_date, generation_date, comments, lead_id, client_id, project_id')
        .order('generation_date', { ascending: false });
      if (error) throw error;
      
      const uniquePropuestas: Propuesta[] = [];
      const seenKeys = new Set<string>();
      (data || []).forEach((p: any) => {
        const key = `${(p.client_name || '').trim().toLowerCase()}-${(p.title || '').trim().toLowerCase()}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniquePropuestas.push(p);
        }
      });
      setPropuestas(uniquePropuestas);
    } catch (e) {
      console.error('Error cargando propuestas:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusChange = async (proposalId: string, newStatus: string) => {
    try {
      const updates: Record<string, any> = { status: newStatus };
      if (newStatus === 'Enviada') {
        updates.sent_date = new Date().toISOString();
      }
      const { error } = await supabase
        .from('quotes')
        .update(updates)
        .eq('id', proposalId);
      
      if (error) throw error;
      setPropuestas(prev => prev.map(p => p.id === proposalId ? { ...p, ...updates } : p));
    } catch (e: any) {
      console.error('Error actualizando estado de propuesta:', e);
      alert('Error al actualizar estado: ' + e.message);
    }
  };

  const visibles = propuestas.filter((p) => {
    const coincide = `${p.title} ${p.client_name}`.toLowerCase().includes(busqueda.toLowerCase());
    if (!coincide) return false;
    if (filtro === 'TODAS') return true;
    if (filtro === 'PENDIENTES') return p.status === 'Generada' || p.status === 'Enviada';
    if (filtro === 'Aceptada') return p.status === 'Aceptada' || p.status === 'Ganada';
    if (filtro === 'Rechazada') return p.status === 'Rechazada' || p.status === 'Perdida';
    return p.status === filtro;
  });

  const pendientes = propuestas.filter((p) => p.status === 'Generada' || p.status === 'Enviada');
  const montoPendiente = pendientes.reduce((a, p) => a + Number(p.total_amount || 0), 0);
  const aceptadas = propuestas.filter((p) => p.status === 'Aceptada' || p.status === 'Ganada').length;
  const cerradas = propuestas.filter((p) => p.status === 'Aceptada' || p.status === 'Ganada' || p.status === 'Rechazada' || p.status === 'Perdida').length;
  const tasaCierre = cerradas > 0 ? Math.round((aceptadas / cerradas) * 100) : null;

  return (
    <div className="flex-1 flex flex-col gap-5 w-full max-w-[1400px] mx-auto p-5 text-[#1A1A1A]">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 pb-3">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">Propuestas Comercial</h3>
          <p className="text-[#666666] text-xs mt-0.5">
            Registro histórico de propuestas comerciales, cotizaciones ganadas y oportunidades pendientes.
          </p>
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Pendientes de respuesta', valor: pendientes.length, sufijo: '' },
          { label: 'Monto en juego', valor: montoPendiente, sufijo: 'USD', money: true },
          { label: 'Aceptadas / Ganadas', valor: aceptadas, sufijo: '' },
          { label: 'Tasa de cierre', valor: tasaCierre, sufijo: '%', vacio: tasaCierre === null },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-black/10 shadow-xs p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1">{k.label}</p>
            <p className="text-xl font-bold text-[#1A1A1A]">
              {k.vacio ? '—' : k.money ? `$${Number(k.valor).toLocaleString('es-AR')}` : k.valor}
              {!k.vacio && k.sufijo && <span className="text-xs text-[#666666] ml-1 font-normal">{k.sufijo}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-2xl border border-black/10 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
          <input
            type="text"
            placeholder="Buscar por cliente o propuesta..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-black/5 border border-black/10 text-[#1A1A1A] pl-10 pr-3 py-2 text-xs rounded-xl focus:ring-2 focus:ring-[#FFD166]/30 outline-none transition-all"
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as any)}
            className="w-full bg-black/5 border border-black/10 text-[#1A1A1A] pl-10 pr-3 py-2 text-xs rounded-xl outline-none appearance-none cursor-pointer font-medium"
          >
            <option value="TODAS">Todas las propuestas</option>
            <option value="PENDIENTES">Pendientes de respuesta</option>
            <option value="Aceptada">Aceptadas (Ganadas)</option>
            <option value="Rechazada">Rechazadas / Perdidas</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#666666]">Cargando propuestas...</div>
      ) : visibles.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#666666]">No hay propuestas que coincidan con los filtros.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibles.map((p) => {
            const est = ESTADOS[p.status] || ESTADOS.Generada;
            const Icono = est.icon;
            const dias = diasDesde(p.sent_date || p.generation_date);
            const enfriada = (p.status === 'Enviada' || p.status === 'Generada') && dias !== null && dias > 14;

            return (
              <div key={p.id} className="group flex flex-col gap-3 bg-white border border-black/10 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-2">
                  <select
                    value={p.status || 'Generada'}
                    onChange={(e) => handleQuickStatusChange(p.id, e.target.value)}
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border cursor-pointer outline-none ${est.chip}`}
                  >
                    <option value="Generada">📄 Generada</option>
                    <option value="Enviada">⏱ Enviada</option>
                    <option value="Aceptada">✓ Aceptada (Ganada)</option>
                    <option value="Rechazada">✕ Rechazada (Perdida)</option>
                  </select>

                  {p.sent_date ? (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      Enviada {dias}d
                    </span>
                  ) : (
                    <button
                      onClick={() => handleQuickStatusChange(p.id, 'Enviada')}
                      className="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full transition-colors"
                      title="Marcar como enviada hoy"
                    >
                      + Marcar Enviada
                    </button>
                  )}
                </div>

                <div>
                  <Link to={`/propuestas/${p.id}`} className="hover:text-[#FFB020] transition-colors">
                    <h4 className="text-sm font-bold text-[#1A1A1A] hover:text-[#FFB020] transition-colors leading-snug">{p.title}</h4>
                  </Link>
                  <p className="flex items-center gap-1.5 text-xs text-[#666666] mt-1">
                    <Building2 size={12} className="text-[#999999]" /> {p.client_name}
                  </p>
                </div>

                {Number(p.total_amount) > 0 && (
                  <p className="text-xl font-bold text-[#1A1A1A]">
                    ${Number(p.total_amount).toLocaleString('es-AR')}
                    <span className="text-xs text-[#666666] font-medium ml-1">USD</span>
                  </p>
                )}

                {(p.status === 'Aceptada' || p.status === 'Ganada') && p.project_id && (
                  <Link
                    to={`/projects/${p.project_id}`}
                    className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 hover:bg-emerald-100 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold text-emerald-800">
                        Proyecto en Ejecución
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700">Ver proyecto →</span>
                  </Link>
                )}

                {(p.status === 'Rechazada' || p.status === 'Perdida') && (
                  <p className="text-[10px] text-rose-600 font-semibold bg-rose-50 border border-rose-100 rounded-lg px-2 py-1">
                    Oportunidad cerrada sin proyecto
                  </p>
                )}

                {p.comments && (
                  <p className="text-xs text-[#666666] leading-relaxed line-clamp-2">{p.comments}</p>
                )}

                <div className="mt-auto pt-3 border-t border-black/5 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[10px] text-[#666666] font-medium">
                      {p.sent_date
                        ? `Enviada: ${new Date(p.sent_date).toLocaleDateString('es-AR')}`
                        : `Generada: ${p.generation_date ? new Date(p.generation_date).toLocaleDateString('es-AR') : 'Sin fecha'}`}
                    </span>
                    <div className="flex items-center gap-2">
                      {p.lead_id && (
                        <Link to={`/leads/${p.lead_id}`} className="text-[10px] font-bold text-[#666666] hover:text-[#1A1A1A]">
                          Ver Lead
                        </Link>
                      )}
                      {p.client_id && (
                        <Link to={`/clients/${p.client_id}`} className="text-[10px] font-bold text-[#666666] hover:text-[#1A1A1A]">
                          Ver Cliente
                        </Link>
                      )}
                    </div>
                  </div>
                  <Link 
                    to={`/propuestas/${p.id}`}
                    className="flex items-center justify-center gap-1.5 w-full py-2 bg-black/5 hover:bg-black/10 text-[#1A1A1A] text-xs font-bold rounded-xl transition-colors"
                  >
                    Ver / Editar Detalle →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
