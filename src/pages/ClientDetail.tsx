import { ArrowLeft, Mail, Phone, Building, Clock, DollarSign, Folder, X, Save, Plus, Eye, Trash2, UserPlus, MoreVertical, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { generateLeadEnrichment } from '../lib/gemini-lead-enrichment';

const EditIcon = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;

interface Client {
  id: string;
  name: string;
  industry: string;
  email: string;
  phone: string;
  contact_person: string;
  created_at: string;
  status: string;
  lead_id?: number | null;
}

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  budget: number;
}

interface Quote {
  id: string;
  title: string;
  status: string;
  total_amount: number;
  created_at: string;
  comments: string;
  project_name: string;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
}

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'Contacto'
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    industry: '',
    email: '',
    phone: '',
    contact_person: '',
    status: ''
  });

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  useEffect(() => {
    if (id) {
      fetchClientAndProjects();
    }
  }, [id]);

  const fetchClientAndProjects = async () => {
    try {
      setLoading(true);
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (clientError) throw clientError;
      setClient(clientData);

      setEditFormData({
        name: clientData.name,
        industry: clientData.industry,
        email: clientData.email,
        phone: clientData.phone || '',
        contact_person: clientData.contact_person,
        status: clientData.status
      });

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('client', clientData.name);
      
      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false });

      if (quotesError) throw quotesError;
      
      const projectIds = new Set((projectsData || []).map((p: any) => p.id));
      const uniqueQuotes: Quote[] = [];
      const seenTitles = new Set<string>();
      (quotesData || []).forEach((q: any) => {
        if (q.project_id && projectIds.has(q.project_id)) return;
        const titleKey = (q.title || '').trim().toLowerCase();
        if (!seenTitles.has(titleKey)) {
          seenTitles.add(titleKey);
          uniqueQuotes.push(q);
        }
      });
      setQuotes(uniqueQuotes);

      const { data: contactsData, error: contactsError } = await supabase
        .from('client_contacts')
        .select('*')
        .eq('client_id', id)
        .order('first_name');

      if (contactsError) throw contactsError;
      setContacts(contactsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setSavingClient(true);
      const { error } = await supabase
        .from('clients')
        .update({
          name: editFormData.name,
          industry: editFormData.industry,
          email: editFormData.email,
          phone: editFormData.phone,
          contact_person: editFormData.contact_person,
          status: editFormData.status
        })
        .eq('id', id);

      if (error) throw error;
      
      await fetchClientAndProjects();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Error al actualizar el cliente');
    } finally {
      setSavingClient(false);
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setSavingContact(true);
      const contactData = {
        client_id: id,
        first_name: contactFormData.first_name,
        last_name: contactFormData.last_name,
        email: contactFormData.email,
        phone: contactFormData.phone,
        role: contactFormData.role
      };

      let error;
      if (contactFormData.id) {
        const { error: updateError } = await supabase
          .from('client_contacts')
          .update(contactData)
          .eq('id', contactFormData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('client_contacts')
          .insert([contactData]);
        error = insertError;
      }

      if (error) throw error;
      
      await fetchClientAndProjects();
      setIsContactModalOpen(false);
      setContactFormData({ id: '', first_name: '', last_name: '', email: '', phone: '', role: 'Contacto' });
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Error al guardar el contacto');
    } finally {
      setSavingContact(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('¿Estás seguro de eliminar este contacto?')) return;
    try {
      const { error } = await supabase.from('client_contacts').delete().eq('id', contactId);
      if (error) throw error;
      setContacts(contacts.filter(c => c.id !== contactId));
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Error al eliminar el contacto');
    }
  };

  const handleGenerateAI = async () => {
      if (!client) return;
      try {
          setIsGeneratingAI(true);
          
          // 1. Create Lead in DB to hold the brief
          const { data: leadData, error: leadError } = await supabase.from('leads_cuentas').insert([{
              empresa: client.name,
              sector: client.industry,
              estado: 'CONVERTIDO',
              origen: 'Generado desde Cliente'
          }]).select('id').single();

          if (leadError) throw leadError;

          // 2. Generate Brief
          const brief = await generateLeadEnrichment({
              empresa: client.name,
              sector: client.industry,
              contacto_nombre: client.contact_person
          });

          // 3. Save brief to Lead
          const { error: updateLeadError } = await supabase.from('leads_cuentas').update({
              pre_call_brief: brief
          }).eq('id', leadData.id);

          if (updateLeadError) throw updateLeadError;

          // 4. Update Client with lead_id
          const { error: updateClientError } = await supabase.from('clients').update({
              lead_id: leadData.id
          }).eq('id', client.id);

          if (updateClientError) throw updateClientError;

          // Refresh UI
          await fetchClientAndProjects();

      } catch (err) {
          console.error("Error generating AI analysis:", err);
          alert('Hubo un error al generar el análisis de IA.');
      } finally {
          setIsGeneratingAI(false);
      }
  };


  if (loading) return <div className="p-20 text-center text-[#666666]">Cargando cliente...</div>;
  if (!client) return <div className="p-20 text-center text-[#666666]">Cliente no encontrado</div>;

  const initials = client.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  return (
    <>
    <div className="flex-1 flex flex-col gap-6 w-full max-w-[1100px] mx-auto animate-in fade-in duration-500 pb-10">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/clients" className="p-2.5 bg-white hover:bg-black/5 rounded-xl transition-all duration-300 border border-black/5 shadow-sm group">
            <ArrowLeft size={18} className="text-[#1A1A1A] group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold tracking-tight text-[#1A1A1A] leading-none">{client.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${client.status === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {client.status}
              </span>
            </div>
            <p className="text-[#666666] text-xs font-medium mt-1">Cliente desde {new Date(client.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</p>
          </div>
        </div>
        <button 
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#222222] hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md"
        >
          <EditIcon size={14} />
          Editar Detalles
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="xl:col-span-5 flex flex-col gap-5">
          
          {/* Client Info Card */}
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-6 flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#222222] to-[#444444] flex items-center justify-center text-white text-lg font-bold shadow-md shrink-0">
                {initials}
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#1A1A1A]">{client.name}</h4>
                <p className="text-xs text-[#666666] font-medium">{client.industry}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-5 border-t border-black/5">
              <div className="flex items-center gap-3 text-[#666666]">
                <div className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center"><Building size={14} /></div>
                <span className="text-xs font-medium">CLI-{client.id.substring(0, 4).toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-3 text-[#666666]">
                <div className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center"><Mail size={14} /></div>
                <a href={`mailto:${client.email}`} className="text-xs font-medium hover:text-[#1A1A1A] transition-colors">{client.email}</a>
              </div>
              <div className="flex items-center gap-3 text-[#666666]">
                <div className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center"><Phone size={14} /></div>
                <a href={`tel:${client.phone}`} className="text-xs font-medium hover:text-[#1A1A1A] transition-colors">{client.phone}</a>
              </div>
            </div>

            <div className="pt-5 border-t border-black/5">
              <div className="flex justify-between items-center mb-3">
                <h5 className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">Contactos ({contacts.length})</h5>
                <button 
                  onClick={() => { setContactFormData({ id: '', first_name: '', last_name: '', email: '', phone: '', role: 'Contacto' }); setIsContactModalOpen(true); }}
                  className="p-1.5 hover:bg-black/5 rounded-full text-[#1A1A1A] transition-colors"
                ><UserPlus size={14} /></button>
              </div>
              
              <div className="flex flex-col gap-2">
                {contacts.length === 0 ? (
                  <div className="text-center py-4 bg-black/5 rounded-xl"><p className="text-[10px] text-[#666666] italic">No hay contactos.</p></div>
                ) : (
                  contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between group/contact bg-white p-2.5 rounded-xl border border-black/5 hover:border-[#FFD166]/50 transition-all">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[#1A1A1A] font-bold text-[10px]">
                          {contact.first_name[0]}{contact.last_name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1A1A1A] leading-tight">{contact.first_name} {contact.last_name}</p>
                          <p className="text-[9px] font-medium text-[#666666]">{contact.role}</p>
                        </div>
                      </div>
                      <div className="flex opacity-0 group-hover/contact:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setContactFormData({...contact}); setIsContactModalOpen(true); }}
                          className="p-1 hover:bg-black/5 rounded-full text-[#666666]"
                        ><MoreVertical size={14} /></button>
                        <button onClick={() => handleDeleteContact(contact.id)} className="p-1 hover:bg-red-50 rounded-full text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="xl:col-span-7 flex flex-col gap-5">
          
          {/* Tarjeta de IA */}
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-6 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-orange-400/5 blur-2xl rounded-full -mr-10 -mt-10"></div>
            
            {!client.lead_id ? (
              <div className="flex flex-col items-center justify-center text-center py-4 relative z-10">
                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-3">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-sm font-bold text-[#1A1A1A]">Análisis Operativo Inteligente</h3>
                <p className="text-xs text-[#666666] max-w-sm mt-2 mb-5">
                  Genera una radiografía completa de la empresa investigando en la web, redes y noticias para entender su negocio.
                </p>
                <button 
                  onClick={handleGenerateAI}
                  disabled={isGeneratingAI}
                  className="flex items-center gap-2 bg-[#222222] hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isGeneratingAI ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {isGeneratingAI ? 'Generando análisis...' : 'Generar Análisis con IA'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1A1A1A]">Análisis de IA Disponible</h3>
                    <p className="text-[10px] text-[#666666] font-medium">Perfil operativo e investigación generada con IA.</p>
                  </div>
                </div>
                <Link 
                  to={`/leads/${client.lead_id}`}
                  className="mt-4 self-start flex items-center gap-2 bg-white border border-black/10 hover:border-black/30 hover:bg-black/5 text-[#1A1A1A] px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Ver Ficha y Radiografía
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-black/5 shadow-sm flex flex-col justify-between gap-3 group">
              <div className="p-2.5 bg-black/5 rounded-xl text-[#1A1A1A] w-fit">
                <Folder size={18} />
              </div>
              <div>
                <h4 className="text-3xl font-light text-[#1A1A1A] tracking-tight">{projects.filter(p => p.status === 'En Progreso').length}</h4>
                <p className="text-[#666666] text-[10px] uppercase font-bold tracking-wider mt-0.5">Proyectos Activos</p>
              </div>
            </div>
            <div className="bg-[#1A1A1A] text-white rounded-3xl p-5 shadow-md flex flex-col justify-between gap-3 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-white/5 rounded-full blur-xl -mr-10 -mb-10"></div>
              <div className="p-2.5 bg-white/10 rounded-xl text-white w-fit relative z-10">
                <DollarSign size={18} />
              </div>
              <div className="relative z-10">
                <h4 className="text-3xl font-light tracking-tight">${(projects.reduce((acc, p) => acc + (p.budget || 0), 0) / 1000).toFixed(1)}k</h4>
                <p className="text-white/60 text-[10px] uppercase font-bold tracking-wider mt-0.5">Presupuesto</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
            {/* Projects Summary */}
            <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-5 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">Proyectos</h4>
                <Link to="/projects/new" className="p-1.5 bg-black/5 rounded-lg hover:bg-[#FFD166] transition-colors"><Plus size={14} /></Link>
              </div>
              <div className="flex flex-col gap-2.5">
                {projects.length === 0 && <p className="text-[11px] text-[#666666] italic text-center py-2">No hay proyectos.</p>}
                {projects.slice(0, 3).map(p => (
                  <Link key={p.id} to={`/projects/${p.id}`} className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-black/5 hover:border-black/20 transition-all">
                    <div className="overflow-hidden mr-2">
                      <p className="text-xs font-bold text-[#1A1A1A] truncate">{p.name}</p>
                      <p className="text-[9px] font-bold text-[#666666] uppercase mt-0.5">{p.status}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-bold text-[#1A1A1A]">${(p.budget || 0).toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quotes Summary */}
            <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-5 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">Cotizaciones</h4>
                <Link to="/smart-quoter" className="p-1.5 bg-black/5 rounded-lg hover:bg-[#FFD166] transition-colors"><Plus size={14} /></Link>
              </div>
              <div className="flex flex-col gap-2.5">
                {quotes.length === 0 && <p className="text-[11px] text-[#666666] italic text-center py-2">No hay cotizaciones.</p>}
                {quotes.slice(0, 3).map(q => (
                  <Link key={q.id} to={`/smart-quoter?quoteId=${q.id}`} className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-black/5 hover:border-black/20 transition-all">
                    <div className="overflow-hidden mr-2">
                      <p className="text-xs font-bold text-[#1A1A1A] truncate">{q.title}</p>
                      <p className="text-[9px] font-bold text-[#999999] uppercase mt-0.5">{q.status}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    {/* Modals */}
    {isEditModalOpen && createPortal(
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="p-5 border-b border-black/5 flex justify-between items-center">
            <h3 className="text-base font-bold text-[#1A1A1A]">Editar Cliente</h3>
            <button onClick={() => setIsEditModalOpen(false)} className="p-1 hover:bg-black/5 rounded-full"><X size={18} /></button>
          </div>
          <form onSubmit={handleUpdateClient} className="p-6 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[11px] font-bold text-[#666666] uppercase">Nombre</label>
                <input required type="text" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-full h-10 mt-1 rounded-xl border border-black/10 bg-white text-sm px-3 focus:ring-2 focus:ring-[#FFD166]" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#666666] uppercase">Industria</label>
                <input required type="text" value={editFormData.industry} onChange={e => setEditFormData({...editFormData, industry: e.target.value})} className="w-full h-10 mt-1 rounded-xl border border-black/10 bg-white text-sm px-3 focus:ring-2 focus:ring-[#FFD166]" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#666666] uppercase">Estado</label>
                <select required value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value})} className="w-full h-10 mt-1 rounded-xl border border-black/10 bg-white text-sm px-3 focus:ring-2 focus:ring-[#FFD166]">
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#666666] uppercase">Email</label>
                <input required type="email" value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} className="w-full h-10 mt-1 rounded-xl border border-black/10 bg-white text-sm px-3 focus:ring-2 focus:ring-[#FFD166]" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#666666] uppercase">Teléfono</label>
                <input type="tel" value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} className="w-full h-10 mt-1 rounded-xl border border-black/10 bg-white text-sm px-3 focus:ring-2 focus:ring-[#FFD166]" />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] font-bold text-[#666666] uppercase">Contacto Principal</label>
                <input required type="text" value={editFormData.contact_person} onChange={e => setEditFormData({...editFormData, contact_person: e.target.value})} className="w-full h-10 mt-1 rounded-xl border border-black/10 bg-white text-sm px-3 focus:ring-2 focus:ring-[#FFD166]" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#666666] hover:bg-black/5">Cancelar</button>
              <button type="submit" disabled={savingClient} className="flex items-center gap-2 bg-[#222222] hover:bg-black disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-bold"><Save size={14} />{savingClient ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    )}

    {isContactModalOpen && createPortal(
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="p-5 border-b border-black/5 flex justify-between items-center">
            <h3 className="text-base font-bold text-[#1A1A1A]">{contactFormData.id ? 'Editar Contacto' : 'Nuevo Contacto'}</h3>
            <button onClick={() => setIsContactModalOpen(false)} className="p-1 hover:bg-black/5 rounded-full"><X size={18} /></button>
          </div>
          <form onSubmit={handleSaveContact} className="p-6 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-[#666666] uppercase">Nombre</label>
                <input required type="text" value={contactFormData.first_name} onChange={e => setContactFormData({...contactFormData, first_name: e.target.value})} className="w-full h-10 mt-1 rounded-xl border border-black/10 bg-white text-sm px-3 focus:ring-2 focus:ring-[#FFD166]" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#666666] uppercase">Apellido</label>
                <input required type="text" value={contactFormData.last_name} onChange={e => setContactFormData({...contactFormData, last_name: e.target.value})} className="w-full h-10 mt-1 rounded-xl border border-black/10 bg-white text-sm px-3 focus:ring-2 focus:ring-[#FFD166]" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#666666] uppercase">Email</label>
              <input required type="email" value={contactFormData.email} onChange={e => setContactFormData({...contactFormData, email: e.target.value})} className="w-full h-10 mt-1 rounded-xl border border-black/10 bg-white text-sm px-3 focus:ring-2 focus:ring-[#FFD166]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-[#666666] uppercase">Teléfono</label>
                <input type="tel" value={contactFormData.phone} onChange={e => setContactFormData({...contactFormData, phone: e.target.value})} className="w-full h-10 mt-1 rounded-xl border border-black/10 bg-white text-sm px-3 focus:ring-2 focus:ring-[#FFD166]" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#666666] uppercase">Rol</label>
                <input required type="text" value={contactFormData.role} onChange={e => setContactFormData({...contactFormData, role: e.target.value})} className="w-full h-10 mt-1 rounded-xl border border-black/10 bg-white text-sm px-3 focus:ring-2 focus:ring-[#FFD166]" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setIsContactModalOpen(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#666666] hover:bg-black/5">Cancelar</button>
              <button type="submit" disabled={savingContact} className="flex items-center gap-2 bg-[#222222] hover:bg-black disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-bold"><Save size={14} />{savingContact ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
