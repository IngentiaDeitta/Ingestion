import { useState } from 'react';
import { Apple, Eye, EyeOff, Github } from 'lucide-react';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulating login
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex bg-[#020617] items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0ea5e9]/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#22d3ee]/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md relative z-10 flex flex-col gap-10">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-white flex items-center justify-center rounded-2xl shadow-xl shadow-white/10 group hover:scale-110 transition-all duration-500">
             <div className="w-8 h-8 bg-black rounded-lg"></div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-light tracking-tighter text-white">Bienvenido a <span className="font-bold">IngentIA</span></h1>
            <p className="text-slate-400 mt-2 font-medium">Ingresa tus credenciales para continuar</p>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-2xl p-10 rounded-[40px] border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">Email</label>
              <input 
                type="email" 
                placeholder="hola@tuempresa.com"
                required
                className="w-full h-14 bg-slate-800/50 border border-white/5 rounded-2xl px-6 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center ml-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contraseña</label>
                <a href="#" className="text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors">¿Olvidaste tu contraseña?</a>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  required
                  className="w-full h-14 bg-slate-800/50 border border-white/5 rounded-2xl px-6 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              disabled={isLoading}
              className="w-full h-14 bg-white text-black font-bold rounded-2xl mt-4 hover:bg-sky-400 hover:text-white transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          <div className="flex flex-col gap-6 mt-10">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-white/5"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">O continúa con</span>
              <div className="h-px flex-1 bg-white/5"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-white hover:bg-white/10 transition-all group">
                <Github size={20} className="group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">GitHub</span>
              </button>
              <button className="h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-white hover:bg-white/10 transition-all group">
                <Apple size={20} className="group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Apple</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm">
          ¿No tienes una cuenta? <a href="#" className="text-white font-bold hover:text-sky-400 transition-colors">Solicitar acceso</a>
        </p>
      </div>
    </div>
  );
}
