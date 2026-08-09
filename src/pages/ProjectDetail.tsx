import { ArrowLeft, X, Plus, Trash2, FileText, CheckCircle, Calendar, DollarSign, Edit3, Upload, ChevronRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useState, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { analyzeProjectWithGemini, ProjectAnalysisResult } from '../lib/gemini-project-analyst';
import { extractMilestonesWithGemini } from '../lib/gemini-milestones-extractor';
import { generateTaskBreakdown, GeneratedTask, BalanceEquipo, ENGINEERING_PATH_PHASES } from '../lib/gemini-task-breakdown';
import CronogramaProyecto from '../components/CronogramaProyecto';
import { Sparkles, Loader2, Target, AlertTriangle, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EditProjectModal from '../components/EditProjectModal';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

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
  archetype?: string;
  delegated_to?: string;
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
  const [taskGrouping, setTaskGrouping] = useState<'status' | 'priority' | 'phase'>('status');
  const [solutionAnalysis, setSolutionAnalysis] = useState<any>(null);

  // AI Task Breakdown State
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [isTaskPreviewOpen, setIsTaskPreviewOpen] = useState(false);
  const [taskPreview, setTaskPreview] = useState<(GeneratedTask & { selected: boolean })[]>([]);
  const [balanceEquipo, setBalanceEquipo] = useState<BalanceEquipo | null>(null);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('Fer');

  // AI Analyst State

  // Hitos (Milestones) State
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewMilestones, setPreviewMilestones] = useState<ProjectMilestone[]>([]);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Partial<ProjectMilestone> | null>(null);
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({});

  // Manual Task CRUD State
  const [editingTaskManual, setEditingTaskManual] = useState<any | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const toggleMilestoneExpanded = (id: string) => {
    setExpandedMilestones(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveTaskManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTaskManual || !editingTaskManual.title.trim()) return;

    try {
      const isNew = !editingTaskManual.id;
      const payload = {
        title: editingTaskManual.title.trim(),
        project: project?.name || 'General',
        status: editingTaskManual.status || 'todo',
        priority: editingTaskManual.priority || 'Media',
        phase: editingTaskManual.phase || null,
        hours: Number(editingTaskManual.hours || 0),
        actual_hours: editingTaskManual.actual_hours !== undefined && editingTaskManual.actual_hours !== '' ? Number(editingTaskManual.actual_hours) : null,
        due_date: editingTaskManual.due_date || null,
        assignees: editingTaskManual.assignees || [editingTaskManual.assignee || 'Fer'],
        assignee: editingTaskManual.assignee || 'Fer',
        description: editingTaskManual.description || '',
        delegable: !!editingTaskManual.delegable,
      };

      if (isNew) {
        const { data, error } = await supabase.from('tasks').insert([payload]).select().single();
        if (error) throw error;
        setProjectTasks(prev => [data, ...prev]);
      } else {
        const { error } = await supabase.from('tasks').update(payload).eq('id', editingTaskManual.id);
        if (error) throw error;
        setProjectTasks(prev => prev.map(t => t.id === editingTaskManual.id ? { ...t, ...payload } : t));
      }

      setIsTaskModalOpen(false);
      setEditingTaskManual(null);
    } catch (err: any) {
      console.error('Error saving task:', err);
      alert('Error al guardar tarea: ' + err.message);
    }
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

      // Fetch latest TO-BE solution analysis (AI Solution Architect), if any
      const { data: solutionAnalysisData } = await supabase
        .from('solution_analyses')
        .select('analysis_json, features, to_be_process, problems')
        .eq('project_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setSolutionAnalysis(
        solutionAnalysisData?.analysis_json ||
        (solutionAnalysisData ? {
          features: solutionAnalysisData.features,
          to_be_process: solutionAnalysisData.to_be_process,
          problems: solutionAnalysisData.problems,
        } : null)
      );

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
          .or(`project.eq.${projectData.name},project.ilike.%EK CRM%,project.ilike.%Automatización EK%`)
          .order('created_at', { ascending: false });
        
        let tasks = tasksData || [];

        // Si es un proyecto nuevo sin tareas, inicializar tareas de la etapa en curso (Auditoría / Arquitectura)
        if (tasks.length === 0) {
          const defaultPhase = ENGINEERING_PATH_PHASES[0]; // Auditoría
          const defaultInitialTasks = [
            {
              title: `Auditoría inicial y levantamiento de requerimientos`,
              project: projectData.name,
              status: 'in-progress',
              priority: 'Alta',
              hours: 8,
              phase: defaultPhase,
              assignees: [projectData.delegated_to === 'Tercero' ? 'Tercero (Freelance)' : 'Fer'],
              assignee: projectData.delegated_to === 'Tercero' ? 'Tercero (Freelance)' : 'Fer',
              description: 'Levantamiento de objetivos, flujos de trabajo e insumos del cliente.'
            },
            {
              title: `Definición de arquitectura y alcance técnico`,
              project: projectData.name,
              status: 'todo',
              priority: 'Alta',
              hours: 10,
              phase: defaultPhase,
              assignees: [projectData.delegated_to === 'Tercero' ? 'Tercero (Freelance)' : 'Fer'],
              assignee: projectData.delegated_to === 'Tercero' ? 'Tercero (Freelance)' : 'Fer',
              description: 'Diseño conceptual y especificación técnica de la solución.'
            },
            {
              title: `Validación de insumos y accesos del cliente`,
              project: projectData.name,
              status: 'todo',
              priority: 'Media',
              hours: 4,
              phase: defaultPhase,
              assignees: [projectData.delegated_to === 'Tercero' ? 'Tercero (Freelance)' : 'Fer'],
              assignee: projectData.delegated_to === 'Tercero' ? 'Tercero (Freelance)' : 'Fer',
              description: 'Verificación de accesos a sistemas y documentación del proyecto.'
            }
          ];

          const { data: insertedTasks, error: insertErr } = await supabase
            .from('tasks')
            .insert(defaultInitialTasks)
            .select();

          if (!insertErr && insertedTasks) {
            tasks = insertedTasks;
          }
        }
        
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

  useEffect(() => {
    if (project) {
      setNewTaskAssignee(project.delegated_to === 'Tercero' ? 'Tercero (Freelance)' : 'Fer');
    }
  }, [project?.delegated_to]);

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

  const handleToggleOutsourced = async () => {
    if (!project) return;
    const nextVal = project.delegated_to === 'Tercero' ? 'In-house' : 'Tercero';
    try {
      const { error } = await supabase
        .from('projects')
        .update({ delegated_to: nextVal })
        .eq('id', project.id);
      
      if (error) throw error;
      setProject({ ...project, delegated_to: nextVal });
    } catch (err) {
      console.error('Error toggling delegated_to:', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !newTaskTitle.trim()) return;

    try {
      const payload = {
        title: newTaskTitle.trim(),
        project: project.name,
        status: 'todo',
        priority: 'Media',
        assignees: [newTaskAssignee],
      };

      const { data, error } = await supabase.from('tasks').insert([payload]).select().single();
      if (error) throw error;

      setProjectTasks([data, ...projectTasks]);
      setNewTaskTitle('');
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string, titulo: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!window.confirm(`¿Eliminar la tarea "${titulo}"?\n\nEsta acción no se puede deshacer.`)) return;
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      setProjectTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err: any) {
      console.error('Error eliminando tarea:', err);
      alert('No se pudo eliminar la tarea: ' + err.message);
    }
  };

  const syncTasksWithMilestones = async (currentTasks: any[]) => {
    if (!milestones || milestones.length === 0) return;

    let changed = false;
    const updatedMilestones = milestones.map(m => {
      const linkedTasks = currentTasks.filter(t => 
        (t.tags && Array.isArray(t.tags) && t.tags.includes(`milestone:${m.id}`)) ||
        (t.phase && (t.phase === m.title || m.title?.toLowerCase().includes(t.phase.toLowerCase())))
      );

      if (linkedTasks.length > 0) {
        const allDone = linkedTasks.every(t => t.status === 'done');
        if (allDone && !m.completed) {
          changed = true;
          return {
            ...m,
            completed: true,
            real_date: m.real_date || new Date().toISOString().split('T')[0]
          };
        } else if (!allDone && m.completed) {
          changed = true;
          return {
            ...m,
            completed: false,
            real_date: null
          };
        }
      }
      return m;
    });

    if (changed) {
      await saveMilestones(updatedMilestones);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
      if (error) throw error;
      const updatedTasks = projectTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
      setProjectTasks(updatedTasks);
      await syncTasksWithMilestones(updatedTasks);
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const handleTaskDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const targetVal = destination.droppableId;
    let updates: any = {};
    let updatedTasks = [...projectTasks];

    if (taskGrouping === 'priority') {
      updates = { priority: targetVal };
      updatedTasks = projectTasks.map(t => t.id === draggableId ? { ...t, priority: targetVal } : t);
    } else if (taskGrouping === 'phase') {
      const phaseVal = targetVal === '__none__' ? null : targetVal;
      updates = { phase: phaseVal };
      updatedTasks = projectTasks.map(t => t.id === draggableId ? { ...t, phase: phaseVal || undefined } : t);
    } else {
      // default: status
      updates = { status: targetVal };
      updatedTasks = projectTasks.map(t => t.id === draggableId ? { ...t, status: targetVal } : t);
    }

    // Optimistic UI update
    setProjectTasks(updatedTasks);

    try {
      const { error } = await supabase.from('tasks').update(updates).eq('id', draggableId);
      if (error) throw error;
      await syncTasksWithMilestones(updatedTasks);
    } catch (err) {
      console.error('Error updating task on drag:', err);
      setProjectTasks(projectTasks);
    }
  };

  // ── Desglose de Tareas por IA ("The Engineering Path") ─────────────────────

  const computeAssigneesForTask = (taskType: 'architecture' | 'development'): { assignees: string[]; delegable: boolean } => {
    if (taskType === 'architecture') {
      const socios = allTeam.filter(m => m.role?.toLowerCase().includes('socio')).map(m => m.name);
      return { assignees: socios, delegable: false };
    }
    if (project?.delegated_to === 'Tercero') {
      return { assignees: [], delegable: true };
    }
    const devs = allTeam.filter(m => m.role?.toLowerCase().includes('desarrollador')).map(m => m.name);
    return { assignees: devs, delegable: false };
  };

  /**
   * Carga real de cada integrante: horas pendientes en otros proyectos activos.
   * Es lo que permite al agente respetar la regla de 1 S&S + 1 proyecto grande.
   */
  const cargarCargaEquipo = async () => {
    const { data: tareasOtras } = await supabase
      .from('tasks')
      .select('assignees, hours, status, project')
      .neq('status', 'done')
      .neq('project', project?.name || '');

    const { data: proyectosActivos } = await supabase
      .from('projects').select('name').eq('outcome', 'Ganado');
    const activos = new Set((proyectosActivos || []).map((p: any) => p.name));

    return assignedTeam.map((m) => {
      const suyas = (tareasOtras || []).filter(
        (t: any) => (t.assignees || []).includes(m.name) && activos.has(t.project),
      );
      return {
        nombre: m.name,
        rol: m.role,
        horas_comprometidas: suyas.reduce((a: number, t: any) => a + Number(t.hours || 0), 0),
        proyectos_activos: Array.from(new Set(suyas.map((t: any) => t.project))),
      };
    });
  };

  const handleGenerateTaskBreakdown = async () => {
    if (!project) return;
    setIsGeneratingTasks(true);
    try {
      const equipo = await cargarCargaEquipo();
      const resultado = await generateTaskBreakdown({
        projectName: project.name,
        clientName: project.client,
        description: project.description,
        projectAnalysis: project.project_analysis,
        solutionAnalysis,
        existingMilestones: milestones,
        equipo,
        fechaInicio: project.created_at,
        fechaFin: project.due_date,
      });
      setTaskPreview(resultado.tareas.map(t => ({ ...t, selected: true })));
      setBalanceEquipo(resultado.balance);
      setIsTaskPreviewOpen(true);
    } catch (err: any) {
      console.error('Error generating task breakdown:', err);
      alert('Error al generar tareas con IA: ' + err.message);
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  const handleConfirmTaskImport = async () => {
    if (!project) return;
    const toInsert = taskPreview.filter(t => t.selected);
    if (toInsert.length === 0) {
      setIsTaskPreviewOpen(false);
      return;
    }

    try {
      const payloads = toInsert.map(t => {
        // El agente ya sugirió una persona concreta según su rol y su carga.
        // Solo caemos al reparto por rol si no propuso a nadie.
        const porRol = computeAssigneesForTask(t.task_type);
        const assignees = t.responsable_sugerido ? [t.responsable_sugerido] : porRol.assignees;
        const delegable = t.responsable_sugerido ? false : porRol.delegable;

        return {
          title: t.title,
          description: t.description,
          project: project.name,
          status: 'todo',
          priority: t.priority,
          hours: t.hours,
          phase: t.phase,
          delegable,
          assignees,
          assignee: assignees[0] || null,
          due_date: t.due_date || null,
          // La tarea queda colgada de su hito facturable.
          tags: t.milestone_id ? [`milestone:${t.milestone_id}`] : [],
        };
      });

      const { error } = await supabase.from('tasks').insert(payloads);
      if (error) throw error;

      if (project.status === 'Preventa' || project.status === 'Pendiente') {
        await supabase.from('projects').update({ status: 'En Progreso' }).eq('id', project.id);
        await supabase.from('project_status_history').insert({
          project_id: project.id,
          field: 'status',
          old_value: project.status,
          new_value: 'En Progreso',
        });
      }

      setIsTaskPreviewOpen(false);
      setTaskPreview([]);
      await fetchProjectData();
    } catch (err: any) {
      console.error('Error importing generated tasks:', err);
      alert('Error al importar las tareas: ' + err.message);
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
    const nextCompleted = !milestone.completed;
    let realDate = milestone.real_date;
    const todayStr = new Date().toISOString().split('T')[0];

    if (nextCompleted && !realDate) {
      realDate = todayStr;
    } else if (!nextCompleted) {
      realDate = null;
    }

    const updatedMilestones = milestones.map(m =>
      m.id === milestone.id
        ? { ...m, completed: nextCompleted, real_date: realDate }
        : m
    );

    // Si el hito se marca como completado, actualizar las tareas asociadas a este hito a "done"
    if (nextCompleted) {
      const linkedTasks = projectTasks.filter(t =>
        (t.tags && Array.isArray(t.tags) && t.tags.includes(`milestone:${milestone.id}`)) ||
        (t.phase && (t.phase === milestone.title || milestone.title?.toLowerCase().includes(t.phase.toLowerCase())))
      );

      for (const t of linkedTasks) {
        if (t.status !== 'done') {
          await supabase.from('tasks').update({
            status: 'done',
            actual_hours: t.hours || t.actual_hours || 0,
            due_date: realDate || todayStr
          }).eq('id', t.id);
        }
      }

      // Activar las tareas del siguiente hito en curso ("hito en curso")
      const nextMilestone = updatedMilestones.find(m => !m.completed);
      if (nextMilestone) {
        const nextTasks = projectTasks.filter(t =>
          (t.tags && Array.isArray(t.tags) && t.tags.includes(`milestone:${nextMilestone.id}`)) ||
          (t.phase && (t.phase === nextMilestone.title || nextMilestone.title?.toLowerCase().includes(t.phase.toLowerCase())))
        );

        for (const t of nextTasks) {
          if (t.status === 'done' || !t.status) {
            await supabase.from('tasks').update({ status: 'todo' }).eq('id', t.id);
          }
        }
      }
    }

    await saveMilestones(updatedMilestones);
    await fetchProjectData();
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

  const taskPreviewModal = isTaskPreviewOpen ? createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-black/5 flex justify-between items-center bg-[#FFD166]/10">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#FFB020]" />
            <h3 className="text-xl font-medium text-[#1A1A1A]">Tareas Generadas por IA</h3>
          </div>
          <button onClick={() => setIsTaskPreviewOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <X size={20} className="text-[#1A1A1A]" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-sm text-[#666666] mb-4">
            Tareas estimadas contra las fechas comprometidas de cada hito, con responsable sugerido según su rol.
            Desmarcá las que no correspondan antes de importar.
          </p>

          {/* Balance de carga: la regla de 1 S&S + 1 proyecto grande por socio */}
          {balanceEquipo && (
            <div className={`mb-5 p-4 rounded-2xl border ${
              balanceEquipo.cumple_regla_1ss_1grande
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-rose-50 border-rose-200'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                {balanceEquipo.cumple_regla_1ss_1grande
                  ? <CheckCircle size={16} className="text-emerald-600" />
                  : <AlertTriangle size={16} className="text-rose-600" />}
                <p className={`text-xs font-bold ${balanceEquipo.cumple_regla_1ss_1grande ? 'text-emerald-800' : 'text-rose-800'}`}>
                  {balanceEquipo.cumple_regla_1ss_1grande
                    ? 'La carga respeta la regla de 1 S&S + 1 proyecto grande por socio'
                    : 'Hay socios por encima de la regla de 1 S&S + 1 proyecto grande'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                {balanceEquipo.carga.map((c) => (
                  <div key={c.persona} className="bg-white/70 rounded-xl p-3 border border-black/5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-bold text-[#1A1A1A] truncate">{c.persona}</p>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        c.veredicto === 'OK' ? 'bg-emerald-100 text-emerald-700'
                        : c.veredicto === 'AJUSTADO' ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700'
                      }`}>{c.veredicto}</span>
                    </div>
                    <p className="text-[9px] text-[#999999] mt-0.5">{c.rol}</p>
                    <p className="text-[10px] text-[#666666] mt-1.5">
                      <strong className="text-[#1A1A1A]">{c.total} h</strong> ({c.horas_actuales} actuales + {c.horas_nuevas} nuevas)
                    </p>
                  </div>
                ))}
              </div>

              {balanceEquipo.advertencias.length > 0 && (
                <ul className="flex flex-col gap-1 mb-2">
                  {balanceEquipo.advertencias.map((a, i) => (
                    <li key={i} className="text-[10px] text-[#666666] flex gap-1.5">
                      <span className="text-amber-600 shrink-0">▲</span>{a}
                    </li>
                  ))}
                </ul>
              )}
              {balanceEquipo.recomendacion && (
                <p className="text-[10px] text-[#1A1A1A] font-medium bg-white/60 rounded-lg px-2.5 py-2">
                  {balanceEquipo.recomendacion}
                </p>
              )}
            </div>
          )}
          <div className="border border-black/5 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-black/2 border-b border-black/5 text-[#666666] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-8"></th>
                  <th className="py-2.5 px-3">Tarea</th>
                  <th className="py-2.5 px-3">Fase</th>
                  <th className="py-2.5 px-3">Hito</th>
                  <th className="py-2.5 px-3">Responsable</th>
                  <th className="py-2.5 px-3">Vence</th>
                  <th className="py-2.5 px-3 text-right">Horas</th>
                </tr>
              </thead>
              <tbody>
                {taskPreview.map((t, idx) => (
                  <tr key={idx} className="border-b border-black/5">
                    <td className="py-3 px-3">
                      <input
                        type="checkbox"
                        checked={t.selected}
                        onChange={() => setTaskPreview(prev => prev.map((row, i) => i === idx ? { ...row, selected: !row.selected } : row))}
                        className="w-4 h-4 rounded text-[#FFD166] focus:ring-[#FFD166] border-black/10"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-[#1A1A1A]">{t.title}</p>
                      <p className="text-[#666666] mt-0.5 line-clamp-1">{t.description}</p>
                    </td>
                    <td className="py-3 px-3 text-[#1A1A1A]">
                      {t.phase}
                      <span className={`block mt-1 w-fit px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                        t.task_type === 'architecture' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {t.task_type === 'architecture' ? 'Arquitectura' : 'Desarrollo'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[10px] text-[#666666]">
                      {t.milestone_id
                        ? (milestones.find(m => m.id === t.milestone_id)?.title || t.milestone_id)
                        : <span className="italic text-[#BBB]">sin hito</span>}
                    </td>
                    <td className="py-3 px-3 text-[10px]">
                      {t.responsable_sugerido
                        ? <span className="font-semibold text-[#1A1A1A]">{t.responsable_sugerido}</span>
                        : <span className="italic text-[#BBB]">a definir</span>}
                    </td>
                    <td className="py-3 px-3 text-[10px] text-[#666666]">
                      {t.due_date ? new Date(t.due_date).toLocaleDateString('es-AR') : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-[#1A1A1A]">{t.hours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-6 border-t border-black/5 flex justify-between gap-4 bg-black/2">
          <span className="text-xs text-[#666666] self-center">{taskPreview.filter(t => t.selected).length} de {taskPreview.length} seleccionadas</span>
          <div className="flex gap-3">
            <button
              onClick={() => setIsTaskPreviewOpen(false)}
              className="bg-white hover:bg-black/5 text-[#1A1A1A] border border-black/10 px-6 py-2.5 rounded-full text-xs font-bold transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmTaskImport}
              disabled={taskPreview.filter(t => t.selected).length === 0}
              className="bg-[#222222] hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-full text-xs font-bold transition-all"
            >
              Importar a Kanban
            </button>
          </div>
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

  const taskManualModal = isTaskModalOpen && editingTaskManual ? createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-black/5 flex justify-between items-center bg-black/2">
          <h3 className="text-xl font-medium text-[#1A1A1A]">
            {editingTaskManual.id ? 'Editar Tarea' : 'Nueva Tarea'}
          </h3>
          <button type="button" onClick={() => { setIsTaskModalOpen(false); setEditingTaskManual(null); }} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSaveTaskManual} className="p-6 overflow-y-auto flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#666666]">Título de la Tarea</label>
            <input
              required
              type="text"
              value={editingTaskManual.title || ''}
              onChange={(e) => setEditingTaskManual({ ...editingTaskManual, title: e.target.value })}
              placeholder="Ej. Diseñar flujo de autenticación..."
              className="bg-black/2 border border-black/10 rounded-2xl px-4 py-3 outline-none focus:border-[#FFD166] text-sm text-[#1A1A1A]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#666666]">Estado</label>
              <select
                value={editingTaskManual.status || 'todo'}
                onChange={(e) => setEditingTaskManual({ ...editingTaskManual, status: e.target.value })}
                className="bg-black/2 border border-black/10 rounded-2xl px-4 py-3 outline-none focus:border-[#FFD166] text-sm text-[#1A1A1A]"
              >
                <option value="todo">Por Hacer</option>
                <option value="in-progress">En Progreso</option>
                <option value="review">En Revisión</option>
                <option value="done">Completado</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#666666]">Prioridad</label>
              <select
                value={editingTaskManual.priority || 'Media'}
                onChange={(e) => setEditingTaskManual({ ...editingTaskManual, priority: e.target.value })}
                className="bg-black/2 border border-black/10 rounded-2xl px-4 py-3 outline-none focus:border-[#FFD166] text-sm text-[#1A1A1A]"
              >
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#666666]">Fase (Engineering Path)</label>
              <select
                value={editingTaskManual.phase || ''}
                onChange={(e) => setEditingTaskManual({ ...editingTaskManual, phase: e.target.value || null })}
                className="bg-black/2 border border-black/10 rounded-2xl px-4 py-3 outline-none focus:border-[#FFD166] text-sm text-[#1A1A1A]"
              >
                <option value="">Sin fase especificada</option>
                {ENGINEERING_PATH_PHASES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#666666]">Responsable</label>
              <select
                value={editingTaskManual.assignee || 'Fer'}
                onChange={(e) => setEditingTaskManual({ ...editingTaskManual, assignee: e.target.value, assignees: [e.target.value] })}
                className="bg-black/2 border border-black/10 rounded-2xl px-4 py-3 outline-none focus:border-[#FFD166] text-sm text-[#1A1A1A]"
              >
                <option value="Fer">Fer</option>
                <option value="Pedro">Pedro</option>
                <option value="Tercero (Freelance)">Tercero (Freelance)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#666666]">Horas Estimadas</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={editingTaskManual.hours || ''}
                onChange={(e) => setEditingTaskManual({ ...editingTaskManual, hours: parseFloat(e.target.value) || 0 })}
                className="bg-black/2 border border-black/10 rounded-2xl px-4 py-3 outline-none focus:border-[#FFD166] text-sm text-[#1A1A1A]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#666666]">Horas Reales</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={editingTaskManual.actual_hours ?? ''}
                onChange={(e) => setEditingTaskManual({ ...editingTaskManual, actual_hours: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                className="bg-black/2 border border-black/10 rounded-2xl px-4 py-3 outline-none focus:border-[#FFD166] text-sm text-[#1A1A1A]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#666666]">Fecha Límite / Vencimiento</label>
            <input
              type="date"
              value={editingTaskManual.due_date ? editingTaskManual.due_date.split('T')[0] : ''}
              onChange={(e) => setEditingTaskManual({ ...editingTaskManual, due_date: e.target.value })}
              className="bg-black/2 border border-black/10 rounded-2xl px-4 py-3 outline-none focus:border-[#FFD166] text-sm text-[#1A1A1A]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#666666]">Descripción</label>
            <textarea
              rows={3}
              value={editingTaskManual.description || ''}
              onChange={(e) => setEditingTaskManual({ ...editingTaskManual, description: e.target.value })}
              placeholder="Detalles de la tarea..."
              className="bg-black/2 border border-black/10 rounded-2xl p-4 outline-none focus:border-[#FFD166] text-sm text-[#1A1A1A] resize-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!editingTaskManual.delegable}
              onChange={(e) => setEditingTaskManual({ ...editingTaskManual, delegable: e.target.checked })}
              className="w-4 h-4 rounded text-[#FFD166]"
            />
            <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">Delegable a Tercero (Freelance)</span>
          </label>

          <div className="pt-4 border-t border-black/5 flex justify-between items-center bg-black/2 -mx-6 -mb-6 p-6">
            {editingTaskManual.id ? (
              <button
                type="button"
                onClick={() => {
                  handleDeleteTask(editingTaskManual.id, editingTaskManual.title);
                  setIsTaskModalOpen(false);
                  setEditingTaskManual(null);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2.5 rounded-full transition-colors"
              >
                <Trash2 size={14} /> Eliminar
              </button>
            ) : <div />}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setIsTaskModalOpen(false); setEditingTaskManual(null); }}
                className="bg-white hover:bg-black/5 text-[#1A1A1A] border border-black/10 px-6 py-2.5 rounded-full text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-[#222222] hover:bg-black text-white px-8 py-2.5 rounded-full text-xs font-bold transition-all shadow-md"
              >
                Guardar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  ) : null;

  const unlinkedTasks = projectTasks.filter(t => !(t.tags && Array.isArray(t.tags) && t.tags.some((tag: string) => tag.startsWith('milestone:'))));

  const renderTaskItem = (task: any) => {
    const isExpanded = expandedTasks.includes(task.id);
    return (
      <div
        key={task.id}
        className={`group/task relative flex flex-col bg-white/40 rounded-xl border border-black/5 hover:bg-white/60 transition-all overflow-hidden ${isExpanded ? 'ring-2 ring-[#FFD166]/30 bg-white/80' : ''}`}
      >
        <div className="absolute top-1.5 right-1.5 z-20 flex items-center gap-1 opacity-0 group-hover/task:opacity-100 transition-all bg-white/90 backdrop-blur-sm p-1 rounded-full border border-black/10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingTaskManual(task);
              setIsTaskModalOpen(true);
            }}
            title="Editar tarea"
            className="p-1 rounded-full text-[#666666] hover:text-[#1A1A1A] hover:bg-black/5"
          >
            <Edit3 size={12} />
          </button>
          <button
            onClick={(e) => handleDeleteTask(task.id, task.title, e)}
            title="Eliminar tarea"
            className="p-1 rounded-full text-[#CCCCCC] hover:text-red-500 hover:bg-red-50"
          >
            <Trash2 size={12} />
          </button>
        </div>
        <div 
          className="flex items-center justify-between p-3 cursor-pointer"
          onClick={() => setExpandedTasks(prev => isExpanded ? prev.filter(id => id !== task.id) : [...prev, task.id])}
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full shrink-0 ${
              task.status === 'done' ? 'bg-green-400' :
              task.status === 'in-progress' ? 'bg-[#FFD166]' :
              task.status === 'review' ? 'bg-blue-400' : 'bg-black/20'
            }`} />
            <div>
              <p className="text-xs font-semibold text-[#1A1A1A] leading-tight">{task.title}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className={`text-[9px] font-bold uppercase ${
                  task.priority === 'Alta' ? 'text-red-500' : 
                  task.priority === 'Media' ? 'text-[#FFB020]' : 'text-blue-500'
                }`}>
                  {task.priority}
                </span>
                {task.phase && (
                  <>
                    <span className="text-[9px] text-black/20">•</span>
                    <span className="text-[9px] text-[#666666]">{task.phase}</span>
                  </>
                )}
                {task.delegable && (
                  <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">Delegable</span>
                )}
                {task.due_date && (
                  <>
                    <span className="text-[9px] text-black/20">•</span>
                    <span className="text-[9px] text-[#666666]">Vence: {new Date(task.due_date).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {(task.assignees || []).slice(0, 3).map((name: string, i: number) => (
                <div 
                  key={i} 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-white text-white bg-[#222222]"
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
          {/* El análisis IA de la empresa se hace ahora en la ficha del Lead
              (Pre-Call Brief), antes de que exista el proyecto. Acá quedaba
              duplicado y desactualizado. */}
          <button
            onClick={handleGenerateTaskBreakdown}
            disabled={isGeneratingTasks}
            className="flex items-center justify-center gap-2 bg-white/70 hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed text-[#1A1A1A] border border-black/10 px-6 py-3 rounded-full text-sm font-medium transition-colors shadow-sm"
          >
            {isGeneratingTasks ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-[#FFB020]" />}
            {isGeneratingTasks ? 'Generando Tareas...' : 'Generar Tareas con IA'}
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#222222] hover:bg-black text-white px-6 py-3 rounded-full text-sm font-medium transition-colors shadow-sm"
          >
            <EditIcon size={16} />
            Editar Detalles
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 flex flex-col gap-4">
            <h4 className="text-base font-semibold text-[#1A1A1A]">Progreso General</h4>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs text-[#666666]">
                <span>Completado</span>
                <span className="font-semibold text-[#1A1A1A]">{project.progress}%</span>
              </div>
              <div className="w-full bg-black/5 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${project.status === 'En Riesgo' ? 'bg-red-400' : project.status === 'Completado' ? 'bg-green-400' : project.status === 'Preventa' ? 'bg-indigo-400' : 'bg-[#FFD166]'}`}
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-black/5 text-xs">
              <div>
                <p className="text-[11px] text-[#666666] mb-0.5">Fecha de Inicio</p>
                <p className="font-semibold text-[#1A1A1A]">{new Date(project.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#666666] mb-0.5">Fecha de Entrega</p>
                <p className="font-semibold text-[#1A1A1A]">{project.due_date || 'No definida'}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#666666] mb-0.5">Presupuesto</p>
                <p className="font-semibold text-[#1A1A1A]">${(project.budget || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#666666] mb-0.5">ID Proyecto</p>
                <p className="font-semibold text-[#1A1A1A]">PROJ-{project.id.substring(0,4).toUpperCase()}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-black/5">
              <h4 className="text-xs font-semibold text-[#1A1A1A] mb-1">Descripción</h4>
              <p className="text-xs text-[#666666] leading-relaxed whitespace-pre-wrap">
                {project.description || 'Sin descripción disponible.'}
              </p>
            </div>

            {/* Timeline: The Engineering Path */}
            <div className="pt-3 border-t border-black/5">
              <h4 className="text-xs font-semibold text-[#1A1A1A] mb-2.5">The Engineering Path</h4>
              <div className="flex items-center justify-between w-full relative">
                <div className="absolute left-0 right-0 top-1/2 h-1 bg-black/5 -translate-y-1/2 z-0"></div>
                {(() => {
                  const hasPhaseData = projectTasks.some(t => t.phase);
                  let currentPhaseIdx = 0;
                  if (hasPhaseData) {
                    currentPhaseIdx = ENGINEERING_PATH_PHASES.findIndex((phase) => {
                      const tasksInPhase = projectTasks.filter(t => t.phase === phase);
                      return tasksInPhase.length === 0 || !tasksInPhase.every(t => t.status === 'done');
                    });
                    if (currentPhaseIdx === -1) currentPhaseIdx = ENGINEERING_PATH_PHASES.length - 1;
                  }
                  return ENGINEERING_PATH_PHASES.map((phase, idx) => {
                  const isActive = hasPhaseData
                    ? idx === currentPhaseIdx
                    : (idx === 0 && project.progress < 25) ||
                      (idx === 1 && project.progress >= 25 && project.progress < 50) ||
                      (idx === 2 && project.progress >= 50 && project.progress < 75) ||
                      (idx === 3 && project.progress >= 75);
                  const isPast = hasPhaseData
                    ? idx < currentPhaseIdx
                    : (idx === 0 && project.progress >= 25) ||
                      (idx === 1 && project.progress >= 50) ||
                      (idx === 2 && project.progress >= 75) ||
                      (idx === 3 && project.progress >= 100);

                  return (
                    <div key={phase} className="relative z-10 flex flex-col items-center gap-1.5">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isPast ? 'bg-green-500 border-green-200 text-white' : 
                        isActive ? 'bg-[#FFD166] border-[#FFD166]/30 text-white' : 'bg-white border-black/10 text-transparent'
                      }`}>
                        {isPast ? <CheckCircle size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-current"></div>}
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'text-[#1A1A1A]' : 'text-[#999999]'}`}>
                        {phase}
                      </span>
                    </div>
                  );
                  });
                })()}
              </div>
            </div>

          </div>

        </div>

        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-[#222222] text-white rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <h4 className="text-base font-semibold">Resumen Financiero</h4>
            
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between text-[11px] mb-1.5 text-white/50 uppercase tracking-wider">
                  <span>Progreso de Facturación</span>
                  <span className="font-bold text-[#FFD166]">{Math.round((billedAmount / (project.budget || 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div 
                    className="bg-[#FFD166] h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (billedAmount / (project.budget || 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                  <div>
                    <p className="text-[9px] font-bold text-white/40 uppercase mb-0.5">Presupuesto Total</p>
                    <p className="text-base font-semibold">${(project.budget || 0).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                  <div>
                    <p className="text-[9px] font-bold text-white/40 uppercase mb-0.5">Total Facturado</p>
                    <p className="text-base font-semibold text-green-400">${billedAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-[#FFD166]/10 rounded-xl border border-[#FFD166]/20">
                  <div>
                    <p className="text-[9px] font-bold text-[#FFD166]/60 uppercase mb-0.5">Saldo Pendiente</p>
                    <p className={`text-lg font-bold ${((project.budget || 0) - billedAmount) < 0 ? 'text-red-400' : 'text-[#FFD166]'}`}>
                      ${((project.budget || 0) - billedAmount).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor de Equipo Asignado: Ancho completo de la pantalla */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5">
          <div>
            <h4 className="text-base font-semibold text-[#1A1A1A]">Equipo Asignado</h4>
            <p className="text-xs text-[#666666]">Integrantes asignados al proyecto y delegación a freelancers.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Outsourcing Toggle */}
            <div className="p-2 px-3 bg-black/5 rounded-xl border border-black/5 flex items-center gap-2.5">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#1A1A1A]">Tercerización</span>
                <span className="text-[9px] text-[#666666]">Delega desarrollo a freelancer</span>
              </div>
              <button 
                onClick={handleToggleOutsourced}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${project.delegated_to === 'Tercero' ? 'bg-[#FFD166]' : 'bg-black/20'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${project.delegated_to === 'Tercero' ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
            </div>
            <button 
              onClick={() => setIsTeamModalOpen(true)}
              className="px-4 py-2 border border-dashed border-black/15 rounded-xl text-xs font-bold text-[#1A1A1A] hover:bg-black/5 transition-all shrink-0"
            >
              + Gestionar Equipo
            </button>
          </div>
        </div>

        <div>
          {assignedTeam.length === 0 ? (
            <div className="p-4 bg-black/5 rounded-xl text-center text-xs text-[#666666] italic">
              No hay miembros asignados todavía.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {assignedTeam.map((member) => (
                <div key={member.id} className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-black/5 shadow-xs hover:bg-black/2 transition-all">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-xs"
                    style={{ backgroundColor: member.avatar_color }}
                  >
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1A1A1A] truncate">{member.name}</p>
                    <p className="text-[10px] text-[#666666] truncate">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ancho completo: el cronograma y las tareas necesitan toda la pantalla */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 flex flex-col gap-4">
            <div>
              <h4 className="text-base font-semibold text-[#1A1A1A]">Cronograma</h4>
              <p className="text-xs text-[#666666]">
                Fases del Engineering Path, hitos comprometidos y entregables sobre la línea de tiempo.
              </p>
            </div>
            <CronogramaProyecto
              hitos={milestones}
              tareas={projectTasks}
              fechaInicio={project.created_at}
              fechaFin={project.due_date}
            />
          </div>

          {/* Plan de Hitos y Facturación */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#FFD166]/20 rounded-lg text-[#FFB020]">
                  <FileText size={18} />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-[#1A1A1A]">Plan de Hitos y Cobros</h4>
                  <p className="text-xs text-[#666666]">Control de entregables, cobros por avance e importación inteligente de cronogramas.</p>
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
                        // Desplegado por defecto: el cronograma se entiende viendo
                        // qué trabajo hay detrás de cada cobro, no solo el monto.
                        const isExpanded = expandedMilestones[m.id] ?? true;
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



          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2.5">
                <h4 className="text-base font-semibold text-[#1A1A1A]">Tareas del Proyecto</h4>
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
                  <button
                    onClick={() => setTaskGrouping('phase')}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${taskGrouping === 'phase' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#666666] hover:text-[#1A1A1A]'}`}
                  >
                    POR FASE
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setEditingTaskManual({
                      title: '',
                      status: 'todo',
                      priority: 'Media',
                      phase: ENGINEERING_PATH_PHASES[0],
                      assignee: project?.delegated_to === 'Tercero' ? 'Tercero (Freelance)' : 'Fer',
                      assignees: [project?.delegated_to === 'Tercero' ? 'Tercero (Freelance)' : 'Fer'],
                      hours: 4,
                      due_date: new Date().toISOString().split('T')[0],
                      description: '',
                      delegable: false,
                    });
                    setIsTaskModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-1.5 bg-[#222222] hover:bg-black text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm shrink-0"
                >
                  <Plus size={14} />
                  Nueva Tarea
                </button>
                <Link to="/kanban" className="text-sm font-medium text-[#FFB020] hover:underline flex items-center gap-1">
                  Ver Tablero <ArrowLeft size={14} className="rotate-180" />
                </Link>
              </div>
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
              {/* Task Creation Form */}
              <form onSubmit={handleCreateTask} className="flex flex-col md:flex-row gap-3 p-4 bg-black/5 rounded-2xl border border-black/5">
                <input 
                  type="text" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Nueva tarea rápida..." 
                  className="flex-1 bg-white border border-black/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#FFD166]"
                  required
                />
                <select
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  className="bg-white border border-black/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#FFD166]"
                >
                  <option value="Fer">Fer</option>
                  <option value="Pedro">Pedro</option>
                  <option value="Tercero (Freelance)">Tercero (Freelance)</option>
                </select>
                <button type="submit" className="bg-[#222222] text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-black transition-colors">
                  Agregar
                </button>
              </form>

              {/* Mini-Kanban Board (agrupable por estado / prioridad / fase con Drag and Drop) */}
              <DragDropContext onDragEnd={handleTaskDragEnd}>
                <div className="flex gap-4 w-full overflow-x-auto pb-3 custom-scrollbar">
                  {(taskGrouping === 'priority'
                    ? [
                        { key: 'Alta', label: 'Alta', color: 'bg-red-400' },
                        { key: 'Media', label: 'Media', color: 'bg-[#FFD166]' },
                        { key: 'Baja', label: 'Baja', color: 'bg-blue-400' },
                      ]
                    : taskGrouping === 'phase'
                    ? [
                        ...ENGINEERING_PATH_PHASES.map(p => ({ key: p, label: p, color: 'bg-[#FFD166]' })),
                        { key: '__none__', label: 'Sin Fase', color: 'bg-black/10' },
                      ]
                    : [
                        { key: 'todo', label: 'Por Hacer', color: 'bg-black/10' },
                        { key: 'in-progress', label: 'En Progreso', color: 'bg-[#FFD166]' },
                        { key: 'done', label: 'Completado', color: 'bg-green-400' },
                      ]
                  ).map((group) => {
                    const filteredTasks = projectTasks.filter(t => {
                      if (taskGrouping === 'priority') return t.priority === group.key;
                      if (taskGrouping === 'phase') return group.key === '__none__' ? !t.phase : t.phase === group.key;
                      return t.status === group.key;
                    });

                    return (
                      <div key={group.key} className="flex flex-col gap-3 flex-1 min-w-[200px] shrink-0 md:shrink">
                        <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${group.color}`} />
                            <h5 className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-widest">{group.label}</h5>
                          </div>
                          <span className="text-[10px] font-bold text-[#666666] bg-black/5 px-2 py-0.5 rounded-full">{filteredTasks.length}</span>
                        </div>
                        <Droppable droppableId={group.key}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="flex-1 flex flex-col gap-3 min-h-[150px] bg-black/2 p-3 rounded-2xl border border-black/5"
                            >
                              {filteredTasks.length === 0 ? (
                                <div className="text-center text-xs text-[#999999] italic py-8">Sin tareas</div>
                              ) : (
                                filteredTasks.map((task, index) => (
                                  <Draggable key={task.id} draggableId={task.id} index={index}>
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="relative group cursor-grab active:cursor-grabbing"
                                      >
                                        {renderTaskItem(task)}
                                        {taskGrouping === 'status' && (
                                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm p-1 rounded-lg border border-black/5 z-10">
                                            {group.key !== 'todo' && (
                                              <button onClick={(e) => { e.stopPropagation(); handleUpdateTaskStatus(task.id, 'todo'); }} className="p-1 hover:bg-black/5 rounded" title="Mover a Por Hacer"><ArrowLeft size={12} /></button>
                                            )}
                                            {group.key !== 'in-progress' && (
                                              <button onClick={(e) => { e.stopPropagation(); handleUpdateTaskStatus(task.id, 'in-progress'); }} className="p-1 hover:bg-black/5 rounded" title="Mover a En Progreso"><ArrowLeft size={12} className={group.key === 'done' ? '' : 'rotate-180'} /></button>
                                            )}
                                            {group.key !== 'done' && (
                                              <button onClick={(e) => { e.stopPropagation(); handleUpdateTaskStatus(task.id, 'done'); }} className="p-1 hover:bg-black/5 rounded" title="Mover a Completado"><ArrowLeft size={12} className="rotate-180" /></button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </Draggable>
                                ))
                              )}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    );
                  })}
                </div>
              </DragDropContext>
            </div>

            </div>


      {editModal}
      {teamModal}
      {previewImportModal}
      {taskPreviewModal}
      {milestoneManualModal}
      {taskManualModal}

      {/* AI Agent Progress Panel */}
    </div>
  );
}

const EditIcon = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
