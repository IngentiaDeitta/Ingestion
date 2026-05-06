import { ArrowLeft, Mail, Phone, Building, Clock, DollarSign, Folder, X, Save, Plus, Eye, Trash2, UserPlus, MoreVertical, Sparkles, Loader2, Pencil, Globe, Linkedin, Instagram, Twitter, Facebook } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';

const EditIcon = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;


interface ClientAnalysisResult {
  website?: string;
  phone?: string;
  social_links?: {
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
  company_size?: string;
  particularities?: string[];
  summary: string;
  business_model: string;
  target_audience: string;
  key_value_proposition: string;
  competitors: string[];
  social_presence?: {
    google_rating: number;
    google_reviews_count: number;
    linkedin_followers: number;
    instagram_followers: number;
    sentiment: string;
    top_positive_themes: string[];
    top_negative_themes: string[];
    recent_news: string[];
  };
  metrics?: {
    reputation_score: number;
    digital_presence_score: number;
    market_maturity_score: number;
    ingentia_fit_score: number;
    overall_score: number;
  };
  analysis_date?: string;
}

interface Client {
  id: string;
  name: string;
  industry: string;
  email: string;
  phone: string;
  contact_person: string;
  created_at: string;
  status: string;
  client_analysis?: ClientAnalysisResult;
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
  const [client, setClient] = useState<Client | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
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

  // AI Research Agent State — SSE Streaming
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  const [agentSteps, setAgentSteps] = useState<{ type: string; text: string }[]>([]);
  const [agentDone, setAgentDone] = useState(false);
  const [agentFailed, setAgentFailed] = useState(false);

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
      setQuotes(quotesData || []);

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

  const handleRunAgentAnalysis = async () => {
    if (!client) return;
    const projectName = projects.length > 0 ? projects[0].name : `Análisis - ${client.name}`;

    // Resetear estado del panel
    setAgentSteps([]);
    setAgentDone(false);
    setAgentFailed(false);
    setIsAgentRunning(true);
    setShowAgentPanel(true);

    try {
      const res = await fetch('http://localhost:3001/api/run-agent/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: client.name, projectName })
      });

      if (!res.ok || !res.body) {
        throw new Error('No se pudo conectar al Local Bridge. Asegurate de que esté corriendo: node local_bridge.js');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'done') {
              setAgentSteps(prev => [...prev, event]);
              setAgentDone(true);
              setIsAgentRunning(false);
            } else if (event.type === 'fatal') {
              setAgentSteps(prev => [...prev, event]);
              setAgentFailed(true);
              setIsAgentRunning(false);
            } else {
              setAgentSteps(prev => [...prev, event]);
            }
          } catch { /* ignorar JSON mal formado */ }
        }
      }
    } catch (err: any) {
      const isNetwork = err.message?.includes('fetch') || err.message?.includes('Failed');
      const msg = isNetwork
        ? 'El Local Bridge no está corriendo. Ejecutá en una terminal: node local_bridge.js'
        : err.message;
      setAgentSteps(prev => [...prev, { type: 'fatal', text: msg }]);
      setAgentFailed(true);
      setIsAgentRunning(false);
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
      const { error } = await supabase
        .from('client_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;
      
      setContacts(contacts.filter(c => c.id !== contactId));
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Error al eliminar el contacto');
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta cotización?')) return;

    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);

      if (error) throw error;
      
      setQuotes(quotes.filter(q => q.id !== quoteId));
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Error al eliminar la cotización');
    }
  };

  if (loading) return <div className="p-20 text-center text-[#666666]">Cargando cliente...</div>;
  if (!client) return <div className="p-20 text-center text-[#666666]">Cliente no encontrado</div>;

  const initials = client.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  const contactInitials = client.contact_person ? client.contact_person.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??';

  const editModal = isEditModalOpen ? createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div 
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-black/5 flex justify-between items-center">
          <h3 className="text-xl font-medium text-[#1A1A1A]">Editar Cliente</h3>
          <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <X size={20} className="text-[#1A1A1A]" />
          </button>
        </div>

        <form onSubmit={handleUpdateClient} className="p-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Nombre de la Empresa</label>
              <input 
                required 
                type="text" 
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="w-full h-12 rounded-2xl border border-black/10 bg-white text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" 
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Industria</label>
              <input 
                required 
                type="text" 
                value={editFormData.industry}
                onChange={(e) => setEditFormData({ ...editFormData, industry: e.target.value })}
                className="w-full h-12 rounded-2xl border border-black/10 bg-white text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" 
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Estado</label>
              <select 
                required 
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                className="w-full h-12 rounded-2xl border border-black/10 bg-white text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Correo Electrónico</label>
              <input 
                required 
                type="email" 
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="w-full h-12 rounded-2xl border border-black/10 bg-white text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" 
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Teléfono</label>
              <input 
                type="tel" 
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                className="w-full h-12 rounded-2xl border border-black/10 bg-white text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" 
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Contacto Principal</label>
              <input 
                required 
                type="text" 
                value={editFormData.contact_person}
                onChange={(e) => setEditFormData({ ...editFormData, contact_person: e.target.value })}
                className="w-full h-12 rounded-2xl border border-black/10 bg-white text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" 
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <button 
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-6 py-3 rounded-full text-sm font-medium text-[#666666] hover:bg-black/5 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={savingClient}
              className="flex items-center gap-2 bg-[#222222] hover:bg-black disabled:opacity-50 text-white px-8 py-3 rounded-full text-sm font-medium transition-colors shadow-lg"
            >
              <Save size={18} />
              {savingClient ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>

    <div className="flex-1 flex flex-col gap-8 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <Link to="/clients" className="p-3 bg-white/60 hover:bg-white rounded-2xl transition-all duration-300 border border-black/5 shadow-sm hover:shadow-md group backdrop-blur-md">
            <ArrowLeft size={20} className="text-[#1A1A1A] group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-[42px] font-medium tracking-tight text-[#1A1A1A] leading-none">{client.name}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${client.status === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {client.status}
              </span>
            </div>
            <p className="text-[#666666] mt-2 font-medium">Cliente desde {new Date(client.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRunAgentAnalysis}
            disabled={isAgentRunning}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#FFD166] to-[#FFB020] hover:from-[#FFC033] hover:to-[#FFA000] disabled:opacity-60 disabled:cursor-not-allowed text-[#1A1A1A] px-7 py-3.5 rounded-full text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            {isAgentRunning ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {isAgentRunning ? 'Investigando...' : 'Análisis IA'}
          </button>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#222222] hover:bg-black text-white px-7 py-3.5 rounded-full text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <EditIcon size={16} />
            Editar Detalles
          </button>
        </div>
      </div>

      {/* Agent Progress Panel — slide-in desde la derecha */}
      {showAgentPanel && createPortal(
        <div className="fixed inset-0 z-50 flex justify-end" style={{ pointerEvents: 'none' }}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
            style={{ pointerEvents: 'all' }}
            onClick={() => setShowAgentPanel(false)}
          />

          {/* Panel */}
          <div
            className="relative h-full w-full max-w-md bg-white/90 backdrop-blur-2xl text-[#1A1A1A] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 border-l border-white/50"
            style={{ pointerEvents: 'all' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-black/5">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-[#FFD166]/20 rounded-xl">
                  <Sparkles size={20} className="text-[#FFB020]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-wide text-[#1A1A1A]">AI Research Agent</h3>
                  <p className="text-sm text-[#666666] mt-0.5">{client?.name}</p>
                </div>
              </div>
              <button onClick={() => setShowAgentPanel(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <X size={20} className="text-[#666666]" />
              </button>
            </div>

            {/* Progress steps — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
              {agentSteps.map((step, i) => (
                <div key={i} className={`flex items-start gap-4 text-sm ${
                  step.type === 'success' ? 'text-emerald-600' :
                  step.type === 'error' || step.type === 'fatal' ? 'text-red-500' :
                  step.type === 'done' ? 'text-[#FFB020] font-semibold' :
                  'text-[#444444]'
                }`}>
                  <span className="mt-0.5 shrink-0 text-lg leading-none">
                    {step.type === 'success' ? '✓' :
                     step.type === 'error' || step.type === 'fatal' ? '✗' :
                     step.type === 'done' ? '🎉' :
                     '›'}
                  </span>
                  <span className="leading-relaxed text-[15px]">{step.text}</span>
                </div>
              ))}

              {isAgentRunning && (
                <div className="flex items-center gap-3 text-[#666666] text-sm mt-2">
                  <Loader2 size={16} className="animate-spin shrink-0" />
                  <span className="font-medium">Procesando...</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-6 border-t border-black/5 bg-white/50">
              {agentDone && (
                <button
                  onClick={() => { setShowAgentPanel(false); fetchClientAndProjects(); }}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#FFD166] to-[#FFB020] hover:from-[#FFC033] hover:to-[#FFA000] text-[#1A1A1A] font-bold py-4 rounded-2xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 text-sm"
                >
                  <Sparkles size={18} />
                  Ver Resultados
                </button>
              )}
              {agentFailed && !agentDone && (
                <button
                  onClick={() => setShowAgentPanel(false)}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-4 rounded-2xl transition-all text-sm border border-red-200"
                >
                  Cerrar
                </button>
              )}
              {isAgentRunning && (
                <div className="w-full bg-black/5 rounded-full h-2 overflow-hidden shadow-inner">
                  <div className="h-full bg-gradient-to-r from-[#FFD166] to-[#FFB020] rounded-full animate-pulse" style={{ width: `${Math.min(95, agentSteps.length * 12)}%`, transition: 'width 0.5s ease' }} />
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA (1/3) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          
          {/* Client Info Card */}
          <div className="bg-white/70 backdrop-blur-2xl rounded-[32px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 flex flex-col gap-6 transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#222222] to-[#444444] flex items-center justify-center text-white text-xl font-medium shadow-lg shrink-0 ring-4 ring-white/50">
                {initials}
              </div>
              <div>
                <h4 className="text-xl font-bold text-[#1A1A1A]">{client.name}</h4>
                <p className="text-sm text-[#666666] font-medium mt-0.5">{client.industry}</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-6 border-t border-black/5">
              <div className="flex items-center gap-4 text-[#666666] group">
                <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-[#FFD166]/20 group-hover:text-[#FFB020] transition-colors">
                  <Building size={16} />
                </div>
                <span className="text-sm font-medium">ID: CLI-{client.id.substring(0, 4).toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-4 text-[#666666] group">
                <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-[#FFD166]/20 group-hover:text-[#FFB020] transition-colors">
                  <Mail size={16} />
                </div>
                <a href={`mailto:${client.email}`} className="text-sm font-medium hover:text-[#1A1A1A] transition-colors truncate">{client.email}</a>
              </div>
              <div className="flex items-center gap-4 text-[#666666] group">
                <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-[#FFD166]/20 group-hover:text-[#FFB020] transition-colors">
                  <Phone size={16} />
                </div>
                <a href={`tel:${client.phone}`} className="text-sm font-medium hover:text-[#1A1A1A] transition-colors truncate">{client.phone}</a>
              </div>
            </div>

            <div className="pt-6 border-t border-black/5">
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-xs font-bold text-[#666666] uppercase tracking-wider">Contactos ({contacts.length})</h5>
                <button 
                  onClick={() => {
                    setContactFormData({ id: '', first_name: '', last_name: '', email: '', phone: '', role: 'Contacto' });
                    setIsContactModalOpen(true);
                  }}
                  className="p-2 hover:bg-black/5 rounded-full text-[#1A1A1A] transition-colors"
                  title="Agregar Contacto"
                >
                  <UserPlus size={16} />
                </button>
              </div>
              
              <div className="flex flex-col gap-3">
                {contacts.length === 0 ? (
                  <div className="text-center py-6 bg-white/40 rounded-2xl border border-dashed border-black/10">
                    <p className="text-xs text-[#666666] italic">No hay contactos registrados.</p>
                  </div>
                ) : (
                  contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between group/contact bg-white/50 p-3.5 rounded-2xl border border-black/5 hover:border-[#FFD166]/50 hover:bg-white transition-all hover:shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-black/5 to-black/10 flex items-center justify-center text-[#1A1A1A] font-bold text-xs shadow-inner">
                          {contact.first_name[0]}{contact.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1A1A1A] leading-tight">{contact.first_name} {contact.last_name}</p>
                          <p className="text-[11px] font-medium text-[#666666] mt-0.5">{contact.role}</p>
                        </div>
                      </div>
                      <div className="flex opacity-0 group-hover/contact:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setContactFormData({
                              id: contact.id,
                              first_name: contact.first_name,
                              last_name: contact.last_name,
                              email: contact.email,
                              phone: contact.phone,
                              role: contact.role
                            });
                            setIsContactModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-black/5 rounded-full text-[#666666] transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteContact(contact.id)}
                          className="p-1.5 hover:bg-red-50 rounded-full text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/70 backdrop-blur-2xl rounded-[32px] p-6 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between gap-4 group hover:-translate-y-1 transition-transform duration-300">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-[#1A1A1A] w-fit group-hover:scale-110 transition-transform">
                <Folder size={20} />
              </div>
              <div>
                <h4 className="text-4xl font-light text-[#1A1A1A] tracking-tight">{projects.filter(p => p.status === 'En Progreso').length}</h4>
                <p className="text-[#666666] text-[11px] uppercase font-bold tracking-wider mt-1">Proyectos Activos</p>
              </div>
            </div>
            <div className="bg-[#222222] text-white rounded-[32px] p-6 shadow-xl flex flex-col justify-between gap-4 group hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
              <div className="p-3 bg-white/10 rounded-2xl w-fit text-white backdrop-blur-md group-hover:scale-110 transition-transform">
                <DollarSign size={20} />
              </div>
              <div className="relative z-10">
                <h4 className="text-4xl font-light tracking-tight">${(projects.reduce((acc, p) => acc + (p.budget || 0), 0) / 1000).toFixed(1)}k</h4>
                <p className="text-white/60 text-[11px] uppercase font-bold tracking-wider mt-1">Presupuesto</p>
              </div>
            </div>
          </div>

          {/* Projects Summary */}
          <div className="bg-white/70 backdrop-blur-2xl rounded-[32px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-7 flex flex-col gap-5">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-[11px] font-bold text-[#666666] uppercase tracking-[0.15em]">Proyectos Recientes</h4>
              <Link to="/projects/new" className="p-2.5 bg-white rounded-xl border border-black/5 hover:bg-[#FFD166] hover:border-[#FFD166] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
                <Plus size={14} className="text-[#1A1A1A]" />
              </Link>
            </div>
            <div className="flex flex-col gap-3.5">
              {projects.length === 0 && (
                <div className="text-center py-8 bg-white/40 rounded-2xl border border-dashed border-black/10">
                  <p className="text-xs text-[#666666] italic font-medium">No hay proyectos activos.</p>
                </div>
              )}
              {projects.slice(0, 4).map(p => (
                <Link key={p.id} to={`/projects/${p.id}`} className="flex justify-between items-center bg-white/60 p-4.5 rounded-[22px] border border-black/5 hover:border-[#FFD166]/50 hover:bg-white transition-all group shadow-sm hover:shadow-md">
                  <div className="overflow-hidden mr-3">
                    <p className="text-[14px] font-bold text-[#1A1A1A] truncate group-hover:text-[#FFB020] transition-colors leading-tight block mb-1">{p.name}</p>
                    <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'En Riesgo' ? 'bg-red-500 animate-pulse' : p.status === 'Completado' ? 'bg-emerald-500' : 'bg-[#FFB020]'}`}></span>
                      {p.status}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-black text-[#1A1A1A] tracking-tight">${(p.budget || 0).toLocaleString()}</p>
                    <div className="w-16 h-1.5 bg-black/5 rounded-full mt-2.5 ml-auto overflow-hidden shadow-inner">
                      <div className={`h-full rounded-full transition-all duration-1000 ${p.status === 'En Riesgo' ? 'bg-red-400' : p.status === 'Completado' ? 'bg-emerald-400' : 'bg-gradient-to-r from-[#FFD166] to-[#FFB020]'}`} style={{ width: `${p.progress}%` }}></div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quotes Summary */}
          <div className="bg-white/70 backdrop-blur-2xl rounded-[32px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-7 flex flex-col gap-5">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-[11px] font-bold text-[#666666] uppercase tracking-[0.15em]">Últimas Cotizaciones</h4>
              <Link to="/smart-quoter" className="p-2.5 bg-white rounded-xl border border-black/5 hover:bg-[#FFD166] hover:border-[#FFD166] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
                <Plus size={14} className="text-[#1A1A1A]" />
              </Link>
            </div>
            <div className="flex flex-col gap-3.5">
              {quotes.length === 0 && (
                <div className="text-center py-8 bg-white/40 rounded-2xl border border-dashed border-black/10">
                  <p className="text-xs text-[#666666] italic font-medium">No hay cotizaciones registradas.</p>
                </div>
              )}
              {quotes.slice(0, 4).map(q => (
                <Link key={q.id} to={`/smart-quoter?quoteId=${q.id}`} className="flex justify-between items-center bg-white/60 p-4.5 rounded-[22px] border border-black/5 hover:border-[#FFD166]/50 hover:bg-white transition-all group shadow-sm hover:shadow-md">
                  <div className="overflow-hidden mr-3">
                    <p className="text-[14px] font-bold text-[#1A1A1A] group-hover:text-[#FFB020] truncate leading-tight transition-colors mb-1">{q.title}</p>
                    <p className="text-[10px] font-bold text-[#999999] uppercase tracking-wider truncate">{q.project_name}</p>
                  </div>
                  <div className="flex items-center shrink-0">
                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] border ${
                      q.status === 'Aceptada' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                      q.status === 'Rechazada' ? 'bg-red-50 text-red-700 border-red-100' : 
                      'bg-gray-50 text-[#666666] border-black/5'
                    }`}>
                      {q.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA (2/3) */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {client.client_analysis ? (
            <div className="bg-white/70 backdrop-blur-2xl rounded-[32px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 lg:p-10 flex flex-col gap-10 relative overflow-hidden h-full">
              
              {/* Decorative background glow */}
              <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-[#FFD166]/20 blur-[120px] rounded-full pointer-events-none"></div>

              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10 border-b border-black/5 pb-8">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-gradient-to-br from-[#FFD166] to-[#FFB020] rounded-[20px] text-white shadow-lg shadow-[#FFD166]/30">
                    <Sparkles size={28} />
                  </div>
                  <div>
                    <h4 className="text-3xl font-medium text-[#1A1A1A] tracking-tight">Perfil Estratégico AI</h4>
                    <p className="text-sm text-[#666666] mt-1 font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      {client.client_analysis.analysis_date ? `Actualizado: ${client.client_analysis.analysis_date}` : 'Generado por IngentIA Research'}
                    </p>
                  </div>
                </div>
                
                {client.client_analysis.metrics && (
                  <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-[24px] border border-black/5 shadow-md hover:shadow-lg transition-shadow">
                    <div className="text-5xl font-light text-[#1A1A1A] tracking-tighter">{client.client_analysis.metrics.overall_score}</div>
                    <div className="text-[11px] uppercase tracking-widest text-[#666666] font-bold leading-tight">IngentIA<br/>Score</div>
                  </div>
                )}
              </div>

              {/* Metrics Row */}
              {client.client_analysis.metrics && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
                  {[
                    { label: 'Reputación', value: client.client_analysis.metrics.reputation_score, color: 'bg-gradient-to-r from-[#FFD166] to-[#FFB020]' },
                    { label: 'Presencia Digital', value: client.client_analysis.metrics.digital_presence_score, color: 'bg-gradient-to-r from-emerald-400 to-emerald-500' },
                    { label: 'Madurez Mercado', value: client.client_analysis.metrics.market_maturity_score, color: 'bg-gradient-to-r from-blue-400 to-blue-500' },
                    { label: 'Fit IngentIA', value: client.client_analysis.metrics.ingentia_fit_score, color: 'bg-gradient-to-r from-purple-400 to-purple-500' }
                  ].map((metric, i) => (
                    <div key={i} className="bg-white/80 p-5 rounded-[24px] border border-black/5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center">
                      <div className="flex justify-between items-center text-[11px] uppercase tracking-wider text-[#666666] mb-4">
                        <span className="font-bold">{metric.label}</span>
                        <span className="text-[#1A1A1A] font-black text-sm">{metric.value}</span>
                      </div>
                      <div className="w-full bg-black/5 rounded-full h-2 overflow-hidden">
                        <div className={`${metric.color} h-full rounded-full`} style={{ width: `${metric.value}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex flex-col gap-8 relative z-10 flex-1">
                {/* Izquierda: Summary, Value Prop, Competitors */}
                <div className="flex flex-col gap-6">
                  <div className="bg-white/80 p-7 rounded-[24px] border border-black/5 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                    <h5 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-widest mb-4 flex items-center gap-2.5">
                      <div className="p-1.5 bg-[#FFD166]/20 rounded-lg">
                        <Folder size={14} className="text-[#FFB020]" />
                      </div>
                      Resumen Ejecutivo
                    </h5>
                    <p className="text-[14px] text-[#444444] leading-relaxed font-medium">
                      {client.client_analysis.summary}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-6">
                    <div className="bg-white/80 p-6 rounded-[24px] border border-black/5 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                      <h5 className="text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Modelo de Negocio</h5>
                      <p className="text-[13px] text-[#444444] leading-relaxed font-medium">{client.client_analysis.business_model}</p>
                    </div>
                    <div className="bg-white/80 p-6 rounded-[24px] border border-black/5 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                      <h5 className="text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-3">Público Objetivo</h5>
                      <p className="text-[13px] text-[#444444] leading-relaxed font-medium">{client.client_analysis.target_audience}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 p-7 rounded-[24px] border border-black/5 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                    <h5 className="text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-4">Propuesta de Valor Clave</h5>
                    <p className="text-[14px] text-[#1A1A1A] leading-relaxed font-semibold">{client.client_analysis.key_value_proposition}</p>
                  </div>

                  {/* Presencia Digital — movida aquí para usar ancho completo */}

                  {client.client_analysis.company_size && client.client_analysis.company_size !== "Sin datos" && (
                    <div className="bg-white/80 p-6 rounded-[24px] border border-black/5 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                      <h5 className="text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-2">Tamaño de la Empresa</h5>
                      <p className="text-[15px] text-[#1A1A1A] font-bold flex items-center gap-2">
                        <Building size={16} className="text-[#FFB020]" />
                        {client.client_analysis.company_size}
                      </p>
                    </div>
                  )}

                  {client.client_analysis.particularities && client.client_analysis.particularities.length > 0 && (
                    <div className="bg-white/80 p-7 rounded-[24px] border border-black/5 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                      <h5 className="text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Sparkles size={14} className="text-[#FFB020]" />
                        Particularidades del Negocio
                      </h5>
                      <ul className="flex flex-col gap-2">
                        {client.client_analysis.particularities.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-[13px] text-[#444444] font-medium leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FFD166] shrink-0 mt-1.5"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {client.client_analysis.competitors && client.client_analysis.competitors.length > 0 && (
                    <div className="pt-2">
                      <h5 className="text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-4 ml-1">Panorama Competitivo</h5>
                      <div className="flex flex-wrap gap-2.5">
                        {client.client_analysis.competitors.map((comp: string, idx: number) => (
                          <span key={idx} className="px-4 py-2 bg-white rounded-xl text-sm font-bold text-[#1A1A1A] border border-black/5 shadow-sm hover:-translate-y-0.5 transition-transform">
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                  {/* Presencia Digital — full width */}
                  <div className="bg-white/80 p-7 rounded-[24px] border border-black/5 flex flex-col gap-6 shadow-sm hover:shadow-md transition-shadow">
                    <h5 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-widest">Presencia Digital</h5>
                    <div className="flex flex-wrap gap-6 text-sm text-[#1A1A1A]">
                      {client.client_analysis.website && client.client_analysis.website !== "Sin datos" && (
                        <div className="flex items-center gap-3 group">
                          <div className="p-3 bg-black/5 rounded-2xl group-hover:bg-[#FFD166]/20 group-hover:text-[#FFB020] transition-colors"><Globe size={18} /></div>
                          <a href={client.client_analysis.website.startsWith('http') ? client.client_analysis.website : `https://${client.client_analysis.website}`} target="_blank" rel="noreferrer" className="hover:text-[#FFB020] transition-colors font-bold text-[15px]">{client.client_analysis.website}</a>
                        </div>
                      )}
                      {client.client_analysis.phone && client.client_analysis.phone !== "Sin datos" && (
                        <div className="flex items-center gap-3 group">
                          <div className="p-3 bg-black/5 rounded-2xl group-hover:bg-[#FFD166]/20 group-hover:text-[#FFB020] transition-colors"><Phone size={18} /></div>
                          <a href={`tel:${client.client_analysis.phone}`} className="hover:text-[#FFB020] transition-colors font-bold text-[15px]">{client.client_analysis.phone}</a>
                        </div>
                      )}
                    </div>
                    {client.client_analysis.social_links && (
                      <div className="flex items-center gap-4 pt-4 border-t border-black/5">
                        <span className="text-xs font-bold text-[#666666] uppercase tracking-widest mr-2">Redes:</span>
                        {client.client_analysis.social_links.linkedin && client.client_analysis.social_links.linkedin !== "Sin datos" && (
                          <a href={client.client_analysis.social_links.linkedin} target="_blank" rel="noreferrer" className="p-3 bg-black/5 hover:bg-[#0077b5] hover:text-white text-[#1A1A1A] rounded-2xl transition-all shadow-sm hover:shadow-md hover:-translate-y-1" title="LinkedIn"><Linkedin size={20} /></a>
                        )}
                        {client.client_analysis.social_links.instagram && client.client_analysis.social_links.instagram !== "Sin datos" && (
                          <a href={client.client_analysis.social_links.instagram} target="_blank" rel="noreferrer" className="p-3 bg-black/5 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white text-[#1A1A1A] rounded-2xl transition-all shadow-sm hover:shadow-md hover:-translate-y-1" title="Instagram"><Instagram size={20} /></a>
                        )}
                        {client.client_analysis.social_links.twitter && client.client_analysis.social_links.twitter !== "Sin datos" && (
                          <a href={client.client_analysis.social_links.twitter} target="_blank" rel="noreferrer" className="p-3 bg-black/5 hover:bg-black hover:text-white text-[#1A1A1A] rounded-2xl transition-all shadow-sm hover:shadow-md hover:-translate-y-1" title="Twitter/X"><Twitter size={20} /></a>
                        )}
                        {client.client_analysis.social_links.facebook && client.client_analysis.social_links.facebook !== "Sin datos" && (
                          <a href={client.client_analysis.social_links.facebook} target="_blank" rel="noreferrer" className="p-3 bg-black/5 hover:bg-[#1877F2] hover:text-white text-[#1A1A1A] rounded-2xl transition-all shadow-sm hover:shadow-md hover:-translate-y-1" title="Facebook"><Facebook size={20} /></a>
                        )}
                      </div>
                    )}
                    {(!client.client_analysis.website && !client.client_analysis.phone && !client.client_analysis.social_links) && (
                      <p className="text-sm text-[#666666] italic font-medium">La IA no encontró información de contacto pública adicional.</p>
                    )}
                  </div>

                  {/* Reputación y Sentiment — full width */}
                  {client.client_analysis.social_presence && (
                    <div className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md p-8 rounded-[32px] border border-black/5 flex flex-col gap-8 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><Sparkles size={160} /></div>
                      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#FFD166]/20 blur-[50px] rounded-full pointer-events-none"></div>
                      <h5 className="text-[11px] font-bold text-[#666666] uppercase tracking-widest relative z-10">Reputación y Sentiment</h5>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
                        <div className="bg-white/80 p-6 rounded-[24px] text-center border border-black/5 hover:bg-white transition-colors shadow-sm">
                          <div className="text-4xl font-light text-[#1A1A1A]">{client.client_analysis.social_presence.google_rating > 0 ? client.client_analysis.social_presence.google_rating : '-'}</div>
                          <div className="text-[10px] uppercase text-[#FFB020] font-bold mt-3 tracking-widest">Rating Google</div>
                        </div>
                        <div className="bg-white/80 p-6 rounded-[24px] text-center border border-black/5 hover:bg-white transition-colors shadow-sm">
                          <div className="text-4xl font-light text-[#1A1A1A]">{client.client_analysis.social_presence.google_reviews_count > 0 ? client.client_analysis.social_presence.google_reviews_count : '-'}</div>
                          <div className="text-[10px] uppercase text-[#FFB020] font-bold mt-3 tracking-widest">Reseñas Google</div>
                        </div>
                        <div className="bg-white/80 p-6 rounded-[24px] text-center border border-black/5 hover:bg-white transition-colors shadow-sm">
                          <div className="text-4xl font-light text-[#1A1A1A]">{client.client_analysis.social_presence.linkedin_followers > 0 ? client.client_analysis.social_presence.linkedin_followers.toLocaleString() : 'N/A'}</div>
                          <div className="text-[10px] uppercase text-[#FFB020] font-bold mt-3 tracking-widest">Seguidores LinkedIn</div>
                        </div>
                        <div className="bg-white/80 p-6 rounded-[24px] text-center border border-black/5 hover:bg-white transition-colors shadow-sm">
                          <div className={`text-lg font-bold mt-1 ${
                            client.client_analysis.social_presence.sentiment === 'POSITIVO' ? 'text-emerald-600' :
                            client.client_analysis.social_presence.sentiment === 'NEGATIVO' ? 'text-red-500' : 'text-[#666666]'
                          }`}>{client.client_analysis.social_presence.sentiment}</div>
                          <div className="text-[10px] uppercase text-[#FFB020] font-bold mt-3 tracking-widest">Sentiment Global</div>
                        </div>
                      </div>
                      {/* Temas positivos y negativos */}
                      {(client.client_analysis.social_presence.top_positive_themes?.length > 0 || client.client_analysis.social_presence.top_negative_themes?.length > 0) && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 relative z-10">
                          {client.client_analysis.social_presence.top_positive_themes?.length > 0 && (
                            <div className="bg-emerald-50/80 p-5 rounded-[20px] border border-emerald-100">
                              <h6 className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-3">✓ Temas Positivos</h6>
                              <ul className="flex flex-col gap-1.5">
                                {client.client_analysis.social_presence.top_positive_themes.map((t: string, i: number) => (
                                  <li key={i} className="text-[13px] text-emerald-800 font-medium flex items-start gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>{t}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {client.client_analysis.social_presence.top_negative_themes?.length > 0 && (
                            <div className="bg-red-50/80 p-5 rounded-[20px] border border-red-100">
                              <h6 className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-3">✗ Áreas de Mejora</h6>
                              <ul className="flex flex-col gap-1.5">
                                {client.client_analysis.social_presence.top_negative_themes.map((t: string, i: number) => (
                                  <li key={i} className="text-[13px] text-red-700 font-medium flex items-start gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>{t}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Noticias recientes */}
                      {client.client_analysis.social_presence.recent_news?.length > 0 && (
                        <div className="bg-white/80 p-5 rounded-[20px] border border-black/5 relative z-10">
                          <h6 className="text-[10px] font-bold text-[#666666] uppercase tracking-widest mb-3">Noticias Recientes</h6>
                          <ul className="flex flex-col gap-2">
                            {client.client_analysis.social_presence.recent_news.map((n: string, i: number) => (
                              <li key={i} className="text-[13px] text-[#444444] font-medium flex items-start gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#FFD166] shrink-0"></span>{n}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>
          ) : (
            <div className="bg-white/70 backdrop-blur-2xl rounded-[32px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-12 flex flex-col items-center justify-center text-center h-full min-h-[600px] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 pointer-events-none"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="p-8 bg-gradient-to-br from-[#FFD166]/20 to-transparent rounded-full mb-8 relative">
                  <div className="absolute inset-0 bg-[#FFD166]/20 rounded-full animate-ping opacity-75"></div>
                  <Sparkles size={56} className="text-[#FFB020] relative z-10" />
                </div>
                <h4 className="text-3xl font-medium text-[#1A1A1A] mb-4 tracking-tight">Perfil Estratégico Pendiente</h4>
                <p className="text-[#666666] max-w-md mb-10 leading-relaxed font-medium text-[15px]">Ejecuta el Análisis de IA para obtener insights profundos, panorama competitivo, propuesta de valor y reputación online del cliente.</p>
                <button 
                  onClick={handleRunAgentAnalysis}
                  disabled={isAgentRunning}
                  className="flex items-center justify-center gap-3 bg-gradient-to-r from-[#FFD166] to-[#FFB020] hover:from-[#FFC033] hover:to-[#FFA000] disabled:opacity-60 disabled:cursor-not-allowed text-[#1A1A1A] px-10 py-5 rounded-full text-base font-bold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                >
                  {isAgentRunning ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                  {isAgentRunning ? 'Investigando...' : 'Iniciar Análisis IA'}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {editModal}



      {isContactModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 transition-all" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg flex flex-col animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-7 border-b border-black/5 flex justify-between items-center bg-gray-50/50 rounded-t-[32px]">
              <h3 className="text-xl font-bold text-[#1A1A1A] tracking-tight">{contactFormData.id ? 'Editar Contacto' : 'Nuevo Contacto'}</h3>
              <button onClick={() => setIsContactModalOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <X size={20} className="text-[#1A1A1A]" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="p-8 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider">Nombre</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Ej: Juan"
                    value={contactFormData.first_name}
                    onChange={(e) => setContactFormData({ ...contactFormData, first_name: e.target.value })}
                    className="w-full h-12 rounded-2xl border border-black/10 bg-white text-sm px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all shadow-sm" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider">Apellido</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Ej: Perez"
                    value={contactFormData.last_name}
                    onChange={(e) => setContactFormData({ ...contactFormData, last_name: e.target.value })}
                    className="w-full h-12 rounded-2xl border border-black/10 bg-white text-sm px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all shadow-sm" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider">Email</label>
                <input 
                  required 
                  type="email" 
                  placeholder="email@ejemplo.com"
                  value={contactFormData.email}
                  onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                  className="w-full h-12 rounded-2xl border border-black/10 bg-white text-sm px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all shadow-sm" 
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider">Teléfono</label>
                  <input 
                    type="tel" 
                    placeholder="+54..."
                    value={contactFormData.phone}
                    onChange={(e) => setContactFormData({ ...contactFormData, phone: e.target.value })}
                    className="w-full h-12 rounded-2xl border border-black/10 bg-white text-sm px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all shadow-sm" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider">Rol / Cargo</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Gerente"
                    value={contactFormData.role}
                    onChange={(e) => setContactFormData({ ...contactFormData, role: e.target.value })}
                    className="w-full h-12 rounded-2xl border border-black/10 bg-white text-sm px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all shadow-sm" 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-black/5">
                <button type="button" onClick={() => setIsContactModalOpen(false)} className="px-6 py-3 rounded-full text-sm font-bold text-[#666666] hover:bg-black/5 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={savingContact} className="bg-[#222222] hover:bg-black disabled:opacity-50 text-white px-8 py-3 rounded-full text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                  {savingContact ? 'Guardando...' : 'Guardar Contacto'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
    </>
  );
}


