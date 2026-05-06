const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent';

export interface ClientAnalysisResult {
  name: string;
  industry: string;
  business_model: string;
  target_audience: string;
  key_value_proposition: string;
  competitors: string[];
  summary: string;
}

export async function analyzeClientWithGemini(notebookContext: string): Promise<ClientAnalysisResult> {
  if (!GEMINI_API_KEY) {
    throw new Error('SISTEMA: La VITE_GEMINI_API_KEY no está configurada.');
  }

  const prompt = `Sos un AI Client Analyst. Tu objetivo es construir un perfil estratégico de una empresa utilizando información proveniente de NotebookLM.

----------------------------------------
CONTEXTO DE LECTURA
----------------------------------------
${notebookContext}

----------------------------------------
PROCESO
----------------------------------------
1. Extraer:
- Nombre de la empresa
- Industria
- Modelo de negocio
- Público objetivo
- Propuesta de valor clave
- Principales competidores (si se mencionan o infiriéndolos del mercado)
- Un resumen ejecutivo de la empresa

Respondé ÚNICAMENTE con un JSON válido (sin markdown, sin \`\`\`json, sin texto extra) con esta estructura exacta:
{
  "name": "string",
  "industry": "string",
  "business_model": "string",
  "target_audience": "string",
  "key_value_proposition": "string",
  "competitors": ["string"],
  "summary": "string"
}`;

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
    throw new Error(`Error de Gemini API: ${response.status} - ${errorData?.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textContent) throw new Error('Gemini no devolvió contenido válido.');

  let cleanJson = textContent.trim();
  if (cleanJson.startsWith('```json')) cleanJson = cleanJson.slice(7);
  if (cleanJson.startsWith('```')) cleanJson = cleanJson.slice(3);
  if (cleanJson.endsWith('```')) cleanJson = cleanJson.slice(0, -3);
  cleanJson = cleanJson.trim();

  try {
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Failed to parse Client Analysis:', cleanJson);
    throw new Error('La respuesta no es un JSON válido.');
  }
}
