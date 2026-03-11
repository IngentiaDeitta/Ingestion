import { ArrowLeft, X, Plus, Trash2, Save } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';

interface Project {
  id: string;
  name: string;
  client: string;
  budget: number;
  due_date: string;
  description: string;
  status: string;
  progress: number;
  created_at: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar_color: string;
}

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [allTeam, setAllTeam] = useState<TeamMember[]>([]);
  const [assignedTeam, setAssignedTeam] = useState<TeamMember[]>([]);
  const [savingTeam, setSavingTeam] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [editFormData, setEditFormData] = useState({
    name: '',
    client: '',
    budget: '',
    due_date: '',
    status: '',
    progress: 0,
    description: ''
  });

  useEffect(() => {
    if (id) {
      fetchProjectData();
      fetchClients();
    }
  }, [id]);

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, name').order('name');
    setClients(data || []);
  };

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (projectError) throw projectError;
      setProject(projectData);
      
      setEditFormData({
        name: projectData.name,
        client: projectData.client,
        budget: projectData.budget.toString(),
        due_date: projectData.due_date ? convertToInputDate(projectData.due_date) : '',
        status: projectData.status,
        progress: projectData.progress,
        description: projectData.description || ''
      });

      const { data: teamData } = await supabase
        .from('team')
        .select('*')
        .order('name');
      setAllTeam(teamData || []);

      const { data: assignedData, error: assignedError } = await supabase
        .from('project_team')
        .select(`
          member_id,
          team:member_id (
            id,
            name,
            role,
            avatar_color
          )
        `)
        .eq('project_id', id);

      if (!assignedError && assignedData) {
        setAssignedTeam(assignedData.map((item: any) => item.team).filter(Boolean));
      }

    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertToInputDate = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  };

  const formatDateForDb = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setSavingProject(true);
      const { error } = await supabase
        .from('projects')
        .update({
          name: editFormData.name,
          client: editFormData.client,
          budget: parseFloat(editFormData.budget) || 0,
          due_date: editFormData.due_date ? formatDateForDb(editFormData.due_date) : '',
          status: editFormData.status,
          progress: editFormData.progress,
          description: editFormData.description
        })
        .eq('id', id);

      if (error) throw error;
      
      await fetchProjectData();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Error al actualizar el proyecto');
    } finally {
      setSavingProject(false);
    }
  };

  const handleToggleMember = async (memberId: string) => {
    if (!id) return;
    
    const isAssigned = assignedTeam.some(m => m.id === memberId);
    
    try {
      setSavingTeam(true);
      if (isAssigned) {
        const { error } = await supabase
          .from('project_team')
          .delete()
          .eq('project_id', id)
          .eq('member_id', memberId);
        
        if (error) throw error;
        setAssignedTeam(assignedTeam.filter(m => m.id !== memberId));
      } else {
        const { error } = await supabase
          .from('project_team')
          .insert([{ project_id: id, member_id: memberId }]);
        
        if (error) throw error;
        const member = allTeam.find(m => m.id === memberId);
        if (member) setAssignedTeam([...assignedTeam, member]);
      }
    } catch (error: any) {
      console.error('Error updating team:', error);
      alert('Error al actualizar el equipo.');
    } finally {
      setSavingTeam(false);
    }
  };

  if (loading) return <div className="p-20 text-center text-[#666666]">Cargando proyecto...</div>;
  if (!project) return <div className="p-20 text-center text-[#666666]">Proyecto no encontrado</div>;

  // Edit modal rendered via Portal to escape overflow containers
  const editModal = isEditModalOpen ? createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div 
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-black/5 flex justify-between items-center">
          <h3 className="text-xl font-medium text-[#1A1A1A]">Editar Proyecto</h3>
          <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <X size={20} className="text-[#1A1A1A]" />
          </button>
        </div>

        <form onSubmit={handleUpdateProject} className="p-8 overflow-y-auto max-h-[80vh] flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2 col-span-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Nombre del Proyecto</label>
              <input 
                required 
                type="text" 
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="w-full h-12 rounded-2xl border border-black/10 bg-white text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" 
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Cliente</label>
              <select 
                required 
                value={editFormData.client}
                onChange={(e) => setEditFormData({ ...editFormData, client: e.target.value })}
                className="w-full h-12 rounded-2xl border border-black/10 bg-white text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all"
              >
                <option value="">Seleccionar...</option>
                {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Estado</label>
              <select 
                required 
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                className="w-full h-12 rounded-2xl border border-black/10 bg-white text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all"
              >
                <option value="En Progreso">En Progreso</option>
                <option value="Completado">Completado</option>
                <option value="En Riesgo">En Riesgo</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Presupuesto ($)</label>
              <input 
                required 
                type="number" 
                value={editFormData.budget}
                onChange={(e) => setEditFormData({ ...editFormData, budget: e.target.value })}
                className="w-full h-12 rounded-2xl border border-black/10 bg-white text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" 
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Fecha Entrega</label>
              <input 
                type="date" 
                value={editFormData.due_date}
                onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
                className="w-full h-12 rounded-2xl border border-black/10 bg-white text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" 
              />
            </div>

            <div className="flex flex-col gap-2 col-span-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-[#1A1A1A]">Progreso</label>
                <span className="text-sm font-bold text-[#1A1A1A]">{editFormData.progress}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={editFormData.progress}
                onChange={(e) => setEditFormData({ ...editFormData, progress: parseInt(e.target.value) })}
                className="w-full accent-[#222222]" 
              />
            </div>

            <div className="flex flex-col gap-2 col-span-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Descripción</label>
              <textarea 
                rows={4} 
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className="w-full rounded-2xl border border-black/10 bg-white text-[#1A1A1A] p-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none resize-none transition-all"
              ></textarea>
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
              disabled={savingProject}
              className="flex items-center gap-2 bg-[#222222] hover:bg-black disabled:opacity-50 text-white px-8 py-3 rounded-full text-sm font-medium transition-colors shadow-lg"
            >
              <Save size={18} />
              {savingProject ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  ) : null;

  // Team modal rendered via Portal
  const teamModal = isTeamModalOpen ? createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div 
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-md flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-black/5 flex justify-between items-center">
          <h3 className="text-xl font-medium text-[#1A1A1A]">Gestionar Equipo</h3>
          <button onClick={() => setIsTeamModalOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <X size={20} className="text-[#1A1A1A]" />
          </button>
        </div>

        <div className="p-6 max-h-[400px] overflow-y-auto">
          <div className="flex flex-col gap-4">
            {allTeam.length === 0 ? (
              <p className="text-center text-sm text-[#666666] py-4">No hay miembros registrados.</p>
            ) : (
              allTeam.map((member) => {
                const isAssigned = assignedTeam.some(m => m.id === member.id);
                return (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-black/5 transition-all">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: member.avatar_color }}
                      >
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">{member.name}</p>
                        <p className="text-xs text-[#666666]">{member.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleMember(member.id)}
                      disabled={savingTeam}
                      className={`p-2 rounded-xl transition-all ${
                        isAssigned 
                          ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' 
                          : 'text-green-600 bg-green-50 hover:bg-green-100'
                      }`}
                    >
                      {isAssigned ? <Trash2 size={18} /> : <Plus size={18} />}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="p-6 border-t border-black/5 flex justify-end">
          <button 
            onClick={() => setIsTeamModalOpen(false)}
            className="bg-[#222222] hover:bg-black text-white px-8 py-3 rounded-full text-sm font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/projects" className="p-3 bg-white/50 hover:bg-white/80 rounded-full transition-colors border border-black/5 shadow-sm">
            <ArrowLeft size={20} className="text-[#1A1A1A]" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-[42px] font-normal tracking-tight text-[#1A1A1A]">{project.name}</h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                project.status === 'En Progreso' ? 'bg-[#FFD166]/20 text-[#1A1A1A] border-[#FFD166]/50' :
                project.status === 'Completado' ? 'bg-green-500/10 text-green-700 border-green-500/20' :
                'bg-red-500/10 text-red-700 border-red-500/20'
              }`}>
                {project.status}
              </span>
            </div>
            <p className="text-[#666666]">{project.client}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#222222] hover:bg-black text-white px-6 py-3 rounded-full text-sm font-medium transition-colors shadow-sm"
          >
            <EditIcon size={16} />
            Editar Detalles
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8 flex flex-col gap-6">
            <h4 className="text-xl font-medium text-[#1A1A1A]">Progreso General</h4>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm text-[#666666]">
                <span>Completado</span>
                <span className="font-medium text-[#1A1A1A]">{project.progress}%</span>
              </div>
              <div className="w-full bg-black/5 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${project.status === 'En Riesgo' ? 'bg-red-400' : project.status === 'Completado' ? 'bg-green-400' : 'bg-[#FFD166]'}`}
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-black/5">
              <div>
                <p className="text-xs text-[#666666] mb-1">Fecha de Inicio</p>
                <p className="font-medium text-[#1A1A1A]">{new Date(project.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-[#666666] mb-1">Fecha de Entrega</p>
                <p className="font-medium text-[#1A1A1A]">{project.due_date || 'No definida'}</p>
              </div>
              <div>
                <p className="text-xs text-[#666666] mb-1">Presupuesto</p>
                <p className="font-medium text-[#1A1A1A]">${(project.budget || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-[#666666] mb-1">ID Proyecto</p>
                <p className="font-medium text-[#1A1A1A]">PROJ-{project.id.substring(0,4).toUpperCase()}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-black/5">
              <h4 className="text-sm font-medium text-[#1A1A1A] mb-2">Descripción</h4>
              <p className="text-sm text-[#666666] leading-relaxed whitespace-pre-wrap">
                {project.description || 'Sin descripción disponible.'}
              </p>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-medium text-[#1A1A1A]">Tareas Recientes</h4>
              <Link to="/kanban" className="text-sm font-medium text-[#1A1A1A] hover:underline">Ver Tablero</Link>
            </div>
            
            <div className="p-10 text-center text-[#666666] italic bg-black/5 rounded-2xl border border-dashed border-black/10">
              Usa el tablero Kanban para asignar y gestionar tareas de este proyecto.
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-[#222222] text-white rounded-[32px] p-8 shadow-xl flex flex-col gap-6">
            <h4 className="text-xl font-medium">Resumen Financiero</h4>
            
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/70">Presupuesto Proyectado</span>
                  <span className="font-medium">${(project.budget || 0).toLocaleString()}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-[#FFD166] h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8 flex flex-col gap-6">
            <h4 className="text-xl font-medium text-[#1A1A1A]">Equipo Asignado</h4>
            <div className="flex flex-col gap-4">
              {assignedTeam.length === 0 ? (
                <div className="p-4 bg-black/5 rounded-2xl text-center text-xs text-[#666666] italic">
                  No hay miembros asignados todavía.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {assignedTeam.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: member.avatar_color }}
                      >
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">{member.name}</p>
                        <p className="text-xs text-[#666666]">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={() => setIsTeamModalOpen(true)}
              className="w-full py-3 border border-dashed border-black/10 rounded-2xl text-sm font-medium text-[#666666] hover:text-[#1A1A1A] hover:border-black/20 hover:bg-white/40 transition-all"
            >
              Gestionar Equipo
            </button>
          </div>
        </div>
      </div>

      {editModal}
      {teamModal}
    </div>
  );
}

const EditIcon = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
