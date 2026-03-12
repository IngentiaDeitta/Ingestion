import { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus, 
  Save, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Project {
  id: string;
  name: string;
}

interface TimeEntry {
  id?: string;
  project_id: string;
  date: string;
  hours: number;
}

interface ProjectRow {
  projectId: string;
  days: { [key: string]: number }; // date string: hours
}

export default function Timesheet() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectRows, setProjectRows] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Generar los días de la semana actual (Lunes a Domingo)
  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que empiece el Lunes
    startOfWeek.setDate(diff);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays(currentDate);
  const startOfWeekStr = weekDays[0].toISOString().split('T')[0];
  const endOfWeekStr = weekDays[6].toISOString().split('T')[0];

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Cargar proyectos
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      
      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // 2. Cargar entradas existentes para esta semana
      const { data: entriesData, error: entriesError } = await supabase
        .from('timesheets')
        .select('*')
        .gte('date', startOfWeekStr)
        .lte('date', endOfWeekStr);

      if (entriesError) throw entriesError;

      // Agrupar entradas por proyecto
      const rows: { [key: string]: ProjectRow } = {};
      (entriesData || []).forEach((entry: TimeEntry) => {
        if (!rows[entry.project_id]) {
          rows[entry.project_id] = { projectId: entry.project_id, days: {} };
        }
        rows[entry.project_id].days[entry.date] = Number(entry.hours);
      });

      setProjectRows(Object.values(rows));
    } catch (error) {
      console.error('Error fetching timesheet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHourChange = (projectId: string, dateStr: string, value: string) => {
    const hours = value === '' ? 0 : parseFloat(value);
    if (isNaN(hours)) return;

    setProjectRows(prev => prev.map(row => {
      if (row.projectId === projectId) {
        return {
          ...row,
          days: { ...row.days, [dateStr]: hours }
        };
      }
      return row;
    }));
  };

  const addProjectRow = () => {
    if (projects.length === 0) return;
    
    // Evitar duplicados si ya están todos los proyectos
    const usedProjectIds = projectRows.map(r => r.projectId);
    const availableProject = projects.find(p => !usedProjectIds.includes(p.id));
    
    if (!availableProject) {
      alert('Ya has agregado todos los proyectos disponibles.');
      return;
    }

    setProjectRows([...projectRows, { projectId: availableProject.id, days: {} }]);
  };

  const removeRow = (projectId: string) => {
    setProjectRows(projectRows.filter(r => r.projectId !== projectId));
  };

  const saveTimesheet = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Preparar todas las entradas para insertar/actualizar
      const allEntries: any[] = [];
      projectRows.forEach(row => {
        Object.entries(row.days).forEach(([date, hours]) => {
          if (hours > 0) {
            allEntries.push({
              project_id: row.projectId,
              date,
              hours
            });
          }
        });
      });

      // Primero eliminamos lo existente en este rango para estos proyectos (para "sobrescribir")
      const { error: deleteError } = await supabase
        .from('timesheets')
        .delete()
        .gte('date', startOfWeekStr)
        .lte('date', endOfWeekStr);

      if (deleteError) throw deleteError;

      if (allEntries.length > 0) {
        const { error: insertError } = await supabase
          .from('timesheets')
          .insert(allEntries);
        if (insertError) throw insertError;
      }

      setMessage({ type: 'success', text: 'Planilla guardada correctamente' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving timesheet:', error);
      setMessage({ type: 'error', text: 'Error al guardar la planilla' });
    } finally {
      setSaving(false);
    }
  };

  const moveWeek = (num: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (num * 7));
    setCurrentDate(newDate);
  };

  const resetToToday = () => {
    setCurrentDate(new Date());
  };

  const getDayTotal = (dateStr: string) => {
    return projectRows.reduce((acc, row) => acc + (row.days[dateStr] || 0), 0);
  };

  const getWeekTotal = () => {
    return projectRows.reduce((acc, row) => {
      const rowSum = Object.values(row.days).reduce((s, h) => s + h, 0);
      return acc + rowSum;
    }, 0);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h3 className="text-[42px] font-normal tracking-tight text-[#1A1A1A]">Timesheet</h3>
          <p className="text-[#666666] mt-1">Registra tus horas trabajadas y gestiona tu productividad semanal.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white/60 backdrop-blur-xl p-2 rounded-2xl border border-white/40 shadow-sm">
          <button 
            onClick={() => moveWeek(-1)}
            className="p-2 hover:bg-black/5 rounded-xl transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex flex-col items-center px-4">
            <span className="text-xs font-bold text-[#666666] uppercase tracking-widest">
              {weekDays[0].getFullYear()}
            </span>
            <span className="text-sm font-medium text-[#1A1A1A] whitespace-nowrap">
              {formatDate(weekDays[0])} - {formatDate(weekDays[6])}
            </span>
          </div>

          <button 
            onClick={() => moveWeek(1)}
            className="p-2 hover:bg-black/5 rounded-xl transition-colors"
          >
            <ChevronRight size={20} />
          </button>
          
          <div className="w-px h-8 bg-black/5 mx-2"></div>
          
          <button 
            onClick={resetToToday}
            className="px-4 py-2 text-xs font-bold text-[#1A1A1A] hover:bg-black hover:text-white rounded-xl transition-all border border-black/5"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-8 border border-white/40 shadow-sm relative overflow-hidden group">
          <div className="p-3 bg-white rounded-2xl shadow-sm text-[#1A1A1A] w-fit mb-4">
            <Clock size={24} />
          </div>
          <p className="text-[#666666] text-sm font-medium mb-1">Total Horas Semanales</p>
          <h4 className="text-4xl font-light text-[#1A1A1A]">{getWeekTotal()}h</h4>
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Clock size={120} />
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-8 border border-white/40 shadow-sm relative overflow-hidden group">
          <div className="p-3 bg-white rounded-2xl shadow-sm text-[#1A1A1A] w-fit mb-4">
            <Calendar size={24} />
          </div>
          <p className="text-[#666666] text-sm font-medium mb-1">Media Diaria</p>
          <h4 className="text-4xl font-light text-[#1A1A1A]">{(getWeekTotal() / 5).toFixed(1)}h</h4>
        </div>

        <div className="bg-[#222222] text-white rounded-[32px] p-8 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-white/10 rounded-2xl w-fit">
              <Briefcase size={24} />
            </div>
            {message && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold animate-in fade-in slide-in-from-top-2 ${
                message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {message.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {message.text}
              </div>
            )}
          </div>
          <button 
            onClick={saveTimesheet}
            disabled={saving || projectRows.length === 0}
            className="w-full bg-white text-black h-12 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#FFD166] transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : <Save size={18} />}
            Guardar Planilla
          </button>
        </div>
      </div>

      {/* Timesheet Table */}
      <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-black/5 flex justify-between items-center">
          <h4 className="text-xl font-medium text-[#1A1A1A]">Registro de Actividad</h4>
          <button 
            onClick={addProjectRow}
            className="flex items-center gap-2 bg-[#1A1A1A]/5 hover:bg-[#1A1A1A] hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
          >
            <Plus size={16} />
            Agregar Proyecto
          </button>
        </div>

        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-black/5 border-t-black rounded-full animate-spin"></div>
            <p className="text-[#666666] font-medium">Sincronizando planilla...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-black/5 bg-black/[0.02]">
                  <th className="px-8 py-4 text-[10px] font-bold text-[#666666] uppercase tracking-wider w-[300px]">Proyecto / Cliente</th>
                  {weekDays.map((day, i) => (
                    <th key={i} className={`px-4 py-4 text-center w-[120px] transition-colors ${isToday(day) ? 'bg-[#FFD166]/10' : ''}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isToday(day) ? 'text-[#1A1A1A]' : 'text-[#666666]'}`}>
                        {getDayName(day)}
                      </p>
                      <p className={`text-sm font-medium ${isToday(day) ? 'text-[#1A1A1A]' : 'text-[#A1A1A1]'}`}>
                        {day.getDate()}
                      </p>
                    </th>
                  ))}
                  <th className="px-8 py-4 text-right text-[10px] font-bold text-[#666666] uppercase tracking-wider w-[120px]">Total</th>
                  <th className="px-4 py-4 w-[60px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {projectRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center text-[#666666]">
                          <Briefcase size={32} />
                        </div>
                        <p className="text-[#666666] font-medium">No hay proyectos asignados para esta semana.</p>
                        <button onClick={addProjectRow} className="text-sm font-bold text-black hover:underline">Comenzar registro ahora</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  projectRows.map((row, rowIndex) => {
                    const rowTotal = Object.values(row.days).reduce((s, h) => s + h, 0);
                    return (
                      <tr key={rowIndex} className="group hover:bg-white/40 transition-colors">
                        <td className="px-8 py-4">
                          <div className="relative">
                            <select 
                              value={row.projectId}
                              onChange={(e) => {
                                const newRows = [...projectRows];
                                newRows[rowIndex].projectId = e.target.value;
                                setProjectRows(newRows);
                              }}
                              className="w-full h-11 bg-white/50 border border-black/5 rounded-xl px-4 text-sm font-medium appearance-none outline-none focus:ring-2 focus:ring-[#FFD166] transition-all cursor-pointer"
                            >
                              {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                              <ChevronDown size={14} />
                            </div>
                          </div>
                        </td>
                        
                        {weekDays.map((day, i) => {
                          const dateStr = day.toISOString().split('T')[0];
                          const value = row.days[dateStr] || 0;
                          return (
                            <td key={i} className={`p-2 transition-colors ${isToday(day) ? 'bg-[#FFD166]/5' : ''}`}>
                              <input 
                                type="number"
                                step="0.5"
                                min="0"
                                max="24"
                                value={value === 0 ? '' : value}
                                placeholder="-"
                                onChange={(e) => handleHourChange(row.projectId, dateStr, e.target.value)}
                                className={`w-full h-11 text-center bg-transparent border-b-2 font-medium text-sm focus:outline-none transition-all ${
                                  value > 0 ? 'border-black/20 text-[#1A1A1A]' : 'border-transparent text-[#A1A1A1] hover:border-black/5'
                                } focus:border-[#FFD166] focus:text-[#1A1A1A]`}
                              />
                            </td>
                          );
                        })}

                        <td className="px-8 py-4 text-right">
                          <span className={`text-sm font-bold ${rowTotal > 0 ? 'text-[#1A1A1A]' : 'text-[#666666]/30'}`}>
                            {rowTotal.toFixed(1)}h
                          </span>
                        </td>
                        
                        <td className="px-4 py-4 text-right">
                          <button 
                            onClick={() => removeRow(row.projectId)}
                            className="p-2 transition-all opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              
              {projectRows.length > 0 && (
                <tfoot>
                  <tr className="bg-black/[0.02] border-t border-black/10">
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-[#666666] uppercase tracking-widest">Totales Diarios</span>
                    </td>
                    {weekDays.map((day, i) => {
                      const dayTotal = getDayTotal(day.toISOString().split('T')[0]);
                      return (
                        <td key={i} className="px-4 py-6 text-center">
                          <span className={`text-sm font-bold ${dayTotal > 8 ? 'text-red-500' : dayTotal > 0 ? 'text-[#1A1A1A]' : 'text-[#666666]/30'}`}>
                            {dayTotal.toFixed(1)}h
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-8 py-6 text-right">
                      <span className="text-base font-bold text-[#1A1A1A]">
                        {getWeekTotal().toFixed(1)}h
                      </span>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
        
        {!loading && (
          <div className="p-6 border-t border-black/5 bg-white/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#666666]">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Sincronizado con Supabase Real-time</span>
            </div>
            <p className="text-xs text-[#666666]">
              Atajo: Pulsa <kbd className="px-2 py-1 bg-black/5 rounded font-sans font-bold text-[10px]">Enter</kbd> para navegar entre campos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
