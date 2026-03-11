import { Plus, Search, Filter, MoreVertical, LayoutGrid, List, Clock, CheckCircle2, AlertCircle, Trash2, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Project {
  id: string;
  name: string;
  client: string;
  budget: number;
  progress: number;
  status: string;
  due_date: string;
}

export default function Projects() {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este proyecto?')) return;
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      setProjects(projects.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error al eliminar proyecto');
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-[42px] font-normal tracking-tight text-[#1A1A1A]">Proyectos</h3>
          <p className="text-[#666666] mt-1">Gestiona el ciclo de vida y rentabilidad de los proyectos.</p>
        </div>
        <Link to="/projects/new" className="flex items-center justify-center gap-2 bg-[#222222] hover:bg-black text-white px-6 py-3 rounded-full text-sm font-medium transition-colors shadow-lg shadow-black/10">
          <Plus size={20} />
          Nuevo Proyecto
        </Link>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm flex flex-col">
        <div className="p-6 border-b border-black/5 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#666666]">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Buscar proyectos..."
              className="block w-full pl-12 pr-4 py-3 rounded-full border border-black/10 bg-white/50 text-[#1A1A1A] placeholder-[#666666] focus:border-[#FFD166] focus:ring-2 focus:ring-[#FFD166]/20 sm:text-sm outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex bg-white/50 p-1 rounded-full border border-black/10">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-full transition-colors ${viewMode === 'list' ? 'bg-[#222222] shadow-sm text-white' : 'text-[#666666] hover:text-[#1A1A1A]'}`}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-[#222222] shadow-sm text-white' : 'text-[#666666] hover:text-[#1A1A1A]'}`}
              >
                <LayoutGrid size={18} />
              </button>
            </div>
            <button className="flex items-center justify-center gap-2 bg-white/50 border border-black/10 hover:bg-white/80 text-[#1A1A1A] px-6 py-3 rounded-full text-sm font-medium transition-colors flex-1 sm:flex-none">
              <Filter size={20} />
              Filtros
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center text-[#666666]">Cargando proyectos...</div>
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/5">
                  <th className="px-6 py-4 text-xs font-medium text-[#666666] uppercase tracking-wider">Nombre del Proyecto</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#666666] uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#666666] uppercase tracking-wider">Progreso</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#666666] uppercase tracking-wider text-center">Estado</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#666666] uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-white/40 transition-colors group">
                    <td className="px-6 py-4">
                      <Link to={`/projects/${project.id}`} className="flex flex-col">
                        <span className="font-medium text-[#1A1A1A]">{project.name}</span>
                        <span className="text-xs text-[#666666] mt-0.5">Vence: {project.due_date}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#666666]">
                      {project.client}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-full bg-black/5 rounded-full h-2 max-w-[120px]">
                          <div
                            className={`h-2 rounded-full ${project.status === 'En Riesgo' ? 'bg-red-400' : project.status === 'Completado' ? 'bg-green-400' : 'bg-[#FFD166]'}`}
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-[#666666]">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${project.status === 'En Progreso' ? 'bg-[#FFD166]/20 text-[#1A1A1A] border-[#FFD166]/50' :
                        project.status === 'Completado' ? 'bg-green-500/10 text-green-700 border-green-500/20' :
                          'bg-red-500/10 text-red-700 border-red-500/20'
                        }`}>
                        {project.status === 'En Progreso' && <Clock size={12} />}
                        {project.status === 'Completado' && <CheckCircle2 size={12} />}
                        {project.status === 'En Riesgo' && <AlertCircle size={12} />}
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block text-left">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === project.id ? null : project.id);
                          }}
                          className="text-[#666666] hover:text-[#1A1A1A] transition-colors p-2 rounded-full hover:bg-black/5 relative z-30"
                        >
                          <MoreVertical size={20} />
                        </button>
                        
                        {activeMenu === project.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenu(null);
                              }}
                            ></div>
                            <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white shadow-2xl border border-black/5 z-[100] overflow-hidden py-1">
                              <Link 
                                to={`/projects/${project.id}`}
                                className="flex items-center gap-3 px-4 py-3 text-sm text-[#1A1A1A] hover:bg-black/5 transition-colors"
                              >
                                <Edit size={16} />
                                Editar / Ver
                              </Link>
                              <button 
                                onClick={() => {
                                  handleDelete(project.id);
                                  setActiveMenu(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-black/5"
                              >
                                <Trash2 size={16} />
                                Eliminar
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white/50 border border-black/5 rounded-[24px] p-6 hover:shadow-md transition-shadow relative group">
                <div className="flex justify-between items-start mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${project.status === 'En Progreso' ? 'bg-[#FFD166]/20 text-[#1A1A1A] border-[#FFD166]/50' :
                    project.status === 'Completado' ? 'bg-green-500/10 text-green-700 border-green-500/20' :
                      'bg-red-500/10 text-red-700 border-red-500/20'
                    }`}>
                    {project.status}
                  </span>
                  <div className="relative inline-block text-left">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === project.id ? null : project.id);
                      }}
                      className="text-[#666666] hover:text-[#1A1A1A] transition-colors p-2 rounded-full hover:bg-black/5 relative z-30"
                    >
                      <MoreVertical size={18} />
                    </button>
                    
                    {activeMenu === project.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setActiveMenu(null)}
                        ></div>
                        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white shadow-2xl border border-black/5 z-20 overflow-hidden py-1">
                          <Link 
                            to={`/projects/${project.id}`}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-[#1A1A1A] hover:bg-black/5 transition-colors"
                          >
                            <Edit size={16} />
                            Editar / Ver
                          </Link>
                          <button 
                            onClick={() => {
                              handleDelete(project.id);
                              setActiveMenu(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-black/5"
                          >
                            <Trash2 size={16} />
                            Eliminar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Link to={`/projects/${project.id}`}>
                  <h4 className="text-lg font-medium text-[#1A1A1A] mb-1">{project.name}</h4>
                  <p className="text-sm text-[#666666] mb-6">{project.client}</p>

                  <div className="flex flex-col gap-2 mb-6">
                    <div className="flex justify-between text-xs text-[#666666]">
                      <span>Progreso</span>
                      <span className="font-medium text-[#1A1A1A]">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-black/5 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${project.status === 'En Riesgo' ? 'bg-red-400' : project.status === 'Completado' ? 'bg-green-400' : 'bg-[#FFD166]'}`}
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-black/5">
                    <div className="flex -space-x-2">
                       <div className="w-8 h-8 rounded-full bg-[#FFD166] border-2 border-white flex items-center justify-center text-xs font-bold text-[#1A1A1A]">P</div>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs text-[#666666]">Vence</span>
                      <span className="text-sm font-medium text-[#1A1A1A]">{project.due_date}</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="p-6 border-t border-black/5 flex items-center justify-between">
          <p className="text-sm text-[#666666]">Mostrando <span className="font-medium text-[#1A1A1A]">{projects.length}</span> proyectos</p>
        </div>
      </div>
    </div>
  );
}
