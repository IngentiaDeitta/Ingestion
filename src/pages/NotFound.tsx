import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex bg-[#020617] items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0ea5e9]/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#22d3ee]/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md relative z-10 flex flex-col items-center gap-8">
        <div className="relative">
          <h1 className="text-[180px] font-black leading-none tracking-tighter text-white opacity-5">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-white/10 backdrop-blur-3xl rounded-full flex items-center justify-center border border-white/20">
               <span className="text-4xl font-bold text-white">Oops!</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-light text-white mb-3">Página no encontrada</h2>
          <p className="text-slate-400 font-medium">Lo sentimos, la página que buscas no existe o ha sido movida.</p>
        </div>

        <div className="flex flex-col w-full gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-white hover:bg-white/10 transition-all"
          >
            <ArrowLeft size={18} />
            <span className="font-bold">Volver atrás</span>
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full h-14 bg-white border-white rounded-2xl flex items-center justify-center gap-3 text-black hover:bg-sky-400 hover:text-white hover:border-sky-400 transition-all"
          >
            <Home size={18} />
            <span className="font-bold">Regresar al Inicio</span>
          </button>
        </div>
      </div>
    </div>
  );
}
