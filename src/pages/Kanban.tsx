import { Plus, MoreHorizontal, Calendar, MessageSquare, Paperclip, X, Save, User, Tag } from 'lucide-react';
import { useState, useEffect } from 'react';
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
  assignee?: string;
  tags?: string[];
  description?: string;
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

const STATUS_MAP: Record<string, string> = {
  'todo': 'col-1',
  'in-progress': 'col-2',
  'review': 'col-3',
  'done': 'col-4',
};

const COLUMN_TO_STATUS: Record<string, string> = {
  'col-1': 'todo',
  'col-2': 'in-progress',
  'col-3': 'review',
  'col-4': 'done',
};

export default function Kanban() {
  const [data, setData] = useState<BoardData>({
    tasks: {},
    columns: INITIAL_COLUMNS,
    columnOrder: ['col-1', 'col-2', 'col-3', 'col-4'],
  });
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchTeam();
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase.from('projects').select('*').order('name');
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTeam = async () => {
    try {
      const { data, error } = await supabase.from('team').select('*');
      if (error) throw error;
      setTeam(data || []);
    } catch (error) {
      console.error('Error fetching team:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data: tasksData, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const tasks: Record<string, Task> = {};
      const columns = JSON.parse(JSON.stringify(INITIAL_COLUMNS));

      tasksData?.forEach((t: any) => {
        const task: Task = {
          id: t.id,
          title: t.title,
          project: t.project,
          priority: t.priority,
          comments: t.comments_count || 0,
          attachments: t.attachments_count || 0,
          dueDate: t.due_date,
          assignee: t.assignee,
          tags: t.tags,
          description: t.description,
        };
        tasks[task.id] = task;
        const columnId = STATUS_MAP[t.status] || 'col-1';
        columns[columnId].taskIds.push(task.id);
      });

      setData({
        tasks,
        columns,
        columnOrder: ['col-1', 'col-2', 'col-3', 'col-4'],
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const startColumn = data.columns[source.droppableId];
    const finishColumn = data.columns[destination.droppableId];

    // Optimistic Update
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

    // Persist to Supabase
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: COLUMN_TO_STATUS[destination.droppableId] })
        .eq('id', draggableId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating task status:', error);
      fetchTasks(); // Revert on error
    }
  };

  const handleSaveNewTask = async (taskData: Partial<Task>) => {
    try {
      const { data: createdTask, error } = await supabase
        .from('tasks')
        .insert([{
          title: taskData.title,
          project: taskData.project || 'General',
          priority: taskData.priority || 'Media',
          status: 'todo',
          assignee: taskData.assignee,
          due_date: taskData.dueDate ? formatDate(taskData.dueDate) : 'Sin fecha'
        }])
        .select()
        .single();

      if (error) throw error;

      if (createdTask) {
        const task: Task = {
          id: createdTask.id,
          title: createdTask.title,
          project: createdTask.project,
          priority: createdTask.priority,
          comments: 0,
          attachments: 0,
          dueDate: createdTask.due_date,
        };

        setData(prev => ({
          ...prev,
          tasks: { ...prev.tasks, [task.id]: task },
          columns: {
            ...prev.columns,
            'col-1': { ...prev.columns['col-1'], taskIds: [task.id, ...prev.columns['col-1'].taskIds] }
          }
        }));
      }

      setIsNewTaskOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    // Basic mapping for DB fields
    const dbUpdates: any = {};
    if (updates.priority) dbUpdates.priority = updates.priority;
    if (updates.dueDate) dbUpdates.due_date = updates.dueDate;
    if (updates.assignee !== undefined) dbUpdates.assignee = updates.assignee;
    if (updates.tags) dbUpdates.tags = updates.tags;
    if (updates.description !== undefined) dbUpdates.description = updates.description;

    try {
      const { error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setData(prev => ({
        ...prev,
        tasks: { ...prev.tasks, [id]: { ...prev.tasks[id], ...updates } }
      }));
      
      if (selectedTask && selectedTask.id === id) {
        setSelectedTask({ ...selectedTask, ...updates });
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const isDarkColor = (hex: string) => {
    if (!hex) return false;
    const color = hex.replace('#', '');
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 155;
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h3 className="text-[42px] font-normal tracking-tight text-[#1A1A1A]">Tablero Kanban</h3>
          <p className="text-[#666666] mt-1">Gestiona tareas y flujos de trabajo de tus proyectos.</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && (
            <span className="text-xs text-[#666666] animate-pulse">Sincronizando...</span>
          )}
          <div className="flex -space-x-2 mr-2">
            {team.slice(0, 3).map((m, i) => (
              <div 
                key={m.id} 
                className={`w-8 h-8 rounded-full border-2 border-[#E5E9E6] flex items-center justify-center text-xs font-medium text-[#1A1A1A] z-${30 - (i * 10)}`}
                style={{ backgroundColor: i % 2 === 0 ? 'white' : '#F5F5F5' }}
              >
                {m.name.split(' ').map(n => n[0]).join('')}
              </div>
            ))}
            {team.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-black/5 border-2 border-[#E5E9E6] flex items-center justify-center text-xs font-medium text-[#666666] z-0">
                +{team.length - 3}
              </div>
            )}
          </div>
          <button onClick={() => setIsNewTaskOpen(true)} className="flex items-center justify-center gap-2 bg-[#222222] hover:bg-black text-white px-6 py-3 rounded-full text-sm font-medium transition-colors shadow-lg shadow-black/10">
            <Plus size={20} />
            Nueva Tarea
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 h-full min-w-max">
            {data.columnOrder.map((columnId) => {
              const column = data.columns[columnId];
              const tasks = column.taskIds.map(taskId => data.tasks[taskId]);

              return (
                <div key={column.id} className="w-80 flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-3 border-b border-black/5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-[#1A1A1A]">{column.title}</h4>
                      <span className="bg-white/50 border border-black/5 text-[#1A1A1A] text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {tasks.length}
                      </span>
                    </div>
                    <button className="text-[#666666] hover:text-[#1A1A1A] transition-colors">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar transition-colors ${snapshot.isDraggingOver ? 'bg-black/5 rounded-[24px]' : ''}`}
                      >
                        {tasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => setSelectedTask(task)}
                                className={`bg-white/60 backdrop-blur-xl p-5 rounded-[24px] border border-white/40 shadow-sm hover:shadow-md hover:border-white/80 transition-all cursor-grab active:cursor-grabbing group ${snapshot.isDragging ? 'shadow-xl rotate-2 scale-105 z-50' : ''}`}
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold border ${task.priority === 'Alta' ? 'bg-[#FFD166] text-[#222222] border-[#FFD166]' :
                                    task.priority === 'Media' ? 'bg-black/5 text-[#1A1A1A] border-black/10' :
                                      'bg-white/50 text-[#666666] border-black/5'
                                    }`}>
                                    {task.priority}
                                  </span>
                                  <button className="text-[#666666] hover:text-[#1A1A1A] opacity-0 group-hover:opacity-100 transition-all">
                                    <MoreHorizontal size={16} />
                                  </button>
                                </div>

                                <h5 className="font-medium text-[#1A1A1A] mb-1 leading-tight">{task.title}</h5>
                                <p className="text-xs text-[#666666] mb-5">{task.project}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-black/5">
                                  <div className="flex items-center gap-3 text-xs text-[#666666] font-medium">
                                    {task.assignee && (
                                      <div 
                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm ${isDarkColor(team.find(m => m.name === task.assignee)?.avatar_color || '') ? 'text-white' : 'text-[#1A1A1A]'}`}
                                        style={{ backgroundColor: team.find(m => m.name === task.assignee)?.avatar_color || '#F5F5F5' }}
                                        title={task.assignee}
                                      >
                                        {task.assignee.split(' ').map(n => n[0]).join('')}
                                      </div>
                                    )}
                                    {task.comments > 0 && (
                                      <div className="flex items-center gap-1 hover:text-[#1A1A1A] transition-colors">
                                        <MessageSquare size={14} />
                                        <span>{task.comments}</span>
                                      </div>
                                    )}
                                    {task.attachments > 0 && (
                                      <div className="flex items-center gap-1 hover:text-[#1A1A1A] transition-colors">
                                        <Paperclip size={14} />
                                        <span>{task.attachments}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className={`flex items-center gap-1 text-xs font-medium ${column.id === 'col-4' ? 'text-[#666666]' :
                                    task.priority === 'Alta' ? 'text-[#1A1A1A]' : 'text-[#666666]'
                                    }`}>
                                    <Calendar size={12} />
                                    <span>{task.dueDate}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        <button onClick={() => setIsNewTaskOpen(true)} className="flex items-center justify-center gap-2 w-full py-4 border border-dashed border-black/10 rounded-[24px] text-sm font-medium text-[#666666] hover:text-[#1A1A1A] hover:border-black/20 hover:bg-white/40 transition-all mt-2">
                          <Plus size={18} />
                          Añadir Tarea
                        </button>
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </div>
      </DragDropContext>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask} 
          columns={data.columns}
          teamMembers={team}
          availableProjects={projects}
          onClose={() => setSelectedTask(null)} 
          onUpdate={handleUpdateTask} 
        />
      )}

      {/* New Task Modal */}
      {isNewTaskOpen && (
        <NewTaskModal 
          teamMembers={team}
          availableProjects={projects}
          onClose={() => setIsNewTaskOpen(false)} 
          onSave={handleSaveNewTask} 
        />
      )}
    </div>
  );
}

// Optimization: Separate components to manage local state and prevent board re-renders
function NewTaskModal({ teamMembers, availableProjects, onClose, onSave }: { teamMembers: TeamMember[], availableProjects: any[], onClose: () => void, onSave: (task: any) => void }) {
  const [newTask, setNewTask] = useState({ title: '', project: availableProjects[0]?.name || 'General', priority: 'Media' as const, assignee: '', dueDate: '' });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-6 border-b border-black/5 flex justify-between items-center">
          <h3 className="text-xl font-medium text-[#1A1A1A]">Nueva Tarea</h3>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <X size={20} className="text-[#1A1A1A]" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#1A1A1A]">Título</label>
            <input
              autoFocus
              type="text"
              placeholder="¿Qué hay que hacer?"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full h-12 rounded-2xl border border-black/10 bg-black/5 text-[#1A1A1A] px-4 outline-none focus:ring-2 focus:ring-[#FFD166]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Proyecto</label>
              <select
                value={newTask.project}
                onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
                className="w-full h-12 rounded-2xl border border-black/10 bg-black/5 text-[#1A1A1A] px-4 outline-none focus:ring-2 focus:ring-[#FFD166]"
              >
                {availableProjects.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
                <option value="General">General</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Prioridad</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                className="w-full h-12 rounded-2xl border border-black/10 bg-black/5 text-[#1A1A1A] px-4 outline-none focus:ring-2 focus:ring-[#FFD166]"
              >
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Asignado a</label>
              <select
                value={newTask.assignee}
                onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                className="w-full h-12 rounded-2xl border border-black/10 bg-black/5 text-[#1A1A1A] px-4 outline-none focus:ring-2 focus:ring-[#FFD166]"
              >
                <option value="">Sin asignar</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Vencimiento</label>
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                className="w-full h-12 rounded-2xl border border-black/10 bg-black/5 text-[#1A1A1A] px-4 outline-none focus:ring-2 focus:ring-[#FFD166]"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-black/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 rounded-full text-sm font-medium text-[#666666] hover:bg-black/5 transition-colors">
            Cancelar
          </button>
          <button 
            disabled={!newTask.title}
            onClick={() => onSave(newTask)} 
            className="flex items-center gap-2 bg-[#222222] hover:bg-black disabled:opacity-50 text-white px-6 py-3 rounded-full text-sm font-medium transition-colors"
          >
            <Save size={18} />
            Crear Tarea
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskDetailModal({ task, columns, teamMembers, availableProjects, onClose, onUpdate }: { task: Task, columns: any, teamMembers: TeamMember[], availableProjects: any[], onClose: () => void, onUpdate: (id: string, updates: any) => void }) {
  const [localTask, setLocalTask] = useState(task);

  const handleLocalUpdate = (updates: Partial<Task>) => {
    const updated = { ...localTask, ...updates };
    setLocalTask(updated);
    onUpdate(task.id, updates);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-black/5 flex justify-between items-start">
          <div>
            <span className="text-xs font-medium text-[#666666] mb-1 block">{localTask.project}</span>
            <input 
              className="text-2xl font-medium text-[#1A1A1A] bg-transparent border-none outline-none w-full"
              value={localTask.title}
              onChange={(e) => handleLocalUpdate({ title: e.target.value })}
            />
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <X size={20} className="text-[#1A1A1A]" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-[#666666]">Estado</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border bg-[#FFD166]/20 text-[#1A1A1A] border-[#FFD166]/50">
                {(Object.values(columns) as Column[]).find(c => c.taskIds.includes(task.id))?.title}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-[#666666]">Prioridad</span>
              <select
                value={localTask.priority}
                onChange={(e) => handleLocalUpdate({ priority: e.target.value as any })}
                className="h-8 rounded-full border border-black/10 bg-white text-xs font-medium px-3 outline-none"
              >
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-[#666666]">Vencimiento</span>
              <input
                type="date"
                value={localTask.dueDate && localTask.dueDate.split('/').length === 3 
                  ? `${localTask.dueDate.split('/')[2]}-${localTask.dueDate.split('/')[1]}-${localTask.dueDate.split('/')[0]}` 
                  : localTask.dueDate}
                onChange={(e) => {
                  const [year, month, day] = e.target.value.split('-');
                  handleLocalUpdate({ dueDate: `${day}/${month}/${year}` });
                }}
                className="h-8 rounded-full border border-black/10 bg-white text-xs font-medium px-3 outline-none w-32"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[#1A1A1A] flex items-center gap-2"><User size={16} /> Asignado a</span>
            <select
              value={localTask.assignee || ''}
              onChange={(e) => handleLocalUpdate({ assignee: e.target.value })}
              className="w-full h-10 rounded-xl border border-black/10 bg-black/5 text-[#1A1A1A] px-4 outline-none text-sm"
            >
              <option value="">Sin asignar</option>
              {teamMembers.map(m => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[#1A1A1A] flex items-center gap-2"><Plus size={16} /> Proyecto</span>
            <select
              value={localTask.project}
              onChange={(e) => handleLocalUpdate({ project: e.target.value })}
              className="w-full h-10 rounded-xl border border-black/10 bg-black/5 text-[#1A1A1A] px-4 outline-none text-sm"
            >
              <option value="General">General</option>
              {availableProjects.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[#1A1A1A] flex items-center gap-2"><Tag size={16} /> Etiquetas</span>
            <input
              type="text"
              placeholder="Añadir etiquetas separadas por coma..."
              value={localTask.tags?.join(', ') || ''}
              onChange={(e) => handleLocalUpdate({ tags: e.target.value.split(',').map(t => t.trim()) })}
              className="w-full h-10 rounded-xl border border-black/10 bg-black/5 text-[#1A1A1A] px-4 outline-none text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[#1A1A1A]">Descripción</span>
            <textarea
              rows={4}
              placeholder="Añade una descripción más detallada..."
              value={localTask.description || ''}
              onChange={(e) => handleLocalUpdate({ description: e.target.value })}
              className="w-full rounded-2xl border border-black/10 bg-black/5 text-[#1A1A1A] p-4 outline-none text-sm resize-none"
            ></textarea>
          </div>
        </div>

        <div className="p-6 border-t border-black/5 flex justify-end">
          <button onClick={onClose} className="flex items-center gap-2 bg-[#222222] hover:bg-black text-white px-6 py-3 rounded-full text-sm font-medium transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
