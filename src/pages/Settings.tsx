import { useState, useRef, ChangeEvent } from 'react';
import { User, Building, Bell, Shield, Save, Upload } from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function Settings() {
  const { profile, updateProfile } = useUser();
  const [activeTab, setActiveTab] = useState('perfil');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    role: profile.role,
    avatarUrl: profile.avatarUrl || ''
  });

  const handleSaveProfile = () => {
    updateProfile(formData);
    // You could add a toast notification here
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto">
      <div>
        <h3 className="text-[42px] font-normal tracking-tight text-[#1A1A1A]">Ajustes</h3>
        <p className="text-[#666666] mt-1">Gestiona tu cuenta y las preferencias de la empresa.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
          <button onClick={() => setActiveTab('perfil')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${activeTab === 'perfil' ? 'bg-[#222222] text-white shadow-md' : 'bg-white/40 text-[#4A4A4A] hover:bg-white/60 border border-white/50'}`}>
            <User size={18} /> Perfil
          </button>
          <button onClick={() => setActiveTab('empresa')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${activeTab === 'empresa' ? 'bg-[#222222] text-white shadow-md' : 'bg-white/40 text-[#4A4A4A] hover:bg-white/60 border border-white/50'}`}>
            <Building size={18} /> Empresa
          </button>
          <button onClick={() => setActiveTab('notificaciones')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${activeTab === 'notificaciones' ? 'bg-[#222222] text-white shadow-md' : 'bg-white/40 text-[#4A4A4A] hover:bg-white/60 border border-white/50'}`}>
            <Bell size={18} /> Notificaciones
          </button>
          <button onClick={() => setActiveTab('seguridad')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${activeTab === 'seguridad' ? 'bg-[#222222] text-white shadow-md' : 'bg-white/40 text-[#4A4A4A] hover:bg-white/60 border border-white/50'}`}>
            <Shield size={18} /> Seguridad
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8">
          {activeTab === 'perfil' && (
            <div className="flex flex-col gap-6 max-w-2xl">
              <h4 className="text-xl font-medium text-[#1A1A1A] mb-2">Información Personal</h4>

              <div className="flex items-center gap-6 mb-4">
                <div className="w-24 h-24 rounded-full bg-[#222222] flex items-center justify-center text-white text-2xl font-light overflow-hidden">
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    `${formData.firstName[0]}${formData.lastName[0]}`
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-white/50 border border-black/10 rounded-full text-sm font-medium text-[#1A1A1A] hover:bg-white/80 transition-colors flex items-center gap-2"
                  >
                    <Upload size={16} />
                    Cambiar Avatar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">Nombre</label>
                  <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">Apellidos</label>
                  <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">Correo Electrónico</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">Cargo</label>
                  <input type="text" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" />
                </div>
              </div>

              <div className="flex justify-end mt-4 pt-6 border-t border-black/5">
                <button onClick={handleSaveProfile} className="flex items-center gap-2 bg-[#222222] hover:bg-black text-white px-6 py-3 rounded-full text-sm font-medium transition-colors shadow-lg shadow-black/10">
                  <Save size={18} />
                  Guardar Cambios
                </button>
              </div>
            </div>
          )}

          {activeTab === 'empresa' && (
            <div className="flex flex-col gap-6 max-w-2xl">
              <h4 className="text-xl font-medium text-[#1A1A1A] mb-2">Detalles de la Empresa</h4>
              <div className="grid grid-cols-1 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">Nombre de la Empresa</label>
                  <input type="text" defaultValue="Ingentia S.L." className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">NIF / CIF</label>
                  <input type="text" defaultValue="B-12345678" className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">Dirección Fiscal</label>
                  <input type="text" defaultValue="Paseo de la Castellana 15, Madrid" className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" />
                </div>
              </div>
              <div className="flex justify-end mt-4 pt-6 border-t border-black/5">
                <button className="flex items-center gap-2 bg-[#222222] hover:bg-black text-white px-6 py-3 rounded-full text-sm font-medium transition-colors shadow-lg shadow-black/10">
                  <Save size={18} />
                  Guardar Cambios
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notificaciones' && (
            <div className="flex flex-col gap-6 max-w-2xl">
              <h4 className="text-xl font-medium text-[#1A1A1A] mb-2">Preferencias de Notificación</h4>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-black/5">
                  <div>
                    <p className="font-medium text-[#1A1A1A]">Resumen Diario</p>
                    <p className="text-xs text-[#666666]">Recibe un email con el resumen de tareas diarias.</p>
                  </div>
                  <div className="w-12 h-6 bg-[#FFD166] rounded-full relative cursor-pointer">
                    <div className="w-4 h-4 bg-[#222222] rounded-full absolute right-1 top-1"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-black/5">
                  <div>
                    <p className="font-medium text-[#1A1A1A]">Alertas de Proyectos</p>
                    <p className="text-xs text-[#666666]">Notificaciones cuando un proyecto entra en riesgo.</p>
                  </div>
                  <div className="w-12 h-6 bg-[#FFD166] rounded-full relative cursor-pointer">
                    <div className="w-4 h-4 bg-[#222222] rounded-full absolute right-1 top-1"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-black/5">
                  <div>
                    <p className="font-medium text-[#1A1A1A]">Nuevos Mensajes</p>
                    <p className="text-xs text-[#666666]">Notificaciones push para mensajes directos.</p>
                  </div>
                  <div className="w-12 h-6 bg-black/10 rounded-full relative cursor-pointer">
                    <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1 shadow-sm"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seguridad' && (
            <div className="flex flex-col gap-6 max-w-2xl">
              <h4 className="text-xl font-medium text-[#1A1A1A] mb-2">Seguridad de la Cuenta</h4>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">Contraseña Actual</label>
                  <input type="password" placeholder="••••••••" className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">Nueva Contraseña</label>
                  <input type="password" placeholder="••••••••" className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" />
                </div>
              </div>
              <div className="flex justify-end mt-4 pt-6 border-t border-black/5">
                <button className="flex items-center gap-2 bg-[#222222] hover:bg-black text-white px-6 py-3 rounded-full text-sm font-medium transition-colors shadow-lg shadow-black/10">
                  <Save size={18} />
                  Actualizar Contraseña
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
