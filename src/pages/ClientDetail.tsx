import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Building, 
  DollarSign, 
  Folder, 
  X, 
  Save, 
  Plus, 
  Trash2, 
  UserPlus, 
  MoreVertical, 
  Sparkles, 
  Loader2, 
  Globe, 
  Linkedin, 
  Instagram, 
  Facebook,
  FileText,
  Calendar
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { generateLeadEnrichment } from '../lib/gemini-lead-enrichment';
import MeetingIntelligenceSection from '../components/MeetingIntelligenceSection';
import { ProjectTranscript, MeetingIntelligence } from '../lib/gemini-meeting-intelligence';

const EditIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
  </svg>
);

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
  client_analysis?: any;
}

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  budget: number;
  project_analysis?: any;
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
  const [clientTranscripts, setClientTranscripts] = useState<ProjectTranscript[]>([]);
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

      // Aggregate all minutas / transcripts across client projects & client analysis
      const aggregatedTranscripts: ProjectTranscript[] = [];
      const seenTranscriptIds = new Set<string>();

      // Transcripts from client_analysis
      if (clientData.client_analysis?.transcripts && Array.isArray(clientData.client_analysis.transcripts)) {
        clientData.client_analysis.transcripts.forEach((t: any) => {
          if (t && !seenTranscriptIds.has(t.id || t.summary)) {
            seenTranscriptIds.add(t.id || t.summary);
            aggregatedTranscripts.push(t);
          }
        });
      }

      // Transcripts from projects
      (projectsData || []).forEach((p: any) => {
        if (p.project_analysis?.transcripts && Array.isArray(p.project_analysis.transcripts)) {
          p.project_analysis.transcripts.forEach((t: any) => {
            if (t && !seenTranscriptIds.has(t.id || t.summary)) {
              seenTranscriptIds.add(t.id || t.summary);
              aggregatedTranscripts.push(t);
            }
          });
        }
      });

      setClientTranscripts(
        aggregatedTranscripts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      );

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
      
      const brief = await generateLeadEnrichment({
        empresa: client.name,
        sector: client.industry,
        contacto_nombre: client.contact_person
      });

      const currentAnalysis = client.client_analysis || {};
      const updatedAnalysis = {
        ...currentAnalysis,
        summary: brief.empresa_una_frase || currentAnalysis.summary,
        social_presence: {
          web: brief.fuentes?.find((f: string) => f.includes('.')) || currentAnalysis.social_presence?.web || '',
          google_rating: brief.presencia_digital?.google_rating ?? null,
          google_reviews_count: brief.presencia_digital?.google_reviews ?? null,
          linkedin_followers: brief.presencia_digital?.linkedin_followers ?? null,
          instagram_followers: brief.presencia_digital?.instagram_followers ?? null,
          sentiment: brief.presencia_digital?.sentimiento || 'POSITIVO',
          top_positive_themes: brief.presencia_digital?.temas_positivos || [],
          top_negative_themes: brief.presencia_digital?.temas_negativos || [],
        },
        redes: {
          web: brief.fuentes?.find((f: string) => f.includes('.')) || currentAnalysis.redes?.web || '',
          linkedin: currentAnalysis.redes?.linkedin || '',
          instagram: currentAnalysis.redes?.instagram || '',
          facebook: currentAnalysis.redes?.facebook || ''
        }
      };

      const { error: updateClientError } = await supabase
        .from('clients')
        .update({ client_analysis: updatedAnalysis })
        .eq('id', client.id);

      if (updateClientError) throw updateClientError;

      await fetchClientAndProjects();
    } catch (err) {
      console.error("Error generating AI analysis:", err);
      alert('Hubo un error al re-investigar la presencia digital.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSaveIntelligence = async (newIntel: MeetingIntelligence) => {
    if (!client) return;
    try {
      const currentAnalysis = client.client_analysis || {};
      const updatedAnalysis = { ...currentAnalysis, meeting_intelligence: newIntel };
      
      const { error } = await supabase
        .from('clients')
        .update({ client_analysis: updatedAnalysis })
        .eq('id', client.id);

      if (error) throw error;
      setClient(prev => prev ? { ...prev, client_analysis: updatedAnalysis } : null);
    } catch (err) {
      console.error('Error saving meeting intelligence in client:', err);
    }
  };

  const handleNewQuote = async () => {
    if (!client) return;
    try {
      const { data, error } = await supabase.from('quotes').insert({
        title: 'Nueva Propuesta Comercial',
        status: 'Generada',
        total_amount: 1200,
        client_id: client.id,
        client_name: client.name,
        content: {
          diagnosis: 'Diagnóstico Operativo',
          hoursStage1: 0,
          labelStage1: 'Diagnóstico',
          hoursStage2: 0,
          labelStage2: 'Desarrollo',
          roiEstimate: '',
          salesStrategy: '',
          deliverables: ['Mapeo As-Is / To-Be', 'Identificación de Deuda Operativa', 'Propuesta de Arquitectura'],
          risks: [],
          commercialNarrative: '',
          pricing: {
            module1: { description: 'Diagnóstico Operativo (Bonificable si se avanza con desarrollo)', price: 1200, deliveryDays: 14 },
            module2: { description: 'Desarrollo', price: 0, pricingModel: 'Fixed' },
            module3: { description: 'Mantenimiento', monthlyPrice: 0 },
            totalInitialInvestment: 1200
          }
        }
      }).select().single();
      
      if (error) throw error;
      if (data) navigate(`/propuestas/${data.id}`);
    } catch (err) {
      console.error("Error creating new quote:", err);
      alert('Hubo un error al crear la cotización.');
    }
  };

  if (loading) return <div className="p-20 text-center text-[#666666]">Cargando cliente...</div>;
  if (!client) return <div className="p-20 text-center text-[#666666]">Cliente no encontrado</div>;

  const initials = client.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
  const activeProjectsCount = projects.filter(p => p.status === 'En Progreso').length;

  return (
    <>
    <div className="flex-1 flex flex-col gap-5 w-full max-w-7xl mx-auto animate-in fade-in duration-300 pb-12">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link to="/clients" className="p-2 bg-white hover:bg-black/5 rounded-xl transition-all duration-200 border border-black/5 shadow-xs group">
            <ArrowLeft size={16} className="text-[#1A1A1A] group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#1A1A1A] leading-tight">
                {client.name}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${client.status === 'Activo' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                {client.status}
              </span>
            </div>
            <p className="text-xs text-[#666666] font-medium mt-0.5">
              Cliente activo · Registrado en {new Date(client.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={handleNewQuote}
            className="flex items-center justify-center gap-1.5 bg-white hover:bg-black/5 text-[#1A1A1A] border border-black/10 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs"
          >
            <Plus size={14} />
            Nueva Cotización
          </button>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center justify-center gap-1.5 bg-[#222222] hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs"
          >
            <EditIcon size={14} />
            Editar Cliente
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* COLUMNA IZQUIERDA (Info, Contactos, Redes) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Tarjeta de Información General */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-xs p-4 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#222222] to-[#444444] flex items-center justify-center text-white text-base font-bold shadow-xs shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[#1A1A1A] truncate">{client.name}</h4>
                <p className="text-xs text-[#666666] truncate">{client.industry || 'Industria no especificada'}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-3 border-t border-black/5">
              <div className="flex items-center gap-2.5 text-[#666666]">
                <div className="w-6 h-6 rounded-lg bg-black/5 flex items-center justify-center text-[#1A1A1A] shrink-0">
                  <Building size={12} />
                </div>
                <span className="text-xs font-medium">CLI-{client.id.substring(0, 4).toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2.5 text-[#666666]">
                <div className="w-6 h-6 rounded-lg bg-black/5 flex items-center justify-center text-[#1A1A1A] shrink-0">
                  <Mail size={12} />
                </div>
                <a href={`mailto:${client.email}`} className="text-xs font-medium hover:text-[#1A1A1A] truncate transition-colors">
                  {client.email || 'Sin email'}
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-[#666666]">
                <div className="w-6 h-6 rounded-lg bg-black/5 flex items-center justify-center text-[#1A1A1A] shrink-0">
                  <Phone size={12} />
                </div>
                <a href={`tel:${client.phone}`} className="text-xs font-medium hover:text-[#1A1A1A] truncate transition-colors">
                  {client.phone || 'Sin teléfono'}
                </a>
              </div>
            </div>
          </div>

          {/* Tarjeta de Contactos */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-xs p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center pb-1">
              <h5 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                Contactos ({contacts.length})
              </h5>
              <button 
                onClick={() => { 
                  setContactFormData({ id: '', first_name: '', last_name: '', email: '', phone: '', role: 'Contacto' }); 
                  setIsContactModalOpen(true); 
                }}
                className="p-1 hover:bg-black/5 rounded-lg text-[#1A1A1A] transition-colors"
                title="Agregar contacto"
              >
                <UserPlus size={14} />
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              {contacts.length === 0 ? (
                <p className="text-[11px] text-[#888888] italic py-2 text-center bg-black/2 rounded-xl">
                  Sin contactos registrados.
                </p>
              ) : (
                contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between group bg-zinc-50/70 hover:bg-zinc-50 p-2.5 rounded-xl border border-black/5 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-black/5 flex items-center justify-center text-[#1A1A1A] font-bold text-[10px] shrink-0">
                        {contact.first_name[0] || ''}{contact.last_name[0] || ''}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1A1A1A] truncate leading-tight">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <p className="text-[10px] text-[#666666] truncate">{contact.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button 
                        onClick={() => { setContactFormData({...contact}); setIsContactModalOpen(true); }}
                        className="p-1 hover:bg-black/5 rounded-lg text-[#666666]"
                      >
                        <MoreVertical size={13} />
                      </button>
                      <button 
                        onClick={() => handleDeleteContact(contact.id)} 
                        className="p-1 hover:bg-red-50 rounded-lg text-red-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tarjeta de Presencia Digital y Reputación Real */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-xs p-4 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                  Presencia Digital & Reputación
                </h5>
                <p className="text-[10px] text-[#666666]">Información pública verificada</p>
              </div>
              <button 
                onClick={handleGenerateAI}
                disabled={isGeneratingAI}
                className="flex items-center gap-1 bg-black/5 hover:bg-black/10 text-[#1A1A1A] px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-50"
              >
                {isGeneratingAI ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                <span>{isGeneratingAI ? 'Buscando...' : 'Re-investigar'}</span>
              </button>
            </div>

            {(() => {
              const sp = client.client_analysis?.social_presence || {};
              const redes = client.client_analysis?.redes || {
                web: sp.web || null,
                linkedin: sp.linkedin || null,
                instagram: sp.instagram || null,
                facebook: sp.facebook || null
              };

              const hasRating = typeof sp.google_rating === 'number' && sp.google_rating > 0;
              const hasReviews = typeof sp.google_reviews_count === 'number' && sp.google_reviews_count > 0;
              const hasLinkedin = typeof sp.linkedin_followers === 'number' && sp.linkedin_followers > 0;
              const hasInstagram = typeof sp.instagram_followers === 'number' && sp.instagram_followers > 0;

              return (
                <div className="flex flex-col gap-3">
                  {/* Badges de Reputación y Reseñas */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Google Rating */}
                    <div className="bg-amber-50/60 border border-amber-200/50 p-2.5 rounded-xl flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-bold text-amber-900">
                        {hasRating ? `⭐ ${sp.google_rating}` : 'Sin reseñas'}
                      </span>
                      <span className="text-[9px] text-amber-700 font-medium">
                        {hasReviews ? `${sp.google_reviews_count} reseñas Google` : 'Google Maps'}
                      </span>
                    </div>

                    {/* Sentimiento */}
                    <div className="bg-emerald-50/60 border border-emerald-200/50 p-2.5 rounded-xl flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-bold text-emerald-900">
                        {sp.sentiment || 'POSITIVO'}
                      </span>
                      <span className="text-[9px] text-emerald-700 font-medium">Sentimiento de Marca</span>
                    </div>
                  </div>

                  {/* Enlaces de Redes */}
                  <div className="flex flex-col gap-1.5 text-xs pt-1 border-t border-black/5">
                    <div className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-black/2">
                      <Globe size={13} className="text-[#666666] shrink-0" />
                      <span className="text-[10px] font-semibold text-[#888888] w-14">Web:</span>
                      {redes.web ? (
                        <a href={redes.web.startsWith('http') ? redes.web : `https://${redes.web}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-medium text-xs truncate">
                          {redes.web.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <span className="text-[11px] text-[#999999] italic">No detectada</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-black/2">
                      <Linkedin size={13} className="text-blue-600 shrink-0" />
                      <span className="text-[10px] font-semibold text-[#888888] w-14">LinkedIn:</span>
                      {redes.linkedin ? (
                        <a href={redes.linkedin.startsWith('http') ? redes.linkedin : `https://${redes.linkedin}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium text-xs truncate">
                          Perfil de Empresa
                        </a>
                      ) : (
                        <span className="text-[11px] text-[#999999] italic">No detectado</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-black/2">
                      <Instagram size={13} className="text-pink-600 shrink-0" />
                      <span className="text-[10px] font-semibold text-[#888888] w-14">Instagram:</span>
                      {redes.instagram ? (
                        <a href={redes.instagram.startsWith('http') ? redes.instagram : `https://${redes.instagram}`} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline font-medium text-xs truncate">
                          Cuenta Oficial
                        </a>
                      ) : (
                        <span className="text-[11px] text-[#999999] italic">No detectado</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-black/2">
                      <Facebook size={13} className="text-blue-800 shrink-0" />
                      <span className="text-[10px] font-semibold text-[#888888] w-14">Facebook:</span>
                      {redes.facebook ? (
                        <a href={redes.facebook.startsWith('http') ? redes.facebook : `https://${redes.facebook}`} target="_blank" rel="noreferrer" className="text-blue-800 hover:underline font-medium text-xs truncate">
                          Página Oficial
                        </a>
                      ) : (
                        <span className="text-[11px] text-[#999999] italic">No detectado</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* COLUMNA DERECHA (KPIs, Proyectos, Cotizaciones, Minutas Inteligentes) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          
          {/* Fila de KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">Proyectos Activos</p>
                <h4 className="text-2xl font-light text-[#1A1A1A] tracking-tight mt-0.5">{activeProjectsCount}</h4>
              </div>
              <div className="p-2.5 bg-black/5 rounded-xl text-[#1A1A1A]">
                <Folder size={18} />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">Presupuesto Acumulado</p>
                <h4 className="text-2xl font-light text-[#1A1A1A] tracking-tight mt-0.5">
                  ${(totalBudget / 1000).toFixed(1)}k
                </h4>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                <DollarSign size={18} />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">Cotizaciones</p>
                <h4 className="text-2xl font-light text-[#1A1A1A] tracking-tight mt-0.5">{quotes.length}</h4>
              </div>
              <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                <FileText size={18} />
              </div>
            </div>
          </div>

          {/* Grid de Proyectos y Cotizaciones Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Proyectos */}
            <div className="bg-white rounded-2xl border border-black/5 shadow-xs p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center pb-1">
                <h5 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">Proyectos</h5>
                <Link to="/projects/new" className="p-1 hover:bg-black/5 rounded-lg text-[#1A1A1A] transition-colors">
                  <Plus size={14} />
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                {projects.length === 0 ? (
                  <p className="text-[11px] text-[#888888] italic py-2 text-center bg-black/2 rounded-xl">
                    No hay proyectos asociados.
                  </p>
                ) : (
                  projects.slice(0, 4).map(p => (
                    <Link 
                      key={p.id} 
                      to={`/projects/${p.id}`} 
                      className="flex justify-between items-center bg-zinc-50/70 hover:bg-zinc-50 p-2.5 rounded-xl border border-black/5 hover:border-black/20 transition-all"
                    >
                      <div className="overflow-hidden mr-2 min-w-0">
                        <p className="text-xs font-bold text-[#1A1A1A] truncate">{p.name}</p>
                        <p className="text-[9px] font-bold text-[#666666] uppercase mt-0.5">{p.status}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-[#1A1A1A]">${(p.budget || 0).toLocaleString()}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Cotizaciones */}
            <div className="bg-white rounded-2xl border border-black/5 shadow-xs p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center pb-1">
                <h5 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">Cotizaciones</h5>
                <button onClick={handleNewQuote} className="p-1 hover:bg-black/5 rounded-lg text-[#1A1A1A] transition-colors">
                  <Plus size={14} />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {quotes.length === 0 ? (
                  <p className="text-[11px] text-[#888888] italic py-2 text-center bg-black/2 rounded-xl">
                    No hay cotizaciones emitidas.
                  </p>
                ) : (
                  quotes.slice(0, 4).map(q => (
                    <Link 
                      key={q.id} 
                      to={`/propuestas/${q.id}`} 
                      className="flex justify-between items-center bg-zinc-50/70 hover:bg-zinc-50 p-2.5 rounded-xl border border-black/5 hover:border-black/20 transition-all"
                    >
                      <div className="overflow-hidden mr-2 min-w-0">
                        <p className="text-xs font-bold text-[#1A1A1A] truncate">{q.title}</p>
                        <p className="text-[9px] font-bold text-[#888888] uppercase mt-0.5">{q.status}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-[#1A1A1A]">${(q.total_amount || 0).toLocaleString()}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* SECCIÓN DE INTELIGENCIA DE MINUTAS Y ACUERDOS DEL CLIENTE */}
          <MeetingIntelligenceSection
            contextName={client.name}
            transcripts={clientTranscripts}
            initialIntelligence={client.client_analysis?.meeting_intelligence || null}
            onSaveIntelligence={handleSaveIntelligence}
          />

        </div>
      </div>
    </div>

    {/* MODAL EDITAR CLIENTE */}
    {isEditModalOpen && createPortal(
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col" onClick={(e) => e.stopPropagation()}>
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
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-[#666666] hover:bg-black/5">Cancelar</button>
              <button type="submit" disabled={savingClient} className="flex items-center gap-2 bg-[#222222] hover:bg-black disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold"><Save size={14} />{savingClient ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    )}

    {/* MODAL CONTACTO */}
    {isContactModalOpen && createPortal(
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col" onClick={(e) => e.stopPropagation()}>
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
              <button type="button" onClick={() => setIsContactModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-[#666666] hover:bg-black/5">Cancelar</button>
              <button type="submit" disabled={savingContact} className="flex items-center gap-2 bg-[#222222] hover:bg-black disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold"><Save size={14} />{savingContact ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
