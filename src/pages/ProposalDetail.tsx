import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
    ArrowLeft, Brain, DollarSign, Clock, FileText, CheckCircle2, 
    AlertTriangle, Lightbulb, Loader2, Microscope, TrendingUp,
    Edit3, Save, X, Plus, Trash2
} from 'lucide-react';
import { AnalysisResult } from './SmartQuoter';

interface Quote {
    id: string;
    title: string;
    status: string;
    total_amount: number;
    client_name: string;
    generation_date: string;
    content: AnalysisResult;
}

export default function ProposalDetail() {
    const { id } = useParams();
    const [quote, setQuote] = useState<Quote | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
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
                
                // Defensa para evitar fallos de renderizado
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
            } catch (err) {
                console.error("Error fetching quote:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchQuote();
    }, [id]);

    const handleSave = async () => {
        if (!id || !draftContent) return;
        try {
            setSaving(true);
            const { error } = await supabase
                .from('quotes')
                .update({ content: draftContent })
                .eq('id', id);
            
            if (error) throw error;
            setQuote(prev => prev ? { ...prev, content: draftContent } : null);
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
                <div className="flex items-center gap-4">
                    <Link to="/propuestas" className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-black/5 transition-colors border border-black/10 shadow-xs shrink-0">
                        <ArrowLeft className="w-5 h-5 text-[#666666]" />
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold text-[#1A1A1A] tracking-tight leading-tight">{quote.title}</h2>
                        <p className="text-[#666666] text-sm mt-1">Cliente: <span className="font-medium text-[#1A1A1A]">{quote.client_name || 'Sin especificar'}</span></p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <button 
                                onClick={() => {
                                    setDraftContent(quote.content);
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
                            <Edit3 size={16} /> Editar Plan
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                {/* Panel Izquierdo: KPI & Inversión */}
                <div className="md:col-span-1 flex flex-col gap-6">
                    <div className="bg-[#222222] text-white p-6 rounded-xl shadow-xl">
                        <div className="p-2 bg-white/10 rounded-xl w-fit mb-4">
                            <DollarSign size={20} />
                        </div>
                        <p className="text-xs text-white/60 uppercase font-bold tracking-wider mb-1">Inversión Inicial</p>
                        <h4 className="text-4xl font-light">${(content?.pricing?.totalInitialInvestment || quote.total_amount || 0).toLocaleString()}</h4>
                        <span className="inline-block mt-4 text-[10px] bg-white/20 px-2 py-1 rounded-full uppercase tracking-widest font-bold">Estado: {quote.status}</span>
                    </div>

                    <div className="bg-white border border-black/10 p-6 rounded-xl shadow-sm">
                        <div className="p-2 bg-green-500/10 text-green-600 rounded-xl w-fit mb-4">
                            <TrendingUp size={20} />
                        </div>
                        <p className="text-xs text-[#666666] uppercase font-bold tracking-wider mb-1">Retorno Estimado (PxQ)</p>
                        <h4 className="text-2xl font-light text-[#1A1A1A]">${(content?.financialEstimation?.estimatedRevenue || 0).toLocaleString()}</h4>
                        <p className="text-xs text-[#666666] mt-2 leading-relaxed">{content?.financialEstimation?.revenueJustification}</p>
                    </div>

                    <div className="bg-white border border-black/10 p-6 rounded-xl shadow-sm">
                        <h4 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2 mb-4">
                            <Clock className="text-[#FFD166]" size={18} />
                            Desglose de Horas
                        </h4>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[#666666]">{content?.labelStage1}</span>
                                <span className="font-bold text-[#1A1A1A]">{content?.hoursStage1}h</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[#666666]">{content?.labelStage2}</span>
                                <span className="font-bold text-[#1A1A1A]">{content?.hoursStage2}h</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel Derecho: Estrategia, Entregables y Diagnóstico */}
                <div className="md:col-span-2 flex flex-col gap-6">
                    <div className="bg-white border border-black/10 p-8 rounded-xl shadow-sm">
                        <h4 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2 mb-4">
                            <Microscope className="text-[#FFD166]" />
                            Diagnóstico y Situación Actual
                        </h4>
                        {isEditing && draftContent ? (
                            <textarea
                                value={draftContent.diagnosis}
                                onChange={e => setDraftContent({ ...draftContent, diagnosis: e.target.value })}
                                className="w-full h-32 rounded-xl border border-black/10 p-4 text-sm outline-none focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] resize-none"
                            />
                        ) : (
                            <p className="text-[#666666] text-sm leading-relaxed whitespace-pre-wrap">
                                {content?.diagnosis || 'No se registró diagnóstico.'}
                            </p>
                        )}
                    </div>

                    <div className="bg-white border border-black/10 p-8 rounded-xl shadow-sm">
                        <h4 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2 mb-4">
                            <Brain className="text-[#008CA4]" />
                            Narrativa Comercial & Estrategia
                        </h4>
                        
                        <h5 className="text-xs font-bold uppercase tracking-wider text-[#999999] mb-2">Narrativa Comercial</h5>
                        {isEditing && draftContent ? (
                            <textarea
                                value={draftContent.commercialNarrative}
                                onChange={e => setDraftContent({ ...draftContent, commercialNarrative: e.target.value })}
                                className="w-full h-24 rounded-xl border border-[#008CA4]/30 bg-[#008CA4]/5 p-4 text-sm outline-none focus:ring-2 focus:ring-[#008CA4] resize-none mb-4"
                            />
                        ) : (
                            <p className="text-[#666666] text-sm leading-relaxed italic bg-[#008CA4]/5 p-5 rounded-2xl border border-[#008CA4]/10 mb-6 whitespace-pre-wrap">
                                "{content?.commercialNarrative || 'Sin narrativa comercial generada.'}"
                            </p>
                        )}
                        
                        <h5 className="text-xs font-bold uppercase tracking-wider text-[#999999] mb-2">Estrategia Operativa</h5>
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
                        <div className="bg-white border border-black/10 p-6 rounded-xl shadow-sm">
                            <h4 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider mb-4">Entregables Clave</h4>
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
                                        <li key={i} className="flex items-start gap-2 text-sm text-[#666666]">
                                            <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                                            <span>{d}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="bg-white border border-black/10 p-6 rounded-xl shadow-sm">
                            <h4 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider mb-4">Riesgos Identificados</h4>
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
                                        <li key={i} className="flex items-start gap-2 text-sm text-[#666666]">
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
