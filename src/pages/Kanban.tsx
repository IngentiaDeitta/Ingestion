import { Plus, MoreHorizontal, Calendar, MessageSquare, Paperclip, X, Save, User, Tag } from 'lucide-react';
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { mockTasks } from '../data/mockData';

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

const getInitialData = (): BoardData => {
  const tasks: Record<string, Task> = {};
  mockTasks.forEach((t: any) => {
    tasks[t.id] = {
      ...t,
      comments: t.comments || 0,
      attachments: t.attachments || 0,
    };
  });

  return {
    tasks,
    columns: {
      'col-1': { id: 'col-1', title: 'Por Hacer', taskIds: mockTasks.filter((t: any) => t.status === 'todo').map((t: any) => t.id) },
      'col-2': { id: 'col-2', title: 'En Progreso', taskIds: mockTasks.filter((t: any) => t.status === 'in-progress').map((t: any) => t.id) },
      'col-3': { id: 'col-3', title: 'En Revisión', taskIds: mockTasks.filter((t: any) => t.status === 'review').map((t: any) => t.id) },
      'col-4': { id: 'col-4', title: 'Completado', taskIds: mockTasks.filter((t: any) => t.status === 'done').map((t: any) => t.id) },
    },
    columnOrder: ['col-1', 'col-2', 'col-3', 'col-4'],
  };
};

export default function Kanban() {
  const [data, setData] = useState(getInitialData());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({ title: '', project: '', priority: 'Media' });

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const startColumn = data.columns[source.droppableId];
    const finishColumn = data.columns[destination.droppableId];

    if (startColumn === finishColumn) {
      const newTaskIds = Array.from(startColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = { ...startColumn, taskIds: newTaskIds };
      setData({ ...data, columns: { ...data.columns, [newColumn.id]: newColumn } });
      return;
    }

    const startTaskIds = Array.from(startColumn.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = { ...startColumn, taskIds: startTaskIds };

    const finishTaskIds = Array.from(finishColumn.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinish = { ...finishColumn, taskIds: finishTaskIds };

    setData({
      ...data,
      columns: { ...data.columns, [newStart.id]: newStart, [newFinish.id]: newFinish },
    });
  };

  const handleSaveNewTask = () => {
    if (!newTask.title) return;
    const newId = `task-${Date.now()}`;
    const task: Task = {
      id: newId,
      title: newTask.title || '',
      project: newTask.project || 'General',
      priority: newTask.priority as any || 'Media',
      comments: 0,
      attachments: 0,
      dueDate: 'Sin fecha',
    };

    setData(prev => ({
      ...prev,
      tasks: { ...prev.tasks, [newId]: task },
      columns: {
        ...prev.columns,
        'col-1': { ...prev.columns['col-1'], taskIds: [newId, ...prev.columns['col-1'].taskIds] }
      }
    }));
    setIsNewTaskOpen(false);
    setNewTask({ title: '', project: '', priority: 'Media' });
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    setData(prev => ({
      ...prev,
      tasks: { ...prev.tasks, [id]: { ...prev.tasks[id], ...updates } }
    }));
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask({ ...selectedTask, ...updates });
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h3 className="text-[42px] font-normal tracking-tight text-[#1A1A1A]">Tablero Kanban</h3>
          <p className="text-[#666666] mt-1">Gestiona tareas y flujos de trabajo de tus proyectos.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 mr-2">
            <div className="w-8 h-8 rounded-full bg-white border-2 border-[#E5E9E6] flex items-center justify-center text-xs font-medium text-[#1A1A1A] z-30">JP</div>
            <div className="w-8 h-8 rounded-full bg-white border-2 border-[#E5E9E6] flex items-center justify-center text-xs font-medium text-[#1A1A1A] z-20">MR</div>
            <div className="w-8 h-8 rounded-full bg-white border-2 border-[#E5E9E6] flex items-center justify-center text-xs font-medium text-[#1A1A1A] z-10">CG</div>
            <div className="w-8 h-8 rounded-full bg-black/5 border-2 border-[#E5E9E6] flex items-center justify-center text-xs font-medium text-[#666666] z-0">+2</div>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-black/5 flex justify-between items-start">
              <div>
                <span className="text-xs font-medium text-[#666666] mb-1 block">{selectedTask.project}</span>
                <h3 className="text-2xl font-medium text-[#1A1A1A]">{selectedTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <X size={20} className="text-[#1A1A1A]" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              <div className="flex flex-wrap gap-6">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-[#666666]">Estado</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border bg-[#FFD166]/20 text-[#1A1A1A] border-[#FFD166]/50">
                    {(Object.values(data.columns) as Column[]).find(c => c.taskIds.includes(selectedTask.id))?.title}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-[#666666]">Prioridad</span>
                  <select
                    value={selectedTask.priority}
                    onChange={(e) => handleUpdateTask(selectedTask.id, { priority: e.target.value as any })}
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
                    type="text"
                    value={selectedTask.dueDate}
                    onChange={(e) => handleUpdateTask(selectedTask.id, { dueDate: e.target.value })}
                    className="h-8 rounded-full border border-black/10 bg-white text-xs font-medium px-3 outline-none w-28"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#1A1A1A] flex items-center gap-2"><User size={16} /> Asignado a</span>
                <input
                  type="text"
                  placeholder="Añadir usuario..."
                  value={selectedTask.assignee || ''}
                  onChange={(e) => handleUpdateTask(selectedTask.id, { assignee: e.target.value })}
                  className="w-full h-10 rounded-xl border border-black/10 bg-black/5 text-[#1A1A1A] px-4 outline-none text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#1A1A1A] flex items-center gap-2"><Tag size={16} /> Etiquetas</span>
                <input
                  type="text"
                  placeholder="Añadir etiquetas separadas por coma..."
                  value={selectedTask.tags?.join(', ') || ''}
                  onChange={(e) => handleUpdateTask(selectedTask.id, { tags: e.target.value.split(',').map(t => t.trim()) })}
                  className="w-full h-10 rounded-xl border border-black/10 bg-black/5 text-[#1A1A1A] px-4 outline-none text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#1A1A1A]">Descripción</span>
                <textarea
                  rows={4}
                  placeholder="Añade una descripción más detallada..."
                  value={selectedTask.description || ''}
                  onChange={(e) => handleUpdateTask(selectedTask.id, { description: e.target.value })}
                  className="w-full rounded-2xl border border-black/10 bg-black/5 text-[#1A1A1A] p-4 outline-none text-sm resize-none"
                ></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-black/5 flex justify-end">
              <button onClick={() => setSelectedTask(null)} className="flex items-center gap-2 bg-[#222222] hover:bg-black text-white px-6 py-3 rounded-full text-sm font-medium transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {isNewTaskOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-black/5 flex justify-between items-center">
              <h3 className="text-xl font-medium text-[#1A1A1A]">Nueva Tarea</h3>
              <button onClick={() => setIsNewTaskOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <X size={20} className="text-[#1A1A1A]" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#1A1A1A]">Título</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full h-12 rounded-2xl border border-black/10 bg-black/5 text-[#1A1A1A] px-4 outline-none focus:ring-2 focus:ring-[#FFD166]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#1A1A1A]">Proyecto</label>
                <input
                  type="text"
                  value={newTask.project}
                  onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
                  className="w-full h-12 rounded-2xl border border-black/10 bg-black/5 text-[#1A1A1A] px-4 outline-none focus:ring-2 focus:ring-[#FFD166]"
                />
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

            <div className="p-6 border-t border-black/5 flex justify-end gap-3">
              <button onClick={() => setIsNewTaskOpen(false)} className="px-6 py-3 rounded-full text-sm font-medium text-[#666666] hover:bg-black/5 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveNewTask} className="flex items-center gap-2 bg-[#222222] hover:bg-black text-white px-6 py-3 rounded-full text-sm font-medium transition-colors">
                <Save size={18} />
                Crear Tarea
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
