import os

def apply_new_project():
    file_path = 'src/pages/NewProject.tsx'
    content = """import { ArrowLeft, Save, Calendar, DollarSign, AlignLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { sendNotification } from '../lib/notifications';

export default function NewProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [projectColor, setProjectColor] = useState('indigo');
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    budget: '',
    start_date: '',
    due_date: '',
    description: ''
  });

  const colors = [
    { id: 'indigo', name: 'Índigo', bg: 'bg-indigo-500' },
    { id: 'emerald', name: 'Menta', bg: 'bg-emerald-500' },
    { id: 'rose', name: 'Rosa', bg: 'bg-rose-500' },
    { id: 'amber', name: 'Ámbar', bg: 'bg-amber-500' },
    { id: 'sky', name: 'Celeste', bg: 'bg-sky-500' },
    { id: 'violet', name: 'Violeta', bg: 'bg-violet-500' },
    { id: 'orange', name: 'Naranja', bg: 'bg-orange-500' },
    { id: 'pink', name: 'Fucsia', bg: 'bg-pink-500' }
  ];

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, name').order('name');
    setClients(data || []);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Persist color inside description
      const fullDesc = formData.description + (projectColor ? `\\n\\n[color:${projectColor}]` : '');

      const { error } = await supabase
        .from('projects')
        .insert([{
          name: formData.name,
          client: formData.client,
          budget: parseFloat(formData.budget) || 0,
          due_date: formData.due_date ? formatDate(formData.due_date) : '',
          description: fullDesc,
          progress: 0,
          status: 'Preventa',
          outcome: 'Propuesta'
        }]);

      if (error) throw error;

      await sendNotification(
        'Proyecto Iniciado',
        `Se ha creado el proyecto '${formData.name}' para el cliente '${formData.client}'.`,
        'project'
      );

      navigate('/projects');
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error al crear el proyecto');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="flex-1 flex flex-col gap-8 w-full max-w-[1000px] mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/projects" className="p-3 bg-white/50 hover:bg-white/80 rounded-full transition-colors border border-black/5 shadow-sm">
          <ArrowLeft size={20} className="text-[#1A1A1A]" />
        </Link>
        <div>
          <h3 className="text-[42px] font-normal tracking-tight text-[#1A1A1A]">Nuevo Proyecto</h3>
          <p className="text-[#666666] mt-1">Configura los detalles iniciales del proyecto.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8 flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-medium text-[#1A1A1A]">Nombre del Proyecto</label>
            <input 
              required 
              type="text" 
              placeholder="Ej. Rediseño App Móvil" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" 
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#1A1A1A]">Cliente</label>
            <select 
              required 
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all appearance-none"
            >
              <option value="">Seleccionar cliente...</option>
              {clients.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#1A1A1A]">Presupuesto ($)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <DollarSign size={18} className="text-[#666666]" />
              </div>
              <input 
                required 
                type="number" 
                placeholder="0.00" 
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] pl-10 pr-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#1A1A1A]">Fecha de Inicio</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Calendar size={18} className="text-[#666666]" />
              </div>
              <input 
                required 
                type="date" 
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] pl-10 pr-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#1A1A1A]">Fecha de Entrega Estimada</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Calendar size={18} className="text-[#666666]" />
              </div>
              <input 
                required 
                type="date" 
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] pl-10 pr-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-medium text-[#1A1A1A]">Descripción y Objetivos</label>
            <div className="relative">
              <div className="absolute top-4 left-4 pointer-events-none">
                <AlignLeft size={18} className="text-[#666666]" />
              </div>
              <textarea 
                rows={4} 
                placeholder="Describe el alcance del proyecto..." 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] pl-10 pr-4 py-3 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all resize-none"
              ></textarea>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-medium text-[#1A1A1A]">Color del Proyecto</label>
            <div className="flex flex-wrap gap-3 mt-1">
              {colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setProjectColor(c.id)}
                  className={`w-10 h-10 rounded-full ${c.bg} transition-all duration-200 flex items-center justify-center border-2 ${projectColor === c.id ? 'border-black scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                  title={c.name}
                >
                  {projectColor === c.id && (
                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-black/5 gap-4">
          <Link to="/projects" className="px-6 py-3 rounded-full text-sm font-medium text-[#666666] hover:text-[#1A1A1A] hover:bg-white/50 transition-colors">
            Cancelar
          </Link>
          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center gap-2 bg-[#222222] hover:bg-black disabled:opacity-50 text-white px-8 py-3 rounded-full text-sm font-medium transition-colors shadow-lg shadow-black/10"
          >
            <Save size={18} />
            {loading ? 'Guardando...' : 'Crear Proyecto'}
          </button>
        </div>
      </form>
    </div>
  );
}
"""
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("NewProject.tsx updated successfully!")

def apply_edit_project_modal():
    file_path = 'src/components/EditProjectModal.tsx'
    content = """import { X, Save } from 'lucide-react';
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
  const { isAdmin } = useUser();
  const [savingProject, setSavingProject] = useState(false);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);

  const parseDescriptionAndColor = (rawDesc: string) => {
    const match = rawDesc?.match(/\\[color:([a-zA-Z0-9#]+)\\]/);
    const color = match ? match[1] : 'indigo';
    const cleanDesc = rawDesc ? rawDesc.replace(/\\n\\n\\[color:[a-zA-Z0-9#]+\\]/, '').trim() : '';
    return { color, cleanDesc };
  };

  const { color: initialColor, cleanDesc: initialDesc } = parseDescriptionAndColor(project.description || '');
  const [projectColor, setProjectColor] = useState(initialColor);

  const [editFormData, setEditFormData] = useState({
    name: project.name,
    client: project.client,
    budget: project.budget.toString(),
    due_date: project.due_date ? convertToInputDate(project.due_date) : '',
    status: project.status,
    progress: project.progress,
    description: initialDesc,
    outcome: project.outcome || 'Propuesta'
  });

  const colors = [
    { id: 'indigo', name: 'Índigo', bg: 'bg-indigo-500' },
    { id: 'emerald', name: 'Menta', bg: 'bg-emerald-500' },
    { id: 'rose', name: 'Rosa', bg: 'bg-rose-500' },
    { id: 'amber', name: 'Ámbar', bg: 'bg-amber-500' },
    { id: 'sky', name: 'Celeste', bg: 'bg-sky-500' },
    { id: 'violet', name: 'Violeta', bg: 'bg-violet-500' },
    { id: 'orange', name: 'Naranja', bg: 'bg-orange-500' },
    { id: 'pink', name: 'Fucsia', bg: 'bg-pink-500' }
  ];

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
      
      const fullDesc = editFormData.description + (projectColor ? `\\n\\n[color:${projectColor}]` : '');

      const { error } = await supabase
        .from('projects')
        .update({
          name: editFormData.name,
          client: editFormData.client,
          budget: parseFloat(editFormData.budget) || 0,
          due_date: editFormData.due_date ? formatDateForDb(editFormData.due_date) : '',
          status: editFormData.outcome === 'Perdido' ? 'Perdido' : (editFormData.outcome !== 'Ganado' ? 'Preventa' : editFormData.status),
          progress: (editFormData.outcome === 'Perdido' || editFormData.outcome === 'Propuesta') ? 0 : editFormData.progress,
          description: fullDesc,
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

            <div className="flex flex-col gap-2 col-span-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Color del Proyecto</label>
              <div className="flex flex-wrap gap-3 mt-1">
                {colors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => setProjectColor(c.id)}
                    className={`w-10 h-10 rounded-full ${c.bg} transition-all duration-200 flex items-center justify-center border-2 ${projectColor === c.id ? 'border-black scale-110 shadow-md' : 'border-transparent hover:scale-105'} ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={c.name}
                  >
                    {projectColor === c.id && (
                      <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
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
"""
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("EditProjectModal.tsx updated successfully!")

def apply_kanban():
    file_path = 'src/pages/Kanban.tsx'
    content = """import { Plus, MoreHorizontal, Calendar, MessageSquare, Paperclip, X, Save, User, Tag, Check, Loader2, Trash2, Clock, Lock } from 'lucide-react';
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
  started_at?: string;
  actual_hours?: number;
  position?: number;
  status: string; // Add status to local Task object
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

const COLOR_MAP: Record<string, { border: string; text: string; bg: string; dot: string }> = {
  indigo: { border: 'border-l-4 border-l-indigo-500 hover:border-indigo-500/80', text: 'text-indigo-700 bg-indigo-500/10 border-indigo-500/20', bg: 'bg-indigo-500/5', dot: 'bg-indigo-500' },
  emerald: { border: 'border-l-4 border-l-emerald-500 hover:border-emerald-500/80', text: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20', bg: 'bg-emerald-500/5', dot: 'bg-emerald-500' },
  rose: { border: 'border-l-4 border-l-rose-500 hover:border-rose-500/80', text: 'text-rose-700 bg-rose-500/10 border-rose-500/20', bg: 'bg-rose-500/5', dot: 'bg-rose-500' },
  amber: { border: 'border-l-4 border-l-amber-500 hover:border-amber-500/80', text: 'text-amber-700 bg-amber-500/10 border-amber-500/20', bg: 'bg-amber-500/5', dot: 'bg-amber-500' },
  sky: { border: 'border-l-4 border-l-sky-500 hover:border-sky-500/80', text: 'text-sky-700 bg-sky-500/10 border-sky-500/20', bg: 'bg-sky-500/5', dot: 'bg-sky-500' },
  violet: { border: 'border-l-4 border-l-violet-500 hover:border-violet-500/80', text: 'text-violet-700 bg-violet-500/10 border-violet-500/20', bg: 'bg-violet-500/5', dot: 'bg-violet-500' },
  orange: { border: 'border-l-4 border-l-orange-500 hover:border-orange-500/80', text: 'text-orange-700 bg-orange-500/10 border-orange-500/20', bg: 'bg-orange-500/5', dot: 'bg-orange-500' },
  pink: { border: 'border-l-4 border-l-pink-500 hover:border-pink-500/80', text: 'text-pink-700 bg-pink-500/10 border-pink-500/20', bg: 'bg-pink-500/5', dot: 'bg-pink-500' }
};

export default function Kanban() {
  const { isAdmin } = useUser();
  const [data, setData] = useState<BoardData>({ tasks: {}, columns: INITIAL_COLUMNS, columnOrder: ['col-1', 'col-2', 'col-3', 'col-4'] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  
  // Filtering & Grouping States
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<'status' | 'project'>('status');

  const parseDescriptionAndColor = (rawDesc: string) => {
    const match = rawDesc?.match(/\\[color:([a-zA-Z0-9#]+)\\]/);
    return match ? match[1] : null;
  };

  const getProjectColor = (projectName: string) => {
    const proj = projects.find(p => p.name === projectName);
    if (proj && proj.description) {
      const parsed = parseDescriptionAndColor(proj.description);
      if (parsed) return parsed;
    }
    // Deterministic fallback based on project name hash
    const colors = ['indigo', 'emerald', 'rose', 'amber', 'sky', 'violet', 'orange', 'pink'];
    let hash = 0;
    for (let i = 0; i < projectName.length; i++) {
      hash = projectName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getDependencies = (tags: string[] = []) => {
    return tags.filter(t => t.startsWith('dep:')).map(t => t.replace('dep:', ''));
  };

  const isTaskBlocked = (task: Task) => {
    const deps = getDependencies(task.tags || []);
    return deps.some(depId => {
      const depTask = data.tasks[depId];
      return depTask && depTask.status !== 'done';
    });
  };

  const getBlockingTasks = (task: Task) => {
    const deps = getDependencies(task.tags || []);
    return deps.map(depId => data.tasks[depId]).filter(t => t && t.status !== 'done');
  };

  useEffect(() => { fetchTasks(); fetchTeam(); fetchProjects(); }, []);
  
  const calculateAndSaveProjectProgress = async (projectName: string) => {
    if (!projectName || projectName === 'General') return;
    
    const { data: tasksData, error } = await supabase.from('tasks').select('status, hours, actual_hours').eq('project', projectName);
    if (error || !tasksData || tasksData.length === 0) return;

    const totalTasks = tasksData.length;
    let totalProgress = 0;

    tasksData.forEach(task => {
      if (task.status === 'done') {
        totalProgress += 100;
      } else {
        const estimated = Number(task.hours) || 0;
        const actual = Number(task.actual_hours) || 0;
        if (estimated > 0) {
          const taskProgress = Math.min(100, (actual / estimated) * 100);
          totalProgress += taskProgress;
        }
      }
    });

    const projectProgress = Math.round(totalProgress / totalTasks);
    await supabase.from('projects').update({ progress: projectProgress }).eq('name', projectName);
  };

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
          started_at: t.started_at,
          actual_hours: t.actual_hours ? Number(t.actual_hours) : undefined,
          position: Number(t.position || 0),
          status: t.status || 'todo'
        };
        tasks[task.id] = task;
        const columnId = STATUS_MAP[t.status] || 'col-1';
        if (columns[columnId]) columns[columnId].taskIds.push(task.id);
      });

      Object.keys(columns).forEach(colId => {
        columns[colId].taskIds.sort((a: string, b: string) => (tasks[a].position || 0) - (tasks[b].position || 0));
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
    if (updates.actual_hours !== undefined) dbUpdates.actual_hours = updates.actual_hours;
    if (updates.assignees !== undefined) {
      dbUpdates.assignees = updates.assignees;
      dbUpdates.assignee = updates.assignees.length > 0 ? updates.assignees[0] : null;
    }

    try {
      setSaving(true);
      const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id);
      if (error) throw error;

      setData(prev => {
        const updatedTask = { ...prev.tasks[id], ...updates };
        
        // Re-calculate local columns if project was updated and we are grouping by project
        const newColumns = { ...prev.columns };
        if (updates.project !== undefined && groupBy === 'project') {
          // Remove from old project column
          const oldProjColId = `proj-${prev.tasks[id].project}`;
          const newProjColId = `proj-${updates.project}`;
          if (newColumns[oldProjColId]) {
            newColumns[oldProjColId].taskIds = newColumns[oldProjColId].taskIds.filter(tid => tid !== id);
          }
          // Add to new project column
          if (newColumns[newProjColId]) {
            newColumns[newProjColId].taskIds.push(id);
          } else {
            newColumns[newProjColId] = { id: newProjColId, title: updates.project, taskIds: [id] };
          }
        }

        return {
          ...prev,
          tasks: { ...prev.tasks, [id]: updatedTask },
          columns: newColumns
        };
      });
      
      if (selectedTask && selectedTask.id === id) {
        setSelectedTask(prev => prev ? { ...prev, ...updates } : null);
      }
      
      // We do fetchTasks here to ensure positions are in order and database state is synced
      fetchTasks();
      calculateAndSaveProjectProgress(updates.project || data.tasks[id].project || 'General');
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de eliminar esta tarea?')) return;
    
    try {
      setSaving(true);
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;

      setData(prev => {
        const newTasks = { ...prev.tasks };
        delete newTasks[id];
        
        const newColumns = { ...prev.columns };
        Object.keys(newColumns).forEach(colId => {
          newColumns[colId].taskIds = newColumns[colId].taskIds.filter(taskId => taskId !== id);
        });

        return { ...prev, tasks: newTasks, columns: newColumns };
      });

      if (selectedTask?.id === id) setSelectedTask(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error al eliminar la tarea');
    } finally {
      setSaving(false);
      const task = data.tasks[id];
      if (task) calculateAndSaveProjectProgress(task.project);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!isAdmin) {
      alert('Solo los administradores o responsables pueden mover tareas.');
      return; 
    }
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    try {
      setSaving(true);
      
      if (groupBy === 'status') {
        const startColumn = data.columns[source.droppableId];
        const finishColumn = data.columns[destination.droppableId];
        const newData = { ...data };

        if (startColumn === finishColumn) {
          const newTaskIds = Array.from(startColumn.taskIds);
          newTaskIds.splice(source.index, 1);
          newTaskIds.splice(destination.index, 0, draggableId);
          newData.columns[startColumn.id].taskIds = newTaskIds;
        } else {
          const startTaskIds = Array.from(startColumn.taskIds);
          startTaskIds.splice(source.index, 1);
          newData.columns[startColumn.id].taskIds = startTaskIds;
          const finishTaskIds = Array.from(finishColumn.taskIds);
          finishTaskIds.splice(destination.index, 0, draggableId);
          newData.columns[finishColumn.id].taskIds = finishTaskIds;
        }
        setData(newData);

        const newStatus = COLUMN_TO_STATUS[destination.droppableId];
        const task = data.tasks[draggableId];
        const updates: any = { status: newStatus };
        
        // Calculate position
        const targetColumn = newData.columns[destination.droppableId];
        const newIndex = destination.index;
        let newPos = 0;
        
        if (targetColumn.taskIds.length === 1) {
          newPos = 1000;
        } else if (newIndex === 0) {
          const nextId = targetColumn.taskIds[1];
          newPos = (data.tasks[nextId]?.position || 0) / 2;
        } else if (newIndex === targetColumn.taskIds.length - 1) {
          const prevId = targetColumn.taskIds[newIndex - 1];
          newPos = (data.tasks[prevId]?.position || 0) + 1000;
        } else {
          const prevId = targetColumn.taskIds[newIndex - 1];
          const nextId = targetColumn.taskIds[newIndex + 1];
          newPos = ((data.tasks[prevId]?.position || 0) + (data.tasks[nextId]?.position || 0)) / 2;
        }
        
        updates.position = newPos;

        if (newStatus === 'in-progress' && !task.started_at) {
          updates.started_at = new Date().toISOString();
        } else if (newStatus === 'done' && task.started_at) {
          if (task.actual_hours === undefined || task.actual_hours === null || task.actual_hours <= 0) {
            const started = new Date(task.started_at);
            const now = new Date();
            const diffMs = now.getTime() - started.getTime();
            const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            updates.actual_hours = diffDays;
          }
        }
        
        const { error } = await supabase.from('tasks').update(updates).eq('id', draggableId);
        if (error) {
          if (error.code === '42703') {
            const { error: retryError } = await supabase.from('tasks').update({ status: newStatus }).eq('id', draggableId);
            if (retryError) throw retryError;
          } else {
            throw error;
          }
        }
        
        setData(prev => ({
          ...prev,
          tasks: { ...prev.tasks, [draggableId]: { ...prev.tasks[draggableId], ...updates } }
        }));
        calculateAndSaveProjectProgress(data.tasks[draggableId].project);

      } else {
        // Group by project view dragging: Change project dynamically!
        const sourceProj = source.droppableId.replace('proj-', '');
        const destProj = destination.droppableId.replace('proj-', '');
        
        if (sourceProj !== destProj) {
          // Update project of task
          const { error } = await supabase.from('tasks').update({ project: destProj }).eq('id', draggableId);
          if (error) throw error;

          // Local update
          setData(prev => {
            const updatedTasks = { ...prev.tasks };
            updatedTasks[draggableId] = { ...updatedTasks[draggableId], project: destProj };
            return { ...prev, tasks: updatedTasks };
          });

          calculateAndSaveProjectProgress(sourceProj);
          calculateAndSaveProjectProgress(destProj);
          fetchTasks();
        }
      }
    } catch (error) {
      console.error('Error updating status/project:', error);
      alert('Error al guardar el movimiento. Recargando...');
      fetchTasks();
    } finally {
      setSaving(false);
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
        assignee: taskData.assignees?.length > 0 ? taskData.assignees[0] : null,
        due_date: taskData.dueDate || null,
        hours: taskData.hours || 0,
        tags: [],
        description: ''
      }]);
      
      if (error) throw error;
      
      await fetchTasks();
      calculateAndSaveProjectProgress(taskData.project || 'General');
      setIsNewTaskOpen(false);
    } catch (error: any) {
      console.error('Error creating task:', error);
      alert('Error al crear tarea: ' + (error.message || 'Error desconocido'));
    }
  };

  // Helper to get task list to render per column
  const getFilteredTasks = (taskIds: string[]) => {
    return taskIds
      .map(id => data.tasks[id])
      .filter(t => {
        if (!t) return false;
        if (projectFilter !== 'all' && t.project !== projectFilter) return false;
        return true;
      });
  };

  // Dynamically build board columns if grouped by project
  const getDynamicColumns = () => {
    if (groupBy === 'status') {
      return {
        columns: data.columns,
        columnOrder: data.columnOrder
      };
    }

    // Grouping by Project: Create dynamic columns based on active projects
    const uniqueProjects = Array.from(new Set([
      'General',
      ...projects.map(p => p.name),
      ...Object.values(data.tasks).map(t => t.project)
    ])).filter(Boolean);

    const projectColumns: Record<string, Column> = {};
    const columnOrder: string[] = [];

    uniqueProjects.forEach(projName => {
      const colId = `proj-${projName}`;
      
      // Gather task IDs belonging to this project
      const taskIds = Object.values(data.tasks)
        .filter(t => t.project === projName)
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map(t => t.id);

      // Only show columns for projects if they are the selected project filter or filter is 'all'
      if (projectFilter === 'all' || projName === projectFilter) {
        projectColumns[colId] = {
          id: colId,
          title: projName,
          taskIds
        };
        columnOrder.push(colId);
      }
    });

    return {
      columns: projectColumns,
      columnOrder
    };
  };

  const { columns: activeColumns, columnOrder: activeColumnOrder } = getDynamicColumns();

  return (
    <div className="flex-1 flex flex-col gap-8 w-full max-w-[1400px] mx-auto min-h-[calc(100vh-10rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h3 className="text-[42px] font-normal tracking-tight text-[#1A1A1A]">Tablero Kanban</h3>
          <p className="text-[#666666] mt-1">Gestiona tus tareas, responsables y dependencias.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {/* Project Selector Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#666666] uppercase">Proyecto:</span>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="h-10 rounded-xl border border-black/10 bg-white px-3 outline-none text-sm transition-all focus:border-[#FFD166]"
            >
              <option value="all">Todos los proyectos</option>
              <option value="General">General</option>
              {projects.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Group By Selector */}
          <div className="flex bg-black/5 p-1 rounded-xl border border-black/5 text-sm">
            <button
              onClick={() => setGroupBy('status')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${groupBy === 'status' ? 'bg-white text-black shadow-sm' : 'text-[#666666] hover:text-black'}`}
            >
              Estado
            </button>
            <button
              onClick={() => setGroupBy('project')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${groupBy === 'project' ? 'bg-white text-black shadow-sm' : 'text-[#666666] hover:text-black'}`}
            >
              Proyecto
            </button>
          </div>

          {saving && (
            <div className="flex items-center gap-2 text-xs text-[#666666] bg-black/5 px-3 py-1.5 rounded-full animate-pulse">
              <Loader2 size={12} className="animate-spin" /> Guardando...
            </div>
          )}

          {isAdmin && (
            <button onClick={() => setIsNewTaskOpen(true)} className="flex items-center justify-center gap-2 bg-[#222222] hover:bg-black text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors shadow-lg active:scale-95">
              <Plus size={18} /> Nueva Tarea
            </button>
          )}
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory">
          <div className="flex gap-6 h-full pb-8">
            {activeColumnOrder.map((columnId) => {
              const column = activeColumns[columnId];
              const columnTasks = getFilteredTasks(column.taskIds);
              const colorKey = groupBy === 'project' ? getProjectColor(column.title) : 'indigo';
              const colorInfo = COLOR_MAP[colorKey] || COLOR_MAP.indigo;

              return (
                <div key={column.id} className="w-[85vw] md:w-auto md:flex-1 min-w-[280px] shrink-0 snap-center flex flex-col gap-4">
                  <div className={`flex items-center justify-between pb-3 border-b ${groupBy === 'project' ? `border-${colorKey}-500/20` : 'border-black/5'}`}>
                    <div className="flex items-center gap-2">
                      {groupBy === 'project' && (
                        <div className={`w-2.5 h-2.5 rounded-full ${colorInfo.dot}`}></div>
                      )}
                      <h4 className="font-semibold text-[#1A1A1A] truncate max-w-[200px]" title={column.title}>{column.title}</h4>
                      <span className="bg-white/50 border border-black/5 text-[#1A1A1A] text-xs font-medium px-2 py-0.5 rounded-full">{columnTasks.length}</span>
                    </div>
                  </div>
                  <Droppable droppableId={column.id}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="flex-1 flex flex-col gap-4 pr-2 min-h-[300px]">
                        {columnTasks.map((task, index) => {
                          const taskColor = getProjectColor(task.project);
                          const taskColorInfo = COLOR_MAP[taskColor] || COLOR_MAP.indigo;
                          const blocked = isTaskBlocked(task);

                          return (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided) => (
                                <div 
                                  ref={provided.innerRef} 
                                  {...provided.draggableProps} 
                                  {...provided.dragHandleProps} 
                                  onClick={() => setSelectedTask(task)} 
                                  className={`group bg-white p-5 rounded-[24px] border border-black/5 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${taskColorInfo.border} ${blocked ? 'opacity-85 hover:opacity-100 bg-[#FFFDF9]' : ''}`}
                                >
                                  <div className="flex justify-between items-start mb-3">
                                    <div className="flex flex-wrap gap-1.5">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase ${task.priority === 'Alta' ? 'bg-[#FFD166]/20 text-[#222222] border-[#FFD166]/40' : 'bg-black/5 text-[#666666] border-black/5'}`}>{task.priority}</span>
                                      
                                      {/* Blocked Indicator on Card */}
                                      {blocked && (
                                        <span 
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-700 border border-rose-500/25"
                                          title={`Bloqueado por: ${getBlockingTasks(task).map(t => t.title).join(', ')}`}
                                        >
                                          <Lock size={8} /> Bloqueado
                                        </span>
                                      )}
                                    </div>
                                    <button 
                                      onClick={(e) => handleDeleteTask(task.id, e)}
                                      className="p-1 text-[#DDD] hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                      title="Eliminar tarea"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                  <h5 className="font-semibold text-[#1A1A1A] mb-1.5 leading-snug">{task.title}</h5>
                                  
                                  {groupBy === 'status' ? (
                                    <div className="mb-4">
                                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${taskColorInfo.text}`}>
                                        {task.project}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="mb-4">
                                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border bg-black/5 text-[#666666] border-black/5 uppercase tracking-wide`}>
                                        {task.status === 'todo' ? 'Por Hacer' : task.status === 'in-progress' ? 'En Progreso' : task.status === 'review' ? 'En Revisión' : 'Completado'}
                                      </span>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between pt-3 border-t border-black/5">
                                    <div className="flex items-center gap-2">
                                      <div className="flex -space-x-1.5">
                                        {task.assignees.map((name, i) => {
                                          const member = team.find(m => m.name === name);
                                          return <div key={i} className="w-6.5 h-6.5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-white text-white shadow-sm" style={{ backgroundColor: member?.avatar_color || '#222222' }} title={name}>{name.split(' ').map(n => n[0]).join('')}</div>
                                        })}
                                        {task.assignees.length === 0 && <User size={12} className="text-[#999]" />}
                                      </div>
                                      
                                      {task.dueDate !== 'Sin fecha' && (
                                        <div className="flex items-center gap-1.5 ml-1">
                                          <div className={`w-1.5 h-1.5 rounded-full ${
                                            (() => {
                                              const today = new Date();
                                              today.setHours(0, 0, 0, 0);
                                              
                                              let due: Date;
                                              if (task.dueDate.includes('/')) {
                                                const [d, m, y] = task.dueDate.split('/');
                                                due = new Date(Number(y), Number(m) - 1, Number(d));
                                              } else {
                                                const [y, m, d] = task.dueDate.split('T')[0].split('-').map(Number);
                                                due = new Date(y, m - 1, d);
                                              }
                                              
                                              const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                              if (diff <= 0) return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]';
                                              if (diff <= 3) return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
                                              return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
                                            })()
                                          }`} />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {task.hours > 0 && (
                                        <div className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                                          task.actual_hours !== undefined && task.actual_hours !== null
                                            ? task.actual_hours > task.hours
                                              ? 'bg-red-500/10 text-red-700 border-red-500/20'
                                              : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                                            : 'bg-black/5 text-[#666666] border-black/5'
                                        }`}>
                                          <span>{task.hours}h</span>
                                          {task.actual_hours !== undefined && task.actual_hours !== null && (
                                            <><span className="opacity-40">/</span><span>{task.actual_hours}h</span></>
                                          )}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1 text-[9px] font-medium text-[#666666] bg-black/5 px-2 py-0.5 rounded-full border border-black/5">
                                        <Calendar size={10} className="text-[#666666]" />
                                        <span>{(() => {
                                          if (!task.dueDate || task.dueDate === 'Sin fecha') return 'venc. s/f';
                                          if (task.dueDate.includes('/')) return task.dueDate;
                                          if (task.dueDate.includes('-')) {
                                            const parts = task.dueDate.split('T')[0].split('-');
                                            if (parts.length === 3) {
                                              const [y, m, d] = parts;
                                              return `${d}/${m}/${y}`;
                                            }
                                          }
                                          return task.dueDate;
                                        })()}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
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
        <TaskDetailModal 
          key={selectedTask.id} 
          task={selectedTask} 
          columns={data.columns} 
          teamMembers={team} 
          availableProjects={projects} 
          allTasks={Object.values(data.tasks)}
          onClose={() => setSelectedTask(null)} 
          onUpdate={handleUpdateTask} 
          onSelectTask={handleSelectTaskFromModal}
          isAdmin={isAdmin} 
        />
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

function DependencySelector({ selectedIds, allTasks, currentTaskId, onChange }: { selectedIds: string[], allTasks: Task[], currentTaskId: string, onChange: (ids: string[]) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const filteredTasksForSelector = allTasks.filter(t => t.id !== currentTaskId);

  return (
    <div className="relative">
      <div onClick={() => setIsOpen(!isOpen)} className="w-full min-h-[48px] p-2 rounded-2xl border border-black/10 bg-black/5 flex flex-wrap gap-2 cursor-pointer items-center">
        {selectedIds.length === 0 && <span className="text-[#666666] text-sm p-1 ml-2">Sin dependencias</span>}
        {selectedIds.map(id => {
          const t = allTasks.find(x => x.id === id);
          return (
            <span key={id} className="bg-[#555555] text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-2">
              {t ? t.title : 'Tarea eliminada'}
              <X size={12} onClick={(e) => { e.stopPropagation(); onChange(selectedIds.filter(x => x !== id)); }} />
            </span>
          );
        })}
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-black/10 rounded-[24px] shadow-xl z-20 max-h-60 overflow-y-auto p-2">
            {filteredTasksForSelector.map(t => (
              <div key={t.id} onClick={() => {
                const newIds = selectedIds.includes(t.id) ? selectedIds.filter(x => x !== t.id) : [...selectedIds, t.id];
                onChange(newIds);
              }} className="flex items-center justify-between px-4 py-2 hover:bg-black/5 rounded-xl cursor-pointer">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{t.title}</span>
                  <span className="text-[10px] text-[#666666]">{t.project} ({t.status === 'todo' ? 'Por Hacer' : t.status === 'in-progress' ? 'En Progreso' : t.status === 'review' ? 'En Revisión' : 'Completado'})</span>
                </div>
                {selectedIds.includes(t.id) && <Check size={16} className="text-[#FFD166]" />}
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
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#666666] uppercase pl-1">Horas Estimadas</label>
            <input type="number" placeholder="0" value={newTask.hours || ''} onChange={(e) => setNewTask({ ...newTask, hours: parseFloat(e.target.value) || 0 })} className="w-full h-12 rounded-2xl border border-black/10 bg-black/5 px-4" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#666666] uppercase pl-1">Fecha Vencimiento</label>
            <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} className="w-full h-12 rounded-2xl border border-black/10 bg-black/5 px-4" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose} className="px-6 py-3 rounded-full text-[#666666] hover:bg-black/5 transition-colors">Cancelar</button>
          <button 
            disabled={!newTask.title || !newTask.dueDate || newTask.hours <= 0} 
            onClick={() => onSave(newTask)} 
            className="bg-[#222222] hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-full font-medium transition-all shadow-lg active:scale-95"
          >
            Crear
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskDetailModal({ task, columns, teamMembers, availableProjects, allTasks, onClose, onUpdate, onSelectTask, isAdmin }: { task: Task, columns: any, teamMembers: TeamMember[], availableProjects: any[], allTasks: Task[], onClose: () => void, onUpdate: (id: string, updates: any) => void, onSelectTask: (task: Task) => void, isAdmin: boolean }) {
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.description);
  const [project, setProject] = useState(task.project);
  const [priority, setPriority] = useState(task.priority);
  const [assignees, setAssignees] = useState(task.assignees);
  const [dueDate, setDueDate] = useState(task.dueDate);
  const [hours, setHours] = useState(task.hours);
  const [actualHours, setActualHours] = useState<number | ''>(task.actual_hours ?? '');

  // Extract dependencies from tags
  const getDependencies = (tags: string[] = []) => {
    return tags.filter(t => t.startsWith('dep:')).map(t => t.replace('dep:', ''));
  };

  const dependencies = getDependencies(task.tags || []);

  const saveTitle = () => { if (title !== task.title) onUpdate(task.id, { title }); };
  const saveDesc = () => { if (desc !== task.description) onUpdate(task.id, { description: desc }); };
  const saveHours = () => { if (hours !== task.hours) onUpdate(task.id, { hours }); };
  const saveActualHours = () => {
    const val = actualHours === '' ? undefined : Number(actualHours);
    if (val !== task.actual_hours) onUpdate(task.id, { actual_hours: val });
  };

  const handleDependenciesChange = (newDepIds: string[]) => {
    // Keep other tags, replace dependency tags
    const otherTags = (task.tags || []).filter(t => !t.startsWith('dep:'));
    const newTags = [...otherTags, ...newDepIds.map(id => `dep:${id}`)];
    onUpdate(task.id, { tags: newTags });
  };

  const efficiencyInfo = (() => {
    if (!hours || actualHours === '' || actualHours === undefined) return null;
    const diff = Number(actualHours) - hours;
    const pct = Math.round(Math.abs(diff) / hours * 100);
    if (diff > 0) return { label: `+${pct}% sobre lo estimado`, color: 'text-red-600 bg-red-500/10 border-red-500/20' };
    if (diff < 0) return { label: `${pct}% bajo estimado`, color: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20' };
    return { label: 'Exacto al estimado', color: 'text-blue-700 bg-blue-500/10 border-blue-500/20' };
  })();

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
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#666666] uppercase">Estado</span>
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium border bg-[#FFD166]/20 text-[#1A1A1A] border-[#FFD166]/50">
                {task.status === 'todo' ? 'Por Hacer' : task.status === 'in-progress' ? 'En Progreso' : task.status === 'review' ? 'En Revisión' : 'Completado'}
              </span>
            </div>
            <div className="flex flex-col gap-2"><span className="text-xs font-bold text-[#666666] uppercase">Prioridad</span><select disabled={!isAdmin} value={priority} onChange={(e) => { const v = e.target.value as any; setPriority(v); onUpdate(task.id, { priority: v }); }} className={`h-10 rounded-xl border border-black/10 bg-black/5 px-3 outline-none ${!isAdmin ? 'cursor-not-allowed' : ''}`}><option value="Alta">Alta</option><option value="Media">Media</option><option value="Baja">Baja</option></select></div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#666666] uppercase">Vencimiento</span>
              <input 
                disabled={!isAdmin} 
                type="date" 
                value={(() => {
                  if (!dueDate || dueDate === 'Sin fecha') return '';
                  if (dueDate.includes('/')) {
                    const [d, m, y] = dueDate.split('/');
                    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                  }
                  return dueDate.split('T')[0];
                })()} 
                onChange={(e) => { 
                  const val = e.target.value;
                  setDueDate(val); 
                  onUpdate(task.id, { dueDate: val }); 
                }} 
                className={`h-10 rounded-xl border border-black/10 bg-black/5 px-3 outline-none ${!isAdmin ? 'cursor-not-allowed' : ''}`} 
              />
            </div>
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
          
          {/* Dependency Selector UI */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[#1A1A1A] flex items-center gap-1.5">
              <Lock size={14} className="text-[#666666]" /> Bloqueado por (Dependencias con otras tareas)
            </span>
            {isAdmin ? (
              <DependencySelector 
                selectedIds={dependencies} 
                allTasks={allTasks} 
                currentTaskId={task.id} 
                onChange={handleDependenciesChange} 
              />
            ) : (
              <div className="flex flex-wrap gap-2 p-2 bg-black/5 rounded-2xl min-h-[48px] items-center">
                {dependencies.map(id => {
                  const t = allTasks.find(x => x.id === id);
                  return <span key={id} className="bg-[#555555] text-white text-xs font-medium px-3 py-1 rounded-full">{t ? t.title : 'Tarea cargando...'}</span>;
                })}
                {dependencies.length === 0 && <span className="text-sm text-[#666666] ml-2">Sin dependencias</span>}
              </div>
            )}
            
            {/* Clickable dependency list for navigation */}
            {dependencies.length > 0 && (
              <div className="mt-2 flex flex-col gap-1.5 pl-2 border-l border-black/10">
                <span className="text-[10px] uppercase font-bold text-[#666666]">Navegar a dependencias:</span>
                {dependencies.map(id => {
                  const depTask = allTasks.find(x => x.id === id);
                  if (!depTask) return null;
                  return (
                    <button
                      key={id}
                      onClick={() => onSelectTask(depTask)}
                      className="text-left text-sm text-[#1a1a1a] hover:text-[#FFD166] hover:underline flex items-center gap-2 font-medium"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${depTask.status === 'done' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      {depTask.title} 
                      <span className="text-[10px] text-[#666666] font-normal">({depTask.status === 'done' ? 'Completada' : 'Abierta'})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {hours > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#1A1A1A]">Horas Estimadas</span>
                <input disabled={!isAdmin} type="number" min="0" step="0.5" value={hours} onChange={(e) => setHours(parseFloat(e.target.value) || 0)} onBlur={saveHours} className={`w-full h-11 rounded-xl border border-black/10 bg-black/5 px-4 outline-none transition-all ${isAdmin ? 'focus:ring-2 focus:ring-[#FFD166]' : 'cursor-not-allowed'}`} />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#1A1A1A]">Horas Reales</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0"
                  value={actualHours}
                  onChange={(e) => setActualHours(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  onBlur={saveActualHours}
                  className="w-full h-11 rounded-xl border border-black/10 bg-black/5 px-4 outline-none transition-all focus:ring-2 focus:ring-[#FFD166]"
                />
              </div>
            </div>
          )}
          {hours <= 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[#1A1A1A]">Horas Estimadas</span>
              <input disabled={!isAdmin} type="number" min="0" step="0.5" value={hours} onChange={(e) => setHours(parseFloat(e.target.value) || 0)} onBlur={saveHours} className={`w-full h-11 rounded-xl border border-black/10 bg-black/5 px-4 outline-none transition-all ${isAdmin ? 'focus:ring-2 focus:ring-[#FFD166]' : 'cursor-not-allowed'}`} />
              <p className="text-[10px] text-[#666666] italic">Define horas estimadas para habilitar el seguimiento de productividad.</p>
            </div>
          )}
          {efficiencyInfo && (
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold ${efficiencyInfo.color}`}>
              <Clock size={13} />
              <span>Eficiencia: {efficiencyInfo.label}</span>
            </div>
          )}
        </div>
        <div className="p-8 border-t border-black/5 flex justify-end"><button onClick={onClose} className="bg-[#1A1A1A] hover:bg-black text-white px-10 py-3.5 rounded-full text-sm font-medium transition-all shadow-lg active:scale-95">Listo</button></div>
      </div>
    </div>
  );
}
"""
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Kanban.tsx updated successfully!")

if __name__ == "__main__":
    print("Starting Kanban modifications application...")
    apply_new_project()
    apply_edit_project_modal()
    apply_kanban()
    print("All frontend modifications applied successfully!")
