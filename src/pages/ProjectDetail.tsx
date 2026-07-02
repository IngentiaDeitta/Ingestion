import { ArrowLeft, X, Plus, Trash2, FileText, CheckCircle, Calendar, DollarSign, Edit3, Upload, ChevronRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useState, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { analyzeProjectWithGemini, ProjectAnalysisResult } from '../lib/gemini-project-analyst';
import { extractMilestonesWithGemini } from '../lib/gemini-milestones-extractor';
import { Sparkles, Loader2, Target, AlertTriangle, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EditProjectModal from '../components/EditProjectModal';

export interface ProjectMilestone {
  id: string;
  title: string;
  description: string;
  type: 'delivery' | 'billing' | 'both';
  estimated_date: string;
  real_date: string | null;
  completed: boolean;
  amount: number | null;
  billing_confirmed: boolean;
  finance_id?: string | null;
}

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
  project_analysis?: any;
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
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  const [agentSteps, setAgentSteps] = useState<{ type: string; text: string }[]>([]);
  const [agentDone, setAgentDone] = useState(false);
  const [agentFailed, setAgentFailed] = useState(false);

  // Hitos (Milestones) State
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewMilestones, setPreviewMilestones] = useState<ProjectMilestone[]>([]);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Partial<ProjectMilestone> | null>(null);
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({});

  const toggleMilestoneExpanded = (id: string) => {
    setExpandedMilestones(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
      setMilestones(projectData.project_analysis?.milestones || []);

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
        
        const tasks = tasksData || [];
        setProjectTasks(tasks);

        // Auto-calculate progress based on milestones
        const currentMilestones = projectData.project_analysis?.milestones || [];
        if (currentMilestones.length > 0) {
          const completed = currentMilestones.filter((m: any) => m.completed).length;
          const calculatedProgress = Math.round((completed / currentMilestones.length) * 100);
          
          if (calculatedProgress !== projectData.progress) {
            setProject(prev => prev ? { ...prev, progress: calculatedProgress } : null);
            await supabase.from('projects').update({ progress: calculatedProgress }).eq('id', id);
          }
        } else if (projectData.progress !== 0) {
          setProject(prev => prev ? { ...prev, progress: 0 } : null);
          await supabase.from('projects').update({ progress: 0 }).eq('id', id);
        }
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

  const handleRunAgentAnalysis = async () => {
    if (!id || !project) return;

    setAgentSteps([]);
    setAgentDone(false);
    setAgentFailed(false);
    setIsAgentRunning(true);
    setShowAgentPanel(true);

    try {
      const res = await fetch('http://localhost:3001/api/run-project-agent/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id })
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

  // ── Gestión de Hitos (Milestones) ──────────────────────────────────────────

  const saveMilestones = async (newMilestones: ProjectMilestone[]) => {
    if (!project) return;

    // Calcular progreso
    const total = newMilestones.length;
    const completed = newMilestones.filter(m => m.completed).length;
    const calculatedProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

    const updatedAnalysis = {
      ...project.project_analysis,
      milestones: newMilestones
    };

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          project_analysis: updatedAnalysis,
          progress: calculatedProgress
        })
        .eq('id', project.id);

      if (error) throw error;

      setProject(prev => prev ? {
        ...prev,
        project_analysis: updatedAnalysis,
        progress: calculatedProgress
      } : null);
      setMilestones(newMilestones);
    } catch (err: any) {
      console.error('Error saving milestones:', err);
      alert('Error al guardar los hitos: ' + err.message);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        try {
          const extracted = await extractMilestonesWithGemini(base64);
          if (extracted && extracted.length > 0) {
            setPreviewMilestones(extracted.map(m => ({
              id: crypto.randomUUID(),
              title: m.title,
              description: m.description,
              type: m.type,
              estimated_date: m.estimated_date,
              real_date: null,
              completed: false,
              amount: m.amount,
              billing_confirmed: false
            })));
            setIsPreviewModalOpen(true);
          } else {
            alert('Gemini no pudo detectar hitos estructurados en el archivo PDF.');
          }
        } catch (err: any) {
          alert('Error al extraer hitos con Gemini: ' + err.message);
        } finally {
          setUploadingPdf(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploadingPdf(false);
    }
  };

  const handleConfirmImport = async (replaceExisting: boolean) => {
    if (!project) return;
    const newMilestones = replaceExisting
      ? previewMilestones
      : [...milestones, ...previewMilestones];
    await saveMilestones(newMilestones);
    setIsPreviewModalOpen(false);
    setPreviewMilestones([]);
  };

  const handleToggleCompleted = async (milestone: ProjectMilestone) => {
    const linkedTasks = projectTasks.filter(t => t.tags && Array.isArray(t.tags) && t.tags.includes(`milestone:${milestone.id}`));
    const pendingTasks = linkedTasks.filter(t => t.status !== 'done');

    if (!milestone.completed && pendingTasks.length > 0) {
      alert(`No se puede completar el hito. Hay ${pendingTasks.length} tarea(s) vinculada(s) que aún no están finalizadas.`);
      return;
    }

    const nextCompleted = !milestone.completed;
    let realDate = milestone.real_date;

    if (nextCompleted && !realDate) {
      realDate = new Date().toISOString().split('T')[0];
    } else if (!nextCompleted) {
      realDate = null;
    }

    const updatedMilestones = milestones.map(m =>
      m.id === milestone.id
        ? { ...m, completed: nextCompleted, real_date: realDate }
        : m
    );
    await saveMilestones(updatedMilestones);
  };

  const handleUpdateRealDate = async (milestoneId: string, date: string | null) => {
    const milestone = milestones.find(m => m.id === milestoneId);
    if (milestone && milestone.finance_id && date) {
      try {
        await supabase.from('finances').update({ date }).eq('id', milestone.finance_id);
      } catch (err) {
        console.error('Error updating finance date:', err);
      }
    }

    const updatedMilestones = milestones.map(m =>
      m.id === milestoneId
        ? { ...m, real_date: date }
        : m
    );
    await saveMilestones(updatedMilestones);
  };

  const handleConfirmPayment = async (milestone: ProjectMilestone) => {
    if (!project || !clientId) return;
    try {
      if (milestone.billing_confirmed) {
        // Desconfirmar cobro: eliminar la transacción de finances si existe
        if (milestone.finance_id) {
          const { error } = await supabase
            .from('finances')
            .delete()
            .eq('id', milestone.finance_id);
          if (error) throw error;
        }

        const updatedMilestones = milestones.map(m =>
          m.id === milestone.id
            ? { ...m, billing_confirmed: false, finance_id: null }
            : m
        );
        await saveMilestones(updatedMilestones);
      } else {
        // Confirmar cobro: crear transacción en finances
        const amountToCharge = milestone.amount || 0;
        if (amountToCharge <= 0) {
          alert('El hito de cobro debe tener un monto válido en USD.');
          return;
        }

        const payload = {
          description: `Cobro Hito: ${milestone.title}`,
          amount: amountToCharge,
          type: 'income',
          status: 'Paid',
          date: milestone.real_date || new Date().toISOString().split('T')[0],
          currency: 'USD',
          client_id: clientId,
          project_id: project.id,
          category: 'Servicios',
          items: [{ id: 1, description: milestone.title, quantity: 1, price: amountToCharge }]
        };

        const { data, error } = await supabase
          .from('finances')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;

        const updatedMilestones = milestones.map(m =>
          m.id === milestone.id
            ? { ...m, billing_confirmed: true, finance_id: data.id }
            : m
        );
        await saveMilestones(updatedMilestones);
      }
      // Refrescar datos del proyecto y finanzas
      fetchProjectData();
    } catch (err: any) {
      console.error(err);
      alert('Error al gestionar el cobro: ' + err.message);
    }
  };

  const handleSaveMilestoneManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !editingMilestone || !editingMilestone.title) return;

    let updatedList: ProjectMilestone[] = [];
    if (editingMilestone.id) {
      // Modo edición
      const oldMilestone = milestones.find(m => m.id === editingMilestone.id);
      if (oldMilestone && oldMilestone.finance_id) {
        try {
          const updates: any = {};
          if (editingMilestone.real_date && editingMilestone.real_date !== oldMilestone.real_date) {
            updates.date = editingMilestone.real_date;
          }
          if (editingMilestone.amount && Number(editingMilestone.amount) !== oldMilestone.amount) {
            updates.amount = Number(editingMilestone.amount);
            // Also update the items array if amount changes
            updates.items = [{ id: 1, description: editingMilestone.title, quantity: 1, price: Number(editingMilestone.amount) }];
          }
          if (Object.keys(updates).length > 0) {
            await supabase.from('finances').update(updates).eq('id', oldMilestone.finance_id);
          }
        } catch (err) {
          console.error('Error updating finance record:', err);
        }
      }
      updatedList = milestones.map(m => m.id === editingMilestone.id ? (editingMilestone as ProjectMilestone) : m);
    } else {
      // Modo creación
      const newM: ProjectMilestone = {
        id: crypto.randomUUID(),
        title: editingMilestone.title,
        description: editingMilestone.description || '',
        type: editingMilestone.type || 'delivery',
        estimated_date: editingMilestone.estimated_date || new Date().toISOString().split('T')[0],
        real_date: editingMilestone.real_date || null,
        completed: editingMilestone.completed || false,
        amount: editingMilestone.amount ? Number(editingMilestone.amount) : null,
        billing_confirmed: editingMilestone.billing_confirmed || false
      };
      updatedList = [...milestones, newM];
    }

    await saveMilestones(updatedList);
    setIsMilestoneModalOpen(false);
    setEditingMilestone(null);
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este hito?')) return;

    const milestone = milestones.find(m => m.id === id);
    if (milestone && milestone.finance_id) {
      try {
        await supabase
          .from('finances')
          .delete()
          .eq('id', milestone.finance_id);
      } catch (err) {
          console.error('Error deleting related finance transaction:', err);
      }
    }

    const updatedList = milestones.filter(m => m.id !== id);
    await saveMilestones(updatedList);
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

  const previewImportModal = isPreviewModalOpen ? createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-black/5 flex justify-between items-center bg-[#FFD166]/10">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#FFB020]" />
            <h3 className="text-xl font-medium text-[#1A1A1A]">Hitos Detectados por AI</h3>
          </div>
          <button onClick={() => setIsPreviewModalOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <X size={20} className="text-[#1A1A1A]" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-sm text-[#666666] mb-4">
            Gemini ha analizado el documento y ha detectado los siguientes hitos. Por favor, revísalos antes de importarlos al proyecto.
          </p>
          <div className="border border-black/5 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-black/2 border-b border-black/5 text-[#666666] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Título</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Fecha Estimada</th>
                  <th className="py-2.5 px-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {previewMilestones.map((m, idx) => (
                  <tr key={idx} className="border-b border-black/5">
                    <td className="py-3 px-3">
                      <p className="font-semibold text-[#1A1A1A]">{m.title}</p>
                      <p className="text-[#666666] mt-0.5 line-clamp-1">{m.description}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        m.type === 'delivery' ? 'bg-blue-100 text-blue-800' :
                        m.type === 'billing' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {m.type === 'delivery' ? 'Entregable' : m.type === 'billing' ? 'Pago' : 'Mixto'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#1A1A1A]">
                      {new Date(m.estimated_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-semibold text-right text-[#1A1A1A]">
                      {m.amount ? `$${m.amount.toLocaleString()} USD` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-6 border-t border-black/5 flex flex-col sm:flex-row justify-between gap-4 bg-black/2">
          <div className="flex gap-2">
            <button
              onClick={() => handleConfirmImport(false)}
              className="bg-white hover:bg-black/5 text-[#1A1A1A] border border-black/10 px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm"
            >
              Combinar con Existentes
            </button>
            <button
              onClick={() => handleConfirmImport(true)}
              className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm"
            >
              Sobrescribir Existentes
            </button>
          </div>
          <button
            onClick={() => setIsPreviewModalOpen(false)}
            className="bg-[#222222] hover:bg-black text-white px-6 py-2.5 rounded-full text-xs font-bold transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  const milestoneManualModal = isMilestoneModalOpen && editingMilestone ? createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <form
        onSubmit={handleSaveMilestoneManual}
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-black/5 flex justify-between items-center bg-[#FFD166]/10">
          <h3 className="text-xl font-medium text-[#1A1A1A]">
            {editingMilestone.id ? 'Editar Hito' : 'Nuevo Hito'}
          </h3>
          <button 
            type="button" 
            onClick={() => setIsMilestoneModalOpen(false)} 
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
          >
            <X size={20} className="text-[#1A1A1A]" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">Título del Hito</label>
            <input
              type="text"
              required
              value={editingMilestone.title || ''}
              onChange={(e) => setEditingMilestone({ ...editingMilestone, title: e.target.value })}
              className="bg-black/2 border border-black/10 rounded-2xl px-4 py-3 outline-none focus:border-[#FFD166] text-sm text-[#1A1A1A]"
              placeholder="Ej: Entrega de Prototipo o Anticipo 30%"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">Descripción</label>
            <textarea
              value={editingMilestone.description || ''}
              onChange={(e) => setEditingMilestone({ ...editingMilestone, description: e.target.value })}
              className="bg-black/2 border border-black/10 rounded-2xl px-4 py-3 outline-none focus:border-[#FFD166] text-sm text-[#1A1A1A] h-20 resize-none"
              placeholder="Detalles sobre lo que se entrega o condiciones de cobro..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">Tipo de Hito</label>
              <select
                value={editingMilestone.type || 'delivery'}
                onChange={(e) => setEditingMilestone({ 
                  ...editingMilestone, 
                  type: e.target.value as any,
                  amount: e.target.value === 'delivery' ? null : editingMilestone.amount 
                })}
                className="bg-black/2 border border-black/10 rounded-2xl px-4 py-3 outline-none focus:border-[#FFD166] text-sm text-[#1A1A1A]"
              >
                <option value="delivery">Entregable (Técnico)</option>
                <option value="billing">Pago (Facturación)</option>
                <option value="both">Mixto (Entrega + Pago)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">Fecha Estimada</label>
              <input
                type="date"
                required
                value={editingMilestone.estimated_date || ''}
                onChange={(e) => setEditingMilestone({ ...editingMilestone, estimated_date: e.target.value })}
                className="bg-black/2 border border-black/10 rounded-2xl px-4 py-3 outline-none focus:border-[#FFD166] text-sm text-[#1A1A1A]"
              />
            </div>
          </div>

          {(editingMilestone.type === 'billing' || editingMilestone.type === 'both') && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">Monto del Cobro (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#666666] font-medium">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editingMilestone.amount || ''}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, amount: e.target.value ? Number(e.target.value) : null })}
                  className="w-full bg-black/2 border border-black/10 rounded-2xl pl-8 pr-4 py-3 outline-none focus:border-[#FFD166] text-sm text-[#1A1A1A] font-semibold"
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          {editingMilestone.id && (
            <div className="border-t border-black/5 pt-4 flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingMilestone.completed || false}
                  onChange={(e) => setEditingMilestone({ 
                    ...editingMilestone, 
                    completed: e.target.checked,
                    real_date: e.target.checked ? (editingMilestone.real_date || new Date().toISOString().split('T')[0]) : null
                  })}
                  className="w-4 h-4 rounded text-[#FFD166] focus:ring-[#FFD166] border-black/10"
                />
                <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">Hito Completado</span>
              </label>

              {editingMilestone.completed && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">Fecha Real de Finalización</label>
                  <input
                    type="date"
                    required
                    value={editingMilestone.real_date || ''}
                    onChange={(e) => setEditingMilestone({ ...editingMilestone, real_date: e.target.value })}
                    className="bg-black/2 border border-black/10 rounded-2xl px-4 py-3 outline-none focus:border-[#FFD166] text-sm text-[#1A1A1A]"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-black/5 flex justify-end gap-3 bg-black/2">
          <button
            type="button"
            onClick={() => setIsMilestoneModalOpen(false)}
            className="bg-white hover:bg-black/5 text-[#1A1A1A] border border-black/10 px-6 py-2.5 rounded-full text-xs font-bold transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-[#222222] hover:bg-black text-white px-8 py-2.5 rounded-full text-xs font-bold transition-all"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>,
    document.body
  ) : null;

  const unlinkedTasks = projectTasks.filter(t => !(t.tags && Array.isArray(t.tags) && t.tags.some((tag: string) => tag.startsWith('milestone:'))));

  const renderTaskItem = (task: any) => {
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
          <div className="px-4 md:px-10 pb-6 pt-2 border-t border-black/5 animate-in slide-in-from-top-2 duration-300">
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
  };

  return (
    <div className="flex-1 flex flex-col gap-8 w-full max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <Link to="/projects" className="p-3 bg-white/50 hover:bg-white/80 rounded-full transition-colors border border-black/5 shadow-sm shrink-0">
            <ArrowLeft size={20} className="text-[#1A1A1A]" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h3 className="text-3xl md:text-[42px] font-normal tracking-tight text-[#1A1A1A] break-words">{project.name}</h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                project.status === 'En Progreso' ? 'bg-[#FFD166]/20 text-[#1A1A1A] border-[#FFD166]/50' :
                project.status === 'Completado' ? 'bg-green-500/10 text-green-700 border-green-500/20' :
                project.status === 'Preventa' ? 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20' :
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
        <div className="flex flex-wrap sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <button 
            onClick={handleRunAgentAnalysis}
            disabled={isAgentRunning}
            className="flex items-center justify-center gap-2 bg-[#FFD166] hover:bg-[#FFC033] disabled:opacity-60 disabled:cursor-not-allowed text-[#1A1A1A] px-6 py-3 rounded-full text-sm font-medium transition-colors shadow-sm"
          >
            {isAgentRunning ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isAgentRunning ? 'Investigando...' : 'Análisis IA'}
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
                  className={`h-3 rounded-full ${project.status === 'En Riesgo' ? 'bg-red-400' : project.status === 'Completado' ? 'bg-green-400' : project.status === 'Preventa' ? 'bg-indigo-400' : 'bg-[#FFD166]'}`}
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
                      {project.project_analysis.areas.map((area: string, idx: number) => (
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

          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8 flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
              {unlinkedTasks.length === 0 ? (
                <div className="p-10 text-center text-[#666666] italic bg-black/5 rounded-2xl border border-dashed border-black/10">
                  Usa el tablero Kanban para asignar y gestionar tareas de este proyecto. (Tareas asociadas a hitos se muestran debajo).
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  {/* Grouped Content */}
                  {(taskGrouping === 'status' ? ['todo', 'in-progress', 'review', 'done'] : ['Alta', 'Media', 'Baja']).map((group) => {
                    const filteredTasks = unlinkedTasks.filter(t => (taskGrouping === 'status' ? t.status : t.priority) === group);
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
                          {filteredTasks.map(task => renderTaskItem(task))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            </div>

          {/* Plan de Hitos y Facturación */}
          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#FFD166]/20 rounded-xl text-[#FFB020]">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="text-xl font-medium text-[#1A1A1A]">Plan de Hitos y Cobros</h4>
                  <p className="text-xs text-[#666666] mt-0.5">Control de entregables, cobros por avance e importación inteligente de cronogramas.</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 w-full sm:w-auto flex-wrap">
                <label className="flex items-center justify-center gap-2 bg-[#FFD166] hover:bg-[#FFC033] text-[#1A1A1A] px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0">
                  {uploadingPdf ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      Cargar Cronograma (PDF)
                    </>
                  )}
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfUpload}
                    disabled={uploadingPdf}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => {
                    setEditingMilestone({
                      title: '',
                      description: '',
                      type: 'delivery',
                      estimated_date: new Date().toISOString().split('T')[0],
                      real_date: null,
                      completed: false,
                      amount: null,
                      billing_confirmed: false
                    });
                    setIsMilestoneModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 bg-[#222222] hover:bg-black text-white px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm shrink-0"
                >
                  <Plus size={14} />
                  Nuevo Hito
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-black/2 border border-black/5 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">Avance del Proyecto</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-medium text-[#1A1A1A]">
                    {milestones.length > 0 ? Math.round((milestones.filter(m => m.completed).length / milestones.length) * 100) : 0}%
                  </span>
                  <span className="text-xs text-[#666666]">
                    ({milestones.filter(m => m.completed).length}/{milestones.length} hitos)
                  </span>
                </div>
                <div className="w-full bg-black/5 rounded-full h-1.5 mt-1">
                  <div
                    className="h-1.5 rounded-full bg-[#FFD166]"
                    style={{ width: `${milestones.length > 0 ? (milestones.filter(m => m.completed).length / milestones.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/2 border border-black/5 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">Cobros por Avances</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-medium text-emerald-600">
                    ${milestones.filter(m => m.billing_confirmed).reduce((acc, m) => acc + (m.amount || 0), 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-[#666666]">
                    de ${(project.budget || 0).toLocaleString()} USD
                  </span>
                </div>
                <div className="w-full bg-black/5 rounded-full h-1.5 mt-1">
                  <div
                    className="h-1.5 rounded-full bg-emerald-500"
                    style={{
                      width: `${(project.budget || 0) > 0
                        ? (milestones.filter(m => m.billing_confirmed).reduce((acc, m) => acc + (m.amount || 0), 0) / (project.budget || 1)) * 100
                        : 0}%`
                    }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/2 border border-black/5 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">Próximo Vencimiento</span>
                {milestones.filter(m => !m.completed).length > 0 ? (
                  (() => {
                    const next = [...milestones]
                      .filter(m => !m.completed)
                      .sort((a, b) => new Date(a.estimated_date).getTime() - new Date(b.estimated_date).getTime())[0];
                    return (
                      <>
                        <span className="text-sm font-medium text-[#1A1A1A] truncate" title={next.title}>
                          {next.title}
                        </span>
                        <span className="text-xs text-[#666666] flex items-center gap-1 mt-0.5">
                          <Calendar size={12} />
                          Est: {new Date(next.estimated_date).toLocaleDateString()}
                        </span>
                      </>
                    );
                  })()
                ) : (
                  <span className="text-sm font-medium text-[#666666] italic">No hay hitos pendientes</span>
                )}
              </div>
            </div>

            {/* Milestones List */}
            {milestones.length === 0 ? (
              <div className="p-10 text-center text-[#666666] italic bg-black/2 rounded-2xl border border-dashed border-black/10 flex flex-col items-center gap-3">
                <FileText size={40} className="text-black/20" />
                <div>
                  <p className="font-medium text-sm text-[#1A1A1A]">No hay hitos cargados</p>
                  <p className="text-xs text-[#666666] mt-1">Carga un PDF del plan de trabajo o crea hitos manualmente.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black/5 text-[10px] font-bold text-[#666666] uppercase tracking-wider">
                      <th className="py-3 px-2 w-12 text-center">Estado</th>
                      <th className="py-3 px-3">Hito / Entregable</th>
                      <th className="py-3 px-3">Tipo</th>
                      <th className="py-3 px-3">Estimada</th>
                      <th className="py-3 px-3">Real</th>
                      <th className="py-3 px-3 text-right">Monto</th>
                      <th className="py-3 px-3 text-center">Cobro</th>
                      <th className="py-3 px-3 w-16 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...milestones]
                      .sort((a, b) => new Date(a.estimated_date).getTime() - new Date(b.estimated_date).getTime())
                      .map((m) => {
                        const hasAmount = m.amount && m.amount > 0;
                        const isBillingType = m.type === 'billing' || m.type === 'both';
                        const linkedTasks = projectTasks.filter(t => t.tags && Array.isArray(t.tags) && t.tags.includes(`milestone:${m.id}`));
                        const isExpanded = expandedMilestones[m.id];
                        return (
                          <Fragment key={m.id}>
                            <tr className="border-b border-black/5 hover:bg-black/2 transition-colors group">
                              <td className="py-4 px-2 text-center">
                                <button
                                  onClick={() => handleToggleCompleted(m)}
                                  className={`p-1 rounded-full transition-colors ${
                                    m.completed ? 'text-green-500' : 'text-black/10 hover:text-black/30'
                                  }`}
                                >
                                  <CheckCircle size={20} className={m.completed ? 'fill-green-500/10' : ''} />
                                </button>
                              </td>
                              <td className="py-4 px-3 max-w-[250px]">
                                <div className="flex items-center gap-2">
                                  {linkedTasks.length > 0 && (
                                    <button 
                                      onClick={() => toggleMilestoneExpanded(m.id)}
                                      className="p-1 hover:bg-black/5 rounded text-[#666666] transition-transform"
                                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                                    >
                                      <ChevronRight size={14} />
                                    </button>
                                  )}
                                  <div>
                                    <p className={`text-sm font-medium ${m.completed ? 'line-through text-[#999]' : 'text-[#1A1A1A]'}`}>
                                      {m.title}
                                    </p>
                                    {m.description && (
                                      <p className="text-xs text-[#666666] mt-0.5 line-clamp-2" title={m.description}>
                                        {m.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-3">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                  m.type === 'delivery' ? 'bg-blue-500/10 text-blue-700 border-blue-500/20' :
                                  m.type === 'billing' ? 'bg-green-500/10 text-green-700 border-green-500/20' :
                                  'bg-purple-500/10 text-purple-700 border-purple-500/20'
                                }`}>
                                  {m.type === 'delivery' ? 'Entregable' : m.type === 'billing' ? 'Pago' : 'Mixto'}
                                </span>
                              </td>
                              <td className="py-4 px-3 text-xs text-[#1A1A1A]">
                                {new Date(m.estimated_date).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-3">
                                {m.completed ? (
                                  <input
                                    type="date"
                                    value={m.real_date || ''}
                                    onChange={(e) => handleUpdateRealDate(m.id, e.target.value || null)}
                                    className="text-xs bg-white border border-black/10 rounded-lg px-2 py-1 outline-none text-[#1A1A1A]"
                                  />
                                ) : (
                                  <span className="text-xs text-[#999] italic">Pendiente</span>
                                )}
                              </td>
                              <td className="py-4 px-3 text-sm font-medium text-[#1A1A1A] text-right">
                                {hasAmount ? `$${m.amount?.toLocaleString()} USD` : '-'}
                              </td>
                              <td className="py-4 px-3 text-center">
                                {isBillingType && m.completed ? (
                                  <button
                                    onClick={() => handleConfirmPayment(m)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider transition-all border ${
                                      m.billing_confirmed
                                        ? 'bg-green-500 text-white border-green-600 hover:bg-rose-600 hover:border-rose-700 hover:content-["Deshacer"]'
                                        : 'bg-white text-[#1A1A1A] border-black/10 hover:border-[#FFD166] hover:bg-[#FFD166]/10'
                                    }`}
                                  >
                                    {m.billing_confirmed ? 'COBRADO ✓' : 'CONFIRMAR'}
                                  </button>
                                ) : isBillingType ? (
                                  <span className="text-[10px] text-[#999] font-bold tracking-wider uppercase">Completa Hito</span>
                                ) : (
                                  <span className="text-xs text-[#999]">-</span>
                                )}
                              </td>
                              <td className="py-4 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => {
                                      setEditingMilestone(m);
                                      setIsMilestoneModalOpen(true);
                                    }}
                                    className="p-1 hover:bg-black/5 rounded text-[#666666] hover:text-[#1A1A1A]"
                                    title="Editar"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMilestone(m.id)}
                                    className="p-1 hover:bg-red-50 rounded text-[#666666] hover:text-red-600"
                                    title="Eliminar"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && linkedTasks.length > 0 && (
                              <tr className="bg-black/2 border-b border-black/5">
                                <td colSpan={8} className="p-4">
                                  <div className="bg-white rounded-xl border border-black/5 p-4 pl-12 shadow-sm">
                                    <h5 className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-3">Tareas Vinculadas</h5>
                                    <div className="flex flex-col gap-3">
                                      {linkedTasks.map(task => renderTaskItem(task))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>


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
      {previewImportModal}
      {milestoneManualModal}

      {/* AI Agent Progress Panel */}
      {showAgentPanel && createPortal(
        <div className="fixed inset-0 z-50 flex justify-end" style={{ pointerEvents: 'none' }}>
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
            style={{ pointerEvents: 'all' }}
            onClick={() => setShowAgentPanel(false)}
          />

          <div
            className="relative h-full w-full max-w-md bg-white/90 backdrop-blur-2xl text-[#1A1A1A] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 border-l border-white/50"
            style={{ pointerEvents: 'all' }}
          >
            <div className="flex items-center justify-between px-6 py-6 border-b border-black/5">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-[#FFD166]/20 rounded-xl">
                  <Sparkles size={20} className="text-[#FFB020]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-wide text-[#1A1A1A]">AI Project Analyst</h3>
                  <p className="text-sm text-[#666666] mt-0.5">{project.name}</p>
                </div>
              </div>
              <button onClick={() => setShowAgentPanel(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <X size={20} className="text-[#666666]" />
              </button>
            </div>

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

            <div className="px-6 py-6 border-t border-black/5 bg-white/50">
              {agentDone && (
                <button
                  onClick={() => { setShowAgentPanel(false); fetchProjectData(); }}
                  className="w-full flex items-center justify-center gap-2 bg-[#FFD166] hover:bg-[#FFC033] text-[#1A1A1A] font-bold py-4 rounded-2xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 text-sm"
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
                  <div className="h-full bg-[#FFD166] rounded-full animate-pulse" style={{ width: `${Math.min(95, agentSteps.length * 12)}%`, transition: 'width 0.5s ease' }} />
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

const EditIcon = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
