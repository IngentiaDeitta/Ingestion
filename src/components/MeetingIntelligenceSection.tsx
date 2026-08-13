import React, { useState } from 'react';
import { 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  Target, 
  AlertTriangle, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Users, 
  Loader2, 
  Copy, 
  Check, 
  X,
  Clock,
  ListChecks,
  MessageSquareQuote
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { ProjectTranscript, MeetingIntelligence, generateMeetingIntelligence } from '../lib/gemini-meeting-intelligence';

interface MeetingIntelligenceSectionProps {
  contextName: string;
  transcripts: ProjectTranscript[];
  initialIntelligence?: MeetingIntelligence | null;
  onSaveIntelligence?: (intelligence: MeetingIntelligence) => Promise<void>;
  className?: string;
  allowRefresh?: boolean;
}

export default function MeetingIntelligenceSection({
  contextName,
  transcripts = [],
  initialIntelligence = null,
  onSaveIntelligence,
  className = '',
  allowRefresh = true
}: MeetingIntelligenceSectionProps) {
  const [intelligence, setIntelligence] = useState<MeetingIntelligence | null>(initialIntelligence);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedTranscriptId, setExpandedTranscriptId] = useState<string | null>(null);
  const [selectedModalTranscript, setSelectedModalTranscript] = useState<ProjectTranscript | null>(null);
  const [modalTab, setModalTab] = useState<'summary' | 'transcript'>('summary');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync if initialIntelligence changes
  React.useEffect(() => {
    if (initialIntelligence) {
      setIntelligence(initialIntelligence);
    }
  }, [initialIntelligence]);

  const handleGenerateIntelligence = async () => {
    if (transcripts.length === 0) return;
    try {
      setIsGenerating(true);
      const result = await generateMeetingIntelligence(transcripts, contextName);
      setIntelligence(result);
      if (onSaveIntelligence) {
        await onSaveIntelligence(result);
      }
    } catch (err: any) {
      console.error('Error generating meeting intelligence:', err);
      alert('Error al generar la síntesis inteligente: ' + (err.message || err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sortedTranscripts = [...transcripts].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className={`bg-white rounded-2xl border border-black/5 shadow-xs p-5 flex flex-col gap-5 ${className}`}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#222222] to-[#444444] text-[#FFD166] flex items-center justify-center shadow-xs shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-semibold text-[#1A1A1A]">Minutas y Acuerdos de Reunión</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/5 text-[#666666]">
                {transcripts.length} {transcripts.length === 1 ? 'Minuta' : 'Minutas'}
              </span>
            </div>
            <p className="text-xs text-[#666666]">
              Resúmenes detallados generados automáticamente vía Tactiq y síntesis ejecutiva consolidada.
            </p>
          </div>
        </div>

        {allowRefresh && transcripts.length > 0 && (
          <button
            onClick={handleGenerateIntelligence}
            disabled={isGenerating}
            className="flex items-center justify-center gap-1.5 bg-[#222222] hover:bg-black text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 shadow-xs shrink-0"
          >
            {isGenerating ? (
              <>
                <Loader2 size={13} className="animate-spin text-[#FFD166]" />
                <span>Sintetizando...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} className="text-[#FFD166]" />
                <span>{intelligence ? 'Actualizar Síntesis IA' : 'Generar Síntesis IA'}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Si no hay minutas registradas */}
      {transcripts.length === 0 ? (
        <div className="py-8 px-4 text-center bg-black/2 rounded-xl border border-dashed border-black/10 flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-[#666666]">
            <Calendar size={18} />
          </div>
          <p className="text-xs font-semibold text-[#1A1A1A]">Sin minutas de reunión registradas todavía</p>
          <p className="text-[11px] text-[#666666] max-w-md">
            Al terminar una reunión en Google Meet, Zoom o Teams, Tactiq genera el resumen detallado y lo vincula automáticamente con su transcripción a esta ficha.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* SÍNTESIS INTELIGENTE CONSOLIDADA (Derivada de todos los resúmenes detallados) */}
          {intelligence ? (
            <div className="bg-gradient-to-br from-zinc-50 to-amber-50/20 rounded-2xl p-4 sm:p-5 border border-black/5 shadow-xs flex flex-col gap-4">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                    Resumen Ejecutivo Consolidado (AI Synthesis sobre Minutas Tactiq)
                  </h5>
                </div>
                {intelligence.last_updated && (
                  <span className="text-[10px] text-[#888888] flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(intelligence.last_updated).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </span>
                )}
              </div>

              {/* Resumen Principal */}
              <p className="text-xs text-[#333333] leading-relaxed bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-black/5 font-normal">
                {intelligence.executive_summary}
              </p>

              {/* Grid de 4 Bloques Clave */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                
                {/* Decisiones y Arquitectura */}
                <div className="bg-white p-3.5 rounded-xl border border-black/5 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-[#1A1A1A]">
                    <Target size={14} className="text-indigo-600" />
                    <span className="text-xs font-bold">Decisiones y Arquitectura Clave</span>
                  </div>
                  <ul className="flex flex-col gap-1.5 pl-1">
                    {(intelligence.key_decisions || []).map((item, idx) => (
                      <li key={idx} className="text-[11px] text-[#555555] flex items-start gap-1.5 leading-snug">
                        <CheckCircle2 size={12} className="text-indigo-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                    {(!intelligence.key_decisions || intelligence.key_decisions.length === 0) && (
                      <li className="text-[11px] text-[#999999] italic">Sin decisiones específicas listadas</li>
                    )}
                  </ul>
                </div>

                {/* Compromisos e Hitos Acordados */}
                <div className="bg-white p-3.5 rounded-xl border border-black/5 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-[#1A1A1A]">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span className="text-xs font-bold">Compromisos e Hitos Validados</span>
                  </div>
                  <ul className="flex flex-col gap-1.5 pl-1">
                    {(intelligence.agreed_commitments || []).map((item, idx) => (
                      <li key={idx} className="text-[11px] text-[#555555] flex items-start gap-1.5 leading-snug">
                        <Check size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                    {(!intelligence.agreed_commitments || intelligence.agreed_commitments.length === 0) && (
                      <li className="text-[11px] text-[#999999] italic">Sin compromisos adicionales</li>
                    )}
                  </ul>
                </div>

                {/* Dolores Detectados */}
                <div className="bg-white p-3.5 rounded-xl border border-black/5 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-[#1A1A1A]">
                    <AlertTriangle size={14} className="text-amber-600" />
                    <span className="text-xs font-bold">Puntos de Dolor Identificados</span>
                  </div>
                  <ul className="flex flex-col gap-1.5 pl-1">
                    {(intelligence.identified_pain_points || []).map((item, idx) => (
                      <li key={idx} className="text-[11px] text-[#555555] flex items-start gap-1.5 leading-snug">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5"></span>
                        <span>{item}</span>
                      </li>
                    ))}
                    {(!intelligence.identified_pain_points || intelligence.identified_pain_points.length === 0) && (
                      <li className="text-[11px] text-[#999999] italic">Sin dolores críticos reportados</li>
                    )}
                  </ul>
                </div>

                {/* Próximos Pasos */}
                <div className="bg-white p-3.5 rounded-xl border border-black/5 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-[#1A1A1A]">
                    <ArrowRight size={14} className="text-blue-600" />
                    <span className="text-xs font-bold">Próximos Pasos Inmediatos</span>
                  </div>
                  <ul className="flex flex-col gap-1.5 pl-1">
                    {(intelligence.next_steps || []).map((item, idx) => (
                      <li key={idx} className="text-[11px] text-[#555555] flex items-start gap-1.5 leading-snug">
                        <ArrowRight size={11} className="text-blue-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                    {(!intelligence.next_steps || intelligence.next_steps.length === 0) && (
                      <li className="text-[11px] text-[#999999] italic">Planificación en curso</li>
                    )}
                  </ul>
                </div>

              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50/40 border border-amber-200/40 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sparkles size={16} className="text-amber-600 shrink-0" />
                <p className="text-xs text-[#444444]">
                  Hay <strong className="text-[#1A1A1A]">{transcripts.length} minutas con resúmenes detallados</strong>. Generá la síntesis ejecutiva para extraer decisiones, acuerdos y próximos pasos consolidados.
                </p>
              </div>
              <button
                onClick={handleGenerateIntelligence}
                disabled={isGenerating}
                className="bg-[#222222] hover:bg-black text-white px-4 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all"
              >
                {isGenerating ? 'Generando...' : 'Sintetizar con IA'}
              </button>
            </div>
          )}

          {/* HISTORIAL INDIVIDUAL DE MINUTAS (CON DETALLE TACTIQ EMBEBIDO) */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                Detalle de Minutas Individuales ({sortedTranscripts.length})
              </h5>
              <span className="text-[10px] text-[#999999]">Generadas por Tactiq</span>
            </div>

            <div className="flex flex-col gap-3">
              {sortedTranscripts.map((t) => {
                const isExpanded = expandedTranscriptId === t.id;
                const formattedDate = new Date(t.created_at).toLocaleDateString('es-ES', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric' 
                });

                const detailedSummaryText = t.detailed_summary || t.transcript_text;

                return (
                  <div 
                    key={t.id} 
                    className="bg-white rounded-xl border border-black/5 hover:border-black/15 transition-all overflow-hidden shadow-2xs"
                  >
                    {/* Header de la tarjeta de minuta */}
                    <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-black/1">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center text-[#1A1A1A] shrink-0 mt-0.5">
                          <FileText size={15} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[#1A1A1A]">
                              {t.summary || 'Minuta de Reunión Tactiq'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-100/70 text-amber-800">
                              {formattedDate}
                            </span>
                          </div>
                          {t.attendees && t.attendees.length > 0 && (
                            <div className="flex items-center gap-1.5 text-[10px] text-[#666666] mt-0.5">
                              <Users size={10} />
                              <span>{t.attendees.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          onClick={() => {
                            setSelectedModalTranscript(t);
                            setModalTab('summary');
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#1A1A1A] hover:bg-black/5 rounded-lg transition-colors border border-black/5"
                        >
                          Ver Resumen Detallado
                        </button>
                        <button
                          onClick={() => setExpandedTranscriptId(isExpanded ? null : t.id)}
                          className="p-1 hover:bg-black/5 rounded-lg text-[#666666] transition-colors"
                          title={isExpanded ? 'Colapsar' : 'Expandir'}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Vista Expandida In-line: Resumen Detallado de Tactiq */}
                    {isExpanded && (
                      <div className="p-4 border-t border-black/5 bg-zinc-50/50 flex flex-col gap-3">
                        <div className="flex justify-between items-center text-[10px] text-[#666666]">
                          <span className="font-bold text-[#1A1A1A] uppercase tracking-wider">
                            Resumen Detallado y Acuerdos de la Reunión:
                          </span>
                          <button
                            onClick={() => handleCopyText(t.id, detailedSummaryText)}
                            className="flex items-center gap-1 text-[#1A1A1A] hover:text-black font-semibold"
                          >
                            {copiedId === t.id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                            <span>{copiedId === t.id ? 'Copiado' : 'Copiar Resumen'}</span>
                          </button>
                        </div>

                        {/* Texto del Resumen Detallado */}
                        <div className="text-xs text-[#333333] whitespace-pre-wrap leading-relaxed max-h-[260px] overflow-y-auto bg-white p-3.5 rounded-xl border border-black/5 font-sans">
                          {detailedSummaryText}
                        </div>

                        {/* Action items si existen */}
                        {t.action_items && t.action_items.length > 0 && (
                          <div className="bg-emerald-50/60 border border-emerald-200/50 p-3 rounded-xl flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                              <ListChecks size={12} />
                              Acuerdos y Tareas Acordadas (Action Items):
                            </span>
                            <ul className="flex flex-col gap-1 pl-1">
                              {t.action_items.map((action, i) => (
                                <li key={i} className="text-[11px] text-emerald-800 flex items-start gap-1.5">
                                  <Check size={11} className="text-emerald-600 shrink-0 mt-0.5" />
                                  <span>{action}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* MODAL DE RESUMEN DETALLADO Y ACTA COMPLETA */}
      {selectedModalTranscript && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setSelectedModalTranscript(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-black/5 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#222222] text-[#FFD166] flex items-center justify-center">
                  <FileText size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1A1A1A]">
                    {selectedModalTranscript.summary || 'Detalle de Minuta Tactiq'}
                  </h4>
                  <p className="text-[11px] text-[#666666]">
                    {new Date(selectedModalTranscript.created_at).toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedModalTranscript(null)}
                className="p-1.5 hover:bg-black/5 rounded-full text-[#666666] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-black/5 bg-zinc-50/50 px-6 gap-4">
              <button
                onClick={() => setModalTab('summary')}
                className={`py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${modalTab === 'summary' ? 'border-[#1A1A1A] text-[#1A1A1A]' : 'border-transparent text-[#666666] hover:text-[#1A1A1A]'}`}
              >
                <Sparkles size={13} />
                Resumen Detallado Tactiq
              </button>
              <button
                onClick={() => setModalTab('transcript')}
                className={`py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${modalTab === 'transcript' ? 'border-[#1A1A1A] text-[#1A1A1A]' : 'border-transparent text-[#666666] hover:text-[#1A1A1A]'}`}
              >
                <MessageSquareQuote size={13} />
                Transcripción Completa
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex flex-col gap-4">
              {selectedModalTranscript.attendees && selectedModalTranscript.attendees.length > 0 && (
                <div className="flex items-center gap-2 p-2.5 bg-black/2 rounded-xl text-xs text-[#555555]">
                  <Users size={14} className="text-[#1A1A1A]" />
                  <strong className="text-[#1A1A1A]">Participantes:</strong>
                  <span>{selectedModalTranscript.attendees.join(', ')}</span>
                </div>
              )}

              {modalTab === 'summary' ? (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs font-bold text-[#666666] uppercase tracking-wider">
                    <span>Resumen Estructurado y Puntos Tratados</span>
                    <button
                      onClick={() => handleCopyText(selectedModalTranscript.id, selectedModalTranscript.detailed_summary || selectedModalTranscript.transcript_text)}
                      className="flex items-center gap-1 text-xs text-[#1A1A1A] hover:underline normal-case font-semibold"
                    >
                      {copiedId === selectedModalTranscript.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      <span>{copiedId === selectedModalTranscript.id ? 'Copiado' : 'Copiar Resumen'}</span>
                    </button>
                  </div>
                  <div className="bg-zinc-50 border border-black/5 rounded-xl p-4 text-xs text-[#222222] whitespace-pre-wrap leading-relaxed font-sans">
                    {selectedModalTranscript.detailed_summary || selectedModalTranscript.transcript_text}
                  </div>

                  {selectedModalTranscript.action_items && selectedModalTranscript.action_items.length > 0 && (
                    <div className="bg-emerald-50/60 border border-emerald-200/50 p-3.5 rounded-xl flex flex-col gap-2">
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <ListChecks size={14} className="text-emerald-600" />
                        Acuerdos y Tareas Registradas (Action Items)
                      </span>
                      <ul className="flex flex-col gap-1.5 pl-1">
                        {selectedModalTranscript.action_items.map((item, idx) => (
                          <li key={idx} className="text-xs text-emerald-900 flex items-start gap-2">
                            <Check size={12} className="text-emerald-600 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-bold text-[#666666] uppercase tracking-wider">
                    <span>Transcripción Cruda de la Llamada</span>
                    <button
                      onClick={() => handleCopyText(selectedModalTranscript.id, selectedModalTranscript.transcript_text)}
                      className="flex items-center gap-1 text-xs text-[#1A1A1A] hover:underline normal-case font-semibold"
                    >
                      {copiedId === selectedModalTranscript.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      <span>{copiedId === selectedModalTranscript.id ? 'Copiado' : 'Copiar Transcripción'}</span>
                    </button>
                  </div>
                  <div className="bg-zinc-50 border border-black/5 rounded-xl p-4 text-xs text-[#444444] whitespace-pre-wrap leading-relaxed font-mono">
                    {selectedModalTranscript.transcript_text}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-black/5 bg-zinc-50 flex justify-end">
              <button
                onClick={() => setSelectedModalTranscript(null)}
                className="bg-[#222222] hover:bg-black text-white px-5 py-2 rounded-xl text-xs font-bold transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
