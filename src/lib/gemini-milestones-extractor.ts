const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export interface ExtractedMilestone {
  title: string;
  description: string;
  type: 'delivery' | 'billing' | 'both';
  estimated_date: string; // YYYY-MM-DD
  amount: number | null;
}

export async function extractMilestonesWithGemini(pdfBase64: string): Promise<ExtractedMilestone[]> {
  if (!GEMINI_API_KEY) {
    throw new Error('SISTEMA: La VITE_GEMINI_API_KEY no está configurada.');
  }

  // Si el base64 viene con el prefijo "data:application/pdf;base64,", lo removemos
  let cleanBase64 = pdfBase64;
  if (pdfBase64.includes('base64,')) {
    cleanBase64 = pdfBase64.split('base64,')[1];
  }

  const prompt = `
  Analiza el documento adjunto (puede ser una propuesta comercial, plan de trabajo o cronograma) y extrae todos los hitos del proyecto, tanto hitos entregables como hitos de facturación o cobro.

  Para cada hito detectado, extrae:
  1. Nombre o título corto del hito.
  2. Descripción del hito o de lo que se entrega.
  3. Tipo de hito: 'delivery' (si es solo un entregable técnico o hito de trabajo), 'billing' (si es un hito de pago o cobro, por ejemplo un anticipo o pago al inicio), o 'both' (si es la entrega de un módulo que tiene un pago asociado).
  4. Fecha estimada: busca en el cronograma la fecha estimada de finalización o de entrega de ese hito. Si solo hay semanas de duración (ej. semana 1, 2, etc.), calcula la fecha estimada a partir de la fecha de inicio del proyecto (hoy es ${new Date().toISOString().split('T')[0]}). Si no hay fecha en absoluto, estima una fecha razonable basada en el orden de las fases. Por favor, usa formato YYYY-MM-DD.
  5. Monto en USD: si el hito está asociado a un cobro o facturación, busca el monto en USD o el porcentaje de cobro (e infiere el monto a partir del presupuesto del proyecto si es posible). Si no aplica, deja null.

  Responde ÚNICAMENTE con un JSON válido con esta estructura (no utilices markdown, no utilices \`\`\`json ni texto adicional, solo el JSON):
  [
    {
      "title": "Firma de contrato e Inicio",
      "description": "Firma de contrato y acuerdo de confidencialidad",
      "type": "billing",
      "estimated_date": "2026-05-04",
      "amount": 750.0
    }
  ]
  `;

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: cleanBase64
            }
          },
          {
            text: prompt
          }
        ]
      }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(`Error de Gemini API: ${response.status} - ${errorData?.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textContent) {
    throw new Error('Gemini no devolvió contenido válido.');
  }

  let cleanJson = textContent.trim();
  if (cleanJson.startsWith('```json')) cleanJson = cleanJson.slice(7);
  if (cleanJson.startsWith('```')) cleanJson = cleanJson.slice(3);
  if (cleanJson.endsWith('```')) cleanJson = cleanJson.slice(0, -3);
  cleanJson = cleanJson.trim();

  try {
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Failed to parse Extracted Milestones:', cleanJson);
    throw new Error('La respuesta de Gemini no se pudo procesar como un JSON válido.');
  }
}
