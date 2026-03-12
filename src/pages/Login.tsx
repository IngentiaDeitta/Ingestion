import React, { useState } from "react";
import { EyeOff, Eye, ArrowRight, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate("/");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#E5E9E6] bg-gradient-to-br from-[#E5E9E6] via-[#F6EEDF] to-[#E5E9E6] text-[#1A1A1A] p-4">
      <div className="relative w-full max-w-[480px]">
        <div className="bg-white/80 backdrop-blur-xl shadow-xl shadow-black/5 rounded-[32px] border border-white/40 overflow-hidden">
          <div className="px-8 pt-10 pb-6 text-center flex flex-col items-center">
            <div className="mb-6">
              <svg viewBox="0 0 200 60" className="h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="16" height="60" fill="#111111" />
                <text x="24" y="44" fontFamily="sans-serif" fontWeight="bold" fontSize="42" fill="#111111" letterSpacing="-0.05em">ingentia</text>
              </svg>
            </div>
            <h1 className="text-3xl font-medium tracking-tight mb-2">Acceso</h1>
            <p className="text-[#666666] text-sm">Sistema de Gestión Integral</p>
          </div>

          <div className="px-8 pb-10">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}
            
            <form className="flex flex-col gap-5" onSubmit={handleLogin}>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#1A1A1A]" htmlFor="email">Correo electrónico</label>
                <div className="relative">
                  <input 
                    id="email" 
                    type="email" 
                    placeholder="usuario@empresa.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] placeholder-[#666666] focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] px-4 transition-all outline-none" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-[#1A1A1A]" htmlFor="password">Contraseña</label>
                </div>
                <div className="relative flex items-center">
                  <input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] placeholder-[#666666] focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] px-4 pr-12 transition-all outline-none" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-[#666666] hover:text-[#1A1A1A] transition-colors"
                  >
                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm font-medium text-[#666666] hover:text-[#1A1A1A] transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="mt-2 w-full h-12 bg-[#222222] hover:bg-black text-white font-medium rounded-2xl shadow-lg shadow-black/10 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-black/5 text-center">
              <p className="text-sm text-[#666666]">
                ¿Necesitas acceso?{" "}
                <a href="mailto:soporte@ingentia.com" className="font-medium text-[#1A1A1A] hover:underline transition-colors">Contactar soporte</a>
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-xs text-[#666666]">© 2024 Ingentia. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}
