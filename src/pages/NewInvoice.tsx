import { ArrowLeft, Save, Plus, Trash2, FileText, Building2, Tag } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { sendNotification } from '../lib/notifications';

const TRANSACTION_TAGS = [
  { value: 'operational', label: 'Costos Operativos' },
  { value: 'salaries',    label: 'Sueldos' },
  { value: 'travel',      label: 'Viáticos' },
  { value: 'software',    label: 'Licencias/Software' },
  { value: 'capital',     label: 'Ajuste de Capital / Inversión' },
  { value: 'contribution', label: 'Aporte de Capital' },
  { value: 'other',       label: 'Otros' },
];

// Fund sources are now partially handled by partners for specific tags
const FUND_SOURCES = [
  { value: 'Pedro',    label: 'Pedro' },
  { value: 'Fernando', label: 'Fernando' },
  { value: 'Ingentia', label: 'Ingentia' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD — Dólar estadounidense', symbol: '$' },
  { value: 'ARS', label: 'ARS — Peso argentino',      symbol: '$' },
  { value: 'EUR', label: 'EUR — Euro',                symbol: '€' },
];

export default function NewInvoice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [type, setType] = useState<'income' | 'expense' | 'withdrawal'>('income');
  const [items, setItems] = useState([{ id: 1, description: '', quantity: 1, price: 0 }]);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [projects, setProjects] = useState<{id: string, name: string}[]>([]);
  const [partners, setPartners] = useState<{id: string, name: string}[]>([]);
  const [isIngentia, setIsIngentia] = useState(false);
  
  // Partner assignment states
  const [distributionMode, setDistributionMode] = useState<'equal' | 'manual'>('equal');
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [manualAmounts, setManualAmounts] = useState<Record<string, number>>({});
  const [includeTax, setIncludeTax] = useState(false);

  const [formData, setFormData] = useState({
    clientId: '',
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    invNumber: '',
    status: 'Pending',
    currency: 'USD',
    tag: '',
    fundSource: '',
  });

  useEffect(() => { 
    fetchClientsProjectsAndPartners(); 
    if (isEditing) fetchTransactionToEdit();
  }, [id]);

  const fetchTransactionToEdit = async () => {
    const { data, error } = await supabase.from('finances').select('*').eq('id', id).single();
    if (error) {
      console.error('Error fetching transaction:', error);
      return;
    }
    
    setType(data.type);
    setFormData({
      clientId: data.client_id || '',
      projectId: data.project_id || '',
      date: data.date,
      invNumber: data.description || '', 
      status: data.status || 'Pending',
      currency: data.currency || 'USD',
      tag: data.tag || '',
      fundSource: data.fund_source || '',
    });
    
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      setItems(data.items);
      const itemsSubtotal = data.items.reduce((acc: number, item: any) => acc + (item.quantity * item.price), 0);
      const dbAmount = parseFloat(data.amount || '0');
      // If total amount is ~21% higher than items sum, enable tax toggle
      if (Math.abs(dbAmount - itemsSubtotal * 1.21) < 0.05) {
        setIncludeTax(true);
      }
    } else {
      // Fallback: If no structured items, create one from total and description
      const dbAmount = parseFloat(data.amount || '0');
      // If it's an income, check if it was likely with VAT
      if (data.type === 'income') {
        // We assume new default is NO VAT. 
        // But for old ones, we might need to check. 
        // For simplicity in fallback, we'll keep the subtotal = total if we can't be sure.
        setItems([{ id: Date.now(), description: data.description || '', quantity: 1, price: dbAmount }]);
      } else {
        setItems([{ id: Date.now(), description: data.description || '', quantity: 1, price: dbAmount }]);
      }
    }

    if (!data.client_id && !data.project_id && data.type === 'expense') setIsIngentia(true);
  };

  const fetchClientsProjectsAndPartners = async () => {
    const { data: cData } = await supabase.from('clients').select('id, name').order('name');
    setClients(cData || []);
    const { data: pData } = await supabase.from('projects').select('id, name').order('name');
    setProjects(pData || []);
    const { data: partData } = await supabase.from('partners').select('id, name').order('name');
    setPartners(partData || []);
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), description: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (id: number) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: number, field: string, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const subtotal = items.reduce((acc, item: any) => acc + (item.quantity * item.price), 0);
  const tax = (type === 'income' && includeTax) ? subtotal * 0.21 : 0;
  const total = subtotal + tax;

  const currencySymbol = CURRENCIES.find(c => c.value === formData.currency)?.symbol ?? '$';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Record<string, any> = {
        description: items.map(i => i.description).join(', ') || (type === 'income' ? 'Nueva Factura' : 'Nuevo Gasto'),
        amount: Number(total.toFixed(2)),
        type: type,
        status: (isEditing ? formData.status : 'Pending') || 'Pending',
        date: formData.date,
        currency: formData.currency,
        tag: formData.tag || null,
        client_id:  (!isIngentia && formData.clientId)  ? formData.clientId  : null,
        project_id: (!isIngentia && formData.projectId) ? formData.projectId : null,
        fund_source: type === 'expense' ? formData.fundSource : null,
        items: items, // Persist structured items
      };

      const { data: insertedData, error } = isEditing 
        ? await supabase.from('finances').update(payload).eq('id', id).select()
        : await supabase.from('finances').insert([payload]).select();
      
      if (error) throw error;

      const financeId = insertedData?.[0]?.id;

      if (financeId && (type === 'withdrawal' || formData.tag === 'contribution')) {
        // Delete existing assignments if editing
        if (isEditing) {
          await supabase.from('partner_transactions').delete().eq('finance_id', financeId);
        }

        const assignments = selectedPartners.map(pId => ({
          finance_id: financeId,
          partner_id: pId,
          amount: distributionMode === 'equal' ? total / selectedPartners.length : (manualAmounts[pId] || 0),
          type: type === 'withdrawal' ? 'withdrawal' : 'contribution'
        }));

        const { error: partErr } = await supabase.from('partner_transactions').insert(assignments);
        if (partErr) console.error('Error saving partner assignments:', partErr);
      }

      await sendNotification(
        isEditing ? 'Transacción Actualizada' : (type === 'income' ? 'Nueva Factura Generada' : (type === 'expense' ? 'Nuevo Gasto Registrado' : 'Retiro de Capital')),
        `Se ha ${isEditing ? 'modificado' : 'registrado'} un monto de ${currencySymbol}${total.toLocaleString()} (${type === 'income' ? 'Ingreso' : (type === 'expense' ? 'Gasto' : 'Retiro')}).`,
        'invoice'
      );

      navigate('/finance');
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      alert(`Error al guardar la transacción: ${error.message || 'Error desconocido'}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-8 w-full max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/finance" className="p-3 bg-white/50 hover:bg-white/80 rounded-full transition-colors border border-black/5 shadow-sm">
            <ArrowLeft size={20} className="text-[#1A1A1A]" />
          </Link>
          <div>
            <h3 className="text-[42px] font-normal tracking-tight text-[#1A1A1A]">{isEditing ? 'Editar Transacción' : 'Nueva Transacción'}</h3>
            <p className="text-[#666666] mt-1">{isEditing ? 'Modifica los detalles de la entrada seleccionada.' : `Registra un nuevo ${type === 'income' ? 'ingreso' : 'gasto'} en el sistema.`}</p>
          </div>
        </div>

        {/* Type toggle */}
        {!isEditing && (
          <div className="flex bg-white/50 p-1 rounded-2xl border border-black/5 shadow-inner">
            <button
              type="button"
              onClick={() => { setType('income'); setIsIngentia(false); }}
              className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${type === 'income' ? 'bg-[#222222] text-white shadow-lg' : 'text-[#666666] hover:bg-black/5'}`}
            >
              Ingreso
            </button>
            <button
              type="button"
              onClick={() => { setType('expense'); setIsIngentia(false); }}
              className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${type === 'expense' ? 'bg-[#222222] text-white shadow-lg' : 'text-[#666666] hover:bg-black/5'}`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => { setType('withdrawal'); setIsIngentia(false); }}
              className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${type === 'withdrawal' ? 'bg-[#FFD166] text-black shadow-lg' : 'text-[#666666] hover:bg-black/5'}`}
            >
              Retiro
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8 flex flex-col gap-8">

        {/* ── Sección: Datos generales ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Moneda */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#1A1A1A]">Moneda</label>
            <select
              value={formData.currency}
              onChange={e => setFormData({ ...formData, currency: e.target.value })}
              className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 outline-none appearance-none"
            >
              {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Tag — solo gastos e ingresos */}
          {type !== 'withdrawal' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1A1A1A] flex items-center gap-2">
                <Tag size={14} /> Categoría
              </label>
              <select
                value={formData.tag}
                onChange={e => setFormData({ ...formData, tag: e.target.value })}
                className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 outline-none appearance-none"
              >
                <option value="">{type === 'income' ? 'Ventas / Servicios (Default)' : 'Sin categoría...'}</option>
                {TRANSACTION_TAGS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          )}

          {/* Reference */}
          {type !== 'withdrawal' && (
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
                  onChange={e => setFormData({ ...formData, invNumber: e.target.value })}
                  className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] pl-10 pr-4 outline-none"
                />
              </div>
            </div>
          )}

          {/* Fecha */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#1A1A1A]">Fecha</label>
            <input
              required
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 outline-none"
            />
          </div>

          {/* Origen de los fondos — solo gastos */}
          {type === 'expense' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Origen de los Fondos</label>
              <select
                required
                value={formData.fundSource}
                onChange={e => setFormData({ ...formData, fundSource: e.target.value })}
                className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 outline-none appearance-none"
              >
                <option value="">Seleccionar origen...</option>
                {FUND_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* ── Sección: Origen del gasto (solo para expenses) ── */}
        {type === 'expense' && (
          <div className="flex flex-col gap-4 pt-6 border-t border-black/5">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-medium text-[#1A1A1A]">Origen del Gasto</h4>
              {/* Toggle Ingentia */}
              <button
                type="button"
                onClick={() => setIsIngentia(!isIngentia)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  isIngentia
                    ? 'bg-[#222222] text-[#FFD166] border-[#222222] shadow-lg'
                    : 'bg-white/50 text-[#666666] border-black/10 hover:bg-white/80'
                }`}
              >
                <Building2 size={16} />
                {isIngentia ? '✓ Ingentia General' : 'Marcar como Ingentia General'}
              </button>
            </div>

            {isIngentia ? (
              <div className="bg-[#FFD166]/10 border border-[#FFD166]/30 rounded-2xl p-4 flex items-start gap-3">
                <Building2 size={20} className="text-[#1A1A1A] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">Gasto Operativo de Ingentia</p>
                  <p className="text-xs text-[#666666] mt-0.5">Este gasto se registrará sin proyecto ni cliente asociado como costo operativo de la agencia.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">Cliente (Opcional)</label>
                  <select
                    value={formData.clientId}
                    onChange={e => setFormData({ ...formData, clientId: e.target.value })}
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
                    onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 outline-none appearance-none"
                  >
                    <option value="">Seleccionar proyecto...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Sección: Asignación a Socios (Solo si es Retiro o Aporte) ── */}
        {(type === 'withdrawal' || formData.tag === 'contribution') && (
          <div className="flex flex-col gap-6 pt-6 border-t border-black/5 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-[#1A1A1A]">Asignación a Socios</h4>
                <p className="text-sm text-[#666666]">Distribuye el monto total entre los socios involucrados.</p>
              </div>
              <div className="flex bg-black/5 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setDistributionMode('equal')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${distributionMode === 'equal' ? 'bg-white text-black shadow-sm' : 'text-[#666666] hover:text-black'}`}
                >
                  Equitativo
                </button>
                <button
                  type="button"
                  onClick={() => setDistributionMode('manual')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${distributionMode === 'manual' ? 'bg-white text-black shadow-sm' : 'text-[#666666] hover:text-black'}`}
                >
                  Manual
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {partners.map(partner => {
                const isSelected = selectedPartners.includes(partner.id);
                const equalAmount = isSelected ? (total / selectedPartners.length) : 0;
                const currentAmount = distributionMode === 'equal' ? equalAmount : (manualAmounts[partner.id] || 0);

                return (
                  <div
                    key={partner.id}
                    onClick={() => {
                      if (selectedPartners.includes(partner.id)) {
                        setSelectedPartners(selectedPartners.filter(pid => pid !== partner.id));
                      } else {
                        setSelectedPartners([...selectedPartners, partner.id]);
                      }
                    }}
                    className={`cursor-pointer group relative p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-[#222222] border-[#222222] text-white shadow-lg'
                        : 'bg-white/40 border-black/10 hover:border-black/20 text-[#1A1A1A]'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold uppercase tracking-tight">{partner.name}</span>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-[#FFD166] border-[#FFD166]' : 'border-black/10'
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-black rounded-full" />}
                      </div>
                    </div>
                    
                    {isSelected ? (
                      <div className="mt-4 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <label className="text-[10px] font-bold text-white/50 uppercase mb-1 block">Monto a asignar ({formData.currency})</label>
                        {distributionMode === 'equal' ? (
                          <div className="text-xl font-light text-[#FFD166]">
                            {currencySymbol}{currentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        ) : (
                          <input
                            type="number"
                            value={manualAmounts[partner.id] || ''}
                            onChange={e => setManualAmounts({ ...manualAmounts, [partner.id]: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white outline-none focus:border-[#FFD166] transition-colors"
                          />
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-[#999] mt-2 group-hover:text-[#666]">Click para incluir</p>
                    )}
                  </div>
                );
              })}
            </div>

            {distributionMode === 'manual' && selectedPartners.length > 0 && (
              <div className={`p-4 rounded-2xl border text-sm font-medium flex justify-between items-center ${
                Math.abs(Object.values(manualAmounts).reduce((a, b) => a + b, 0) - total) < 0.01
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <span>Total asignado: {currencySymbol}{Object.values(manualAmounts).reduce((a, b) => a + b, 0).toLocaleString()}</span>
                <span>Restante: {currencySymbol}{(total - Object.values(manualAmounts).reduce((a, b) => a + b, 0)).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Sección: Origen del ingreso (cliente/proyecto para ingresos) ── */}
        {type === 'income' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-black/5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Cliente (Opcional)</label>
              <select
                value={formData.clientId}
                onChange={e => setFormData({ ...formData, clientId: e.target.value })}
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
                onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 outline-none appearance-none"
              >
                <option value="">Seleccionar proyecto...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ── Ítems / Conceptos ── */}
        <div className="flex flex-col gap-4 pt-6 border-t border-black/5">
          <h4 className="text-lg font-medium text-[#1A1A1A]">
            {type === 'income' ? 'Conceptos de Facturación' : 'Detalle del Gasto'}
          </h4>

          {/* Column headers */}
          <div className="grid grid-cols-12 gap-4 px-2">
            <div className="col-span-6 text-xs font-medium text-[#999] uppercase tracking-widest">Descripción</div>
            {type !== 'withdrawal' && <div className="col-span-2 text-xs font-medium text-[#999] uppercase tracking-widest text-center">Cant.</div>}
            <div className={`${type === 'withdrawal' ? 'col-span-4' : 'col-span-2'} text-xs font-medium text-[#999] uppercase tracking-widest text-right`}>Importe ({currencySymbol})</div>
            {type !== 'withdrawal' && <div className="col-span-2 text-xs font-medium text-[#999] uppercase tracking-widest text-right">Total</div>}
          </div>

          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 items-center bg-white/40 p-2 rounded-2xl border border-black/5">
                <div className="col-span-6">
                  <input
                    type="text"
                    placeholder="Descripción..."
                    value={item.description}
                    onChange={e => updateItem(item.id, 'description', e.target.value)}
                    className="w-full h-10 rounded-xl border border-black/10 bg-white/80 text-[#1A1A1A] px-3 outline-none text-sm"
                    required
                  />
                </div>
                {type !== 'withdrawal' && (
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full h-10 rounded-xl border border-black/10 bg-white/80 text-[#1A1A1A] px-3 outline-none text-sm text-center"
                      required
                      min="0"
                      step="any"
                    />
                  </div>
                )}
                <div className={type === 'withdrawal' ? 'col-span-4' : 'col-span-2'}>
                  <input
                    type="number"
                    value={item.price}
                    onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                    className="w-full h-10 rounded-xl border border-black/10 bg-white/80 text-[#1A1A1A] px-3 outline-none text-sm text-right font-medium"
                    required
                    min="0"
                    step="any"
                  />
                </div>
                {type !== 'withdrawal' ? (
                  <div className="col-span-2 flex items-center justify-end gap-2 pr-2">
                    <span className="text-sm font-medium text-[#1A1A1A] w-full text-right">
                      {currencySymbol}{(item.quantity * item.price).toFixed(2)}
                    </span>
                    <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-[#666666] hover:text-red-500 transition-colors p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="col-span-2 flex items-center justify-end pr-2">
                    <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-[#666666] hover:text-red-500 transition-colors p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="self-start flex items-center gap-2 text-sm font-medium text-[#1A1A1A] bg-white/50 hover:bg-white/80 border border-black/10 px-4 py-2 rounded-full transition-colors mt-2"
          >
            <Plus size={16} /> Añadir Concepto
          </button>
        </div>

        {/* ── Totales ── */}
        <div className="flex justify-end pt-6 border-t border-black/5">
          <div className="w-full max-w-xs flex flex-col gap-3">
            <div className="flex justify-between text-sm text-[#666666]">
              <span>Subtotal</span>
              <span>{currencySymbol}{subtotal.toFixed(2)}</span>
            </div>
            {type === 'income' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between py-2 border-y border-black/5 mb-1">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-[#1A1A1A]">Calcular IVA (21%)</span>
                    <span className="text-[10px] text-[#666666]">Añadir impuesto sobre el subtotal</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIncludeTax(!includeTax)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${includeTax ? 'bg-green-500' : 'bg-black/10'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${includeTax ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
                {includeTax && (
                  <div className="flex justify-between text-sm text-[#666666]">
                    <span>IVA (21%)</span>
                    <span>{currencySymbol}{tax.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
            <div className="h-px w-full bg-black/10 my-1" />
            <div className="flex justify-between text-lg font-medium text-[#1A1A1A]">
              <span>Total</span>
              <span>{currencySymbol}{total.toFixed(2)} <span className="text-sm font-normal text-[#999]">{formData.currency}</span></span>
            </div>
          </div>
        </div>

        {/* ── Botones ── */}
        <div className="flex justify-end pt-6 border-t border-black/5 gap-4">
          <Link to="/finance" className="px-6 py-3 rounded-full text-sm font-medium text-[#666666] hover:text-[#1A1A1A] transition-colors">
            Cancelar
          </Link>
          <button
            type="submit"
            className="flex items-center gap-2 bg-[#222222] hover:bg-black text-white px-8 py-3 rounded-full text-sm font-medium transition-colors shadow-lg shadow-black/10"
          >
            <Save size={18} />
            {isEditing ? 'Actualizar Transacción' : (type === 'income' ? 'Emitir Factura' : 'Guardar Gasto')}
          </button>
        </div>
      </form>
    </div>
  );
}
