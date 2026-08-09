import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, BrainCircuit, Play, Loader2, Target, AlertTriangle, MessageCircle, Server, Quote, ListChecks, Link2, Users, Pencil, Save, X, Plus, Trash2, Globe, Linkedin, Instagram, Facebook, UserCheck, History } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateLeadEnrichment, PreCallBrief } from '../lib/gemini-lead-enrichment';

interface Lead {
  id: number;
  empresa: string;
  dominio: string | null;
  sector: string | null;
  localidad: string | null;
  provincia: string | null;
  contacto_nombre: string | null;
  contacto_cargo: string | null;
  email: string | null;
  telefono: string | null;
  empleados_estimado: string | null;
  web: string | null;
  linkedin_empresa: string | null;
  instagram: string | null;
  facebook: string | null;
  notas: string | null;
  fuente: string;
  estado: string;
  converted_client_id: string | null;
  pre_call_brief: PreCallBrief | null;
}

interface Contacto {
  id?: string;
  first_name: string;
  last_name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
}

/** Empresa ya conocida: como cliente activo o como otro lead. */
interface Coincidencia {
  tipo: 'CLIENTE' | 'LEAD';
  id: string;
  nombre: string;
}

/** Una entrada del historial: cotización enviada, proyecto ganado o perdido. */
interface Interaccion {
  id: string;
  tipo: 'COTIZACION' | 'PROYECTO';
  titulo: string;
  estado: string;
  monto: number | null;
  fecha: string;
  detalle: string | null;
  /** Para cotizaciones: si derivó en un proyecto. */
  derivo_en_proyecto: boolean;
  link: string | null;
}

const ESTADO_INTERACCION: Record<string, { color: string; label: string }> = {
  Generada: { color: 'bg-black/5 text-[#666666] border-black/10', label: 'Generada' },
  Enviada: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Enviada' },
  Aceptada: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Aceptada' },
  Rechazada: { color: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Rechazada' },
  Ganado: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Ganado' },
  Perdido: { color: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Perdido' },
};

const CAMPOS_EDITABLES = [
  { k: 'empresa', label: 'Empresa' },
  { k: 'dominio', label: 'Dominio' },
  { k: 'sector', label: 'Rubro / Sector' },
  { k: 'localidad', label: 'Localidad' },
  { k: 'provincia', label: 'Provincia' },
  { k: 'contacto_nombre', label: 'Contacto principal' },
  { k: 'contacto_cargo', label: 'Cargo' },
  { k: 'email', label: 'Email' },
  { k: 'telefono', label: 'Teléfono' },
  { k: 'empleados_estimado', label: 'Empleados (estimado)' },
] as const;

const REDES = [
  { k: 'web', label: 'Sitio web', icon: Globe },
  { k: 'linkedin_empresa', label: 'LinkedIn', icon: Linkedin },
  { k: 'instagram', label: 'Instagram', icon: Instagram },
  { k: 'facebook', label: 'Facebook', icon: Facebook },
] as const;

const NIVEL_STYLES: Record<string, { dot: string; label: string }> = {
  ALTA: { dot: 'bg-rose-500', label: 'text-rose-600' },
  MEDIA: { dot: 'bg-orange-500', label: 'text-orange-600' },
  BAJA: { dot: 'bg-amber-400', label: 'text-amber-600' },
};

export default function LeadDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnriching, setIsEnriching] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const autoIntentado = useRef<Set<number>>(new Set());

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<Partial<Lead>>({});
  const [guardando, setGuardando] = useState(false);
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [coincidencia, setCoincidencia] = useState<Coincidencia | null>(null);
  const [historial, setHistorial] = useState<Interaccion[]>([]);

  useEffect(() => {
    if (id) fetchLead();
  }, [id]);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads_cuentas')
        .select('id, empresa, dominio, sector, localidad, provincia, contacto_nombre, contacto_cargo, email, telefono, empleados_estimado, web, linkedin_empresa, instagram, facebook, notas, fuente, estado, converted_client_id, pre_call_brief')
        .eq('id', id)
        .single();
      if (error) throw error;
      setLead(data);
      setForm(data);
      await Promise.all([buscarCoincidencia(data), cargarContactos(data.id), cargarHistorial(data)]);
    } catch (error) {
      console.error('Error fetching lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarContactos = async (leadId: number) => {
    const { data } = await supabase
      .from('client_contacts')
      .select('id, first_name, last_name, role, email, phone')
      .eq('lead_id', leadId)
      .order('created_at');
    setContactos(data || []);
  };

  /**
   * Historial de interacciones: cotizaciones enviadas al lead y proyectos de la
   * empresa. Se cruza para saber cuáles derivaron en proyecto y cuáles no.
   */
  const cargarHistorial = async (l: Lead) => {
    const [{ data: cotis }, { data: proys }] = await Promise.all([
      supabase.from('quotes')
        .select('id, title, status, total_amount, generation_date, sent_date, comments, project_id')
        .eq('lead_id', l.id).order('generation_date', { ascending: false }),
      supabase.from('projects')
        .select('id, name, status, outcome, budget, created_at, description')
        .ilike('client', l.empresa).order('created_at', { ascending: false }),
    ]);

    const items: Interaccion[] = [];
    const seenQuotes = new Set<string>();
    const projectIds = new Set((proys || []).map((p: any) => p.id));

    (cotis || []).forEach((q: any) => {
      // Si la cotización derivó en un proyecto existente, su último estadio es PROYECTO.
      // No la mostramos duplicada como cotización.
      const derivo = !!q.project_id && projectIds.has(q.project_id);
      if (derivo) return;

      const titleKey = (q.title || '').trim().toLowerCase();
      if (seenQuotes.has(titleKey)) return;
      seenQuotes.add(titleKey);

      items.push({
        id: q.id,
        tipo: 'COTIZACION',
        titulo: q.title,
        estado: q.status || 'Generada',
        monto: q.total_amount ? Number(q.total_amount) : null,
        fecha: q.sent_date || q.generation_date,
        detalle: q.comments,
        derivo_en_proyecto: false,
        link: `/smart-quoter?quoteId=${q.id}`,
      });
    });

    (proys || []).forEach((p: any) => items.push({
      id: p.id,
      tipo: 'PROYECTO',
      titulo: p.name,
      estado: p.outcome || p.status || '—',
      monto: p.budget ? Number(p.budget) : null,
      fecha: p.created_at,
      detalle: p.description,
      derivo_en_proyecto: false,
      link: `/projects/${p.id}`,
    }));

    items.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    setHistorial(items);
  };

  /** Detecta si esta empresa ya existe como cliente o como otro lead. */
  const buscarCoincidencia = async (l: Lead) => {
    if (l.converted_client_id) {
      const { data } = await supabase.from('clients').select('id, name').eq('id', l.converted_client_id).maybeSingle();
      if (data) { setCoincidencia({ tipo: 'CLIENTE', id: data.id, nombre: data.name }); return; }
    }

    // Cliente por email, dominio o nombre de empresa.
    let cli: { id: string; name: string } | null = null;
    if (l.email) {
      const { data } = await supabase.from('clients').select('id, name').ilike('email', l.email).limit(1).maybeSingle();
      cli = data;
    }
    if (!cli && l.dominio) {
      const { data } = await supabase.from('clients').select('id, name').ilike('email', `%@${l.dominio}`).limit(1).maybeSingle();
      cli = data;
    }
    if (!cli) {
      const { data } = await supabase.from('clients').select('id, name').ilike('name', l.empresa).limit(1).maybeSingle();
      cli = data;
    }
    if (cli) { setCoincidencia({ tipo: 'CLIENTE', id: cli.id, nombre: cli.name }); return; }

    // Otro lead de la misma empresa o dominio.
    if (l.dominio) {
      const { data } = await supabase
        .from('leads_cuentas').select('id, empresa')
        .eq('dominio', l.dominio).neq('id', l.id).limit(1).maybeSingle();
      if (data) { setCoincidencia({ tipo: 'LEAD', id: String(data.id), nombre: data.empresa }); return; }
    }
    setCoincidencia(null);
  };

  const guardarLead = async () => {
    if (!lead) return;
    setGuardando(true);
    try {
      const cambios: Record<string, unknown> = {};
      [...CAMPOS_EDITABLES.map((c) => c.k), ...REDES.map((r) => r.k)].forEach((k) => {
        const v = (form as any)[k];
        cambios[k] = typeof v === 'string' ? (v.trim() || null) : v ?? null;
      });
      const { error } = await supabase.from('leads_cuentas').update(cambios).eq('id', lead.id);
      if (error) throw error;

      // Contactos: los nuevos se insertan, los existentes se actualizan.
      for (const c of contactos) {
        const fila = {
          lead_id: lead.id,
          first_name: c.first_name.trim(),
          last_name: (c.last_name || '').trim(),
          role: c.role?.trim() || null,
          email: c.email?.trim() || null,
          phone: c.phone?.trim() || null,
        };
        if (!fila.first_name) continue;
        if (c.id) await supabase.from('client_contacts').update(fila).eq('id', c.id);
        else await supabase.from('client_contacts').insert([fila]);
      }

      setEditando(false);
      await fetchLead();
    } catch (error: any) {
      console.error('Error guardando lead:', error);
      alert('Error al guardar: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const borrarContacto = async (idx: number) => {
    const c = contactos[idx];
    if (c.id) await supabase.from('client_contacts').delete().eq('id', c.id);
    setContactos(contactos.filter((_, i) => i !== idx));
  };

  const handleDeleteLead = async () => {
    if (!lead) return;
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el lead "${lead.empresa}"? Esta acción no se puede deshacer.`)) return;
    try {
      await supabase.from('client_contacts').delete().eq('lead_id', lead.id);
      const { error } = await supabase.from('leads_cuentas').delete().eq('id', lead.id);
      if (error) throw error;
      navigate('/leads');
    } catch (error: any) {
      console.error('Error al eliminar el lead:', error);
      alert('Error al eliminar el lead: ' + error.message);
    }
  };

  const handleGenerateBrief = async (silencioso = false) => {
    if (!lead) return;
    setIsEnriching(true);
    setBriefError(null);
    try {
      const briefData = await generateLeadEnrichment({
        empresa: lead.empresa,
        dominio: lead.dominio,
        sector: lead.sector,
        localidad: lead.localidad,
        contacto_nombre: lead.contacto_nombre,
        contacto_cargo: lead.contacto_cargo,
        empleados_estimado: lead.empleados_estimado,
        notas: lead.notas,
      });
      const nuevoEstado = lead.estado === 'NUEVO' ? 'ENRIQUECIDO' : lead.estado;

      // Las redes que encontró la investigación completan la ficha, sin pisar
      // lo que ya estuviera cargado a mano.
      const r = briefData.redes || {};
      const camposRedes: Record<string, string> = {};
      if (r.web && !lead.web) camposRedes.web = r.web;
      if (r.linkedin && !lead.linkedin_empresa) camposRedes.linkedin_empresa = r.linkedin;
      if (r.instagram && !lead.instagram) camposRedes.instagram = r.instagram;
      if (r.facebook && !lead.facebook) camposRedes.facebook = r.facebook;

      const { error } = await supabase
        .from('leads_cuentas')
        .update({ pre_call_brief: briefData, estado: nuevoEstado, ...camposRedes })
        .eq('id', lead.id);
      if (error) throw error;
      setLead({ ...lead, ...camposRedes, pre_call_brief: briefData, estado: nuevoEstado });
    } catch (error: any) {
      console.error('Error generating brief:', error);
      // En el disparo automático no interrumpimos con un alert: se muestra en pantalla.
      if (silencioso) setBriefError(error.message);
      else alert('Error al generar el brief: ' + error.message);
    } finally {
      setIsEnriching(false);
    }
  };

  // Respaldo: normalmente el brief ya viene generado por el agente al entrar el
  // lead. Si falta (lead cargado a mano, o falló la generación automática), se
  // dispara solo al abrir la ficha. Una vez por lead: si falla, no reintenta en bucle.
  useEffect(() => {
    if (!lead || lead.pre_call_brief || isEnriching) return;
    if (autoIntentado.current.has(lead.id)) return;
    autoIntentado.current.add(lead.id);
    handleGenerateBrief(true);
  }, [lead?.id, lead?.pre_call_brief]);

  if (loading) return <div className="p-20 text-center text-[#666666]">Cargando lead...</div>;
  if (!lead) return <div className="p-20 text-center text-[#666666]">Lead no encontrado</div>;

  const brief = lead.pre_call_brief;

  return (
    <div className="flex-1 flex flex-col gap-4 w-full max-w-[1200px] mx-auto min-h-screen p-5 text-[#1A1A1A]">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 border-b border-black/5 pb-4">
        <Link to="/leads" className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-black/5 transition-colors border border-black/10 shadow-xs shrink-0">
          <ArrowLeft className="w-4 h-4 text-[#666666]" />
        </Link>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-black/10 shadow-xs shrink-0">
            <Building2 className="w-5 h-5 text-[#1A1A1A]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-[#1A1A1A] truncate">
              {lead.empresa} <span className="text-xs font-medium text-[#999999] ml-1.5">#LD-{lead.id}</span>
            </h2>
            <p className="text-[#666666] text-xs mt-0.5 truncate">
              {lead.contacto_nombre || 'Sin contacto'} · {lead.dominio || 'Sin dominio'} · {lead.sector || 'Sin sector'}
            </p>
          </div>
        </div>
        <div className="md:ml-auto flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleDeleteLead}
            title="Eliminar lead"
            className="flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-full text-xs font-semibold transition-all border border-red-200"
          >
            <Trash2 size={13} />
            Eliminar Lead
          </button>
          <Link
            to={`/radiografia/${lead.id}`}
            className="flex items-center justify-center gap-1.5 bg-[#FFD166] hover:bg-[#FFC13B] text-[#1A1A1A] px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm"
          >
            Radiografía Operativa
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Columna izquierda: datos del lead */}
        <div className="lg:col-span-1 flex flex-col gap-4">

          {coincidencia && (
            <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${coincidencia.tipo === 'CLIENTE'
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-amber-50 border-amber-200'
              }`}>
              <UserCheck className={`w-4 h-4 shrink-0 mt-0.5 ${coincidencia.tipo === 'CLIENTE' ? 'text-emerald-600' : 'text-amber-600'}`} />
              <div className="min-w-0">
                <p className={`text-xs font-bold ${coincidencia.tipo === 'CLIENTE' ? 'text-emerald-800' : 'text-amber-800'}`}>
                  {coincidencia.tipo === 'CLIENTE' ? 'Esta empresa ya es cliente' : 'Ya existe otro lead de esta empresa'}
                </p>
                <p className={`text-[10px] mt-0.5 leading-relaxed ${coincidencia.tipo === 'CLIENTE' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {coincidencia.nombre}.{' '}
                  <Link
                    to={coincidencia.tipo === 'CLIENTE' ? `/clients/${coincidencia.id}` : `/leads/${coincidencia.id}`}
                    className="underline font-semibold"
                  >
                    Ver ficha
                  </Link>
                  {coincidencia.tipo === 'CLIENTE' && ' — al convertir se vinculará a este cliente en vez de duplicarlo.'}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-black/5 shadow-xs p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 border-b border-black/5 pb-2">
              <h3 className="font-semibold text-sm text-[#1A1A1A]">Información del Lead</h3>
              {editando ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => { setForm(lead); setEditando(false); cargarContactos(lead.id); }}
                    className="p-1.5 hover:bg-black/5 rounded-full text-[#666666]" title="Cancelar"
                  ><X size={14} /></button>
                  <button
                    onClick={guardarLead} disabled={guardando}
                    className="flex items-center gap-1 bg-[#222222] hover:bg-black text-white px-2.5 py-1 rounded-full text-[9px] font-bold disabled:opacity-60"
                  >
                    {guardando ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} Guardar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditando(true)}
                  className="flex items-center gap-1 text-[9px] font-bold text-[#666666] hover:text-[#1A1A1A] bg-black/5 hover:bg-black/10 px-2.5 py-1 rounded-full transition-colors"
                ><Pencil size={11} /> Editar</button>
              )}
            </div>

            <div className="space-y-2 text-xs">
              {CAMPOS_EDITABLES.map(({ k, label }) => (
                <div key={k}>
                  <p className="text-[#999999] mb-0.5 font-medium text-[10px]">{label}</p>
                  {editando ? (
                    <input
                      value={(form as any)[k] || ''}
                      onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                      className="w-full h-8 rounded-lg border border-black/10 bg-white px-2.5 text-xs outline-none focus:border-[#FFD166]"
                    />
                  ) : (
                    <p className="font-semibold text-[#1A1A1A] break-words">{(lead as any)[k] || '—'}</p>
                  )}
                </div>
              ))}

              <div className="pt-1">
                <p className="text-[#999999] mb-0.5 font-medium text-[10px]">Origen</p>
                <p className="font-semibold text-[#1A1A1A]">{lead.fuente}</p>
              </div>
              <div>
                <p className="text-[#999999] mb-0.5 font-medium text-[10px]">Estado</p>
                <span className="inline-block bg-black/5 text-[#666666] border border-black/10 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mt-0.5">
                  {lead.estado === 'ENRIQUECIDO' ? 'CALIFICADO' : lead.estado}
                </span>
              </div>
            </div>
          </div>

          {/* Redes y sitio */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-xs p-4 flex flex-col gap-3">
            <h3 className="font-semibold text-xs text-[#1A1A1A]">Presencia digital</h3>
            <div className="space-y-2">
              {REDES.map(({ k, label, icon: Icon }) => {
                const valor = (lead as any)[k] as string | null;
                return (
                  <div key={k} className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-[#999999] shrink-0" />
                    {editando ? (
                      <input
                        placeholder={label}
                        value={(form as any)[k] || ''}
                        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                        className="flex-1 h-9 rounded-xl border border-black/10 bg-white px-3 text-xs outline-none focus:border-[#FFD166]"
                      />
                    ) : valor ? (
                      <a href={valor.startsWith('http') ? valor : `https://${valor}`} target="_blank" rel="noreferrer"
                        className="text-xs text-[#1A1A1A] hover:text-[#FFB020] truncate underline">{valor}</a>
                    ) : (
                      <span className="text-xs text-[#999999]">{label} —</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contactos */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-xs p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-xs text-[#1A1A1A]">Contactos</h3>
              {editando && (
                <button
                  onClick={() => setContactos([...contactos, { first_name: '', last_name: '', role: '', email: '', phone: '' }])}
                  className="flex items-center gap-1 text-[9px] font-bold text-[#666666] hover:text-[#1A1A1A] bg-black/5 px-2 py-0.5 rounded-full"
                ><Plus size={10} /> Agregar</button>
              )}
            </div>

            {contactos.length === 0 ? (
              <p className="text-[11px] text-[#999999] italic">
                Sin contactos cargados.{!editando && ' Tocá "Editar" para agregar.'}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {contactos.map((c, i) => (
                  <div key={c.id || i} className="border border-black/5 rounded-xl p-2.5 bg-black/2">
                    {editando ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex gap-1.5">
                          <input placeholder="Nombre" value={c.first_name}
                            onChange={(e) => setContactos(contactos.map((x, j) => j === i ? { ...x, first_name: e.target.value } : x))}
                            className="flex-1 h-7 rounded-md border border-black/10 bg-white px-2 text-xs outline-none focus:border-[#FFD166]" />
                          <input placeholder="Apellido" value={c.last_name}
                            onChange={(e) => setContactos(contactos.map((x, j) => j === i ? { ...x, last_name: e.target.value } : x))}
                            className="flex-1 h-7 rounded-md border border-black/10 bg-white px-2 text-xs outline-none focus:border-[#FFD166]" />
                          <button onClick={() => borrarContacto(i)} className="p-1 text-[#999] hover:text-red-500 shrink-0"><Trash2 size={12} /></button>
                        </div>
                        <input placeholder="Cargo" value={c.role || ''}
                          onChange={(e) => setContactos(contactos.map((x, j) => j === i ? { ...x, role: e.target.value } : x))}
                          className="h-7 rounded-md border border-black/10 bg-white px-2 text-xs outline-none focus:border-[#FFD166]" />
                        <div className="flex gap-1.5">
                          <input placeholder="Email" value={c.email || ''}
                            onChange={(e) => setContactos(contactos.map((x, j) => j === i ? { ...x, email: e.target.value } : x))}
                            className="flex-1 h-7 rounded-md border border-black/10 bg-white px-2 text-xs outline-none focus:border-[#FFD166]" />
                          <input placeholder="Teléfono" value={c.phone || ''}
                            onChange={(e) => setContactos(contactos.map((x, j) => j === i ? { ...x, phone: e.target.value } : x))}
                            className="flex-1 h-7 rounded-md border border-black/10 bg-white px-2 text-xs outline-none focus:border-[#FFD166]" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-[#1A1A1A]">{c.first_name} {c.last_name}</p>
                        {c.role && <p className="text-[10px] text-[#666666] mt-0.5">{c.role}</p>}
                        {c.email && <p className="text-[10px] text-[#666666] mt-0.5 break-all">{c.email}</p>}
                        {c.phone && <p className="text-[10px] text-[#666666]">{c.phone}</p>}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-[9.5px] text-[#999999] mt-1 leading-relaxed">
              Al convertir el lead en cliente, estos contactos pasan con él automáticamente.
            </p>
          </div>

          {/* Historial de interacciones */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-xs p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-xs text-[#1A1A1A] flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#FFB020]" /> Historial
              </h3>
              {historial.length > 0 && (
                <span className="text-[9px] font-bold text-[#666666] bg-black/5 px-2 py-0.5 rounded-full">
                  {historial.length}
                </span>
              )}
            </div>
            <p className="text-[10px] text-[#999999]">Cotizaciones enviadas y proyectos de esta empresa.</p>

            {historial.length === 0 ? (
              <p className="text-[11px] text-[#999999] italic">Todavía no hay cotizaciones ni proyectos registrados.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {historial.map((h) => {
                  const est = ESTADO_INTERACCION[h.estado] || { color: 'bg-black/5 text-[#666666] border-black/10', label: h.estado };
                  return (
                    <div key={`${h.tipo}-${h.id}`} className="border border-black/5 rounded-xl p-2.5 bg-black/2">
                      <div className="flex items-start justify-between gap-1.5 mb-1">
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${h.tipo === 'COTIZACION' ? 'bg-[#FFD166]/20 text-[#8a6d1f]' : 'bg-black/5 text-[#666666]'
                          }`}>
                          {h.tipo === 'COTIZACION' ? 'Cotización' : 'Proyecto'}
                        </span>
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${est.color}`}>
                          {est.label}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-[#1A1A1A] leading-snug">{h.titulo}</p>

                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[#666666]">
                        {h.monto !== null && <span className="font-semibold text-[#1A1A1A]">USD {h.monto.toLocaleString('es-AR')}</span>}
                        {h.fecha && <span>· {new Date(h.fecha).toLocaleDateString('es-AR')}</span>}
                      </div>

                      {h.tipo === 'COTIZACION' && (
                        <p className={`text-[9.5px] mt-1 font-semibold ${h.derivo_en_proyecto ? 'text-emerald-600' : 'text-[#999999]'}`}>
                          {h.derivo_en_proyecto ? '✓ Derivó en proyecto' : '· No derivó en proyecto'}
                        </p>
                      )}

                      {h.detalle && (
                        <p className="text-[9.5px] text-[#666666] mt-1 leading-relaxed line-clamp-2">{h.detalle}</p>
                      )}

                      {h.link && (
                        <Link to={h.link} className="text-[9.5px] font-bold text-[#FFB020] hover:underline mt-1.5 inline-block">
                          Ver detalle →
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {lead.notas && (
            <div className="bg-white rounded-2xl border border-black/5 shadow-xs p-4 flex flex-col gap-2">
              <h3 className="font-semibold text-xs text-[#1A1A1A] flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5 text-[#FFB020]" /> Lo que nos escribió
              </h3>
              <p className="text-xs text-[#666666] leading-relaxed whitespace-pre-wrap">{lead.notas}</p>
            </div>
          )}
        </div>

        {/* Columna derecha: Pre-Call Brief */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-black/5 p-5 shadow-xs relative overflow-hidden flex flex-col gap-4">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFD166]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#FFD166]/20 rounded-xl">
                  <BrainCircuit className="w-5 h-5 text-[#1A1A1A]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1A1A1A]">Pre-Call Brief</h3>
                  <p className="text-[#666666] text-xs">Para leer 5 minutos antes de la Radiografía de 30 min.</p>
                </div>
              </div>

              <button
                onClick={() => handleGenerateBrief()}
                disabled={isEnriching}
                className="flex items-center justify-center gap-2 bg-[#222222] hover:bg-black text-white px-6 py-3 rounded-full text-sm font-semibold transition-all disabled:opacity-50 shadow-lg shadow-black/10 shrink-0"
              >
                {isEnriching ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Investigando...</>
                ) : (
                  <><Play className="w-4 h-4 fill-current" /> {brief ? 'Regenerar' : 'Generar Brief'}</>
                )}
              </button>
            </div>

            {brief ? (
              <div className="flex flex-col gap-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Aviso de datos sin verificar */}
                {brief.investigacion_verificada === false && (
                  <div className="bg-rose-50 border border-rose-200 p-4 rounded-[20px] flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-rose-800">Datos sin verificar</p>
                      <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                        La IA no consultó fuentes en internet: este brief sale de su memoria y puede contener
                        datos desactualizados o inventados. <strong>No cites cifras ni direcciones en la reunión</strong> sin
                        confirmarlas antes. Probá regenerarlo.
                      </p>
                    </div>
                  </div>
                )}

                {/* Puntajes y reseñas */}
                {brief.scores && (brief.scores.global > 0 || brief.scores.fit_ingentia > 0) && (
                  <div className="bg-white/80 border border-black/5 shadow-sm p-6 rounded-[24px]">
                    <div className="flex items-start gap-6">
                      <div className="text-center shrink-0">
                        <div className="text-5xl font-light text-[#1A1A1A] tracking-tighter leading-none">
                          {brief.scores.fit_ingentia}
                        </div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[#999999] mt-1.5">Fit IngentIA</p>
                      </div>
                      <div className="flex-1 flex flex-col gap-2.5">
                        {[
                          { label: 'Reputación', v: brief.scores.reputacion, c: 'bg-[#FFD166]' },
                          { label: 'Presencia digital', v: brief.scores.presencia_digital, c: 'bg-emerald-400' },
                          { label: 'Madurez de mercado', v: brief.scores.madurez_mercado, c: 'bg-blue-400' },
                        ].map((s) => (
                          <div key={s.label}>
                            <div className="flex justify-between text-[10px] mb-1">
                              <span className="text-[#666666] font-medium">{s.label}</span>
                              <span className="font-bold text-[#1A1A1A]">{s.v}</span>
                            </div>
                            <div className="w-full bg-black/5 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${s.c}`} style={{ width: `${s.v}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {brief.presencia_digital && (
                      <div className="mt-5 pt-5 border-t border-black/5 flex flex-wrap gap-x-6 gap-y-3">
                        {brief.presencia_digital.google_rating && (
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-[#999999]">Google</p>
                            <p className="text-sm font-bold text-[#1A1A1A]">
                              ⭐ {brief.presencia_digital.google_rating}
                              {brief.presencia_digital.google_reviews && (
                                <span className="text-[10px] font-medium text-[#666666]"> · {brief.presencia_digital.google_reviews} reseñas</span>
                              )}
                            </p>
                          </div>
                        )}
                        {brief.presencia_digital.instagram_followers && (
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-[#999999]">Instagram</p>
                            <p className="text-sm font-bold text-[#1A1A1A]">{brief.presencia_digital.instagram_followers.toLocaleString('es-AR')}</p>
                          </div>
                        )}
                        {brief.presencia_digital.linkedin_followers && (
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-[#999999]">LinkedIn</p>
                            <p className="text-sm font-bold text-[#1A1A1A]">{brief.presencia_digital.linkedin_followers.toLocaleString('es-AR')}</p>
                          </div>
                        )}
                        {brief.presencia_digital.sentimiento !== 'SIN_DATOS' && (
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-[#999999]">Sentimiento</p>
                            <p className={`text-sm font-bold ${brief.presencia_digital.sentimiento === 'POSITIVO' ? 'text-emerald-600'
                                : brief.presencia_digital.sentimiento === 'NEGATIVO' ? 'text-rose-600' : 'text-[#666666]'
                              }`}>{brief.presencia_digital.sentimiento}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {(brief.presencia_digital?.temas_negativos?.length > 0 || brief.presencia_digital?.novedades?.length > 0) && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {brief.presencia_digital.temas_negativos?.length > 0 && (
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-[#999999] mb-1.5">Lo que critican</p>
                            <ul className="flex flex-col gap-1">
                              {brief.presencia_digital.temas_negativos.map((t, i) => (
                                <li key={i} className="text-[10px] text-[#666666]">· {t}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {brief.presencia_digital.novedades?.length > 0 && (
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-[#999999] mb-1.5">Novedades</p>
                            <ul className="flex flex-col gap-1">
                              {brief.presencia_digital.novedades.map((t, i) => (
                                <li key={i} className="text-[10px] text-[#666666]">· {t}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* La empresa en una frase */}
                <div className="bg-white/80 border border-black/5 shadow-sm p-6 rounded-[24px]">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#999999] mb-2">La empresa, en una frase</h4>
                  <p className="text-[#1A1A1A] font-medium leading-relaxed">{brief.empresa_una_frase}</p>
                  {brief.perfil && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-black/5">
                      {[
                        { label: 'Empleados', val: brief.perfil.empleados_estimado },
                        { label: 'Plantas', val: brief.perfil.plantas_ubicaciones },
                        { label: 'Antigüedad', val: brief.perfil.antiguedad },
                        { label: 'Rubro', val: brief.perfil.rubro },
                      ].map((d, i) => (
                        <div key={i}>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-[#999999] mb-1">{d.label}</p>
                          <p className="text-xs font-semibold text-[#1A1A1A]">{d.val || 'sin dato'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Interlocutor + señales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/80 border border-black/5 shadow-sm p-6 rounded-[24px]">
                    <h4 className="flex items-center gap-2 font-semibold text-[#1A1A1A] mb-4 text-sm">
                      <Users className="w-4 h-4" /> Con quién hablamos
                    </h4>
                    {brief.interlocutor ? (
                      <>
                        <p className="text-sm font-semibold text-[#1A1A1A]">{brief.interlocutor.nombre || 'sin dato'}</p>
                        <p className="text-xs text-[#666666] mt-0.5">{brief.interlocutor.cargo_estimado || 'cargo sin confirmar'}</p>
                        <span className={`inline-block mt-3 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${brief.interlocutor.es_decisor === 'SI' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            brief.interlocutor.es_decisor === 'PROBABLE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-black/5 text-[#666666] border-black/10'
                          }`}>
                          {brief.interlocutor.es_decisor === 'SI' ? 'Es decisor' :
                            brief.interlocutor.es_decisor === 'PROBABLE' ? 'Probable decisor' :
                              brief.interlocutor.es_decisor === 'NO' ? 'No decide' : 'Decisor a confirmar'}
                        </span>
                      </>
                    ) : <p className="text-xs text-[#999]">sin dato</p>}
                  </div>

                  <div className="bg-white/80 border border-black/5 shadow-sm p-6 rounded-[24px]">
                    <h4 className="flex items-center gap-2 font-semibold text-[#1A1A1A] mb-4 text-sm">
                      <AlertTriangle className="w-4 h-4 text-orange-500" /> Señales detectadas
                    </h4>
                    <ul className="flex flex-col gap-3">
                      {(brief.senales || []).map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[#666666]">
                          <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${NIVEL_STYLES[s.nivel]?.dot || 'bg-black/20'}`} />
                          <span>{s.descripcion}</span>
                        </li>
                      ))}
                      {(!brief.senales || brief.senales.length === 0) && (
                        <li className="text-xs text-[#999] italic">Sin señales detectadas</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Dolor declarado (sus palabras) */}
                {brief.dolor_declarado && (
                  <div className="bg-[#FFD166]/10 border border-[#FFD166]/30 p-6 rounded-[24px]">
                    <h4 className="flex items-center gap-2 font-semibold text-[#1A1A1A] mb-2 text-sm">
                      <Quote className="w-4 h-4" /> Lo que él mismo dijo que le duele
                    </h4>
                    <p className="text-sm text-[#1A1A1A] font-medium leading-relaxed">{brief.dolor_declarado}</p>
                  </div>
                )}

                {/* Hipótesis de dolor */}
                <div className="bg-white/80 border border-black/5 shadow-sm p-6 rounded-[24px]">
                  <h4 className="flex items-center gap-2 font-semibold text-rose-600 mb-3 text-sm">
                    <Target className="w-4 h-4" /> Hipótesis de deuda operativa
                  </h4>
                  <p className="text-sm text-[#1A1A1A] leading-relaxed">{brief.hipotesis_dolor}</p>
                  {(brief.stack_probable || []).length > 0 && (
                    <div className="mt-5 pt-5 border-t border-black/5">
                      <h5 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#999999] mb-3">
                        <Server className="w-3.5 h-3.5" /> Herramientas probables
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {brief.stack_probable.map((t, i) => (
                          <span key={i} className="bg-white border border-black/10 text-[#666666] font-medium text-xs px-3 py-1.5 rounded-full shadow-sm">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Encuadre */}
                {brief.encuadre_sugerido && (
                  <div className="bg-[#222222] text-white p-6 rounded-[24px]">
                    <h4 className="flex items-center gap-2 font-semibold mb-3 text-sm">
                      <MessageCircle className="w-4 h-4 text-[#FFD166]" /> Encuadre sugerido (0:00 – 2:00)
                    </h4>
                    <p className="text-sm text-white/90 italic leading-relaxed border-l-2 border-[#FFD166] pl-4">
                      "{brief.encuadre_sugerido}"
                    </p>
                  </div>
                )}

                {/* Preguntas por bloque */}
                <div className="bg-white/80 border border-black/5 shadow-sm p-6 rounded-[24px]">
                  <h4 className="flex items-center gap-2 font-semibold text-[#1A1A1A] mb-5 text-sm">
                    <ListChecks className="w-4 h-4" /> Guion de descubrimiento (4:00 – 18:00)
                  </h4>
                  <div className="flex flex-col gap-5">
                    {[
                      { t: 'Bloque A — El mapa', sub: '4:00 – 9:00', qs: brief.preguntas?.bloque_a_mapa },
                      { t: 'Bloque B — El dolor', sub: '9:00 – 14:00 · acá salen las horas, personas y costo', qs: brief.preguntas?.bloque_b_dolor },
                      { t: 'Bloque C — Intento previo y urgencia', sub: '14:00 – 18:00', qs: brief.preguntas?.bloque_c_urgencia },
                    ].map((b, i) => (
                      <div key={i}>
                        <div className="flex flex-wrap items-baseline gap-2 mb-2">
                          <h5 className="text-xs font-bold text-[#1A1A1A]">{b.t}</h5>
                          <span className="text-[10px] text-[#999999]">{b.sub}</span>
                        </div>
                        <ul className="flex flex-col gap-2 pl-1">
                          {(b.qs || []).map((q, j) => (
                            <li key={j} className="flex items-start gap-2 text-xs text-[#666666]">
                              <span className="text-[#FFB020] font-bold shrink-0">→</span>
                              <span>{q}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cámaras y fuentes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(brief.camaras_redes || []).length > 0 && (
                    <div className="bg-white/80 border border-black/5 shadow-sm p-6 rounded-[24px]">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#999999] mb-3">Cámaras y redes</h4>
                      <div className="flex flex-wrap gap-2">
                        {brief.camaras_redes.map((c, i) => (
                          <span key={i} className="bg-white border border-black/10 text-[#666666] font-medium text-xs px-3 py-1.5 rounded-full shadow-sm">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(brief.fuentes || []).length > 0 && (
                    <div className="bg-white/80 border border-black/5 shadow-sm p-6 rounded-[24px]">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#999999] mb-3">
                        <Link2 className="w-3.5 h-3.5" /> Fuentes consultadas
                      </h4>
                      <ul className="flex flex-col gap-1.5">
                        {brief.fuentes.slice(0, 6).map((f, i) => (
                          <li key={i} className="text-xs text-[#666666] truncate" title={f}>· {f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center border-2 border-dashed border-black/10 rounded-[24px] bg-white/30 px-6">
                {isEnriching ? (
                  <>
                    <Loader2 className="w-12 h-12 text-[#FFB020] mb-4 animate-spin" />
                    <p className="text-[#1A1A1A] font-bold">Investigando la empresa…</p>
                    <p className="text-[#666666] text-sm mt-1 max-w-sm font-medium">
                      Buscando en internet y armando el guion de preguntas. Tarda entre 20 y 40 segundos.
                    </p>
                  </>
                ) : briefError ? (
                  <>
                    <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
                    <p className="text-[#1A1A1A] font-bold">No se pudo generar el brief</p>
                    <p className="text-[#666666] text-sm mt-1 max-w-sm font-medium">{briefError}</p>
                    <button
                      onClick={() => handleGenerateBrief()}
                      className="mt-4 bg-[#222222] hover:bg-black text-white px-5 py-2.5 rounded-full text-xs font-bold transition-colors"
                    >
                      Reintentar
                    </button>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-12 h-12 text-[#999999] mb-4" />
                    <p className="text-[#1A1A1A] font-bold">El Brief está vacío</p>
                    <p className="text-[#666666] text-sm mt-1 max-w-sm font-medium">
                      La IA va a investigar la empresa en internet y armar el guion de preguntas para la reunión.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
