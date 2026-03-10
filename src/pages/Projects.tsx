import { Plus, Search, Filter, MoreVertical, LayoutGrid, List, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { mockProjects, mockStats } from '../data/mockData';

export default function Projects() {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

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

      <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm overflow-hidden flex flex-col">
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

        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
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
                {mockProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-white/40 transition-colors group">
                    <td className="px-6 py-4">
                      <Link to={`/projects/${project.id}`} className="flex flex-col">
                        <span className="font-medium text-[#1A1A1A]">{project.name}</span>
                        <span className="text-xs text-[#666666] mt-0.5">Vence: {project.dueDate}</span>
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
                      <button className="text-[#666666] hover:text-[#1A1A1A] transition-colors p-2 rounded-full hover:bg-black/5">
                        <MoreVertical size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProjects.map((project) => (
              <div key={project.id} className="bg-white/50 border border-black/5 rounded-[24px] p-6 hover:shadow-md transition-shadow relative group">
                <div className="flex justify-between items-start mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${project.status === 'En Progreso' ? 'bg-[#FFD166]/20 text-[#1A1A1A] border-[#FFD166]/50' :
                    project.status === 'Completado' ? 'bg-green-500/10 text-green-700 border-green-500/20' :
                      'bg-red-500/10 text-red-700 border-red-500/20'
                    }`}>
                    {project.status}
                  </span>
                  <button className="text-[#666666] hover:text-[#1A1A1A] opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={18} />
                  </button>
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
                      {[...Array(Math.min(project.team, 3))].map((_, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-medium text-[#666666]">
                          {String.fromCharCode(65 + i)}
                        </div>
                      ))}
                      {project.team > 3 && (
                        <div className="w-8 h-8 rounded-full bg-white/50 border-2 border-white flex items-center justify-center text-xs font-medium text-[#666666]">
                          +{project.team - 3}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="block text-xs text-[#666666]">C.M.</span>
                      <span className={`text-sm font-medium ${project.cm.startsWith('-') ? 'text-red-500' : 'text-[#1A1A1A]'}`}>{project.cm}</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="p-6 border-t border-black/5 flex items-center justify-between">
          <p className="text-sm text-[#666666]">Mostrando <span className="font-medium text-[#1A1A1A]">1</span> a <span className="font-medium text-[#1A1A1A]">{mockProjects.length}</span> de <span className="font-medium text-[#1A1A1A]">{mockStats.totalProjects}</span> proyectos</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-black/10 rounded-full text-sm font-medium text-[#1A1A1A] hover:bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>Anterior</button>
            <button className="px-4 py-2 border border-black/10 rounded-full text-sm font-medium text-[#1A1A1A] hover:bg-white/50">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
}
