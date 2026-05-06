const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent';

export interface GeminiQuoteInput {
  clientName: string;
  projectName: string;
  solutionAnalysisJson: any;
}

export async function analyzeWithGemini(input: GeminiQuoteInput) {
  if (!GEMINI_API_KEY) {
    throw new Error('SISTEMA: La VITE_GEMINI_API_KEY no está configurada en las variables de entorno (.env o Vercel).');
  }

  const prompt = `Sos un consultor senior estratégico de IngentIA, una empresa de consultoría especializada en transformación digital e inteligencia artificial. Necesito que generes una propuesta y presupuesto (Smart Quoter) basado en un análisis exhaustivo previo.

DATOS DEL CLIENTE Y PROYECTO:
- Nombre del cliente: ${input.clientName}
- Nombre del proyecto: ${input.projectName}

ANÁLISIS ESTRATÉGICO PREVIO (Generado por AI Solution Architect):
${JSON.stringify(input.solutionAnalysisJson, null, 2)}

INSTRUCCIONES:
Basándote en el Análisis Estratégico Previo provisto, debes inferir automáticamente el tamaño de la empresa (SME, Medium, Large) según la información de "company_info" y el tipo de servicio requerido (solo consultoría o consultoría + desarrollo) según los "features" (especialmente el "resolution_mode").

Generá un presupuesto acorde al nivel de esfuerzo e impacto identificado en el análisis.

Respondé ÚNICAMENTE con un JSON válido (sin markdown, sin \`\`\`json, sin texto extra) con exactamente esta estructura:

{
  "diagnosis": "Un resumen ejecutivo del diagnóstico, conectando los pain points clave con la solución arquitectónica propuesta en el análisis previo.",
  "hoursStage1": <número de horas estimadas para la etapa de diagnóstico y reingeniería de procesos (AS-IS a TO-BE), entre 15 y 150>,
  "hoursStage2": <número de horas estimadas para la etapa de implementación técnica/desarrollo de la arquitectura, entre 40 y 400>,
  "labelStage1": "<nombre del hito 1, ej: Auditoría de Procesos y Diseño TO-BE>",
  "labelStage2": "<nombre del hito 2, ej: Implementación de Arquitectura de Solución>",
  "roiEstimate": "<descripción del ROI estimado basado en los problemas resueltos y los features>",
  "salesStrategy": "<estrategia de venta recomendada basándote en la industria y necesidades descubiertas, 2-3 oraciones>",
  "deliverables": ["<entregable 1>", "<entregable 2>", "<entregable 3>", "<entregable 4>", "<entregable 5>"],
  "risks": ["<riesgo técnico o de negocio 1>", "<riesgo 2>", "<riesgo 3>"],
  "commercialNarrative": "<Una narrativa comercial profesional y muy persuasiva de 2-3 párrafos dirigida al equipo directivo del cliente. Debe conectar explícitamente los problemas actuales con el roadmap propuesto, explicando por qué esta arquitectura específica generará valor y retorno de inversión.>",
  "pricing": {
    "module1": {
      "description": "<descripción del módulo 1 (Consultoría y Diseño Estratégico)>",
      "price": <precio en USD, inferir tamaño de empresa: SME 1000-3000, Medium 3000-8000, Large 7000-15000>,
      "deliveryDays": <días de entrega, entre 10 y 45>
    },
    "module2": {
      "description": "<descripción del módulo 2 (Implementación técnica y Desarrollo)>",
      "price": <precio en USD si el análisis requiere Desarrollo o un mix (App/IA), sino 0. SME 3000-8000, Medium 8000-25000, Large 20000-60000>,
      "pricingModel": "<modelo de pricing: 'Precio Fijo con 50% anticipo' o 'N/A' si es solo consultoría>"
    },
    "module3": {
      "description": "<descripción del módulo 3 (Evolución, Soporte y Hosting)>",
      "monthlyPrice": <precio mensual en USD si aplica, sino 0. SME 200-500, Medium 500-2000, Large 1500-5000>
    },
    "totalInitialInvestment": <suma del precio de módulo 1 + módulo 2>
  },
  "financialEstimation": {
    "estimatedRevenue": <facturación anual estimada del cliente en USD, inferida de su industria y tamaño>,
    "revenueJustification": "<justificación del cálculo PxQ de facturación, 1-2 oraciones>",
    "investmentToRevenueRatio": "<ratio inversión inicial / facturación, ej: 2.5% de la facturación anual>"
  }
}

IMPORTANTE: 
- Respondé SOLO con el JSON, sin ningún texto adicional.
- Los precios deben ser coherentes con el tamaño y alcance descritos en el análisis previo.
- Si el análisis indica que TODOS los features son "CONSULTORÍA", el módulo 2 price debe ser 0 y pricingModel "N/A", y módulo 3 monthlyPrice debe ser 0.
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
