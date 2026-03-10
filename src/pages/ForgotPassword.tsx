import { useState } from 'react';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulating password reset request
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex bg-[#020617] items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0ea5e9]/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#22d3ee]/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md relative z-10 flex flex-col gap-10">
        <div className="flex flex-col items-center gap-4">
          <Link to="/login" className="self-start flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium mb-4">
            <ArrowLeft size={16} />
            Volver al inicio
          </Link>
          <div className="w-16 h-16 bg-white flex items-center justify-center rounded-2xl shadow-xl shadow-white/10">
             <div className="w-8 h-8 bg-black rounded-lg"></div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-light tracking-tighter text-white">Recuperar <span className="font-bold">Acceso</span></h1>
            <p className="text-slate-400 mt-2 font-medium">Te enviaremos las instrucciones por email</p>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-2xl p-10 rounded-[40px] border border-white/10 shadow-2xl">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">Email de Recuperación</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="w-full h-14 bg-slate-800/50 border border-white/5 rounded-2xl pl-14 pr-6 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                  />
                </div>
              </div>

              <button 
                disabled={isLoading}
                className="w-full h-14 bg-white text-black font-bold rounded-2xl mt-4 hover:bg-sky-400 hover:text-white transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Enviar Instrucciones'
                )}
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-6 py-4 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-sky-500/20 rounded-full flex items-center justify-center text-sky-400">
                <CheckCircle2 size={40} />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">¡Email Enviado!</h3>
                <p className="text-slate-400 text-sm">Hemos enviado un enlace de recuperación a <strong>{email}</strong>. Por favor, revisa tu bandeja de entrada.</p>
              </div>
              <Link to="/login" className="w-full h-14 bg-white/5 border border-white/10 text-white font-bold rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all">
                Cerrar
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
