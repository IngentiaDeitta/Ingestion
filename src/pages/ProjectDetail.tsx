import { ArrowLeft, X, Plus, Trash2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { analyzeProjectWithGemini, ProjectAnalysisResult } from '../lib/gemini-project-analyst';
import { Sparkles, Loader2, Target, AlertTriangle, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EditProjectModal from '../components/EditProjectModal';

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
  outcome?: string;
  project_analysis?: ProjectAnalysisResult;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar_color: string;
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [allTeam, setAllTeam] = useState<TeamMember[]>([]);
  const [assignedTeam, setAssignedTeam] = useState<TeamMember[]>([]);
  const [savingTeam, setSavingTeam] = useState(false);
  const [clientAnalysis, setClientAnalysis] = useState<any>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [billedAmount, setBilledAmount] = useState(0);
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [taskGrouping, setTaskGrouping] = useState<'status' | 'priority'>('status');

  // AI Analyst State
  const [isAnalystModalOpen, setIsAnalystModalOpen] = useState(false);
  const [notebookContext, setNotebookContext] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProjectData();
    }
  }, [id]);

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

      // Fetch client analysis to use as context for project analysis
      if (projectData.client) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('id, client_analysis')
          .eq('name', projectData.client)
          .single();
        if (clientData) {
          setClientId(clientData.id);
          setClientAnalysis(clientData.client_analysis);
        }
      }
      
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

      // Fetch financial summary (billed amount)
      const { data: billedData } = await supabase
        .from('finances')
        .select('amount')
        .eq('project_id', id)
        .eq('type', 'income');
      
      const totalBilled = billedData?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
      setBilledAmount(totalBilled);

      // Fetch related Kanban tasks
      if (projectData.name) {
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*')
          .eq('project', projectData.name)
          .order('created_at', { ascending: false });
        setProjectTasks(tasksData || []);
      }

    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
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

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !notebookContext.trim() || !project) return;

    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      
      const aiResult = await analyzeProjectWithGemini(
        project.name,
        project.description,
        clientAnalysis || {},
        notebookContext
      );
      
      const { error } = await supabase
        .from('projects')
        .update({ project_analysis: aiResult })
        .eq('id', id);

      if (error) throw error;

      await fetchProjectData();
      setIsAnalystModalOpen(false);
      setNotebookContext('');
    } catch (error: any) {
      console.error('Error running AI project analysis:', error);
      setAnalysisError(error.message || 'Error al ejecutar el análisis. Por favor intentá de nuevo.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) return <div className="p-20 text-center text-[#666666]">Cargando proyecto...</div>;
  if (!project) return <div className="p-20 text-center text-[#666666]">Proyecto no encontrado</div>;

  const editModal = isEditModalOpen && project ? (
    <EditProjectModal 
      project={project} 
      onClose={() => setIsEditModalOpen(false)} 
      onSuccess={fetchProjectData} 
    />
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
    <div className="flex-1 flex flex-col gap-8 w-full max-w-[1400px] mx-auto">
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
            {clientId ? (
              <Link to={`/clients/${clientId}`} className="text-[#666666] hover:text-[#FFB020] transition-colors hover:underline inline-flex items-center gap-1">
                {project.client}
              </Link>
            ) : (
              <p className="text-[#666666]">{project.client}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAnalystModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#FFD166] hover:bg-[#FFC033] text-[#1A1A1A] px-6 py-3 rounded-full text-sm font-medium transition-colors shadow-sm"
          >
            <Sparkles size={16} />
            Análisis IA
          </button>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#222222] hover:bg-black text-white px-6 py-3 rounded-full text-sm font-medium transition-colors shadow-sm"
          >
            <EditIcon size={16} />
            Editar Detalles
          </button>
          {project.project_analysis && (
            <button 
              onClick={() => navigate(`/smart-quoter?projectId=${project.id}`)}
              className="flex items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-black text-white px-6 py-3 rounded-full text-sm font-medium transition-colors shadow-lg border border-white/10"
            >
              <Calculator size={16} className="text-[#FFD166]" />
              Cotizar con IA
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8 flex flex-col gap-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h4 className="text-xl font-medium text-[#1A1A1A]">Tareas del Proyecto</h4>
                <div className="flex bg-black/5 p-1 rounded-full border border-black/5">
                  <button 
                    onClick={() => setTaskGrouping('status')}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${taskGrouping === 'status' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#666666] hover:text-[#1A1A1A]'}`}
                  >
                    POR ESTADO
                  </button>
                  <button 
                    onClick={() => setTaskGrouping('priority')}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${taskGrouping === 'priority' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#666666] hover:text-[#1A1A1A]'}`}
                  >
                    POR PRIORIDAD
                  </button>
                </div>
              </div>
              <Link to="/kanban" className="text-sm font-medium text-[#FFB020] hover:underline flex items-center gap-1">
                Ver Tablero <ArrowLeft size={14} className="rotate-180" />
              </Link>
            </div>

            {/* Quick Stats / Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Totales', val: projectTasks.length, color: 'bg-black/5 text-[#1A1A1A]' },
                { label: 'Pendientes', val: projectTasks.filter(t => t.status === 'todo').length, color: 'bg-black/5 text-[#666666]' },
                { label: 'En Curso', val: projectTasks.filter(t => t.status === 'in-progress' || t.status === 'review').length, color: 'bg-[#FFD166]/20 text-[#1A1A1A]' },
                { label: 'Completadas', val: projectTasks.filter(t => t.status === 'done').length, color: 'bg-green-500/10 text-green-700' },
              ].map((stat, i) => (
                <div key={i} className={`p-4 rounded-2xl ${stat.color} border border-black/5 flex flex-col gap-1`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">{stat.label}</span>
                  <span className="text-2xl font-medium">{stat.val}</span>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col gap-6">
              {projectTasks.length === 0 ? (
                <div className="p-10 text-center text-[#666666] italic bg-black/5 rounded-2xl border border-dashed border-black/10">
                  Usa el tablero Kanban para asignar y gestionar tareas de este proyecto.
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  {/* Grouped Content */}
                  {(taskGrouping === 'status' ? ['todo', 'in-progress', 'review', 'done'] : ['Alta', 'Media', 'Baja']).map((group) => {
                    const filteredTasks = projectTasks.filter(t => (taskGrouping === 'status' ? t.status : t.priority) === group);
                    if (filteredTasks.length === 0) return null;

                    return (
                      <div key={group} className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 px-2">
                          <div className={`w-1.5 h-6 rounded-full ${
                            taskGrouping === 'status' ? (
                              group === 'done' ? 'bg-green-400' :
                              group === 'in-progress' ? 'bg-[#FFD166]' :
                              group === 'review' ? 'bg-blue-400' : 'bg-black/10'
                            ) : (
                              group === 'Alta' ? 'bg-red-400' :
                              group === 'Media' ? 'bg-[#FFD166]' : 'bg-blue-400'
                            )
                          }`} />
                          <h5 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-widest flex items-center gap-2">
                            {taskGrouping === 'status' ? (
                              group === 'todo' ? 'Por Hacer' :
                              group === 'in-progress' ? 'En Progreso' :
                              group === 'review' ? 'En Revisión' : 'Completado'
                            ) : group}
                            <span className="text-[#999] font-normal">({filteredTasks.length})</span>
                          </h5>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {filteredTasks.map((task) => {
                            const isExpanded = expandedTasks.includes(task.id);
                            return (
                              <div 
                                key={task.id} 
                                className={`flex flex-col bg-white/40 rounded-3xl border border-black/5 hover:bg-white/60 transition-all overflow-hidden ${isExpanded ? 'ring-2 ring-[#FFD166]/30 bg-white/80' : ''}`}
                              >
                                <div 
                                  className="flex items-center justify-between p-4 cursor-pointer"
                                  onClick={() => setExpandedTasks(prev => isExpanded ? prev.filter(id => id !== task.id) : [...prev, task.id])}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${
                                      task.status === 'done' ? 'bg-green-400' :
                                      task.status === 'in-progress' ? 'bg-[#FFD166]' :
                                      task.status === 'review' ? 'bg-blue-400' : 'bg-black/20'
                                    }`} />
                                    <div>
                                      <p className="text-sm font-medium text-[#1A1A1A]">{task.title}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[10px] font-bold uppercase ${
                                          task.priority === 'Alta' ? 'text-red-500' : 
                                          task.priority === 'Media' ? 'text-[#FFB020]' : 'text-blue-500'
                                        }`}>
                                          {task.priority}
                                        </span>
                                        {task.due_date && (
                                          <>
                                            <span className="text-[10px] text-black/20">•</span>
                                            <span className="text-[10px] text-[#666666]">Vence: {new Date(task.due_date).toLocaleDateString()}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="flex -space-x-1.5">
                                      {(task.assignees || []).slice(0, 3).map((name: string, i: number) => (
                                        <div 
                                          key={i} 
                                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white text-white bg-[#222222]"
                                          title={name}
                                        >
                                          {name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                      ))}
                                    </div>
                                    <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                      <ArrowLeft size={16} className="-rotate-90 text-[#999]" />
                                    </div>
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="px-10 pb-6 pt-2 border-t border-black/5 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex flex-col gap-4">
                                      {task.description ? (
                                        <div className="bg-black/5 p-4 rounded-2xl">
                                          <p className="text-xs text-[#666666] leading-relaxed italic">{task.description}</p>
                                        </div>
                                      ) : (
                                        <p className="text-xs text-[#999] italic">Sin descripción detallada.</p>
                                      )}
                                      
                                      <div className="flex items-center gap-6">
                                        <div className="flex flex-col gap-1">
                                          <span className="text-[9px] font-bold text-[#999] uppercase tracking-wider">Horas Est.</span>
                                          <span className="text-xs font-medium text-[#1A1A1A]">{task.hours || 0}h</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-[9px] font-bold text-[#999] uppercase tracking-wider">Creada</span>
                                          <span className="text-xs font-medium text-[#1A1A1A]">{new Date(task.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-[9px] font-bold text-[#999] uppercase tracking-wider">ID</span>
                                          <span className="text-[10px] font-mono text-[#999]">{task.id.substring(0,8)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="pt-6 border-t border-black/5 flex flex-wrap gap-6 items-center justify-center bg-black/2 p-4 rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-[10px] font-bold text-[#666666] uppercase">Completado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#FFD166]" />
                <span className="text-[10px] font-bold text-[#666666] uppercase">En Progreso</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-[10px] font-bold text-[#666666] uppercase">Revisión / Media</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-[10px] font-bold text-[#666666] uppercase">Alta Prioridad</span>
              </div>
            </div>
          </div>

          {/* AI Analysis Result Card */}
          {project.project_analysis && (
            <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] rounded-[32px] border border-white/10 shadow-lg p-8 flex flex-col gap-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Sparkles size={120} />
              </div>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#FFD166]/20 rounded-xl text-[#FFD166]">
                    <Sparkles size={20} />
                  </div>
                  <h4 className="text-xl font-medium">Análisis del Proyecto (AI)</h4>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-white/90 border border-white/5 uppercase">
                    {project.project_analysis.classification}
                  </span>
                  <span className="px-3 py-1 bg-[#FFD166]/20 text-[#FFD166] rounded-full text-xs font-medium border border-[#FFD166]/20 uppercase">
                    Complejidad {project.project_analysis.complexity}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col gap-6 relative z-10 mt-2">
                <div>
                  <h5 className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5">Resumen de Análisis</h5>
                  <p className="text-sm text-white/90 leading-relaxed">{project.project_analysis.project_summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-red-500/10 p-5 rounded-2xl border border-red-500/20">
                    <div className="flex items-center gap-2 mb-2 text-red-400">
                      <AlertTriangle size={16} />
                      <h5 className="text-[10px] font-bold uppercase tracking-wider">Problema Principal</h5>
                    </div>
                    <p className="text-sm text-white/90">{project.project_analysis.problem}</p>
                  </div>
                  <div className="bg-blue-500/10 p-5 rounded-2xl border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2 text-blue-400">
                      <Target size={16} />
                      <h5 className="text-[10px] font-bold uppercase tracking-wider">Impacto en el Negocio</h5>
                    </div>
                    <p className="text-sm text-white/90">{project.project_analysis.impact}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#FFD166] uppercase tracking-wider">Áreas Afectadas</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {project.project_analysis.areas.map((area, idx) => (
                        <span key={idx} className="text-xs font-medium bg-black/30 px-2 py-1 rounded-md text-white/80">{area}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-[10px] font-bold text-[#FFD166] uppercase tracking-wider">Urgencia</span>
                    <span className={`text-sm font-bold ${
                      project.project_analysis.urgency === 'ALTA' ? 'text-red-400' :
                      project.project_analysis.urgency === 'MEDIA' ? 'text-yellow-400' : 'text-green-400'
                    }`}>{project.project_analysis.urgency}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-[#222222] text-white rounded-[32px] p-8 shadow-xl flex flex-col gap-6">
            <h4 className="text-xl font-medium">Resumen Financiero</h4>
            
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex justify-between text-xs mb-2 text-white/50 uppercase tracking-wider">
                  <span>Progreso de Facturación</span>
                  <span className="font-bold text-[#FFD166]">{Math.round((billedAmount / (project.budget || 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-[#FFD166] h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (billedAmount / (project.budget || 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex justify-between items-end p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase mb-1">Presupuesto Total</p>
                    <p className="text-lg font-medium">${(project.budget || 0).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-end p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase mb-1">Total Facturado</p>
                    <p className="text-lg font-medium text-green-400">${billedAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex justify-between items-end p-4 bg-[#FFD166]/10 rounded-2xl border border-[#FFD166]/20">
                  <div>
                    <p className="text-[10px] font-bold text-[#FFD166]/60 uppercase mb-1">Saldo Pendiente</p>
                    <p className={`text-xl font-bold ${((project.budget || 0) - billedAmount) < 0 ? 'text-red-400' : 'text-[#FFD166]'}`}>
                      ${((project.budget || 0) - billedAmount).toLocaleString()}
                    </p>
                  </div>
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

      {/* AI Analyst Modal */}
      {isAnalystModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div 
            className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-gradient-to-r from-[#FFD166]/20 to-transparent rounded-t-[32px]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FFD166] rounded-xl text-[#1A1A1A]">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-[#1A1A1A]">AI Project Analyst</h3>
                  <p className="text-xs text-[#666666]">Evaluar problema e impacto con NotebookLM</p>
                </div>
              </div>
              <button onClick={() => setIsAnalystModalOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <X size={20} className="text-[#1A1A1A]" />
              </button>
            </div>

            <form onSubmit={handleRunAnalysis} className="p-8 flex flex-col gap-6">
              {analysisError && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">
                  {analysisError}
                </div>
              )}
              
              {!clientAnalysis && (
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-2xl text-sm border border-yellow-200">
                  <strong>Nota:</strong> No se encontró un perfil estratégico de IA para el cliente. Es recomendable realizar el "AI Client Analyst" primero para que el modelo tenga más contexto, aunque puedes continuar de todos modos.
                </div>
              )}

              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-[#1A1A1A] flex justify-between items-center">
                  <span>Contexto del Proyecto (NotebookLM)</span>
                  <span className="text-[10px] bg-black/5 px-2 py-1 rounded-md text-[#666666] font-mono">Pega el texto aquí</span>
                </label>
                <textarea 
                  required 
                  value={notebookContext}
                  onChange={(e) => setNotebookContext(e.target.value)}
                  placeholder="Pegá aquí el resumen de NotebookLM referente al proyecto específico, sus problemas, requerimientos y contexto de negocio..."
                  className="w-full h-64 rounded-2xl border border-black/10 bg-[#FAFAFA] text-[#1A1A1A] p-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all resize-none text-sm"
                />
              </div>

              <div className="flex justify-end gap-4 mt-2">
                <button 
                  type="button"
                  onClick={() => setIsAnalystModalOpen(false)}
                  className="px-6 py-3 rounded-full text-sm font-medium text-[#666666] hover:bg-black/5 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isAnalyzing || !notebookContext.trim()}
                  className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-full text-sm font-medium transition-colors shadow-lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Ejecutar Análisis
                    </>
                  )}
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
