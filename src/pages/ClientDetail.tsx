import { ArrowLeft, Mail, Phone, Building, Clock, DollarSign, Folder, X, Save } from 'lucide-react';
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

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
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
              <h5 className="text-sm font-medium text-[#1A1A1A] mb-3">Contacto Principal</h5>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-[#1A1A1A] font-medium text-sm">
                  {contactInitials}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">{client.contact_person}</p>
                  <p className="text-xs text-[#666666]">Representante</p>
                </div>
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
        </div>
      </div>

      {editModal}
    </div>
  );
}

const EditIcon = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
