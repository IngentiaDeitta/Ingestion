import React, { useState } from "react";
import { EyeOff, Eye, ArrowRight, Loader2, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: 'Project Manager'
          }
        }
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      console.error("Register error:", err);
      setError(err.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#E5E9E6] p-4 text-center">
        <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[40px] shadow-2xl border border-white/40 max-w-md w-full">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail size={40} />
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">¡Registro Exitoso!</h2>
          <p className="text-[#666666] mb-8 text-sm leading-relaxed">
            Hemos enviado un correo de confirmación a <span className="font-bold text-[#1A1A1A]">{email}</span>. 
            Por favor verifica tu bandeja para activar tu cuenta.
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full h-12 bg-[#222222] hover:bg-black text-white font-medium rounded-2xl transition-all"
          >
            Volver al Inicio Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#E5E9E6] bg-gradient-to-br from-[#E5E9E6] via-[#F6EEDF] to-[#E5E9E6] text-[#1A1A1A] p-4">
      <div className="relative w-full max-w-[520px]">
        <div className="bg-white/80 backdrop-blur-xl shadow-xl shadow-black/5 rounded-[32px] border border-white/40 overflow-hidden">
          <div className="px-8 pt-10 pb-6 text-center flex flex-col items-center">
            <div className="mb-6">
              <svg viewBox="0 0 200 60" className="h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="16" height="60" fill="#111111" />
                <text x="24" y="44" fontFamily="sans-serif" fontWeight="bold" fontSize="42" fill="#111111" letterSpacing="-0.05em">ingentia</text>
              </svg>
            </div>
            <h1 className="text-3xl font-medium tracking-tight mb-2">Crear Cuenta</h1>
            <p className="text-[#666666] text-sm">Únete al Sistema de Gestión Ingentia</p>
          </div>

          <div className="px-8 pb-10">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}
            
            <form className="flex flex-col gap-4" onSubmit={handleRegister}>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">Nombre</label>
                  <input 
                    type="text" 
                    required 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 transition-all outline-none" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">Apellidos</label>
                  <input 
                    type="text" 
                    required 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 transition-all outline-none" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#1A1A1A]">Correo electrónico</label>
                <input 
                  type="email" 
                  placeholder="usuario@empresa.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 transition-all outline-none" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#1A1A1A]">Contraseña</label>
                <div className="relative flex items-center">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Mínimo 6 caracteres" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 pr-12 transition-all outline-none" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-[#666666] hover:text-[#1A1A1A]"
                  >
                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="mt-4 w-full h-12 bg-[#222222] hover:bg-black text-white font-medium rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <><span>Registrarse</span><ArrowRight size={20} /></>}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-black/5 text-center">
              <p className="text-sm text-[#666666]">
                ¿Ya tienes una cuenta?{" "}
                <Link to="/login" className="font-bold text-[#1A1A1A] hover:underline transition-colors">Iniciar Sesión</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
