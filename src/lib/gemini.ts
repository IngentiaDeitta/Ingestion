const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent';

export interface GeminiQuoteInput {
  clientName: string;
  projectName: string;
  companySize: string;
  serviceType: string;
  clientUrl: string;
  notebookContext: string;
  transcripts: string;
}

export async function analyzeWithGemini(input: GeminiQuoteInput) {
  if (!GEMINI_API_KEY) {
    throw new Error('SISTEMA: La VITE_GEMINI_API_KEY no está configurada en las variables de entorno (.env o Vercel).');
  }

  const sizeLabel = input.companySize === 'SME' ? 'Pequeña/SME' : input.companySize === 'Medium' ? 'Mediana' : 'Corporación';
  const serviceLabel = input.serviceType === 'Consultancy' ? 'Consultoría' : 'Consultoría + Desarrollo de App/IA';

  const prompt = `Sos un consultor senior estratégico de IngentIA, una empresa de consultoría especializada en transformación digital e inteligencia artificial. Necesito que generes un análisis completo para una cotización.

DATOS DEL CLIENTE:
- Nombre del cliente: ${input.clientName}
- Nombre del proyecto: ${input.projectName}
- Tamaño de empresa: ${sizeLabel}
- Tipo de servicio solicitado: ${serviceLabel}
${input.clientUrl ? `- Sitio web / redes del cliente: ${input.clientUrl}` : ''}

CONTEXTO ADICIONAL:
${input.notebookContext || 'No se proporcionó contexto adicional.'}

MINUTAS DE REUNIONES:
${input.transcripts || 'No se proporcionaron minutas.'}

Respondé ÚNICAMENTE con un JSON válido (sin markdown, sin \`\`\`json, sin texto extra) con exactamente esta estructura:

{
  "diagnosis": "Un párrafo describiendo la situación actual del cliente, sus pain points y oportunidades detectadas.",
  "hoursStage1": <número de horas estimadas para la etapa de diagnóstico/auditoría, entre 15 y 150>,
  "hoursStage2": <número de horas estimadas para la etapa de implementación, entre 40 y 400>,
  "labelStage1": "<nombre del hito 1, ej: Auditoría de Procesos>",
  "labelStage2": "<nombre del hito 2, ej: Arquitectura TO-BE>",
  "roiEstimate": "<descripción del ROI estimado>",
  "salesStrategy": "<estrategia de venta recomendada, 2-3 oraciones>",
  "deliverables": ["<entregable 1>", "<entregable 2>", "<entregable 3>", "<entregable 4>", "<entregable 5>"],
  "risks": ["<riesgo 1>", "<riesgo 2>", "<riesgo 3>"],
  "commercialNarrative": "<Una narrativa comercial profesional de 2-3 párrafos dirigida al equipo directivo del cliente, explicando el valor de la propuesta>",
  "pricing": {
    "module1": {
      "description": "<descripción del módulo 1 de consultoría/auditoría>",
      "price": <precio en USD, proporcional al tamaño de empresa: SME 1000-3000, Medium 3000-8000, Large 7000-15000>,
      "deliveryDays": <días de entrega, entre 10 y 45>
    },
    "module2": {
      "description": "<descripción del módulo 2 de implementación>",
      "price": <precio en USD si el servicio incluye App/IA, sino 0. SME 3000-8000, Medium 8000-25000, Large 20000-60000>,
      "pricingModel": "<modelo de pricing: 'Precio Fijo con 50% anticipo' o 'N/A' si es solo consultoría>"
    },
    "module3": {
      "description": "<descripción del módulo 3 de soporte y evolución>",
      "monthlyPrice": <precio mensual en USD si aplica, sino 0. SME 200-500, Medium 500-2000, Large 1500-5000>
    },
    "totalInitialInvestment": <suma del precio de módulo 1 + módulo 2>
  },
  "financialEstimation": {
    "estimatedRevenue": <facturación anual estimada del cliente en USD>,
    "revenueJustification": "<justificación del cálculo PxQ de facturación, 1-2 oraciones>",
    "investmentToRevenueRatio": "<ratio inversión/facturación, ej: 2.5% de la facturación anual>"
  }
}

IMPORTANTE: 
- Respondé SOLO con el JSON, sin ningún texto adicional.
- Los precios deben ser coherentes con el tamaño de empresa y tipo de servicio.
- La narrativa comercial debe ser profesional y persuasiva.
- Si el tipo de servicio es solo "Consultoría", el módulo 2 price debe ser 0 y pricingModel "N/A", y módulo 3 monthlyPrice debe ser 0.
- totalInitialInvestment debe ser la suma exacta de module1.price + module2.price.`;

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 4096,
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const apiErrorMessage = errorData?.error?.message || response.statusText;
    
    if (response.status === 400 && apiErrorMessage.includes('API key not valid')) {
      throw new Error(`La API Key de Gemini es inválida. Por favor, verificá que VITE_GEMINI_API_KEY en tu .env o en Vercel sea correcta.`);
    }

    throw new Error(`Error de Gemini API: ${response.status} - ${apiErrorMessage}`);
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textContent) {
    throw new Error('Gemini no devolvió contenido válido.');
  }

  // Clean JSON from possible markdown formatting
  let cleanJson = textContent.trim();
  if (cleanJson.startsWith('```json')) cleanJson = cleanJson.slice(7);
  if (cleanJson.startsWith('```')) cleanJson = cleanJson.slice(3);
  if (cleanJson.endsWith('```')) cleanJson = cleanJson.slice(0, -3);
  cleanJson = cleanJson.trim();

  try {
    return JSON.parse(cleanJson);
  } catch (parseError) {
    console.error('Failed to parse Gemini response:', cleanJson);
    throw new Error('La respuesta de Gemini no es un JSON válido. Intentá de nuevo.');
  }
}
