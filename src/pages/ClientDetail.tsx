import { ArrowLeft, Mail, Phone, MapPin, ExternalLink, Building, Clock, DollarSign, Folder } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

export default function ClientDetail() {
  const { id } = useParams();

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/clients" className="p-3 bg-white/50 hover:bg-white/80 rounded-full transition-colors border border-black/5 shadow-sm">
          <ArrowLeft size={20} className="text-[#1A1A1A]" />
        </Link>
        <div>
          <h3 className="text-[42px] font-normal tracking-tight text-[#1A1A1A]">TechCorp Solutions</h3>
          <p className="text-[#666666] mt-1">Cliente desde Enero 2023</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Info Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#222222] flex items-center justify-center text-white text-xl font-light shadow-md">
                TC
              </div>
              <div>
                <h4 className="text-xl font-medium text-[#1A1A1A]">TechCorp Solutions</h4>
                <p className="text-sm text-[#666666]">Tecnología y Software</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-6 border-t border-black/5">
              <div className="flex items-center gap-3 text-[#666666]">
                <Building size={18} />
                <span className="text-sm">B-12345678</span>
              </div>
              <div className="flex items-center gap-3 text-[#666666]">
                <Mail size={18} />
                <a href="mailto:contacto@techcorp.com" className="text-sm hover:text-[#1A1A1A] transition-colors">contacto@techcorp.com</a>
              </div>
              <div className="flex items-center gap-3 text-[#666666]">
                <Phone size={18} />
                <a href="tel:+34912345678" className="text-sm hover:text-[#1A1A1A] transition-colors">+34 912 345 678</a>
              </div>
              <div className="flex items-center gap-3 text-[#666666]">
                <MapPin size={18} />
                <span className="text-sm">Paseo de la Castellana 45, Madrid</span>
              </div>
              <div className="flex items-center gap-3 text-[#666666]">
                <ExternalLink size={18} />
                <a href="https://techcorp.com" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-[#1A1A1A] transition-colors">techcorp.com</a>
              </div>
            </div>

            <div className="pt-6 border-t border-black/5">
              <h5 className="text-sm font-medium text-[#1A1A1A] mb-3">Contacto Principal</h5>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-[#1A1A1A] font-medium text-sm">
                  MR
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">María Rodríguez</p>
                  <p className="text-xs text-[#666666]">CTO</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats and Projects */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-6 border border-white/40 shadow-sm relative overflow-hidden group">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-[#1A1A1A] w-fit mb-4">
                <Folder size={24} />
              </div>
              <p className="text-[#666666] text-sm font-medium mb-1">Proyectos Activos</p>
              <h4 className="text-4xl font-light text-[#1A1A1A]">3</h4>
            </div>
            <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-6 border border-white/40 shadow-sm relative overflow-hidden group">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-[#1A1A1A] w-fit mb-4">
                <Clock size={24} />
              </div>
              <p className="text-[#666666] text-sm font-medium mb-1">Horas Invertidas</p>
              <h4 className="text-4xl font-light text-[#1A1A1A]">450h</h4>
            </div>
            <div className="bg-[#222222] text-white rounded-[32px] p-6 shadow-xl relative overflow-hidden group">
              <div className="p-3 bg-white/10 rounded-2xl w-fit mb-4">
                <DollarSign size={24} />
              </div>
              <p className="text-white/70 text-sm font-medium mb-1">Facturación Total</p>
              <h4 className="text-4xl font-light">$85.4k</h4>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm overflow-hidden flex flex-col flex-1">
            <div className="p-6 border-b border-black/5 flex justify-between items-center">
              <h4 className="text-xl font-medium text-[#1A1A1A]">Proyectos Recientes</h4>
              <Link to="/projects/new" className="text-sm font-medium text-[#1A1A1A] hover:underline">
                Nuevo Proyecto
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/5">
                    <th className="px-6 py-4 text-xs font-medium text-[#666666] uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-4 text-xs font-medium text-[#666666] uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-xs font-medium text-[#666666] uppercase tracking-wider">Progreso</th>
                    <th className="px-6 py-4 text-xs font-medium text-[#666666] uppercase tracking-wider text-right">Facturación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  <tr className="hover:bg-white/40 transition-colors group">
                    <td className="px-6 py-4">
                      <Link to="/projects/1" className="font-medium text-[#1A1A1A] hover:underline">Rediseño App Móvil</Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border bg-[#FFD166]/20 text-[#1A1A1A] border-[#FFD166]/50">
                        En Progreso
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-full bg-black/5 rounded-full h-2 max-w-[100px]">
                          <div className="bg-[#FFD166] h-2 rounded-full" style={{ width: '65%' }}></div>
                        </div>
                        <span className="text-xs text-[#666666]">65%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-[#1A1A1A]">$24.5k</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-white/40 transition-colors group">
                    <td className="px-6 py-4">
                      <Link to="/projects/2" className="font-medium text-[#1A1A1A] hover:underline">Auditoría SEO</Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border bg-green-500/10 text-green-700 border-green-500/20">
                        Completado
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-full bg-black/5 rounded-full h-2 max-w-[100px]">
                          <div className="bg-green-400 h-2 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                        <span className="text-xs text-[#666666]">100%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-[#1A1A1A]">$8.2k</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
