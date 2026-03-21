import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Camera,
  Building,
  Save,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';

type TabType = 'perfil' | 'empresa' | 'notificaciones' | 'seguridad';

export default function Settings() {
  const { user, profile, setProfile, isAdmin } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('perfil');
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // States para Perfil
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [role, setRole] = useState(profile?.role || '');

  // States para Empresa
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companySuccess, setCompanySuccess] = useState(false);
  const [companyData, setCompanyData] = useState({
    name: 'Ingentia S.L.',
    nif: 'B-12345678',
    address: 'Paseo de la Castellana 15, Madrid'
  });

  // States para Notificaciones
  const [notifSuccess, setNotifSuccess] = useState(false);
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    push_notifications: true,
    project_updates: true,
    marketing_emails: false
  });

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setRole(profile.role || '');
    }
  }, [profile]);

  useEffect(() => {
    fetchCompanySettings();
    if (user) fetchPreferences();
  }, [user]);

  const fetchCompanySettings = async () => {
    try {
      const { data } = await supabase.from('settings').select('*').eq('key', 'company_info').single();
      if (data && data.value) {
        setCompanyData(data.value);
      }
    } catch (err) {
      console.log('Usando valores de empresa por defecto');
    }
  };

  const fetchPreferences = async () => {
    try {
      const { data } = await supabase.from('user_preferences').select('*').eq('user_id', user?.id).single();
      if (data) {
        setPreferences({
          email_notifications: data.email_notifications,
          push_notifications: data.push_notifications,
          project_updates: data.project_updates,
          marketing_emails: data.marketing_emails
        });
      }
    } catch (err) {
      console.log('Usando preferencias por defecto');
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          role: role,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      if (profile) {
        setProfile({ ...profile, first_name: firstName, last_name: lastName, role: role });
      }
      alert('Perfil actualizado con éxito');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setPasswordLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert('Contraseña actualizada con éxito');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    try {
      setCompanyLoading(true);
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'company_info',
          value: companyData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setCompanySuccess(true);
      setTimeout(() => setCompanySuccess(false), 3000);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setCompanyLoading(false);
    }
  };

  const handleTogglePreference = async (key: keyof typeof preferences) => {
    if (!user) return;
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPrefs);
    
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...newPrefs,
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
      setNotifSuccess(true);
      setTimeout(() => setNotifSuccess(false), 2000);
    } catch (err: any) {
      console.error('Error saving preferences:', err);
    }
  };

  const tabs = [
    { id: 'perfil', label: 'Perfil', icon: User },
    { id: 'empresa', label: 'Empresa', icon: Building },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'seguridad', label: 'Seguridad', icon: Shield },
  ];

  return (
    <div className="flex-1 flex flex-col gap-8 w-full max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-4xl font-semibold text-[#1A1A1A] mb-2">Ajustes</h1>
        <p className="text-[#666666]">Gestiona tu cuenta y las preferencias de la empresa.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 flex flex-col gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                  activeTab === tab.id 
                    ? 'bg-[#222222] text-white shadow-lg shadow-black/5' 
                    : 'text-[#666666] hover:bg-black/5'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 bg-white border border-black/5 rounded-[32px] p-8 min-h-[500px]">
          {activeTab === 'perfil' && (
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-8">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                    {firstName?.[0] || user?.email?.[0]?.toUpperCase()}
                    {lastName?.[0]}
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full border border-black/5 shadow-lg group-hover:scale-110 transition-transform">
                    <Camera size={16} className="text-[#1A1A1A]" />
                  </button>
                </div>
                <button className="px-6 py-2.5 rounded-full border border-black/10 text-sm font-medium hover:bg-black/5 transition-colors">
                  Cambiar Avatar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">Nombre</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 outline-none focus:ring-2 focus:ring-[#FFD166]" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">Apellidos</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 outline-none focus:ring-2 focus:ring-[#FFD166]" />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">Correo Electrónico</label>
                  <input type="email" value={user?.email || ''} disabled className="w-full h-12 rounded-2xl border border-black/10 bg-black/5 text-[#666666] px-4" />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">Cargo</label>
                  <input 
                    type="text" 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)} 
                    disabled={!isAdmin}
                    className={`w-full h-12 rounded-2xl border border-black/10 text-[#1A1A1A] px-4 outline-none transition-all ${!isAdmin ? 'bg-black/5 text-[#666666] cursor-not-allowed' : 'bg-white/50 focus:ring-2 focus:ring-[#FFD166]'}`} 
                  />
                  {!isAdmin && <p className="text-[10px] text-[#666666] mt-1 ml-1">Solo un administrador puede cambiar los roles.</p>}
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-black/5">
                <button onClick={handleSaveProfile} disabled={loading} className="flex items-center gap-2 bg-[#222222] hover:bg-black text-white px-8 py-3 rounded-full text-sm font-medium transition-colors disabled:opacity-50">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {loading ? 'Guardando...' : 'Guardar Perfil'}
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
                  <input 
                    type="text" 
                    value={companyData.name} 
                    onChange={(e) => setCompanyData({...companyData, name: e.target.value})} 
                    disabled={!isAdmin}
                    className={`w-full h-12 rounded-2xl border border-black/10 text-[#1A1A1A] px-4 outline-none transition-all ${!isAdmin ? 'bg-black/5 text-[#666666] cursor-not-allowed' : 'bg-white/50 focus:ring-2 focus:ring-[#FFD166]'}`} 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">NIF / CIF</label>
                  <input 
                    type="text" 
                    value={companyData.nif} 
                    onChange={(e) => setCompanyData({...companyData, nif: e.target.value})} 
                    disabled={!isAdmin}
                    className={`w-full h-12 rounded-2xl border border-black/10 text-[#1A1A1A] px-4 outline-none transition-all ${!isAdmin ? 'bg-black/5 text-[#666666] cursor-not-allowed' : 'bg-white/50 focus:ring-2 focus:ring-[#FFD166]'}`} 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">Dirección Fiscal</label>
                  <input 
                    type="text" 
                    value={companyData.address} 
                    onChange={(e) => setCompanyData({...companyData, address: e.target.value})} 
                    disabled={!isAdmin}
                    className={`w-full h-12 rounded-2xl border border-black/10 text-[#1A1A1A] px-4 outline-none transition-all ${!isAdmin ? 'bg-black/5 text-[#666666] cursor-not-allowed' : 'bg-white/50 focus:ring-2 focus:ring-[#FFD166]'}`} 
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4 pt-6 border-t border-black/5 items-center gap-4">
                {companySuccess && <span className="text-emerald-600 text-sm font-medium flex items-center gap-1"><CheckCircle2 size={16} /> Guardado</span>}
                {isAdmin ? (
                  <button onClick={handleSaveCompany} disabled={companyLoading} className="flex items-center gap-2 bg-[#222222] hover:bg-black text-white px-8 py-3 rounded-full text-sm font-medium transition-colors disabled:opacity-50">
                    {companyLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {companyLoading ? 'Guardando...' : 'Guardar Empresa'}
                  </button>
                ) : (
                  <p className="text-sm italic text-[#666666]">Se requieren privilegios de administrador para editar la empresa.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notificaciones' && (
            <div className="flex flex-col gap-8 max-w-2xl">
              <div>
                <h4 className="text-xl font-medium text-[#1A1A1A] mb-2">Preferencias de Notificación</h4>
                <p className="text-sm text-[#666666]">Elige cómo quieres recibir las actualizaciones de tus proyectos.</p>
              </div>

              <div className="flex flex-col gap-4">
                {[
                  { id: 'email_notifications', label: 'Notificaciones por Email', desc: 'Recibe resúmenes diarios en tu bandeja de entrada.' },
                  { id: 'push_notifications', label: 'Notificaciones Push', desc: 'Alertas inmediatas en el navegador.' },
                  { id: 'project_updates', label: 'Actualizaciones de Proyectos', desc: 'Avisar cuando alguien comenta o cambia el estado de un proyecto.' },
                  { id: 'marketing_emails', label: 'Comunicaciones de Ingentia', desc: 'Novedades y nuevas funcionalidades del sistema.' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-[24px] border border-black/5 bg-black/[0.01] hover:bg-black/[0.03] transition-colors">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-[#1A1A1A]">{item.label}</span>
                      <span className="text-xs text-[#666666]">{item.desc}</span>
                    </div>
                    <button 
                      onClick={() => handleTogglePreference(item.id as keyof typeof preferences)}
                      className={`w-12 h-6 rounded-full transition-all relative ${preferences[item.id as keyof typeof preferences] ? 'bg-[#FFD166]' : 'bg-black/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${preferences[item.id as keyof typeof preferences] ? 'left-7 shadow-sm' : 'left-1'}`}></div>
                    </button>
                  </div>
                ))}
              </div>
              
              {notifSuccess && (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
                  <CheckCircle2 size={16} /> Preferencias actualizadas automáticamente
                </div>
              )}
            </div>
          )}

          {activeTab === 'seguridad' && (
            <div className="flex flex-col gap-6 max-w-2xl">
              <div>
                <h4 className="text-xl font-medium text-[#1A1A1A] mb-2">Seguridad de la Cuenta</h4>
                <p className="text-sm text-[#666666]">Actualiza tu contraseña para mantener tu cuenta segura.</p>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">Nueva Contraseña</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 px-4 outline-none focus:ring-2 focus:ring-[#FFD166]" placeholder="Al menos 6 caracteres" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">Confirmar Nueva Contraseña</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 px-4 outline-none focus:ring-2 focus:ring-[#FFD166]" placeholder="Repite la contraseña" />
                </div>
              </div>
              <div className="flex justify-end mt-4 pt-6 border-t border-black/5">
                <button onClick={handleUpdatePassword} disabled={passwordLoading} className="flex items-center gap-2 bg-[#222222] hover:bg-black text-white px-8 py-3 rounded-full text-sm font-medium transition-colors disabled:opacity-50">
                  {passwordLoading ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                  {passwordLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
