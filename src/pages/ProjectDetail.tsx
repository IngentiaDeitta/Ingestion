import { ArrowLeft, Calendar, Clock, CheckCircle2, Users, MoreHorizontal, AlertCircle, DollarSign, MessageSquare, Paperclip } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

export default function ProjectDetail() {
  const { id } = useParams();

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/projects" className="p-3 bg-white/50 hover:bg-white/80 rounded-full transition-colors border border-black/5 shadow-sm">
            <ArrowLeft size={20} className="text-[#1A1A1A]" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-[42px] font-normal tracking-tight text-[#1A1A1A]">Rediseño App Móvil</h3>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border bg-[#FFD166]/20 text-[#1A1A1A] border-[#FFD166]/50">
                En Progreso
              </span>
            </div>
            <p className="text-[#666666]">TechCorp Solutions</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center gap-2 bg-white/50 border border-black/10 hover:bg-white/80 text-[#1A1A1A] px-6 py-3 rounded-full text-sm font-medium transition-colors shadow-sm">
            Editar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8 flex flex-col gap-6">
            <h4 className="text-xl font-medium text-[#1A1A1A]">Progreso General</h4>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm text-[#666666]">
                <span>Completado</span>
                <span className="font-medium text-[#1A1A1A]">65%</span>
              </div>
              <div className="w-full bg-black/5 rounded-full h-3">
                <div className="bg-[#FFD166] h-3 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-black/5">
              <div>
                <p className="text-xs text-[#666666] mb-1">Fecha de Inicio</p>
                <p className="font-medium text-[#1A1A1A]">01 Sep 2024</p>
              </div>
              <div>
                <p className="text-xs text-[#666666] mb-1">Fecha de Entrega</p>
                <p className="font-medium text-[#1A1A1A]">15 Nov 2024</p>
              </div>
              <div>
                <p className="text-xs text-[#666666] mb-1">Presupuesto</p>
                <p className="font-medium text-[#1A1A1A]">$24,500</p>
              </div>
              <div>
                <p className="text-xs text-[#666666] mb-1">C.M. Actual</p>
                <p className="font-medium text-[#1A1A1A]">32%</p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-medium text-[#1A1A1A]">Tareas Recientes</h4>
              <Link to="/kanban" className="text-sm font-medium text-[#1A1A1A] hover:underline">Ver Tablero</Link>
            </div>
            
            <div className="flex flex-col gap-4">
              {[
                { title: 'Diseñar arquitectura base de datos', status: 'Completado', priority: 'Alta' },
                { title: 'Implementar pasarela de pago', status: 'En Progreso', priority: 'Alta' },
                { title: 'Auditoría de código frontend', status: 'En Revisión', priority: 'Media' }
              ].map((task, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-black/5 hover:bg-white/80 transition-colors">
                  <div className="flex items-center gap-4">
                    {task.status === 'Completado' ? (
                      <CheckCircle2 size={20} className="text-green-500" />
                    ) : task.status === 'En Progreso' ? (
                      <Clock size={20} className="text-[#FFD166]" />
                    ) : (
                      <AlertCircle size={20} className="text-[#666666]" />
                    )}
                    <div>
                      <p className="font-medium text-[#1A1A1A]">{task.title}</p>
                      <p className="text-xs text-[#666666]">{task.status}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold border ${
                    task.priority === 'Alta' ? 'bg-[#FFD166] text-[#222222] border-[#FFD166]' :
                    'bg-black/5 text-[#1A1A1A] border-black/10'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-[#222222] text-white rounded-[32px] p-8 shadow-xl flex flex-col gap-6">
            <h4 className="text-xl font-medium">Resumen Financiero</h4>
            
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/70">Presupuesto Consumido</span>
                  <span className="font-medium">$15,200</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-[#FFD166] h-2 rounded-full" style={{ width: '62%' }}></div>
                </div>
                <p className="text-xs text-white/50 mt-2">62% del total ($24,500)</p>
              </div>
              
              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/70">Horas Invertidas</span>
                  <span className="font-medium">120h</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-white/60 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <p className="text-xs text-white/50 mt-2">45% de estimación (260h)</p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8 flex flex-col gap-6">
            <h4 className="text-xl font-medium text-[#1A1A1A]">Equipo Asignado</h4>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#222222] flex items-center justify-center text-white text-sm font-medium">
                  PS
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">Pedro Sequeira</p>
                  <p className="text-xs text-[#666666]">Project Manager</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-black/10 flex items-center justify-center text-[#1A1A1A] text-sm font-medium">
                  AL
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">Ana López</p>
                  <p className="text-xs text-[#666666]">Lead Developer</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-black/10 flex items-center justify-center text-[#1A1A1A] text-sm font-medium">
                  CG
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">Carlos Gómez</p>
                  <p className="text-xs text-[#666666]">UI/UX Designer</p>
                </div>
              </div>
            </div>
            <button className="w-full py-3 border border-dashed border-black/10 rounded-2xl text-sm font-medium text-[#666666] hover:text-[#1A1A1A] hover:border-black/20 hover:bg-white/40 transition-all">
              Gestionar Equipo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
