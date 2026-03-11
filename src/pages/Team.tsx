import { useState, useEffect } from 'react';
import { Plus, User, Mail, Briefcase, Trash2, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar_color: string;
}

export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', role: '', email: '' });

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('team')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  };

  const [saving, setSaving] = useState(false);

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.role) {
      alert('Por favor completa Nombre y Rol');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('team')
        .insert([{
          name: newMember.name,
          role: newMember.role,
          email: newMember.email,
          avatar_color: ['#4F46E5', '#10B981', '#F43F5E', '#FFD166', '#8B5CF6', '#222222'][Math.floor(Math.random() * 6)]
        }]);

      if (error) throw error;
      
      await fetchTeam();
      setIsModalOpen(false);
      setNewMember({ name: '', role: '', email: '' });
      alert('Miembro añadido correctamente');
    } catch (error: any) {
      console.error('Error adding member:', error);
      alert('Error al guardar: ' + (error.message || 'Error desconocido. Verifica si creaste la tabla en Supabase.'));
    } finally {
      setSaving(false);
    }
  };

  const isDarkColor = (hex: string) => {
    if (!hex) return false;
    const color = hex.replace('#', '');
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 155;
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar a este miembro del equipo?')) return;

    try {
      const { error } = await supabase
        .from('team')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setMembers(members.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting member:', error);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-[42px] font-normal tracking-tight text-[#1A1A1A]">Equipo</h3>
          <p className="text-[#666666] mt-1">Gestiona los recursos y miembros de tu organización.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#222222] hover:bg-black text-white px-6 py-3 rounded-full text-sm font-medium transition-colors shadow-lg shadow-black/10"
        >
          <Plus size={20} />
          Añadir Miembro
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="text-sm text-[#666666] animate-pulse">Cargando equipo...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <div key={member.id} className="bg-white/60 backdrop-blur-xl p-6 rounded-[32px] border border-white/40 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
               <div className="flex items-center gap-4 mb-6">
                  <div 
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shadow-inner ${isDarkColor(member.avatar_color) ? 'text-white' : 'text-[#1A1A1A]'}`}
                    style={{ backgroundColor: member.avatar_color }}
                  >
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-lg font-medium text-[#1A1A1A]">{member.name}</h4>
                    <span className="text-xs font-medium text-[#666666] flex items-center gap-1">
                      <Briefcase size={12} /> {member.role}
                    </span>
                  </div>
               </div>

               <div className="flex flex-col gap-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-[#666666]">
                    <Mail size={14} />
                    <span>{member.email || 'Sin email'}</span>
                  </div>
               </div>

               <div className="flex items-center justify-between pt-4 border-t border-black/5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#999999]">Miembro Activo</span>
                  <button 
                    onClick={() => handleDeleteMember(member.id)}
                    className="p-2 text-[#666666] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Añadir Miembro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-black/5 flex justify-between items-center">
              <h3 className="text-xl font-medium text-[#1A1A1A]">Añadir al Equipo</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <X size={20} className="text-[#1A1A1A]" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#1A1A1A]">Nombre Completo</label>
                <input
                  autoFocus
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full h-12 rounded-2xl border border-black/10 bg-black/5 text-[#1A1A1A] px-4 outline-none focus:ring-2 focus:ring-[#FFD166]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#1A1A1A]">Rol / Especialidad</label>
                <input
                  type="text"
                  placeholder="Ej: Desarrollador, Diseñador..."
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  className="w-full h-12 rounded-2xl border border-black/10 bg-black/5 text-[#1A1A1A] px-4 outline-none focus:ring-2 focus:ring-[#FFD166]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#1A1A1A]">Email</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  className="w-full h-12 rounded-2xl border border-black/10 bg-black/5 text-[#1A1A1A] px-4 outline-none focus:ring-2 focus:ring-[#FFD166]"
                />
              </div>
            </div>

            <div className="p-6 border-t border-black/5 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-full text-sm font-medium text-[#666666] hover:bg-black/5 transition-colors">
                Cancelar
              </button>
              <button 
                onClick={handleAddMember}
                disabled={saving}
                className="flex items-center gap-2 bg-[#222222] hover:bg-black disabled:opacity-50 text-white px-6 py-3 rounded-full text-sm font-medium transition-colors"
              >
                <Save size={18} />
                {saving ? 'Guardando...' : 'Guardar Miembro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
