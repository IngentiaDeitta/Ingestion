import { ArrowLeft, Mail, Phone, Building, Clock, DollarSign, Folder, X, Save, Plus, Eye, Trash2, UserPlus, MoreVertical } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';

interface Client {
  id: string;
  name: string;
  industry: string;
  email: string;
  phone: string;
  contact_person: string;
  created_at: string;
  status: string;
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
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/clients" className="p-3 bg-white/50 hover:bg-white/80 rounded-full transition-colors border border-black/5 shadow-sm">
            <ArrowLeft size={20} className="text-[#1A1A1A]" />
          </Link>
          <div>
            <h3 className="text-[42px] font-normal tracking-tight text-[#1A1A1A]">{client.name}</h3>
            <p className="text-[#666666] mt-1">Cliente desde {new Date(client.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <button 
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#222222] hover:bg-black text-white px-6 py-3 rounded-full text-sm font-medium transition-colors shadow-sm"
        >
          <EditIcon size={16} />
          Editar Detalles
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Info Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#222222] flex items-center justify-center text-white text-xl font-light shadow-md">
                {initials}
              </div>
              <div>
                <h4 className="text-xl font-medium text-[#1A1A1A]">{client.name}</h4>
                <p className="text-sm text-[#666666]">{client.industry}</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-6 border-t border-black/5">
              <div className="flex items-center gap-3 text-[#666666]">
                <Building size={18} />
                <span className="text-sm">ID: CLI-{client.id.substring(0, 4).toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-3 text-[#666666]">
                <Mail size={18} />
                <a href={`mailto:${client.email}`} className="text-sm hover:text-[#1A1A1A] transition-colors">{client.email}</a>
              </div>
              <div className="flex items-center gap-3 text-[#666666]">
                <Phone size={18} />
                <a href={`tel:${client.phone}`} className="text-sm hover:text-[#1A1A1A] transition-colors">{client.phone}</a>
              </div>
            </div>

            <div className="pt-6 border-t border-black/5">
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-sm font-medium text-[#1A1A1A]">Personas de Contacto</h5>
                <button 
                  onClick={() => {
                    setContactFormData({ id: '', first_name: '', last_name: '', email: '', phone: '', role: 'Contacto' });
                    setIsContactModalOpen(true);
                  }}
                  className="p-1.5 hover:bg-black/5 rounded-full text-[#1A1A1A] transition-colors"
                  title="Agregar Contacto"
                >
                  <UserPlus size={16} />
                </button>
              </div>
              
              <div className="flex flex-col gap-3">
                {contacts.length === 0 ? (
                  <p className="text-xs text-[#666666] italic">No hay contactos secundarios registrados.</p>
                ) : (
                  contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between group/contact bg-white/40 p-3 rounded-2xl border border-black/5 hover:border-[#FFD166]/50 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[#1A1A1A] font-medium text-[10px]">
                          {contact.first_name[0]}{contact.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1A1A1A]">{contact.first_name} {contact.last_name}</p>
                          <p className="text-[10px] text-[#666666]">{contact.role} • {contact.email}</p>
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
                          className="p-1.5 hover:bg-black/5 rounded-full text-[#666666]"
                        >
                          <MoreVertical size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteContact(contact.id)}
                          className="p-1.5 hover:bg-red-50 rounded-full text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats and Projects */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-6 border border-white/40 shadow-sm relative overflow-hidden group">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-[#1A1A1A] w-fit mb-4">
                <Folder size={24} />
              </div>
              <p className="text-[#666666] text-sm font-medium mb-1">Proyectos Activos</p>
              <h4 className="text-4xl font-light text-[#1A1A1A]">{projects.filter(p => p.status === 'En Progreso').length}</h4>
            </div>
            <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-6 border border-white/40 shadow-sm relative overflow-hidden group">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-[#1A1A1A] w-fit mb-4">
                <Clock size={24} />
              </div>
              <p className="text-[#666666] text-sm font-medium mb-1">Total Proyectos</p>
              <h4 className="text-4xl font-light text-[#1A1A1A]">{projects.length}</h4>
            </div>
            <div className="bg-[#222222] text-white rounded-[32px] p-6 shadow-xl relative overflow-hidden group">
              <div className="p-3 bg-white/10 rounded-2xl w-fit mb-4">
                <DollarSign size={24} />
              </div>
              <p className="text-white/70 text-sm font-medium mb-1">Presupuesto Total</p>
              <h4 className="text-4xl font-light">${projects.reduce((acc, p) => acc + (p.budget || 0), 0).toLocaleString()}</h4>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm overflow-hidden flex flex-col flex-1">
            <div className="p-6 border-b border-black/5 flex justify-between items-center">
              <h4 className="text-xl font-medium text-[#1A1A1A]">Proyectos del Cliente</h4>
              <Link to="/projects/new" className="text-sm font-medium text-[#1A1A1A] hover:underline">
                Nuevo Proyecto
              </Link>
            </div>
            
            {projects.length === 0 ? (
              <div className="p-20 text-center text-[#666666] italic">
                No hay proyectos registrados para este cliente.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black/5">
                      <th className="px-6 py-4 text-xs font-medium text-[#666666] uppercase tracking-wider">Nombre</th>
                      <th className="px-6 py-4 text-xs font-medium text-[#666666] uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-4 text-xs font-medium text-[#666666] uppercase tracking-wider">Progreso</th>
                      <th className="px-6 py-4 text-xs font-medium text-[#666666] uppercase tracking-wider text-right">Presupuesto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {projects.map((project) => (
                      <tr key={project.id} className="hover:bg-white/40 transition-colors group">
                        <td className="px-6 py-4">
                          <Link to={`/projects/${project.id}`} className="font-medium text-[#1A1A1A] hover:underline">{project.name}</Link>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                            project.status === 'En Progreso' ? 'bg-[#FFD166]/20 text-[#1A1A1A] border-[#FFD166]/50' :
                            project.status === 'Completado' ? 'bg-green-500/10 text-green-700 border-green-500/20' :
                            'bg-red-500/10 text-red-700 border-red-500/20'
                          }`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-full bg-black/5 rounded-full h-2 max-w-[100px]">
                              <div className={`h-2 rounded-full ${project.status === 'En Riesgo' ? 'bg-red-400' : project.status === 'Completado' ? 'bg-green-400' : 'bg-[#FFD166]'}`} style={{ width: `${project.progress}%` }}></div>
                            </div>
                            <span className="text-xs text-[#666666]">{project.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-medium text-[#1A1A1A]">${(project.budget || 0).toLocaleString()}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Historial de Cotizaciones */}
          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm overflow-hidden flex flex-col mt-6">
            <div className="p-6 border-b border-black/5 flex justify-between items-center">
              <h4 className="text-xl font-medium text-[#1A1A1A]">Historial de Cotizaciones (Smart Quoter)</h4>
              <Link to="/smart-quoter" className="text-sm font-medium text-[#1A1A1A] hover:underline flex items-center gap-2">
                <Plus size={14} /> Nueva Cotización
              </Link>
            </div>
            
            {quotes.length === 0 ? (
              <div className="p-16 text-center text-[#666666] italic">
                Aún no hay cotizaciones guardadas para este cliente.
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-hidden">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="border-b border-black/5 bg-black/[0.02]">
                      <th className="px-4 py-4 text-[10px] font-bold text-[#666666] uppercase tracking-wider w-[100px]">Fecha</th>
                      <th className="px-4 py-4 text-[10px] font-bold text-[#666666] uppercase tracking-wider">Proyecto / Título</th>
                      <th className="px-4 py-4 text-[10px] font-bold text-[#666666] uppercase tracking-wider w-[120px]">Estado</th>
                      <th className="px-4 py-4 text-[10px] font-bold text-[#666666] uppercase tracking-wider w-[150px]">Comentarios</th>
                      <th className="px-4 py-4 text-[10px] font-bold text-[#666666] uppercase tracking-wider text-right w-[110px]">Inversión</th>
                      <th className="px-4 py-4 text-[10px] font-bold text-[#666666] uppercase tracking-wider text-right w-[130px]">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {quotes.map((quote) => (
                      <tr key={quote.id} className="hover:bg-white/40 transition-colors group">
                        <td className="px-4 py-4">
                          <span className="text-xs text-[#666666]">{new Date(quote.created_at).toLocaleDateString()}</span>
                        </td>
                        <td className="px-4 py-4 overflow-hidden">
                          <p className="font-medium text-[#1A1A1A] text-sm truncate" title={quote.title}>{quote.title}</p>
                          <p className="text-[10px] text-[#666666] uppercase tracking-wider truncate">{quote.project_name}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            quote.status === 'Aceptada' ? 'bg-green-500/10 text-green-700 border-green-500/20' :
                            quote.status === 'Rechazada' ? 'bg-red-500/10 text-red-700 border-red-500/20' :
                            quote.status === 'Enviada' ? 'bg-blue-500/10 text-blue-700 border-blue-500/20' :
                            'bg-gray-500/10 text-gray-700 border-gray-500/20'
                          }`}>
                            {quote.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs text-[#666666] truncate" title={quote.comments}>
                            {quote.comments || '-'}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-sm text-[#1A1A1A]">
                          ${quote.total_amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Link 
                              to={`/smart-quoter?quoteId=${quote.id}`}
                              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#1A1A1A] hover:bg-black hover:text-white px-2.5 py-1.5 rounded-full transition-all border border-black/10 shadow-sm bg-white"
                            >
                              <Eye size={10} /> Reabrir
                            </Link>
                            <button 
                              onClick={() => handleDeleteQuote(quote.id)}
                              className="inline-flex items-center justify-center text-red-600 hover:bg-red-600 hover:text-white w-7 h-7 rounded-full transition-all border border-red-100 bg-red-50"
                              title="Eliminar"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {editModal}

      {isContactModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-black/5 flex justify-between items-center">
              <h3 className="text-xl font-medium text-[#1A1A1A]">{contactFormData.id ? 'Editar Contacto' : 'Nuevo Contacto'}</h3>
              <button onClick={() => setIsContactModalOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <X size={20} className="text-[#1A1A1A]" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase">Nombre</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Ej: Juan"
                    value={contactFormData.first_name}
                    onChange={(e) => setContactFormData({ ...contactFormData, first_name: e.target.value })}
                    className="w-full h-11 rounded-xl border border-black/10 bg-white text-sm px-4 focus:ring-2 focus:ring-[#FFD166] outline-none" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase">Apellido</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Ej: Perez"
                    value={contactFormData.last_name}
                    onChange={(e) => setContactFormData({ ...contactFormData, last_name: e.target.value })}
                    className="w-full h-11 rounded-xl border border-black/10 bg-white text-sm px-4 focus:ring-2 focus:ring-[#FFD166] outline-none" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase">Email</label>
                <input 
                  required 
                  type="email" 
                  placeholder="email@ejemplo.com"
                  value={contactFormData.email}
                  onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                  className="w-full h-11 rounded-xl border border-black/10 bg-white text-sm px-4 focus:ring-2 focus:ring-[#FFD166] outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase">Teléfono</label>
                  <input 
                    type="tel" 
                    placeholder="+54..."
                    value={contactFormData.phone}
                    onChange={(e) => setContactFormData({ ...contactFormData, phone: e.target.value })}
                    className="w-full h-11 rounded-xl border border-black/10 bg-white text-sm px-4 focus:ring-2 focus:ring-[#FFD166] outline-none" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase">Rol / Cargo</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Gerente"
                    value={contactFormData.role}
                    onChange={(e) => setContactFormData({ ...contactFormData, role: e.target.value })}
                    className="w-full h-11 rounded-xl border border-black/10 bg-white text-sm px-4 focus:ring-2 focus:ring-[#FFD166] outline-none" 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsContactModalOpen(false)} className="px-5 py-2.5 rounded-full text-sm font-medium text-[#666666] hover:bg-black/5 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={savingContact} className="bg-[#222222] hover:bg-black disabled:opacity-50 text-white px-8 py-2.5 rounded-full text-sm font-medium transition-colors">
                  {savingContact ? 'Guardando...' : 'Guardar Contacto'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

const EditIcon = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
