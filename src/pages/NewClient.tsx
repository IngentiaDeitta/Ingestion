import { ArrowLeft, Save, Building, Mail, Phone, MapPin, Globe, UserPlus, Trash2, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { sendNotification } from '../lib/notifications';

export default function NewClient() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    contactName: '',
    contactRole: ''
  });

  const [contactList, setContactList] = useState<Array<{first_name: string, last_name: string, email: string}>>([]);
  const [newContact, setNewContact] = useState({ first_name: '', last_name: '', email: '' });
  const [showContactForm, setShowContactForm] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert([{
          name: formData.name,
          industry: formData.industry,
          email: formData.email,
          phone: formData.phone,
          contact_person: formData.contactName,
          status: 'Activo'
        }])
        .select()
        .single();

      if (clientError) throw clientError;

      if (clientData && contactList.length > 0) {
        const { error: contactsError } = await supabase
          .from('client_contacts')
          .insert(contactList.map(c => ({
            client_id: clientData.id,
            first_name: c.first_name,
            last_name: c.last_name,
            email: c.email
          })));
        if (contactsError) throw contactsError;
      }

      await sendNotification(
        'Nuevo Cliente Registrado', 
        `La empresa '${formData.name}' ha sido agregada con éxito al directorio.`,
        'client'
      );

      navigate('/clients');
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Error al crear el cliente');
    } finally {
      setLoading(false);
    }
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
              <input required type="tel" placeholder="+54 9 11 ..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] pl-10 pr-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" />
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
          <h4 className="text-lg font-medium text-[#1A1A1A]">Personas de Contacto Adicionales</h4>
          
          <div className="flex flex-col gap-4">
            {contactList.map((contact, index) => (
              <div key={index} className="flex items-center justify-between bg-white/40 p-4 rounded-[20px] border border-black/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center font-bold text-xs">
                    {contact.first_name[0]}{contact.last_name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">{contact.first_name} {contact.last_name}</p>
                    <p className="text-xs text-[#666666]">{contact.email}</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setContactList(contactList.filter((_, i) => i !== index))}
                  className="p-2 hover:bg-red-50 rounded-full text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {!showContactForm ? (
              <button 
                type="button"
                onClick={() => setShowContactForm(true)}
                className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-black/5 rounded-[20px] text-[#666666] hover:border-[#FFD166] hover:text-[#1A1A1A] transition-all"
              >
                <UserPlus size={18} />
                <span className="text-sm font-medium">Agregar Persona de Contacto</span>
              </button>
            ) : (
              <div className="bg-white/80 p-6 rounded-[24px] border border-[#FFD166]/50 shadow-sm flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#666666] uppercase">Nombre</label>
                    <input 
                      type="text" 
                      placeholder="Juan"
                      value={newContact.first_name}
                      onChange={e => setNewContact({...newContact, first_name: e.target.value})}
                      className="w-full h-11 rounded-xl border border-black/10 bg-white px-4 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#666666] uppercase">Apellido</label>
                    <input 
                      type="text" 
                      placeholder="Perez"
                      value={newContact.last_name}
                      onChange={e => setNewContact({...newContact, last_name: e.target.value})}
                      className="w-full h-11 rounded-xl border border-black/10 bg-white px-4 text-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase">Email</label>
                  <input 
                    type="email" 
                    placeholder="email@empresa.com"
                    value={newContact.email}
                    onChange={e => setNewContact({...newContact, email: e.target.value})}
                    className="w-full h-11 rounded-xl border border-black/10 bg-white px-4 text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button type="button" onClick={() => setShowContactForm(false)} className="px-4 py-2 text-sm font-medium text-[#666666]">Cancelar</button>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (newContact.first_name && newContact.last_name && newContact.email) {
                        setContactList([...contactList, newContact]);
                        setNewContact({ first_name: '', last_name: '', email: '' });
                        setShowContactForm(false);
                      }
                    }}
                    className="bg-[#1A1A1A] text-white px-6 py-2 rounded-full text-sm font-medium"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-black/5 gap-4">
          <Link to="/clients" className="px-6 py-3 rounded-full text-sm font-medium text-[#666666] hover:text-[#1A1A1A] hover:bg-white/50 transition-colors">
            Cancelar
          </Link>
          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center gap-2 bg-[#222222] hover:bg-black disabled:opacity-50 text-white px-8 py-3 rounded-full text-sm font-medium transition-colors shadow-lg shadow-black/10"
          >
            <Save size={18} />
            {loading ? 'Guardando...' : 'Crear Cliente'}
          </button>
        </div>
      </form>
    </div>
  );
}
