import { ArrowLeft, Save, Calendar, DollarSign, AlignLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function NewProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    budget: '',
    start_date: '',
    due_date: '',
    description: ''
  });

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
      const { error } = await supabase
        .from('projects')
        .insert([{
          name: formData.name,
          client: formData.client,
          budget: parseFloat(formData.budget) || 0,
          due_date: formData.due_date ? formatDate(formData.due_date) : '',
          description: formData.description,
          progress: 0,
          status: 'En Progreso'
        }]);

      if (error) throw error;
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
    <div className="flex flex-col gap-8 w-full max-w-[1000px] mx-auto">
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
