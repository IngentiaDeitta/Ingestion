import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
    ArrowLeft, Brain, DollarSign, Clock, FileText, CheckCircle2, 
    AlertTriangle, Lightbulb, Loader2, Microscope, TrendingUp,
    Edit3, Save, X, Plus, Trash2, Send, Calendar
} from 'lucide-react';
import { AnalysisResult } from './SmartQuoter';

interface Quote {
    id: string;
    title: string;
    status: string;
    total_amount: number;
    sent_date: string | null;
    generation_date: string | null;
    client_name: string;
    client_id: string | null;
    project_id: string | null;
    comments: string | null;
    content: AnalysisResult;
}

export default function ProposalDetail() {
    const { id } = useParams();
    const [quote, setQuote] = useState<Quote | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Borrador editable
    const [draftTitle, setDraftTitle] = useState('');
    const [draftStatus, setDraftStatus] = useState('Generada');
    const [draftTotalAmount, setDraftTotalAmount] = useState<number>(0);
    const [draftSentDate, setDraftSentDate] = useState('');
    const [draftContent, setDraftContent] = useState<AnalysisResult | null>(null);

    useEffect(() => {
        const fetchQuote = async () => {
            if (!id) return;
            try {
                const { data, error } = await supabase
                    .from('quotes')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (error) throw error;
                
                if (data && data.content) {
                    const c = data.content;
                    data.content = {
                        ...c,
                        hoursStage1: c.hoursStage1 ?? 0,
                        labelStage1: c.labelStage1 ?? 'Diagnóstico',
                        hoursStage2: c.hoursStage2 ?? 0,
                        labelStage2: c.labelStage2 ?? 'Desarrollo',
                        diagnosis: c.diagnosis ?? 'Sin diagnóstico.',
                        salesStrategy: c.salesStrategy ?? '',
                        deliverables: Array.isArray(c.deliverables) ? c.deliverables : [],
                        risks: Array.isArray(c.risks) ? c.risks : [],
                        commercialNarrative: c.commercialNarrative ?? '',
                        financialEstimation: c.financialEstimation || { estimatedRevenue: 0, revenueJustification: '', investmentToRevenueRatio: '' },
                        pricing: c.pricing || {
                            module1: { price: 0, description: '' },
                            module2: { price: 0, description: '' },
                            module3: { monthlyPrice: 0, description: '' },
                            totalInitialInvestment: data.total_amount || 0
                        }
                    };
                }
                setQuote(data);
                setDraftContent(data.content);
                setDraftTitle(data.title || '');
                setDraftStatus(data.status || 'Generada');
                setDraftTotalAmount(data.total_amount || data.content?.pricing?.totalInitialInvestment || 0);
                setDraftSentDate(data.sent_date ? new Date(data.sent_date).toISOString().split('T')[0] : '');
            } catch (err) {
                console.error("Error fetching quote:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchQuote();
    }, [id]);

    const handleMarkAsSentToday = async () => {
        if (!id || !quote) return;
        try {
            setSaving(true);
            const todayIso = new Date().toISOString();
            const todayYmd = todayIso.split('T')[0];

            const { error } = await supabase
                .from('quotes')
                .update({ 
                    status: 'Enviada',
                    sent_date: todayIso
                })
                .eq('id', id);
            
            if (error) throw error;

            setQuote(prev => prev ? { ...prev, status: 'Enviada', sent_date: todayIso } : null);
            setDraftStatus('Enviada');
            setDraftSentDate(todayYmd);
        } catch (err: any) {
            console.error('Error registrando envío:', err);
            alert('Error al marcar propuesta como enviada: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        if (!id || !draftContent || !quote) return;
        try {
            setSaving(true);
            const numAmount = Number(draftTotalAmount) || 0;
            const updatedPricing = {
                ...(draftContent.pricing || {}),
                totalInitialInvestment: numAmount
            };
            const updatedContent: AnalysisResult = {
                ...draftContent,
                pricing: updatedPricing as any
            };

            const sentDatePayload = draftSentDate ? new Date(`${draftSentDate}T12:00:00Z`).toISOString() : null;

            const { error } = await supabase
                .from('quotes')
                .update({ 
                    title: draftTitle.trim() || 'Propuesta Comercial',
                    status: draftStatus,
                    total_amount: numAmount,
                    sent_date: sentDatePayload,
                    content: updatedContent 
                })
                .eq('id', id);
            
            if (error) throw error;

            if (draftStatus === 'Aceptada' && quote.status !== 'Aceptada') {
                if (quote.project_id) {
                    const { data: currentProject } = await supabase
                        .from('projects')
                        .select('status, outcome')
                        .eq('id', quote.project_id)
                        .single();

                    if (currentProject && (currentProject.status !== 'En Progreso' || currentProject.outcome !== 'Ganado')) {
                        await supabase.from('projects').update({ status: 'En Progreso', outcome: 'Ganado' }).eq('id', quote.project_id);
                        await supabase.from('project_status_history').insert({
                            project_id: quote.project_id,
                            field: 'status',
                            old_value: currentProject.status,
                            new_value: 'En Progreso',
                        });
                    }
                } else if (quote.client_name) {
                    // Create new project if none exists
                    const { data: newProject, error: projError } = await supabase
                        .from('projects')
                        .insert({
                            name: draftTitle.trim() || `${quote.client_name} - Proyecto`,
                            client: quote.client_name,
                            budget: numAmount,
                            status: 'En Progreso',
                            outcome: 'Ganado',
                            description: updatedContent.diagnosis || '',
                            delegated_to: 'In-house',
                            progress: 0,
                            quote_id: id
                        })
                        .select()
                        .single();
                        
                    if (newProject) {
                        quote.project_id = newProject.id;
                    }
                }
                
                // Update lead to 'CLIENTE'
                if (quote.client_name) {
                    await supabase.from('leads_cuentas')
                        .update({ estado: 'CLIENTE' })
                        .eq('empresa', quote.client_name);
                }
            }

            setQuote(prev => prev ? { 
                ...prev, 
                title: draftTitle.trim() || 'Propuesta Comercial',
                status: draftStatus,
                total_amount: numAmount,
                sent_date: sentDatePayload,
                content: updatedContent 
            } : null);

            setIsEditing(false);
        } catch (err: any) {
            console.error('Error saving quote:', err);
            alert('Error al guardar: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#FFD166]" />
            </div>
        );
    }

    if (!quote) {
        return (
            <div className="text-center mt-20">
                <h2 className="text-2xl font-bold">Propuesta no encontrada</h2>
                <Link to="/propuestas" className="mt-4 inline-block text-[#00AEC9] hover:underline">Volver a Propuestas</Link>
            </div>
        );
    }

    const { content } = quote;

    return (
        <div className="flex-1 flex flex-col gap-6 w-full max-w-5xl mx-auto pb-12">
            {/* Cabecera */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <Link to="/propuestas" className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-black/5 transition-colors border border-black/10 shadow-xs shrink-0">
                        <ArrowLeft className="w-5 h-5 text-[#666666]" />
                    </Link>
                    <div className="flex-1">
                        {isEditing ? (
                            <div>
                                <label className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">Título de la Propuesta</label>
                                <input
                                    type="text"
                                    value={draftTitle}
                                    onChange={e => setDraftTitle(e.target.value)}
                                    className="w-full text-2xl font-bold text-[#1A1A1A] bg-zinc-50 border border-black/10 rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#FFD166]"
                                />
                            </div>
                        ) : (
                            <h2 className="text-3xl font-bold text-[#1A1A1A] tracking-tight leading-tight">{quote.title}</h2>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#666666] mt-1">
                            <span>Cliente: <strong className="text-[#1A1A1A]">{quote.client_name || 'Sin especificar'}</strong></span>
                            <span>•</span>
                            <span>Generada: {quote.generation_date ? new Date(quote.generation_date).toLocaleDateString('es-AR') : '—'}</span>
                            <span>•</span>
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${quote.sent_date ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-zinc-100 text-zinc-600 border border-zinc-200'}`}>
                                {quote.sent_date ? `Enviada el ${new Date(quote.sent_date).toLocaleDateString('es-AR')}` : 'Pendiente de Envío'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Acciones de Cabecera */}
                <div className="flex items-center gap-2 shrink-0">
                    {!isEditing && (quote.status === 'Generada' || !quote.sent_date) && (
                        <button
                            onClick={handleMarkAsSentToday}
                            disabled={saving}
                            className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            Marcar Enviada Hoy
                        </button>
                    )}

                    {isEditing ? (
                        <>
                            <button 
                                onClick={() => {
                                    setDraftContent(quote.content);
                                    setDraftTitle(quote.title || '');
                                    setDraftStatus(quote.status || 'Generada');
                                    setDraftTotalAmount(quote.total_amount || 0);
                                    setDraftSentDate(quote.sent_date ? new Date(quote.sent_date).toISOString().split('T')[0] : '');
                                    setIsEditing(false);
                                }}
                                disabled={saving}
                                className="px-4 py-2 text-sm font-medium text-[#666666] hover:bg-black/5 rounded-full transition-colors flex items-center gap-1.5"
                            >
                                <X size={16} /> Cancelar
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className="px-5 py-2 text-sm font-medium bg-[#222222] text-white hover:bg-black rounded-full transition-colors flex items-center gap-2 shadow-md"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                                Guardar Cambios
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="px-5 py-2 text-sm font-medium bg-white border border-black/10 text-[#1A1A1A] hover:bg-black/5 rounded-full transition-colors flex items-center gap-2 shadow-xs"
                        >
                            <Edit3 size={16} /> Editar Propuesta
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                {/* Panel Izquierdo: KPI, Estado & Inversión */}
                <div className="md:col-span-1 flex flex-col gap-6">
                    {/* Tarjeta de Inversión y Estado */}
                    <div className="bg-[#222222] text-white p-6 rounded-2xl shadow-xl flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <div className="p-2 bg-white/10 rounded-xl w-fit">
                                <DollarSign size={20} />
                            </div>
                            <span className="text-[10px] bg-white/20 px-2.5 py-1 rounded-full uppercase tracking-widest font-bold">
                                {isEditing ? 'Editando Tarjeta' : quote.status}
                            </span>
                        </div>

                        <div>
                            <p className="text-xs text-white/60 uppercase font-bold tracking-wider mb-1">Inversión Inicial (USD)</p>
                            {isEditing ? (
                                <input
                                    type="number"
                                    value={draftTotalAmount}
                                    onChange={e => setDraftTotalAmount(parseFloat(e.target.value) || 0)}
                                    className="w-full text-3xl font-light text-white bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 outline-none focus:border-[#FFD166]"
                                />
                            ) : (
                                <h4 className="text-4xl font-light">${(quote.total_amount || content?.pricing?.totalInitialInvestment || 0).toLocaleString()}</h4>
                            )}
                        </div>

                        <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Estado Comercial</label>
                            {isEditing ? (
                                <select
                                    value={draftStatus}
                                    onChange={e => setDraftStatus(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 text-white text-xs font-bold rounded-xl p-2 outline-none cursor-pointer"
                                >
                                    <option value="Generada" className="text-black">Generada (Borrador)</option>
                                    <option value="Enviada" className="text-black">Enviada al Cliente</option>
                                    <option value="Aceptada" className="text-black">Aceptada / Ganada</option>
                                    <option value="Rechazada" className="text-black">Rechazada / Perdida</option>
                                </select>
                            ) : (
                                <p className="text-sm font-semibold text-white/90">{quote.status}</p>
                            )}
                        </div>

                        <div className="pt-2 border-t border-white/10 flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Fecha de Envío Real</label>
                            {isEditing ? (
                                <input
                                    type="date"
                                    value={draftSentDate}
                                    onChange={e => setDraftSentDate(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 text-white text-xs font-medium rounded-xl p-2 outline-none"
                                />
                            ) : (
                                <p className="text-xs text-white/80 flex items-center gap-1.5">
                                    <Calendar size={13} className="text-[#FFD166]" />
                                    {quote.sent_date 
                                        ? new Date(quote.sent_date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                        : 'Sin fecha de envío registrada'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Retorno Estimado */}
                    <div className="bg-white border border-black/10 p-6 rounded-2xl shadow-sm flex flex-col gap-3">
                        <div className="p-2 bg-green-500/10 text-green-600 rounded-xl w-fit">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-[#666666] uppercase font-bold tracking-wider mb-1">Retorno Estimado (PxQ)</p>
                            {isEditing && draftContent ? (
                                <input
                                    type="number"
                                    value={draftContent.financialEstimation?.estimatedRevenue || 0}
                                    onChange={e => setDraftContent({
                                        ...draftContent,
                                        financialEstimation: {
                                            ...(draftContent.financialEstimation || { estimatedRevenue: 0, revenueJustification: '', investmentToRevenueRatio: '' }),
                                            estimatedRevenue: parseFloat(e.target.value) || 0
                                        }
                                    })}
                                    className="w-full text-xl font-light text-[#1A1A1A] bg-zinc-50 border border-black/10 rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-green-500"
                                />
                            ) : (
                                <h4 className="text-2xl font-light text-[#1A1A1A]">${(content?.financialEstimation?.estimatedRevenue || 0).toLocaleString()}</h4>
                            )}
                        </div>

                        {isEditing && draftContent ? (
                            <textarea
                                value={draftContent.financialEstimation?.revenueJustification || ''}
                                onChange={e => setDraftContent({
                                    ...draftContent,
                                    financialEstimation: {
                                        ...(draftContent.financialEstimation || { estimatedRevenue: 0, revenueJustification: '', investmentToRevenueRatio: '' }),
                                        revenueJustification: e.target.value
                                    }
                                })}
                                placeholder="Justificación del retorno..."
                                className="w-full text-xs text-[#666666] border border-black/10 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-green-500 resize-none h-20"
                            />
                        ) : (
                            <p className="text-xs text-[#666666] leading-relaxed">{content?.financialEstimation?.revenueJustification}</p>
                        )}
                    </div>

                    {/* Desglose de Horas */}
                    <div className="bg-white border border-black/10 p-6 rounded-2xl shadow-sm flex flex-col gap-4">
                        <h4 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                            <Clock className="text-[#FFD166]" size={18} />
                            Desglose de Horas
                        </h4>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-[#666666] font-medium">{content?.labelStage1 || 'Diagnóstico'}</span>
                                {isEditing && draftContent ? (
                                    <input
                                        type="number"
                                        value={draftContent.hoursStage1}
                                        onChange={e => setDraftContent({ ...draftContent, hoursStage1: parseInt(e.target.value) || 0 })}
                                        className="w-20 text-right text-xs font-bold bg-zinc-50 border border-black/10 rounded-lg px-2 py-1 outline-none"
                                    />
                                ) : (
                                    <span className="font-bold text-[#1A1A1A] text-sm">{content?.hoursStage1}h</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-[#666666] font-medium">{content?.labelStage2 || 'Desarrollo'}</span>
                                {isEditing && draftContent ? (
                                    <input
                                        type="number"
                                        value={draftContent.hoursStage2}
                                        onChange={e => setDraftContent({ ...draftContent, hoursStage2: parseInt(e.target.value) || 0 })}
                                        className="w-20 text-right text-xs font-bold bg-zinc-50 border border-black/10 rounded-lg px-2 py-1 outline-none"
                                    />
                                ) : (
                                    <span className="font-bold text-[#1A1A1A] text-sm">{content?.hoursStage2}h</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel Derecho: Diagnóstico, Estrategia, Entregables y Riesgos */}
                <div className="md:col-span-2 flex flex-col gap-6">
                    <div className="bg-white border border-black/10 p-7 rounded-2xl shadow-sm">
                        <h4 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2 mb-3">
                            <Microscope className="text-[#FFD166]" size={18} />
                            Diagnóstico y Situación Actual
                        </h4>
                        {isEditing && draftContent ? (
                            <textarea
                                value={draftContent.diagnosis}
                                onChange={e => setDraftContent({ ...draftContent, diagnosis: e.target.value })}
                                className="w-full h-32 rounded-xl border border-black/10 p-4 text-sm outline-none focus:ring-2 focus:ring-[#FFD166] resize-none"
                            />
                        ) : (
                            <p className="text-[#666666] text-sm leading-relaxed whitespace-pre-wrap">
                                {content?.diagnosis || 'No se registró diagnóstico.'}
                            </p>
                        )}
                    </div>

                    <div className="bg-white border border-black/10 p-7 rounded-2xl shadow-sm">
                        <h4 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2 mb-4">
                            <Brain className="text-[#008CA4]" size={18} />
                            Narrativa Comercial & Estrategia
                        </h4>
                        
                        <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#999999] mb-2">Narrativa Comercial</h5>
                        {isEditing && draftContent ? (
                            <textarea
                                value={draftContent.commercialNarrative}
                                onChange={e => setDraftContent({ ...draftContent, commercialNarrative: e.target.value })}
                                className="w-full h-24 rounded-xl border border-[#008CA4]/30 bg-[#008CA4]/5 p-4 text-sm outline-none focus:ring-2 focus:ring-[#008CA4] resize-none mb-4"
                            />
                        ) : (
                            <p className="text-[#666666] text-sm leading-relaxed italic bg-[#008CA4]/5 p-4 rounded-xl border border-[#008CA4]/10 mb-5 whitespace-pre-wrap">
                                "{content?.commercialNarrative || 'Sin narrativa comercial generada.'}"
                            </p>
                        )}
                        
                        <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#999999] mb-2">Estrategia Operativa</h5>
                        {isEditing && draftContent ? (
                            <textarea
                                value={draftContent.salesStrategy}
                                onChange={e => setDraftContent({ ...draftContent, salesStrategy: e.target.value })}
                                className="w-full h-32 rounded-xl border border-black/10 p-4 text-sm outline-none focus:ring-2 focus:ring-[#008CA4] resize-none"
                            />
                        ) : (
                            <p className="text-[#666666] text-sm leading-relaxed whitespace-pre-wrap">
                                {content?.salesStrategy}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-white border border-black/10 p-6 rounded-2xl shadow-sm">
                            <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-4">Entregables Clave</h4>
                            {isEditing && draftContent ? (
                                <div className="flex flex-col gap-2">
                                    {draftContent.deliverables.map((d, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={d}
                                                onChange={e => {
                                                    const newD = [...draftContent.deliverables];
                                                    newD[i] = e.target.value;
                                                    setDraftContent({ ...draftContent, deliverables: newD });
                                                }}
                                                className="flex-1 rounded-lg border border-black/10 px-3 py-1.5 text-sm outline-none focus:border-green-500"
                                            />
                                            <button onClick={() => {
                                                const newD = draftContent.deliverables.filter((_, idx) => idx !== i);
                                                setDraftContent({ ...draftContent, deliverables: newD });
                                            }} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <button onClick={() => {
                                        setDraftContent({ ...draftContent, deliverables: [...draftContent.deliverables, 'Nuevo entregable'] });
                                    }} className="text-xs font-medium text-green-600 flex items-center gap-1 mt-2 hover:underline">
                                        <Plus size={14} /> Agregar entregable
                                    </button>
                                </div>
                            ) : (
                                <ul className="flex flex-col gap-3">
                                    {content?.deliverables?.map((d, i) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-[#666666]">
                                            <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                                            <span>{d}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="bg-white border border-black/10 p-6 rounded-2xl shadow-sm">
                            <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-4">Riesgos Identificados</h4>
                            {isEditing && draftContent ? (
                                <div className="flex flex-col gap-2">
                                    {draftContent.risks.map((r, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={r}
                                                onChange={e => {
                                                    const newR = [...draftContent.risks];
                                                    newR[i] = e.target.value;
                                                    setDraftContent({ ...draftContent, risks: newR });
                                                }}
                                                className="flex-1 rounded-lg border border-black/10 px-3 py-1.5 text-sm outline-none focus:border-amber-500"
                                            />
                                            <button onClick={() => {
                                                const newR = draftContent.risks.filter((_, idx) => idx !== i);
                                                setDraftContent({ ...draftContent, risks: newR });
                                            }} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <button onClick={() => {
                                        setDraftContent({ ...draftContent, risks: [...draftContent.risks, 'Nuevo riesgo'] });
                                    }} className="text-xs font-medium text-amber-600 flex items-center gap-1 mt-2 hover:underline">
                                        <Plus size={14} /> Agregar riesgo
                                    </button>
                                </div>
                            ) : (
                                <ul className="flex flex-col gap-3">
                                    {content?.risks?.map((r, i) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-[#666666]">
                                            <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                                            <span>{r}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
