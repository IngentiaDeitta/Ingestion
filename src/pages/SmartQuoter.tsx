import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
    Wand2, Database, Calculator, Microscope, Lightbulb, CheckCircle2,
    AlertTriangle, Copy, Plus, Loader2, DollarSign, Download, FileText,
    Briefcase, TrendingUp, Link as LinkIcon, BookOpen, Clock, BarChart2, Save,
    Brain, Star, Gift, Anchor, ArrowLeft
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { supabase } from "../lib/supabase";
import { analyzeWithGemini } from "../lib/gemini";
import ProposalPDFTemplate from "../components/ProposalPDFTemplate";
import { sendNotification } from "../lib/notifications";
import { computeArielyPackages } from "../lib/ariely-engine";

type AppState = 'welcome' | 'loading' | 'results';
type TabState = 'strategy' | 'budget' | 'proposal';

const EditablePrice = ({ value, onChange, label='USD' }: { value: number, onChange: (v: number) => void, label?: string }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localVal, setLocalVal] = useState(value.toString());

    return (
        <div className="flex items-center justify-start sm:justify-end gap-1 group">
            <span className="text-xl sm:text-2xl font-light text-[#1A1A1A]">$</span>
            {isEditing ? (
                <input
                    type="number"
                    autoFocus
                    value={localVal}
                    onChange={(e) => setLocalVal(e.target.value)}
                    onBlur={() => {
                        setIsEditing(false);
                        onChange(parseFloat(localVal) || 0);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            setIsEditing(false);
                            onChange(parseFloat(localVal) || 0);
                        }
                    }}
                    className="text-xl sm:text-2xl font-light text-[#1A1A1A] bg-transparent outline-none border-b border-[#FFD166] w-28 sm:text-right"
                />
            ) : (
                <span 
                    onClick={() => { setIsEditing(true); setLocalVal(value.toString()); }}
                    className="text-xl sm:text-2xl font-light text-[#1A1A1A] cursor-text hover:text-[#FFD166] transition-colors border-b border-transparent hover:border-[#FFD166]/50"
                    title="Click para editar"
                >
                    {value.toLocaleString()}
                </span>
            )}
            <span className="text-xs text-[#666666] ml-1 font-medium">{label}</span>
        </div>
    );
};


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
    const [clientId, setClientId] = useState("");
    const [projectId, setProjectId] = useState("");
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [appState, setAppState] = useState<AppState>('welcome');
    const [activeTab, setActiveTab] = useState<TabState>('strategy');
    const [results, setResults] = useState<AnalysisResult | null>(null);
    const [copied, setCopied] = useState(false);
    const [dbClients, setDbClients] = useState<{id: string, name: string, email: string | null}[]>([]);
    const [dbProjects, setDbProjects] = useState<{id: string, name: string, client: string}[]>([]);
    const [selectedModules, setSelectedModules] = useState<string[]>(['module1', 'module2', 'module3']);
    
    // Value-Based Pricing state
    const [annualSavings, setAnnualSavings] = useState(10000);
    const [customSetupFee, setCustomSetupFee] = useState<number | null>(null);

    const setupFee = customSetupFee !== null ? customSetupFee : (annualSavings * 0.25);

    // Save Quote State
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [saveFormData, setSaveFormData] = useState({
        title: '',
        comments: '',
        status: 'Generada',
        sent_date: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [searchParams] = useSearchParams();
    const [isIdLoading, setIsIdLoading] = useState(false);

    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: 'Propuesta_Unificada_IngentIA' });

    useEffect(() => {
        fetchClientsAndProjects();
        
        const quoteId = searchParams.get('quoteId');
        const analysisId = searchParams.get('analysisId');
        const pIdFromUrl = searchParams.get('projectId');
        
        if (quoteId) {
            loadQuoteFromId(quoteId);
        } else if (analysisId) {
            loadAnalysisFromId(analysisId);
        } else if (pIdFromUrl) {
            loadFromProject(pIdFromUrl);
        } else {
            const savedQuote = localStorage.getItem("lastAdvancedQuote");
            if (savedQuote) {
                try {
                    const parsed = JSON.parse(savedQuote);
                    setResults(parsed.results);
                    setAnalysisData(parsed.inputs.analysisData || null);
                    setClientId(parsed.inputs.clientId || "");
                    setProjectId(parsed.inputs.projectId || "");
                    setAppState('results');
                } catch (e) { console.error("Failed to load saved quote", e); }
            }
        }
    }, [searchParams]);

    const loadFromProject = async (id: string) => {
        try {
            setIsIdLoading(true);
            setAppState('loading');
            
            const { data: project, error } = await supabase
                .from('projects')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            if (project) {
                // Find matching client ID based on project.client name
                const { data: client } = await supabase
                    .from('clients')
                    .select('id')
                    .eq('name', project.client)
                    .single();
                
                if (client) setClientId(client.id);
                setProjectId(project.id);
                
                if (project.project_analysis) {
                    setAnalysisData(project.project_analysis);
                    // Since we have data, we can directly trigger analysis or stay in welcome ready to click
                    setAppState('welcome');
                } else {
                    setAppState('welcome');
                }
            }
        } catch (error: any) {
            console.error('Error loading project context:', error);
            setAppState('welcome');
        } finally {
            setIsIdLoading(false);
        }
    };

    const loadAnalysisFromId = async (id: string) => {
        try {
            setIsIdLoading(true);
            setAppState('loading');
            
            const { data, error } = await supabase
                .from('solution_analyses')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            if (data) {
                setClientId(data.client_id);
                setProjectId(data.project_id);
                setAnalysisData(data.full_analysis_json);
                setAppState('welcome');
            }
        } catch (error: any) {
            console.error('Error loading analysis:', error);
            alert('No se pudo cargar el análisis previo');
            setAppState('welcome');
        } finally {
            setIsIdLoading(false);
        }
    };

    const fetchClientsAndProjects = async () => {
        const { data: clientsData } = await supabase.from('clients').select('id, name, email').order('name');
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
                const content = data.content || {};
                const safeContent: any = {
                    hoursStage1: content.hoursStage1 ?? 20,
                    labelStage1: content.labelStage1 ?? 'Diagnóstico y Mapeo AS-IS',
                    hoursStage2: content.hoursStage2 ?? 80,
                    labelStage2: content.labelStage2 ?? 'Desarrollo de Ecosistema TO-BE',
                    diagnosis: content.diagnosis ?? 'Diagnóstico operativo y análisis de procesos.',
                    deliverables: Array.isArray(content.deliverables) && content.deliverables.length > 0
                        ? content.deliverables
                        : ['Auditoría de procesos', 'Desarrollo e integraciones a medida', 'Capacitación y manuales'],
                    risks: Array.isArray(content.risks) && content.risks.length > 0
                        ? content.risks
                        : ['Retraso en entrega de accesos', 'Resistencia al cambio en el equipo'],
                    salesStrategy: content.salesStrategy ?? 'Enfocarse en la liberación de horas del equipo y recuperación de ROI.',
                    commercialNarrative: content.commercialNarrative ?? 'Nuestra propuesta busca transformar el potencial operativo en un flujo de ingresos constante.',
                    financialEstimation: content.financialEstimation || {
                        estimatedRevenue: content.pricing?.totalInitialInvestment ? content.pricing.totalInitialInvestment * 5 : 25000,
                        revenueJustification: 'Estimación basada en volumen operativo y optimización de procesos.',
                        investmentToRevenueRatio: '4% de la facturación anual estimada'
                    },
                    pricing: content.pricing || {
                        module1: { price: 600, description: 'Diagnóstico de procesos' },
                        module2: { price: 1200, description: 'Desarrollo e integraciones' },
                        module3: { monthlyPrice: 150, description: 'Mantenimiento evolutivo' },
                        totalInitialInvestment: data.total_amount || 1800
                    }
                };

                setResults(safeContent as AnalysisResult);
                setSelectedModules(data.selected_modules || ['module1', 'module2', 'module3']);
                setClientId(data.client_id || '');
                setProjectId(data.project_id || '');
                setAppState('results');
                setActiveTab('budget');
            }
        } catch (error: any) {
            console.error('Error loading quote:', error);
            alert('No se pudo cargar la cotización anterior: ' + error.message);
            setAppState('welcome');
        } finally {
            setIsIdLoading(false);
        }
    };

    const analyzeProject = async () => {
        if (!analysisData) {
            alert("No hay un análisis base para cotizar. Inicia desde AI Solution Architect.");
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
                solutionAnalysisJson: analysisData
            });

            setResults(geminiResult);
            // Default select modules that have a price > 0
            const initialModules = ['module1'];
            if (geminiResult.pricing.module2.price > 0) initialModules.push('module2');
            if (geminiResult.pricing.module3.monthlyPrice > 0) initialModules.push('module3');
            setSelectedModules(initialModules);

            localStorage.setItem("lastAdvancedQuote", JSON.stringify({
                inputs: { analysisData, clientId, projectId },
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
        setResults(null); setAnalysisData(null);
        setClientId(""); setProjectId("");
        setAppState('welcome');
        localStorage.removeItem("lastAdvancedQuote");
    };

    const handleSaveQuote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!results || !clientId) return;

        try {
            setIsSaving(true);
            const total = (selectedModules.includes('module1') ? results.pricing.module1.price : 0) +
                          (selectedModules.includes('module2') ? results.pricing.module2.price : 0);

            // Instanciación automática del proyecto si todavía no hay uno seleccionado
            let activeProjectId = projectId;
            if (!activeProjectId) {
                const { data: newProject, error: projError } = await supabase
                    .from('projects')
                    .insert({
                        name: saveFormData.title || `${clientName} - Módulo 1`,
                        client: clientName,
                        budget: total,
                        status: 'Preventa',
                        outcome: 'Propuesta',
                        description: results.diagnosis || '',
                        delegated_to: 'In-house',
                        progress: 0
                    })
                    .select()
                    .single();
                if (projError) throw projError;
                activeProjectId = newProject.id;
                setProjectId(newProject.id);
            }

            const { data: savedQuote, error } = await supabase.from('quotes').insert({
                client_id: clientId,
                project_id: activeProjectId,
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
            }).select().single();

            if (error) throw error;

            if (saveFormData.status === 'Aceptada') {
                const dateIso = new Date().toISOString().split('T')[0];

                if (selectedModules.includes('module2')) {
                    // Lógica 40/30/30 para Módulo 2
                    const mod2Price = results.pricing.module2.price;
                    const financePayloads = [
                        {
                            project_id: activeProjectId,
                            client_id: clientId,
                            type: 'income',
                            amount: mod2Price * 0.40,
                            currency: 'USD',
                            date: dateIso,
                            description: `Hito 1 (40%) - Anticipo Módulo 2: ${projectName}`,
                            status: 'Pending',
                            category: 'Setup Fee'
                        },
                        {
                            project_id: activeProjectId,
                            client_id: clientId,
                            type: 'income',
                            amount: mod2Price * 0.30,
                            currency: 'USD',
                            date: dateIso,
                            description: `Hito 2 (30%) - Intermedio Módulo 2: ${projectName}`,
                            status: 'Pending',
                            category: 'Setup Fee'
                        },
                        {
                            project_id: activeProjectId,
                            client_id: clientId,
                            type: 'income',
                            amount: mod2Price * 0.30,
                            currency: 'USD',
                            date: dateIso,
                            description: `Hito 3 (30%) - Entrega Módulo 2: ${projectName}`,
                            status: 'Pending',
                            category: 'Setup Fee'
                        }
                    ];
                    const { error: finError } = await supabase.from('finances').insert(financePayloads);
                    if (finError) console.error('Error auto-generating finances:', finError);
                } else if (selectedModules.includes('module1')) {
                    // Anticipo simple para Módulo 1 solo
                    const { error: finError } = await supabase.from('finances').insert([{
                        project_id: activeProjectId,
                        client_id: clientId,
                        type: 'income',
                        amount: results.pricing.module1.price,
                        currency: 'USD',
                        date: dateIso,
                        description: `Anticipo Módulo 1 - Diagnóstico: ${projectName}`,
                        status: 'Pending',
                        category: 'Setup Fee'
                    }]);
                    if (finError) console.error('Error auto-generating module1 finance:', finError);
                }

                // Instanciación/transición del proyecto a "Ganado" / "En Progreso"
                const { data: currentProject } = await supabase
                    .from('projects')
                    .select('status, outcome')
                    .eq('id', activeProjectId)
                    .single();

                if (currentProject && (currentProject.status !== 'En Progreso' || currentProject.outcome !== 'Ganado')) {
                    await supabase.from('projects').update({ status: 'En Progreso', outcome: 'Ganado' }).eq('id', activeProjectId);
                    await supabase.from('project_status_history').insert({
                        project_id: activeProjectId,
                        field: 'status',
                        old_value: currentProject.status,
                        new_value: 'En Progreso',
                    });
                }
            }

            await sendNotification(
                'Nueva Cotización Guardada',
                `Se ha generado una nueva propuesta para '${clientName}' por un total de $${total.toLocaleString()}.`,
                'quote'
            );

            setSavedQuoteId(savedQuote.id);
            fetchClientsAndProjects();

            if (!selectedClientEmail) {
                alert('Cotización guardada exitosamente');
                setIsSaveModalOpen(false);
            }
        } catch (error: any) {
            console.error('Error saving quote:', error);
            alert(`Error al guardar: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendQuoteEmail = async () => {
        if (!savedQuoteId) return;
        try {
            setIsSendingEmail(true);
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-quote-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ quoteId: savedQuoteId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error desconocido al enviar el email.');
            alert(`Cotización enviada a ${selectedClientEmail}.`);
            setIsSaveModalOpen(false);
            setSavedQuoteId(null);
        } catch (error: any) {
            console.error('Error sending quote email:', error);
            alert('Error al enviar el email: ' + error.message);
        } finally {
            setIsSendingEmail(false);
        }
    };

    const handlePriceUpdate = (module: 'module1' | 'module2' | 'module3', newPrice: number) => {
        if (!results) return;
        const updatedResults = { ...results };
        if (module === 'module3') {
            updatedResults.pricing[module].monthlyPrice = newPrice;
        } else {
            updatedResults.pricing[module].price = newPrice;
        }
        
        // Actualizar el total de la inversión inicial sumando los módulos 1 y 2 que actúan como base si aplican
        updatedResults.pricing.totalInitialInvestment = updatedResults.pricing.module1.price + updatedResults.pricing.module2.price;
        setResults(updatedResults);
    };

    const clientName = dbClients.find(c => c.id === clientId)?.name || "Cliente";
    const selectedClientEmail = dbClients.find(c => c.id === clientId)?.email || null;
    const projectName = dbProjects.find(p => p.id === projectId)?.name || "Proyecto";
    const filteredProjects = clientId
        ? dbProjects.filter(p => p.client === clientName)
        : dbProjects;

    // Calcular ArielyResult de forma reactiva
    const arielyResult = useMemo(() => {
        try {
            return computeArielyPackages(setupFee, annualSavings, results, analysisData, clientName);
        } catch (e) {
            console.error('Error computing Ariely packages:', e);
            return null;
        }
    }, [setupFee, annualSavings, results, analysisData, clientName]);

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
                <div className="flex items-center gap-3">
                    <Link to="/propuestas" className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-black/5 transition-colors border border-black/10 shadow-xs shrink-0" title="Volver a Propuestas">
                        <ArrowLeft className="w-5 h-5 text-[#666666]" />
                    </Link>
                    <div>
                        <h3 style={{ fontFamily: "system-ui, -apple-system, sans-serif" }} className="text-2xl font-bold tracking-tight text-[#1A1A1A]">Smart Quoter</h3>
                        <p className="text-[#666666] text-xs mt-0.5">Analizador avanzado y cotización inteligente para tus proyectos.</p>
                    </div>
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

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start min-w-0">
                {/* Left Panel */}
                <aside className="lg:col-span-3 flex flex-col gap-6 min-w-0">
                    {/* Vinculación */}
                    <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm p-8 flex flex-col gap-6">
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
                    <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm p-8 flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white rounded-2xl shadow-sm text-[#1A1A1A]">
                                <Microscope size={20} />
                            </div>
                            <div>
                                <h4 className="text-lg font-medium text-[#1A1A1A]">Análisis Estratégico</h4>
                                <p className="text-xs text-[#666666]">Base para la cotización inteligente</p>
                            </div>
                        </div>

                        {analysisData ? (
                            <div className="bg-[#222222]/5 p-4 rounded-2xl border border-black/5 text-sm text-[#1A1A1A]">
                                <p className="font-medium mb-2 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    Análisis cargado correctamente
                                </p>
                                <p className="text-[#666666] text-xs">El modelo Gemini utilizará la arquitectura y diagnóstico previo para estructurar el presupuesto modular de forma automática.</p>
                            </div>
                        ) : (
                            <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 text-sm text-amber-800">
                                <p className="font-medium flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    No hay análisis asociado
                                </p>
                                <p className="text-xs mt-1">Debes iniciar este proceso desde el módulo <strong>AI Solution Architect</strong> para obtener un análisis profundo de la empresa antes de cotizar.</p>
                            </div>
                        )}

                        <button onClick={analyzeProject} disabled={appState === 'loading' || !analysisData}
                            className="w-full bg-[#222222] hover:bg-black disabled:opacity-50 text-white transition-all py-4 rounded-full font-medium flex items-center justify-center gap-2 shadow-lg shadow-black/10 mt-2">
                            {appState === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                            {appState === 'loading' ? 'Generando Presupuesto...' : 'Generar Presupuesto con IA'}
                        </button>
                    </div>
                </aside>

                {/* Right Panel - Results */}
                <main className="lg:col-span-7 flex flex-col gap-6 min-w-0">
                    {appState === 'welcome' && (
                        <div className="flex-1 min-h-[500px] flex flex-col items-center justify-center text-center p-10 bg-white/40 backdrop-blur-xl rounded-2xl border-dashed border-2 border-black/10">
                            <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                                <Calculator className="w-9 h-9 text-[#999999]" />
                            </div>
                            <h3 className="text-2xl font-medium text-[#1A1A1A]">Listo para Cotizar</h3>
                            <p className="text-[#666666] mt-2 max-w-sm text-sm">
                                {analysisData ? "El análisis estratégico ha sido cargado. Haz clic en 'Generar Presupuesto con IA' para continuar." : "Esperando que se transfiera un análisis desde AI Solution Architect."}
                            </p>
                        </div>
                    )}

                    {appState === 'loading' && (
                        <div className="flex-1 min-h-[500px] flex flex-col items-center justify-center text-center p-10 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm">
                            <div className="w-20 h-20 bg-[#222222] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                                <Loader2 className="w-9 h-9 text-[#FFD166] animate-spin" />
                            </div>
                            <h3 className="text-xl font-medium text-[#1A1A1A]">Generando presupuesto...</h3>
                            <p className="text-[#666666] mt-2 text-sm">Estructurando módulos y estimando ROI en base al análisis previo</p>
                        </div>
                    )}

                    {appState === 'results' && results && (
                        <>
                            {/* Stat Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/40 shadow-sm p-5">
                                    <div className="p-2 bg-white rounded-xl shadow-sm text-[#1A1A1A] w-fit mb-3">
                                        <Clock size={18} />
                                    </div>
                                    <p className="text-[10px] text-[#666666] uppercase font-medium tracking-wider mb-1">Hito Diagnóstico</p>
                                    <h4 className="text-2xl font-light text-[#1A1A1A]">{results.hoursStage1}<span className="text-sm text-[#666666] ml-1">h</span></h4>
                                    <p className="text-[11px] text-[#666666] mt-1">{results.labelStage1}</p>
                                </div>
                                <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/40 shadow-sm p-5">
                                    <div className="p-2 bg-white rounded-xl shadow-sm text-[#1A1A1A] w-fit mb-3">
                                        <BarChart2 size={18} />
                                    </div>
                                    <p className="text-[10px] text-[#666666] uppercase font-medium tracking-wider mb-1">Hito TO-BE</p>
                                    <h4 className="text-2xl font-light text-[#1A1A1A]">{results.hoursStage2}<span className="text-sm text-[#666666] ml-1">h</span></h4>
                                    <p className="text-[11px] text-[#666666] mt-1">{results.labelStage2}</p>
                                </div>
                                <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/40 shadow-sm p-5">
                                    <div className="p-2 bg-white rounded-xl shadow-sm text-green-600 w-fit mb-3">
                                        <TrendingUp size={18} />
                                    </div>
                                    <p className="text-[10px] text-[#666666] uppercase font-medium tracking-wider mb-1">Facturación Est.</p>
                                    <h4 className="text-xl font-light text-[#1A1A1A]">${results.financialEstimation.estimatedRevenue.toLocaleString()}</h4>
                                    <p className="text-[11px] text-[#666666] mt-1">Anual (PxQ)</p>
                                </div>
                                <div className="bg-[#222222] text-white rounded-xl shadow-xl p-5">
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
                            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden mt-2">
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
                                    <button onClick={() => setActiveTab('proposal')}
                                        className={`px-6 py-4 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'proposal'
                                            ? 'border-b-2 border-[#008CA4] text-[#008CA4] bg-white/30'
                                            : 'text-[#666666] hover:text-[#008CA4]'}`}>
                                        <Brain size={16} /> Propuesta Conductual
                                        <span className="bg-[#008CA4] text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">NUEVO</span>
                                    </button>
                                </div>

                                <div className="p-4 sm:p-8">
                                    {activeTab === 'strategy' && (
                                        <div className="flex flex-col gap-8">
                                            {/* Diagnóstico */}
                                            <section className="min-w-0">
                                                <h4 className="text-[#1A1A1A] font-medium mb-3 flex items-center gap-2">
                                                    <Microscope className="text-[#FFD166] w-5 h-5 shrink-0" /> Diagnóstico de Situación
                                                </h4>
                                                <p className="text-[#666666] text-sm leading-relaxed bg-white/50 p-5 rounded-2xl border border-black/5 break-words whitespace-pre-wrap">{results.diagnosis}</p>
                                            </section>

                                            {/* PxQ */}
                                            <section className="min-w-0">
                                                <h4 className="text-[#1A1A1A] font-medium mb-3 flex items-center gap-2">
                                                    <TrendingUp className="text-green-500 w-5 h-5 shrink-0" /> Dimensionamiento de Mercado (PxQ)
                                                </h4>
                                                <div className="bg-green-500/5 p-5 rounded-2xl text-sm text-[#1A1A1A] border border-green-500/10 break-words whitespace-pre-wrap">
                                                    <p className="text-[#666666] mb-3">{results.financialEstimation.revenueJustification}</p>
                                                    <div className="text-sm font-medium text-green-600">Inversión/Facturación: {results.financialEstimation.investmentToRevenueRatio}</div>
                                                </div>
                                            </section>

                                            {/* Estrategia de Venta */}
                                            <section className="min-w-0">
                                                <h4 className="text-[#1A1A1A] font-medium mb-3 flex items-center gap-2">
                                                    <Lightbulb className="text-[#FFD166] w-5 h-5 shrink-0" /> Estrategia de Venta
                                                </h4>
                                                <div className="bg-[#FFD166]/10 p-5 rounded-2xl text-sm text-[#1A1A1A] border border-[#FFD166]/20 italic break-words whitespace-pre-wrap">{results.salesStrategy}</div>
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
                                            <div className="bg-white/50 border border-black/5 p-6 rounded-xl">
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
                                                        <h3 className="text-xl font-medium text-[#1A1A1A]">Calculadora Value-Based Pricing</h3>
                                                        <p className="text-sm text-[#666666]">Configura la inversión basada en ROI y Repago</p>
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setSaveFormData({
                                                                    ...saveFormData,
                                                                    title: `Cotización VBP - ${projectName}`
                                                                });
                                                                setSavedQuoteId(null);
                                                                setIsSaveModalOpen(true);
                                                            }}
                                                            className="flex items-center justify-center gap-2 bg-white border border-black/10 hover:bg-black/5 text-[#1A1A1A] px-6 py-3 rounded-full text-sm font-medium transition-all shadow-sm w-full sm:w-auto"
                                                        >
                                                            <Save size={16} /> 
                                                            Guardar Registro
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="bg-white/60 border border-white/40 rounded-[28px] p-8 shadow-sm hover:shadow-md transition-shadow">
                                                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#999999] mb-4">1. Ahorro Anual Estimado</h4>
                                                        <EditablePrice value={annualSavings} onChange={setAnnualSavings} />
                                                        <p className="text-sm text-[#666666] mt-4">Deuda operativa detectada (Proyectada a 12 meses).</p>
                                                    </div>

                                                    <div className="bg-white/60 border border-white/40 rounded-[28px] p-8 shadow-sm hover:shadow-md transition-shadow">
                                                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#999999] mb-4">2. Setup Fee (Implementación)</h4>
                                                        <EditablePrice value={setupFee} onChange={setCustomSetupFee} />
                                                        <p className="text-sm text-[#666666] mt-4">Por defecto sugerimos el 25% del ahorro anual.</p>
                                                    </div>
                                                </div>

                                                <div className={`p-8 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm border transition-colors duration-500 ${
                                                    (annualSavings > 0 && setupFee / (annualSavings / 12) <= 6) ? 'bg-emerald-50 border-emerald-200' : 'bg-white/60 border-white/40'
                                                }`}>
                                                    <div>
                                                        <h4 className="font-bold text-xl text-[#1A1A1A]">Tiempo de Repago</h4>
                                                        <p className="text-sm text-[#666666] max-w-sm mt-1">Si el indicador está en verde, el cliente recuperará su inversión en menos de 6 meses.</p>
                                                    </div>
                                                    <div className="text-5xl font-light text-[#1A1A1A] mt-4 sm:mt-0">
                                                        {annualSavings > 0 ? (setupFee / (annualSavings / 12)).toFixed(1) : '-'} <span className="text-xl text-[#666666] font-medium ml-1">meses</span>
                                                    </div>
                                                </div>
                                            </div>
                                    )}

                                    {activeTab === 'proposal' && arielyResult && (
                                        <div className="flex flex-col gap-8 min-w-0">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="min-w-0">
                                                    <h3 className="text-xl font-semibold text-[#1A1A1A] flex items-center gap-2">
                                                        <Brain className="text-[#008CA4] shrink-0" />
                                                        IngentIA Smart Pricing & Behavioral Engine
                                                    </h3>
                                                    <p className="text-sm text-[#666666] mt-1 break-words whitespace-pre-wrap">
                                                        Previsualización de la arquitectura conductual para reducir el dolor de pago y maximizar la conversión.
                                                    </p>
                                                </div>
                                                <button onClick={() => handlePrint()}
                                                    className="flex items-center gap-2 px-6 py-3 bg-[#00AEC9] hover:bg-[#0090A6] text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-[#00AEC9]/20">
                                                    <Download size={18} />
                                                    Descargar Propuesta
                                                </button>
                                            </div>

                                            {/* ── BLOQUE 1: ANCLAJE ── */}
                                            <section className="bg-white/40 rounded-2xl p-6 border border-black/5 min-w-0">
                                                <h4 className="text-[#1A1A1A] font-medium mb-4 flex items-center gap-2">
                                                    <Anchor className="text-[#008CA4] w-5 h-5 shrink-0" />
                                                    Pilar 1: Anclaje de Expectativas (Costo de Inacción)
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 min-w-0">
                                                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center min-w-0">
                                                        <p className="text-xs text-red-400 uppercase tracking-wider font-bold mb-1 truncate">Costo Ineficiencia</p>
                                                        <p className="text-2xl font-bold text-red-600 truncate">${arielyResult.anchor.annualInefficencyCost.toLocaleString()}</p>
                                                    </div>
                                                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center min-w-0">
                                                        <p className="text-xs text-amber-500 uppercase tracking-wider font-bold mb-1 truncate">Riesgo Operativo</p>
                                                        <p className="text-2xl font-bold text-amber-600 truncate">${arielyResult.anchor.revenueAtRisk.toLocaleString()}</p>
                                                    </div>
                                                    <div className="bg-[#008CA4]/5 border border-[#008CA4]/15 rounded-2xl p-4 text-center min-w-0">
                                                        <p className="text-xs text-[#008CA4] uppercase tracking-wider font-bold mb-1 truncate">ROI Inversión</p>
                                                        <p className="text-2xl font-bold text-[#008CA4] truncate">{arielyResult.anchor.investmentVsWasteRatio}</p>
                                                    </div>
                                                </div>
                                                <div className="bg-white/50 border border-black/5 rounded-2xl p-4 min-w-0">
                                                    <p className="text-sm text-[#444] italic leading-relaxed break-words whitespace-pre-wrap">{arielyResult.anchor.narrativeText}</p>
                                                </div>
                                            </section>

                                            {/* ── BLOQUE 2: EFECTO IKEA ── */}
                                            <section className="bg-white/40 rounded-2xl p-6 border border-black/5 min-w-0">
                                                <h4 className="text-[#1A1A1A] font-medium mb-4 flex items-center gap-2">
                                                    <CheckCircle2 className="text-[#008CA4] w-5 h-5 shrink-0" />
                                                    Pilar 2: Efecto Co-creación (Validación de Prioridades)
                                                </h4>
                                                <div className="bg-white/50 border border-black/5 rounded-2xl overflow-hidden min-w-0">
                                                    {arielyResult.ikeaPriorities.map((item, i) => (
                                                        <div key={i} className={`flex items-center gap-4 px-5 py-3 ${i < arielyResult.ikeaPriorities.length - 1 ? 'border-b border-black/5' : ''}`}>
                                                            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${item.checked ? 'bg-[#008CA4] text-white' : 'bg-black/5 text-[#999]'}`}>
                                                                {item.checked ? <CheckCircle2 size={14} /> : <span className="text-xs">—</span>}
                                                            </div>
                                                            <p className={`flex-1 text-sm break-words ${item.checked ? 'text-[#1A1A1A] font-medium' : 'text-[#999]'}`}>{item.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>

                                            {/* ── BLOQUE 3: TABLA COMPARATIVA ── */}
                                            <section className="bg-white/40 rounded-2xl p-6 border border-black/5 min-w-0">
                                                <h4 className="text-[#1A1A1A] font-medium mb-4 flex items-center gap-2">
                                                    <Star className="text-[#FFD166] w-5 h-5 shrink-0" />
                                                    Pilar 3: Efecto Anzuelo (Arquitectura de Precios)
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
                                                    {arielyResult.packages.map((pkg) => (
                                                        <div key={pkg.id} className={`rounded-2xl p-5 border transition-all min-w-0 ${
                                                            pkg.isRecommended
                                                                ? 'bg-[#008CA4]/5 border-[#008CA4]/30 shadow-md shadow-[#008CA4]/10 relative'
                                                                : 'bg-white/50 border-black/5'
                                                        }`}>
                                                            {pkg.isRecommended && (
                                                                <div className="absolute top-0 right-0 bg-[#008CA4] text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-xl rounded-tr-xl">
                                                                    Recomendado
                                                                </div>
                                                            )}
                                                            <p className={`text-xs font-bold uppercase tracking-wider mt-2 mb-1 truncate ${pkg.isRecommended ? 'text-[#008CA4]' : 'text-[#999]'}`}>{pkg.label}</p>
                                                            <p className={`text-3xl font-light mb-1 truncate ${pkg.isRecommended ? 'text-[#008CA4]' : 'text-[#1A1A1A]'}`}>
                                                                ${pkg.price.toLocaleString()}
                                                                {pkg.monthlyPrice ? <span className="text-sm text-[#666666] font-medium ml-1">+ ${pkg.monthlyPrice}/mes</span> : null}
                                                            </p>
                                                            {pkg.redTag && (
                                                                <div className="inline-block bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-md mt-1 mb-2">
                                                                    {pkg.redTag}
                                                                </div>
                                                            )}
                                                            <ul className="flex flex-col gap-2 min-w-0 mt-3">
                                                                {pkg.features.map((f, fi) => (
                                                                    <li key={fi} className={`text-xs flex items-start gap-2 min-w-0 ${
                                                                        pkg.premiumExtras?.includes(f) ? 'text-[#1A1A1A] font-medium' : 'text-[#555]'
                                                                    }`}>
                                                                        <span className={`shrink-0 ${pkg.premiumExtras?.includes(f) ? 'text-[#008CA4]' : 'text-[#999]'}`}>✓</span>
                                                                        <span className="break-words min-w-0 flex-1">{f}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>

                                            {/* ── BLOQUE 4: PODER DEL GRATIS ── */}
                                            <section className="bg-white/40 rounded-2xl p-6 border border-black/5 min-w-0">
                                                <h4 className="text-[#1A1A1A] font-medium mb-4 flex items-center gap-2">
                                                    <Gift className="text-green-500 w-5 h-5 shrink-0" />
                                                    Pilar 4: El Poder del "Gratis"
                                                </h4>
                                                <div className="bg-green-500/5 border border-green-500/15 rounded-2xl overflow-hidden min-w-0">
                                                    {arielyResult.bonifiedItems.map((item, i) => (
                                                        <div key={i} className={`flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3 gap-2 min-w-0 ${i < arielyResult.bonifiedItems.length - 1 ? 'border-b border-green-500/10' : ''}`}>
                                                            <div className="flex flex-1 items-start sm:items-center gap-3 min-w-0">
                                                                <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                                                                <p className="text-sm text-[#1A1A1A] break-words min-w-0">{item.concept}</p>
                                                            </div>
                                                            <div className="flex items-center gap-4 shrink-0">
                                                                <span className="text-sm text-[#999] line-through truncate">${item.realValue.toLocaleString()}</span>
                                                                <span className="text-xs bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full shrink-0">GRATIS</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        </div>
                                    )}

                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>

            {/* Hidden Proposal PDF Template */}
            <div style={{ display: 'none' }}>
                {results && (
                    <ProposalPDFTemplate
                        ref={printRef}
                        formData={{
                            clientName: dbClients.find(c => c.id === clientId)?.name || 'Cliente',
                            projectName: dbProjects.find(p => p.id === projectId)?.name || 'Proyecto',
                        }}
                        result={{ ...results, selectedModules }}
                        arielyResult={arielyResult || computeArielyPackages(setupFee, annualSavings, results, analysisData, dbClients.find(c => c.id === clientId)?.name || 'Cliente')}
                    />
                )}
            </div>

            {/* Save Modal */}
            {isSaveModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-black/5 flex justify-between items-center">
                            <h3 className="text-xl font-medium text-[#1A1A1A]">{savedQuoteId ? 'Cotización Guardada' : 'Guardar Cotización en Historial'}</h3>
                            <button onClick={() => { setIsSaveModalOpen(false); setSavedQuoteId(null); }} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                                <Plus size={20} className="text-[#1A1A1A] rotate-45" />
                            </button>
                        </div>

                        {savedQuoteId ? (
                            <div className="p-8 flex flex-col gap-6">
                                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3">
                                    <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                                    <p className="text-sm text-emerald-800 font-medium">
                                        La cotización quedó guardada para {clientName} / {projectName}.
                                    </p>
                                </div>
                                {selectedClientEmail ? (
                                    <p className="text-sm text-[#666666]">
                                        ¿Se la enviamos por email a <strong className="text-[#1A1A1A]">{selectedClientEmail}</strong>?
                                    </p>
                                ) : (
                                    <p className="text-sm text-[#666666]">
                                        Este cliente no tiene email cargado, así que no se puede enviar automáticamente. Podés cargarlo en su ficha y enviarla luego desde el historial.
                                    </p>
                                )}
                                <div className="flex justify-end gap-4 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setIsSaveModalOpen(false); setSavedQuoteId(null); }}
                                        className="px-6 py-3 rounded-full text-sm font-medium text-[#666666] hover:bg-black/5 transition-colors"
                                    >
                                        Cerrar
                                    </button>
                                    {selectedClientEmail && (
                                        <button
                                            type="button"
                                            onClick={handleSendQuoteEmail}
                                            disabled={isSendingEmail}
                                            className="flex items-center gap-2 bg-[#222222] hover:bg-black disabled:opacity-50 text-white px-8 py-3 rounded-full text-sm font-medium transition-colors shadow-lg"
                                        >
                                            {isSendingEmail ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                            {isSendingEmail ? 'Enviando...' : 'Enviar por Email'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
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
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
