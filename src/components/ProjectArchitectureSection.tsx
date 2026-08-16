import { useState, useEffect } from 'react';
import {
  Wand2, Sparkles, Copy, Download, Check, AlertTriangle, Layers, Database,
  ArrowRight, RefreshCw, ChevronDown, ChevronUp, Bot, Workflow, DollarSign, ShieldAlert,
  FileCode, CheckCircle2, XCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  diseniarArquitectura, planMaestroAMarkdown,
  type PlanMaestro, type HerramientaCatalogo, type ArquitecturaReferencia,
} from '../lib/gemini-arquitectura';

interface ProjectArchitectureSectionProps {
  project: {
    id: string;
    name: string;
    client: string;
    description: string;
    arquitectura_plan?: PlanMaestro | null;
    arquitectura_md?: string | null;
  };
  onUpdate: () => Promise<void> | void;
}

export default function ProjectArchitectureSection({ project, onUpdate }: ProjectArchitectureSectionProps) {
  const [plan, setPlan] = useState<PlanMaestro | null>(project.arquitectura_plan || null);
  const [markdown, setMarkdown] = useState<string>(project.arquitectura_md || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingForm, setIsEditingForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'stack' | 'automatizacion' | 'datos' | 'flujos' | 'riesgos'>('stack');
  const [isExpanded, setIsExpanded] = useState(true);

  // Form state for generating / re-generating
  const [requerimiento, setRequerimiento] = useState(project.description || '');
  const [contexto, setContexto] = useState('');
  const [usuarios, setUsuarios] = useState('');
  const [canales, setCanales] = useState<string[]>(['Web', 'WhatsApp']);

  const CANALES = ['Web', 'WhatsApp', 'Email', 'Voz / Teléfono', 'Interno (staff)'];

  useEffect(() => {
    setPlan(project.arquitectura_plan || null);
    setMarkdown(project.arquitectura_md || '');
    setRequerimiento(project.description || '');
  }, [project]);

  const handleGenerate = async () => {
    if (!requerimiento.trim()) {
      setError('Por favor especifica el requerimiento del proyecto.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // 1. Fetch catalog & references from Supabase
      const [{ data: herramientas }, { data: arquitecturas }] = await Promise.all([
        supabase.from('stack_herramientas').select('*').order('categoria'),
        supabase.from('stack_arquitecturas').select('*'),
      ]);

      const catalogo: HerramientaCatalogo[] = (herramientas || []).map((h: any) => ({
        nombre: h.nombre,
        categoria: h.categoria,
        que_es: h.que_es,
        cuando_usar: h.cuando_usar,
        costo: h.costo,
        estado: h.estado,
      }));

      const referencias: ArquitecturaReferencia[] = (arquitecturas || []).map((a: any) => ({
        nombre: a.nombre,
        caso_uso: a.caso_uso,
        cuando_aplica: a.cuando_aplica,
        componentes: a.componentes || [],
        costo_estimado: a.costo_estimado,
        justificacion: a.justificacion,
      }));

      // 2. Generate Plan with AI
      const resultado = await diseniarArquitectura({
        proyecto: project.name,
        cliente: project.client || 'Sin especificar',
        requerimiento,
        contexto: contexto || undefined,
        usuarios: usuarios || undefined,
        canales,
        catalogo,
        referencias,
      });

      const md = planMaestroAMarkdown(resultado, { proyecto: project.name, cliente: project.client });

      // 3. Save directly to project in Supabase
      const { error: saveErr } = await supabase
        .from('projects')
        .update({
          arquitectura_plan: resultado,
          arquitectura_md: md,
        })
        .eq('id', project.id);

      if (saveErr) throw saveErr;

      setPlan(resultado);
      setMarkdown(md);
      setIsEditingForm(false);
      if (onUpdate) await onUpdate();
    } catch (err: any) {
      console.error('Error generando arquitectura:', err);
      setError(err.message || 'No se pudo generar la arquitectura.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan-maestro-${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden flex flex-col transition-all">
      {/* Header */}
      <div className="p-5 border-b border-black/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-linear-to-r from-white to-black/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#008fcd]/10 border border-[#008fcd]/20 flex items-center justify-center text-[#008fcd] shrink-0">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-semibold text-[#1A1A1A]">Plan Maestro de Arquitectura</h4>
              {plan && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Definida
                </span>
              )}
            </div>
            <p className="text-xs text-[#666666] mt-0.5">
              Stack de desarrollo, decisiones técnicas, estrategia de automatización y esquema de base de datos.
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {plan && (
            <>
              <button
                onClick={handleCopyMarkdown}
                title="Copiar Plan Maestro para pegar en Antigravity"
                className="flex items-center gap-1.5 bg-black/5 hover:bg-black/10 text-[#1A1A1A] px-3.5 py-2 rounded-full text-xs font-semibold transition-all border border-black/5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado para IDE' : 'Copiar .md'}
              </button>
              <button
                onClick={handleDownload}
                title="Descargar archivo Markdown"
                className="flex items-center gap-1.5 bg-white hover:bg-black/5 text-[#1A1A1A] px-3.5 py-2 rounded-full text-xs font-semibold transition-all border border-black/10"
              >
                <Download className="w-3.5 h-3.5" /> Descargar
              </button>
              <button
                onClick={() => setIsEditingForm(!isEditingForm)}
                className="flex items-center gap-1.5 bg-[#222222] hover:bg-black text-white px-4 py-2 rounded-full text-xs font-semibold transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                {isEditingForm ? 'Ocultar Diseñador' : 'Rediseñar con IA'}
              </button>
            </>
          )}

          {!plan && !isEditingForm && (
            <button
              onClick={() => setIsEditingForm(true)}
              className="flex items-center gap-2 bg-[#222222] hover:bg-black text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFD166]" /> Diseñar Arquitectura con IA
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-black/5 rounded-full text-[#666666] transition-transform"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 flex flex-col gap-6">
          {/* Formulario Diseñador con IA (Visible si no hay plan o si el usuario quiere rediseñar) */}
          {(isEditingForm || !plan) && (
            <div className="bg-black/[0.02] border border-black/5 rounded-2xl p-5 flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#008fcd]" />
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                    {plan ? 'Reconfigurar y Rediseñar Arquitectura' : 'Generador Automático de Arquitectura'}
                  </h5>
                </div>
                {plan && (
                  <button
                    onClick={() => setIsEditingForm(false)}
                    className="text-xs text-[#666666] hover:text-[#1A1A1A] font-medium"
                  >
                    Cancelar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">
                    Requerimiento Técnico / Necesidad del Cliente
                  </label>
                  <textarea
                    rows={3}
                    value={requerimiento}
                    onChange={(e) => setRequerimiento(e.target.value)}
                    placeholder="Describe qué se debe construir, procesos involucrados o integraciones necesarias..."
                    className="bg-white border border-black/10 rounded-xl p-3 text-xs outline-none focus:border-[#008fcd] resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">
                    Contexto Extra / Sistemas Actuales
                  </label>
                  <input
                    type="text"
                    value={contexto}
                    onChange={(e) => setContexto(e.target.value)}
                    placeholder="Ej. Ya usan Supabase y WhatsApp Cloud API..."
                    className="bg-white border border-black/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#008fcd]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">
                    Usuarios Estimados
                  </label>
                  <input
                    type="text"
                    value={usuarios}
                    onChange={(e) => setUsuarios(e.target.value)}
                    placeholder="Ej. 10 operadores internos + 1000 usuarios externos"
                    className="bg-white border border-black/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#008fcd]"
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">
                    Canales de Interacción
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {CANALES.map((c) => {
                      const on = canales.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCanales(on ? canales.filter((x) => x !== c) : [...canales, c])}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                            on
                              ? 'bg-[#008fcd] text-white border-[#008fcd]'
                              : 'bg-white text-[#666666] border-black/10 hover:border-[#008fcd]/50'
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-2 bg-[#222222] hover:bg-black disabled:opacity-50 text-white px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Diseñando arquitectura...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-[#FFD166]" />
                      {plan ? 'Actualizar Arquitectura' : 'Generar Plan de Arquitectura'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Render del Plan Maestro */}
          {plan ? (
            <div className="flex flex-col gap-5">
              {/* Top Banner de Resumen */}
              <div className="bg-linear-to-r from-[#008fcd]/5 via-white to-black/[0.02] border border-[#008fcd]/20 rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#008fcd]">
                    Arquitectura Base Elegida
                  </span>
                  <span className="text-xs font-mono text-[#666666] bg-black/5 px-2.5 py-0.5 rounded-full">
                    Costo estimado: {plan.costo_infraestructura}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">{plan.arquitectura_base}</h3>
                <p className="text-xs text-[#4A4A4A] leading-relaxed">{plan.resumen_ejecutivo}</p>
              </div>

              {/* Pestañas de Navegación del Plan */}
              <div className="flex bg-black/5 p-1 rounded-xl w-fit flex-wrap gap-1 border border-black/5">
                <button
                  onClick={() => setActiveTab('stack')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'stack' ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-[#666666] hover:text-[#1A1A1A]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> Stack & Decisiones
                </button>
                <button
                  onClick={() => setActiveTab('automatizacion')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'automatizacion' ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-[#666666] hover:text-[#1A1A1A]'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 text-[#008fcd]" /> Estrategia de Automatización
                </button>
                <button
                  onClick={() => setActiveTab('datos')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'datos' ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-[#666666] hover:text-[#1A1A1A]'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" /> Esquema de Datos ({plan.esquema_datos?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('flujos')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'flujos' ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-[#666666] hover:text-[#1A1A1A]'
                  }`}
                >
                  <Workflow className="w-3.5 h-3.5" /> Flujos ({plan.flujos?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('riesgos')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'riesgos' ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-[#666666] hover:text-[#1A1A1A]'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" /> Riesgos & Alcance
                </button>
              </div>

              {/* Contenido de la Pestaña Activa */}
              <div className="animate-in fade-in duration-150">
                {/* 1. STACK & DECISIONES */}
                {activeTab === 'stack' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {plan.decisiones.map((d, i) => (
                      <div
                        key={i}
                        className="p-3.5 bg-black/[0.02] hover:bg-black/[0.04] rounded-xl border border-black/5 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[9px] uppercase font-bold tracking-widest text-[#008fcd]">
                              {d.capa}
                            </span>
                            {d.fuera_de_catalogo && (
                              <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                Fuera de catálogo
                              </span>
                            )}
                          </div>
                          <h5 className="font-semibold text-sm text-[#1A1A1A]">{d.herramienta}</h5>
                          <p className="text-xs text-[#666666] mt-1 leading-relaxed">{d.justificacion}</p>
                        </div>
                        {d.alternativa_descartada && (
                          <p className="text-[10px] text-[#999999] mt-2 pt-2 border-t border-black/5 italic">
                            Alternativa descartada: {d.alternativa_descartada}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. ESTRATEGIA DE AUTOMATIZACIÓN (n8n vs Agentes) */}
                {activeTab === 'automatizacion' && (
                  <div className="flex flex-col gap-4">
                    {plan.estrategia_automatizacion ? (
                      <div className="p-4 bg-black/[0.02] rounded-2xl border border-black/5 flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5 text-[#008fcd]" />
                            <h5 className="font-semibold text-sm text-[#1A1A1A]">
                              Enfoque Recomendado:{' '}
                              <span className="text-[#008fcd] uppercase">
                                {plan.estrategia_automatizacion.tipo === 'n8n'
                                  ? 'Automatización Determinista (n8n)'
                                  : plan.estrategia_automatizacion.tipo === 'agentes'
                                  ? 'Automatización Agéntica'
                                  : plan.estrategia_automatizacion.tipo === 'hibrido'
                                  ? 'Enfoque Híbrido (n8n + Agentes)'
                                  : 'Sin automatización'}
                              </span>
                            </h5>
                          </div>
                        </div>

                        <p className="text-xs text-[#4A4A4A] leading-relaxed">
                          {plan.estrategia_automatizacion.justificacion}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                          {plan.estrategia_automatizacion.pros?.length > 0 && (
                            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/50 flex flex-col gap-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Pros de este enfoque
                              </span>
                              <ul className="space-y-1">
                                {plan.estrategia_automatizacion.pros.map((pro, idx) => (
                                  <li key={idx} className="text-xs text-emerald-900 flex items-start gap-1.5">
                                    <span className="text-emerald-500 font-bold">•</span>
                                    <span>{pro}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {plan.estrategia_automatizacion.contras?.length > 0 && (
                            <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-200/50 flex flex-col gap-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" /> Contras / Consideraciones
                              </span>
                              <ul className="space-y-1">
                                {plan.estrategia_automatizacion.contras.map((contra, idx) => (
                                  <li key={idx} className="text-xs text-rose-900 flex items-start gap-1.5">
                                    <span className="text-rose-500 font-bold">•</span>
                                    <span>{contra}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[#666666] italic p-4 bg-black/[0.02] rounded-xl text-center">
                        No hay una estrategia de automatización explícita generada para este proyecto. Puedes regenerar el plan para obtener la comparativa.
                      </p>
                    )}
                  </div>
                )}

                {/* 3. ESQUEMA DE DATOS */}
                {activeTab === 'datos' && (
                  <div className="space-y-4">
                    {plan.esquema_datos?.map((t) => (
                      <div key={t.tabla} className="p-4 bg-black/[0.02] rounded-xl border border-black/5">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <code className="text-xs font-bold text-[#008fcd] bg-[#008fcd]/10 px-2 py-0.5 rounded">
                            {t.tabla}
                          </code>
                        </div>
                        <p className="text-xs text-[#666666] mb-3">{t.proposito}</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-black/5 text-[10px] uppercase font-bold text-[#666666]">
                                <th className="py-1.5 px-2">Campo</th>
                                <th className="py-1.5 px-2">Tipo</th>
                                <th className="py-1.5 px-2">Detalle</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                              {t.campos.map((c) => (
                                <tr key={c.nombre} className="hover:bg-white/50">
                                  <td className="py-1.5 px-2 font-mono text-[#1A1A1A] font-medium">{c.nombre}</td>
                                  <td className="py-1.5 px-2 font-mono text-[#008fcd]">{c.tipo}</td>
                                  <td className="py-1.5 px-2 text-[#666666]">{c.detalle}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. FLUJOS FUNCIONALES */}
                {activeTab === 'flujos' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plan.flujos?.map((f, i) => (
                      <div key={i} className="p-4 bg-black/[0.02] rounded-xl border border-black/5 flex flex-col gap-2">
                        <h5 className="font-semibold text-xs text-[#1A1A1A]">{f.nombre}</h5>
                        <div className="text-[11px] text-[#008fcd] font-medium bg-white px-2 py-1 rounded-md border border-black/5">
                          Disparador: {f.disparador}
                        </div>
                        <ol className="space-y-1 mt-1">
                          {f.pasos.map((p, j) => (
                            <li key={j} className="text-xs text-[#4A4A4A] flex items-start gap-1.5">
                              <span className="text-[#999999] font-mono text-[10px] shrink-0 mt-0.5">{j + 1}.</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                )}

                {/* 5. RIESGOS, INTEGRACIONES Y PRIMER PASO */}
                {activeTab === 'riesgos' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-black/[0.02] rounded-xl border border-black/5 flex flex-col gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">
                        Riesgos Identificados
                      </span>
                      <ul className="space-y-1.5">
                        {plan.riesgos?.map((r, i) => (
                          <li key={i} className="text-xs text-[#4A4A4A] flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-black/[0.02] rounded-xl border border-black/5 flex flex-col gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">
                        Fuera de Alcance
                      </span>
                      <ul className="space-y-1.5">
                        {plan.fuera_de_alcance?.map((f, i) => (
                          <li key={i} className="text-xs text-[#666666] flex items-start gap-2">
                            <span className="text-rose-500 font-bold">✕</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/50 md:col-span-2 flex items-start gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800 shrink-0">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                          Primer Paso Recomendado
                        </span>
                        <p className="text-xs font-semibold text-emerald-950 mt-0.5">{plan.primer_paso}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            !isEditingForm && (
              <div className="text-center py-8 bg-black/[0.02] rounded-2xl border border-dashed border-black/10 flex flex-col items-center gap-3">
                <Wand2 className="w-8 h-8 text-black/20" />
                <div>
                  <p className="font-semibold text-sm text-[#1A1A1A]">No hay arquitectura diseñada todavía</p>
                  <p className="text-xs text-[#666666] mt-1 max-w-sm">
                    Genera el Plan Maestro técnico para tener las decisiones de stack, el esquema de BD y la estrategia de automatización disponibles durante el desarrollo.
                  </p>
                </div>
                <button
                  onClick={() => setIsEditingForm(true)}
                  className="mt-2 flex items-center gap-2 bg-[#222222] hover:bg-black text-white px-5 py-2 rounded-full text-xs font-bold transition-all shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FFD166]" /> Diseñar Arquitectura con IA
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
