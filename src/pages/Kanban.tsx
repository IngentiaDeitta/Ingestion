import { Plus, MoreHorizontal, Calendar, MessageSquare, Paperclip, X, Save, User, Tag, Check, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '../lib/supabase';

interface TeamMember {
  id: string;
  name: string;
  avatar_color: string;
}

interface Task {
  id: string;
  title: string;
  project: string;
  priority: 'Alta' | 'Media' | 'Baja';
  comments: number;
  attachments: number;
  dueDate: string;
  assignees: string[];
  tags: string[];
  description: string;
  hours: number;
}

interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

interface BoardData {
  tasks: Record<string, Task>;
  columns: Record<string, Column>;
  columnOrder: string[];
}

const INITIAL_COLUMNS: Record<string, Column> = {
  'col-1': { id: 'col-1', title: 'Por Hacer', taskIds: [] },
  'col-2': { id: 'col-2', title: 'En Progreso', taskIds: [] },
  'col-3': { id: 'col-3', title: 'En Revisión', taskIds: [] },
  'col-4': { id: 'col-4', title: 'Completado', taskIds: [] },
};

const STATUS_MAP: Record<string, string> = { 'todo': 'col-1', 'in-progress': 'col-2', 'review': 'col-3', 'done': 'col-4' };
const COLUMN_TO_STATUS: Record<string, string> = { 'col-1': 'todo', 'col-2': 'in-progress', 'col-3': 'review', 'col-4': 'done' };

export default function Kanban() {
  const { isAdmin } = useUser();
  const [data, setData] = useState<BoardData>({ tasks: {}, columns: INITIAL_COLUMNS, columnOrder: ['col-1', 'col-2', 'col-3', 'col-4'] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  useEffect(() => { fetchTasks(); fetchTeam(); fetchProjects(); }, []);

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('*').order('name');
    setProjects(data || []);
  };

  const fetchTeam = async () => {
    const { data } = await supabase.from('team').select('*');
    setTeam(data || []);
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data: tasksData, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (error) throw error;

      const tasks: Record<string, Task> = {};
      const columns = JSON.parse(JSON.stringify(INITIAL_COLUMNS));

      tasksData?.forEach((t: any) => {
        const task: Task = {
          id: t.id,
          title: t.title || 'Sin título',
          project: t.project || 'General',
          priority: t.priority || 'Media',
          comments: t.comments_count || 0,
          attachments: t.attachments_count || 0,
          dueDate: t.due_date || 'Sin fecha',
          assignees: t.assignees || (t.assignee ? [t.assignee] : []),
          tags: t.tags || [],
          description: t.description || '',
          hours: Number(t.hours || 0),
        };
        tasks[task.id] = task;
        const columnId = STATUS_MAP[t.status] || 'col-1';
        if (columns[columnId]) columns[columnId].taskIds.push(task.id);
      });

      setData({ tasks, columns, columnOrder: ['col-1', 'col-2', 'col-3', 'col-4'] });
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
    if (updates.project !== undefined) dbUpdates.project = updates.project;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.hours !== undefined) dbUpdates.hours = updates.hours;
    if (updates.assignees !== undefined) {
      dbUpdates.assignees = updates.assignees;
      dbUpdates.assignee = updates.assignees.length > 0 ? updates.assignees[0] : null;
    }

    try {
      setSaving(true);
      const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id);
      if (error) throw error;

      setData(prev => ({
        ...prev,
        tasks: { ...prev.tasks, [id]: { ...prev.tasks[id], ...updates } }
      }));
      
      if (selectedTask && selectedTask.id === id) {
        setSelectedTask(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!isAdmin) return; // Si no es admin, no puede mover tareas
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const startColumn = data.columns[source.droppableId];
    const finishColumn = data.columns[destination.droppableId];
    const newData = { ...data };

    if (startColumn === finishColumn) {
      const newTaskIds = Array.from(startColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);
      newData.columns[startColumn.id].taskIds = newTaskIds;
      setData(newData);
      return;
    }

    const startTaskIds = Array.from(startColumn.taskIds);
    startTaskIds.splice(source.index, 1);
    newData.columns[startColumn.id].taskIds = startTaskIds;
    const finishTaskIds = Array.from(finishColumn.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    newData.columns[finishColumn.id].taskIds = finishTaskIds;
    setData(newData);

    try {
      await supabase.from('tasks').update({ status: COLUMN_TO_STATUS[destination.droppableId] }).eq('id', draggableId);
    } catch (error) {
      console.error('Error updating status:', error);
      fetchTasks();
    }
  };

  const handleSaveNewTask = async (taskData: any) => {
    try {
      const { error } = await supabase.from('tasks').insert([{
        title: taskData.title,
        project: taskData.project || 'General',
        priority: taskData.priority || 'Media',
        status: 'todo',
        assignees: taskData.assignees || [],
        due_date: taskData.dueDate || 'Sin fecha',
        hours: taskData.hours || 0
      }]);
      if (error) throw error;
      fetchTasks();
      setIsNewTaskOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-[42px] font-normal tracking-tight text-[#1A1A1A]">Tablero Kanban</h3>
            <p className="text-[#666666] mt-1">Gestiona tus tareas y responsables.</p>
          </div>
          {saving && <div className="flex items-center gap-2 text-xs text-[#666666] bg-black/5 px-3 py-1.5 rounded-full animate-pulse"><Loader2 size={12} className="animate-spin" /> Guardando...</div>}
        </div>
        {isAdmin && (
          <button onClick={() => setIsNewTaskOpen(true)} className="flex items-center justify-center gap-2 bg-[#222222] hover:bg-black text-white px-6 py-3 rounded-full text-sm font-medium transition-colors shadow-lg">
            <Plus size={20} /> Nueva Tarea
          </button>
        )}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 h-full min-w-max">
            {data.columnOrder.map((columnId) => {
              const column = data.columns[columnId];
              const tasks = column.taskIds.map(taskId => data.tasks[taskId]);
              return (
                <div key={column.id} className="w-80 flex flex-col gap-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-black/5">
                    <h4 className="font-medium text-[#1A1A1A]">{column.title}</h4>
                    <span className="bg-white/50 border border-black/5 text-[#1A1A1A] text-xs font-medium px-2.5 py-0.5 rounded-full">{tasks.length}</span>
                  </div>
                  <Droppable droppableId={column.id}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                        {tasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} onClick={() => setSelectedTask(task)} className="bg-white/60 backdrop-blur-xl p-5 rounded-[24px] border border-white/40 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold border mb-3 ${task.priority === 'Alta' ? 'bg-[#FFD166] text-[#222222] border-[#FFD166]' : 'bg-black/5 text-[#1A1A1A] border-black/10'}`}>{task.priority}</span>
                                <h5 className="font-medium text-[#1A1A1A] mb-1 leading-tight">{task.title}</h5>
                                <p className="text-xs text-[#666666] mb-5">{task.project}</p>
                                <div className="flex items-center justify-between pt-4 border-t border-black/5">
                                  <div className="flex -space-x-2">
                                    {task.assignees.map((name, i) => {
                                      const member = team.find(m => m.name === name);
                                      return <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white text-white" style={{ backgroundColor: member?.avatar_color || '#222222' }} title={name}>{name.split(' ').map(n => n[0]).join('')}</div>
                                    })}
                                    {task.assignees.length === 0 && <User size={14} className="text-[#666666]" />}
                                  </div>
                                  <div className="flex items-center gap-1 text-xs font-medium text-[#666666]"><Calendar size={12} /><span>{task.dueDate}</span></div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskDetailModal key={selectedTask.id} task={selectedTask} columns={data.columns} teamMembers={team} availableProjects={projects} onClose={() => setSelectedTask(null)} onUpdate={handleUpdateTask} isAdmin={isAdmin} />
      )}
      {isNewTaskOpen && (
        <NewTaskModal teamMembers={team} availableProjects={projects} onClose={() => setIsNewTaskOpen(false)} onSave={handleSaveNewTask} />
      )}
    </div>
  );
}

function MultiAssigneeSelector({ selectedNames, teamMembers, onChange }: { selectedNames: string[], teamMembers: TeamMember[], onChange: (names: string[]) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <div onClick={() => setIsOpen(!isOpen)} className="w-full min-h-[48px] p-2 rounded-2xl border border-black/10 bg-black/5 flex flex-wrap gap-2 cursor-pointer items-center">
        {selectedNames.length === 0 && <span className="text-[#666666] text-sm p-1 ml-2">Sin asignar</span>}
        {selectedNames.map(name => (
          <span key={name} className="bg-[#222222] text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-2">{name}<X size={12} onClick={(e) => { e.stopPropagation(); onChange(selectedNames.filter(n => n !== name)); }} /></span>
        ))}
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-black/10 rounded-[24px] shadow-xl z-20 max-h-60 overflow-y-auto p-2">
            {teamMembers.map(m => (
              <div key={m.id} onClick={() => {
                const newNames = selectedNames.includes(m.name) ? selectedNames.filter(n => n !== m.name) : [...selectedNames, m.name];
                onChange(newNames);
              }} className="flex items-center justify-between px-4 py-2 hover:bg-black/5 rounded-xl cursor-pointer">
                <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: m.avatar_color }}>{m.name.split(' ').map(n => n[0]).join('')}</div><span className="text-sm font-medium">{m.name}</span></div>
                {selectedNames.includes(m.name) && <Check size={16} className="text-[#FFD166]" />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NewTaskModal({ teamMembers, availableProjects, onClose, onSave }: { teamMembers: TeamMember[], availableProjects: any[], onClose: () => void, onSave: (task: any) => void }) {
  const [newTask, setNewTask] = useState({ title: '', project: availableProjects[0]?.name || 'General', priority: 'Media' as const, assignees: [] as string[], dueDate: '', hours: 0 });
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center"><h3 className="text-xl font-medium">Nueva Tarea</h3><button onClick={onClose}><X size={20} /></button></div>
        <input autoFocus placeholder="Título" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="w-full h-12 rounded-2xl border border-black/10 bg-black/5 px-4" />
        <div className="grid grid-cols-2 gap-4">
          <select value={newTask.project} onChange={(e) => setNewTask({ ...newTask, project: e.target.value })} className="h-12 rounded-2xl border border-black/10 bg-black/5 px-4"><option value="General">General</option>{availableProjects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select>
          <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })} className="h-12 rounded-2xl border border-black/10 bg-black/5 px-4"><option value="Alta">Alta</option><option value="Media">Media</option><option value="Baja">Baja</option></select>
        </div>
        <MultiAssigneeSelector selectedNames={newTask.assignees} teamMembers={teamMembers} onChange={(names) => setNewTask({ ...newTask, assignees: names })} />
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#666666] uppercase">Horas Estimadas</label>
          <input type="number" placeholder="0" value={newTask.hours || ''} onChange={(e) => setNewTask({ ...newTask, hours: parseFloat(e.target.value) || 0 })} className="w-full h-12 rounded-2xl border border-black/10 bg-black/5 px-4" />
        </div>
        <div className="flex justify-end gap-3 pt-4"><button onClick={onClose} className="px-6 py-3 rounded-full text-[#666666]">Cancelar</button><button disabled={!newTask.title} onClick={() => onSave(newTask)} className="bg-[#222222] text-white px-6 py-3 rounded-full">Crear Tarea</button></div>
      </div>
    </div>
  );
}

function TaskDetailModal({ task, columns, teamMembers, availableProjects, onClose, onUpdate, isAdmin }: { task: Task, columns: any, teamMembers: TeamMember[], availableProjects: any[], onClose: () => void, onUpdate: (id: string, updates: any) => void, isAdmin: boolean }) {
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.description);
  const [project, setProject] = useState(task.project);
  const [priority, setPriority] = useState(task.priority);
  const [assignees, setAssignees] = useState(task.assignees);
  const [dueDate, setDueDate] = useState(task.dueDate);
  const [hours, setHours] = useState(task.hours);

  // Sincronizar cambios individuales solo al perder el foco para evitar saturar DB
  const saveTitle = () => { if (title !== task.title) onUpdate(task.id, { title }); };
  const saveDesc = () => { if (desc !== task.description) onUpdate(task.id, { description: desc }); };
  const saveHours = () => { if (hours !== task.hours) onUpdate(task.id, { hours }); };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-black/5 flex justify-between items-start">
          <div className="flex-1 mr-4">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#666666] block mb-1">Título de la Tarea</span>
            <input 
              className={`text-2xl font-medium text-[#1A1A1A] bg-transparent border-none outline-none w-full rounded-lg px-1 transition-colors ${isAdmin ? 'focus:bg-black/5' : 'cursor-not-allowed'}`} 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              onBlur={saveTitle} 
              disabled={!isAdmin}
            />
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-8 overflow-y-auto flex flex-col gap-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-2"><span className="text-xs font-bold text-[#666666] uppercase">Estado</span><span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium border bg-[#FFD166]/20 text-[#1A1A1A] border-[#FFD166]/50">{(Object.values(columns) as Column[]).find(c => c.taskIds.includes(task.id))?.title}</span></div>
            <div className="flex flex-col gap-2"><span className="text-xs font-bold text-[#666666] uppercase">Prioridad</span><select disabled={!isAdmin} value={priority} onChange={(e) => { const v = e.target.value as any; setPriority(v); onUpdate(task.id, { priority: v }); }} className={`h-10 rounded-xl border border-black/10 bg-black/5 px-3 outline-none ${!isAdmin ? 'cursor-not-allowed' : ''}`}><option value="Alta">Alta</option><option value="Media">Media</option><option value="Baja">Baja</option></select></div>
            <div className="flex flex-col gap-2"><span className="text-xs font-bold text-[#666666] uppercase">Vencimiento</span><input disabled={!isAdmin} type="text" value={dueDate} onChange={(e) => { setDueDate(e.target.value); onUpdate(task.id, { dueDate: e.target.value }); }} className={`h-10 rounded-xl border border-black/10 bg-black/5 px-3 outline-none ${!isAdmin ? 'cursor-not-allowed' : ''}`} placeholder="DD/MM/YYYY" /></div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[#1A1A1A]">Asignado a (múltiple)</span>
            {isAdmin ? (
              <MultiAssigneeSelector selectedNames={assignees} teamMembers={teamMembers} onChange={(names) => { setAssignees(names); onUpdate(task.id, { assignees: names }); }} />
            ) : (
              <div className="flex flex-wrap gap-2 p-2 bg-black/5 rounded-2xl min-h-[48px] items-center">
                {assignees.map(name => <span key={name} className="bg-[#222222] text-white text-xs font-medium px-3 py-1 rounded-full">{name}</span>)}
                {assignees.length === 0 && <span className="text-sm text-[#666666] ml-2">Sin asignar</span>}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2"><span className="text-sm font-medium text-[#1A1A1A]">Proyecto</span><select disabled={!isAdmin} value={project} onChange={(e) => { setProject(e.target.value); onUpdate(task.id, { project: e.target.value }); }} className={`w-full h-11 rounded-xl border border-black/10 bg-black/5 px-4 outline-none ${!isAdmin ? 'cursor-not-allowed' : ''}`}><option value="General">General</option>{availableProjects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
          <div className="flex flex-col gap-2"><span className="text-sm font-medium text-[#1A1A1A]">Descripción</span><textarea disabled={!isAdmin} rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} onBlur={saveDesc} placeholder="Añade detalles aquí..." className={`w-full rounded-2xl border border-black/10 bg-black/5 p-4 outline-none resize-none transition-all ${isAdmin ? 'focus:ring-2 focus:ring-[#FFD166]' : 'cursor-not-allowed'}`}></textarea></div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[#1A1A1A]">Horas Estimadas</span>
            <input disabled={!isAdmin} type="number" value={hours} onChange={(e) => setHours(parseFloat(e.target.value) || 0)} onBlur={saveHours} className={`w-full h-11 rounded-xl border border-black/10 bg-black/5 px-4 outline-none transition-all ${isAdmin ? 'focus:ring-2 focus:ring-[#FFD166]' : 'cursor-not-allowed'}`} />
          </div>
        </div>
        <div className="p-8 border-t border-black/5 flex justify-end"><button onClick={onClose} className="bg-[#1A1A1A] hover:bg-black text-white px-10 py-3.5 rounded-full text-sm font-medium transition-all shadow-lg active:scale-95">Listo</button></div>
      </div>
    </div>
  );
}
