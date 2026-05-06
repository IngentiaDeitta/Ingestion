const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent';

export interface ProjectAnalysisResult {
  project_summary: string;
  problem: string;
  impact: string;
  areas: string[];
  urgency: string;
  classification: string;
  complexity: string;
}

export async function analyzeProjectWithGemini(
  projectName: string, 
  projectDescription: string, 
  clientAnalysisJson: any, 
  notebookContext: string
): Promise<ProjectAnalysisResult> {
  if (!GEMINI_API_KEY) {
    throw new Error('SISTEMA: La VITE_GEMINI_API_KEY no está configurada.');
  }

  const prompt = `Sos un AI Project Analyst. Tu objetivo es analizar un proyecto específico dentro del contexto de un cliente.

----------------------------------------
INPUT
----------------------------------------
Nombre del proyecto: ${projectName}
Descripción del proyecto: ${projectDescription || 'No provista'}
Client Analysis:
${JSON.stringify(clientAnalysisJson, null, 2)}

----------------------------------------
CONTEXTO DE LECTURA (NotebookLM)
----------------------------------------
${notebookContext}

----------------------------------------
PROCESO
----------------------------------------
1. Identificar problema principal
2. Determinar impacto en el negocio
3. Detectar áreas afectadas
4. Clasificar problema (determinístico, secuencial, basado en reglas, ambiguo, exploratorio, iterativo)
5. Evaluar urgencia y complejidad

Respondé ÚNICAMENTE con un JSON válido (sin markdown, sin \`\`\`json, sin texto extra) con esta estructura exacta:
{
  "project_summary": "string - Resumen de 1-2 párrafos del proyecto",
  "problem": "string - El problema principal identificado",
  "impact": "string - Impacto en el negocio",
  "areas": ["string - áreas afectadas"],
  "urgency": "ALTA | MEDIA | BAJA",
  "classification": "determinístico | secuencial | basado en reglas | ambiguo | exploratorio | iterativo",
  "complexity": "ALTA | MEDIA | BAJA"
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
    console.error('Failed to parse Project Analysis:', cleanJson);
    throw new Error('La respuesta no es un JSON válido.');
  }
}
