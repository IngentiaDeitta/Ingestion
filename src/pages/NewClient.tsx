import { ArrowLeft, Save, Building, Mail, Phone, MapPin, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState } from 'react';

export default function NewClient() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    taxId: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    contactName: '',
    contactRole: ''
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate save and redirect
    navigate('/clients');
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1000px] mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/clients" className="p-3 bg-white/50 hover:bg-white/80 rounded-full transition-colors border border-black/5 shadow-sm">
          <ArrowLeft size={20} className="text-[#1A1A1A]" />
        </Link>
        <div>
          <h3 className="text-[42px] font-normal tracking-tight text-[#1A1A1A]">Nuevo Cliente</h3>
          <p className="text-[#666666] mt-1">Registra un nuevo cliente en el sistema.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8 flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-medium text-[#1A1A1A]">Nombre de la Empresa</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Building size={18} className="text-[#666666]" />
              </div>
              <input required type="text" placeholder="Ej. TechCorp Solutions" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] pl-10 pr-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" />
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#1A1A1A]">Sector / Industria</label>
            <input required type="text" placeholder="Ej. Tecnología y Software" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#1A1A1A]">NIF / CIF</label>
            <input required type="text" placeholder="Ej. B-12345678" value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#1A1A1A]">Correo Electrónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={18} className="text-[#666666]" />
              </div>
              <input required type="email" placeholder="contacto@empresa.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] pl-10 pr-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#1A1A1A]">Teléfono</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone size={18} className="text-[#666666]" />
              </div>
              <input required type="tel" placeholder="+34 900 000 000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] pl-10 pr-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" />
            </div>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-medium text-[#1A1A1A]">Dirección</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MapPin size={18} className="text-[#666666]" />
              </div>
              <input required type="text" placeholder="Calle Principal 123, Ciudad" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] pl-10 pr-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" />
            </div>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-medium text-[#1A1A1A]">Sitio Web</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Globe size={18} className="text-[#666666]" />
              </div>
              <input type="url" placeholder="https://www.empresa.com" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] pl-10 pr-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 pt-6 border-t border-black/5">
          <h4 className="text-lg font-medium text-[#1A1A1A]">Contacto Principal</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Nombre Completo</label>
              <input required type="text" placeholder="Ej. María Rodríguez" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Cargo</label>
              <input required type="text" placeholder="Ej. Directora de Operaciones" value={formData.contactRole} onChange={e => setFormData({...formData, contactRole: e.target.value})} className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-black/5 gap-4">
          <Link to="/clients" className="px-6 py-3 rounded-full text-sm font-medium text-[#666666] hover:text-[#1A1A1A] hover:bg-white/50 transition-colors">
            Cancelar
          </Link>
          <button type="submit" className="flex items-center gap-2 bg-[#222222] hover:bg-black text-white px-8 py-3 rounded-full text-sm font-medium transition-colors shadow-lg shadow-black/10">
            <Save size={18} />
            Crear Cliente
          </button>
        </div>
      </form>
    </div>
  );
}
