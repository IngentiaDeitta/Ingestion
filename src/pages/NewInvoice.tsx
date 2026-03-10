import { ArrowLeft, Save, Plus, Trash2, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState } from 'react';

export default function NewInvoice() {
  const navigate = useNavigate();
  const [items, setItems] = useState([{ id: 1, description: '', quantity: 1, price: 0 }]);

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
  const tax = subtotal * 0.21; // 21% IVA
  const total = subtotal + tax;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/finance');
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1000px] mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/finance" className="p-3 bg-white/50 hover:bg-white/80 rounded-full transition-colors border border-black/5 shadow-sm">
          <ArrowLeft size={20} className="text-[#1A1A1A]" />
        </Link>
        <div>
          <h3 className="text-[42px] font-normal tracking-tight text-[#1A1A1A]">Nueva Factura</h3>
          <p className="text-[#666666] mt-1">Genera una nueva factura para un cliente.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8 flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#1A1A1A]">Cliente</label>
            <select required className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all appearance-none">
              <option value="">Seleccionar cliente...</option>
              <option value="1">TechCorp Solutions</option>
              <option value="2">Global Retail Group</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#1A1A1A]">Número de Factura</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FileText size={18} className="text-[#666666]" />
              </div>
              <input required type="text" defaultValue="F-2024-090" className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] pl-10 pr-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#1A1A1A]">Fecha de Emisión</label>
            <input required type="date" className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#1A1A1A]">Fecha de Vencimiento</label>
            <input required type="date" className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all" />
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 border-t border-black/5">
          <h4 className="text-lg font-medium text-[#1A1A1A]">Conceptos</h4>
          
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-[#666666] px-2">
              <div className="col-span-6">Descripción</div>
              <div className="col-span-2 text-center">Cantidad</div>
              <div className="col-span-2 text-right">Precio ($)</div>
              <div className="col-span-2 text-right">Total</div>
            </div>
            
            {items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 items-center bg-white/40 p-2 rounded-2xl border border-black/5">
                <div className="col-span-6">
                  <input 
                    type="text" 
                    placeholder="Descripción del servicio..." 
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className="w-full h-10 rounded-xl border border-black/10 bg-white/80 text-[#1A1A1A] px-3 focus:ring-2 focus:ring-[#FFD166] outline-none text-sm" 
                    required
                  />
                </div>
                <div className="col-span-2">
                  <input 
                    type="number" 
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full h-10 rounded-xl border border-black/10 bg-white/80 text-[#1A1A1A] px-3 focus:ring-2 focus:ring-[#FFD166] outline-none text-sm text-center" 
                    required
                  />
                </div>
                <div className="col-span-2">
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                    className="w-full h-10 rounded-xl border border-black/10 bg-white/80 text-[#1A1A1A] px-3 focus:ring-2 focus:ring-[#FFD166] outline-none text-sm text-right" 
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
            <div className="flex justify-between text-sm text-[#666666]">
              <span>Impuestos (21%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="h-px w-full bg-black/10 my-1"></div>
            <div className="flex justify-between text-lg font-medium text-[#1A1A1A]">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-black/5 gap-4">
          <Link to="/finance" className="px-6 py-3 rounded-full text-sm font-medium text-[#666666] hover:text-[#1A1A1A] hover:bg-white/50 transition-colors">
            Cancelar
          </Link>
          <button type="submit" className="flex items-center gap-2 bg-[#222222] hover:bg-black text-white px-8 py-3 rounded-full text-sm font-medium transition-colors shadow-lg shadow-black/10">
            <Save size={18} />
            Emitir Factura
          </button>
        </div>
      </form>
    </div>
  );
}
