import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
    Wand2, Database, Calculator, Microscope, Lightbulb, CheckCircle2,
    AlertTriangle, Copy, Plus, Loader2, DollarSign, Download, FileText,
    Briefcase, TrendingUp, Link as LinkIcon, BookOpen
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { mockClients, mockProjects, mockNotebooks } from "../data/mockData";
import { BudgetPDFTemplate } from "../components/BudgetPDFTemplate";

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

    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: 'Propuesta_IngentIA' });

    useEffect(() => {
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
    }, []);

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
        setTimeout(() => {
            const mockResult: AnalysisResult = {
                diagnosis: "El cliente presenta procesos manuales que generan cuellos de botella en la gestión operativa. Hay oportunidades significativas para implementar IA conversacional y automatizar el ciclo logístico.",
                hoursStage1: companySize === "SME" ? 25 : companySize === "Medium" ? 75 : 120,
                hoursStage2: companySize === "SME" ? 60 : companySize === "Medium" ? 180 : 350,
                labelStage1: companySize === "SME" ? "Auditoría de procesos" : "Auditoría Integral",
                labelStage2: companySize === "SME" ? "Plan Ágil" : "Arquitectura TO-BE",
                roiEstimate: "Reducción del 30% en tiempos de proceso manual",
                salesStrategy: companySize === "SME"
                    ? "Enfocarse en retorno rápido y un paquete inicial de bajo costo."
                    : "Demostrar alineación estratégica B2B/B2C y mitigación de riesgos a gran escala.",
                deliverables: [
                    "Mapeo detallado de procesos actuales (AS-IS)",
                    "Matriz de cuellos de botella e ineficiencias",
                    "Plan Maestro de Trabajo (PMT)",
                    "Prototipo visual y funcional para validación UX",
                    "Plan de capacitación y handover formal"
                ],
                risks: [
                    "Resistencia cultural al cambio",
                    "Falta de normalización en sistemas heredados (Legacy DB)"
                ],
                commercialNarrative: `Estimado Equipo Directivo,\n\nTras analizar su contexto operativo, hemos identificado áreas clave de fuga de valor. IngentIA propone un modelo de abordaje segmentado iniciando con una Auditoría de Procesos para asegurar un ROI alto en la inversión digital.`,
                pricing: {
                    module1: {
                        description: "Auditoría en sitio, levantamiento de arquitectura actual y documentación de procesos AS-IS vs TO-BE.",
                        price: companySize === "SME" ? 1500 : companySize === "Medium" ? 4500 : 9000,
                        deliveryDays: companySize === "SME" ? 15 : 30
                    },
                    module2: {
                        description: serviceType === "Consultancy" ? "Desarrollo de Playbook Estratégico." : "Desarrollo completo de Ecosistema de AI.",
                        price: serviceType === "Consultancy" ? 0 : (companySize === "SME" ? 5000 : 18000),
                        pricingModel: serviceType === "Consultancy" ? "N/A" : "Precio Fijo con 50% anticipo"
                    },
                    module3: {
                        description: "Evolución continua, mantenimiento de modelos LLM y licencias cloud.",
                        monthlyPrice: serviceType === "Consultancy" ? 0 : (companySize === "SME" ? 300 : 1200)
                    },
                    totalInitialInvestment: companySize === "SME"
                        ? (serviceType === "Consultancy" ? 1500 : 6500)
                        : (serviceType === "Consultancy" ? 4500 : 22500)
                },
                financialEstimation: {
                    estimatedRevenue: companySize === "SME" ? 250000 : 1200000,
                    revenueJustification: "El cálculo PxQ asume un mix conservador de ventas B2B con ticket promedio del mercado.",
                    investmentToRevenueRatio: companySize === "SME" ? "2.6% de la facturación anual" : "1.8% de la facturación anual"
                }
            };
            setResults(mockResult);
            localStorage.setItem("lastAdvancedQuote", JSON.stringify({
                inputs: { companySize, serviceType, clientUrl, notebookLmContext, transcripts, clientId, projectId },
                results: mockResult,
                timestamp: new Date().getTime()
            }));
            setAppState('results');
            setActiveTab('strategy');
        }, 3000);
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

    const handleNotebookSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nbId = e.target.value;
        if (!nbId) { setNotebookLmContext(""); return; }
        const selected = (mockNotebooks as any[]).find((n: any) => n.id === nbId);
        if (selected) {
            setNotebookLmContext(`[NotebookLM Import]: ${selected.title}\n\nSummary:\n${selected.summary || ''}`);
        }
    };

    const clientName = mockClients.find(c => c.id === clientId)?.name || "Cliente";
    const projectName = mockProjects.find(p => p.id === projectId)?.name || "Proyecto";

    // PDF template props matching old BudgetPDFTemplate interface
    const pdfFormData = { clientId, projectId, clientName, projectName };
    const pdfResult = results ? {
        module1: { total: results.pricing.module1.price },
        module2: { total: results.pricing.module2.price }
    } : undefined;

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tighter text-[#1A1A1A]">SMART<span className="text-[#008fcd]"> QUOTER</span></h1>
                    <p className="text-[#4A4A4A] mt-1 font-medium italic">Analizador Avanzado &amp; Cotización Inteligente</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={startNewQuote} className="flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white/80 border border-black/10 rounded-xl text-sm font-medium text-[#1A1A1A] transition-colors">
                        <Plus size={16} /> Nueva Cotización
                    </button>
                    <div className="flex items-center gap-3 bg-white/40 p-2 px-4 rounded-xl border border-white/50 shadow-sm backdrop-blur-md">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-[#1A1A1A]">Motor Gemini Pro Activo</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <aside className="lg:col-span-5 space-y-6">
                    <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[32px] border border-white/40 shadow-sm space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2 mb-4">
                                <Database className="text-[#008fcd] w-5 h-5" /> Vinculación de Cotización
                            </h2>
                            <div className="flex flex-col gap-4 border-b border-black/5 pb-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-[#1A1A1A]">Cliente Asociado</label>
                                        <Link to="/new-client" className="text-xs text-[#008fcd] hover:underline font-medium">+ Nuevo</Link>
                                    </div>
                                    <select value={clientId} onChange={(e) => setClientId(e.target.value)}
                                        className="w-full bg-white/50 border border-black/10 rounded-2xl p-3 text-[#1A1A1A] focus:ring-2 focus:ring-[#FFD166] outline-none transition-all appearance-none text-sm">
                                        <option value="">Seleccionar cliente...</option>
                                        {mockClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-[#1A1A1A]">Proyecto Asociado</label>
                                        <Link to="/new-project" className="text-xs text-[#008fcd] hover:underline font-medium">+ Nuevo</Link>
                                    </div>
                                    <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
                                        className="w-full bg-white/50 border border-black/10 rounded-2xl p-3 text-[#1A1A1A] focus:ring-2 focus:ring-[#FFD166] outline-none transition-all appearance-none text-sm">
                                        <option value="">Seleccionar proyecto...</option>
                                        {mockProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2 mb-4">
                                <Microscope className="text-[#008fcd] w-5 h-5" /> Contexto Analítico
                            </h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#1A1A1A]">Tamaño de Empresa</label>
                                        <select value={companySize} onChange={(e) => setCompanySize(e.target.value)}
                                            className="w-full bg-white/50 border border-black/10 rounded-2xl p-3 text-[#1A1A1A] focus:ring-2 focus:ring-[#FFD166] outline-none transition-all appearance-none text-sm">
                                            <option value="SME">Pequeña / SME</option>
                                            <option value="Medium">Mediana</option>
                                            <option value="Large">Corporación</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#1A1A1A]">Tipo de Servicio</label>
                                        <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}
                                            className="w-full bg-white/50 border border-black/10 rounded-2xl p-3 text-[#1A1A1A] focus:ring-2 focus:ring-[#FFD166] outline-none transition-all appearance-none text-sm">
                                            <option value="Consultancy">Consultoría</option>
                                            <option value="Full">Consultoría + App/IA</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#1A1A1A] flex items-center gap-2">
                                        <LinkIcon className="w-4 h-4 text-[#008fcd]" /> Sitios y Redes
                                    </label>
                                    <input type="text" value={clientUrl} onChange={(e) => setClientUrl(e.target.value)}
                                        placeholder="https://ejemplo.com, @instagram..."
                                        className="w-full bg-white/50 border border-black/10 rounded-2xl p-3 text-[#1A1A1A] focus:ring-2 focus:ring-[#FFD166] outline-none transition-all text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#1A1A1A] flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-[#008fcd]" /> Importar Cuaderno (NotebookLM)
                                    </label>
                                    <select onChange={handleNotebookSelect} defaultValue=""
                                        className="w-full bg-[#008fcd]/5 border border-[#008fcd]/20 rounded-2xl p-3 text-[#006b99] focus:ring-2 focus:ring-[#008fcd] outline-none transition-all appearance-none text-sm font-medium">
                                        <option value="">Seleccionar cuaderno...</option>
                                        {(mockNotebooks as any[]).map((n: any) => (
                                            <option key={n.id} value={n.id}>{n.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#1A1A1A]">Contexto NotebookLM / Manual</label>
                                    <textarea value={notebookLmContext} onChange={(e) => setNotebookLmContext(e.target.value)} rows={3}
                                        placeholder="El contexto del cuaderno aparecerá aquí..."
                                        className="w-full bg-white/50 border border-black/10 rounded-2xl p-4 text-[#1A1A1A] focus:ring-2 focus:ring-[#FFD166] outline-none transition-all text-sm resize-none"></textarea>
                                </div>
                                <div className="space-y-2 pt-2">
                                    <label className="text-sm font-medium text-[#1A1A1A] flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-[#008fcd]" /> Minutas Extra
                                    </label>
                                    <textarea value={transcripts} onChange={(e) => setTranscripts(e.target.value)} rows={3}
                                        placeholder="Pega aquí las minutas de la reunión..."
                                        className="w-full bg-white/50 border border-black/10 rounded-2xl p-4 text-[#1A1A1A] focus:ring-2 focus:ring-[#FFD166] outline-none transition-all text-sm resize-none"></textarea>
                                </div>
                            </div>
                        </div>

                        <button onClick={analyzeProject} disabled={appState === 'loading'}
                            className="w-full bg-[#E63946] hover:bg-red-500 text-white transition-colors py-4 rounded-full font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 disabled:opacity-70 disabled:cursor-not-allowed mt-4">
                            {appState === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                            {appState === 'loading' ? 'Procesando...' : 'Procesar y Presupuestar'}
                        </button>
                    </div>
                </aside>

                <main className="lg:col-span-7 h-full">
                    {appState === 'welcome' && (
                        <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-10 bg-white/40 backdrop-blur-xl rounded-[32px] border-dashed border-2 border-black/10">
                            <div className="w-24 h-24 bg-white/60 rounded-full flex items-center justify-center mb-6 shadow-sm">
                                <Calculator className="w-10 h-10 text-[#666666]" />
                            </div>
                            <h3 className="text-2xl font-bold text-[#1A1A1A]">Esperando Datos</h3>
                            <p className="text-[#666666] mt-2 max-w-sm">Vincula un cliente y elabora el contexto para generar el análisis estratégico.</p>
                        </div>
                    )}

                    {appState === 'loading' && (
                        <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-10 bg-white/40 backdrop-blur-xl rounded-[32px] border border-white/50 shadow-sm">
                            <Loader2 className="w-16 h-16 text-[#E63946] animate-spin mb-6" />
                            <h3 className="text-xl font-bold text-[#E63946] animate-pulse">Investigando mercado y dimensionando ROI...</h3>
                            <p className="text-[#666666] mt-2 font-medium">Leyendo cuadernos y scrapeando URLs</p>
                        </div>
                    )}

                    {appState === 'results' && results && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white/60 backdrop-blur-md border border-white/60 shadow-sm p-4 rounded-[20px]">
                                    <span className="text-[10px] text-[#666666] uppercase font-bold tracking-wider">Hito Diagnóstico</span>
                                    <div className="text-2xl font-black text-[#1A1A1A] mt-1">{results.hoursStage1} h</div>
                                    <p className="text-[11px] font-semibold text-[#008fcd] mt-0.5 truncate">{results.labelStage1}</p>
                                </div>
                                <div className="bg-white/60 backdrop-blur-md border border-white/60 shadow-sm p-4 rounded-[20px]">
                                    <span className="text-[10px] text-[#666666] uppercase font-bold tracking-wider">Hito TO-BE</span>
                                    <div className="text-2xl font-black text-[#1A1A1A] mt-1">{results.hoursStage2} h</div>
                                    <p className="text-[11px] font-semibold text-[#008fcd] mt-0.5 truncate">{results.labelStage2}</p>
                                </div>
                                <div className="bg-[#4bbd6e]/10 backdrop-blur-md border border-[#4bbd6e]/30 shadow-sm p-4 rounded-[20px]">
                                    <span className="text-[10px] text-[#4bbd6e] uppercase font-bold tracking-wider">Facturación Est.</span>
                                    <div className="text-lg font-black text-[#3ea85d] mt-1">${results.financialEstimation.estimatedRevenue.toLocaleString()}</div>
                                    <p className="text-[11px] font-semibold text-[#3ea85d] mt-0.5">Anual (PxQ)</p>
                                </div>
                                <div className="bg-[#E63946]/10 backdrop-blur-md border border-[#E63946]/30 shadow-sm p-4 rounded-[20px]">
                                    <span className="text-[10px] text-[#E63946] uppercase font-bold tracking-wider">Inversión Inicial</span>
                                    <div className="text-lg font-black text-[#E63946] mt-1">${results.pricing.totalInitialInvestment.toLocaleString()}</div>
                                    <p className="text-[11px] font-semibold text-[#E63946] mt-0.5">
                                        {results.pricing.module2.price === 0 ? "Módulo 1" : "Módulos 1+2"}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/50 shadow-sm overflow-hidden">
                                <div className="flex border-b border-black/5 bg-white/40">
                                    <button onClick={() => setActiveTab('strategy')}
                                        className={`px-6 py-4 text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === 'strategy' ? 'border-b-2 border-[#008fcd] text-[#1A1A1A] bg-white/30' : 'text-[#666666] hover:text-[#1A1A1A]'}`}>
                                        <Briefcase className="w-4 h-4" /> Análisis Estratégico
                                    </button>
                                    <button onClick={() => setActiveTab('budget')}
                                        className={`px-6 py-4 text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === 'budget' ? 'border-b-2 border-[#008fcd] text-[#1A1A1A] bg-white/30' : 'text-[#666666] hover:text-[#1A1A1A]'}`}>
                                        <DollarSign className="w-4 h-4" /> Presupuesto Modular
                                    </button>
                                </div>

                                <div className="p-8">
                                    {activeTab === 'strategy' && (
                                        <div className="space-y-8">
                                            <section>
                                                <h4 className="text-[#1A1A1A] font-bold mb-3 flex items-center gap-2 text-lg">
                                                    <Microscope className="text-[#E63946] w-5 h-5" /> Diagnóstico de Situación
                                                </h4>
                                                <p className="text-[#4A4A4A] text-sm leading-relaxed bg-white/50 p-4 rounded-2xl border border-black/5">{results.diagnosis}</p>
                                            </section>
                                            <section>
                                                <h4 className="text-[#1A1A1A] font-bold mb-3 flex items-center gap-2 text-lg">
                                                    <TrendingUp className="text-[#4bbd6e] w-5 h-5" /> Dimensionamiento de Mercado (PxQ)
                                                </h4>
                                                <div className="bg-[#4bbd6e]/5 p-5 rounded-2xl text-sm text-[#1A1A1A] border border-[#4bbd6e]/20">
                                                    <p className="mb-3">{results.financialEstimation.revenueJustification}</p>
                                                    <div className="text-[#4bbd6e] font-semibold text-sm">Inversión/Facturación: {results.financialEstimation.investmentToRevenueRatio}</div>
                                                </div>
                                            </section>
                                            <section>
                                                <h4 className="text-[#1A1A1A] font-bold mb-3 flex items-center gap-2 text-lg">
                                                    <Lightbulb className="text-[#FFD166] w-5 h-5" /> Estrategia de Venta
                                                </h4>
                                                <div className="bg-amber-50 p-5 rounded-2xl text-sm italic text-[#8a6b18] border-l-4 border-[#FFD166]">{results.salesStrategy}</div>
                                            </section>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-black/5">
                                                <div>
                                                    <h4 className="text-xs font-bold text-[#666666] uppercase tracking-widest mb-3">Entregables Clave</h4>
                                                    <ul className="text-sm space-y-3 text-[#1A1A1A]">
                                                        {results.deliverables.map((d, i) => (
                                                            <li key={i} className="flex items-start gap-2">
                                                                <CheckCircle2 className="text-[#4bbd6e] w-4 h-4 mt-0.5 shrink-0" />
                                                                <span>{d}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-[#666666] uppercase tracking-widest mb-3">Riesgos Identificados</h4>
                                                    <ul className="text-sm space-y-3 text-[#1A1A1A]">
                                                        {results.risks.map((r, i) => (
                                                            <li key={i} className="flex items-start gap-2">
                                                                <AlertTriangle className="text-amber-500 w-4 h-4 mt-0.5 shrink-0" />
                                                                <span>{r}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 border border-black/5 p-6 rounded-3xl shadow-sm">
                                                <div className="flex justify-between items-start mb-4">
                                                    <h4 className="font-bold text-[#1A1A1A] text-lg">Narrativa Comercial Sugerida</h4>
                                                    <button onClick={copyNarrative} className="flex items-center gap-2 text-xs font-medium bg-white border border-black/10 text-[#1A1A1A] px-4 py-2 rounded-xl hover:bg-black/5 transition-all shadow-sm">
                                                        {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                        {copied ? "Copiado!" : "Copiar"}
                                                    </button>
                                                </div>
                                                <p className="text-sm text-[#4A4A4A] leading-relaxed italic whitespace-pre-wrap bg-white p-5 rounded-2xl border border-black/5">"{results.commercialNarrative}"</p>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'budget' && (
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-xl font-bold text-[#1A1A1A]">Cotización Modular IngentIA</h3>
                                                <button onClick={() => handlePrint()}
                                                    className="bg-white hover:bg-slate-50 border border-black/10 text-[#1A1A1A] px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                                                    <Download className="w-4 h-4" /> Exportar PDF
                                                </button>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="bg-white/80 border border-black/5 rounded-[24px] p-6 shadow-sm">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-bold text-lg text-[#1A1A1A]">Módulo 1: Auditoría de Procesos</h4>
                                                        <span className="text-xs text-[#666666] uppercase tracking-wider font-bold">Consultoría</span>
                                                    </div>
                                                    <span className="text-xl font-bold text-[#008fcd]">${results.pricing.module1.price} USD</span>
                                                    <p className="text-[#4A4A4A] text-sm mt-2">{results.pricing.module1.description}</p>
                                                    <div className="flex items-center gap-2 text-xs text-[#1A1A1A] font-medium bg-slate-100 px-3 py-1.5 rounded-xl border border-black/5 mt-3 w-fit">
                                                        <FileText className="w-3 h-3 text-[#008fcd]" /> Entrega: {results.pricing.module1.deliveryDays} días
                                                    </div>
                                                </div>
                                                <div className={`bg-white/80 border border-black/5 rounded-[24px] p-6 shadow-sm ${results.pricing.module2.price === 0 ? 'opacity-60' : ''}`}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h4 className="font-bold text-lg text-[#1A1A1A]">Módulo 2: Implementación</h4>
                                                            <span className="text-xs text-[#666666] uppercase font-bold">{results.pricing.module2.pricingModel}</span>
                                                        </div>
                                                        <span className="text-xl font-bold text-[#008fcd]">
                                                            {results.pricing.module2.price > 0 ? `$${results.pricing.module2.price} USD` : 'N/A'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[#4A4A4A] text-sm">{results.pricing.module2.description}</p>
                                                </div>
                                                <div className={`bg-white/80 border border-black/5 rounded-[24px] p-6 shadow-sm ${results.pricing.module3.monthlyPrice === 0 ? 'opacity-60' : ''}`}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-bold text-lg text-[#1A1A1A]">Módulo 3: Evolución &amp; Soporte</h4>
                                                        <span className="text-xl font-bold text-[#008fcd]">
                                                            {results.pricing.module3.monthlyPrice > 0 ? `$${results.pricing.module3.monthlyPrice} USD / mes` : 'N/A'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[#4A4A4A] text-sm">{results.pricing.module3.description}</p>
                                                </div>
                                            </div>
                                            <div className="mt-8 flex justify-end">
                                                <div className="bg-[#1A1A1A] p-6 rounded-[24px] border border-black min-w-[320px] shadow-xl">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-[#a0a0a0]">Inversión Inicial Total:</span>
                                                        <span className="text-2xl font-black text-[#FFD166]">${results.pricing.totalInitialInvestment} USD</span>
                                                    </div>
                                                    <p className="text-xs text-[#666666] font-medium text-right mt-1">
                                                        {results.pricing.module2.price === 0 ? "Módulo 1" : "Módulo 1 + Módulo 2"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <div className="absolute opacity-0 pointer-events-none -z-50">
                {results && (
                    <BudgetPDFTemplate
                        ref={printRef}
                        formData={pdfFormData}
                        result={pdfResult}
                    />
                )}
            </div>
        </div>
    );
}
