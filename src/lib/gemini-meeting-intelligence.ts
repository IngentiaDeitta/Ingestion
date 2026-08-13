import { executeAiTask } from './ai-router';

export interface ProjectTranscript {
  id: string;
  project_id?: string;
  client_id?: string;
  created_at: string;
  summary?: string;
  detailed_summary?: string;
  action_items?: string[];
  attendees?: string[];
  transcript_text: string;
}

export interface MeetingIntelligence {
  last_updated: string;
  executive_summary: string;
  key_decisions: string[];
  agreed_commitments: string[];
  identified_pain_points: string[];
  next_steps: string[];
}

export async function generateMeetingIntelligence(
  transcripts: ProjectTranscript[],
  contextName: string
): Promise<MeetingIntelligence> {
  if (!transcripts || transcripts.length === 0) {
    throw new Error('No hay minutas disponibles para analizar.');
  }

  // Format minutas based on their individual detailed summaries (Tactiq breakdown)
  const minutasFormatted = transcripts.map((t, idx) => {
    const dateStr = new Date(t.created_at).toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });

    const detailedText = t.detailed_summary || t.summary || t.transcript_text;
    const actionItemsText = t.action_items && t.action_items.length 
      ? `Acuerdos / Action Items de la sesión:\n${t.action_items.map(a => `• ${a}`).join('\n')}` 
      : '';

    return `=== REUNIÓN #${idx + 1} · Fecha: ${dateStr} ===
Título / Tema: ${t.summary || 'Reunión de Avance'}
${t.attendees && t.attendees.length ? `Participantes: ${t.attendees.join(', ')}\n` : ''}
RESUMEN DETALLADO DE LA SESIÓN (Tactiq):
${detailedText}

${actionItemsText}

${t.transcript_text && t.transcript_text !== detailedText ? `Notas complementarias / Transcripción:\n${t.transcript_text.substring(0, 1000)}...\n` : ''}
`;
  }).join('\n----------------------------------------\n\n');

  const prompt = `Sos el Consultor y Arquitecto Principal de IngentIA. Tu tarea es analizar los resúmenes detallados individuales generados por Tactiq para cada reunión del cliente/proyecto "${contextName}" y generar una Síntesis Ejecutiva Consolidada de Relevamiento de alto valor para el equipo de dirección e ingeniería.

HISTORIAL DE RESÚMENES DETALLADOS DE REUNIONES (Tactiq):
${minutasFormatted}

INSTRUCCIONES DE CONSOLIDACIÓN:
1. Tomá como base los resúmenes detallados y acuerdos de cada minuta individual.
2. Identificá con precisión:
   - La visión global acumulada y el estado actual del relevamiento.
   - Las decisiones clave de arquitectura/procesos acordadas a lo largo de las sesiones.
   - Los compromisos de entrega y facturación formalmente validados.
   - Los puntos de dolor y fricciones operativas que justifican la solución.
   - Los próximos pasos inmediatos.
3. El tono debe ser ejecutivo, riguroso, sintético y libre de ambigüedades.

Respondé ÚNICAMENTE con un JSON válido (sin markdown, sin \`\`\`json, sin texto extra) con la siguiente estructura:
{
  "executive_summary": "Párrafo conciso (3-5 oraciones) con la síntesis global del estado del relevamiento, avances alcanzados y dirección del proyecto.",
  "key_decisions": [
    "Decisión clave 1 acordada con el cliente",
    "Decisión clave 2 (arquitectura, flujos, herramientas)",
    "..."
  ],
  "agreed_commitments": [
    "Compromiso de entrega / hito validado / facturación acordada",
    "..."
  ],
  "identified_pain_points": [
    "Punto de dolor operativo identificado en las reuniones",
    "..."
  ],
  "next_steps": [
    "Próximo paso inmediato 1",
    "Próximo paso inmediato 2"
  ]
}`;

  try {
    const rawResult = await executeAiTask(prompt, {
      systemInstruction: 'Sos un analista de proyectos de IA. Respondé exclusivamente con un objeto JSON sin markdown.',
      complexity: 'complex',
      responseJson: true,
    });

    const parsed = JSON.parse(rawResult);
    return {
      last_updated: new Date().toISOString(),
      executive_summary: parsed.executive_summary || 'Resumen de reuniones consolidado.',
      key_decisions: Array.isArray(parsed.key_decisions) ? parsed.key_decisions : [],
      agreed_commitments: Array.isArray(parsed.agreed_commitments) ? parsed.agreed_commitments : [],
      identified_pain_points: Array.isArray(parsed.identified_pain_points) ? parsed.identified_pain_points : [],
      next_steps: Array.isArray(parsed.next_steps) ? parsed.next_steps : [],
    };
  } catch (error) {
    console.error('Error generating meeting intelligence:', error);
    throw error;
  }
}
