import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Stethoscope, Wand2, Loader2, DollarSign, FileText, CheckCircle2, AlertCircle, AlertTriangle, HelpCircle, Save, Quote } from 'lucide-react';
import {
  generateRadiografiaAnalysis, recalcularResultado, calcularLinea,
  RadiografiaResult, LineaPerdida,
} from '../lib/gemini-radiografia';
import { generarInforme, InformeRadiografia } from '../lib/gemini-informe';
import { supabase } from '../lib/supabase';
import { useReactToPrint } from 'react-to-print';
import Module1PDFTemplate from '../components/Module1PDFTemplate';
import RadiografiaReportTemplate from '../components/RadiografiaReportTemplate';

interface Lead {
  id: number;
  empresa: string;
  sector: string | null;
  email: string | null;
  contacto_nombre: string | null;
  transcript_text: string | null;
  annual_waste_usd: number | null;
  pain_points: any;
  converted_client_id: string | null;
  informe_radiografia: InformeRadiografia | null;
}

const CONFIANZA_STYLE: Record<string, string> = {
  ALTA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MEDIA: 'bg-amber-50 text-amber-700 border-amber-200',
  BAJA: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function Radiografia() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loadingLead, setLoadingLead] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<RadiografiaResult | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [hayCambios, setHayCambios] = useState(false);
  const [informe, setInforme] = useState<InformeRadiografia | null>(null);
  const [generandoInforme, setGenerandoInforme] = useState(false);
  const printRef = React.useRef<HTMLDivElement>(null);
  const informeRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Propuesta_M1_IngentIA_LD${id}`,
  });

  const imprimirInforme = useReactToPrint({
    contentRef: informeRef,
    documentTitle: `Radiografia_Operativa_${lead?.empresa?.replace(/\s+/g, '_') || id}`,
  });

  /**
   * Genera el informe completo. Se dispara solo: al procesar la transcripción y
   * al guardar cambios en los ítems. El usuario solo elige qué ítems entran.
   */
  const handleGenerarInforme = async (base?: RadiografiaResult, silencioso = false) => {
    const datos = base || result;
    if (!datos || !lead) return;
    setGenerandoInforme(true);
    try {
      const { data: leadFull } = await supabase
        .from('leads_cuentas').select('pre_call_brief').eq('id', lead.id).single();

      const inf = await generarInforme({
        empresa: lead.empresa,
        sector: lead.sector,
        brief: leadFull?.pre_call_brief || null,
        radiografia: datos,
        transcript,
      });
      setInforme(inf);
      await supabase.from('leads_cuentas').update({ informe_radiografia: inf }).eq('id', lead.id);
    } catch (e: any) {
      console.error('Error generando informe:', e);
      if (!silencioso) alert('Error al generar el informe: ' + e.message);
    } finally {
      setGenerandoInforme(false);
    }
  };

  useEffect(() => { if (id) fetchLead(); }, [id]);

  const fetchLead = async () => {
    try {
      setLoadingLead(true);
      const { data, error } = await supabase
        .from('leads_cuentas')
        .select('id, empresa, sector, email, contacto_nombre, transcript_text, annual_waste_usd, pain_points, converted_client_id, informe_radiografia')
        .eq('id', id)
        .single();
      if (error) throw error;
      setLead(data);
      if (data.transcript_text) setTranscript(data.transcript_text);
      if (data.informe_radiografia) setInforme(data.informe_radiografia);
      // Solo restauramos análisis con la base de cálculo nueva. Los análisis
      // viejos (sin variables) se descartan: sus cifras no eran auditables.
      if (data.pain_points?.waste_breakdown?.[0]?.personas !== undefined) {
        setResult(recalcularResultado(data.pain_points));
      }
    } catch (error) {
      console.error('Error fetching lead:', error);
    } finally {
      setLoadingLead(false);
    }
  };

  const guardarResultado = async (r: RadiografiaResult) => {
    if (!id) return;
    setGuardando(true);
    try {
      await supabase.from('leads_cuentas').update({
        transcript_text: transcript,
        annual_waste_usd: r.annual_waste_usd,
        pain_points: r,
      }).eq('id', id);
      setHayCambios(false);
    } finally {
      setGuardando(false);
    }
  };

  const handleProcess = async () => {
    if (!transcript.trim()) {
      alert('Pegá la transcripción de la videollamada primero.');
      return;
    }
    setIsProcessing(true);
    try {
      const data = await generateRadiografiaAnalysis(transcript, {
        empresa: lead?.empresa,
        rubro: lead?.sector || undefined,
      });
      setResult(data);
      await guardarResultado(data);
      // El informe sale solo: el usuario no tiene que pedirlo.
      await handleGenerarInforme(data, true);
    } catch (error: any) {
      console.error('Error generating radiografia analysis:', error);
      alert('Error al procesar con IA: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  /** Edita una variable de un renglón y recalcula todo al instante. */
  const editarVariable = (idx: number, campo: keyof LineaPerdida, valor: number) => {
    if (!result) return;
    const lineas = [...result.waste_breakdown];
    const linea = calcularLinea({ ...lineas[idx], [campo]: valor } as LineaPerdida);
    // Si el usuario corrige a mano, ese valor pasa a ser un dato validado.
    if (campo === 'personas' || campo === 'horas_semana' || campo === 'costo_hora_usd') {
      linea.origen = { ...linea.origen, [campo]: 'DATO' };
    }
    lineas[idx] = linea;
    setResult(recalcularResultado({ ...result, waste_breakdown: lineas }));
    setHayCambios(true);
  };

  /** Edita un texto del renglón (concepto o justificación). */
  const editarTexto = (idx: number, campo: 'concepto' | 'justificacion', valor: string) => {
    if (!result) return;
    const lineas = [...result.waste_breakdown];
    lineas[idx] = { ...lineas[idx], [campo]: valor };
    setResult({ ...result, waste_breakdown: lineas });
    setHayCambios(true);
  };

  /** Incluye o descarta un renglón del diagnóstico. */
  const alternarIncluido = (idx: number) => {
    if (!result) return;
    const lineas = [...result.waste_breakdown];
    lineas[idx] = { ...lineas[idx], incluido: lineas[idx].incluido === false };
    setResult(recalcularResultado({ ...result, waste_breakdown: lineas }));
    setHayCambios(true);
  };

  const handleConvertClient = async () => {
    if (!lead) return;
    try {
      setIsConverting(true);
      let clienteExistente: { id: string; name: string } | null = null;
      if (lead.email) {
        const { data } = await supabase.from('clients').select('id, name').ilike('email', lead.email).limit(1).maybeSingle();
        clienteExistente = data;
      }
      if (!clienteExistente) {
        const { data } = await supabase.from('clients').select('id, name').ilike('name', lead.empresa).limit(1).maybeSingle();
        clienteExistente = data;
      }

      let clientId: string;
      if (clienteExistente) {
        const seguir = window.confirm(
          `"${clienteExistente.name}" ya existe como cliente.\n\n` +
          `Aceptar: vincular este lead al cliente existente (recomendado).\n` +
          `Cancelar: no hacer nada.`,
        );
        if (!seguir) { setIsConverting(false); return; }
        clientId = clienteExistente.id;
        await supabase.from('clients').update({ lead_id: lead.id }).eq('id', clientId);
      } else {
        const { data, error } = await supabase.from('clients').insert([{
          name: lead.empresa,
          industry: lead.sector || 'Industrial',
          email: lead.email || null,
          contact_person: lead.contacto_nombre || null,
          status: 'Activo',
          lead_id: lead.id,
          mrr_value: 0,
        }]).select().single();
        if (error) throw error;
        clientId = data.id;
      }

      // Los contactos cargados en el lead pasan al cliente.
      await supabase.from('client_contacts').update({ client_id: clientId }).eq('lead_id', lead.id).is('client_id', null);
      await supabase.from('leads_cuentas').update({ estado: 'CONVERTIDO', converted_client_id: clientId }).eq('id', lead.id);
      navigate(`/clients/${clientId}`);
    } catch (error: any) {
      console.error(error);
      alert('Error al convertir a cliente: ' + error.message);
    } finally {
      setIsConverting(false);
    }
  };

  if (loadingLead) return <div className="p-20 text-center text-[#666666]">Cargando lead...</div>;
  if (!lead) return <div className="p-20 text-center text-[#666666]">Lead no encontrado</div>;

  const inputNum = "w-16 text-center bg-white border border-black/15 rounded-lg px-1 py-1 text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#FFD166] focus:ring-2 focus:ring-[#FFD166]/30";
  const badge = (o: string) => o === 'DATO'
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-amber-100 text-amber-700';

  return (
    <div className="flex-1 flex flex-col gap-8 w-full max-w-[1200px] mx-auto min-h-screen p-6 text-[#1A1A1A]">

      <div className="flex items-center gap-4 border-b border-black/5 pb-6">
        <Link to={`/leads/${id}`} className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-black/5 transition-colors border border-black/10 shadow-sm">
          <ArrowLeft className="w-5 h-5 text-[#666666]" />
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-black/10 shadow-sm">
            <Stethoscope className="w-7 h-7 text-[#FFD166]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Radiografía Operativa <span className="text-sm font-medium text-[#999999] ml-2">{lead.empresa} · #LD-{id}</span></h2>
            <p className="text-[#666666] text-sm mt-1">Cuantificación de la deuda operativa con base de cálculo auditable.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Izquierda: transcripción */}
        <div className="flex flex-col gap-6 bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm p-6 rounded-[32px] h-fit">
          <h3 className="font-semibold text-lg mb-2 border-b border-black/5 pb-3">1. Transcripción de la Llamada</h3>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Pegá aquí la transcripción de la videollamada de 30 minutos..."
            className="w-full h-64 bg-white/50 border border-black/10 rounded-2xl p-4 placeholder:text-[#999999] focus:outline-none focus:ring-2 focus:ring-[#FFD166]/50 focus:border-[#FFD166] resize-none text-sm"
          />
          <button
            onClick={handleProcess}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 bg-[#222222] hover:bg-black text-white px-6 py-4 rounded-xl font-semibold transition-all shadow-lg shadow-black/10 disabled:opacity-70"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {isProcessing ? 'Analizando ineficiencias...' : 'Procesar con Agente A6'}
          </button>
        </div>

        {/* Derecha: resultado */}
        <div className="flex flex-col gap-6">
          {result ? (
            <div className="flex flex-col gap-6">

              <div className="bg-white/80 border border-black/5 shadow-sm p-8 rounded-[32px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <AlertCircle className="w-6 h-6 text-rose-500" />
                    Deuda Operativa Cuantificada
                  </h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border shrink-0 ${CONFIANZA_STYLE[result.confianza]}`}>
                    Confianza {result.confianza}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-4xl font-light text-rose-600 mb-2 relative z-10 tracking-tight">
                  <DollarSign className="w-8 h-8" />
                  {result.annual_waste_usd.toLocaleString('es-AR')}
                  <span className="text-xl text-[#666666] font-medium">USD / año</span>
                </div>
                <p className="text-xs text-[#666666] mb-6 relative z-10">
                  {Math.round(result.ratio_datos_reales * 100)}% de las variables provienen de datos que dio el cliente.
                </p>

                {result.confianza !== 'ALTA' && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6 flex items-start gap-3 relative z-10">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      <strong>Este número todavía no es defendible frente al cliente.</strong> La mayoría de las
                      variables son estimaciones nuestras, no datos que él haya dado. Corregí abajo lo que sepas,
                      o conseguí los datos faltantes antes de usarlo en una propuesta.
                    </p>
                  </div>
                )}

                <div className="relative z-10">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#999999] mb-1.5 block">
                    Resumen ejecutivo (editable)
                  </label>
                  <textarea
                    value={result.summary}
                    onChange={(e) => { setResult({ ...result, summary: e.target.value }); setHayCambios(true); }}
                    rows={4}
                    className="w-full text-sm font-medium leading-relaxed bg-white/60 p-4 rounded-xl border border-black/10 resize-y outline-none focus:border-[#FFD166] focus:ring-2 focus:ring-[#FFD166]/30"
                  />
                </div>
              </div>

              {/* Base de cálculo */}
              <div className="bg-white/80 border border-black/5 shadow-sm p-6 rounded-[32px]">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <h4 className="text-sm font-bold">Base de cálculo</h4>
                  {hayCambios && (
                    <button
                      onClick={async () => {
                        if (!result) return;
                        await guardarResultado(result);
                        // Al confirmar los ítems, el informe se rehace con esa selección.
                        await handleGenerarInforme(result, true);
                      }}
                      disabled={guardando || generandoInforme}
                      className="flex items-center gap-1.5 bg-[#222222] hover:bg-black text-white px-4 py-2 rounded-full text-[10px] font-bold disabled:opacity-60"
                    >
                      {guardando || generandoInforme ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      Guardar y rehacer informe
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[#666666] mb-5">
                  Destildá los ítems que no quieras incluir en el diagnóstico. Editá cualquier variable o texto:
                  el total se recalcula y lo que corrijas queda marcado como dato validado.
                  {' '}<strong className="text-[#1A1A1A]">
                    {result.waste_breakdown.filter((l) => l.incluido !== false).length} de {result.waste_breakdown.length} ítems incluidos.
                  </strong>
                </p>

                <div className="flex flex-col gap-4">
                  {result.waste_breakdown.map((l, i) => (
                    <div
                      key={i}
                      className={`border rounded-2xl p-4 transition-all ${
                        l.incluido === false
                          ? 'border-black/5 bg-black/[0.03] opacity-55'
                          : 'border-black/5 bg-white/60'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <input
                          type="checkbox"
                          checked={l.incluido !== false}
                          onChange={() => alternarIncluido(i)}
                          title="Incluir este ítem en el diagnóstico"
                          className="w-4 h-4 mt-1 shrink-0 rounded accent-[#FFD166] cursor-pointer"
                        />
                        <input
                          value={l.concepto}
                          onChange={(e) => editarTexto(i, 'concepto', e.target.value)}
                          className="text-xs font-bold flex-1 bg-transparent border-b border-transparent hover:border-black/10 focus:border-[#FFD166] outline-none py-0.5"
                        />
                        <p className={`text-sm font-bold shrink-0 ${l.incluido === false ? 'text-[#999] line-through' : 'text-rose-600'}`}>
                          ${l.costo_anual.toLocaleString('es-AR')}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-[11px] text-[#666666]">
                        {([
                          { campo: 'personas' as const, label: 'personas', step: 1 },
                          { campo: 'horas_semana' as const, label: 'hs/sem', step: 0.5 },
                          { campo: 'costo_hora_usd' as const, label: 'USD/h', step: 1 },
                        ]).map(({ campo, label, step }, k) => (
                          <React.Fragment key={campo}>
                            {k > 0 && <span className="text-black/25 font-bold">×</span>}
                            <span className="inline-flex flex-col items-center gap-1">
                              <input
                                type="number" min="0" step={step}
                                value={l[campo]}
                                onChange={(e) => editarVariable(i, campo, Number(e.target.value))}
                                className={inputNum}
                              />
                              <span className="flex items-center gap-1">
                                <span className="text-[9px]">{label}</span>
                                <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${badge(l.origen[campo])}`}>
                                  {l.origen[campo]}
                                </span>
                              </span>
                            </span>
                          </React.Fragment>
                        ))}
                        <span className="text-black/25 font-bold">×</span>
                        <span className="inline-flex flex-col items-center gap-1">
                          <span className="w-16 text-center py-1 text-xs font-bold">{l.semanas_anio}</span>
                          <span className="text-[9px]">sem/año</span>
                        </span>
                      </div>

                      {l.cita_transcripcion && (
                        <p className="mt-3 text-[10px] text-[#666666] italic border-l-2 border-emerald-400 pl-2 flex gap-1.5">
                          <Quote size={10} className="shrink-0 mt-0.5 text-emerald-500" />
                          "{l.cita_transcripcion}"
                        </p>
                      )}
                      <textarea
                        value={l.justificacion}
                        onChange={(e) => editarTexto(i, 'justificacion', e.target.value)}
                        rows={2}
                        placeholder="Justificación del supuesto..."
                        className="mt-2 w-full text-[10px] text-[#666666] leading-relaxed bg-transparent border border-transparent hover:border-black/10 focus:border-[#FFD166] focus:bg-white rounded-lg px-2 py-1 resize-y outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Qué falta preguntar */}
              {(result.datos_faltantes?.length > 0 || result.preguntas_pendientes?.length > 0) && (
                <div className="bg-[#222222] text-white p-6 rounded-[32px]">
                  <h4 className="text-sm font-bold flex items-center gap-2 mb-4">
                    <HelpCircle className="w-4 h-4 text-[#FFD166]" /> Lo que falta para firmar el número
                  </h4>
                  {result.datos_faltantes?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">Datos que no dio</p>
                      <ul className="flex flex-col gap-1.5">
                        {result.datos_faltantes.map((d, i) => (
                          <li key={i} className="text-xs text-white/80 flex gap-2"><span className="text-rose-400">✗</span>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.preguntas_pendientes?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">Preguntas para conseguirlos</p>
                      <ul className="flex flex-col gap-1.5">
                        {result.preguntas_pendientes.map((q, i) => (
                          <li key={i} className="text-xs text-white/80 flex gap-2"><span className="text-[#FFD166]">→</span>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Informe completo con branding */}
              <div className="bg-[#0A0A0A] text-white p-6 rounded-[32px] border border-white/10">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#00E5FF]" /> Informe de Radiografía Operativa
                    </h4>
                    <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                      Documento completo para el cliente: contexto, benchmarks del sector con fuentes,
                      diagnóstico, camino de trabajo y beneficios estimados. Con branding IngentIA.
                    </p>
                  </div>
                </div>

                {informe && (
                  <div className="text-[11px] text-white/45 mb-3">
                    Generado el {new Date(informe.generado_el).toLocaleString('es-AR')} ·{' '}
                    {informe.industria.benchmarks.length} benchmarks · {informe.fuentes.length} fuentes
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {informe && (
                    <button
                      onClick={() => imprimirInforme()}
                      disabled={generandoInforme}
                      className="flex items-center gap-2 bg-[#00E5FF] hover:bg-[#00c4db] disabled:opacity-60 text-black px-5 py-2.5 rounded-full text-xs font-bold transition-all"
                    >
                      <FileText size={14} /> Descargar PDF
                    </button>
                  )}
                  <button
                    onClick={() => handleGenerarInforme()}
                    disabled={generandoInforme}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 disabled:opacity-60 px-5 py-2.5 rounded-full text-xs font-bold transition-all"
                  >
                    {generandoInforme ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    {generandoInforme ? 'Investigando el sector…' : 'Rehacer'}
                  </button>
                </div>
                <p className="text-[10px] text-white/40 mt-3">
                  {generandoInforme
                    ? 'Busca referencias reales del sector en internet. Puede tardar entre 30 y 60 segundos.'
                    : 'Se genera solo al procesar la transcripción y cada vez que guardás cambios en los ítems.'}
                </p>
              </div>

              <div style={{ display: 'none' }}>
                {informe && (
                  <RadiografiaReportTemplate
                    ref={informeRef}
                    informe={informe}
                    radiografia={result}
                    empresa={lead.empresa}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handlePrint()}
                  className="flex items-center justify-center gap-2 bg-white hover:bg-[#FFD166]/10 border border-black/10 px-6 py-4 rounded-xl font-semibold transition-all shadow-sm"
                >
                  <FileText className="w-5 h-5 text-[#FFD166]" />
                  Propuesta 1 página
                </button>

                <div style={{ display: 'none' }}>
                  {id && (
                    <Module1PDFTemplate
                      ref={printRef}
                      leadId={id}
                      result={{
                        annual_waste_usd: result.annual_waste_usd,
                        summary: result.summary,
                        waste_breakdown: result.waste_breakdown
                          .filter((l) => l.incluido !== false)
                          .map((l) => ({ concept: l.concepto, cost: l.costo_anual })),
                      }}
                    />
                  )}
                </div>

                <button
                  onClick={handleConvertClient}
                  disabled={isConverting || !!lead.converted_client_id}
                  className="flex items-center justify-center gap-2 bg-[#FFD166] hover:bg-[#FFC13B] px-6 py-4 rounded-xl font-bold transition-all shadow-lg shadow-[#FFD166]/20 disabled:opacity-70"
                >
                  {isConverting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {lead.converted_client_id ? 'Ya Convertido' : 'Convertir a Cliente'}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center border-2 border-dashed border-black/10 rounded-[32px] bg-white/30 p-12">
              <Stethoscope className="w-16 h-16 text-[#999999]/50 mb-6" />
              <p className="text-xl font-bold">Esperando Transcripción</p>
              <p className="text-[#666666] mt-2 font-medium max-w-sm">
                Pegá el texto de la reunión y procesalo. Vas a ver la deuda operativa con la fórmula abierta de cada renglón.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
