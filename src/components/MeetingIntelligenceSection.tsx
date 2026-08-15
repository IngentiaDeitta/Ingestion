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
  MessageSquareQuote,
  Plus
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { ProjectTranscript, MeetingIntelligence, generateMeetingIntelligence } from '../lib/gemini-meeting-intelligence';
import ReactMarkdown from 'react-markdown';

interface MeetingIntelligenceSectionProps {
  contextName: string;
  transcripts: ProjectTranscript[];
  initialIntelligence?: MeetingIntelligence | null;
  onSaveIntelligence?: (intelligence: MeetingIntelligence) => Promise<void>;
  onAddTranscript?: (transcript: ProjectTranscript) => Promise<void>;
  className?: string;
  allowRefresh?: boolean;
}

export default function MeetingIntelligenceSection({
  contextName,
  transcripts = [],
  initialIntelligence = null,
  onSaveIntelligence,
  onAddTranscript,
  className = '',
  allowRefresh = true
}: MeetingIntelligenceSectionProps) {
  const [intelligence, setIntelligence] = useState<MeetingIntelligence | null>(initialIntelligence);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedTranscriptId, setExpandedTranscriptId] = useState<string | null>(null);
  const [selectedModalTranscript, setSelectedModalTranscript] = useState<ProjectTranscript | null>(null);
  const [modalTab, setModalTab] = useState<'summary' | 'transcript'>('summary');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Transcript Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 16));
  const [newAttendees, setNewAttendees] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newActionItems, setNewActionItems] = useState('');
  const [newTranscriptText, setNewTranscriptText] = useState('');

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

  const handleSaveNewTranscript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmittingNew(true);
    try {
      const attendeesList = newAttendees
        .split(',')
        .map(a => a.trim())
        .filter(Boolean);

      const actionItemsList = newActionItems
        .split('\n')
        .map(a => a.trim())
        .filter(Boolean);

      const createdTranscript: ProjectTranscript = {
        id: `manual-${Date.now()}`,
        created_at: new Date(newDate).toISOString(),
        summary: newTitle.trim(),
        detailed_summary: newSummary.trim() || newTranscriptText.trim() || 'Reunión registrada.',
        action_items: actionItemsList.length > 0 ? actionItemsList : undefined,
        attendees: attendeesList.length > 0 ? attendeesList : ['Equipo IngentIA'],
        transcript_text: newTranscriptText.trim() || newSummary.trim()
      };

      if (onAddTranscript) {
        await onAddTranscript(createdTranscript);
      }

      // Reset form & close
      setNewTitle('');
      setNewAttendees('');
      setNewSummary('');
      setNewActionItems('');
      setNewTranscriptText('');
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error('Error saving new transcript:', err);
      alert('Error al guardar la minuta: ' + (err.message || err));
    } finally {
      setIsSubmittingNew(false);
    }
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
              Resúmenes detallados generados automáticamente vía Tactiq o registrados manualmente con síntesis ejecutiva.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onAddTranscript && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-1.5 bg-white hover:bg-black/5 border border-black/10 text-[#1A1A1A] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
            >
              <Plus size={14} className="text-[#008fcd]" />
              <span>Registrar Minuta</span>
            </button>
          )}

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
      </div>

      {/* Si no hay minutas registradas */}
      {transcripts.length === 0 ? (
        <div className="py-8 px-4 text-center bg-black/2 rounded-xl border border-dashed border-black/10 flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-[#666666]">
            <Calendar size={18} />
          </div>
          <p className="text-xs font-semibold text-[#1A1A1A]">Sin minutas de reunión registradas todavía</p>
          <p className="text-[11px] text-[#666666] max-w-md">
            Al terminar una reunión en Google Meet, Zoom o Teams, Tactiq genera el resumen detallado y lo vincula automáticamente. También podés registrar notas de reunión manualmente.
          </p>
          {onAddTranscript && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A1A1A] text-white text-xs font-bold hover:bg-black transition-all shadow-xs"
            >
              <Plus size={13} />
              <span>Registrar primera minuta</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* SÍNTESIS INTELIGENTE CONSOLIDADA */}
          {intelligence ? (
            <div className="bg-gradient-to-br from-zinc-50 to-white rounded-xl border border-black/10 p-4 sm:p-5 flex flex-col gap-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h5 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                    Síntesis Ejecutiva Consolidada ({contextName})
                  </h5>
                </div>
                {intelligence.last_updated && (
                  <span className="text-[10px] text-[#888888] font-medium">
                    Actualizado: {new Date(intelligence.last_updated).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Resumen Ejecutivo Global */}
              <div className="bg-white/80 border border-black/5 rounded-xl p-3.5 shadow-2xs">
                <p className="text-xs text-[#222222] leading-relaxed font-normal">
                  {intelligence.executive_summary}
                </p>
              </div>

              {/* Grid de 4 Pilares de Inteligencia */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                
                {/* 1. Decisiones Técnicas & Comerciales */}
                <div className="bg-white rounded-xl border border-sky-100 p-3.5 flex flex-col gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 text-sky-700">
                    <Target size={15} className="shrink-0" />
                    <h6 className="text-xs font-bold uppercase tracking-wider">Decisiones Clave</h6>
                  </div>
                  {intelligence.key_decisions && intelligence.key_decisions.length > 0 ? (
                    <ul className="flex flex-col gap-1.5 pl-1">
                      {intelligence.key_decisions.map((dec, idx) => (
                        <li key={idx} className="text-xs text-[#333333] flex items-start gap-2">
                          <CheckCircle2 size={13} className="text-sky-600 shrink-0 mt-0.5" />
                          <span className="leading-snug">{dec}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-[#888888] italic">Sin decisiones registradas.</p>
                  )}
                </div>

                {/* 2. Acuerdos y Compromisos */}
                <div className="bg-white rounded-xl border border-emerald-100 p-3.5 flex flex-col gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 size={15} className="shrink-0" />
                    <h6 className="text-xs font-bold uppercase tracking-wider">Acuerdos e Hitos</h6>
                  </div>
                  {intelligence.agreed_commitments && intelligence.agreed_commitments.length > 0 ? (
                    <ul className="flex flex-col gap-1.5 pl-1">
                      {intelligence.agreed_commitments.map((ac, idx) => (
                        <li key={idx} className="text-xs text-[#333333] flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
                          <span className="leading-snug">{ac}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-[#888888] italic">Sin compromisos explícitos.</p>
                  )}
                </div>

                {/* 3. Puntos de Dolor & Riesgos */}
                <div className="bg-white rounded-xl border border-amber-100 p-3.5 flex flex-col gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle size={15} className="shrink-0" />
                    <h6 className="text-xs font-bold uppercase tracking-wider">Puntos de Dolor & Riesgos</h6>
                  </div>
                  {intelligence.identified_pain_points && intelligence.identified_pain_points.length > 0 ? (
                    <ul className="flex flex-col gap-1.5 pl-1">
                      {intelligence.identified_pain_points.map((pain, idx) => (
                        <li key={idx} className="text-xs text-[#333333] flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5"></span>
                          <span className="leading-snug">{pain}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-[#888888] italic">Sin bloqueos u objeciones detectadas.</p>
                  )}
                </div>

                {/* 4. Próximos Pasos */}
                <div className="bg-white rounded-xl border border-purple-100 p-3.5 flex flex-col gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 text-purple-700">
                    <ArrowRight size={15} className="shrink-0" />
                    <h6 className="text-xs font-bold uppercase tracking-wider">Próximos Pasos</h6>
                  </div>
                  {intelligence.next_steps && intelligence.next_steps.length > 0 ? (
                    <ul className="flex flex-col gap-1.5 pl-1">
                      {intelligence.next_steps.map((step, idx) => (
                        <li key={idx} className="text-xs text-[#333333] flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-1.5"></span>
                          <span className="leading-snug">{step}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-[#888888] italic">Sin próximos pasos definidos.</p>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Sparkles size={20} className="text-amber-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-900">Síntesis Ejecutiva Pendiente</p>
                  <p className="text-[11px] text-amber-700">
                    Hay <strong className="text-[#1A1A1A]">{transcripts.length} minutas con resúmenes detallados</strong>. Generá la síntesis ejecutiva para extraer decisiones, acuerdos y próximos pasos consolidados.
                  </p>
                </div>
              </div>
              <button
                onClick={handleGenerateIntelligence}
                disabled={isGenerating}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1.5"
              >
                {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                <span>Generar Ahora</span>
              </button>
            </div>
          )}

          {/* LISTA CRONOLÓGICA DE MINUTAS */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                Historial Cronológico de Sesiones ({sortedTranscripts.length})
              </h5>
              <span className="text-[11px] text-[#888888]">
                Ordenado por más reciente
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {sortedTranscripts.map((t) => {
                const isExpanded = expandedTranscriptId === t.id;
                const formattedDate = new Date(t.created_at).toLocaleDateString('es-AR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <div 
                    key={t.id}
                    className="bg-zinc-50/70 hover:bg-zinc-50 border border-black/5 rounded-xl p-4 flex flex-col gap-3 transition-all"
                  >
                    {/* Header de la minuta */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center text-[#1A1A1A] shrink-0 mt-0.5">
                          <FileText size={15} />
                        </div>
                        <div>
                          <h6 className="text-xs font-bold text-[#1A1A1A] leading-tight">
                            {t.summary}
                          </h6>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-[#666666] flex-wrap">
                            <span className="flex items-center gap-1 font-medium text-[#1A1A1A]">
                              <Calendar size={12} className="text-[#888888]" />
                              {formattedDate}
                            </span>
                            {t.attendees && t.attendees.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Users size={12} className="text-[#888888]" />
                                {t.attendees.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botón Ver Transcripción / Resumen */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => {
                            setSelectedModalTranscript(t);
                            setModalTab('summary');
                          }}
                          className="flex items-center gap-1 text-[11px] font-bold text-[#008fcd] hover:text-[#0070a0] bg-white border border-black/5 px-2.5 py-1 rounded-lg hover:bg-black/2 transition-colors shadow-2xs"
                        >
                          <MessageSquareQuote size={12} />
                          <span>Ver Resumen & Acta</span>
                        </button>

                        <button
                          onClick={() => setExpandedTranscriptId(isExpanded ? null : t.id)}
                          className="p-1 hover:bg-black/5 rounded-lg text-[#666666] transition-colors"
                          title={isExpanded ? "Ocultar previsualización" : "Mostrar previsualización"}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Resumen colapsado: plain text truncado / expandido: Markdown completo */}
                    {!isExpanded ? (
                      <p className="text-xs text-[#555555] bg-white px-3 py-2 rounded-xl border border-black/5 shadow-2xs truncate">
                        {(t.detailed_summary || t.transcript_text || '')
                          .replace(/[🎯📌💡•*#>\-_~`]/g, '')
                          .replace(/\n+/g, ' ')
                          .trim()
                          .slice(0, 160)}
                      </p>
                    ) : (
                      <div className="text-xs text-[#333333] leading-relaxed bg-white p-3 rounded-xl border border-black/5 shadow-2xs font-normal markdown-preview whitespace-pre-line">
                        <ReactMarkdown
                          components={{
                            h1: ({node, ...props}) => <strong className="font-bold block mt-1.5 mb-1" {...props} />,
                            h2: ({node, ...props}) => <strong className="font-bold block mt-1.5 mb-1" {...props} />,
                            h3: ({node, ...props}) => <strong className="font-bold block mt-1 mb-0.5" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-4 my-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-4 my-1" {...props} />,
                            li: ({node, ...props}) => <li className="mb-0.5" {...props} />,
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0 whitespace-pre-line" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold" {...props} />
                          }}
                        >
                          {t.detailed_summary || t.transcript_text}
                        </ReactMarkdown>
                      </div>
                    )}

                    {/* Previsualización expandida */}
                    {isExpanded && (
                      <div className="mt-1 pt-3 border-t border-black/5 flex flex-col gap-3 animate-in fade-in duration-200">
                        {t.action_items && t.action_items.length > 0 && (
                          <div className="bg-emerald-50/50 border border-emerald-200/40 p-3 rounded-lg flex flex-col gap-1.5">
                            <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                              <ListChecks size={13} className="text-emerald-600" />
                              Acuerdos y Tareas Registradas:
                            </span>
                            <ul className="flex flex-col gap-1 pl-1">
                              {t.action_items.map((item, idx) => (
                                <li key={idx} className="text-xs text-emerald-950 flex items-start gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-emerald-600 shrink-0 mt-1.5"></span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-[10px] text-[#888888] pt-1">
                          <span>ID de minuta: {t.id}</span>
                          <button
                            onClick={() => handleCopyText(t.id, t.detailed_summary || t.transcript_text)}
                            className="flex items-center gap-1 text-[#1A1A1A] hover:underline font-semibold"
                          >
                            {copiedId === t.id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                            <span>{copiedId === t.id ? 'Copiado al portapapeles' : 'Copiar texto'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* MODAL DETALLE COMPLETO DE MINUTA */}
      {selectedModalTranscript && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-black/5 flex justify-between items-start bg-zinc-50">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center text-[#1A1A1A] shrink-0 mt-0.5">
                  <FileText size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1A1A1A] leading-tight">
                    {selectedModalTranscript.summary}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[#666666] flex-wrap">
                    <span className="flex items-center gap-1 font-medium text-[#1A1A1A]">
                      <Calendar size={12} className="text-[#888888]" />
                      {new Date(selectedModalTranscript.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {selectedModalTranscript.attendees && selectedModalTranscript.attendees.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users size={12} className="text-[#888888]" />
                        {selectedModalTranscript.attendees.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedModalTranscript(null)}
                className="p-1 hover:bg-black/5 rounded-full text-[#666666] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Pestañas de Vista (Resumen vs Transcripción Cruda) */}
            <div className="px-5 pt-3 border-b border-black/5 bg-white flex items-center gap-4">
              <button
                onClick={() => setModalTab('summary')}
                className={`pb-2.5 text-xs font-bold transition-all border-b-2 ${
                  modalTab === 'summary' 
                    ? 'border-[#1A1A1A] text-[#1A1A1A]' 
                    : 'border-transparent text-[#888888] hover:text-[#1A1A1A]'
                }`}
              >
                Resumen Estructurado Tactiq
              </button>
              <button
                onClick={() => setModalTab('transcript')}
                className={`pb-2.5 text-xs font-bold transition-all border-b-2 ${
                  modalTab === 'transcript' 
                    ? 'border-[#1A1A1A] text-[#1A1A1A]' 
                    : 'border-transparent text-[#888888] hover:text-[#1A1A1A]'
                }`}
              >
                Transcripción Completa
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
              {modalTab === 'summary' ? (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center text-xs font-bold text-[#666666] uppercase tracking-wider">
                    <span>Notas & Síntesis de la Sesión</span>
                    <button
                      onClick={() => handleCopyText(selectedModalTranscript.id, selectedModalTranscript.detailed_summary || selectedModalTranscript.transcript_text)}
                      className="flex items-center gap-1 text-xs text-[#1A1A1A] hover:underline normal-case font-semibold"
                    >
                      {copiedId === selectedModalTranscript.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      <span>{copiedId === selectedModalTranscript.id ? 'Copiado' : 'Copiar Resumen'}</span>
                    </button>
                  </div>
                  <div className="bg-zinc-50 border border-black/5 rounded-xl p-4 text-xs text-[#222222] leading-relaxed font-sans markdown-preview">
                    <ReactMarkdown 
                      components={{
                        h1: ({node, ...props}) => <h1 className="font-bold text-sm mt-3 mb-2" {...props} />,
                        h2: ({node, ...props}) => <h2 className="font-bold text-sm mt-3 mb-2" {...props} />,
                        h3: ({node, ...props}) => <h3 className="font-bold text-xs mt-2 mb-1" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        p: ({node, ...props}) => <p className="my-2 whitespace-pre-line" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold" {...props} />
                      }}
                    >
                      {selectedModalTranscript.detailed_summary || selectedModalTranscript.transcript_text}
                    </ReactMarkdown>
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

      {/* MODAL REGISTRAR NUEVA MINUTA / NOTAS */}
      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-black/5 flex justify-between items-center bg-zinc-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#008fcd]/10 text-[#008fcd] flex items-center justify-center font-bold">
                  <Plus size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1A1A1A]">Registrar Minuta de Reunión</h4>
                  <p className="text-[11px] text-[#666666]">Asociada a {contextName}</p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 hover:bg-black/5 rounded-full text-[#666666] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveNewTranscript} className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
              <div>
                <label className="text-[11px] font-bold text-[#666666] uppercase">Título / Asunto de la Sesión *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Seguimiento de Avance · Revisión de Módulo 1"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-9 mt-1 px-3 text-xs bg-white border border-black/10 rounded-xl focus:ring-2 focus:ring-[#008fcd]/30 focus:border-[#008fcd]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#666666] uppercase">Fecha y Hora</label>
                  <input
                    type="datetime-local"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full h-9 mt-1 px-3 text-xs bg-white border border-black/10 rounded-xl focus:ring-2 focus:ring-[#008fcd]/30 focus:border-[#008fcd]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#666666] uppercase">Asistentes (separados por coma)</label>
                  <input
                    type="text"
                    placeholder="Ej: Leandro Gino, Fernando Miceli"
                    value={newAttendees}
                    onChange={(e) => setNewAttendees(e.target.value)}
                    className="w-full h-9 mt-1 px-3 text-xs bg-white border border-black/10 rounded-xl focus:ring-2 focus:ring-[#008fcd]/30 focus:border-[#008fcd]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#666666] uppercase">Resumen Detallado / Puntos Tratados</label>
                <textarea
                  rows={4}
                  placeholder="Resumen de objetivos, demostración realizada, acuerdos y decisiones tomadas..."
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full mt-1 p-3 text-xs bg-white border border-black/10 rounded-xl focus:ring-2 focus:ring-[#008fcd]/30 focus:border-[#008fcd] leading-relaxed"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#666666] uppercase">Acuerdos & Próximos Pasos (uno por línea)</label>
                <textarea
                  rows={3}
                  placeholder="Emitir acta de entrega de Hito 1&#10;Configurar conectores n8n&#10;Coordinar próxima reunión para viernes"
                  value={newActionItems}
                  onChange={(e) => setNewActionItems(e.target.value)}
                  className="w-full mt-1 p-3 text-xs bg-white border border-black/10 rounded-xl focus:ring-2 focus:ring-[#008fcd]/30 focus:border-[#008fcd] leading-relaxed"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#666666] uppercase">Transcripción o Notas Crudas (Opcional)</label>
                <textarea
                  rows={3}
                  placeholder="Pegá aquí la transcripción automática de Meet/Zoom/Tactiq si la tenés..."
                  value={newTranscriptText}
                  onChange={(e) => setNewTranscriptText(e.target.value)}
                  className="w-full mt-1 p-3 text-xs bg-white border border-black/10 rounded-xl focus:ring-2 focus:ring-[#008fcd]/30 focus:border-[#008fcd] leading-relaxed font-mono"
                />
              </div>

              <div className="p-4 border-t border-black/5 bg-zinc-50 -mx-5 -mb-5 mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#666666] hover:bg-black/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1A1A1A] hover:bg-black text-white transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingNew ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>Guardar Minuta</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
