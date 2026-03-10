import { Play, Pause, Clock, CheckCircle2, ChevronRight, MoreVertical, AlertTriangle, BarChart2 } from "lucide-react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { mockStats, mockAlerts } from "../data/mockData";

export default function Dashboard() {
  const { profile } = useUser();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <h1 className="text-[42px] font-normal tracking-tight text-[#1A1A1A]">
          Hola, {profile.firstName}!
        </h1>

        <div className="flex flex-wrap items-center gap-x-12 gap-y-6">
          <div className="flex flex-col gap-2 min-w-[120px]">
            <span className="text-sm text-[#666666]">C.M. Global</span>
            <div className="flex items-center gap-3">
              <div className="h-8 w-24 bg-[#222222] rounded-full flex items-center px-3 text-white text-xs font-medium">
                32%
              </div>
            </div>
          </div>
          <div
            className="flex flex-col gap-2 min-w-[120px] cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/finance')}
          >
            <span className="text-sm text-[#666666]">Facturación</span>
            <div className="flex items-center gap-3">
              <div className="h-8 w-24 bg-[#FFD166] rounded-full flex items-center px-3 text-[#222222] text-xs font-medium">
                +{mockStats.revenueGrowth}%
              </div>
            </div>
          </div>
          <div
            className="flex flex-col gap-2 flex-1 min-w-[200px] cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/timesheet')}
          >
            <span className="text-sm text-[#666666]">Horas Facturables</span>
            <div className="h-8 w-full max-w-[300px] bg-white/40 rounded-full overflow-hidden flex">
              <div className="h-full bg-white/60 flex items-center px-3 text-[#222222] text-xs font-medium" style={{ width: `${mockStats.billableHoursPercentage}%` }}>
                {mockStats.billableHoursPercentage}%
              </div>
              <div className="h-full flex-1 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,0.5)_4px,rgba(255,255,255,0.5)_8px)]"></div>
            </div>
          </div>
          <div className="flex flex-col gap-2 min-w-[120px]">
            <span className="text-sm text-[#666666]">En Riesgo</span>
            <div className="flex items-center gap-3">
              <div className="h-8 w-24 border border-[#222222]/20 rounded-full flex items-center px-3 text-[#222222] text-xs font-medium">
                15%
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8 ml-auto">
            <div
              className="flex items-baseline gap-2 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => navigate('/clients')}
            >
              <span className="text-[#666666] text-sm flex items-center gap-1">
                <UsersIcon /> Clientes
              </span>
              <span className="text-5xl font-light text-[#1A1A1A]">{mockStats.totalClients}</span>
            </div>
            <div
              className="flex items-baseline gap-2 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => navigate('/projects')}
            >
              <span className="text-[#666666] text-sm flex items-center gap-1">
                <FolderIcon /> Proyectos
              </span>
              <span className="text-5xl font-light text-[#1A1A1A]">{mockStats.totalProjects}</span>
            </div>
            <div
              className="flex items-baseline gap-2 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => navigate('/kanban')}
            >
              <span className="text-[#666666] text-sm flex items-center gap-1">
                <AlertIcon /> Alertas
              </span>
              <span className="text-5xl font-light text-[#1A1A1A]">{mockStats.alertsCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Profile */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-4 shadow-sm border border-white/40 relative overflow-hidden group">
            <div className="aspect-[4/5] rounded-[24px] overflow-hidden mb-4 relative bg-[#1A1A1A] flex items-center justify-center">
              <svg className="absolute top-0 right-0 w-full h-full" viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg">
                <circle cx="150" cy="50" r="100" fill="#2A2A2A" />
                <circle cx="150" cy="50" r="75" fill="#333333" />
                <circle cx="150" cy="50" r="50" fill="#D4A353" />
                <path d="M-20 200 Q 80 160 220 220 L 220 280 L -20 280 Z" fill="#222222" />
                <path d="M-20 230 Q 100 190 220 250 L 220 280 L -20 280 Z" fill="#2A2A2A" />
              </svg>
              <div className="z-10 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-[#2A2A2A] rounded-2xl border border-white/10 flex items-center justify-center shadow-xl">
                  <div className="flex items-end gap-1.5 h-6">
                    <div className="w-1 h-3 bg-[#D4A353] rounded-full"></div>
                    <div className="w-1 h-6 bg-[#D4A353] rounded-full"></div>
                    <div className="w-1 h-4 bg-[#D4A353] rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 bg-[#2A2A2A] text-white px-4 py-1.5 rounded-full text-sm font-medium border border-white/10">
                CEO
              </div>
            </div>
            <div className="px-2 pb-2">
              <h3 className="text-xl font-medium text-[#1A1A1A]">{profile.firstName} {profile.lastName}</h3>
              <p className="text-[#666666] text-sm">{profile.role}</p>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-6 shadow-sm border border-white/40 flex flex-col gap-4">
            <div
              className="flex items-center justify-between py-2 border-b border-black/5 cursor-pointer hover:bg-black/5 rounded-lg px-2 transition-colors"
              onClick={() => navigate('/reports')}
            >
              <span className="text-[#1A1A1A] font-medium">Reporte Financiero</span>
              <ChevronRight size={18} className="text-[#666666]" />
            </div>
            <div
              className="flex items-center justify-between py-2 border-b border-black/5 cursor-pointer hover:bg-black/5 rounded-lg px-2 transition-colors"
              onClick={() => navigate('/kanban')}
            >
              <span className="text-[#1A1A1A] font-medium">Aprobaciones Pendientes</span>
              <div className="flex items-center gap-2">
                <span className="bg-[#FFD166] text-[#222222] text-xs font-bold px-2 py-0.5 rounded-full">3</span>
                <ChevronRight size={18} className="text-[#666666]" />
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-black/5 cursor-pointer hover:bg-black/5 rounded-lg px-2 transition-colors">
              <span className="text-[#1A1A1A] font-medium">Rendimiento de Equipo</span>
              <ChevronRight size={18} className="text-[#666666]" />
            </div>
            <div
              className="flex items-center justify-between py-2 cursor-pointer hover:bg-black/5 rounded-lg px-2 transition-colors"
              onClick={() => navigate('/settings')}
            >
              <span className="text-[#1A1A1A] font-medium">Configuración de Empresa</span>
              <ChevronRight size={18} className="text-[#666666]" />
            </div>
          </div>
        </div>

        {/* Middle Column */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Progress Card */}
            <div
              className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 shadow-sm border border-white/40 relative cursor-pointer group"
              onClick={() => navigate('/finance')}
            >
              <button className="absolute top-6 right-6 w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-[#1A1A1A] group-hover:bg-[#FFD166] transition-colors">
                <ArrowUpRightIcon />
              </button>
              <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">Facturación</h3>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-4xl font-light text-[#1A1A1A]">${(mockStats.monthlyRevenue / 1000).toFixed(1)}k</span>
                <span className="text-xs text-[#666666] max-w-[60px] leading-tight">Este mes</span>
              </div>

              <div className="flex items-end justify-between h-32 mt-auto gap-2">
                {[40, 60, 80, 50, 90, 75].map((height, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-full relative flex justify-center items-end h-full">
                      {i === 5 && (
                        <div className="absolute -top-8 bg-[#FFD166] text-[#222222] text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap z-10">
                          ${(mockStats.monthlyRevenue / 1000).toFixed(1)}k
                        </div>
                      )}
                      <div className="w-1.5 bg-black/5 rounded-full h-full absolute"></div>
                      <div
                        className={`w-1.5 rounded-full relative z-0 ${i === 5 ? 'bg-[#FFD166]' : 'bg-[#222222]'}`}
                        style={{ height: `${height}%` }}
                      ></div>
                      <div className={`w-2 h-2 rounded-full absolute -bottom-1 z-10 ${i === 5 ? 'bg-[#FFD166]' : 'bg-[#222222]'}`}></div>
                    </div>
                    <span className="text-xs text-[#666666] mt-2">
                      {['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Tracker Card */}
            <div
              className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 shadow-sm border border-white/40 relative flex flex-col cursor-pointer group"
              onClick={() => navigate('/timesheet')}
            >
              <button className="absolute top-6 right-6 w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-[#1A1A1A] group-hover:bg-[#FFD166] transition-colors">
                <ArrowUpRightIcon />
              </button>
              <h3 className="text-lg font-medium text-[#1A1A1A] mb-6">Horas Incurridas</h3>

              <div className="flex-1 flex items-center justify-center relative">
                <div className="w-40 h-40 rounded-full border-[8px] border-black/5 relative flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="#FFD166" strokeWidth="8" strokeDasharray="289" strokeDashoffset={289 - (289 * mockStats.billableHoursPercentage / 100)} strokeLinecap="round" />
                  </svg>
                  <div className="text-center">
                    <div className="text-3xl font-light text-[#1A1A1A]">{mockStats.totalHours.toLocaleString()}</div>
                    <div className="text-xs text-[#666666] mt-1">Horas Totales</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 px-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-[#1A1A1A]">{mockStats.billableHoursPercentage}%</p>
                  <p className="text-[10px] text-[#666666]">Facturables</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[#1A1A1A]">{100 - mockStats.billableHoursPercentage}%</p>
                  <p className="text-[10px] text-[#666666]">Internas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Section */}
          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-6 shadow-sm border border-white/40 mt-auto">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium text-[#1A1A1A] bg-white px-4 py-1.5 rounded-full shadow-sm">Septiembre</span>
              <h3 className="text-lg font-medium text-[#1A1A1A]">Octubre 2024</h3>
              <span className="text-sm font-medium text-[#1A1A1A] bg-white px-4 py-1.5 rounded-full shadow-sm">Noviembre</span>
            </div>

            <div className="grid grid-cols-6 gap-4 mb-4">
              <div className="text-center"><div className="text-xs text-[#666666] mb-1">Lun</div><div className="text-sm font-medium">14</div></div>
              <div className="text-center"><div className="text-xs text-[#666666] mb-1">Mar</div><div className="text-sm font-medium">15</div></div>
              <div className="text-center"><div className="text-xs text-[#666666] mb-1">Mié</div><div className="text-sm font-medium">16</div></div>
              <div className="text-center"><div className="text-xs text-[#666666] mb-1">Jue</div><div className="text-sm font-medium">17</div></div>
              <div className="text-center"><div className="text-xs text-[#666666] mb-1">Vie</div><div className="text-sm font-medium">18</div></div>
              <div className="text-center"><div className="text-xs text-[#666666] mb-1">Sáb</div><div className="text-sm font-medium">19</div></div>
            </div>

            <div className="relative h-48 border-t border-black/5 pt-4">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-xs text-[#666666]">
                <div className="flex items-center gap-4"><span className="w-12 text-right">8:00 am</span><div className="flex-1 border-t border-black/5 border-dashed"></div></div>
                <div className="flex items-center gap-4"><span className="w-12 text-right">10:00 am</span><div className="flex-1 border-t border-black/5 border-dashed"></div></div>
                <div className="flex items-center gap-4"><span className="w-12 text-right">12:00 pm</span><div className="flex-1 border-t border-black/5 border-dashed"></div></div>
                <div className="flex items-center gap-4"><span className="w-12 text-right">2:00 pm</span><div className="flex-1 border-t border-black/5 border-dashed"></div></div>
              </div>

              <div className="absolute top-4 left-[20%] w-[40%] bg-[#222222] text-white rounded-2xl p-3 shadow-md z-10">
                <h4 className="text-sm font-medium mb-1">Comité de Dirección</h4>
                <p className="text-[10px] text-white/70 mb-2">Revisión de Q3</p>
                <div className="flex -space-x-2">
                  <img src="https://i.pravatar.cc/150?u=1" className="w-5 h-5 rounded-full border border-[#222222]" alt="User" />
                  <img src="https://i.pravatar.cc/150?u=2" className="w-5 h-5 rounded-full border border-[#222222]" alt="User" />
                  <img src="https://i.pravatar.cc/150?u=3" className="w-5 h-5 rounded-full border border-[#222222]" alt="User" />
                </div>
              </div>

              <div className="absolute top-24 left-[50%] w-[35%] bg-white border border-black/5 rounded-2xl p-3 shadow-sm z-10">
                <h4 className="text-sm font-medium text-[#1A1A1A] mb-1">Kickoff TechCorp</h4>
                <p className="text-[10px] text-[#666666] mb-2">Migración Cloud</p>
                <div className="flex -space-x-2">
                  <img src="https://i.pravatar.cc/150?u=4" className="w-5 h-5 rounded-full border border-white" alt="User" />
                  <img src="https://i.pravatar.cc/150?u=5" className="w-5 h-5 rounded-full border border-white" alt="User" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div
            className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 shadow-sm border border-white/40 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/projects')}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-[#1A1A1A]">Salud Portafolio</h3>
              <span className="text-3xl font-light text-[#1A1A1A]">{mockStats.portfolioHealth}%</span>
            </div>

            <div className="flex gap-2 h-8 mb-2">
              <div
                className="bg-[#FFD166] rounded-full flex items-center justify-center text-[10px] font-bold text-[#222222]"
                style={{ flex: mockStats.portfolioHealth }}
              >
                A Tiempo
              </div>
              <div className="flex-1 bg-[#222222] rounded-full"></div>
              <div className="flex-1 bg-black/5 rounded-full"></div>
            </div>
            <div className="flex justify-between text-[10px] text-[#666666] px-2">
              <span>{mockStats.portfolioHealth}%</span>
              <span>12%</span>
              <span>6%</span>
            </div>
          </div>

          <div
            className="bg-[#222222] rounded-[32px] p-6 shadow-xl text-white flex-1 flex flex-col cursor-pointer hover:bg-black transition-colors"
            onClick={() => navigate('/kanban')}
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-medium">Proyectos en Riesgo</h3>
              <span className="text-3xl font-light">{mockStats.projectsAtRisk}</span>
            </div>

            <div className="flex flex-col gap-6">
              {mockAlerts.map(alert => (
                <div key={alert.id} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[#FFD166]">
                    <AlertTriangle size={18} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium mb-1">{alert.title}</h4>
                    <p className={`text-xs ${alert.type === 'critical' ? 'text-red-400' : 'text-white/50'}`}>
                      {alert.description}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border ${alert.type === 'critical' ? 'bg-red-500/20 border-red-500/50' : 'border-white/20'}`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>; }
function FolderIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>; }
function AlertIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>; }
function ArrowUpRightIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>; }
