import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Search, Filter, Plus, ChevronRight, Activity, Globe, Phone, MapPin, X, Loader2, Trash2, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateLeadEnrichment } from '../lib/gemini-lead-enrichment';

interface Lead {
  id: number;
  empresa: string;
  dominio: string | null;
  sector: string | null;
  localidad: string | null;
  contacto_nombre: string | null;
  contacto_cargo: string | null;
  empleados_estimado: string | null;
  notas: string | null;
  web: string | null;
  linkedin_empresa: string | null;
  instagram: string | null;
  facebook: string | null;
  estado: string;
  pre_call_brief: any | null;
}

const STATUS_STYLES: Record<string, string> = {
  NUEVO: 'bg-black/5 text-[#666666] border-black/10',
  CONTACTADO: 'bg-blue-50 text-blue-600 border-blue-200',
  REUNION_AGENDADA: 'bg-[#FFD166]/20 text-[#1A1A1A] border-[#FFD166]/50',
  ENRIQUECIDO: 'bg-purple-50 text-purple-600 border-purple-200',
  CONVERTIDO: 'bg-green-50 text-green-700 border-green-200',
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVertical, setFilterVertical] = useState('All');
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [enrichingIds, setEnrichingIds] = useState<Set<number>>(new Set());
  const enrichingRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads_cuentas')
        .select('id, empresa, dominio, sector, localidad, contacto_nombre, contacto_cargo, empleados_estimado, notas, web, linkedin_empresa, instagram, facebook, estado, pre_call_brief')
        .order('empresa', { ascending: true });
      if (error) throw error;
      const loadedLeads: Lead[] = data || [];
      setLeads(loadedLeads);
      triggerAutoEnrichment(loadedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerAutoEnrichment = async (leadList: Lead[]) => {
    const pending = leadList.filter((l) => !l.pre_call_brief && !enrichingRef.current.has(l.id));
    for (const l of pending) {
      await enrichLeadInBackground(l);
      // Retardo entre leads para evitar rate limit de Gemini (429)
      await new Promise((res) => setTimeout(res, 3000));
    }
  };

  const enrichLeadInBackground = async (leadToEnrich: Lead) => {
    if (enrichingRef.current.has(leadToEnrich.id)) return;
    
    enrichingRef.current.add(leadToEnrich.id);
    setEnrichingIds(new Set(enrichingRef.current));

    try {
      const briefData = await generateLeadEnrichment({
        empresa: leadToEnrich.empresa,
        dominio: leadToEnrich.dominio,
        sector: leadToEnrich.sector,
        localidad: leadToEnrich.localidad,
        contacto_nombre: leadToEnrich.contacto_nombre,
        contacto_cargo: leadToEnrich.contacto_cargo,
        empleados_estimado: leadToEnrich.empleados_estimado,
        notas: leadToEnrich.notas,
      });

      const nuevoEstado = leadToEnrich.estado === 'NUEVO' ? 'ENRIQUECIDO' : leadToEnrich.estado;
      const r = briefData.redes || {};
      const camposRedes: Record<string, string> = {};
      if (r.web && !leadToEnrich.web) camposRedes.web = r.web;
      if (r.linkedin && !leadToEnrich.linkedin_empresa) camposRedes.linkedin_empresa = r.linkedin;
      if (r.instagram && !leadToEnrich.instagram) camposRedes.instagram = r.instagram;
      if (r.facebook && !leadToEnrich.facebook) camposRedes.facebook = r.facebook;

      const updateData = {
        pre_call_brief: briefData,
        estado: nuevoEstado,
        ...camposRedes,
      };

      const { error } = await supabase
        .from('leads_cuentas')
        .update(updateData)
        .eq('id', leadToEnrich.id);

      if (error) throw error;

      setLeads((prevLeads) =>
        prevLeads.map((item) =>
          item.id === leadToEnrich.id
            ? { ...item, ...camposRedes, pre_call_brief: briefData, estado: nuevoEstado }
            : item
        )
      );
    } catch (err) {
      console.error(`Error al enriquecer automáticamente lead ${leadToEnrich.id} (${leadToEnrich.empresa}):`, err);
    } finally {
      enrichingRef.current.delete(leadToEnrich.id);
      setEnrichingIds(new Set(enrichingRef.current));
    }
  };

  const handleDeleteLeadCard = async (e: React.MouseEvent, id: number, empresa: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el lead "${empresa}"?`)) return;
    try {
      await supabase.from('client_contacts').delete().eq('lead_id', id);
      const { error } = await supabase.from('leads_cuentas').delete().eq('id', id);
      if (error) throw error;
      fetchLeads();
    } catch (error: any) {
      console.error('Error al eliminar el lead:', error);
      alert('Error al eliminar el lead: ' + error.message);
    }
  };

  const verticals = ['All', ...Array.from(new Set(leads.map(l => l.sector).filter(Boolean) as string[]))];

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = (lead.empresa || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVertical = filterVertical === 'All' || lead.sector === filterVertical;
    return matchesSearch && matchesVertical;
  });

  return (
    <div className="flex-1 flex flex-col gap-4 w-full max-w-[1400px] mx-auto min-h-screen p-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#1A1A1A] flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-[#FFD166]" />
            Leads
          </h3>
          <p className="text-xs text-[#666666] mt-0.5">Gestión de prospectos, enriquecimiento automático y radiografía operativa.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsNewLeadOpen(true)}
            className="flex items-center justify-center gap-1.5 bg-[#222222] hover:bg-black text-white px-4 py-2 rounded-full text-xs font-bold transition-colors shadow-md"
          >
            <Plus size={16} />
            Nuevo Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white/80 p-3 rounded-2xl border border-black/5 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
          <input
            type="text"
            placeholder="Buscar por empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-black/10 text-[#1A1A1A] text-xs pl-10 pr-3 py-2 rounded-full focus:ring-2 focus:ring-[#FFD166]/20 focus:border-[#FFD166] outline-none transition-all placeholder:text-[#999999]"
          />
        </div>
        <div className="relative min-w-[180px]">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
          <select
            value={filterVertical}
            onChange={(e) => setFilterVertical(e.target.value)}
            className="w-full bg-white border border-black/10 text-[#1A1A1A] text-xs pl-10 pr-3 py-2 rounded-full focus:ring-2 focus:ring-[#FFD166]/20 focus:border-[#FFD166] outline-none transition-all appearance-none cursor-pointer"
          >
            {verticals.map(v => (
              <option key={v} value={v}>{v === 'All' ? 'Todas las verticales' : v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#666666]">Cargando leads...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#666666]">No se encontraron leads.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => {
            const isEnriching = enrichingIds.has(lead.id);

            return (
              <Link
                to={`/leads/${lead.id}`}
                key={lead.id}
                className="group flex flex-col gap-3 bg-white border border-black/5 hover:border-[#FFD166]/50 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-[#FFD166] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-black/2 rounded-xl flex items-center justify-center border border-black/5 shadow-xs group-hover:bg-[#FFD166]/10 transition-colors">
                      <Building2 className="w-4 h-4 text-[#1A1A1A] group-hover:text-[#FFD166] transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#1A1A1A]">{lead.empresa}</h4>
                      <div className="flex items-center gap-1 text-[#666666] text-[11px] font-medium">
                        <Globe className="w-3 h-3" />
                        {lead.dominio || 'Sin dominio'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-1 text-xs text-[#666666]">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#999999]" />
                    <span className="font-medium text-[#1A1A1A]">{lead.sector || 'Sin sector'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#999999]" />
                    {lead.contacto_nombre || 'Sin contacto'}
                  </div>
                </div>

                <div className="mt-1 pt-2.5 border-t border-black/5 flex items-center justify-between">
                  {isEnriching ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-purple-50 text-purple-600 border-purple-200 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                      ENRIQUECIENDO...
                    </span>
                  ) : (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[lead.estado] || STATUS_STYLES.NUEVO}`}>
                      {lead.estado === 'ENRIQUECIDO' ? 'CALIFICADO' : lead.estado}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleDeleteLeadCard(e, lead.id, lead.empresa)}
                      title="Eliminar lead"
                      className="w-7 h-7 rounded-full bg-black/5 hover:bg-red-50 text-[#999999] hover:text-red-500 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-[#222222] transition-colors">
                      <ChevronRight className="w-3.5 h-3.5 text-[#666666] group-hover:text-white" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {isNewLeadOpen && (
        <NewLeadModal
          onClose={() => setIsNewLeadOpen(false)}
          onSaved={(newLead) => {
            setIsNewLeadOpen(false);
            fetchLeads();
            if (newLead) {
              enrichLeadInBackground(newLead);
            }
          }}
        />
      )}
    </div>
  );
}

function NewLeadModal({ onClose, onSaved }: { onClose: () => void; onSaved: (newLead?: Lead) => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ empresa: '', dominio: '', sector: '', contacto_nombre: '', email: '', telefono: '', notas: '' });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa.trim()) return;
    try {
      setSaving(true);
      const { data, error } = await supabase.from('leads_cuentas').insert([{
        empresa: form.empresa.trim(),
        dominio: form.dominio.trim() || null,
        sector: form.sector.trim() || null,
        contacto_nombre: form.contacto_nombre.trim() || null,
        email: form.email.trim() || null,
        telefono: form.telefono.trim() || null,
        notas: form.notas.trim() || null,
        fuente: 'Manual',
        estado: 'NUEVO',
      }]).select('*').single();
      if (error) throw error;
      onSaved(data);
    } catch (error: any) {
      console.error('Error creating lead:', error);
      alert('Error al crear el lead: ' + (error.message || 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-medium text-[#1A1A1A]">Nuevo Lead</h3>
          <button type="button" onClick={onClose}><X size={20} /></button>
        </div>
        <input autoFocus required placeholder="Empresa" value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} className="w-full h-12 rounded-2xl border border-black/10 bg-black/5 px-4" />
        <div className="grid grid-cols-2 gap-4">
          <input placeholder="Dominio (ej. empresa.com)" value={form.dominio} onChange={(e) => setForm({ ...form, dominio: e.target.value })} className="h-12 rounded-2xl border border-black/10 bg-black/5 px-4" />
          <input placeholder="Sector / Vertical" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className="h-12 rounded-2xl border border-black/10 bg-black/5 px-4" />
        </div>
        <input placeholder="Nombre de contacto" value={form.contacto_nombre} onChange={(e) => setForm({ ...form, contacto_nombre: e.target.value })} className="w-full h-12 rounded-2xl border border-black/10 bg-black/5 px-4" />
        <div className="grid grid-cols-2 gap-4">
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12 rounded-2xl border border-black/10 bg-black/5 px-4" />
          <input placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="h-12 rounded-2xl border border-black/10 bg-black/5 px-4" />
        </div>
        <textarea placeholder="Notas (origen del lead, contexto, etc.)" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} className="w-full h-20 rounded-2xl border border-black/10 bg-black/5 px-4 py-3 resize-none" />
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-full text-[#666666] hover:bg-black/5 transition-colors">Cancelar</button>
          <button
            type="submit"
            disabled={saving || !form.empresa.trim()}
            className="flex items-center gap-2 bg-[#222222] hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-full font-medium transition-all shadow-lg active:scale-95"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Crear
          </button>
        </div>
      </form>
    </div>
  );
}

