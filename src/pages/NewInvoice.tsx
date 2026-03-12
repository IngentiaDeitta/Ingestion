import { ArrowLeft, Save, Plus, Trash2, FileText, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { sendNotification } from '../lib/notifications';

export default function NewInvoice() {
  const navigate = useNavigate();
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [items, setItems] = useState([{ id: 1, description: '', quantity: 1, price: 0 }]);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [projects, setProjects] = useState<{id: string, name: string}[]>([]);
  const [formData, setFormData] = useState({
    clientId: '',
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    invNumber: `F-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
    status: 'Pending'
  });

  useEffect(() => {
    fetchClientsAndProjects();
  }, []);

  const fetchClientsAndProjects = async () => {
    const { data: cData } = await supabase.from('clients').select('id, name').order('name');
    setClients(cData || []);
    const { data: pData } = await supabase.from('projects').select('id, name').order('name');
    setProjects(pData || []);
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), description: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: number, field: string, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const tax = type === 'income' ? subtotal * 0.21 : 0; // Solo IVA para ingresos ejemplo
  const total = subtotal + tax;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('finances').insert([{
        description: items.map(i => i.description).join(', ') || (type === 'income' ? 'Nueva Factura' : 'Nuevo Gasto'),
        amount: total,
        type: type,
        status: 'Pending',
        client_id: formData.clientId || null,
        project_id: formData.projectId || null,
        date: formData.date
      }]);

      if (error) throw error;

      await sendNotification(
        type === 'income' ? 'Nueva Factura Generada' : 'Nuevo Gasto Registrado',
        `Se ha registrado un monto de $${total.toLocaleString()} (${type === 'income' ? 'Ingreso' : 'Egreso'}).`,
        'invoice'
      );

      navigate('/finance');
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Error al guardar la transacción');
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/finance" className="p-3 bg-white/50 hover:bg-white/80 rounded-full transition-colors border border-black/5 shadow-sm">
            <ArrowLeft size={20} className="text-[#1A1A1A]" />
          </Link>
          <div>
            <h3 className="text-[42px] font-normal tracking-tight text-[#1A1A1A]">Nueva Transacción</h3>
            <p className="text-[#666666] mt-1">Registra un nuevo {type === 'income' ? 'ingreso' : 'gasto'} en el sistema.</p>
          </div>
        </div>

        <div className="flex bg-white/50 p-1 rounded-2xl border border-black/5">
          <button 
            onClick={() => setType('income')}
            className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${type === 'income' ? 'bg-[#222222] text-white shadow-lg' : 'text-[#666666] hover:bg-black/5'}`}
          >
            Ingreso
          </button>
          <button 
            onClick={() => setType('expense')}
            className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${type === 'expense' ? 'bg-[#222222] text-white shadow-lg' : 'text-[#666666] hover:bg-black/5'}`}
          >
            Gasto
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8 flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#1A1A1A]">Cliente (Opcional)</label>
            <select 
              value={formData.clientId}
              onChange={(e) => setFormData({...formData, clientId: e.target.value})}
              className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 outline-none appearance-none"
            >
              <option value="">Seleccionar cliente...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#1A1A1A]">Proyecto Asociado (Opcional)</label>
            <select 
              value={formData.projectId}
              onChange={(e) => setFormData({...formData, projectId: e.target.value})}
              className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 outline-none appearance-none"
            >
              <option value="">Seleccionar proyecto...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#1A1A1A]">Referencia / Nro Comprobante</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FileText size={18} className="text-[#666666]" />
              </div>
              <input 
                required 
                type="text" 
                value={formData.invNumber}
                onChange={(e) => setFormData({...formData, invNumber: e.target.value})}
                className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] pl-10 pr-4 outline-none" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#1A1A1A]">Fecha</label>
            <input 
              required 
              type="date" 
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 outline-none" 
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 border-t border-black/5">
          <h4 className="text-lg font-medium text-[#1A1A1A]">{type === 'income' ? 'Conceptos de Facturación' : 'Detalle del Gasto'}</h4>
          
          <div className="flex flex-col gap-3">
            {items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 items-center bg-white/40 p-2 rounded-2xl border border-black/5">
                <div className="col-span-6">
                  <input 
                    type="text" 
                    placeholder="Descripción..." 
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className="w-full h-10 rounded-xl border border-black/10 bg-white/80 text-[#1A1A1A] px-3 outline-none text-sm" 
                    required
                  />
                </div>
                <div className="col-span-2">
                  <input 
                    type="number" 
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full h-10 rounded-xl border border-black/10 bg-white/80 text-[#1A1A1A] px-3 outline-none text-sm text-center" 
                    required
                  />
                </div>
                <div className="col-span-2">
                  <input 
                    type="number" 
                    value={item.price}
                    onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                    className="w-full h-10 rounded-xl border border-black/10 bg-white/80 text-[#1A1A1A] px-3 outline-none text-sm text-right" 
                    required
                  />
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2 pr-2">
                  <span className="text-sm font-medium text-[#1A1A1A] w-full text-right">${(item.quantity * item.price).toFixed(2)}</span>
                  <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-[#666666] hover:text-red-500 transition-colors p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={handleAddItem} className="self-start flex items-center gap-2 text-sm font-medium text-[#1A1A1A] bg-white/50 hover:bg-white/80 border border-black/10 px-4 py-2 rounded-full transition-colors mt-2">
            <Plus size={16} /> Añadir Concepto
          </button>
        </div>

        <div className="flex justify-end pt-6 border-t border-black/5">
          <div className="w-full max-w-xs flex flex-col gap-3">
            <div className="flex justify-between text-sm text-[#666666]">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {type === 'income' && (
              <div className="flex justify-between text-sm text-[#666666]">
                <span>IVA (21%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
            )}
            <div className="h-px w-full bg-black/10 my-1"></div>
            <div className="flex justify-between text-lg font-medium text-[#1A1A1A]">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-black/5 gap-4">
          <Link to="/finance" className="px-6 py-3 rounded-full text-sm font-medium text-[#666666] hover:text-[#1A1A1A] transition-colors">
            Cancelar
          </Link>
          <button type="submit" className="flex items-center gap-2 bg-[#222222] hover:bg-black text-white px-8 py-3 rounded-full text-sm font-medium transition-colors shadow-lg shadow-black/10">
            <Save size={18} />
            {type === 'income' ? 'Emitir Factura' : 'Guardar Gasto'}
          </button>
        </div>
      </form>
    </div>
  );
}
