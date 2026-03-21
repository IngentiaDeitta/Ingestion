import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
    Wand2, Database, Calculator, Microscope, Lightbulb, CheckCircle2,
    AlertTriangle, Copy, Plus, Loader2, DollarSign, Download, FileText,
    Briefcase, TrendingUp, Link as LinkIcon, BookOpen, Clock, BarChart2, Save
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { supabase } from "../lib/supabase";
import { analyzeWithGemini } from "../lib/gemini";
import BudgetPDFTemplate from "../components/BudgetPDFTemplate";
import { sendNotification } from "../lib/notifications";

type AppState = 'welcome' | 'loading' | 'results';
type TabState = 'strategy' | 'budget';

export interface AnalysisResult {
    diagnosis: string;
    hoursStage1: number;
    hoursStage2: number;
    labelStage1: string;
    labelStage2: string;
    roiEstimate: string;
    salesStrategy: string;
    deliverables: string[];
    risks: string[];
    commercialNarrative: string;
    pricing: {
        module1: { description: string; price: number; deliveryDays: number; };
        module2: { description: string; price: number; pricingModel: string; };
        module3: { description: string; monthlyPrice: number; };
        totalInitialInvestment: number;
    };
    financialEstimation: {
        estimatedRevenue: number;
        revenueJustification: string;
        investmentToRevenueRatio: string;
    };
}

export default function SmartQuoter() {
    const [companySize, setCompanySize] = useState("Medium");
    const [serviceType, setServiceType] = useState("Consultancy");
    const [clientUrl, setClientUrl] = useState("");
    const [notebookLmContext, setNotebookLmContext] = useState("");
    const [transcripts, setTranscripts] = useState("");
    const [clientId, setClientId] = useState("");
    const [projectId, setProjectId] = useState("");
    const [appState, setAppState] = useState<AppState>('welcome');
    const [activeTab, setActiveTab] = useState<TabState>('strategy');
    const [results, setResults] = useState<AnalysisResult | null>(null);
    const [copied, setCopied] = useState(false);
    const [dbClients, setDbClients] = useState<{id: string, name: string}[]>([]);
    const [dbProjects, setDbProjects] = useState<{id: string, name: string, client: string}[]>([]);
    const [selectedModules, setSelectedModules] = useState<string[]>(['module1', 'module2', 'module3']);
    
    // Save Quote State
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [saveFormData, setSaveFormData] = useState({
        title: '',
        comments: '',
        status: 'Generada',
        sent_date: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [searchParams] = useSearchParams();
    const [isIdLoading, setIsIdLoading] = useState(false);

    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: 'Propuesta_IngentIA' });

    useEffect(() => {
        fetchClientsAndProjects();
        
        const quoteId = searchParams.get('quoteId');
        if (quoteId) {
            loadQuoteFromId(quoteId);
        } else {
            const savedQuote = localStorage.getItem("lastAdvancedQuote");
            if (savedQuote) {
                try {
                    const parsed = JSON.parse(savedQuote);
                    setResults(parsed.results);
                    setCompanySize(parsed.inputs.companySize || "Medium");
                    setServiceType(parsed.inputs.serviceType || "Consultancy");
                    setClientUrl(parsed.inputs.clientUrl || "");
                    setNotebookLmContext(parsed.inputs.notebookLmContext || "");
                    setTranscripts(parsed.inputs.transcripts || "");
                    setClientId(parsed.inputs.clientId || "");
                    setProjectId(parsed.inputs.projectId || "");
                    setAppState('results');
                } catch (e) { console.error("Failed to load saved quote", e); }
            }
        }
    }, [searchParams]);

    const fetchClientsAndProjects = async () => {
        const { data: clientsData } = await supabase.from('clients').select('id, name').order('name');
        setDbClients(clientsData || []);
        const { data: projectsData } = await supabase.from('projects').select('id, name, client').order('name');
        setDbProjects(projectsData || []);
    };

    const loadQuoteFromId = async (id: string) => {
        try {
            setIsIdLoading(true);
            setAppState('loading');
            
            const { data, error } = await supabase
                .from('quotes')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            if (data) {
                setResults(data.content);
                setSelectedModules(data.selected_modules || []);
                setClientId(data.client_id);
                setProjectId(data.project_id);
                setAppState('results');
                setActiveTab('budget');
            }
        } catch (error: any) {
            console.error('Error loading quote:', error);
            alert('No se pudo cargar la cotización anterior');
            setAppState('welcome');
        } finally {
            setIsIdLoading(false);
        }
    };

    const analyzeProject = async () => {
        if (!transcripts.trim() && !clientUrl.trim() && !notebookLmContext.trim()) {
            alert("Por favor, ingresa al menos un contexto.");
            return;
        }
        if (!clientId || !projectId) {
            alert("Por favor, selecciona un cliente y un proyecto.");
            return;
        }
        setAppState('loading');
        setResults(null);

        try {
            const cName = dbClients.find(c => c.id === clientId)?.name || 'Cliente';
            const pName = dbProjects.find(p => p.id === projectId)?.name || 'Proyecto';

            const geminiResult = await analyzeWithGemini({
                clientName: cName,
                projectName: pName,
                companySize,
                serviceType,
                clientUrl,
                notebookContext: notebookLmContext,
                transcripts
            });

            setResults(geminiResult);
            // Default select modules that have a price > 0
            const initialModules = ['module1'];
            if (geminiResult.pricing.module2.price > 0) initialModules.push('module2');
            if (geminiResult.pricing.module3.monthlyPrice > 0) initialModules.push('module3');
            setSelectedModules(initialModules);

            localStorage.setItem("lastAdvancedQuote", JSON.stringify({
                inputs: { companySize, serviceType, clientUrl, notebookLmContext, transcripts, clientId, projectId },
                results: geminiResult,
                timestamp: new Date().getTime()
            }));
            setAppState('results');
            setActiveTab('strategy');
        } catch (error: any) {
            console.error('Error calling Gemini:', error);
            alert(`Error al procesar con IA: ${error.message}`);
            setAppState('welcome');
        }
    };

    const copyNarrative = () => {
        if (results?.commercialNarrative) {
            navigator.clipboard.writeText(results.commercialNarrative);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const startNewQuote = () => {
        setResults(null); setTranscripts(""); setNotebookLmContext("");
        setClientUrl(""); setClientId(""); setProjectId("");
        setAppState('welcome');
        localStorage.removeItem("lastAdvancedQuote");
    };

    const handleSaveQuote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!results || !clientId || !projectId) return;

        try {
            setIsSaving(true);
            const total = (selectedModules.includes('module1') ? results.pricing.module1.price : 0) +
                          (selectedModules.includes('module2') ? results.pricing.module2.price : 0);

            const { error } = await supabase.from('quotes').insert({
                client_id: clientId,
                project_id: projectId,
                client_name: clientName,
                project_name: projectName,
                title: saveFormData.title || `Cotización Modular - ${projectName}`,
                status: saveFormData.status,
                content: results,
                selected_modules: selectedModules,
                comments: saveFormData.comments,
                total_amount: total,
                sent_date: saveFormData.sent_date ? new Date(saveFormData.sent_date).toISOString() : null,
                generation_date: new Date().toISOString()
            });

            if (error) throw error;
            
            await sendNotification(
                'Nueva Cotización Guardada',
                `Se ha generado una nueva propuesta para '${clientName}' por un total de $${total.toLocaleString()}.`,
                'quote'
            );

            alert('Cotización guardada exitosamente');
            setIsSaveModalOpen(false);
        } catch (error: any) {
            console.error('Error saving quote:', error);
            alert(`Error al guardar: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const clientName = dbClients.find(c => c.id === clientId)?.name || "Cliente";
    const projectName = dbProjects.find(p => p.id === projectId)?.name || "Proyecto";
    const filteredProjects = clientId
        ? dbProjects.filter(p => p.client === clientName)
        : dbProjects;

    const pdfFormData = { clientId, projectId, clientName, projectName };
    const pdfResult = results ? {
        ...results,
        selectedModules
    } : null;

    const inputClass = "w-full h-12 rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] px-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all text-sm";
    const textareaClass = "w-full rounded-2xl border border-black/10 bg-white/50 text-[#1A1A1A] p-4 focus:ring-2 focus:ring-[#FFD166] focus:border-[#FFD166] outline-none transition-all text-sm resize-none";

    return (
        <div className="flex-1 flex flex-col gap-8 w-full max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 style={{ fontFamily: "system-ui, -apple-system, sans-serif" }} className="text-[42px] font-normal tracking-tight text-[#1A1A1A]">Smart Quoter</h3>
                    <p className="text-[#666666] mt-1">Analizador avanzado y cotización inteligente para tus proyectos.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/40 shadow-sm">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-[#666666]">Motor Gemini Pro</span>
                    </div>
                    <button onClick={startNewQuote} className="flex items-center justify-center gap-2 bg-[#222222] hover:bg-black text-white px-6 py-3 rounded-full text-sm font-medium transition-colors shadow-sm">
                        <Plus size={16} />
                        Nueva Cotización
                    </button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Panel - Input Form */}
                <aside className="lg:col-span-5 flex flex-col gap-6">
                    {/* Vinculación */}
                    <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8 flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white rounded-2xl shadow-sm text-[#1A1A1A]">
                                <Database size={20} />
                            </div>
                            <div>
                                <h4 className="text-lg font-medium text-[#1A1A1A]">Vinculación</h4>
                                <p className="text-xs text-[#666666]">Asocia la cotización a un cliente y proyecto</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-[#1A1A1A]">Cliente Asociado</label>
                                    <Link to="/clients/new" className="text-xs font-medium text-[#666666] hover:text-[#1A1A1A] transition-colors">+ Nuevo</Link>
                                </div>
                                <select value={clientId} onChange={(e) => { setClientId(e.target.value); setProjectId(''); }} className={inputClass}>
                                    <option value="">Seleccionar cliente...</option>
                                    {dbClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-[#1A1A1A]">Proyecto Asociado</label>
                                    <Link to="/projects/new" className="text-xs font-medium text-[#666666] hover:text-[#1A1A1A] transition-colors">+ Nuevo</Link>
                                </div>
                                <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputClass}>
                                    <option value="">Seleccionar proyecto...</option>
                                    {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Contexto Analítico */}
                    <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm p-8 flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white rounded-2xl shadow-sm text-[#1A1A1A]">
                                <Microscope size={20} />
                            </div>
                            <div>
                                <h4 className="text-lg font-medium text-[#1A1A1A]">Contexto Analítico</h4>
                                <p className="text-xs text-[#666666]">Define los parámetros y fuentes de información</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-[#1A1A1A]">Tamaño de Empresa</label>
                                    <select value={companySize} onChange={(e) => setCompanySize(e.target.value)} className={inputClass}>
                                        <option value="SME">Pequeña / SME</option>
                                        <option value="Medium">Mediana</option>
                                        <option value="Large">Corporación</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-[#1A1A1A]">Tipo de Servicio</label>
                                    <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className={inputClass}>
                                        <option value="Consultancy">Consultoría</option>
                                        <option value="Full">Consultoría + App/IA</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-[#1A1A1A]">Sitios y Redes del cliente</label>
                                <input type="text" value={clientUrl} onChange={(e) => setClientUrl(e.target.value)}
                                    placeholder="https://ejemplo.com, @instagram..."
                                    className={inputClass} />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-[#1A1A1A]">Importar Cuaderno (NotebookLM)</label>
                                <input type="text" value={notebookLmContext} onChange={(e) => setNotebookLmContext(e.target.value)}
                                    placeholder="Pega aquí el link o nombre del cuaderno de NotebookLM..."
                                    className={inputClass} />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-[#1A1A1A]">Contexto NotebookLM / Manual</label>
                                <textarea value={notebookLmContext} onChange={(e) => setNotebookLmContext(e.target.value)} rows={3}
                                    placeholder="Describe el contexto del cuaderno, resumen o notas relevantes..."
                                    className={textareaClass}></textarea>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-[#1A1A1A]">Minutas Extra</label>
                                <textarea value={transcripts} onChange={(e) => setTranscripts(e.target.value)} rows={3}
                                    placeholder="Pega aquí las minutas de la reunión..."
                                    className={textareaClass}></textarea>
                            </div>
                        </div>

                        <button onClick={analyzeProject} disabled={appState === 'loading'}
                            className="w-full bg-[#222222] hover:bg-black disabled:opacity-50 text-white transition-all py-4 rounded-full font-medium flex items-center justify-center gap-2 shadow-lg shadow-black/10 mt-2">
                            {appState === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                            {appState === 'loading' ? 'Procesando con IA...' : 'Procesar y Presupuestar'}
                        </button>
                    </div>
                </aside>

                {/* Right Panel - Results */}
                <main className="lg:col-span-7 flex flex-col gap-6">
                    {appState === 'welcome' && (
                        <div className="flex-1 min-h-[500px] flex flex-col items-center justify-center text-center p-10 bg-white/40 backdrop-blur-xl rounded-[32px] border-dashed border-2 border-black/10">
                            <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                                <Calculator className="w-9 h-9 text-[#999999]" />
                            </div>
                            <h3 className="text-2xl font-medium text-[#1A1A1A]">Esperando Datos</h3>
                            <p className="text-[#666666] mt-2 max-w-sm text-sm">Vincula un cliente y proyecto, luego elabora el contexto para generar un análisis estratégico con presupuesto.</p>
                        </div>
                    )}

                    {appState === 'loading' && (
                        <div className="flex-1 min-h-[500px] flex flex-col items-center justify-center text-center p-10 bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm">
                            <div className="w-20 h-20 bg-[#222222] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                                <Loader2 className="w-9 h-9 text-[#FFD166] animate-spin" />
                            </div>
                            <h3 className="text-xl font-medium text-[#1A1A1A]">Analizando contexto...</h3>
                            <p className="text-[#666666] mt-2 text-sm">Investigando mercado y dimensionando ROI</p>
                        </div>
                    )}

                    {appState === 'results' && results && (
                        <>
                            {/* Stat Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white/60 backdrop-blur-xl rounded-[24px] border border-white/40 shadow-sm p-5">
                                    <div className="p-2 bg-white rounded-xl shadow-sm text-[#1A1A1A] w-fit mb-3">
                                        <Clock size={18} />
                                    </div>
                                    <p className="text-[10px] text-[#666666] uppercase font-medium tracking-wider mb-1">Hito Diagnóstico</p>
                                    <h4 className="text-2xl font-light text-[#1A1A1A]">{results.hoursStage1}<span className="text-sm text-[#666666] ml-1">h</span></h4>
                                    <p className="text-[11px] text-[#666666] mt-1">{results.labelStage1}</p>
                                </div>
                                <div className="bg-white/60 backdrop-blur-xl rounded-[24px] border border-white/40 shadow-sm p-5">
                                    <div className="p-2 bg-white rounded-xl shadow-sm text-[#1A1A1A] w-fit mb-3">
                                        <BarChart2 size={18} />
                                    </div>
                                    <p className="text-[10px] text-[#666666] uppercase font-medium tracking-wider mb-1">Hito TO-BE</p>
                                    <h4 className="text-2xl font-light text-[#1A1A1A]">{results.hoursStage2}<span className="text-sm text-[#666666] ml-1">h</span></h4>
                                    <p className="text-[11px] text-[#666666] mt-1">{results.labelStage2}</p>
                                </div>
                                <div className="bg-white/60 backdrop-blur-xl rounded-[24px] border border-white/40 shadow-sm p-5">
                                    <div className="p-2 bg-white rounded-xl shadow-sm text-green-600 w-fit mb-3">
                                        <TrendingUp size={18} />
                                    </div>
                                    <p className="text-[10px] text-[#666666] uppercase font-medium tracking-wider mb-1">Facturación Est.</p>
                                    <h4 className="text-xl font-light text-[#1A1A1A]">${results.financialEstimation.estimatedRevenue.toLocaleString()}</h4>
                                    <p className="text-[11px] text-[#666666] mt-1">Anual (PxQ)</p>
                                </div>
                                <div className="bg-[#222222] text-white rounded-[24px] shadow-xl p-5">
                                    <div className="p-2 bg-white/10 rounded-xl w-fit mb-3">
                                        <DollarSign size={18} />
                                    </div>
                                    <p className="text-[10px] text-white/50 uppercase font-medium tracking-wider mb-1">Inversión Inicial</p>
                                    <h4 className="text-xl font-light">${results.pricing.totalInitialInvestment.toLocaleString()}</h4>
                                    <p className="text-[11px] text-white/50 mt-1">
                                        {results.pricing.module2.price === 0 ? "Módulo 1" : "Módulos 1+2"}
                                    </p>
                                </div>
                            </div>

                            {/* Tabs Content */}
                            <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-sm overflow-hidden mt-2">
                                <div className="flex overflow-x-auto border-b border-black/5 hide-scrollbar">
                                    <button onClick={() => setActiveTab('strategy')}
                                        className={`px-6 py-4 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'strategy'
                                            ? 'border-b-2 border-[#222222] text-[#1A1A1A] bg-white/30'
                                            : 'text-[#666666] hover:text-[#1A1A1A]'}`}>
                                        <Briefcase size={16} /> Análisis Estratégico
                                    </button>
                                    <button onClick={() => setActiveTab('budget')}
                                        className={`px-6 py-4 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'budget'
                                            ? 'border-b-2 border-[#222222] text-[#1A1A1A] bg-white/30'
                                            : 'text-[#666666] hover:text-[#1A1A1A]'}`}>
                                        <DollarSign size={16} /> Presupuesto Modular
                                    </button>
                                </div>

                                <div className="p-4 sm:p-8">
                                    {activeTab === 'strategy' && (
                                        <div className="flex flex-col gap-8">
                                            {/* Diagnóstico */}
                                            <section>
                                                <h4 className="text-[#1A1A1A] font-medium mb-3 flex items-center gap-2">
                                                    <Microscope className="text-[#FFD166] w-5 h-5" /> Diagnóstico de Situación
                                                </h4>
                                                <p className="text-[#666666] text-sm leading-relaxed bg-white/50 p-5 rounded-2xl border border-black/5">{results.diagnosis}</p>
                                            </section>

                                            {/* PxQ */}
                                            <section>
                                                <h4 className="text-[#1A1A1A] font-medium mb-3 flex items-center gap-2">
                                                    <TrendingUp className="text-green-500 w-5 h-5" /> Dimensionamiento de Mercado (PxQ)
                                                </h4>
                                                <div className="bg-green-500/5 p-5 rounded-2xl text-sm text-[#1A1A1A] border border-green-500/10">
                                                    <p className="text-[#666666] mb-3">{results.financialEstimation.revenueJustification}</p>
                                                    <div className="text-sm font-medium text-green-600">Inversión/Facturación: {results.financialEstimation.investmentToRevenueRatio}</div>
                                                </div>
                                            </section>

                                            {/* Estrategia de Venta */}
                                            <section>
                                                <h4 className="text-[#1A1A1A] font-medium mb-3 flex items-center gap-2">
                                                    <Lightbulb className="text-[#FFD166] w-5 h-5" /> Estrategia de Venta
                                                </h4>
                                                <div className="bg-[#FFD166]/10 p-5 rounded-2xl text-sm text-[#1A1A1A] border border-[#FFD166]/20 italic">{results.salesStrategy}</div>
                                            </section>

                                            {/* Entregables y Riesgos */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-black/5">
                                                <div>
                                                    <h4 className="text-xs font-medium text-[#666666] uppercase tracking-wider mb-4">Entregables Clave</h4>
                                                    <ul className="text-sm flex flex-col gap-3 text-[#1A1A1A]">
                                                        {results.deliverables.map((d, i) => (
                                                            <li key={i} className="flex items-start gap-2">
                                                                <CheckCircle2 className="text-green-500 w-4 h-4 mt-0.5 shrink-0" />
                                                                <span>{d}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-medium text-[#666666] uppercase tracking-wider mb-4">Riesgos Identificados</h4>
                                                    <ul className="text-sm flex flex-col gap-3 text-[#1A1A1A]">
                                                        {results.risks.map((r, i) => (
                                                            <li key={i} className="flex items-start gap-2">
                                                                <AlertTriangle className="text-amber-500 w-4 h-4 mt-0.5 shrink-0" />
                                                                <span>{r}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* Narrativa Comercial */}
                                            <div className="bg-white/50 border border-black/5 p-6 rounded-[24px]">
                                                <div className="flex justify-between items-start mb-4">
                                                    <h4 className="font-medium text-[#1A1A1A]">Narrativa Comercial Sugerida</h4>
                                                    <button onClick={copyNarrative}
                                                        className="flex items-center gap-2 text-xs font-medium bg-white border border-black/10 text-[#1A1A1A] px-4 py-2 rounded-full hover:bg-black/5 transition-all shadow-sm">
                                                        {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                        {copied ? "Copiado!" : "Copiar"}
                                                    </button>
                                                </div>
                                                <p className="text-sm text-[#666666] leading-relaxed italic whitespace-pre-wrap bg-white p-5 rounded-2xl border border-black/5">"{results.commercialNarrative}"</p>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'budget' && (
                                            <div className="flex flex-col gap-8">
                                                <div className="flex flex-col lg:flex-row justify-between items-center gap-4 border-b border-black/5 pb-6 text-center lg:text-left">
                                                    <div>
                                                        <h3 className="text-xl font-medium text-[#1A1A1A]">Cotización Modular IngentIA</h3>
                                                        <p className="text-sm text-[#666666]">Configura los alcances de tu propuesta comercial</p>
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setSaveFormData({
                                                                    ...saveFormData,
                                                                    title: `Cotización Modular - ${projectName}`
                                                                });
                                                                setIsSaveModalOpen(true);
                                                            }}
                                                            className="flex items-center justify-center gap-2 bg-white border border-black/10 hover:bg-black/5 text-[#1A1A1A] px-6 py-3 rounded-full text-sm font-medium transition-all shadow-sm w-full sm:w-auto"
                                                        >
                                                            <Save size={16} /> 
                                                            Guardar Registro
                                                        </button>
                                                        <button onClick={() => handlePrint()}
                                                            className="flex items-center justify-center gap-2 bg-[#222222] hover:bg-black text-white px-6 py-3 rounded-full text-sm font-medium transition-all shadow-md group w-full sm:w-auto">
                                                            <Download size={16} className="group-hover:translate-y-0.5 transition-transform" /> 
                                                            Exportar PDF
                                                        </button>
                                                    </div>
                                                </div>

                                            {/* Indicador de Selección */}
                                            <div className="bg-[#FFD166]/10 border border-[#FFD166]/20 p-4 rounded-2xl flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-sm text-[#1A1A1A] font-medium">
                                                    <CheckCircle2 size={16} className="text-[#1A1A1A]" />
                                                    Selecciona los módulos a incluir en el PDF
                                                </div>
                                                <div className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                                                    {selectedModules.length} Módulos seleccionados
                                                </div>
                                            </div>

                                            {/* Grilla de Módulos */}
                                            <div className="grid grid-cols-1 gap-4">
                                                {/* Módulo 1 */}
                                                <div className={`bg-white border flex flex-col rounded-[28px] p-4 sm:p-6 transition-all duration-300 ${!selectedModules.includes('module1') ? 'opacity-40 grayscale border-black/5' : 'border-[#FFD166] shadow-md shadow-[#FFD166]/5'}`}>
                                                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                                                        <div className="flex items-center gap-4">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={selectedModules.includes('module1')}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) setSelectedModules([...selectedModules, 'module1']);
                                                                    else setSelectedModules(selectedModules.filter(m => m !== 'module1'));
                                                                }}
                                                                className="w-6 h-6 rounded-lg border-2 border-black/10 text-[#222222] focus:ring-[#FFD166] cursor-pointer shrink-0"
                                                            />
                                                            <div>
                                                                <span className="text-[10px] text-[#666666] uppercase tracking-wider font-bold">Módulo de Consultoría</span>
                                                                <h4 className="font-semibold text-[#1A1A1A] text-base sm:text-lg leading-tight mt-0.5">Módulo 1: Auditoría de Procesos</h4>
                                                            </div>
                                                        </div>
                                                        <div className="text-left sm:text-right pl-10 sm:pl-0">
                                                            <span className="text-xl sm:text-2xl font-light text-[#1A1A1A]">${results.pricing.module1.price.toLocaleString()}</span>
                                                            <span className="text-xs text-[#666666] ml-1 font-medium">USD</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-[#666666] text-sm leading-relaxed mb-6 sm:ml-10">{results.pricing.module1.description}</p>
                                                    <div className="flex items-center gap-2 text-xs text-[#666666] font-semibold bg-black/5 px-4 py-2.5 rounded-2xl w-fit sm:ml-10">
                                                        <Clock size={14} /> Tiempo de Entrega: {results.pricing.module1.deliveryDays} días
                                                    </div>
                                                </div>

                                                {/* Módulo 2 */}
                                                <div className={`bg-white border flex flex-col rounded-[28px] p-4 sm:p-6 transition-all duration-300 ${results.pricing.module2.price === 0 ? 'hidden' : (!selectedModules.includes('module2') ? 'opacity-40 grayscale border-black/5' : 'border-[#FFD166] shadow-md shadow-[#FFD166]/5')}`}>
                                                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                                                        <div className="flex items-center gap-4">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={selectedModules.includes('module2')}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) setSelectedModules([...selectedModules, 'module2']);
                                                                    else setSelectedModules(selectedModules.filter(m => m !== 'module2'));
                                                                }}
                                                                className="w-6 h-6 rounded-lg border-2 border-black/10 text-[#222222] focus:ring-[#FFD166] cursor-pointer shrink-0"
                                                            />
                                                            <div>
                                                                <span className="text-[10px] text-[#666666] uppercase tracking-wider font-bold">{results.pricing.module2.pricingModel}</span>
                                                                <h4 className="font-semibold text-[#1A1A1A] text-base sm:text-lg leading-tight mt-0.5">Módulo 2: Implementación</h4>
                                                            </div>
                                                        </div>
                                                        <div className="text-left sm:text-right pl-10 sm:pl-0">
                                                            <span className="text-xl sm:text-2xl font-light text-[#1A1A1A]">
                                                                {results.pricing.module2.price > 0 ? `$${results.pricing.module2.price.toLocaleString()}` : 'N/A'}
                                                            </span>
                                                            <span className="text-xs text-[#666666] ml-1 font-medium">USD</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-[#666666] text-sm leading-relaxed sm:ml-10">{results.pricing.module2.description}</p>
                                                </div>

                                                {/* Módulo 3 */}
                                                <div className={`bg-white border flex flex-col rounded-[28px] p-4 sm:p-6 transition-all duration-300 ${results.pricing.module3.monthlyPrice === 0 ? 'hidden' : (!selectedModules.includes('module3') ? 'opacity-40 grayscale border-black/5' : 'border-[#FFD166] shadow-md shadow-[#FFD166]/5')}`}>
                                                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                                                        <div className="flex items-center gap-4">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={selectedModules.includes('module3')}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) setSelectedModules([...selectedModules, 'module3']);
                                                                    else setSelectedModules(selectedModules.filter(m => m !== 'module3'));
                                                                }}
                                                                className="w-6 h-6 rounded-lg border-2 border-black/10 text-[#222222] focus:ring-[#FFD166] cursor-pointer shrink-0"
                                                            />
                                                            <div>
                                                                <span className="text-[10px] text-[#666666] uppercase tracking-wider font-bold">Módulo Recurrente</span>
                                                                <h4 className="font-semibold text-[#1A1A1A] text-base sm:text-lg leading-tight mt-0.5">Módulo 3: Evolución & Soporte</h4>
                                                            </div>
                                                        </div>
                                                        <div className="text-left sm:text-right pl-10 sm:pl-0">
                                                            <span className="text-xl sm:text-2xl font-light text-[#1A1A1A]">
                                                                {results.pricing.module3.monthlyPrice > 0 ? `$${results.pricing.module3.monthlyPrice.toLocaleString()}` : 'N/A'}
                                                            </span>
                                                            <span className="text-xs text-[#666666] ml-1 font-medium">USD/mes</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-[#666666] text-sm leading-relaxed sm:ml-10">{results.pricing.module3.description}</p>
                                                </div>
                                            </div>

                                            {/* Caja de Total Selección */}
                                            <div className="bg-[#222222] p-8 rounded-[32px] shadow-2xl shadow-black/10 flex flex-col sm:flex-row justify-between items-center gap-6">
                                                <div>
                                                    <h4 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Inversión Inicial Estimada</h4>
                                                    <p className="text-white/40 text-[11px]">
                                                        {selectedModules.length === 0 ? "Sin módulos seleccionados" : 
                                                         `Módulos: ${selectedModules.map(m => m.replace('module', 'M')).join(', ')}`}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-[#FFD166] text-4xl font-light">
                                                            ${(
                                                                (selectedModules.includes('module1') ? results.pricing.module1.price : 0) +
                                                                (selectedModules.includes('module2') ? results.pricing.module2.price : 0)
                                                            ).toLocaleString()}
                                                        </span>
                                                        <span className="text-white/40 text-sm font-medium">USD</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>

            {/* Hidden PDF Template */}
            <div className="absolute opacity-0 pointer-events-none -z-50">
                {results && (
                    <BudgetPDFTemplate
                        ref={printRef}
                        formData={pdfFormData}
                        result={pdfResult}
                    />
                )}
            </div>

            {/* Save Modal */}
            {isSaveModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-black/5 flex justify-between items-center">
                            <h3 className="text-xl font-medium text-[#1A1A1A]">Guardar Cotización en Historial</h3>
                            <button onClick={() => setIsSaveModalOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                                <Plus size={20} className="text-[#1A1A1A] rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveQuote} className="p-8 flex flex-col gap-6">
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-[#1A1A1A]">Título del Registro</label>
                                    <input 
                                        required 
                                        type="text" 
                                        value={saveFormData.title}
                                        onChange={(e) => setSaveFormData({ ...saveFormData, title: e.target.value })}
                                        className={inputClass}
                                        placeholder="Ej: Propuesta Q1 - IoT Tableros"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-[#1A1A1A]">Estado</label>
                                        <select 
                                            value={saveFormData.status}
                                            onChange={(e) => setSaveFormData({ ...saveFormData, status: e.target.value })}
                                            className={inputClass}
                                        >
                                            <option value="Generada">Generada</option>
                                            <option value="Enviada">Enviada</option>
                                            <option value="Aceptada">Aceptada</option>
                                            <option value="Rechazada">Rechazada</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-[#1A1A1A]">Fecha de Envío (opcional)</label>
                                        <input 
                                            type="date" 
                                            value={saveFormData.sent_date}
                                            onChange={(e) => setSaveFormData({ ...saveFormData, sent_date: e.target.value })}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-[#1A1A1A]">Comentarios Internos</label>
                                    <textarea 
                                        value={saveFormData.comments}
                                        onChange={(e) => setSaveFormData({ ...saveFormData, comments: e.target.value })}
                                        rows={3}
                                        className={textareaClass}
                                        placeholder="Notas sobre lo discutido con el cliente..."
                                    ></textarea>
                                </div>
                            </div>

                            <div className="bg-[#FFD166]/10 border border-[#FFD166]/20 p-4 rounded-2xl">
                                <p className="text-xs text-[#1A1A1A] font-medium flex items-center gap-2">
                                    <Database size={14} /> Se guardará vinculada a {clientName} / {projectName}
                                </p>
                            </div>

                            <div className="flex justify-end gap-4 mt-2">
                                <button 
                                    type="button"
                                    onClick={() => setIsSaveModalOpen(false)}
                                    className="px-6 py-3 rounded-full text-sm font-medium text-[#666666] hover:bg-black/5 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSaving}
                                    className="flex items-center gap-2 bg-[#222222] hover:bg-black disabled:opacity-50 text-white px-8 py-3 rounded-full text-sm font-medium transition-colors shadow-lg"
                                >
                                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    {isSaving ? 'Guardando...' : 'Confirmar Guardado'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
