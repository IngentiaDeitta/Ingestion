import { X, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
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
  outcome?: string;
}

interface EditProjectModalProps {
  project: Project;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditProjectModal({ project, onClose, onSuccess }: EditProjectModalProps) {
  const { isAdmin } = useUser(); // Added isAdmin from useUser
  const [savingProject, setSavingProject] = useState(false);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [editFormData, setEditFormData] = useState({
    name: project.name,
    client: project.client,
    budget: project.budget.toString(),
    due_date: project.due_date ? convertToInputDate(project.due_date) : '',
    status: project.status,
    progress: project.progress,
    description: project.description || '',
    outcome: project.outcome || 'Propuesta'
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, name').order('name');
    setClients(data || []);
  };

  function convertToInputDate(dateStr: string) {
    if (!dateStr) return '';
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  }

  function formatDateForDb(dateStr: string) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = project.id;

    try {
      setSavingProject(true);
      const { error } = await supabase
        .from('projects')
        .update({
          name: editFormData.name,
          client: editFormData.client,
          budget: parseFloat(editFormData.budget) || 0,
          due_date: editFormData.due_date ? formatDateForDb(editFormData.due_date) : '',
          status: editFormData.outcome === 'Perdido' ? 'Perdido' : (editFormData.outcome !== 'Ganado' ? 'Preventa' : editFormData.status),
          progress: (editFormData.outcome === 'Perdido' || editFormData.outcome === 'Propuesta') ? 0 : editFormData.progress,
          description: editFormData.description,
          outcome: editFormData.outcome
        })
        .eq('id', id);

      if (error) throw error;

      // Actualizar nombre en tareas si cambió
      if (editFormData.name !== project.name) {
        const { error: taskUpdateError } = await supabase
          .from('tasks')
          .update({ project: editFormData.name })
          .eq('project', project.name);
        
        if (taskUpdateError) {
          console.error('Error updating task project names:', taskUpdateError);
        }
      }

      // Actualizar nombre del cliente en tareas si cambió
      if (editFormData.client !== project.client) {
        const { error: clientTaskError } = await supabase
          .from('tasks')
          .update({ client: editFormData.client })
          .eq('client', project.client);
        
        if (clientTaskError) {
          console.error('Error updating task client names:', clientTaskError);
        }
      }

      // También actualizar descripciones en finanzas que contengan los nombres viejos
      if (editFormData.name !== project.name || editFormData.client !== project.client) {
        const { data: financesToUpdate } = await supabase
          .from('finances')
          .select('id, description')
          .eq('project_id', id);

        if (financesToUpdate) {
          for (const fin of financesToUpdate) {
            let newDesc = fin.description;
            if (editFormData.name !== project.name) {
              newDesc = newDesc.replace(project.name, editFormData.name);
            }
            if (editFormData.client !== project.client) {
              newDesc = newDesc.replace(project.client, editFormData.client);
            }
            
            if (newDesc !== fin.description) {
              await supabase
                .from('finances')
                .update({ description: newDesc })
                .eq('id', fin.id);
            }
          }
        }
      }

      // HISTORIAL
      const historyEntries = [];
      if (editFormData.outcome !== project.outcome) {
        historyEntries.push({
          project_id: id,
          field: 'outcome',
          old_value: project.outcome || 'Propuesta',
          new_value: editFormData.outcome
        });
      }
      if (editFormData.status !== project.status && editFormData.outcome === 'Ganado') {
        historyEntries.push({
          project_id: id,
          field: 'status',
          old_value: project.status || 'Preventa',
          new_value: editFormData.status
        });
      }

      if (historyEntries.length > 0) {
        await supabase.from('project_status_history').insert(historyEntries);
      }

      // FINANZAS
      const { data: existingFinance } = await supabase
        .from('finances')
        .select('id, amount')
        .eq('project_id', id)
        .eq('type', 'income')
        .maybeSingle();

      if (editFormData.outcome === 'Ganado') {
        if (!existingFinance) {
          if (window.confirm("¿Deseas registrar el presupuesto de este proyecto como un ingreso previsto en Finanzas?")) {
            const clientObj = clients.find(c => c.name === editFormData.client);
            await supabase.from('finances').insert([{
              description: `Ingreso Proyecto: ${editFormData.name}`,
              amount: parseFloat(editFormData.budget) || 0,
              type: 'income',
              status: 'Pending',
              project_id: id,
              client_id: clientObj?.id || null,
              date: new Date().toISOString().split('T')[0]
            }]);
          }
        } else if (parseFloat(editFormData.budget) !== existingFinance.amount) {
          if (window.confirm("El presupuesto del proyecto cambió. ¿Deseas actualizar también el registro en Finanzas?")) {
            await supabase.from('finances')
              .update({ 
                amount: parseFloat(editFormData.budget) || 0,
                description: `Ingreso Proyecto: ${editFormData.name}`
              })
              .eq('id', existingFinance.id);
          }
        }
      } else if (existingFinance && (editFormData.outcome === 'Perdido' || editFormData.outcome === 'Propuesta')) {
        if (window.confirm("Este proyecto ya no está marcado como 'Ganado'. ¿Deseas eliminar el registro de ingreso asociado en Finanzas?")) {
          await supabase.from('finances').delete().eq('id', existingFinance.id);
        }
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Error al actualizar el proyecto');
    } finally {
      setSavingProject(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" 
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-black/5 flex justify-between items-center">
          <h3 className="text-xl font-medium text-[#1A1A1A]">Editar Proyecto</h3>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
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
                disabled={!isAdmin}
                className={`w-full h-12 rounded-2xl border border-black/10 bg-white text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all ${!isAdmin ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`} 
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Cliente</label>
              <select 
                required 
                value={editFormData.client}
                onChange={(e) => setEditFormData({ ...editFormData, client: e.target.value })}
                disabled={!isAdmin}
                className={`w-full h-12 rounded-2xl border border-black/10 bg-white text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all ${!isAdmin ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
              >
                <option value="">Seleccionar...</option>
                {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Resultado Comercial</label>
              <select 
                required 
                value={editFormData.outcome}
                onChange={(e) => setEditFormData({ ...editFormData, outcome: e.target.value })}
                disabled={!isAdmin}
                className={`w-full h-12 rounded-2xl border border-black/10 bg-white text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all ${!isAdmin ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
              >
                <option value="Propuesta">Propuesta</option>
                <option value="Ganado">Ganado</option>
                <option value="Perdido">Perdido</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Estado Operativo</label>
              <select 
                required 
                disabled={!isAdmin || editFormData.outcome !== 'Ganado'}
                value={editFormData.outcome === 'Perdido' ? 'Perdido' : (editFormData.outcome !== 'Ganado' ? 'Preventa' : editFormData.status)}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                className={`w-full h-12 rounded-2xl border border-black/10 bg-white text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all ${(!isAdmin || editFormData.outcome !== 'Ganado') ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
              >
                <option value="Preventa">Preventa</option>
                <option value="En Progreso">En Progreso</option>
                <option value="Finalizado">Finalizado</option>
                <option value="En Riesgo">En Riesgo</option>
                <option value="Cancelado">Cancelado</option>
                <option value="Perdido">Perdido</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Presupuesto ($)</label>
              <input 
                required 
                type="number" 
                value={editFormData.budget}
                onChange={(e) => setEditFormData({ ...editFormData, budget: e.target.value })}
                disabled={!isAdmin}
                className={`w-full h-12 rounded-2xl border border-black/10 bg-white text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all ${!isAdmin ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`} 
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Fecha Entrega</label>
              <input 
                type="date" 
                value={editFormData.due_date}
                onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
                disabled={!isAdmin}
                className={`w-full h-12 rounded-2xl border border-black/10 bg-white text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all ${!isAdmin ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`} 
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
                disabled={!isAdmin}
                className={`w-full accent-[#222222] ${!isAdmin ? 'cursor-not-allowed opacity-50' : ''}`} 
              />
            </div>

            <div className="flex flex-col gap-2 col-span-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Descripción</label>
              <textarea 
                rows={4} 
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                disabled={!isAdmin}
                className={`w-full rounded-2xl border border-black/10 bg-white text-[#1A1A1A] p-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none resize-none transition-all ${!isAdmin ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-full text-sm font-medium text-[#666666] hover:bg-black/5 transition-colors"
            >
              Cerrar
            </button>
            {isAdmin ? (
              <button 
                type="submit" 
                disabled={savingProject}
                className="flex items-center gap-2 bg-[#222222] hover:bg-black disabled:opacity-50 text-white px-8 py-3 rounded-full text-sm font-medium transition-colors shadow-lg"
              >
                <Save size={18} />
                {savingProject ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-black/5 text-[#666666] px-6 py-3 rounded-full text-sm font-medium italic border border-black/5">
                Vista de solo lectura
              </div>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
